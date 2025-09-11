import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { User, Settings, Key, Mail } from 'lucide-react';

const ProfileSettings: React.FC = () => {
  const { user, updateProfile, resetPassword } = useAuth();
  const { showToast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    role: user?.role || 'client'
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      await updateProfile(formData.name, formData.role);
      showToast('Profile updated successfully!', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      showToast(errorMessage, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    
    setIsResettingPassword(true);

    try {
      await resetPassword(user.email);
      showToast('Password reset email sent! Check your inbox.', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reset email';
      showToast(errorMessage, 'error');
    } finally {
      setIsResettingPassword(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center text-gray-600">Please log in to view your profile.</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
        <Settings className="h-8 w-8 text-blue-600" />
        Profile Settings
      </h1>

      {/* User Info Card */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-gray-600" />
          Account Information
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Mail className="h-4 w-4 inline mr-1" />
              Email
            </label>
            <div className="p-3 bg-gray-50 rounded-lg text-gray-600">
              {user.email}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <div className={`p-3 rounded-lg text-sm font-medium ${
              user.role === 'admin' ? 'bg-red-100 text-red-800' :
              user.role === 'groomer' ? 'bg-blue-100 text-blue-800' :
              'bg-green-100 text-green-800'
            }`}>
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </div>
          </div>
        </div>
      </div>

      {/* Update Profile Form */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Update Profile</h2>
        
        <form onSubmit={handleUpdateProfile} className="space-y-4">
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
            />
          </div>

          {user.role === 'admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role (Admin Only)
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'client' | 'admin' | 'groomer' }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="client">Client</option>
                <option value="groomer">Groomer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={isUpdating}
            className={`w-full py-2 px-4 rounded-lg font-medium ${
              isUpdating
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white transition-colors`}
          >
            {isUpdating ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      </div>

      {/* Password Reset */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Key className="h-5 w-5 text-gray-600" />
          Security
        </h2>
        
        <div className="space-y-4">
          <div>
            <p className="text-gray-600 mb-3">
              Need to change your password? We'll send you a secure reset link via email.
            </p>
            <button
              onClick={handleResetPassword}
              disabled={isResettingPassword}
              className={`py-2 px-4 rounded-lg font-medium ${
                isResettingPassword
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-orange-600 hover:bg-orange-700'
              } text-white transition-colors`}
            >
              {isResettingPassword ? 'Sending...' : 'Send Password Reset Email'}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">🔐 Supabase Authentication</h3>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• Your account is secured with enterprise-grade authentication</li>
          <li>• Password changes are handled securely via email</li>
          <li>• Your session is automatically managed and refreshed</li>
          <li>• All data access is protected by Row Level Security</li>
        </ul>
      </div>
    </div>
  );
};

export default ProfileSettings;
