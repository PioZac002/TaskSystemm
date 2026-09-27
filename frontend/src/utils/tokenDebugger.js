/**
 * Token Debugger — enabled via VITE_TOKEN_DEBUG=true environment variable.
 * Debug output is intentionally disabled in the client bundle.
 */

const isEnabled = import.meta.env.VITE_TOKEN_DEBUG === 'true';

function log() {}

function warn() {}

function error() {}

/**
 * Parse a JWT and log its claims and expiration info.
 */
function inspectToken(token, label = 'token') {
    if (!isEnabled) return;
    if (!token) {
        warn(`inspectToken(${label}): token is null/undefined/empty`);
        return;
    }
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            warn(`inspectToken(${label}): not a valid JWT (${parts.length} parts)`);
            return;
        }
        const payload = JSON.parse(atob(parts[1]));
        const nowMs = Date.now();
        const expMs = payload.exp ? payload.exp * 1000 : null;
        const timeLeftMs = expMs ? expMs - nowMs : null;

        log(`inspectToken(${label}):`, {
            sub: payload.sub,
            nameid: payload.nameid,
            userId: payload.userId || payload.id,
            exp: payload.exp,
            expDate: expMs ? new Date(expMs).toISOString() : 'N/A',
            nowDate: new Date(nowMs).toISOString(),
            timeLeftSeconds: timeLeftMs !== null ? Math.round(timeLeftMs / 1000) : 'N/A',
            isExpired: timeLeftMs !== null ? timeLeftMs <= 0 : 'N/A',
            claims: payload,
        });
    } catch (e) {
        error(`inspectToken(${label}): failed to parse JWT`, e);
    }
}

/**
 * Log which storage type is currently active.
 */
function logStorageType(useLocalStorage) {
    if (!isEnabled) return;
    log('Storage type:', useLocalStorage ? 'localStorage (persistent)' : 'sessionStorage (session only)');
}

/**
 * Log the refresh token value state (null, undefined, or empty string).
 */
function logRefreshTokenState(refreshToken) {
    if (!isEnabled) return;
    if (refreshToken === null) {
        warn('Refresh token is null');
    } else if (refreshToken === undefined) {
        warn('Refresh token is undefined');
    } else if (refreshToken === '') {
        warn('Refresh token is empty string');
    } else {
        log('Refresh token present:', refreshToken.substring(0, 20) + '...');
    }
}

/**
 * Log the full token refresh cycle step.
 */
function logRefreshCycle(step, data) {
    if (!isEnabled) return;
    log(`Refresh cycle [${step}]:`, data);
}

/**
 * Log token expiration check with exact timestamps.
 */
function logExpirationCheck(token) {
    if (!isEnabled) return;
    if (!token) {
        warn('logExpirationCheck: token is null/undefined/empty');
        return;
    }
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expMs = payload.exp * 1000;
        const nowMs = Date.now();
        log('Expiration check:', {
            'token.exp (unix)': payload.exp,
            'token.exp (ISO)': new Date(expMs).toISOString(),
            'Date.now() (ms)': nowMs,
            'Date.now() (ISO)': new Date(nowMs).toISOString(),
            'diff (ms)': expMs - nowMs,
            'diff (seconds)': Math.round((expMs - nowMs) / 1000),
            isExpired: expMs <= nowMs,
        });
    } catch (e) {
        error('logExpirationCheck: failed to parse token', e);
    }
}

/**
 * Check both localStorage and sessionStorage for tokens and warn on mismatch.
 */
function checkStorageConsistency(storageServiceIsLocal) {
    if (!isEnabled) return;
    const localKeys = ['accessToken', 'refreshToken'];
    const localHas = localKeys.some(k => !!localStorage.getItem(k));
    const sessionHas = localKeys.some(k => !!sessionStorage.getItem(k));

    log('Storage consistency check:', {
        storageServiceUsesLocalStorage: storageServiceIsLocal,
        localStorageHasTokens: localHas,
        sessionStorageHasTokens: sessionHas,
    });

    if (localHas && !storageServiceIsLocal) {
        warn('Storage mismatch detected. Tokens found in localStorage but storageService is using sessionStorage.');
    }
    if (sessionHas && storageServiceIsLocal) {
        warn('Storage mismatch detected. Tokens found in sessionStorage but storageService is using localStorage.');
    }
}

export const tokenDebugger = {
    inspectToken,
    logStorageType,
    logRefreshTokenState,
    logRefreshCycle,
    logExpirationCheck,
    checkStorageConsistency,
    isEnabled,
    log,
    warn,
    error,
};
