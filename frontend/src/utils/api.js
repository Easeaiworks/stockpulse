/**
 * API client for StockPulse backend.
 */
const BASE_URL = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  const res = await fetch(url, config);

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `Request failed: ${res.status}`);
  }

  return res.json();
}

// Watchlist
export const getWatchlist = () => request('/api/watchlist');
export const addToWatchlist = (data) =>
  request('/api/watchlist', { method: 'POST', body: JSON.stringify(data) });
export const removeFromWatchlist = (id) =>
  request(`/api/watchlist/${id}`, { method: 'DELETE' });
export const toggleWatchlistItem = (id, isActive) =>
  request(`/api/watchlist/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_active: isActive }),
  });
export const refreshItem = (id) =>
  request(`/api/watchlist/${id}/refresh`, { method: 'POST' });

// Search
export const searchSecurities = (query) => request(`/api/search?q=${encodeURIComponent(query)}`);
export const getHistory = (symbol, period = '1mo', interval = '1d') =>
  request(`/api/search/history/${symbol}?period=${period}&interval=${interval}`);
export const getOptions = (symbol) => request(`/api/search/options/${symbol}`);

// Alerts
export const getAlerts = () => request('/api/alerts');
export const createAlert = (data) =>
  request('/api/alerts', { method: 'POST', body: JSON.stringify(data) });
export const updateAlert = (id, data) =>
  request(`/api/alerts/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteAlert = (id) =>
  request(`/api/alerts/${id}`, { method: 'DELETE' });

// Settings
export const getNotificationSettings = () => request('/api/settings/notifications');
export const updateNotificationSettings = (data) =>
  request('/api/settings/notifications', { method: 'PUT', body: JSON.stringify(data) });
export const getSchedulerJobs = () => request('/api/settings/scheduler');
export const setFetchInterval = (minutes) =>
  request('/api/settings/scheduler/interval', {
    method: 'POST',
    body: JSON.stringify({ minutes }),
  });
export const triggerFetchNow = () =>
  request('/api/settings/scheduler/fetch-now', { method: 'POST' });
export const getReport = () => request('/api/settings/report');
