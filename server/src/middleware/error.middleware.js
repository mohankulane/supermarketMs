export function errorMiddleware(error, _req, res, _next) {
  console.error(error);
  const status =
    error.status ||
    (error.name === "ValidationError" || error.name === "CastError"
      ? 400
      : 500);
  if (error.code === 11000) {
    return res
      .status(409)
      .json({ error: "A record with this value already exists" });
  }
  res.status(status).json({ error: error.message });
}
