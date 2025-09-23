import React, { useState } from 'react';
import { User, Mail, Lock, Shield } from 'lucide-react';
import { UserService } from '../../services/userService';
import { useToast } from '../../contexts/ToastContext';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: () => void;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onUserCreated
}) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'client' as 'client' | 'admin' | 'groomer'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError(null);

    try {
      // Validate password match
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      // Validate password length
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        setLoading(false);
        return;
      }

      // Enhanced email validation
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      const email = formData.email.trim().toLowerCase();
      
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address (e.g., user@example.com)');
        setLoading(false);
        return;
      }

      // Additional email checks
      if (email.length < 5 || email.length > 254) {
        setError('Email address must be between 5 and 254 characters long');
        setLoading(false);
        return;
      }

      if (email.includes('..') || email.startsWith('.') || email.endsWith('.')) {
        setError('Email address format is invalid - please check for extra dots');
        setLoading(false);
        return;
      }

      await UserService.createUser({
        name: formData.name.trim(),
        email: email, // Use the validated and normalized email
        password: formData.password,
        role: formData.role
      });

      showToast(`${formData.role.charAt(0).toUpperCase() + formData.role.slice(1)} user "${formData.name}" created successfully!`, 'success');
      onUserCreated();
      onClose(); // Close modal on success
      resetForm();
    } catch (err: any) {
      console.error('Create user error:', err);
      if (err?.message?.includes('duplicate key value')) {
        setError('A user with this email already exists');
      } else if (err?.message?.includes('invalid input syntax')) {
        setError('Invalid data provided. Please check all fields.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to create user');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'client'
    });
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/20 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-amber-900">Create New User</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-blue-800 text-sm">
              📝 <strong>Note:</strong> Creating a new {formData.role} user.
              <br/>• Name: {formData.name || 'Enter full name'}
              <br/>• Email: {formData.email || 'Enter email address'}
              <br/>• Role: {formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}
              <br/>• Password: {formData.password ? '•'.repeat(formData.password.length) : 'Enter password'}
            </p>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full pl-10 pr-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm sm:text-base"
                placeholder="Enter full name"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="email"
                id="email"
                required
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full pl-10 pr-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm sm:text-base"
                placeholder="Enter email address"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="password"
                id="password"
                required
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full pl-10 pr-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm sm:text-base"
                placeholder="Enter password"
                minLength={6}
              />
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="password"
                id="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full pl-10 pr-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm sm:text-base"
                placeholder="Confirm password"
                minLength={6}
              />
            </div>
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              User Role
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  role: e.target.value as 'client' | 'admin' | 'groomer' 
                }))}
                className="w-full pl-10 pr-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none text-sm sm:text-base"
              >
                <option value="client">Client</option>
                <option value="groomer">Groomer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formData.role === 'client' && 'Can book appointments and manage their profile'}
              {formData.role === 'groomer' && 'Can view assigned appointments and manage routes'}
              {formData.role === 'admin' && 'Full access to all features and user management'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="w-full sm:flex-1 px-4 py-2.5 sm:py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:flex-1 px-4 py-2.5 sm:py-2 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-lg hover:from-rose-600 hover:to-rose-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm sm:text-base"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default CreateUserModal;
