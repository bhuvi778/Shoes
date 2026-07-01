import { ArrowLeft } from "lucide-react";
import ProductCard from "../components/ProductCard.jsx";

export default function FavoritesPage({ favoriteProducts, favorites, onFavorite, onAddToCart, onOpenDetails, onBack }) {
  return (
    <main className="page-shell favorites-page">
      <button className="back-button" type="button" onClick={onBack}>
        <ArrowLeft />
        Back to shopping
      </button>
      <section className="collection-hero">
        <p className="eyebrow">Favorites</p>
        <h1>Saved shoes for your next decision.</h1>
        <p>Favorites stay visible from the navbar so shoppers can compare shortlisted products quickly.</p>
      </section>
      <div className="product-grid catalog-grid">
        {favoriteProducts.length === 0 ? (
          <div className="empty-state">No favorites yet. Use the heart button on any product to save it here.</div>
        ) : (
          favoriteProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isFavorite={favorites.has(product.id)}
              onFavorite={onFavorite}
              onAddToCart={onAddToCart}
              onOpenDetails={onOpenDetails}
            />
          ))
        )}
      </div>
    </main>
  );
}
