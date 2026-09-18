import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, Trash2, CheckCircle2, X } from 'lucide-react';

export const ConsentModal = ({ isOpen, onAccept, onDecline }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-dark-900 border border-gold-400/40 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden"
        >
          {/* Subtle gold glow accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-gold-400 via-amber-300 to-gold-600" />
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gold-100 dark:bg-gold-900/40 flex items-center justify-center text-gold-600 dark:text-gold-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-dark-900 dark:text-zinc-100">
                Privacy & Biometric Consent
              </h3>
            </div>
            <button
              onClick={onDecline}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed mb-6">
            To show you only the photos and videos where you appear, <strong>Event Memories</strong> uses 
            live facial recognition. Before accessing your camera, please review our transparent privacy policy:
          </p>

          <div className="space-y-3.5 mb-8">
            <div className="flex items-start space-x-3 bg-gold-50/50 dark:bg-gold-950/20 p-3 rounded-xl border border-gold-200/50 dark:border-gold-800/30">
              <Lock className="w-5 h-5 text-gold-600 dark:text-gold-400 shrink-0 mt-0.5" />
              <div className="text-xs text-zinc-600 dark:text-zinc-300">
                <strong className="block text-dark-900 dark:text-zinc-100 font-semibold mb-0.5">
                  Embeddings Only (Zero Raw Photos Stored)
                </strong>
                Your camera capture is converted into a 128-dimensional numerical coordinate vector. 
                We never store your raw facial biometrics.
              </div>
            </div>

            <div className="flex items-start space-x-3 bg-gold-50/50 dark:bg-gold-950/20 p-3 rounded-xl border border-gold-200/50 dark:border-gold-800/30">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-xs text-zinc-600 dark:text-zinc-300">
                <strong className="block text-dark-900 dark:text-zinc-100 font-semibold mb-0.5">
                  Strict Gallery Isolation
                </strong>
                Other guests cannot see your photos. Media links are cryptographically signed with 
                15-minute expiration timers.
              </div>
            </div>

            <div className="flex items-start space-x-3 bg-gold-50/50 dark:bg-gold-950/20 p-3 rounded-xl border border-gold-200/50 dark:border-gold-800/30">
              <Trash2 className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="text-xs text-zinc-600 dark:text-zinc-300">
                <strong className="block text-dark-900 dark:text-zinc-100 font-semibold mb-0.5">
                  Automatic Post-Event Purge
                </strong>
                All facial vectors are purged following the event. You may also delete your face data 
                instantly at any time from your dashboard.
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onDecline}
              className="flex-1 py-3 px-4 rounded-xl border border-zinc-300 dark:border-zinc-700 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onAccept}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-600 hover:to-amber-600 text-white text-sm font-semibold shadow-gold-glow transition-all"
            >
              I Agree & Continue
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
