interface AuthResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

const API_BASE_URL = "http://localhost:8080/api/v1";

const AuthService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Login failed");
      }

      const data = await response.json();
      console.log("Raw response data:", data); // Debug log

      // Validate response structure
      if (!data.token || !data.user) {
        throw new Error("Invalid response format from server");
      }

      // Validate user data structure
      if (
        !data.user.id ||
        data.user.name === undefined ||
        !data.user.email ||
        !data.user.role
      ) {
        throw new Error("Invalid user data in response");
      }

      return {
        token: data.token,
        user: {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
        },
      };
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  register: async (
    name: string,
    email: string,
    password: string
  ): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  },

  getPensionData: async (token: string): Promise<unknown[]> => {
    const response = await fetch(`${API_BASE_URL}/pensions`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch pension data");
    }

    return response.json();
  },
};

export default AuthService;
