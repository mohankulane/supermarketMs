const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, { method = "GET", body } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    const error = new Error(
      result.error ||
        (response.status === 404
          ? "The server does not support this action yet. Restart the backend server and try again."
          : `Request failed (${response.status})`),
    );
    error.status = response.status;
    throw error;
  }
  if (response.status === 204) return true;
  return response.json();
}

const resource = (path) => ({
  list: () => request(path),
  create: (data) => request(path, { method: "POST", body: data }),
  update: (id, data) =>
    request(`${path}/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: data,
    }),
  remove: (id) =>
    request(`${path}/${encodeURIComponent(id)}`, { method: "DELETE" }),
});

export const api = {
  request,
  auth: {
    setupStatus: () => request("/auth/setup-status"),
    setup: (data) => request("/auth/setup", { method: "POST", body: data }),
    login: (data) => request("/auth/login", { method: "POST", body: data }),
    me: () => request("/auth/me"),
    logout: () => request("/auth/logout", { method: "POST" }),
    changePassword: (password) =>
      request("/auth/password", { method: "POST", body: { password } }),
    updateAvatar: (avatarUrl) =>
      request("/auth/avatar", { method: "PUT", body: { avatarUrl } }),
  },
  products: resource("/products"),
  suppliers: resource("/suppliers"),
  purchases: resource("/purchases"),
  payPurchase: (id, data) =>
    request(`/purchases/${encodeURIComponent(id)}/payments`, {
      method: "POST",
      body: data,
    }),
  sales: resource("/sales"),
  expenses: resource("/expenses"),
  returns: resource("/returns"),
  audit: resource("/audit-logs"),
  settings: {
    get: () => request("/settings"),
    update: (data) => request("/settings", { method: "PATCH", body: data }),
    paymentMethods: resource("/settings/payment-methods"),
    users: resource("/settings/users"),
  },
  dashboard: () => request("/dashboard"),
  receiveStock: (id, data) =>
    request(`/products/${encodeURIComponent(id)}/stock`, {
      method: "POST",
      body: data,
    }),
};

export async function loadSystemData(user) {
  const permissions = new Set(user?.permissions || []);
  const can = (permission) =>
    user?.role === "Owner" ||
    permissions.has(permission) ||
    (permission.endsWith(":view") &&
      permissions.has(permission.replace(/:view$/, ":manage")));
  const canSales = can("sales:use");
  const [
    products,
    suppliers,
    purchases,
    sales,
    expenses,
    returns,
    audit,
    dashboard,
    settings,
  ] = await Promise.all([
    can("inventory:view") || canSales || can("returns:view") || can("reports:view")
      ? api.products.list()
      : [],
    can("suppliers:view") || can("purchases:view") || can("reports:view")
      ? api.suppliers.list()
      : [],
    can("purchases:view") || can("reports:view") ? api.purchases.list() : [],
    can("invoices:view") ||
    can("returns:view") ||
    can("reports:view") ||
    can("dashboard:view")
      ? request("/sales?limit=0")
      : [],
    can("expenses:view") || can("reports:view") || can("dashboard:view")
      ? api.expenses.list()
      : [],
    can("returns:view") || can("invoices:view") || can("reports:view")
      ? api.returns.list()
      : [],
    can("audit:view") ? api.audit.list() : [],
    can("dashboard:view") ? api.dashboard() : null,
    can("settings:manage") || canSales
      ? api.settings.get()
      : { paymentMethods: [], users: [], store: {} },
  ]);
  return {
    products,
    suppliers,
    purchases,
    sales,
    expenses,
    returns,
    audit,
    dashboard,
    settings,
  };
}
