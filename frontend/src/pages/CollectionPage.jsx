import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import { baseFilters, categories, MAX_PRICE, PRICE_RANGE } from "../lib/constants.js";
import { inr } from "../lib/format.js";
import ProductCard from "../components/ProductCard.jsx";
import AppliedFilters from "../components/AppliedFilters.jsx";

export default function CollectionPage({
  brands,
  filters,
  setFilters,
  products,
  status,
  favorites,
  onFavorite,
  onAddToCart,
  onOpenDetails,
  searchRef
}) {
  const activeBrandCount = brands.reduce((sum, brand) => sum + brand.count, 0);

  function clearFilter(key) {
    setFilters((current) => ({
      ...current,
      [key]: key === "maxPrice" ? MAX_PRICE : key === "saleOnly" ? false : key === "search" ? "" : "All"
    }));
  }

  return (
    <main className="page-shell collection-page">
      <section className="collection-hero">
        <p className="eyebrow">Complete collection</p>
        <h1>All shoes, filtered without leaving the page.</h1>
        <p>Use the sticky filter panel on the left. Results, applied filters, sorting, and product details stay on the right.</p>
      </section>

      <section className="catalog-layout">
        <aside className="filter-sidebar" aria-label="Collection filters">
          <div className="filter-sidebar-header">
            <SlidersHorizontal />
            <div>
              <strong>Filters</strong>
              <span>{activeBrandCount} total styles</span>
            </div>
          </div>

          <label className="sidebar-search">
            <Search />
            <input
              ref={searchRef}
              type="search"
              value={filters.search}
              placeholder="Search product, brand, color"
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            />
          </label>

          <div className="sidebar-group">
            <h3>Category</h3>
            {categories.map((category) => (
              <button
                type="button"
                key={category}
                className={filters.category === category ? "is-active" : ""}
                onClick={() => setFilters((current) => ({ ...current, category }))}
              >
                <span>{category}</span>
              </button>
            ))}
          </div>

          <div className="sidebar-group">
            <h3>Brand</h3>
            <button
              type="button"
              className={filters.brand === "All" ? "is-active" : ""}
              onClick={() => setFilters((current) => ({ ...current, brand: "All" }))}
            >
              <span>All brands</span>
              <em>{activeBrandCount}</em>
            </button>
            {brands.map((brand) => (
              <button
                type="button"
                key={brand.name}
                className={filters.brand === brand.name ? "is-active" : ""}
                onClick={() => setFilters((current) => ({ ...current, brand: brand.name }))}
              >
                <span>{brand.name}</span>
                <em>{brand.count}</em>
              </button>
            ))}
          </div>

          <div className="sidebar-group">
            <h3>Price</h3>
            <div className="range-row">
              <input
                type="range"
                min={PRICE_RANGE.min}
                max={PRICE_RANGE.max}
                value={filters.maxPrice}
                step={PRICE_RANGE.step}
                onChange={(event) => setFilters((current) => ({ ...current, maxPrice: Number(event.target.value) }))}
              />
              <span>{inr(filters.maxPrice)}</span>
            </div>
          </div>

          <label className="sidebar-checkbox">
            <input
              type="checkbox"
              checked={filters.saleOnly}
              onChange={(event) => setFilters((current) => ({ ...current, saleOnly: event.target.checked }))}
            />
            <span>Sale products only</span>
          </label>
        </aside>

        <div className="catalog-results">
          <div className="catalog-toolbar">
            <div>
              <p>{status === "loading" ? "Loading styles" : `${products.length} styles found`}</p>
              <AppliedFilters filters={filters} onClearOne={clearFilter} onClearAll={() => setFilters(baseFilters)} />
            </div>
            <label className="sort-select catalog-sort">
              <span className="sr-only">Sort products</span>
              <select
                value={filters.sort}
                onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value }))}
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name</option>
              </select>
              <ChevronDown />
            </label>
          </div>

          <div className="product-grid catalog-grid">
            {status === "error" && <div className="empty-state">Backend API is not reachable. Start the backend and refresh.</div>}
            {status !== "error" && products.length === 0 && status !== "loading" && (
              <div className="empty-state">No styles match these filters.</div>
            )}
            {status === "loading" &&
              Array.from({ length: 9 }).map((_, index) => <div className="product-skeleton" key={index} />)}
            {status === "ready" &&
              products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isFavorite={favorites.has(product.id)}
                  onFavorite={onFavorite}
                  onAddToCart={onAddToCart}
                  onOpenDetails={onOpenDetails}
                />
              ))}
          </div>
        </div>
      </section>
    </main>
  );
}
