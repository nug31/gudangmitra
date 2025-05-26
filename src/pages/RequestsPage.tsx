import React, { useState, useEffect } from "react";
import { ItemRequest, RequestStatus } from "../types";
import { requestService } from "../services/requestService";
import { useAuth } from "../contexts/AuthContext";
import MainLayout from "../components/layout/MainLayout";
import RequestList from "../components/requests/RequestList";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import { LogIn, ClipboardList } from "lucide-react";
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

      let requestData;
      if (isAdmin) {
        // Admin sees all requests
        requestData = await requestService.getAllRequests();
      } else if (user) {
        // Regular users see only their requests
        requestData = await requestService.getUserRequests(user.id);
      } else {
        requestData = [];
      }

      console.log("Received requests from requestService:", requestData);
      setRequests(requestData || []);
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
        <div className="mt-4 sm:mt-0">
          <Button
            variant="outline"
            onClick={fetchRequests}
            disabled={loading}
          >
            Refresh
          </Button>
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
