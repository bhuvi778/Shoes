import cors from "cors";
import crypto from "crypto";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import { seedProducts, testimonials } from "./products.js";

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
const adminEmail = process.env.ADMIN_EMAIL || "admin@qadam.store";
const adminPassword = process.env.ADMIN_PASSWORD || "Qadam@2026";
const adminTokenSecret = process.env.ADMIN_TOKEN_SECRET || "change-this-secret-in-render";

let mongoReady = false;

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
    videoPoster: ""
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
    brand: { type: String, default: "Qadam" },
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
      videoPoster: String
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

const SiteSettings = mongoose.model("SiteSettings", siteSettingsSchema);
const Admin = mongoose.model("Admin", adminSchema);
const Customer = mongoose.model("Customer", customerSchema);

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

function sanitizeProduct(body) {
  const image = String(body.image || body.images?.[0] || "").trim();
  return {
    name: String(body.name || "").trim(),
    slug: String(body.slug || body.name || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, ""),
    brand: String(body.brand || "Qadam").trim(),
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
    featured: Boolean(body.featured)
  };
}

function validateProduct(product) {
  const missing = ["name", "slug", "color", "category", "price", "image"].filter((key) => !product[key]);
  if (missing.length > 0) return `Missing required product fields: ${missing.join(", ")}`;
  return "";
}

function sanitizeSettings(body) {
  return {
    key: "main",
    hero: {
      eyebrow: String(body.hero?.eyebrow || defaultSiteSettings.hero.eyebrow).trim(),
      title: String(body.hero?.title || defaultSiteSettings.hero.title).trim(),
      text: String(body.hero?.text || defaultSiteSettings.hero.text).trim(),
      primaryCta: String(body.hero?.primaryCta || defaultSiteSettings.hero.primaryCta).trim(),
      secondaryCta: String(body.hero?.secondaryCta || defaultSiteSettings.hero.secondaryCta).trim(),
      mediaType: body.hero?.mediaType === "video" ? "video" : "image",
      mediaUrl: String(body.hero?.mediaUrl || defaultSiteSettings.hero.mediaUrl).trim(),
      mobileMediaUrl: String(body.hero?.mobileMediaUrl || "").trim(),
      videoPoster: String(body.hero?.videoPoster || "").trim()
    },
    theme: {
      background: String(body.theme?.background || defaultSiteSettings.theme.background).trim(),
      panel: String(body.theme?.panel || defaultSiteSettings.theme.panel).trim()
    }
  };
}

app.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "qadam-shoe-store-api",
    message: "Backend is running. Use /api/health, /api/products, /api/brands, or /api/testimonials.",
    database: mongoReady ? "mongodb" : "seed-data"
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
      featured: item.featured
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

async function readProducts(query) {
  if (!mongoReady) {
    return applyFilters(shapeProducts(seedProducts), query);
  }

  const products = await Product.find({}).lean();
  return applyFilters(shapeProducts(products), query);
}

async function connectMongo() {
  if (!process.env.MONGODB_URI) {
    console.log("MONGODB_URI not set. Using seeded in-memory product data for local development.");
    return;
  }

  await mongoose.connect(process.env.MONGODB_URI);
  mongoReady = true;

  const count = await Product.countDocuments();
  if (count === 0) {
    await Product.insertMany(seedProducts);
    console.log("MongoDB connected and product catalog seeded.");
  }

  await SiteSettings.updateOne({ key: "main" }, { $setOnInsert: defaultSiteSettings }, { upsert: true });
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
    service: "qadam-shoe-store-api",
    database: mongoReady ? "mongodb" : "seed-data"
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
    const categories = [...new Set(products.map((product) => product.category))].sort().map((category) => {
      const categoryProducts = products.filter((product) => product.category === category);
      const heroProduct = categoryProducts.find((product) => product.categoryImage) || categoryProducts.find((product) => product.featured) || categoryProducts[0];
      return {
        name: category,
        count: categoryProducts.length,
        image: heroProduct?.categoryImage || heroProduct?.image,
        fromPrice: Math.min(...categoryProducts.map((product) => product.price))
      };
    });
    res.json({ categories, count: categories.length });
  } catch (error) {
    next(error);
  }
});

app.get("/api/brands", async (req, res, next) => {
  try {
    const products = await readProducts({});
    const brands = [...new Set(products.map((product) => product.brand))].sort().map((brand) => {
      const brandProducts = products.filter((product) => product.brand === brand);
      const heroProduct = brandProducts.find((product) => product.brandImage) || brandProducts.find((product) => product.featured) || brandProducts[0];
      return {
        name: brand,
        count: brandProducts.length,
        image: heroProduct?.brandImage || heroProduct?.image,
        fromPrice: Math.min(...brandProducts.map((product) => product.price))
      };
    });
    res.json({ brands, count: brands.length });
  } catch (error) {
    next(error);
  }
});

app.get("/api/testimonials", (_req, res) => {
  res.json({ testimonials, count: testimonials.length });
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
      if (email === adminEmail.toLowerCase() && password === adminPassword) {
        const admin = { email: adminEmail, name: "Store Admin" };
        res.json({
          token: signAdminToken(admin),
          admin,
          mode: "seed-data",
          message: "MongoDB is not connected. Dashboard is available in read-only seed-data mode."
        });
        return;
      }

      res.status(503).json({ message: "MongoDB is not connected. Check Render MONGODB_URI and Atlas Network Access." });
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
    const brands = new Set(products.map((product) => product.brand).filter(Boolean));
    const categories = new Set(products.map((product) => product.category).filter(Boolean));
    const totalInventory = products.reduce((sum, product) => sum + Number(product.inventory || 0), 0);
    const inventoryValue = products.reduce((sum, product) => sum + Number(product.inventory || 0) * Number(product.price || 0), 0);
    res.json({
      stats: {
        products: products.length,
        customers: mongoReady ? await Customer.countDocuments() : 0,
        brands: brands.size,
        categories: categories.size,
        featured: products.filter((product) => product.featured).length,
        totalInventory,
        inventoryValue
      },
      recentProducts: shapeProducts(products.slice(0, 6)),
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

app.get("/api/admin/products", requireAdmin, async (_req, res, next) => {
  try {
    const products = mongoReady ? await Product.find({}).sort({ updatedAt: -1 }).lean() : seedProducts;
    res.json({ products: shapeProducts(products), count: products.length });
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
    console.error("MongoDB connection failed. Falling back to seeded data.", error.message);
  })
  .finally(() => {
    app.listen(port, () => {
      console.log(`Qadam API running on http://localhost:${port}`);
    });
  });
