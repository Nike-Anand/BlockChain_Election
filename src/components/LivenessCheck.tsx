import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScanFace, CheckCircle, Camera, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface LivenessCheckProps {
  onVerified: () => void;
  onCancel: () => void;
}

export const LivenessCheck: React.FC<LivenessCheckProps> = ({ onVerified, onCancel }) => {
  const [step, setStep] = useState(0); // 0: Init, 1: Face Detect, 2: Blink, 3: Smile, 4: Verified
  const webcamRef = useRef<Webcam>(null);
  const [error, setError] = useState<string | null>(null);

  // Simulation of liveness stages for UI demo purposes 
  // (In a real scenario, this would await backend response)
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (step === 0) {
      timer = setTimeout(() => setStep(1), 2000); // Initialize
    } else if (step === 1) {
      timer = setTimeout(() => setStep(2), 2500); // Face Detected
    } else if (step === 2) {
      timer = setTimeout(() => setStep(3), 3000); // Blink Detected
    } else if (step === 3) {
      timer = setTimeout(() => setStep(4), 3000); // Smile Detected
    } else if (step === 4) {
      timer = setTimeout(onVerified, 2000); // Success -> Redirect
    }

    return () => clearTimeout(timer);
  }, [step, onVerified]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white border-0 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-500 to-red-600 z-20"></div>

        <CardHeader className="text-center pb-4 relative z-10 bg-slate-50 border-b border-slate-100">
          <CardTitle className="text-2xl font-black text-slate-800 flex items-center justify-center gap-2">
            <ScanFace className="w-8 h-8 text-amber-600" />
            உயிர் சரிபார்ப்பு (Biometric Check)
          </CardTitle>
          <p className="text-slate-500 text-sm font-medium">Official Identity Verification System</p>
        </CardHeader>

        <CardContent className="p-0 relative bg-black">
          {/* Camera Feed */}
          <div className="relative w-full aspect-video flex items-center justify-center overflow-hidden">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              className="absolute inset-0 w-full h-full object-cover opacity-90"
              mirrored={true}
              onUserMediaError={() => setError("Camera Access Denied")}
            />

            {/* Biometric Overlay */}
            <div className="absolute inset-0 pointer-events-none z-10">
              {/* Face Guide Oval */}
              <div className={`
                    absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                    w-64 h-80 rounded-[50%] border-4 transition-all duration-500 box-border
                    ${step === 4 ? 'border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.5)]' : 'border-white/50 border-dashed'}
                `}></div>

              {/* Scanning Grid (Generic Tech Effect) */}
              {step < 4 && (
                <motion.div
                  className="absolute top-0 left-0 w-full h-1 bg-amber-500/50 shadow-[0_0_20px_#f59e0b]"
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
              )}

              {/* Status Pills */}
              <div className="absolute bottom-8 left-0 w-full flex justify-center gap-4">
                <div className={`px-4 py-2 rounded-full backdrop-blur-md border transition-all ${step >= 2 ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-black/50 border-white/20 text-white/50'}`}>
                  <span className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                    {step >= 2 && <CheckCircle className="w-4 h-4" />} Face Detected
                  </span>
                </div>
                <div className={`px-4 py-2 rounded-full backdrop-blur-md border transition-all ${step >= 3 ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-black/50 border-white/20 text-white/50'}`}>
                  <span className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                    {step >= 3 && <CheckCircle className="w-4 h-4" />} Liveness (Blink)
                  </span>
                </div>
              </div>
            </div>

            {/* Error State */}
            {error && (
              <div className="absolute inset-0 bg-black z-20 flex flex-col items-center justify-center text-white p-6 text-center">
                <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
                <h3 className="text-xl font-bold">Camera Access Required</h3>
                <p className="text-slate-400 mt-2">Please enable camera permissions to proceed.</p>
                <Button onClick={onCancel} variant="secondary" className="mt-6">Return Home</Button>
              </div>
            )}
          </div>

          {/* Instruction Footer */}
          <div className="bg-white p-6 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">Current Action</p>
                <p className="text-xl font-black text-slate-800">
                  {step === 0 && "Initializing..."}
                  {step === 1 && "Look at the Camera / கேமராவைப் பாருங்கள்"}
                  {step === 2 && "Blink Your Eyes / கண்களை சிமிட்டவும்"}
                  {step === 3 && "Smile Please / சிரிக்கவும்"}
                  {step === 4 && "Verification Successful / சரிபார்ப்பு முடிந்தது"}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center relative">
                <div className="absolute inset-0 border-4 border-amber-500 rounded-full border-t-transparent animate-spin"></div>
                <Camera className="w-6 h-6 text-slate-400" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


