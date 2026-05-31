import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadCSV } from "../services/api";
import { useDataset } from "../context/DatasetContext";
import ErrorAlert from "../components/ErrorAlert";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const { setDataset } = useDataset();
  const navigate = useNavigate();

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a CSV file");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await uploadCSV(file);
      setDataset(result);
      navigate("/analytics");
    } catch (err) {
      setError(err.response?.data?.detail || "Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.name.endsWith(".csv")) {
      setFile(dropped);
      setError("");
    } else {
      setError("Only CSV files are supported");
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Upload Dataset</h2>
        <p className="mt-1 text-slate-500">
          Upload a CSV file to begin analysis, visualization, ML, and NLP insights.
        </p>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError("")} />

      <div className="card max-w-2xl">
        <div
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-8 py-16 transition ${
            dragOver ? "border-primary-400 bg-primary-50" : "border-slate-300 bg-slate-50"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <div className="text-4xl">📁</div>
          <p className="mt-4 text-sm font-medium text-slate-700">
            Drag & drop your CSV here
          </p>
          <p className="mt-1 text-xs text-slate-500">or click to browse</p>
          <input
            type="file"
            accept=".csv"
            className="mt-4 text-sm"
            onChange={(e) => {
              setFile(e.target.files[0]);
              setError("");
            }}
          />
          {file && (
            <p className="mt-3 text-sm text-primary-600">
              Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <button className="btn-primary" onClick={handleUpload} disabled={loading || !file}>
            {loading ? "Uploading..." : "Upload & Analyze"}
          </button>
        </div>
      </div>

      {loading && <LoadingSpinner message="Processing your dataset..." />}

      <div className="card mt-8 max-w-2xl">
        <h3 className="font-semibold text-slate-800">Sample Dataset</h3>
        <p className="mt-2 text-sm text-slate-500">
          Use the included sample CSV at{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">sample_data/sample.csv</code>{" "}
          with employee data including numeric, categorical, and text columns.
        </p>
      </div>
    </div>
  );
}
