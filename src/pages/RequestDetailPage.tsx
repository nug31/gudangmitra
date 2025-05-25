import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ItemRequest, RequestStatus, User as UserType } from "../types";
import { requestService } from "../services/requestService";
import { userService } from "../services/userService";
import { useAuth } from "../contexts/AuthContext";
import MainLayout from "../components/layout/MainLayout";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";
import {
  Clock,
  Calendar,
  Package,
  User,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Loader,
  Mail,
} from "lucide-react";

const RequestDetailPage: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { /* isAuthenticated, */ isAdmin } = useAuth();
  const [request, setRequest] = useState<ItemRequest | null>(null);
  const [requester, setRequester] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!name) {
      setError("Request name is missing");
      setLoading(false);
      return;
    }

    const fetchRequestDetails = async () => {
      setLoading(true);
      try {
        // Decode the URL-encoded name
        const decodedName = decodeURIComponent(name);
        console.log("Fetching request details for:", decodedName);

        // Try multiple approaches to find the request
        let requestData;

        // First, try to get the request directly by ID (in case the name is actually an ID)
        try {
          console.log("Trying to fetch request by ID:", decodedName);
          requestData = await requestService.getRequestById(decodedName);
          console.log("Successfully fetched request by ID:", requestData);
        } catch (idError) {
          console.log("Failed to fetch request by ID:", idError);

          // If that fails, try to find by name
          try {
            console.log("Trying to fetch request by name:", decodedName);
            requestData = await requestService.getRequestByName(decodedName);
            console.log("Successfully fetched request by name:", requestData);
          } catch (nameError) {
            console.log("Failed to fetch request by name:", nameError);

            // If both approaches fail, try one more approach - get all requests and filter
            console.log("Trying to find request in all requests");
            const allRequests = await requestService.getAllRequests();
            console.log("All available requests:", allRequests);

            // First try direct match
            const directMatch = allRequests.find(
              (req) => req.itemName.toLowerCase() === decodedName.toLowerCase()
            );

            // Then try partial match
            const partialMatch = allRequests.find((req) =>
              req.itemName.toLowerCase().includes(decodedName.toLowerCase())
            );

            // Then try ID match again
            const idMatch = allRequests.find((req) => req.id === decodedName);

            console.log("Direct match:", directMatch);
            console.log("Partial match:", partialMatch);
            console.log("ID match:", idMatch);

            // Use the first match found
            requestData = directMatch || partialMatch || idMatch;

            if (!requestData) {
              console.error("No matching request found for:", decodedName);
              throw new Error("Request not found");
            }
          }
        }

        console.log("Found matching request:", requestData);
        console.log("Request items:", requestData?.items);
        console.log("Request structure check:", {
          hasItems: !!(requestData?.items && requestData.items.length > 0),
          itemsLength: requestData?.items?.length,
          firstItem: requestData?.items?.[0]
        });

        // Make sure requestData is not undefined before setting it
        if (requestData) {
          setRequest(requestData);

          // Fetch the requester information from the database
          try {
            console.log(
              "Fetching user information for ID:",
              requestData.userId
            );
            const userData = await userService.getUserById(requestData.userId);
            console.log("User data from database:", userData);
            if (userData) {
              setRequester(userData);
            }
          } catch (userErr) {
            console.error("Error fetching requester details:", userErr);
            // Don't set an error for this, as it's not critical
          }
        } else {
          console.error("Request data is undefined");
          throw new Error("Request not found");
        }
      } catch (err) {
        console.error("Error fetching request details:", err);
        setError("Request not found or failed to load request details");
      } finally {
        setLoading(false);
      }
    };

    fetchRequestDetails();
  }, [name]);

  const handleStatusChange = async (status: RequestStatus) => {
    if (!request) return;

    setActionLoading(true);
    try {
      const updatedRequest = await requestService.updateRequestStatus(
        request.id,
        status
      );
      if (updatedRequest) {
        setRequest(updatedRequest);
      } else {
        setError("Failed to update request status");
      }
    } catch (err) {
      console.error("Error updating request status:", err);
      setError("Failed to update request status");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusVariant = (status: RequestStatus) => {
    switch (status) {
      case "approved":
        return "success";
      case "pending":
        return "warning";
      case "rejected":
        return "danger";
      case "completed":
        return "secondary";
      default:
        return "default";
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case "high":
        return "danger";
      case "medium":
        return "warning";
      case "low":
        return "primary";
      default:
        return "default";
    }
  };

  const formatDate = (dateString: string) => {
    // Create a date object from the UTC string
    const date = new Date(dateString);

    // Format in Indonesian timezone (WIB - UTC+7) - date only, no time
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Asia/Jakarta"
    });
  };

  // Comment out the authentication check for now to allow viewing request details without being logged in
  /*
  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <Alert variant="info" title="Authentication Required">
            You need to be logged in to view request details.
          </Alert>
        </div>
      </MainLayout>
    );
  }
  */

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/requests")}
            icon={<ArrowLeft className="h-4 w-4 mr-1" />}
          >
            Back to Requests
          </Button>
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

        {loading ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <Loader className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
            <p className="text-gray-600">Loading request details...</p>
          </div>
        ) : request ? (
          <Card>
            <CardHeader className="border-b border-gray-200 bg-gray-50">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Package className="mr-2 h-6 w-6 text-blue-600" />
                    {request.project_name || request.projectName || `Request for ${request.itemName}` || 'Request Details'}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    <span className="font-medium">Request ID:</span>{" "}
                    {request.id}
                  </p>
                </div>
                <Badge
                  variant={getStatusVariant(request.status)}
                  className="mt-2 md:mt-0 text-base px-3 py-1"
                >
                  {request.status.charAt(0).toUpperCase() +
                    request.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Request Details
                  </h2>

                  <div className="space-y-4">
                    {/* Display items from the new database structure */}
                    {console.log("Rendering request:", request)}
                    {console.log("Request items check:", request.items, request.items?.length)}
                    {request.items && request.items.length > 0 ? (
                      <div>
                        <p className="text-sm text-gray-500">Items Requested</p>
                        <div className="space-y-2">
                          {request.items.map((item: any, index: number) => (
                            <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-gray-600">{item.description}</p>
                                <p className="text-xs text-gray-500">Category: {item.category}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">Qty: {item.quantity}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      // Fallback for old structure or if no items
                      <>
                        <div>
                          <p className="text-sm text-gray-500">Item</p>
                          <p className="font-medium">{request.itemName || request.project_name || 'Unknown Item'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Quantity</p>
                          <p className="font-medium">{request.quantity || 'Not specified'}</p>
                        </div>
                      </>
                    )}

                    <div>
                      <p className="text-sm text-gray-500">Priority</p>
                      <Badge variant={getPriorityVariant(request.priority)}>
                        {request.priority.charAt(0).toUpperCase() +
                          request.priority.slice(1)}
                      </Badge>
                    </div>

                    {(request.reason || request.description) && (
                      <div>
                        <p className="text-sm text-gray-500">Description</p>
                        <p className="font-medium">{request.reason || request.description}</p>
                      </div>
                    )}

                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-sm text-gray-500 mb-2">Requested By</p>
                      <div className="flex items-center">
                        <User className="h-5 w-5 text-blue-600 mr-2" />
                        <div>
                          <p className="font-medium">
                            {requester?.username ||
                              request.requesterName ||
                              "Unknown User"}
                          </p>
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-3 w-3 mr-1" />
                            <span>
                              {requester?.email ||
                                request.requesterEmail ||
                                "No email available"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Timeline
                  </h2>

                  <div className="space-y-4">
                    <div className="flex items-start">
                      <Clock className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                      <div>
                        <p className="font-medium">Created</p>
                        <p className="text-sm text-gray-600">
                          {formatDate(request.created_at || request.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Calendar className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                      <div>
                        <p className="font-medium">Requested Delivery Date</p>
                        <p className="text-sm text-gray-600">
                          {formatDate(
                            request.due_date || request.requestedDeliveryDate || request.created_at || request.createdAt
                          )}
                        </p>
                      </div>
                    </div>

                    {(request.updated_at || request.updatedAt) &&
                      (request.updated_at || request.updatedAt) !== (request.created_at || request.createdAt) && (
                        <div className="flex items-start">
                          <Clock className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                          <div>
                            <p className="font-medium">Last Updated</p>
                            <p className="text-sm text-gray-600">
                              {formatDate(request.updated_at || request.updatedAt)}
                            </p>
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </CardContent>

            {isAdmin && request.status === "pending" && (
              <CardFooter className="bg-gray-50 border-t border-gray-200 p-4">
                <div className="flex justify-end gap-3">
                  <Button
                    variant="danger"
                    onClick={() => handleStatusChange("rejected")}
                    disabled={actionLoading}
                    icon={<XCircle className="h-4 w-4 mr-1" />}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="success"
                    onClick={() => handleStatusChange("approved")}
                    disabled={actionLoading}
                    icon={<CheckCircle className="h-4 w-4 mr-1" />}
                  >
                    Approve
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <Alert variant="warning" title="Request Not Found">
              The requested item could not be found.
            </Alert>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default RequestDetailPage;
