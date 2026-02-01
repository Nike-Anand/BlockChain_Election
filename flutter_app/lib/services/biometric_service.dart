import 'dart:typed_data';
import 'package:camera/camera.dart';

class BiometricService {
  static Future<List<CameraDescription>> getAvailableCameras() async {
    return await availableCameras();
  }

  static Future<Map<String, dynamic>> processFrame(CameraImage cameraImage) async {
    // Simplified processing - just simulate face detection
    await Future.delayed(Duration(milliseconds: 100));
    
    return {
      'faces_detected': 1,
      'blink_detected': DateTime.now().millisecond % 3 == 0,
      'smile_detected': DateTime.now().millisecond % 4 == 0,
      'head_pose_good': true,
      'landmarks_consistent': true,
    };
  }

  static Future<Uint8List> captureImage(CameraController controller) async {
    try {
      final XFile imageFile = await controller.takePicture();
      return await imageFile.readAsBytes();
    } catch (e) {
      throw Exception('Failed to capture image: $e');
    }
  }

  static void dispose() {
    // No cleanup needed for simplified version
  }
}