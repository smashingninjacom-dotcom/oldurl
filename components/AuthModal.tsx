'use client';

import React, { useState, useEffect, useRef } from 'react';
import { signInWithGoogle, signInWithGoogleIdToken, GOOGLE_CLIENT_ID } from '../lib/supabaseClient';
import { X, Sparkles, AlertCircle, ArrowRight, Zap } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'signup';
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const gsiRef = useRef<HTMLDivElement>(null);

  const [isGsiLoaded, setIsGsiLoaded] = useState(false);

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;

    const initGsi = () => {
      const google = (window as any).google;
      if (google?.accounts?.id && gsiRef.current) {
        try {
          google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: async (response: any) => {
              if (response?.credential) {
                setLoading(true);
                try {
                  await signInWithGoogleIdToken(response.credential);
                  window.location.href = '/dashboard';
                } catch (err: any) {
                  setErrorMsg(err.message || 'Google sign-in failed.');
                  setLoading(false);
                }
              }
            },
          });

          gsiRef.current.innerHTML = '';
          google.accounts.id.renderButton(gsiRef.current, {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            shape: 'pill',
            text: 'continue_with',
            logo_alignment: 'left',
            width: 340,
          });
          setIsGsiLoaded(true);
        } catch (e) {
          console.warn('GSI init notice:', e);
        }
      }
    };

    initGsi();
    const timer = setTimeout(initGsi, 400);
    const timer2 = setTimeout(initGsi, 1200);
    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, [isOpen]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setErrorMsg(err.message || 'Google sign-in failed. Please check Supabase Google provider configuration.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 text-center">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Icon */}
        <div className="w-14 h-14 rounded-2xl bg-orange-50 text-[#FC6B17] flex items-center justify-center mx-auto mb-4 shadow-xs">
          <Sparkles className="w-7 h-7" />
        </div>

        {/* Header */}
        <h2 className="text-2xl font-black text-[#0d1b3e] tracking-tight">
          Sign in to OldUrl
        </h2>
        <p className="text-xs text-gray-500 mt-1.5 max-w-xs mx-auto leading-relaxed">
          Unlock instant high-DR expired domain searches and backlink metrics.
        </p>

        {/* Feature Points */}
        <div className="bg-gray-50/80 rounded-2xl p-4 my-6 text-left space-y-2 border border-gray-100">
          <div className="flex items-center gap-2.5 text-xs text-gray-700 font-semibold">
            <Zap className="w-4 h-4 text-[#FC6B17] flex-shrink-0" />
            <span>Real-time Domain Authority (DR) backlink audit</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-gray-700 font-semibold">
            <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span>Cloud search history &amp; custom domain watchlists</span>
          </div>
        </div>

        {/* Feedback Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Google Auth Container */}
        <div className="w-full flex flex-col items-center justify-center min-h-[50px]">
          <div ref={gsiRef} className="flex justify-center w-full" />

          {!isGsiLoaded && (
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-3.5 px-5 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 text-gray-800 font-extrabold text-sm rounded-2xl flex items-center justify-center gap-3 transition-all shadow-sm hover:shadow hover:-translate-y-0.5 disabled:opacity-60"
            >
              {loading ? (
                <span className="text-gray-500">Connecting to Google...</span>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                  <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
                </>
              )}
            </button>
          )}
        </div>

        <p className="text-[11px] text-gray-400 mt-4">
          By signing in, you agree to the Terms of Service &amp; Privacy Policy.
        </p>
      </div>
    </div>
  );
}
