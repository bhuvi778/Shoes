import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Youtube } from "lucide-react";
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

const contactDetails = [
  { label: "Call", value: "8178750717", href: "tel:8178750717", icon: Phone },
  { label: "Email", value: "support@ascend.store", href: "mailto:support@ascend.store", icon: Mail },
  { label: "Address", value: "ASCEND Footwear, Delhi NCR, India", icon: MapPin }
];

const socialLinks = [
  { label: "Instagram", href: "https://www.instagram.com/ascend.store", icon: Instagram },
  { label: "Facebook", href: "https://www.facebook.com/ascend.store", icon: Facebook },
  { label: "YouTube", href: "https://www.youtube.com/@ascendstore", icon: Youtube },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/ascend-store", icon: Linkedin }
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

      <div className="footer-contact">
        <h3>Contact</h3>
        <div className="footer-contact-list">
          {contactDetails.map((item) => {
            const Icon = item.icon;
            const content = (
              <>
                <Icon />
                <span>{item.value}</span>
              </>
            );

            return item.href ? (
              <a href={item.href} key={item.label}>
                {content}
              </a>
            ) : (
              <span key={item.label}>
                {content}
              </span>
            );
          })}
          <span>
            <Mail />
            <span>Mon-Sat, 10 AM - 7 PM</span>
          </span>
        </div>

        <div className="footer-socials" aria-label="ASCEND social media links">
          {socialLinks.map((item) => {
            const Icon = item.icon;
            return (
              <a href={item.href} target="_blank" rel="noreferrer" aria-label={item.label} key={item.label}>
                <Icon />
              </a>
            );
          })}
        </div>
      </div>

      <div className="footer-bottom">
        <span>&copy; 2026 {BRAND_NAME}. All rights reserved.</span>
        <span>Free shipping across India &middot; 30-day returns</span>
      </div>
    </footer>
  );
}
