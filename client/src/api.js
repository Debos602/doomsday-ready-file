// In dev the Vite proxy handles /api. On Vercel set VITE_API_URL to the deployed API, e.g. https://my-api.vercel.app/api
const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

async function request(path, options = {}) {
  let res;
  try {
    // Only send Content-Type when there is a body, so plain GETs stay "simple" cross-origin requests (no CORS preflight).
    const hasBody = options.body !== undefined;
    res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: hasBody ? { 'Content-Type': 'application/json' } : {},
      body: hasBody ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw Object.assign(new Error('Cannot reach the server. Is the API running?'), { code: 'NETWORK_ERROR' });
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(data?.error?.message || `Request failed (${res.status})`);
    err.code = data?.error?.code;
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  listMovies: () => request('/movies'),
  createMovie: (body) => request('/movies', { method: 'POST', body }),
  updateMovie: (id, body) => request(`/movies/${id}`, { method: 'PATCH', body }),
  rewatchOrder: (id) => request(`/movies/${id}/rewatch-order`),
  listCinemas: () => request('/cinemas'),
  createCinema: (body) => request('/cinemas', { method: 'POST', body }),
  booking: (id, groupSize) => request(`/cinemas/${id}/booking?groupSize=${encodeURIComponent(groupSize)}`),
};

export function formatMinutes(total) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
