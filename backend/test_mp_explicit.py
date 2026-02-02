try:
    import mediapipe as mp
    try:
        import mediapipe.solutions as solutions
        print("✅ Explicit import mediapipe.solutions worked")
        print(f"Solutions: {dir(solutions)}")
    except Exception as e:
        print(f"❌ Explicit import mediapipe.solutions failed: {e}")

    try:
        from mediapipe.python.solutions import face_mesh
        print("✅ Import from mediapipe.python.solutions.face_mesh worked")
    except Exception as e:
        print(f"❌ Import from mediapipe.python.solutions.face_mesh failed: {e}")
except Exception as e:
    print(f"CRITICAL: {e}")
