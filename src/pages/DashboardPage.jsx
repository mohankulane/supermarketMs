import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  CircleDollarSign,
  FileText,
  Package,
} from "lucide-react";

const money = (value) => `$${Number(value || 0).toFixed(2)}`;

function Dashboard({ dashboard, loading }) {
  const data = dashboard || {};
  const chart = data.chart || [];
  const maxSales = Math.max(1, ...chart.map((day) => day.total));
  const cards = [
    {
      label: "Today's sales",
      value: money(data.revenue),
      icon: CircleDollarSign,
      tone: "mint",
    },
    {
      label: "Orders today",
      value: data.orders || 0,
      icon: FileText,
      tone: "blue",
    },
    {
      label: "Expenses today",
      value: money(data.expenses),
      icon: ArrowDownRight,
      tone: "amber",
    },
    {
      label: "Inventory items",
      value: data.products || 0,
      icon: Package,
      tone: "violet",
    },
  ];

  return (
    <div className="page dashboard-page">
      <section className="dashboard-kpis">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <article className="dashboard-kpi" key={label}>
            <span className={`dashboard-kpi-icon ${tone}`}>
              <Icon size={18} />
            </span>
            <span className="dashboard-kpi-label">{label}</span>
            <strong>{loading ? "—" : value}</strong>
            <small>
              <ArrowUpRight size={13} /> Live store data
            </small>
          </article>
        ))}
      </section>

      <section className="dashboard-main-grid">
        <article className="box dashboard-chart-card">
          <div className="panel-title">
            <div>
              <h3>Sales performance</h3>
              <p>Daily sales for the last seven days</p>
            </div>
            <span className="live-tag">
              <i /> Live
            </span>
          </div>
          {chart.length ? (
            <div
              className="sales-chart"
              aria-label="Sales over the last seven days"
            >
              {chart.map((day) => (
                <div className="sales-chart-day" key={day.date}>
                  <span className="sales-chart-value">
                    {day.total ? money(day.total) : ""}
                  </span>
                  <div className="sales-chart-track">
                    <i
                      style={{
                        height: `${Math.max(4, (day.total / maxSales) * 100)}%`,
                      }}
                    />
                  </div>
                  <small>{day.label}</small>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-chart">
              <Boxes size={25} />
              <p>Sales will appear here after the first checkout.</p>
            </div>
          )}
        </article>

        <article className="box top-products-card">
          <div className="panel-title">
            <div>
              <h3>Top selling products</h3>
              <p>Units sold this week</p>
            </div>
          </div>
          {data.topProducts?.length ? (
            <div className="top-products-list">
              {data.topProducts.map((product, index) => (
                <div className="top-product-row" key={product.name}>
                  <span className="rank-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <b>{product.name}</b>
                  <span>{product.quantity} sold</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state compact-empty">
              <p>No product sales recorded this week.</p>
            </div>
          )}
        </article>
      </section>

      <section className="dashboard-bottom-grid">
        <article className="box recent-sales-card">
          <div className="panel-title">
            <div>
              <h3>Recent sales</h3>
              <p>Latest completed transactions</p>
            </div>
          </div>
          {data.recentSales?.length ? (
            <div className="responsive-table">
              <table>
                <thead>
                  <tr>
                    <th>Receipt</th>
                    <th>Items</th>
                    <th>Payment</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentSales.map((sale) => (
                    <tr key={sale._id}>
                      <td>{sale.receiptNo}</td>
                      <td>{sale.items?.length || 0} items</td>
                      <td>{sale.paymentMethod || "Cash"}</td>
                      <td>{money(sale.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <FileText size={23} />
              <p>There are no sales yet. Complete a sale to see it here.</p>
            </div>
          )}
        </article>

        <article className="box stock-alert-card">
          <div className="panel-title">
            <div>
              <h3>Low stock alerts</h3>
              <p>Products at or below reorder level</p>
            </div>
            <span className="alert-count">{data.lowStock?.length || 0}</span>
          </div>
          {data.lowStock?.length ? (
            <div className="stock-alert-list">
              {data.lowStock.slice(0, 6).map((product) => (
                <div className="stock-alert-row" key={product._id}>
                  <span className="alert-icon">
                    <AlertTriangle size={15} />
                  </span>
                  <span>
                    <b>{product.name}</b>
                    <small>Reorder at {product.reorderLevel}</small>
                  </span>
                  <strong>{product.stock} left</strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state compact-empty">
              <Package size={22} />
              <p>All products are above their reorder levels.</p>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}

export default Dashboard;
