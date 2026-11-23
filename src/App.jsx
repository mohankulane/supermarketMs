import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  BarChart3,
  Bell,
  Boxes,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
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
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { api, loadSystemData } from "./api/api.js";
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
import ProfilePage from "./pages/ProfilePage.jsx";
import ReceiptView from "./components/common/ReceiptView.jsx";
import Suppliers from "./pages/SuppliersPage.jsx";
import freshmartLogo from "./assets/freshmart-logo.svg";
import FirstRunSetupPage from "./pages/FirstRunSetupPage.jsx";
import PasswordChangePage from "./pages/PasswordChangePage.jsx";
import Toast from "./components/common/Toast.jsx";
import { canAccessPage, firstAccessiblePage, hasPermission } from "./auth/permissions.js";

const navigation = [
  ["Dashboard", LayoutDashboard],
  ["Sales", ShoppingCart],
  ["Inventory", Package],
  ["Invoices", FileText],
  ["Purchases", Truck],
  ["Suppliers", Building2],
  ["Returns", RotateCcw],
  ["Expenses", Wallet],
  ["Reports", BarChart3],
  ["Settings", Settings],
];

const emptyData = {
  products: [],
  suppliers: [],
  purchases: [],
  sales: [],
  expenses: [],
  returns: [],
  audit: [],
  dashboard: null,
  settings: { paymentMethods: [], users: [], store: {} },
};

function App() {
  const [user, setUser] = useState(null);
  const [setupRequired, setSetupRequired] = useState(false);
  const [storeBrand, setStoreBrand] = useState({
    name: "FreshMart Supermarket",
    logoUrl: "",
  });
  const [authLoading, setAuthLoading] = useState(true);
  const [authBusy, setAuthBusy] = useState(false);
  const [page, setPage] = useState("Dashboard");
  const [data, setData] = useState(emptyData);
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [receipt, setReceipt] = useState(null);
  const [returnTarget, setReturnTarget] = useState(null);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(
    async (activeUser = user) => {
      if (!activeUser) return emptyData;
      const nextData = await loadSystemData(activeUser);
      setData(nextData);
      setStoreBrand({
        name: nextData.settings.store?.name || "FreshMart Supermarket",
        logoUrl: nextData.settings.store?.logoUrl || "",
      });
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
    },
    [user],
  );

  useEffect(() => {
    let active = true;
    const restoreSession = async () => {
      try {
        const status = await api.auth.setupStatus();
        if (!active) return;
        setSetupRequired(status.setupRequired);
        setStoreBrand({
          name: status.storeName,
          logoUrl: status.logoUrl,
        });
        if (!status.setupRequired) {
          try {
            const currentUser = await api.auth.me();
            if (!active) return;
            setUser(currentUser);
            setPage(firstAccessiblePage(currentUser) || "Sales");
          } catch (sessionError) {
            if (!active) return;
            if (sessionError.status !== 401) throw sessionError;
          }
        }
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setAuthLoading(false);
      }
    };
    restoreSession();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setData(emptyData);
      return undefined;
    }
    let active = true;
    setLoading(true);
    refresh(user)
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refresh, user]);

  const authenticate = async (operation, values) => {
    setAuthBusy(true);
    setError("");
    try {
      const currentUser = await operation(values);
      setSetupRequired(false);
      setUser(currentUser);
      setPage(firstAccessiblePage(currentUser) || "Sales");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogin = (credentials) => authenticate(api.auth.login, credentials);
  const handleSetup = (credentials) => authenticate(api.auth.setup, credentials);

  const handlePasswordChange = async (password) => {
    setAuthBusy(true);
    setError("");
    try {
      const updatedUser = await api.auth.changePassword(password);
      setUser(updatedUser);
      setNotice("Password updated.");
      return true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    } finally {
      setAuthBusy(false);
    }
  };

  const handleAvatarChange = async (avatarUrl) => {
    setError("");
    try {
      const updatedUser = await api.auth.updateAvatar(avatarUrl);
      setUser(updatedUser);
      setNotice(avatarUrl ? "Profile photo updated." : "Profile photo removed.");
      return true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    }
  };

  const signOut = async () => {
    try {
      await api.auth.logout();
      setUser(null);
      setData(emptyData);
      setPage("Dashboard");
      setCart([]);
      setReceipt(null);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

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

  const lowStock =
    data.dashboard?.lowStock ||
    data.products.filter((product) => product.stock <= product.reorderLevel);
  const storeName = data.settings.store?.name || storeBrand.name;
  const storeLogo = data.settings.store?.logoUrl || storeBrand.logoUrl;
  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: data.settings.store?.currency || "USD",
    }).format(Number(value || 0));
  const visibleNavigation = navigation.filter(([name]) =>
    canAccessPage(user, name),
  );
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
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
    })
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  const pageKpis = {
    Dashboard: [
      { label: "Sales today", value: formatCurrency(salesTodayTotal), icon: Wallet },
      { label: "Orders today", value: salesToday.length, icon: Receipt },
      { label: "Products", value: data.products.length, icon: Package },
      { label: "Low stock", value: lowStock.length, icon: Boxes },
    ],
    Sales: [
      {
        label: "Products available",
        value: data.products.filter((product) => Number(product.stock) > 0).length,
        icon: Package,
      },
      { label: "Current cart", value: formatCurrency(total), icon: ShoppingCart },
      { label: "Low stock", value: lowStock.length, icon: Boxes },
    ],
    Inventory: [
      { label: "Products", value: data.products.length, icon: Package },
      { label: "Low stock", value: lowStock.length, icon: Boxes },
      {
        label: "Retail stock value",
        value: formatCurrency(
          data.products.reduce(
            (sum, product) =>
              sum + Number(product.price || 0) * Number(product.stock || 0),
            0,
          ),
        ),
        icon: Wallet,
      },
    ],
    Invoices: [
      { label: "Invoices", value: data.sales.length, icon: FileText },
      {
        label: "Recorded sales",
        value: formatCurrency(
          data.sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0),
        ),
        icon: Wallet,
      },
    ],
    Purchases: [
      { label: "Purchase orders", value: data.purchases.length, icon: Truck },
      {
        label: "Suppliers",
        value: data.suppliers.length,
        icon: Building2,
      },
    ],
    Suppliers: [
      { label: "Suppliers", value: data.suppliers.length, icon: Truck },
      {
        label: "Purchase orders",
        value: data.purchases.length,
        icon: Receipt,
      },
    ],
    Returns: [
      {
        label: "Completed returns",
        value: data.returns.filter((record) => record.status === "Completed").length,
        icon: RotateCcw,
      },
      {
        label: "Refunds issued",
        value: formatCurrency(
          data.returns
            .filter((record) => record.status === "Completed")
            .reduce((sum, record) => sum + Number(record.total || 0), 0),
        ),
        icon: Wallet,
      },
    ],
    Expenses: [
      { label: "Expenses this month", value: formatCurrency(expensesThisMonth), icon: Wallet },
      {
        label: "Recorded expenses",
        value: data.expenses.length,
        icon: Receipt,
      },
    ],
    Reports: [
      {
        label: "Recorded sales",
        value: formatCurrency(
          data.sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0),
        ),
        icon: Wallet,
      },
      { label: "Transactions", value: data.sales.length, icon: Receipt },
      { label: "Expenses this month", value: formatCurrency(expensesThisMonth), icon: Wallet },
    ],
  }[page];

  if (authLoading) {
    return <main className="auth-loading">Loading your secure session...</main>;
  }
  if (!user) {
    if (setupRequired) {
      return (
        <FirstRunSetupPage
          onSetup={handleSetup}
          loading={authBusy}
          error={error}
          logoUrl={storeBrand.logoUrl}
        />
      );
    }
    return (
      <Login
        login={handleLogin}
        loading={authBusy}
        error={error}
        logoUrl={storeBrand.logoUrl}
        storeName={storeBrand.name}
      />
    );
  }
  if (user.mustChangePassword) {
    return (
      <PasswordChangePage
        user={user}
        onChangePassword={handlePasswordChange}
        loading={authBusy}
        error={error}
      />
    );
  }

  if (!visibleNavigation.length) {
    return (
      <main className="access-denied">
        <p>Your account has no assigned pages. Ask an Owner to update access.</p>
        <button className="outline-btn" onClick={signOut}>
          <LogOut size={15} /> Sign out
        </button>
      </main>
    );
  }
  return (
    <>
      <div className={`complete${sidebarCollapsed ? " sidebar-collapsed" : ""}`}>
        <aside className={sidebarOpen ? "sidebar-open" : ""}>
          <h2 className="sidebar-brand">
            <img
              className="app-logo"
              src={storeLogo || freshmartLogo}
              alt=""
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = freshmartLogo;
              }}
            />
            <span>{storeName}</span>
            <button
              className="sidebar-collapse-toggle"
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
            >
              {sidebarCollapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
            </button>
          </h2>
          <div className="side-label">Workspace</div>
          <nav className={user.role === "Cashier" ? "nav-stacked" : undefined}>
            {visibleNavigation.map(([name, Icon]) => (
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
            <button className="logout-btn" onClick={signOut}>
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
                          setPage(canAccessPage(user, "Inventory") ? "Inventory" : "Sales");
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
                            {product.sku} - ${Number(product.price).toFixed(2)}
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
                  aria-expanded={notificationsOpen}
                  onClick={() => setNotificationsOpen((open) => !open)}
                >
                  <Bell size={17} />
                  {lowStock.length > 0 && <i aria-label="Unread alerts" />}
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
                  aria-expanded={profileOpen}
                  onClick={() => setProfileOpen((open) => !open)}
                >
                  <span className="profile-avatar">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" />
                    ) : (
                      user.name.slice(0, 2).toUpperCase()
                    )}
                  </span>
                  <span className="profile-label">
                    <b>{user.name}</b>
                    <small>{user.role}</small>
                  </span>
                  <ChevronDown size={14} />
                </button>
                {profileOpen && (
                  <div className="header-dropdown profile-dropdown">
                    <button
                      onClick={() => {
                        setPage("Profile");
                        setProfileOpen(false);
                      }}
                    >
                      <UserRound size={15} /> My profile
                    </button>
                    {canAccessPage(user, "Settings") && (
                      <button
                        onClick={() => {
                          setPage("Settings");
                          setProfileOpen(false);
                        }}
                      >
                        <Settings size={15} /> Settings
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </header>

          <div className="content-heading" key={`heading-${page}`}>
            <div>
              <h1>{page}</h1>
              <p>
                {page === "Settings"
                  ? "Manage store details, team access, and activity."
                  : page === "Profile"
                  ? "View your account details and update your password."
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

          {pageKpis && page !== "Dashboard" && <PageKpis key={`kpis-${page}`} cards={pageKpis} />}

          {page === "Dashboard" && (
            <Dashboard
              dashboard={data.dashboard}
              sales={data.sales}
              expenses={data.expenses}
              currency={data.settings.store?.currency || "USD"}
              loading={loading}
            />
          )}
          {page === "Sales" && (
            <Sales
              products={data.products}
              cart={cart}
              setCart={setCart}
              add={addToCart}
              discount={discount}
              setDiscount={setDiscount}
              subtotal={subtotal}
              discountAmount={discountAmount}
              total={total}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              paymentMethods={data.settings.paymentMethods}
              pay={completeSale}
            />
          )}
          {page === "Invoices" && (
            <Invoices
              sales={data.sales}
              returns={data.returns}
              storeName={storeName}
              storeLogo={storeLogo}
              canManageReturns={hasPermission(user, "returns:manage")}
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
              canManage={hasPermission(user, "inventory:manage")}
            />
          )}
          {page === "Purchases" && (
            <Purchases
              purchases={data.purchases}
              suppliers={data.suppliers}
              products={data.products}
              paymentMethods={data.settings.paymentMethods}
              currency={data.settings.store?.currency || "USD"}
              perform={perform}
              canManage={hasPermission(user, "purchases:manage")}
              canManageInventory={hasPermission(user, "inventory:manage")}
            />
          )}
          {page === "Suppliers" && (
            <Suppliers
              suppliers={data.suppliers}
              purchases={data.purchases}
              paymentMethods={data.settings.paymentMethods}
              currency={data.settings.store?.currency || "USD"}
              perform={perform}
              canManage={hasPermission(user, "suppliers:manage")}
              canViewPurchases={hasPermission(user, "purchases:view")}
              canManagePurchases={hasPermission(user, "purchases:manage")}
            />
          )}
          {page === "Expenses" && (
            <Expenses
              expenses={data.expenses}
              perform={perform}
              canManage={hasPermission(user, "expenses:manage")}
            />
          )}
          {page === "Returns" && (
            <Returns
              returns={data.returns}
              products={data.products}
              sales={data.sales}
              perform={perform}
              returnTarget={returnTarget}
              clearReturnTarget={() => setReturnTarget(null)}
              canManage={hasPermission(user, "returns:manage")}
            />
          )}
          {page === "Reports" && (
            <Reports
              sales={data.sales}
              expenses={data.expenses}
              products={data.products}
              suppliers={data.suppliers}
              purchases={data.purchases}
              returns={data.returns}
              paymentMethods={data.settings.paymentMethods}
              currency={data.settings.store?.currency || "USD"}
              perform={perform}
              canManage={hasPermission(user, "reports:manage")}
            />
          )}
          {page === "Profile" && (
            <ProfilePage
              user={user}
              onChangePassword={handlePasswordChange}
              onChangeAvatar={handleAvatarChange}
              busy={authBusy}
            />
          )}
          {page === "Settings" && (
            <SettingsPage
              settings={data.settings}
              audit={data.audit}
              perform={perform}
              canManageSettings={hasPermission(user, "settings:manage")}
              canManageUsers={user.role === "Owner"}
              canViewAudit={hasPermission(user, "audit:view")}
            />
          )}
        </main>
        {Boolean(error || notice) && (
          <Toast
            message={error || notice}
            type={error ? "error" : "success"}
            onClose={() => (error ? setError("") : setNotice(""))}
          />
        )}
      </div>
      {receipt &&
        createPortal(
          <ReceiptView
            sale={receipt}
            storeName={storeName}
            storeLogo={storeLogo}
            close={() => setReceipt(null)}
          />,
          document.body,
        )}
    </>
  );
}

function PageKpis({ cards }) {
  return (
    <section className="page-kpi-grid" aria-label="Page summary">
      {cards.map(({ label, value, icon: Icon }, index) => (
        <article className={`page-kpi tone-${index % 4}`} key={label}>
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
