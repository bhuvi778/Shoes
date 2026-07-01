import { MAX_PRICE } from "./constants.js";

// Indian Rupee formatter used across the storefront and dashboard.
export const inr = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

// Two-letter avatar initials from a full name.
export function getInitials(name) {
  return (name || "")
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// Build the /api/products querystring from the active filters.
export function buildQuery(filters) {
  const params = new URLSearchParams();
  if (filters.category !== "All") params.set("category", filters.category);
  if (filters.brand !== "All") params.set("brand", filters.brand);
  if (filters.search) params.set("search", filters.search);
  if (filters.sort !== "featured") params.set("sort", filters.sort);
  if (filters.maxPrice < MAX_PRICE) params.set("maxPrice", String(filters.maxPrice));
  if (filters.saleOnly) params.set("saleOnly", "true");
  return params.toString();
}
