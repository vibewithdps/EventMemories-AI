import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Camera, Lock, Mail, User, AlertCircle, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';

export const LoginPage = ({ initialMode = 'login', setCurrentView }) => {
  const [authMode, setAuthMode] = useState(initialMode); // 'login' | 'register' | 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (authMode === 'login') {
        await login(email, password);
        setCurrentView('dashboard');
      } else if (authMode === 'register') {
        if (!fullName.trim()) {
          setError('Please provide your full name');
          setLoading(false);
          return;
        }
        await register(email, password, fullName);
        setCurrentView('dashboard');
      } else if (authMode === 'admin') {
        const logged = await login(email, password);
        if (logged.role !== 'admin') {
          setError('This account does not possess admin privileges.');
          setLoading(false);
          return;
        }
        setCurrentView('admin-dashboard');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.response?.data?.detail || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full glass-card p-8 sm:p-10 rounded-3xl border border-gold-300/50 shadow-2xl relative overflow-hidden"
      >
        {/* Top Gold Accent Bar */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${
          authMode === 'admin'
            ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600'
            : 'bg-gradient-to-r from-gold-400 via-amber-300 to-gold-600'
        }`} />

        <div className="text-center mb-8 space-y-2">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white mx-auto shadow-gold-glow mb-3 ${
            authMode === 'admin'
              ? 'bg-gradient-to-tr from-amber-600 to-gold-500'
              : 'bg-gradient-to-tr from-gold-500 to-amber-300'
          }`}>
            {authMode === 'admin' ? <ShieldCheck className="w-6 h-6" /> : <Camera className="w-6 h-6" />}
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-dark-900 dark:text-zinc-100">
            {authMode === 'admin'
              ? 'Admin & Host Studio'
              : authMode === 'login'
              ? 'Welcome Back, Guest'
              : 'Join the Celebration'}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {authMode === 'admin'
              ? 'Sign in to create wedding events, upload media & index faces'
              : authMode === 'login'
              ? 'Enter your credentials to discover your matched memories'
              : 'Register your guest account to scan your face and download photos'}
          </p>
        </div>

        {/* 3-Tab Switcher: Guest | Sign Up | Admin */}
        <div className="grid grid-cols-3 p-1 bg-zinc-100 dark:bg-dark-800 rounded-xl mb-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setAuthMode('login'); setError(null); setEmail(''); setPassword(''); }}
            className={`py-2 rounded-lg transition-all ${
              authMode === 'login' ? 'bg-white dark:bg-dark-900 text-dark-900 dark:text-zinc-100 shadow-sm font-bold' : 'text-zinc-500'
            }`}
          >
            Guest
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('register'); setError(null); setEmail(''); setPassword(''); }}
            className={`py-2 rounded-lg transition-all ${
              authMode === 'register' ? 'bg-white dark:bg-dark-900 text-dark-900 dark:text-zinc-100 shadow-sm font-bold' : 'text-zinc-500'
            }`}
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => { 
              setAuthMode('admin'); 
              setError(null); 
              setEmail('thakurdps795@gmail.com'); 
              setPassword('788052'); 
            }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center space-x-1 ${
              authMode === 'admin' ? 'bg-amber-600 text-white shadow-sm font-bold' : 'text-amber-700 dark:text-amber-400 font-bold'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center space-x-2 text-rose-700 dark:text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {authMode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your Full Name"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/70 dark:bg-dark-800/80 text-sm text-dark-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-gold-400"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              {authMode === 'admin' ? 'Admin Email' : 'Email Address'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={authMode === 'admin' ? 'admin@example.com' : 'guest@wedding.com'}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/70 dark:bg-dark-800/80 text-sm text-dark-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-gold-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/70 dark:bg-dark-800/80 text-sm text-dark-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-gold-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-xl text-white font-semibold text-sm shadow-gold-glow hover:scale-101 transition-all flex items-center justify-center space-x-2 mt-2 ${
              authMode === 'admin'
                ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700'
                : 'bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-600'
            }`}
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>
                  {authMode === 'admin'
                    ? 'Enter Admin Studio'
                    : authMode === 'login'
                    ? 'Sign In to Event Memories'
                    : 'Complete Registration'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

      </motion.div>
    </div>
  );
};
