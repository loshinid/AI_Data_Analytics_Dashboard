from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, Field


class UploadResponse(BaseModel):
    dataset_id: int
    filename: str
    row_count: int
    column_count: int
    columns: List[str]
    column_types: Dict[str, str]


class ColumnInfo(BaseModel):
    name: str
    dtype: str
    category: str
    null_count: int
    unique_count: int
    sample_values: List[Any] = Field(default_factory=list)


class ColumnsResponse(BaseModel):
    dataset_id: int
    columns: List[ColumnInfo]


class StatsResponse(BaseModel):
    dataset_id: int
    row_count: int
    column_count: int
    missing_values: Dict[str, int]
    summary_statistics: Dict[str, Dict[str, Optional[float]]]
    categorical_summary: Dict[str, Dict[str, int]]
    correlation_matrix: Dict[str, Dict[str, Optional[float]]]


class VisualRequest(BaseModel):
    chart_type: str = "bar"
    column: Optional[str] = None
    x_column: Optional[str] = None
    y_column: Optional[str] = None


class VisualResponse(BaseModel):
    chart_type: str
    title: str
    data: List[Dict[str, Any]]
    x_key: str
    y_key: Optional[str] = None
    value_key: Optional[str] = None


class TrainRequest(BaseModel):
    target_column: str
    model_type: str = "random_forest"


class TrainResponse(BaseModel):
    model_id: int
    task_type: str
    model_type: str
    target_column: str
    metric_name: str
    metric_value: float
    feature_columns: List[str]


class PredictRequest(BaseModel):
    model_id: int
    features: Dict[str, Any]


class PredictResponse(BaseModel):
    prediction: Any
    model_id: int
    task_type: str


class NLPAnalysisResponse(BaseModel):
    dataset_id: int
    text_columns: List[str]
    sentiment: Dict[str, Dict[str, Union[float, int]]]
    word_frequency: Dict[str, List[Dict[str, Any]]]
    keywords: Dict[str, List[str]]


class ErrorResponse(BaseModel):
    detail: str
