from __future__ import annotations

import json
import os
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.metrics import accuracy_score, mean_squared_error
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder, OneHotEncoder, StandardScaler

from utils.column_detector import detect_column_category

MODELS_DIR = Path(os.getenv("MODELS_DIR", "./models_store"))
MODELS_DIR.mkdir(parents=True, exist_ok=True)


def _prepare_features(df: pd.DataFrame, target: str) -> tuple[pd.DataFrame, list[str], list[str]]:
    feature_cols = [c for c in df.columns if c != target]
    numeric_cols = []
    categorical_cols = []

    for col in feature_cols:
        cat = detect_column_category(df[col])
        if cat == "numeric":
            numeric_cols.append(col)
        elif cat == "categorical":
            categorical_cols.append(col)

    if not numeric_cols and not categorical_cols:
        raise ValueError("No usable feature columns found")

    return df[feature_cols], numeric_cols, categorical_cols


def _build_preprocessor(numeric_cols: list[str], categorical_cols: list[str]) -> ColumnTransformer:
    transformers = []
    if numeric_cols:
        transformers.append(("num", StandardScaler(), numeric_cols))
    if categorical_cols:
        transformers.append(
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical_cols)
        )
    return ColumnTransformer(transformers=transformers)


def train_model(
    df: pd.DataFrame,
    target_column: str,
    model_type: str = "random_forest",
) -> dict:
    if target_column not in df.columns:
        raise ValueError(f"Target column '{target_column}' not found")

    df_clean = df.dropna(subset=[target_column]).copy()
    if len(df_clean) < 10:
        raise ValueError("Need at least 10 rows with non-null target values")

    target_cat = detect_column_category(df_clean[target_column])
    task_type = "regression" if target_cat == "numeric" else "classification"

    features_df, numeric_cols, categorical_cols = _prepare_features(df_clean, target_column)
    X = features_df.copy()

    for col in numeric_cols:
        X[col] = pd.to_numeric(X[col], errors="coerce")
    X = X.fillna(X.median(numeric_only=True) if numeric_cols else 0)

    label_encoder = None
    if task_type == "classification":
        y_raw = df_clean[target_column].astype(str)
        label_encoder = LabelEncoder()
        y = label_encoder.fit_transform(y_raw)
    else:
        y = df_clean[target_column].astype(float).values

    preprocessor = _build_preprocessor(numeric_cols, categorical_cols)

    if model_type == "linear":
        estimator = (
            LinearRegression()
            if task_type == "regression"
            else LogisticRegression(max_iter=1000)
        )
    else:
        estimator = (
            RandomForestRegressor(n_estimators=100, random_state=42)
            if task_type == "regression"
            else RandomForestClassifier(n_estimators=100, random_state=42)
        )

    pipeline = Pipeline([("preprocessor", preprocessor), ("model", estimator)])

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)

    if task_type == "regression":
        metric_name = "rmse"
        metric_value = float(np.sqrt(mean_squared_error(y_test, y_pred)))
    else:
        metric_name = "accuracy"
        metric_value = float(accuracy_score(y_test, y_pred))

    model_filename = f"model_{target_column}_{model_type}.joblib"
    model_path = MODELS_DIR / model_filename

    artifact = {
        "pipeline": pipeline,
        "label_encoder": label_encoder,
        "task_type": task_type,
        "target_column": target_column,
        "feature_columns": list(features_df.columns),
        "numeric_cols": numeric_cols,
        "categorical_cols": categorical_cols,
    }
    joblib.dump(artifact, model_path)

    return {
        "model_type": model_type,
        "task_type": task_type,
        "target_column": target_column,
        "metric_name": metric_name,
        "metric_value": round(metric_value, 4),
        "model_path": str(model_path),
        "feature_columns": list(features_df.columns),
    }


def predict(model_path: str, features: dict) -> dict:
    if not Path(model_path).exists():
        raise ValueError("Model file not found")

    artifact = joblib.load(model_path)
    pipeline = artifact["pipeline"]
    feature_columns = artifact["feature_columns"]
    task_type = artifact["task_type"]
    label_encoder = artifact.get("label_encoder")

    row = {col: features.get(col) for col in feature_columns}
    X = pd.DataFrame([row])

    for col in artifact.get("numeric_cols", []):
        if col in X.columns:
            X[col] = pd.to_numeric(X[col], errors="coerce")

    prediction = pipeline.predict(X)[0]

    if task_type == "classification" and label_encoder is not None:
        try:
            prediction = label_encoder.inverse_transform([int(prediction)])[0]
        except (ValueError, TypeError):
            prediction = str(prediction)
    elif task_type == "regression":
        prediction = round(float(prediction), 4)

    return {
        "prediction": prediction,
        "task_type": task_type,
    }


def suggest_target_column(df: pd.DataFrame) -> str | None:
    for col in reversed(df.columns.tolist()):
        cat = detect_column_category(df[col])
        if cat in ("numeric", "categorical"):
            return col
    return None
