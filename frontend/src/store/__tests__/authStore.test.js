import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Helper to build a JWT token with given payload
function makeToken(payload) {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = btoa(JSON.stringify(payload));
    return `${header}.${body}.sig`;
}

const VALID_USER_ID = '42';
const VALID_TOKEN = makeToken({ sub: VALID_USER_ID, exp: Math.floor(Date.now() / 1000) + 3600 });
const EXPIRED_TOKEN = makeToken({ sub: VALID_USER_ID, exp: Math.floor(Date.now() / 1000) - 100 });

vi.mock('@/services/apiClient', () => ({
    default: {
        get: vi.fn(),
        interceptors: {
            request: { use: vi.fn() },
            response: { use: vi.fn() },
        },
    },
}));

describe('authStore', () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        vi.resetModules();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('initialize() with valid tokens sets isAuthenticated: true', async () => {
        sessionStorage.setItem('accessToken', VALID_TOKEN);
        sessionStorage.setItem('refreshToken', 'refresh123');
        sessionStorage.setItem('user', JSON.stringify({ id: VALID_USER_ID, email: 'test@test.com' }));

        const { useAuthStore } = await import('@/store/authStore');
        const store = useAuthStore.getState();
        await store.initialize();

        expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('initialize() with no tokens sets isAuthenticated: false', async () => {
        localStorage.clear();
        sessionStorage.clear();

        const { useAuthStore } = await import('@/store/authStore');
        const store = useAuthStore.getState();
        await store.initialize();

        expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('getUserIdFromToken() extracts userId from JWT sub claim', async () => {
        sessionStorage.setItem('accessToken', VALID_TOKEN);

        const { useAuthStore } = await import('@/store/authStore');
        const userId = useAuthStore.getState().getUserIdFromToken();
        expect(userId).toBe(VALID_USER_ID);
    });

    it('isTokenExpired() returns false for valid (non-expired) token', async () => {
        const { useAuthStore } = await import('@/store/authStore');
        const isExpired = useAuthStore.getState().isTokenExpired(VALID_TOKEN);
        expect(isExpired).toBe(false);
    });

    it('isTokenExpired() returns true for expired token', async () => {
        const { useAuthStore } = await import('@/store/authStore');
        const isExpired = useAuthStore.getState().isTokenExpired(EXPIRED_TOKEN);
        expect(isExpired).toBe(true);
    });

    it('logout() clears state and storage', async () => {
        sessionStorage.setItem('accessToken', VALID_TOKEN);
        sessionStorage.setItem('refreshToken', 'refresh123');

        const { useAuthStore } = await import('@/store/authStore');
        useAuthStore.setState({ isAuthenticated: true, user: { id: 1 }, accessToken: VALID_TOKEN });

        useAuthStore.getState().logout();

        const state = useAuthStore.getState();
        expect(state.isAuthenticated).toBe(false);
        expect(state.user).toBeNull();
        expect(state.accessToken).toBeNull();
        expect(sessionStorage.getItem('accessToken')).toBeNull();
    });

    it('setAuth() saves tokens and user data', async () => {
        const { useAuthStore } = await import('@/store/authStore');
        const user = { id: 1, email: 'user@example.com' };
        await useAuthStore.getState().setAuth(user, VALID_TOKEN, 'refresh123', false);

        const state = useAuthStore.getState();
        expect(state.isAuthenticated).toBe(true);
        expect(state.user).toEqual(user);
        expect(state.accessToken).toBe(VALID_TOKEN);
    });
});
