import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Eye, Printer, Download, Trash2, CheckCircle2, Edit2 } from 'lucide-react';
import { invoiceApi } from '../services/api';
import { Button, Input, Table, Modal, Badge, Pagination, ConfirmModal, EmptyState } from '../components/common/UIComponents';
import { ModernDatePicker } from '../components/common/ModernDatePicker';
import { formatCurrency, formatDate, numberToWords } from '../utils/formatters';
import useAuthStore from '../store/useAuthStore';
import Link from 'next/link';

const COPY_TYPES = [
  { id: 'Original', label: 'Original', text: 'Original' },
  { id: 'Duplicate', label: 'Duplicate', text: 'Duplicate' },
  { id: 'Triplicate', label: 'Triplicate', text: 'Triplicate' },
  { id: 'Transport Copy', label: 'Transport Copy', text: 'Transport Copy' },
  { id: 'Extra Copy', label: 'Extra Copy', text: 'Extra Copy' },
  { id: 'All', label: 'All', text: 'All' },
];

export function InvoicesComponent() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedCopyType, setSelectedCopyType] = useState('Original');

  const { data: invoicesResponse, isLoading } = useQuery({
    queryKey: ['invoices', page, searchTerm, startDate, endDate],
    queryFn: () => invoiceApi.getAll({ page, search: searchTerm, from: startDate, to: endDate, startDate, endDate }),
  });

  const { data: invoiceDetailRes } = useQuery({
    queryKey: ['invoice-detail', selectedInvoice?.id],
    queryFn: () => invoiceApi.getById(selectedInvoice.id),
    enabled: Boolean(selectedInvoice?.id && isViewModalOpen),
  });

  const invoices = invoicesResponse?.data?.invoices || invoicesResponse?.data || [];
  const totalPages = invoicesResponse?.data?.totalPages || 1;

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => invoiceApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['invoices']);
      queryClient.invalidateQueries(['payments']);
      queryClient.invalidateQueries(['customers']);
      queryClient.invalidateQueries(['reports']);
      setIsViewModalOpen(false);
    },
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: (id) => invoiceApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['invoices']);
    },
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: ({ id, data }) => invoiceApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['invoices']);
    },
  });

  const [deleteInvoiceTarget, setDeleteInvoiceTarget] = useState(null);
  const [editInvoiceTarget, setEditInvoiceTarget] = useState(null);
  const [newNumInput, setNewNumInput] = useState('');

  const handleOpenEditNumberModal = (inv) => {
    setEditInvoiceTarget(inv);
    setNewNumInput(inv.invoice_number || inv.invoiceNumber || '');
  };

  const handleSaveInvoiceNumber = (e) => {
    e.preventDefault();
    if (editInvoiceTarget && newNumInput.trim()) {
      updateInvoiceMutation.mutate(
        { id: editInvoiceTarget.id, data: { invoice_number: newNumInput.trim() } },
        {
          onSuccess: () => {
            setEditInvoiceTarget(null);
          },
        }
      );
    }
  };

  const handlePrint = (invId) => {
    if (invId) {
      const token = useAuthStore.getState().token;
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
      const pdfUrl = `${apiBase}/invoices/${invId}/pdf${token ? `?token=${token}` : ''}`;
      window.open(pdfUrl, '_blank');
    } else {
      window.print();
    }
  };

  const handleDownloadPdf = (invId) => {
    const token = useAuthStore.getState().token;
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
    const pdfUrl = `${apiBase}/invoices/${invId}/pdf?copyType=${encodeURIComponent(selectedCopyType)}${token ? `&token=${token}` : ''}`;
    window.open(pdfUrl, '_blank');
  };

  return (
    <div className="space-y-6 pb-24 sm:pb-32 lg:pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Invoice History & Ledger</h1>
          <p className="text-xs text-slate-500">View tax invoices, print A4 statements, and mark payments.</p>
        </div>
        <Link href="/invoices/new">
          <Button icon={Plus}>Create New Invoice</Button>
        </Link>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 w-full">
          <Input
            icon={Search}
            placeholder="Search by invoice number or customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <ModernDatePicker
            label="From Date"
            value={startDate}
            onChange={(val) => setStartDate(val)}
            placeholder="From Date"
          />
          <ModernDatePicker
            label="To Date"
            value={endDate}
            onChange={(val) => setEndDate(val)}
            placeholder="To Date"
            align="right"
          />
        </div>
      </div>

      {/* Desktop Table View (>=768px) */}
      <div className="hidden md:block">
        <Table
          headers={['Invoice #', 'Issued Date', 'Delivered Date', 'Customer', 'Grand Total', 'Status', 'Actions']}
          isLoading={isLoading}
          isEmpty={!invoices.length}
        >
          {invoices.map((inv) => (
            <tr key={inv.id} className="hover:bg-slate-50/60 transition">
              <td className="px-4 py-3.5 font-bold text-indigo-600">
                <div className="flex items-center gap-1.5">
                  <span>{inv.invoice_number || inv.invoiceNumber}</span>
                  <button
                    onClick={() => handleOpenEditNumberModal(inv)}
                    title="Edit Invoice Number"
                    className="p-1 rounded text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 transition opacity-80 hover:opacity-100"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
              <td className="px-4 py-3.5 text-xs text-slate-600">
                {formatDate(inv.invoice_date || inv.created_at || inv.createdAt)}
              </td>
              <td className="px-4 py-3.5 text-xs text-slate-500">
                {inv.delivery_date ? formatDate(inv.delivery_date) : '-'}
              </td>
              <td className="px-4 py-3.5 font-semibold text-slate-800">
                {inv.customer?.customer_name || inv.customer?.name || 'Customer'}
              </td>
              <td className="px-4 py-3.5 font-bold text-slate-900">
                {formatCurrency(inv.grand_total ?? inv.grandTotal)}
              </td>
              <td className="px-4 py-3.5">
                <Badge variant={inv.status === 'PAID' ? 'emerald' : inv.status === 'CANCELLED' ? 'rose' : 'amber'}>
                  {inv.status}
                </Badge>
              </td>
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setSelectedInvoice(inv);
                      setIsViewModalOpen(true);
                    }}
                    className="p-2 rounded-xl text-indigo-600 bg-indigo-50/70 border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all duration-150 hover:scale-105 active:scale-95 shadow-2xs"
                    title="View & Print Invoice"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDownloadPdf(inv.id)}
                    className="p-2 rounded-xl text-emerald-600 bg-emerald-50/70 border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all duration-150 hover:scale-105 active:scale-95 shadow-2xs"
                    title="Download PDF Invoice"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenEditNumberModal(inv)}
                    className="p-2 rounded-xl text-amber-600 bg-amber-50/70 border border-amber-100 hover:bg-amber-500 hover:text-white transition-all duration-150 hover:scale-105 active:scale-95 shadow-2xs"
                    title="Edit Invoice Number"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => setDeleteInvoiceTarget(inv)}
                      className="p-2 rounded-xl text-rose-600 bg-rose-50/70 border border-rose-100 hover:bg-rose-600 hover:text-white transition-all duration-150 hover:scale-105 active:scale-95 shadow-2xs"
                      title="Delete Invoice"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </div>

      {/* Mobile Card List (<768px) */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading invoices...</div>
        ) : !invoices.length ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
            <EmptyState title="No Invoices Found" message="Create your first billing invoice to track transaction history." />
          </div>
        ) : (
          invoices.map((inv) => (
            <div
              key={inv.id}
              className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-indigo-600">
                    {inv.invoice_number || inv.invoiceNumber}
                  </span>
                  <button
                    onClick={() => handleOpenEditNumberModal(inv)}
                    className="p-1 text-slate-300 hover:text-indigo-600"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <Badge variant={inv.status === 'PAID' ? 'emerald' : inv.status === 'CANCELLED' ? 'rose' : 'amber'}>
                  {inv.status}
                </Badge>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800">
                  {inv.customer?.customer_name || inv.customer?.name || 'Customer'}
                </span>
                <span className="font-extrabold text-slate-900 text-sm">
                  {formatCurrency(inv.grand_total ?? inv.grandTotal)}
                </span>
              </div>

              <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1 border-t border-slate-50">
                <span>Issued: {formatDate(inv.invoice_date || inv.created_at || inv.createdAt)}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedInvoice(inv);
                      setIsViewModalOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white font-bold text-xs flex items-center gap-1.5 border border-indigo-100 transition-all duration-150 active:scale-95 shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                  <button
                    onClick={() => handleDownloadPdf(inv.id)}
                    className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white font-bold text-xs flex items-center gap-1.5 border border-emerald-100 transition-all duration-150 active:scale-95 shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" /> PDF
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => setDeleteInvoiceTarget(inv)}
                      className="p-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100 transition-all duration-150 active:scale-95 shadow-2xs"
                      title="Delete Invoice"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />

      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Tax Invoice"
        maxWidth="max-w-4xl"
      >
        {selectedInvoice && (() => {
          const inv = invoiceDetailRes?.data || selectedInvoice;
          const creator = inv.creator || {};
          const cust = inv.customer || {};
          const itemsList = inv.items || [];
          const numSubtotal = Number(inv.subtotal || 0);
          const numCashDisc = Number(inv.cash_discount || 0);
          const numTradeDisc = Number(inv.trade_discount || 0);
          const numSchemeDisc = Number(inv.scheme_discount || 0);
          const numTotalDiscount = Number(inv.discount || (numCashDisc + numTradeDisc + numSchemeDisc));
          const numTaxable = Number(inv.taxable_amount ?? Math.max(0, numSubtotal - numTotalDiscount));
          const numGst = Number(inv.gst_total ?? inv.igst ?? 0);
          const numCgst = Number(inv.cgst ?? 0);
          const numSgst = Number(inv.sgst ?? 0);
          const numIgst = Number(inv.igst ?? 0);
          const numLessFor = Number(inv.less_for || 0);
          const numNetAmount = Math.round(numTaxable + numGst);
          const numGrandTotal = Number(inv.grand_total ?? Math.max(0, numNetAmount - numLessFor));
          const totalPcs = itemsList.reduce((acc, it) => acc + (parseInt(it.quantity) || 0), 0);

          const companyGstin = creator.gst_number || '';
          const companyStateCode = creator.state_code || (companyGstin && companyGstin.length >= 2 ? companyGstin.slice(0, 2) : '33');
          const custGst = cust.gst_number || '';
          const custStateCode = cust.state_code || (custGst && custGst.length >= 2 ? custGst.slice(0, 2) : '');

          const activeCopyTypes = [COPY_TYPES.find(c => c.id === selectedCopyType) || COPY_TYPES[0]];

          return (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2.5 no-print">
                <div className="flex gap-2">
                  {inv.status !== 'PAID' && (
                    <Button
                      size="sm"
                      variant="outline"
                      icon={CheckCircle2}
                      onClick={() => updateStatusMutation.mutate({ id: inv.id, status: 'PAID' })}
                      className="w-full sm:w-auto"
                    >
                      Mark as Paid
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 justify-end">
                  <Button size="sm" variant="outline" icon={Download} onClick={() => handleDownloadPdf(inv.id)} className="flex-1 sm:flex-none">
                    Download PDF
                  </Button>
                  <Button size="sm" icon={Printer} onClick={() => handlePrint(inv.id)} className="flex-1 sm:flex-none">
                    Print Invoice (A4)
                  </Button>
                </div>
              </div>

              {/* Copy Type Selection Buttons */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2 sm:p-2.5 bg-slate-50 border border-slate-200 rounded-lg no-print">
                <span className="text-xs font-bold text-slate-700">Invoice Copy Type:</span>
                <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
                  {COPY_TYPES.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setSelectedCopyType(type.id)}
                      className={`flex-1 sm:flex-none px-2.5 py-1 text-[11px] sm:text-xs font-semibold rounded-md transition-all ${
                        selectedCopyType === type.id
                          ? 'bg-red-700 text-white shadow-sm ring-2 ring-red-200'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Printable Tax Invoice Container */}
              <div id="printable-invoice" className="bg-white space-y-6 text-slate-900 text-xs font-sans max-w-full overflow-x-auto">
                {activeCopyTypes.map((copyObj, pageIdx) => (
                  <div
                    key={copyObj.id}
                    className={`bg-white p-2.5 sm:p-4 border border-slate-800 rounded-none space-y-0 min-w-[300px] sm:min-w-0 ${
                      pageIdx < activeCopyTypes.length - 1 ? 'invoice-page-break mb-8 pb-4 border-b-2 border-slate-300' : ''
                    }`}
                  >
                    {/* Header Title */}
                    <div className="border-b border-slate-800 py-1 px-1.5 sm:px-2 flex justify-between items-center text-[10px] sm:text-[11px] font-bold tracking-wider uppercase">
                      <div className="w-1/4"></div>
                      <div className="w-2/4 text-center">
                        {inv.invoice_type === 'NON_GST' ? 'NON-GST INVOICE / ESTIMATE' : 'TAX INVOICE'}
                      </div>
                      <div className="w-1/4 text-right text-[9px] sm:text-[11px] font-bold text-black tracking-normal truncate">
                        {copyObj.text}
                      </div>
                    </div>

                    {/* Seller / Company Info */}
                    <div className="border-b border-slate-800 py-2 flex flex-col sm:flex-row items-start gap-2 sm:gap-4 text-left">
                      {creator.logo_url && (
                        <img
                          src={creator.logo_url}
                          alt="Brand Logo"
                          className="h-12 sm:h-16 max-w-[100px] sm:max-w-[120px] object-contain shrink-0"
                        />
                      )}
                      <div className="space-y-0.5 flex-1 min-w-0 w-full">
                        <h2 className="text-base sm:text-lg font-black text-red-700 uppercase tracking-wide break-words">
                          {creator.company_name || creator.full_name || 'ASVA'}
                        </h2>
                        {creator.address && (
                          <p className="text-[10px] font-bold uppercase leading-tight break-words">
                            {creator.address}
                          </p>
                        )}
                        <p className="text-[10px] font-bold uppercase leading-tight flex flex-wrap gap-x-3 gap-y-0.5">
                          <span>STATE : {creator.state || 'TAMIL NADU'}</span>
                          <span>CODE : {companyStateCode}</span>
                          <span>GSTIN : {companyGstin}</span>
                        </p>
                        <p className="text-[10px] font-bold leading-tight flex flex-wrap gap-x-3 gap-y-0.5">
                          {creator.contact_number && <span>PHONE : {creator.contact_number}</span>}
                          {creator.email && <span>E-mail : {creator.email}</span>}
                        </p>
                      </div>
                    </div>

                    {/* Grid 1: Logistics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 border-b border-slate-800 divide-y sm:divide-y-0 sm:divide-x print:divide-y-0 print:divide-x divide-slate-800 text-[11px] py-1">
                      <div className="pr-0 sm:pr-2 pb-1 sm:pb-0 space-y-0.5 font-semibold">
                        <div className="flex">
                          <span className="w-28 sm:w-32 shrink-0">Invoice No</span>
                          <span className="break-all">: {inv.invoice_number}</span>
                        </div>
                        <div className="flex">
                          <span className="w-28 sm:w-32 shrink-0">ORDER NO.</span>
                          <span className="break-all">: {inv.order_number || ''}</span>
                        </div>
                        <div className="flex">
                          <span className="w-28 sm:w-32 shrink-0">LR NO.</span>
                          <span className="break-all">: {inv.lr_number || ''}</span>
                        </div>
                        <div className="flex">
                          <span className="w-28 sm:w-32 shrink-0">WEIGHT (in kgs)</span>
                          <span className="break-all">: {inv.weight || ''}</span>
                        </div>
                      </div>
                      <div className="pl-0 sm:pl-2 pt-1 sm:pt-0 space-y-0.5 font-semibold">
                        <div className="flex">
                          <span className="w-28 sm:w-36 shrink-0">Dt. :</span>
                          <span>{formatDate(inv.invoice_date || inv.created_at)}</span>
                        </div>
                        <div className="flex">
                          <span className="w-28 sm:w-36 shrink-0">Dt. :</span>
                          <span>{inv.order_date ? formatDate(inv.order_date) : ''}</span>
                        </div>
                        <div className="flex">
                          <span className="w-28 sm:w-36 shrink-0">Dt. :</span>
                          <span>{inv.lr_date ? formatDate(inv.lr_date) : ''}</span>
                        </div>
                        <div className="flex">
                          <span className="w-28 sm:w-36 shrink-0">CHARGE :</span>
                          <span>{inv.delivery_charge || inv.charges || ''}</span>
                        </div>
                      </div>
                    </div>

                    {/* Grid 2: Transport Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 border-b border-slate-800 divide-y sm:divide-y-0 sm:divide-x print:divide-y-0 print:divide-x divide-slate-800 text-[11px] py-1">
                      <div className="pr-0 sm:pr-2 pb-1 sm:pb-0 space-y-0.5 font-semibold">
                        <div className="flex">
                          <span className="w-28 sm:w-32 shrink-0">TRANSPORT</span>
                          <span className="break-all">: {inv.transport?.transport_name || inv.transport?.name || inv.transport_name || ''}</span>
                        </div>
                        <div className="flex">
                          <span className="w-28 sm:w-32 shrink-0">VEHICLE NO</span>
                          <span className="break-all">: {inv.vehicle_number || ''}</span>
                        </div>
                        <div className="flex">
                          <span className="w-28 sm:w-32 shrink-0">TRANSPORT MODE</span>
                          <span>: {inv.transport_mode || 'Road'}</span>
                        </div>
                      </div>
                      <div className="pl-0 sm:pl-2 pt-1 sm:pt-0 space-y-0.5 font-semibold">
                        <div className="flex">
                          <span className="w-28 sm:w-36 shrink-0">DATE & TIME OF ISSUE :</span>
                          <span>{formatDate(inv.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Grid 3: Customer & Place of Supply */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 border-b border-slate-800 divide-y sm:divide-y-0 sm:divide-x print:divide-y-0 print:divide-x divide-slate-800 text-[11px]">
                      <div className="pr-0 sm:pr-2 py-1 space-y-0.5 font-semibold">
                        <p className="font-bold">TO :</p>
                        <p className="font-black text-sm uppercase break-words">{cust.customer_name || cust.company_name || cust.name}</p>
                        <p className="uppercase break-words">{cust.address}</p>
                        {cust.city && <p className="uppercase">{cust.city} - {cust.pincode}</p>}
                        <p><span className="font-bold">GSTIN :</span> {custGst}</p>
                        <p className="flex flex-wrap gap-x-2"><span className="font-bold">State :</span> {cust.state || 'Tamil Nadu'} <span className="font-bold">Code :</span> {custStateCode}</p>
                        <p><span className="font-bold">AGENT :</span> {inv.agent?.agent_name || inv.agent?.name || ''}</p>
                      </div>
                      <div className="pl-0 sm:pl-2 py-1 space-y-0.5 font-semibold">
                        <div className="flex">
                          <span className="w-28 sm:w-36 shrink-0">PLACE OF SUPPLY</span>
                          <span>: {inv.place_of_supply || cust.city || ''}</span>
                        </div>
                        <div className="flex">
                          <span className="w-28 sm:w-36 shrink-0">NO OF BUNDLE</span>
                          <span>: {inv.bundles || itemsList.length || ''}</span>
                        </div>
                      </div>
                    </div>

                    {/* Items Table */}
                    <div className="border-b border-slate-800 overflow-x-auto -mx-1 sm:mx-0">
                      <table className="w-full text-left text-[11px] border-collapse min-w-[500px] print:min-w-full">
                        <thead>
                          <tr className="border-b border-slate-800 bg-slate-50 font-bold uppercase text-[10px]">
                            <th className="p-1 border-r border-slate-800 w-8 text-center">S.N.</th>
                            <th className="p-1 border-r border-slate-800">DESCRIPTION OF GOODS</th>
                            <th className="p-1 border-r border-slate-800 text-center w-16">HSN/SAC</th>
                            <th className="p-1 border-r border-slate-800 text-right w-12">QTY</th>
                            <th className="p-1 border-r border-slate-800 text-right w-16">RATE</th>
                            <th className="p-1 border-r border-slate-800 text-right w-12">PER</th>
                            <th className="p-1 border-r border-slate-800 text-right w-16">DISC %</th>
                            <th className="p-1 text-right w-20">AMOUNT</th>
                          </tr>
                        </thead>
                        <tbody>
                          {itemsList.map((item, index) => {
                            const rate = Number(item.rate || item.unit_price || 0);
                            const qty = Number(item.quantity || 0);
                            const disc = Number(item.discount_percent || 0);
                            const rawAmt = rate * qty;
                            const amt = rawAmt - (rawAmt * (disc / 100));
                            const prodName = item.product?.item_name || item.product_name || item.product?.name || item.style || 'Product Item';
                            return (
                              <tr key={index} className="border-b border-slate-200">
                                <td className="p-1 border-r border-slate-800 text-center font-medium">{index + 1}</td>
                                <td className="p-1 border-r border-slate-800 font-bold">{prodName}</td>
                                <td className="p-1 border-r border-slate-800 text-center">{item.hsn_code || item.product?.hsn_code || '-'}</td>
                                <td className="p-1 border-r border-slate-800 text-right font-bold">{qty}</td>
                                <td className="p-1 border-r border-slate-800 text-right">{rate.toFixed(2)}</td>
                                <td className="p-1 border-r border-slate-800 text-right">PCS</td>
                                <td className="p-1 border-r border-slate-800 text-right">{disc > 0 ? `${disc}%` : '-'}</td>
                                <td className="p-1 text-right font-semibold">{amt.toFixed(2)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="font-bold border-t border-slate-800 bg-slate-50">
                            <td colSpan={3} className="p-1 border-r border-slate-800 text-right">TOTAL PCS : {totalPcs}</td>
                            <td className="p-1 border-r border-slate-800 text-right">{totalPcs}</td>
                            <td colSpan={3} className="p-1 border-r border-slate-800 text-right">TOTAL AMOUNT</td>
                            <td className="p-1 text-right">{numSubtotal.toFixed(2)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Bank Details & Totals */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 border-b border-slate-800 divide-y sm:divide-y-0 sm:divide-x print:divide-y-0 print:divide-x divide-slate-800 text-[11px] py-1">
                      <div className="pr-0 sm:pr-2 pb-2 sm:pb-0 space-y-0.5">
                        <p className="font-bold underline">Bank Details :</p>
                        <p><span className="font-semibold">Bank Name :</span> {creator.bank_name || 'HDFC BANK'}</p>
                        <p><span className="font-semibold">A/c No :</span> {creator.account_number || ''}</p>
                        <p><span className="font-semibold">Branch & IFSC :</span> {creator.ifsc_code || ''}</p>
                        <div className="pt-2">
                          <p className="font-bold underline">Remarks / Terms & Conditions :</p>
                          <p className="text-[10px] text-slate-700 break-words">{inv.notes || 'Goods once sold will not be taken back.'}</p>
                        </div>
                      </div>
                      <div className="pl-0 sm:pl-2 pt-2 sm:pt-0 space-y-0.5 font-semibold text-[11px]">
                        <div className="flex justify-between items-center gap-2">
                          <span>Gross Subtotal</span>
                          <span>{numSubtotal.toFixed(2)}</span>
                        </div>
                        {numCashDisc > 0 && (
                          <div className="flex justify-between items-center gap-2 text-rose-600">
                            <span>Cash Discount {Number(inv.cash_discount_percent || 0) > 0 ? `@ ${inv.cash_discount_percent}%` : ''}</span>
                            <span>-{numCashDisc.toFixed(2)}</span>
                          </div>
                        )}
                        {numTradeDisc > 0 && (
                          <div className="flex justify-between items-center gap-2 text-rose-600">
                            <span>Trade Discount {Number(inv.trade_discount_percent || 0) > 0 ? `@ ${inv.trade_discount_percent}%` : ''}</span>
                            <span>-{numTradeDisc.toFixed(2)}</span>
                          </div>
                        )}
                        {numSchemeDisc > 0 && (
                          <div className="flex justify-between items-center gap-2 text-rose-600">
                            <span>Scheme Discount</span>
                            <span>-{numSchemeDisc.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center gap-2 font-bold border-t border-slate-800 pt-0.5">
                          <span>Taxable Value</span>
                          <span>{numTaxable.toFixed(2)}</span>
                        </div>
                        {inv.invoice_type === 'NON_GST' ? (
                          <div className="flex justify-between items-center gap-2">
                            <span>Tax (0%)</span>
                            <span>0.00</span>
                          </div>
                        ) : numIgst > 0 || (numCgst === 0 && numSgst === 0 && numGst > 0) ? (
                          <div className="flex justify-between items-center gap-2">
                            <span>Add : IGST @ 5 %</span>
                            <span>{(numIgst || numGst).toFixed(2)}</span>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-center gap-2">
                              <span>Add : CGST @ 2.5 %</span>
                              <span>{numCgst.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center gap-2">
                              <span>Add : SGST @ 2.5 %</span>
                              <span>{numSgst.toFixed(2)}</span>
                            </div>
                          </>
                        )}
                        <div className="flex justify-between items-center gap-2 font-bold border-t border-slate-300 pt-0.5">
                          <span>Net Amount</span>
                          <span>{numNetAmount.toFixed(2)}</span>
                        </div>
                        {numLessFor > 0 && (
                          <div className="flex justify-between items-center gap-2 text-rose-600">
                            <span>Less F.O.R</span>
                            <span>-{numLessFor.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center gap-2 font-black text-xs sm:text-sm border-t border-slate-800 pt-1 text-slate-900">
                          <span className="shrink-0">Payable Amount</span>
                          <span className="shrink-0 font-extrabold">₹{numGrandTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Amount in Words */}
                    <div className="border-b border-slate-800 p-1.5 text-[11px] font-bold break-words">
                      <span>Amount Chargeable (In Words) : </span>
                      <span className="font-black">{numberToWords(numGrandTotal)}</span>
                    </div>

                    {/* HSN Tax Summary Table */}
                    <div className="border-b border-slate-800 overflow-x-auto -mx-1 sm:mx-0">
                      <table className="w-full text-[10px] border-collapse text-center min-w-[460px] print:min-w-full">
                        <thead className="bg-slate-100 border-b border-slate-800 font-bold">
                          <tr>
                            <th rowSpan={2} className="border-r border-slate-800 p-1">HSN/SAC</th>
                            <th rowSpan={2} className="border-r border-slate-800 p-1">TAXABLE AMOUNT</th>
                            <th colSpan={2} className="border-r border-slate-800 p-1 border-b">CGST</th>
                            <th colSpan={2} className="border-r border-slate-800 p-1 border-b">SGST</th>
                            <th colSpan={2} className="p-1 border-b">IGST</th>
                          </tr>
                          <tr>
                            <th className="border-r border-slate-800 p-0.5">%</th>
                            <th className="border-r border-slate-800 p-0.5">Amount</th>
                            <th className="border-r border-slate-800 p-0.5">%</th>
                            <th className="border-r border-slate-800 p-0.5">Amount</th>
                            <th className="border-r border-slate-800 p-0.5">%</th>
                            <th className="p-0.5">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inv.invoice_type === 'NON_GST' ? (
                            <tr>
                              <td className="border-r border-slate-800 p-1">{itemsList[0]?.hsn_code || itemsList[0]?.product?.hsn_code || '-'}</td>
                              <td className="border-r border-slate-800 p-1 font-semibold">{numTaxable.toFixed(2)}</td>
                              <td className="border-r border-slate-800 p-1">0.00</td>
                              <td className="border-r border-slate-800 p-1">0.00</td>
                              <td className="border-r border-slate-800 p-1">0.00</td>
                              <td className="border-r border-slate-800 p-1">0.00</td>
                              <td className="border-r border-slate-800 p-1">0.00</td>
                              <td className="p-1">0.00</td>
                            </tr>
                          ) : numIgst > 0 || (numCgst === 0 && numSgst === 0 && numGst > 0) ? (
                            <tr>
                              <td className="border-r border-slate-800 p-1">{itemsList[0]?.hsn_code || itemsList[0]?.product?.hsn_code || '-'}</td>
                              <td className="border-r border-slate-800 p-1 font-semibold">{numTaxable.toFixed(2)}</td>
                              <td className="border-r border-slate-800 p-1">-</td>
                              <td className="border-r border-slate-800 p-1">0.00</td>
                              <td className="border-r border-slate-800 p-1">-</td>
                              <td className="border-r border-slate-800 p-1">0.00</td>
                              <td className="border-r border-slate-800 p-1 font-semibold">{itemsList[0]?.gst_percentage || itemsList[0]?.product?.gst_percentage || 5}.00</td>
                              <td className="p-1 font-semibold">{numGst.toFixed(2)}</td>
                            </tr>
                          ) : (
                            <tr>
                              <td className="border-r border-slate-800 p-1">{itemsList[0]?.hsn_code || itemsList[0]?.product?.hsn_code || '-'}</td>
                              <td className="border-r border-slate-800 p-1 font-semibold">{numTaxable.toFixed(2)}</td>
                              <td className="border-r border-slate-800 p-1">{((itemsList[0]?.gst_percentage || 5) / 2).toFixed(2)}</td>
                              <td className="border-r border-slate-800 p-1 font-semibold">{numCgst.toFixed(2)}</td>
                              <td className="border-r border-slate-800 p-1">{((itemsList[0]?.gst_percentage || 5) / 2).toFixed(2)}</td>
                              <td className="border-r border-slate-800 p-1 font-semibold">{numSgst.toFixed(2)}</td>
                              <td className="border-r border-slate-800 p-1">-</td>
                              <td className="p-1">0.00</td>
                            </tr>
                          )}
                          <tr className="font-bold bg-slate-50 border-t border-slate-800">
                            <td className="border-r border-slate-800 p-1 text-left">Total</td>
                            <td className="border-r border-slate-800 p-1">{numTaxable.toFixed(2)}</td>
                            <td className="border-r border-slate-800 p-1"></td>
                            <td className="border-r border-slate-800 p-1">{numCgst > 0 ? numCgst.toFixed(2) : '0.00'}</td>
                            <td className="border-r border-slate-800 p-1"></td>
                            <td className="border-r border-slate-800 p-1">{numSgst > 0 ? numSgst.toFixed(2) : '0.00'}</td>
                            <td className="border-r border-slate-800 p-1"></td>
                            <td className="p-1 font-bold">{(numIgst > 0 || (numCgst === 0 && numSgst === 0)) ? numGst.toFixed(2) : '0.00'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Signatory Footer */}
                    <div className="pt-6 pb-2 text-right text-[11px] font-bold">
                      <p>For {creator.company_name || creator.full_name || 'ASVA CLOTHING'}</p>
                      <div className="h-10"></div>
                      <p className="font-normal text-[10px]">Authorized Signatory</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteInvoiceTarget)}
        onClose={() => setDeleteInvoiceTarget(null)}
        onConfirm={() => {
          if (deleteInvoiceTarget) {
            deleteInvoiceMutation.mutate(deleteInvoiceTarget.id, {
              onSuccess: () => setDeleteInvoiceTarget(null),
            });
          }
        }}
        title="Delete Invoice Record"
        message={`Are you sure you want to delete invoice ${
          deleteInvoiceTarget?.invoice_number || deleteInvoiceTarget?.invoiceNumber || ''
        }? This action will remove the invoice record permanently.`}
        confirmText="Delete Invoice"
        isLoading={deleteInvoiceMutation.isPending}
      />

      {/* Edit Invoice Number Modal */}
      <Modal
        isOpen={Boolean(editInvoiceTarget)}
        onClose={() => setEditInvoiceTarget(null)}
        title="Edit Invoice Number"
      >
        <form onSubmit={handleSaveInvoiceNumber} className="space-y-4">
          <Input
            label="Invoice Number *"
            value={newNumInput}
            onChange={(e) => setNewNumInput(e.target.value)}
            required
            autoFocus
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditInvoiceTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={updateInvoiceMutation.isPending}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

