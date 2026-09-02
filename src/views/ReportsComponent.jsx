'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, TrendingUp, ReceiptText, Users2, Boxes, UserCheck, Calendar, Search, X } from 'lucide-react';
import { reportApi } from '../services/api';
import { Button, Table, Input } from '../components/common/UIComponents';
import { ModernDatePicker } from '../components/common/ModernDatePicker';
import { formatCurrency, formatDate, exportToCSV } from '../utils/formatters';

const reportModules = [
  {
    id: 'sales',
    name: 'Sales Revenue Report',
    shortName: 'Sales Revenue',
    icon: TrendingUp,
    description: 'Track sales & grand total revenue',
  },
  {
    id: 'gst',
    name: 'GST Tax Summary (CGST/SGST/IGST)',
    shortName: 'GST Tax Summary',
    icon: ReceiptText,
    description: 'Taxable amount & GST tax breakdown',
  },
  {
    id: 'customer',
    name: 'Customer Outstanding Receivables',
    shortName: 'Customer Receivables',
    icon: Users2,
    description: 'Pending dues & customer ledgers',
  },
  {
    id: 'stock',
    name: 'Stock Inventory Valuation',
    shortName: 'Stock Valuation',
    icon: Boxes,
    description: 'Current product stock levels',
  },
  {
    id: 'agent',
    name: 'Agent Sales & Commission Report',
    shortName: 'Agent Commission',
    icon: UserCheck,
    description: 'Sales volume & agent commission',
  },
];

export function ReportsComponent() {
  const [reportType, setReportType] = useState('sales');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activePreset, setActivePreset] = useState('all');

  const applyPreset = (presetKey) => {
    setActivePreset(presetKey);
    const today = new Date();
    const formatDateStr = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    if (presetKey === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (presetKey === 'today') {
      const todayStr = formatDateStr(today);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (presetKey === 'this_month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(formatDateStr(firstDay));
      setEndDate(formatDateStr(today));
    } else if (presetKey === 'this_fy') {
      const startYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
      const fyStart = new Date(startYear, 3, 1);
      const fyEnd = new Date(startYear + 1, 2, 31);
      setStartDate(formatDateStr(fyStart));
      setEndDate(formatDateStr(fyEnd));
    } else if (presetKey === 'last_30') {
      const past30 = new Date();
      past30.setDate(today.getDate() - 30);
      setStartDate(formatDateStr(past30));
      setEndDate(formatDateStr(today));
    }
  };

  const handleDateChange = (type, val) => {
    setActivePreset('custom');
    if (type === 'start') setStartDate(val);
    if (type === 'end') setEndDate(val);
  };

  const { data: salesRes, isLoading: isSalesLoading } = useQuery({
    queryKey: ['report-sales', startDate, endDate],
    queryFn: () => reportApi.getSalesReport({ from: startDate, to: endDate, startDate, endDate }),
    enabled: reportType === 'sales',
  });

  const { data: gstRes, isLoading: isGstLoading } = useQuery({
    queryKey: ['report-gst', startDate, endDate],
    queryFn: () => reportApi.getGstReport({ from: startDate, to: endDate, startDate, endDate }),
    enabled: reportType === 'gst',
  });

  const { data: customerRes, isLoading: isCustLoading } = useQuery({
    queryKey: ['report-customer'],
    queryFn: () => reportApi.getCustomerOutstanding(),
    enabled: reportType === 'customer',
  });

  const { data: stockRes, isLoading: isStockLoading } = useQuery({
    queryKey: ['report-stock'],
    queryFn: () => reportApi.getStockReport(),
    enabled: reportType === 'stock',
  });

  const { data: agentRes, isLoading: isAgentLoading } = useQuery({
    queryKey: ['report-agent', startDate, endDate],
    queryFn: () => reportApi.getAgentReport({ from: startDate, to: endDate, startDate, endDate }),
    enabled: reportType === 'agent',
  });

  const filterData = (dataList) => {
    if (!searchQuery.trim()) return dataList || [];
    const q = searchQuery.toLowerCase().trim();
    return (dataList || []).filter((item) => {
      const customerName = (item.customer_name || item.customer?.name || item.name || '').toLowerCase();
      const invoiceNum = (item.invoice_number || item.invoiceNumber || '').toLowerCase();
      const hsn = (item.hsn_code || item.hsnCode || '').toLowerCase();
      const prodName = (item.product_name || item.item_name || '').toLowerCase();
      const agentName = (item.agent_name || '').toLowerCase();

      return (
        customerName.includes(q) ||
        invoiceNum.includes(q) ||
        hsn.includes(q) ||
        prodName.includes(q) ||
        agentName.includes(q)
      );
    });
  };

  const handleExportCSV = () => {
    let filename = `Report_${reportType}_${new Date().toISOString().slice(0, 10)}`;
    let dataToExport = [];

    if (reportType === 'sales') {
      dataToExport = filterData(salesRes?.data || []).map((row) => ({
        InvoiceNumber: row.invoice_number || row.invoiceNumber,
        IssuedDate: row.date || row.invoice_date || row.createdAt,
        DeliveredDate: row.delivery_date || '-',
        Customer: row.customer_name || row.customer?.name || row.customer?.customer_name,
        Subtotal: row.subtotal,
        TaxAmount: row.gst_total || row.taxAmount,
        GrandTotal: row.grand_total || row.grandTotal,
        Balance: row.balance || 0,
      }));
    } else if (reportType === 'gst') {
      dataToExport = filterData(gstRes?.data || []).map((row) => ({
        InvoiceNumber: row.invoice_number || row.invoiceNumber,
        HSNCode: row.hsn_code || 'N/A',
        TaxableAmount: row.taxable_amount || row.subtotal,
        CGST: row.cgst || 0,
        SGST: row.sgst || 0,
        IGST: row.igst || 0,
        GSTTotal: row.gst_total || row.taxAmount,
      }));
    } else if (reportType === 'customer') {
      dataToExport = filterData(customerRes?.data || []).map((row) => ({
        CustomerName: row.customer_name || row.name,
        InvoiceNumber: row.invoice_number || row.invoiceNumber || '-',
        IssuedDate: row.issued_date || '-',
        PendingDays: row.pending_days || '-',
        TotalSales: row.total_sales || 0,
        TotalPaid: row.total_paid || 0,
        OutstandingBalance: row.outstanding_balance || row.outstandingBalance,
      }));
    } else if (reportType === 'stock') {
      dataToExport = filterData(stockRes?.data || []).map((row) => ({
        ProductName: row.product_name || row.name || row.item_name,
        HSNCode: row.hsn_code || row.hsnCode || '-',
        Size: row.size || 'Standard',
        StockQuantity: row.current_stock ?? row.stock ?? 0,
        MinimumStock: row.minimum_stock ?? 0,
      }));
    } else if (reportType === 'agent') {
      dataToExport = filterData(agentRes?.data || []).map((row) => ({
        AgentName: row.agent_name || row.name,
        Phone: row.phone || '-',
        CommissionRate: row.commission_rate || '0%',
        TotalInvoices: row.total_invoices || 0,
        TotalSales: row.total_sales || 0,
        CommissionAmount: row.commission_amount || 0,
      }));
    }

    exportToCSV(filename, dataToExport);
  };

  const activeModule = reportModules.find((m) => m.id === reportType);

  const filteredSalesData = filterData(salesRes?.data);
  const filteredGstData = filterData(gstRes?.data);
  const filteredCustomerData = filterData(customerRes?.data);
  const filteredStockData = filterData(stockRes?.data);
  const filteredAgentData = filterData(agentRes?.data);

  return (
    <div className="space-y-6 pb-24 sm:pb-32 lg:pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Business Reports & Analytics</h1>
          <p className="text-xs text-slate-500">Generate Sales, GST tax statements, and customer ledgers.</p>
        </div>
        <Button icon={Download} onClick={handleExportCSV}>
          Export CSV / Excel
        </Button>
      </div>

      {/* Interactive Report Module Selection */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Active Module
            </span>
            <h2 className="text-base font-bold text-indigo-950 flex items-center gap-2">
              {activeModule && <activeModule.icon className="w-4 h-4 text-indigo-600" />}
              {activeModule?.name}
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center flex-wrap gap-3 w-full lg:w-auto">
            {/* Search Bar for Customer / Invoice / Products */}
            <div className="w-full sm:w-60">
              <Input
                icon={Search}
                placeholder="Search invoice # or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {(reportType === 'sales' || reportType === 'gst' || reportType === 'agent') && (
              <div className="flex flex-wrap items-center gap-2 bg-gradient-to-r from-slate-50 to-indigo-50/40 p-2 rounded-2xl border border-slate-200/80 shadow-xs">
                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1">
                  {[
                    { id: 'all', label: 'All Time' },
                    { id: 'today', label: 'Today' },
                    { id: 'this_month', label: 'This Month' },
                    { id: 'this_fy', label: 'This FY (Apr-Mar)' },
                    { id: 'last_30', label: 'Last 30 Days' },
                  ].map((p) => {
                    const isPresetActive = activePreset === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => applyPreset(p.id)}
                        className={`text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer whitespace-nowrap ${
                          isPresetActive
                            ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-200'
                            : 'bg-white/80 text-slate-600 hover:bg-white hover:text-indigo-600 border border-slate-200/60'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>

                <div className="hidden sm:block h-4 w-px bg-slate-200 mx-0.5" />

                {/* Custom Date Pickers Container */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <ModernDatePicker
                    value={startDate}
                    onChange={(val) => handleDateChange('start', val)}
                    placeholder="Start Date"
                  />
                  <span className="text-slate-400 text-xs font-extrabold px-0.5">→</span>
                  <ModernDatePicker
                    value={endDate}
                    onChange={(val) => handleDateChange('end', val)}
                    placeholder="End Date"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Interactive Selector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {reportModules.map((mod) => {
            const Icon = mod.icon;
            const isActive = reportType === mod.id;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => setReportType(mod.id)}
                className={`relative flex flex-col justify-between text-left p-3.5 rounded-2xl border transition-all duration-200 group cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-b from-indigo-50/90 to-indigo-100/40 border-indigo-500/80 shadow-md shadow-indigo-100 scale-[1.02]'
                    : 'bg-white border-slate-200/80 hover:border-indigo-200 hover:bg-slate-50/80'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div
                    className={`p-2 rounded-xl border transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-100 text-slate-600 border-slate-200 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {isActive && (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
                    </span>
                  )}
                </div>

                <div>
                  <h3 className={`text-xs font-bold transition-colors ${isActive ? 'text-indigo-950' : 'text-slate-700'}`}>
                    {mod.shortName}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                    {mod.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {reportType === 'sales' && (
        <Table
          headers={['Invoice #', 'Issued Date', 'Delivered Date', 'Customer', 'Subtotal', 'Tax (GST)', 'Grand Total']}
          isLoading={isSalesLoading}
          isEmpty={!filteredSalesData.length}
        >
          {filteredSalesData.map((row, idx) => (
            <tr key={row.id || idx}>
              <td className="px-4 py-3 text-indigo-600 font-bold">{row.invoice_number || row.invoiceNumber}</td>
              <td className="px-4 py-3 text-xs">{formatDate(row.date || row.invoice_date || row.createdAt)}</td>
              <td className="px-4 py-3 text-xs">{row.delivery_date ? formatDate(row.delivery_date) : '-'}</td>
              <td className="px-4 py-3 font-semibold">{row.customer_name || row.customer?.name || 'N/A'}</td>
              <td className="px-4 py-3">{formatCurrency(row.subtotal)}</td>
              <td className="px-4 py-3">{formatCurrency(row.gst_total ?? row.taxAmount)}</td>
              <td className="px-4 py-3 font-bold">{formatCurrency(row.grand_total ?? row.grandTotal)}</td>
            </tr>
          ))}
        </Table>
      )}

      {reportType === 'gst' && (
        <Table
          headers={['Invoice #', 'HSN Code', 'Taxable Amount', 'CGST', 'SGST', 'IGST', 'GST Total']}
          isLoading={isGstLoading}
          isEmpty={!filteredGstData.length}
        >
          {filteredGstData.map((row, idx) => (
            <tr key={row.id || idx}>
              <td className="px-4 py-3 font-bold text-indigo-600">{row.invoice_number || row.invoiceNumber}</td>
              <td className="px-4 py-3 font-mono text-xs">{row.hsn_code || 'N/A'}</td>
              <td className="px-4 py-3">{formatCurrency(row.taxable_amount ?? row.subtotal)}</td>
              <td className="px-4 py-3">{formatCurrency(row.cgst || 0)}</td>
              <td className="px-4 py-3">{formatCurrency(row.sgst || 0)}</td>
              <td className="px-4 py-3">{formatCurrency(row.igst || 0)}</td>
              <td className="px-4 py-3 font-bold text-indigo-700">{formatCurrency(row.gst_total ?? row.taxAmount)}</td>
            </tr>
          ))}
        </Table>
      )}

      {reportType === 'customer' && (
        <Table
          headers={['Customer Name', 'Invoice #', 'Issued Date', 'Pending Days', 'Total Sales', 'Total Paid', 'Outstanding Balance']}
          isLoading={isCustLoading}
          isEmpty={!filteredCustomerData.length}
        >
          {filteredCustomerData.map((row, idx) => (
            <tr key={row.id || idx}>
              <td className="px-4 py-3 font-semibold text-slate-800">{row.customer_name || row.name || 'Customer'}</td>
              <td className="px-4 py-3 font-bold text-indigo-600">{row.invoice_number || row.invoiceNumber || '-'}</td>
              <td className="px-4 py-3 text-xs font-medium text-slate-700">
                {row.issued_date ? formatDate(row.issued_date) : (row.issuedDate ? formatDate(row.issuedDate) : '-')}
              </td>
              <td className="px-4 py-3 text-xs font-bold text-amber-600">
                {row.pending_days || row.pendingDays || '-'}
              </td>
              <td className="px-4 py-3 font-semibold text-slate-900">{formatCurrency(row.total_sales ?? row.totalSales ?? 0)}</td>
              <td className="px-4 py-3 text-emerald-600 font-semibold">{formatCurrency(row.total_paid ?? row.totalPaid ?? 0)}</td>
              <td className="px-4 py-3 font-extrabold text-rose-600">
                {formatCurrency(row.outstanding_balance ?? row.outstandingBalance ?? 0)}
              </td>
            </tr>
          ))}
        </Table>
      )}

      {reportType === 'stock' && (
        <Table
          headers={['Product Name', 'HSN Code', 'Size Variant', 'Stock Quantity', 'Minimum Stock']}
          isLoading={isStockLoading}
          isEmpty={!filteredStockData.length}
        >
          {filteredStockData.map((row, idx) => (
            <tr key={row.id || idx}>
              <td className="px-4 py-3 font-semibold text-slate-800">{row.product_name || row.item_name || row.name || 'N/A'}</td>
              <td className="px-4 py-3 text-xs font-mono">{row.hsn_code || row.hsnCode || '-'}</td>
              <td className="px-4 py-3 text-xs font-semibold">{row.size || row.variant || 'Standard'}</td>
              <td className="px-4 py-3 font-bold text-slate-900">{row.current_stock ?? row.stock ?? 0}</td>
              <td className="px-4 py-3 text-xs text-slate-500">{row.minimum_stock ?? 0}</td>
            </tr>
          ))}
        </Table>
      )}

      {reportType === 'agent' && (
        <Table
          headers={['Invoice #', 'Invoice Date', 'Agent Name', 'Customer', 'Commission Rate (%)', 'Order Amount', 'Commission Earned']}
          isLoading={isAgentLoading}
          isEmpty={!filteredAgentData.length}
        >
          {filteredAgentData.map((row, idx) => (
            <tr key={row.id || idx}>
              <td className="px-4 py-3 font-bold text-indigo-600 text-xs">{row.invoice_number || '-'}</td>
              <td className="px-4 py-3 text-xs text-slate-500">{row.invoice_date ? formatDate(row.invoice_date) : '-'}</td>
              <td className="px-4 py-3 font-bold text-slate-800">{row.agent_name || row.name}</td>
              <td className="px-4 py-3 font-semibold text-slate-700">{row.customer_name || '-'}</td>
              <td className="px-4 py-3 font-mono text-xs text-indigo-700 font-semibold">{row.commission_rate || '0%'}</td>
              <td className="px-4 py-3 font-bold text-slate-900">{formatCurrency(row.total_sales || 0)}</td>
              <td className="px-4 py-3 font-extrabold text-emerald-600 bg-emerald-50/40">{formatCurrency(row.commission_amount || 0)}</td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
