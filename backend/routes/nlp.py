from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database.connection import get_db
from models.schemas import NLPAnalysisResponse
from services.csv_service import get_dataframe
from services.nlp_service import analyze_text_columns

router = APIRouter(prefix="/api", tags=["nlp"])


@router.get("/nlp-analysis", response_model=NLPAnalysisResponse)
def nlp_analysis(
    dataset_id: int = Query(...),
    db: Session = Depends(get_db),
):
    df = get_dataframe(dataset_id, db)
    result = analyze_text_columns(df)
    return NLPAnalysisResponse(dataset_id=dataset_id, **result)
