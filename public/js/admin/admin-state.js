/**
 * Admin Panel Reactive State Store
 */
import { AdminApi } from "./admin-api.js";
import { showToast } from "./admin-ui.js";

class AdminStore {
  constructor() {
    this.categories = [];
    this.currentCategoryId = "all";
    this.allWordsCache = [];
    this.currentCategoryWords = [];
    this.selectedWordIds = new Set();
    this.editingWord = null;

    this.allVerbs = [];
    this.currentVerbFilter = "all";
    this.currentVerbSearch = "";
    this.selectedVerbIds = new Set();
    this.editingVerb = null;

    this.analyticsStats = null;
    this.analyticsLogs = [];
    this.currentLogsPage = 1;
    this.totalLogsPages = 1;
    this.analyticsPollInterval = null;

    this._subscribers = new Map();
  }

  subscribe(event, callback) {
    if (!this._subscribers.has(event)) {
      this._subscribers.set(event, new Set());
    }
    this._subscribers.get(event).add(callback);
    return () => this._subscribers.get(event).delete(callback);
  }

  notify(event, data) {
    if (this._subscribers.has(event)) {
      this._subscribers.get(event).forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in subscriber for event ${event}:`, err);
        }
      });
    }
  }

  async loadInitialData() {
    try {
      const [cats, words] = await Promise.all([
        AdminApi.getCategories(),
        AdminApi.getAllWords()
      ]);

      this.categories = cats || [];
      this.allWordsCache = words || [];

      // If selected category no longer exists, reset to "all"
      if (this.currentCategoryId !== "all" && !this.categories.some((c) => c.id === this.currentCategoryId)) {
        this.currentCategoryId = "all";
      }

      this.notify("categories:updated", this.categories);
      this.notify("words:updated", this.allWordsCache);
      this.notify("verbs:refresh");
      return true;
    } catch (err) {
      showToast("Ошибка загрузки данных: " + err.message, "error");
      return false;
    }
  }
}

export const store = new AdminStore();
