import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

export const uploadCSV = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post("/api/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const getColumns = async (datasetId) => {
  const { data } = await api.get("/api/columns", { params: { dataset_id: datasetId } });
  return data;
};

export const getStats = async (datasetId) => {
  const { data } = await api.get("/api/stats", { params: { dataset_id: datasetId } });
  return data;
};

export const getVisuals = async (datasetId, params) => {
  const { data } = await api.get("/api/visuals", {
    params: { dataset_id: datasetId, ...params },
  });
  return data;
};

export const trainModel = async (datasetId, payload) => {
  const { data } = await api.post("/api/train", payload, {
    params: { dataset_id: datasetId },
  });
  return data;
};

export const listModels = async (datasetId) => {
  const { data } = await api.get("/api/models", { params: { dataset_id: datasetId } });
  return data;
};

export const predict = async (payload) => {
  const { data } = await api.post("/api/predict", payload);
  return data;
};

export const suggestTarget = async (datasetId) => {
  const { data } = await api.get("/api/ml/suggest-target", {
    params: { dataset_id: datasetId },
  });
  return data;
};

export const getNlpAnalysis = async (datasetId) => {
  const { data } = await api.get("/api/nlp-analysis", { params: { dataset_id: datasetId } });
  return data;
};

export default api;
