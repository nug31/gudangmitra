import React, { useState, useEffect } from "react";
import { Item } from "../../types";
import Button from "../ui/Button";
import { X, Search, Filter } from "lucide-react";
import Input from "../ui/Input";
import Select from "../ui/Select";
import { categoryService } from "../../services/categoryService";
import { categoriesAreEqual } from "../../utils/categoryUtils";

interface BrowseItemsModalProps {
  items: Item[];
  onClose: () => void;
  onSelectItem: (item: Item) => void;
}

const BrowseItemsModal: React.FC<BrowseItemsModalProps> = ({
  items,
  onClose,
  onSelectItem,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [categoryOptions, setCategoryOptions] = useState([
    { value: "all", label: "All Categories" },
  ]);

  // Function to fetch categories from the database
  const fetchCategories = async () => {
    try {
      const options = await categoryService.getCategoryOptions();

      // Add the "All Categories" option at the beginning
      const allCategoriesOption = { value: "all", label: "All Categories" };
      setCategoryOptions([allCategoriesOption, ...options]);
    } catch (error) {
      console.error("Error fetching category options:", error);
    }
  };

  // Fetch categories when the component mounts
  useEffect(() => {
    fetchCategories();
  }, []);

  // Filter items based on search term and category
  const filteredItems = items.filter((item) => {
    // Filter by search term
    const matchesSearch =
      searchTerm === "" ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by category using the utility function
    const matchesCategory =
      categoryFilter === "all" ||
      categoriesAreEqual(item.category, categoryFilter);

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-6 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Browse Items</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex space-x-4 mb-4">
          <div className="flex-1">
            <Input
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
          </div>
          <div className="w-64">
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={categoryOptions}
              icon={<Filter className="h-4 w-4" />}
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {filteredItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No items found matching your criteria.
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left p-3 border-b">Name</th>
                  <th className="text-left p-3 border-b">Category</th>
                  <th className="text-left p-3 border-b">Description</th>
                  <th className="text-center p-3 border-b">Quantity</th>
                  <th className="text-right p-3 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{item.name}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-gray-600 truncate max-w-[200px]">
                      {item.description}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          item.quantity <= 0
                            ? "bg-red-100 text-red-800"
                            : item.quantity <= item.minQuantity
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {item.quantity}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSelectItem(item)}
                      >
                        Select
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrowseItemsModal;
