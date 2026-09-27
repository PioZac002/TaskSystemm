import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/authService";
import { useNavigate } from "react-router-dom";

export function useAuth() {
    const navigate = useNavigate();

    const {
        user,
        accessToken,
        refreshToken,
        isAuthenticated,
        loading,
        initialized,
        setAuth,
        logout:  logoutStore,
        loadUserData
    } = useAuthStore();

    const login = async (email, password, rememberMe = false) => {
        try {
            const result = await authService. login(email, password);

            // Przekaż rememberMe do setAuth
            await setAuth(result.user, result.accessToken, result.refreshToken, rememberMe);

            return result;
        } catch (error) {
            console.error('[useAuth] Login failed:', error);
            throw error;
        }
    };

    const loginDemo = async (rememberMe = false) => {
        try {
            const result = await authService.loginDemo();
            await setAuth(result.user, result.accessToken, result.refreshToken, rememberMe);
            return result;
        } catch (error) {
            console.error('[useAuth] Demo login failed:', error);
            throw error;
        }
    };

    const logout = async () => {
        logoutStore();
        navigate('/login');
    };

    const refreshUser = async () => {
        await loadUserData();
    };

    return {
        user,
        accessToken,
        refreshToken,
        isAuthenticated,
        loading,
        initialized,
        login,
        loginDemo,
        logout,
        refreshUser
    };
}
