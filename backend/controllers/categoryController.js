const db = require("../config/db");

// Get all categories
const getAllCategories = (req, res) => {
  const sql = `
    SELECT category_id, category_name
    FROM categories
    ORDER BY category_name ASC
  `;

  db.query(sql, (error, results) => {
    if (error) {
      console.error("Error fetching categories:", error);

      return res.status(500).json({
        message: "Error fetching categories",
      });
    }

    return res.status(200).json(results);
  });
};

module.exports = {
  getAllCategories,
};