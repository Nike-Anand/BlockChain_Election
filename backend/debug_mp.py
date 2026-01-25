import sys
import mediapipe
print(f"Mediapipe file: {mediapipe.__file__}")
from mediapipe.python import solutions
print("Imported solutions explicitly")
print(dir(solutions))
