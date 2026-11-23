export const PERMISSION_GROUPS = [
  {
    title: "Pages",
    permissions: [
      ["dashboard:view", "Dashboard"],
      ["sales:use", "Sales / POS"],
      ["inventory:view", "Inventory"],
      ["invoices:view", "Invoices"],
      ["purchases:view", "Purchases"],
      ["suppliers:view", "Suppliers"],
      ["returns:view", "Returns"],
      ["expenses:view", "Expenses"],
      ["reports:view", "Reports"],
      ["settings:manage", "Settings"],
      ["audit:view", "Audit log"],
    ],
  },
  {
    title: "Management",
    permissions: [
      ["inventory:manage", "Manage inventory"],
      ["purchases:manage", "Manage purchases"],
      ["suppliers:manage", "Manage suppliers"],
      ["returns:manage", "Manage returns"],
      ["expenses:manage", "Manage expenses"],
      ["reports:manage", "Edit reports and void sales"],
    ],
  },
];

export const DEFAULT_ROLE_PERMISSIONS = {
  Owner: PERMISSION_GROUPS.flatMap((group) =>
    group.permissions.map(([permission]) => permission),
  ),
  Manager: [
    "dashboard:view",
    "sales:use",
    "inventory:view",
    "inventory:manage",
    "invoices:view",
    "purchases:view",
    "purchases:manage",
    "suppliers:view",
    "suppliers:manage",
    "returns:view",
    "returns:manage",
    "expenses:view",
    "expenses:manage",
    "reports:view",
    "reports:manage",
  ],
  Cashier: ["sales:use"],
};

const PAGE_PERMISSIONS = {
  Dashboard: ["dashboard:view"],
  Sales: ["sales:use"],
  Inventory: ["inventory:view", "inventory:manage"],
  Invoices: ["invoices:view"],
  Purchases: ["purchases:view", "purchases:manage"],
  Suppliers: ["suppliers:view", "suppliers:manage"],
  Returns: ["returns:view", "returns:manage"],
  Expenses: ["expenses:view", "expenses:manage"],
  Reports: ["reports:view", "reports:manage"],
  Settings: ["settings:manage", "audit:view"],
};

export function hasPermission(user, permission) {
  if (user?.role === "Owner") return true;
  const permissions = new Set(user?.permissions || []);
  return (
    permissions.has(permission) ||
    (permission.endsWith(":view") &&
      permissions.has(permission.replace(/:view$/, ":manage")))
  );
}

export function canAccessPage(user, page) {
  if (page === "Profile") return Boolean(user);
  return (PAGE_PERMISSIONS[page] || []).some((permission) =>
    hasPermission(user, permission),
  );
}

export function firstAccessiblePage(user) {
  return [
    "Dashboard",
    "Sales",
    "Inventory",
    "Invoices",
    "Purchases",
    "Suppliers",
    "Returns",
    "Expenses",
    "Reports",
    "Settings",
  ].find((page) => canAccessPage(user, page));
}
