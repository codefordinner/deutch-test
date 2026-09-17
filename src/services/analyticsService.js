const prisma = require("../db/prisma");

function parseUserAgent(uaString = "") {
  const ua = uaString || "";

  // Device
  let device = "Desktop";
  if (/iPad|Tablet|PlayBook/i.test(ua)) {
    device = "Tablet";
  } else if (/Mobile|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    device = "Mobile";
  }

  // OS
  let os = "Other";
  if (/Windows NT 10.0|Windows NT 11.0/i.test(ua)) os = "Windows 10/11";
  else if (/Windows/i.test(ua)) os = "Windows";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/Macintosh|Mac OS X/i.test(ua)) os = "macOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  // Browser
  let browser = "Other";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/OPR\/|Opera/i.test(ua)) browser = "Opera";
  else if (/Chrome\/|CriOS\//i.test(ua) && !/Edg\//i.test(ua)) browser = "Chrome";
  else if (/Firefox\/|FxiOS\//i.test(ua)) browser = "Firefox";
  else if (/Version\/.*Safari/i.test(ua) || (/Safari/i.test(ua) && !/Chrome/i.test(ua))) browser = "Safari";

  return { device, os, browser };
}

function cleanIp(rawIp) {
  if (!rawIp) return "127.0.0.1";
  let ip = String(rawIp).trim();
  if (ip.startsWith("::ffff:")) ip = ip.replace("::ffff:", "");
  if (ip === "::1") ip = "127.0.0.1";
  return ip;
}

class AnalyticsService {
  async logVisit({ ip, userAgent, page, action = "visit", referrer = null }) {
    if (!prisma) return null;
    try {
      const sanitizedIp = cleanIp(ip);
      const { device, os, browser } = parseUserAgent(userAgent);

      return await prisma.visitorLog.create({
        data: {
          ip: sanitizedIp,
          userAgent: userAgent ? userAgent.substring(0, 500) : null,
          device,
          os,
          browser,
          page: page ? page.substring(0, 200) : "/",
          action: action ? action.substring(0, 50) : "visit",
          referrer: referrer ? referrer.substring(0, 500) : null
        }
      });
    } catch (err) {
      console.warn("[Analytics] Error logging visit:", err.message);
      return null;
    }
  }

  async getStats() {
    if (!prisma) {
      return {
        totalVisits: 0,
        uniqueVisitors: 0,
        todayVisits: 0,
        todayUniqueVisitors: 0,
        activeNow: 0,
        totalWords: 0,
        totalCategories: 0,
        deviceStats: {},
        browserStats: {},
        osStats: {},
        dailyVisits: [],
        topPages: [],
        topIps: []
      };
    }

    try {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

      // Total count
      const totalVisits = await prisma.visitorLog.count();

      // Counts for today
      const todayLogs = await prisma.visitorLog.findMany({
        where: { createdAt: { gte: startOfToday } },
        select: { ip: true }
      });
      const todayVisits = todayLogs.length;
      const todayUniqueVisitors = new Set(todayLogs.map(l => l.ip)).size;

      // Unique visitors all time
      const allIps = await prisma.visitorLog.findMany({
        select: { ip: true }
      });
      const uniqueVisitors = new Set(allIps.map(l => l.ip)).size;

      // Active now (last 15m)
      const activeLogs = await prisma.visitorLog.findMany({
        where: { createdAt: { gte: fifteenMinutesAgo } },
        select: { ip: true }
      });
      const activeNow = new Set(activeLogs.map(l => l.ip)).size;

      // Words & Categories count
      const totalWords = await prisma.word.count();
      const totalCategories = await prisma.category.count();

      // Device, Browser, OS aggregations (from last 5000 visits)
      const sampleLogs = await prisma.visitorLog.findMany({
        take: 5000,
        orderBy: { createdAt: "desc" },
        select: { device: true, browser: true, os: true, page: true, ip: true, createdAt: true }
      });

      const deviceStats = {};
      const browserStats = {};
      const osStats = {};
      const pageCounts = {};
      const ipCounts = {};

      sampleLogs.forEach(log => {
        const d = log.device || "Desktop";
        deviceStats[d] = (deviceStats[d] || 0) + 1;

        const b = log.browser || "Other";
        browserStats[b] = (browserStats[b] || 0) + 1;

        const o = log.os || "Other";
        osStats[o] = (osStats[o] || 0) + 1;

        const p = log.page || "/";
        pageCounts[p] = (pageCounts[p] || 0) + 1;

        const ip = log.ip || "127.0.0.1";
        ipCounts[ip] = (ipCounts[ip] || 0) + 1;
      });

      // Top pages
      const topPages = Object.entries(pageCounts)
        .map(([page, count]) => ({ page, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      // Top IPs
      const topIps = Object.entries(ipCounts)
        .map(([ip, count]) => ({ ip, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      // Daily visits (last 7 days)
      const dailyMap = new Map();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        dailyMap.set(key, { date: key, visits: 0, uniqueIps: new Set() });
      }

      sampleLogs.forEach(log => {
        const key = log.createdAt.toISOString().slice(0, 10);
        if (dailyMap.has(key)) {
          const entry = dailyMap.get(key);
          entry.visits++;
          entry.uniqueIps.add(log.ip);
        }
      });

      const dailyVisits = Array.from(dailyMap.values()).map(e => ({
        date: e.date,
        visits: e.visits,
        unique: e.uniqueIps.size
      }));

      return {
        totalVisits,
        uniqueVisitors,
        todayVisits,
        todayUniqueVisitors,
        activeNow,
        totalWords,
        totalCategories,
        deviceStats,
        browserStats,
        osStats,
        dailyVisits,
        topPages,
        topIps
      };
    } catch (err) {
      console.error("[Analytics] getStats error:", err);
      throw err;
    }
  }

  async getRecentLogs(limit = 100, page = 1, search = "") {
    if (!prisma) return { logs: [], total: 0, page, totalPages: 0 };

    const take = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    const where = {};
    if (search && search.trim()) {
      const s = search.trim();
      where.OR = [
        { ip: { contains: s } },
        { page: { contains: s } },
        { browser: { contains: s } },
        { os: { contains: s } },
        { device: { contains: s } },
        { userAgent: { contains: s } }
      ];
    }

    const [total, logs] = await Promise.all([
      prisma.visitorLog.count({ where }),
      prisma.visitorLog.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: "desc" }
      })
    ]);

    return {
      logs,
      total,
      page: Math.max(parseInt(page, 10) || 1, 1),
      totalPages: Math.ceil(total / take) || 1
    };
  }

  async clearLogs() {
    if (!prisma) return { count: 0 };
    const res = await prisma.visitorLog.deleteMany({});
    return { count: res.count };
  }
}

module.exports = new AnalyticsService();
