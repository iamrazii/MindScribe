/**
 * lib/api.ts
 *
 * All fetch calls go through here.
 * - Token is stored in memory (not localStorage/sessionStorage) for security.
 * - IDs are passed as query params, never in URL path segments.
 */

const BASE = "http://localhost:8000/api";

// ── In-memory token store ─────────────────────────────────────────────────────
let _token: string | null = null;

export function setToken(t: string | null) {
  _token = t;
}

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (_token) h["Authorization"] = `Bearer ${_token}`;
  return h;
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }
  if (res.status === 204) return null;
  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const api = {
  auth: {
    register: (body: { username: string; email: string; password: string }) =>
      fetch(`${BASE}/auth/register`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      }).then(handleResponse),

    login: (body: { email: string; password: string }) =>
      fetch(`${BASE}/auth/login`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      }).then(handleResponse),
  },

  // ── Notes ──────────────────────────────────────────────────────────────────
  notes: {
    list: () =>
      fetch(`${BASE}/notes`, { headers: authHeaders() }).then(handleResponse),

    get: (noteId: string) =>
      fetch(`${BASE}/notes/detail?note_id=${noteId}`, {
        headers: authHeaders(),
      }).then(handleResponse),

    create: (body: { title: string; content: string }) =>
      fetch(`${BASE}/notes`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      }).then(handleResponse),

    update: (noteId: string, body: { title: string; content: string }) =>
      fetch(`${BASE}/notes/update?note_id=${noteId}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(body),
      }).then(handleResponse),

    delete: (noteId: string) =>
      fetch(`${BASE}/notes/delete?note_id=${noteId}`, {
        method: "DELETE",
        headers: authHeaders(),
      }).then(handleResponse),

    ask: (query: string) =>
      fetch(`${BASE}/notes/ask`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ query }),
      }).then(handleResponse),

    summarize: (topic: string) =>
      fetch(`${BASE}/notes/summarize`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ topic }),
      }).then(handleResponse),

    evaluate: (noteId: string) =>
      fetch(`${BASE}/notes/evaluate`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ note_id: noteId }),
      }).then(handleResponse),

    radar: (noteId: string) =>
      fetch(`${BASE}/notes/radar?note_id=${noteId}`, {
        headers: authHeaders(),
      }).then(handleResponse),
  },

  // ── Clusters ───────────────────────────────────────────────────────────────
  clusters: {
    list: () =>
      fetch(`${BASE}/clusters`, { headers: authHeaders() }).then(handleResponse),
  },

  // ── Messages ───────────────────────────────────────────────────────────────
  messages: {
    send: (body: {
      receiver_username: string;
      content: string;
      note_id?: string;
    }) =>
      fetch(`${BASE}/messages`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      }).then(handleResponse),

    inbox: () =>
      fetch(`${BASE}/messages/inbox`, { headers: authHeaders() }).then(handleResponse),

    sent: () =>
      fetch(`${BASE}/messages/sent`, { headers: authHeaders() }).then(handleResponse),

    detail: (messageId: string) =>
      fetch(`${BASE}/messages/detail?message_id=${messageId}`, {
        headers: authHeaders(),
      }).then(handleResponse),
  },

  // ── Users ──────────────────────────────────────────────────────────────────
  users: {
    me: () =>
      fetch(`${BASE}/users/me`, { headers: authHeaders() }).then(handleResponse),

    search: (username: string) =>
      fetch(`${BASE}/users/search?username=${encodeURIComponent(username)}`, {
        headers: authHeaders(),
      }).then(handleResponse),
  },
};