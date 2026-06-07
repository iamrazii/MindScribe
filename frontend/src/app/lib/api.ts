const BASE = "http://localhost:8000/api";

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
    // FastAPI validation errors return detail as an array of objects
    const detail = err.detail;
    let message: string;
    if (typeof detail === "string") {
      message = detail;
    } else if (Array.isArray(detail)) {
      message = detail.map((d: { msg?: string }) => d.msg ?? JSON.stringify(d)).join(", ");
    } else {
      message = "Request failed";
    }
    throw new Error(message);
  }
  if (res.status === 204) return null;
  return res.json();
}

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

    generate: (prompt: string) =>
      fetch(`${BASE}/notes/generate`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ prompt }),
      }).then(handleResponse),

    suggest: (content: string) =>
      fetch(`${BASE}/notes/suggest`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ content }),
      }).then(handleResponse),
  },

  clusters: {
    list: () =>
      fetch(`${BASE}/clusters`, { headers: authHeaders() }).then(handleResponse),
  },

  messages: {
    send: (body: {
      receiver_email: string;
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

  users: {
    me: () =>
      fetch(`${BASE}/users/me`, { headers: authHeaders() }).then(handleResponse),

    update: (body: { username?: string; password?: string; profile_picture_url?: string }) =>
      fetch(`${BASE}/users/me`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(body),
      }).then(handleResponse),

    search: (email: string) =>
      fetch(`${BASE}/users/search?email=${encodeURIComponent(email)}`, {
        headers: authHeaders(),
      }).then(handleResponse),
  },
};