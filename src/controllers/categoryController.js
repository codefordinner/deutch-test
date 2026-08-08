const categoryService = require("../services/categoryService");

class CategoryController {
  async getCategories(req, res, next) {
    try {
      const categories = await categoryService.getAllCategories();
      res.json(categories);
    } catch (error) {
      next(error);
    }
  }

  async createCategory(req, res, next) {
    const name = (req.body.name || "").trim();
    if (!name) {
      return res.status(400).json({ error: "Название категории обязательно" });
    }

    try {
      const category = await categoryService.createCategory(name);
      res.status(201).json(category);
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req, res, next) {
    const name = (req.body.name || "").trim();
    if (!name) {
      return res.status(400).json({ error: "Название категории обязательно" });
    }

    try {
      const category = await categoryService.updateCategory(req.params.id, name);
      res.json(category);
    } catch (error) {
      res.status(404).json({ error: "Категория не найдена или ошибка обновления" });
    }
  }

  async deleteCategory(req, res, next) {
    try {
      await categoryService.deleteCategory(req.params.id);
      res.status(204).end();
    } catch (error) {
      res.status(404).json({ error: "Категория не найдена" });
    }
  }
}

module.exports = new CategoryController();
