'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAuthStore from '../store/useAuthStore';
import { authApi, userApi } from '../services/api';
import { Button, Input, Select, Card, Badge, Skeleton } from '../components/common/UIComponents';
import { Save, User, Mail, Phone, Shield, Building2, CreditCard, Image as ImageIcon, MapPin, Upload, X, KeyRound, Trash2, Edit3, AlertTriangle, Lock } from 'lucide-react';

export function SettingsComponent() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { user: authUser, updateUser: updateAuthUser, logout, setAuth } = useAuthStore();
  const logoInputRef = useRef(null);
  const sigInputRef = useRef(null);

  const [formData, setFormData] = useState({
    // User Profile
    name: '',
    email: '',
    phone: '',
    role: 'USER',

    // Company & Invoice Branding
    company_name: '',
    company_type: '',
    gst_number: '',
    pan_number: '',
    address: '',
    city: '',
    state: '',
    state_code: '',
    pincode: '',
    country: 'India',
    invoice_prefix: 'INV',

    // Logo & Signatures
    logo_url: '',
    signature_url: '',

    // Bank Account Details (Primary)
    account_holder_name: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    branch_name: '',
    upi_id: '',

    // Bank Account Details (Secondary)
    account2_holder_name: '',
    bank2_name: '',
    account2_number: '',
    ifsc2_code: '',
    branch2_name: '',
    upi2_id: '',
  });

  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [isDraggingSig, setIsDraggingSig] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Account management modals
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({ newEmail: '', currentPassword: '' });
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteData, setDeleteData] = useState({ currentPassword: '', confirmText: '' });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleChangeEmailSubmit = async (e) => {
    e.preventDefault();
    setEmailError('');
    if (!emailData.newEmail || !emailData.currentPassword) {
      setEmailError('Please fill in all fields.');
      return;
    }
    try {
      setEmailLoading(true);
      const res = await authApi.changeEmail({
        newEmail: emailData.newEmail,
        currentPassword: emailData.currentPassword,
      });
      const { user: updatedUser, token, message: msg } = res.data;
      if (token && setAuth) {
        setAuth(updatedUser, token);
      } else {
        updateAuthUser({ email: updatedUser.email });
      }
      queryClient.invalidateQueries(['user-profile']);
      setShowEmailModal(false);
      setEmailData({ newEmail: '', currentPassword: '' });
      setMessage(msg || 'Email updated successfully!');
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setEmailError(err.response?.data?.message || err.message || 'Failed to update email.');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('Please fill in all fields.');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    try {
      setPasswordLoading(true);
      const res = await authApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage(res.data?.message || 'Password changed successfully!');
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setPasswordError(err.response?.data?.message || err.message || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccountSubmit = async (e) => {
    e.preventDefault();
    setDeleteError('');
    if (!deleteData.currentPassword) {
      setDeleteError('Please enter your current password.');
      return;
    }
    if (deleteData.confirmText.trim().toUpperCase() !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm account deletion.');
      return;
    }
    try {
      setDeleteLoading(true);
      await authApi.deleteAccount({
        currentPassword: deleteData.currentPassword,
      });
      setShowDeleteModal(false);
      logout();
      router.push('/login');
    } catch (err) {
      setDeleteError(err.response?.data?.message || err.message || 'Failed to delete account.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Fetch user profile & company details directly from backend database
  const { data: profileRes, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: authApi.getProfile,
  });

  const userProfile = profileRes?.data || authUser;

  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.full_name || userProfile.name || '',
        email: userProfile.email || '',
        phone: userProfile.contact_number || userProfile.phone || '',
        role: userProfile.role || 'USER',

        company_name: userProfile.company_name || '',
        company_type: userProfile.company_type || '',
        gst_number: userProfile.gst_number || '',
        pan_number: userProfile.pan_number || '',
        address: userProfile.address || '',
        city: userProfile.city || '',
        state: userProfile.state || '',
        state_code: userProfile.state_code || '',
        pincode: userProfile.pincode || '',
        country: userProfile.country || 'India',
        invoice_prefix: userProfile.invoice_prefix || 'INV',

        logo_url: userProfile.logo_url || '',
        signature_url: userProfile.signature_url || '',

        account_holder_name: userProfile.account_holder_name || '',
        bank_name: userProfile.bank_name || '',
        account_number: userProfile.account_number || '',
        ifsc_code: userProfile.ifsc_code || '',
        branch_name: userProfile.branch_name || '',
        upi_id: userProfile.upi_id || '',

        account2_holder_name: userProfile.account2_holder_name || '',
        bank2_name: userProfile.bank2_name || '',
        account2_number: userProfile.account2_number || '',
        ifsc2_code: userProfile.ifsc2_code || '',
        branch2_name: userProfile.branch2_name || '',
        upi2_id: userProfile.upi2_id || '',
      });
    }
  }, [userProfile]);

  const updateProfileMutation = useMutation({
    mutationFn: (data) => userApi.update(userProfile.id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['user-profile']);
      const updatedData = res?.data || res;
      const newToken = res?.token || updatedData?.token;
      const newRole = updatedData?.role || formData.role;

      const updatedUserObj = {
        ...authUser,
        ...updatedData,
        name: updatedData?.full_name || updatedData?.name || authUser?.name,
        phone: updatedData?.contact_number || updatedData?.phone || authUser?.phone,
        role: newRole,
      };

      if (newToken) {
        setAuth(updatedUserObj, newToken);
      } else {
        updateAuthUser(updatedUserObj);
      }

      setFormData((prev) => ({ ...prev, role: newRole }));
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 4000);
    },
    onError: (err) => {
      setError(err.message || 'Failed to save settings.');
      setTimeout(() => setError(''), 4000);
    },
  });

  // Handle Drag and Drop Image File Converter (Base64 PNG)
  const processImageFile = (file, targetField) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUrl = e.target.result;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width || 300;
        canvas.height = img.height || 150;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const pngUrl = canvas.toDataURL('image/png');
        setFormData((prev) => ({ ...prev, [targetField]: pngUrl }));
      };
      img.onerror = () => {
        setFormData((prev) => ({ ...prev, [targetField]: rawDataUrl }));
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e, targetField) => {
    e.preventDefault();
    if (targetField === 'logo_url') setIsDraggingLogo(false);
    if (targetField === 'signature_url') setIsDraggingSig(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0], targetField);
    }
  };

  const handleDragOver = (e, targetField) => {
    e.preventDefault();
    if (targetField === 'logo_url') setIsDraggingLogo(true);
    if (targetField === 'signature_url') setIsDraggingSig(true);
  };

  const handleDragLeave = (e, targetField) => {
    e.preventDefault();
    if (targetField === 'logo_url') setIsDraggingLogo(false);
    if (targetField === 'signature_url') setIsDraggingSig(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    updateProfileMutation.mutate({
      name: formData.name,
      phone: formData.phone,
      role: formData.role,
      company_name: formData.company_name,
      company_type: formData.company_type,
      gst_number: formData.gst_number,
      pan_number: formData.pan_number,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      state_code: formData.state_code,
      pincode: formData.pincode,
      country: formData.country,
      invoice_prefix: formData.invoice_prefix,
      logo_url: formData.logo_url,
      signature_url: formData.signature_url,
      account_holder_name: formData.account_holder_name,
      bank_name: formData.bank_name,
      account_number: formData.account_number,
      ifsc_code: formData.ifsc_code,
      branch_name: formData.branch_name,
      upi_id: formData.upi_id,
      account2_holder_name: formData.account2_holder_name,
      bank2_name: formData.bank2_name,
      account2_number: formData.account2_number,
      ifsc2_code: formData.ifsc2_code,
      branch2_name: formData.branch2_name,
      upi2_id: formData.upi2_id,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl pb-16 sm:pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">System & Business Settings</h1>
          <p className="text-xs text-slate-500">Configure company branding, logo, bank account details, and address for tax invoices.</p>
        </div>
        <Button type="button" onClick={handleSubmit} icon={Save} isLoading={updateProfileMutation.isPending} className="px-5 py-2.5 shadow-md">
          Save Changes
        </Button>
      </div>

      {message && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs p-3.5 px-4 rounded-2xl font-extrabold shadow-md flex items-center gap-2">
          <span>✓</span> {message}
        </div>
      )}

      {error && (
        <div className="bg-gradient-to-r from-rose-600 to-red-600 text-white text-xs p-3.5 px-4 rounded-2xl font-extrabold shadow-md flex items-center gap-2">
          <span>⚠</span> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* User Account Profile */}
        <Card title="User Account Credentials">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-md shadow-indigo-100">
                  {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <p className="text-base font-bold text-slate-800">{formData.name || 'User'}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPasswordError('');
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setShowPasswordModal(true);
                }}
                className="text-xs font-semibold py-1.5 px-3 border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <KeyRound className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                Change Password
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name *"
                icon={User}
                placeholder="e.g. Srinivas Rao"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Email Address (Verified)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailError('');
                      setEmailData({ newEmail: '', currentPassword: '' });
                      setShowEmailModal(true);
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" /> Change Email
                  </button>
                </div>
                <Input
                  type="email"
                  icon={Mail}
                  value={formData.email}
                  disabled
                  className="bg-slate-50 cursor-not-allowed opacity-75"
                />
              </div>
            </div>
            <div>
              <Input
                label="Contact Phone Number"
                icon={Phone}
                placeholder="+91 9876543210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>
        </Card>

        {/* Company & Invoice Branding */}
        <Card title="Company & Invoice Branding">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Company Name"
                icon={Building2}
                placeholder="e.g. Vexatech Enterprises"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              />
              <Input
                label="Company Type"
                placeholder="e.g. Private Limited / Proprietorship"
                value={formData.company_type}
                onChange={(e) => setFormData({ ...formData, company_type: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Company GSTIN"
                placeholder="29AAACV1234F1Z9"
                value={formData.gst_number}
                onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
              />
              <Input
                label="PAN Number"
                placeholder="AAACV1234F"
                value={formData.pan_number}
                onChange={(e) => setFormData({ ...formData, pan_number: e.target.value })}
              />
              <Input
                label="Invoice Number Prefix"
                placeholder="INV"
                value={formData.invoice_prefix}
                onChange={(e) => setFormData({ ...formData, invoice_prefix: e.target.value })}
              />
            </div>

            <Input
              label="Registered Business Address"
              icon={MapPin}
              placeholder="Door #, Industrial Layout, Street Name"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
                placeholder="33"
                value={formData.state_code}
                onChange={(e) => setFormData({ ...formData, state_code: e.target.value })}
              />
              <Input
                label="Pincode"
                placeholder="560001"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
              />
              <Input
                label="Country"
                placeholder="India"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </div>
          </div>
        </Card>

        {/* Drag & Drop Logo & Digital Signatures */}
        <Card title="Logo & Digital Signatures (Drag & Drop)">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company Logo Drag Drop */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Company Logo Image
              </label>
              <div
                onDragOver={(e) => handleDragOver(e, 'logo_url')}
                onDragLeave={(e) => handleDragLeave(e, 'logo_url')}
                onDrop={(e) => handleDrop(e, 'logo_url')}
                onClick={() => logoInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[140px] relative ${
                  isDraggingLogo
                    ? 'border-indigo-500 bg-indigo-50/50'
                    : 'border-slate-200 hover:border-indigo-400 bg-slate-50/50'
                }`}
              >
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) processImageFile(e.target.files[0], 'logo_url');
                  }}
                />

                {formData.logo_url ? (
                  <div className="relative group w-full flex items-center justify-center">
                    <img
                      src={formData.logo_url}
                      alt="Company Logo"
                      className="max-h-24 max-w-full object-contain rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData({ ...formData, logo_url: '' });
                      }}
                      className="absolute -top-2 -right-2 p-1 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition shadow-sm"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-7 h-7 text-indigo-500 mb-2" />
                    <p className="text-xs font-semibold text-slate-700">Drag & Drop Logo Image here</p>
                    <p className="text-[10px] text-slate-400 mt-1">or click to browse from device (PNG, SVG, JPG)</p>
                  </>
                )}
              </div>
              <Input
                className="mt-2 text-xs"
                placeholder="Or paste image URL (https://...)"
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              />
            </div>

            {/* Digital Signature Drag Drop */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Digital Signature Image
              </label>
              <div
                onDragOver={(e) => handleDragOver(e, 'signature_url')}
                onDragLeave={(e) => handleDragLeave(e, 'signature_url')}
                onDrop={(e) => handleDrop(e, 'signature_url')}
                onClick={() => sigInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[140px] relative ${
                  isDraggingSig
                    ? 'border-indigo-500 bg-indigo-50/50'
                    : 'border-slate-200 hover:border-indigo-400 bg-slate-50/50'
                }`}
              >
                <input
                  ref={sigInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) processImageFile(e.target.files[0], 'signature_url');
                  }}
                />

                {formData.signature_url ? (
                  <div className="relative group w-full flex items-center justify-center">
                    <img
                      src={formData.signature_url}
                      alt="Digital Signature"
                      className="max-h-24 max-w-full object-contain rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData({ ...formData, signature_url: '' });
                      }}
                      className="absolute -top-2 -right-2 p-1 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition shadow-sm"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-7 h-7 text-indigo-500 mb-2" />
                    <p className="text-xs font-semibold text-slate-700">Drag & Drop Signature Image here</p>
                    <p className="text-[10px] text-slate-400 mt-1">or click to browse from device (PNG, SVG, JPG)</p>
                  </>
                )}
              </div>
              <Input
                className="mt-2 text-xs"
                placeholder="Or paste signature URL (https://...)"
                value={formData.signature_url}
                onChange={(e) => setFormData({ ...formData, signature_url: e.target.value })}
              />
            </div>
          </div>
        </Card>

        {/* Primary Bank Account Details */}
        <Card title="Primary Bank Account Details (Printed on Invoices)">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Account Holder Name"
                icon={CreditCard}
                placeholder="e.g. Vexatech Enterprises"
                value={formData.account_holder_name}
                onChange={(e) => setFormData({ ...formData, account_holder_name: e.target.value })}
              />
              <Input
                label="Bank Name"
                placeholder="e.g. HDFC Bank / ICICI Bank"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Account Number"
                placeholder="50200012345678"
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
              />
              <Input
                label="IFSC Code"
                placeholder="HDFC0001234"
                value={formData.ifsc_code}
                onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value })}
              />
              <Input
                label="Branch Name"
                placeholder="Indiranagar Branch"
                value={formData.branch_name}
                onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
              />
            </div>

            <Input
              label="UPI ID / GPay VPA"
              placeholder="vexatech@hdfcbank"
              value={formData.upi_id}
              onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
            />
          </div>
        </Card>

        {/* Secondary Bank Account Details */}
        <Card title="Secondary Bank Account Details (Optional)">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Account Holder Name (Bank 2)"
                icon={CreditCard}
                placeholder="e.g. Vexatech Secondary"
                value={formData.account2_holder_name}
                onChange={(e) => setFormData({ ...formData, account2_holder_name: e.target.value })}
              />
              <Input
                label="Bank Name (Bank 2)"
                placeholder="e.g. State Bank of India"
                value={formData.bank2_name}
                onChange={(e) => setFormData({ ...formData, bank2_name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Account Number"
                placeholder="30100098765432"
                value={formData.account2_number}
                onChange={(e) => setFormData({ ...formData, account2_number: e.target.value })}
              />
              <Input
                label="IFSC Code"
                placeholder="SBIN0001234"
                value={formData.ifsc2_code}
                onChange={(e) => setFormData({ ...formData, ifsc2_code: e.target.value })}
              />
              <Input
                label="Branch Name"
                placeholder="Koramangala Branch"
                value={formData.branch2_name}
                onChange={(e) => setFormData({ ...formData, branch2_name: e.target.value })}
              />
            </div>

            <Input
              label="UPI ID / GPay VPA (Bank 2)"
              placeholder="vexatech2@sbi"
              value={formData.upi2_id}
              onChange={(e) => setFormData({ ...formData, upi2_id: e.target.value })}
            />
          </div>
        </Card>

        {/* Danger Zone */}
        <Card title="Danger Zone & Account Management" className="border-rose-200 bg-rose-50/20 mb-6 sm:mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-2">
            <div>
              <h3 className="text-sm font-bold text-rose-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" /> Permanently Delete Account
              </h3>
              <p className="text-xs text-rose-700 mt-1 max-w-xl leading-relaxed">
                Once you delete your account, your profile and associated session credentials will be permanently removed. This action cannot be undone.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => {
                setDeleteError('');
                setDeleteData({ currentPassword: '', confirmText: '' });
                setShowDeleteModal(true);
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 shadow-sm whitespace-nowrap self-start sm:self-auto justify-center"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Delete Account
            </Button>
          </div>
        </Card>
      </form>

      {/* Change Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Mail className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Change Email Address</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {emailError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{emailError}</span>
              </div>
            )}

            <form onSubmit={handleChangeEmailSubmit} className="space-y-4">
              <Input
                label="Current Email"
                type="email"
                value={formData.email}
                disabled
                className="bg-slate-50 text-slate-500 cursor-not-allowed"
              />
              <Input
                label="New Email Address *"
                type="email"
                icon={Mail}
                placeholder="e.g. newemail@vexatech.in"
                value={emailData.newEmail}
                onChange={(e) => setEmailData({ ...emailData, newEmail: e.target.value })}
                required
              />
              <Input
                label="Current Password *"
                type="password"
                icon={Lock}
                placeholder="Enter current password to verify"
                value={emailData.currentPassword}
                onChange={(e) => setEmailData({ ...emailData, currentPassword: e.target.value })}
                required
              />

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEmailModal(false)}
                  className="text-xs px-4 py-2"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={emailLoading}
                  className="text-xs px-4 py-2 font-bold shadow-md"
                >
                  Update Email
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Change Password</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {passwordError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <Input
                label="Current Password *"
                type="password"
                icon={Lock}
                placeholder="Enter current password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                required
              />
              <Input
                label="New Password *"
                type="password"
                icon={KeyRound}
                placeholder="At least 6 characters"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                required
              />
              <Input
                label="Confirm New Password *"
                type="password"
                icon={KeyRound}
                placeholder="Re-enter new password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                required
              />

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    router.push('/forgot-password');
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold hover:underline"
                >
                  Forgot Password?
                </button>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPasswordModal(false)}
                    className="text-xs px-4 py-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    isLoading={passwordLoading}
                    className="text-xs px-4 py-2 font-bold shadow-md"
                  >
                    Save Password
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 relative border-2 border-rose-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <div className="p-2 rounded-xl bg-rose-50">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Delete Account</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-rose-800 text-xs leading-relaxed">
              <p className="font-bold flex items-center gap-1.5 mb-1 text-rose-900">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" /> Permanent Action Warning
              </p>
              Deleting your account will purge your account credentials and immediately terminate your session.
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{deleteError}</span>
              </div>
            )}

            <form onSubmit={handleDeleteAccountSubmit} className="space-y-4">
              <Input
                label="Current Password *"
                type="password"
                icon={Lock}
                placeholder="Enter current password"
                value={deleteData.currentPassword}
                onChange={(e) => setDeleteData({ ...deleteData, currentPassword: e.target.value })}
                required
              />
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Type <span className="font-extrabold text-rose-600">DELETE</span> to confirm *
                </label>
                <Input
                  type="text"
                  placeholder="DELETE"
                  value={deleteData.confirmText}
                  onChange={(e) => setDeleteData({ ...deleteData, confirmText: e.target.value })}
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                  className="text-xs px-4 py-2"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={deleteLoading}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs px-4 py-2 font-bold shadow-md"
                >
                  Permanently Delete
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
