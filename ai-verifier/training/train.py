"""
Train the Isolation Forest anomaly detection model.

Uses historical verified mining results to learn normal patterns.
Run after fetch_data.py (or it will generate synthetic data).

Usage:
    python training/train.py
"""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib

from config import MODEL_PATH, CONTAMINATION, STAT_BOUNDS


def extract_features(sample: dict) -> list[float] | None:
    """Extract numeric feature vector from a training sample."""
    task_type = sample["task_type"]
    result = sample["result"]
    compute_time_ms = sample["compute_time_ms"]

    features = [float(compute_time_ms)]

    if task_type == "protein":
        features.extend([
            float(result.get("finalEnergy", 0)),
            float(result.get("residueCount", 0)),
            float(result.get("iterations", 0)),
        ])
    elif task_type == "climate":
        features.extend([
            float(result.get("maxTemperature", 0)),
            float(result.get("avgTemperature", 0)),
            float(result.get("centerTemp", 0)),
        ])
    elif task_type == "signal":
        features.extend([
            float(result.get("maxMagnitude", 0)),
            float(result.get("fftSize", 0)),
            float(result.get("numSamples", 0)),
        ])
    elif task_type == "drugscreen":
        features.extend([
            float(result.get("bindingAffinity", 0)),
            float(result.get("interactionCount", 0)),
            float(result.get("orientationsScanned", 0)),
        ])
    else:
        return None

    return features


def compute_stat_bounds(data: list[dict]) -> dict:
    """Compute statistical bounds from training data."""
    by_type: dict[str, dict[str, list[float]]] = {}

    for sample in data:
        task_type = sample["task_type"]
        if task_type not in by_type:
            by_type[task_type] = {"compute_time_ms": []}

        by_type[task_type]["compute_time_ms"].append(sample["compute_time_ms"])

        result = sample["result"]
        for key, value in result.items():
            if isinstance(value, (int, float)) and not isinstance(value, bool):
                if key not in by_type[task_type]:
                    by_type[task_type][key] = []
                by_type[task_type][key].append(float(value))

    bounds = {}
    for task_type, fields in by_type.items():
        bounds[task_type] = {}
        for field, values in fields.items():
            arr = np.array(values)
            bounds[task_type][field] = {
                "mean": float(arr.mean()),
                "std": float(max(arr.std(), 0.001)),
            }

    return bounds


def main():
    data_path = os.path.join(os.path.dirname(__file__), "data.json")

    if not os.path.exists(data_path):
        print("No training data found. Run fetch_data.py first.")
        print("Generating synthetic data for bootstrap training...")
        # Run fetch_data which will generate synthetic if no Supabase data
        from fetch_data import fetch_training_data, save_training_data
        data = fetch_training_data()
        if not data:
            # Will be generated in fetch_data __main__
            import subprocess
            subprocess.run([sys.executable, os.path.join(os.path.dirname(__file__), "fetch_data.py")])

    with open(data_path) as f:
        data = json.load(f)

    print(f"Loaded {len(data)} training samples")

    # Extract features
    features_list = []
    valid_samples = []
    for sample in data:
        feats = extract_features(sample)
        if feats:
            features_list.append(feats)
            valid_samples.append(sample)

    if len(features_list) < 50:
        print(f"Not enough valid samples ({len(features_list)}). Need at least 50.")
        return

    X = np.array(features_list)
    print(f"Feature matrix shape: {X.shape}")

    # Split for evaluation
    X_train, X_test = train_test_split(X, test_size=0.2, random_state=42)

    # Train Isolation Forest
    model = IsolationForest(
        n_estimators=200,
        contamination=CONTAMINATION,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train)

    # Evaluate
    train_pred = model.predict(X_train)
    test_pred = model.predict(X_test)

    train_inlier_pct = (train_pred == 1).sum() / len(train_pred) * 100
    test_inlier_pct = (test_pred == 1).sum() / len(test_pred) * 100

    print(f"\nTrain: {train_inlier_pct:.1f}% inliers, {100-train_inlier_pct:.1f}% outliers")
    print(f"Test:  {test_inlier_pct:.1f}% inliers, {100-test_inlier_pct:.1f}% outliers")

    # Decision function scores
    test_scores = model.decision_function(X_test)
    print(f"\nDecision function — min: {test_scores.min():.3f}, max: {test_scores.max():.3f}, mean: {test_scores.mean():.3f}")

    # Save model
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    print(f"\nModel saved to {MODEL_PATH}")

    # Compute and print statistical bounds
    bounds = compute_stat_bounds(valid_samples)
    print("\nStatistical bounds computed:")
    for task_type, fields in bounds.items():
        print(f"  {task_type}:")
        for field, stats in fields.items():
            print(f"    {field}: mean={stats['mean']:.2f}, std={stats['std']:.2f}")

    # Save bounds
    bounds_path = os.path.join(os.path.dirname(MODEL_PATH), "stat_bounds.json")
    with open(bounds_path, "w") as f:
        json.dump(bounds, f, indent=2)
    print(f"\nBounds saved to {bounds_path}")


if __name__ == "__main__":
    main()
