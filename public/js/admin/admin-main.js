/**
 * Admin Panel Main Application Entrypoint
 */
import { AdminApi } from "./admin-api.js";
import { store } from "./admin-state.js";
import { showToast, initModalListeners } from "./admin-ui.js";
import { initWordsController } from "./admin-words.js";
import { initVerbsController } from "./admin-verbs.js";
import { initAnalyticsController } from "./admin-analytics.js";
import { initIOController } from "./admin-io.js";

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Initialize modal backdrops and esc listeners
  initModalListeners();

  // 2. Initialize feature controllers
  initWordsController();
  initVerbsController();
  const analytics = initAnalyticsController();
  initIOController();

  // 3. Navigation Tabs
  const navBtns = document.querySelectorAll(".admin-nav-btn");
  const tabPanels = document.querySelectorAll(".admin-tab-content");

  navBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const rawTab = btn.dataset.tab || btn.dataset.adminTab || "";
      const tabKey = rawTab.replace(/^tab-/, "");
      const panelId = rawTab.startsWith("tab-") ? rawTab : `tab-${rawTab}`;

      navBtns.forEach((b) => b.classList.remove("active"));
      tabPanels.forEach((p) => p.classList.remove("active"));

      btn.classList.add("active");
      const targetPanel = document.getElementById(panelId);
      if (targetPanel) targetPanel.classList.add("active");

      if (tabKey === "analytics") {
        analytics.loadAnalyticsData();
        analytics.startAutoPoll();
      } else {
        analytics.stopAutoPoll();
      }

      if (tabKey === "verbs") {
        store.notify("verbs:refresh");
      }
    });
  });

  // 4. Logout & Global Refresh
  document.getElementById("logout-btn")?.addEventListener("click", async () => {
    try {
      await AdminApi.logout();
    } catch {
      // Ignore network error during logout
    } finally {
      window.location.href = "/admin-login.html";
    }
  });

  document.getElementById("admin-refresh-all-btn")?.addEventListener("click", async () => {
    await store.loadInitialData();
    const isAnalyticsActive = document.getElementById("tab-analytics")?.classList.contains("active");
    if (isAnalyticsActive) {
      await analytics.loadAnalyticsData();
    }
    showToast("Данные успешно обновлены!", "info", 1500);
  });

  // 5. Initial Data Load
  await store.loadInitialData();
});
