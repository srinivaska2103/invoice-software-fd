'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  Users,
  UserCheck,
  FileText,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  Plus,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { dashboardApi } from '@/services/api';
import { formatCurrency } from '@/utils/formatters';
import { Card, Button, Skeleton, Badge } from '@/components/common/UIComponents';
import Link from 'next/link';

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export function DashboardComponent() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: statsResponse, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
  });

  const rawData = statsResponse?.data;

  const stats = {
    totalSales: rawData?.total_sales ?? 0,
    totalCustomers: rawData?.total_customers ?? 0,
    totalAgents: rawData?.total_agents ?? 0,
    totalInvoices: rawData?.total_invoices ?? 0,
    pendingAmount: rawData?.total_pending_amount ?? 0,
    lowStockCount: rawData?.low_stock_count ?? 0,
    recentInvoices: rawData?.recent_invoices || rawData?.recentInvoices || [],
    salesChart: rawData?.sales_chart || rawData?.salesChart || [],
    topProducts: Array.isArray(rawData?.top_products)
      ? rawData.top_products.map((tp) => ({
          name: tp.item_name || tp.name || 'Product',
          value: tp.quantity_sold ?? tp.value ?? 0,
        }))
      : [],
  };

  const statCards = [
    {
      title: 'Total Sales',
      value: formatCurrency(stats.totalSales),
      icon: TrendingUp,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      title: 'Total Customers',
      value: stats.totalCustomers,
      icon: Users,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    {
      title: 'Total Agents',
      value: stats.totalAgents,
      icon: UserCheck,
      color: 'text-purple-600 bg-purple-50 border-purple-100',
    },
    {
      title: 'Total Invoices',
      value: stats.totalInvoices,
      icon: FileText,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    {
      title: 'Pending Amount',
      value: formatCurrency(stats.pendingAmount),
      icon: Clock,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
    {
      title: 'Low Stock Alerts',
      value: stats.lowStockCount,
      icon: AlertTriangle,
      color: 'text-rose-600 bg-rose-50 border-rose-100',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 pb-24 sm:pb-32 lg:pb-8">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-800 p-4 sm:p-6 rounded-3xl text-white shadow-xl shadow-indigo-950/10">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Overview Dashboard</h1>
          <p className="text-xs sm:text-sm text-indigo-200 mt-1">
            Real-time insights into sales, customer ledger, agents, and inventory stock.
          </p>
        </div>
        <Link href="/invoices/new" className="shrink-0">
          <Button icon={Plus} variant="white" size="sm" className="w-full sm:w-auto">
            New Invoice
          </Button>
        </Link>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Card key={idx} className="p-3.5 sm:p-4 relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 border-slate-200/80">
              <div className="flex items-center justify-between">
                <div className={`p-2 sm:p-2.5 rounded-2xl border ${card.color} transition-transform duration-200 group-hover:scale-110`}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
              </div>
              <div className="mt-3">
                <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">{card.title}</p>
                {isLoading ? (
                  <Skeleton className="h-7 w-24 mt-1" />
                ) : (
                  <p className="text-lg sm:text-xl font-black text-slate-900 mt-0.5 truncate">{card.value}</p>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card title="Monthly Sales Revenue" className="lg:col-span-2">
          <div className="h-64 sm:h-72 w-full pt-2 flex items-center justify-center">
            {isMounted ? (
              stats.salesChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.salesChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip
                      formatter={(value) => [formatCurrency(value), 'Revenue']}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="sales" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-slate-400 font-medium text-center">
                  No sales data recorded yet. Create invoices to populate charts.
                </div>
              )
            ) : (
              <Skeleton className="h-full w-full" />
            )}
          </div>
        </Card>

        <Card title="Top Selling Products">
          <div className="h-64 sm:h-72 w-full flex items-center justify-center">
            {isMounted ? (
              stats.topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.topProducts}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats.topProducts.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-slate-400 font-medium text-center">
                  No products sold yet.
                </div>
              )
            ) : (
              <Skeleton className="h-full w-full" />
            )}
          </div>
        </Card>
      </div>

      {/* Recent Invoices Card */}
      <Card
        title="Recent Invoices"
        action={
          <Link href="/invoices" className="text-xs font-bold text-indigo-600 hover:underline">
            View All →
          </Link>
        }
      >
        {stats.recentInvoices.length > 0 ? (
          <>
            {/* Desktop Table View (>=768px) */}
            <div className="hidden md:block overflow-x-auto min-w-0">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="text-[11px] uppercase bg-slate-50 text-slate-400 font-bold border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">Invoice #</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {stats.recentInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-semibold text-indigo-600">{inv.invoiceNumber}</td>
                      <td className="py-3 px-3 text-slate-800 font-medium">{inv.customerName}</td>
                      <td className="py-3 px-3 font-semibold text-slate-800">{formatCurrency(inv.grandTotal)}</td>
                      <td className="py-3 px-3">
                        <Badge variant={inv.status === 'PAID' ? 'emerald' : 'amber'}>{inv.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List (<768px) */}
            <div className="md:hidden space-y-2.5">
              {stats.recentInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-indigo-600 truncate">{inv.invoiceNumber}</span>
                      <Badge variant={inv.status === 'PAID' ? 'emerald' : 'amber'}>{inv.status}</Badge>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 mt-1 truncate">{inv.customerName}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-extrabold text-slate-900 block">{formatCurrency(inv.grandTotal)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            No recent invoices found. Create your first invoice to view history.
          </div>
        )}
      </Card>

      {/* Recent Activities Done by Users Card */}
      <Card
        title="Recent Activities Done by Users"
        action={
          <Link href="/stock" className="text-xs font-bold text-indigo-600 hover:underline">
            View Audit Log →
          </Link>
        }
      >
        {(rawData?.recent_activities || rawData?.recentActivities || []).length > 0 ? (
          <>
            {/* Desktop Table View (>=768px) */}
            <div className="hidden md:block overflow-x-auto min-w-0">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="text-[11px] uppercase bg-slate-50 text-slate-400 font-bold border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">User / Performer</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Details / Product</th>
                    <th className="py-2.5 px-3">Remarks</th>
                    <th className="py-2.5 px-3">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(rawData?.recent_activities || rawData?.recentActivities || []).map((act) => (
                    <tr key={act.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-semibold text-slate-800 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                          {(act.user || 'U').charAt(0).toUpperCase()}
                        </div>
                        {act.user}
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant={act.action?.includes('Added') || act.action?.includes('Restocked') ? 'emerald' : 'rose'}>
                          {act.action}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-700">{act.details}</td>
                      <td className="py-3 px-3 text-xs text-slate-500">{act.remarks}</td>
                      <td className="py-3 px-3 text-xs text-slate-400">
                        {act.date ? new Date(act.date).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (<768px) */}
            <div className="md:hidden space-y-3">
              {(rawData?.recent_activities || rawData?.recentActivities || []).map((act) => (
                <div
                  key={act.id}
                  className="p-3 sm:p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 space-y-2 text-left"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-extrabold shrink-0">
                        {(act.user || 'U').charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-slate-900 truncate">{act.user}</span>
                    </div>
                    <div className="self-start sm:self-auto">
                      <Badge
                        variant={act.action?.includes('Added') || act.action?.includes('Restocked') ? 'emerald' : 'rose'}
                        className="text-[10px] py-0.5 px-2 font-bold whitespace-nowrap"
                      >
                        {act.action}
                      </Badge>
                    </div>
                  </div>
                  <div className="pt-0.5">
                    <p className="text-xs font-semibold text-slate-800 leading-snug">{act.details}</p>
                    {act.remarks && (
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{act.remarks}</p>
                    )}
                  </div>
                  {act.date && (
                    <p className="text-[10px] font-medium text-slate-400 text-right pt-0.5">
                      {new Date(act.date).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            No recent user activities recorded yet.
          </div>
        )}
      </Card>
    </div>
  );
}
