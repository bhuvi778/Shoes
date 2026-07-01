import cors from "cors";
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

let mongoReady = false;

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
    description: String,
    featured: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

app.use(express.json());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || clientUrls.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true
  })
);

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
    return;
  }

  console.log("MongoDB connected.");
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "qadam-shoe-store-api",
    database: mongoReady ? "mongodb" : "seed-data"
  });
});

app.get("/api/products", async (req, res, next) => {
  try {
    const products = await readProducts(req.query);
    res.json({ products, count: products.length });
  } catch (error) {
    next(error);
  }
});

app.get("/api/brands", async (req, res, next) => {
  try {
    const products = await readProducts({});
    const brands = [...new Set(products.map((product) => product.brand))].sort().map((brand) => {
      const brandProducts = products.filter((product) => product.brand === brand);
      const heroProduct = brandProducts.find((product) => product.featured) || brandProducts[0];
      return {
        name: brand,
        count: brandProducts.length,
        image: heroProduct?.image,
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
