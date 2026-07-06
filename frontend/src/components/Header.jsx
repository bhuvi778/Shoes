import { Heart, Search, ShoppingBag, User } from "lucide-react";
import { BRAND_NAME } from "../lib/constants.js";
import { getInitials } from "../lib/format.js";

export default function Header({
  user,
  cartCount,
  favoritesCount,
  onHome,
  onOpenCollection,
  onGoSection,
  onShowSale,
  onOpenAdmin,
  onFocusSearch,
  onOpenFavorites,
  onOpenAccount,
  onOpenCart
}) {
  return (
    <header className="site-header">
      <button className="brand brand-button" type="button" onClick={onHome} aria-label={`${BRAND_NAME} home`}>
        {BRAND_NAME}
      </button>

      <nav className="main-nav" aria-label="Primary navigation">
        <button type="button" onClick={onOpenCollection}>
          Collection
        </button>
        <button type="button" onClick={() => onGoSection("brands")}>
          Brands
        </button>
        <button type="button" onClick={() => onGoSection("story")}>
          Story
        </button>
        <button type="button" onClick={() => onGoSection("testimonials")}>
          Reviews
        </button>
        <button type="button" onClick={onShowSale}>
          Sale
        </button>
        <button type="button" onClick={onOpenAdmin}>
          Admin
        </button>
      </nav>

      <div className="header-actions">
        <button className="icon-button" type="button" onClick={onFocusSearch} aria-label="Search products">
          <Search />
        </button>
        <button className="icon-button" type="button" onClick={onOpenFavorites} aria-label="Open favorites">
          <Heart />
          <span className={`cart-count ${favoritesCount ? "has-items" : ""}`}>{favoritesCount}</span>
        </button>
        <button
          className={`icon-button account-button ${user ? "is-authed" : ""}`}
          type="button"
          onClick={onOpenAccount}
          aria-label={user ? "Open account dashboard" : "Sign in"}
        >
          {user ? <span className="nav-avatar">{getInitials(user.name)}</span> : <User />}
        </button>
        <button className="icon-button cart-button" type="button" onClick={onOpenCart} aria-label="Open cart">
          <ShoppingBag />
          <span className={`cart-count ${cartCount ? "has-items" : ""}`}>{cartCount}</span>
        </button>
      </div>
    </header>
  );
}
