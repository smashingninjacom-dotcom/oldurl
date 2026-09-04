'use client';

import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { X, Mail, Lock, Sparkles, User, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'signup';
}

export default function AuthModal({ isOpen, onClose, defaultMode = 'signup' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        setSuccessMsg('Account created successfully! Check your email to confirm, or you can now sign in.');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setSuccessMsg('Signed in successfully! Redirecting...');
        setTimeout(() => {
          onClose();
          window.location.href = '/dashboard';
        }, 1000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || 'Google login failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FC6B17] flex items-center justify-center mx-auto mb-3 shadow-xs">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-[#0d1b3e] tracking-tight">
            {mode === 'signup' ? 'Create your free account' : 'Welcome back'}
          </h2>
          <p className="text-xs text-gray-500">
            {mode === 'signup'
              ? 'Find high-authority expired domains in seconds'
              : 'Sign in to access your domain searches & metrics'}
          </p>
        </div>

        {/* Social Login */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full py-2.5 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2.5 transition-colors shadow-2xs mb-4"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="flex items-center gap-3 my-4">
          <div className="h-px bg-gray-200 flex-1" />
          <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">or email</span>
          <div className="h-px bg-gray-200 flex-1" />
        </div>

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Sanjay Kumar"
                  className="w-full pl-10 pr-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#FC6B17]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sanjay@example.com"
                className="w-full pl-10 pr-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#FC6B17]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#FC6B17]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#FC6B17] hover:bg-[#e05607] disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-[0_2px_8px_rgba(252,107,23,0.3)] transition-all flex items-center justify-center gap-1.5 mt-2"
          >
            {loading ? (
              <span>Processing...</span>
            ) : mode === 'signup' ? (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Footer Toggle */}
        <div className="text-center mt-5 text-xs text-gray-500">
          {mode === 'signup' ? (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-[#FC6B17] font-bold hover:underline"
              >
                Sign in
              </button>
            </span>
          ) : (
            <span>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="text-[#FC6B17] font-bold hover:underline"
              >
                Create one free
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
