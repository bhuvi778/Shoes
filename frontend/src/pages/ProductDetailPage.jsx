import { ArrowLeft, Heart, ShoppingBag, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { inr } from "../lib/format.js";
import ProductCard from "../components/ProductCard.jsx";

export default function ProductDetailPage({
  product,
  similarProducts,
  favorites,
  isFavorite,
  onFavorite,
  onAddToCart,
  onOpenDetails,
  onBack
}) {
  const [selectedSize, setSelectedSize] = useState(product?.sizes?.[0] || null);
  const [selectedImage, setSelectedImage] = useState(product?.images?.[0] || product?.image || "");

  useEffect(() => {
    setSelectedSize(product?.sizes?.[0] || null);
    setSelectedImage(product?.images?.[0] || product?.image || "");
  }, [product]);

  if (!product) {
    return (
      <main className="page-shell">
        <div className="empty-state">Product not found.</div>
      </main>
    );
  }

  return (
    <main className="page-shell detail-page">
      <button className="back-button" type="button" onClick={onBack}>
        <ArrowLeft />
        Back to collection
      </button>

      <section className="detail-layout">
        <div className="detail-gallery">
          <div className="detail-media">
            <img src={selectedImage || product.image} alt={product.name} />
          </div>
          {(product.images?.length ? product.images : [product.image]).length > 1 && (
            <div className="detail-thumbs" aria-label="Product images">
              {(product.images?.length ? product.images : [product.image]).map((image) => (
                <button
                  className={selectedImage === image ? "is-active" : ""}
                  type="button"
                  key={image}
                  onClick={() => setSelectedImage(image)}
                >
                  <img src={image} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="detail-copy">
          <p className="eyebrow">{product.brand}</p>
          <h1>{product.name}</h1>
          <p className="detail-color">{product.color}</p>
          <div className="rating-row detail-rating">
            <Star />
            <span>{product.rating}</span>
            <span>{product.reviewCount} reviews</span>
          </div>
          <div className="detail-price">
            <strong>{inr(product.price)}</strong>
            {product.oldPrice ? <span>{inr(product.oldPrice)}</span> : null}
          </div>
          {(product.offerText || product.couponCode) && (
            <div className="detail-offer">
              <strong>{product.offerText || "Product offer"}</strong>
              {product.couponCode && <span>Use code {product.couponCode}</span>}
            </div>
          )}
          <p className="detail-description">{product.description}</p>

          <div className="detail-panel">
            <div>
              <span>Category</span>
              <strong>{product.category}</strong>
            </div>
            <div>
              <span>Stock</span>
              <strong>{product.inventory} available</strong>
            </div>
            <div>
              <span>Returns</span>
              <strong>30 days</strong>
            </div>
          </div>

          <div className="size-section">
            <div className="size-header">
              <strong>Select size</strong>
              <span>India / UK sizing</span>
            </div>
            <div className="size-grid">
              {(product.sizes || []).map((size) => (
                <button
                  className={selectedSize === size ? "is-active" : ""}
                  type="button"
                  key={size}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="detail-actions">
            <button className="checkout-button" type="button" onClick={() => onAddToCart(product)}>
              <ShoppingBag />
              Add to Bag
            </button>
            <button className={`detail-favorite ${isFavorite ? "is-active" : ""}`} type="button" onClick={() => onFavorite(product.id)}>
              <Heart />
              {isFavorite ? "Saved" : "Save"}
            </button>
          </div>
        </div>
      </section>

      <section className="similar-section">
        <div className="section-kicker">
          <p className="eyebrow">Similar products</p>
          <h2>More pairs in the same mood.</h2>
        </div>
        <div className="featured-row">
          {similarProducts.map((item) => (
            <ProductCard
              key={item.id}
              product={item}
              isFavorite={favorites.has(item.id)}
              onFavorite={onFavorite}
              onAddToCart={onAddToCart}
              onOpenDetails={onOpenDetails}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
