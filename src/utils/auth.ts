import { User, UserRole } from "../types";
import { API_BASE_URL } from "../config";

// Authentication service
class AuthService {
  private currentUser: User | null = null;
  private isAuthenticated: boolean = false;
  private apiUrl = API_BASE_URL;

  async login(email: string, password: string): Promise<User> {
    try {
      console.log(`Attempting to login with email: ${email}`);
      console.log(`API URL: ${this.apiUrl}/auth/login`);

      // Log the request payload
      const payload = JSON.stringify({ email, password });
      console.log(`Request payload: ${payload}`);

      const response = await fetch(`${this.apiUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: payload,
      });

      console.log(`Response status: ${response.status}`);

      // Check if the response is JSON
      const contentType = response.headers.get("content-type");
      console.log(`Content-Type: ${contentType}`);

      // Get the response text first
      const responseText = await response.text();
      console.log(`Response text: ${responseText.substring(0, 100)}...`); // Log first 100 chars

      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse JSON:", e);
        console.error("Response text:", responseText.substring(0, 500));
        throw new Error(
          "Server returned invalid JSON. Please check server logs."
        );
      }

      if (!response.ok) {
        throw new Error(data.message || "Invalid email or password");
      }

      console.log("Login response data:", data);

      if (data.success && data.user) {
        this.currentUser = data.user;
        this.isAuthenticated = true;
        localStorage.setItem("user", JSON.stringify(this.currentUser));
        return this.currentUser;
      } else {
        throw new Error("Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  // Register a new user using the API
  async register(username: string, email: string, password: string): Promise<User> {
    try {
      console.log(`Attempting to register with email: ${email}`);

      const response = await fetch(`${this.apiUrl}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
          role: "user"
        }),
      });

      console.log(`Response status: ${response.status}`);

      // Check if the response is JSON
      const contentType = response.headers.get("content-type");
      console.log(`Content-Type: ${contentType}`);

      // Get the response text first
      const responseText = await response.text();
      console.log(`Response text: ${responseText.substring(0, 100)}...`); // Log first 100 chars

      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse JSON:", e);
        console.error("Response text:", responseText.substring(0, 500));
        throw new Error(
          "Server returned invalid JSON. Please check server logs."
        );
      }

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      console.log("Registration response data:", data);

      if (data.success && data.user) {
        this.currentUser = data.user;
        this.isAuthenticated = true;
        localStorage.setItem("user", JSON.stringify(this.currentUser));
        return this.currentUser;
      } else {
        throw new Error("Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  }

  logout(): void {
    this.currentUser = null;
    this.isAuthenticated = false;
    localStorage.removeItem("user");
  }

  getUser(): User | null {
    if (!this.currentUser) {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        this.currentUser = JSON.parse(storedUser);
        this.isAuthenticated = true;
      }
    }
    return this.currentUser;
  }

  checkAuth(): boolean {
    this.getUser();
    return this.isAuthenticated;
  }

  hasRole(role: UserRole): boolean {
    const user = this.getUser();

    // Special case for admin role - treat manager as admin too
    if (role === "admin") {
      return user?.role === "admin" || user?.role === "manager";
    }

    return user?.role === role;
  }
}

export const authService = new AuthService();
