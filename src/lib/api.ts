// API client for syncing data with the local server.
// Falls back to localStorage when the server is unavailable (e.g. during development).

import { getApiBase } from './serverConfig';

const STORAGE_PREFIX = 'matss_';
const HEALTH_KEY = '__healthcheck';

let serverAvailable: boolean | null = null;
let recheckTimer: number | null = null;

function scheduleServerRecheck() {
  if (recheckTimer !== null) {
    window.clearTimeout(recheckTimer);
  }
  recheckTimer = window.setTimeout(() => {
    serverAvailable = null;
    recheckTimer = null;
  }, 30000);
}

function markServerState(isAvailable: boolean) {
  serverAvailable = isAvailable;
  scheduleServerRecheck();
}

async function checkServer(): Promise<boolean> {
  if (serverAvailable !== null) return serverAvailable;
  try {
    const res = await fetch(`${getApiBase()}/${HEALTH_KEY}`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) {
      markServerState(false);
      return false;
    }

    const text = await res.text();
    try {
      JSON.parse(text);
      markServerState(true);
      return true;
    } catch {
      markServerState(false);
      return false;
    }
  } catch {
    markServerState(false);
    return false;
  }
}

// Allow forcing a re-check (e.g. when server URL changes)
export function resetServerCheck(): void {
  serverAvailable = null;
  if (recheckTimer !== null) {
    window.clearTimeout(recheckTimer);
    recheckTimer = null;
  }
}

// Read a key: try server first, fall back to localStorage
export async function apiGet<T>(key: string, defaultValue: T): Promise<T> {
  const fullKey = STORAGE_PREFIX + key;
  let shouldTryServer = await checkServer();

  // Optimistic retry for environments where /api/data can be rewritten but /api/data/:key still works.
  if (!shouldTryServer) shouldTryServer = true;

  if (shouldTryServer) {
    try {
      const res = await fetch(`${getApiBase()}/${fullKey}`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) {
        const json = await res.json();
        markServerState(true);
        if (json.value !== null && json.value !== undefined) {
          localStorage.setItem(fullKey, JSON.stringify(json.value));
          return json.value as T;
        }
      }
    } catch {
      markServerState(false);
    }
  }

  // Fallback to localStorage
  try {
    const raw = localStorage.getItem(fullKey);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

// Write a key: save to server AND localStorage
export async function apiSet<T>(key: string, value: T): Promise<void> {
  const fullKey = STORAGE_PREFIX + key;
  localStorage.setItem(fullKey, JSON.stringify(value));

  try {
    const res = await fetch(`${getApiBase()}/${fullKey}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
      signal: AbortSignal.timeout(3000),
    });
    markServerState(res.ok);
  } catch {
    markServerState(false);
  }
}

// Delete a key from server and localStorage
export async function apiDelete(key: string): Promise<void> {
  const fullKey = STORAGE_PREFIX + key;
  localStorage.removeItem(fullKey);

  try {
    const res = await fetch(`${getApiBase()}/${fullKey}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(3000),
    });
    markServerState(res.ok);
  } catch {
    markServerState(false);
  }
}

// Sync: pull all data from server into localStorage on page load
export async function syncFromServer(): Promise<void> {
  const isUp = await checkServer();
  if (!isUp) return;

  try {
    const res = await fetch(getApiBase(), {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) {
      markServerState(false);
      return;
    }

    const data = await res.json();
    markServerState(true);
    for (const [key, value] of Object.entries(data)) {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.setItem(key, JSON.stringify(value));
      }
    }
  } catch {
    markServerState(false);
  }
}

// Push all localStorage data to server (initial migration)
export async function pushToServer(): Promise<void> {
  try {
    const bulk: Record<string, unknown> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        try {
          bulk[key] = JSON.parse(localStorage.getItem(key)!);
        } catch {
          // skip malformed values
        }
      }
    }

    if (Object.keys(bulk).length > 0) {
      const res = await fetch(`${getApiBase()}/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bulk),
        signal: AbortSignal.timeout(5000),
      });
      markServerState(res.ok);
    }
  } catch {
    markServerState(false);
  }
}
