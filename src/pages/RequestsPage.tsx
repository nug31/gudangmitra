import React, { useState, useEffect } from "react";
import { ItemRequest, RequestStatus } from "../types";
import { requestService } from "../services/requestService";
import { useAuth } from "../contexts/AuthContext";
import MainLayout from "../components/layout/MainLayout";
import RequestList from "../components/requests/RequestList";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import { LogIn, ClipboardList } from "lucide-react";
import { API_BASE_URL } from "../config";

const RequestsPage: React.FC = () => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [requests, setRequests] = useState<ItemRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log(
      "RequestsPage useEffect - isAuthenticated:",
      isAuthenticated,
      "isAdmin:",
      isAdmin,
      "user:",
      user
    );

    // Fetch requests when the component mounts or when user/isAdmin changes
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, user]);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching requests, isAdmin:", isAdmin, "user:", user);

      // Direct API call to fetch requests
      console.log("Fetching from API URL:", `${API_BASE_URL}/requests`);

      const response = await fetch(`${API_BASE_URL}/requests`);
      console.log("Response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Raw API response:", data);

      // Map the API response to our ItemRequest type
      const mappedRequests = data.map((apiRequest: any) => {
        const firstItem =
          apiRequest.items && apiRequest.items.length > 0
            ? apiRequest.items[0]
            : null;

        return {
          id: apiRequest.id,
          userId: apiRequest.requester_id,
          itemId: firstItem ? firstItem.item_id.toString() : "",
          itemName: firstItem ? firstItem.name : apiRequest.project_name,
          quantity: firstItem ? firstItem.quantity : 1,
          priority: apiRequest.priority,
          status: apiRequest.status,
          description: apiRequest.reason || "",
          requestedDeliveryDate: apiRequest.due_date || "",
          createdAt: apiRequest.created_at || new Date().toISOString(),
          updatedAt: apiRequest.updated_at || new Date().toISOString(),
          projectName: apiRequest.project_name,
          requesterName:
            apiRequest.requester_name || `User ${apiRequest.requester_id}`,
          requesterEmail:
            apiRequest.requester_email ||
            `user${apiRequest.requester_id}@example.com`,
          items: apiRequest.items,
        };
      });

      console.log("Mapped requests:", mappedRequests);

      // Filter requests based on user role
      let filteredRequests = mappedRequests || [];

      // If user is not an admin or manager, only show their requests
      if (!isAdmin && user) {
        console.log("Filtering requests for user ID:", user.id);
        filteredRequests = filteredRequests.filter(
          (req) => req.userId === user.id
        );
        console.log("Filtered requests for user:", filteredRequests);
      }

      setRequests(filteredRequests);
    } catch (err) {
      setError("Failed to load requests. Please try again.");
      console.error("Error fetching requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: RequestStatus) => {
    try {
      const updatedRequest = await requestService.updateRequestStatus(
        id,
        status
      );
      setRequests((prev) =>
        prev.map((req) => (req.id === id ? updatedRequest : req))
      );
    } catch (err) {
      setError("Failed to update request status. Please try again.");
      console.error("Error updating request status:", err);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmMessage = isAdmin
      ? "Are you sure you want to delete this request? This action cannot be undone."
      : "Are you sure you want to cancel this request?";

    if (window.confirm(confirmMessage)) {
      try {
        await requestService.deleteRequest(id);
        setRequests((prev) => prev.filter((req) => req.id !== id));
      } catch (err: any) {
        const errorMessage = err.message || "Failed to delete request. Please try again.";
        setError(errorMessage);
        console.error("Error deleting request:", err);
      }
    }
  };

  return (
    <MainLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <ClipboardList className="mr-2 h-6 w-6 text-blue-600" />
            {isAdmin ? "All Requests" : "Your Requests"}
          </h1>
          <p className="mt-1 text-gray-600">
            {isAdmin
              ? "Manage and review all item requests."
              : "Track and manage your item requests."}
          </p>
        </div>
      </div>

      {error && (
        <Alert
          variant="error"
          title="Error"
          onDismiss={() => setError(null)}
          className="mb-6"
        >
          {error}
        </Alert>
      )}

      <RequestList
        requests={requests}
        isAdmin={isAdmin}
        onStatusChange={isAdmin ? handleStatusChange : undefined}
        onDelete={handleDelete}
        isLoading={loading}
      />
    </MainLayout>
  );
};

export default RequestsPage;
