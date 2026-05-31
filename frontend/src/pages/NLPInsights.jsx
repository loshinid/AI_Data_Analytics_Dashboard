import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ErrorAlert from "../components/ErrorAlert";
import LoadingSpinner from "../components/LoadingSpinner";
import { useDataset } from "../context/DatasetContext";
import { getNlpAnalysis } from "../services/api";

const SENTIMENT_COLORS = ["#10b981", "#94a3b8", "#ef4444"];
const WORD_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

export default function NLPInsights() {
  const { dataset } = useDataset();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeColumn, setActiveColumn] = useState("");

  useEffect(() => {
    if (!dataset) return;
    setLoading(true);
    setError("");
    getNlpAnalysis(dataset.dataset_id)
      .then((data) => {
        setAnalysis(data);
        if (data.text_columns?.length) setActiveColumn(data.text_columns[0]);
      })
      .catch((err) => setError(err.response?.data?.detail || "NLP analysis failed"))
      .finally(() => setLoading(false));
  }, [dataset]);

  if (!dataset) {
    return (
      <div className="card text-center">
        <p className="text-slate-500">No dataset loaded.</p>
        <Link to="/" className="btn-primary mt-4 inline-block">Upload a CSV</Link>
      </div>
    );
  }

  if (loading) return <LoadingSpinner message="Running NLP analysis..." />;

  const sentimentData = activeColumn && analysis?.sentiment?.[activeColumn]
    ? [
        { name: "Positive", value: analysis.sentiment[activeColumn].positive },
        { name: "Neutral", value: analysis.sentiment[activeColumn].neutral },
        { name: "Negative", value: analysis.sentiment[activeColumn].negative },
      ]
    : [];

  const wordData = activeColumn ? analysis?.word_frequency?.[activeColumn]?.slice(0, 15) || [] : [];
  const keywords = activeColumn ? analysis?.keywords?.[activeColumn] || [] : [];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">NLP Insights</h2>
        <p className="mt-1 text-slate-500">
          Sentiment analysis, word frequency, and keyword extraction via TextBlob
        </p>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError("")} />

      {!analysis?.text_columns?.length ? (
        <div className="card text-center">
          <p className="text-slate-500">
            No text columns detected in this dataset. Upload a CSV with text fields for NLP analysis.
          </p>
        </div>
      ) : (
        <>
          <div className="card mb-6">
            <label className="mb-1 block text-xs font-medium text-slate-500">Text Column</label>
            <select
              className="select-field max-w-xs"
              value={activeColumn}
              onChange={(e) => setActiveColumn(e.target.value)}
            >
              {analysis.text_columns.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>

          {analysis.sentiment[activeColumn] && (
            <div className="mb-6 grid gap-4 md:grid-cols-4">
              <div className="card text-center">
                <p className="text-2xl font-bold text-primary-600">
                  {analysis.sentiment[activeColumn].avg_polarity}
                </p>
                <p className="text-xs text-slate-500">Avg Polarity</p>
              </div>
              <div className="card text-center">
                <p className="text-2xl font-bold text-green-600">
                  {analysis.sentiment[activeColumn].positive}
                </p>
                <p className="text-xs text-slate-500">Positive</p>
              </div>
              <div className="card text-center">
                <p className="text-2xl font-bold text-slate-500">
                  {analysis.sentiment[activeColumn].neutral}
                </p>
                <p className="text-xs text-slate-500">Neutral</p>
              </div>
              <div className="card text-center">
                <p className="text-2xl font-bold text-red-500">
                  {analysis.sentiment[activeColumn].negative}
                </p>
                <p className="text-xs text-slate-500">Negative</p>
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card">
              <h3 className="mb-4 font-semibold text-slate-800">Sentiment Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sentimentData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {sentimentData.map((_, i) => (
                      <Cell key={i} fill={SENTIMENT_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="mb-4 font-semibold text-slate-800">Top Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {keywords.map((kw) => (
                  <span
                    key={kw}
                    className="rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-700"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="card mt-6">
            <h3 className="mb-4 font-semibold text-slate-800">Word Frequency</h3>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={wordData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="word" type="category" width={100} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {wordData.map((_, i) => (
                    <Cell key={i} fill={WORD_COLORS[i % WORD_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
