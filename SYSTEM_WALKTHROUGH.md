# Online Election System: Complete Functional Overview

This document details the end-to-end functionality of the Online Election System, explaining technical processes, data flows, and security measures.

## 1. System Architecture
- **Frontend:** React + Vite (Typescript)
- **Backend:** Python FastAPI
- **Database:** Supabase (PostgreSQL)
- **Blockchain:** Ganache (Ethereum Testnet) + Web3.py
- **Biometrics:** MediaPipe, Face Recognition (Dlib), OpenCV

---

## 2. Admin Workflow
### A. Admin Login
- User enters `admin` / `123`.
- Validated against Supabase `users` table via `/api/get-db` fetch in `useElection` hook.

### B. Election Management (Admin Dashboard)
1.  **Add Party:**
    - Admin enters Party Name, Symbol, etc.
    - **Database:** inserted into `parties` table.
    - **Blockchain:** `sync_candidates.py` (or manual trigger) adds the party to the Smart Contract using `addCandidate()`.
2.  **Register Voter:**
    - Admin enters Name, Voter ID, Password.
    - **Uploads Photo:** This specific photo is stored as a Base64 string in Supabase. It acts as the "Ground Truth" for facial verification.
    - **Database:** User record created in `users` table.

---

## 3. Voter Workflow (The Core Journey)

### A. Login & CSV Verification
1.  **Input:** Voter enters EPIC Number (e.g., `KCX2739035`) and Password.
2.  **CSV Check (`verifyVoter` util):**
    - The system loads `voter_list_final.csv` (client-side).
    - It searches for the EPIC number.
    - **Logic:** Handles uppercase/lowercase, trims whitespace, and ignores hidden headers.
    - **Result:** If found, returns the Voter's Name. If not, blocks login.
3.  **Database Check:**
    - Checks Supabase `users` to ensure the voter is actively registered by the Admin and has a password.

### B. Liveness & Biometric Verification
Before voting, the user must prove they are physically present and match the ID.

1.  **Liveness Check (MediaPipe Mesh):**
    - **Blink Detection:** Tracks Eye Aspect Ratio (EAR). Request blink (< 0.22 threshold).
    - **Smile Detection:** Tracks mouth width. Request smile (> 0.65 threshold).
    - Ensures the user is a real person, not a static photo.

2.  **Facial Matching (Backend `/api/biometric-verification`):**
    - The live image from the webcam is sent to the backend.
    - The backend retrieves the **Stored Photo** for that Voter ID from Supabase.
    - **Strategy 1 (Dlib/Face_Rec):** Strict comparison (Tolerance 0.4). Best for high accuracy.
    - **Strategy 2 (Geometric - MediaPipe):** Calculates vector distances between key face features (Eyes, nose, chin). Strict Threshold (0.15).
    - **Strategy 3 (OpenCV Histogram):** Fallback structure check. Strict Threshold (Score > 0.85).
    - **Result:** If ANY strategy passes the strict threshold, verification succeeds.

### C. Secure Voting (Blockchain)
1.  **Voting Booth:**
    - User selects a party (e.g., "Tamilaga Vettri Kazhagam").
    - Clicks "Cast Vote".
2.  **Backend Processing (`/api/cast-vote`):**
    - **Smart Contract Call:**
        - Calls `vote(candidateId, voterID)` on the deployed Ethereum contract.
        - **Gas Payer:** Admin Account (`0x79B...` on Ganache).
    - **Transaction Hashing:**
        - Ganache mines the block and returns a unique **Transaction Hash** (e.g., `0x92aff...`).
    - **Persistence:**
        - **Database:** Stores `user_id`, `party_name`, and the `tx_hash` in Supabase `votes` table.
        - **Blockchain:** Stores the vote count immutably on the ledger.
3.  **Vote Success:**
    - The user sees the green success screen.
    - **Proof:** The Transaction Hash is displayed, which they can verify against the blockchain (Proof of Vote).

---

## 4. Security Features
- **One Voter, One Vote:** Enforced by both Database (frontend check) and Blockchain (Smart Contract reverts if ID already voted).
- **Biometric Lock:** No one can vote without strict facial verification (95%+ match required).
- **Immutable Ledger:** Even if the database is wiped, the Blockchain retains the true vote counts.
- **CSV Validation:** Ensures only users present in the official Electoral Roll can assume an identity.
