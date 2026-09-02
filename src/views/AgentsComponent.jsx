'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Trash2, Edit2, UserCheck } from 'lucide-react';
import { agentApi } from '@/services/api';
import { Button, Input, Table, Modal, Badge, ConfirmModal } from '@/components/common/UIComponents';
import useAuthStore from '@/store/useAuthStore';

export function AgentsComponent() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agentToDelete, setAgentToDelete] = useState(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    agent_name: '',
    phone: '',
    commission: 0,
    address: '',
  });

  const { data: agentsRes, isLoading } = useQuery({
    queryKey: ['agents', searchTerm],
    queryFn: () => agentApi.getAll({ search: searchTerm }),
  });

  const agents = agentsRes?.data?.agents || agentsRes?.data || [];

  const createAgentMutation = useMutation({
    mutationFn: (data) => agentApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['agents']);
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err) => setError(err.message || 'Failed to create agent'),
  });

  const updateAgentMutation = useMutation({
    mutationFn: ({ id, data }) => agentApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['agents']);
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err) => setError(err.message || 'Failed to update agent'),
  });

  const deleteAgentMutation = useMutation({
    mutationFn: agentApi.delete,
    onSuccess: () => queryClient.invalidateQueries(['agents']),
  });

  const resetForm = () => {
    setSelectedAgent(null);
    setError('');
    setForm({
      agent_name: '',
      phone: '',
      commission: 0,
      address: '',
    });
  };

  const handleEdit = (agent) => {
    setSelectedAgent(agent);
    setError('');
    setForm({
      agent_name: agent.agent_name || agent.name || '',
      phone: agent.phone || '',
      commission: agent.commission ?? 0,
      address: agent.address || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const payload = {
      agent_name: form.agent_name,
      phone: form.phone || undefined,
      commission: parseFloat(form.commission || 0),
      address: form.address || undefined,
    };

    if (selectedAgent) {
      updateAgentMutation.mutate({ id: selectedAgent.id, data: payload });
    } else {
      createAgentMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-6 pb-24 sm:pb-32 lg:pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Sales Agents Management</h1>
          <p className="text-xs text-slate-500">Manage sales representatives, contact numbers, and commission percentages.</p>
        </div>
        <Button icon={Plus} onClick={() => { resetForm(); setIsModalOpen(true); }}>
          Add Sales Agent
        </Button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
        <Input
          icon={Search}
          placeholder="Search sales agents by name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Table
        headers={['Agent Name', 'Phone', 'Commission Rate (%)', 'Address', 'Actions']}
        isLoading={isLoading}
        isEmpty={!agents.length}
      >
        {agents.map((agent) => (
          <tr key={agent.id} className="hover:bg-slate-50/60 transition">
            <td className="px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="font-semibold text-slate-800">{agent.agent_name || agent.name}</div>
              </div>
            </td>
            <td className="px-4 py-3.5 text-xs font-medium text-slate-600">
              {agent.phone || 'N/A'}
            </td>
            <td className="px-4 py-3.5">
              <Badge variant="indigo">{agent.commission ?? 0}%</Badge>
            </td>
            <td className="px-4 py-3.5 text-xs text-slate-500 truncate max-w-xs">
              {agent.address || 'N/A'}
            </td>
            <td className="px-4 py-3.5">
              <div className="flex items-center gap-1.5">
                <button
                  title="Edit Agent"
                  onClick={() => handleEdit(agent)}
                  className="p-1.5 rounded-lg text-amber-600 bg-amber-50 hover:bg-amber-100 transition"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {isAdmin && (
                  <button
                    title="Delete Agent"
                    onClick={() => setAgentToDelete(agent)}
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
        title={selectedAgent ? 'Edit Sales Agent' : 'Add Sales Agent'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-3 rounded-xl font-medium">
              {error}
            </div>
          )}

          <Input
            label="Agent Name"
            placeholder="e.g. Ramesh Kumar"
            value={form.agent_name}
            onChange={(e) => setForm({ ...form, agent_name: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Phone Number"
              placeholder="9876543210"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Input
              label="Commission (%)"
              type="number"
              step="0.1"
              placeholder="2.5"
              value={form.commission}
              onChange={(e) => setForm({ ...form, commission: e.target.value })}
            />
          </div>

          <Input
            label="Address"
            placeholder="Agent office or location..."
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createAgentMutation.isPending || updateAgentMutation.isPending}>
              {selectedAgent ? 'Save Changes' : 'Create Agent'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={Boolean(agentToDelete)}
        onClose={() => setAgentToDelete(null)}
        onConfirm={() => {
          if (agentToDelete) {
            deleteAgentMutation.mutate(agentToDelete.id, {
              onSuccess: () => setAgentToDelete(null),
            });
          }
        }}
        title="Delete Sales Agent"
        message={`Are you sure you want to delete ${
          agentToDelete?.agent_name || agentToDelete?.name || 'this agent'
        }? Their record will be removed.`}
        confirmText="Delete Agent"
        isLoading={deleteAgentMutation.isPending}
      />
    </div>
  );
}
