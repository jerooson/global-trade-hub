const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  is_verified: boolean;
}

export interface LoginResponse {
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

class AuthApiService {
  private refreshing: Promise<string> | null = null;

  /**
   * Make an authenticated API request with automatic token refresh
   */
  private async fetchWithAuth(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const token = localStorage.getItem("accessToken");

    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    let response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers,
    });

    // If token expired, try to refresh
    if (response.status === 401) {
      const errorData = await response.json().catch(() => ({}));
      
      if (errorData.code === "TOKEN_EXPIRED") {
        try {
          const newToken = await this.refreshAccessToken();
          
          // Retry request with new token
          headers["Authorization"] = `Bearer ${newToken}`;
          response = await fetch(`${API_URL}${url}`, {
            ...options,
            headers,
          });
        } catch (refreshError) {
          // Refresh failed, logout user
          this.clearTokens();
          window.location.href = "/login";
          throw new Error("Session expired. Please login again.");
        }
      }
    }

    return response;
  }

  /**
   * Refresh the access token
   */
  private async refreshAccessToken(): Promise<string> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshing) {
      return this.refreshing;
    }

    this.refreshing = (async () => {
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          throw new Error("No refresh token");
        }

        const response = await fetch(`${API_URL}/api/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
          throw new Error("Failed to refresh token");
        }

        const data: RefreshResponse = await response.json();
        localStorage.setItem("accessToken", data.accessToken);
        
        return data.accessToken;
      } finally {
        this.refreshing = null;
      }
    })();

    return this.refreshing;
  }

  /**
   * Clear tokens from storage
   */
  private clearTokens(): void {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }

  /**
   * Login with email and password
   */
  async login(data: LoginData): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Login failed");
    }

    return response.json();
  }

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.errors?.[0]?.msg || "Registration failed");
    }

    return response.json();
  }

  /**
   * Logout
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });
    } finally {
      this.clearTokens();
    }
  }

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<User> {
    const response = await this.fetchWithAuth("/api/auth/me");

    if (!response.ok) {
      throw new Error("Failed to get user info");
    }

    return response.json();
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to send reset email");
    }

    return response.json();
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.errors?.[0]?.msg || "Failed to reset password");
    }

    return response.json();
  }

  /**
   * Store OAuth tokens and fetch user
   */
  async handleOAuthCallback(accessToken: string, refreshToken: string): Promise<User> {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    
    return this.getCurrentUser();
  }
}

export const authApi = new AuthApiService();

