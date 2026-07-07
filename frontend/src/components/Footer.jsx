import BrandLogo from "./BrandLogo.jsx";
import { BRAND_NAME, categories as defaultCategories } from "../lib/constants.js";

const supportLinks = [
  { label: "Size Guide", slug: "size-guide" },
  { label: "Returns", slug: "returns" },
  { label: "Shipping", slug: "shipping" },
  { label: "Contact", slug: "contact" }
];

const companyLinks = [
  { label: "About", slug: "about" },
  { label: "Reviews", slug: "reviews" },
  { label: "Careers", slug: "careers" },
  { label: "Sustainability", slug: "sustainability" }
];

export default function Footer({ brands, categories, onHome, onSelectCategory, onShowSale, onSelectBrand, onOpenInfo }) {
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
        {supportLinks.map((item) => (
          <button type="button" key={item.slug} onClick={() => onOpenInfo(item.slug)}>
            {item.label}
          </button>
        ))}
      </div>

      <div className="footer-column">
        <h3>Company</h3>
        {companyLinks.map((item) => (
          <button type="button" key={item.slug} onClick={() => onOpenInfo(item.slug)}>
            {item.label}
          </button>
        ))}
      </div>

      <div className="footer-bottom">
        <span>&copy; 2026 {BRAND_NAME}. All rights reserved.</span>
        <span>Free shipping across India &middot; 30-day returns</span>
      </div>
    </footer>
  );
}
