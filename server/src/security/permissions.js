export const PERMISSIONS = [
  { key: "dashboard:view", label: "Dashboard", group: "View pages" },
  { key: "sales:use", label: "Sales / POS", group: "View pages" },
  { key: "inventory:view", label: "Inventory", group: "View pages" },
  { key: "inventory:manage", label: "Manage inventory", group: "Manage data" },
  { key: "invoices:view", label: "Invoices", group: "View pages" },
  { key: "purchases:view", label: "Purchases", group: "View pages" },
  { key: "purchases:manage", label: "Manage purchases", group: "Manage data" },
  { key: "suppliers:view", label: "Suppliers", group: "View pages" },
  { key: "suppliers:manage", label: "Manage suppliers", group: "Manage data" },
  { key: "returns:view", label: "Returns", group: "View pages" },
  { key: "returns:manage", label: "Manage returns", group: "Manage data" },
  { key: "expenses:view", label: "Expenses", group: "View pages" },
  { key: "expenses:manage", label: "Manage expenses", group: "Manage data" },
  { key: "reports:view", label: "Reports", group: "View pages" },
  { key: "reports:manage", label: "Edit reports / void sales", group: "Manage data" },
  { key: "settings:manage", label: "Settings", group: "Manage data" },
  { key: "audit:view", label: "Audit log", group: "View pages" },
];

export const ALL_PERMISSIONS = PERMISSIONS.map(({ key }) => key);

export const DEFAULT_ROLE_PERMISSIONS = {
  Owner: ALL_PERMISSIONS,
  Manager: ALL_PERMISSIONS.filter(
    (permission) => !["settings:manage", "audit:view"].includes(permission),
  ),
  Cashier: ["sales:use"],
};

export function normalizePermissions(role, permissions) {
  if (role === "Owner") return [...ALL_PERMISSIONS];
  const source =
    permissions === undefined
      ? DEFAULT_ROLE_PERMISSIONS[role] || []
      : permissions;
  if (!Array.isArray(source)) return [];
  const allowed = new Set(ALL_PERMISSIONS);
  return [...new Set(source.filter((permission) => allowed.has(permission)))];
}

export function hasPermission(user, permission) {
  if (user?.role === "Owner") return true;
  const permissions = normalizePermissions(user?.role, user?.permissions);
  if (permissions.includes(permission)) return true;
  return permission.endsWith(":view")
    ? permissions.includes(permission.replace(/:view$/, ":manage"))
    : false;
}

export function toPublicUser(user) {
  return {
    _id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl || "",
    status: user.status,
    permissions: normalizePermissions(user.role, user.permissions),
    mustChangePassword: Boolean(user.mustChangePassword),
  };
}
