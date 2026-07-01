const productionApiUrl = "https://shoes-3ez9.onrender.com";
const apiBaseUrl = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? productionApiUrl : "")
).replace(/\/$/, "");

export function apiPath(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${apiBaseUrl}${normalizedPath}`;
}
