import BrandLogo from "./BrandLogo.jsx";
import { BRAND_NAME, categories as defaultCategories } from "../lib/constants.js";

export default function Footer({ brands, categories, onHome, onSelectCategory, onShowSale, onSelectBrand }) {
  const footerCategories = categories?.length ? categories.map((category) => category.name) : defaultCategories.slice(1);

  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <button className="brand brand-button" type="button" onClick={onHome} aria-label={`${BRAND_NAME} home`}>
          <BrandLogo className="footer-logo" />
        </button>
        <p>Premium footwear marketplace for runners, collectors, commuters, and everyday movers.</p>
      </div>

      <div className="footer-column">
        <h3>Shop</h3>
        {footerCategories.map((category) => (
          <button type="button" key={category} onClick={() => onSelectCategory(category)}>
            {category}
          </button>
        ))}
        <button type="button" onClick={onShowSale}>
          Sale
        </button>
      </div>

      <div className="footer-column">
        <h3>Brands</h3>
        {brands.slice(0, 5).map((brand) => (
          <button type="button" key={brand.name} onClick={() => onSelectBrand(brand.name)}>
            {brand.name}
          </button>
        ))}
      </div>

      <div className="footer-column">
        <h3>Support</h3>
        <button type="button">Size Guide</button>
        <button type="button">Returns</button>
        <button type="button">Shipping</button>
        <button type="button">Contact</button>
      </div>

      <div className="footer-column">
        <h3>Company</h3>
        <button type="button">About</button>
        <button type="button">Reviews</button>
        <button type="button">Careers</button>
        <button type="button">Sustainability</button>
      </div>

      <div className="footer-bottom">
        <span>&copy; 2026 {BRAND_NAME}. All rights reserved.</span>
        <span>Free shipping across India &middot; 30-day returns</span>
      </div>
    </footer>
  );
}
