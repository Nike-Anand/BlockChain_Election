import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:provider/provider.dart';
import '../providers/election_provider.dart';
import '../services/biometric_service.dart';
import 'voting_screen.dart';

class BiometricScreen extends StatefulWidget {
  const BiometricScreen({super.key});

  @override
  State<BiometricScreen> createState() => _BiometricScreenState();
}

class _BiometricScreenState extends State<BiometricScreen> {
  CameraController? _controller;
  bool _isInitialized = false;
  bool _isProcessing = false;
  bool _blinkDetected = false;
  bool _smileDetected = false;
  bool _verificationComplete = false;
  String _instruction = 'Position your face in the frame';
  String? _cameraError;

  @override
  void initState() {
    super.initState();
    _initializeCamera();
  }

  Future<void> _initializeCamera() async {
    try {
      final cameras = await BiometricService.getAvailableCameras();
      if (cameras.isEmpty) {
        setState(() {
          _cameraError = 'No camera found on this device';
        });
        return;
      }
      
      _controller = CameraController(
        cameras.first,
        ResolutionPreset.medium,
        enableAudio: false,
      );
      
      await _controller!.initialize();
      setState(() => _isInitialized = true);
      _startLivenessCheck();
    } catch (e) {
      print('Camera initialization error: $e');
      setState(() {
        _cameraError = 'Camera not available: ${e.toString().split(':').last}';
      });
    }
  }

  void _startLivenessCheck() {
    if (!_isInitialized || _controller == null) return;
    
    _controller!.startImageStream((CameraImage image) async {
      if (_isProcessing || _verificationComplete) return;
      
      _isProcessing = true;
      try {
        final results = await BiometricService.processFrame(image);
        
        if (mounted) {
          setState(() {
            if (results['blink_detected'] == true && !_blinkDetected) {
              _blinkDetected = true;
              _instruction = 'Great! Now smile for the camera';
            }
            
            if (results['smile_detected'] == true && _blinkDetected && !_smileDetected) {
              _smileDetected = true;
              _instruction = 'Perfect! Verifying identity...';
              _completeVerification();
            }
          });
        }
      } catch (e) {
        print('Frame processing error: $e');
      }
      _isProcessing = false;
    });
  }

  Future<void> _completeVerification() async {
    if (_verificationComplete) return;
    
    setState(() => _verificationComplete = true);
    await _controller?.stopImageStream();
    
    // Simulate biometric verification
    await Future.delayed(const Duration(seconds: 2));
    
    if (mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const VotingScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: const Color(0xFF003366),
        title: const Text('Biometric Verification'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Consumer<ElectionProvider>(
        builder: (context, provider, child) {
          return Column(
            children: [
              // Header Info
              Container(
                color: const Color(0xFF003366),
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    const Icon(Icons.face, color: Color(0xFFFF9933), size: 32),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Voter: ${provider.currentVoterName ?? "Unknown"}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            'ID: ${provider.currentVoterId ?? ""}',
                            style: const TextStyle(
                              color: Color(0xFFFF9933),
                              fontSize: 12,
                              fontFamily: 'monospace',
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              
              // Camera Preview
              Expanded(
                child: _cameraError != null
                  ? Center(
                      child: Container(
                        margin: const EdgeInsets.all(32),
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: Colors.red.withOpacity(0.1),
                          border: Border.all(color: Colors.red, width: 2),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.camera_alt_outlined,
                              color: Colors.red,
                              size: 64,
                            ),
                            const SizedBox(height: 16),
                            const Text(
                              'Camera Not Available',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              _cameraError!,
                              style: const TextStyle(
                                color: Colors.white70,
                                fontSize: 14,
                              ),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 24),
                            const Text(
                              'For web browsers:\n• Camera requires HTTPS or localhost\n• Grant camera permission when prompted\n• Check browser settings',
                              style: TextStyle(
                                color: Colors.white60,
                                fontSize: 12,
                              ),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 24),
                            ElevatedButton.icon(
                              onPressed: () {
                                // Skip biometric for testing
                                Navigator.pushReplacement(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => const VotingScreen(),
                                  ),
                                );
                              },
                              icon: const Icon(Icons.skip_next),
                              label: const Text('Skip Biometric (Testing Only)'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFFFF9933),
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 24,
                                  vertical: 16,
                                ),
                              ),
                            ),
                            const SizedBox(height: 12),
                            TextButton.icon(
                              onPressed: () {
                                setState(() {
                                  _cameraError = null;
                                });
                                _initializeCamera();
                              },
                              icon: const Icon(Icons.refresh),
                              label: const Text('Try Again'),
                              style: TextButton.styleFrom(
                                foregroundColor: Colors.white,
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                  : _isInitialized && _controller != null
                  ? Stack(
                      children: [
                        Center(
                          child: AspectRatio(
                            aspectRatio: _controller!.value.aspectRatio,
                            child: CameraPreview(_controller!),
                          ),
                        ),
                        
                        // Face Frame Overlay
                        Center(
                          child: Container(
                            width: 250,
                            height: 300,
                            decoration: BoxDecoration(
                              border: Border.all(
                                color: _verificationComplete 
                                  ? Colors.green 
                                  : Colors.white,
                                width: 3,
                              ),
                              borderRadius: BorderRadius.circular(150),
                            ),
                          ),
                        ),
                        
                        // Progress Indicators
                        Positioned(
                          bottom: 120,
                          left: 0,
                          right: 0,
                          child: Container(
                            margin: const EdgeInsets.symmetric(horizontal: 32),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.black.withOpacity(0.7),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Column(
                              children: [
                                Text(
                                  _instruction,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                                const SizedBox(height: 16),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                                  children: [
                                    _buildCheckItem('Blink', _blinkDetected),
                                    _buildCheckItem('Smile', _smileDetected),
                                    _buildCheckItem('Verify', _verificationComplete),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    )
                  : const Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          CircularProgressIndicator(color: Color(0xFFFF9933)),
                          SizedBox(height: 16),
                          Text(
                            'Initializing Camera...',
                            style: TextStyle(color: Colors.white),
                          ),
                        ],
                      ),
                    ),
              ),
              
              // Instructions
              Container(
                color: const Color(0xFF003366),
                padding: const EdgeInsets.all(16),
                child: const Text(
                  'Follow the instructions above to complete biometric verification',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildCheckItem(String label, bool completed) {
    return Column(
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: completed ? Colors.green : Colors.grey,
            shape: BoxShape.circle,
          ),
          child: Icon(
            completed ? Icons.check : Icons.circle_outlined,
            color: Colors.white,
            size: 20,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            color: completed ? Colors.green : Colors.grey,
            fontSize: 12,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  @override
  void dispose() {
    _controller?.dispose();
    BiometricService.dispose();
    super.dispose();
  }
}