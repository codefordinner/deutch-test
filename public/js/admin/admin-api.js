/**
 * Admin Panel API Layer
 */

async function request(url, options = {}) {
  const headers = { ...options.headers };

  if (options.body && typeof options.body === "object" && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    window.location.href = "/admin-login.html";
    throw new Error("Сессия истекла или требуется авторизация");
  }

  if (!res.ok) {
    let errMsg = `Ошибка сервера (${res.status})`;
    try {
      const errData = await res.json();
      errMsg = errData.error || errData.message || errMsg;
    } catch {
      // Ignored if not JSON
    }
    throw new Error(errMsg);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const AdminApi = {
  // Categories
  getCategories() {
    return request("/api/categories");
  },
  getCategory(id) {
    return request(`/api/categories/${id}`);
  },
  createCategory(name) {
    return request("/api/categories", {
      method: "POST",
      body: { name }
    });
  },
  updateCategory(id, name) {
    return request(`/api/categories/${id}`, {
      method: "PUT",
      body: { name }
    });
  },
  deleteCategory(id) {
    return request(`/api/categories/${id}`, {
      method: "DELETE"
    });
  },

  // Words
  getAllWords() {
    return request("/api/words");
  },
  createWord(payload) {
    return request("/api/words", {
      method: "POST",
      body: payload
    });
  },
  updateWord(id, payload) {
    return request(`/api/words/${id}`, {
      method: "PUT",
      body: payload
    });
  },
  deleteWord(id) {
    return request(`/api/words/${id}`, {
      method: "DELETE"
    });
  },
  batchDeleteWords(ids) {
    return Promise.all(ids.map((id) => this.deleteWord(id)));
  },
  batchMoveWords(ids, categoryId) {
    return Promise.all(ids.map((id) => this.updateWord(id, { categoryId })));
  },

  // Analytics
  getAnalyticsStats() {
    return request("/api/analytics/stats");
  },
  getAnalyticsLogs(page = 1, limit = 50, search = "") {
    return request(`/api/analytics/logs?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
  },
  clearAnalyticsLogs() {
    return request("/api/analytics/logs", {
      method: "DELETE"
    });
  },

  // Auth
  logout() {
    return request("/api/admin/logout", {
      method: "POST"
    });
  }
};
