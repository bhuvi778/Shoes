import dotenv from "dotenv";
import mongoose from "mongoose";
import { seedProducts } from "./products.js";

dotenv.config();

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    brand: { type: String, default: "ASCEND" },
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

async function seed() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required to seed products.");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const result = await Product.bulkWrite(
    seedProducts.map((product) => ({
      updateOne: {
        filter: { slug: product.slug },
        update: { $set: product },
        upsert: true
      }
    }))
  );

  const count = await Product.countDocuments();
  console.log(
    `Seed complete. inserted=${result.upsertedCount}, modified=${result.modifiedCount}, matched=${result.matchedCount}, total=${count}`
  );
}

seed()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
