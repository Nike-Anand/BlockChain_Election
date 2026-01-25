import requests
import random
import json

url = "http://127.0.0.1:5000/api/add-party"

payload = {
    "name": f"API Test Party {random.randint(100,900)}",
    "symbol": "🖥️",
    "description": "Party added via API endpoint test",
    "manifesto": "API Works",
    "imageUrl": "http://example.com/img.png",
    "votes": 0
}

print(f"Sending POST to {url} with data: {payload}")

try:
    resp = requests.post(url, json=payload)
    print(f"Status Code: {resp.status_code}")
    print(f"Response: {resp.text}")
except Exception as e:
    print(f"❌ Connection Failed: {e}")
