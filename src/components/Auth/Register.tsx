import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const Register: React.FC = () => {
  const { user, register } = useAuth();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  if (user) {
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    if (formData.password.length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      return;
    }

    setIsLoading(true);

    try {
      await register(formData.email, formData.password, formData.name);
      showToast('Account created successfully! Please check your email to confirm your account.', 'success');
      // Note: User might need to confirm email before being able to sign in
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create account. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6">
      <div className="bg-gradient-to-br from-cream-50 to-amber-50 rounded-2xl shadow-xl p-8 border border-amber-200/50">
        <h1 className="text-3xl font-bold text-center text-amber-900 mb-8">
          Create Account
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-amber-800 mb-2">
              Full Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-amber-800 mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-amber-800 mb-2">
              Password
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm"
              placeholder="Enter your password"
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-amber-800 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm"
              placeholder="Confirm your password"
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 px-6 rounded-xl hover:from-emerald-600 hover:to-emerald-700 hover:shadow-lg transform hover:scale-[1.02] disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:transform-none transition-all duration-300 font-semibold"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-amber-700">
            Already have an account?{' '}
            <Link to="/login" className="text-rose-600 hover:text-rose-700 font-medium transition-colors duration-300">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;