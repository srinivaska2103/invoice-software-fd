import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutGrid, ReceiptText, Plus, Boxes, Menu } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import useAuthStore from '../store/useAuthStore';
import { Skeleton } from '../components/common/UIComponents';

export const MainLayout = ({ children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const { isAuthenticated, syncAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    syncAuth();
    setIsHydrated(true);
  }, [syncAuth]);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [isHydrated, isAuthenticated, router]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-4 text-center">
          <Skeleton className="h-12 w-12 mx-auto rounded-2xl" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const mobileNavItems = [
    { name: 'Home', path: '/', icon: LayoutGrid },
    { name: 'Invoices', path: '/invoices', icon: ReceiptText },
    { name: 'Create', path: '/invoices/new', icon: Plus, isAction: true },
    { name: 'Stock', path: '/stock', icon: Boxes },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-500 selection:text-white">
      <Sidebar
        isOpen={mobileSidebarOpen}
        isCollapsed={sidebarCollapsed}
        toggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        closeMobileSidebar={() => setMobileSidebarOpen(false)}
      />

      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-20 xl:ml-64'
        }`}
      >
        <Navbar onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />

        <main className="flex-1 p-3.5 sm:p-5 md:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-44 lg:pb-12">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (<1024px) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 lg:hidden flex items-center justify-between h-16 px-1.5 sm:px-4 shadow-lg shadow-slate-900/10">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;

          if (item.isAction) {
            return (
              <Link
                key={item.name}
                href={item.path}
                className="flex-1 flex flex-col items-center justify-center -mt-5"
                title="Create Invoice"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 hover:scale-105 active:scale-95 transition">
                  <Plus className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-extrabold text-indigo-600 mt-0.5">
                  {item.name}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.path}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition ${
                isActive ? 'text-indigo-600 font-extrabold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-bold mt-0.5">{item.name}</span>
            </Link>
          );
        })}

        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="flex-1 flex flex-col items-center justify-center py-1 rounded-xl text-slate-500 hover:text-slate-800 transition cursor-pointer"
          aria-label="More navigation options"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">More</span>
        </button>
      </nav>
    </div>
  );
};

export const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8 space-y-6">
        {children}
      </div>
    </div>
  );
};
