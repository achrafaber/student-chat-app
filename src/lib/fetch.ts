/**
 * Wrapper around fetch that always includes credentials: "same-origin"
 * to ensure cookies (session) are sent and received with every request.
 */
export function apiFetch(url: string, options?: RequestInit) {
  return fetch(url, {
    ...options,
    credentials: "same-origin",
  });
}
