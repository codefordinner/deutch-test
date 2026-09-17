const path = require("path");
const express = require("express");
const session = require("express-session");
const config = require("./config");
const apiRoutes = require("./routes");
const analyticsService = require("./services/analyticsService");
const { notFoundHandler, globalErrorHandler } = require("./middlewares/errorHandler");

const app = express();

// Middlewares
app.use(express.json());
app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: config.sessionMaxAge,
      httpOnly: true,
      sameSite: "lax"
    }
  })
);

// Automatic visitor tracking for HTML page requests & main API calls
app.use((req, res, next) => {
  const p = req.path;
  // Skip static assets (.css, .js, .png, .ico, .map, etc.) and analytics polling
  const isStatic = /\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|map)$/i.test(p);
  const isAnalyticsPoll = p.startsWith("/api/analytics/stats") || p.startsWith("/api/analytics/logs");

  if (!isStatic && !isAnalyticsPoll && req.method === "GET") {
    const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
               req.headers["x-real-ip"] ||
               req.socket.remoteAddress ||
               req.ip ||
               "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "";
    const referrer = req.headers["referer"] || req.headers["referrer"] || null;

    // Asynchronously log without blocking response
    setImmediate(() => {
      analyticsService.logVisit({
        ip,
        userAgent,
        page: p,
        action: p.startsWith("/api") ? "api_call" : "page_view",
        referrer
      }).catch(() => {});
    });
  }
  next();
});

// Protected static HTML route for admin panel
app.get("/admin.html", (req, res) => {
  if (req.session && req.session.isAdmin) {
    return res.sendFile(path.join(__dirname, "..", "public", "admin.html"));
  }
  return res.redirect("/admin-login.html");
});

// API Routes
app.use("/api", apiRoutes);

// Public Static Files
app.use(express.static(path.join(__dirname, "..", "public")));

// Error Handlers
app.use(notFoundHandler);
app.use(globalErrorHandler);

module.exports = app;
