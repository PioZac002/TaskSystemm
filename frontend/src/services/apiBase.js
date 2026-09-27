// Where the frontend sends API requests.
//
// - VITE_API_BASE_URL unset:        a backend on localhost (the default for `npm run dev`).
// - VITE_API_BASE_URL set to a URL: that API.
// - VITE_API_BASE_URL set but empty: same origin. The Docker image uses this, because nginx
//   serves the app and proxies /api to the backend under one address.
const DEFAULT_API_BASE_URL = 'http://localhost:6901';

const configured = import.meta.env.VITE_API_BASE_URL;

export const API_BASE_URL = (configured === undefined ? DEFAULT_API_BASE_URL : configured).replace(/\/+$/, '');

// Absolute origin for APIs that need one (e.g. new URL()); falls back to the page origin in same-origin mode.
export const API_ORIGIN = API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
