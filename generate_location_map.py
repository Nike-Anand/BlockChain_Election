import csv
import json
import os
import math

CSV_PATH = "csv/voter_list_final.csv"
OUTPUT_JSON = "backend/voter_locations.json"

LOCATIONS = [
    "Adyar", "Anna Nagar", "T. Nagar", "Velachery", "Mylapore", 
    "Saidapet", "Guindy", "Egmore", "Kodambakkam", "Royapettah", "Tambaram"
]

def generate_map():
    if not os.path.exists(CSV_PATH):
        print(f"Error: {CSV_PATH} not found.")
        return

    voter_map = {}
    
    with open(CSV_PATH, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        # Normalize headers
        reader.fieldnames = [name.strip() for name in reader.fieldnames]
        voters = [row["EPIC_Number"] for row in reader if row.get("EPIC_Number")]
        
    print(f"Total Voters: {len(voters)}")
    
    chunk_size = 35
    
    for i, epic in enumerate(voters):
        loc_index = min(i // chunk_size, len(LOCATIONS) - 1)
        location = LOCATIONS[loc_index]
        voter_map[epic] = location
        
    print(f"Mapped {len(voter_map)} voters to {len(LOCATIONS)} locations.")
    
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(voter_map, f, indent=2)
    
    print(f"Map saved to {OUTPUT_JSON}")

if __name__ == "__main__":
    generate_map()
