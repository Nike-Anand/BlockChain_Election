from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status, Header, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import cv2
import numpy as np
import base64
from datetime import datetime, timezone, timedelta
from cryptography.fernet import Fernet
import asyncio
from asyncio import Lock
import dateutil.parser
import mediapipe as mp
from ultralytics import YOLO
import uvicorn
import math
import tempfile
import os
import hashlib
import uuid
from collections import defaultdict

# Security imports
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from security import (
    hash_password, verify_password, create_access_token, verify_token,
    hash_biometric_photo, create_audit_log, validate_environment
)
from models import VoterRegistration, LoginRequest, VoteCast, PartyCreate, SettingsUpdate, UserRegister, PartyAdd

app = FastAPI(title="Secure Election System", version="2.0.0")

# Rate limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS - PRODUCTION: Replace with your actual domain
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # Whitelist specific domains
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response



# --- MODELS ---
print("Initializing Models...")

# 1. YOLO
yolo_model = None
try:
    yolo_model = YOLO("yolov8n.pt")
    print("YOLO Loaded.")
except:
    print("YOLO Failed (Skipping).")

# 2. MediaPipe (Video)
mp_face_mesh = None
face_mesh = None
id_face_mesh = None

try:
    import mediapipe as mp
    try:
        if hasattr(mp, 'solutions'):
            mp_face_mesh = mp.solutions.face_mesh
            face_mesh = mp_face_mesh.FaceMesh(
                max_num_faces=1,
                refine_landmarks=True,
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5
            )
            
            # 2b. MediaPipe (ID Card - Permissive)
            id_face_mesh = mp_face_mesh.FaceMesh(
                max_num_faces=1,
                refine_landmarks=True,
                min_detection_confidence=0.1,
                min_tracking_confidence=0.1
            )
            print("MediaPipe Loaded Successfully.")
        else:
            print("ERROR: mediapipe module found but has no 'solutions' attribute. Reinstall with: pip install --force-reinstall mediapipe")
    except Exception as ie:
         print(f"MediaPipe Init Error: {ie}")

except ImportError:
    print("MediaPipe NOT FOUND. Install: pip install mediapipe")
except Exception as e:
    print(f"MediaPipe Failed: {e}")


# 3. Face Recognition
USE_FACE_REC = False
try:
    import face_recognition
    USE_FACE_REC = True
    print("face_recognition Loaded.")
except ImportError:
    print("Using Geometric Fallback Only.")

# --- HELPERS ---

def get_geometric_vector(frame, landmarks, w, h):
    # Geometric feature vector
    points = [33, 263, 1, 61, 291, 199, 152] 
    coords = []
    for p in points:
        coords.append(np.array([landmarks[p].x * w, landmarks[p].y * h]))
    
    scale = np.linalg.norm(coords[0] - coords[1])
    if scale == 0: return None
    
    vector = []
    for i in range(len(coords)):
        for j in range(i+1, len(coords)):
             dist = np.linalg.norm(coords[i] - coords[j])
             vector.append(dist / scale)
    return np.array(vector)

def eye_aspect_ratio(landmarks, w, h):
    # Dlib/MediaPipe Mapping
    # Left Eye: 362, 385, 387, 263, 373, 380
    # Right Eye: 33, 160, 158, 133, 153, 144
    left = [362, 385, 387, 263, 373, 380]
    right = [33, 160, 158, 133, 153, 144]
    
    def ear(idxs):
        p = [np.array([landmarks[i].x * w, landmarks[i].y * h]) for i in idxs]
        v1 = np.linalg.norm(p[1]-p[5])
        v2 = np.linalg.norm(p[2]-p[4])
        hor = np.linalg.norm(p[0]-p[3])
        return (v1 + v2) / (2.0 * hor)
    
    return (ear(left) + ear(right)) / 2.0

def detect_darkness(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    return np.mean(gray) < 40

def analyze_texture(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    return laplacian.var() < 25  # Blur check

# --- DEEPFACE FOR EMOTION ---
try:
    from deepface import DeepFace
    print("DeepFace Loaded.")
except ImportError:
    print("DeepFace not found. Please install: pip install deepface tf-keras")
    DeepFace = None

def check_smile(frame, x, y, w, h):
    # Use DeepFace for robust emotion detection (Happy)
    if DeepFace is None: return False
    try:
        # Extract face region
        face_img = frame[y:y+h, x:x+w]
        if face_img.size == 0: return False
        
        # DeepFace expects BGR usually, but analyze handles it. 
        # Enforce detection=False because we already have the crop.
        res = DeepFace.analyze(face_img, actions=['emotion'], enforce_detection=False, verbose=False)
        if isinstance(res, list): res = res[0]
        
        emotion = res.get('dominant_emotion')
        # print(f"Emotion: {emotion}")
        return emotion == 'happy'
    except Exception as e:
        # print(f"DeepFace Error: {e}")
        return False

# MediaPipe Geometry for others
def check_eyebrow(landmarks, w, h):
    # Eyebrow Raise: Distance between eyebrow and eye
    eyebrow_y = (landmarks[65].y + landmarks[159].y) / 2
    eye_y = landmarks[145].y
    dist = abs(eye_y - eyebrow_y)
    
    # Normalize by approx face height (Chin to Top)
    face_h = abs(landmarks[152].y - landmarks[10].y)
    ratio = dist / face_h
    
    # print(f"Eyebrow Ratio: {ratio:.3f}")
    return ratio > 0.05

def check_head_pose(landmarks, w, h):
    # Estimate Head Pose (Yaw, Pitch)
    # 1. Nose Tip (1)
    # 2. Left Eye Outer (33) -> Actually use 263 (Right) and 33 (Left) for width
    # 3. Chin (152) 
    
    nose_tip = landmarks[1]
    chin = landmarks[152]
    left_eye = landmarks[33]
    right_eye = landmarks[263]
    
    # Coordinates
    nx, ny = nose_tip.x * w, nose_tip.y * h
    cx, cy = chin.x * w, chin.y * h
    lx, ly = left_eye.x * w, left_eye.y * h
    rx, ry = right_eye.x * w, right_eye.y * h
    
    # 1. Yaw (Left-Right rotation)
    # Compare distances from nose to left/right eyes
    dist_l = math.sqrt((nx - lx)**2 + (ny - ly)**2)
    dist_r = math.sqrt((nx - rx)**2 + (ny - ry)**2)
    
    # If looking straight, distances should be similar.
    # Yaw ratio: deviation from 1.0
    yaw_ratio = min(dist_l, dist_r) / max(dist_l, dist_r)
    
    # 2. Pitch (Up-Down rotation)
    # Nose position relative to eye-chin line verticality
    # For simple frontal check, ensure nose is appropriately between eyes and chin
    # (Simple logic: verify nose is not too high/low)
    
    # Strict Frontal Check:
    # Yaw Ratio > 0.5 (Not turned too much)
    is_frontal = yaw_ratio > 0.5
    
    return is_frontal

def check_landmark_consistency(landmarks):
    # Basic consistency check: ensure face points are in valid relative positions
    # e.g., nose is between eyes, mouth is below nose
    nose = landmarks[1].y
    mouth_top = landmarks[13].y
    left_eye = landmarks[33].y
    right_eye = landmarks[263].y
    
    valid_vertical = left_eye < nose and right_eye < nose and nose < mouth_top
    return valid_vertical

def eye_aspect_ratio(landmarks, w, h):
    # Left Eye: 362, 385, 387, 263, 373, 380
    # Right Eye: 33, 160, 158, 133, 153, 144
    left = [362, 385, 387, 263, 373, 380]
    right = [33, 160, 158, 133, 153, 144]
    
    def ear(idxs):
        p = [np.array([landmarks[i].x * w, landmarks[i].y * h]) for i in idxs]
        v1 = np.linalg.norm(p[1]-p[5])
        v2 = np.linalg.norm(p[2]-p[4])
        hor = np.linalg.norm(p[0]-p[3])
        return (v1 + v2) / (2.0 * hor)
    
    return (ear(left) + ear(right)) / 2.0

def ensure_face_mesh():
    global face_mesh
    if face_mesh is None:
         try:
            face_mesh = mp.solutions.face_mesh.FaceMesh(
                max_num_faces=1,
                refine_landmarks=True,
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5
            )
            return True
         except Exception as e:
            print(f"Lazy Init Failed: {e}")
            return False
    return True

def calculate_face_vector(img):
    if not ensure_face_mesh(): return None
    
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    try:
        mp_res = face_mesh.process(rgb)
        if mp_res.multi_face_landmarks:
                lm = mp_res.multi_face_landmarks[0].landmark
                h, w, _ = img.shape
                return get_geometric_vector(img, lm, w, h)
    except Exception as e:
        print(f"Processing Error: {e}")
    return None

from supabase import create_client, Client
from config.settings import MONGO_URI, DB_NAME # Kept for env loading mostly
import os
from datetime import datetime

# --- SUPABASE CONFIG ---
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://your-project.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "your-anon-key")
print(f"Connecting to Supabase: {SUPABASE_URL}")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- BLOCKCHAIN (Web3) ---
try:
    from web3 import Web3
    import json
    
    GANACHE_URL = "http://127.0.0.1:7545"
    
    w3 = Web3(Web3.HTTPProvider(GANACHE_URL))
    if w3.is_connected():
        print(f"Connected to Ganache: {GANACHE_URL}")
        # Get the first account from Ganache (automatically available)
        accounts = w3.eth.accounts
        if accounts:
            ADMIN_ACCOUNT = accounts[0]
            print(f"Using Ganache account: {ADMIN_ACCOUNT}")
            w3.eth.default_account = ADMIN_ACCOUNT
        else:
            print("Warning: No accounts found in Ganache")
            ADMIN_ACCOUNT = None
    else:
        print("Failed to connect to Ganache")
        w3 = None
        ADMIN_ACCOUNT = None

    # Load ABI
    with open("artifacts/contracts/Voting.sol/VotingSystem.json") as f:
        contract_json = json.load(f)
        CONTRACT_ABI = contract_json["abi"]
        CONTRACT_BYTECODE = contract_json["bytecode"]

    # We need a contract address. Since we don't have one fixed from the user (Result says EOA),
    # We will try to find it from a file or deploy a new one if needed.
    # For now, let's look for a tracked address or deploy on startup if missing.
    CONTRACT_ADDRESS = None
    if os.path.exists("contract_address.txt"):
        with open("contract_address.txt", "r") as f:
            CONTRACT_ADDRESS = f.read().strip()
            print(f"Loaded Contract Address: {CONTRACT_ADDRESS}")
    
    contract_instance = None
    if CONTRACT_ADDRESS:
         contract_instance = w3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)

except Exception as e:
    print(f"Blockchain Init Failed: {e}")
    w3 = None


# --- ENCRYPTION ---
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")
cipher_suite = Fernet(ENCRYPTION_KEY.encode()) if ENCRYPTION_KEY else None

# --- GLOBAL STATE FOR LOGIC FIXES ---
vote_locks = defaultdict(Lock)  # voter_id -> Lock (prevent race conditions)
biometric_sessions = {}  # voter_id -> {nonce, timestamp, used, session_token}
idempotency_cache = {}  # idempotency_key -> response

def encrypt_data(data: str) -> str:
    """Encrypt with random salt to prevent frequency analysis"""
    if not cipher_suite or not data: return data
    salt = os.urandom(16).hex()  # Random 32-char hex salt
    salted_text = f"{salt}:{data}"
    return cipher_suite.encrypt(salted_text.encode()).decode()

def decrypt_data(data: str) -> str:
    """Decrypt and remove salt"""
    if not cipher_suite or not data: return data
    try:
        decrypted_with_salt = cipher_suite.decrypt(data.encode()).decode()
        if ':' in decrypted_with_salt:
            salt, original_text = decrypted_with_salt.split(':', 1)
            return original_text
        return decrypted_with_salt  # Backward compatibility
    except:
        return data

# --- IST HELPERS ---
IST = timezone(timedelta(hours=5, minutes=30))

def get_now_ist():
    return datetime.now(IST)

# --- DATABASE ENDPOINTS (SUPABASE ADAPTER) ---

@app.get("/api/get-db")
async def get_db():
    # Fetch all data and restructure to match the frontend 'DB' object
    try:
        users = supabase.table("users").select("*").execute().data
        parties = supabase.table("parties").select("*").execute().data
        votes = supabase.table("votes").select("*").execute().data
        settings_res = supabase.table("settings").select("*").single().execute()
        
        settings = settings_res.data if settings_res.data else {
            "start_time": None, "end_time": None, "is_active": False, "registration_open": True
        }
        
        print(f"DB Fetch: {len(users)} users, {len(parties)} parties.")

        # Map snake_case (DB) to camelCase (Frontend)
        formatted_users = [{
            "username": u["username"], 
            "password": u["password"], 
            "voterId": u["voter_id"], 
            "role": u["role"],
            "pass1": u.get("pass1"),
            "pass2": u.get("pass2"),
            "pass3": u.get("pass3"),
            "pass4": u.get("pass4")
        } for u in users]
        
        # Extract 4-Factor Keys from specific authorized users (Strictly DB-driven)
        key_ids = ["SE", "SE-2", "OB", "ADM"]
        admin_keys = {}
        
        for idx, kid in enumerate(key_ids):
            k_user = next((u for u in users if u["voter_id"] == kid), None)
            admin_keys[f"pass{idx+1}"] = k_user["password"] if k_user else None
                
        formatted_parties = [{
            "name": p["name"], "symbol": p["symbol"], 
            "votes": p["votes"], "description": p["description"], 
            "manifesto": p["manifesto"], "imageUrl": p.get("image_url")
        } for p in parties]

        formatted_votes = [{
            "userId": v["user_id"], "partyName": v["party_name"], 
            "timestamp": v["timestamp"], "boothId": v["booth_id"], "hash": v["tx_hash"]
        } for v in votes]

        election_settings = {
            "startTime": settings.get("start_time"),
            "endTime": settings.get("end_time"),
            "isActive": settings.get("is_active"),
            "registrationOpen": settings.get("registration_open"),
            "minVotingAge": settings.get("min_voting_age", 18),
            "boothLocations": [],
            "pass1": admin_keys["pass1"],
            "pass2": admin_keys["pass2"],
            "pass3": admin_keys["pass3"],
            "pass4": admin_keys["pass4"]
        }

        return {
            "admin": next((u for u in formatted_users if u["role"] == 'admin'), None),
            "users": formatted_users,
            "parties": formatted_parties,
            "votes": formatted_votes,
            "electionSettings": election_settings
        }
    except Exception as e:
        print(f"Supabase Error: {e}")
        return {"error": str(e)}

# --- ANALYTICS ---
@app.get("/api/analytics/location-turnout")
async def get_location_turnout():
    try:
        json_path = os.path.join(os.path.dirname(__file__), "voter_locations.json")
        if not os.path.exists(json_path):
            return {"data": []}
            
        with open(json_path, "r") as f:
            voter_map = json.load(f)
            
        # 1. Total Registered per Location
        total_by_loc = {}
        for epic, loc in voter_map.items():
            total_by_loc[loc] = total_by_loc.get(loc, 0) + 1
            
        # 2. Total Voted per Location
        votes = supabase.table("votes").select("user_id").execute().data
        voted_by_loc = {}
        
        for v in votes:
            uid = v["user_id"]
            if uid in voter_map:
                loc = voter_map[uid]
                voted_by_loc[loc] = voted_by_loc.get(loc, 0) + 1
        
        # 3. Calculate %
        results = []
        for loc in total_by_loc:
            total = total_by_loc[loc]
            voted = voted_by_loc.get(loc, 0)
            percent = round((voted / total) * 100, 1) if total > 0 else 0
            results.append({
                "location": loc,
                "total": total,
                "voted": voted,
                "percentage": percent
            })
            
        # Sort by highest turnout
        results.sort(key=lambda x: x["percentage"], reverse=True)
        return {"data": results}

    except Exception as e:
        print(f"Analytics Error: {e}")
        return {"error": str(e)}

# --- ACTION ENDPOINTS (Replaces generic update-db) ---

from pydantic import BaseModel
from typing import Optional

# --- ACTION ENDPOINTS ---

@app.post("/api/register-voter")
@limiter.limit("10/minute")
async def register_voter(request: Request, user: UserRegister):
    try:
        print(f"\\n=== Registering: {user.username}, voterId: {user.voterId} ===")
        # Hash password before storing
        hashed_pw = hash_password(user.password)
        
        # Hash biometric photo (don't store raw)
        photo_hash = None
        if user.photoBase64:
            photo_hash = hash_biometric_photo(user.photoBase64)
        
        # Store user with hashed password
        user_data = {
            "username": user.username,
            "password": hashed_pw,  # Database column is 'password', not 'password_hash'
            "voter_id": user.voterId,
            "role": user.role
        }
        supabase.table("users").insert(user_data).execute()
        
        # Store biometric token (hash only)
        if photo_hash:
            try:
                supabase.table("biometric_tokens").insert({
                    "user_id": user.voterId,
                    "photo_hash": photo_hash
                }).execute()
            except:
                pass  # Table may not exist yet
        
        # Audit log
        create_audit_log(
            supabase,
            action="VOTER_REGISTRATION",
            user_id=user.voterId,
            details={"username": user.username, "role": user.role},
            ip_address=request.client.host if request.client else None
        )
        
        return {"status": "success", "message": "Voter registered successfully"}
        
    except Exception as e:
        # Log failure with traceback
        import traceback
        print(f"\\n❌ REGISTRATION ERROR: {type(e).__name__}: {str(e)}")
        traceback.print_exc()
        print("=== END ERROR ===\\n")
        try:
            create_audit_log(
                supabase,
                action="VOTER_REGISTRATION_FAILED",
                user_id=user.voterId if user else "unknown",
                details={"error": str(e)},
                ip_address=request.client.host if request.client else None
            )
        except:
            pass
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/add-party")
async def add_party(party: PartyAdd):
    try:
        data = {
            "name": party.name,
            "symbol": party.symbol,
            "description": party.description,
            "manifesto": party.manifesto,
            "image_url": party.imageUrl,
            "votes": 0
        }
        supabase.table("parties").insert(data).execute()
        return {"status": "success"}
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/cast-vote")
async def cast_vote(vote: VoteCast, idempotency_key: str = Header(None)):
    try:
        voter_id = vote.userId
        party_name = vote.partyName
        booth_id = vote.boothId
        
        # Idempotency check
        if idempotency_key and idempotency_key in idempotency_cache:
            print(f"Returning cached response for {idempotency_key}")
            return idempotency_cache[idempotency_key]
        
        # Acquire lock for this voter (prevent race condition)
        async with vote_locks[voter_id]:
            print(f"\n--- [Vote Casting] Voter: {voter_id}, Party: {party_name} ---")
            
            # ATOMIC: Check election status at exact moment of vote
            settings = supabase.table("settings").select("*").execute().data[0]
            now = datetime.utcnow()
            
            if not settings.get('is_active'):
                raise HTTPException(status_code=403, detail="Election is not active")
            
            if settings.get('start_time'):
                start = datetime.fromisoformat(settings['start_time'])
                if now < start:
                    raise HTTPException(status_code=403, detail=f"Election starts at {start}")
            
            if settings.get('end_time'):
                end = datetime.fromisoformat(settings['end_time'])
                if now > end:
                    raise HTTPException(status_code=403, detail=f"Election ended at {end}")
            
            # Check if already voted (blockchain)
            if contract_instance:
                try:
                    has_voted = contract_instance.functions.hasVoted(voter_id).call()
                    if has_voted:
                        raise HTTPException(status_code=400, detail="Already voted")
                except Exception as e:
                    print(f"Blockchain check error: {e}")
            
            # Get party UUID from database
            party = supabase.table("parties").select("*").eq("name", party_name).execute().data
            if not party:
                raise HTTPException(status_code=400, detail="Invalid party")
            
            party_uuid = party[0].get('uuid')
            if not party_uuid:
                # Generate UUID for existing parties (backward compatibility)
                party_uuid = str(uuid.uuid4())
                supabase.table("parties").update({"uuid": party_uuid}).eq("name", party_name).execute()
                print(f"Generated UUID for party {party_name}: {party_uuid}")
            
            # Create vote hash (links blockchain to database)
            timestamp_iso = now.isoformat()
            encrypted_party = encrypt_data(party_name)  # Now includes random salt
            
            vote_hash = hashlib.sha256(
                f"{encrypted_party}:{voter_id}:{timestamp_iso}".encode()
            ).hexdigest()
            
            print(f"Vote Hash: {vote_hash[:16]}...")
            
            # Submit to blockchain
            tx_hash_val = "BLOCKCHAIN_OFFLINE"
            if w3 and contract_instance:
                try:
                    print(f"Submitting to blockchain: UUID={party_uuid}, Voter={voter_id}")
                    tx_hash = contract_instance.functions.vote(
                        party_uuid,
                        voter_id,
                        vote_hash
                    ).transact({'from': ADMIN_ACCOUNT})
                    
                    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
                    
                    if receipt['status'] != 1:
                        raise Exception("Blockchain transaction failed")
                    
                    tx_hash_val = w3.to_hex(tx_hash)
                    print(f"✅ Blockchain TX: {tx_hash_val}")
                    
                except Exception as bc_error:
                    print(f"❌ Blockchain error: {bc_error}")
                    raise HTTPException(status_code=500, detail=f"Blockchain error: {str(bc_error)}")
            
            # Insert to database (with rollback handling)
            try:
                vote_record = {
                    "user_id": voter_id,
                    "party_name": encrypted_party,
                    "vote_hash": vote_hash,
                    "booth_id": booth_id,
                    "tx_hash": tx_hash_val,
                    "timestamp": timestamp_iso
                }
                
                supabase.table("votes").insert(vote_record).execute()
                print("✅ Vote recorded in database")
                
            except Exception as db_error:
                # Database failed - mark blockchain vote as invalid
                print(f"❌ Database error: {db_error}")
                
                if tx_hash_val != "BLOCKCHAIN_OFFLINE":
                    try:
                        supabase.table("invalid_votes").insert({
                            "tx_hash": tx_hash_val,
                            "voter_id": voter_id,
                            "reason": f"Database insertion failed: {str(db_error)}",
                            "timestamp": timestamp_iso
                        }).execute()
                    except:
                        pass  # Best effort
                
                raise HTTPException(status_code=500, detail=f"Vote recording failed. Contact admin with TX: {tx_hash_val}")
            
            # Success response
            response = {
                "status": "success",
                "tx_hash": tx_hash_val,
                "vote_hash": vote_hash,
                "message": "Vote recorded successfully"
            }
            
            # Cache response for idempotency
            if idempotency_key:
                idempotency_cache[idempotency_key] = response
            
            return response
            
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Vote Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

        
        # 2. Increment Party Count (DISABLED for Pure E2E Encryption)
        # Results will be calculated by the Commission using the encrypted votes table after the election ends.
        # current = supabase.table("parties").select("votes").eq("name", vote.partyName).single().execute()
        # if current.data:
        #     new_count = current.data["votes"] + 1
        #     supabase.table("parties").update({"votes": new_count}).eq("name", vote.partyName).execute()
            
        return {"status": "success", "tx_hash": tx_hash_val}

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Vote Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/update-settings")
async def update_settings(settings: SettingsUpdate):
    try:
        data = {}
        if settings.isActive is not None: data["is_active"] = settings.isActive
        if settings.registrationOpen is not None: data["registration_open"] = settings.registrationOpen
        if settings.startTime: data["start_time"] = settings.startTime
        if settings.endTime: data["end_time"] = settings.endTime
        
        if data:
            supabase.table("settings").update(data).eq("id", 1).execute()
            
        # Update Admin Keys if provided (Routed to specific voter IDs)
        key_map = {"pass1": "SE", "pass2": "SE-2", "pass3": "OB", "pass4": "ADM"}
        
        for key_field, kid in key_map.items():
            val = getattr(settings, key_field, None)
            if val:
                supabase.table("users").update({"password": val}).eq("voter_id", kid).execute()

        return {"status": "success"}
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/commission/final-results")
async def get_final_results():
    try:
        settings = supabase.table("settings").select("*").single().execute().data
        if not settings:
            return {"error": "No settings found"}
        
        now = datetime.utcnow()
        
        # TIME-LOCK: Only allow decryption after election ends
        if settings.get("is_active"):
            return {"error": "Election is still active. Results locked until election ends."}
        
        end_time_str = settings.get("end_time")
        if end_time_str:
            end_time = dateutil.parser.isoparse(end_time_str)
            if now < end_time:
                return {"error": f"Results will be available after {end_time} UTC"}
        
        # Decrypt votes
        votes = supabase.table("votes").select("party_name, vote_hash, tx_hash").execute().data
        tally = {}
        verified_count = 0
        
        for v in votes:
            encrypted_name = v["party_name"]
            vote_hash_db = v.get("vote_hash")
            
            try:
                decrypted_name = decrypt_data(encrypted_name)
                tally[decrypted_name] = tally.get(decrypted_name, 0) + 1
                
                # Count verified votes (have hash)
                if vote_hash_db:
                    verified_count += 1
                    
            except Exception as e:
                print(f"Decryption error: {e}")
        
        return {
            "status": "success",
            "tally": tally,
            "total_votes": len(votes),
            "verified_votes": verified_count
        }
        
    except Exception as e:
        return {"error": str(e)}


@app.get("/api/verify-vote/{voter_id}")
async def verify_vote(voter_id: str):
    """Allow voter to verify their vote was recorded correctly"""
    try:
        # Get vote from database
        db_vote = supabase.table("votes").select("*").eq("user_id", voter_id).execute().data
        
        if not db_vote:
            return {"status": "error", "message": "No vote found"}
        
        vote = db_vote[0]
        vote_hash_db = vote.get("vote_hash")
        
        # Get vote hash from blockchain
        if contract_instance:
            try:
                vote_hash_bc = contract_instance.functions.getVoteHash(voter_id).call()
                
                if vote_hash_db == vote_hash_bc:
                    return {
                        "status": "success",
                        "message": "Vote verified successfully",
                        "vote_hash": vote_hash_db,
                        "tx_hash": vote.get("tx_hash"),
                        "timestamp": vote.get("timestamp"),
                        "verified": True
                    }
                else:
                    return {
                        "status": "error",
                        "message": "Vote hash mismatch - data integrity issue",
                        "db_hash": vote_hash_db,
                        "blockchain_hash": vote_hash_bc,
                        "verified": False
                    }
            except Exception as e:
                print(f"Blockchain verification error: {e}")
        
        return {
            "status": "success",
            "vote_hash": vote_hash_db,
            "tx_hash": vote.get("tx_hash"),
            "blockchain_unavailable": True
        }
        
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/api/update-db")
async def update_db_dummy(data: dict):
    return {"status": "ignored", "message": "Deprecated"}

@app.post("/api/reset-election")
async def reset_election():
    global contract_instance, CONTRACT_ADDRESS
    try:
        print("--- RESETTING ELECTION ---")
        
        # 1. Clear Database
        print("Clearing Votes in DB...")
        supabase.table("votes").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute() 
        
        print("Resetting Party Counts...")
        supabase.table("parties").update({"votes": 0}).neq("name", "PLACEHOLDER").execute()
        
        # 2. Redeploy Blockchain Contract
        # We must redeploy because we cannot clear the 'voters' mapping in Solidity easily.
        if w3:
            print("Redeploying Smart Contract...")
            try:
                # Deploy
                VotingSystem = w3.eth.contract(abi=CONTRACT_ABI, bytecode=CONTRACT_BYTECODE)
                tx_hash = VotingSystem.constructor("Tamil Nadu Election").transact({'from': ADMIN_ACCOUNT})
                tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
                
                new_address = tx_receipt.contractAddress
                print(f"New Contract Deployed at: {new_address}")
                
                # Update Global State
                CONTRACT_ADDRESS = new_address
                contract_instance = w3.eth.contract(address=new_address, abi=CONTRACT_ABI)
                
                # Save to File (for other scripts)
                try:
                    with open("contract_address.txt", "w") as f:
                        f.write(new_address)
                except Exception as fe:
                    print(f"Warning: Could not save address to file: {fe}")

                # 3. Resync Candidates
                print("Resyncing Candidates to New Contract...")
                parties = supabase.table("parties").select("*").order("id").execute().data
                for p in parties:
                     print(f"Adding Candidate: {p['name']}")
                     contract_instance.functions.addCandidate(p['name']).transact({'from': ADMIN_ACCOUNT})
                
                print("Blockchain Reset Complete.")
                
            except Exception as be:
                print(f"Blockchain Redeploy Failed: {be}")
                return {"error": f"DB Reset, but Blockchain Failed: {str(be)}"}
        else:
             print("Blockchain not connected, skipping redeploy.")

        return {"status": "success", "message": "Election data and Blockchain reset successfully"}
    except Exception as e:
        print(f"Reset Error: {e}")
        return {"error": str(e)}


# --- HELPERS ---

    # Calculate geometric feature vector (distances between key points normalized by face width)
    # Key points: Eyes, Nose, Mouth
    # 33=R_Eye_Inner, 263=L_Eye_Inner, 1=Nose_Tip, 61=Mouth_Left, 291=Mouth_Right
    points = [33, 263, 1, 61, 291, 199, 152] # Added Chin(152/199) for vertical scale
    
    coords = []
    for p in points:
        coords.append(np.array([landmarks[p].x * w, landmarks[p].y * h]))
    
    # Normalize by face width (Left Eye to Right Eye) to be scale invariant
    scale = np.linalg.norm(coords[0] - coords[1])
    if scale == 0: return None
    
    vector = []
    # Calculate all pairwise distances between key points
    for i in range(len(coords)):
        for j in range(i+1, len(coords)):
             dist = np.linalg.norm(coords[i] - coords[j])
             vector.append(dist / scale)
             
    return np.array(vector)

@app.post("/api/upload-id")
async def upload_id_card(file: UploadFile = File(...)):
    global CURRENT_USER_ID_ENCODING, CURRENT_USER_ID_VECTOR, CURRENT_USER_METHOD
    try:
        content = await file.read()
        nparr = np.frombuffer(content, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return {"status": "error", "message": "Could not decode image"}
            
        # Standardize size to avoid processing massive images
        # height, width = img.shape[:2]
        # if width > 1280:
        #    scale = 1280 / width
        #    img = cv2.resize(img, (0,0), fx=scale, fy=scale)
        
        h, w, _ = img.shape
        
        # Reset State
        CURRENT_USER_ID_ENCODING = None
        CURRENT_USER_ID_VECTOR = None
        CURRENT_USER_METHOD = None
        
        # --- STRATEGY 1: DLIB (Full Image) ---
        if USE_FACE_REC:
            try:
                rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                encs = face_recognition.face_encodings(rgb)
                if encs:
                    CURRENT_USER_ID_ENCODING = encs[0]
                    CURRENT_USER_METHOD = "DLIB"
                    print("ID Encoded: DLIB (Full)")
                    return {"status": "success", "message": "ID Encoded via Dlib"}
            except: pass

        # --- STRATEGY 2: MEDIAPIPE (Crop Search) ---
        # ID cards often have small faces. Searching crops helps the detector.
        
        crops = [
            ("Full", img),
            ("Left", img[0:h, 0:int(w*0.6)]),            # Left 60% (Most IDs)
            ("Right", img[0:h, int(w*0.4):w]),           # Right 60% (Some IDs)
            ("Center", img[0:h, int(w*0.2):int(w*0.8)]), # Center 60%
            ("Top-Left", img[0:int(h*0.6), 0:int(w*0.6)])# Top-Left Quadrant
        ]
        
        for name, crop_img in crops:
            if crop_img.shape[0] < 50 or crop_img.shape[1] < 50: continue
            
            crop_h, crop_w, _ = crop_img.shape
            rgb_crop = cv2.cvtColor(crop_img, cv2.COLOR_BGR2RGB)
            
            # Use the permissive detector
            mp_res = id_face_mesh.process(rgb_crop)
            
            if mp_res.multi_face_landmarks:
                 lm = mp_res.multi_face_landmarks[0].landmark
                 vec = get_geometric_vector(crop_img, lm, crop_w, crop_h)
                 
                 if vec is not None:
                     CURRENT_USER_ID_VECTOR = vec
                     CURRENT_USER_METHOD = "GEOMETRIC"
                     print(f"ID Encoded: GEOMETRIC (Found in {name} Crop)")
                     return {"status": "success", "message": f"ID Encoded via Geometry ({name})"}

        # --- STRATEGY 3: BYPASS (Failsafe) ---
        print("ID Encoded: BYPASS (Detection Failed)")
        CURRENT_USER_METHOD = "BYPASS" 
        return {"status": "success", "message": "ID Uploaded (Manual Verification Required)"}

    except Exception as e:
        print(f"Upload Error: {e}")
        return {"status": "error", "message": str(e)}

@app.post("/api/process-frame")
async def process_frame(file: UploadFile = File(...)):
    global CURRENT_USER_ID_ENCODING, CURRENT_USER_ID_VECTOR, CURRENT_USER_METHOD
    try:
        content = await file.read()
        nparr = np.frombuffer(content, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        h, w, _ = frame.shape
        
        results = {
            "faces_detected": 0,
            "phone_detected": False,
            "dark_surroundings": False,
            "suspicious_texture": False,
            "smile_detected": False,
            "blink_detected": False,
            "eyebrow_movement": False,
            "head_pose_good": False,
            "landmarks_consistent": False,
            "identity_verified": False,
            "processed_frame": ""
        }

        # ... (Previous checks: Dark, Texture, YOLO - KEEP SAME)
        if detect_darkness(frame): results["dark_surroundings"] = True
        if analyze_texture(frame): results["suspicious_texture"] = True
        if yolo_model:
            y_res = yolo_model(frame, verbose=False)
            for box in y_res[0].boxes:
                if int(box.cls) == 67 and box.conf > 0.5:
                    results["phone_detected"] = True

        # MediaPipe Processing
        # MediaPipe Processing
        if not ensure_face_mesh():
             results["processed_frame"] = base64.b64encode(cv2.imencode('.jpg', frame)[1]).decode('utf-8')
             return results

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_res = face_mesh.process(rgb)
        
        if mp_res.multi_face_landmarks:
            results["faces_detected"] = 1
            lm = mp_res.multi_face_landmarks[0].landmark
            
            # Draw Mesh
            mp.solutions.drawing_utils.draw_landmarks(
                image=frame,
                landmark_list=mp_res.multi_face_landmarks[0],
                connections=mp_face_mesh.FACEMESH_TESSELATION,
                landmark_drawing_spec=None,
                connection_drawing_spec=mp.solutions.drawing_styles.get_default_face_mesh_tesselation_style()
            )

            # Liveness Logic - RESTORED
            # Calculate Face Bounding Box for DeepFace Smile
            h_im, w_im, _ = frame.shape
            x_min, y_min = w_im, h_im
            x_max, y_max = 0, 0
            for l in lm:
                x, y = int(l.x * w_im), int(l.y * h_im)
                if x < x_min: x_min = x
                if x > x_max: x_max = x
                if y < y_min: y_min = y
                if y > y_max: y_max = y
            
            # Padding
            pad = 20
            x_min = max(0, x_min - pad)
            y_min = max(0, y_min - pad)
            x_max = min(w_im, x_max + pad)
            y_max = min(h_im, y_max + pad)

            ear = eye_aspect_ratio(lm, w, h)
            results["blink_detected"] = ear < 0.22
            results["smile_detected"] = check_smile(frame, x_min, y_min, x_max - x_min, y_max - y_min)
            results["eyebrow_movement"] = check_eyebrow(lm, w, h)
            results["head_pose_good"] = check_head_pose(lm, w, h)
            results["landmarks_consistent"] = check_landmark_consistency(lm)
            
            # Draw Mesh
            mp.solutions.drawing_utils.draw_landmarks(
                image=frame,
                landmark_list=mp_res.multi_face_landmarks[0],
                connections=mp_face_mesh.FACEMESH_TESSELATION,
                landmark_drawing_spec=None,
                connection_drawing_spec=mp.solutions.drawing_styles.get_default_face_mesh_tesselation_style()
            )

        _, buffer = cv2.imencode('.jpg', frame)
        results["processed_frame"] = base64.b64encode(buffer).decode('utf-8')
        return results

    except Exception as e:
        ensure_face_mesh() # Attempt re-init
        return {"error": str(e)}

# --- NEW: Store Live Reference Face ---
@app.post("/api/biometric-verification")
async def biometric_verification(
    live_image: UploadFile = File(...),
    voter_id: str = Form(...)
):
    voter_id = voter_id.strip() # Clean input
    print(f"\n--- [Biometric Verification] Request Received for Voter: {voter_id} ---")
    try:
        # 1. Fetch User from DB (Sync Check)
        print(f"Fetching user record for {voter_id}...")
        res = supabase.table("users").select("*").eq("voter_id", voter_id).execute()
        if not res.data or len(res.data) == 0:
            print(f"ERROR: Voter ID '{voter_id}' NOT FOUND in retrieval.")
            return {"status": "error", "message": f"Voter ID '{voter_id}' NOT FOUND."}
        
        user_record = res.data[0]
        stored_photo_b64 = user_record.get("photo_base64")
        
        if not stored_photo_b64:
             print("ERROR: No stored photo for this voter.")
             return {"status": "error", "message": "No photo registered for this voter. Contact Admin."}

        # 2. Decode Stored Photo
        print("Decoding stored reference photo...")
        try:
             # Remove header if present (data:image/jpeg;base64,...)
             if "," in stored_photo_b64:
                 stored_photo_b64 = stored_photo_b64.split(",")[1]
             
             stored_bytes = base64.b64decode(stored_photo_b64)
             nparr_stored = np.frombuffer(stored_bytes, np.uint8)
             stored_frame = cv2.imdecode(nparr_stored, cv2.IMREAD_COLOR)
             if stored_frame is None: raise Exception("Invalid stored image")
             print(f"Stored Photo Decoded: {stored_frame.shape}")
        except Exception as e:
             print(f"ERROR: Corrupt stored biometric data. {e}")
             return {"status": "error", "message": "Corrupt stored biometric data."}

        # 3. Process Live Image
        print("Processing live camera frame...")
        live_content = await live_image.read()
        nparr_live = np.frombuffer(live_content, np.uint8)
        live_frame = cv2.imdecode(nparr_live, cv2.IMREAD_COLOR)
        print(f"Live Frame Decoded: {live_frame.shape}")
        
        # --- STRATEGY 1: DeepFace (Deep Learning - Most Robust) ---
        if DeepFace is not None:
            try:
                # model_name options: VGG-Face, Facenet, OpenFace, etc. VGG-Face is default.
                # enforce_detection=False allows it to run even if it's not 100% sure a face is there (good for low quality)
                # but we want safety. Let's try with detection first.
                print("Attempting DeepFace Verification...")
                
                # DeepFace expects path or numpy array (BGR is fine for opencv backend usually, but RGB preferred)
                # DeepFace .verify handles BGR/RGB internal conversion often if numpy.
                
                result = DeepFace.verify(
                    img1_path=live_frame, 
                    img2_path=stored_frame, 
                    model_name='VGG-Face',
                    enforce_detection=False
                )
                
                print(f"DeepFace Result: {result}")
                
                if result['verified']:
                     return {
                         "status": "success", 
                         "message": "Identity Verified (Deep Neural Network)", 
                         "distance": result['distance'],
                         "user": user_record
                     }
            except Exception as e:
                print(f"DeepFace Strategy Failed: {e}")

        # --- STRATEGY 2: face_recognition (Dlib - High Accuracy) ---
        if USE_FACE_REC:
            try:
                print("Attempting Dlib verification...")
                # Convert BGR to RGB
                rgb_live = cv2.cvtColor(live_frame, cv2.COLOR_BGR2RGB)
                rgb_stored = cv2.cvtColor(stored_frame, cv2.COLOR_BGR2RGB)
                
                live_encs = face_recognition.face_encodings(rgb_live)
                stored_encs = face_recognition.face_encodings(rgb_stored)
                
                if live_encs and stored_encs:
                    # define tolerance (lower is stricter, 0.6 is standard, 0.4 is VERY STRICT)
                    match = face_recognition.compare_faces([stored_encs[0]], live_encs[0], tolerance=0.4)
                    dist = face_recognition.face_distance([stored_encs[0]], live_encs[0])[0]
                    
                    if match[0]:
                        return {
                            "status": "success", 
                            "message": "Identity Verified (Dlib Biometrics - Strict)", 
                            "distance": float(dist),
                            "user": user_record
                        }
                    else:
                        print(f"Dlib Mismatch. Dist: {dist} (Must be < 0.4)")
            except Exception as e:
                print(f"Dlib Strategy Failed: {e}")

        # --- STRATEGY 3: Geometric (MediaPipe Fallback) ---
        print("Falling back to STRATEGY 3: Geometric Analysis...")
        live_vec = calculate_face_vector(live_frame)
        stored_vec = calculate_face_vector(stored_frame)

        if live_vec is not None and stored_vec is not None:
            # 5. Compare
            dist = np.linalg.norm(live_vec - stored_vec)
            print(f"Geometric Distance: {dist:.4f} (Strict Threshold: 0.15)")
            
            # Threshold - STRICTER (0.15)
            if dist < 0.15:
                 print("Geometric VERIFIED!")
                 return {
                     "status": "success", 
                     "message": "Identity Verified Successfully", 
                     "distance": float(dist),
                     "user": user_record
                 }
            else:
                 print("Geometric MISMATCH!")
        else:
            print("Geometric Analysis Failed (No Face Detected in one or both images).")

        # --- STRATEGY 4: OpenCV Histogram Analysis (Final Fallback) ---
        print("Attempting STRATEGY 4: Basic Structural Analysis (OpenCV)...")
        
        gray_live = cv2.cvtColor(live_frame, cv2.COLOR_BGR2GRAY)
        gray_stored = cv2.cvtColor(stored_frame, cv2.COLOR_BGR2GRAY)
        
        hist_live = cv2.calcHist([gray_live], [0], None, [256], [0, 256])
        hist_stored = cv2.calcHist([gray_stored], [0], None, [256], [0, 256])
        
        cv2.normalize(hist_live, hist_live, 0, 1, cv2.NORM_MINMAX)
        cv2.normalize(hist_stored, hist_stored, 0, 1, cv2.NORM_MINMAX)
        
        score = cv2.compareHist(hist_live, hist_stored, cv2.HISTCMP_CORREL)
        
        print(f"--- COMPARISON PROOF ---")
        print(f"Method: Histogram Correlation")
        print(f"Score: {score:.4f} (Strict Threshold: > 0.98)")
        print(f"------------------------")
        
        # Extremely strict fallback. 46% should FAIL. 98% required.
        if score > 0.98:
             return {
                 "status": "success",
                 "message": "Identity Verified (Basic Structural)",
                 "distance": 1.0 - score,
                 "user": user_record
             }
        else:
             return {"status": "error", "message": f"Biometric Mismatch. Score: {score:.2f} (Required > 0.98)"}

    except Exception as e:
        print(f"CRITICAL EXCEPTION in Verification: {e}")
        return {"status": "error", "message": str(e)}

# Deprecated old endpoints
@app.post("/api/set-live-reference")
async def set_live_reference_deprecated(file: UploadFile = File(...)):
    return {"status": "ignored", "message": "Use /api/biometric-verification"}

@app.post("/api/verify-id-match")
async def verify_id_match_deprecated(file: UploadFile = File(...)):
     return {"status": "ignored", "message": "Use /api/biometric-verification"}

@app.get("/api/debug-scheduler")
async def debug_scheduler():
    try:
        res = supabase.table("settings").select("*").single().execute()
        s = res.data
        start_str = s.get("start_time")
        
        now_sys = datetime.now()
        debug_info = {
            "system_time_raw": str(now_sys),
            "db_start_str": start_str,
            "is_active_db": s.get("is_active")
        }
        
        if start_str:
            start_dt_utc = dateutil.parser.isoparse(start_str)
            # transform to system local
            start_dt_local = start_dt_utc.astimezone(None).replace(tzinfo=None)
            
            debug_info["start_dt_local"] = str(start_dt_local)
            debug_info["comparison_now_ge_start"] = (now_sys >= start_dt_local)
            
            # Try the update check
            if now_sys >= start_dt_local and not s.get("is_active"):
                # Force update here to see if it works via API
                upd = supabase.table("settings").update({"is_active": True}).eq("id", 1).execute()
                debug_info["attempted_force_update"] = upd.data
                
        return debug_info
    except Exception as e:
        return {"error": str(e)}

# --- BACKGROUND SCHEDULER (IST) ---
IST = timezone(timedelta(hours=5, minutes=30))

async def election_scheduler():
    """Checks every 3 seconds to auto-start/stop election using STRICT UTC COMPARISON."""
    print("Background Scheduler Started (UTC Mode).")
    while True:
        try:
            # Check DB settings
            res = supabase.table("settings").select("*").single().execute()
            if res.data:
                s = res.data
                is_active = bool(s.get("is_active"))
                start_str = s.get("start_time")
                end_str = s.get("end_time")
                
                # 1. Get Current UTC Time
                now_utc = datetime.now(timezone.utc)

                if start_str:
                    try:
                        # Parse DB Time (Already UTC ISO from Frontend)
                        start_dt = dateutil.parser.isoparse(start_str)
                        
                        # Logic 1: Auto-Start
                        # Direct UTC comparison. Handles all offsets correctly.
                        if now_utc >= start_dt and not is_active:
                             # Check End Time safety
                             passed_end = False
                             if end_str:
                                 end_dt = dateutil.parser.isoparse(end_str)
                                 if now_utc >= end_dt: passed_end = True
                             
                             if not passed_end:
                                print(f"!!! AUTO-START TRIGGERED (UTC match) !!!")
                                supabase.table("settings").update({"is_active": True}).eq("id", 1).execute()
                                
                    except Exception as pe:
                        print(f"Scheduler Parse Error (Start): {pe}")

                if end_str:
                    try:
                        end_dt = dateutil.parser.isoparse(end_str)
                        
                        # Logic 2: Auto-Stop
                        if now_utc >= end_dt and is_active:
                            print(f"!!! AUTO-STOP TRIGGERED (UTC match) !!!")
                            supabase.table("settings").update({"is_active": False}).eq("id", 1).execute()
                    except Exception as pe:
                        print(f"Scheduler Parse Error (End): {pe}")
                            
            await asyncio.sleep(3)
        except Exception as e:
            print(f"Scheduler Error: {e}")
            await asyncio.sleep(3)

@app.on_event("startup")
async def startup_event():
    """Validate environment and start background tasks"""
    # Validate environment variables
    try:
        validate_environment()
        print("✅ Environment validation passed")
    except Exception as e:
        print(f"⚠️  Environment validation warning: {e}")
    
    # Start election scheduler
    asyncio.create_task(election_scheduler())

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=5000)
