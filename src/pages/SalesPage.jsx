import { Minus, Plus, Receipt, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

function Sales({
  products,
  customers,
  cart,
  setCart,
  add,
  discount,
  setDiscount,
  subtotal,
  discountAmount,
  total,
  customerId,
  setCustomerId,
  paymentMethod,
  setPaymentMethod,
  paymentMethods,
  pay,
}) {
  const [query, setQuery] = useState("");
  const availablePayments = paymentMethods.filter(
    (method) => method.status !== "Inactive",
  );
  const catalog = useMemo(() => {
    const search = query.trim().toLowerCase();
    return products.filter(
      (product) =>
        product.stock > 0 &&
        (!search ||
          product.name.toLowerCase().includes(search) ||
          product.sku.toLowerCase().includes(search)),
    );
  }, [products, query]);

  const changeQuantity = (product, quantity) => {
    if (quantity <= 0) {
      setCart((items) => items.filter((item) => item._id !== product._id));
      return;
    }
    if (quantity > product.stock) return;
    setCart((items) =>
      items.map((item) =>
        item._id === product._id ? { ...item, quantity } : item,
      ),
    );
  };

  return (
    <div className="page sale-page">
      <section className="box sale-checkout">
        <div className="panel-title">
          <div>
            <h3>Current sale</h3>
            <p>{cart.length} products in your cart</p>
          </div>
          <span className="live-tag">
            <i /> POS
          </span>
        </div>
        <label className="field-label customer-field">
          Customer
          <select
            value={customerId}
            onChange={(event) => setCustomerId(event.target.value)}
          >
            <option value="">Walk-in customer</option>
            {customers.map((customer) => (
              <option value={customer._id} key={customer._id}>
                {customer.name}
              </option>
            ))}
          </select>
        </label>

        <div className="sale-cart-list">
          {cart.map((item) => (
            <div className="sale-cart-row" key={item._id}>
              {item.image ? (
                <img src={item.image} alt="" />
              ) : (
                <span className="sale-cart-placeholder">
                  {item.name.slice(0, 1)}
                </span>
              )}
              <span className="sale-cart-info">
                <b>{item.name}</b>
                <small>${Number(item.price).toFixed(2)} each</small>
              </span>
              <div className="quantity-control">
                <button
                  type="button"
                  aria-label={`Decrease ${item.name}`}
                  onClick={() => changeQuantity(item, item.quantity - 1)}
                >
                  <Minus size={13} />
                </button>
                <b>{item.quantity}</b>
                <button
                  type="button"
                  aria-label={`Increase ${item.name}`}
                  disabled={item.quantity >= item.stock}
                  onClick={() => changeQuantity(item, item.quantity + 1)}
                >
                  <Plus size={13} />
                </button>
              </div>
              <strong className="sale-line-total">
                ${(Number(item.price) * item.quantity).toFixed(2)}
              </strong>
              <button
                type="button"
                className="icon-btn danger-icon"
                aria-label={`Remove ${item.name}`}
                onClick={() => changeQuantity(item, 0)}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {!cart.length && (
            <div className="empty-cart">
              <Receipt size={22} />
              <p>Your cart is empty. Select products to start a sale.</p>
            </div>
          )}
        </div>

        <label className="field-label discount-field">
          Discount
          <span>
            <input
              type="number"
              min="0"
              max="100"
              value={discount}
              onChange={(event) =>
                setDiscount(
                  Math.min(100, Math.max(0, Number(event.target.value) || 0)),
                )
              }
            />
            %
          </span>
        </label>
        <label className="field-label">
          Payment method
          <select
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
          >
            {availablePayments.length ? (
              availablePayments.map((method) => (
                <option key={method._id} value={method.name}>
                  {method.name}
                </option>
              ))
            ) : (
              <>
                <option>Cash</option>
                <option>Card</option>
                <option>M-Pesa</option>
              </>
            )}
          </select>
        </label>
        <div className="sale-totals">
          <div>
            <span>Subtotal</span>
            <b>${subtotal.toFixed(2)}</b>
          </div>
          <div>
            <span>Discount</span>
            <b>−${discountAmount.toFixed(2)}</b>
          </div>
          <div className="sale-grand-total">
            <span>Total</span>
            <strong>${total.toFixed(2)}</strong>
          </div>
        </div>
        <button
          className="primary-btn checkout-button"
          disabled={!cart.length}
          onClick={pay}
        >
          <Receipt size={17} /> Complete payment
        </button>
      </section>

      <section className="box sale-catalog">
        <div className="panel-title">
          <div>
            <h3>Product catalog</h3>
            <p>Click a product to add it to this sale.</p>
          </div>
          <label className="table-search">
            <Search size={15} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search catalog..."
            />
          </label>
        </div>
        <div className="sale-product-grid">
          {catalog.map((product) => (
            <button
              className="sale-product-card"
              key={product._id}
              onClick={() => add(product)}
            >
              {product.image ? (
                <img src={product.image} alt="" />
              ) : (
                <span className="sale-product-placeholder">
                  {product.name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="sale-product-details">
                <b>{product.name}</b>
                <small>{product.stock} in stock</small>
                <strong>${Number(product.price).toFixed(2)}</strong>
              </span>
              <span className="sale-product-add">
                <Plus size={15} />
              </span>
            </button>
          ))}
          {!catalog.length && (
            <div className="empty-state catalog-empty">
              <p>
                {products.length
                  ? "No in-stock products match your search."
                  : "Add products in Inventory to start selling."}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Sales;
