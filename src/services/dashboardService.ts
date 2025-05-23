import { API_BASE_URL } from "../config";

const API_URL = API_BASE_URL; // Use config for environment-specific URLs

export interface DashboardStats {
  // User statistics
  totalUsers: number;
  usersByRole: {
    admin: number;
    manager: number;
    user: number;
  };

  // Item statistics
  totalItems: number;
  totalQuantity: number;
  lowStockItems: number;
  totalCategories: number;

  // Request statistics
  totalRequests: number;
  requestsByStatus: {
    pending: number;
    approved: number;
    denied: number;
    fulfilled: number;
  };
  recentRequests: number; // Last 7 days

  // Top requested items
  topRequestedItems: Array<{
    name: string;
    totalRequested: number;
  }>;

  // Recent activity
  recentActivity: Array<{
    id: string;
    type: 'request_created' | 'request_approved' | 'request_denied' | 'item_added';
    description: string;
    timestamp: string;
    user?: string;
  }>;
}

export interface UserDashboardStats {
  // User's own request statistics
  myRequests: {
    total: number;
    pending: number;
    approved: number;
    denied: number;
    fulfilled: number;
  };

  // Recent requests (last 30 days)
  recentRequests: number;

  // Most requested items by this user
  myTopRequestedItems: Array<{
    name: string;
    totalRequested: number;
    category: string;
  }>;

  // Available items count
  availableItems: number;

  // Available categories
  availableCategories: number;

  // Recent activity for this user
  myRecentActivity: Array<{
    id: string;
    type: 'request_created' | 'request_approved' | 'request_denied' | 'request_fulfilled';
    description: string;
    timestamp: string;
    status?: string;
  }>;
}

class DashboardService {
  /**
   * Get comprehensive dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      console.log("Fetching dashboard statistics from API...");
      const response = await fetch(`${API_URL}/dashboard/stats`);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const stats = await response.json();
      console.log("Received dashboard stats from API:", stats);

      return stats;
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      // Return default stats if API fails
      return this.getDefaultStats();
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{ totalUsers: number; usersByRole: any }> {
    try {
      const response = await fetch(`${API_URL}/dashboard/users`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching user stats:", error);
      return { totalUsers: 0, usersByRole: { admin: 0, manager: 0, user: 0 } };
    }
  }

  /**
   * Get item statistics
   */
  async getItemStats(): Promise<{ totalItems: number; totalQuantity: number; lowStockItems: number; totalCategories: number }> {
    try {
      const response = await fetch(`${API_URL}/dashboard/items`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching item stats:", error);
      return { totalItems: 0, totalQuantity: 0, lowStockItems: 0, totalCategories: 0 };
    }
  }

  /**
   * Get request statistics
   */
  async getRequestStats(): Promise<{ totalRequests: number; requestsByStatus: any; recentRequests: number }> {
    try {
      const response = await fetch(`${API_URL}/dashboard/requests`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching request stats:", error);
      return {
        totalRequests: 0,
        requestsByStatus: { pending: 0, approved: 0, denied: 0, fulfilled: 0 },
        recentRequests: 0
      };
    }
  }

  /**
   * Get top requested items
   */
  async getTopRequestedItems(): Promise<Array<{ name: string; totalRequested: number }>> {
    try {
      const response = await fetch(`${API_URL}/dashboard/top-items`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching top requested items:", error);
      return [];
    }
  }

  /**
   * Get recent activity
   */
  async getRecentActivity(): Promise<Array<any>> {
    try {
      const response = await fetch(`${API_URL}/dashboard/activity`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      return [];
    }
  }

  /**
   * Get user-specific dashboard statistics
   */
  async getUserDashboardStats(userId: string): Promise<UserDashboardStats> {
    try {
      console.log(`Fetching user dashboard statistics for user ${userId}...`);
      const response = await fetch(`${API_URL}/dashboard/user/${userId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const stats = await response.json();
      console.log("Received user dashboard stats from API:", stats);

      return stats;
    } catch (error) {
      console.error("Error fetching user dashboard stats:", error);
      // Return default stats if API fails
      return this.getDefaultUserStats();
    }
  }

  /**
   * Default stats for fallback
   */
  private getDefaultStats(): DashboardStats {
    return {
      totalUsers: 0,
      usersByRole: { admin: 0, manager: 0, user: 0 },
      totalItems: 0,
      totalQuantity: 0,
      lowStockItems: 0,
      totalCategories: 0,
      totalRequests: 0,
      requestsByStatus: { pending: 0, approved: 0, denied: 0, fulfilled: 0 },
      recentRequests: 0,
      topRequestedItems: [],
      recentActivity: []
    };
  }

  /**
   * Default user stats for fallback
   */
  private getDefaultUserStats(): UserDashboardStats {
    return {
      myRequests: {
        total: 0,
        pending: 0,
        approved: 0,
        denied: 0,
        fulfilled: 0
      },
      recentRequests: 0,
      myTopRequestedItems: [],
      availableItems: 0,
      availableCategories: 0,
      myRecentActivity: []
    };
  }
}

export const dashboardService = new DashboardService();
