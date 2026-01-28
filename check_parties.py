
import requests
import json

try:
    response = requests.get("http://127.0.0.1:5000/api/get-db")
    if response.status_code == 200:
        data = response.json()
        print("API Status: Success")
        parties = data.get("parties", [])
        print(f"Number of parties: {len(parties)}")
        for p in parties:
            print(f"Party: {p.get('name')}, ImageURL: {p.get('imageUrl')}")
    else:
        print(f"API Failed: {response.status_code}")
except Exception as e:
    print(f"Connection Failed: {e}")
