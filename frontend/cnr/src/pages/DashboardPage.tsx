import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  useDashboard,
  type RiskLevelStats,
} from "../contexts/DashboardContext";
import { Map } from "algeria-map-ts";
import { Tooltip, Legend, ResponsiveContainer } from "recharts";

import RiskClusterDisplay from "../components/RiskClusterDisplay";
import RiskPieChart from "../components/RiskPieChart";
import FilterSection from "../components/FilterSection";

interface WilayaInfo {
  name: string;
  code: number;
}

interface WilayaData {
  value: number;
  color: string;
}

type WilayaMap = {
  [key: string]: WilayaData;
};

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();

  const {
    loading,
    error,
    pensionData,
    refreshData,
    pagination,
    setPage,
    setLimit,
    riskLevelStats,
    refreshRiskStats,
  } = useDashboard();

  const [selectedWilaya, setSelectedWilaya] = useState<WilayaInfo | null>(null);
  const [agFilter, setAgFilter] = useState<string>("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAvantages, setSelectedAvantages] = useState<string[]>([]);

  const handleRegionSelect = (wilaya: string) => {
    // Find the wilaya code from the data object
    const wilayaData = data[wilaya as keyof typeof data];
    const wilayaCode = wilayaData?.value;

    if (selectedWilaya?.name === wilaya) {
      setSelectedWilaya(null);
      setAgFilter("");
      refreshData(1, pagination?.limit || 10);
      refreshRiskStats(undefined, selectedCategories, selectedAvantages);
    } else {
      setSelectedWilaya({ name: wilaya, code: wilayaCode || 0 });
      refreshData(1, pagination?.limit || 10, wilaya);
      refreshRiskStats(
        wilayaCode.toString(),
        selectedCategories,
        selectedAvantages
      );
    }
  };

  const mapData = useMemo(() => {
    if (!selectedWilaya) return {};
    return {
      [selectedWilaya.name]: {
        value: selectedWilaya.code,
        color: "#93C5FD",
      },
    };
  }, [selectedWilaya]);

  const categoryOptions = ["décès", "fin droit", "révision"];
  const avantageOptions = [
    "Sélectionner tout",
    "(Vide)",
    "direct",
    "fille majeur",
  ];

  const handleCategoryChange = (category: string) => {
    setSelectedCategories((prevSelected) => {
      const newSelected = prevSelected.includes(category)
        ? prevSelected.filter((c) => c !== category)
        : [...prevSelected, category];
      refreshRiskStats(
        selectedWilaya?.code.toString(),
        newSelected,
        selectedAvantages
      );
      return newSelected;
    });
  };

  const handleAvantageChange = (avantage: string) => {
    setSelectedAvantages((prevSelected) => {
      let newSelected: string[];
      if (avantage === "Sélectionner tout") {
        const allSelectableAvantages = avantageOptions.filter(
          (opt) => opt !== "(Vide)"
        );
        const currentlyAllSelected = allSelectableAvantages.every((item) =>
          prevSelected.includes(item)
        );

        if (currentlyAllSelected) {
          newSelected = []; // Deselect all
        } else {
          newSelected = allSelectableAvantages; // Select all selectable
        }
      } else {
        newSelected = prevSelected.includes(avantage)
          ? prevSelected.filter((a) => a !== avantage)
          : [...prevSelected, avantage];
      }
      refreshRiskStats(
        selectedWilaya?.code.toString(),
        selectedCategories,
        newSelected
      );
      return newSelected;
    });
  };

  const getAvantageLabel = (avtCode: number): string => {
    switch (avtCode) {
      case 1:
      case 7:
        return "direct";
      case 4:
      case 9:
        return "fille majeur";
      case 0:
        return "(Vide)";
      default:
        return "";
    }
  };

  const filteredPensionData = useMemo(() => {
    if (!pensionData) return null;
    let filtered = pensionData;

    // Filter by wilaya code if selected
    if (selectedWilaya) {
      filtered = filtered.filter(
        (pension) => pension.ag === selectedWilaya.code
      );
    }

    // Filter by selected categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(
        (pension) => selectedCategories.includes(pension.etatpens) // Changed from cat_risque
      );
    }

    // Filter by selected avantages
    if (selectedAvantages.length > 0) {
      if (selectedAvantages.includes("Sélectionner tout")) {
        filtered = filtered.filter((pension) => {
          const label = getAvantageLabel(pension.avt);
          return avantageOptions
            .filter((opt) => opt !== "(Vide)")
            .includes(label);
        });
      } else if (selectedAvantages.includes("(Vide)")) {
        filtered = filtered.filter((pension) => {
          const label = getAvantageLabel(pension.avt);
          return selectedAvantages.includes(label) || label === "";
        });
      } else {
        filtered = filtered.filter((pension) =>
          selectedAvantages.includes(getAvantageLabel(pension.avt))
        );
      }
    }

    return filtered;
  }, [pensionData, selectedWilaya, selectedCategories, selectedAvantages]);

  const handleLogout = () => {
    logout();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return "-";
    }
    const doubleAmount = parseFloat(amount.toFixed(2));
    return new Intl.NumberFormat("fr-DZ", {
      style: "currency",
      currency: "DZD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(doubleAmount);
  };

  const handlePageChange = (newPage: number) => {
    if (
      pagination &&
      newPage >= 1 &&
      newPage <= Math.ceil(pagination.total / pagination.limit)
    ) {
      setPage(newPage, selectedWilaya?.name || undefined);
    }
  };

  const handleLimitChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = parseInt(event.target.value);
    setLimit(newLimit, selectedWilaya?.name || undefined);
    setPage(1, selectedWilaya?.name || undefined);
  };

  const handleRefresh = () => {
    refreshData(1, pagination?.limit || 10, selectedWilaya?.name || undefined);
    refreshRiskStats(
      selectedWilaya?.code.toString(),
      selectedCategories,
      selectedAvantages
    );
  };

  const data: WilayaMap = {
    Adrar: { value: 1, color: "#fff9eb" },
    Chlef: { value: 2, color: "#ebf0f9" },
    Laghouat: { value: 3, color: "#f0ebf9" },
    "Oum El Bouaghi": { value: 4, color: "#f9ebf1" },
    Batna: { value: 5, color: "#ebf9ee" },
    Béjaïa: { value: 6, color: "#f9f0eb" },
    Biskra: { value: 7, color: "#ebf9f2" },
    Béchar: { value: 8, color: "#f0fff9" },
    Blida: { value: 9, color: "#f9f4eb" },
    Bouira: { value: 10, color: "#ebf4f9" },
    Tamanrasset: { value: 11, color: "#f4ebf9" },
    Tébessa: { value: 12, color: "#f9ebeb" },
    Tlemcen: { value: 13, color: "#f9fff0" },
    Tiaret: { value: 14, color: "#e5f9eb" },
    "Tizi Ouzou": { value: 15, color: "#ebf9f7" },
    Alger: { value: 16, color: "#ebf9ee" },
    Djelfa: { value: 17, color: "#ebf9ff" },
    Jijel: { value: 18, color: "#f2f9eb" },
    Sétif: { value: 19, color: "#f9ebf5" },
    Saïda: { value: 20, color: "#f9fff9" },
    Skikda: { value: 21, color: "#ebf0f0" },
    "Sidi Bel Abbès": { value: 22, color: "#ebf9eb" },
    Annaba: { value: 23, color: "#f0ebeb" },
    Guelma: { value: 24, color: "#fff0eb" },
    Constantine: { value: 25, color: "#ebf9f4" },
    Médéa: { value: 26, color: "#ebf3f9" },
    Mostaganem: { value: 27, color: "#f0ebf0" },
    "M'Sila": { value: 28, color: "#f9ebf9" },
    Mascara: { value: 29, color: "#ebf9e5" },
    Ouargla: { value: 30, color: "#ebfff9" },
    Oran: { value: 31, color: "#ebebf9" },
    "El Bayadh": { value: 32, color: "#f9ebeb" },
    Illizi: { value: 33, color: "#f9f9eb" },
    "Bordj Bou Arréridj": { value: 34, color: "#f4f9eb" },
    Boumerdès: { value: 35, color: "#ebebf0" },
    "El Tarf": { value: 36, color: "#f9ebf2" },
    Tindouf: { value: 37, color: "#fff9eb" },
    Tissemsilt: { value: 38, color: "#ebf9e0" },
    "El Oued": { value: 39, color: "#f9ebff" },
    Khenchela: { value: 40, color: "#ebf0eb" },
    "Souk Ahras": { value: 41, color: "#ebfff0" },
    Tipaza: { value: 42, color: "#f0ebf5" },
    Mila: { value: 43, color: "#f9f9f0" },
    "Aïn Defla": { value: 44, color: "#f9f0eb" },
    Naâma: { value: 45, color: "#ebf5f9" },
    "Aïn Témouchent": { value: 46, color: "#f9ebf0" },
    Ghardaïa: { value: 47, color: "#f9f0f0" },
    Relizane: { value: 48, color: "#ebf0f9" },
    "El M\\'ghair": { value: 49, color: "#f9f9eb" },
    "El Menia": { value: 50, color: "#ebf0f0" },
    "Ouled Djellal": { value: 51, color: "#f9ebeb" },
    "Bordj Badji Mokhtar": { value: 52, color: "#f0f9eb" },
    "Béni Abbès": { value: 53, color: "#ebebeb" },
    Timimoun: { value: 54, color: "#f9f0eb" },
    Touggourt: { value: 55, color: "#f4ebf9" },
    Djanet: { value: 56, color: "#ebf9f9" },
    "In Salah": { value: 57, color: "#f9f9f9" },
    "In Guezzam": { value: 58, color: "#ebebf9" },
  };

  const sampleData = [
    { name: "MAL", value: 4000 },
    { name: "FEMEL", value: 1240 },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-2xl font-bold text-indigo-600">CNR</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Welcome, {user?.name || "User"}
              </span>
              <button
                onClick={handleRefresh}
                className="bg-indigo-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-600"
              >
                Refresh
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Map Section - Left Side */}
            <div className="lg:w-1/3 w-full">
              <div className="bg-white rounded-lg shadow p-4 sticky top-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-700">
                    Filtrer par Wilaya
                  </h3>
                  {selectedWilaya && (
                    <button
                      onClick={() => {
                        setSelectedWilaya(null);
                        setAgFilter("");
                      }}
                      className="text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      Effacer le filtre
                    </button>
                  )}
                </div>
                <div className="w-full">
                  <Map
                    color="#E5E7EB"
                    HoverColor="#93C5FD"
                    stroke="#fff"
                    hoverStroke="#3B82F6"
                    height="500px"
                    width="100%"
                    data={mapData}
                    onWilayaClick={handleRegionSelect}
                  />
                </div>
                {selectedWilaya && (
                  <div className="mt-4 text-center text-sm text-gray-600">
                    <p>Wilaya sélectionnée: {selectedWilaya.name}</p>
                    <p>Code: {selectedWilaya.code}</p>
                    <div className="mt-2 text-xs text-gray-500">
                      {filteredPensionData && (
                        <p>
                          Nombre de pensions trouvées:{" "}
                          {filteredPensionData.length}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Table Section - Right Side */}
            <div className="lg:w-2/3 w-full">
              <div className="bg-white shadow rounded-lg p-6">
                <FilterSection
                  categoryOptions={categoryOptions}
                  avantageOptions={avantageOptions}
                  selectedCategories={selectedCategories}
                  setSelectedCategories={setSelectedCategories}
                  selectedAvantages={selectedAvantages}
                  setSelectedAvantages={setSelectedAvantages}
                  handleCategoryChange={handleCategoryChange}
                  handleAvantageChange={handleAvantageChange}
                />

                {/* Risk Cluster Chart */}
                <RiskClusterDisplay data={riskLevelStats} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 w-full">
                  <div className="h-[350px]">
                    <RiskPieChart data={sampleData} />
                  </div>
                  <div className="flex flex-col space-y-2 h-[350px] justify-center items-center bg-white shadow rounded-lg p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      nombre de cas TP
                    </h3>
                    <p className="text-5xl font-extrabold text-indigo-600">
                      213K
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Pension Data
                  </h2>
                  <div className="flex items-center space-x-4">
                    {selectedWilaya && (
                      <span className="text-sm text-gray-600">
                        Filtré par: {selectedWilaya.name} (Code:{" "}
                        {selectedWilaya.code}){agFilter && ` - AG: ${agFilter}`}
                      </span>
                    )}
                    {loading && (
                      <div className="text-indigo-600">
                        <svg
                          className="animate-spin h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      </div>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-red-400"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {filteredPensionData && filteredPensionData.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Numéro Pension
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              État
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date de Naissance
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date de Jouissance
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              AG
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              AVT
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Âge App TP
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Âge Moyen Cat
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Durée Pension
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Niveau Risque
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Risque Âge
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Sexe
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Taux D
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Taux Global
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Taux RV
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Net Mensuel
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredPensionData.map((pension) => (
                            <tr key={pension.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {pension.npens}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {pension.etatpens}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatDate(pension.datenais)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatDate(pension.datjouis)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {pension.ag}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {pension.avt}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {pension.age_app_tp}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {pension.age_moyen_cat}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {pension.duree_pension}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {pension.niveau_risque_predit}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {pension.risque_age}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {pension.sexe_tp}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {pension.taux_d}%
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {pension.taux_glb}%
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {pension.taux_rv}%
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatCurrency(pension.net_mens)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {pagination && (
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-700">
                            Rows per page:
                          </span>
                          <select
                            value={pagination.limit}
                            onChange={handleLimitChange}
                            className="border rounded px-2 py-1 text-sm"
                          >
                            <option value="10">10</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                          </select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              handlePageChange(pagination.page - 1)
                            }
                            disabled={pagination.page === 1}
                            className="px-3 py-1 rounded border disabled:opacity-50"
                          >
                            Previous
                          </button>
                          <span className="text-sm text-gray-700">
                            Page {pagination.page} of{" "}
                            {Math.ceil(pagination.total / pagination.limit)}
                          </span>
                          <button
                            onClick={() =>
                              handlePageChange(pagination.page + 1)
                            }
                            disabled={
                              pagination.page >=
                              Math.ceil(pagination.total / pagination.limit)
                            }
                            className="px-3 py-1 rounded border disabled:opacity-50"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  !loading && (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No pension data available</p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
