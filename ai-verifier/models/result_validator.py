"""
Per-task-type structural validation.

Checks that results have the expected fields and value types
before passing them to the anomaly detector.
"""

from typing import Any

# Expected result schema per task type
RESULT_SCHEMAS: dict[str, dict[str, type]] = {
    "protein": {
        "finalEnergy": (int, float),
        "iterations": (int,),
        "residueCount": (int,),
    },
    "climate": {
        "gridSize": (int,),
        "timeSteps": (int,),
        "maxTemperature": (int, float),
        "avgTemperature": (int, float),
        "centerTemp": (int, float),
    },
    "signal": {
        "sampleRate": (int,),
        "duration": (int, float),
        "numSamples": (int,),
        "fftSize": (int,),
        "maxMagnitude": (int, float),
    },
    "drugscreen": {
        "compoundName": (str,),
        "bindingAffinity": (int, float),
        "interactionCount": (int,),
        "orientationsScanned": (int,),
    },
}


def validate_result_structure(task_type: str, result: dict[str, Any]) -> list[str]:
    """
    Validate that a result has the expected fields and types.

    Returns list of error strings. Empty list = valid.
    """
    errors: list[str] = []

    schema = RESULT_SCHEMAS.get(task_type)
    if not schema:
        errors.append(f"Unknown task type: {task_type}")
        return errors

    for field, expected_types in schema.items():
        if field not in result:
            errors.append(f"Missing field: {field}")
            continue
        if not isinstance(result[field], expected_types):
            errors.append(
                f"Invalid type for {field}: expected {expected_types}, got {type(result[field]).__name__}"
            )

    return errors
