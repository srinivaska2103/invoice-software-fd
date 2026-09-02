'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Menu,
  LogOut,
  Bell,
  PlusCircle,
  AlertTriangle,
  FileText,
  CheckCircle2,
  ChevronRight,
  Settings,
  BarChart2,
  Boxes,
  ChevronDown,
  User as UserIcon,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import { dashboardApi } from '../services/api';
import { Button, Badge } from './common/UIComponents';
import { playNotificationBellSound } from '../utils/soundUtils';


export const Navbar = ({ onOpenMobileSidebar }) => {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [readNotifIds, setReadNotifIds] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('read_notification_ids');
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const markAsRead = (idList) => {
    setReadNotifIds((prev) => {
      const updated = Array.from(new Set([...prev, ...idList]));
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('read_notification_ids', JSON.stringify(updated));
        } catch (e) {}
      }
      return updated;
    });
  };

  const handleMarkAllAsRead = (e) => {
    e.stopPropagation();
    markAsRead(notifications.map((n) => n.id));
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleBellClick = () => {
    setIsNotificationOpen(!isNotificationOpen);
  };

  const { data: statsRes } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
    refetchInterval: 8000, // Real-time notification polling
  });

  const stats = statsRes?.data || {};
  const lowStockCount = stats?.low_stock_count ?? 0;
  const recentActivities = stats?.recent_activities || stats?.recentActivities || [];
  const recentInvoices = stats?.recent_invoices || stats?.recentInvoices || [];

  const notifications = [
    ...(lowStockCount > 0
      ? [
          {
            id: 'low-stock-alert',
            type: 'alert',
            title: 'Low Stock Alert',
            description: `${lowStockCount} product size variant(s) have reached minimum stock limit.`,
            link: '/stock',
            time: 'Action Needed',
            icon: AlertTriangle,
            badgeColor: 'rose',
          },
        ]
      : []),
    ...recentInvoices
      .filter((inv) => inv.status === 'PENDING' || inv.status === 'OVERDUE' || inv.status === 'ISSUED')
      .slice(0, 3)
      .map((inv) => ({
        id: `inv-${inv.id}`,
        type: 'invoice',
        title: `Invoice #${inv.invoiceNumber}`,
        description: `${inv.customerName} - Balance: ₹${inv.grandTotal}`,
        link: '/invoices',
        time: inv.status,
        icon: FileText,
        badgeColor: inv.status === 'OVERDUE' ? 'rose' : 'amber',
      })),
    ...recentActivities.slice(0, 3).map((act) => ({
      id: `act-${act.id}`,
      type: 'activity',
      title: act.action || 'Stock Adjustment',
      description: `${act.user}: ${act.details}`,
      link: '/stock',
      time: act.date ? new Date(act.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
      icon: CheckCircle2,
      badgeColor: 'indigo',
    })),
  ];

  const unreadNotifications = notifications.filter((n) => !readNotifIds.includes(n.id));

  // Automatic Sound Playback on New Notification / Low Stock Event (NO CLICK NEEDED)
  const prevNotifIdsRef = React.useRef(null);
  const prevLowStockRef = React.useRef(null);
  const notifRef = React.useRef(null);
  const userMenuRef = React.useRef(null);

  // Auto-close dropdowns automatically when clicking outside or pressing Escape key
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotificationOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsNotificationOpen(false);
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  React.useEffect(() => {
    const currentIds = notifications.map((n) => n.id);

    if (prevNotifIdsRef.current !== null) {
      const prevSet = new Set(prevNotifIdsRef.current);
      const hasNewNotification = currentIds.some((id) => !prevSet.has(id));
      const hasNewLowStock = prevLowStockRef.current !== null && lowStockCount > prevLowStockRef.current;

      if (hasNewNotification || hasNewLowStock) {
        playNotificationBellSound();
      }
    }

    prevNotifIdsRef.current = currentIds;
    prevLowStockRef.current = lowStockCount;
  }, [notifications, lowStockCount]);

  return (
    <header className="sticky top-0 z-50 h-16 bg-white/90 backdrop-blur-2xl border-b border-slate-200/80 px-3 sm:px-5 md:px-6 flex items-center justify-between min-w-0 shadow-2xs">
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="hidden"
          title="Open Menu"
        >
          <Menu className="w-5 h-5 stroke-[2.2]" />
        </button>
        <div className="min-w-0">
          <h2 className="text-xs sm:text-base font-black text-slate-900 tracking-tight truncate">
            <span className="inline sm:hidden">Billing System</span>
            <span className="hidden sm:inline">Billing & Inventory System</span>
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <Link href="/invoices/new" className="inline-flex">
          <Button size="sm" icon={PlusCircle} className="px-2 py-1 text-[11px] sm:px-3 sm:py-1.5 sm:text-xs">
            <span className="hidden md:inline">Create Invoice</span>
            <span className="md:hidden">Invoice</span>
          </Button>
        </Link>

        {/* Notification Bell Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={handleBellClick}
            className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition focus:outline-none"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse"></span>
            )}
          </button>

          {isNotificationOpen && (
            <>
              <div
                className="fixed inset-0 z-[90]"
                onClick={() => setIsNotificationOpen(false)}
              ></div>
              <div className="fixed top-16 left-3 right-3 sm:absolute sm:top-auto sm:left-auto sm:right-0 sm:mt-3 sm:w-96 sm:max-w-sm bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-3xl shadow-2xl shadow-indigo-950/20 z-[100] p-3.5 sm:p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600">
                      <Bell className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-800">Notifications</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadNotifications.length > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1 rounded-lg transition"
                      >
                        Mark all as read
                      </button>
                    )}
                    <Badge variant="indigo">{unreadNotifications.length} Alerts</Badge>
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                  {unreadNotifications.length > 0 ? (
                    unreadNotifications.map((n) => {
                      const IconComponent = n.icon || Bell;
                      return (
                        <Link
                          key={n.id}
                          href={n.link}
                          onClick={() => {
                            markAsRead([n.id]);
                            setIsNotificationOpen(false);
                          }}
                          className="block p-3 rounded-2xl bg-slate-50/80 hover:bg-indigo-50/70 border border-slate-100 transition group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <IconComponent className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                              <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-700">
                                {n.title}
                              </span>
                            </div>
                            <Badge variant={n.badgeColor}>{n.time}</Badge>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1.5 leading-snug pl-6">
                            {n.description}
                          </p>
                        </Link>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400 font-medium">
                      No unread notifications at the moment.
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-2 text-center">
                  <Link
                    href="/stock"
                    onClick={() => setIsNotificationOpen(false)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
                  >
                    View System Audit Logs <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="h-6 w-[1px] bg-slate-200"></div>

        {/* Interactive User Profile Dropdown Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => {
              setIsUserMenuOpen(!isUserMenuOpen);
              if (isNotificationOpen) setIsNotificationOpen(false);
            }}
            className="flex items-center gap-1.5 sm:gap-2.5 bg-gradient-to-r from-slate-50 via-white to-indigo-50/40 hover:from-indigo-50/90 hover:to-indigo-100/50 border border-slate-200/90 hover:border-indigo-300 rounded-2xl p-1 sm:px-3 sm:py-1.5 shadow-2xs hover:shadow-xs transition-all duration-200 group cursor-pointer"
            aria-label="User menu"
          >
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-700 text-white font-black text-xs flex items-center justify-center shadow-xs shadow-indigo-500/20 group-hover:scale-105 transition-transform shrink-0">
              {(user?.name || user?.full_name || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="text-left hidden sm:block leading-tight pr-1">
              <p className="text-xs font-black text-slate-800 group-hover:text-indigo-950 transition-colors">
                {user?.name || user?.full_name || 'User'}
              </p>
              <span
                className={`inline-block text-[9px] font-extrabold px-1.5 py-0.2 rounded-md ${
                  user?.role === 'ADMIN'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-emerald-600 text-white shadow-2xs'
                }`}
              >
                {user?.role || 'USER'}
              </span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-transform duration-200 shrink-0 ${
                isUserMenuOpen ? 'rotate-180 text-indigo-600' : ''
              }`}
            />
          </button>

          {isUserMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-[90]"
                onClick={() => setIsUserMenuOpen(false)}
              ></div>
              <div className="absolute right-0 mt-2 w-72 bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-3xl shadow-2xl shadow-indigo-950/20 z-[100] p-2.5 space-y-2 animate-in fade-in zoom-in-95 duration-150 divide-y divide-slate-100">
                {/* Profile Card Header */}
                <div className="p-3 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/30 rounded-2xl border border-indigo-100/70 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-700 text-white font-black text-base flex items-center justify-center shadow-md shadow-indigo-500/20">
                    {(user?.name || user?.full_name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-black text-slate-900 truncate">
                      {user?.name || user?.full_name || 'User'}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                      {user?.email || 'authenticated_user'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                          user?.role === 'ADMIN'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {user?.role || 'USER'}
                      </span>
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Active
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Navigation Items */}
                <div className="pt-1.5 space-y-1">
                  <Link
                    href="/settings"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-indigo-50/70 hover:text-indigo-900 transition-colors"
                  >
                    <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                      <Settings className="w-3.5 h-3.5" />
                    </div>
                    System & Account Settings
                  </Link>

                  <Link
                    href="/stock"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-indigo-50/70 hover:text-indigo-900 transition-colors"
                  >
                    <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                      <Boxes className="w-3.5 h-3.5" />
                    </div>
                    Inventory Stock Ledger
                  </Link>

                  <Link
                    href="/reports"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-indigo-50/70 hover:text-indigo-900 transition-colors"
                  >
                    <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                      <BarChart2 className="w-3.5 h-3.5" />
                    </div>
                    Analytics & Business Reports
                  </Link>
                </div>

                {/* Logout Button */}
                <div className="pt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                      <LogOut className="w-3.5 h-3.5" />
                    </div>
                    Sign Out Account
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
