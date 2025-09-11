import React, { useEffect, useState } from 'react';
import { apiUrl } from '../../config/api';
import { useToast } from '../../contexts/ToastContext';
import { Trash2, Edit, Plus, Tag, TrendingUp, Users, Clock } from 'lucide-react';
import { PromoCodeService } from '../../services/promoCodeService';

// Use Supabase database types for PromoCode
type PromoCode = {
  id: number;
  code: string;
  name: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  minimum_amount?: number | null;
  max_usage_total: number;
  max_usage_per_customer: number;
  current_usage_total: number;
  valid_from?: string | null;
  valid_until?: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

interface PromoCodeFormData {
  code: string;
  name: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumAmount: number;
  maxUsageTotal: number;
  maxUsagePerCustomer: number;
  validFrom: string;
  validUntil: string;
  active: boolean;
}

const emptyPromoCode: PromoCodeFormData = {
  code: '',
  name: '',
  discountType: 'percentage',
  discountValue: 0,
  minimumAmount: 0,
  maxUsageTotal: 100,
  maxUsagePerCustomer: 1,
  validFrom: '',
  validUntil: '',
  active: true,
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/20 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-amber-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              ×
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

const PromoCodeManagement: React.FC = () => {
  console.log('PromoCodeManagement component rendering');
  const { showToast } = useToast();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [promoForm, setPromoForm] = useState<PromoCodeFormData>(emptyPromoCode);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchPromoCodes = async () => {
    try {
      console.log('Fetching promo codes from Supabase...');
      
      const data = await PromoCodeService.getAll();
      console.log('✅ Received promo codes from Supabase:', data);
      setPromoCodes(data);
    } catch (error) {
      console.error('❌ Error fetching promo codes:', error);
      showToast('Failed to load promo codes', 'error');
      setPromoCodes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('PromoCodeManagement useEffect running, calling fetchPromoCodes');
    fetchPromoCodes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('auth_token');
      const url = editingId 
        ? apiUrl(`/pricing/promo-codes/${editingId}`)
        : apiUrl('/pricing/promo-codes');
      
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...promoForm,
          validFrom: promoForm.validFrom || null,
          validUntil: promoForm.validUntil || null,
        }),
      });

      if (response.ok) {
        showToast(
          `Promo code ${editingId ? 'updated' : 'created'} successfully!`,
          'success'
        );
        setShowModal(false);
        setPromoForm(emptyPromoCode);
        setEditingId(null);
        fetchPromoCodes();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save promo code');
      }
    } catch (error: any) {
      console.error('Error saving promo code:', error);
      showToast(error.message || 'Failed to save promo code', 'error');
    }
  };

  const formatDateForInput = (dateValue: Date | string | null | undefined): string => {
    try {
      if (!dateValue) return '';
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const handleEdit = (promoCode: PromoCode) => {
    setPromoForm({
      code: promoCode.code,
      name: promoCode.name,
      discountType: promoCode.discountType,
      discountValue: Number(promoCode.discountValue) || 0,
      minimumAmount: Number(promoCode.minimumAmount) || 0,
      maxUsageTotal: promoCode.maxUsageTotal,
      maxUsagePerCustomer: promoCode.maxUsagePerCustomer,
      validFrom: formatDateForInput(promoCode.validFrom),
      validUntil: formatDateForInput(promoCode.validUntil),
      active: promoCode.active,
    });
    setEditingId(promoCode.id);
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(apiUrl(`/pricing/promo-codes/${deletingId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        showToast('Promo code deleted successfully!', 'success');
        setShowDeleteModal(false);
        setDeletingId(null);
        fetchPromoCodes();
      } else {
        throw new Error('Failed to delete promo code');
      }
    } catch (error) {
      console.error('Error deleting promo code:', error);
      showToast('Failed to delete promo code', 'error');
    }
  };

  const formatDiscountValue = (promoCode: PromoCode) => {
    const value = Number(promoCode.discountValue) || 0;
    return promoCode.discountType === 'percentage' 
      ? `${value}%`
      : `$${value.toFixed(2)}`;
  };

  const getExpiryStatus = (promoCode: PromoCode) => {
    if (!promoCode.validUntil) return { text: 'No expiry', color: 'text-green-600' };
    
    const expiry = new Date(promoCode.validUntil);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { text: 'Expired', color: 'text-red-600' };
    if (daysUntilExpiry < 7) return { text: `${daysUntilExpiry} days left`, color: 'text-orange-600' };
    return { text: `${daysUntilExpiry} days left`, color: 'text-green-600' };
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-rose-50 rounded-2xl shadow-xl p-6 border border-amber-200/50">
        <div className="animate-pulse">
          <div className="h-6 bg-amber-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-amber-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 to-rose-50 rounded-2xl shadow-xl p-4 sm:p-6 border border-amber-200/50">
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-4 sm:space-y-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Tag className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-amber-900">Promo Codes</h2>
            <p className="text-sm sm:text-base text-amber-700">Manage discount codes and promotions</p>
          </div>
        </div>
        <button
          onClick={() => {
            setPromoForm(emptyPromoCode);
            setEditingId(null);
            setShowModal(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm sm:text-base"
        >
          <Plus className="h-4 w-4" />
          Add Promo Code
        </button>
      </div>

      {/* Stats Cards - Mobile Optimized */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white/50 rounded-xl p-3 sm:p-4 border border-amber-200/50">
          <div className="flex items-center gap-2 sm:gap-3">
            <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
            <div>
              <p className="text-xs sm:text-sm text-amber-700">Active Codes</p>
              <p className="text-xl sm:text-2xl font-bold text-amber-900">
                {promoCodes.filter(p => p.active).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white/50 rounded-xl p-3 sm:p-4 border border-amber-200/50">
          <div className="flex items-center gap-2 sm:gap-3">
            <Users className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-xs sm:text-sm text-amber-700">Total Usage</p>
              <p className="text-xl sm:text-2xl font-bold text-amber-900">
                {promoCodes.reduce((sum, p) => sum + p.currentUsageTotal, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white/50 rounded-xl p-3 sm:p-4 border border-amber-200/50 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 sm:gap-3">
            <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600 flex-shrink-0" />
            <div>
              <p className="text-xs sm:text-sm text-amber-700">Expiring Soon</p>
              <p className="text-xl sm:text-2xl font-bold text-amber-900">
                {promoCodes.filter(p => {
                  if (!p.validUntil) return false;
                  const expiry = new Date(p.validUntil);
                  const now = new Date();
                  const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  return daysUntilExpiry >= 0 && daysUntilExpiry < 7;
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Promo Codes - Mobile Cards/Desktop Table */}
      <div className="bg-white/70 rounded-xl border border-amber-200/50 overflow-hidden">
        {/* Mobile Card Layout */}
        <div className="lg:hidden">
          {promoCodes.length > 0 ? (
            <div className="space-y-3 p-3 sm:p-4">
              {promoCodes.map((promoCode) => {
                const expiryStatus = getExpiryStatus(promoCode);
                return (
                  <div key={promoCode.id} className="bg-white/80 rounded-lg p-3 sm:p-4 border border-amber-200/30">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="text-sm font-bold text-amber-900">{promoCode.code}</div>
                        <div className="text-xs text-amber-600">{promoCode.name}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          promoCode.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {promoCode.active ? 'Active' : 'Inactive'}
                        </span>
                        <button
                          onClick={() => handleEdit(promoCode)}
                          className="p-1 text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingId(promoCode.id);
                            setShowDeleteModal(true);
                          }}
                          className="p-1 text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                      <div>
                        <span className="text-amber-600">Discount:</span>
                        <div className="font-medium text-amber-900">{formatDiscountValue(promoCode)}</div>
                        {promoCode.minimumAmount != null && Number(promoCode.minimumAmount) > 0 && (
                          <div className="text-xs text-amber-600">
                            Min: ${Number(promoCode.minimumAmount).toFixed(2)}
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="text-amber-600">Usage:</span>
                        <div className="font-medium text-amber-900">
                          {promoCode.currentUsageTotal} / {promoCode.maxUsageTotal}
                        </div>
                        <div className="text-xs text-amber-600">
                          Max per customer: {promoCode.maxUsagePerCustomer}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <span className="text-amber-600 text-xs sm:text-sm">Expiry:</span>
                      <div className={`text-xs sm:text-sm font-medium ${expiryStatus.color}`}>
                        {expiryStatus.text}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-amber-600">
              No promo codes found. Click "Add Promo Code" to get started.
            </div>
          )}
        </div>

        {/* Desktop Table Layout */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-amber-100/70">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-800 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-800 uppercase tracking-wider">Discount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-800 uppercase tracking-wider">Usage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-800 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-800 uppercase tracking-wider">Expiry</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-800 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-200/50">
              {promoCodes.length > 0 ? (
                promoCodes.map((promoCode) => {
                  const expiryStatus = getExpiryStatus(promoCode);
                  return (
                    <tr key={promoCode.id} className="hover:bg-amber-50/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-amber-900">{promoCode.code}</div>
                          <div className="text-sm text-amber-600">{promoCode.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-amber-900">
                          {formatDiscountValue(promoCode)}
                        </div>
                        {promoCode.minimumAmount != null && Number(promoCode.minimumAmount) > 0 && (
                          <div className="text-xs text-amber-600">
                            Min: ${Number(promoCode.minimumAmount).toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-amber-900">
                          {promoCode.currentUsageTotal} / {promoCode.maxUsageTotal}
                        </div>
                        <div className="text-xs text-amber-600">
                          Max per customer: {promoCode.maxUsagePerCustomer}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          promoCode.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {promoCode.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${expiryStatus.color}`}>
                          {expiryStatus.text}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(promoCode)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setDeletingId(promoCode.id);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-amber-600">
                    No promo codes found. Click "Add Promo Code" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Promo Code Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setPromoForm(emptyPromoCode);
          setEditingId(null);
        }}
        title={editingId ? 'Edit Promo Code' : 'Add New Promo Code'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-amber-800 mb-2">Promo Code</label>
              <input
                type="text"
                value={promoForm.code}
                onChange={e => setPromoForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="SAVE20"
                className="w-full border border-amber-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400 uppercase"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-800 mb-2">Discount Type</label>
              <select
                value={promoForm.discountType}
                onChange={e => setPromoForm(prev => ({ ...prev, discountType: e.target.value as 'percentage' | 'fixed' }))}
                className="w-full border border-amber-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-amber-800 mb-2">Name</label>
            <input
              type="text"
              value={promoForm.name}
              onChange={e => setPromoForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Welcome 20% Off"
              className="w-full border border-amber-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-amber-800 mb-2">
                Discount Value {promoForm.discountType === 'percentage' ? '(%)' : '($)'}
              </label>
              <input
                type="number"
                value={promoForm.discountValue}
                onChange={e => setPromoForm(prev => ({ ...prev, discountValue: parseFloat(e.target.value) || 0 }))}
                min="0"
                step={promoForm.discountType === 'percentage' ? '1' : '0.01'}
                max={promoForm.discountType === 'percentage' ? '100' : undefined}
                className="w-full border border-amber-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-800 mb-2">Minimum Amount ($)</label>
              <input
                type="number"
                value={promoForm.minimumAmount}
                onChange={e => setPromoForm(prev => ({ ...prev, minimumAmount: parseFloat(e.target.value) || 0 }))}
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full border border-amber-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-amber-800 mb-2">Max Total Usage</label>
              <input
                type="number"
                value={promoForm.maxUsageTotal}
                onChange={e => setPromoForm(prev => ({ ...prev, maxUsageTotal: parseInt(e.target.value) || 0 }))}
                min="1"
                placeholder="1000"
                className="w-full border border-amber-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-800 mb-2">Max Per Customer</label>
              <input
                type="number"
                value={promoForm.maxUsagePerCustomer}
                onChange={e => setPromoForm(prev => ({ ...prev, maxUsagePerCustomer: parseInt(e.target.value) || 0 }))}
                min="1"
                placeholder="1"
                className="w-full border border-amber-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-amber-800 mb-2">Valid From (Optional)</label>
              <input
                type="date"
                value={promoForm.validFrom}
                onChange={e => setPromoForm(prev => ({ ...prev, validFrom: e.target.value }))}
                className="w-full border border-amber-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-800 mb-2">Valid Until (Optional)</label>
              <input
                type="date"
                value={promoForm.validUntil}
                onChange={e => setPromoForm(prev => ({ ...prev, validUntil: e.target.value }))}
                className="w-full border border-amber-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="active"
              checked={promoForm.active}
              onChange={e => setPromoForm(prev => ({ ...prev, active: e.target.checked }))}
              className="h-4 w-4 text-rose-600 focus:ring-rose-500 border-amber-300 rounded"
            />
            <label htmlFor="active" className="ml-2 text-sm text-amber-800">
              Active
            </label>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                setPromoForm(emptyPromoCode);
                setEditingId(null);
              }}
              className="flex-1 px-4 py-2 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600 transition-colors"
            >
              {editingId ? 'Update' : 'Create'} Promo Code
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingId(null);
        }}
        title="Delete Promo Code"
      >
        <div className="space-y-4">
          <p className="text-amber-700">
            Are you sure you want to delete this promo code? This action cannot be undone.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setDeletingId(null);
              }}
              className="flex-1 px-4 py-2 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PromoCodeManagement;
