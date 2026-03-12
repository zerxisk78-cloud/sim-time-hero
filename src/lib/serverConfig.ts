// Server configuration for IIS + Express setup.
// The Express data server runs on port 3001 alongside IIS.
// When hosted on IIS, the frontend is served by IIS, and API calls go to the Express server.

const STORAGE_KEY = 'matss_server_url';

// Default: try same-origin first (works when Express serves everything),
// then fall back to port 3001 on the same host (IIS + Express side-by-side).
function getDefaultServerUrl(): string {
  // If there's a saved custom URL, use it
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return saved;
  
  // If running on standard ports (80/443) or iisnode, API is same-origin
  const port = window.location.port;
  if (!port || port === '80' || port === '443') {
    return window.location.origin;
  }
  
  // Development: default to port 3001 on the current hostname
  return `http://${window.location.hostname}:3001`;
}

let _serverUrl: string = getDefaultServerUrl();

export function getServerUrl(): string {
  return _serverUrl;
}

export function setServerUrl(url: string): void {
  _serverUrl = url.replace(/\/+$/, ''); // trim trailing slashes
  localStorage.setItem(STORAGE_KEY, _serverUrl);
}

export function getApiBase(): string {
  return `${_serverUrl}/api/data`;
}
