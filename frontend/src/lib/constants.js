import {
  CreditCard,
  Heart,
  LayoutDashboard,
  MapPin,
  Package,
  RotateCcw,
  Settings,
  ShieldCheck,
  Truck
} from "lucide-react";

// Brand + store-wide configuration. Centralized here so the upcoming admin
// portal can drive these values (and later replace them with API data).
export const BRAND_NAME = "Qadam";

export const categories = ["All", "Running", "Casual", "Boots", "Sport"];

export const FREE_SHIPPING_THRESHOLD = 10000;
export const MAX_PRICE = 25000;
export const PRICE_RANGE = { min: 8000, max: MAX_PRICE, step: 500 };

export const baseFilters = {
  category: "All",
  brand: "All",
  search: "",
  sort: "featured",
  maxPrice: MAX_PRICE,
  saleOnly: false
};

export const quickStats = [
  { label: "Curated brands", value: "7+" },
  { label: "Verified reviews", value: "1.2k" },
  { label: "Return window", value: "30 days" }
];

export const trustItems = [
  { icon: Truck, title: "Free shipping", text: "Free shipping across India on orders over ₹10,000." },
  { icon: RotateCcw, title: "Easy returns", text: "30-day fit check with simple exchanges." },
  { icon: ShieldCheck, title: "Authentic stock", text: "Every pair is verified before dispatch." },
  { icon: CreditCard, title: "Secure checkout", text: "Protected payments and clear totals." }
];

export const editorials = [
  {
    eyebrow: "Brand story",
    title: "Built for shoppers who compare by purpose, not only by price.",
    text: "Qadam organizes performance runners, everyday sneakers, boots, and premium leather shoes into a cleaner buying journey. The home page surfaces brand edits first, then lets shoppers filter deeper when they are ready.",
    image: "https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=1200&q=86"
  },
  {
    eyebrow: "Performance edit",
    title: "From daily miles to city nights, every pair has a job.",
    text: "Product cards include ratings, inventory signals, sale tags, brand names, and quick add behavior so the browsing flow feels like a real store rather than a static gallery.",
    image: "https://images.unsplash.com/photo-1469395446868-fb6a048d5ca3?auto=format&fit=crop&w=1200&q=86",
    reverse: true
  }
];

export const dashNav = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "orders", label: "Orders", icon: Package },
  { id: "wishlist", label: "Wishlist", icon: Heart },
  { id: "addresses", label: "Addresses", icon: MapPin },
  { id: "payment", label: "Payment", icon: CreditCard },
  { id: "settings", label: "Settings", icon: Settings }
];
