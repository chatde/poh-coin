"""
Fetch training data from Supabase for model training.

Pulls all verified (is_match=true) task_assignments with their
compute times and results, organized by task type.
"""

import json
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import httpx
from config import SUPABASE_URL, SUPABASE_SERVICE_KEY


def fetch_training_data(limit: int = 10000) -> list[dict]:
    """
    Fetch verified task results from Supabase.

    Returns list of dicts with: task_type, result, compute_time_ms
    """
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
        return []

    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    }

    # Fetch verified task assignments joined with task type
    url = (
        f"{SUPABASE_URL}/rest/v1/task_assignments"
        f"?is_match=eq.true"
        f"&select=result,compute_time_ms,compute_tasks(task_type)"
        f"&limit={limit}"
        f"&order=submitted_at.desc"
    )

    response = httpx.get(url, headers=headers)

    if response.status_code != 200:
        print(f"Error fetching data: {response.status_code} {response.text}")
        return []

    rows = response.json()
    training_data = []

    for row in rows:
        task_info = row.get("compute_tasks", {})
        if not task_info:
            continue

        training_data.append({
            "task_type": task_info.get("task_type", "unknown"),
            "result": row.get("result", {}),
            "compute_time_ms": row.get("compute_time_ms", 0),
        })

    return training_data


def save_training_data(data: list[dict], path: str = "training/data.json"):
    """Save fetched data to local JSON file."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"Saved {len(data)} training samples to {path}")


if __name__ == "__main__":
    data = fetch_training_data()
    if data:
        save_training_data(data)
    else:
        print("No training data fetched. Using synthetic data for initial model.")
        # Generate synthetic training data for bootstrapping
        import random

        synthetic = []
        for task_type, params in {
            "protein": lambda: {"finalEnergy": random.gauss(-15, 8), "residueCount": random.randint(10, 20), "iterations": 1000},
            "climate": lambda: {"maxTemperature": random.gauss(25, 12), "avgTemperature": random.gauss(15, 8), "centerTemp": random.gauss(18, 10)},
            "signal": lambda: {"maxMagnitude": random.gauss(5000, 2500), "fftSize": 8192, "numSamples": random.randint(5000, 15000)},
            "drugscreen": lambda: {"bindingAffinity": random.gauss(-8, 4), "interactionCount": random.randint(5, 50), "orientationsScanned": 360},
        }.items():
            for _ in range(250):
                synthetic.append({
                    "task_type": task_type,
                    "result": params(),
                    "compute_time_ms": max(100, int(random.gauss(3000, 1000))),
                })

        save_training_data(synthetic)
