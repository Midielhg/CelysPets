import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { LoginPerformanceMonitor } from '../../utils/loginPerformanceMonitor';

const Login: React.FC = () => {
  const { user, login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    console.log('🚀 Login form submitted with:', { email: formData.email });
    LoginPerformanceMonitor.startLogin();

    // Reduced timeout for faster user feedback
    const timeoutId = setTimeout(() => {
      console.error('⏰ Login timeout after 10 seconds');
      setIsLoading(false);
      LoginPerformanceMonitor.endLogin();
      showToast('Login timeout. Please check your connection and try again.', 'error');
    }, 10000);

    try {
      console.log('📞 Calling login function...');
      await login(formData.email, formData.password);
      console.log('✅ Login function completed successfully');
      LoginPerformanceMonitor.recordStep('Login Complete');
      LoginPerformanceMonitor.endLogin();
      clearTimeout(timeoutId);
      showToast('Logged in successfully!', 'success');
      // Navigation will be handled by useEffect after user state updates
    } catch (error) {
      console.error('❌ Login error caught:', error);
      LoginPerformanceMonitor.endLogin();
      clearTimeout(timeoutId);
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      showToast(errorMessage, 'error');
    } finally {
      console.log('🏁 Login form finally block - resetting loading state');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6">
      <div className="bg-gradient-to-br from-cream-50 to-amber-50 rounded-2xl shadow-xl p-8 border border-amber-200/50">
        <h1 className="text-3xl font-bold text-center text-amber-900 mb-8">
          Sign In
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
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
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-rose-500 to-rose-600 text-white py-3 px-6 rounded-xl hover:from-rose-600 hover:to-rose-700 hover:shadow-lg transform hover:scale-[1.02] disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:transform-none transition-all duration-300 font-semibold"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-amber-700">
            Don't have an account?{' '}
            <Link to="/register" className="text-rose-600 hover:text-rose-700 font-medium transition-colors duration-300">
              Sign up here
            </Link>
          </p>
        </div>

        {/* Development credentials helper */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Development Credentials:</h3>
            <div className="space-y-2 text-xs text-blue-700">
              <div>
                <strong>Client:</strong> client@celyspets.com / client123
                <button 
                  onClick={() => setFormData({ email: 'client@celyspets.com', password: 'client123' })}
                  className="ml-2 text-blue-600 hover:text-blue-800 underline"
                >
                  Use
                </button>
              </div>
              <div>
                <strong>Admin:</strong> admin@celyspets.com / admin123
                <button 
                  onClick={() => setFormData({ email: 'admin@celyspets.com', password: 'admin123' })}
                  className="ml-2 text-blue-600 hover:text-blue-800 underline"
                >
                  Use
                </button>
              </div>
            </div>
          </div>
        )}


      </div>
    </div>
  );
};

export default Login;