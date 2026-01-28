import React, { useState, useEffect, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScanFace, ShieldCheck, RotateCcw, XCircle } from 'lucide-react';
import { FaceMesh, Results } from '@mediapipe/face_mesh';
import * as cam from '@mediapipe/camera_utils';

interface LivenessCheckProps {
  onVerified: () => void;
  onCancel: () => void;
  voterId: string;
}

export const LivenessCheck: React.FC<LivenessCheckProps> = ({ onVerified, onCancel, voterId }) => {
  const [step, setStep] = useState(0);
  const stepRef = useRef(0);
  const webcamRef = useRef<Webcam>(null);
  const [error, setError] = useState<string | null>(null);
  const [ear, setEar] = useState(0);
  const [smileRatio, setSmileRatio] = useState(0);
  const [_matchScore, setMatchScore] = useState<number | null>(null);
  const [processingMsg, setProcessingMsg] = useState("");
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const cameraRef = useRef<cam.Camera | null>(null);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  const calcEuclidean = (p1: any, p2: any) => {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  };

  const calcEAR = (landmarks: any[]) => {
    const leftIndices = [362, 385, 387, 263, 373, 380];
    const rightIndices = [33, 160, 158, 133, 153, 144];
    const getEyeEAR = (indices: number[]) => {
      const p = indices.map(i => landmarks[i]);
      const v1 = calcEuclidean(p[1], p[5]);
      const v2 = calcEuclidean(p[2], p[4]);
      const hor = calcEuclidean(p[0], p[3]);
      return (v1 + v2) / (2.0 * hor);
    };
    return (getEyeEAR(leftIndices) + getEyeEAR(rightIndices)) / 2.0;
  };

  const performVerification = async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    setStep(3);
    setProcessingMsg("Authenticating Image against SEC Database...");

    try {
      const blob = await (await fetch(imageSrc)).blob();
      const formData = new FormData();
      formData.append('live_image', blob, 'live.jpg');
      formData.append('voter_id', voterId);

      const response = await fetch('http://127.0.0.1:5000/api/biometric-verification', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.status === 'success') {
        const dist = result.distance !== undefined ? result.distance : 0.1;
        const score = Math.max(0, Math.min(100, (1 - dist) * 100));
        setMatchScore(score);
        setProcessingMsg("Identity Verified Successfully.");
        setStep(4);
        setTimeout(onVerified, 2000);
      } else {
        setError(result.message || "Face Match Failed / அடையாளம் காணப்படவில்லை");
        setStep(1);
      }
    } catch (e: any) {
      setError("System Network Error: " + e.message);
      setStep(1);
    }
  };

  const onResults = useCallback(async (results: Results) => {
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) return;
    const landmarks = results.multiFaceLandmarks[0];
    const currentStep = stepRef.current;
    const currentEAR = calcEAR(landmarks);
    setEar(currentEAR);

    const mouthLeft = landmarks[61];
    const mouthRight = landmarks[291];
    const eyeLeft = landmarks[33];
    const eyeRight = landmarks[263];
    const mouthDist = calcEuclidean(mouthLeft, mouthRight);
    const faceWidth = calcEuclidean(eyeLeft, eyeRight);
    const currentSmile = mouthDist / (faceWidth || 1);
    setSmileRatio(currentSmile);

    if (currentStep === 1) {
      if (currentEAR < 0.22) {
        setStep(2);
      }
    } else if (currentStep === 2) {
      if (currentSmile > 0.65) {
        setStep(3);
        performVerification();
      }
    }
  }, []);

  useEffect(() => {
    const faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    faceMesh.onResults(onResults);
    faceMeshRef.current = faceMesh;

    const setupCamera = () => {
      if (webcamRef.current && webcamRef.current.video) {
        const camera = new cam.Camera(webcamRef.current.video, {
          onFrame: async () => {
            if (webcamRef.current?.video) {
              await faceMesh.send({ image: webcamRef.current.video });
            }
          },
          width: 640,
          height: 480
        });
        camera.start();
        cameraRef.current = camera;
        setStep(1);
      } else {
        setTimeout(setupCamera, 200);
      }
    };
    setupCamera();

    return () => {
      if (cameraRef.current) {
        // camera connection cleanup
      }
    };
  }, [onResults]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-xl">
      <Card className="w-full max-w-2xl bg-white border-0 shadow-[0_50px_100px_rgba(0,0,0,0.5)] rounded-[3rem] overflow-hidden relative">
        <CardHeader className="text-center p-10 relative z-10 bg-[#003366] text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
          <CardTitle className="text-2xl font-black flex items-center justify-center gap-4 uppercase tracking-tighter">
            <ScanFace className="w-10 h-10 text-[#FF9933]" />
            Identity Verification
          </CardTitle>
          <p className="text-[#FF9933] text-[10px] font-black uppercase tracking-[0.3em] mt-3">Tamil Nadu State Election Unit</p>
        </CardHeader>

        <CardContent className="p-0 relative bg-black aspect-video overflow-hidden">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            className="absolute inset-0 w-full h-full object-cover"
            mirrored={true}
            onUserMediaError={() => setError("Camera Access Denied")}
          />

          {/* HUD Overlay */}
          <div className="absolute inset-0 z-10 flex flex-col justify-between p-8 pointer-events-none">
            <div className="flex justify-between items-start">
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Optical Engine</p>
                <div className="flex gap-4">
                  <div className="text-white text-xs font-mono">
                    <span className="text-[#FF9933]">EAR:</span> {ear.toFixed(3)}
                  </div>
                  <div className="text-white text-xs font-mono">
                    <span className="text-[#FF9933]">SMILE:</span> {smileRatio.toFixed(2)}
                  </div>
                </div>
              </div>

              {step === 3 && (
                <div className="bg-[#FF9933] text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest animate-pulse shadow-xl">
                  {processingMsg}
                </div>
              )}
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
              {(step === 1 || step === 2) && (
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={`w-64 h-80 rounded-[50%] border-[6px] shadow-[0_0_50px_rgba(255,153,51,0.2)] ${step === 1 ? 'border-[#006400]/50' : 'border-[#FF9933]/50'}`}
                ></motion.div>
              )}

              {step === 4 && (
                <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-6">
                  <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.5)]">
                    <ShieldCheck className="w-14 h-14 text-white" />
                  </div>
                  <div className="text-3xl font-black text-white uppercase tracking-tighter">Verified</div>
                </motion.div>
              )}
            </div>

            <div className="w-full text-center pb-6">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="space-y-2">
                    <h3 className="text-4xl font-black text-white uppercase tracking-tighter drop-shadow-2xl">Blink Your Eyes</h3>
                    <p className="text-[#FF9933] font-black uppercase text-xs tracking-widest">கண்களை சிமிட்டவும்</p>
                  </motion.div>
                )}
                {step === 2 && (
                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="space-y-2">
                    <h3 className="text-4xl font-black text-white uppercase tracking-tighter drop-shadow-2xl">Smile Please</h3>
                    <p className="text-[#FF9933] font-black uppercase text-xs tracking-widest">சிரிக்கவும்</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {error && (
            <div className="absolute inset-0 z-[30] bg-slate-900/95 flex flex-col items-center justify-center p-12 text-center animate-in fade-in">
              <div className="p-6 bg-red-500/10 rounded-full mb-6">
                <XCircle className="w-16 h-16 text-red-500" />
              </div>
              <h3 className="text-2xl font-black text-white uppercase mb-4 tracking-tighter">Verification Failed</h3>
              <p className="text-slate-400 font-bold mb-10 max-w-sm">{error}</p>
              <div className="flex gap-4 w-full max-w-sm">
                <Button onClick={() => { setError(null); setStep(1); }} className="flex-1 h-14 bg-white text-[#003366] font-black uppercase tracking-widest rounded-2xl">
                  <RotateCcw className="w-4 h-4 mr-2" /> Retry
                </Button>
                <Button onClick={onCancel} variant="outline" className="flex-1 h-14 border-white/10 text-white font-black uppercase tracking-widest rounded-2xl">Cancel</Button>
              </div>
            </div>
          )}
        </CardContent>

        <div className="p-8 bg-slate-50 text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Secure Session ID: {voterId}</p>
        </div>
      </Card>
    </div>
  );
};