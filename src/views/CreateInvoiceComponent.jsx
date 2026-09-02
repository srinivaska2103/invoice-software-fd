'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, ArrowLeft, Receipt, UserCheck, Package, Truck, Sparkles, FileText, CheckCircle, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { customerApi, productApi, invoiceApi, agentApi, transportApi } from '../services/api';
import { Button, Input, Select, Card, Badge } from '../components/common/UIComponents';
import { ModernDatePicker } from '../components/common/ModernDatePicker';
import { formatCurrency } from '../utils/formatters';
import useAuthStore from '../store/useAuthStore';

export function CreateInvoiceComponent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const [customerId, setCustomerId] = useState('');
  const [customInvoiceNumber, setCustomInvoiceNumber] = useState('INV-');
  const [issuedDate, setIssuedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [deliveredDate, setDeliveredDate] = useState('');
  const [invoiceType, setInvoiceType] = useState('GST');
  const [salesType, setSalesType] = useState('Direct');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [agentId, setAgentId] = useState('');
  const [transportId, setTransportId] = useState('');
  const [transportMode, setTransportMode] = useState('');
  const [lrNumber, setLrNumber] = useState('');
  const [weight, setWeight] = useState('');
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [cashDiscount, setCashDiscount] = useState(0);
  const [cashDiscountType, setCashDiscountType] = useState('PERCENT');
  const [tradeDiscount, setTradeDiscount] = useState(0);
  const [tradeDiscountType, setTradeDiscountType] = useState('PERCENT');
  const [schemeDiscount, setSchemeDiscount] = useState(0);
  const [lessFor, setLessFor] = useState(0);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([
    { product_id: '', product_size_id: '', quantity: 1, rate: 0, availableStock: 0 },
  ]);
  const [error, setError] = useState('');

  const { data: customersRes } = useQuery({ queryKey: ['customers-list'], queryFn: () => customerApi.getAll() });
  const { data: productsRes } = useQuery({ queryKey: ['products-list'], queryFn: () => productApi.getAll() });
  const { data: agentsRes } = useQuery({ queryKey: ['agents-list'], queryFn: () => agentApi.getAll() });
  const { data: transportsRes } = useQuery({ queryKey: ['transports-list'], queryFn: () => transportApi.getAll() });

  const customers = customersRes?.data?.customers || customersRes?.data || [];
  const products = productsRes?.data?.products || productsRes?.data || [];
  const agents = agentsRes?.data?.agents || agentsRes?.data || [];
  const transports = transportsRes?.data?.transports || transportsRes?.data || [];

  const selectedCustomer = customers.find((c) => c.id === customerId);

  const handleProductSelect = (index, prodId) => {
    const selectedProd = products.find((p) => p.id === prodId);
    const newItems = [...items];
    newItems[index].product_id = prodId;
    newItems[index].product_size_id = '';
    newItems[index].availableStock = 0;
    setItems(newItems);
  };

  const handleSizeSelect = (index, sizeId) => {
    const selectedProd = products.find((p) => p.id === items[index].product_id);
    const sizes = selectedProd?.product_sizes || selectedProd?.sizes || [];
    const selectedSize = sizes.find((s) => s.id === sizeId);

    const newItems = [...items];
    newItems[index].product_size_id = sizeId;
    if (selectedSize) {
      newItems[index].availableStock = selectedSize.current_stock ?? selectedSize.stock ?? 0;
    }
    setItems(newItems);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItemRow = () => {
    setItems([...items, { product_id: '', product_size_id: '', quantity: 1, rate: 0, availableStock: 0 }]);
  };

  const removeItemRow = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.rate) || 0), 0);

  // 1. Cash Discount
  const inputCashVal = Number(cashDiscount) || 0;
  const calculatedCashDisc = cashDiscountType === 'PERCENT' ? (subtotal * inputCashVal) / 100 : inputCashVal;
  const numCashDisc = Math.min(subtotal, Math.max(0, calculatedCashDisc));
  const subtotalAfterCash = Math.max(0, subtotal - numCashDisc);

  // 2. Trade Discount
  const inputTradeVal = Number(tradeDiscount) || 0;
  const calculatedTradeDisc = tradeDiscountType === 'PERCENT' ? (subtotalAfterCash * inputTradeVal) / 100 : inputTradeVal;
  const numTradeDisc = Math.min(subtotalAfterCash, Math.max(0, calculatedTradeDisc));

  // 3. Scheme Discount
  const numSchemeDisc = Number(schemeDiscount) || 0;

  // 4. Taxable Value
  const taxableAmount = Math.max(0, subtotalAfterCash - numTradeDisc - numSchemeDisc);

  // 5. Tax Amount (GST)
  const taxAmount = invoiceType === 'NON_GST' ? 0 : (taxableAmount * 5) / 100;

  // 6. Net Amount
  const netAmount = Math.round(taxableAmount + taxAmount);

  // 7. Less F.O.R
  const numLessFor = Number(lessFor) || 0;

  // 8. Grand Total / Payable Amount
  const grandTotal = Math.max(0, netAmount - numLessFor);

  const createInvoiceMutation = useMutation({
    mutationFn: (data) => invoiceApi.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['invoices']);
      queryClient.invalidateQueries(['products']);
      
      const createdInvoice = res?.data || res;
      if (createdInvoice?.id) {
        const token = useAuthStore.getState().token;
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
        window.open(`${apiBase}/invoices/${createdInvoice.id}/pdf${token ? `?token=${token}` : ''}`, '_blank');
      }

      router.push('/invoices');
    },
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!customInvoiceNumber || !customInvoiceNumber.trim()) {
      setError('Please enter an Invoice Number.');
      return;
    }

    if (!customerId) {
      setError('Please select a customer.');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.product_id || !item.product_size_id) {
        setError(`Please select product & size variant for line #${i + 1}`);
        return;
      }
      if (item.quantity > item.availableStock) {
        setError(`Insufficient stock for line #${i + 1}. Available: ${item.availableStock}`);
        return;
      }
    }

    const payload = {
      customer_id: customerId,
      invoice_number: customInvoiceNumber.trim() || undefined,
      invoice_date: issuedDate || undefined,
      delivery_date: deliveredDate || undefined,
      invoice_type: invoiceType,
      sales_type: salesType,
      payment_method: paymentMethod,
      agent_id: agentId || undefined,
      transport_id: transportId || undefined,
      transport_mode: transportMode || undefined,
      lr_number: lrNumber || undefined,
      weight: weight ? parseFloat(weight) : undefined,
      delivery_charge: parseFloat(deliveryCharge || 0),
      cash_discount_percent: cashDiscountType === 'PERCENT' ? parseFloat(cashDiscount || 0) : undefined,
      cash_discount: parseFloat(numCashDisc.toFixed(2)),
      trade_discount_percent: tradeDiscountType === 'PERCENT' ? parseFloat(tradeDiscount || 0) : undefined,
      trade_discount: parseFloat(numTradeDisc.toFixed(2)),
      scheme_discount: parseFloat(numSchemeDisc.toFixed(2)),
      less_for: parseFloat(numLessFor.toFixed(2)),
      discount: parseFloat((numCashDisc + numTradeDisc + numSchemeDisc).toFixed(2)),
      notes: notes || undefined,
      items: items.map((it) => ({
        product_id: it.product_id,
        product_size_id: it.product_size_id,
        quantity: parseInt(it.quantity),
        rate: parseFloat(it.rate),
      })),
    };

    createInvoiceMutation.mutate(payload);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Modern Banner Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl shadow-indigo-950/20 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-indigo-700/50">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-violet-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex items-center gap-4 z-10">
          <Button
            variant="ghost"
            size="sm"
            icon={ArrowLeft}
            onClick={() => router.push('/invoices')}
            className="text-white hover:bg-white/10 border border-white/20 rounded-2xl"
          >
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[10px] uppercase font-extrabold tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 rounded-full">
                New Invoice
              </span>
              <span className="text-xs text-indigo-200/80 font-mono font-medium">
                #{customInvoiceNumber || 'DRAFT'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">Create Tax Invoice</h1>
          </div>
        </div>

        <div className="flex items-center gap-3 z-10 self-end sm:self-auto">
          <div className="hidden sm:block text-right">
            <p className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider">Estimated Total</p>
            <p className="text-xl font-extrabold text-emerald-400 font-mono">{formatCurrency(grandTotal)}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-gradient-to-r from-rose-600 to-red-600 text-white text-xs p-3.5 px-4 rounded-2xl font-extrabold flex items-center gap-2.5 shadow-md animate-shake">
          <span className="text-base">⚠</span> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 pb-32 sm:pb-36 lg:pb-8">
        {/* Section 1: Customer & Billing Setup */}
        <Card icon={UserCheck} title="Customer & Billing Setup" className="relative z-40">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              label="Invoice Number *"
              placeholder="Enter Invoice Number (e.g. INV-001)"
              value={customInvoiceNumber}
              onChange={(e) => setCustomInvoiceNumber(e.target.value)}
              required
            />

            <Select
              label="Customer *"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              placeholder="Select customer..."
              options={[
                { value: '', label: 'Select customer...' },
                ...customers.map((c) => ({
                  value: c.id,
                  label: `${c.customer_name || c.name}${c.company_name ? ` • ${c.company_name}` : ''}${c.gst_number ? ` (GST: ${c.gst_number})` : ''}`,
                })),
              ]}
            />

            <ModernDatePicker
              label="Issued Date *"
              value={issuedDate}
              onChange={(val) => setIssuedDate(val)}
              placeholder="Select Issued Date"
            />

            <ModernDatePicker
              label="Delivered Date (Optional)"
              value={deliveredDate}
              onChange={(val) => setDeliveredDate(val)}
              placeholder="Select Delivered Date"
            />
          </div>

          {selectedCustomer && (
            <div className="mt-3 p-3 px-4 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-wrap items-center justify-between text-xs text-slate-700 gap-2">
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-900">{selectedCustomer.customer_name || selectedCustomer.name}</span>
                {selectedCustomer.company_name && <span className="text-indigo-600 font-semibold">• {selectedCustomer.company_name}</span>}
                {selectedCustomer.address && <span className="text-slate-500 hidden md:inline">• {selectedCustomer.address}</span>}
              </div>
              <div className="flex items-center gap-3">
                {selectedCustomer.phone && (
                  <span className="text-slate-700 font-semibold inline-flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{selectedCustomer.phone}</span>
                  </span>
                )}
                {selectedCustomer.gst_number && (
                  <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-mono font-bold text-[11px]">
                    GSTIN: {selectedCustomer.gst_number}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 pt-4 border-t border-slate-100">
            <Select label="Invoice Type" value={invoiceType} onChange={(e) => setInvoiceType(e.target.value)}>
              <option value="GST">GST Tax Invoice (5% GST)</option>
              {isAdmin && <option value="NON_GST">NON-GST Bill (0% Tax)</option>}
            </Select>

            <Select label="Sales Terms" value={salesType} onChange={(e) => setSalesType(e.target.value)}>
              <option value="Direct">Direct Cash / Immediate</option>
            </Select>

            <Select label="Payment Method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="CASH">CASH</option>
              <option value="BANK_TRANSFER">BANK TRANSFER</option>
              <option value="UPI">UPI / GPay / PhonePe</option>
              <option value="CHEQUE">CHEQUE</option>
            </Select>
          </div>

          {/* Logistics & Shipping Section */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <Truck className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Logistics & Shipping Details</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select label="Sales Agent (Optional)" value={agentId} onChange={(e) => setAgentId(e.target.value)}>
                <option value="">None</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.agent_name || a.name}
                  </option>
                ))}
              </Select>

              <Select label="Transport Agency (Optional)" value={transportId} onChange={(e) => setTransportId(e.target.value)}>
                <option value="">None</option>
                {transports.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.transport_name || t.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
              <Input
                label="Transport Mode"
                placeholder="e.g. Road Freight"
                value={transportMode}
                onChange={(e) => setTransportMode(e.target.value)}
              />
              <Input
                label="LR Number"
                placeholder="e.g. LR-99410"
                value={lrNumber}
                onChange={(e) => setLrNumber(e.target.value)}
              />
              <Input
                label="Weight (kg)"
                type="number"
                step="0.01"
                placeholder="e.g. 25.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
              <Input
                label="Delivery Charges (₹)"
                type="number"
                value={deliveryCharge}
                onChange={(e) => setDeliveryCharge(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Section 2: Invoice Line Items */}
        <Card icon={Package} title="Invoice Line Items" className="relative z-30">
          <div className="space-y-3">
            {items.map((item, idx) => {
              const selectedProduct = products.find((p) => p.id === item.product_id);
              const sizes = selectedProduct?.product_sizes || selectedProduct?.sizes || [];
              const lineTotal = (Number(item.quantity) * Number(item.rate)) || 0;

              return (
                <div
                  key={idx}
                  style={{ zIndex: items.length - idx + 20 }}
                  className="relative p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl grid grid-cols-1 sm:grid-cols-12 gap-3 items-center hover:border-indigo-200 transition-all duration-200 shadow-2xs"
                >
                  <div className="sm:col-span-4">
                    <Select
                      label={`Line #${idx + 1} • Product Item`}
                      value={item.product_id}
                      onChange={(e) => handleProductSelect(idx, e.target.value)}
                      placeholder="Select product..."
                      options={[
                        { value: '', label: 'Select product...' },
                        ...products.map((p) => ({
                          value: p.id,
                          label: p.item_name || p.name,
                        })),
                      ]}
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <Select
                      label="Size Variant"
                      value={item.product_size_id}
                      onChange={(e) => handleSizeSelect(idx, e.target.value)}
                      disabled={!item.product_id}
                      placeholder="Select size..."
                      options={[
                        { value: '', label: 'Select size...' },
                        ...sizes.map((s) => ({
                          value: s.id,
                          label: `Size: ${s.size} (Stock: ${s.current_stock ?? s.stock ?? 0})`,
                        })),
                      ]}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Qty</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full bg-white border border-slate-200 rounded-xl text-sm px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none font-bold"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Unit Rate (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full bg-white border border-slate-200 rounded-xl text-sm px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none font-bold"
                      value={item.rate}
                      onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                      required
                    />
                  </div>

                  <div className="sm:col-span-1 flex items-center justify-between sm:justify-end gap-2">
                    <div className="sm:hidden text-xs font-bold text-indigo-600">
                      Total: {formatCurrency(lineTotal)}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      disabled={items.length <= 1}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 transition"
                      title="Remove Item Line"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <Button type="button" variant="outline" size="sm" icon={Plus} onClick={addItemRow} className="mt-4">
            Add Another Item Line
          </Button>
        </Card>

        {/* Section 3: Summary & Financial Totals */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative z-10">
          <div className="lg:col-span-7 space-y-4">
            <Card icon={FileText} title="Discounts, Less F.O.R & Notes">
              <div className="space-y-4">
                {/* Cash Discount */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Cash Discount
                  </label>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1">
                      <Input
                        type="number"
                        step="any"
                        placeholder={cashDiscountType === 'PERCENT' ? 'Cash Discount % (e.g. 3)' : 'Cash Discount Amount (₹)'}
                        value={cashDiscount}
                        onChange={(e) => setCashDiscount(e.target.value)}
                      />
                    </div>
                    <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200/80">
                      <button
                        type="button"
                        onClick={() => setCashDiscountType('PERCENT')}
                        className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition ${
                          cashDiscountType === 'PERCENT'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        %
                      </button>
                      <button
                        type="button"
                        onClick={() => setCashDiscountType('FIXED')}
                        className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition ${
                          cashDiscountType === 'FIXED'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        ₹
                      </button>
                    </div>
                  </div>
                </div>

                {/* Trade Discount */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Trade Discount
                  </label>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1">
                      <Input
                        type="number"
                        step="any"
                        placeholder={tradeDiscountType === 'PERCENT' ? 'Trade Discount % (e.g. 4.75)' : 'Trade Discount Amount (₹)'}
                        value={tradeDiscount}
                        onChange={(e) => setTradeDiscount(e.target.value)}
                      />
                    </div>
                    <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200/80">
                      <button
                        type="button"
                        onClick={() => setTradeDiscountType('PERCENT')}
                        className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition ${
                          tradeDiscountType === 'PERCENT'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        %
                      </button>
                      <button
                        type="button"
                        onClick={() => setTradeDiscountType('FIXED')}
                        className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition ${
                          tradeDiscountType === 'FIXED'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        ₹
                      </button>
                    </div>
                  </div>
                </div>

                {/* Scheme Discount & Less F.O.R Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Scheme Discount (₹)
                    </label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="e.g. 500"
                      value={schemeDiscount}
                      onChange={(e) => setSchemeDiscount(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Less F.O.R (₹)
                    </label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="e.g. 500"
                      value={lessFor}
                      onChange={(e) => setLessFor(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mt-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Remarks / Terms & Conditions (Optional)
                  </label>
                  <textarea
                    rows={2}
                    className="w-full bg-white border border-slate-200/90 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-sm p-3.5 text-slate-800 transition focus:outline-none shadow-2xs"
                    placeholder="e.g. Goods once sold will not be taken back..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-5 bg-white/95 backdrop-blur-md p-6 rounded-3xl border border-slate-200/90 shadow-xl shadow-indigo-950/5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Receipt className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Payment Summary</h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal:</span>
                <span className="font-bold text-slate-800">{formatCurrency(subtotal)}</span>
              </div>

              {numCashDisc > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Cash Discount {cashDiscountType === 'PERCENT' && inputCashVal > 0 ? `(${inputCashVal}%)` : ''}:</span>
                  <span className="text-rose-600 font-semibold">-{formatCurrency(numCashDisc)}</span>
                </div>
              )}

              {numTradeDisc > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Trade Discount {tradeDiscountType === 'PERCENT' && inputTradeVal > 0 ? `(${inputTradeVal}%)` : ''}:</span>
                  <span className="text-rose-600 font-semibold">-{formatCurrency(numTradeDisc)}</span>
                </div>
              )}

              {numSchemeDisc > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Scheme Discount:</span>
                  <span className="text-rose-600 font-semibold">-{formatCurrency(numSchemeDisc)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-700 font-bold pt-1.5 border-t border-slate-100">
                <span>Taxable Value:</span>
                <span className="font-bold text-slate-900">{formatCurrency(taxableAmount)}</span>
              </div>

              <div className="flex justify-between text-slate-600 items-center">
                <div className="flex items-center gap-1.5">
                  <span>Tax Value (GST):</span>
                  <Badge variant={invoiceType === 'NON_GST' ? 'slate' : 'indigo'}>
                    {invoiceType === 'NON_GST' ? '0% NON-GST' : '5% GST'}
                  </Badge>
                </div>
                <span className="font-semibold text-slate-700">{formatCurrency(taxAmount)}</span>
              </div>

              <div className="flex justify-between text-slate-700 font-bold pt-1.5 border-t border-slate-100">
                <span>Net Amount:</span>
                <span className="font-bold text-slate-900">{formatCurrency(netAmount)}</span>
              </div>

              {numLessFor > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Less F.O.R:</span>
                  <span className="text-rose-600 font-semibold">-{formatCurrency(numLessFor)}</span>
                </div>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-900 to-violet-900 text-white flex justify-between items-center shadow-lg shadow-indigo-900/20">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-200">Payable Amount</p>
                <p className="text-2xl font-black font-mono tracking-tight text-white">{formatCurrency(grandTotal)}</p>
              </div>
              <Sparkles className="w-6 h-6 text-amber-400" />
            </div>

            <Button
              type="submit"
              isLoading={createInvoiceMutation.isPending}
              size="lg"
              className="w-full text-base py-3.5"
            >
              Generate Tax Invoice & PDF
            </Button>
          </div>
        </div>

        {/* Sticky Mobile Summary Bar (<1024px) */}
        <div className="lg:hidden fixed bottom-16 left-0 right-0 z-20 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 p-3 px-4 flex items-center justify-between shadow-2xl">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Payable</span>
            <span className="text-lg font-black text-indigo-700 font-mono">{formatCurrency(grandTotal)}</span>
          </div>
          <Button
            type="submit"
            isLoading={createInvoiceMutation.isPending}
            size="sm"
            className="px-5 py-2.5 text-xs font-extrabold"
          >
            Generate Invoice
          </Button>
        </div>
      </form>
    </div>
  );
}
