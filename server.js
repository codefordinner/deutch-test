require("dotenv").config();

const config = require("./src/config");
const app = require("./src/app");

const PORT = 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`==================================================`);
  console.log(`🚀 Немецкий Тренажёр запущен: http://localhost:${PORT}`);
  console.log(`🔐 Админ-панель:              http://localhost:${PORT}/admin.html`);
  console.log(`==================================================`);
});
