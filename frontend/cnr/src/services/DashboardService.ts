import type {
  PensionData,
  PaginatedResponse,
} from "../contexts/DashboardContext";

const API_BASE_URL = "http://localhost:8080/api/v1";

const DashboardService = {
  getPensions: async (
    token: string,
    role: string,
    page: number = 1,
    limit: number = 10,
    wilaya?: string
  ): Promise<PaginatedResponse> => {
    if (!token) {
      throw new Error("No authentication token provided");
    }
    if (!role || (role !== "admin" && role !== "user")) {
      throw new Error("Invalid or missing user role");
    }

    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (wilaya) {
        queryParams.append("wilaya", wilaya);
      }

      // For admin users, use /admin/pensions
      // For regular users, use /pensions
      const endpoint = role === "admin" ? "admin/pensions" : "pensions";
      const response = await fetch(
        `${API_BASE_URL}/${endpoint}?page=${page}&limit=${limit}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token.trim()}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          throw new Error("Invalid or expired token");
        }
        throw new Error(errorData.message || "Failed to fetch pension data");
      }

      const data = await response.json();
      if (!data.data || !Array.isArray(data.data) || !data.meta) {
        throw new Error(
          "Invalid response format: expected data array and meta object"
        );
      }
      return data as PaginatedResponse;
    } catch (error) {
      console.error("Error fetching pension data:", error);
      throw error;
    }
  },

  getPensionById: async (
    token: string,
    role: string,
    id: string
  ): Promise<PensionData> => {
    if (!token) {
      throw new Error("No authentication token provided");
    }
    if (!role || (role !== "admin" && role !== "user")) {
      throw new Error("Invalid or missing user role");
    }

    try {
      // For admin users, use /admin/pensions/{id}
      // For regular users, use /pensions/{id}
      const endpoint = role === "admin" ? "admin/pensions" : "pensions";
      const response = await fetch(`${API_BASE_URL}/${endpoint}/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token.trim()}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          throw new Error("Invalid or expired token");
        }
        throw new Error(errorData.message || "Failed to fetch pension data");
      }

      const data = await response.json();
      return data as PensionData;
    } catch (error) {
      console.error("Error fetching pension data:", error);
      throw error;
    }
  },
};

export default DashboardService;
