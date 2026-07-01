const apiBaseUrl = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export function apiPath(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${apiBaseUrl}${normalizedPath}`;
}
