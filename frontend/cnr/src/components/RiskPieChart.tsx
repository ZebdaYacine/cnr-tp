import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface DataItem {
  name: string;
  value: number;
}

interface RiskPieChartProps {
  data: DataItem[];
}

const COLORS = ["#3B82F6", "#EC4899"]; // Blue for male, Pink for female

const RiskPieChart: React.FC<RiskPieChartProps> = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (!data || data.length === 0 || total === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Aucune donnée de genre disponible.
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / total) * 100).toFixed(1);
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm">
            {data.value.toLocaleString()} ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={5}
          dataKey="value"
          isAnimationActive={true}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value, entry: any) => (
            <span className="text-sm font-medium text-gray-700">
              {value} ({((entry.payload.value / total) * 100).toFixed(1)}%)
            </span>
          )}
        />
        {/* Center Text for Total Cases */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-2xl font-bold text-gray-800"
        >
          {total.toLocaleString()}
        </text>
      </PieChart>
    </ResponsiveContainer>
  );
};

export default RiskPieChart;
