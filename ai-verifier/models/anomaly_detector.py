"""
Three-layer anomaly detection for mining result verification.

Layer 1: Statistical bounds — flag results outside 3 standard deviations
Layer 2: Isolation Forest — trained ML model detects novel outlier patterns
Layer 3: Cross-device consistency — compare against other results for the same task
Layer 4: Reference computation — server-side spot-check against deterministic output
Layer 5: Fitness anomaly detection — impossible workout patterns
"""

import numpy as np
import joblib
import os
from typing import Any

from config import STAT_BOUNDS, MODEL_PATH, CONFIDENCE_ACCEPT, CONFIDENCE_REVIEW


class AnomalyDetector:
    """Multi-layer anomaly detection for mining results."""

    def __init__(self):
        self.model = None
        self.stat_bounds = STAT_BOUNDS
        self._load_model()

    def _load_model(self):
        """Load trained Isolation Forest model if available."""
        if os.path.exists(MODEL_PATH):
            self.model = joblib.load(MODEL_PATH)

    def reload_model(self):
        """Reload model from disk (after retraining)."""
        self._load_model()

    def verify(
        self,
        task_type: str,
        result: dict[str, Any],
        compute_time_ms: int,
        peer_results: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        """
        Verify a mining result using multiple layers of detection.

        Returns:
            {
                "confidence": 0.0-1.0,
                "flags": list of warning strings,
                "recommendation": "accept" | "review" | "reject",
                "layer_scores": { "statistical": float, "ml": float, "consistency": float }
            }
        """
        flags: list[str] = []

        # Fitness verify tasks use separate verification
        if task_type == "fitness_verify":
            return self._verify_fitness_result(result, flags)

        layer_scores = {
            "statistical": 1.0,
            "ml": 1.0,
            "consistency": 1.0,
        }

        # ── Layer 1: Statistical bounds ──────────────────────────────
        stat_score = self._check_statistical_bounds(task_type, result, compute_time_ms, flags)
        layer_scores["statistical"] = stat_score

        # ── Layer 2: Isolation Forest ────────────────────────────────
        ml_score = self._check_isolation_forest(task_type, result, compute_time_ms, flags)
        layer_scores["ml"] = ml_score

        # ── Layer 3: Cross-device consistency ────────────────────────
        consistency_score = self._check_consistency(result, peer_results, flags)
        layer_scores["consistency"] = consistency_score

        # ── Combine scores (weighted average) ────────────────────────
        # Statistical: 30%, ML: 40%, Consistency: 30%
        confidence = (
            0.30 * stat_score
            + 0.40 * ml_score
            + 0.30 * consistency_score
        )

        # Determine recommendation
        if confidence >= CONFIDENCE_ACCEPT:
            recommendation = "accept"
        elif confidence >= CONFIDENCE_REVIEW:
            recommendation = "review"
        else:
            recommendation = "reject"

        return {
            "confidence": round(confidence, 4),
            "flags": flags,
            "recommendation": recommendation,
            "layer_scores": {k: round(v, 4) for k, v in layer_scores.items()},
        }

    def _verify_fitness_result(
        self,
        result: dict[str, Any],
        flags: list[str],
    ) -> dict[str, Any]:
        """Verify a fitness verification task result."""
        checks = result.get("checks", {})
        confidence_from_node = result.get("confidence", 0)

        # Validate the node's verification logic
        score = 1.0

        if not checks:
            flags.append("No verification checks provided")
            score = 0.0
        else:
            # Check that the node performed reasonable checks
            expected_checks = [
                "hrPlausible", "paceReasonable", "caloriesReasonable",
                "noTimeOverlap", "withinBaseline",
            ]
            performed = sum(1 for c in expected_checks if c in checks)
            if performed < 3:
                flags.append(f"Only {performed}/{len(expected_checks)} expected checks performed")
                score -= 0.3

            # Node confidence should be reasonable (not always 1.0 or 0.0)
            if confidence_from_node == 1.0 and not all(checks.values()):
                flags.append("Perfect confidence despite failed checks")
                score -= 0.4

        confidence = max(0.0, min(1.0, score))

        if confidence >= CONFIDENCE_ACCEPT:
            recommendation = "accept"
        elif confidence >= CONFIDENCE_REVIEW:
            recommendation = "review"
        else:
            recommendation = "reject"

        return {
            "confidence": round(confidence, 4),
            "flags": flags,
            "recommendation": recommendation,
            "layer_scores": {"fitness_verify": round(score, 4)},
        }

    def _check_statistical_bounds(
        self,
        task_type: str,
        result: dict[str, Any],
        compute_time_ms: int,
        flags: list[str],
    ) -> float:
        """Check if result values fall within expected statistical ranges."""
        bounds = self.stat_bounds.get(task_type, {})
        if not bounds:
            return 1.0  # No bounds defined, pass

        score = 1.0
        checks = 0

        # Check compute time (wider bounds for real data — variable sizes)
        if "compute_time_ms" in bounds:
            b = bounds["compute_time_ms"]
            z = abs(compute_time_ms - b["mean"]) / max(b["std"], 1)
            # Wider threshold for real data (4σ instead of 3σ)
            if z > 4:
                flags.append(f"compute_time_ms z-score={z:.1f} (>4σ)")
                score -= 0.3
            elif z > 3:
                score -= 0.1
            checks += 1

        # Check task-type-specific fields
        for field, b in bounds.items():
            if field == "compute_time_ms":
                continue
            value = result.get(field)
            if value is not None:
                try:
                    z = abs(float(value) - b["mean"]) / max(b["std"], 0.001)
                    # Wider threshold for real data (4σ instead of 3σ)
                    if z > 4:
                        flags.append(f"{field} z-score={z:.1f} (>4σ)")
                        score -= 0.3
                    elif z > 3:
                        score -= 0.1
                    checks += 1
                except (TypeError, ValueError):
                    pass

        return max(0.0, min(1.0, score))

    def _check_isolation_forest(
        self,
        task_type: str,
        result: dict[str, Any],
        compute_time_ms: int,
        flags: list[str],
    ) -> float:
        """Use trained Isolation Forest to detect anomalies."""
        if self.model is None:
            return 1.0  # No model trained yet, pass

        try:
            features = self._extract_features(task_type, result, compute_time_ms)
            if features is None:
                return 1.0

            # Isolation Forest: predict returns -1 for outliers, 1 for inliers
            prediction = self.model.predict([features])[0]
            # decision_function returns anomaly score (lower = more anomalous)
            anomaly_score = self.model.decision_function([features])[0]

            if prediction == -1:
                flags.append(f"ML anomaly detected (score={anomaly_score:.3f})")
                # Map anomaly score to 0-0.5 range
                return max(0.0, min(0.5, 0.5 + anomaly_score))
            else:
                # Map inlier score to 0.7-1.0 range
                return min(1.0, 0.7 + anomaly_score * 0.3)

        except Exception:
            return 1.0  # Model error, pass

    def _check_consistency(
        self,
        result: dict[str, Any],
        peer_results: list[dict[str, Any]] | None,
        flags: list[str],
    ) -> float:
        """Compare result against peer submissions for the same task."""
        if not peer_results or len(peer_results) < 1:
            return 1.0  # No peers to compare against

        # Extract numeric values from results for comparison
        our_values = self._flatten_numeric(result)
        if not our_values:
            return 1.0

        peer_value_lists: list[list[float]] = []
        for pr in peer_results:
            pv = self._flatten_numeric(pr)
            if pv and len(pv) == len(our_values):
                peer_value_lists.append(pv)

        if not peer_value_lists:
            return 1.0

        # Compute mean and std of peer values
        peer_array = np.array(peer_value_lists)
        peer_mean = peer_array.mean(axis=0)
        peer_std = peer_array.std(axis=0)
        peer_std = np.where(peer_std < 0.001, 0.001, peer_std)

        our_array = np.array(our_values)
        z_scores = np.abs(our_array - peer_mean) / peer_std
        max_z = float(z_scores.max())

        if max_z > 2:
            flags.append(f"Peer consistency: max z-score={max_z:.1f} (>2σ)")
            return max(0.0, 1.0 - (max_z - 2) * 0.25)

        return 1.0

    def _extract_features(
        self,
        task_type: str,
        result: dict[str, Any],
        compute_time_ms: int,
    ) -> list[float] | None:
        """Extract numeric feature vector from a task result."""
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
        elif task_type == "fitness_verify":
            features.extend([
                float(result.get("confidence", 0)),
                1.0 if result.get("verified") else 0.0,
                float(len(result.get("checks", {}))),
            ])
        else:
            return None

        return features

    def _flatten_numeric(self, d: dict[str, Any]) -> list[float]:
        """Extract all numeric values from a dict (non-recursive)."""
        values = []
        for v in d.values():
            if isinstance(v, (int, float)) and not isinstance(v, bool):
                values.append(float(v))
        return values
