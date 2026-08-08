function notFoundHandler(req, res, next) {
  res.status(404).json({ error: "Запрашиваемый ресурс не найден" });
}

function globalErrorHandler(err, req, res, next) {
  console.error(`[Server Error] ${req.method} ${req.url}:`, err);
  const status = err.status || 500;
  const message = err.message || "Внутренняя ошибка сервера";
  res.status(status).json({ error: message });
}

module.exports = {
  notFoundHandler,
  globalErrorHandler
};
