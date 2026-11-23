import { useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  Boxes,
  CircleDollarSign,
  FileText,
  Package,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";

const money = (value, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    Number(value || 0),
  );

function Dashboard({
  dashboard,
  sales = [],
  expenses = [],
  currency = "USD",
  loading,
}) {
  const data = dashboard || {};
  const [chartPeriod, setChartPeriod] = useState("week");
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const yearStart = new Date(today.getFullYear(), 0, 1);
  const monthSales = sales.filter((sale) => {
    const date = new Date(sale.createdAt);
    return (
      !Number.isNaN(date.getTime()) &&
      date >= monthStart &&
      date <= today
    );
  });
  const yearSales = sales.filter((sale) => {
    const date = new Date(sale.createdAt);
    return (
      !Number.isNaN(date.getTime()) &&
      date >= yearStart &&
      date <= today
    );
  });
  const monthExpenses = expenses
    .filter((expense) => {
      const date = new Date(expense.expenseDate);
      return (
        !Number.isNaN(date.getTime()) &&
        date >= monthStart &&
        date <= today
      );
    })
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const summary = {
    monthRevenue: monthSales.reduce(
      (sum, sale) => sum + Number(sale.total || 0),
      0,
    ),
    monthOrders: monthSales.length,
    yearRevenue: yearSales.reduce(
      (sum, sale) => sum + Number(sale.total || 0),
      0,
    ),
    monthExpenses,
  };
  const trend = (period) => {
    const count = period === "week" ? 7 : period === "month" ? 30 : 12;
    const points = Array.from({ length: count }, (_, index) => {
      const date =
        period === "year"
          ? new Date(today.getFullYear(), today.getMonth() - count + index + 1, 1)
          : new Date(today.getFullYear(), today.getMonth(), today.getDate() - count + index + 1);
      date.setHours(0, 0, 0, 0);
      const key =
        period === "year"
          ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
          : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const label =
        period === "year"
          ? new Intl.DateTimeFormat("en", { month: "short" }).format(date)
          : period === "week"
            ? new Intl.DateTimeFormat("en", { weekday: "short" }).format(date)
            : String(date.getDate()).padStart(2, "0");
      return { date: key, label, total: 0, orders: 0 };
    });
    const pointByDate = new Map(points.map((point) => [point.date, point]));
    for (const sale of sales) {
      const date = new Date(sale.createdAt);
      if (Number.isNaN(date.getTime())) continue;
      const key =
        period === "year"
          ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
          : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const point = pointByDate.get(key);
      if (!point) continue;
      point.total += Number(sale.total || 0);
      point.orders += 1;
    }
    return points;
  };
  const chart = trend(chartPeriod);
  const maxSales = Math.max(1, ...chart.map((day) => day.total));
  const productTotals = new Map();
  for (const sale of monthSales) {
    for (const item of sale.items || []) {
      const name = item.name || "Product";
      productTotals.set(
        name,
        (productTotals.get(name) || 0) + Number(item.quantity || 0),
      );
    }
  }
  const topProducts = [...productTotals]
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);
  const totalProductUnits = topProducts.reduce(
    (sum, product) => sum + Number(product.quantity || 0),
    0,
  );
  const productColors = ["#f26a21", "#2b2f38", "#f59e0b", "#ff9468", "#ffc9a8"];
  let runningShare = 0;
  const productSlices = topProducts.map((product, index) => {
    const share = totalProductUnits
      ? (Number(product.quantity || 0) / totalProductUnits) * 100
      : 0;
    const start = runningShare;
    runningShare += share;
    return {
      ...product,
      color: productColors[index % productColors.length],
      share,
      start,
      end: runningShare,
    };
  });
  const donutRadius = 46;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const donutGap = productSlices.length > 1 ? 1.6 : 0;
  const bestIndex = chart.reduce(
    (best, point, index) => (point.total > chart[best].total ? index : best),
    0,
  );
  const chartTotal = chart.reduce((sum, point) => sum + point.total, 0);
  const gridSteps = [1, 0.75, 0.5, 0.25, 0];
  const compact = (value) =>
    new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  const cards = [
    {
      label: "Sales this month",
      value: money(summary.monthRevenue, currency),
      icon: CircleDollarSign,
      tone: "violet",
    },
    {
      label: "Sales this year",
      value: money(summary.yearRevenue, currency),
      icon: TrendingUp,
      tone: "blue",
    },
    {
      label: "Orders this month",
      value: summary.monthOrders || 0,
      icon: ShoppingCart,
      tone: "mint",
    },
    {
      label: "Expenses this month",
      value: money(summary.monthExpenses, currency),
      icon: ArrowDownRight,
      tone: "amber",
    },
  ];

  return (
    <div className="page dashboard-page">
      <section className="dashboard-kpis">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <article className={`dashboard-kpi ${tone}`} key={label}>
            <span className={`dashboard-kpi-icon ${tone}`}>
              <Icon size={18} />
            </span>
            <span className="dashboard-kpi-label">{label}</span>
            <strong>{loading ? "—" : value}</strong>
          </article>
        ))}
      </section>

      <section className="dashboard-main-grid">
        <article className="box dashboard-chart-card">
          <div className="panel-title">
            <div>
              <h3>Sales performance</h3>
              <p>
                {chartPeriod === "week"
                  ? "Daily sales for the last 7 days"
                  : chartPeriod === "month"
                    ? "Daily sales for the last 30 days"
                    : "Monthly sales for the last 12 months"}
              </p>
            </div>
            <div className="dashboard-chart-controls">
              <select
                aria-label="Sales chart period"
                value={chartPeriod}
                onChange={(event) => setChartPeriod(event.target.value)}
              >
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
              </select>
              <span className="live-tag">
                <i /> Live
              </span>
            </div>
          </div>
          {chart.length ? (
            <div className="trend-chart" key={chartPeriod}>
              <div className="trend-chart-axis" aria-hidden="true">
                {gridSteps.map((step) => (
                  <span key={step}>{compact(maxSales * step)}</span>
                ))}
              </div>
              <div
                className={`trend-chart-bars ${chartPeriod}`}
                role="img"
                aria-label={`Sales for the selected ${chartPeriod} period: ${money(chartTotal, currency)} in total`}
              >
                {gridSteps.map((step) => (
                  <i
                    className="trend-chart-grid"
                    key={step}
                    style={{ bottom: `calc(22px + ${step} * (100% - 22px))` }}
                  />
                ))}
                {chart.map((day, index) => {
                  const best = index === bestIndex && day.total > 0;
                  return (
                    <div
                      className={`trend-bar${best ? " best" : ""}`}
                      key={day.date}
                      title={`${day.label}: ${money(day.total, currency)}; ${day.orders} orders`}
                    >
                      <div className="trend-bar-track">
                        <span
                          className="trend-bar-fill"
                          style={{
                            height: `${Math.max(3, (day.total / maxSales) * 100)}%`,
                            animationDelay: `${index * (chart.length > 12 ? 18 : 55)}ms`,
                          }}
                        >
                          {best && (
                            <em className="trend-bar-tip">
                              {money(day.total, currency)}
                            </em>
                          )}
                        </span>
                      </div>
                      <small>{day.label}</small>
                    </div>
                  );
                })}
              </div>
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
              <p>Share of units sold this month</p>
            </div>
          </div>
          {productSlices.length && totalProductUnits ? (
            <div className="donut-wrap">
              <div className="sales-donut">
                <svg
                  viewBox="0 0 120 120"
                  role="img"
                  aria-label={productSlices
                    .map(
                      (product) =>
                        `${product.name}: ${product.quantity} sold, ${product.share.toFixed(1)} percent`,
                    )
                    .join(". ")}
                >
                  <circle className="donut-base" cx="60" cy="60" r={donutRadius} />
                  {productSlices.map((product, index) => {
                    const length = (product.share / 100) * donutCircumference;
                    return (
                      <circle
                        key={product.name}
                        className="donut-slice"
                        cx="60"
                        cy="60"
                        r={donutRadius}
                        stroke={product.color}
                        strokeDasharray={`${Math.max(0, length - donutGap)} ${donutCircumference}`}
                        strokeDashoffset={-(product.start / 100) * donutCircumference}
                        style={{ animationDelay: `${index * 120}ms` }}
                      >
                        <title>{`${product.name}: ${product.quantity} sold (${product.share.toFixed(0)}%)`}</title>
                      </circle>
                    );
                  })}
                </svg>
                <div className="donut-center">
                  <strong>{totalProductUnits.toLocaleString()}</strong>
                  <span>units sold</span>
                </div>
              </div>
              <ul className="donut-legend">
                {productSlices.map((product) => (
                  <li key={product.name} title={`${product.quantity} sold`}>
                    <i style={{ backgroundColor: product.color }} />
                    <span>{product.name}</span>
                  </li>
                ))}
              </ul>
              <div className="donut-summary">
                <div>
                  <span className="donut-mini-bars" aria-hidden="true">
                    {productSlices.map((product) => (
                      <i
                        key={product.name}
                        style={{
                          height: `${Math.max(25, (product.share / productSlices[0].share) * 100)}%`,
                          backgroundColor: product.color,
                        }}
                      />
                    ))}
                  </span>
                  <p>
                    <strong>{productSlices[0].share.toFixed(0)}%</strong>
                    <small>Top share</small>
                  </p>
                </div>
                <div>
                  <p>
                    <strong>{productSlices[0].quantity.toLocaleString()}</strong>
                    <small>{productSlices[0].name} sold</small>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state compact-empty">
              <p>No product sales recorded this month.</p>
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
                      <td>{money(sale.total, currency)}</td>
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
