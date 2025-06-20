import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useDashboard } from "../contexts/DashboardContext";
import { Map } from "algeria-map-ts";

import RiskClusterDisplay from "../components/RiskClusterDisplay";
import RiskPieChart from "../components/RiskPieChart";
import FilterSection from "../components/FilterSection";
import PensionTable from "../components/PensionTable";
import StatsDisplay from "../components/StatsDisplay";
import { data } from "./wilaya";

interface WilayaInfo {
  name: string;
  code: number;
}

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
  const [manualWilayaCode, setManualWilayaCode] = useState<string>("");
  const [selectedWilayaName, setSelectedWilayaName] = useState<string | null>(
    null
  );
  const [selectedTypeTP, setSelectedTypeTP] = useState<string | null>(null);

  const handleRegionSelect = (wilaya: string) => {
    // Find the wilaya code from the data object
    const wilayaData = data[wilaya as keyof typeof data];
    const wilayaCode = wilayaData?.value;

    if (selectedWilaya?.name === wilaya) {
      // If clicking the same wilaya, clear the selection
      setSelectedWilaya(null);
      setAgFilter("");
      setSelectedWilayaName(null); // Clear selected wilaya name as well
      refreshData(); // Fetch all data
      refreshRiskStats(undefined, selectedCategories, selectedAvantages);
    } else {
      // If selecting a new wilaya
      setSelectedWilaya({ name: wilaya, code: wilayaCode || 0 });
      setSelectedWilayaName(wilaya); // Set selected wilaya name from map
      refreshData(wilayaCode?.toString()); // Pass the wilaya code to filter data
      refreshRiskStats(
        wilayaCode?.toString(),
        selectedCategories,
        selectedAvantages
      );
    }
  };

  const handleWilayaNameChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const name = event.target.value;
    setSelectedWilayaName(name === "" ? null : name);
    if (name === "") {
      setSelectedWilaya(null);
      setManualWilayaCode("");
      refreshData();
      refreshRiskStats(undefined, selectedCategories, selectedAvantages);
    } else {
      const wilayaData = data[name as keyof typeof data];
      const wilayaCode = wilayaData?.value;
      setSelectedWilaya({ name: name, code: wilayaCode || 0 });
      refreshData(wilayaCode?.toString());
      refreshRiskStats(
        wilayaCode?.toString(),
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
    "direct",
    "fille majeur",
    "Veuves",
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
          newSelected = [];
        } else {
          newSelected = allSelectableAvantages;
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

  const getAvantageLabel = (avtCode: string | number): string => {
    const code = typeof avtCode === "number" ? avtCode.toString() : avtCode;

    if (["1", "7", "W", "Z", "4", "9", "G", "5"].includes(code)) {
      return "direct";
    }
    if (["3", "2", "F", "E", "8", "J"].includes(code)) {
      return "Veuves";
    }
    if (["H", "D", "Y"].includes(code)) {
      return "fille majeur";
    }
    if (code === "0") {
      return "(Vide)";
    }
    return "";
  };

  const typeTPOptions = ["décès", "Âge Moyen Cat", "fin de droit"];

  const getCategoryByAgeMoyenCat = (ageMoyenCat: number): string => {
    if (ageMoyenCat == 79 || ageMoyenCat == 77) return "décès";
    if (ageMoyenCat == 33 || ageMoyenCat == 48) return "fin droit";
    if (
      ageMoyenCat == 64 ||
      ageMoyenCat == 68 ||
      ageMoyenCat == 72 ||
      ageMoyenCat == 74 ||
      ageMoyenCat == 75
    )
      return "révision";
    return "";
  };

  const filteredPensionData = useMemo(() => {
    if (!pensionData) return null;
    let filtered = pensionData;

    console.log("Filtering pension data...", pensionData);

    // Filtre par wilaya (si sélectionnée)
    if (selectedWilaya) {
      filtered = filtered.filter(
        (pension) => pension.ag === selectedWilaya.code
      );
    }

    // Filtre par catégorie (basé sur age_moyen_cat)
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((pension) =>
        selectedCategories.includes(
          getCategoryByAgeMoyenCat(Number(pension.age_moyen_cat))
        )
      );
    }

    // Filtre par avantage
    if (selectedAvantages.length > 0) {
      filtered = filtered.filter((pension) => {
        const label = getAvantageLabel(pension.avt);
        if (selectedAvantages.includes("Sélectionner tout")) {
          return label !== "";
        }
        if (selectedAvantages.includes("(Vide)")) {
          return selectedAvantages.includes(label) || label === "";
        }
        return selectedAvantages.includes(label);
      });
    }

    return filtered;
  }, [pensionData, selectedWilaya, selectedCategories, selectedAvantages]);

  // Calculate gender statistics based on filtered data
  const genderStats = useMemo(() => {
    if (!filteredPensionData) return [];

    const maleCount = filteredPensionData.filter(
      (p) => p.sexe_tp === "M"
    ).length;
    const femaleCount = filteredPensionData.filter(
      (p) => p.sexe_tp === "F"
    ).length;

    return [
      { name: "Homme", value: maleCount },
      { name: "Femme", value: femaleCount },
    ];
  }, [filteredPensionData]);

  const clusterStats = useMemo(() => {
    if (!filteredPensionData) return [];

    // Filtrer par catégorie si sélectionnée
    let data = filteredPensionData;
    if (selectedCategories.length > 0) {
      data = data.filter((pension) =>
        selectedCategories.includes(
          getCategoryByAgeMoyenCat(Number(pension.age_moyen_cat))
        )
      );
    }

    // Filtrer par avantage si sélectionné
    if (selectedAvantages.length > 0) {
      data = data.filter((pension) => {
        const label = getAvantageLabel(pension.avt);
        if (selectedAvantages.includes("Sélectionner tout")) {
          return label !== "";
        }
        if (selectedAvantages.includes("(Vide)")) {
          return selectedAvantages.includes(label) || label === "";
        }
        return selectedAvantages.includes(label);
      });
    }

    const counts: Record<string, number> = {};
    data.forEach((p) => {
      let label = "Inconnu";
      const riskValue = String(p.niveau_risque_predit);
      if (riskValue === "0") label = "Bas risque";
      else if (riskValue === "1") label = "Moyen risque";
      else if (riskValue === "2") label = "Haut risque";
      counts[label] = (counts[label] || 0) + 1;
    });
    const total = data.length;
    return Object.entries(counts).map(([riskLevel, count]) => ({
      riskLevel,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }));
  }, [filteredPensionData, selectedCategories, selectedAvantages]);

  const handleLogout = () => {
    logout();
  };

  const handlePageChange = (newPage: number) => {
    if (
      pagination &&
      newPage >= 1 &&
      newPage <= Math.ceil(pagination.total / pagination.limit)
    ) {
      setPage(newPage);
    }
  };

  const handleLimitChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = parseInt(event.target.value);
    setLimit(newLimit);
    setPage(1);
  };

  const handleRefresh = () => {
    // Determine the wilaya code to use for refreshing data
    let wilayaCodeToRefresh: string | undefined = undefined;
    if (selectedWilaya) {
      wilayaCodeToRefresh = selectedWilaya.code.toString();
    } else if (manualWilayaCode) {
      wilayaCodeToRefresh = manualWilayaCode;
    }

    refreshData(wilayaCodeToRefresh);
    refreshRiskStats(
      wilayaCodeToRefresh,
      selectedCategories,
      selectedAvantages
    );
  };

  const dataKeys = Object.keys(data);
  const wilayaNames = dataKeys.sort(); // Sort wilaya names alphabetically

  const typeTPCaseCount = filteredPensionData ? filteredPensionData.length : 0;
  const totalCaseCount = pensionData ? pensionData.length : 0;
  const typeTPCasePercent =
    totalCaseCount > 0 ? (typeTPCaseCount / totalCaseCount) * 100 : 0;

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
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-700">
                    Filtrer par Wilaya
                  </h3>
                  {selectedWilaya && (
                    <button
                      onClick={() => {
                        setSelectedWilaya(null);
                        setAgFilter("");
                        setSelectedWilayaName(null);
                        setManualWilayaCode("");
                      }}
                      className="text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      Effacer le filtre
                    </button>
                  )}
                </div>
                {/* Wilaya Name Dropdown */}
                <div className="mb-4">
                  <label
                    htmlFor="wilayaNameSelect"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Sélectionner Wilaya par nom:
                  </label>
                  <select
                    id="wilayaNameSelect"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={selectedWilayaName || ""}
                    onChange={handleWilayaNameChange}
                  >
                    <option value="">Toutes les Wilayas</option>
                    {wilayaNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
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

              {/* Risk Pie Chart */}
              <div className="bg-white rounded-lg shadow p-4 mt-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">
                  Distribution par Genre
                </h3>
                <div className="h-[350px]">
                  <RiskPieChart data={genderStats} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600">Homme</p>
                    <p className="text-xl font-bold text-blue-600">
                      {genderStats[0]?.value.toLocaleString() || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Femme</p>
                    <p className="text-xl font-bold text-pink-600">
                      {genderStats[1]?.value.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
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

                <div className="mb-4">
                  <label
                    htmlFor="typeTPSelect"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Filtrer par Type de TP :
                  </label>
                  <select
                    id="typeTPSelect"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={selectedTypeTP || ""}
                    onChange={(e) => setSelectedTypeTP(e.target.value || null)}
                  >
                    <option value="">Tous les types de TP</option>
                    {typeTPOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <RiskClusterDisplay data={clusterStats} />

                <StatsDisplay
                  pensionData={pensionData}
                  selectedWilaya={selectedWilaya}
                  selectedCategories={selectedCategories}
                  selectedAvantages={selectedAvantages}
                  typeTPCaseCount={typeTPCaseCount}
                />

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

                <PensionTable
                  pensionData={filteredPensionData || []}
                  pagination={pagination}
                  loading={loading}
                  error={error}
                  onPageChange={handlePageChange}
                  onLimitChange={handleLimitChange}
                />

                {/* <div className="bg-pink-500 rounded-lg shadow p-4 flex-1 text-center">
                  <div className="text-3xl font-bold text-white">
                    {typeTPCaseCount.toLocaleString()}
                  </div>
                  <div className="text-white text-sm">Cas par Type de TP</div>
                  <div className="text-white text-xs mt-1">
                    {typeTPCasePercent.toFixed(1)}% du total
                  </div>
                </div> */}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
