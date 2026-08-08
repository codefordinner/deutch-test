const config = require("../config");

class AuthService {
  verifyPassword(password) {
    return (password || "") === config.adminPassword;
  }
}

module.exports = new AuthService();
