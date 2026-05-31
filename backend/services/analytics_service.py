from __future__ import annotations

import pandas as pd

from utils.column_detector import detect_all_columns, detect_column_category


def get_column_info(df: pd.DataFrame) -> list[dict]:
    columns = []
    for col in df.columns:
        series = df[col]
        category = detect_column_category(series)
        sample = series.dropna().head(5).tolist()
        columns.append(
            {
                "name": col,
                "dtype": str(series.dtype),
                "category": category,
                "null_count": int(series.isna().sum()),
                "unique_count": int(series.nunique(dropna=True)),
                "sample_values": sample,
            }
        )
    return columns


def compute_stats(df: pd.DataFrame) -> dict:
    column_types = detect_all_columns(df)
    missing_values = {col: int(df[col].isna().sum()) for col in df.columns}

    summary_statistics: dict[str, dict] = {}
    for col, cat in column_types.items():
        if cat == "numeric":
            series = df[col].dropna()
            if len(series) == 0:
                continue
            mode_val = series.mode()
            summary_statistics[col] = {
                "mean": float(series.mean()),
                "median": float(series.median()),
                "std": float(series.std()) if len(series) > 1 else 0.0,
                "min": float(series.min()),
                "max": float(series.max()),
                "mode": float(mode_val.iloc[0]) if len(mode_val) > 0 else None,
            }

    categorical_summary: dict[str, dict[str, int]] = {}
    for col, cat in column_types.items():
        if cat == "categorical":
            counts = df[col].value_counts(dropna=True).head(10)
            categorical_summary[col] = {str(k): int(v) for k, v in counts.items()}

    numeric_cols = [c for c, t in column_types.items() if t == "numeric"]
    correlation_matrix: dict[str, dict[str, float | None]] = {}
    if len(numeric_cols) >= 2:
        corr = df[numeric_cols].corr()
        for row_col in numeric_cols:
            correlation_matrix[row_col] = {}
            for col_col in numeric_cols:
                val = corr.loc[row_col, col_col]
                correlation_matrix[row_col][col_col] = (
                    round(float(val), 4) if pd.notna(val) else None
                )

    return {
        "row_count": len(df),
        "column_count": len(df.columns),
        "missing_values": missing_values,
        "summary_statistics": summary_statistics,
        "categorical_summary": categorical_summary,
        "correlation_matrix": correlation_matrix,
    }
