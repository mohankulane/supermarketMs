export const getHealth = (_req, res) =>
  res.json({ status: "ok", service: "freshmart-api" });
