'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Trash2, Edit2, Truck } from 'lucide-react';
import { transportApi } from '@/services/api';
import { Button, Input, Table, Modal, ConfirmModal } from '@/components/common/UIComponents';
import useAuthStore from '@/store/useAuthStore';

export function TransportsComponent() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransport, setSelectedTransport] = useState(null);
  const [transportToDelete, setTransportToDelete] = useState(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    transport_name: '',
    phone: '',
    address: '',
  });

  const { data: transportsRes, isLoading } = useQuery({
    queryKey: ['transports', searchTerm],
    queryFn: () => transportApi.getAll({ search: searchTerm }),
  });

  const transports = transportsRes?.data?.transports || transportsRes?.data || [];

  const createTransportMutation = useMutation({
    mutationFn: (data) => transportApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['transports']);
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err) => setError(err.message || 'Failed to create transport company'),
  });

  const updateTransportMutation = useMutation({
    mutationFn: ({ id, data }) => transportApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['transports']);
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err) => setError(err.message || 'Failed to update transport company'),
  });

  const deleteTransportMutation = useMutation({
    mutationFn: transportApi.delete,
    onSuccess: () => queryClient.invalidateQueries(['transports']),
  });

  const resetForm = () => {
    setSelectedTransport(null);
    setError('');
    setForm({
      transport_name: '',
      phone: '',
      address: '',
    });
  };

  const handleEdit = (t) => {
    setSelectedTransport(t);
    setError('');
    setForm({
      transport_name: t.transport_name || t.name || '',
      phone: t.phone || '',
      address: t.address || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const payload = {
      transport_name: form.transport_name,
      phone: form.phone || undefined,
      address: form.address || undefined,
    };

    if (selectedTransport) {
      updateTransportMutation.mutate({ id: selectedTransport.id, data: payload });
    } else {
      createTransportMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-6 pb-24 sm:pb-32 lg:pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Transport Agencies Management</h1>
          <p className="text-xs text-slate-500">Manage shipping transporters, delivery agencies, and contact details.</p>
        </div>
        <Button icon={Plus} onClick={() => { resetForm(); setIsModalOpen(true); }}>
          Add Transport Agency
        </Button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
        <Input
          icon={Search}
          placeholder="Search transport agencies by name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Table
        headers={['Transport Agency Name', 'Phone', 'Address', 'Actions']}
        isLoading={isLoading}
        isEmpty={!transports.length}
      >
        {transports.map((t) => (
          <tr key={t.id} className="hover:bg-slate-50/60 transition">
            <td className="px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                  <Truck className="w-4 h-4" />
                </div>
                <div className="font-semibold text-slate-800">{t.transport_name || t.name}</div>
              </div>
            </td>
            <td className="px-4 py-3.5 text-xs font-medium text-slate-600">
              {t.phone || 'N/A'}
            </td>
            <td className="px-4 py-3.5 text-xs text-slate-500 truncate max-w-xs">
              {t.address || 'N/A'}
            </td>
            <td className="px-4 py-3.5">
              <div className="flex items-center gap-1.5">
                <button
                  title="Edit Transport"
                  onClick={() => handleEdit(t)}
                  className="p-1.5 rounded-lg text-amber-600 bg-amber-50 hover:bg-amber-100 transition"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {isAdmin && (
                  <button
                    title="Delete Transport"
                    onClick={() => setTransportToDelete(t)}
                    className="p-1.5 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </Table>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedTransport ? 'Edit Transport Agency' : 'Add Transport Agency'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-3 rounded-xl font-medium">
              {error}
            </div>
          )}

          <Input
            label="Transport Agency Name"
            placeholder="e.g. VRL Logistics / BlueDart"
            value={form.transport_name}
            onChange={(e) => setForm({ ...form, transport_name: e.target.value })}
            required
          />

          <Input
            label="Phone Number"
            placeholder="9876543210"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />

          <Input
            label="Address"
            placeholder="Logistics hub or branch address..."
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createTransportMutation.isPending || updateTransportMutation.isPending}>
              {selectedTransport ? 'Save Changes' : 'Create Transport'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={Boolean(transportToDelete)}
        onClose={() => setTransportToDelete(null)}
        onConfirm={() => {
          if (transportToDelete) {
            deleteTransportMutation.mutate(transportToDelete.id, {
              onSuccess: () => setTransportToDelete(null),
            });
          }
        }}
        title="Delete Transport Agency"
        message={`Are you sure you want to delete ${
          transportToDelete?.transport_name || transportToDelete?.name || 'this transport agency'
        }? Their record will be removed.`}
        confirmText="Delete Agency"
        isLoading={deleteTransportMutation.isPending}
      />
    </div>
  );
}
