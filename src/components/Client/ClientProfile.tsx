import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, MapPin, Edit, Save, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiUrl } from '../../config/api';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

const ClientProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch(apiUrl('/client/profile'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const profileData = await response.json();
        setProfile(profileData);
        setFormData({
          name: profileData.name || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          address: profileData.address || '',
          city: profileData.city || '',
          state: profileData.state || '',
          zipCode: profileData.zipCode || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch(apiUrl('/client/profile'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        zipCode: profile.zipCode || ''
      });
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-amber-200 rounded w-1/3 mb-4"></div>
          <div className="bg-amber-100 rounded-2xl h-96"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/dashboard')}
            className="mr-4 p-2 rounded-lg text-amber-700 hover:bg-amber-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-amber-900">My Profile 👤</h1>
            <p className="text-amber-700 mt-1">Manage your account information</p>
          </div>
        </div>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="bg-gradient-to-r from-rose-500 to-rose-600 text-white px-6 py-3 rounded-full hover:from-rose-600 hover:to-rose-700 hover:shadow-lg transform hover:scale-105 transition-all duration-300 font-semibold"
          >
            <Edit className="w-5 h-5 mr-2 inline" />
            Edit Profile
          </button>
        )}
      </div>

      {/* Profile Card */}
      <div className="bg-gradient-to-br from-cream-50 to-amber-50 rounded-2xl shadow-xl p-8 border border-amber-200/50">
        {/* Profile Avatar */}
        <div className="flex items-center mb-8">
          <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center border-4 border-rose-200">
            <User className="w-10 h-10 text-rose-600" />
          </div>
          <div className="ml-6">
            <h2 className="text-2xl font-bold text-amber-900">
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-white/70 backdrop-blur-sm border border-amber-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                  placeholder="Your full name"
                />
              ) : (
                profile?.name || user?.name || 'Your Name'
              )}
            </h2>
            <p className="text-amber-700 font-medium">Pet Owner</p>
          </div>
        </div>

        {/* Profile Information */}
        <div className="space-y-6">
          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-bold text-amber-900 mb-4 flex items-center">
              <Mail className="w-5 h-5 mr-2 text-rose-500" />
              Contact Information
            </h3>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-2">Email Address</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-white/70 backdrop-blur-sm border border-amber-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                    placeholder="your.email@example.com"
                  />
                ) : (
                  <div className="bg-white/50 rounded-lg p-3 border border-amber-200">
                    <p className="text-amber-900 font-medium">{profile?.email || user?.email || 'Not provided'}</p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-2">Phone Number</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-white/70 backdrop-blur-sm border border-amber-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                    placeholder="(786) 222-3785"
                  />
                ) : (
                  <div className="bg-white/50 rounded-lg p-3 border border-amber-200">
                    <p className="text-amber-900 font-medium">{profile?.phone || 'Not provided'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div>
            <h3 className="text-lg font-bold text-amber-900 mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-rose-500" />
              Address Information
            </h3>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-2">Street Address</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full bg-white/70 backdrop-blur-sm border border-amber-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                    placeholder="123 Main Street"
                  />
                ) : (
                  <div className="bg-white/50 rounded-lg p-3 border border-amber-200">
                    <p className="text-amber-900 font-medium">{profile?.address || 'Not provided'}</p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-amber-700 mb-2">City</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full bg-white/70 backdrop-blur-sm border border-amber-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                      placeholder="Miami"
                    />
                  ) : (
                    <div className="bg-white/50 rounded-lg p-3 border border-amber-200">
                      <p className="text-amber-900 font-medium">{profile?.city || 'Not provided'}</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-amber-700 mb-2">State</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full bg-white/70 backdrop-blur-sm border border-amber-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                      placeholder="FL"
                    />
                  ) : (
                    <div className="bg-white/50 rounded-lg p-3 border border-amber-200">
                      <p className="text-amber-900 font-medium">{profile?.state || 'Not provided'}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="max-w-xs">
                <label className="block text-sm font-medium text-amber-700 mb-2">ZIP Code</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                    className="w-full bg-white/70 backdrop-blur-sm border border-amber-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                    placeholder="33101"
                  />
                ) : (
                  <div className="bg-white/50 rounded-lg p-3 border border-amber-200">
                    <p className="text-amber-900 font-medium">{profile?.zipCode || 'Not provided'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex gap-4 mt-8 pt-6 border-t border-amber-200">
            <button
              onClick={handleCancel}
              className="flex-1 px-6 py-3 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors duration-200 font-medium"
            >
              <X className="w-5 h-5 mr-2 inline" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-lg hover:from-rose-600 hover:to-rose-700 transition-all duration-200 font-medium disabled:opacity-50"
            >
              <Save className="w-5 h-5 mr-2 inline" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientProfile;
