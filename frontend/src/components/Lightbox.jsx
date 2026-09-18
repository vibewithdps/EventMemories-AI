import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ChevronLeft, ChevronRight, Tag, CheckCircle, Calendar, Film } from 'lucide-react';

export const Lightbox = ({ item, onClose, onPrev, onNext, hasPrev, hasNext }) => {
  if (!item) return null;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onPrev();
      if (e.key === 'ArrowRight' && hasNext) onNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasPrev, hasNext, onClose, onPrev, onNext]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-20 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          title="Close (Esc)"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Navigation Arrows */}
        {hasPrev && (
          <button
            onClick={onPrev}
            className="absolute left-4 z-20 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
            title="Previous (Left Arrow)"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
        )}

        {hasNext && (
          <button
            onClick={onNext}
            className="absolute right-4 z-20 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
            title="Next (Right Arrow)"
          >
            <ChevronRight className="w-7 h-7" />
          </button>
        )}

        {/* Main Media & Info Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="max-w-5xl w-full max-h-[90vh] flex flex-col rounded-2xl overflow-hidden bg-zinc-950 border border-gold-400/20 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Media Viewport */}
          <div className="flex-1 flex items-center justify-center p-4 bg-black/60 min-h-[50vh] max-h-[72vh] overflow-hidden">
            {item.media_type === 'video' ? (
              <video
                src={item.media_url}
                controls
                autoPlay
                className="max-h-[68vh] max-w-full rounded-lg shadow-lg"
              />
            ) : (
              <img
                src={item.media_url}
                alt={item.original_name}
                className="max-h-[68vh] max-w-full object-contain rounded-lg shadow-lg select-none"
              />
            )}
          </div>

          {/* Bottom Bar: Title, Event Tag, Confidence, and Download */}
          <div className="p-4 sm:p-5 bg-dark-900 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="text-base font-medium text-white">
                  {item.original_name}
                </h4>
                {item.media_type === 'video' && (
                  <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    <Film className="w-3 h-3" />
                    <span>Video</span>
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-4 text-xs text-zinc-400 mt-1">
                <span className="flex items-center space-x-1">
                  <Tag className="w-3.5 h-3.5 text-gold-500" />
                  <span>{item.event_tag || 'Ceremony'}</span>
                </span>
                {item.match_confidence && (
                  <span className="flex items-center space-x-1 text-emerald-400">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{item.match_confidence}% Facial Match</span>
                  </span>
                )}
              </div>
            </div>

            {/* Direct Download Button */}
            <a
              href={`${item.media_url}&download=true`}
              download={item.original_name}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-600 hover:to-amber-600 text-white text-sm font-semibold shadow-gold-glow transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download High-Res</span>
            </a>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
