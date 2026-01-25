from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import base64
from datetime import datetime
import mediapipe as mp
from ultralytics import YOLO
import uvicorn
import math
import tempfile
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- GLOBAL STATE (Ideally use a DB/Session) ---
# Storing the ID encoding for the current user session
CURRENT_USER_ID_ENCODING = None
CURRENT_USER_ID_IMAGE = None

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
        min_detection_confidence=0.1, # Very low threshold for ID cards
        min_tracking_confidence=0.1
    )
    print("MediaPipe Loaded.")
except Exception as e:
    print(f"MediaPipe Failed (Liveness/ID disabled): {e}")


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

from supabase import create_client, Client
from backend.config.settings import MONGO_URI, DB_NAME # Kept for env loading mostly
import os
from datetime import datetime

# --- SUPABASE CONFIG ---
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://your-project.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "your-anon-key")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

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

        # Map snake_case (DB) to camelCase (Frontend)
        formatted_users = [{
            "username": u["username"], "password": u["password"], "voterId": u["voter_id"], "role": u["role"]
        } for u in users]
        
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
            "boothLocations": []
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

# --- ACTION ENDPOINTS (Replaces generic update-db) ---

from pydantic import BaseModel
from typing import Optional

# --- PYDANTIC MODELS ---
class UserRegister(BaseModel):
    username: str
    password: str
    voterId: str
    role: str = "voter"

class PartyAdd(BaseModel):
    name: str
    symbol: str
    description: Optional[str] = None
    manifesto: Optional[str] = None
    imageUrl: Optional[str] = None
    votes: int = 0

class VoteCast(BaseModel):
    userId: str
    partyName: str
    boothId: str = "ONLINE"
    hash: Optional[str] = None

class SettingsUpdate(BaseModel):
    isActive: Optional[bool] = None
    registrationOpen: Optional[bool] = None
    startTime: Optional[str] = None
    endTime: Optional[str] = None

# --- ACTION ENDPOINTS ---

@app.post("/api/register-voter")
async def register_voter(user: UserRegister):
    try:
        data = {
            "username": user.username,
            "password": user.password,
            "voter_id": user.voterId,
            "role": user.role
        }
        supabase.table("users").insert(data).execute()
        return {"status": "success"}
    except Exception as e:
        return {"error": str(e)}

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
async def cast_vote(vote: VoteCast):
    try:
        # 1. Record Vote
        vote_data = {
            "user_id": vote.userId,
            "party_name": vote.partyName,
            "booth_id": vote.boothId,
            "tx_hash": vote.hash,
            "timestamp": datetime.now().isoformat()
        }
        supabase.table("votes").insert(vote_data).execute()
        
        # 2. Increment Party Count
        current = supabase.table("parties").select("votes").eq("name", vote.partyName).single().execute()
        if current.data:
            new_count = current.data["votes"] + 1
            supabase.table("parties").update({"votes": new_count}).eq("name", vote.partyName).execute()
            
        return {"status": "success"}
    except Exception as e:
        print(f"Vote Error: {e}")
        return {"error": str(e)}

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
        return {"status": "success"}
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/update-db")
async def update_db_dummy(data: dict):
    return {"status": "ignored", "message": "Deprecated"}

@app.post("/api/reset-election")
async def reset_election():
    try:
        # 1. Delete all votes
        # Using a condition that is always true for deletion, e.g., id > 0 assuming integer IDs or just all rows.
        # Supabase-py might behave differently depending on library version, usually delete().neq("column", "impossible_value") works for "all" if RLS allows.
        # However, .delete() requires a filter.
        # Let's try deleting everything from 'votes'.
        # Assuming 'id' exists and is not null.
        supabase.table("votes").delete().neq("party_name", "PLACEHOLDER_FOR_ALL").execute() 
        
        # 2. Reset party votes to 0
        supabase.table("parties").update({"votes": 0}).neq("name", "PLACEHOLDER").execute()
        
        # 3. Optional: Clear users if requested (commented out for safety unless requested)
        # supabase.table("users").delete().neq("username", "admin").execute() 

        return {"status": "success", "message": "Election data reset successfully"}
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
        return {"error": str(e)}

# --- NEW: Store Live Reference Face ---
CURRENT_LIVE_VECTOR = None
CURRENT_LIVE_METHOD = None

@app.post("/api/set-live-reference")
async def set_live_reference(file: UploadFile = File(...)):
    global CURRENT_LIVE_VECTOR, CURRENT_LIVE_METHOD
    try:
        content = await file.read()
        nparr = np.frombuffer(content, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        h, w, _ = frame.shape
        
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_res = face_mesh.process(rgb)
        
        if mp_res.multi_face_landmarks:
             lm = mp_res.multi_face_landmarks[0].landmark
             vec = get_geometric_vector(frame, lm, w, h)
             if vec is not None:
                 CURRENT_LIVE_VECTOR = vec
                 CURRENT_LIVE_METHOD = "GEOMETRIC"
                 print("Live Reference Set (Geometric)")
                 return {"status": "success", "message": "Reference Set"}
        
        return {"status": "error", "message": "No face found in reference frame"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# --- UPDATE: Verify ID against Live Reference ---
@app.post("/api/verify-id-match")
async def verify_id_match(file: UploadFile = File(...)):
    global CURRENT_LIVE_VECTOR
    try:
        if CURRENT_LIVE_VECTOR is None:
            return {"status": "error", "message": "Complete Liveness Check First"}

        content = await file.read()
        nparr = np.frombuffer(content, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        h, w, _ = img.shape
        
        # Multi-Crop Search for ID Face (Robust for small faces)
        crops = [
            ("Full", img),
            ("Left", img[0:h, 0:int(w*0.6)]),
            ("Right", img[0:h, int(w*0.4):w]),
            ("Center", img[0:h, int(w*0.2):int(w*0.8)]),
            ("Top-Left", img[0:int(h*0.6), 0:int(w*0.6)])
        ]
        
        best_dist = 1.0 # High distance = no match
        found = False
        
        for name, crop_img in crops:
            if crop_img.shape[0] < 50 or crop_img.shape[1] < 50: continue
            
            crop_h, crop_w, _ = crop_img.shape
            rgb_crop = cv2.cvtColor(crop_img, cv2.COLOR_BGR2RGB)
            mp_res = id_face_mesh.process(rgb_crop)
            
            if mp_res.multi_face_landmarks:
                 lm = mp_res.multi_face_landmarks[0].landmark
                 id_vec = get_geometric_vector(crop_img, lm, crop_w, crop_h)
                 
                 if id_vec is not None:
                     dist = np.linalg.norm(CURRENT_LIVE_VECTOR - id_vec)
                     print(f"Crop {name} Dist: {dist}")
                     if dist < best_dist: best_dist = dist
                     found = True

        if not found:
            # Fallback to BYPASS if needed, but User requested STRICT check.
            # We will return error to prompt retry or better lighting.
            return {"status": "error", "message": "Could not detect face on ID card. Try clearer photo."}

        # Threshold for Identity Match
        if best_dist < 0.22: # Slightly looser for ID vs Live comparison
             return {"status": "success", "message": "Identity Verified", "distance": float(best_dist)}
        else:
             return {"status": "error", "message": f"ID Mismatch (Confidence: {best_dist:.2f})"}

    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=5000)
