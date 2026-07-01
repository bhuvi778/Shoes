import { Minus, Plus, X } from "lucide-react";
import { FREE_SHIPPING_THRESHOLD } from "../lib/constants.js";
import { inr } from "../lib/format.js";

export default function CartDrawer({ items, isOpen, onClose, onAdd, onRemove, onDelete, onCheckout, isAuthed }) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingLeft = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  return (
    <div className={`cart-layer ${isOpen ? "is-open" : ""}`} aria-hidden={!isOpen}>
      <button className="cart-scrim" type="button" onClick={onClose} aria-label="Close cart" />
      <aside className="cart-drawer" aria-label="Shopping cart">
        <div className="cart-header">
          <div>
            <p className="eyebrow">Your bag</p>
            <h2>{items.length} items</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close cart">
            <X />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="cart-empty">Your bag is empty. Add a pair from the collection.</div>
        ) : (
          <div className="cart-list">
            {items.map((item) => (
              <div className="cart-item" key={item.id}>
                <img src={item.image} alt={item.name} />
                <div>
                  <p className="cart-item-brand">{item.brand}</p>
                  <h3>{item.name}</h3>
                  <p>{inr(item.price)}</p>
                  <div className="quantity-row">
                    <button type="button" onClick={() => onRemove(item.id)} aria-label={`Decrease ${item.name}`}>
                      <Minus />
                    </button>
                    <span>{item.quantity}</span>
                    <button type="button" onClick={() => onAdd(item)} aria-label={`Increase ${item.name}`}>
                      <Plus />
                    </button>
                    <button className="remove-link" type="button" onClick={() => onDelete(item.id)}>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="cart-summary">
          <p>{shippingLeft === 0 ? "Free shipping unlocked." : `${inr(shippingLeft)} away from free shipping.`}</p>
          <div>
            <span>Subtotal</span>
            <strong>{inr(subtotal)}</strong>
          </div>
          <button className="checkout-button" type="button" disabled={items.length === 0} onClick={onCheckout}>
            {isAuthed ? "Checkout" : "Sign in & Checkout"}
          </button>
        </div>
      </aside>
    </div>
  );
}
