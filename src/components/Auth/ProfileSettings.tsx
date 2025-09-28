import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { User, Settings, Key, Mail, Calendar, Copy, Check } from 'lucide-react';

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

      {/* Calendar Integration - Only for groomers and admins */}
      {(user.role === 'groomer' || user.role === 'admin') && (
        <div className="mt-6">
          <CalendarIntegrationCard />
        </div>
      )}

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

const CalendarIntegrationCard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [calendarInfo, setCalendarInfo] = useState<{
    subscriptionUrl: string;
    appointmentCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCalendarInfo = async () => {
    setLoading(true);
    try {
      // Use the Supabase server for calendar API
      const response = await fetch('http://localhost:5003/api/calendar/info', {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCalendarInfo(data);
      }
    } catch (error) {
      console.error('Failed to fetch calendar info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = async () => {
    if (!calendarInfo) return;

    try {
      await navigator.clipboard.writeText(calendarInfo.subscriptionUrl);
      setCopied(true);
      showToast('Calendar URL copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      showToast('Failed to copy URL', 'error');
    }
  };

  React.useEffect(() => {
    fetchCalendarInfo();
  }, []);

  if (!user || (user.role !== 'groomer' && user.role !== 'admin')) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center mb-4">
        <Calendar className="h-5 w-5 text-purple-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Apple Calendar Integration</h3>
      </div>

      <div className="space-y-4">
        <p className="text-gray-600">
          Subscribe to your appointment calendar in Apple Calendar to sync all your appointments automatically.
        </p>

        {loading ? (
          <div className="text-center py-4">
            <div className="text-gray-500">Loading calendar information...</div>
          </div>
        ) : calendarInfo ? (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-purple-800">
                📅 {calendarInfo.appointmentCount} upcoming appointments
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Calendar Subscription URL
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={calendarInfo.subscriptionUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono text-gray-600"
                  />
                  <button
                    onClick={handleCopyUrl}
                    className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center space-x-1"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span className="text-sm">{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <h4 className="font-medium text-blue-800 mb-2">Setup Instructions</h4>
                <ol className="text-blue-700 text-sm space-y-1">
                  <li>1. Copy the subscription URL above</li>
                  <li>2. Open Apple Calendar on your iPhone/iPad/Mac</li>
                  <li>3. Go to File → New Calendar Subscription (Mac) or Add Account (iOS)</li>
                  <li>4. Paste the URL and click Subscribe</li>
                  <li>5. Your appointments will sync automatically!</li>
                </ol>
              </div>

              <div className="text-xs text-gray-500">
                💡 The calendar updates in real-time when appointments are added, modified, or cancelled.
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="text-red-500">Failed to load calendar information</div>
            <button 
              onClick={fetchCalendarInfo}
              className="mt-2 text-purple-600 hover:text-purple-700 text-sm underline"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSettings;
