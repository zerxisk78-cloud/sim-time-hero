// API client for syncing data with the local server.
// Falls back to localStorage when the server is unavailable (e.g. during development).

import { getApiBase } from './serverConfig';

const STORAGE_PREFIX = 'matss_';

let serverAvailable: boolean | null = null;

async function checkServer(): Promise<boolean> {
  if (serverAvailable !== null) return serverAvailable;
  try {
    const res = await fetch(getApiBase(), { method: 'GET', signal: AbortSignal.timeout(2000) });
    if (!res.ok) { serverAvailable = false; return false; }
    // Verify response is JSON (not SPA fallback HTML)
    const text = await res.text();
    try {
      JSON.parse(text);
      serverAvailable = true;
    } catch {
      serverAvailable = false;
    }
  } catch {
    serverAvailable = false;
  }
  // Re-check every 30 seconds
  setTimeout(() => { serverAvailable = null; }, 30000);
  return serverAvailable;
}

// Read a key: try server first, fall back to localStorage
export async function apiGet<T>(key: string, defaultValue: T): Promise<T> {
  const isUp = await checkServer();
  if (isUp) {
    try {
      const res = await fetch(`${getApiBase()}/${STORAGE_PREFIX}${key}`);
      const json = await res.json();
      if (json.value !== null && json.value !== undefined) {
        // Also cache in localStorage
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(json.value));
        return json.value as T;
      }
    } catch { /* fall through */ }
  }
  // Fallback to localStorage
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

// Write a key: save to server AND localStorage
export async function apiSet<T>(key: string, value: T): Promise<void> {
  // Always save to localStorage immediately
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  
  const isUp = await checkServer();
  if (isUp) {
    try {
      await fetch(`${getApiBase()}/${STORAGE_PREFIX}${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
    } catch { /* silently fail, localStorage has the data */ }
  }
}

// Delete a key from server and localStorage
export async function apiDelete(key: string): Promise<void> {
  localStorage.removeItem(STORAGE_PREFIX + key);
  
  const isUp = await checkServer();
  if (isUp) {
    try {
      await fetch(`${getApiBase()}/${STORAGE_PREFIX}${key}`, { method: 'DELETE' });
    } catch { /* silent */ }
  }
}

// Sync: pull all data from server into localStorage on page load
export async function syncFromServer(): Promise<void> {
  const isUp = await checkServer();
  if (!isUp) return;
  try {
    const res = await fetch(getApiBase());
    const data = await res.json();
    for (const [key, value] of Object.entries(data)) {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.setItem(key, JSON.stringify(value));
      }
    }
  } catch { /* silent */ }
}

// Push all localStorage data to server (initial migration)
export async function pushToServer(): Promise<void> {
  const isUp = await checkServer();
  if (!isUp) return;
  try {
    const bulk: Record<string, unknown> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        try {
          bulk[key] = JSON.parse(localStorage.getItem(key)!);
        } catch { /* skip malformed */ }
      }
    }
    if (Object.keys(bulk).length > 0) {
      await fetch(`${getApiBase()}/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bulk),
      });
    }
  } catch { /* silent */ }
}
