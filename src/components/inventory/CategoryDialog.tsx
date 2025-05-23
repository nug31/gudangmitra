import React, { useState, useEffect } from "react";
import Button from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";
import { Category, categoryService } from "../../services/categoryService";

interface CategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  category?: Category;
  onCategoryChange: () => void;
}

export function CategoryDialog({
  isOpen,
  onClose,
  category,
  onCategoryChange,
}: CategoryDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog opens or category changes
  useEffect(() => {
    if (isOpen) {
      setName(category?.name || "");
      setDescription(category?.description || "");
    }
  }, [isOpen, category]);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError("Category name is required");
      return;
    }

    setIsSubmitting(true);

    try {
      if (category?.id) {
        // Update existing category
        await categoryService.updateCategory(category.id, {
          name,
          description,
        });
        setSuccess("Category updated successfully");
      } else {
        // Create new category
        await categoryService.createCategory({
          name,
          description,
        });
        setSuccess("Category created successfully");
      }

      // Wait a moment to show the success message
      setTimeout(() => {
        onCategoryChange();
        onClose();
      }, 1000);
    } catch (error) {
      console.error("Error saving category:", error);
      setError("Failed to save category");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 ${
        isOpen ? "block" : "hidden"
      }`}
    >
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">
                {category?.id ? "Edit Category" : "Add New Category"}
              </h2>
              <p className="text-gray-600">
                {category?.id
                  ? "Update the category details below."
                  : "Fill in the details for the new category."}
              </p>
            </div>

            {error && (
              <Alert
                variant="error"
                title="Error"
                onDismiss={() => setError(null)}
                className="mb-4"
              >
                {error}
              </Alert>
            )}

            {success && (
              <Alert
                variant="success"
                title="Success"
                onDismiss={() => setSuccess(null)}
                className="mb-4"
              >
                {success}
              </Alert>
            )}

            <div className="mb-4">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : category?.id
                  ? "Update Category"
                  : "Add Category"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CategoryDialog;
