import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { CountdownTimer } from '../components/CountdownTimer';
import { useAuth } from '../context/AuthContext';
import { 
  Camera, Sparkles, ShieldCheck, Download, Heart, 
  MapPin, Calendar, ArrowRight, UserCheck, Lock, PlusCircle, AlertCircle
} from 'lucide-react';

export const LandingPage = ({ setCurrentView }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [activeEventData, setActiveEventData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchActiveEvent = async () => {
    try {
      const res = await axios.get('/api/events/active');
      setActiveEventData(res.data);
    } catch (err) {
      console.error('Failed to fetch active event:', err);
      setActiveEventData({ has_event: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveEvent();
  }, []);

  const hasEvent = activeEventData?.has_event && activeEventData?.event;
  const event = activeEventData?.event;
  const schedules = activeEventData?.schedules || [];

  return (
    <div className="space-y-24 pb-20">
      
      {/* CASE 1: NO EVENT CREATED YET */}
      {!loading && !hasEvent && (
        <section className="relative overflow-hidden pt-16 sm:pt-24 pb-20 px-4 text-center max-w-4xl mx-auto space-y-8">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-gold-500 to-amber-300 flex items-center justify-center text-white mx-auto shadow-gold-glow">
            <Camera className="w-8 h-8" />
          </div>

          <div className="space-y-3">
            <span className="inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Event Memories Platform</span>
            </span>

            <h1 className="font-serif text-4xl sm:text-6xl font-bold text-dark-900 dark:text-zinc-100">
              No Wedding Event Active Yet
            </h1>
            <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
              Default demo events have been cleared. As soon as the admin or photographer creates a wedding event 
              in the Admin Studio, the couple's celebration, countdown, and photo albums will appear here.
            </p>
          </div>

          {/* Prominent Admin Callout Box */}
          <div className="p-8 rounded-3xl glass-card border-2 border-dashed border-amber-400/60 max-w-lg mx-auto text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-dark-900 dark:text-zinc-100">
                Are you the Admin or Host?
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Log in to the Admin Studio to set up your couple names, wedding date, venue, and upload event photos.
              </p>
            </div>

            <button
              onClick={() => {
                if (isAdmin) setCurrentView('admin-dashboard');
                else setCurrentView('admin-login');
              }}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-600 via-gold-500 to-amber-600 hover:from-amber-700 hover:to-gold-600 text-white font-bold text-sm shadow-gold-glow flex items-center justify-center space-x-2 transition-all hover:scale-102"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Go to Admin Portal → Create First Event</span>
            </button>
          </div>

          {/* 3-Step Feature Teaser */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 text-left">
            <div className="p-6 rounded-2xl glass-card border border-gold-300/30 space-y-2">
              <span className="text-[10px] font-bold text-gold-600 uppercase">Feature 1</span>
              <h4 className="font-serif text-base font-bold">Face Recognition</h4>
              <p className="text-xs text-zinc-500">Guests scan their face live via webcam to instantly discover their memories.</p>
            </div>
            <div className="p-6 rounded-2xl glass-card border border-gold-300/30 space-y-2">
              <span className="text-[10px] font-bold text-gold-600 uppercase">Feature 2</span>
              <h4 className="font-serif text-base font-bold">100% Private</h4>
              <p className="text-xs text-zinc-500">No raw biometrics stored. Each guest views only photos verified to contain their face.</p>
            </div>
            <div className="p-6 rounded-2xl glass-card border border-gold-300/30 space-y-2">
              <span className="text-[10px] font-bold text-gold-600 uppercase">Feature 3</span>
              <h4 className="font-serif text-base font-bold">1-Click ZIP Download</h4>
              <p className="text-xs text-zinc-500">Download high-res original photos and videos individually or all at once.</p>
            </div>
          </div>

        </section>
      )}

      {/* CASE 2: ACTIVE EVENT IS CREATED BY ADMIN */}
      {!loading && hasEvent && (
        <>
          {/* Hero Section with Dynamic Event Data */}
          <section className="relative overflow-hidden pt-12 sm:pt-20 pb-16 px-4 text-center">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gold-300/20 dark:bg-gold-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-4xl mx-auto relative z-10 space-y-6">
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-gold-100/60 dark:bg-gold-950/40 border border-gold-300/40 text-gold-700 dark:text-gold-300 text-xs font-semibold tracking-wider uppercase"
              >
                <Sparkles className="w-3.5 h-3.5 text-gold-500" />
                <span>{event.title || 'Official Wedding Platform'}</span>
              </motion.div>

              {/* Couple's Names from Database */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-serif text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-dark-950 dark:text-zinc-50"
              >
                {event.couple_names}
              </motion.h1>

              {event.story && (
                <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-300 max-w-2xl mx-auto font-light leading-relaxed">
                  {event.story}
                </p>
              )}

              {/* Dynamic Live Countdown Timer */}
              {event.event_date && (
                <div className="pt-2">
                  <CountdownTimer targetDate={event.event_date} />
                </div>
              )}

              {/* Venue & Location Badge */}
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-zinc-600 dark:text-zinc-300 pt-2">
                <span className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4 text-gold-500" />
                  <span>{event.venue_name}, {event.venue_city}</span>
                </span>
                {event.venue_map_url && (
                  <a
                    href={event.venue_map_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gold-600 hover:underline font-semibold"
                  >
                    View Map Directions →
                  </a>
                )}
              </div>

              {/* Action CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap items-center justify-center gap-4 pt-6"
              >
                <button
                  onClick={() => setCurrentView('scan')}
                  className="px-8 py-4 rounded-2xl bg-gradient-to-r from-gold-500 via-amber-400 to-gold-600 hover:from-gold-600 hover:to-amber-500 text-white font-semibold text-base shadow-gold-glow-lg hover:scale-105 transition-all flex items-center space-x-2.5"
                >
                  <Camera className="w-5 h-5" />
                  <span>Find My Photos (Live Face Scan)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setCurrentView('login')}
                  className="px-7 py-4 rounded-2xl bg-white dark:bg-dark-800 hover:bg-gold-50 dark:hover:bg-dark-700 text-dark-900 dark:text-zinc-100 font-medium text-base border border-gold-300/50 shadow-sm transition-all"
                >
                  Guest Login
                </button>
              </motion.div>

            </div>
          </section>

          {/* Dynamic Event Schedules / Itinerary */}
          {schedules.length > 0 && (
            <section className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-gold-50/70 via-ivory to-blush-50/50 dark:from-dark-900 dark:via-dark-950 dark:to-dark-900 border border-gold-300/40 shadow-xl">
                <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
                  <span className="text-xs uppercase font-bold tracking-widest text-gold-600 dark:text-gold-400">
                    Celebration Itinerary
                  </span>
                  <h2 className="font-serif text-3xl font-bold text-dark-900 dark:text-zinc-100">
                    Schedule of Events
                  </h2>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    {event.venue_name} • {event.venue_city}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {schedules.map((item) => (
                    <div
                      key={item.id}
                      className={`p-5 rounded-2xl bg-white/70 dark:bg-dark-800/70 border space-y-2 relative ${
                        item.is_main_event
                          ? 'border-gold-400 shadow-gold-glow/20'
                          : 'border-gold-200 dark:border-gold-800/40'
                      }`}
                    >
                      {item.is_main_event ? (
                        <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gold-500 text-white">
                          Main Event
                        </span>
                      ) : null}
                      <div className="text-xs font-bold text-amber-600 dark:text-amber-400">
                        {item.schedule_date}
                      </div>
                      <h4 className="font-serif text-lg font-bold text-dark-900 dark:text-zinc-100">
                        {item.title}
                      </h4>
                      <p className="text-xs text-zinc-500 font-medium">
                        {item.schedule_time} • {item.location}
                      </p>
                      {item.description && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 pt-1 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* 3-Step Guide */}
          <section className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
              <span className="text-xs uppercase font-bold tracking-widest text-gold-600 dark:text-gold-400">
                Effortless Photo Finding
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-dark-900 dark:text-zinc-100">
                How It Works in 3 Elegant Steps
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 rounded-3xl glass-card border border-gold-300/40 flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-gold-500 to-amber-300 flex items-center justify-center text-white shadow-gold-glow">
                  <Camera className="w-8 h-8" />
                </div>
                <span className="text-xs font-bold text-gold-600">STEP 01</span>
                <h3 className="font-serif text-xl font-bold">Live Webcam Scan</h3>
                <p className="text-xs text-zinc-500">Scan your face with our golden oval guide. Liveness verification ensures security.</p>
              </div>

              <div className="p-8 rounded-3xl glass-card border border-gold-300/40 flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-gold-400 flex items-center justify-center text-white shadow-gold-glow">
                  <Sparkles className="w-8 h-8" />
                </div>
                <span className="text-xs font-bold text-gold-600">STEP 02</span>
                <h3 className="font-serif text-xl font-bold">AI Vector Matching</h3>
                <p className="text-xs text-zinc-500">Our deep face engine matches your 128-d coordinates against all event photos in milliseconds.</p>
              </div>

              <div className="p-8 rounded-3xl glass-card border border-gold-300/40 flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-400 to-gold-500 flex items-center justify-center text-white shadow-gold-glow">
                  <Download className="w-8 h-8" />
                </div>
                <span className="text-xs font-bold text-gold-600">STEP 03</span>
                <h3 className="font-serif text-xl font-bold">Private Download</h3>
                <p className="text-xs text-zinc-500">Explore only your photos in a high-res lightbox and download individual photos or all in a ZIP.</p>
              </div>
            </div>
          </section>
        </>
      )}

    </div>
  );
};
