import cors from "cors";
import crypto from "crypto";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import { seedProducts, testimonials as seedTestimonials } from "./products.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 5050);
const clientUrls = (process.env.CLIENT_URLS || "http://localhost:5176,http://localhost:5173,http://localhost:5174,http://localhost:5175")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);
const clientUrlSuffixes = (process.env.CLIENT_URL_SUFFIXES || ".vercel.app")
  .split(",")
  .map((suffix) => suffix.trim())
  .filter(Boolean);
const adminEmail = process.env.ADMIN_EMAIL || "admin@ascend.store";
const adminPassword = process.env.ADMIN_PASSWORD || "Ascend@2026";
const adminTokenSecret = process.env.ADMIN_TOKEN_SECRET || "change-this-secret-in-render";
const storeName = "ASCEND";
const razorpayMerchantId = process.env.RAZORPAY_MERCHANT_ID || process.env.RAZORPAY_KEY_ID || "RuhMGfsW6PMspM";
const razorpayKeyId = process.env.RAZORPAY_KEY_ID || razorpayMerchantId;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || "";

let mongoReady = false;
let mongoStatus = {
  configured: Boolean(process.env.MONGODB_URI),
  database: "seed-data",
  message: process.env.MONGODB_URI ? "MongoDB connection pending" : "MONGODB_URI is not set"
};

const fallbackAdminEmails = [...new Set([adminEmail, "admin@ascend.store", "admin@qadam.store"].map((email) => email.toLowerCase()))];
const fallbackAdminPasswords = [...new Set([adminPassword, "Ascend@2026", "Qadam@2026"])];

const defaultSiteSettings = {
  key: "main",
  hero: {
    eyebrow: "Summer 2026 Collection",
    title: "Move Without Compromise.",
    text: "Shop performance runners, casual sneakers, leather shoes, and weather-ready boots by brand, fit, and purpose.",
    primaryCta: "Shop Now",
    secondaryCta: "Explore brands",
    mediaType: "image",
    mediaUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=2400&q=90",
    mobileMediaUrl: "",
    videoPoster: "",
    mediaItems: [
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=2400&q=90",
        mobileUrl: "",
        poster: ""
      }
    ]
  },
  theme: {
    background: "#171717",
    panel: "#202020"
  }
};

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    brand: { type: String, default: storeName },
    color: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    oldPrice: Number,
    badge: String,
    rating: { type: Number, default: 4.5 },
    reviewCount: { type: Number, default: 0 },
    inventory: { type: Number, default: 0 },
    sizes: [Number],
    image: { type: String, required: true },
    images: [String],
    brandImage: String,
    categoryImage: String,
    description: String,
    offerText: String,
    couponCode: String,
    featured: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

const siteSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "main", unique: true },
    hero: {
      eyebrow: String,
      title: String,
      text: String,
      primaryCta: String,
      secondaryCta: String,
      mediaType: { type: String, enum: ["image", "video"], default: "image" },
      mediaUrl: String,
      mobileMediaUrl: String,
      videoPoster: String,
      mediaItems: [
        {
          type: { type: String, enum: ["image", "video"], default: "image" },
          url: String,
          mobileUrl: String,
          poster: String
        }
      ]
    },
    theme: {
      background: String,
      panel: String
    }
  },
  { timestamps: true }
);

const adminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    salt: { type: String, required: true },
    name: { type: String, default: "Store Admin" }
  },
  { timestamps: true }
);

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    joined: String,
    lastSeenAt: Date
  },
  { timestamps: true }
);

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    image: String,
    description: String,
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const brandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    image: String,
    description: String,
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const testimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    role: { type: String, default: "" },
    quote: { type: String, required: true },
    rating: { type: Number, default: 5, min: 1, max: 5 },
    featured: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    customerName: String,
    customerEmail: String,
    items: [
      {
        productId: String,
        name: String,
        brand: String,
        image: String,
        price: Number,
        quantity: Number
      }
    ],
    total: { type: Number, default: 0 },
    status: { type: String, default: "Processing" },
    source: { type: String, default: "website" },
    payment: {
      provider: { type: String, default: "razorpay" },
      method: { type: String, default: "razorpay" },
      status: { type: String, default: "pending" },
      merchantId: String,
      razorpayOrderId: String,
      razorpayPaymentId: String,
      razorpaySignature: String,
      verified: { type: Boolean, default: false },
      serverOrder: { type: Boolean, default: false }
    }
  },
  { timestamps: true }
);

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    type: { type: String, enum: ["percent", "flat"], default: "percent" },
    value: { type: Number, default: 0 },
    productIds: [String],
    active: { type: Boolean, default: true },
    startsAt: Date,
    endsAt: Date
  },
  { timestamps: true }
);

const visitorSchema = new mongoose.Schema(
  {
    visitorId: { type: String, required: true, unique: true },
    page: String,
    userAgent: String,
    lastSeenAt: { type: Date, default: Date.now },
    firstSeenAt: { type: Date, default: Date.now },
    visits: { type: Number, default: 1 }
  },
  { timestamps: true }
);

const SiteSettings = mongoose.model("SiteSettings", siteSettingsSchema);
const Admin = mongoose.model("Admin", adminSchema);
const Customer = mongoose.model("Customer", customerSchema);
const Category = mongoose.model("Category", categorySchema);
const Brand = mongoose.model("Brand", brandSchema);
const Testimonial = mongoose.model("Testimonial", testimonialSchema);
const Order = mongoose.model("Order", orderSchema);
const Coupon = mongoose.model("Coupon", couponSchema);
const Visitor = mongoose.model("Visitor", visitorSchema);

app.use(express.json({ limit: "15mb" }));
app.use(
  cors({
    origin(origin, callback) {
      let hostname = "";
      if (origin) {
        try {
          hostname = new URL(origin).hostname;
        } catch {
          callback(new Error(`Invalid CORS origin: ${origin}`));
          return;
        }
      }
      const allowedBySuffix = clientUrlSuffixes.some((suffix) => hostname === suffix.replace(/^\./, "") || hostname.endsWith(suffix));

      if (!origin || clientUrls.includes(origin) || allowedBySuffix) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true
  })
);

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 64, "sha512").toString("hex");
  return { hash, salt };
}

function verifyPassword(password, salt, expectedHash) {
  const { hash } = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(expectedHash, "hex"));
}

function signAdminToken(admin) {
  const payload = {
    sub: admin._id ? String(admin._id) : "env-admin",
    email: admin.email,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", adminTokenSecret).update(body).digest("base64url");
  return `${body}.${signature}`;
}

function verifyAdminToken(token) {
  try {
    if (!token || !token.includes(".")) return null;
    const [body, signature] = token.split(".");
    const expectedSignature = crypto.createHmac("sha256", adminTokenSecret).update(body).digest("base64url");
    if (signature.length !== expectedSignature.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function requireAdmin(req, res, next) {
  const token = req.get("authorization")?.replace(/^Bearer\s+/i, "");
  const payload = verifyAdminToken(token);
  if (!payload) {
    res.status(401).json({ message: "Admin authorization required" });
    return;
  }
  req.admin = payload;
  next();
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function compactStrings(values) {
  if (!Array.isArray(values)) return [];
  return values.map((value) => String(value || "").trim()).filter(Boolean);
}

function normalizeMongoUri(rawUri) {
  const value = String(rawUri || "").trim();
  if (!value) return "";

  try {
    const url = new URL(value);
    if (url.protocol.startsWith("mongodb") && (!url.pathname || url.pathname === "/")) {
      url.pathname = "/stryd_shoe_store";
    }
    return url.toString();
  } catch {
    return value;
  }
}

function canUseFallbackAdmin(email, password) {
  return fallbackAdminEmails.includes(email) && fallbackAdminPasswords.includes(password);
}

function sanitizeProduct(body) {
  const image = String(body.image || body.images?.[0] || "").trim();
  return {
    name: String(body.name || "").trim(),
    slug: String(body.slug || body.name || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, ""),
    brand: String(body.brand || storeName).trim(),
    color: String(body.color || "").trim(),
    category: String(body.category || "Casual").trim(),
    price: toNumber(body.price),
    oldPrice: body.oldPrice ? toNumber(body.oldPrice) : undefined,
    badge: String(body.badge || "").trim(),
    rating: toNumber(body.rating, 4.5),
    reviewCount: toNumber(body.reviewCount),
    inventory: toNumber(body.inventory),
    sizes: compactStrings(body.sizes).map((size) => toNumber(size)).filter(Boolean),
    image,
    images: compactStrings(body.images || [image]),
    brandImage: String(body.brandImage || "").trim(),
    categoryImage: String(body.categoryImage || "").trim(),
    description: String(body.description || "").trim(),
    offerText: String(body.offerText || "").trim(),
    couponCode: String(body.couponCode || "").trim().toUpperCase(),
    featured: Boolean(body.featured)
  };
}

function validateProduct(product) {
  const missing = ["name", "slug", "color", "category", "price", "image"].filter((key) => !product[key]);
  if (missing.length > 0) return `Missing required product fields: ${missing.join(", ")}`;
  return "";
}

function sanitizeSettings(body) {
  const legacyHero = body.hero || {};
  const mediaItems = Array.isArray(legacyHero.mediaItems)
    ? legacyHero.mediaItems
        .map((item) => ({
          type: item?.type === "video" ? "video" : "image",
          url: String(item?.url || "").trim(),
          mobileUrl: String(item?.mobileUrl || "").trim(),
          poster: String(item?.poster || "").trim()
        }))
        .filter((item) => item.url)
    : [];
  const fallbackMediaUrl = String(legacyHero.mediaUrl || defaultSiteSettings.hero.mediaUrl).trim();
  const normalizedMediaItems = mediaItems.length
    ? mediaItems
    : [
        {
          type: legacyHero.mediaType === "video" ? "video" : "image",
          url: fallbackMediaUrl,
          mobileUrl: String(legacyHero.mobileMediaUrl || "").trim(),
          poster: String(legacyHero.videoPoster || "").trim()
        }
      ];

  return {
    key: "main",
    hero: {
      eyebrow: String(legacyHero.eyebrow || defaultSiteSettings.hero.eyebrow).trim(),
      title: String(legacyHero.title || defaultSiteSettings.hero.title).trim(),
      text: String(legacyHero.text || defaultSiteSettings.hero.text).trim(),
      primaryCta: String(legacyHero.primaryCta || defaultSiteSettings.hero.primaryCta).trim(),
      secondaryCta: String(legacyHero.secondaryCta || defaultSiteSettings.hero.secondaryCta).trim(),
      mediaType: normalizedMediaItems[0]?.type || "image",
      mediaUrl: normalizedMediaItems[0]?.url || defaultSiteSettings.hero.mediaUrl,
      mobileMediaUrl: normalizedMediaItems[0]?.mobileUrl || "",
      videoPoster: normalizedMediaItems[0]?.poster || "",
      mediaItems: normalizedMediaItems
    },
    theme: {
      background: String(body.theme?.background || defaultSiteSettings.theme.background).trim(),
      panel: String(body.theme?.panel || defaultSiteSettings.theme.panel).trim()
    }
  };
}

function sanitizeTestimonial(body) {
  return {
    name: String(body.name || "").trim(),
    role: String(body.role || "").trim(),
    quote: String(body.quote || "").trim(),
    rating: Math.min(5, Math.max(1, toNumber(body.rating, 5))),
    featured: body.featured !== false
  };
}

function validateTestimonial(testimonial) {
  const missing = ["name", "quote"].filter((key) => !testimonial[key]);
  if (missing.length > 0) return `Missing required review fields: ${missing.join(", ")}`;
  return "";
}

function sanitizeCoupon(body) {
  return {
    code: String(body.code || "").trim().toUpperCase(),
    title: String(body.title || "").trim(),
    type: body.type === "flat" ? "flat" : "percent",
    value: toNumber(body.value),
    productIds: compactStrings(body.productIds),
    active: body.active !== false,
    startsAt: body.startsAt ? new Date(body.startsAt) : undefined,
    endsAt: body.endsAt ? new Date(body.endsAt) : undefined
  };
}

function sanitizeCategory(body) {
  return {
    name: String(body.name || "").trim(),
    image: String(body.image || "").trim(),
    description: String(body.description || "").trim(),
    active: body.active !== false
  };
}

function sanitizeBrand(body) {
  return {
    name: String(body.name || "").trim(),
    image: String(body.image || "").trim(),
    description: String(body.description || "").trim(),
    active: body.active !== false
  };
}

function validateCategory(category) {
  if (!category.name) return "Category name is required";
  return "";
}

function validateBrand(brand) {
  if (!brand.name) return "Brand name is required";
  return "";
}

function validateCoupon(coupon) {
  const missing = ["code", "title", "value"].filter((key) => !coupon[key]);
  if (missing.length > 0) return `Missing required coupon fields: ${missing.join(", ")}`;
  return "";
}

function toRazorpayAmount(amount) {
  return Math.round(toNumber(amount) * 100);
}

function verifyRazorpaySignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  if (!razorpayKeySecret || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) return false;
  const expected = crypto
    .createHmac("sha256", razorpayKeySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (expected.length !== razorpaySignature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpaySignature));
}

async function createRazorpayOrder({ amount, orderNumber, customerEmail }) {
  if (!razorpayKeySecret) return null;

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString("base64")}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      amount,
      currency: "INR",
      receipt: orderNumber.slice(0, 40),
      notes: {
        store: storeName,
        customerEmail: customerEmail || "",
        merchantId: razorpayMerchantId
      }
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error?.description || data.message || "Razorpay order creation failed");
  }
  return data;
}

function sanitizeOrder(body) {
  const items = Array.isArray(body.items)
    ? body.items.map((item) => ({
        productId: String(item.productId || item.id || "").trim(),
        name: String(item.name || "").trim(),
        brand: String(item.brand || "").trim(),
        image: String(item.image || "").trim(),
        price: toNumber(item.price),
        quantity: Math.max(1, toNumber(item.quantity, 1))
      }))
    : [];
  const total = body.total ? toNumber(body.total) : items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const payment = body.payment || {};
  return {
    orderNumber: String(body.orderNumber || body.id || `ASCEND-${Math.floor(100000 + Math.random() * 900000)}`).trim(),
    customerName: String(body.customerName || body.customer?.name || "").trim(),
    customerEmail: String(body.customerEmail || body.customer?.email || "").trim().toLowerCase(),
    items,
    total,
    status: String(body.status || "Processing").trim(),
    source: String(body.source || "website").trim(),
    payment: {
      provider: String(payment.provider || "razorpay").trim(),
      method: String(payment.method || "razorpay").trim(),
      status: String(payment.status || "pending").trim(),
      merchantId: String(payment.merchantId || razorpayMerchantId).trim(),
      razorpayOrderId: String(payment.razorpayOrderId || payment.razorpay_order_id || "").trim(),
      razorpayPaymentId: String(payment.razorpayPaymentId || payment.razorpay_payment_id || "").trim(),
      razorpaySignature: String(payment.razorpaySignature || payment.razorpay_signature || "").trim(),
      verified: payment.verified === true,
      serverOrder: payment.serverOrder === true
    }
  };
}

app.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "ascend-shoe-store-api",
    message: "Backend is running. Use /api/health, /api/products, /api/brands, or /api/testimonials.",
    database: mongoReady ? "mongodb" : "seed-data",
    mongo: mongoStatus
  });
});

function shapeProducts(products) {
  return products.map((product) => {
    const item = product.toObject ? product.toObject() : product;
    return {
      id: String(item._id || item.slug),
      name: item.name,
      slug: item.slug,
      brand: item.brand,
      color: item.color,
      category: item.category,
      price: item.price,
      oldPrice: item.oldPrice,
      badge: item.badge,
      rating: item.rating,
      reviewCount: item.reviewCount,
      inventory: item.inventory,
      sizes: item.sizes || [],
      image: item.image,
      images: item.images?.length ? item.images : [item.image],
      brandImage: item.brandImage,
      categoryImage: item.categoryImage,
      description: item.description,
      offerText: item.offerText,
      couponCode: item.couponCode,
      featured: item.featured
    };
  });
}

function shapeCategories(categories, products = []) {
  return categories.map((category) => {
    const item = category.toObject ? category.toObject() : category;
    const categoryProducts = products.filter((product) => product.category === item.name);
    const heroProduct = categoryProducts.find((product) => product.categoryImage) || categoryProducts.find((product) => product.featured) || categoryProducts[0];
    const prices = categoryProducts.map((product) => Number(product.price || 0)).filter(Boolean);
    return {
      id: String(item._id || item.name),
      name: item.name,
      image: item.image || heroProduct?.categoryImage || heroProduct?.image || "",
      description: item.description || "",
      active: item.active !== false,
      count: categoryProducts.length,
      fromPrice: prices.length ? Math.min(...prices) : 0
    };
  });
}

function shapeBrands(brands, products = []) {
  return brands.map((brand) => {
    const item = brand.toObject ? brand.toObject() : brand;
    const brandProducts = products.filter((product) => product.brand === item.name);
    const heroProduct = brandProducts.find((product) => product.brandImage) || brandProducts.find((product) => product.featured) || brandProducts[0];
    const prices = brandProducts.map((product) => Number(product.price || 0)).filter(Boolean);
    return {
      id: String(item._id || item.name),
      name: item.name,
      image: item.image || heroProduct?.brandImage || heroProduct?.image || "",
      description: item.description || "",
      active: item.active !== false,
      count: brandProducts.length,
      fromPrice: prices.length ? Math.min(...prices) : 0
    };
  });
}

function shapeTestimonials(items) {
  return items.map((item) => {
    const testimonial = item.toObject ? item.toObject() : item;
    return {
      id: String(testimonial._id || testimonial.name),
      name: testimonial.name,
      role: testimonial.role,
      quote: testimonial.quote,
      rating: testimonial.rating || 5,
      featured: testimonial.featured !== false
    };
  });
}

function shapeOrders(items) {
  return items.map((item) => {
    const order = item.toObject ? item.toObject() : item;
    return {
      id: String(order._id || order.orderNumber),
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      items: order.items || [],
      total: order.total || 0,
      status: order.status || "Processing",
      source: order.source || "website",
      payment: order.payment || {},
      createdAt: order.createdAt,
      date: order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""
    };
  });
}

function shapeCoupons(items) {
  return items.map((item) => {
    const coupon = item.toObject ? item.toObject() : item;
    return {
      id: String(coupon._id || coupon.code),
      code: coupon.code,
      title: coupon.title,
      type: coupon.type || "percent",
      value: coupon.value || 0,
      productIds: coupon.productIds || [],
      active: coupon.active !== false,
      startsAt: coupon.startsAt,
      endsAt: coupon.endsAt
    };
  });
}

function applyFilters(products, query) {
  const category = query.category;
  const brand = query.brand;
  const search = String(query.search || "").trim().toLowerCase();
  const maxPrice = Number(query.maxPrice || 0);
  const saleOnly = query.saleOnly === "true";
  const sort = query.sort || "featured";

  let result = products.filter((product) => {
    const categoryMatch = !category || category === "All" || product.category === category;
    const brandMatch = !brand || brand === "All" || product.brand === brand;
    const searchMatch =
      !search ||
      `${product.name} ${product.brand} ${product.color} ${product.category} ${product.description || ""}`.toLowerCase().includes(search);
    const priceMatch = !maxPrice || product.price <= maxPrice;
    const saleMatch = !saleOnly || Boolean(product.oldPrice);
    return categoryMatch && brandMatch && searchMatch && priceMatch && saleMatch;
  });

  result = [...result].sort((a, b) => {
    if (sort === "price-low") return a.price - b.price;
    if (sort === "price-high") return b.price - a.price;
    if (sort === "name") return a.name.localeCompare(b.name);
    return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
  });

  return result;
}

async function readTestimonials() {
  if (!mongoReady) return shapeTestimonials(seedTestimonials);
  const items = await Testimonial.find({ featured: { $ne: false } }).sort({ updatedAt: -1 }).lean();
  return shapeTestimonials(items);
}

async function readProducts(query) {
  if (!mongoReady) {
    return applyFilters(shapeProducts(seedProducts), query);
  }

  const products = await Product.find({}).lean();
  return applyFilters(shapeProducts(products), query);
}

async function readCategories(products = []) {
  if (!mongoReady) {
    const names = [...new Set(products.map((product) => product.category).filter(Boolean))].sort();
    return shapeCategories(names.map((name) => ({ name, active: true })), products);
  }
  const categories = await Category.find({ active: { $ne: false } }).sort({ name: 1 }).lean();
  return shapeCategories(categories, products);
}

async function readBrands(products = []) {
  if (!mongoReady) {
    const names = [...new Set(products.map((product) => product.brand).filter(Boolean))].sort();
    return shapeBrands(names.map((name) => ({ name, active: true })), products);
  }
  const brands = await Brand.find({ active: { $ne: false } }).sort({ name: 1 }).lean();
  return shapeBrands(brands, products);
}

async function connectMongo() {
  const mongoUri = normalizeMongoUri(process.env.MONGODB_URI);
  mongoStatus.configured = Boolean(mongoUri);

  if (!mongoUri) {
    mongoStatus = {
      configured: false,
      database: "seed-data",
      message: "MONGODB_URI is not set"
    };
    console.log("MONGODB_URI not set. Using seeded in-memory product data for local development.");
    return;
  }

  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 12000 });
  mongoReady = true;
  mongoStatus = {
    configured: true,
    database: mongoose.connection.name || "mongodb",
    message: "MongoDB connected"
  };

  const count = await Product.countDocuments();
  if (count === 0) {
    await Product.insertMany(seedProducts);
    console.log("MongoDB connected and product catalog seeded.");
  }

  const existingCategoryCount = await Category.countDocuments();
  if (existingCategoryCount === 0) {
    const products = await Product.find({}).lean();
    const categorySeeds = [...new Set(products.map((product) => product.category).filter(Boolean))].map((name) => {
      const categoryProduct = products.find((product) => product.category === name && product.categoryImage) || products.find((product) => product.category === name);
      return {
        name,
        image: categoryProduct?.categoryImage || categoryProduct?.image || "",
        active: true
      };
    });
    if (categorySeeds.length) await Category.insertMany(categorySeeds);
  }

  const existingBrandCount = await Brand.countDocuments();
  if (existingBrandCount === 0) {
    const products = await Product.find({}).lean();
    const brandSeeds = [...new Set(products.map((product) => product.brand).filter(Boolean))].map((name) => {
      const brandProduct = products.find((product) => product.brand === name && product.brandImage) || products.find((product) => product.brand === name);
      return {
        name,
        image: brandProduct?.brandImage || brandProduct?.image || "",
        active: true
      };
    });
    if (brandSeeds.length) await Brand.insertMany(brandSeeds);
  }

  await SiteSettings.updateOne({ key: "main" }, { $setOnInsert: defaultSiteSettings }, { upsert: true });
  const testimonialCount = await Testimonial.countDocuments();
  if (testimonialCount === 0) {
    await Testimonial.insertMany(seedTestimonials);
  }
  const couponCount = await Coupon.countDocuments();
  if (couponCount === 0) {
    await Coupon.create({
      code: "WELCOME10",
      title: "Welcome discount",
      type: "percent",
      value: 10,
      active: true
    });
  }
  await ensureDefaultAdmin();
  console.log("MongoDB connected.");
}

async function ensureDefaultAdmin() {
  const existing = await Admin.findOne({ email: adminEmail });
  if (existing) return;

  const { hash, salt } = hashPassword(adminPassword);
  await Admin.create({
    email: adminEmail,
    passwordHash: hash,
    salt,
    name: "Store Admin"
  });
  console.log(`Default admin ready: ${adminEmail}`);
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "ascend-shoe-store-api",
    database: mongoReady ? "mongodb" : "seed-data",
    mongo: mongoStatus
  });
});

app.get("/api/settings", async (_req, res, next) => {
  try {
    if (!mongoReady) {
      res.json({ settings: defaultSiteSettings });
      return;
    }
    const settings = await SiteSettings.findOne({ key: "main" }).lean();
    res.json({ settings: settings || defaultSiteSettings });
  } catch (error) {
    next(error);
  }
});

app.get("/api/products", async (req, res, next) => {
  try {
    const products = await readProducts(req.query);
    res.json({ products, count: products.length });
  } catch (error) {
    next(error);
  }
});

app.get("/api/categories", async (req, res, next) => {
  try {
    const products = await readProducts(req.query);
    const categories = await readCategories(products);
    res.json({ categories, count: categories.length });
  } catch (error) {
    next(error);
  }
});

app.get("/api/brands", async (req, res, next) => {
  try {
    const products = await readProducts({});
    const brands = await readBrands(products);
    res.json({ brands, count: brands.length });
  } catch (error) {
    next(error);
  }
});

app.get("/api/testimonials", async (_req, res, next) => {
  try {
    const testimonials = await readTestimonials();
    res.json({ testimonials, count: testimonials.length });
  } catch (error) {
    next(error);
  }
});

app.post("/api/customers", async (req, res, next) => {
  try {
    if (!mongoReady) {
      res.json({
        customer: {
          name: req.body.name,
          email: req.body.email,
          joined: req.body.joined
        },
        stored: false
      });
      return;
    }

    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const joined = String(req.body.joined || "").trim();
    if (!name || !email) {
      res.status(400).json({ message: "Name and email are required" });
      return;
    }

    const customer = await Customer.findOneAndUpdate(
      { email },
      { $set: { name, email, joined, lastSeenAt: new Date() } },
      { new: true, upsert: true, runValidators: true }
    ).lean();
    res.json({ customer, stored: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/visits", async (req, res, next) => {
  try {
    if (!mongoReady) {
      res.json({ ok: true, stored: false });
      return;
    }
    const visitorId = String(req.body.visitorId || "").trim();
    if (!visitorId) {
      res.status(400).json({ message: "visitorId is required" });
      return;
    }
    await Visitor.findOneAndUpdate(
      { visitorId },
      {
        $set: {
          page: String(req.body.page || "").trim(),
          userAgent: req.get("user-agent") || "",
          lastSeenAt: new Date()
        },
        $setOnInsert: { firstSeenAt: new Date() },
        $inc: { visits: 1 }
      },
      { upsert: true, new: true }
    );
    res.json({ ok: true, stored: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/payments/razorpay/config", (_req, res) => {
  res.json({
    provider: "razorpay",
    keyId: razorpayKeyId,
    merchantId: razorpayMerchantId,
    currency: "INR",
    storeName,
    serverOrdersEnabled: Boolean(razorpayKeySecret)
  });
});

app.post("/api/payments/razorpay/order", async (req, res, next) => {
  try {
    const amount = toRazorpayAmount(req.body.total);
    if (!amount || amount < 100) {
      res.status(400).json({ message: "A valid order total is required for Razorpay payment" });
      return;
    }

    const orderNumber = String(req.body.orderNumber || `ASCEND-${Math.floor(100000 + Math.random() * 900000)}`).trim().slice(0, 40);
    const customerEmail = String(req.body.customerEmail || "").trim().toLowerCase();
    const razorpayOrder = await createRazorpayOrder({ amount, orderNumber, customerEmail });

    res.status(201).json({
      provider: "razorpay",
      keyId: razorpayKeyId,
      merchantId: razorpayMerchantId,
      currency: "INR",
      amount,
      orderNumber,
      razorpayOrderId: razorpayOrder?.id || "",
      serverOrder: Boolean(razorpayOrder?.id)
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/orders", async (req, res, next) => {
  try {
    const order = sanitizeOrder(req.body);
    if (order.payment?.provider === "razorpay" && razorpayKeySecret && order.payment.razorpayOrderId) {
      const verified = verifyRazorpaySignature(order.payment);
      if (!verified) {
        res.status(400).json({ message: "Razorpay payment verification failed" });
        return;
      }
      order.payment.verified = true;
    }
    if (order.payment?.razorpayPaymentId) {
      order.payment.status = "paid";
    }
    if (!mongoReady) {
      res.json({ order, stored: false });
      return;
    }
    const created = await Order.create(order);
    res.status(201).json({ order: shapeOrders([created])[0], stored: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/products/:slug", async (req, res, next) => {
  try {
    const products = await readProducts({});
    const product = products.find((item) => item.slug === req.params.slug);
    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }
    res.json({ product });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/login", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!mongoReady) {
      if (canUseFallbackAdmin(email, password)) {
        const admin = { email, name: "Store Admin" };
        res.json({
          token: signAdminToken(admin),
          admin,
          mode: "seed-data",
          message: "MongoDB is not connected. Dashboard is available in seed-data mode.",
          mongo: mongoStatus
        });
        return;
      }

      res.status(503).json({
        message: "MongoDB is not connected. Use the configured admin credentials, then check Render MONGODB_URI and Atlas Network Access.",
        mongo: mongoStatus
      });
      return;
    }

    const admin = await Admin.findOne({ email });
    if (!admin || !verifyPassword(password, admin.salt, admin.passwordHash)) {
      res.status(401).json({ message: "Invalid admin credentials" });
      return;
    }

    res.json({
      token: signAdminToken(admin),
      admin: { email: admin.email, name: admin.name }
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/overview", requireAdmin, async (_req, res, next) => {
  try {
    const products = mongoReady ? await Product.find({}).lean() : seedProducts;
    const customers = mongoReady ? await Customer.find({}).sort({ updatedAt: -1 }).limit(8).lean() : [];
    const testimonialItems = mongoReady ? await Testimonial.find({}).sort({ updatedAt: -1 }).limit(6).lean() : seedTestimonials;
    const orderItems = mongoReady ? await Order.find({}).sort({ updatedAt: -1 }).limit(6).lean() : [];
    const activeSince = new Date(Date.now() - 15 * 60 * 1000);
    const brands = mongoReady ? await Brand.countDocuments({ active: { $ne: false } }) : new Set(products.map((product) => product.brand).filter(Boolean)).size;
    const categories = mongoReady ? await Category.countDocuments({ active: { $ne: false } }) : new Set(products.map((product) => product.category).filter(Boolean)).size;
    const totalInventory = products.reduce((sum, product) => sum + Number(product.inventory || 0), 0);
    const inventoryValue = products.reduce((sum, product) => sum + Number(product.inventory || 0) * Number(product.price || 0), 0);
    const revenue = orderItems.reduce((sum, order) => sum + Number(order.total || 0), 0);
    res.json({
      stats: {
        products: products.length,
        customers: mongoReady ? await Customer.countDocuments() : 0,
        orders: mongoReady ? await Order.countDocuments() : 0,
        coupons: mongoReady ? await Coupon.countDocuments() : 0,
        visitors: mongoReady ? await Visitor.countDocuments() : 0,
        activeVisitors: mongoReady ? await Visitor.countDocuments({ lastSeenAt: { $gte: activeSince } }) : 0,
        brands,
        categories,
        featured: products.filter((product) => product.featured).length,
        testimonials: mongoReady ? await Testimonial.countDocuments() : seedTestimonials.length,
        revenue,
        totalInventory,
        inventoryValue
      },
      recentProducts: shapeProducts(products.slice(0, 6)),
      recentOrders: shapeOrders(orderItems),
      recentTestimonials: shapeTestimonials(testimonialItems.slice(0, 6)),
      recentCustomers: customers.map((customer) => ({
        id: String(customer._id),
        name: customer.name,
        email: customer.email,
        joined: customer.joined,
        lastSeenAt: customer.lastSeenAt,
        createdAt: customer.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/testimonials", requireAdmin, async (_req, res, next) => {
  try {
    const testimonials = mongoReady ? await Testimonial.find({}).sort({ updatedAt: -1 }).lean() : seedTestimonials;
    res.json({ testimonials: shapeTestimonials(testimonials), count: testimonials.length });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/products", requireAdmin, async (_req, res, next) => {
  try {
    const products = mongoReady ? await Product.find({}).sort({ updatedAt: -1 }).lean() : seedProducts;
    res.json({ products: shapeProducts(products), count: products.length });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/categories", requireAdmin, async (_req, res, next) => {
  try {
    const products = mongoReady ? shapeProducts(await Product.find({}).lean()) : shapeProducts(seedProducts);
    if (!mongoReady) {
      const categories = await readCategories(products);
      res.json({ categories, count: categories.length });
      return;
    }
    const categories = await Category.find({}).sort({ name: 1 }).lean();
    res.json({ categories: shapeCategories(categories, products), count: categories.length });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/categories", requireAdmin, async (req, res, next) => {
  try {
    if (!mongoReady) {
      res.status(503).json({ message: "MongoDB is required for admin category updates" });
      return;
    }
    const category = sanitizeCategory(req.body);
    const message = validateCategory(category);
    if (message) {
      res.status(400).json({ message });
      return;
    }
    const created = await Category.create(category);
    const products = shapeProducts(await Product.find({}).lean());
    res.status(201).json({ category: shapeCategories([created], products)[0] });
  } catch (error) {
    next(error);
  }
});

app.put("/api/admin/categories/:id", requireAdmin, async (req, res, next) => {
  try {
    if (!mongoReady) {
      res.status(503).json({ message: "MongoDB is required for admin category updates" });
      return;
    }
    const category = sanitizeCategory(req.body);
    const message = validateCategory(category);
    if (message) {
      res.status(400).json({ message });
      return;
    }
    const previous = await Category.findById(req.params.id).lean();
    const updated = await Category.findByIdAndUpdate(req.params.id, category, { new: true, runValidators: true });
    if (!updated) {
      res.status(404).json({ message: "Category not found" });
      return;
    }
    if (previous?.name && previous.name !== updated.name) {
      await Product.updateMany({ category: previous.name }, { $set: { category: updated.name } });
    }
    const products = shapeProducts(await Product.find({}).lean());
    res.json({ category: shapeCategories([updated], products)[0] });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/categories/:id", requireAdmin, async (req, res, next) => {
  try {
    if (!mongoReady) {
      res.status(503).json({ message: "MongoDB is required for admin category updates" });
      return;
    }
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json({ message: "Category not found" });
      return;
    }
    await Product.updateMany({ category: deleted.name }, { $set: { category: "Uncategorized" } });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/brands", requireAdmin, async (_req, res, next) => {
  try {
    const products = mongoReady ? shapeProducts(await Product.find({}).lean()) : shapeProducts(seedProducts);
    if (!mongoReady) {
      const brands = await readBrands(products);
      res.json({ brands, count: brands.length });
      return;
    }
    const brands = await Brand.find({}).sort({ name: 1 }).lean();
    res.json({ brands: shapeBrands(brands, products), count: brands.length });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/brands", requireAdmin, async (req, res, next) => {
  try {
    if (!mongoReady) {
      res.status(503).json({ message: "MongoDB is required for admin brand updates" });
      return;
    }
    const brand = sanitizeBrand(req.body);
    const message = validateBrand(brand);
    if (message) {
      res.status(400).json({ message });
      return;
    }
    const created = await Brand.create(brand);
    const products = shapeProducts(await Product.find({}).lean());
    res.status(201).json({ brand: shapeBrands([created], products)[0] });
  } catch (error) {
    next(error);
  }
});

app.put("/api/admin/brands/:id", requireAdmin, async (req, res, next) => {
  try {
    if (!mongoReady) {
      res.status(503).json({ message: "MongoDB is required for admin brand updates" });
      return;
    }
    const brand = sanitizeBrand(req.body);
    const message = validateBrand(brand);
    if (message) {
      res.status(400).json({ message });
      return;
    }
    const previous = await Brand.findById(req.params.id).lean();
    const updated = await Brand.findByIdAndUpdate(req.params.id, brand, { new: true, runValidators: true });
    if (!updated) {
      res.status(404).json({ message: "Brand not found" });
      return;
    }
    if (previous?.name && previous.name !== updated.name) {
      await Product.updateMany({ brand: previous.name }, { $set: { brand: updated.name } });
    }
    const products = shapeProducts(await Product.find({}).lean());
    res.json({ brand: shapeBrands([updated], products)[0] });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/brands/:id", requireAdmin, async (req, res, next) => {
  try {
    if (!mongoReady) {
      res.status(503).json({ message: "MongoDB is required for admin brand updates" });
      return;
    }
    const deleted = await Brand.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json({ message: "Brand not found" });
      return;
    }
    await Product.updateMany({ brand: deleted.name }, { $set: { brand: "Unbranded" } });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/customers", requireAdmin, async (_req, res, next) => {
  try {
    const customers = mongoReady ? await Customer.find({}).sort({ updatedAt: -1 }).lean() : [];
    res.json({
      customers: customers.map((customer) => ({
        id: String(customer._id),
        name: customer.name,
        email: customer.email,
        joined: customer.joined,
        lastSeenAt: customer.lastSeenAt,
        createdAt: customer.createdAt
      })),
      count: customers.length
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/orders", requireAdmin, async (_req, res, next) => {
  try {
    const orders = mongoReady ? await Order.find({}).sort({ updatedAt: -1 }).lean() : [];
    res.json({ orders: shapeOrders(orders), count: orders.length });
  } catch (error) {
    next(error);
  }
});

app.put("/api/admin/orders/:id/status", requireAdmin, async (req, res, next) => {
  try {
    if (!mongoReady) {
      res.status(503).json({ message: "MongoDB is required for admin order updates" });
      return;
    }
    const updated = await Order.findByIdAndUpdate(req.params.id, { status: String(req.body.status || "Processing").trim() }, { new: true });
    if (!updated) {
      res.status(404).json({ message: "Order not found" });
      return;
    }
    res.json({ order: shapeOrders([updated])[0] });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/coupons", requireAdmin, async (_req, res, next) => {
  try {
    const coupons = mongoReady ? await Coupon.find({}).sort({ updatedAt: -1 }).lean() : [];
    res.json({ coupons: shapeCoupons(coupons), count: coupons.length });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/visitors", requireAdmin, async (_req, res, next) => {
  try {
    if (!mongoReady) {
      res.json({ visitors: [], stats: { total: 0, active: 0, inactive: 0 } });
      return;
    }
    const activeSince = new Date(Date.now() - 15 * 60 * 1000);
    const visitors = await Visitor.find({}).sort({ lastSeenAt: -1 }).limit(100).lean();
    const total = await Visitor.countDocuments();
    const active = await Visitor.countDocuments({ lastSeenAt: { $gte: activeSince } });
    res.json({
      visitors: visitors.map((visitor) => ({
        id: String(visitor._id),
        visitorId: visitor.visitorId,
        page: visitor.page,
        visits: visitor.visits,
        firstSeenAt: visitor.firstSeenAt,
        lastSeenAt: visitor.lastSeenAt,
        active: visitor.lastSeenAt >= activeSince
      })),
      stats: { total, active, inactive: Math.max(0, total - active) }
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/products", requireAdmin, async (req, res, next) => {
  try {
    if (!mongoReady) {
      res.status(503).json({ message: "MongoDB is required for admin product updates" });
      return;
    }
    const product = sanitizeProduct(req.body);
    const message = validateProduct(product);
    if (message) {
      res.status(400).json({ message });
      return;
    }
    const created = await Product.create(product);
    res.status(201).json({ product: shapeProducts([created])[0] });
  } catch (error) {
    next(error);
  }
});

app.put("/api/admin/products/:id", requireAdmin, async (req, res, next) => {
  try {
    if (!mongoReady) {
      res.status(503).json({ message: "MongoDB is required for admin product updates" });
      return;
    }
    const product = sanitizeProduct(req.body);
    const message = validateProduct(product);
    if (message) {
      res.status(400).json({ message });
      return;
    }
    const updated = await Product.findByIdAndUpdate(req.params.id, product, { new: true, runValidators: true });
    if (!updated) {
      res.status(404).json({ message: "Product not found" });
      return;
    }
    res.json({ product: shapeProducts([updated])[0] });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/products/:id", requireAdmin, async (req, res, next) => {
  try {
    if (!mongoReady) {
      res.status(503).json({ message: "MongoDB is required for admin product updates" });
      return;
    }
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json({ message: "Product not found" });
      return;
    }
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/coupons", requireAdmin, async (req, res, next) => {
  try {
    if (!mongoReady) {
      res.status(503).json({ message: "MongoDB is required for admin coupon updates" });
      return;
    }
    const coupon = sanitizeCoupon(req.body);
    const message = validateCoupon(coupon);
    if (message) {
      res.status(400).json({ message });
      return;
    }
    const created = await Coupon.create(coupon);
    res.status(201).json({ coupon: shapeCoupons([created])[0] });
  } catch (error) {
    next(error);
  }
});

app.put("/api/admin/coupons/:id", requireAdmin, async (req, res, next) => {
  try {
    if (!mongoReady) {
      res.status(503).json({ message: "MongoDB is required for admin coupon updates" });
      return;
    }
    const coupon = sanitizeCoupon(req.body);
    const message = validateCoupon(coupon);
    if (message) {
      res.status(400).json({ message });
      return;
    }
    const updated = await Coupon.findByIdAndUpdate(req.params.id, coupon, { new: true, runValidators: true });
    if (!updated) {
      res.status(404).json({ message: "Coupon not found" });
      return;
    }
    res.json({ coupon: shapeCoupons([updated])[0] });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/coupons/:id", requireAdmin, async (req, res, next) => {
  try {
    if (!mongoReady) {
      res.status(503).json({ message: "MongoDB is required for admin coupon updates" });
      return;
    }
    const deleted = await Coupon.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json({ message: "Coupon not found" });
      return;
    }
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/testimonials", requireAdmin, async (req, res, next) => {
  try {
    if (!mongoReady) {
      res.status(503).json({ message: "MongoDB is required for admin review updates" });
      return;
    }
    const testimonial = sanitizeTestimonial(req.body);
    const message = validateTestimonial(testimonial);
    if (message) {
      res.status(400).json({ message });
      return;
    }
    const created = await Testimonial.create(testimonial);
    res.status(201).json({ testimonial: shapeTestimonials([created])[0] });
  } catch (error) {
    next(error);
  }
});

app.put("/api/admin/testimonials/:id", requireAdmin, async (req, res, next) => {
  try {
    if (!mongoReady) {
      res.status(503).json({ message: "MongoDB is required for admin review updates" });
      return;
    }
    const testimonial = sanitizeTestimonial(req.body);
    const message = validateTestimonial(testimonial);
    if (message) {
      res.status(400).json({ message });
      return;
    }
    const updated = await Testimonial.findByIdAndUpdate(req.params.id, testimonial, { new: true, runValidators: true });
    if (!updated) {
      res.status(404).json({ message: "Review not found" });
      return;
    }
    res.json({ testimonial: shapeTestimonials([updated])[0] });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/testimonials/:id", requireAdmin, async (req, res, next) => {
  try {
    if (!mongoReady) {
      res.status(503).json({ message: "MongoDB is required for admin review updates" });
      return;
    }
    const deleted = await Testimonial.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json({ message: "Review not found" });
      return;
    }
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/settings", requireAdmin, async (_req, res, next) => {
  try {
    const settings = mongoReady ? await SiteSettings.findOne({ key: "main" }).lean() : defaultSiteSettings;
    res.json({ settings: settings || defaultSiteSettings });
  } catch (error) {
    next(error);
  }
});

app.put("/api/admin/settings", requireAdmin, async (req, res, next) => {
  try {
    if (!mongoReady) {
      res.status(503).json({ message: "MongoDB is required for admin settings updates" });
      return;
    }
    const settings = sanitizeSettings(req.body);
    const updated = await SiteSettings.findOneAndUpdate({ key: "main" }, settings, { new: true, upsert: true, runValidators: true });
    res.json({ settings: updated });
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "Server error" });
});

connectMongo()
  .catch((error) => {
    mongoReady = false;
    mongoStatus = {
      configured: Boolean(process.env.MONGODB_URI),
      database: "seed-data",
      message: error.message || "MongoDB connection failed"
    };
    console.error("MongoDB connection failed. Falling back to seeded data.", error.message);
  })
  .finally(() => {
    app.listen(port, () => {
      console.log(`${storeName} API running on http://localhost:${port}`);
    });
  });
