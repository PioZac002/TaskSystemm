import { create } from "zustand";
import apiClient from "@/services/apiClient";
import { storageService } from "@/services/storageService";
import { tokenDebugger } from "@/utils/tokenDebugger";

export const useAuthStore = create((set, get) => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    loading: true,
    initialized: false,
    systemVersion: null,

    initialize:  async () => {
        try {
            const accessToken = storageService.getItem('accessToken');
            const refreshToken = storageService.getItem('refreshToken');

            // Storage consistency check
            tokenDebugger.checkStorageConsistency(storageService.isPersistentSession());

            tokenDebugger.logStorageType(storageService.isPersistentSession());
            tokenDebugger.inspectToken(accessToken, 'accessToken');
            tokenDebugger.logRefreshTokenState(refreshToken);

            if (! accessToken || !refreshToken) {
                set({ loading: false, initialized: true, isAuthenticated: false, user: null });
                return;
            }

            // Sprawdź czy token jest wygasły
            const isExpired = get().isTokenExpired(accessToken);

            if (isExpired) {
                // NIE próbuj tu refreshować - interceptor to zrobi przy pierwszym request
            }

            // Załaduj dane użytkownika
            const userData = await get().loadUserData();

            if (userData) {
                set({
                    user: userData,
                    accessToken,
                    refreshToken,
                    isAuthenticated: true,
                    loading: false,
                    initialized: true
                });
                get().fetchSystemVersion();
            } else {
                get().logout();
                set({ loading: false, initialized: true });
            }

        } catch (error) {
            console.error('[AuthStore] Initialization failed:', error);
            get().logout();
            set({ loading: false, initialized: true });
        }
    },

    loadUserData: async () => {
        try {
            const cachedUser = storageService.getItem('user');
            if (cachedUser) {
                const userData = JSON.parse(cachedUser);
                return userData;
            }

            const userId = get().getUserIdFromToken();
            if (!userId) {
                console.error('[AuthStore] Cannot extract userId from token.');
                return null;
            }

            // To wywołanie automatycznie użyje interceptora który odświeży token jeśli trzeba
            const response = await apiClient.get(`/api/v1/user/id/${userId}`);

            storageService.setItem('user', JSON.stringify(response.data));
            storageService.setItem('userId', String(userId));

            return response.data;

        } catch (error) {
            console.error('[AuthStore] Failed to load user data:', error);
            return null;
        }
    },

    getUserIdFromToken: () => {
        try {
            const token = storageService.getItem('accessToken');
            if (!token) return null;

            const payload = JSON.parse(atob(token.split('.')[1]));
            const userId = payload.sub || payload.userId || payload.nameid || payload.id;

            return userId;
        } catch (error) {
            console.error('[AuthStore] Failed to parse token:', error);
            return null;
        }
    },

    isTokenExpired: (token) => {
        try {
            const payload = JSON. parse(atob(token.split('.')[1]));
            const expirationTime = payload.exp * 1000;
            const currentTime = Date.now();
            const timeLeft = expirationTime - currentTime;
            const isExpired = timeLeft < 30000; // 30 sekund marginesu

            return isExpired;
        } catch (error) {
            console.error('[AuthStore] Failed to check token expiration:', error);
            return true;
        }
    },

    setAuth: async (user, accessToken, refreshToken, rememberMe = false) => {
        // Ustaw typ storage
        storageService.setStorageType(rememberMe);

        // Zapisz tokeny
        storageService.setItem('accessToken', accessToken);
        storageService.setItem('refreshToken', refreshToken);

        if (user) {
            storageService. setItem('user', JSON.stringify(user));
            storageService.setItem('userId', String(user.id));
        }

        set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: Boolean(accessToken && user),
        });
    },

    updateCachedUser: (userData) => {
        storageService.setItem('user', JSON.stringify(userData));
        set({ user: userData });
    },

    logout: () => {
        storageService.clear();

        set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            systemVersion: null,
        });
    },

    fetchSystemVersion: async () => {
        try {
            const res = await apiClient.get('/api/v1/test/version');
            const version = typeof res.data === 'string' ? res.data : res.data?.version || String(res.data);
            set({ systemVersion: version });
        } catch {
            // non-critical, fail silently
        }
    },

    isAdmin: () => {
        try {
            const token = storageService.getItem('accessToken');
            if (!token) return false;
            const payload = JSON.parse(atob(token.split('.')[1]));
            const roles = payload.roles || payload.authorities || payload.role || [];
            if (Array.isArray(roles)) {
                return roles.some(r =>
                    r === 'ROLE_ADMIN' || r?.authority === 'ROLE_ADMIN' || r === 2 || r?.id === 2
                );
            }
            return String(roles) === 'ROLE_ADMIN' || roles === 2;
        } catch {
            return false;
        }
    },
}));
