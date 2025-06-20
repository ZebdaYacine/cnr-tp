import React from "react";
import type { PensionData } from "../contexts/DashboardContext";

interface StatsDisplayProps {
  pensionData: PensionData[] | null;
  selectedWilaya: { name: string; code: number } | null;
  selectedCategories: string[];
  selectedAvantages: string[];
  typeTPCaseCount: number;
}

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

// const getRiskLevelLabel = (riskLevel: number): string => {
//   switch (riskLevel) {
//     case 0:
//       return "Bas risque";
//     case 1:
//       return "Moyen risque";
//     case 2:
//       return "Haut risque";
//     default:
//       return "Inconnu";
//   }
// };

const StatsDisplay: React.FC<StatsDisplayProps> = ({
  pensionData,
  selectedWilaya,
  selectedCategories,
  selectedAvantages,
  typeTPCaseCount,
}) => {
  if (!pensionData) return null;

  // Calculate statistics
  const totalCases = pensionData.length;

  // By Wilaya
  const wilayaStats = selectedWilaya
    ? pensionData.filter((p) => p.ag === selectedWilaya.code).length
    : totalCases;

  // By Avantage
  const avantageStats =
    selectedAvantages.length > 0
      ? pensionData.filter((p) => {
          const label = getAvantageLabel(p.avt);
          if (selectedAvantages.includes("Sélectionner tout")) {
            return label !== "";
          }
          return selectedAvantages.includes(label);
        }).length
      : totalCases;

  // By Risk Level
  const riskStats =
    selectedCategories.length > 0
      ? pensionData.filter((p) => selectedCategories.includes(p.etatpens))
          .length
      : totalCases;

  // Calculate percentages
  const wilayaPercentage = ((wilayaStats / totalCases) * 100).toFixed(1);
  const avantagePercentage = ((avantageStats / totalCases) * 100).toFixed(1);
  const riskPercentage = ((riskStats / totalCases) * 100).toFixed(1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Cases Card */}
      <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg p-6 transform hover:scale-105 transition-transform duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Total des cas</h3>
          <svg
            className="w-8 h-8 text-white opacity-80"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <p className="text-4xl font-bold text-white mb-2">
          {totalCases.toLocaleString()}
        </p>
        <p className="text-sm text-indigo-100">
          Total des pensions enregistrées
        </p>
      </div>

      {/* Wilaya Card */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 transform hover:scale-105 transition-transform duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            {selectedWilaya ? `Cas ${selectedWilaya.name}` : "Tous les wilayas"}
          </h3>
          <svg
            className="w-8 h-8 text-white opacity-80"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
        <p className="text-4xl font-bold text-white mb-2">
          {wilayaStats.toLocaleString()}
        </p>
        <div className="flex items-center text-sm text-blue-100">
          <span>{wilayaPercentage}% du total</span>
          <div className="ml-2 w-24 bg-blue-200 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full"
              style={{ width: `${wilayaPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Avantage Card */}
      <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 transform hover:scale-105 transition-transform duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            {selectedAvantages.length > 0
              ? "Cas par avantage"
              : "Tous les avantages"}
          </h3>
          <svg
            className="w-8 h-8 text-white opacity-80"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        </div>
        <p className="text-4xl font-bold text-white mb-2">
          {avantageStats.toLocaleString()}
        </p>
        <div className="flex items-center text-sm text-purple-100">
          <span>{avantagePercentage}% du total</span>
          <div className="ml-2 w-24 bg-purple-200 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full"
              style={{ width: `${avantagePercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Type TP Case Count Card */}
      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 transform hover:scale-105 transition-transform duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            Cas par Type de TP
          </h3>
          <svg
            className="w-8 h-8 text-white opacity-80"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        </div>
        <p className="text-4xl font-bold text-white mb-2">
          {typeTPCaseCount.toLocaleString()}
        </p>
        <p className="text-sm text-green-100">Total des cas par type de TP</p>
      </div>
    </div>
  );
};

export default StatsDisplay;
