import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { loanService, Loan } from "../services/loanService";
import MainLayout from "../components/layout/MainLayout";
import { Card, CardHeader, CardContent } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";
import { 
  Package, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  User
} from "lucide-react";

const LoansPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'overdue' | 'returned'>('all');

  useEffect(() => {
    fetchLoans();
  }, [user, isAdmin]);

  const fetchLoans = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      let fetchedLoans: Loan[];
      if (isAdmin) {
        fetchedLoans = await loanService.getAllLoans();
      } else {
        fetchedLoans = await loanService.getUserLoans(user.id);
      }

      setLoans(fetchedLoans);
    } catch (err: any) {
      console.error("Error fetching loans:", err);
      setError(err.message || "Failed to fetch loans");
    } finally {
      setLoading(false);
    }
  };

  const handleReturnItem = async (loanId: string) => {
    try {
      await loanService.returnItem({ loanId });
      await fetchLoans(); // Refresh the list
    } catch (err: any) {
      console.error("Error returning item:", err);
      setError(err.message || "Failed to return item");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-blue-600 bg-blue-100';
      case 'returned':
        return 'text-green-600 bg-green-100';
      case 'overdue':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="h-4 w-4" />;
      case 'returned':
        return <CheckCircle className="h-4 w-4" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const filteredLoans = loans.filter(loan => {
    if (filter === 'all') return true;
    return loan.status === filter;
  });

  const activeLoans = loans.filter(loan => loan.status === 'active').length;
  const overdueLoans = loans.filter(loan => loan.status === 'overdue').length;
  const returnedLoans = loans.filter(loan => loan.status === 'returned').length;

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {isAdmin ? "All Loans" : "My Borrowed Items"}
        </h1>
        <p className="text-lg text-gray-600">
          {isAdmin 
            ? "Manage all item loans in the system" 
            : "Track your borrowed electronic items"
          }
        </p>
      </div>

      {error && (
        <Alert type="error" className="mb-6">
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Loans</p>
                <p className="text-2xl font-bold text-gray-900">{loans.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-blue-600">{activeLoans}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{overdueLoans}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Returned</p>
                <p className="text-2xl font-bold text-green-600">{returnedLoans}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['all', 'active', 'overdue', 'returned'] as const).map((filterOption) => (
          <Button
            key={filterOption}
            variant={filter === filterOption ? "primary" : "outline"}
            onClick={() => setFilter(filterOption)}
            size="sm"
          >
            {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
          </Button>
        ))}
      </div>

      {/* Loans List */}
      {filteredLoans.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No loans found
            </h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? "No items have been borrowed yet." 
                : `No ${filter} loans found.`
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredLoans.map((loan) => (
            <Card key={loan.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 mr-3">
                        {loan.itemName}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(loan.status)}`}>
                        {getStatusIcon(loan.status)}
                        <span className="ml-1">{loan.status.toUpperCase()}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Package className="h-4 w-4 mr-2" />
                        Quantity: {loan.quantity}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        Due: {loanService.formatDate(loan.dueDate)}
                      </div>
                      {isAdmin && loan.userName && (
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          Borrower: {loan.userName}
                        </div>
                      )}
                    </div>

                    {loan.notes && (
                      <p className="mt-2 text-sm text-gray-600 italic">
                        "{loan.notes}"
                      </p>
                    )}

                    <p className="mt-2 text-xs text-gray-500">
                      Borrowed: {loanService.formatDate(loan.borrowedDate)}
                      {loan.returnedDate && (
                        <span> • Returned: {loanService.formatDate(loan.returnedDate)}</span>
                      )}
                    </p>
                  </div>

                  {loan.status === 'active' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReturnItem(loan.id)}
                      className="ml-4"
                    >
                      Return Item
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </MainLayout>
  );
};

export default LoansPage;
