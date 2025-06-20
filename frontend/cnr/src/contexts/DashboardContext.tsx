import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import DashboardService from "../services/DashboardService";

export interface PensionData {
  id: number;
  ag: number;
  avt: string;
  npens: string;
  etatpens: string;
  datenais: string;
  datjouis: string;
  age_app_tp: number;
  age_moyen_cat: number;
  duree_pension: number;
  niveau_risque_predit: number;
  risque_age: number;
  sexe_tp: string;
  taux_d: number;
  taux_glb: number;
  taux_rv: number;
  net_mens: number;
  wilaya: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
}

export interface PaginatedResponse {
  data: PensionData[];
}

export interface RiskLevelStats {
  riskLevel: string;
  count: number;
  percentage: number;
}

interface DashboardContextType {
  pensionData: PensionData[] | null;
  loading: boolean;
  error: string | null;
  refreshData: (wilaya?: string) => Promise<void>;
  selectedPension: PensionData | null;
  setSelectedPension: (pension: PensionData | null) => void;
  getPensionById: (id: string) => Promise<PensionData>;
  pagination: PaginationMeta;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  riskLevelStats: RiskLevelStats[] | null;
  refreshRiskStats: (
    wilaya?: string,
    categories?: string[],
    avantages?: string[]
  ) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { token, isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [pensionData, setPensionData] = useState<PensionData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPension, setSelectedPension] = useState<PensionData | null>(
    null
  );
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
  });
  const [riskLevelStats, setRiskLevelStats] = useState<RiskLevelStats[] | null>(
    null
  );

  const fetchData = useCallback(
    async (wilaya?: string) => {
      if (!token || !user?.role) return;

      try {
        setLoading(true);
        const response = await DashboardService.getPensions(
          token,
          user.role,
          wilaya
        );
        setPensionData(response.data);
        setPagination((prev) => ({
          ...prev,
          total: response.data.length,
        }));
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    },
    [token, user?.role]
  );

  const fetchRiskLevelStats = useCallback(
    async (wilaya?: string, categories?: string[], avantages?: string[]) => {
      if (!token || !user?.role) return;

      try {
        const stats = await DashboardService.getRiskLevelStats(
          token,
          user.role,
          wilaya,
          categories,
          avantages
        );
        setRiskLevelStats(stats);
      } catch (err) {
        console.error("Error fetching risk level stats:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    },
    [token, user?.role]
  );

  const getPensionById = useCallback(
    async (id: string): Promise<PensionData> => {
      if (!token || !isAuthenticated || !user) {
        throw new Error("Not authenticated");
      }
      return DashboardService.getPensionById(token, user.role, id);
    },
    [token, isAuthenticated, user]
  );

  const handleSetPage = useCallback((page: number) => {
    setPagination((prev) => ({
      ...prev,
      page,
    }));
  }, []);

  const handleSetLimit = useCallback((limit: number) => {
    setPagination((prev) => ({
      ...prev,
      limit,
      page: 1, // Reset to first page when changing limit
    }));
  }, []);

  const refreshData = useCallback(
    async (wilaya?: string) => {
      await fetchData(wilaya);
    },
    [fetchData]
  );

  const refreshRiskStats = useCallback(
    async (wilaya?: string, categories?: string[], avantages?: string[]) => {
      await fetchRiskLevelStats(wilaya, categories, avantages);
    },
    [fetchRiskLevelStats]
  );

  useEffect(() => {
    fetchData();
    fetchRiskLevelStats();
  }, [fetchData, fetchRiskLevelStats]);

  return (
    <DashboardContext.Provider
      value={{
        pensionData,
        loading,
        error,
        refreshData,
        selectedPension,
        setSelectedPension,
        getPensionById,
        pagination,
        setPage: handleSetPage,
        setLimit: handleSetLimit,
        riskLevelStats,
        refreshRiskStats,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
};
