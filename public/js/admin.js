/**
 * Backward compatibility entrypoint for Admin Panel.
 * Dynamically loads the modular admin application.
 */
import("/js/admin/admin-main.js").catch((err) => {
  console.error("Failed to load modular admin panel:", err);
});
