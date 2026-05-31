import json

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from database.connection import get_db
from models.schemas import UploadResponse
from services.analytics_service import get_column_info
from services.csv_service import get_dataframe, save_upload

router = APIRouter(prefix="/api", tags=["upload"])


@router.post("/upload", response_model=UploadResponse)
async def upload_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    dataset = await save_upload(file, db)
    column_types = json.loads(dataset.column_types)
    df = get_dataframe(dataset.id, db)

    return UploadResponse(
        dataset_id=dataset.id,
        filename=dataset.original_filename,
        row_count=dataset.row_count,
        column_count=dataset.column_count,
        columns=list(df.columns),
        column_types=column_types,
    )
