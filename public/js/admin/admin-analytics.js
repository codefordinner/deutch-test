/**
 * Admin Panel Analytics Controller
 */
import { AdminApi } from "./admin-api.js";
import { store } from "./admin-state.js";
import { escapeHtml, formatShortDate, formatExactTime, getRelativeTimeString } from "./admin-utils.js";
import { showToast, showConfirmDialog } from "./admin-ui.js";

export function initAnalyticsController() {
  const logSearchInput = document.getElementById("log-search-input");
  const refreshLogsBtn = document.getElementById("refresh-logs-btn");
  const prevBtn = document.getElementById("logs-prev-page-btn");
  const nextBtn = document.getElementById("logs-next-page-btn");
  const clearLogsBtn = document.getElementById("clear-logs-btn");

  let searchDebounce = null;

  async function loadAnalyticsData() {
    try {
      const search = logSearchInput?.value || "";
      const [stats, logsData] = await Promise.all([
        AdminApi.getAnalyticsStats(),
        AdminApi.getAnalyticsLogs(store.currentLogsPage, 50, search)
      ]);

      store.analyticsStats = stats;
      store.analyticsLogs = logsData.logs || [];
      store.currentLogsPage = logsData.page || 1;
      store.totalLogsPages = logsData.totalPages || 1;

      renderAnalyticsOverview(stats);
      renderAnalyticsLogs(logsData);
    } catch (err) {
      showToast("Не удалось загрузить аналитику: " + err.message, "error");
    }
  }

  function renderAnalyticsOverview(stats) {
    if (!stats) return;

    setElText("stat-unique-today", stats.todayUniqueVisitors || 0);
    setElText("stat-unique-total", stats.uniqueVisitors || 0);
    setElText("stat-views-today", stats.todayVisits || 0);
    setElText("stat-views-total", stats.totalVisits || 0);
    setElText("stat-active-now", stats.activeNow || 0);
    setElText("stat-total-words", stats.totalWords || 0);
    setElText("stat-total-categories", stats.totalCategories || 0);

    renderDailyChart(stats.dailyVisits || []);
    renderBreakdowns(stats);
  }

  function setElText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function renderDailyChart(dailyVisits) {
    const chartContainer = document.getElementById("daily-visits-chart");
    if (!chartContainer) return;
    chartContainer.innerHTML = "";

    if (!dailyVisits || dailyVisits.length === 0) {
      chartContainer.innerHTML = `<div style="margin: auto; font-size: 12px; color: var(--text-muted);">Нет данных за 7 дней</div>`;
      return;
    }

    const maxVal = Math.max(...dailyVisits.map((d) => d.visits), 1);

    dailyVisits.forEach((item) => {
      const heightPercent = Math.max(Math.round((item.visits / maxVal) * 100), 6);
      const dayLabel = formatShortDate(item.date);

      const group = document.createElement("div");
      group.className = "chart-bar-group";
      group.innerHTML = `
        <div class="chart-bar" style="height: ${heightPercent}%;">
          <div class="chart-bar-tooltip">
            ${item.visits} виз. (${item.unique} уник.)
          </div>
        </div>
        <div class="chart-bar-label">${dayLabel}</div>
      `;
      chartContainer.appendChild(group);
    });
  }

  function renderBreakdowns(stats) {
    // Devices
    const deviceList = document.getElementById("device-breakdown-list");
    if (deviceList) {
      deviceList.innerHTML = "";
      const devStats = stats.deviceStats || {};
      const total = Object.values(devStats).reduce((a, b) => a + b, 0) || 1;

      const deviceTypes = [
        { key: "Desktop", label: "💻 Компьютеры (Desktop)" },
        { key: "Mobile", label: "📱 Смартфоны (Mobile)" },
        { key: "Tablet", label: "📟 Планшеты (Tablet)" }
      ];

      deviceTypes.forEach((d) => {
        const count = devStats[d.key] || 0;
        const pct = Math.round((count / total) * 100);

        const row = document.createElement("div");
        row.className = "breakdown-row";
        row.innerHTML = `
          <div class="breakdown-info">
            <span>${d.label}</span>
            <span><b>${count}</b> (${pct}%)</span>
          </div>
          <div class="breakdown-bar-wrap">
            <div class="breakdown-bar-fill" style="width: ${pct}%;"></div>
          </div>
        `;
        deviceList.appendChild(row);
      });
    }

    // Browsers
    const browserList = document.getElementById("browser-breakdown-list");
    if (browserList) {
      browserList.innerHTML = "";
      const bStats = stats.browserStats || {};
      const total = Object.values(bStats).reduce((a, b) => a + b, 0) || 1;

      Object.entries(bStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .forEach(([browser, count]) => {
          const pct = Math.round((count / total) * 100);
          const row = document.createElement("div");
          row.className = "breakdown-row";
          row.innerHTML = `
            <div class="breakdown-info">
              <span>🌐 ${escapeHtml(browser)}</span>
              <span><b>${count}</b> (${pct}%)</span>
            </div>
            <div class="breakdown-bar-wrap">
              <div class="breakdown-bar-fill" style="width: ${pct}%; background: #0e7490;"></div>
            </div>
          `;
          browserList.appendChild(row);
        });
    }
  }

  function renderAnalyticsLogs(logsData) {
    const logsTbody = document.getElementById("logs-tbody");
    const totalBadge = document.getElementById("logs-total-badge");
    const pageIndicator = document.getElementById("logs-page-indicator");

    if (!logsTbody) return;
    logsTbody.innerHTML = "";

    if (totalBadge) totalBadge.textContent = `${logsData.total || 0} записей`;
    if (pageIndicator) pageIndicator.textContent = `Страница ${logsData.page || 1} из ${logsData.totalPages || 1}`;

    if (prevBtn) prevBtn.disabled = logsData.page <= 1;
    if (nextBtn) nextBtn.disabled = logsData.page >= logsData.totalPages;

    const logs = logsData.logs || [];
    if (logs.length === 0) {
      logsTbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 24px; color: var(--text-muted);">Журнал пуст</td></tr>`;
      return;
    }

    logs.forEach((log) => {
      const tr = document.createElement("tr");
      const relativeTime = getRelativeTimeString(new Date(log.createdAt));
      const exactTime = formatExactTime(new Date(log.createdAt));

      tr.innerHTML = `
        <td>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span class="ip-badge">${escapeHtml(log.ip)}</span>
            <button type="button" class="copy-ip-btn" data-ip="${escapeHtml(log.ip)}" title="Скопировать IP" style="background: none; border: none; cursor: pointer; font-size: 11px; padding: 2px;">📋</button>
          </div>
        </td>
        <td>
          <div style="font-size: 12px; font-weight: 600;">${relativeTime}</div>
          <div style="font-size: 11px; color: var(--text-muted);">${exactTime}</div>
        </td>
        <td>
          <span class="device-badge">${escapeHtml(log.device || "Desktop")}</span>
          <span style="font-size: 12px; margin-left: 4px; color: var(--text-secondary);">${escapeHtml(log.os || "—")}</span>
        </td>
        <td>
          <span style="font-size: 12px; font-weight: 500;">${escapeHtml(log.browser || "—")}</span>
        </td>
        <td>
          <span style="font-family: monospace; font-size: 12px; font-weight: 600; color: var(--accent);">${escapeHtml(log.page)}</span>
          ${log.action && log.action !== "page_view" ? `<span class="category-tag" style="margin-left: 4px; font-size: 10px;">${escapeHtml(log.action)}</span>` : ""}
        </td>
        <td>
          <div class="log-ua-toggle" data-id="${log.id}">Показать UA</div>
          <div class="log-ua-text" id="ua-${log.id}" style="display: none;">${escapeHtml(log.userAgent || "—")}</div>
        </td>
      `;

      tr.querySelector(".copy-ip-btn")?.addEventListener("click", () => {
        navigator.clipboard.writeText(log.ip).then(() => {
          showToast(`IP ${log.ip} скопирован!`, "info", 1500);
        });
      });

      tr.querySelector(".log-ua-toggle")?.addEventListener("click", (e) => {
        const uaBox = document.getElementById(`ua-${log.id}`);
        if (uaBox) {
          const isHidden = uaBox.style.display === "none";
          uaBox.style.display = isHidden ? "block" : "none";
          e.target.textContent = isHidden ? "Скрыть UA" : "Показать UA";
        }
      });

      logsTbody.appendChild(tr);
    });
  }

  // Event Listeners
  if (logSearchInput) {
    logSearchInput.addEventListener("input", () => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        store.currentLogsPage = 1;
        loadAnalyticsData();
      }, 300);
    });
  }

  refreshLogsBtn?.addEventListener("click", () => {
    loadAnalyticsData();
    showToast("Данные аналитики обновлены", "info", 1500);
  });

  prevBtn?.addEventListener("click", () => {
    if (store.currentLogsPage > 1) {
      store.currentLogsPage--;
      loadAnalyticsData();
    }
  });

  nextBtn?.addEventListener("click", () => {
    if (store.currentLogsPage < store.totalLogsPages) {
      store.currentLogsPage++;
      loadAnalyticsData();
    }
  });

  clearLogsBtn?.addEventListener("click", async () => {
    const confirmed = await showConfirmDialog(
      "Очистка журнала посещений",
      "Вы действительно хотите удалить все записи в журнале посещений? Статистика посещений будет сброшена."
    );
    if (!confirmed) return;

    try {
      await AdminApi.clearAnalyticsLogs();
      showToast("Журнал посещений очищен", "success");
      store.currentLogsPage = 1;
      await loadAnalyticsData();
    } catch (err) {
      showToast("Ошибка при очистке журнала: " + err.message, "error");
    }
  });

  function startAutoPoll() {
    stopAutoPoll();
    store.analyticsPollInterval = setInterval(() => {
      loadAnalyticsData();
    }, 15000);
  }

  function stopAutoPoll() {
    if (store.analyticsPollInterval) {
      clearInterval(store.analyticsPollInterval);
      store.analyticsPollInterval = null;
    }
  }

  return {
    loadAnalyticsData,
    startAutoPoll,
    stopAutoPoll
  };
}
