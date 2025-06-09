import React from "react";

interface FilterSectionProps {
  categoryOptions: string[];
  avantageOptions: string[];
  selectedCategories: string[];
  setSelectedCategories: React.Dispatch<React.SetStateAction<string[]>>;
  selectedAvantages: string[];
  setSelectedAvantages: React.Dispatch<React.SetStateAction<string[]>>;
  handleCategoryChange: (category: string) => void;
  handleAvantageChange: (avantage: string) => void;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  categoryOptions,
  avantageOptions,
  selectedCategories,
  selectedAvantages,
  handleCategoryChange,
  handleAvantageChange,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 w-full">
      <div className="flex flex-col space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">
          Catégorie de risque
        </h2>
        {categoryOptions.map((category) => (
          <label key={category} className="inline-flex items-center">
            <input
              type="checkbox"
              className="form-checkbox h-5 w-5 text-indigo-600"
              checked={selectedCategories.includes(category)}
              onChange={() => handleCategoryChange(category)}
            />
            <span className="ml-2 text-gray-700">{category}</span>
          </label>
        ))}
      </div>
      <div className="flex flex-col space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Avantage</h2>
        {avantageOptions.map((avantage) => (
          <label key={avantage} className="inline-flex items-center">
            <input
              type="checkbox"
              className="form-checkbox h-5 w-5 text-indigo-600"
              checked={selectedAvantages.includes(avantage)}
              onChange={() => handleAvantageChange(avantage)}
            />
            <span className="ml-2 text-gray-700">{avantage}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default FilterSection;
