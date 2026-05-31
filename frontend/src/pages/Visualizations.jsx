import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ChartRenderer from "../components/ChartRenderer";
import ErrorAlert from "../components/ErrorAlert";
import LoadingSpinner from "../components/LoadingSpinner";
import { useDataset } from "../context/DatasetContext";
import { getColumns, getVisuals } from "../services/api";

const CHART_TYPES = [
  { value: "bar", label: "Bar Chart" },
  { value: "pie", label: "Pie Chart" },
  { value: "line", label: "Line Chart" },
  { value: "histogram", label: "Histogram" },
  { value: "correlation", label: "Correlation Heatmap" },
];

export default function Visualizations() {
  const { dataset } = useDataset();
  const [columns, setColumns] = useState([]);
  const [chartType, setChartType] = useState("bar");
  const [selectedColumn, setSelectedColumn] = useState("");
  const [yColumn, setYColumn] = useState("");
  const [visual, setVisual] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!dataset) return;
    getColumns(dataset.dataset_id)
      .then((data) => {
        setColumns(data.columns);
        if (data.columns.length > 0) setSelectedColumn(data.columns[0].name);
      })
      .catch(() => setError("Failed to load columns"));
  }, [dataset]);

  const loadChart = async () => {
    if (!dataset) return;
    setLoading(true);
    setError("");
    try {
      const params = { chart_type: chartType };
      if (chartType === "correlation") {
        /* no column needed */
      } else if (chartType === "line" && yColumn) {
        params.x_column = selectedColumn;
        params.y_column = yColumn;
      } else {
        params.column = selectedColumn;
      }
      const data = await getVisuals(dataset.dataset_id, params);
      setVisual(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to generate chart");
      setVisual(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dataset && selectedColumn && chartType !== "correlation") {
      loadChart();
    } else if (dataset && chartType === "correlation") {
      loadChart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataset, chartType, selectedColumn, yColumn]);

  if (!dataset) {
    return (
      <div className="card text-center">
        <p className="text-slate-500">No dataset loaded.</p>
        <Link to="/" className="btn-primary mt-4 inline-block">Upload a CSV</Link>
      </div>
    );
  }

  const numericCols = columns.filter((c) => c.category === "numeric");

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Visualizations</h2>
        <p className="mt-1 text-slate-500">Interactive charts powered by Recharts</p>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError("")} />

      <div className="card mb-6">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Chart Type</label>
            <select
              className="select-field"
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
            >
              {CHART_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {chartType !== "correlation" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Column</label>
              <select
                className="select-field"
                value={selectedColumn}
                onChange={(e) => setSelectedColumn(e.target.value)}
              >
                {columns.map((c) => (
                  <option key={c.name} value={c.name}>{c.name} ({c.category})</option>
                ))}
              </select>
            </div>
          )}

          {chartType === "line" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Y Column (optional)</label>
              <select
                className="select-field"
                value={yColumn}
                onChange={(e) => setYColumn(e.target.value)}
              >
                <option value="">Auto</option>
                {numericCols.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-end">
            <button className="btn-primary w-full" onClick={loadChart} disabled={loading}>
              Refresh Chart
            </button>
          </div>
        </div>
      </div>

      <div className="card min-h-[420px]">
        {loading ? (
          <LoadingSpinner message="Generating chart..." />
        ) : (
          <ChartRenderer visual={visual} />
        )}
      </div>
    </div>
  );
}
