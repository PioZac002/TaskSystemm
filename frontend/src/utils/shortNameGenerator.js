/**
 * Generates a random project short name consisting of exactly 6 uppercase letters (A-Z).
 * @returns {string} A 6-character uppercase alphabetic string
 */
export function generateShortName() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    return result;
}
