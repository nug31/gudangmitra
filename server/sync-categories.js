const mysql = require("mysql2/promise");

async function syncCategories() {
  let connection;
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "gudang1",
    });

    console.log("Connected to database");

    // Get distinct categories from items table
    const [itemCategories] = await connection.query(
      "SELECT DISTINCT category FROM items"
    );
    console.log(
      "Categories in items table:",
      itemCategories.map((row) => row.category)
    );

    // Get existing categories from categories table
    let existingCategories = [];
    try {
      [existingCategories] = await connection.query("SELECT * FROM categories");
      console.log(
        "Existing categories in categories table:",
        existingCategories.map((cat) => cat.name)
      );
    } catch (err) {
      console.log("Categories table may not exist, creating it...");

      // Create categories table if it doesn't exist
      await connection.query(`
        CREATE TABLE IF NOT EXISTS categories (
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("Categories table created");
    }

    // Map of existing category names to their IDs
    const existingCategoryMap = {};
    existingCategories.forEach((cat) => {
      existingCategoryMap[cat.name.toLowerCase()] = cat.id;
    });

    // Synchronize categories
    for (const itemCat of itemCategories) {
      const categoryName = itemCat.category;

      // Format the category name to be more readable
      const formattedName = categoryName
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      // Check if category already exists (case insensitive)
      if (!existingCategoryMap[categoryName.toLowerCase()]) {
        // Generate UUID for new category
        const [uuidResult] = await connection.query("SELECT UUID() as uuid");
        const categoryId = uuidResult[0].uuid;

        // Insert new category
        await connection.query(
          "INSERT INTO categories (id, name, description) VALUES (?, ?, ?)",
          [
            categoryId,
            formattedName,
            `Items categorized as ${formattedName.toLowerCase()}`,
          ]
        );
        console.log(`Added new category: ${formattedName}`);
      } else {
        console.log(`Category already exists: ${formattedName}`);
      }
    }

    console.log("Category synchronization completed");
  } catch (err) {
    console.error("Error synchronizing categories:", err);
  } finally {
    if (connection) {
      await connection.end();
      console.log("Database connection closed");
    }
  }
}

// Run the synchronization
syncCategories();
