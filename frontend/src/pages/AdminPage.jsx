import { Image, LogOut, Plus, Save, Trash2, Video } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiPath } from "../lib/api.js";
import { inr } from "../lib/format.js";

const emptyProduct = {
  id: "",
  name: "",
  slug: "",
  brand: "",
  color: "",
  category: "Casual",
  price: "",
  oldPrice: "",
  badge: "",
  rating: 4.5,
  reviewCount: 0,
  inventory: 0,
  sizesText: "6, 7, 8, 9, 10",
  image: "",
  imagesText: "",
  brandImage: "",
  categoryImage: "",
  description: "",
  featured: false
};

const defaultSettings = {
  hero: {
    eyebrow: "",
    title: "",
    text: "",
    primaryCta: "Shop Now",
    secondaryCta: "Explore brands",
    mediaType: "image",
    mediaUrl: "",
    mobileMediaUrl: "",
    videoPoster: ""
  },
  theme: {
    background: "#171717",
    panel: "#202020"
  }
};

function toFormProduct(product) {
  return {
    ...emptyProduct,
    ...product,
    oldPrice: product.oldPrice || "",
    sizesText: (product.sizes || []).join(", "),
    imagesText: (product.images?.length ? product.images : [product.image]).filter(Boolean).join("\n")
  };
}

function fromFormProduct(product) {
  const images = product.imagesText
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean);

  return {
    ...product,
    price: Number(product.price),
    oldPrice: product.oldPrice ? Number(product.oldPrice) : undefined,
    rating: Number(product.rating),
    reviewCount: Number(product.reviewCount),
    inventory: Number(product.inventory),
    sizes: product.sizesText
      .split(",")
      .map((value) => Number(value.trim()))
      .filter(Boolean),
    image: product.image || images[0],
    images
  };
}

export default function AdminPage({ onDataChanged }) {
  const [token, setToken] = useState(() => localStorage.getItem("qadam_admin_token") || "");
  const [login, setLogin] = useState({ email: "admin@qadam.store", password: "" });
  const [products, setProducts] = useState([]);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [settings, setSettings] = useState(defaultSettings);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedProduct = useMemo(() => products.find((product) => product.id === productForm.id), [productForm.id, products]);

  useEffect(() => {
    if (token) loadAdminData(token);
  }, [token]);

  async function adminFetch(path, options = {}) {
    const response = await fetch(apiPath(path), {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
      }
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Admin request failed");
    return data;
  }

  async function loadAdminData(nextToken = token) {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${nextToken}` };
      const [productData, settingsData] = await Promise.all([
        fetch(apiPath("/api/admin/products"), { headers }).then((response) => response.json()),
        fetch(apiPath("/api/admin/settings"), { headers }).then((response) => response.json())
      ]);
      if (productData.message || settingsData.message) throw new Error(productData.message || settingsData.message);
      setProducts(productData.products || []);
      setSettings(settingsData.settings || defaultSettings);
      setMessage("Admin data loaded.");
    } catch (error) {
      setMessage(error.message);
      setToken("");
      localStorage.removeItem("qadam_admin_token");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(apiPath("/api/admin/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(login)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Login failed");
      localStorage.setItem("qadam_admin_token", data.token);
      setToken(data.token);
      setMessage(`Signed in as ${data.admin.email}`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("qadam_admin_token");
    setToken("");
    setProducts([]);
    setProductForm(emptyProduct);
  }

  async function saveSettings(event) {
    event.preventDefault();
    setLoading(true);
    try {
      await adminFetch("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify(settings)
      });
      setMessage("Storefront settings saved.");
      onDataChanged?.();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveProduct(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const payload = fromFormProduct(productForm);
      const path = productForm.id ? `/api/admin/products/${productForm.id}` : "/api/admin/products";
      const method = productForm.id ? "PUT" : "POST";
      await adminFetch(path, { method, body: JSON.stringify(payload) });
      setMessage(productForm.id ? "Product updated." : "Product created.");
      setProductForm(emptyProduct);
      await loadAdminData();
      onDataChanged?.();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteProduct(id) {
    if (!window.confirm("Delete this product?")) return;
    setLoading(true);
    try {
      await adminFetch(`/api/admin/products/${id}`, { method: "DELETE" });
      setMessage("Product deleted.");
      setProductForm(emptyProduct);
      await loadAdminData();
      onDataChanged?.();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <main className="page-shell admin-page">
        <section className="admin-login">
          <p className="eyebrow">Admin Panel</p>
          <h1>Manage storefront content.</h1>
          <form className="admin-form" onSubmit={handleLogin}>
            <label>
              <span>Email</span>
              <input type="email" value={login.email} onChange={(event) => setLogin((current) => ({ ...current, email: event.target.value }))} />
            </label>
            <label>
              <span>Password</span>
              <input
                type="password"
                value={login.password}
                onChange={(event) => setLogin((current) => ({ ...current, password: event.target.value }))}
              />
            </label>
            <button className="checkout-button" type="submit" disabled={loading}>
              Sign In
            </button>
          </form>
          {message && <p className="admin-message">{message}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell admin-page">
      <section className="admin-header">
        <div>
          <p className="eyebrow">Admin Panel</p>
          <h1>Storefront controls</h1>
          <p>Hero media, theme colors, product images, brand images, and category backgrounds are editable here.</p>
        </div>
        <button className="dash-ghost" type="button" onClick={logout}>
          <LogOut />
          Logout
        </button>
      </section>

      {message && <p className="admin-message">{message}</p>}

      <section className="admin-grid">
        <form className="admin-card admin-form" onSubmit={saveSettings}>
          <div className="admin-card-title">
            <Video />
            <h2>Hero and theme</h2>
          </div>
          <label>
            <span>Hero eyebrow</span>
            <input value={settings.hero?.eyebrow || ""} onChange={(event) => setSettings((current) => ({ ...current, hero: { ...current.hero, eyebrow: event.target.value } }))} />
          </label>
          <label>
            <span>Hero title</span>
            <input value={settings.hero?.title || ""} onChange={(event) => setSettings((current) => ({ ...current, hero: { ...current.hero, title: event.target.value } }))} />
          </label>
          <label>
            <span>Hero text</span>
            <textarea value={settings.hero?.text || ""} onChange={(event) => setSettings((current) => ({ ...current, hero: { ...current.hero, text: event.target.value } }))} />
          </label>
          <div className="admin-two">
            <label>
              <span>Media type</span>
              <select value={settings.hero?.mediaType || "image"} onChange={(event) => setSettings((current) => ({ ...current, hero: { ...current.hero, mediaType: event.target.value } }))}>
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </label>
            <label>
              <span>Background color</span>
              <input value={settings.theme?.background || "#171717"} onChange={(event) => setSettings((current) => ({ ...current, theme: { ...current.theme, background: event.target.value } }))} />
            </label>
          </div>
          <label>
            <span>Hero image/video URL</span>
            <input value={settings.hero?.mediaUrl || ""} onChange={(event) => setSettings((current) => ({ ...current, hero: { ...current.hero, mediaUrl: event.target.value } }))} />
          </label>
          <label>
            <span>Mobile hero image URL optional</span>
            <input value={settings.hero?.mobileMediaUrl || ""} onChange={(event) => setSettings((current) => ({ ...current, hero: { ...current.hero, mobileMediaUrl: event.target.value } }))} />
          </label>
          <label>
            <span>Video poster URL optional</span>
            <input value={settings.hero?.videoPoster || ""} onChange={(event) => setSettings((current) => ({ ...current, hero: { ...current.hero, videoPoster: event.target.value } }))} />
          </label>
          <button className="checkout-button" type="submit" disabled={loading}>
            <Save />
            Save Settings
          </button>
        </form>

        <form className="admin-card admin-form" onSubmit={saveProduct}>
          <div className="admin-card-title">
            <Image />
            <h2>{selectedProduct ? "Edit product" : "Add product"}</h2>
          </div>
          <div className="admin-two">
            <label>
              <span>Name</span>
              <input value={productForm.name} onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))} />
            </label>
            <label>
              <span>Slug</span>
              <input value={productForm.slug} onChange={(event) => setProductForm((current) => ({ ...current, slug: event.target.value }))} />
            </label>
          </div>
          <div className="admin-two">
            <label>
              <span>Brand</span>
              <input value={productForm.brand} onChange={(event) => setProductForm((current) => ({ ...current, brand: event.target.value }))} />
            </label>
            <label>
              <span>Category</span>
              <input value={productForm.category} onChange={(event) => setProductForm((current) => ({ ...current, category: event.target.value }))} />
            </label>
          </div>
          <div className="admin-three">
            <label>
              <span>Price</span>
              <input type="number" value={productForm.price} onChange={(event) => setProductForm((current) => ({ ...current, price: event.target.value }))} />
            </label>
            <label>
              <span>Old price</span>
              <input type="number" value={productForm.oldPrice} onChange={(event) => setProductForm((current) => ({ ...current, oldPrice: event.target.value }))} />
            </label>
            <label>
              <span>Inventory</span>
              <input type="number" value={productForm.inventory} onChange={(event) => setProductForm((current) => ({ ...current, inventory: event.target.value }))} />
            </label>
          </div>
          <div className="admin-three">
            <label>
              <span>Color</span>
              <input value={productForm.color} onChange={(event) => setProductForm((current) => ({ ...current, color: event.target.value }))} />
            </label>
            <label>
              <span>Badge</span>
              <input value={productForm.badge} onChange={(event) => setProductForm((current) => ({ ...current, badge: event.target.value }))} />
            </label>
            <label className="admin-check">
              <input type="checkbox" checked={productForm.featured} onChange={(event) => setProductForm((current) => ({ ...current, featured: event.target.checked }))} />
              <span>Featured</span>
            </label>
          </div>
          <label>
            <span>Main product image URL</span>
            <input value={productForm.image} onChange={(event) => setProductForm((current) => ({ ...current, image: event.target.value }))} />
          </label>
          <label>
            <span>Gallery image URLs one per line</span>
            <textarea value={productForm.imagesText} onChange={(event) => setProductForm((current) => ({ ...current, imagesText: event.target.value }))} />
          </label>
          <div className="admin-two">
            <label>
              <span>Brand card image URL</span>
              <input value={productForm.brandImage} onChange={(event) => setProductForm((current) => ({ ...current, brandImage: event.target.value }))} />
            </label>
            <label>
              <span>Category card image URL</span>
              <input value={productForm.categoryImage} onChange={(event) => setProductForm((current) => ({ ...current, categoryImage: event.target.value }))} />
            </label>
          </div>
          <label>
            <span>Sizes comma separated</span>
            <input value={productForm.sizesText} onChange={(event) => setProductForm((current) => ({ ...current, sizesText: event.target.value }))} />
          </label>
          <label>
            <span>Description</span>
            <textarea value={productForm.description} onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))} />
          </label>
          <div className="admin-actions">
            <button className="checkout-button" type="submit" disabled={loading}>
              <Save />
              Save Product
            </button>
            <button className="dash-ghost" type="button" onClick={() => setProductForm(emptyProduct)}>
              <Plus />
              New
            </button>
          </div>
        </form>
      </section>

      <section className="admin-card product-admin-list">
        <div className="admin-card-title">
          <Image />
          <h2>Products</h2>
        </div>
        <div className="admin-products">
          {products.map((product) => (
            <article className="admin-product-row" key={product.id}>
              <img src={product.image} alt="" />
              <div>
                <strong>{product.name}</strong>
                <span>{product.brand} · {product.category} · {inr(product.price)}</span>
              </div>
              <button className="dash-ghost" type="button" onClick={() => setProductForm(toFormProduct(product))}>
                Edit
              </button>
              <button className="icon-button admin-delete" type="button" onClick={() => deleteProduct(product.id)} aria-label={`Delete ${product.name}`}>
                <Trash2 />
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
