/**
 * Centralized API Client Module for German Trainer
 */
(function (global) {
  function request(url, options) {
    options = options || {};
    options.headers = options.headers || {};

    if (options.body && typeof options.body === "object" && !(options.body instanceof FormData)) {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(options.body);
    }

    return fetch(url, options).then(function (response) {
      if (response.status === 401) {
        if (window.location.pathname.includes("admin")) {
          window.location.href = "/admin-login.html";
        }
        throw new Error("Сессия истекла или требуется авторизация");
      }

      if (!response.ok) {
        return response.json().then(
          function (errData) {
            throw new Error(errData.error || errData.message || "Ошибка сервера");
          },
          function () {
            throw new Error("Ошибка HTTP " + response.status);
          }
        );
      }

      if (response.status === 204) return null;
      return response.json();
    });
  }

  global.ApiClient = {
    get: function (url) {
      return request(url, { method: "GET" });
    },
    post: function (url, body) {
      return request(url, { method: "POST", body: body });
    },
    put: function (url, body) {
      return request(url, { method: "PUT", body: body });
    },
    delete: function (url) {
      return request(url, { method: "DELETE" });
    }
  };
})(window);
