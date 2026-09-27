import apiClient from "./apiClient";
import { storageService } from "./storageService";

class AuthService {
    async login(email, password) {
        try {
            const response = await apiClient.post('/api/v1/login', {
                email,
                password
            });
            return await this.completeSignIn(response);
        } catch (error) {
            console.error('[AuthService] Login failed:', {
                status: error.response?.status,
                message: error.response?.data?.Message || error.message
            });
            throw error;
        }
    }

    /** One-click sign-in to the seeded demo account (no password in the frontend). */
    async loginDemo() {
        try {
            const response = await apiClient.post('/api/v1/auth/demo');
            const result = await this.completeSignIn(response);
            storageService.setItem('demoSession', 'true');
            return result;
        } catch (error) {
            console.error('[AuthService] Demo login failed:', {
                status: error.response?.status,
                message: error.response?.data?.Message || error.message
            });
            throw error;
        }
    }

    /** Whether this instance offers demo sign-in; never throws, the button just stays hidden. */
    async getDemoStatus() {
        try {
            const { data } = await apiClient.get('/api/v1/auth/demo');
            return { available: Boolean(data?.available), email: data?.email || null };
        } catch {
            return { available: false, email: null };
        }
    }

    async completeSignIn(response) {
        const accessToken = response.data.accessToken?.token || response.data.accessToken;
        const refreshToken = response.data.refreshToken?.token || response.data.refreshToken;

        // Pobierz userId z tokena
        const userId = this.extractUserIdFromToken(accessToken);

        if (userId) {
            // Pobierz pełne dane użytkownika - przekaż token inline (nie jest jeszcze w storage)
            const userResponse = await apiClient.get(`/api/v1/user/id/${userId}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            return { accessToken, refreshToken, userId, user: userResponse.data };
        }

        return { accessToken, refreshToken, userId: null, user: null };
    }

    async register(userData) {
        try {
            await apiClient.post('/api/v1/register', {
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                password: userData.password,
                slackUserId: userData.slackUserId
            });

            // Po udanej rejestracji, automatycznie zaloguj użytkownika
            return await this.login(userData.email, userData.password);
        } catch (error) {
            console.error('[AuthService] Registration failed:', {
                status: error.response?.status,
                message: error.response?.data?.Message || error.message
            });
            throw error;
        }
    }

    extractUserIdFromToken(token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.sub || payload.userId || payload.nameid || payload.id;
        } catch {
            console.error('[AuthService] Failed to extract userId from token.');
            return null;
        }
    }

    getAccessToken() {
        return storageService.getItem('accessToken');
    }

    getRefreshToken() {
        return storageService.getItem('refreshToken');
    }

    getCurrentUser() {
        const userStr = storageService.getItem('user');
        if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch {
                return null;
            }
        }
        return null;
    }

    logout() {
        storageService.removeItem('accessToken');
        storageService.removeItem('refreshToken');
        storageService.removeItem('user');
        storageService.removeItem('userId');
        storageService.removeItem('demoSession');
        delete apiClient.defaults.headers.common['Authorization'];
    }
}

export const authService = new AuthService();
