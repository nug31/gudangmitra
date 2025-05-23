import React, { useState, useEffect } from "react";
import { Item, ItemRequest, RequestPriority } from "../../types";
import { requestService } from "../../services/requestService";
import { useAuth } from "../../contexts/AuthContext";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Textarea from "../ui/Textarea";
import Button from "../ui/Button";
import Alert from "../ui/Alert";
import { X, Send } from "lucide-react";
import { validateItemId, isValidItemId } from "../../utils/itemUtils";

interface RequestItemModalProps {
  item: Item;
  onClose: () => void;
  onSuccess?: (request: ItemRequest) => void;
}

const RequestItemModal: React.FC<RequestItemModalProps> = ({
  item,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [priority, setPriority] = useState<RequestPriority>("medium");
  const [description, setDescription] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const priorityOptions = [
    { value: "high", label: "High Priority" },
    { value: "medium", label: "Medium Priority" },
    { value: "low", label: "Low Priority" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    if (!user) {
      setError("You must be logged in to submit a request");
      setLoading(false);
      return;
    }

    // Ensure user ID is valid
    if (!user.id) {
      console.error("User ID is missing or invalid:", user);
      setError("Invalid user ID. Please try logging out and logging in again.");
      setLoading(false);
      return;
    }

    // For debugging
    console.log("Current user:", user);

    // Validate quantity
    if (quantity <= 0) {
      setError("Quantity must be greater than 0");
      setLoading(false);
      return;
    }

    // Validate against available quantity
    if (quantity > item.quantity) {
      setError(
        `Only ${item.quantity} units available. Please request a smaller quantity.`
      );
      setLoading(false);
      return;
    }

    try {
      // Log the item details for debugging
      console.log("Item details:", {
        id: item.id,
        idType: typeof item.id,
        name: item.name,
        quantity: item.quantity,
      });

      // Validate the item ID using our utility function
      const validItemId = validateItemId(item.id);
      if (validItemId === null) {
        console.error("Invalid item ID:", item.id);
        setError("Invalid item ID. Please try again or contact support.");
        setLoading(false);
        return;
      }

      // Convert to string for the API
      const itemId = String(validItemId);

      console.log("Submitting request with itemId:", itemId);

      try {
        // Include the user's username in the request
        const newRequest = await requestService.createRequest({
          userId: user.id,
          itemId: itemId,
          itemName: item.name,
          quantity,
          priority,
          status: "pending",
          description,
          requestedDeliveryDate: deliveryDate,
          // Add requesterName to be used by the server
          requesterName: user.username,
        });

        console.log("Request created successfully:", newRequest);
        setSuccess(true);

        // Reset form
        setQuantity(1);
        setPriority("medium");
        setDescription("");
        setDeliveryDate("");

        if (onSuccess) {
          onSuccess(newRequest);
        }

        // Close modal after 2 seconds on success
        setTimeout(() => {
          onClose();
        }, 2000);
      } catch (requestError) {
        console.error("Error from requestService.createRequest:", requestError);
        setError((requestError as Error).message || "Failed to create request");
      }
    } catch (err) {
      console.error("Unexpected error in handleSubmit:", err);
      setError((err as Error).message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Request Item</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <h3 className="font-medium text-gray-900">{item.name}</h3>
          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-gray-500">Available:</span>
            <span className="font-medium text-gray-900">
              {item.quantity} units
            </span>
          </div>
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
          <Alert variant="success" title="Success" className="mb-4">
            Your request has been submitted successfully.
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Input
            label="Quantity"
            type="number"
            min="1"
            max={item.quantity}
            value={quantity.toString()}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            required
          />

          <Select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as RequestPriority)}
            options={priorityOptions}
            required
          />

          <Textarea
            label="Reason for Request"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Please explain why you need this item"
            required
          />

          <Input
            label="Requested Delivery Date"
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
          />

          <div className="mt-6 flex justify-end space-x-3">
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
              icon={<Send className="h-4 w-4" />}
            >
              Submit Request
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestItemModal;
