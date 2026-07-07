import { BRAND_LOGO, BRAND_NAME } from "../lib/constants.js";

export default function BrandLogo({ className = "", labelled = false }) {
  const labelProps = labelled ? { role: "img", "aria-label": BRAND_NAME } : { "aria-hidden": "true" };

  return (
    <span className={`brand-logo ${className}`.trim()} {...labelProps}>
      <img src={BRAND_LOGO} alt="" />
    </span>
  );
}
