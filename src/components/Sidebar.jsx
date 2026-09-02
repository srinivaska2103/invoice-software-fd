'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutGrid,
  Users2,
  PackageCheck,
  Boxes,
  ReceiptText,
  BadgeIndianRupee,
  LineChart,
  Settings,
  X,
  Building2,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Truck,
  LogOut,
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import { authApi } from '../services/api';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutGrid },
  { name: 'Customers', path: '/customers', icon: Users2 },
  { name: 'Products', path: '/products', icon: PackageCheck },
  { name: 'Stock', path: '/stock', icon: Boxes },
  { name: 'Invoices', path: '/invoices', icon: ReceiptText },
  { name: 'Payments', path: '/payments', icon: BadgeIndianRupee },
  { name: 'Sales Agents', path: '/agents', icon: UserCheck },
  { name: 'Transports', path: '/transports', icon: Truck },
  { name: 'Reports', path: '/reports', icon: LineChart },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar = ({ isOpen, isCollapsed, toggleCollapse, closeMobileSidebar }) => {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();

  // Close mobile sidebar on Escape key & handle body scroll locking
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        closeMobileSidebar();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeMobileSidebar]);

  // Fetch real profile dynamically to show updated logo and company name
  const { data: profileRes } = useQuery({
    queryKey: ['user-profile'],
    queryFn: authApi.getProfile,
    staleTime: 1000 * 60 * 5,
  });

  const liveProfile = profileRes?.data || user;
  const logoUrl = liveProfile?.logo_url || user?.logo_url;
  const companyName = liveProfile?.company_name || user?.company_name || 'Vexatech';

  return (
    <>
      {/* Mobile / Tablet Overlay Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity duration-300 animate-in fade-in"
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}

      {/* Mobile & Tablet Bottom Sheet Navigation Tab Drawer (<1024px) */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[101] bg-white/95 backdrop-blur-2xl border-t border-slate-200/90 rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out lg:hidden flex flex-col max-h-[85vh] ${
          isOpen ? 'translate-y-0' : 'translate-y-full pointer-events-none'
        }`}
      >
        {/* Pull Handle Indicator */}
        <div className="w-12 h-1.5 rounded-full bg-slate-300/80 mx-auto mt-3 mb-1 shrink-0" />

        {/* Drawer Header */}
        <div className="px-5 py-2.5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            {logoUrl ? (
              <div className="w-8 h-8 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-xs">
                <img src={logoUrl} alt={companyName} className="w-full h-full object-contain p-1" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                <Building2 className="w-4 h-4" />
              </div>
            )}
            <div>
              <h3 className="font-black text-slate-900 text-sm leading-tight">{companyName}</h3>
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Navigation Tabs</p>
            </div>
          </div>
          <button
            onClick={closeMobileSidebar}
            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Tab Cards Grid */}
        <div className="p-4 overflow-y-auto max-h-[60vh] grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
            return (
              <Link
                key={item.name}
                href={item.path}
                onClick={closeMobileSidebar}
                className={`flex items-center gap-2.5 p-3 rounded-2xl font-extrabold text-xs transition-all duration-200 border ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30 ring-2 ring-indigo-300/50 scale-[1.02]'
                    : 'bg-slate-50/90 text-slate-700 border-slate-200/70 hover:bg-indigo-50/70 hover:text-indigo-600 hover:border-indigo-200'
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${
                  isActive ? 'bg-white/20 text-white' : 'bg-white text-indigo-600 border border-slate-200/80 shadow-2xs'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Footer User Profile & Logout */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-3xl flex items-center justify-between shrink-0 pb-safe">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-700 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs shadow-indigo-500/20">
              {(liveProfile?.full_name || liveProfile?.name || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col truncate">
              <span className="font-bold text-slate-900 text-xs truncate">
                {liveProfile?.full_name || liveProfile?.name || 'Admin User'}
              </span>
              <span className="text-[10px] font-medium text-slate-500 truncate">
                {liveProfile?.email || user?.email || ''}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              if (closeMobileSidebar) closeMobileSidebar();
              window.location.href = '/login';
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-extrabold text-xs transition border border-rose-200/60 shadow-2xs cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Desktop Sidebar Container (>=1024px) */}
      <aside
        className={`hidden lg:flex fixed top-0 left-0 z-50 h-screen bg-white border-r border-slate-200/90 transition-all duration-300 ease-in-out flex-col justify-between ${
          isCollapsed ? 'lg:w-20' : 'lg:w-20 xl:w-64'
        } shadow-none`}
      >
        <div>
          {/* Header */}
          <div className={`h-16 flex items-center justify-between border-b border-slate-100 transition-all ${
            isCollapsed ? 'lg:px-3' : 'px-4'
          }`}>
            <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
              {logoUrl ? (
                <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-xs">
                  <img src={logoUrl} alt={companyName} className="w-full h-full object-contain p-1" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-200 shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
              )}

              {!isCollapsed && (
                <div className="flex flex-col truncate">
                  <span className="font-extrabold text-slate-800 text-sm sm:text-base leading-tight truncate">
                    {companyName}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-600">
                    Billing Admin
                  </span>
                </div>
              )}
            </div>

            {/* Desktop / Laptop Collapse Toggle */}
            <button
              onClick={toggleCollapse}
              className="flex items-center justify-center p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition shrink-0"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-2.5 sm:p-3.5 space-y-1.5 overflow-y-auto max-h-[calc(100vh-140px)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  title={item.name}
                  className={`flex items-center gap-3 py-2.5 rounded-2xl font-semibold text-sm transition-all duration-200 group relative ${
                    isCollapsed ? 'lg:justify-center lg:px-2' : 'px-3.5'
                  } ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-500/10 via-indigo-500/5 to-transparent text-indigo-700 font-extrabold ring-1 ring-indigo-500/15 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1.5 rounded-r-full bg-indigo-600 shadow-sm shadow-indigo-500/50" />
                  )}
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-600'
                    }`}
                  />
                  <span className={`truncate ${isCollapsed ? 'lg:hidden' : 'inline'}`}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer User Profile & Logout */}
        <div className="p-3 border-t border-slate-100/80 space-y-2">
          <div className={`flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-gradient-to-r from-slate-50 via-indigo-50/30 to-slate-50 border border-slate-200/80 shadow-2xs ${
            isCollapsed ? 'lg:flex-col lg:justify-center lg:p-2' : ''
          }`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-700 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs shadow-indigo-500/20">
                {liveProfile?.full_name || liveProfile?.name
                  ? (liveProfile.full_name || liveProfile.name).charAt(0).toUpperCase()
                  : 'A'}
              </div>
              {!isCollapsed && (
                <div className="flex flex-col truncate">
                  <span className="font-bold text-slate-900 text-xs truncate">
                    {liveProfile?.full_name || liveProfile?.name || 'Admin User'}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 truncate">
                    {liveProfile?.email || user?.email || 'admin@vexatech.com'}
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                logout();
                window.location.href = '/login';
              }}
              className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer shrink-0"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
