import { useEffect, useMemo, useRef, useState } from "react";
import { baseFilters } from "./lib/constants.js";
import { buildQuery } from "./lib/format.js";
import { apiPath } from "./lib/api.js";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import CartDrawer from "./components/CartDrawer.jsx";
import AuthModal from "./components/AuthModal.jsx";
import Toast from "./components/Toast.jsx";
import HomePage from "./pages/HomePage.jsx";
import CollectionPage from "./pages/CollectionPage.jsx";
import ProductDetailPage from "./pages/ProductDetailPage.jsx";
import FavoritesPage from "./pages/FavoritesPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";

const adminPortalEmail = (import.meta.env.VITE_ADMIN_EMAIL || "admin@qadam.store").toLowerCase();

function isAdminEmail(email) {
  return String(email || "").trim().toLowerCase() === adminPortalEmail;
}

export default function App() {
  const isAdminPortal = window.location.pathname.startsWith("/admin");
  const [page, setPage] = useState("home");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [filters, setFilters] = useState(baseFilters);
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categoryCards, setCategoryCards] = useState([]);
  const [siteSettings, setSiteSettings] = useState(null);
  const [testimonials, setTestimonials] = useState([]);
  const [status, setStatus] = useState("loading");
  const [favorites, setFavorites] = useState(() => new Set());
  const [cartItems, setCartItems] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const searchRef = useRef(null);

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("stryd_user")) || null;
    } catch {
      return null;
    }
  });
  const [orders, setOrders] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("stryd_orders")) || [];
    } catch {
      return [];
    }
  });
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authIntent, setAuthIntent] = useState(null);
  const [dashSection, setDashSection] = useState("overview");
  const [toast, setToast] = useState("");

  const query = useMemo(() => buildQuery(filters), [filters]);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const favoriteProducts = allProducts.filter((product) => favorites.has(product.id));
  const similarProducts = selectedProduct
    ? allProducts
        .filter((product) => product.id !== selectedProduct.id)
        .filter((product) => product.category === selectedProduct.category || product.brand === selectedProduct.brand)
        .slice(0, 4)
    : [];

  function reloadStorefrontData() {
    fetch(apiPath("/api/settings"))
      .then((response) => response.json())
      .then((data) => setSiteSettings(data.settings || null))
      .catch((error) => console.error(error));

    fetch(apiPath("/api/products"))
      .then((response) => response.json())
      .then((data) => setAllProducts(data.products || []))
      .catch((error) => console.error(error));

    fetch(apiPath("/api/categories"))
      .then((response) => response.json())
      .then((data) => setCategoryCards(data.categories || []))
      .catch((error) => console.error(error));

    fetch(apiPath("/api/brands"))
      .then((response) => response.json())
      .then((data) => setBrands(data.brands || []))
      .catch((error) => console.error(error));

    fetch(apiPath("/api/testimonials"))
      .then((response) => response.json())
      .then((data) => setTestimonials(data.testimonials || []))
      .catch((error) => console.error(error));
  }

  useEffect(() => {
    reloadStorefrontData();
  }, []);

  useEffect(() => {
    if (isAdminPortal) return undefined;
    const key = "qadam_visitor_id";
    const existing = localStorage.getItem(key);
    const visitorId = existing || `visitor-${Math.random().toString(36).slice(2)}-${Date.now()}`;
    if (!existing) localStorage.setItem(key, visitorId);

    function pingVisit() {
      fetch(apiPath("/api/visits"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId, page: window.location.pathname || "/" })
      }).catch((error) => console.error(error));
    }

    pingVisit();
    const timer = window.setInterval(pingVisit, 60000);
    return () => window.clearInterval(timer);
  }, [isAdminPortal]);

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");

    fetch(apiPath(`/api/products${query ? `?${query}` : ""}`), { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Product API failed");
        return response.json();
      })
      .then((data) => {
        setProducts(data.products || []);
        setStatus("ready");
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error(error);
          setStatus("error");
        }
      });

    return () => controller.abort();
  }, [query]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page, selectedProduct?.id]);

  useEffect(() => {
    if (user) localStorage.setItem("stryd_user", JSON.stringify(user));
    else localStorage.removeItem("stryd_user");
  }, [user]);

  useEffect(() => {
    if (!isAdminPortal && isAdminEmail(user?.email)) {
      localStorage.removeItem("stryd_user");
      setUser(null);
      window.location.assign("/admin");
    }
  }, [isAdminPortal, user]);

  useEffect(() => {
    localStorage.setItem("stryd_orders", JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const elements = document.querySelectorAll(
      ".section-kicker, .product-card, .brand-card, .trust-item, .testimonial-card, .split-story, .collection-hero, .detail-layout, .dash-card, .dash-header, .newsletter-section"
    );
    if (!("IntersectionObserver" in window) || elements.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );

    elements.forEach((element, index) => {
      element.classList.add("reveal");
      element.style.setProperty("--reveal-delay", `${Math.min(index % 8, 7) * 55}ms`);
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [page, selectedProduct?.id, products, dashSection, allProducts.length]);

  function openCollection() {
    setPage("collection");
    setSelectedProduct(null);
  }

  function openDetails(product) {
    setSelectedProduct(product);
    setPage("detail");
  }

  function toggleFavorite(id) {
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addToCart(product) {
    setCartItems((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [...current, { ...product, quantity: 1 }];
    });
    setCartOpen(true);
  }

  function removeOne(id) {
    setCartItems((current) =>
      current
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity - 1 } : item))
        .filter((item) => item.quantity > 0)
    );
  }

  function deleteItem(id) {
    setCartItems((current) => current.filter((item) => item.id !== id));
  }

  function focusSearch() {
    openCollection();
    window.setTimeout(() => searchRef.current?.focus(), 350);
  }

  function goHomeSection(sectionId) {
    setPage("home");
    window.setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" }), 80);
  }

  function showHeaderSale() {
    setFilters((current) => ({ ...current, category: "All", saleOnly: true }));
    openCollection();
  }

  function showFooterSale() {
    setFilters((current) => ({ ...current, saleOnly: true }));
    openCollection();
  }

  function selectCategory(category) {
    setFilters((current) => ({ ...current, category }));
    openCollection();
  }

  function selectBrand(brand) {
    setFilters((current) => ({ ...current, brand }));
    openCollection();
  }

  function openAuth(mode = "login", intent = null) {
    setAuthMode(mode);
    setAuthIntent(intent);
    setAuthOpen(true);
  }

  function placeOrder(forUser) {
    const buyer = forUser || user;
    if (!buyer) {
      openAuth("login", "checkout");
      return;
    }
    if (cartItems.length === 0) return;
    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order = {
      id: `QADAM-${Math.floor(100000 + Math.random() * 900000)}`,
      date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      items: cartItems.map((item) => ({
        id: item.id,
        name: item.name,
        brand: item.brand,
        image: item.image,
        price: item.price,
        quantity: item.quantity
      })),
      total,
      status: "Processing"
    };
    fetch(apiPath("/api/orders"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...order,
        orderNumber: order.id,
        customerName: buyer.name,
        customerEmail: buyer.email
      })
    }).catch((error) => console.error(error));
    setOrders((current) => [order, ...current]);
    setCartItems([]);
    setCartOpen(false);
    setDashSection("orders");
    setPage("dashboard");
    setToast("Order placed successfully!");
  }

  function goHome() {
    if (window.location.pathname !== "/") {
      window.history.pushState({}, "", "/");
    }
    setPage("home");
  }

  function openAdminPortal() {
    localStorage.removeItem("stryd_user");
    setUser(null);
    window.location.assign("/admin");
  }

  function handleAuthSubmit({ name, email }) {
    if (isAdminEmail(email)) {
      setAuthOpen(false);
      setAuthIntent(null);
      setToast("Admin login opens in the admin portal.");
      window.setTimeout(openAdminPortal, 150);
      return;
    }

    const joined = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    const nextUser = { name, email, joined };
    fetch(apiPath("/api/customers"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextUser)
    }).catch((error) => console.error(error));
    setUser(nextUser);
    setAuthOpen(false);
    const intent = authIntent;
    setAuthIntent(null);
    setToast(`Welcome, ${name.split(" ")[0]}!`);
    if (intent === "checkout") {
      window.setTimeout(() => placeOrder(nextUser), 250);
    } else if (intent === "account") {
      setDashSection("overview");
      setPage("dashboard");
    }
  }

  function handleCheckout() {
    if (!user) {
      setCartOpen(false);
      openAuth("login", "checkout");
      return;
    }
    placeOrder(user);
  }

  function handleLogout() {
    setUser(null);
    setPage("home");
    setToast("You have been signed out.");
  }

  function openAccount() {
    if (isAdminEmail(user?.email)) {
      openAdminPortal();
      return;
    }

    if (user) {
      setDashSection("overview");
      setPage("dashboard");
    } else {
      openAuth("login", "account");
    }
  }

  function renderPage() {
    if (page === "collection") {
      return (
        <CollectionPage
          brands={brands}
          categories={categoryCards}
          filters={filters}
          setFilters={setFilters}
          products={products}
          status={status}
          favorites={favorites}
          onFavorite={toggleFavorite}
          onAddToCart={addToCart}
          onOpenDetails={openDetails}
          searchRef={searchRef}
        />
      );
    }

    if (page === "detail") {
      return (
        <ProductDetailPage
          product={selectedProduct}
          similarProducts={similarProducts}
          favorites={favorites}
          isFavorite={selectedProduct ? favorites.has(selectedProduct.id) : false}
          onFavorite={toggleFavorite}
          onAddToCart={addToCart}
          onOpenDetails={openDetails}
          onBack={openCollection}
        />
      );
    }

    if (page === "favorites") {
      return (
        <FavoritesPage
          favoriteProducts={favoriteProducts}
          favorites={favorites}
          onFavorite={toggleFavorite}
          onAddToCart={addToCart}
          onOpenDetails={openDetails}
          onBack={openCollection}
        />
      );
    }

    if (page === "dashboard" && user) {
      return (
        <DashboardPage
          user={user}
          orders={orders}
          section={dashSection}
          setSection={setDashSection}
          favoriteProducts={favoriteProducts}
          favorites={favorites}
          onFavorite={toggleFavorite}
          onAddToCart={addToCart}
          onOpenDetails={openDetails}
          onLogout={handleLogout}
          onUpdateUser={(profile) => {
            setUser((current) => ({ ...current, ...profile }));
            setToast("Profile updated.");
          }}
          onOpenCollection={openCollection}
        />
      );
    }

    return (
      <HomePage
        brands={brands}
        categories={categoryCards}
        products={allProducts}
        settings={siteSettings}
        testimonials={testimonials}
        favorites={favorites}
        onFavorite={toggleFavorite}
        onAddToCart={addToCart}
        onOpenDetails={openDetails}
        onOpenCollection={openCollection}
        onSetCategory={(category) => setFilters((current) => ({ ...current, category }))}
        onSetBrand={(brand) => setFilters((current) => ({ ...current, brand }))}
      />
    );
  }

  if (isAdminPortal) {
    return <AdminPage onDataChanged={reloadStorefrontData} />;
  }

  return (
    <>
      <Header
        user={user}
        cartCount={cartCount}
        favoritesCount={favorites.size}
        onHome={goHome}
        onOpenCollection={openCollection}
        onGoSection={goHomeSection}
        onShowSale={showHeaderSale}
        onFocusSearch={focusSearch}
        onOpenFavorites={() => setPage("favorites")}
        onOpenAccount={openAccount}
        onOpenCart={() => setCartOpen(true)}
      />

      <div className="page-transition" key={`${page}-${selectedProduct?.id || ""}-${dashSection}`}>
        {renderPage()}
      </div>

      <Footer
        brands={brands}
        categories={categoryCards}
        onHome={goHome}
        onSelectCategory={selectCategory}
        onShowSale={showFooterSale}
        onSelectBrand={selectBrand}
      />

      <CartDrawer
        items={cartItems}
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onAdd={addToCart}
        onRemove={removeOne}
        onDelete={deleteItem}
        onCheckout={handleCheckout}
        isAuthed={Boolean(user)}
      />

      <AuthModal
        open={authOpen}
        mode={authMode}
        intent={authIntent}
        onClose={() => setAuthOpen(false)}
        onSubmit={handleAuthSubmit}
        onSwitchMode={() => setAuthMode((current) => (current === "register" ? "login" : "register"))}
      />

      <Toast message={toast} />
    </>
  );
}
