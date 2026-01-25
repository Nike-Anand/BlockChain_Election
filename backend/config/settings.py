import os
from dotenv import load_dotenv

# Load .env from the parent directory (backend/.env)
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(env_path)

# MongoDB Configuration
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = "election_db"

# Security
SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-election-key-2026")
API_KEY = os.getenv("API_KEY", "admin-api-key")
