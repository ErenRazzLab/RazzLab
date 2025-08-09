# randomizer.py
# Simple verifiable random draw: SHA256(seed + ordered spots) -> RNG -> winner index
import hashlib, time, random
from typing import List, Dict, Any, Optional

def run_draw(spots: List[str], seed: Optional[str] = None) -> Dict[str, Any]:
    if not spots:
        raise ValueError("spots must be a non-empty list")
    ordered = list(spots)
    # Optional: keep join order; switch to sorted() for strict determinism across runs with same inputs
    if seed is None:
        seed = str(time.time_ns())
    material = f"{seed}:{'|'.join(ordered)}".encode()
    digest = hashlib.sha256(material).hexdigest()
    random.seed(int(digest, 16))
    winner_idx = random.randint(0, len(ordered) - 1)
    return {
        "winner": ordered[winner_idx],
        "winner_index": winner_idx,
        "seed": seed,
        "sha256": digest,
        "spots": ordered,
    }
