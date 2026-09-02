'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Trash2, Edit2, AlertCircle } from 'lucide-react';
import { productApi, productSizeApi } from '../services/api';
import { Button, Input, Table, Modal, Badge, Select, ConfirmModal } from '../components/common/UIComponents';
import { formatCurrency } from '../utils/formatters';
import useAuthStore from '../store/useAuthStore';

export function ProductsComponent() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const [searchTerm, setSearchTerm] = useState('');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSizeModalOpen, setIsSizeModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);

  const [productForm, setProductForm] = useState({
    item_name: '',
    style: '',
    category: '',
    hsn_code: '',
    gst_percentage: 5,
    unit: 'PCS',
    description: '',
  });

  const [sizeForm, setSizeForm] = useState({
    productId: '',
    size: 'M',
    stock: 10,
    minStock: 5,
  });

  const { data: productsResponse, isLoading } = useQuery({
    queryKey: ['products', searchTerm],
    queryFn: () => productApi.getAll({ search: searchTerm }),
  });

  const products = productsResponse?.data?.products || productsResponse?.data || [];

  const createProductMutation = useMutation({
    mutationFn: (data) => productApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      setIsProductModalOpen(false);
      resetProductForm();
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }) => productApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      setIsProductModalOpen(false);
      resetProductForm();
    },
  });

  const [sizeError, setSizeError] = useState('');

  const createSizeMutation = useMutation({
    mutationFn: (data) => productSizeApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      setIsSizeModalOpen(false);
      setSizeError('');
    },
    onError: (err) => {
      setSizeError(err.message || 'Failed to add size variant');
    },
  });

  const [deleteError, setDeleteError] = useState('');

  const deleteProductMutation = useMutation({
    mutationFn: productApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      setProductToDelete(null);
      setDeleteError('');
    },
    onError: (err) => {
      setDeleteError(err.response?.data?.message || err.message || 'Failed to delete product');
    },
  });

  const resetProductForm = () => {
    setSelectedProduct(null);
    setProductForm({
      item_name: '',
      style: '',
      category: '',
      hsn_code: '',
      gst_percentage: 5,
      unit: 'PCS',
      description: '',
    });
  };

  const handleEditProduct = (prod) => {
    setSelectedProduct(prod);
    setProductForm({
      item_name: prod.item_name || prod.name || '',
      style: prod.style || '',
      category: prod.category || '',
      hsn_code: prod.hsn_code || prod.hsnCode || '',
      gst_percentage: prod.gst_percentage ?? 5,
      unit: prod.unit || 'PCS',
      description: prod.description || '',
    });
    setIsProductModalOpen(true);
  };

  const handleProductSubmit = (e) => {
    e.preventDefault();
    const payload = {
      item_name: productForm.item_name,
      style: productForm.style || undefined,
      category: productForm.category || undefined,
      hsn_code: productForm.hsn_code || undefined,
      gst_percentage: parseFloat(productForm.gst_percentage) || 5,
      unit: productForm.unit || 'PCS',
      description: productForm.description || undefined,
    };

    if (selectedProduct) {
      updateProductMutation.mutate({ id: selectedProduct.id, data: payload });
    } else {
      createProductMutation.mutate(payload);
    }
  };

  const handleSizeSubmit = (e) => {
    e.preventDefault();
    setSizeError('');
    if (!sizeForm.productId) {
      setSizeError('Please select a product.');
      return;
    }
    createSizeMutation.mutate({
      product_id: sizeForm.productId,
      size: sizeForm.size,
      current_stock: parseInt(sizeForm.stock) || 0,
      minimum_stock: parseInt(sizeForm.minStock) || 5,
    });
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Product & Size Management</h1>
          <p className="text-[11px] sm:text-xs text-slate-500">Catalog items, HSN codes, GST rates, and size variants.</p>
        </div>
        <div className="flex flex-col xs:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5">
          <Button
            variant="outline"
            icon={Plus}
            onClick={() => {
              setSizeError('');
              const firstId = products.length > 0 ? products[0].id : '';
              setSizeForm({
                productId: firstId,
                size: 'M',
                stock: 10,
                minStock: 5,
              });
              setIsSizeModalOpen(true);
            }}
            className="w-full xs:w-auto justify-center"
          >
            Add Size Variant
          </Button>
          <Button icon={Plus} onClick={() => { resetProductForm(); setIsProductModalOpen(true); }} className="w-full xs:w-auto justify-center">
            Add Product
          </Button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-100 shadow-2xs">
        <Input
          icon={Search}
          placeholder="Search products by item name or HSN code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Desktop Table View (>= 768px) */}
      <div className="hidden md:block overflow-x-auto">
        <Table
          headers={['Item Name', 'Style', 'Category', 'HSN Code', 'GST (%)', 'Unit', 'Sizes & Stock', 'Actions']}
          isLoading={isLoading}
          isEmpty={!products.length}
        >
          {products.map((prod) => {
            const sizes = prod.product_sizes || prod.sizes || [];

            return (
              <tr key={prod.id} className="hover:bg-slate-50/60 transition">
                <td className="px-4 py-3.5">
                  <div className="font-semibold text-slate-800">{prod.item_name || prod.name}</div>
                  <div className="text-xs text-slate-400 truncate max-w-xs">{prod.description || 'No description'}</div>
                </td>
                <td className="px-4 py-3.5 text-xs font-medium text-slate-700">
                  {prod.style || '-'}
                </td>
                <td className="px-4 py-3.5">
                  <Badge variant="slate">{prod.category || 'General'}</Badge>
                </td>
                <td className="px-4 py-3.5">
                  <Badge variant="indigo">{prod.hsn_code || prod.hsnCode || 'N/A'}</Badge>
                </td>
                <td className="px-4 py-3.5 font-bold text-slate-800">
                  {prod.gst_percentage ?? 5}%
                </td>
                <td className="px-4 py-3.5 text-xs font-semibold text-slate-600">
                  {prod.unit || 'PCS'}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {sizes.length > 0 ? (
                      sizes.map((sz) => {
                        const stockVal = sz.current_stock ?? sz.stock ?? 0;
                        const minVal = sz.minimum_stock ?? sz.minStock ?? 5;
                        const isLow = stockVal <= minVal;
                        return (
                          <div
                            key={sz.id}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border shadow-2xs transition-all duration-200 hover:scale-105 ${
                              isLow
                                ? 'bg-gradient-to-r from-rose-50 to-red-50/80 text-rose-800 border-rose-200/90 shadow-rose-100/50'
                                : 'bg-gradient-to-r from-slate-50 to-indigo-50/60 text-slate-800 border-slate-200/90 hover:border-indigo-300 hover:bg-indigo-50/50'
                            }`}
                            title={`Size ${sz.size}: ${stockVal} in stock ${isLow ? '(Low Stock Warning)' : ''}`}
                          >
                            <span
                              className={`px-1.5 py-0.5 rounded-md text-[10px] uppercase font-extrabold tracking-wider border shadow-2xs ${
                                isLow
                                  ? 'bg-rose-100/90 text-rose-700 border-rose-300/80'
                                  : 'bg-white text-indigo-600 border-indigo-100'
                              }`}
                            >
                              {sz.size}
                            </span>
                            <span className={`font-mono text-xs font-extrabold ${isLow ? 'text-rose-700' : 'text-slate-900'}`}>
                              {stockVal}
                            </span>
                            {isLow && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />}
                          </div>
                        );
                      })
                    ) : (
                      <span className="text-xs text-slate-400 italic">No variants</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      title="Add Size Variant"
                      onClick={() => {
                        setSizeError('');
                        setSizeForm({
                          productId: prod.id,
                          size: 'M',
                          stock: 10,
                          minStock: 5,
                        });
                        setIsSizeModalOpen(true);
                      }}
                      className="p-2 rounded-xl text-indigo-600 bg-indigo-50/70 border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all duration-150 hover:scale-105 active:scale-95 shadow-2xs"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      title="Edit Product"
                      onClick={() => handleEditProduct(prod)}
                      className="p-2 rounded-xl text-amber-600 bg-amber-50/70 border border-amber-100 hover:bg-amber-500 hover:text-white transition-all duration-150 hover:scale-105 active:scale-95 shadow-2xs"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {isAdmin && (
                      <button
                        title="Delete Product"
                        onClick={() => setProductToDelete(prod)}
                        className="p-2 rounded-xl text-rose-600 bg-rose-50/70 border border-rose-100 hover:bg-rose-600 hover:text-white transition-all duration-150 hover:scale-105 active:scale-95 shadow-2xs"
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

      {/* Mobile Card List (< 768px for 360px & 760px screens) */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading products catalog...</div>
        ) : !products.length ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-100">
            No products found matching your search.
          </div>
        ) : (
          products.map((prod) => {
            const sizes = prod.product_sizes || prod.sizes || [];

            return (
              <div key={prod.id} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm">{prod.item_name || prod.name}</h3>
                    {prod.style && <p className="text-xs text-slate-500 font-semibold mt-0.5">Style: {prod.style}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant="indigo">HSN: {prod.hsn_code || prod.hsnCode || 'N/A'}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Category</span>
                    <span className="text-slate-700 font-semibold">{prod.category || 'General'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">GST Rate</span>
                    <span className="text-indigo-900 font-black">{prod.gst_percentage ?? 5}% ({prod.unit || 'PCS'})</span>
                  </div>
                </div>

                {/* Size Variants Pills */}
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1.5">Size Variants & Stock</span>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {sizes.length > 0 ? (
                      sizes.map((sz) => {
                        const stockVal = sz.current_stock ?? sz.stock ?? 0;
                        const minVal = sz.minimum_stock ?? sz.minStock ?? 5;
                        const isLow = stockVal <= minVal;
                        return (
                          <div
                            key={sz.id}
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xl text-xs font-bold border shadow-2xs ${
                              isLow
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : 'bg-slate-50 text-slate-800 border-slate-200'
                            }`}
                          >
                            <span className="px-1.5 py-0.2 rounded text-[10px] uppercase font-extrabold bg-white text-indigo-600 border border-indigo-100">
                              {sz.size}
                            </span>
                            <span className="font-mono text-xs font-extrabold">{stockVal}</span>
                          </div>
                        );
                      })
                    ) : (
                      <span className="text-xs text-slate-400 italic">No variants</span>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setSizeError('');
                      setSizeForm({
                        productId: prod.id,
                        size: 'M',
                        stock: 10,
                        minStock: 5,
                      });
                      setIsSizeModalOpen(true);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-600 hover:text-white transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Size
                  </button>
                  <button
                    onClick={() => handleEditProduct(prod)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 hover:bg-amber-500 hover:text-white transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => setProductToDelete(prod)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-600 hover:text-white transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={selectedProduct ? 'Edit Product' : 'Add Product'}
      >
        <form onSubmit={handleProductSubmit} className="space-y-4">
          <Input
            label="Item Name"
            placeholder="e.g. Cotton Shirt"
            value={productForm.item_name}
            onChange={(e) => setProductForm({ ...productForm, item_name: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Style"
              placeholder="e.g. Piping / Regular"
              value={productForm.style}
              onChange={(e) => setProductForm({ ...productForm, style: e.target.value })}
            />
            <Input
              label="Category"
              placeholder="e.g. Apparel"
              value={productForm.category}
              onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="HSN Code"
              placeholder="e.g. 6205"
              value={productForm.hsn_code}
              onChange={(e) => setProductForm({ ...productForm, hsn_code: e.target.value })}
            />
            <Input
              label="GST Percentage (%)"
              type="number"
              step="0.1"
              placeholder="5"
              value={productForm.gst_percentage}
              onChange={(e) => setProductForm({ ...productForm, gst_percentage: e.target.value })}
            />
          </div>
          <Input
            label="Unit (e.g. PCS, KG, MTR)"
            placeholder="PCS"
            value={productForm.unit}
            onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
          />
          <Input
            label="Description"
            placeholder="Optional product details..."
            value={productForm.description}
            onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsProductModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createProductMutation.isPending || updateProductMutation.isPending}>
              {selectedProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Size Variant Modal */}
      <Modal isOpen={isSizeModalOpen} onClose={() => setIsSizeModalOpen(false)} title="Add Size Variant">
        <form onSubmit={handleSizeSubmit} className="space-y-4">
          {sizeError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-3 rounded-xl font-medium">
              {sizeError}
            </div>
          )}
          <Select
            label="Select Product"
            value={sizeForm.productId}
            onChange={(e) => setSizeForm({ ...sizeForm, productId: e.target.value })}
            placeholder="Select a product..."
            options={[
              { value: '', label: 'Select a product...' },
              ...products.map((p) => ({
                value: p.id,
                label: p.item_name || p.name,
              })),
            ]}
          />

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Size (e.g. S, M, L, 32)"
              value={sizeForm.size}
              onChange={(e) => setSizeForm({ ...sizeForm, size: e.target.value })}
              required
            />
            <Input
              label="Initial Stock Qty"
              type="number"
              value={sizeForm.stock}
              onChange={(e) => setSizeForm({ ...sizeForm, stock: e.target.value })}
              required
            />
            <Input
              label="Min Alert Level"
              type="number"
              value={sizeForm.minStock}
              onChange={(e) => setSizeForm({ ...sizeForm, minStock: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsSizeModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createSizeMutation.isPending}>
              Save Variant
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={Boolean(productToDelete)}
        onClose={() => {
          setProductToDelete(null);
          setDeleteError('');
        }}
        onConfirm={() => {
          if (productToDelete) {
            setDeleteError('');
            deleteProductMutation.mutate(productToDelete.id);
          }
        }}
        title="Delete Product Catalog Item"
        message={
          <div>
            <p>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-slate-900 dark:text-white">
                {productToDelete?.item_name || productToDelete?.name || 'this product'}
              </span>
              ? All associated size variants and inventory history will be removed.
            </p>
            {deleteError && (
              <div className="mt-3 p-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400 rounded-md border border-red-200 dark:border-red-800">
                {deleteError}
              </div>
            )}
          </div>
        }
        confirmText="Delete Product"
        isLoading={deleteProductMutation.isPending}
      />
    </div>
  );
}
