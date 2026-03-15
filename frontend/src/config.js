// Determine if we're running in a development environment (localhost)
const isLocalhost = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1';

// If local, use localhost:5000. If remote (via port forwarding), use the same hostname but with port 5000
// Note: This assumes both frontend and backend are forwarded on the same base domain.
export const API_BASE_URL = isLocalhost
  ? 'http://localhost:5000/api'
  : `${window.location.protocol}//${window.location.hostname}:5000/api`;