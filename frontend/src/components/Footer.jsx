import React from 'react';
import { Heart, ShieldCheck, Camera, Sparkles, MapPin, Calendar } from 'lucide-react';

export const Footer = ({ setCurrentView }) => {
  return (
    <footer className="bg-alabaster dark:bg-dark-900 border-t border-gold-300/30 dark:border-gold-800/20 pt-16 pb-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Col 1: About */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gold-500 flex items-center justify-center text-white">
                <Camera className="w-4 h-4" />
              </div>
              <span className="font-serif text-2xl font-bold tracking-tight text-dark-900 dark:text-zinc-100">
                Event Memories
              </span>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md leading-relaxed">
              A private, AI-powered face-recognition media platform. 
              Find your cherished celebrations, ceremonies, and candid snapshots in seconds.
            </p>
          </div>

          {/* Col 2: Privacy Guarantee */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gold-600 dark:text-gold-400">
              Privacy First Architecture
            </h4>
            <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-2">
              <li className="flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Only mathematical vectors stored (no raw biometric scans)</span>
              </li>
              <li className="flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Expiring signed links for all downloads</span>
              </li>
              <li className="flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Strict zero-leakage gallery isolation</span>
              </li>
            </ul>
          </div>

          {/* Col 3: Portal Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gold-600 dark:text-gold-400">
              Direct Portals
            </h4>
            <div className="flex flex-col space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
              <button 
                onClick={() => setCurrentView('home')} 
                className="text-left hover:text-gold-600 dark:hover:text-gold-400 transition-colors"
              >
                Event Schedule & Venue
              </button>
              <button 
                onClick={() => setCurrentView('scan')} 
                className="text-left hover:text-gold-600 dark:hover:text-gold-400 transition-colors"
              >
                Scan Your Face
              </button>
              <button 
                onClick={() => setCurrentView('admin-login')} 
                className="text-left text-zinc-400 dark:text-zinc-600 hover:text-gold-600 transition-colors pt-2"
              >
                Admin & Photographer Portal →
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Bar with Dipendra Pratap Singh credit */}
        <div className="mt-12 pt-8 border-t border-gold-300/20 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <p>© 2026 Event Memories. Live AI Face-Recognition Photo &amp; Video Sharing Platform.</p>
          <p className="mt-2 sm:mt-0 flex items-center space-x-1">
            <span>Designed & Engineered by</span>
            <strong className="text-gold-600 dark:text-gold-400 font-semibold">Dipendra Pratap Singh</strong>
            <span>• Full-Stack & Machine Learning</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
