import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Lightbox } from '../components/Lightbox';
import { Image, Film, Download, CheckSquare, Square, RefreshCw, Camera, Sparkles, Filter, CheckCircle } from 'lucide-react';

export const MyGalleryPage = ({ setCurrentView }) => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasScanned, setHasScanned] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'photo' | 'video' | string tag
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [downloadingZip, setDownloadingZip] = useState(false);

  const fetchMyPhotos = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/gallery/my-photos');
      setHasScanned(res.data.has_scanned);
      setPhotos(res.data.photos || []);
    } catch (err) {
      console.error('Failed to fetch matched gallery:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPhotos();
  }, []);

  // Filtered items
  const filteredMedia = photos.filter((item) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'photo') return item.media_type === 'photo';
    if (activeFilter === 'video') return item.media_type === 'video';
    return item.event_tag?.toLowerCase() === activeFilter.toLowerCase();
  });

  // Unique event tags present in matched photos
  const eventTags = Array.from(new Set(photos.map((p) => p.event_tag).filter(Boolean)));

  // Multi-selection helpers
  const toggleSelect = (id, e) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredMedia.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredMedia.map((m) => m.id)));
    }
  };

  // ZIP download handler
  const handleDownloadZip = async () => {
    setDownloadingZip(true);
    try {
      const response = await axios.get('/api/gallery/download-zip', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Wedding_Memories.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('ZIP download error:', err);
      alert('Could not download ZIP. Please ensure your session is active.');
    } finally {
      setDownloadingZip(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Page Title & Global Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4 border-b border-gold-300/30">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-dark-900 dark:text-zinc-100">
              My Matched Gallery
            </h1>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gold-100 dark:bg-gold-900/50 text-gold-700 dark:text-gold-300 border border-gold-300/40">
              {photos.length} Verified
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Photos and videos cryptographically authorized and matched exclusively to your face.
          </p>
        </div>

        {/* Global Action Buttons */}
        {photos.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={selectAll}
              className="px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center space-x-1.5"
            >
              {selectedIds.size === filteredMedia.length && filteredMedia.length > 0 ? (
                <>
                  <CheckSquare className="w-4 h-4 text-gold-500" />
                  <span>Deselect All</span>
                </>
              ) : (
                <>
                  <Square className="w-4 h-4" />
                  <span>Select All ({filteredMedia.length})</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadZip}
              disabled={downloadingZip}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-600 text-white text-xs font-semibold shadow-gold-glow flex items-center space-x-2 transition-all hover:scale-102"
            >
              <Download className="w-4 h-4" />
              <span>{downloadingZip ? 'Packaging ZIP Archive...' : 'Download All as ZIP'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      {photos.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeFilter === 'all'
                ? 'bg-gold-500 text-white shadow-sm'
                : 'bg-zinc-100 dark:bg-dark-800 text-zinc-600 dark:text-zinc-300 hover:bg-gold-100/50'
            }`}
          >
            All Memories ({photos.length})
          </button>

          <button
            onClick={() => setActiveFilter('photo')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
              activeFilter === 'photo'
                ? 'bg-gold-500 text-white shadow-sm'
                : 'bg-zinc-100 dark:bg-dark-800 text-zinc-600 dark:text-zinc-300 hover:bg-gold-100/50'
            }`}
          >
            <Image className="w-3.5 h-3.5" />
            <span>Photos ({photos.filter((p) => p.media_type === 'photo').length})</span>
          </button>

          <button
            onClick={() => setActiveFilter('video')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
              activeFilter === 'video'
                ? 'bg-gold-500 text-white shadow-sm'
                : 'bg-zinc-100 dark:bg-dark-800 text-zinc-600 dark:text-zinc-300 hover:bg-gold-100/50'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Videos ({photos.filter((p) => p.media_type === 'video').length})</span>
          </button>

          {eventTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveFilter(tag)}
              className={`px-4 py-2 rounded-xl transition-all capitalize ${
                activeFilter === tag
                  ? 'bg-gold-500 text-white shadow-sm'
                  : 'bg-zinc-100 dark:bg-dark-800 text-zinc-600 dark:text-zinc-300 hover:bg-gold-100/50'
              }`}
            >
              {tag} ({photos.filter((p) => p.event_tag === tag).length})
            </button>
          ))}
        </div>
      )}

      {/* Loading Skeleton View */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-2xl bg-zinc-200 dark:bg-dark-800 animate-pulse border border-zinc-300/40 dark:border-zinc-700/40"
            />
          ))}
        </div>
      )}

      {/* Not Scanned State */}
      {!loading && !hasScanned && (
        <div className="text-center py-16 px-4 glass-card rounded-3xl border border-gold-300/50 max-w-lg mx-auto space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-gold-100 dark:bg-gold-900/40 text-gold-600 flex items-center justify-center mx-auto shadow-gold-glow">
            <Camera className="w-8 h-8" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-dark-900 dark:text-zinc-100">
            Scan Your Face to View Gallery
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Your gallery is currently empty because you haven't performed the live facial scan yet. 
            Once scanned, our AI will instantly populate your personal album.
          </p>
          <button
            onClick={() => setCurrentView('scan')}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-gold-500 to-amber-500 text-white font-semibold text-sm shadow-gold-glow hover:scale-103 transition-all inline-flex items-center space-x-2"
          >
            <Camera className="w-4 h-4" />
            <span>Scan Face Now</span>
          </button>
        </div>
      )}

      {/* Empty Matches State */}
      {!loading && hasScanned && photos.length === 0 && (
        <div className="text-center py-16 px-4 glass-card rounded-3xl border border-gold-300/40 max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-dark-900 dark:text-zinc-100">
            No Photos Matched Yet
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            We searched the current album, but didn't locate matching moments with sufficient confidence. 
            The photographer may still be uploading event batches, or you can retry with another scan angle.
          </p>
          <button
            onClick={() => setCurrentView('scan')}
            className="px-6 py-3 rounded-xl border border-gold-400 text-xs font-semibold text-gold-700 dark:text-gold-300 hover:bg-gold-50"
          >
            Rescan Face
          </button>
        </div>
      )}

      {/* Main Responsive Grid */}
      {!loading && filteredMedia.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredMedia.map((item, index) => {
            const isSelected = selectedIds.has(item.id);
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                onClick={() => setLightboxIndex(index)}
                className={`group relative rounded-2xl overflow-hidden aspect-square cursor-pointer shadow-md bg-zinc-900 border transition-all ${
                  isSelected ? 'ring-4 ring-gold-500 border-gold-500' : 'border-zinc-200 dark:border-zinc-800 hover:border-gold-400'
                }`}
              >
                {/* Thumbnail */}
                <img
                  src={item.thumbnail_url}
                  alt={item.original_name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Video Badge */}
                {item.media_type === 'video' && (
                  <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold flex items-center space-x-1">
                    <Film className="w-3 h-3 text-amber-400" />
                    <span>Video</span>
                  </div>
                )}

                {/* Selection Checkbox */}
                <button
                  type="button"
                  onClick={(e) => toggleSelect(item.id, e)}
                  className={`absolute top-3 right-3 z-10 w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                    isSelected ? 'bg-gold-500 text-white shadow-md' : 'bg-black/50 text-white/80 opacity-0 group-hover:opacity-100 hover:bg-black/70'
                  }`}
                >
                  {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                </button>

                {/* Hover Gradient Overlay with Match Confidence and Info */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end text-white">
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate font-medium max-w-[70%]">
                      {item.original_name}
                    </span>
                    <span className="flex items-center space-x-1 text-emerald-300 text-[11px]">
                      <CheckCircle className="w-3 h-3" />
                      <span>{item.match_confidence}%</span>
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-300 capitalize mt-0.5">
                    {item.event_tag}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxIndex !== null && filteredMedia[lightboxIndex] && (
        <Lightbox
          item={filteredMedia[lightboxIndex]}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex((prev) => Math.max(0, prev - 1))}
          onNext={() => setLightboxIndex((prev) => Math.min(filteredMedia.length - 1, prev + 1))}
          hasPrev={lightboxIndex > 0}
          hasNext={lightboxIndex < filteredMedia.length - 1}
        />
      )}

    </div>
  );
};
