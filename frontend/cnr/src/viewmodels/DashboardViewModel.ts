import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import DashboardService from "../services/DashboardService";

export interface PensionData {
  id: number;
  npens: string;
  etatpens: string;
  datenais: string;
  datjouis: string;
  ag: string;
  avt: string;
  age_app_tp: number;
  age_moyen_cat: number;
  duree_pension: number;
  niveau_risque_predit: string;
  risque_age: string;
  sexe_tp: string;
  taux_d: number;
  taux_glb: number;
  taux_rv: number;
  net_mens: number;
}

export const useDashboardViewModel = () => {
  const { logout, token, user } = useAuth();
  const navigate = useNavigate();
  const [pensionData, setPensionData] = useState<PensionData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
  } | null>(null);

  const fetchPensionData = useCallback(async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      const response = await DashboardService.getPensions(
        token,
        user?.role ?? "user"
      );
      if ("data" in response && "meta" in response) {
        setPensionData(response.data as unknown as PensionData[]);
        setPagination({
          page: response.meta.page,
          limit: response.meta.limit,
          total: response.meta.total,
        });
      } else {
        throw new Error("Invalid response format from server");
      }
      setError(null);
    } catch (err: unknown) {
      let errorMessage = "An error occurred while fetching pension data";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      if (
        errorMessage.includes("Invalid token") ||
        errorMessage.includes("Token expired")
      ) {
        logout();
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [token, navigate, logout, user?.role]);

  useEffect(() => {
    fetchPensionData();
  }, [fetchPensionData]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const refreshData = () => {
    fetchPensionData();
  };

  return {
    pensionData,
    loading,
    error,
    pagination,
    handleLogout,
    refreshData,
  };
};
