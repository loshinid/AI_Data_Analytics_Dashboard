import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getColumns, getStats } from "../services/api";
import { useDataset } from "../context/DatasetContext";
import ErrorAlert from "../components/ErrorAlert";
import LoadingSpinner from "../components/LoadingSpinner";

const categoryColors = {
  numeric: "bg-blue-100 text-blue-700",
  categorical: "bg-purple-100 text-purple-700",
  text: "bg-green-100 text-green-700",
  datetime: "bg-amber-100 text-amber-700",
};

export default function Analytics() {
  const { dataset } = useDataset();
  const [columns, setColumns] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!dataset) return;
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const [cols, st] = await Promise.all([
          getColumns(dataset.dataset_id),
          getStats(dataset.dataset_id),
        ]);
        setColumns(cols.columns);
        setStats(st);
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dataset]);

  if (!dataset) {
    return (
      <div className="card text-center">
        <p className="text-slate-500">No dataset loaded.</p>
        <Link to="/" className="btn-primary mt-4 inline-block">
          Upload a CSV
        </Link>
      </div>
    );
  }

  if (loading) return <LoadingSpinner message="Analyzing dataset..." />;

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Data Analytics</h2>
        <p className="mt-1 text-slate-500">
          Summary statistics, missing values, and column insights for{" "}
          <span className="font-medium">{dataset.filename}</span>
        </p>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError("")} />

      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Rows", value: stats.row_count },
            { label: "Columns", value: stats.column_count },
            {
              label: "Missing Values",
              value: Object.values(stats.missing_values).reduce((a, b) => a + b, 0),
            },
            {
              label: "Numeric Columns",
              value: Object.keys(stats.summary_statistics).length,
            },
          ].map((item) => (
            <div key={item.label} className="card text-center">
              <p className="text-2xl font-bold text-primary-600">{item.value}</p>
              <p className="text-xs text-slate-500">{item.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="card mb-6">
        <h3 className="mb-4 font-semibold text-slate-800">Column Overview</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="pb-3 pr-4">Column</th>
                <th className="pb-3 pr-4">Type</th>
                <th className="pb-3 pr-4">Category</th>
                <th className="pb-3 pr-4">Nulls</th>
                <th className="pb-3 pr-4">Unique</th>
                <th className="pb-3">Sample</th>
              </tr>
            </thead>
            <tbody>
              {columns.map((col) => (
                <tr key={col.name} className="border-b border-slate-100">
                  <td className="py-3 pr-4 font-medium">{col.name}</td>
                  <td className="py-3 pr-4 text-slate-500">{col.dtype}</td>
                  <td className="py-3 pr-4">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoryColors[col.category] || "bg-slate-100 text-slate-600"}`}>
                      {col.category}
                    </span>
                  </td>
                  <td className="py-3 pr-4">{col.null_count}</td>
                  <td className="py-3 pr-4">{col.unique_count}</td>
                  <td className="py-3 max-w-xs truncate text-slate-500">
                    {col.sample_values?.slice(0, 3).join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {stats?.summary_statistics && Object.keys(stats.summary_statistics).length > 0 && (
        <div className="card mb-6">
          <h3 className="mb-4 font-semibold text-slate-800">Numeric Summary Statistics</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="pb-3 pr-4">Column</th>
                  <th className="pb-3 pr-4">Mean</th>
                  <th className="pb-3 pr-4">Median</th>
                  <th className="pb-3 pr-4">Std</th>
                  <th className="pb-3 pr-4">Min</th>
                  <th className="pb-3">Max</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats.summary_statistics).map(([col, s]) => (
                  <tr key={col} className="border-b border-slate-100">
                    <td className="py-3 pr-4 font-medium">{col}</td>
                    <td className="py-3 pr-4">{s.mean?.toFixed(2)}</td>
                    <td className="py-3 pr-4">{s.median?.toFixed(2)}</td>
                    <td className="py-3 pr-4">{s.std?.toFixed(2)}</td>
                    <td className="py-3 pr-4">{s.min?.toFixed(2)}</td>
                    <td className="py-3">{s.max?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {stats?.missing_values && (
        <div className="card">
          <h3 className="mb-4 font-semibold text-slate-800">Missing Values</h3>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {Object.entries(stats.missing_values).map(([col, count]) => (
              <div
                key={col}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                  count > 0 ? "bg-amber-50 text-amber-800" : "bg-green-50 text-green-700"
                }`}
              >
                <span>{col}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
