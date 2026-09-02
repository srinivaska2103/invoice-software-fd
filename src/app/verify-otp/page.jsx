'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, ShieldCheck, RefreshCw, ArrowLeft } from 'lucide-react';
import { authApi } from '@/services/api';
import useAuthStore from '@/store/useAuthStore';
import { Button, Input } from '@/components/common/UIComponents';
import { AuthLayout } from '@/layouts/MainLayout';

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { setAuth } = useAuthStore();

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await authApi.verifyOtp({ email, code });
      const { user, token } = response.data;
      setAuth(user, token);
      router.push('/');
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('Please provide your email address to resend OTP.');
      return;
    }
    setError('');
    setMessage('');
    setResending(true);

    try {
      const response = await authApi.resendOtp({ email });
      setMessage(response.message || `A new 6-digit OTP has been sent to ${email}.`);
    } catch (err) {
      setError(err.message || 'Failed to resend OTP code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <div className="text-center space-y-2 mb-6">
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-200">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Verify Your Account</h2>
        <p className="text-xs text-slate-500">
          Enter the 6-digit OTP code sent to your email to activate your account.
        </p>
      </div>

      {message && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-3 rounded-xl mb-4 font-medium">
          {message}
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-3 rounded-xl mb-4 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          icon={Mail}
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          label="6-Digit OTP Code"
          type="text"
          maxLength={6}
          placeholder="e.g. 123456"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="tracking-widest text-center font-mono font-bold text-lg"
          required
        />

        <Button type="submit" isLoading={loading} className="w-full">
          Verify & Access Dashboard
        </Button>
      </form>

      <div className="flex items-center justify-between text-xs mt-6 pt-4 border-t border-slate-100">
        <Link href="/login" className="text-slate-500 hover:text-slate-700 flex items-center gap-1 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
        </Link>

        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="text-indigo-600 font-semibold hover:underline flex items-center gap-1 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} /> Resend OTP
        </button>
      </div>
    </>
  );
}

export default function VerifyOtpPage() {
  return (
    <AuthLayout>
      <Suspense fallback={<div>Loading...</div>}>
        <VerifyOtpContent />
      </Suspense>
    </AuthLayout>
  );
}
