import { API_BASE_URL } from "../config";

export interface Category {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

class CategoryService {
  private apiUrl = `${API_BASE_URL}/categories`;

  async getAllCategories(): Promise<Category[]> {
    try {
      const response = await fetch(this.apiUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw error;
    }
  }

  async getCategoryOptions(): Promise<{ value: string; label: string }[]> {
    try {
      const categories = await this.getAllCategories();

      // Map categories to dropdown options format
      return categories.map((category) => ({
        value: category.name.toLowerCase().replace(/\s+/g, "-"), // Convert to kebab-case
        label: category.name,
      }));
    } catch (error) {
      console.error("Error getting category options:", error);

      // Return default categories if API fails
      return [
        { value: "electronics", label: "Electronics" },
        { value: "office-supplies", label: "Office Supplies" },
        { value: "furniture", label: "Furniture" },
        { value: "other", label: "Other" },
      ];
    }
  }

  async getCategoryById(id: string): Promise<Category> {
    try {
      const response = await fetch(`${this.apiUrl}/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch category: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching category with id ${id}:`, error);
      throw error;
    }
  }

  async createCategory(category: Omit<Category, "id">): Promise<Category> {
    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(category),
      });

      if (!response.ok) {
        throw new Error(`Failed to create category: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating category:", error);
      throw error;
    }
  }

  async updateCategory(
    id: string,
    category: Partial<Omit<Category, "id">>
  ): Promise<Category> {
    try {
      const response = await fetch(`${this.apiUrl}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(category),
      });

      if (!response.ok) {
        throw new Error(`Failed to update category: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error updating category with id ${id}:`, error);
      throw error;
    }
  }

  async deleteCategory(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete category: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error deleting category with id ${id}:`, error);
      throw error;
    }
  }
}

export const categoryService = new CategoryService();
export default categoryService;
