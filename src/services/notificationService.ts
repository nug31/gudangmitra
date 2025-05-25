import { API_URL } from "../config";

export interface Notification {
  id: string;
  user_id: string;
  type: 'request_submitted' | 'request_approved' | 'request_rejected' | 'request_fulfilled' | 'comment_added';
  message: string;
  is_read: boolean;
  created_at: string;
  related_item_id?: string;
}

export interface CreateNotificationRequest {
  user_id: string;
  type: Notification['type'];
  message: string;
  related_item_id?: string;
}

class NotificationService {
  /**
   * Get all notifications for a user
   */
  async getUserNotifications(userId: string): Promise<Notification[]> {
    try {
      console.log(`Fetching notifications for user ${userId}...`);
      const response = await fetch(`${API_URL}/notifications/user/${userId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const notifications = await response.json();
      console.log(`Received ${notifications.length} notifications:`, notifications);

      return notifications;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const response = await fetch(`${API_URL}/notifications/user/${userId}/unread-count`);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      return result.count || 0;
    } catch (error) {
      console.error("Error fetching unread count:", error);
      return 0;
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return false;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/notifications/user/${userId}/mark-all-read`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      return false;
    }
  }

  /**
   * Create a new notification
   */
  async createNotification(notification: CreateNotificationRequest): Promise<Notification | null> {
    try {
      console.log("Creating notification:", notification);
      const response = await fetch(`${API_URL}/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(notification),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const createdNotification = await response.json();
      console.log("Notification created:", createdNotification);
      return createdNotification;
    } catch (error) {
      console.error("Error creating notification:", error);
      return null;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/notifications/${notificationId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error("Error deleting notification:", error);
      return false;
    }
  }

  /**
   * Create notifications for admins/managers when a new request is submitted
   */
  async notifyAdminsOfNewRequest(requestId: string, projectName: string, requesterName: string): Promise<void> {
    try {
      console.log(`Creating admin notifications for new request: ${requestId}`);
      
      // Get all admin and manager users
      const response = await fetch(`${API_URL}/users`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      const users = result.users || result;
      const adminUsers = users.filter((user: any) => 
        user.role === 'admin' || user.role === 'manager'
      );

      console.log(`Found ${adminUsers.length} admin/manager users:`, adminUsers);

      // Create notification for each admin/manager
      for (const admin of adminUsers) {
        await this.createNotification({
          user_id: admin.id,
          type: 'request_submitted',
          message: `New request "${projectName}" submitted by ${requesterName} requires your review`,
          related_item_id: requestId,
        });
      }
    } catch (error) {
      console.error("Error notifying admins of new request:", error);
    }
  }

  /**
   * Create notification for user when their request is approved/rejected
   */
  async notifyUserOfRequestUpdate(
    userId: string, 
    requestId: string, 
    projectName: string, 
    status: 'approved' | 'rejected' | 'fulfilled'
  ): Promise<void> {
    try {
      console.log(`Creating user notification for request update: ${requestId}, status: ${status}`);
      
      const statusMessages = {
        approved: `Your request "${projectName}" has been approved`,
        rejected: `Your request "${projectName}" has been rejected`,
        fulfilled: `Your request "${projectName}" has been fulfilled`,
      };

      await this.createNotification({
        user_id: userId,
        type: status === 'approved' ? 'request_approved' : 
              status === 'rejected' ? 'request_rejected' : 'request_fulfilled',
        message: statusMessages[status],
        related_item_id: requestId,
      });
    } catch (error) {
      console.error("Error notifying user of request update:", error);
    }
  }
}

export const notificationService = new NotificationService();
