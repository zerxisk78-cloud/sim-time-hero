// Server configuration for Express + PM2 setup.
// The Express server (managed by PM2) serves both the React app and API on the same port.

const STORAGE_KEY = 'matss_server_url';

function normalizeServerUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return window.location.origin;

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `http://${trimmed}`;

  return withProtocol.replace(/\/+$|\/api\/data$/i, '');
}

function getDefaultServerUrl(): string {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return normalizeServerUrl(saved);

  // When Express serves everything (PM2 setup), API is same-origin
  // This works whether the server is on port 3001, 80, or any other port
  return window.location.origin;
}

let _serverUrl: string = getDefaultServerUrl();

export function getServerUrl(): string {
  return _serverUrl;
}

export function setServerUrl(url: string): void {
  _serverUrl = normalizeServerUrl(url);
  localStorage.setItem(STORAGE_KEY, _serverUrl);
}

export function getApiBase(): string {
  return `${_serverUrl}/api/data`;
}
