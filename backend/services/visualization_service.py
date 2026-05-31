from __future__ import annotations

from typing import Any

import pandas as pd

from utils.column_detector import detect_all_columns


def generate_visualization(
    df: pd.DataFrame,
    chart_type: str,
    column: str | None = None,
    x_column: str | None = None,
    y_column: str | None = None,
) -> dict[str, Any]:
    column_types = detect_all_columns(df)
    chart_type = chart_type.lower()

    if chart_type == "correlation":
        return _correlation_heatmap(df, column_types)

    if not column and not x_column:
        raise ValueError("Column is required for this chart type")

    target_col = column or x_column
    assert target_col is not None
    cat = column_types.get(target_col, "categorical")

    if chart_type == "bar":
        return _bar_chart(df, target_col, cat)
    if chart_type == "pie":
        return _pie_chart(df, target_col, cat)
    if chart_type == "line":
        return _line_chart(df, x_column or target_col, y_column, column_types)
    if chart_type == "histogram":
        return _histogram(df, target_col, cat)

    raise ValueError(f"Unsupported chart type: {chart_type}")


def _bar_chart(df: pd.DataFrame, column: str, category: str) -> dict:
    if category == "numeric":
        counts = pd.cut(df[column].dropna(), bins=10).value_counts().sort_index()
        data = [{"label": str(k), "value": int(v)} for k, v in counts.items()]
    else:
        counts = df[column].value_counts(dropna=True).head(15)
        data = [{"label": str(k), "value": int(v)} for k, v in counts.items()]

    return {
        "chart_type": "bar",
        "title": f"Distribution of {column}",
        "data": data,
        "x_key": "label",
        "y_key": "value",
    }


def _pie_chart(df: pd.DataFrame, column: str, category: str) -> dict:
    if category == "numeric":
        counts = pd.cut(df[column].dropna(), bins=6).value_counts()
    else:
        counts = df[column].value_counts(dropna=True).head(8)

    data = [{"name": str(k), "value": int(v)} for k, v in counts.items()]
    return {
        "chart_type": "pie",
        "title": f"Composition of {column}",
        "data": data,
        "x_key": "name",
        "value_key": "value",
    }


def _line_chart(
    df: pd.DataFrame,
    x_col: str,
    y_col: str | None,
    column_types: dict[str, str],
) -> dict:
    if y_col and y_col in df.columns:
        plot_df = df[[x_col, y_col]].dropna().head(100)
        data = [{"x": row[x_col], "y": row[y_col]} for _, row in plot_df.iterrows()]
        return {
            "chart_type": "line",
            "title": f"{y_col} vs {x_col}",
            "data": data,
            "x_key": "x",
            "y_key": "y",
        }

    if column_types.get(x_col) == "numeric":
        series = df[x_col].dropna().reset_index(drop=True).head(100)
        data = [{"x": i, "y": float(v)} for i, v in enumerate(series)]
        return {
            "chart_type": "line",
            "title": f"Trend of {x_col}",
            "data": data,
            "x_key": "x",
            "y_key": "y",
        }

    counts = df[x_col].value_counts(dropna=True).head(20)
    data = [{"x": str(k), "y": int(v)} for k, v in counts.items()]
    return {
        "chart_type": "line",
        "title": f"Trend of {x_col}",
        "data": data,
        "x_key": "x",
        "y_key": "y",
    }


def _histogram(df: pd.DataFrame, column: str, category: str) -> dict:
    if category != "numeric":
        raise ValueError("Histogram requires a numeric column")

    counts = pd.cut(df[column].dropna(), bins=12).value_counts().sort_index()
    data = [{"bin": str(k), "count": int(v)} for k, v in counts.items()]
    return {
        "chart_type": "bar",
        "title": f"Histogram of {column}",
        "data": data,
        "x_key": "bin",
        "y_key": "count",
    }


def _correlation_heatmap(df: pd.DataFrame, column_types: dict[str, str]) -> dict:
    numeric_cols = [c for c, t in column_types.items() if t == "numeric"]
    if len(numeric_cols) < 2:
        raise ValueError("Need at least 2 numeric columns for correlation heatmap")

    corr = df[numeric_cols].corr()
    data = []
    for row_col in numeric_cols:
        for col_col in numeric_cols:
            val = corr.loc[row_col, col_col]
            data.append(
                {
                    "x": col_col,
                    "y": row_col,
                    "value": round(float(val), 4) if pd.notna(val) else 0,
                }
            )

    return {
        "chart_type": "heatmap",
        "title": "Correlation Heatmap",
        "data": data,
        "x_key": "x",
        "y_key": "y",
        "value_key": "value",
    }
