import { NavLink } from "react-router-dom";
import { useDataset } from "../context/DatasetContext";

const navItems = [
  { path: "/", label: "Upload", icon: "📤" },
  { path: "/analytics", label: "Analytics", icon: "📊" },
  { path: "/visualizations", label: "Visualizations", icon: "📈" },
  { path: "/ml", label: "ML Predictions", icon: "🤖" },
  { path: "/nlp", label: "NLP Insights", icon: "💬" },
];

export default function Sidebar() {
  const { dataset } = useDataset();

  return (
    <aside className="flex w-64 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-6 py-5">
        <h1 className="text-lg font-bold text-primary-700">AI Analytics</h1>
        <p className="text-xs text-slate-500">Data Dashboard</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-primary-50 text-primary-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`
            }
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {dataset && (
        <div className="border-t border-slate-200 px-4 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Active Dataset
          </p>
          <p className="mt-1 truncate text-sm font-medium text-slate-700">
            {dataset.filename}
          </p>
          <p className="text-xs text-slate-500">
            {dataset.row_count} rows · {dataset.column_count} cols
          </p>
        </div>
      )}
    </aside>
  );
}
