'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
  CalendarRange,
  PackageSearch,
  PackagePlus,
  PackageMinus,
  FileClock,
  BarChart3,
  Warehouse,
  ChevronDown,
  CheckCircle2,
  Scale,
} from 'lucide-react';
import { stockApi, productApi } from '../services/api';
import { Button, Input, Table, Modal, Badge, Select, EmptyState, Card } from '../components/common/UIComponents';
import { formatDate } from '../utils/formatters';

export function StockComponent() {
  const queryClient = useQueryClient();
  const now = new Date();
  const currentFYStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const [selectedYear, setSelectedYear] = useState(currentFYStartYear);
  const [isYearMenuOpen, setIsYearMenuOpen] = useState(false);
  const yearMenuRef = useRef(null);
  const [activeTab, setActiveTab] = useState('yearly'); // 'yearly' | 'audit'

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (yearMenuRef.current && !yearMenuRef.current.contains(e.target)) {
        setIsYearMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustForm, setAdjustForm] = useState({
    productSizeId: '',
    quantity: 1,
    type: 'ADD',
    reason: '',
  });

  // Query Year-by-Year Stock Summary
  const { data: yearlyRes, isLoading: isYearlyLoading } = useQuery({
    queryKey: ['stock-yearly-summary', selectedYear],
    queryFn: () => stockApi.getYearlySummary({ year: selectedYear }),
  });

  // Query Manual Audit Logs
  const { data: logsRes, isLoading: isLogsLoading } = useQuery({
    queryKey: ['stock-logs'],
    queryFn: stockApi.getLogs,
  });

  const { data: productsRes } = useQuery({
    queryKey: ['products'],
    queryFn: productApi.getAll,
  });

  const rawYearly = yearlyRes?.data;
  const yearlyData = Array.isArray(rawYearly)
    ? rawYearly
    : Array.isArray(rawYearly?.summary)
    ? rawYearly.summary
    : Array.isArray(rawYearly?.data)
    ? rawYearly.data
    : Array.isArray(rawYearly?.items)
    ? rawYearly.items
    : [];

  const rawLogs = logsRes?.data;
  const logs = Array.isArray(rawLogs) ? rawLogs : Array.isArray(rawLogs?.data) ? rawLogs.data : [];

  const rawProducts = productsRes?.data;
  const products = Array.isArray(rawProducts) ? rawProducts : Array.isArray(rawProducts?.products) ? rawProducts.products : Array.isArray(rawProducts?.data) ? rawProducts.data : [];

  const sizeVariants = products.flatMap((p) =>
    (p.product_sizes || p.sizes || []).map((s) => ({
      id: s.id,
      label: `${p.item_name || p.name} - Size: ${s.size || s.sizeName} (Current Stock: ${s.current_stock ?? s.stock ?? 0})`,
    }))
  );

  const adjustMutation = useMutation({
    mutationFn: (data) => stockApi.adjust(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['stock-logs']);
      queryClient.invalidateQueries(['stock-yearly-summary']);
      queryClient.invalidateQueries(['products']);
      setIsAdjustModalOpen(false);
      setAdjustForm({
        productSizeId: '',
        quantity: 1,
        type: 'ADD',
        reason: '',
      });
    },
  });

  const handleAdjustSubmit = (e) => {
    e.preventDefault();
    if (!adjustForm.productSizeId) return;

    adjustMutation.mutate({
      product_size_id: adjustForm.productSizeId,
      quantity: parseInt(adjustForm.quantity, 10) || 1,
      type: adjustForm.type === 'ADD' ? 'IN' : 'OUT',
      transaction_type: adjustForm.type === 'ADD' ? 'IN' : 'OUT',
      remarks: adjustForm.reason || 'Manual Stock Adjustment',
    });
  };

  // Dynamically generate financial years: 5 future financial years + current FY + 10 past financial years.
  // As years change (e.g. 2027, 2028, etc.), currentFYStartYear updates automatically,
  // ensuring upcoming and future years (2027-28, 2028-29, 2029-30) are dynamically available.
  const futureYearsCount = 5;
  const pastYearsCount = 10;
  const startFY = currentFYStartYear + futureYearsCount;
  const totalYears = futureYearsCount + 1 + pastYearsCount;
  const availableYears = Array.from({ length: totalYears }, (_, i) => startFY - i);

  // Compute total aggregates for selected year
  const totalOpening = yearlyData.reduce((acc, item) => acc + (Number(item.openingStock || item.opening_stock) || 0), 0);
  const totalInward = yearlyData.reduce((acc, item) => acc + (Number(item.stockInward || item.stock_inward) || 0), 0);
  const totalOutward = yearlyData.reduce((acc, item) => acc + (Number(item.stockOutward || item.stock_outward || item.sold) || 0), 0);
  const totalClosing = yearlyData.reduce((acc, item) => acc + (Number(item.closingStock || item.closing_stock) || 0), 0);

  return (
    <div className="space-y-5 sm:space-y-6 pb-12 sm:pb-16">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white rounded-2xl shadow-lg shadow-indigo-600/20 ring-1 ring-white/20 shrink-0">
              <Warehouse className="w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[2.2]" />
            </div>
            Stock & Inventory Tracking
          </h1>
          <p className="text-[11px] sm:text-xs font-semibold text-slate-500 mt-1 leading-snug">
            Financial Year (April – March) inventory ledger calculations & manual audit adjustments.
          </p>
        </div>
        <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2.5 shrink-0">
          {/* Custom Modern Glassmorphic Year Dropdown Menu */}
          <div className="relative w-full xs:w-auto" ref={yearMenuRef}>
            <button
              type="button"
              onClick={() => setIsYearMenuOpen(!isYearMenuOpen)}
              className="w-full xs:w-auto flex items-center justify-between gap-2 bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-indigo-300 rounded-2xl px-3.5 sm:px-4 py-2.5 text-xs font-bold text-slate-800 shadow-2xs hover:shadow transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shrink-0">
                  <CalendarRange className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
                </div>
                <span className="flex items-center gap-1 text-slate-600 font-semibold truncate">
                  <span className="hidden xs:inline">FY:</span>
                  <strong className="text-indigo-950 font-extrabold text-xs">
                    {`FY ${selectedYear}-${(selectedYear + 1).toString().slice(-2)}`}
                  </strong>
                  <span className="hidden sm:inline-block text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100/80">
                    {`(Apr ${selectedYear} - Mar ${selectedYear + 1})`}
                  </span>
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isYearMenuOpen ? 'rotate-180 text-indigo-600' : ''}`} />
            </button>

            {isYearMenuOpen && (
              <div className="absolute left-0 right-0 sm:left-auto sm:right-0 mt-2 w-full sm:w-80 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl shadow-2xl shadow-indigo-950/15 py-2 z-50 animate-in fade-in zoom-in-95 duration-150 max-h-80 overflow-y-auto scrollbar-thin divide-y divide-slate-100">
                <div className="px-4 py-2.5 bg-slate-50/90 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-indigo-600" /> Select Financial Year
                  </span>
                  <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    Apr – Mar Cycle
                  </span>
                </div>
                <div className="py-1">
                  {availableYears.map((y) => {
                    const isSelected = y === selectedYear;
                    const isCurrentFY = y === currentFYStartYear;
                    const isFutureFY = y > currentFYStartYear;

                    return (
                      <button
                        key={y}
                        type="button"
                        onClick={() => {
                          setSelectedYear(y);
                          setIsYearMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs transition-all duration-150 flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-extrabold shadow-sm'
                            : 'text-slate-700 hover:bg-indigo-50/70 hover:text-indigo-900 font-bold'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="flex items-center gap-1.5 flex-wrap">
                            {`FY ${y}-${(y + 1).toString().slice(-2)}`}
                            {isCurrentFY && (
                              <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${isSelected ? 'bg-emerald-400 text-emerald-950' : 'bg-emerald-100 text-emerald-800'}`}>
                                ACTIVE CURRENT
                              </span>
                            )}
                            {isFutureFY && (
                              <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${isSelected ? 'bg-indigo-300 text-indigo-950' : 'bg-purple-100 text-purple-800'}`}>
                                UPCOMING
                              </span>
                            )}
                          </span>
                          <span className={`text-[10px] font-normal ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                            {`Apr ${y} – Mar ${y + 1}`}
                          </span>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-white shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <Button icon={Plus} onClick={() => setIsAdjustModalOpen(true)} className="w-full xs:w-auto justify-center">
            Adjust Stock
          </Button>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-3">
        <button
          onClick={() => setActiveTab('yearly')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${
            activeTab === 'yearly'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/25 ring-1 ring-indigo-500/30'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80 hover:text-indigo-600'
          }`}
        >
          <BarChart3 className="w-4 h-4 stroke-[2.2] shrink-0" />
          <span className="inline sm:hidden">Summary (FY {selectedYear}-{(selectedYear + 1).toString().slice(-2)})</span>
          <span className="hidden sm:inline">Year-by-Year Stock Summary (FY {selectedYear}-{(selectedYear + 1).toString().slice(-2)})</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/25 ring-1 ring-indigo-500/30'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80 hover:text-indigo-600'
          }`}
        >
          <FileClock className="w-4 h-4 stroke-[2.2] shrink-0" />
          <span className="inline sm:hidden">Audit Logs</span>
          <span className="hidden sm:inline">Manual Audit Logs</span>
        </button>
      </div>

      {/* TAB 1: Year-by-Year Stock Summary */}
      {activeTab === 'yearly' && (
        <div className="space-y-4 sm:space-y-5">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="p-3.5 sm:p-4 bg-gradient-to-br from-slate-50 to-indigo-50/30 border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Opening Stock</span>
                <PackageSearch className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-slate-500 stroke-[2] shrink-0" />
              </div>
              <p className="text-lg sm:text-xl font-black text-slate-800 mt-1.5 sm:mt-2">{totalOpening}</p>
              <p className="text-[10px] font-semibold text-slate-400 mt-0.5 truncate">Balance prior to Apr 1, {selectedYear}</p>
            </Card>

            <Card className="p-3.5 sm:p-4 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 border-emerald-100">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-extrabold text-emerald-700 uppercase tracking-wider">Stock Inward</span>
                <PackagePlus className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-emerald-600 stroke-[2] shrink-0" />
              </div>
              <p className="text-lg sm:text-xl font-black text-emerald-800 mt-1.5 sm:mt-2">+{totalInward}</p>
              <p className="text-[10px] font-semibold text-emerald-600 mt-0.5 truncate">Added in FY {selectedYear}-{(selectedYear + 1).toString().slice(-2)}</p>
            </Card>

            <Card className="p-3.5 sm:p-4 bg-gradient-to-br from-amber-50/50 to-rose-50/30 border-amber-100">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-extrabold text-amber-700 uppercase tracking-wider">Stock Outward</span>
                <PackageMinus className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-rose-600 stroke-[2] shrink-0" />
              </div>
              <p className="text-lg sm:text-xl font-black text-rose-800 mt-1.5 sm:mt-2">-{totalOutward}</p>
              <p className="text-[10px] font-semibold text-rose-600 mt-0.5 truncate">Sold in FY {selectedYear}-{(selectedYear + 1).toString().slice(-2)}</p>
            </Card>

            <Card className="p-3.5 sm:p-4 bg-gradient-to-br from-indigo-50 to-purple-50/50 border-indigo-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-extrabold text-indigo-700 uppercase tracking-wider">Closing Stock</span>
                <Scale className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-indigo-600 stroke-[2] shrink-0" />
              </div>
              <p className="text-lg sm:text-xl font-black text-indigo-900 mt-1.5 sm:mt-2">{totalClosing}</p>
              <p className="text-[10px] font-semibold text-indigo-600 mt-0.5 truncate">Net balance at Mar 31, {selectedYear + 1}</p>
            </Card>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table
              headers={['Product / Variant', 'Size', 'Opening Stock', 'Stock Inward (+)', 'Stock Outward (-)', 'Closing Stock']}
              isLoading={isYearlyLoading}
              isEmpty={!yearlyData.length}
            >
              {yearlyData.map((row, idx) => {
                const productName = row.productName || row.item_name || row.product_name || row.product?.item_name || 'Product';
                const sizeName = row.sizeName || row.size || '-';
                const opening = Number(row.openingStock ?? row.opening_stock ?? 0);
                const inward = Number(row.stockInward ?? row.stock_inward ?? 0);
                const outward = Number(row.stockOutward ?? row.stock_outward ?? row.sold ?? 0);
                const closing = Number(row.closingStock ?? row.closing_stock ?? 0);

                return (
                  <tr key={row.id || row.product_size_id || idx} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3.5 font-bold text-slate-800">{productName}</td>
                    <td className="px-4 py-3.5 text-xs">
                      <Badge variant="indigo" className="font-semibold">{sizeName}</Badge>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-600">{opening}</td>
                    <td className="px-4 py-3.5 font-extrabold text-emerald-700">+{inward}</td>
                    <td className="px-4 py-3.5 font-extrabold text-rose-700">-{outward}</td>
                    <td className="px-4 py-3.5 font-black text-indigo-900 bg-indigo-50/40">{closing}</td>
                  </tr>
                );
              })}
            </Table>
          </div>

          {/* Mobile Card List (<768px) */}
          <div className="md:hidden space-y-3">
            {isYearlyLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">Calculating year-by-year stock data...</div>
            ) : !yearlyData.length ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
                <EmptyState title="No Stock Summary Available" message={`No stock records found for financial year FY ${selectedYear}-${(selectedYear + 1).toString().slice(-2)} (April ${selectedYear} - March ${selectedYear + 1}).`} />
              </div>
            ) : (
              yearlyData.map((row, idx) => {
                const productName = row.productName || row.item_name || row.product_name || row.product?.item_name || 'Product';
                const sizeName = row.sizeName || row.size || '-';
                const opening = Number(row.openingStock ?? row.opening_stock ?? 0);
                const inward = Number(row.stockInward ?? row.stock_inward ?? 0);
                const outward = Number(row.stockOutward ?? row.stock_outward ?? row.sold ?? 0);
                const closing = Number(row.closingStock ?? row.closing_stock ?? 0);

                return (
                  <div key={row.id || row.product_size_id || idx} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h3 className="font-extrabold text-slate-800 text-sm">{productName}</h3>
                      <Badge variant="indigo">Size: {sizeName}</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Opening</span>
                        <span className="text-slate-700 font-semibold">{opening}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Closing Stock</span>
                        <span className="text-indigo-900 font-black text-sm">{closing}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100/80">
                      <span className="text-emerald-700 font-bold">Inward: +{inward}</span>
                      <span className="text-rose-700 font-bold">Outward: -{outward}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Manual Audit Logs */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table
              headers={['Date & Time', 'Product Variant', 'Type', 'Quantity', 'Reason']}
              isLoading={isLogsLoading}
              isEmpty={!logs.length}
            >
              {logs.map((log) => {
                const sizeObj = log.product_size || log.productSize || {};
                const prodObj = sizeObj.product || log.product || {};
                const isAdd = log.transaction_type === 'IN' || log.type === 'ADD';

                return (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3.5 text-xs text-slate-500">{formatDate(log.created_at || log.createdAt)}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">
                      {prodObj.item_name || prodObj.name || 'Product'} ({sizeObj.size || sizeObj.sizeName || '-'})
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={isAdd ? 'emerald' : 'rose'} className="flex items-center gap-1 w-fit">
                        {isAdd ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {isAdd ? 'ADD' : 'REMOVE'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-800">{log.quantity}</td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">{log.remarks || log.reason || 'General Adjustment'}</td>
                  </tr>
                );
              })}
            </Table>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden space-y-3">
            {isLogsLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading stock logs...</div>
            ) : !logs.length ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
                <EmptyState title="No Stock Log Entries" message="Manual inventory adjustments will appear here." />
              </div>
            ) : (
              logs.map((log) => {
                const sizeObj = log.product_size || log.productSize || {};
                const prodObj = sizeObj.product || log.product || {};
                const isAdd = log.transaction_type === 'IN' || log.type === 'ADD';

                return (
                  <div key={log.id} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div>
                        <h3 className="font-extrabold text-slate-800 text-sm">
                          {prodObj.item_name || prodObj.name || 'Product'}
                        </h3>
                        <span className="text-xs font-semibold text-indigo-600">
                          Size: {sizeObj.size || sizeObj.sizeName || '-'}
                        </span>
                      </div>
                      <Badge variant={isAdd ? 'emerald' : 'rose'} className="flex items-center gap-1 shrink-0">
                        {isAdd ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        {isAdd ? 'ADD' : 'REMOVE'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Quantity Changed:</span>
                      <span className={`font-extrabold text-sm ${isAdd ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {isAdd ? `+${log.quantity}` : `-${log.quantity}`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-50">
                      <span className="truncate pr-2">Reason: {log.remarks || log.reason || 'General Adjustment'}</span>
                      <span className="shrink-0">{formatDate(log.created_at || log.createdAt)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Adjustment Modal */}
      <Modal isOpen={isAdjustModalOpen} onClose={() => setIsAdjustModalOpen(false)} title="Manual Stock Adjustment">
        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          <Select
            label="Select Product Size Variant"
            value={adjustForm.productSizeId}
            onChange={(e) => setAdjustForm({ ...adjustForm, productSizeId: e.target.value })}
            placeholder="Select variant..."
            options={[
              { value: '', label: 'Select variant...' },
              ...sizeVariants.map((v) => ({ value: v.id, label: v.label })),
            ]}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Adjustment Type"
              value={adjustForm.type}
              onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value })}
            >
              <option value="ADD">ADD (Restock)</option>
              <option value="REMOVE">REMOVE (Damage / Loss)</option>
            </Select>
            <Input
              label="Quantity"
              type="number"
              min="1"
              value={adjustForm.quantity}
              onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
              required
            />
          </div>

          <Input
            label="Reason / Remarks"
            placeholder="e.g. Supplier delivery batch #102"
            value={adjustForm.reason}
            onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsAdjustModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={adjustMutation.isPending}>
              Confirm Stock Change
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

