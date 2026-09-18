import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { WebcamScanner } from '../components/WebcamScanner';
import { ConsentModal } from '../components/ConsentModal';
import { Camera, CheckCircle2, Image, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';

export const FaceScanPage = ({ setCurrentView }) => {
  const { user, setHasFaceScan } = useAuth();
  
  const [hasConsent, setHasConsent] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const handleAcceptConsent = () => {
    setHasConsent(true);
    setShowConsentModal(false);
  };

  const handleDeclineConsent = () => {
    setShowConsentModal(false);
    setCurrentView('dashboard');
  };

  const handleScanFrames = async (frames) => {
    try {
      const res = await axios.post('/api/face/scan-and-match', {
        frames,
        consent: true
      });
      if (res.data.success) {
        setHasFaceScan(true);
        setScanResult(res.data);
      }
      return res.data;
    } catch (err) {
      console.error('Scan error:', err);
      return {
        success: false,
        error: err.response?.data?.detail || 'Failed to match face against album.'
      };
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      
      {/* Consent Modal Triggered Before Scanner */}
      <ConsentModal
        isOpen={showConsentModal && !hasConsent}
        onAccept={handleAcceptConsent}
        onDecline={handleDeclineConsent}
      />

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-gold-100/60 dark:bg-gold-950/40 text-gold-700 dark:text-gold-300 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Biometric Privacy Mode Active</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-dark-900 dark:text-zinc-100">
          Find Your Wedding Memories
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
          Look directly into your webcam. Our AI engine will align your face and scan the shared event album in real-time.
        </p>
      </div>

      {/* Main Scanner Container */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-gold-300/40 shadow-xl">
        {scanResult?.success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8 space-y-6"
          >
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-gold-glow">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div className="space-y-2">
              <h3 className="font-serif text-2xl font-bold text-dark-900 dark:text-zinc-100">
                Memories Discovered!
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-300 max-w-sm mx-auto">
                We successfully verified your face and located{' '}
                <strong className="text-gold-600 dark:text-gold-400 font-bold">
                  {scanResult.matched_count} moments
                </strong>{' '}
                from the wedding celebrations.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <button
                onClick={() => setCurrentView('gallery')}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-600 text-white font-semibold text-sm shadow-gold-glow flex items-center space-x-2 hover:scale-102 transition-all"
              >
                <Image className="w-4 h-4" />
                <span>Open My Matched Gallery</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setScanResult(null)}
                className="px-5 py-3.5 rounded-2xl border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center space-x-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Scan Again</span>
              </button>
            </div>
          </motion.div>
        ) : (
          <WebcamScanner
            onScanComplete={handleScanFrames}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
          />
        )}
      </div>

    </div>
  );
};
