import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ErrorAlert from "../components/ErrorAlert";
import LoadingSpinner from "../components/LoadingSpinner";
import { useDataset } from "../context/DatasetContext";
import { getColumns, listModels, predict, suggestTarget, trainModel } from "../services/api";

export default function MLPredictions() {
  const { dataset } = useDataset();
  const [columns, setColumns] = useState([]);
  const [targetColumn, setTargetColumn] = useState("");
  const [modelType, setModelType] = useState("random_forest");
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [features, setFeatures] = useState({});
  const [prediction, setPrediction] = useState(null);
  const [training, setTraining] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!dataset) return;
    Promise.all([
      getColumns(dataset.dataset_id),
      listModels(dataset.dataset_id),
      suggestTarget(dataset.dataset_id),
    ])
      .then(([cols, mods, suggested]) => {
        setColumns(cols.columns);
        setModels(mods);
        if (suggested.suggested_target) setTargetColumn(suggested.suggested_target);
        else if (cols.columns.length) setTargetColumn(cols.columns[cols.columns.length - 1].name);
      })
      .catch(() => setError("Failed to load ML data"));
  }, [dataset]);

  const featureColumns = columns.filter((c) => c.name !== targetColumn);

  const handleTrain = async () => {
    if (!dataset || !targetColumn) return;
    setTraining(true);
    setError("");
    setSuccess("");
    try {
      const result = await trainModel(dataset.dataset_id, {
        target_column: targetColumn,
        model_type: modelType,
      });
      setSuccess(
        `Model trained! ${result.metric_name.toUpperCase()}: ${(result.metric_value * (result.metric_name === "accuracy" ? 100 : 1)).toFixed(result.metric_name === "accuracy" ? 1 : 4)}${result.metric_name === "accuracy" ? "%" : ""}`
      );
      const mods = await listModels(dataset.dataset_id);
      setModels(mods);
      setSelectedModel(result);
      setFeatures(
        Object.fromEntries(result.feature_columns.map((f) => [f, ""]))
      );
    } catch (err) {
      setError(err.response?.data?.detail || "Training failed");
    } finally {
      setTraining(false);
    }
  };

  const handlePredict = async () => {
    if (!selectedModel) return;
    setPredicting(true);
    setError("");
    try {
      const modelId = selectedModel.model_id || selectedModel.id;
      const parsedFeatures = {};
      for (const [key, val] of Object.entries(features)) {
        const col = columns.find((c) => c.name === key);
        parsedFeatures[key] = col?.category === "numeric" ? parseFloat(val) || 0 : val;
      }
      const result = await predict({ model_id: modelId, features: parsedFeatures });
      setPrediction(result);
    } catch (err) {
      setError(err.response?.data?.detail || "Prediction failed");
    } finally {
      setPredicting(false);
    }
  };

  const selectModel = (model) => {
    setSelectedModel(model);
    setFeatures(Object.fromEntries(model.feature_columns.map((f) => [f, ""])));
    setPrediction(null);
  };

  if (!dataset) {
    return (
      <div className="card text-center">
        <p className="text-slate-500">No dataset loaded.</p>
        <Link to="/" className="btn-primary mt-4 inline-block">Upload a CSV</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">ML Predictions</h2>
        <p className="mt-1 text-slate-500">
          Auto ML pipeline with Linear Regression / Random Forest for classification & regression
        </p>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError("")} />
      {success && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {success}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-4 font-semibold text-slate-800">Train Model</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Target Column</label>
              <select
                className="select-field"
                value={targetColumn}
                onChange={(e) => setTargetColumn(e.target.value)}
              >
                {columns.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.category})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Model Type</label>
              <select
                className="select-field"
                value={modelType}
                onChange={(e) => setModelType(e.target.value)}
              >
                <option value="random_forest">Random Forest</option>
                <option value="linear">Linear / Logistic Regression</option>
              </select>
            </div>
            <button className="btn-primary w-full" onClick={handleTrain} disabled={training}>
              {training ? "Training..." : "Train Model"}
            </button>
          </div>
          {training && <LoadingSpinner message="Training model..." />}
        </div>

        <div className="card">
          <h3 className="mb-4 font-semibold text-slate-800">Trained Models</h3>
          {models.length === 0 ? (
            <p className="text-sm text-slate-500">No models trained yet.</p>
          ) : (
            <div className="space-y-2">
              {models.map((m) => (
                <button
                  key={m.model_id}
                  onClick={() => selectModel(m)}
                  className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition ${
                    selectedModel?.model_id === m.model_id
                      ? "border-primary-300 bg-primary-50"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex justify-between">
                    <span className="font-medium capitalize">{m.model_type.replace("_", " ")}</span>
                    <span className="text-xs capitalize text-slate-500">{m.task_type}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Target: {m.target_column} · {m.metric_name}:{" "}
                    {m.metric_name === "accuracy"
                      ? `${(m.metric_value * 100).toFixed(1)}%`
                      : m.metric_value.toFixed(4)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedModel && (
        <div className="card mt-6">
          <h3 className="mb-4 font-semibold text-slate-800">Make Prediction</h3>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {(selectedModel.feature_columns || featureColumns.map((c) => c.name)).map((feat) => {
              const col = columns.find((c) => c.name === feat);
              return (
                <div key={feat}>
                  <label className="mb-1 block text-xs font-medium text-slate-500">{feat}</label>
                  {col?.category === "categorical" ? (
                    <select
                      className="select-field"
                      value={features[feat] || ""}
                      onChange={(e) => setFeatures({ ...features, [feat]: e.target.value })}
                    >
                      <option value="">Select...</option>
                      {(col.sample_values || []).map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="number"
                      className="input-field"
                      value={features[feat] || ""}
                      onChange={(e) => setFeatures({ ...features, [feat]: e.target.value })}
                      placeholder={`Enter ${feat}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <button
            className="btn-primary mt-4"
            onClick={handlePredict}
            disabled={predicting}
          >
            {predicting ? "Predicting..." : "Predict"}
          </button>

          {prediction && (
            <div className="mt-6 rounded-lg bg-primary-50 px-6 py-4 text-center">
              <p className="text-xs uppercase tracking-wide text-primary-500">Prediction</p>
              <p className="mt-1 text-3xl font-bold text-primary-700">
                {String(prediction.prediction)}
              </p>
              <p className="mt-1 text-xs text-primary-400 capitalize">{prediction.task_type}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
