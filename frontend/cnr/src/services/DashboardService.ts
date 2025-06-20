import type {
  PensionData,
  PaginatedResponse,
  RiskLevelStats,
} from "../contexts/DashboardContext";

const API_BASE_URL = "http://localhost:8080/api/v1";

const DashboardService = {
  getPensions: async (
    token: string,
    role: string,
    wilaya?: string,
    avantages?: string[]
  ): Promise<PaginatedResponse> => {
    if (!token) {
      throw new Error("No authentication token provided");
    }
    if (!role || (role !== "admin" && role !== "user")) {
      throw new Error("Invalid or missing user role");
    }

    try {
      const queryParams = new URLSearchParams();
      if (wilaya) {
        queryParams.append("ag", wilaya);
      }
      if (avantages && avantages.length > 0) {
        queryParams.append("avantages", avantages.join(","));
      }

      // For admin users, use /admin/pensions
      // For regular users, use /pensions
      const endpoint = role === "admin" ? "admin/pensions" : "pensions";
      const response = await fetch(
        `${API_BASE_URL}/${endpoint}?${queryParams.toString()}`,
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
      if (!data.data || !Array.isArray(data.data)) {
        throw new Error("Invalid response format: expected data array");
      }

      // Calculate pagination metadata on the frontend
      // const total = data.data.length;
      // const startIndex = (page - 1) * limit;
      // const endIndex = startIndex + limit;
      // const paginatedData = data.data.slice(startIndex, endIndex);

      return {
        data: data.data,
        // meta: {
        //   total,
        //   // page,
        //   // limit,
        // },
      };
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

  getRiskLevelStats: async (
    token: string,
    role: string,
    wilaya?: string,
    categories?: string[],
    avantages?: string[]
  ): Promise<RiskLevelStats[]> => {
    if (!token) {
      throw new Error("No authentication token provided");
    }
    if (!role || (role !== "admin" && role !== "user")) {
      throw new Error("Invalid or missing user role");
    }

    try {
      const filters = {
        wilaya: wilaya || "",
        categories: categories || [],
        avantages: avantages || [],
      };

      const endpoint =
        role === "admin" ? "admin/pensions/risk-stats" : "pensions/risk-stats";
      const url = `${API_BASE_URL}/${endpoint}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token.trim()}`,
        },
        body: JSON.stringify(filters),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          throw new Error("Invalid or expired token");
        }
        throw new Error(
          errorData.message || "Failed to fetch risk level stats"
        );
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error(
          "Invalid response format: expected an array of risk stats"
        );
      }
      return data as RiskLevelStats[];
    } catch (error) {
      console.error("Error fetching risk level stats:", error);
      throw error;
    }
  },
};

export default DashboardService;
