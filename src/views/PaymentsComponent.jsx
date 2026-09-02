'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { paymentApi, customerApi, invoiceApi } from '../services/api';
import { Button, Input, Table, Modal, Select, Badge, ConfirmModal, EmptyState } from '../components/common/UIComponents';
import { formatCurrency, formatDate } from '../utils/formatters';
import useAuthStore from '../store/useAuthStore';

export function PaymentsComponent() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);

  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    paymentId: null,
    custName: '',
    amount: '',
  });

  const [formData, setFormData] = useState({
    customer_id: '',
    invoice_id: '',
    amount: '',
    payment_mode: 'CASH',
    reference_number: '',
  });

  const { data: paymentsRes, isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: () => paymentApi.getAll(),
  });

  const { data: customersRes } = useQuery({ queryKey: ['customers-list'], queryFn: () => customerApi.getAll() });
  const { data: invoicesRes } = useQuery({ queryKey: ['invoices-list'], queryFn: () => invoiceApi.getAll() });

  const payments = paymentsRes?.data?.payments || paymentsRes?.data || [];
  const customers = customersRes?.data?.customers || customersRes?.data || [];
  const invoices = invoicesRes?.data?.invoices || invoicesRes?.data || [];

  const [error, setError] = useState('');

  const handleOpenCreateModal = () => {
    setEditingPayment(null);
    setError('');
    setFormData({ customer_id: '', invoice_id: '', amount: '', payment_mode: 'CASH', reference_number: '' });
    setIsModalOpen(true);
  };

  const handleEditClick = (payment) => {
    setEditingPayment(payment);
    setError('');
    setFormData({
      customer_id: payment.customer_id || payment.customer?.id || '',
      invoice_id: payment.invoice_id || payment.invoice?.id || '',
      amount: payment.amount ?? '',
      payment_mode: payment.payment_mode || payment.paymentMethod || 'CASH',
      reference_number: payment.reference_number || payment.referenceNumber || '',
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (payment) => {
    const custName = payment.customer?.customer_name || payment.customer?.name || 'Customer';
    setDeleteModalState({
      isOpen: true,
      paymentId: payment.id,
      custName,
      amount: formatCurrency(payment.amount),
    });
  };

  const createPaymentMutation = useMutation({
    mutationFn: (data) => paymentApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['payments']);
      queryClient.invalidateQueries(['customers']);
      queryClient.invalidateQueries(['invoices']);
      setIsModalOpen(false);
      setEditingPayment(null);
      setError('');
    },
    onError: (err) => setError(err.message || 'Failed to record payment receipt.'),
  });

  const updatePaymentMutation = useMutation({
    mutationFn: ({ id, data }) => paymentApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['payments']);
      queryClient.invalidateQueries(['customers']);
      queryClient.invalidateQueries(['invoices']);
      setIsModalOpen(false);
      setEditingPayment(null);
      setError('');
    },
    onError: (err) => setError(err.message || 'Failed to update payment record.'),
  });

  const deletePaymentMutation = useMutation({
    mutationFn: (id) => paymentApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['payments']);
      queryClient.invalidateQueries(['customers']);
      queryClient.invalidateQueries(['invoices']);
      setDeleteModalState({ isOpen: false, paymentId: null, custName: '', amount: '' });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.customer_id) {
      setError('Please select a customer.');
      return;
    }

    const parsedAmount = parseFloat(formData.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid payment amount greater than ₹0.');
      return;
    }

    const payload = {
      customer_id: formData.customer_id,
      invoice_id: formData.invoice_id || undefined,
      payment_mode: formData.payment_mode,
      amount: parsedAmount,
      reference_number: formData.reference_number || undefined,
    };

    if (editingPayment) {
      updatePaymentMutation.mutate({ id: editingPayment.id, data: payload });
    } else {
      createPaymentMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-6 pb-24 sm:pb-32 lg:pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Payments & Ledger</h1>
          <p className="text-xs text-slate-500">Record customer receipts and manage payment transactions.</p>
        </div>
        <Button icon={Plus} onClick={handleOpenCreateModal}>
          Record Receipt Payment
        </Button>
      </div>

      {/* Desktop Table View (>=768px) */}
      <div className="hidden md:block">
        <Table
          headers={['Date', 'Customer', 'Invoice #', 'Amount Paid', 'Mode', 'Ref #', 'Actions']}
          isLoading={isLoading}
          isEmpty={!payments.length}
        >
          {payments.map((p) => {
            const custName = p.customer?.customer_name || p.customer?.name || 'Customer';
            const invNum = p.invoice?.invoice_number || p.invoice?.invoiceNumber || 'General Credit';
            const mode = p.payment_mode || p.paymentMethod || 'CASH';
            const refNum = p.reference_number || p.referenceNumber;

            return (
              <tr key={p.id} className="hover:bg-slate-50/60 transition">
                <td className="px-4 py-3.5 text-xs text-slate-500">{formatDate(p.created_at || p.createdAt)}</td>
                <td className="px-4 py-3.5 font-semibold text-slate-800">{custName}</td>
                <td className="px-4 py-3.5 text-indigo-600 font-semibold">{invNum}</td>
                <td className="px-4 py-3.5 font-bold text-emerald-600">{formatCurrency(p.amount)}</td>
                <td className="px-4 py-3.5">
                  <Badge variant="blue">{mode}</Badge>
                </td>
                <td className="px-4 py-3.5 text-xs text-slate-400">{refNum || '-'}</td>
                <td className="px-4 py-3.5 text-right">
                  <div className="flex justify-end items-center gap-1.5">
                    <button
                      onClick={() => handleEditClick(p)}
                      className="p-2 rounded-xl text-indigo-600 bg-indigo-50/70 border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all duration-150 hover:scale-105 active:scale-95 shadow-2xs"
                      title="Edit Payment Record"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteClick(p)}
                        className="p-2 rounded-xl text-rose-600 bg-rose-50/70 border border-rose-100 hover:bg-rose-600 hover:text-white transition-all duration-150 hover:scale-105 active:scale-95 shadow-2xs"
                        title="Delete Payment Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      </div>

      {/* Mobile Card List (<768px) */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading payment receipts...</div>
        ) : !payments.length ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
            <EmptyState title="No Payment Receipts" message="Recorded payment transactions will appear here." />
          </div>
        ) : (
          payments.map((p) => {
            const custName = p.customer?.customer_name || p.customer?.name || 'Customer';
            const invNum = p.invoice?.invoice_number || p.invoice?.invoiceNumber || 'General Credit';
            const mode = p.payment_mode || p.paymentMethod || 'CASH';
            const refNum = p.reference_number || p.referenceNumber;

            return (
              <div key={p.id} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm">{custName}</h3>
                    <span className="text-xs font-semibold text-indigo-600">{invNum}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="blue">{mode}</Badge>
                    <button
                      onClick={() => handleEditClick(p)}
                      className="p-1.5 rounded-xl text-indigo-600 bg-indigo-50/70 border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all duration-150 active:scale-95 shadow-2xs"
                      title="Edit Payment"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteClick(p)}
                        className="p-1.5 rounded-xl text-rose-600 bg-rose-50/70 border border-rose-100 hover:bg-rose-600 hover:text-white transition-all duration-150 active:scale-95 shadow-2xs"
                        title="Delete Payment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Amount Paid:</span>
                  <span className="font-extrabold text-emerald-600 text-sm">{formatCurrency(p.amount)}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-50">
                  <span>Ref: {refNum || 'N/A'}</span>
                  <span>{formatDate(p.created_at || p.createdAt)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPayment ? 'Edit Payment Receipt' : 'Record Payment Receipt'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl font-bold flex items-center gap-2 animate-shake">
              <span>⚠</span> {error}
            </div>
          )}

          <Select
            label="Select Customer *"
            value={formData.customer_id}
            onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
            placeholder="Select customer..."
            disabled={Boolean(editingPayment)}
            options={[
              { value: '', label: 'Select customer...' },
              ...customers.map((c) => ({
                value: c.id,
                label: `${c.customer_name || c.name} (Balance: ₹${c.outstanding_balance ?? c.outstandingBalance ?? 0})`,
              })),
            ]}
          />

          <Select
            label="Link to Invoice (Optional)"
            value={formData.invoice_id}
            onChange={(e) => setFormData({ ...formData, invoice_id: e.target.value })}
            placeholder="None (General Ledger Receipt)"
            disabled={Boolean(editingPayment)}
            options={[
              { value: '', label: 'None (General Ledger Receipt)' },
              ...invoices.map((inv) => ({
                value: inv.id,
                label: `#${inv.invoice_number || inv.invoiceNumber} - Total: ₹${inv.grand_total ?? inv.grandTotal}`,
              })),
            ]}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Amount (₹) *"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
            <Select
              label="Payment Mode"
              value={formData.payment_mode}
              onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
            >
              <option value="CASH">CASH</option>
              <option value="BANK_TRANSFER">BANK TRANSFER</option>
              <option value="UPI">UPI / GPay / PhonePe</option>
              <option value="CHEQUE">CHEQUE</option>
              <option value="CREDIT">CREDIT / ON ACCOUNT</option>
            </Select>
          </div>

          <Input
            label="Reference Number / UTR / Cheque #"
            placeholder="e.g. UTR19920391"
            value={formData.reference_number}
            onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={createPaymentMutation.isPending || updatePaymentMutation.isPending}
            >
              {editingPayment ? 'Save Changes' : 'Record Payment'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, paymentId: null, custName: '', amount: '' })}
        onConfirm={() => deletePaymentMutation.mutate(deleteModalState.paymentId)}
        title="Delete Payment Receipt"
        message={`Are you sure you want to delete this payment receipt of ${deleteModalState.amount} for ${deleteModalState.custName}? This transaction will be deleted and the customer balance updated.`}
        confirmText="Delete Payment"
        variant="danger"
        isLoading={deletePaymentMutation.isPending}
      />
    </div>
  );
}
