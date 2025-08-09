
# randomizer.py
# Simple, verifiable on-platform randomizer using SHA256 and time seed

import hashlib
import time
import random

def run_draw(spots, seed=None):
    if seed is None:
        seed = str(time.time())
    
    hash_input = f"{seed}:{spots}".encode()
    hash_digest = hashlib.sha256(hash_input).hexdigest()
    random.seed(int(hash_digest, 16))
    
    winner_index = random.randint(0, len(spots) - 1)
    return {
        "winner": spots[winner_index],
        "seed": seed,
        "hash": hash_digest,
        "spots": spots
    }

# Example usage:
# spots = ["user1", "user2", "user3"]
# result = run_draw(spots)
# print("Winner:", result["winner"])
# print("Seed:", result["seed"])
# print("Hash:", result["hash"])
