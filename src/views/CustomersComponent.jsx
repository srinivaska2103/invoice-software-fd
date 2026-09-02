'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit2, Trash2, Phone, Mail, MapPin } from 'lucide-react';
import { customerApi } from '../services/api';
import { Button, Input, Table, Modal, Pagination, Badge, ConfirmModal, EmptyState } from '../components/common/UIComponents';
import { formatCurrency } from '../utils/formatters';
import useAuthStore from '../store/useAuthStore';

export function CustomersComponent() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [formData, setFormData] = useState({
    customer_name: '',
    company_name: '',
    phone: '',
    email: '',
    gst_number: '',
    address: '',
    city: '',
    state: '',
    state_code: '',
    pincode: '',
  });

  const { data: customerResponse, isLoading } = useQuery({
    queryKey: ['customers', page, searchTerm],
    queryFn: () => customerApi.getAll({ page, search: searchTerm }),
  });

  const customers = customerResponse?.data?.customers || customerResponse?.data || [];
  const totalPages = customerResponse?.data?.meta?.totalPages || customerResponse?.data?.totalPages || 1;

  const createMutation = useMutation({
    mutationFn: (data) => customerApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      setIsModalOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => customerApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      setIsModalOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: customerApi.delete,
    onSuccess: () => queryClient.invalidateQueries(['customers']),
  });

  const resetForm = () => {
    setSelectedCustomer(null);
    setFormData({
      customer_name: '',
      company_name: '',
      phone: '',
      email: '',
      gst_number: '',
      address: '',
      city: '',
      state: '',
      state_code: '',
      pincode: '',
    });
  };

  const handleOpenEdit = (customer) => {
    setSelectedCustomer(customer);
    setFormData({
      customer_name: customer.customer_name || customer.name || '',
      company_name: customer.company_name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      gst_number: customer.gst_number || customer.gstin || '',
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      state_code: customer.state_code || '',
      pincode: customer.pincode || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      customer_name: formData.customer_name,
      company_name: formData.company_name || undefined,
      phone: formData.phone || undefined,
      email: formData.email || undefined,
      gst_number: formData.gst_number || undefined,
      address: formData.address || undefined,
      city: formData.city || undefined,
      state: formData.state || undefined,
      state_code: formData.state_code || undefined,
      pincode: formData.pincode || undefined,
    };

    if (selectedCustomer) {
      updateMutation.mutate({ id: selectedCustomer.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-6 pb-24 sm:pb-32 lg:pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Customer Management</h1>
          <p className="text-xs text-slate-500">Manage client directory, GST details, and outstanding balances.</p>
        </div>
        <Button
          icon={Plus}
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
        >
          Add Customer
        </Button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
        <Input
          icon={Search}
          placeholder="Search by customer name, phone, or GST number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Desktop Table View (>=768px) */}
      <div className="hidden md:block">
        <Table
          headers={['Customer Name', 'Contact Details', 'GST Number', 'Outstanding Balance', 'Actions']}
          isLoading={isLoading}
          isEmpty={!customers.length}
        >
          {customers.map((cust) => {
            const name = cust.customer_name || cust.name || 'Customer';
            const gst = cust.gst_number || cust.gstin;
            const balance = cust.outstanding_balance ?? cust.outstandingBalance ?? 0;

            return (
              <tr key={cust.id} className="hover:bg-slate-50/60 transition">
                <td className="px-4 py-3.5">
                  <div className="font-semibold text-slate-800">{name}</div>
                  {cust.company_name && (
                    <div className="text-xs font-medium text-indigo-600">{cust.company_name}</div>
                  )}
                  <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" /> {cust.city || 'N/A'}, {cust.state || ''}
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="text-xs text-slate-600 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" /> {cust.phone || '-'}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" /> {cust.email || '-'}
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  {gst ? <Badge variant="indigo">{gst}</Badge> : <span className="text-slate-400 text-xs">-</span>}
                </td>
                <td className="px-4 py-3.5 font-bold text-slate-800">
                  {formatCurrency(balance)}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(cust)}
                      className="p-2 rounded-xl text-indigo-600 bg-indigo-50/70 border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all duration-150 hover:scale-105 active:scale-95 shadow-2xs"
                      title="Edit Customer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => setCustomerToDelete(cust)}
                        className="p-2 rounded-xl text-rose-600 bg-rose-50/70 border border-rose-100 hover:bg-rose-600 hover:text-white transition-all duration-150 hover:scale-105 active:scale-95 shadow-2xs"
                        title="Delete Customer"
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
          <div className="p-8 text-center text-xs text-slate-400">Loading customers...</div>
        ) : !customers.length ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
            <EmptyState title="No Customers Found" message="Add your first customer to manage ledgers and billing." />
          </div>
        ) : (
          customers.map((cust) => {
            const name = cust.customer_name || cust.name || 'Customer';
            const gst = cust.gst_number || cust.gstin;
            const balance = cust.outstanding_balance ?? cust.outstandingBalance ?? 0;

            return (
              <div key={cust.id} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2.5">
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm">{name}</h3>
                    {cust.company_name && (
                      <p className="text-xs font-semibold text-indigo-600">{cust.company_name}</p>
                    )}
                  </div>
                  {gst && <Badge variant="indigo">{gst}</Badge>}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Contact</span>
                    <span className="text-slate-700 font-semibold">{cust.phone || cust.email || '-'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Outstanding</span>
                    <span className="text-slate-900 font-extrabold">{formatCurrency(balance)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {cust.city || 'N/A'}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEdit(cust)}
                      className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => setCustomerToDelete(cust)}
                      className="p-1.5 rounded-lg bg-rose-50 text-rose-600 font-bold text-xs flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedCustomer ? 'Edit Customer' : 'Add New Customer'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Customer Full Name *"
            placeholder="e.g. Acme Corp / John Doe"
            value={formData.customer_name}
            onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
            required
          />
          <Input
            label="Company Name"
            placeholder="e.g. Acme Logistics Ltd"
            value={formData.company_name}
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Phone Number"
              placeholder="+91 9876543210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="client@acme.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <Input
            label="GST Number"
            placeholder="29ABCDE1234F1Z5"
            value={formData.gst_number}
            onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
          />
          <Input
            label="Address"
            placeholder="Door #, Street name"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Input
              label="City"
              placeholder="Bengaluru"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
            <Input
              label="State"
              placeholder="Karnataka"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            />
            <Input
              label="State Code"
              placeholder="e.g. 29"
              value={formData.state_code}
              onChange={(e) => setFormData({ ...formData, state_code: e.target.value })}
            />
            <Input
              label="Pincode"
              placeholder="560001"
              value={formData.pincode}
              onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
              Save Customer
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={Boolean(customerToDelete)}
        onClose={() => setCustomerToDelete(null)}
        onConfirm={() => {
          if (customerToDelete) {
            deleteMutation.mutate(customerToDelete.id, {
              onSuccess: () => setCustomerToDelete(null),
            });
          }
        }}
        title="Delete Customer Profile"
        message={`Are you sure you want to delete ${
          customerToDelete?.customer_name || customerToDelete?.name || 'this customer'
        }? This action will remove their record from directory.`}
        confirmText="Delete Customer"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
