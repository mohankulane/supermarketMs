const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, { method = "GET", body } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || `Request failed (${response.status})`);
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
  products: resource("/products"),
  suppliers: resource("/suppliers"),
  customers: resource("/customers"),
  purchases: resource("/purchases"),
  sales: resource("/sales"),
  expenses: resource("/expenses"),
  returns: resource("/returns"),
  shifts: resource("/shifts"),
  audit: resource("/audit-logs"),
  settings: {
    get: () => request("/settings"),
    update: (data) => request("/settings", { method: "PATCH", body: data }),
    branches: resource("/settings/branches"),
    paymentMethods: resource("/settings/payment-methods"),
    users: resource("/settings/users"),
  },
  dashboard: () => request("/dashboard"),
  receiveStock: (id, data) =>
    request(`/products/${encodeURIComponent(id)}/stock`, {
      method: "POST",
      body: data,
    }),
  closeShift: (id, data) =>
    request(`/shifts/${encodeURIComponent(id)}/close`, {
      method: "POST",
      body: data,
    }),
  openShift: (data) => request("/shifts/open", { method: "POST", body: data }),
};

export async function loadSystemData() {
  const [
    products,
    suppliers,
    customers,
    purchases,
    sales,
    expenses,
    returns,
    shifts,
    audit,
    dashboard,
    settings,
  ] = await Promise.all([
    api.products.list(),
    api.suppliers.list(),
    api.customers.list(),
    api.purchases.list(),
    request("/sales?limit=0"),
    api.expenses.list(),
    api.returns.list(),
    api.shifts.list(),
    api.audit.list(),
    api.dashboard(),
    api.settings.get(),
  ]);
  return {
    products,
    suppliers,
    customers,
    purchases,
    sales,
    expenses,
    returns,
    shifts,
    audit,
    dashboard,
    settings,
  };
}
