'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import useAuthStore from '../store/useAuthStore';
import { authApi } from '../services/api';
import { Building2 } from 'lucide-react';

export function AuthBrandHeader({ subtitle = 'Sign in to access your billing system' }) {
  const { user } = useAuthStore();

  // Fetch unauthenticated public branding from database
  const { data: brandingRes } = useQuery({
    queryKey: ['public-branding'],
    queryFn: authApi.getPublicBranding,
    staleTime: 1000 * 60 * 5,
  });

  const publicBranding = brandingRes?.data;
  const logoUrl = publicBranding?.logo_url || user?.logo_url;
  const companyName = publicBranding?.company_name || user?.company_name || 'Vexatech';

  return (
    <div className="text-center space-y-2 mb-6">
      {logoUrl ? (
        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto shadow-md shadow-indigo-50 p-1.5">
          <img src={logoUrl} alt={companyName} className="w-full h-full object-contain" />
        </div>
      ) : (
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-200">
          <Building2 className="w-6 h-6" />
        </div>
      )}
      <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{companyName}</h2>
      <p className="text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}
