import { X } from "lucide-react";
import { MAX_PRICE } from "../lib/constants.js";
import { inr } from "../lib/format.js";

export default function AppliedFilters({ filters, onClearOne, onClearAll }) {
  const chips = [
    filters.category !== "All" && ["category", filters.category],
    filters.brand !== "All" && ["brand", filters.brand],
    filters.search && ["search", `"${filters.search}"`],
    filters.maxPrice < MAX_PRICE && ["maxPrice", `Under ${inr(filters.maxPrice)}`],
    filters.saleOnly && ["saleOnly", "Sale only"]
  ].filter(Boolean);

  if (chips.length === 0) {
    return <p className="applied-empty">No filters applied. Showing the complete collection.</p>;
  }

  return (
    <div className="applied-filters" aria-label="Applied filters">
      {chips.map(([key, label]) => (
        <button type="button" key={key} onClick={() => onClearOne(key)}>
          {label}
          <X />
        </button>
      ))}
      <button className="clear-all" type="button" onClick={onClearAll}>
        Clear all
      </button>
    </div>
  );
}
