const API = 'http://localhost:4000/api';

export async function api(path, options = {}) {
  const isForm = options.body instanceof FormData;
  const headers = {
    ...(isForm ? {} : { 'Content-Type': 'application/json' }),
    ...options.headers,
  };
  // Prefer httpOnly cookie; include legacy Bearer for backward compat during migration
  const tok = localStorage.getItem('accessToken');
  if (tok) headers['Authorization'] = `Bearer ${tok}`;
  let response = await fetch(API + path, { credentials: 'include', ...options, headers });
  if (response.status === 401) {
    try {
      const r = await fetch(API + '/auth/refresh', { method: 'POST', credentials: 'include' });
      if (r.ok) {
        const j = await r.json().catch(()=> ({}));
        if (j.accessToken) localStorage.setItem('accessToken', j.accessToken);
        response = await fetch(API + path, { credentials: 'include', ...options, headers: { ...headers, ...(j.accessToken ? { Authorization: `Bearer ${j.accessToken}` } : {}) } });
      }
    } catch {}
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Please try again.');
  return data;
}

export const getToken = () => localStorage.getItem('accessToken');
export const setSession = (result) => {
  if (result.accessToken) localStorage.setItem('accessToken', result.accessToken);
  localStorage.setItem('user', JSON.stringify(result.user));
};
export const clearSession = () => { try { localStorage.removeItem('accessToken'); localStorage.removeItem('user'); } catch {} };
