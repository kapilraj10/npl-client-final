// Simple API client using fetch. Configure base URL via Vite env.
const BASE_URL = 'https://npm-backend-8vzj.vercel.app/api';

function getToken() {
  try { return localStorage.getItem('npl_token_v1') || null; } catch { return null; }
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    headers,
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  // No content
  if (res.status === 204) return null;
  return res.json();
}

export const MatchesAPI = {
  list() {
    return request('/matches');
  },
  get(id) {
    return request(`/matches/${id}`);
  },
  create(payload) {
    return request('/matches', { method: 'POST', body: JSON.stringify(payload) });
  },
  update(id, payload) {
    return request(`/matches/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  remove(id) {
    return request(`/matches/${id}`, { method: 'DELETE' });
  },
  setLive(id) {
    return request(`/matches/${id}/live`, { method: 'POST' });
  },
};

export const AuthAPI = {
  login(email, password) {
    return request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  },
  register(email, password) {
    return request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) });
  },
};
