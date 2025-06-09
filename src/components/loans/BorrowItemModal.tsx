import React, { useState } from "react";
import { Item } from "../../types";
import { loanService, BorrowRequest } from "../../services/loanService";
import { useAuth } from "../../contexts/AuthContext";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";
import Button from "../ui/Button";
import Alert from "../ui/Alert";
import { X, Calendar, Package } from "lucide-react";

interface BorrowItemModalProps {
  item: Item;
  onClose: () => void;
  onSuccess: () => void;
}

const BorrowItemModal: React.FC<BorrowItemModalProps> = ({
  item,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    quantity: 1,
    dueDate: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate minimum due date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Calculate maximum due date (30 days from now)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!user) {
      setError("You must be logged in to borrow items");
      setLoading(false);
      return;
    }

    // Validate quantity
    if (formData.quantity <= 0) {
      setError("Quantity must be greater than 0");
      setLoading(false);
      return;
    }

    if (formData.quantity > item.quantity) {
      setError(`Only ${item.quantity} items available`);
      setLoading(false);
      return;
    }

    // Validate due date
    if (!formData.dueDate) {
      setError("Due date is required");
      setLoading(false);
      return;
    }

    try {
      // Check availability first
      try {
        const isAvailable = await loanService.checkItemAvailability(
          item.id,
          formData.quantity
        );

        if (!isAvailable) {
          setError("Item is not available for borrowing in the requested quantity");
          setLoading(false);
          return;
        }
      } catch (availabilityError: any) {
        console.warn("Availability check failed, proceeding with borrow attempt:", availabilityError);
        // Continue with borrowing even if availability check fails
        // This handles the case where the loans table doesn't exist yet
      }

      const borrowRequest: BorrowRequest = {
        itemId: item.id,
        quantity: formData.quantity,
        dueDate: formData.dueDate,
        notes: formData.notes || undefined,
      };

      await loanService.borrowItem(user.id, borrowRequest);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error borrowing item:", err);
      setError(err.message || "Failed to borrow item");
    } finally {
      setLoading(false);
    }
  };

  const availableQuantity = item.quantity - (item.borrowedQuantity || 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Package className="h-5 w-5 mr-2 text-blue-600" />
            Borrow Item
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Item Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">{item.name}</h3>
            <p className="text-sm text-gray-600 mb-2">{item.description}</p>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Available:</span>
              <span className="font-medium text-green-600">
                {availableQuantity} of {item.quantity}
              </span>
            </div>
          </div>

          {error && (
            <Alert type="error" className="mb-4">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Quantity"
              type="number"
              min="1"
              max={availableQuantity}
              value={formData.quantity.toString()}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  quantity: parseInt(e.target.value) || 1,
                })
              }
              required
              disabled={loading}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  min={getMinDate()}
                  max={getMaxDate()}
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Maximum loan period: 30 days
              </p>
            </div>

            <Textarea
              label="Notes (Optional)"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Add any notes about this loan..."
              rows={3}
              disabled={loading}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={onClose}
                type="button"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                isLoading={loading}
                disabled={availableQuantity === 0}
              >
                {availableQuantity === 0 ? "Not Available" : "Borrow Item"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BorrowItemModal;
