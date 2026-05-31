import json

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database.connection import get_db
from ml.pipeline import predict, suggest_target_column, train_model
from models.db_models import ModelResult
from models.schemas import PredictRequest, PredictResponse, TrainRequest, TrainResponse
from services.csv_service import get_dataframe

router = APIRouter(prefix="/api", tags=["ml"])


@router.get("/ml/suggest-target")
def suggest_target(
    dataset_id: int = Query(...),
    db: Session = Depends(get_db),
):
    df = get_dataframe(dataset_id, db)
    target = suggest_target_column(df)
    return {"suggested_target": target}


@router.post("/train", response_model=TrainResponse)
def train(
    body: TrainRequest,
    dataset_id: int = Query(...),
    db: Session = Depends(get_db),
):
    df = get_dataframe(dataset_id, db)

    if body.model_type not in ("linear", "random_forest"):
        raise HTTPException(status_code=400, detail="model_type must be 'linear' or 'random_forest'")

    try:
        result = train_model(df, body.target_column, body.model_type)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    model_record = ModelResult(
        dataset_id=dataset_id,
        model_type=result["model_type"],
        task_type=result["task_type"],
        target_column=result["target_column"],
        metric_name=result["metric_name"],
        metric_value=result["metric_value"],
        model_path=result["model_path"],
        feature_columns=json.dumps(result["feature_columns"]),
    )
    db.add(model_record)
    db.commit()
    db.refresh(model_record)

    return TrainResponse(
        model_id=model_record.id,
        task_type=result["task_type"],
        model_type=result["model_type"],
        target_column=result["target_column"],
        metric_name=result["metric_name"],
        metric_value=result["metric_value"],
        feature_columns=result["feature_columns"],
    )


@router.get("/models")
def list_models(
    dataset_id: int = Query(...),
    db: Session = Depends(get_db),
):
    models = (
        db.query(ModelResult)
        .filter(ModelResult.dataset_id == dataset_id)
        .order_by(ModelResult.created_at.desc())
        .all()
    )
    return [
        {
            "model_id": m.id,
            "model_type": m.model_type,
            "task_type": m.task_type,
            "target_column": m.target_column,
            "metric_name": m.metric_name,
            "metric_value": m.metric_value,
            "feature_columns": json.loads(m.feature_columns),
            "created_at": m.created_at.isoformat(),
        }
        for m in models
    ]


@router.post("/predict", response_model=PredictResponse)
def make_prediction(
    body: PredictRequest,
    db: Session = Depends(get_db),
):
    model_record = db.query(ModelResult).filter(ModelResult.id == body.model_id).first()
    if not model_record:
        raise HTTPException(status_code=404, detail="Model not found")

    try:
        result = predict(model_record.model_path, body.features)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return PredictResponse(
        prediction=result["prediction"],
        model_id=body.model_id,
        task_type=result["task_type"],
    )
