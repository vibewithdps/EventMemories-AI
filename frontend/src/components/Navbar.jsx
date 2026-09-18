import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Camera, Image, User, LogOut, Sun, Moon, ShieldCheck, Menu, X, Heart, Lock } from 'lucide-react';

export const Navbar = ({ currentView, setCurrentView }) => {
  const { user, logout, hasFaceScan } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = user?.role === 'admin';

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-ivory/85 dark:bg-dark-950/85 border-b border-gold-300/30 dark:border-gold-800/30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <div 
            onClick={() => { setCurrentView('home'); setMobileMenuOpen(false); }}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-gold-600 to-amber-300 flex items-center justify-center text-white shadow-gold-glow group-hover:scale-105 transition-transform">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-serif text-xl font-bold tracking-tight text-dark-900 dark:text-zinc-100 group-hover:text-gold-600 transition-colors">
                  Event Memories
                </span>
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline-block animate-pulse" />
              </div>
              <p className="text-xs text-gold-600 dark:text-gold-400 font-medium tracking-wide">
                Live Face-Recognition Photo Sharing
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setCurrentView('home')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                currentView === 'home'
                  ? 'bg-gold-500 text-white shadow-md'
                  : 'text-dark-800 dark:text-zinc-200 hover:text-gold-600 dark:hover:text-gold-400 hover:bg-gold-100/40 dark:hover:bg-gold-900/20'
              }`}
            >
              Event Showcase
            </button>

            {user && (
              <>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    currentView === 'dashboard'
                      ? 'bg-gold-500 text-white shadow-md'
                      : 'text-dark-800 dark:text-zinc-200 hover:text-gold-600 dark:hover:text-gold-400 hover:bg-gold-100/40 dark:hover:bg-gold-900/20'
                  }`}
                >
                  Dashboard
                </button>

                <button
                  onClick={() => setCurrentView('scan')}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    currentView === 'scan'
                      ? 'bg-gold-500 text-white shadow-md'
                      : 'text-dark-800 dark:text-zinc-200 hover:text-gold-600 dark:hover:text-gold-400 hover:bg-gold-100/40 dark:hover:bg-gold-900/20'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>Scan Face</span>
                  {hasFaceScan && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 ml-1"></span>
                  )}
                </button>

                <button
                  onClick={() => setCurrentView('gallery')}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    currentView === 'gallery'
                      ? 'bg-gold-500 text-white shadow-md'
                      : 'text-dark-800 dark:text-zinc-200 hover:text-gold-600 dark:hover:text-gold-400 hover:bg-gold-100/40 dark:hover:bg-gold-900/20'
                  }`}
                >
                  <Image className="w-4 h-4" />
                  <span>My Gallery</span>
                </button>
              </>
            )}

            {/* ALWAYS VISIBLE ADMIN PORTAL BUTTON */}
            <button
              onClick={() => {
                if (isAdmin) {
                  setCurrentView('admin-dashboard');
                } else {
                  setCurrentView('admin-login');
                }
              }}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                currentView.startsWith('admin')
                  ? 'bg-amber-600 border-amber-600 text-white shadow-md'
                  : 'border-amber-500/50 text-amber-700 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isAdmin ? 'Admin Studio' : 'Admin Portal'}</span>
            </button>
          </nav>

          {/* Right Controls: Theme Toggle & Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <button
              onClick={toggleDarkMode}
              className="p-2.5 rounded-full text-zinc-600 dark:text-zinc-300 hover:bg-gold-100/50 dark:hover:bg-gold-900/30 transition-colors"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>

            {user ? (
              <div className="flex items-center space-x-3 pl-2 border-l border-zinc-200 dark:border-zinc-800">
                <div className="text-right">
                  <p className="text-sm font-semibold text-dark-900 dark:text-zinc-100 leading-none">
                    {user.full_name}
                  </p>
                  <span className={`text-xs capitalize font-medium ${isAdmin ? 'text-amber-600 font-bold' : 'text-gold-600'}`}>
                    {user.role === 'admin' ? 'Host & Photographer' : 'Guest'}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 rounded-full text-zinc-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentView('login')}
                  className="px-4 py-2 rounded-full text-sm font-medium text-dark-800 dark:text-zinc-200 hover:text-gold-600 transition-colors"
                >
                  Guest Login
                </button>
                <button
                  onClick={() => setCurrentView('register')}
                  className="px-5 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-gold-500 to-amber-500 text-white hover:shadow-gold-glow transition-all hover:scale-102"
                >
                  Join Event
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center space-x-2 md:hidden">
            <button
              onClick={toggleDarkMode}
              className="p-2 text-zinc-600 dark:text-zinc-300"
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-dark-800 dark:text-zinc-200 hover:bg-gold-100/50 dark:hover:bg-gold-900/30"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-gold-300/30 dark:border-gold-800/30 bg-ivory dark:bg-dark-950 px-4 pt-2 pb-6 space-y-2">
          <button
            onClick={() => { setCurrentView('home'); setMobileMenuOpen(false); }}
            className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-dark-900 dark:text-zinc-100 hover:bg-gold-100/50"
          >
            Event Showcase
          </button>
          
          <button
            onClick={() => {
              if (isAdmin) setCurrentView('admin-dashboard');
              else setCurrentView('admin-login');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 flex items-center space-x-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isAdmin ? 'Admin Studio (Dashboard)' : 'Admin & Photographer Portal'}</span>
          </button>

          {user && (
            <>
              <button
                onClick={() => { setCurrentView('dashboard'); setMobileMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-dark-900 dark:text-zinc-100 hover:bg-gold-100/50"
              >
                Guest Dashboard
              </button>
              <button
                onClick={() => { setCurrentView('scan'); setMobileMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-dark-900 dark:text-zinc-100 hover:bg-gold-100/50"
              >
                Scan Face
              </button>
              <button
                onClick={() => { setCurrentView('gallery'); setMobileMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-dark-900 dark:text-zinc-100 hover:bg-gold-100/50"
              >
                My Matched Gallery
              </button>
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold">{user.full_name}</p>
                  <p className="text-xs text-gold-600">{user.email}</p>
                </div>
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 border border-rose-200 dark:border-rose-900"
                >
                  Sign Out
                </button>
              </div>
            </>
          )}
          {!user && (
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => { setCurrentView('login'); setMobileMenuOpen(false); }}
                className="w-full py-2 rounded-lg text-sm font-medium text-center border border-gold-400 text-gold-700 dark:text-gold-300"
              >
                Guest Login
              </button>
              <button
                onClick={() => { setCurrentView('register'); setMobileMenuOpen(false); }}
                className="w-full py-2 rounded-lg text-sm font-medium text-center bg-gold-500 text-white"
              >
                Join Event
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
