import React, { useEffect, useState } from "react";
import MainLayout from "../components/layout/MainLayout";
import RequestForm from "../components/requests/RequestForm";
import { useAuth } from "../contexts/AuthContext";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import { LogIn } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { Item } from "../types";
import { itemService } from "../services/itemService";

const NewRequestPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItemIfProvided = async () => {
      // Get the item ID from the URL query parameters
      const searchParams = new URLSearchParams(location.search);
      const itemId = searchParams.get("item");

      if (itemId) {
        setLoading(true);
        try {
          const item = await itemService.getItemById(itemId);
          if (item) {
            setSelectedItem(item);
          } else {
            setError("The requested item could not be found.");
          }
        } catch (err) {
          console.error("Error fetching item:", err);
          setError("Failed to load the requested item.");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchItemIfProvided();
  }, [location.search]);

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Create New Request
          </h1>

          {error && (
            <Alert
              variant="warning"
              title="Request Not Found"
              onDismiss={() => setError(null)}
              className="mb-4"
            >
              {error}
            </Alert>
          )}

          {!isAuthenticated ? (
            <div className="text-center py-12">
              <Alert variant="info" title="Authentication Required">
                You need to be logged in to create a new request.
              </Alert>

              <div className="mt-6">
                <Button
                  variant="primary"
                  to="/login"
                  as={Link}
                  icon={<LogIn className="h-4 w-4" />}
                >
                  Sign In
                </Button>
              </div>
            </div>
          ) : loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-3 text-gray-600">Loading item details...</p>
            </div>
          ) : (
            <RequestForm selectedItem={selectedItem} />
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default NewRequestPage;
