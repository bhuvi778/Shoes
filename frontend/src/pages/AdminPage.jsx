import {
  BarChart3,
  Boxes,
  Image,
  LayoutDashboard,
  LogOut,
  PackagePlus,
  Plus,
  Save,
  ShoppingBag,
  Store,
  Trash2,
  Users,
  Video
} from "lucide-react";
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
    videoPoster: "",
    mediaItems: []
  },
  theme: {
    background: "#171717",
    panel: "#202020"
  }
};

const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "storefront", label: "Storefront", icon: Store },
  { id: "products", label: "Products", icon: ShoppingBag },
  { id: "customers", label: "Customers", icon: Users }
];

const emptyHeroSlide = {
  type: "image",
  url: "",
  mobileUrl: "",
  poster: ""
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
  const [section, setSection] = useState("overview");
  const [overview, setOverview] = useState(null);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [settings, setSettings] = useState(defaultSettings);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedProduct = useMemo(() => products.find((product) => product.id === productForm.id), [productForm.id, products]);

  useEffect(() => {
    if (token) loadAdminData(token);
  }, [token]);

  async function adminFetch(path, options = {}, nextToken = token) {
    const response = await fetch(apiPath(path), {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${nextToken}`,
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
      const [overviewData, productData, settingsData, customerData] = await Promise.all([
        adminFetch("/api/admin/overview", {}, nextToken),
        adminFetch("/api/admin/products", {}, nextToken),
        adminFetch("/api/admin/settings", {}, nextToken),
        adminFetch("/api/admin/customers", {}, nextToken)
      ]);
      setOverview(overviewData);
      setProducts(productData.products || []);
      setSettings(settingsData.settings || defaultSettings);
      setCustomers(customerData.customers || []);
      setMessage("Dashboard data synced.");
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
      setMessage(data.message || `Signed in as ${data.admin.email}`);
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
    setCustomers([]);
    setOverview(null);
    setProductForm(emptyProduct);
  }

  function readMediaFile(file, onReady) {
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) {
      setMessage("File is too large. Use a hosted URL for videos larger than 12MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => onReady(String(reader.result || ""));
    reader.onerror = () => setMessage("Could not read selected media file.");
    reader.readAsDataURL(file);
  }

  function getHeroSlides() {
    const items = Array.isArray(settings.hero?.mediaItems) && settings.hero.mediaItems.length > 0
      ? settings.hero.mediaItems
      : [
          {
            type: settings.hero?.mediaType || "image",
            url: settings.hero?.mediaUrl || "",
            mobileUrl: settings.hero?.mobileMediaUrl || "",
            poster: settings.hero?.videoPoster || ""
          }
        ];
    return items.length ? items : [{ ...emptyHeroSlide }];
  }

  function updateHeroSlide(index, patch) {
    const slides = getHeroSlides().map((slide, slideIndex) => (slideIndex === index ? { ...slide, ...patch } : slide));
    setSettings((current) => ({
      ...current,
      hero: {
        ...current.hero,
        mediaType: slides[0]?.type || "image",
        mediaUrl: slides[0]?.url || "",
        mobileMediaUrl: slides[0]?.mobileUrl || "",
        videoPoster: slides[0]?.poster || "",
        mediaItems: slides
      }
    }));
  }

  function addHeroSlide() {
    const slides = [...getHeroSlides(), { ...emptyHeroSlide }];
    setSettings((current) => ({
      ...current,
      hero: {
        ...current.hero,
        mediaItems: slides
      }
    }));
  }

  function removeHeroSlide(index) {
    const slides = getHeroSlides().filter((_, slideIndex) => slideIndex !== index);
    const nextSlides = slides.length ? slides : [{ ...emptyHeroSlide }];
    setSettings((current) => ({
      ...current,
      hero: {
        ...current.hero,
        mediaType: nextSlides[0]?.type || "image",
        mediaUrl: nextSlides[0]?.url || "",
        mobileMediaUrl: nextSlides[0]?.mobileUrl || "",
        videoPoster: nextSlides[0]?.poster || "",
        mediaItems: nextSlides
      }
    }));
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
      await loadAdminData();
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

  function renderOverview() {
    const stats = overview?.stats || {};
    const cards = [
      { label: "Products", value: stats.products || 0, icon: ShoppingBag },
      { label: "Customers", value: stats.customers || 0, icon: Users },
      { label: "Brands", value: stats.brands || 0, icon: Boxes },
      { label: "Inventory value", value: inr(stats.inventoryValue || 0), icon: BarChart3 }
    ];

    return (
      <>
        <section className="admin-metrics">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <article className="admin-metric" key={card.label}>
                <Icon />
                <strong>{card.value}</strong>
                <span>{card.label}</span>
              </article>
            );
          })}
        </section>
        <section className="admin-overview-grid">
          <div className="admin-card">
            <div className="admin-card-title">
              <ShoppingBag />
              <h2>Recent products</h2>
            </div>
            <div className="admin-products compact">
              {(overview?.recentProducts || products.slice(0, 6)).map((product) => (
                <article className="admin-product-row" key={product.id}>
                  <img src={product.image} alt="" />
                  <div>
                    <strong>{product.name}</strong>
                    <span>{product.brand} | {product.category} | {inr(product.price)}</span>
                  </div>
                  <button className="dash-ghost" type="button" onClick={() => { setProductForm(toFormProduct(product)); setSection("products"); }}>
                    Edit
                  </button>
                </article>
              ))}
            </div>
          </div>
          <div className="admin-card">
            <div className="admin-card-title">
              <Users />
              <h2>Recent customers</h2>
            </div>
            <div className="admin-customer-list compact">
              {(overview?.recentCustomers || customers.slice(0, 6)).map((customer) => (
                <article className="admin-customer-row" key={customer.id || customer.email}>
                  <span>{(customer.name || customer.email || "?").slice(0, 1).toUpperCase()}</span>
                  <div>
                    <strong>{customer.name}</strong>
                    <em>{customer.email}</em>
                  </div>
                </article>
              ))}
              {(overview?.recentCustomers || customers).length === 0 && <p className="admin-empty">No registered customers yet.</p>}
            </div>
          </div>
        </section>
      </>
    );
  }

  function renderStorefront() {
    const heroSlides = getHeroSlides();

    return (
      <form className="admin-storefront-grid" onSubmit={saveSettings}>
        <section className="admin-card admin-form">
          <div className="admin-card-title">
            <Store />
            <h2>Content and theme</h2>
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
              <span>Primary CTA</span>
              <input value={settings.hero?.primaryCta || ""} onChange={(event) => setSettings((current) => ({ ...current, hero: { ...current.hero, primaryCta: event.target.value } }))} />
            </label>
            <label>
              <span>Secondary CTA</span>
              <input value={settings.hero?.secondaryCta || ""} onChange={(event) => setSettings((current) => ({ ...current, hero: { ...current.hero, secondaryCta: event.target.value } }))} />
            </label>
          </div>
          <div className="admin-two">
            <label>
              <span>Background color</span>
              <input value={settings.theme?.background || "#171717"} onChange={(event) => setSettings((current) => ({ ...current, theme: { ...current.theme, background: event.target.value } }))} />
            </label>
            <label>
              <span>Panel color</span>
              <input value={settings.theme?.panel || "#202020"} onChange={(event) => setSettings((current) => ({ ...current, theme: { ...current.theme, panel: event.target.value } }))} />
            </label>
          </div>
          <button className="checkout-button" type="submit" disabled={loading}>
            <Save />
            Save Storefront
          </button>
        </section>

        <section className="admin-card admin-form">
          <div className="admin-card-title">
            <Video />
            <h2>Hero media slider</h2>
          </div>
          <p className="admin-help">Add multiple hero slides. Each slide can be an image or a video. Mobile image is optional; videos can use a poster image.</p>
          <div className="admin-hero-slides">
            {heroSlides.map((slide, index) => (
              <article className="admin-hero-slide" key={index}>
                <div className="admin-hero-slide-head">
                  <strong>Slide {index + 1}</strong>
                  <button className="icon-button admin-delete" type="button" onClick={() => removeHeroSlide(index)} aria-label={`Remove slide ${index + 1}`}>
                    <Trash2 />
                  </button>
                </div>
                <div className="admin-two">
                  <label>
                    <span>Type</span>
                    <select value={slide.type || "image"} onChange={(event) => updateHeroSlide(index, { type: event.target.value })}>
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                    </select>
                  </label>
                  <label>
                    <span>Upload media up to 12MB</span>
                    <input
                      type="file"
                      accept="image/*,video/mp4,video/webm,video/ogg"
                      onChange={(event) =>
                        readMediaFile(event.target.files?.[0], (url) =>
                          updateHeroSlide(index, {
                            url,
                            type: event.target.files?.[0]?.type.startsWith("video/") ? "video" : "image"
                          })
                        )
                      }
                    />
                  </label>
                </div>
                <label>
                  <span>Image/video URL</span>
                  <input value={slide.url || ""} onChange={(event) => updateHeroSlide(index, { url: event.target.value })} />
                </label>
                <label>
                  <span>Mobile image URL optional</span>
                  <input value={slide.mobileUrl || ""} onChange={(event) => updateHeroSlide(index, { mobileUrl: event.target.value })} />
                </label>
                <label>
                  <span>Video poster URL optional</span>
                  <input value={slide.poster || ""} onChange={(event) => updateHeroSlide(index, { poster: event.target.value })} />
                </label>
                {slide.url && (
                  <div className="admin-media-preview">
                    {slide.type === "video" ? (
                      <video src={slide.url} poster={slide.poster || slide.mobileUrl} muted loop playsInline controls />
                    ) : (
                      <img src={slide.url} alt="" />
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
          <button className="dash-ghost" type="button" onClick={addHeroSlide}>
            <Plus />
            Add slide
          </button>
        </section>
      </form>
    );
  }

  function renderProducts() {
    return (
      <section className="admin-product-workspace">
        <form className="admin-card admin-form" onSubmit={saveProduct}>
          <div className="admin-card-title">
            <PackagePlus />
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

        <section className="admin-card product-admin-list">
          <div className="admin-card-title">
            <Image />
            <h2>Catalog</h2>
          </div>
          <div className="admin-products">
            {products.map((product) => (
              <article className="admin-product-row" key={product.id}>
                <img src={product.image} alt="" />
                <div>
                  <strong>{product.name}</strong>
                  <span>{product.brand} | {product.category} | {inr(product.price)}</span>
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
      </section>
    );
  }

  function renderCustomers() {
    return (
      <section className="admin-card">
        <div className="admin-card-title">
          <Users />
          <h2>Registered customers</h2>
        </div>
        <div className="admin-customer-table">
          {customers.map((customer) => (
            <article className="admin-customer-row" key={customer.id || customer.email}>
              <span>{(customer.name || customer.email || "?").slice(0, 1).toUpperCase()}</span>
              <div>
                <strong>{customer.name}</strong>
                <em>{customer.email}</em>
              </div>
              <small>{customer.joined || "Joined date not available"}</small>
            </article>
          ))}
          {customers.length === 0 && <p className="admin-empty">No registered customers yet. Customer sign-ins will appear here after MongoDB is connected.</p>}
        </div>
      </section>
    );
  }

  function renderSection() {
    if (section === "storefront") return renderStorefront();
    if (section === "products") return renderProducts();
    if (section === "customers") return renderCustomers();
    return renderOverview();
  }

  if (!token) {
    return (
      <main className="admin-portal auth-only">
        <section className="admin-login">
          <p className="eyebrow">Qadam Admin</p>
          <h1>Sign in to manage the store.</h1>
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
    <main className="admin-portal">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <strong>Qadam</strong>
          <span>Commerce Control</span>
        </div>
        <nav aria-label="Admin navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button className={section === item.id ? "is-active" : ""} type="button" key={item.id} onClick={() => setSection(item.id)}>
                <Icon />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <button className="admin-logout" type="button" onClick={logout}>
          <LogOut />
          Logout
        </button>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="eyebrow">Admin Dashboard</p>
            <h1>{navItems.find((item) => item.id === section)?.label || "Overview"}</h1>
          </div>
          <div className="admin-top-actions">
            <a className="dash-ghost" href="/" target="_blank" rel="noreferrer">
              View storefront
            </a>
            <button className="dash-ghost" type="button" onClick={() => loadAdminData()}>
              Refresh
            </button>
          </div>
        </header>

        {message && <p className="admin-message">{message}</p>}
        {renderSection()}
      </section>
    </main>
  );
}
