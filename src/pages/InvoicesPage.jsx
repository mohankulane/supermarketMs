import { useMemo, useState } from "react";
import { Eye, FileText, Printer, Search } from "lucide-react";
import ReceiptView from "../components/common/ReceiptView.jsx";

function Invoices({ sales, customers, returns, storeName, onReturn }) {
  const [query, setQuery] = useState("");
  const [invoice, setInvoice] = useState(null);
  const filteredSales = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return sales;
    return sales.filter((sale) => {
      const customer =
        sale.customer?.name ||
        customers.find(
          (record) => record._id === (sale.customer?._id || sale.customer),
        )?.name ||
        "Walk-in customer";
      return `${sale.receiptNo} ${customer} ${sale.paymentMethod}`
        .toLowerCase()
        .includes(search);
    });
  }, [customers, query, sales]);

  const totalSales = sales.reduce(
    (sum, sale) => sum + Number(sale.total || 0),
    0,
  );
  const openInvoice = (sale) => setInvoice(sale);
  const printInvoice = (sale) => {
    setInvoice(sale);
    window.setTimeout(() => window.print(), 100);
  };
  const canReturn = (sale) => {
    const sold = new Map();
    const returned = new Map();
    for (const item of sale.items || []) {
      const productId = String(item.product?._id || item.product);
      sold.set(productId, (sold.get(productId) || 0) + Number(item.quantity || 0));
    }
    for (const record of returns) {
      if (
        record.status !== "Completed" ||
        String(record.sale?._id || record.sale || "") !== String(sale._id)
      ) {
        continue;
      }
      for (const item of record.items || []) {
        const productId = String(item.product?._id || item.product);
        returned.set(
          productId,
          (returned.get(productId) || 0) + Number(item.quantity || 0),
        );
      }
    }
    return [...sold].some(
      ([productId, quantity]) => quantity > (returned.get(productId) || 0),
    );
  };

  return (
    <div className="page invoices-page">
      <section className="invoice-summary">
        <article className="box report-metric">
          <span>Total invoices</span>
          <strong>{sales.length}</strong>
        </article>
        <article className="box report-metric">
          <span>Recorded sales</span>
          <strong>${totalSales.toFixed(2)}</strong>
        </article>
      </section>

      <section className="box inventory-table-box">
        <div className="panel-title invoice-list-title">
          <div>
            <h3>Invoices</h3>
            <p>View, print, and process returns for completed sales.</p>
          </div>
          <label className="invoice-search">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search invoice or customer"
            />
          </label>
        </div>
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Payment</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((sale) => {
                const customer =
                  sale.customer?.name ||
                  customers.find(
                    (record) =>
                      record._id === (sale.customer?._id || sale.customer),
                  )?.name ||
                  "Walk-in customer";
                return (
                  <tr key={sale._id}>
                    <td>
                      <strong>{sale.receiptNo || sale._id.slice(-8)}</strong>
                    </td>
                    <td>{new Date(sale.createdAt).toLocaleString()}</td>
                    <td>{customer}</td>
                    <td>
                      {sale.items?.reduce(
                        (sum, item) => sum + Number(item.quantity || 0),
                        0,
                      ) || 0}
                    </td>
                    <td>{sale.paymentMethod || "Cash"}</td>
                    <td>${Number(sale.total || 0).toFixed(2)}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="icon-btn"
                          aria-label={`View invoice ${sale.receiptNo}`}
                          title="View invoice"
                          onClick={() => openInvoice(sale)}
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          className="icon-btn"
                          aria-label={`Print invoice ${sale.receiptNo}`}
                          title="Print receipt"
                          onClick={() => printInvoice(sale)}
                        >
                          <Printer size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!filteredSales.length && (
                <tr>
                  <td colSpan="7" className="empty-table-cell">
                    <FileText size={19} />
                    {sales.length
                      ? "No invoices match your search."
                      : "No invoices have been recorded."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {!sales.length && (
        <div className="invoice-empty-note">
          <FileText size={18} />
          Invoices will appear here after a sale is completed.
        </div>
      )}
      {invoice && (
        <ReceiptView
          sale={invoice}
          customerName={
            invoice.customer?.name ||
            customers.find(
              (record) =>
                record._id === (invoice.customer?._id || invoice.customer),
            )?.name
          }
          storeName={storeName}
          canReturn={canReturn(invoice)}
          close={() => setInvoice(null)}
          onReturn={() => {
            const selectedSale = invoice;
            setInvoice(null);
            onReturn(selectedSale);
          }}
        />
      )}
    </div>
  );
}

export default Invoices;
