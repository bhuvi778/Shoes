import { Bell, ChevronRight, CreditCard, Heart, LogOut, Package, Plus, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { dashNav } from "../lib/constants.js";
import { getInitials, inr } from "../lib/format.js";
import ProductCard from "../components/ProductCard.jsx";

export default function DashboardPage({
  user,
  orders,
  section,
  setSection,
  favoriteProducts,
  favorites,
  onFavorite,
  onAddToCart,
  onOpenDetails,
  onLogout,
  onUpdateUser,
  onOpenCollection
}) {
  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
  const points = Math.round(totalSpent * 1.5);
  const [profile, setProfile] = useState({ name: user.name, email: user.email });

  useEffect(() => {
    setProfile({ name: user.name, email: user.email });
  }, [user]);

  const stats = [
    { label: "Total orders", value: orders.length, icon: Package },
    { label: "Total spent", value: inr(totalSpent), icon: CreditCard },
    { label: "Wishlist", value: favoriteProducts.length, icon: Heart },
    { label: "Reward points", value: points, icon: Star }
  ];

  return (
    <main className="page-shell dashboard-page">
      <div className="dashboard-layout">
        <aside className="dash-sidebar" aria-label="Account navigation">
          <div className="dash-user">
            <span className="dash-avatar">{getInitials(user.name)}</span>
            <div>
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>
          </div>
          <nav className="dash-nav">
            {dashNav.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={section === item.id ? "is-active" : ""}
                  onClick={() => setSection(item.id)}
                >
                  <Icon />
                  <span>{item.label}</span>
                  <ChevronRight />
                </button>
              );
            })}
          </nav>
          <button className="dash-logout" type="button" onClick={onLogout}>
            <LogOut />
            Sign out
          </button>
        </aside>

        <section className="dash-content">
          {section === "overview" && (
            <>
              <header className="dash-header">
                <div>
                  <p className="eyebrow">Dashboard</p>
                  <h1>Welcome back, {user.name.split(" ")[0]}.</h1>
                </div>
                <button className="dash-bell icon-button" type="button" aria-label="Notifications">
                  <Bell />
                </button>
              </header>
              <div className="dash-stats">
                {stats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <article className="dash-stat dash-card" key={stat.label}>
                      <span className="dash-stat-icon">
                        <Icon />
                      </span>
                      <strong>{stat.value}</strong>
                      <span>{stat.label}</span>
                    </article>
                  );
                })}
              </div>
              <div className="dash-grid">
                <article className="dash-card dash-recent">
                  <div className="dash-card-head">
                    <h2>Recent orders</h2>
                    <button type="button" onClick={() => setSection("orders")}>
                      View all
                    </button>
                  </div>
                  {orders.length === 0 ? (
                    <div className="dash-empty">
                      <p>No orders yet.</p>
                      <button type="button" className="dash-cta" onClick={onOpenCollection}>
                        Start shopping
                      </button>
                    </div>
                  ) : (
                    <ul className="dash-order-list">
                      {orders.slice(0, 3).map((order) => (
                        <li key={order.id}>
                          <div>
                            <strong>{order.id}</strong>
                            <span>
                              {order.date} &middot; {order.items.length} items
                            </span>
                          </div>
                          <span className={`order-status status-${order.status.toLowerCase()}`}>{order.status}</span>
                          <strong>{inr(order.total)}</strong>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
                <article className="dash-card dash-profile-card">
                  <div className="dash-card-head">
                    <h2>Profile</h2>
                  </div>
                  <div className="dash-profile-info">
                    <span className="dash-avatar lg">{getInitials(user.name)}</span>
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                    <p>Member since {user.joined}</p>
                    <button type="button" onClick={() => setSection("settings")}>
                      Edit profile
                    </button>
                  </div>
                </article>
              </div>
            </>
          )}

          {section === "orders" && (
            <>
              <header className="dash-header">
                <div>
                  <p className="eyebrow">History</p>
                  <h1>Your orders</h1>
                </div>
              </header>
              {orders.length === 0 ? (
                <div className="dash-card dash-empty big">
                  <Package />
                  <p>You haven&apos;t placed any orders yet.</p>
                  <button type="button" className="dash-cta" onClick={onOpenCollection}>
                    Browse the collection
                  </button>
                </div>
              ) : (
                <div className="dash-orders">
                  {orders.map((order) => (
                    <article className="dash-card order-card" key={order.id}>
                      <div className="order-card-head">
                        <div>
                          <strong>{order.id}</strong>
                          <span>
                            Placed {order.date} &middot; {order.payment?.provider === "razorpay" ? `Razorpay ${order.payment?.status || "pending"}` : "Payment pending"}
                          </span>
                        </div>
                        <span className={`order-status status-${order.status.toLowerCase()}`}>{order.status}</span>
                      </div>
                      <div className="order-items">
                        {order.items.map((item) => (
                          <div className="order-item" key={item.id}>
                            <img src={item.image} alt={item.name} />
                            <div>
                              <strong>{item.name}</strong>
                              <span>
                                {item.brand} &middot; Qty {item.quantity}
                              </span>
                            </div>
                            <span>{inr(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="order-card-foot">
                        <span>Total</span>
                        <strong>{inr(order.total)}</strong>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}

          {section === "wishlist" && (
            <>
              <header className="dash-header">
                <div>
                  <p className="eyebrow">Saved</p>
                  <h1>Your wishlist</h1>
                </div>
              </header>
              {favoriteProducts.length === 0 ? (
                <div className="dash-card dash-empty big">
                  <Heart />
                  <p>No saved products yet.</p>
                  <button type="button" className="dash-cta" onClick={onOpenCollection}>
                    Find something you love
                  </button>
                </div>
              ) : (
                <div className="product-grid catalog-grid">
                  {favoriteProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isFavorite={favorites.has(product.id)}
                      onFavorite={onFavorite}
                      onAddToCart={onAddToCart}
                      onOpenDetails={onOpenDetails}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {section === "addresses" && (
            <>
              <header className="dash-header">
                <div>
                  <p className="eyebrow">Shipping</p>
                  <h1>Saved addresses</h1>
                </div>
              </header>
              <div className="dash-cards-row">
                <article className="dash-card address-card">
                  <span className="address-tag">Default</span>
                  <strong>{user.name}</strong>
                  <p>
                    12 MG Road
                    <br />
                    Bengaluru, Karnataka 560001
                    <br />
                    India
                  </p>
                  <span>+91 98765 43210</span>
                </article>
                <button className="dash-card add-card" type="button">
                  <Plus />
                  Add new address
                </button>
              </div>
            </>
          )}

          {section === "payment" && (
            <>
              <header className="dash-header">
                <div>
                  <p className="eyebrow">Billing</p>
                  <h1>Payment methods</h1>
                </div>
              </header>
              <div className="dash-cards-row">
                <article className="dash-card pay-card">
                  <div className="pay-card-top">
                    <CreditCard />
                    <span>VISA</span>
                  </div>
                  <strong>&bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; 4242</strong>
                  <div className="pay-card-foot">
                    <span>{user.name}</span>
                    <span>09 / 28</span>
                  </div>
                </article>
                <button className="dash-card add-card" type="button">
                  <Plus />
                  Add payment method
                </button>
              </div>
            </>
          )}

          {section === "settings" && (
            <>
              <header className="dash-header">
                <div>
                  <p className="eyebrow">Account</p>
                  <h1>Settings</h1>
                </div>
              </header>
              <article className="dash-card settings-card">
                <form
                  className="settings-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    onUpdateUser(profile);
                  }}
                >
                  <label>
                    <span>Full name</span>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))}
                    />
                  </label>
                  <label>
                    <span>Email address</span>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))}
                    />
                  </label>
                  <div className="settings-actions">
                    <button type="submit" className="dash-cta">
                      Save changes
                    </button>
                    <button type="button" className="dash-ghost" onClick={onLogout}>
                      Sign out
                    </button>
                  </div>
                </form>
              </article>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
