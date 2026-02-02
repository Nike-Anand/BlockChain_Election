
import requests

BASE_URL = "http://localhost:8000/api"

def test_endpoint(endpoint):
    try:
        print(f"Testing {endpoint}...")
        res = requests.get(f"{BASE_URL}/{endpoint}")
        print(f"Status: {res.status_code}")
        print(f"Data: {res.json() if res.status_code == 200 else res.text[:100]}")
    except Exception as e:
        print(f"Error: {e}")

test_endpoint("get-db")
test_endpoint("analytics/location-turnout")
test_endpoint("commission/final-results")
