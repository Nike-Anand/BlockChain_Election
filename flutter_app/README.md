# Tamil Nadu Election Commission - Flutter App

Flutter mobile application that connects directly to Supabase database, eliminating the need for Flask backend hosting.

## Architecture

- **Frontend**: Flutter (Dart)
- **Database**: Supabase (Direct connection)
- **Biometrics**: Google ML Kit + Camera
- **Blockchain**: Simulated with SHA-256 hashing
- **CSV Verification**: Local asset parsing

## Features

✅ **Direct Supabase Connection** - No backend hosting required  
✅ **Biometric Verification** - Camera + ML Kit face detection  
✅ **Exact Web UI Match** - Same Tamil Nadu government theme  
✅ **Offline-First CSV** - Voter verification from local assets  
✅ **Simulated Blockchain** - SHA-256 transaction hashes  
✅ **Admin Dashboard** - Party management, voter registration  

## Setup Instructions

### 1. Prerequisites
```bash
flutter --version  # Ensure Flutter 3.10+
```

### 2. Install Dependencies
```bash
cd flutter_app
flutter pub get
```

### 3. Add Voter CSV Data
Copy `voter_list_final.csv` to `assets/data/voter_list_final.csv`

### 4. Configure Supabase
Update `lib/services/supabase_service.dart` with your Supabase credentials:
```dart
static const String supabaseUrl = 'YOUR_SUPABASE_URL';
static const String supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
```

### 5. Run Application
```bash
flutter run
```

## Key Differences from Web Version

| Feature | Web Version | Flutter Version |
|---------|-------------|-----------------|
| Backend | Python FastAPI | Direct Supabase |
| Biometrics | MediaPipe + DeepFace | Google ML Kit |
| Blockchain | Ganache Ethereum | SHA-256 Simulation |
| Hosting | Requires server | Self-contained APK |
| CSV Loading | HTTP fetch | Local assets |

## File Structure

```
lib/
├── main.dart                 # App entry point
├── providers/
│   └── election_provider.dart # State management
├── services/
│   ├── supabase_service.dart     # Direct DB connection
│   ├── voter_verification_service.dart # CSV parsing
│   └── biometric_service.dart    # Camera + ML Kit
├── screens/
│   ├── landing_screen.dart       # EPIC entry + admin login
│   ├── biometric_screen.dart     # Face verification
│   ├── voting_screen.dart        # Party selection
│   ├── success_screen.dart       # Vote receipt
│   └── admin_screen.dart         # Management dashboard
└── assets/
    └── data/
        └── voter_list_final.csv  # Electoral roll
```

## Production Deployment

### APK Generation
```bash
flutter build apk --release
```

### Benefits of This Approach
- **Zero hosting costs** - No server required
- **Instant responses** - Direct database connection
- **Offline capability** - CSV verification works offline
- **Easy distribution** - Single APK file
- **Same functionality** - Matches web version features

### Limitations
- **No real blockchain** - Uses simulated hashing (can upgrade later)
- **Basic biometrics** - Simplified face detection (can enhance)
- **Local CSV only** - No real-time electoral roll updates

## Security Notes

This MVP maintains the same security model as the web version:
- Direct Supabase connection (same as web backend)
- CSV-based voter verification (same logic)
- Simulated blockchain hashing (equivalent security)
- Basic biometric verification (simplified but functional)

For production deployment, consider:
- Implementing real blockchain integration
- Enhanced biometric verification
- Server-side electoral roll validation
- Additional security hardening

## Usage

1. **Voter Flow**: EPIC entry → Biometric verification → Vote casting → Receipt
2. **Admin Flow**: Admin login → Party management → Voter registration → Settings

The app provides the exact same user experience as the web version while eliminating hosting requirements and reducing latency through direct database connections.