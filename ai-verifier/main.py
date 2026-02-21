"""
POH AI Verification Service

FastAPI microservice for verifying mining task results using
anomaly detection and structural validation.

Run:
    python main.py
    # or
    uvicorn main:app --host 0.0.0.0 --port 8000
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn

from config import HOST, PORT
from models.anomaly_detector import AnomalyDetector
from models.result_validator import validate_result_structure

app = FastAPI(
    title="POH AI Verifier",
    description="Anomaly detection service for Proof of Planet mining results",
    version="1.0.0",
)

detector = AnomalyDetector()


class VerifyRequest(BaseModel):
    """Request body for /verify endpoint."""
    task_type: str
    result: dict
    compute_time_ms: int
    peer_results: list[dict] | None = None


class VerifyResponse(BaseModel):
    """Response body for /verify endpoint."""
    confidence: float
    flags: list[str]
    recommendation: str  # "accept" | "review" | "reject"
    layer_scores: dict[str, float]


class HealthResponse(BaseModel):
    """Response body for /health endpoint."""
    status: str
    model_loaded: bool
    version: str


@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint."""
    return HealthResponse(
        status="ok",
        model_loaded=detector.model is not None,
        version="1.0.0",
    )


@app.post("/verify", response_model=VerifyResponse)
async def verify(req: VerifyRequest):
    """
    Verify a mining task result.

    Three-layer verification:
    1. Statistical bounds — flag results outside 3σ
    2. Isolation Forest — trained ML anomaly detection
    3. Cross-device consistency — compare against peer results
    """
    # Structural validation first
    errors = validate_result_structure(req.task_type, req.result)
    if errors:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid result structure: {'; '.join(errors)}",
        )

    result = detector.verify(
        task_type=req.task_type,
        result=req.result,
        compute_time_ms=req.compute_time_ms,
        peer_results=req.peer_results,
    )

    return VerifyResponse(**result)


@app.post("/reload-model")
async def reload_model():
    """Reload the ML model from disk (call after retraining)."""
    detector.reload_model()
    return {"status": "ok", "model_loaded": detector.model is not None}


if __name__ == "__main__":
    uvicorn.run(app, host=HOST, port=PORT)
