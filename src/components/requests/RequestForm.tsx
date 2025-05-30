import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ItemRequest, RequestPriority, Item } from "../../types";
import { requestService } from "../../services/requestService";
import { useAuth } from "../../contexts/AuthContext";
import { Card, CardHeader, CardContent, CardFooter } from "../ui/Card";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Textarea from "../ui/Textarea";
import Button from "../ui/Button";
import Alert from "../ui/Alert";
import { Send, PlusCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface RequestFormProps {
  onSuccess?: (request: ItemRequest) => void;
  selectedItem?: Item | null;
}

const RequestForm: React.FC<RequestFormProps> = ({
  onSuccess,
  selectedItem,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [itemName, setItemName] = useState("");
  const [itemId, setItemId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [priority, setPriority] = useState<RequestPriority>("medium");
  const [description, setDescription] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Pre-fill form when selectedItem changes
  useEffect(() => {
    if (selectedItem) {
      setItemName(selectedItem.name);
      setItemId(selectedItem.id);
      // Set a default description based on the item
      setDescription(
        `Request for ${selectedItem.name}${
          selectedItem.description ? `: ${selectedItem.description}` : ""
        }`
      );
    }
  }, [selectedItem]);

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

    try {
      // Use the selected item ID or create a fake one for demo purposes
      const requestItemId =
        itemId || Math.random().toString(36).substring(2, 7);

      // Create a project name from the item name
      const projectName = `Request for ${itemName}`;

      const newRequest = await requestService.createRequest({
        userId: user.id,
        itemId: requestItemId,
        itemName,
        quantity,
        priority,
        status: "pending",
        description,
        requestedDeliveryDate: deliveryDate,
        attachment: attachment ? attachment.name : undefined,
        projectName,
      });

      setSuccess(true);

      // Reset form
      setItemName("");
      setQuantity(1);
      setPriority("medium");
      setDescription("");
      setDeliveryDate("");
      setAttachment(null);

      if (onSuccess) {
        onSuccess(newRequest);
      }

      // Navigate to requests page after successful submission
      setTimeout(() => {
        navigate('/requests');
      }, 2000);
    } catch (err) {
      console.error("Error submitting request:", err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center">
          <PlusCircle className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">
            {selectedItem ? `Request ${selectedItem.name}` : "New Item Request"}
          </h2>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {selectedItem ? (
            <span>
              You are requesting <strong>{selectedItem.name}</strong>. Fill out
              the details below.
            </span>
          ) : (
            "Fill out the form below to request new items"
          )}
        </p>
        {selectedItem && (
          <div className="mt-2">
            <Button
              variant="outline"
              size="sm"
              to="/browse"
              as={Link}
              icon={<ArrowLeft className="h-4 w-4" />}
            >
              Back to Browse
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {error && (
          <Alert
            variant="error"
            title="Error submitting request"
            onDismiss={() => setError(null)}
            className="mb-4"
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            variant="success"
            title="Request submitted successfully"
            onDismiss={() => setSuccess(false)}
            className="mb-4"
          >
            Your request has been submitted and is pending approval. Redirecting to your requests page...
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              id="item-name"
              label="Item Name"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              required
              placeholder="Enter the item name"
              disabled={!!selectedItem}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="quantity"
                label="Quantity"
                type="number"
                min={1}
                value={quantity.toString()}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                required
              />

              <Select
                id="priority"
                label="Priority Level"
                value={priority}
                onChange={(e) => setPriority(e.target.value as RequestPriority)}
                options={priorityOptions}
                required
              />
            </div>

            <Input
              id="delivery-date"
              label="Requested Delivery Date"
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              required
            />

            <Textarea
              id="description"
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide additional details about the request"
            />

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attachment (optional)
              </label>
              <div className="mt-1 flex items-center">
                <label className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <span>Choose file</span>
                  <input
                    type="file"
                    className="sr-only"
                    onChange={handleFileChange}
                  />
                </label>
                <span className="ml-3 text-sm text-gray-500">
                  {attachment ? attachment.name : "No file selected"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button type="button" variant="outline" className="mr-3">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
              icon={<Send className="h-4 w-4" />}
            >
              Submit Request
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default RequestForm;
