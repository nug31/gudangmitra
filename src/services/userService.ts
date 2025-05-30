import { User } from "../types";
import { API_BASE_URL } from "../config";

const API_URL = API_BASE_URL; // Use config for environment-specific URLs

class UserService {
  /**
   * Get all users from the database
   */
  async getAllUsers(): Promise<User[]> {
    try {
      console.log("Fetching all users from API...");
      const response = await fetch(`${API_URL}/users`);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const response_data = await response.json();
      console.log("Received users from API:", response_data);

      // Handle the API response format: {success: true, users: [...]}
      const users = response_data.users || response_data;

      if (!Array.isArray(users)) {
        console.error("Users response is not an array:", users);
        return [];
      }

      return users.map((user: any) => ({
        id: user.id.toString(),
        username: user.name || user.username,
        email: user.email,
        role: user.role,
      }));
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  }

  /**
   * Get a user by ID from the database
   */
  async getUserById(id: string): Promise<User | undefined> {
    try {
      console.log(`Fetching user ${id} from API...`);

      // Since individual user endpoint doesn't exist, get all users and find the one we need
      const allUsers = await this.getAllUsers();
      const user = allUsers.find(u => u.id.toString() === id.toString());

      if (user) {
        console.log("Found user:", user);
        return user;
      } else {
        console.log(`User ${id} not found in users list`);
        return undefined;
      }
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      return undefined;
    }
  }

  /**
   * Get a user by email from the database
   */
  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      console.log(`Fetching user by email ${email} from API...`);
      const response = await fetch(`${API_URL}/users/email/${email}`);

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`User with email ${email} not found`);
          return undefined;
        }
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const user = await response.json();
      console.log("Received user by email from API:", user);

      return {
        id: user.id.toString(),
        username: user.name || user.username,
        email: user.email,
        role: user.role,
      };
    } catch (error) {
      console.error(`Error fetching user by email ${email}:`, error);
      return undefined;
    }
  }

  /**
   * Create a new user
   */
  async createUser(userData: {
    name: string;
    email: string;
    password: string;
    role?: string;
  }): Promise<User> {
    try {
      console.log("Creating new user via API...");
      const response = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      console.log("User created successfully:", result);

      return {
        id: result.user.id.toString(),
        username: result.user.username,
        email: result.user.email,
        role: result.user.role,
      };
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  /**
   * Update an existing user
   */
  async updateUser(id: string, userData: {
    username?: string;
    email?: string;
    password?: string;
    role?: string;
  }): Promise<User> {
    try {
      console.log(`Updating user ${id} via API...`);
      const response = await fetch(`${API_URL}/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      console.log("User updated successfully:", result);

      return {
        id: result.user.id.toString(),
        username: result.user.username,
        email: result.user.email,
        role: result.user.role,
      };
    } catch (error) {
      console.error(`Error updating user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a user
   */
  async deleteUser(id: string): Promise<boolean> {
    try {
      console.log(`Deleting user ${id} via API...`);
      const response = await fetch(`${API_URL}/users/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      console.log("User deleted successfully:", result);
      return result.success;
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  }
}

export const userService = new UserService();
