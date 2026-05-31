from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database.connection import get_db
from models.schemas import ColumnsResponse, StatsResponse, VisualRequest, VisualResponse
from services.analytics_service import compute_stats, get_column_info
from services.csv_service import get_dataframe
from services.visualization_service import generate_visualization

router = APIRouter(prefix="/api", tags=["analytics"])


@router.get("/columns", response_model=ColumnsResponse)
def get_columns(
    dataset_id: int = Query(...),
    db: Session = Depends(get_db),
):
    df = get_dataframe(dataset_id, db)
    columns = get_column_info(df)
    return ColumnsResponse(dataset_id=dataset_id, columns=columns)


@router.get("/stats", response_model=StatsResponse)
def get_stats(
    dataset_id: int = Query(...),
    db: Session = Depends(get_db),
):
    df = get_dataframe(dataset_id, db)
    stats = compute_stats(df)
    return StatsResponse(dataset_id=dataset_id, **stats)


@router.get("/visuals", response_model=VisualResponse)
def get_visuals(
    dataset_id: int = Query(...),
    chart_type: str = Query("bar"),
    column: Optional[str] = Query(None),
    x_column: Optional[str] = Query(None),
    y_column: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    df = get_dataframe(dataset_id, db)
    try:
        result = generate_visualization(df, chart_type, column, x_column, y_column)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return VisualResponse(**result)


@router.post("/visuals", response_model=VisualResponse)
def post_visuals(
    body: VisualRequest,
    dataset_id: int = Query(...),
    db: Session = Depends(get_db),
):
    df = get_dataframe(dataset_id, db)
    try:
        result = generate_visualization(
            df, body.chart_type, body.column, body.x_column, body.y_column
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return VisualResponse(**result)
