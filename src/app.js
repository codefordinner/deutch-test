const path = require("path");
const express = require("express");
const session = require("express-session");
const config = require("./config");
const apiRoutes = require("./routes");
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
