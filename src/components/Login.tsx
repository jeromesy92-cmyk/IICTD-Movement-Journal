import React, { useState } from 'react';
import { Shield, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';
import { UserData } from '../App';
import { Logo } from './Logo';

export default function Login({ onLogin }: { onLogin: (user: UserData) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetUsername, setResetUsername] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Welcome back, ' + data.user.full_name);
        onLogin(data.user);
      } else {
        toast.error(data.message || 'Invalid credentials');
      }
    } catch (error) {
      toast.error('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: resetUsername })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Password reset instructions sent to your email');
        setIsResetting(false);
        setResetUsername('');
      } else {
        toast.error(data.message || 'Failed to reset password');
      }
    } catch (error) {
      toast.error('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020813] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#0a1930] via-[#020813] to-[#020813]" />
        
        <svg className="absolute w-full h-full" preserveAspectRatio="none" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="8" result="blur1" />
              <feGaussianBlur stdDeviation="16" result="blur2" />
              <feGaussianBlur stdDeviation="24" result="blur3" />
              <feMerge>
                <feMergeNode in="blur3" />
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Left Chevrons */}
          <g filter="url(#neon-glow)" stroke="#38bdf8" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 100 200 L 400 540 L 100 880" opacity="0.1" />
            <path d="M 180 250 L 450 540 L 180 830" opacity="0.2" />
            <path d="M 260 300 L 500 540 L 260 780" opacity="0.4" />
            <path d="M 340 350 L 550 540 L 340 730" opacity="0.7" />
            <path d="M 420 400 L 600 540 L 420 680" opacity="1" />
          </g>

          {/* Right Chevrons */}
          <g filter="url(#neon-glow)" stroke="#38bdf8" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 1820 200 L 1520 540 L 1820 880" opacity="0.1" />
            <path d="M 1740 250 L 1470 540 L 1740 830" opacity="0.2" />
            <path d="M 1660 300 L 1420 540 L 1660 780" opacity="0.4" />
            <path d="M 1580 350 L 1370 540 L 1580 730" opacity="0.7" />
            <path d="M 1500 400 L 1320 540 L 1500 680" opacity="1" />
          </g>
        </svg>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center mb-6">
            <Logo className="w-24 h-24" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">IICTD SYSTEM</h1>
          <p className="text-blue-400 font-bold uppercase tracking-[0.3em] text-xs">Movement Journal</p>
        </div>

        <div className="bg-[#001a33]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          {isResetting ? (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Username</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input 
                    type="text" 
                    required
                    value={resetUsername}
                    onChange={(e) => setResetUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Reset Password
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Username</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input 
                    type="text" 
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <p className="text-slate-500 text-sm">
              {isResetting ? (
                <>Remember your password? <button onClick={() => setIsResetting(false)} className="text-blue-400 hover:underline">Sign In</button></>
              ) : (
                <>Forgot your credentials? <button onClick={() => setIsResetting(true)} className="text-blue-400 hover:underline">Reset Password</button></>
              )}
            </p>
          </div>
        </div>

        <p className="text-center mt-8 text-slate-600 text-xs uppercase tracking-widest font-medium">
          Secure Access • IICTD Monitoring System
        </p>
      </motion.div>
    </div>
  );
}
