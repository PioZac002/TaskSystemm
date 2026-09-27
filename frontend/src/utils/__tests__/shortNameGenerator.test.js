import { describe, it, expect } from 'vitest';
import { generateShortName } from '../shortNameGenerator';

describe('generateShortName', () => {
    const SHORT_NAME_REGEX = /^[A-Z]{6}$/;

    it('generates a name that is exactly 6 characters long', () => {
        const name = generateShortName();
        expect(name).toHaveLength(6);
    });

    it('generates a name containing only uppercase letters A-Z', () => {
        const name = generateShortName();
        expect(SHORT_NAME_REGEX.test(name)).toBe(true);
    });

    it('passes /^[A-Z]{6}$/ regex', () => {
        const name = generateShortName();
        expect(name).toMatch(SHORT_NAME_REGEX);
    });

    it('does not contain digits', () => {
        const name = generateShortName();
        expect(/[0-9]/.test(name)).toBe(false);
    });

    it('does not contain hyphens or special characters', () => {
        const name = generateShortName();
        expect(/[^A-Z]/.test(name)).toBe(false);
    });

    it('generates unique results (at least with high probability)', () => {
        const names = new Set(Array.from({ length: 20 }, () => generateShortName()));
        expect(names.size).toBeGreaterThan(1);
    });

    it('all 100 generated names pass the regex', () => {
        for (let i = 0; i < 100; i++) {
            const name = generateShortName();
            expect(name).toMatch(SHORT_NAME_REGEX);
        }
    });
});
