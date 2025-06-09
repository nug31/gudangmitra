import { API_BASE_URL } from "../config";

export interface Loan {
  id: string;
  userId: string;
  itemId: string;
  itemName: string;
  quantity: number;
  status: 'active' | 'returned' | 'overdue';
  borrowedDate: string;
  dueDate: string;
  returnedDate?: string;
  notes?: string;
  userName?: string;
  userEmail?: string;
}

export interface BorrowRequest {
  itemId: string;
  quantity: number;
  dueDate: string;
  notes?: string;
}

export interface ReturnRequest {
  loanId: string;
  notes?: string;
}

class LoanService {
  private debug = (message: string, ...args: any[]) => {
    console.log(`[LoanService] ${message}`, ...args);
  };

  // Get all loans for a user
  async getUserLoans(userId: string): Promise<Loan[]> {
    try {
      this.debug("Fetching loans for user:", userId);

      const response = await fetch(`${API_BASE_URL}/api/loans/user/${userId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const loans: Loan[] = await response.json();
      this.debug("Received loans:", loans);

      return loans;
    } catch (error) {
      console.error("Error fetching user loans:", error);
      throw error;
    }
  }

  // Get all loans (admin/manager only)
  async getAllLoans(): Promise<Loan[]> {
    try {
      this.debug("Fetching all loans");

      const response = await fetch(`${API_BASE_URL}/api/loans`);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const loans: Loan[] = await response.json();
      this.debug("Received all loans:", loans);

      return loans;
    } catch (error) {
      console.error("Error fetching all loans:", error);
      throw error;
    }
  }

  // Borrow an item
  async borrowItem(userId: string, borrowRequest: BorrowRequest): Promise<Loan> {
    try {
      this.debug("Borrowing item:", borrowRequest);

      const response = await fetch(`${API_BASE_URL}/api/loans/borrow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          ...borrowRequest,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }

      const loan: Loan = await response.json();
      this.debug("Item borrowed successfully:", loan);

      return loan;
    } catch (error) {
      console.error("Error borrowing item:", error);
      throw error;
    }
  }

  // Return an item
  async returnItem(returnRequest: ReturnRequest): Promise<Loan> {
    try {
      this.debug("Returning item:", returnRequest);

      const response = await fetch(`${API_BASE_URL}/api/loans/return`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(returnRequest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }

      const loan: Loan = await response.json();
      this.debug("Item returned successfully:", loan);

      return loan;
    } catch (error) {
      console.error("Error returning item:", error);
      throw error;
    }
  }

  // Get loan details
  async getLoanDetails(loanId: string): Promise<Loan> {
    try {
      this.debug("Fetching loan details:", loanId);

      const response = await fetch(`${API_BASE_URL}/api/loans/${loanId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const loan: Loan = await response.json();
      this.debug("Received loan details:", loan);

      return loan;
    } catch (error) {
      console.error("Error fetching loan details:", error);
      throw error;
    }
  }

  // Check if item is available for borrowing
  async checkItemAvailability(itemId: string, quantity: number): Promise<boolean> {
    try {
      this.debug("Checking item availability:", { itemId, quantity });

      const response = await fetch(`${API_BASE_URL}/api/loans/check-availability`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemId, quantity }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      this.debug("Availability check result:", result);

      return result.available;
    } catch (error) {
      console.error("Error checking item availability:", error);
      throw error;
    }
  }

  // Get overdue loans
  async getOverdueLoans(): Promise<Loan[]> {
    try {
      this.debug("Fetching overdue loans");

      const response = await fetch(`${API_BASE_URL}/api/loans/overdue`);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const loans: Loan[] = await response.json();
      this.debug("Received overdue loans:", loans);

      return loans;
    } catch (error) {
      console.error("Error fetching overdue loans:", error);
      throw error;
    }
  }

  // Format date for display
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Check if loan is overdue
  isOverdue(dueDate: string): boolean {
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  }

  // Calculate days until due
  getDaysUntilDue(dueDate: string): number {
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

export const loanService = new LoanService();
