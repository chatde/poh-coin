"""Configuration for the POH AI Verification Service."""

import os
from dotenv import load_dotenv

load_dotenv()

# Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

# Server
HOST = os.getenv("AI_VERIFIER_HOST", "0.0.0.0")
PORT = int(os.getenv("AI_VERIFIER_PORT", "8000"))

# Thresholds
CONFIDENCE_ACCEPT = 0.8    # >= this: accept result
CONFIDENCE_REVIEW = 0.5    # >= this but < accept: flag for review
# < CONFIDENCE_REVIEW: reject

# Model
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "trained", "model.joblib")
CONTAMINATION = 0.05  # Expected anomaly rate for Isolation Forest

# Statistical bounds per task type (mean, std from training data)
# Wider bounds for real live data (variable protein sizes, grid sizes, etc.)
STAT_BOUNDS = {
    "protein": {
        "compute_time_ms": {"mean": 8000, "std": 5000},   # Wider: 50-300 residues
        "finalEnergy": {"mean": -50.0, "std": 40.0},       # Wider: variable sizes
        "residueCount": {"mean": 100, "std": 80},           # 20-300 residues
    },
    "climate": {
        "compute_time_ms": {"mean": 6000, "std": 4000},   # Wider: 64-256 grids
        "maxTemperature": {"mean": 20.0, "std": 25.0},     # Wider: Arctic to urban
        "avgTemperature": {"mean": 5.0, "std": 20.0},
    },
    "signal": {
        "compute_time_ms": {"mean": 3000, "std": 2000},   # FFT is O(n log n) now
        "maxMagnitude": {"mean": 8000, "std": 6000},       # Variable earthquake magnitudes
        "fftSize": {"mean": 16384, "std": 16000},          # 4K-64K samples
    },
    "drugscreen": {
        "compute_time_ms": {"mean": 10000, "std": 8000},  # 50+ binding site atoms
        "bindingAffinity": {"mean": -20.0, "std": 15.0},   # Real molecular data
        "bindingSiteResidues": {"mean": 60, "std": 25},     # 50-80 atoms
    },
    "fitness_verify": {
        "compute_time_ms": {"mean": 100, "std": 200},     # Lightweight checks
        "confidence": {"mean": 0.85, "std": 0.15},
    },
}
