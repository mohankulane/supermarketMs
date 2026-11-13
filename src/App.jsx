import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Bell,
  Boxes,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CircleHelp,
  Clock3,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  RotateCcw,
  Receipt,
  Search,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import { api, loadSystemData } from "./api/api.js";
import Audit from "./pages/AuditPage.jsx";
import Customers from "./pages/CustomersPage.jsx";
import Dashboard from "./pages/DashboardPage.jsx";
import Expenses from "./pages/ExpensesPage.jsx";
import Inventory from "./pages/InventoryPage.jsx";
import Invoices from "./pages/InvoicesPage.jsx";
import Login from "./pages/LoginPage.jsx";
import Purchases from "./pages/PurchasesPage.jsx";
import Reports from "./pages/ReportsPage.jsx";
import Returns from "./pages/ReturnsPage.jsx";
import Sales from "./pages/SalesPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import ReceiptView from "./components/common/ReceiptView.jsx";
import Suppliers from "./pages/SuppliersPage.jsx";
import Shifts from "./pages/ShiftsPage.jsx";
import freshmartLogo from "./assets/freshmart-logo.svg";

const navigation = [
  ["Dashboard", LayoutDashboard],
  ["Sales", ShoppingCart],
  ["Invoices", FileText],
  ["Inventory", Package],
  ["Purchases", Truck],
  ["Suppliers", Building2],
  ["Expenses", Wallet],
  ["Shifts", Clock3],
  ["Customers", Users],
  ["Reports", BarChart3],
  ["Audit log", CircleHelp],
  ["Settings", Settings],
];

const emptyData = {
  products: [],
  suppliers: [],
  customers: [],
  purchases: [],
  sales: [],
  expenses: [],
  returns: [],
  shifts: [],
  audit: [],
  dashboard: null,
  settings: { branches: [], paymentMethods: [], users: [], store: {} },
};

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [page, setPage] = useState("Dashboard");
  const [data, setData] = useState(emptyData);
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [receipt, setReceipt] = useState(null);
  const [returnTarget, setReturnTarget] = useState(null);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    const nextData = await loadSystemData();
    setData(nextData);
    setPaymentMethod((current) =>
      nextData.settings.paymentMethods.some(
        (method) => method.name === current && method.status !== "Inactive",
      )
        ? current
        : nextData.settings.paymentMethods.find(
            (method) => method.isDefault && method.status !== "Inactive",
          )?.name ||
          nextData.settings.paymentMethods.find(
            (method) => method.status !== "Inactive",
          )?.name ||
          "Cash",
    );
    setError("");
    return nextData;
  }, []);

  useEffect(() => {
    let active = true;
    loadSystemData()
      .then((nextData) => {
        if (!active) return;
        setData(nextData);
        setPaymentMethod(
          nextData.settings.paymentMethods.find(
            (method) => method.isDefault && method.status !== "Inactive",
          )?.name ||
            nextData.settings.paymentMethods.find(
              (method) => method.status !== "Inactive",
            )?.name ||
            "Cash",
        );
        setError("");
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const perform = async (operation, successMessage = "Changes saved.") => {
    setError("");
    setNotice("");
    try {
      const result = await operation();
      await refresh();
      setNotice(successMessage);
      return result;
    } catch (requestError) {
      setError(requestError.message);
      return null;
    }
  };

  const addToCart = (product) => {
    const quantityInCart =
      cart.find((item) => item._id === product._id)?.quantity || 0;
    if (quantityInCart >= product.stock) {
      setError(`There is not enough stock for ${product.name}.`);
      return;
    }
    setCart((items) => {
      const existing = items.find((item) => item._id === product._id);
      return existing
        ? items.map((item) =>
            item._id === product._id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          )
        : [...items, { ...product, quantity: 1 }];
    });
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0,
  );
  const discountAmount = Math.min(
    subtotal,
    Math.max(0, (subtotal * Number(discount || 0)) / 100),
  );
  const total = subtotal - discountAmount;

  const completeSale = async () => {
    if (!cart.length) {
      setError("Add at least one product before completing the sale.");
      return;
    }
    const sale = await perform(
      () =>
        api.sales.create({
          items: cart.map((item) => ({
            product: item._id,
            name: item.name,
            quantity: item.quantity,
            price: Number(item.price),
          })),
          subtotal,
          discount: discountAmount,
          total,
          paymentMethod,
          customer: customerId || undefined,
        }),
      "Sale completed.",
    );
    if (sale) {
      setReceipt(sale);
      setCart([]);
      setDiscount("");
    }
  };

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query
      ? data.products
          .filter(
            (product) =>
              product.name.toLowerCase().includes(query) ||
              product.sku.toLowerCase().includes(query),
          )
          .slice(0, 5)
      : [];
  }, [data.products, search]);

  const lowStock = data.dashboard?.lowStock || [];
  const storeName = data.settings.store?.name || "FreshMart Supermarket";
  const today = new Date();
  const isToday = (value) => {
    const date = new Date(value);
    return (
      !Number.isNaN(date.getTime()) && date.toDateString() === today.toDateString()
    );
  };
  const salesToday = data.sales.filter((sale) => isToday(sale.createdAt));
  const salesTodayTotal = salesToday.reduce(
    (sum, sale) => sum + Number(sale.total || 0),
    0,
  );
  const expensesThisMonth = data.expenses
    .filter((expense) => {
      const date = new Date(expense.expenseDate);
      return (
        !Number.isNaN(date.getTime()) &&
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth()
      );
    })
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const stockUnits = data.products.reduce(
    (sum, product) => sum + Number(product.stock || 0),
    0,
  );
  const retailStockValue = data.products.reduce(
    (sum, product) =>
      sum + Number(product.stock || 0) * Number(product.price || 0),
    0,
  );
  const purchaseTotal = data.purchases.reduce(
    (sum, purchase) => sum + Number(purchase.total || 0),
    0,
  );
  const expenseTotal = data.expenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0,
  );
  const completedReturns = data.returns.filter(
    (record) => record.status === "Completed",
  );
  const returnedUnits = completedReturns.reduce(
    (sum, record) =>
      sum +
      (record.items || []).reduce(
        (itemSum, item) => itemSum + Number(item.quantity || 0),
        0,
      ),
    0,
  );
  const openShifts = data.shifts.filter((shift) => shift.status === "Open");
  const receivedPurchases = data.purchases.filter(
    (purchase) => purchase.status === "Received",
  );
  const openPurchases = data.purchases.filter((purchase) =>
    ["Draft", "Ordered"].includes(purchase.status),
  );
  const totalRefunds = completedReturns.reduce(
    (sum, record) => sum + Number(record.refundAmount || 0),
    0,
  );
  const totalCustomerVisits = data.customers.reduce(
    (sum, customer) => sum + Number(customer.visits || 0),
    0,
  );
  const totalCustomerSpend = data.customers.reduce(
    (sum, customer) => sum + Number(customer.spent || 0),
    0,
  );
  const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;
  const pageKpis = {
    Sales: [
      {
        label: "Sales today",
        value: formatCurrency(salesTodayTotal),
        icon: Wallet,
      },
      {
        label: "Transactions today",
        value: salesToday.length,
        icon: Receipt,
      },
      {
        label: "Products available",
        value: data.products.filter((product) => Number(product.stock) > 0)
          .length,
        icon: Package,
      },
      {
        label: "Current cart",
        value: formatCurrency(total),
        icon: ShoppingCart,
      },
    ],
    Inventory: [
      { label: "Products", value: data.products.length, icon: Package },
      { label: "Units in stock", value: stockUnits, icon: Boxes },
      {
        label: "Low-stock items",
        value: data.products.filter(
          (product) =>
            Number(product.stock) <= Number(product.reorderLevel ?? 10),
        ).length,
        icon: Bell,
      },
      {
        label: "Retail stock value",
        value: formatCurrency(retailStockValue),
        icon: Wallet,
      },
    ],
    Purchases: [
      { label: "Purchase orders", value: data.purchases.length, icon: Truck },
      { label: "Orders to receive", value: openPurchases.length, icon: Clock3 },
      {
        label: "Received orders",
        value: receivedPurchases.length,
        icon: Package,
      },
      {
        label: "Purchase value",
        value: formatCurrency(purchaseTotal),
        icon: Wallet,
      },
    ],
    Suppliers: [
      {
        label: "Total suppliers",
        value: data.suppliers.length,
        icon: Building2,
      },
      {
        label: "Active suppliers",
        value: data.suppliers.filter((supplier) => supplier.status === "Active")
          .length,
        icon: Users,
      },
      {
        label: "Open purchase orders",
        value: openPurchases.length,
        icon: Truck,
      },
    ],
    Expenses: [
      { label: "Expense records", value: data.expenses.length, icon: FileText },
      {
        label: "Expenses this month",
        value: formatCurrency(expensesThisMonth),
        icon: Wallet,
      },
      {
        label: "Total recorded",
        value: formatCurrency(expenseTotal),
        icon: BarChart3,
      },
    ],
    Shifts: [
      { label: "Open shifts", value: openShifts.length, icon: Clock3 },
      {
        label: "Closed shifts",
        value: data.shifts.filter((shift) => shift.status !== "Open").length,
        icon: FileText,
      },
      {
        label: "Opening cash in tills",
        value: formatCurrency(
          openShifts.reduce(
            (sum, shift) => sum + Number(shift.openingCash || 0),
            0,
          ),
        ),
        icon: Wallet,
      },
      {
        label: "Shifts today",
        value: data.shifts.filter((shift) => isToday(shift.createdAt)).length,
        icon: BarChart3,
      },
    ],
    Returns: [
      {
        label: "Completed returns",
        value: completedReturns.length,
        icon: RotateCcw,
      },
      {
        label: "Refunds issued",
        value: formatCurrency(totalRefunds),
        icon: Wallet,
      },
      { label: "Units returned", value: returnedUnits, icon: Package },
      {
        label: "Pending returns",
        value: data.returns.filter((record) => record.status !== "Completed")
          .length,
        icon: Clock3,
      },
    ],
    Customers: [
      {
        label: "Registered customers",
        value: data.customers.length,
        icon: Users,
      },
      {
        label: "Customer visits",
        value: totalCustomerVisits,
        icon: ShoppingCart,
      },
      {
        label: "Lifetime spend",
        value: formatCurrency(totalCustomerSpend),
        icon: Wallet,
      },
    ],
    "Audit log": [
      { label: "Recorded events", value: data.audit.length, icon: FileText },
      {
        label: "Events today",
        value: data.audit.filter((entry) => isToday(entry.createdAt)).length,
        icon: Clock3,
      },
    ],
  }[page];
  if (!authenticated) {
    return (
      <Login
        login={() => setAuthenticated(true)}
        loading={loading}
        error={error}
      />
    );
  }

  return (
    <div className={`complete${sidebarCollapsed ? " sidebar-collapsed" : ""}`}>
      <aside className={sidebarOpen ? "sidebar-open" : ""}>
        <h2 className="sidebar-brand">
          <img className="app-logo" src={freshmartLogo} alt="" />
          <span>{storeName}</span>
          <button
            className="sidebar-collapse-toggle"
            aria-label={
              sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
          >
            {sidebarCollapsed ? (
              <ChevronRight size={17} />
            ) : (
              <ChevronLeft size={17} />
            )}
          </button>
        </h2>
        <div className="side-label">Workspace</div>
        <nav>
          {navigation.map(([name, Icon]) => (
            <button
              key={name}
              className={page === name ? "on" : ""}
              aria-label={name}
              title={sidebarCollapsed ? name : undefined}
              onClick={() => {
                setPage(name);
                setSidebarOpen(false);
              }}
            >
              <Icon size={17} />
              <span className="sidebar-nav-label">{name}</span>
              {name === "Inventory" && lowStock.length > 0 && (
                <em>{lowStock.length}</em>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button
            className="logout-btn"
            onClick={() => setAuthenticated(false)}
          >
            <LogOut size={17} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      <main>
        <header className="app-header">
          <button
            className="mobile-menu"
            aria-label={sidebarOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen((open) => !open)}
          >
            <Menu size={19} />
          </button>
          <div className="header-brand">
            <img className="app-logo" src={freshmartLogo} alt="" />
            <strong>{storeName}</strong>
          </div>
          <div className="header-search-wrap">
            <label className="global-search">
              <Search size={16} />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search products, SKU..."
              />
              <kbd>/</kbd>
            </label>
            {searchOpen && search && (
              <div className="header-dropdown search-results">
                {filteredProducts.length ? (
                  filteredProducts.map((product) => (
                    <button
                      key={product._id}
                      onClick={() => {
                        setPage("Inventory");
                        setSearchOpen(false);
                      }}
                    >
                      {product.image ? (
                        <img src={product.image} alt="" />
                      ) : (
                        <Package size={18} />
                      )}
                      <span>
                        <b>{product.name}</b>
                        <small>
                          {product.sku} · ${Number(product.price).toFixed(2)}
                        </small>
                      </span>
                    </button>
                  ))
                ) : (
                  <p>No matching products.</p>
                )}
              </div>
            )}
          </div>
          <div className="header-actions">
            <div className="header-popover-wrap">
              <button
                className="header-icon-button"
                aria-label="Notifications"
                onClick={() => setNotificationsOpen((open) => !open)}
              >
                <Bell size={17} />
                {lowStock.length > 0 && <i>{lowStock.length}</i>}
              </button>
              {notificationsOpen && (
                <div className="header-dropdown notifications-dropdown">
                  <b>Stock alerts</b>
                  {lowStock.length ? (
                    lowStock.map((product) => (
                      <p key={product._id}>
                        {product.name} <strong>{product.stock} left</strong>
                      </p>
                    ))
                  ) : (
                    <p>No stock alerts.</p>
                  )}
                </div>
              )}
            </div>
            <div className="header-popover-wrap">
              <button
                className="profile-button"
                onClick={() => setProfileOpen((open) => !open)}
              >
                <span className="profile-avatar">SU</span>
                <span className="profile-label">
                  <b>Store Manager</b>
                  <small>{storeName}</small>
                </span>
                <ChevronDown size={14} />
              </button>
              {profileOpen && (
                <div className="header-dropdown profile-dropdown">
                  <button
                    onClick={() => {
                      setPage("Settings");
                      setProfileOpen(false);
                    }}
                  >
                    <Settings size={15} /> Settings
                  </button>
                  <button onClick={() => setAuthenticated(false)}>
                    <LogOut size={15} /> Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="content-heading">
          <div>
            <h1>{page}</h1>
            <p>
              {page === "Settings"
                ? "Manage store details, payment methods, and team access."
                : `Manage your store operations from ${page.toLowerCase()}.`}
            </p>
          </div>
          {page === "Dashboard" && (
            <button
              className="outline-btn"
              onClick={() => perform(refresh, "Dashboard refreshed.")}
            >
              Refresh data
            </button>
          )}
        </div>

        {(error || notice) && (
          <div className={`app-message ${error ? "error" : "success"}`}>
            <span>{error || notice}</span>
            {error && (
              <button onClick={() => perform(refresh, "Data refreshed.")}>
                Retry
              </button>
            )}
          </div>
        )}

        {pageKpis && <PageKpis cards={pageKpis} />}

        {page === "Dashboard" && (
          <Dashboard dashboard={data.dashboard} loading={loading} />
        )}
        {page === "Sales" && (
          <Sales
            products={data.products}
            customers={data.customers}
            cart={cart}
            setCart={setCart}
            add={addToCart}
            discount={discount}
            setDiscount={setDiscount}
            subtotal={subtotal}
            discountAmount={discountAmount}
            total={total}
            customerId={customerId}
            setCustomerId={setCustomerId}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            paymentMethods={data.settings.paymentMethods}
            pay={completeSale}
          />
        )}
        {page === "Invoices" && (
          <Invoices
            sales={data.sales}
            customers={data.customers}
            returns={data.returns}
            storeName={storeName}
            onReturn={(sale) => {
              setReturnTarget(sale);
              setPage("Returns");
            }}
          />
        )}
        {page === "Inventory" && (
          <Inventory
            products={data.products}
            perform={perform}
            searchQuery={search}
          />
        )}
        {page === "Purchases" && (
          <Purchases
            purchases={data.purchases}
            suppliers={data.suppliers}
            products={data.products}
            perform={perform}
          />
        )}
        {page === "Suppliers" && (
          <Suppliers suppliers={data.suppliers} perform={perform} />
        )}
        {page === "Expenses" && (
          <Expenses expenses={data.expenses} perform={perform} />
        )}
        {page === "Shifts" && <Shifts shifts={data.shifts} perform={perform} />}
        {page === "Returns" && (
          <Returns
            returns={data.returns}
            products={data.products}
            sales={data.sales}
            perform={perform}
            returnTarget={returnTarget}
            clearReturnTarget={() => setReturnTarget(null)}
          />
        )}
        {page === "Customers" && (
          <Customers customers={data.customers} perform={perform} />
        )}
        {page === "Reports" && (
          <Reports
            sales={data.sales}
            expenses={data.expenses}
            customers={data.customers}
            paymentMethods={data.settings.paymentMethods}
            perform={perform}
          />
        )}
        {page === "Audit log" && <Audit audit={data.audit} />}
        {page === "Settings" && (
          <SettingsPage settings={data.settings} perform={perform} />
        )}
      </main>
      {receipt && (
        <ReceiptView
          sale={receipt}
          storeName={storeName}
          close={() => setReceipt(null)}
        />
      )}
    </div>
  );
}

function PageKpis({ cards }) {
  return (
    <section className="page-kpi-grid" aria-label="Page summary">
      {cards.map(({ label, value, icon: Icon }, index) => (
        <article className="page-kpi" key={label}>
          <span className={`page-kpi-icon tone-${index % 4}`}>
            <Icon size={17} />
          </span>
          <span className="page-kpi-label">{label}</span>
          <strong>{value}</strong>
        </article>
      ))}
    </section>
  );
}

export default App;
