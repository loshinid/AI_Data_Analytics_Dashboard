import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

const COLORS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981",
  "#06b6d4", "#ef4444", "#6366f1", "#14b8a6", "#f97316",
];

export default function ChartRenderer({ visual }) {
  if (!visual || !visual.data?.length) {
    return <p className="text-center text-sm text-slate-500">No chart data available</p>;
  }

  const { chart_type, title, data, x_key, y_key, value_key } = visual;

  if (chart_type === "pie") {
    return (
      <div>
        <h3 className="mb-4 text-center text-sm font-semibold text-slate-700">{title}</h3>
        <ResponsiveContainer width="100%" height={360}>
          <PieChart>
            <Pie
              data={data}
              dataKey={value_key || "value"}
              nameKey={x_key}
              cx="50%"
              cy="50%"
              outerRadius={120}
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (chart_type === "line") {
    return (
      <div>
        <h3 className="mb-4 text-center text-sm font-semibold text-slate-700">{title}</h3>
        <ResponsiveContainer width="100%" height={360}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey={x_key} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey={y_key} stroke="#3b82f6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (chart_type === "heatmap") {
    return (
      <div>
        <h3 className="mb-4 text-center text-sm font-semibold text-slate-700">{title}</h3>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="category" dataKey="x" name="Column" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="y" name="Column" tick={{ fontSize: 11 }} />
            <ZAxis type="number" dataKey="value" range={[100, 800]} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              formatter={(val) => [val?.toFixed?.(3) ?? val, "Correlation"]}
            />
            <Scatter data={data} fill="#3b82f6">
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.value > 0.5
                      ? "#2563eb"
                      : entry.value < -0.5
                        ? "#ef4444"
                        : "#94a3b8"
                  }
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <p className="mt-2 text-center text-xs text-slate-500">
          Dot size and color represent correlation strength
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-4 text-center text-sm font-semibold text-slate-700">{title}</h3>
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey={x_key} tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={70} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey={y_key || "value"} fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
