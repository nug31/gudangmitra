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

      const users = await response.json();
      console.log("Received users from API:", users);

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
      const response = await fetch(`${API_URL}/users/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`User ${id} not found`);
          return undefined;
        }
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const user = await response.json();
      console.log("Received user from API:", user);

      return {
        id: user.id.toString(),
        username: user.name || user.username,
        email: user.email,
        role: user.role,
      };
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
}

export const userService = new UserService();
