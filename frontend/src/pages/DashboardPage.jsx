import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Camera, Image, ShieldCheck, Download, Trash2, CheckCircle2, AlertCircle, ArrowRight, Sparkles, Heart, Calendar, MapPin } from 'lucide-react';

export const DashboardPage = ({ setCurrentView }) => {
  const { user, hasFaceScan, setHasFaceScan } = useAuth();
  const [purgeSuccess, setPurgeSuccess] = useState(null);
  const [isPurging, setIsPurging] = useState(false);
  const [activeEvent, setActiveEvent] = useState(null);
  const [loadingEvent, setLoadingEvent] = useState(true);

  useEffect(() => {
    const fetchActiveEvent = async () => {
      try {
        const res = await axios.get('/api/events/active');
        if (res.data && res.data.has_event) {
          setActiveEvent(res.data.event);
        } else {
          setActiveEvent(null);
        }
      } catch (err) {
        console.error('Failed to load active event:', err);
        setActiveEvent(null);
      } finally {
        setLoadingEvent(false);
      }
    };
    fetchActiveEvent();
  }, []);

  const handlePurgeFaceData = async () => {
    if (!window.confirm('Are you sure you want to delete your stored face embedding? You can re-scan at any time.')) {
      return;
    }
    setIsPurging(true);
    try {
      await axios.delete('/api/face/my-face');
      setHasFaceScan(false);
      setPurgeSuccess('Your face biometric embedding has been permanently deleted.');
    } catch (err) {
      console.error(err);
      alert('Failed to delete face data.');
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      
      {/* 1. Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-8 sm:p-12 glass-gold border border-gold-300/60 shadow-xl"
      >
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="inline-flex items-center space-x-1.5 text-gold-700 dark:text-gold-300 text-xs font-bold uppercase tracking-wider">
            {activeEvent ? (
              <>
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                <span>{activeEvent.title}{activeEvent.couple_names ? ` • ${activeEvent.couple_names}` : ''}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-gold-500" />
                <span>Event Memories Platform</span>
              </>
            )}
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-dark-900 dark:text-zinc-100">
            Welcome, {user?.full_name || 'Guest'}!
          </h1>

          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
            {activeEvent
              ? (activeEvent.story || `Thank you for joining our celebrations${activeEvent.venue_city ? ` in ${activeEvent.venue_city}` : ''}. Use our AI face recognition scanner to view and download all memories captured of you.`)
              : 'No celebration event has been published by the host yet. Once an event is published by the admin, use our AI face recognition scanner to find and download all photos captured of you.'}
          </p>

          {activeEvent && (
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gold-800 dark:text-gold-300 pt-2">
              {activeEvent.event_date && (
                <span className="flex items-center space-x-1.5">
                  <Calendar className="w-4 h-4 text-gold-600" />
                  <span>
                    {new Date(activeEvent.event_date).toLocaleDateString(undefined, { 
                      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' 
                    })}
                  </span>
                </span>
              )}
              {activeEvent.venue_name && (
                <span className="flex items-center space-x-1.5">
                  <MapPin className="w-4 h-4 text-gold-600" />
                  <span>{activeEvent.venue_name}, {activeEvent.venue_city}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* 2. Face Scan Status Alert Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`p-6 sm:p-8 rounded-3xl border ${
          hasFaceScan
            ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300/50 dark:border-emerald-800/40'
            : 'bg-gold-50/80 dark:bg-gold-950/30 border-gold-300/70 dark:border-gold-700/40 shadow-gold-glow'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              hasFaceScan ? 'bg-emerald-500 text-white' : 'bg-gold-500 text-white animate-pulse'
            }`}>
              {hasFaceScan ? <CheckCircle2 className="w-6 h-6" /> : <Camera className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-serif text-xl font-bold text-dark-900 dark:text-zinc-100">
                  {hasFaceScan ? 'Face Recognition Active' : 'Face Scan Needed'}
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  hasFaceScan ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200'
                }`}>
                  {hasFaceScan ? 'Unlocked' : 'Pending'}
                </span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 max-w-xl">
                {hasFaceScan
                  ? 'Your biometric embedding is registered. Your matched photos and videos are ready to explore and download.'
                  : 'You have not scanned your face yet. Please scan via webcam so our AI can curate only your photos.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {hasFaceScan ? (
              <>
                <button
                  onClick={() => setCurrentView('gallery')}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-600 text-white text-xs font-semibold shadow-gold-glow flex items-center space-x-2"
                >
                  <Image className="w-4 h-4" />
                  <span>Open My Gallery</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setCurrentView('scan')}
                  className="px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Rescan Face
                </button>
              </>
            ) : (
              <button
                onClick={() => setCurrentView('scan')}
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-gold-500 via-amber-400 to-gold-600 hover:from-gold-600 text-white text-sm font-semibold shadow-gold-glow hover:scale-103 transition-all flex items-center space-x-2"
              >
                <Camera className="w-4 h-4" />
                <span>Start Face Scan Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {purgeSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 dark:text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{purgeSuccess}</span>
        </div>
      )}

      {/* 3. Feature Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl glass-card border border-gold-300/30 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-gold-100 dark:bg-gold-900/40 flex items-center justify-center text-gold-600">
            <Camera className="w-5 h-5" />
          </div>
          <h4 className="font-serif text-lg font-bold">128-d Vector Precision</h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            High-accuracy facial coordinate detection that spots you across candid wide shots, group photos, and videos.
          </p>
        </div>

        <div className="p-6 rounded-3xl glass-card border border-gold-300/30 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-gold-100 dark:bg-gold-900/40 flex items-center justify-center text-gold-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h4 className="font-serif text-lg font-bold">Private &amp; Secure</h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Cryptographically signed tokens ensure only you can view and download photos containing your face.
          </p>
        </div>

        <div className="p-6 rounded-3xl glass-card border border-gold-300/30 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-gold-100 dark:bg-gold-900/40 flex items-center justify-center text-gold-600">
            <Download className="w-5 h-5" />
          </div>
          <h4 className="font-serif text-lg font-bold">One-Click ZIP Export</h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            No need to save images one by one. Export your entire matched wedding album directly into a neat ZIP archive.
          </p>
        </div>
      </div>

      {/* 4. Privacy & Biometric Rights Panel */}
      {hasFaceScan && (
        <div className="p-6 rounded-3xl bg-zinc-100/80 dark:bg-dark-900/80 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-dark-900 dark:text-zinc-100">
              Your Data &amp; Privacy Rights
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              You can permanently delete your facial vector embedding at any time.
            </p>
          </div>
          <button
            onClick={handlePurgeFaceData}
            disabled={isPurging}
            className="px-4 py-2 rounded-xl border border-rose-300 dark:border-rose-900/60 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center space-x-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isPurging ? 'Deleting...' : 'Delete My Biometric Data'}</span>
          </button>
        </div>
      )}

    </div>
  );
};
