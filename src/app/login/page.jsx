'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock } from 'lucide-react';
import { authApi } from '@/services/api';
import useAuthStore from '@/store/useAuthStore';
import { Button, Input } from '@/components/common/UIComponents';
import { AuthLayout } from '@/layouts/MainLayout';
import { AuthBrandHeader } from '@/components/AuthBrandHeader';

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await authApi.login(formData);
      const { user, token } = response.data;
      setAuth(user, token);
      router.push('/');
    } catch (err) {
      const errMsg = err.message || '';
      if (errMsg.toLowerCase().includes('verify') || errMsg.toLowerCase().includes('otp')) {
        router.push(`/verify-otp?email=${encodeURIComponent(formData.email)}`);
        return;
      }
      setError(errMsg || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthBrandHeader subtitle="Sign in to your Billing & Inventory System" />

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-3 rounded-xl mb-4 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          icon={Mail}
          placeholder="admin@vexatech.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />

        <Input
          label="Password"
          type="password"
          icon={Lock}
          placeholder="••••••••"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
        />

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
            <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" />
            Remember me
          </label>
          <Link href="/forgot-password" className="text-indigo-600 font-medium hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" isLoading={loading} className="w-full">
          Sign In
        </Button>
      </form>

      <div className="flex items-center justify-between text-xs text-slate-500 mt-6 pt-4 border-t border-slate-100">
        <span>Need OTP Verification?</span>
        <Link href="/verify-otp" className="text-indigo-600 font-semibold hover:underline">
          Verify OTP
        </Link>
      </div>
    </AuthLayout>
  );
}
