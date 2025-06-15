import React from "react";
import { type RiskLevelStats } from "../contexts/DashboardContext";

interface RiskClusterDisplayProps {
  data: RiskLevelStats[] | null;
}

const RiskClusterDisplay: React.FC<RiskClusterDisplayProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No risk level data available.
      </div>
    );
  }

  const riskColors: { [key: string]: string } = {
    "Bas risque": "bg-green-500",
    "Haut risque": "bg-red-500",
    "Moyen risque": "bg-yellow-500",
  };

  // Sort the data to ensure Moyen risque is second
  const sortedData = [...data].sort((a, b) => {
    const order = {
      "Bas risque": 1,
      "Moyen risque": 2,
      "Haut risque": 3,
    };
    return (
      order[a.riskLevel as keyof typeof order] -
      order[b.riskLevel as keyof typeof order]
    );
  });

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Nombre de cas TP par cluster
      </h2>
      <div className="space-y-4">
        {sortedData.map((item) => (
          <div key={item.riskLevel} className="flex items-center space-x-4">
            <div className="w-32 text-right text-gray-700 font-medium">
              {item.riskLevel}
            </div>
            <div className="flex-grow bg-gray-200 rounded-full h-8 flex items-center justify-end overflow-hidden">
              <div
                className={`${
                  riskColors[item.riskLevel]
                } h-full rounded-full flex items-center justify-center text-white font-bold text-sm pr-2`}
                style={{ width: `${item.percentage}%` }}
              >
                {item.percentage.toFixed(0)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RiskClusterDisplay;
