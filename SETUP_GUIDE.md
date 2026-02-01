# Online Election System - Setup Guide

Complete guide to set up and run the blockchain-based online election system with biometric verification.

## System Architecture

- **Frontend:** React + Vite (TypeScript)
- **Backend:** Python FastAPI  
- **Database:** Supabase (PostgreSQL)
- **Blockchain:** Ganache (Ethereum Testnet)
- **Biometrics:** MediaPipe, DeepFace, OpenCV

---

## Prerequisites

### Required Software
- ✅ **Node.js** (v16 or higher) and **npm**
- ✅ **Python 3.8+** (Python 3.13 recommended)
- ✅ **Ganache** - Ethereum local blockchain
- ✅ **Supabase Account** - For PostgreSQL database

### Optional (for enhanced biometric verification)
- **Visual Studio Build Tools** (Windows) - For `face_recognition` library with dlib
  - If not installed, the system will use geometric fallback (still functional)

---

## Installation Steps

### 1. Clone and Install Frontend Dependencies

```bash
cd c:\D\Projects\icube\online-election
npm install
```

### 2. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

**Additional dependencies:**
```bash
pip install ultralytics python-dotenv supabase web3
pip install --force-reinstall mediapipe
```

**Optional (requires C++ build tools):**
```bash
pip install deepface tf-keras face_recognition
```

> [!NOTE]
> If `face_recognition` fails to install due to missing C++ build tools, the system will still work using geometric fallback for facial verification.

---

## Database Setup (Supabase)

### Step 1: Access Supabase Dashboard

1. Go to your Supabase project: https://vvyuhplekvizscvovral.supabase.co
2. Navigate to **SQL Editor** in the left sidebar

### Step 2: Execute Database Schema

1. Open the file: `backend/supabase_setup.sql`
2. Copy the entire SQL content
3. Paste into the Supabase SQL Editor
4. Click **Run** to execute

This creates:
- `users` table (voters, admins, commission)
- `parties` table (political parties)
- `votes` table (voting ledger with blockchain hashes)
- `settings` table (election configuration)
- Default admin user: `admin` / `123`
- 4-factor authorization key holders

### Step 3: Verify Tables Created

In Supabase dashboard:
1. Go to **Table Editor**
2. Confirm you see: `users`, `parties`, `votes`, `settings`
3. Check `users` table contains the admin user

---

## Blockchain Setup (Ganache)

### Step 1: Start Ganache

1. Open **Ganache** application
2. Create or open workspace named "ELECTION"
3. Ensure it's running on: `http://127.0.0.1:7545`
4. Note: The system will automatically use the first account from Ganache

### Step 2: Deploy Smart Contract

```bash
cd c:\D\Projects\icube\online-election
python deploy_contract.py
```

**Expected output:**
```
Using account: 0x324E437aFF7805644Eb8738061ec95cFe82a873A
Deploying Contract...
Contract Deployed At: 0xF21E84d639A186fD048eb5b7Dc91714AD97835cF
Address saved to contract_address.txt
```

The contract address is automatically saved to `contract_address.txt`.

---

## Running the Application

### Step 1: Start Backend Server

```bash
cd c:\D\Projects\icube\online-election\backend
uvicorn app:app --reload --port 8000
```

**Expected console output:**
```
Initializing Models...
YOLO Loaded.
MediaPipe Loaded Successfully.
Connecting to Supabase: https://vvyuhplekvizscvovral.supabase.co
Connected to Ganache: http://127.0.0.1:7545
Using Ganache account: 0x324E437aFF7805644Eb8738061ec95cFe82a873A
Loaded Contract Address: 0xF21E84d639A186fD048eb5b7Dc91714AD97835cF
```

Backend API will be available at: **http://localhost:8000**

### Step 2: Start Frontend

Open a **new terminal**:

```bash
cd c:\D\Projects\icube\online-election
npm run dev
```

Frontend will be available at: **http://localhost:5173**

---

## Using the Application

### Admin Access
1. Navigate to `http://localhost:5173`
2. Login with:
   - **Username:** `admin`
   - **Password:** `123`

### Admin Functions
- **Add Political Parties:** Register parties with name, symbol, description
- **Register Voters:** Add voters with EPIC number, password, and photo (for biometric verification)
- **Manage Election:** Start/stop voting, view results

### Voter Access
1. Login with EPIC number (from CSV) and password
2. Complete biometric verification:
   - **Liveness check:** Blink and smile detection
   - **Facial matching:** Against stored photo (95%+ match required)
3. Cast vote for a party
4. Receive blockchain transaction hash as proof

---

## Troubleshooting

### Backend Issues

**Error: `ModuleNotFoundError: No module named 'backend'`**
- **Solution:** Make sure you're running `uvicorn` from the `backend` directory
- Fixed in latest code with relative imports

**Error: `sender account not recognized` (Ganache)**
- **Solution:** The code now automatically uses the first Ganache account
- Ensure Ganache is running on `http://127.0.0.1:7545`

**Error: `MediaPipe has no 'solutions' attribute`**
- **Solution:** Reinstall MediaPipe: `pip install --force-reinstall mediapipe`

**Error: `No module named 'supabase'`**
- **Solution:** Install Supabase client: `pip install supabase`

### Frontend Issues

**Error: `Cannot connect to backend`**
- Ensure backend is running on port 8000
- Check CORS settings in `backend/app.py`

**Error: `Voter not found in CSV`**
- Ensure `csv/voter_list_final.csv` exists and contains the EPIC number
- Check for whitespace or case sensitivity issues

### Database Issues

**Error: `Table does not exist`**
- Run the SQL schema in Supabase dashboard
- Verify tables are created in Table Editor

**Error: `Connection refused to Supabase`**
- Check `backend/.env` has correct Supabase URL and API key
- Verify Supabase project is active

---

## Environment Configuration

The `backend/.env` file contains:

```env
SUPABASE_URL=https://vvyuhplekvizscvovral.supabase.co
SUPABASE_KEY=sb_publishable_UwsyoFTLKb1WCOZZuZXlWw_CcvrP-TJ
ENCRYPTION_KEY=n8fsqUJ0KobNNTCsTNucxOtJyCPhzVwe4oKASlNBka0=
```

> [!WARNING]
> Never commit `.env` files to version control. These contain sensitive credentials.

---

## Key Features

✅ **Blockchain-based voting** - Immutable vote storage on Ethereum  
✅ **Biometric verification** - Liveness detection + facial matching  
✅ **One voter, one vote** - Enforced by smart contract  
✅ **Transaction hash proof** - Verifiable vote receipt  
✅ **End-to-end encryption** - Vote choices encrypted in database  
✅ **Real-time results** - Available to election commission after voting ends

---

## Testing the System

### Quick Test Checklist

1. ✅ Ganache running on port 7545
2. ✅ Smart contract deployed successfully
3. ✅ Supabase tables created
4. ✅ Backend starts without errors
5. ✅ Frontend loads successfully
6. ✅ Admin can login
7. ✅ Can add a test party
8. ✅ Can register a test voter
9. ✅ Voter can login and complete biometric verification
10. ✅ Vote is recorded with blockchain transaction hash

---

## Next Steps

After successful setup:

1. **Seed Political Parties:**
   ```bash
   cd c:\D\Projects\icube\online-election
   python seed_parties.py
   ```

2. **Sync Candidates to Blockchain:**
   ```bash
   python sync_candidates.py
   ```

3. **Configure Election Settings:**
   - Set start/end times
   - Enable/disable registration
   - Activate voting

---

## Support

For issues or questions:
- Check the `SYSTEM_WALKTHROUGH.md` for detailed system architecture
- Review backend logs in the terminal
- Check Ganache for blockchain transactions
- Verify Supabase tables in the dashboard
