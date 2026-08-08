const authService = require("../services/authService");

class AuthController {
  login(req, res) {
    const password = req.body.password || "";
    if (authService.verifyPassword(password)) {
      req.session.isAdmin = true;
      return res.json({ ok: true });
    }
    return res.status(401).json({ error: "Неверный пароль" });
  }

  logout(req, res) {
    req.session.destroy(() => res.json({ ok: true }));
  }

  getStatus(req, res) {
    res.json({ isAdmin: !!(req.session && req.session.isAdmin) });
  }
}

module.exports = new AuthController();
