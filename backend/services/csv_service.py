from __future__ import annotations

import json
import os
import uuid
from pathlib import Path

import pandas as pd
from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from models.db_models import Dataset
from utils.column_detector import detect_all_columns


UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "./uploads"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# In-memory cache for quick dataframe access during a session
_dataframe_cache: dict[int, pd.DataFrame] = {}


def get_dataframe(dataset_id: int, db: Session) -> pd.DataFrame:
    if dataset_id in _dataframe_cache:
        return _dataframe_cache[dataset_id]

    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    if not Path(dataset.file_path).exists():
        raise HTTPException(status_code=404, detail="Dataset file not found on disk")

    df = pd.read_csv(dataset.file_path)
    _dataframe_cache[dataset_id] = df
    return df


def clear_cache(dataset_id: int | None = None) -> None:
    if dataset_id is not None:
        _dataframe_cache.pop(dataset_id, None)
    else:
        _dataframe_cache.clear()


async def save_upload(file: UploadFile, db: Session) -> Dataset:
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    unique_name = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = UPLOAD_DIR / unique_name

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    file_path.write_bytes(content)

    try:
        df = pd.read_csv(file_path)
    except Exception as exc:
        file_path.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {exc}") from exc

    if df.empty:
        file_path.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail="CSV file contains no data")

    column_types = detect_all_columns(df)

    dataset = Dataset(
        filename=unique_name,
        original_filename=file.filename,
        file_path=str(file_path),
        row_count=len(df),
        column_count=len(df.columns),
        column_types=json.dumps(column_types),
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)

    _dataframe_cache[dataset.id] = df
    return dataset
