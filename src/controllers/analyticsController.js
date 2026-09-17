const analyticsService = require("../services/analyticsService");

class AnalyticsController {
  async getStats(req, res, next) {
    try {
      const stats = await analyticsService.getStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  async getLogs(req, res, next) {
    const { limit = 50, page = 1, search = "" } = req.query;
    try {
      const result = await analyticsService.getRecentLogs(limit, page, search);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async trackEvent(req, res, next) {
    const { page, action, referrer } = req.body || {};
    const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
               req.headers["x-real-ip"] ||
               req.socket.remoteAddress ||
               req.ip ||
               "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "";

    try {
      await analyticsService.logVisit({
        ip,
        userAgent,
        page: page || "/",
        action: action || "interaction",
        referrer: referrer || null
      });
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  }

  async clearLogs(req, res, next) {
    try {
      const result = await analyticsService.clearLogs();
      res.json({ ok: true, deleted: result.count });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AnalyticsController();
