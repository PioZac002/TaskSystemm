import { describe, it, expect, beforeEach } from 'vitest';

// Re-import a fresh instance for each test by using a factory
async function getStorageService() {
    // Clear both storages before import so isPersistentSession() returns false
    localStorage.clear();
    sessionStorage.clear();
    // We need a fresh instance each time
    const mod = await import('../storageService');
    return mod.storageService;
}

describe('storageService', () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    it('setStorageType(true) switches to localStorage', async () => {
        const svc = await getStorageService();
        svc.setStorageType(true);
        expect(svc.useLocalStorage).toBe(true);
    });

    it('setStorageType(false) switches to sessionStorage', async () => {
        const svc = await getStorageService();
        svc.setStorageType(false);
        expect(svc.useLocalStorage).toBe(false);
    });

    it('setItem stores value in sessionStorage when not persistent', async () => {
        const svc = await getStorageService();
        svc.setStorageType(false);
        svc.setItem('testKey', 'testValue');
        expect(sessionStorage.getItem('testKey')).toBe('testValue');
    });

    it('setItem stores value in localStorage when persistent', async () => {
        const svc = await getStorageService();
        svc.setStorageType(true);
        svc.setItem('testKey', 'testValue');
        expect(localStorage.getItem('testKey')).toBe('testValue');
    });

    it('getItem retrieves value correctly', async () => {
        const svc = await getStorageService();
        svc.setStorageType(false);
        svc.setItem('myKey', 'myValue');
        expect(svc.getItem('myKey')).toBe('myValue');
    });

    it('removeItem removes from both storages', async () => {
        const svc = await getStorageService();
        localStorage.setItem('key1', 'a');
        sessionStorage.setItem('key1', 'b');
        svc.removeItem('key1');
        expect(localStorage.getItem('key1')).toBeNull();
        expect(sessionStorage.getItem('key1')).toBeNull();
    });

    it('clear removes all auth keys from both storages', async () => {
        const svc = await getStorageService();
        const keys = ['accessToken', 'refreshToken', 'userId', 'user'];
        keys.forEach(k => {
            localStorage.setItem(k, 'val');
            sessionStorage.setItem(k, 'val');
        });
        svc.clear();
        keys.forEach(k => {
            expect(localStorage.getItem(k)).toBeNull();
            expect(sessionStorage.getItem(k)).toBeNull();
        });
    });

    it('isPersistentSession returns true when accessToken is in localStorage', async () => {
        const svc = await getStorageService();
        localStorage.setItem('accessToken', 'token123');
        expect(svc.isPersistentSession()).toBe(true);
    });

    it('isPersistentSession returns false when no tokens in localStorage', async () => {
        const svc = await getStorageService();
        localStorage.clear();
        expect(svc.isPersistentSession()).toBe(false);
    });

    it('items in localStorage are not affected when switching to sessionStorage', async () => {
        const svc = await getStorageService();
        svc.setStorageType(true);
        svc.setItem('isolated', 'fromLocal');
        svc.setStorageType(false);
        // sessionStorage should not have the key set via localStorage
        expect(sessionStorage.getItem('isolated')).toBeNull();
    });
});
