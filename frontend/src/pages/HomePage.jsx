import { ArrowRight, Mail, Star } from "lucide-react";
import { editorials, quickStats, trustItems } from "../lib/constants.js";
import { inr } from "../lib/format.js";
import ProductCard from "../components/ProductCard.jsx";

export default function HomePage({
  brands,
  categories,
  products,
  settings,
  testimonials,
  favorites,
  onFavorite,
  onAddToCart,
  onOpenDetails,
  onOpenCollection,
  onSetCategory,
  onSetBrand
}) {
  const featuredProducts = products.slice(0, 4);
  const hero = settings?.hero || {};
  const theme = settings?.theme || {};
  const heroMediaUrl = hero.mediaUrl || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=2400&q=90";
  const mobileHeroMediaUrl = hero.mobileMediaUrl || heroMediaUrl;

  return (
    <main
      id="top"
      style={{
        "--bg": theme.background || undefined,
        "--panel": theme.panel || undefined
      }}
    >
      <section className="hero" aria-label={hero.eyebrow || "Storefront hero"}>
        <div className="hero-media" aria-hidden="true">
          {hero.mediaType === "video" ? (
            <video src={heroMediaUrl} poster={hero.videoPoster || mobileHeroMediaUrl} autoPlay muted loop playsInline />
          ) : (
            <picture>
              <source media="(max-width: 640px)" srcSet={mobileHeroMediaUrl} />
              <img src={heroMediaUrl} alt="" />
            </picture>
          )}
        </div>
        <div className="hero-overlay" />
        <div className="hero-copy">
          <p className="eyebrow">{hero.eyebrow || "Summer 2026 Collection"}</p>
          <h1>{hero.title || "Move Without Compromise."}</h1>
          <p className="hero-text">{hero.text || "Shop performance runners, casual sneakers, leather shoes, and weather-ready boots by brand, fit, and purpose."}</p>
          <div className="hero-actions">
            <button className="primary-button" type="button" onClick={onOpenCollection}>
              {hero.primaryCta || "Shop Now"}
            </button>
            <button className="secondary-link" type="button" onClick={() => document.getElementById("brands")?.scrollIntoView({ behavior: "smooth" })}>
              {hero.secondaryCta || "Explore brands"} <ArrowRight />
            </button>
          </div>
        </div>
        <div className="hero-stats" aria-label="Store highlights">
          {quickStats.map((stat) => (
            <div key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="brand-section" id="categories">
        <div className="section-kicker">
          <p className="eyebrow">Shop by category</p>
          <h2>Category images are controlled from product admin fields.</h2>
        </div>
        <div className="brand-grid">
          {(categories || []).map((category) => (
            <button
              className="brand-card"
              type="button"
              key={category.name}
              onClick={() => {
                onSetCategory(category.name);
                onOpenCollection();
              }}
            >
              <img src={category.image} alt="" loading="lazy" />
              <span>{category.name}</span>
              <strong>{category.count} styles from {inr(category.fromPrice)}</strong>
            </button>
          ))}
        </div>
      </section>

      <section className="brand-section" id="brands">
        <div className="section-kicker">
          <p className="eyebrow">Shop by brand</p>
          <h2>Pick your lane before you pick your pair.</h2>
        </div>
        <div className="brand-grid">
          <button className="brand-card is-active" type="button" onClick={onOpenCollection}>
            <span>All Brands</span>
            <strong>{brands.reduce((sum, brand) => sum + brand.count, 0)} styles</strong>
          </button>
          {brands.map((brand) => (
            <button
              className="brand-card"
              type="button"
              key={brand.name}
              onClick={() => {
                onSetBrand(brand.name);
                onOpenCollection();
              }}
            >
              <img src={brand.image} alt="" loading="lazy" />
              <span>{brand.name}</span>
              <strong>{brand.count} styles from {inr(brand.fromPrice)}</strong>
            </button>
          ))}
        </div>
      </section>

      <section className="featured-strip" aria-label="Featured products">
        <div className="section-kicker">
          <p className="eyebrow">New and trending</p>
          <h2>Popular picks this week.</h2>
        </div>
        <div className="featured-row">
          {featuredProducts.map((product) => (
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
      </section>

      <section className="story-stack" id="story">
        {editorials.map((item) => (
          <article className={`split-story ${item.reverse ? "is-reverse" : ""}`} key={item.title}>
            <div className="split-image">
              <img src={item.image} alt="" loading="lazy" />
            </div>
            <div className="split-copy">
              <p className="eyebrow">{item.eyebrow}</p>
              <h2>{item.title}</h2>
              <p>{item.text}</p>
              <button className="text-link" type="button" onClick={onOpenCollection}>
                Browse collection <ArrowRight />
              </button>
            </div>
          </article>
        ))}
      </section>

      <section className="trust-strip" aria-label="Store guarantees">
        {trustItems.map((item) => {
          const Icon = item.icon;
          return (
            <div className="trust-item" key={item.title}>
              <Icon />
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </div>
          );
        })}
      </section>

      <section className="testimonial-section" id="testimonials">
        <div className="section-kicker">
          <p className="eyebrow">Customer proof</p>
          <h2>Designed around real buying decisions.</h2>
        </div>
        <div className="testimonial-grid">
          {testimonials.map((item) => (
            <article className="testimonial-card" key={item.name}>
              <div className="stars" aria-label={`${item.rating} star review`}>
                {Array.from({ length: item.rating }).map((_, index) => (
                  <Star key={index} />
                ))}
              </div>
              <p>"{item.quote}"</p>
              <div>
                <strong>{item.name}</strong>
                <span>{item.role}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="newsletter-section" aria-label="Newsletter">
        <div>
          <p className="eyebrow">First access</p>
          <h2>Get new drops, sale alerts, and size restocks.</h2>
        </div>
        <form className="newsletter-form" onSubmit={(event) => event.preventDefault()}>
          <label>
            <Mail />
            <span className="sr-only">Email address</span>
            <input type="email" placeholder="Email address" />
          </label>
          <button type="submit">Notify Me</button>
        </form>
      </section>
    </main>
  );
}
