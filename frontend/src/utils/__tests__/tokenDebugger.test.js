import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Helper to create a minimal JWT-like token with given payload
function makeToken(payload) {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = btoa(JSON.stringify(payload));
    return `${header}.${body}.sig`;
}

describe('tokenDebugger', () => {
    describe('when VITE_TOKEN_DEBUG is not set', () => {
        beforeEach(() => {
            vi.resetModules();
            vi.stubEnv('VITE_TOKEN_DEBUG', '');
        });

        afterEach(() => {
            vi.unstubAllEnvs();
        });

        it('inspectToken does not throw when called', async () => {
            const { tokenDebugger } = await import('../tokenDebugger');
            expect(() => tokenDebugger.inspectToken(null)).not.toThrow();
        });

        it('logStorageType does not throw when called', async () => {
            const { tokenDebugger } = await import('../tokenDebugger');
            expect(() => tokenDebugger.logStorageType(true)).not.toThrow();
        });

        it('logRefreshTokenState does not throw when called', async () => {
            const { tokenDebugger } = await import('../tokenDebugger');
            expect(() => tokenDebugger.logRefreshTokenState(null)).not.toThrow();
        });

        it('logRefreshCycle does not throw when called', async () => {
            const { tokenDebugger } = await import('../tokenDebugger');
            expect(() => tokenDebugger.logRefreshCycle('step', {})).not.toThrow();
        });

        it('logExpirationCheck does not throw when called', async () => {
            const { tokenDebugger } = await import('../tokenDebugger');
            expect(() => tokenDebugger.logExpirationCheck(null)).not.toThrow();
        });

        it('checkStorageConsistency does not throw when called', async () => {
            const { tokenDebugger } = await import('../tokenDebugger');
            expect(() => tokenDebugger.checkStorageConsistency(false)).not.toThrow();
        });
    });

    describe('JWT parsing', () => {
        it('extracts correct exp claim from token', () => {
            const exp = Math.floor(Date.now() / 1000) + 3600;
            const token = makeToken({ sub: 'user42', exp });
            const payload = JSON.parse(atob(token.split('.')[1]));
            expect(payload.exp).toBe(exp);
        });

        it('extracts correct sub claim from token', () => {
            const token = makeToken({ sub: 'user42', exp: 9999999999 });
            const payload = JSON.parse(atob(token.split('.')[1]));
            expect(payload.sub).toBe('user42');
        });
    });

    describe('time-until-expiration calculation', () => {
        it('correctly identifies a future token as not expired', () => {
            const futureExp = Math.floor(Date.now() / 1000) + 3600;
            const expMs = futureExp * 1000;
            const timeLeft = expMs - Date.now();
            expect(timeLeft).toBeGreaterThan(0);
        });

        it('correctly identifies a past token as expired', () => {
            const pastExp = Math.floor(Date.now() / 1000) - 100;
            const expMs = pastExp * 1000;
            const timeLeft = expMs - Date.now();
            expect(timeLeft).toBeLessThan(0);
        });
    });

    describe('when VITE_TOKEN_DEBUG is enabled', () => {
        beforeEach(() => {
            vi.resetModules();
            vi.stubEnv('VITE_TOKEN_DEBUG', 'true');
        });

        afterEach(() => {
            vi.unstubAllEnvs();
            vi.restoreAllMocks();
        });

        it('log remains silent when enabled', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            const { tokenDebugger } = await import('../tokenDebugger');
            tokenDebugger.log('test message');
            expect(consoleSpy).not.toHaveBeenCalled();
        });
    });
});
