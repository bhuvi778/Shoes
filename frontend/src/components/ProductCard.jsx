import { Heart, ShoppingBag, Star } from "lucide-react";
import { inr } from "../lib/format.js";

export default function ProductCard({ product, isFavorite, onFavorite, onAddToCart, onOpenDetails }) {
  return (
    <article className="product-card" onClick={() => onOpenDetails(product)} role="button" tabIndex={0}>
      <div className="product-media">
        <img src={product.image} alt={product.name} loading="lazy" />
        {product.badge && <span className={`badge ${product.badge === "NEW" ? "is-new" : ""}`}>{product.badge}</span>}
        <button
          className={`favorite-button ${isFavorite ? "is-active" : ""}`}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onFavorite(product.id);
          }}
          aria-label={`Toggle ${product.name} favorite`}
        >
          <Heart />
        </button>
        <button
          className="quick-add"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onAddToCart(product);
          }}
        >
          <ShoppingBag />
          Add to Bag
        </button>
      </div>
      <div className="product-info">
        <p className="product-brand">{product.brand}</p>
        <h3 className="product-name">{product.name}</h3>
        <p className="product-color">{product.color}</p>
        <div className="rating-row" aria-label={`${product.rating} stars from ${product.reviewCount} reviews`}>
          <Star />
          <span>{product.rating}</span>
          <span>({product.reviewCount})</span>
        </div>
        <div className="price-row">
          <span>{inr(product.price)}</span>
          {product.oldPrice ? <span className="old-price">{inr(product.oldPrice)}</span> : null}
        </div>
      </div>
    </article>
  );
}
