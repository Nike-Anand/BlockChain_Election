try:
    import mediapipe as mp
    print(f"Mediapipe version: {mp.__version__}")
    print(f"Solutions available: {dir(mp.solutions)}")
    mp_face_mesh = mp.solutions.face_mesh
    print("✅ Mediapipe Solutions Loaded Successfully")
except Exception as e:
    print(f"❌ Mediapipe Error: {e}")
    import traceback
    traceback.print_exc()
