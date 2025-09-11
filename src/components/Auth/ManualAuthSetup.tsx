import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { UserPlus, Settings, AlertTriangle, CheckCircle } from 'lucide-react';

const ManualAuthSetup: React.FC = () => {
  const { user, register } = useAuth();
  const { showToast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'admin' as 'client' | 'admin' | 'groomer'
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    if (formData.password.length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      return;
    }

    setIsCreating(true);

    try {
      await register(formData.email, formData.password, formData.name, formData.role);
      showToast('User created successfully! Check email for confirmation.', 'success');
      
      // Reset form
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        role: 'admin'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
      showToast(errorMessage, 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const quickCreateAdmin = () => {
    setFormData({
      email: 'admin@celyspets.com',
      password: 'admin123',
      confirmPassword: 'admin123',
      name: 'Admin User',
      role: 'admin'
    });
  };

  const quickCreateGroomer = () => {
    setFormData({
      email: 'groomer@celyspets.com',
      password: 'groomer123',
      confirmPassword: 'groomer123',
      name: 'Groomer User',
      role: 'groomer'
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
        <Settings className="h-8 w-8 text-blue-600" />
        Manual Authentication Setup
      </h1>

      {/* Current User Status */}
      {user && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Currently logged in as: {user.name} ({user.email})</span>
          </div>
        </div>
      )}

      {/* Warning Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div className="text-amber-800">
            <h3 className="font-semibold mb-2">Setup Instructions</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>First, execute the SQL migration in your Supabase dashboard</li>
              <li>Then use this form to create your initial admin/groomer accounts</li>
              <li>Users will receive confirmation emails before they can login</li>
              <li>This route should be removed in production</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Quick Setup Buttons */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Quick Setup</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={quickCreateAdmin}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="text-center">
              <UserPlus className="h-8 w-8 text-gray-600 mx-auto mb-2" />
              <div className="font-medium">Quick Admin</div>
              <div className="text-sm text-gray-600">admin@celyspets.com</div>
            </div>
          </button>
          
          <button
            onClick={quickCreateGroomer}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <div className="text-center">
              <UserPlus className="h-8 w-8 text-gray-600 mx-auto mb-2" />
              <div className="font-medium">Quick Groomer</div>
              <div className="text-sm text-gray-600">groomer@celyspets.com</div>
            </div>
          </button>
        </div>
      </div>

      {/* Manual User Creation Form */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Create New User</h2>
        
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="user@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'client' | 'admin' | 'groomer' }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="admin">Admin</option>
              <option value="groomer">Groomer</option>
              <option value="client">Client</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="At least 6 characters"
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Repeat password"
            />
          </div>

          <button
            type="submit"
            disabled={isCreating}
            className={`w-full py-3 px-4 rounded-lg font-medium ${
              isCreating
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white transition-colors`}
          >
            {isCreating ? 'Creating User...' : 'Create User'}
          </button>
        </form>
      </div>

      {/* SQL Migration Info */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">📋 Migration Required</h3>
        <p className="text-gray-600 text-sm mb-3">
          Before creating users, run this SQL in your Supabase dashboard (SQL Editor):
        </p>
        <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-xs overflow-x-auto">
          <div>-- Execute in Supabase SQL Editor</div>
          <div>-- File: supabase-auth-migration.sql</div>
          <div>-- Creates user_profiles table + RLS policies + triggers</div>
        </div>
      </div>
    </div>
  );
};

export default ManualAuthSetup;
