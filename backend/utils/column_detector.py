import pandas as pd


def detect_column_category(series: pd.Series) -> str:
    if pd.api.types.is_numeric_dtype(series):
        return "numeric"
    if series.dtype == object or pd.api.types.is_string_dtype(series):
        avg_len = series.dropna().astype(str).str.len().mean() if series.notna().any() else 0
        unique_ratio = series.nunique(dropna=True) / max(len(series), 1)
        if avg_len > 20 and unique_ratio > 0.5:
            return "text"
        return "categorical"
    if pd.api.types.is_datetime64_any_dtype(series):
        return "datetime"
    return "categorical"


def detect_all_columns(df: pd.DataFrame) -> dict[str, str]:
    return {col: detect_column_category(df[col]) for col in df.columns}


def get_numeric_columns(df: pd.DataFrame) -> list[str]:
    return [col for col, cat in detect_all_columns(df).items() if cat == "numeric"]


def get_categorical_columns(df: pd.DataFrame) -> list[str]:
    return [col for col, cat in detect_all_columns(df).items() if cat == "categorical"]


def get_text_columns(df: pd.DataFrame) -> list[str]:
    return [col for col, cat in detect_all_columns(df).items() if cat == "text"]
