import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, RefreshCw, CheckCircle2, AlertCircle, Sparkles, Upload } from 'lucide-react';
import confetti from 'canvas-confetti';

export const WebcamScanner = ({ onScanComplete, isProcessing, setIsProcessing }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [streamActive, setStreamActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [scanStep, setScanStep] = useState('align'); // 'align' | 'liveness' | 'scanning' | 'success'
  const [progressText, setProgressText] = useState('Position your face inside the golden oval');

  // Start webcam
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 720 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStreamActive(true);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Camera access was denied or is unavailable. You can use the selfie upload fallback below.');
    }
  };

  // Stop webcam
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setStreamActive(false);
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  // Capture frame as base64 JPEG
  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.88);
  };

  // Initiate scan sequence with multi-frame liveness capture
  const handleStartScan = async () => {
    if (!streamActive) return;
    setIsProcessing(true);
    setScanStep('liveness');
    setProgressText('Liveness verification: Please look forward and blink naturally...');

    const frames = [];
    
    // Frame 1
    frames.push(captureFrame());

    // Delay 400ms -> Frame 2
    await new Promise(r => setTimeout(r, 400));
    frames.push(captureFrame());

    // Delay 400ms -> Frame 3
    await new Promise(r => setTimeout(r, 400));
    frames.push(captureFrame());

    setScanStep('scanning');
    setProgressText('Extracting 128-d deep facial embeddings & searching album...');

    try {
      const result = await onScanComplete(frames);
      if (result?.success) {
        setScanStep('success');
        setProgressText(`Success! Found ${result.matched_count} memories of you!`);
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else {
        setScanStep('align');
        setProgressText(result?.error || 'Face scan failed. Please try again.');
      }
    } catch (err) {
      setScanStep('align');
      setProgressText('Network error during scan. Please retry.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Fallback: upload selfie file from disk/phone gallery
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const b64 = event.target.result;
      setIsProcessing(true);
      setScanStep('scanning');
      setProgressText('Analyzing selfie and searching event memories...');
      try {
        const result = await onScanComplete([b64]);
        if (result?.success) {
          setScanStep('success');
          setProgressText(`Matched ${result.matched_count} moments featuring you!`);
          confetti({ particleCount: 70, spread: 60 });
        } else {
          setScanStep('align');
          setProgressText(result?.error || 'No face matched. Please try another selfie.');
        }
      } catch (err) {
        setScanStep('align');
        setProgressText('Upload failed. Please retry.');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      
      {/* Hidden canvas for snapshot capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Main Viewfinder Frame */}
      <div className="relative w-72 h-96 sm:w-80 sm:h-[420px] rounded-3xl overflow-hidden bg-zinc-900 border-2 border-gold-400/60 shadow-gold-glow flex items-center justify-center">
        
        {/* Live Video Feed */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-cover transform -scale-x-100 ${
            streamActive ? 'opacity-100' : 'opacity-0'
          } transition-opacity duration-500`}
        />

        {/* Golden Face Alignment Oval Overlay */}
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
          <div className="w-52 h-72 rounded-[50%/60%] border-2 border-dashed border-gold-400 shadow-[0_0_20px_rgba(212,175,55,0.4)] relative flex items-center justify-center">
            
            {/* Pulsing halo ring */}
            <div className="absolute inset-0 rounded-[50%/60%] border border-gold-300 animate-ping opacity-25" />

            {/* Laser scanning bar */}
            {(isProcessing || scanStep === 'scanning' || scanStep === 'liveness') && (
              <div className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-amber-300 to-transparent shadow-[0_0_12px_#F59E0B] animate-laser" />
            )}

            {/* Subtle Alignment Corner Markers */}
            <div className="absolute top-2 left-6 w-3 h-3 border-t-2 border-l-2 border-gold-400" />
            <div className="absolute top-2 right-6 w-3 h-3 border-t-2 border-r-2 border-gold-400" />
            <div className="absolute bottom-2 left-6 w-3 h-3 border-b-2 border-l-2 border-gold-400" />
            <div className="absolute bottom-2 right-6 w-3 h-3 border-b-2 border-r-2 border-gold-400" />
          </div>
        </div>

        {/* Camera error message */}
        {cameraError && (
          <div className="absolute inset-0 bg-dark-950/90 p-6 flex flex-col items-center justify-center text-center">
            <AlertCircle className="w-10 h-10 text-amber-500 mb-2" />
            <p className="text-xs text-zinc-300 leading-relaxed mb-4">{cameraError}</p>
            <button
              onClick={startCamera}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-gold-500 text-white hover:bg-gold-600 transition-colors flex items-center space-x-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Camera</span>
            </button>
          </div>
        )}
      </div>

      {/* Real-time Status Guidance */}
      <div className="mt-4 text-center max-w-xs">
        <p className="text-xs font-medium text-gold-700 dark:text-gold-300 transition-all">
          {progressText}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex flex-col items-center space-y-3 w-full">
        <button
          onClick={handleStartScan}
          disabled={!streamActive || isProcessing}
          className={`w-full py-3.5 px-6 rounded-2xl font-semibold text-sm flex items-center justify-center space-x-2 shadow-gold-glow transition-all ${
            !streamActive || isProcessing
              ? 'bg-zinc-400 cursor-not-allowed text-zinc-200'
              : 'bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-600 hover:to-amber-600 text-white hover:scale-102'
          }`}
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Matching Your Memories...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Scan Face & Discover Photos</span>
            </>
          )}
        </button>

        {/* Selfie Upload Alternative */}
        <div className="w-full text-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="text-xs text-zinc-500 hover:text-gold-600 dark:text-zinc-400 dark:hover:text-gold-400 flex items-center justify-center space-x-1 mx-auto py-1"
          >
            <Upload className="w-3.5 h-3.5 inline" />
            <span>Or upload a selfie from your photo library</span>
          </button>
        </div>

      </div>

    </div>
  );
};
