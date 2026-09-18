import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, Mail, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';

export const AdminLoginPage = ({ setCurrentView }) => {
  const [email, setEmail] = useState('thakurdps795@gmail.com');
  const [password, setPassword] = useState('788052');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const logged = await login(email, password);
      if (logged.role !== 'admin') {
        setError('Your account does not possess admin privileges.');
        setLoading(false);
        return;
      }
      setCurrentView('admin-dashboard');
    } catch (err) {
      console.error('Admin login error:', err);
      setError(err.response?.data?.detail || 'Invalid admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async () => {
    setEmail('thakurdps795@gmail.com');
    setPassword('788052');
    setLoading(true);
    try {
      const logged = await login('thakurdps795@gmail.com', '788052');
      if (logged.role === 'admin') {
        setCurrentView('admin-dashboard');
      }
    } catch (err) {
      setError('Admin sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full glass-card p-8 sm:p-10 rounded-3xl border border-amber-500/40 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-gold-500 to-amber-600" />

        <div className="text-center mb-8 space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-gold-500 flex items-center justify-center text-white mx-auto shadow-gold-glow mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-dark-900 dark:text-zinc-100">
            Admin &amp; Host Portal
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Authorized management studio for wedding events, media uploads &amp; face matching
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center space-x-2 text-rose-700 dark:text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="thakurdps795@gmail.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/70 dark:bg-dark-800/80 text-sm text-dark-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/70 dark:bg-dark-800/80 text-sm text-dark-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-gold-500 hover:from-amber-700 hover:to-gold-600 text-white font-semibold text-sm shadow-md hover:scale-101 transition-all flex items-center justify-center space-x-2 mt-2"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Admin Studio</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* 1-Click Fast Admin Sign In */}
        <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800 space-y-3 text-center">
          <button
            type="button"
            onClick={handleQuickLogin}
            className="w-full py-2.5 px-4 rounded-xl border border-amber-500/60 bg-amber-50/60 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs font-bold hover:bg-amber-100/60 transition-colors flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>1-Click Admin Sign In (thakurdps795@gmail.com)</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('login')}
            className="text-xs text-zinc-500 hover:text-gold-600 transition-colors"
          >
            ← Return to Guest Portal
          </button>
        </div>

      </motion.div>
    </div>
  );
};
