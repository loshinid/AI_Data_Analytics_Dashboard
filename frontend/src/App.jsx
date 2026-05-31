import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import { DatasetProvider } from "./context/DatasetContext";
import Analytics from "./pages/Analytics";
import MLPredictions from "./pages/MLPredictions";
import NLPInsights from "./pages/NLPInsights";
import Upload from "./pages/Upload";
import Visualizations from "./pages/Visualizations";

export default function App() {
  return (
    <DatasetProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Upload />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/visualizations" element={<Visualizations />} />
            <Route path="/ml" element={<MLPredictions />} />
            <Route path="/nlp" element={<NLPInsights />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DatasetProvider>
  );
}
