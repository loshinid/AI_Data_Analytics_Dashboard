import { createContext, useContext, useState } from "react";

const DatasetContext = createContext(null);

export function DatasetProvider({ children }) {
  const [dataset, setDataset] = useState(() => {
    const saved = localStorage.getItem("activeDataset");
    return saved ? JSON.parse(saved) : null;
  });

  const updateDataset = (data) => {
    setDataset(data);
    if (data) {
      localStorage.setItem("activeDataset", JSON.stringify(data));
    } else {
      localStorage.removeItem("activeDataset");
    }
  };

  return (
    <DatasetContext.Provider value={{ dataset, setDataset: updateDataset }}>
      {children}
    </DatasetContext.Provider>
  );
}

export function useDataset() {
  const ctx = useContext(DatasetContext);
  if (!ctx) throw new Error("useDataset must be used within DatasetProvider");
  return ctx;
}
