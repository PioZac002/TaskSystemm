import axios from 'axios';
import { storageService } from './storageService';
import { tokenDebugger } from '@/utils/tokenDebugger';




import { API_BASE_URL } from './apiBase';

export { API_BASE_URL };

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - dodaj access token
apiClient.interceptors.request.use(
    (config) => {
        // Jeśli body to FormData, usuń Content-Type żeby axios sam ustawił multipart/form-data z boundary
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        const token = storageService.getItem('accessToken');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error('[API Request] Error:', error.message);
        return Promise.reject(error);
    }
);

// Response interceptor - obsługa 401 i refresh token
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        console.error('[API Response] Error:', {
            url: originalRequest?. url,
            status: error. response?.status,
            message: error.response?.data?.Message || error.message
        });

        // Jeśli 401 i nie jest to już retry
        if (error.response?.status === 401 && !originalRequest._retry) {
            tokenDebugger.log('401 detected, attempting token refresh');

            // Jeśli to endpoint login/register/regenerate-tokens - nie próbuj refreshować
            if (originalRequest.url?.includes('/login') || originalRequest.url?.includes('/register') || originalRequest.url?.includes('/regenerate-tokens')) {
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue. push({ resolve, reject });
                })
                    .then(token => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return apiClient(originalRequest);
                    })
                    .catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = storageService.getItem('refreshToken');

            tokenDebugger.logStorageType(storageService.isPersistentSession());
            tokenDebugger.logRefreshTokenState(refreshToken);

            if (!refreshToken) {
                console.error('[Token Refresh] No refresh token, logging out.');
                isRefreshing = false;

                // Wyczyść storage i przekieruj do loginu
                storageService.clear();
                window.location.href = '/login';

                return Promise.reject(error);
            }

            try {
                // Use raw axios to avoid the request interceptor (which would add the expired access token)
                const refreshBaseURL = API_BASE_URL;
                const response = await axios.post(
                    `${refreshBaseURL}/api/v1/auth/regenerate-tokens`,
                    {
                        refreshToken: refreshToken
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );

                tokenDebugger.logRefreshCycle('response', response.data);

                // Backend zwraca:  TokenResponseDto { AccessToken:  {Token, Expires}, RefreshToken: {Token, Expires} }
                const newAccessToken = response.data.accessToken?. token || response.data.accessToken;
                const newRefreshToken = response.data.refreshToken?.token || response.data.refreshToken;

                if (! newAccessToken) {
                    throw new Error('No access token in refresh response');
                }

                tokenDebugger.inspectToken(newAccessToken, 'refreshed-accessToken');

                storageService.setItem('accessToken', newAccessToken);

                if (newRefreshToken) {
                    storageService.setItem('refreshToken', newRefreshToken);
                }

                // Zaktualizuj header
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                apiClient. defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;

                // Przetwórz kolejkę
                processQueue(null, newAccessToken);
                isRefreshing = false;

                return apiClient(originalRequest);

            } catch (refreshError) {
                console.error('[Token Refresh] Failed:', {
                    status: refreshError.response?.status,
                    message: refreshError. response?.data?.Message || refreshError.message,
                    data: refreshError.response?.data
                });

                processQueue(refreshError, null);
                isRefreshing = false;

                // Wyczyść storage i przekieruj
                storageService.clear();
                window.location.href = '/login';

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
