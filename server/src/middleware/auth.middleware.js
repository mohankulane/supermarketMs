import { authenticateRequest } from "../services/auth.service.js";
import { hasPermission } from "../security/permissions.js";

export async function authenticate(req, res, next) {
  try {
    req.user = await authenticateRequest(req);
    if (!req.user) {
      return res.status(401).json({ error: "Please sign in to continue." });
    }
    next();
  } catch (error) {
    next(error);
  }
}

export function requirePermission(...permissions) {
  return (req, res, next) => {
    if (req.user?.mustChangePassword) {
      return res.status(403).json({ error: "Change your password to continue." });
    }
    if (permissions.some((permission) => hasPermission(req.user, permission))) {
      return next();
    }
    return res.status(403).json({ error: "You do not have access to this area." });
  };
}

export function requireAnyPermission(...permissions) {
  return requirePermission(...permissions);
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (req.user?.mustChangePassword) {
      return res.status(403).json({ error: "Change your password to continue." });
    }
    if (req.user?.role === "Owner" || roles.includes(req.user?.role)) {
      return next();
    }
    return res.status(403).json({ error: "Owner access is required." });
  };
}
