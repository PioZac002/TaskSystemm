/**
 * Storage Service - zarządza przechowywaniem tokenów
 * - sessionStorage (domyślnie) - ginie po zamknięciu karty/przeglądarki
 * - localStorage (z "Remember Me") - persistent
 */

class StorageService {
    constructor() {
        // Sprawdź czy mamy persistent session przy starcie
        this.useLocalStorage = this.isPersistentSession();
    }

    setStorageType(rememberMe) {
        this.useLocalStorage = rememberMe;
    }

    getStorage() {
        return this.useLocalStorage ? localStorage : sessionStorage;
    }

    setItem(key, value) {
        const storage = this.getStorage();
        storage.setItem(key, value);

        // Jeśli używamy sessionStorage, usuń z localStorage (cleanup)
        if (!this.useLocalStorage && localStorage.getItem(key)) {
            localStorage.removeItem(key);
        }
    }

    getItem(key) {
        // Sprawdź oba storage - sessionStorage ma priorytet
        const sessionValue = sessionStorage.getItem(key);
        const localValue = localStorage.getItem(key);

        const value = sessionValue || localValue;

        return value;
    }

    removeItem(key) {
        sessionStorage.removeItem(key);
        localStorage.removeItem(key);
    }

    clear() {
        const keysToRemove = ['accessToken', 'refreshToken', 'userId', 'user'];

        keysToRemove.forEach(key => {
            sessionStorage.removeItem(key);
            localStorage.removeItem(key);
        });

        this.useLocalStorage = false;
    }

    // Sprawdź czy sesja pochodzi z "Remember Me"
    isPersistentSession() {
        return ! !(localStorage.getItem('accessToken') || localStorage.getItem('refreshToken'));
    }
}

export const storageService = new StorageService();
