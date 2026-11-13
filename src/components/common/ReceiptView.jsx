import { Printer, RotateCcw, X } from "lucide-react";

function ReceiptView({
  sale,
  close,
  onReturn,
  canReturn = true,
  customerName,
  storeName = "FreshMart Supermarket",
}) {
  const items = (sale.items || []).map((item) =>
    Array.isArray(item)
      ? { name: item[0], quantity: item[1], price: item[2] }
      : item,
  );
  const receiptNumber = sale.receiptNo || sale._id;
  const subtotal =
    sale.subtotal ??
    items.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
      0,
    );
  const discount = Number(sale.discount || 0);
  const date = sale.createdAt ? new Date(sale.createdAt) : new Date();
  const encoded = Array.from(receiptNumber)
    .flatMap((character) =>
      character.charCodeAt(0).toString(2).padStart(8, "0").split(""),
    )
    .map((bit, index) => (
      <rect
        key={index}
        x={index * 2}
        y="0"
        width={bit === "1" ? 1.5 : 0.8}
        height="40"
        fill="#111"
      />
    ));

  return (
    <div className="mask receipt-mask" role="presentation" onMouseDown={close}>
      <section
        className="thermal receipt-card"
        role="dialog"
        aria-modal="true"
        aria-label={`Invoice ${receiptNumber}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="receipt-actions">
          {onReturn && canReturn && (
            <button type="button" className="outline-btn" onClick={onReturn}>
              <RotateCcw size={15} /> Return
            </button>
          )}
          <button
            type="button"
            className="primary-btn"
            onClick={() => window.print()}
          >
            <Printer size={15} /> Print receipt
          </button>
          <button
            type="button"
            className="icon-btn receipt-close"
            aria-label="Close invoice"
            onClick={close}
          >
            <X size={18} />
          </button>
        </div>

        <div className="receipt-paper">
          <header className="receipt-heading">
            <h2>{storeName}</h2>
            <p>Thank you for shopping with us</p>
          </header>
          <div className="receipt-meta">
            <div>
              <span>Invoice</span>
              <strong>{receiptNumber}</strong>
            </div>
            <div>
              <span>Date</span>
              <strong>{date.toLocaleString()}</strong>
            </div>
            <div>
              <span>Customer</span>
              <strong>{customerName || "Walk-in customer"}</strong>
            </div>
          </div>

          <div className="receipt-items">
            <div className="receipt-column-head">
              <span>Item</span>
              <span>Qty</span>
              <span>Price</span>
              <span>Amount</span>
            </div>
            {items.map((item, index) => {
              const quantity = Number(item.quantity || 0);
              const price = Number(item.price || 0);
              return (
                <div
                  className="receipt-item"
                  key={`${item.name}-${index}`}
                >
                  <span>{item.name || "Product"}</span>
                  <span>{quantity}</span>
                  <span>${price.toFixed(2)}</span>
                  <strong>${(quantity * price).toFixed(2)}</strong>
                </div>
              );
            })}
          </div>

          <div className="receipt-totals">
            <div>
              <span>Subtotal</span>
              <strong>${Number(subtotal).toFixed(2)}</strong>
            </div>
            {discount > 0 && (
              <div>
                <span>Discount</span>
                <strong>−${discount.toFixed(2)}</strong>
              </div>
            )}
            <div className="receipt-grand-total">
              <span>Total paid</span>
              <strong>${Number(sale.total || 0).toFixed(2)}</strong>
            </div>
            <div>
              <span>Payment method</span>
              <strong>{sale.paymentMethod || "Cash"}</strong>
            </div>
          </div>

          <div className="receipt-barcode">
            <svg
              viewBox={`0 0 ${Math.max(receiptNumber.length * 16, 1)} 40`}
              role="img"
              aria-label={`Invoice number ${receiptNumber}`}
              preserveAspectRatio="none"
            >
              {encoded}
            </svg>
            <span>{receiptNumber}</span>
          </div>
          <footer className="receipt-thanks">
            <strong>We appreciate your business!</strong>
            <span>Please visit us again.</span>
          </footer>
        </div>
      </section>
    </div>
  );
}

export default ReceiptView;
