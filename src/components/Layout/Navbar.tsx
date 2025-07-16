import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Logo from './Logo';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-gradient-to-r from-orange-50 to-amber-50 backdrop-blur-md border-b border-orange-100/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Logo size="md" />

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-amber-800 hover:text-rose-600 font-medium transition-colors duration-300">
              Home
            </Link>
            <Link to="/book" className="text-amber-800 hover:text-rose-600 font-medium transition-colors duration-300">
              Book Now
            </Link>
            
            {user ? (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/dashboard" 
                  className="text-amber-800 hover:text-rose-600 font-medium transition-colors duration-300"
                >
                  Dashboard
                </Link>
                {user.role === 'admin' && (
                  <>
                    <Link 
                      to="/admin" 
                      className="text-amber-800 hover:text-rose-600 font-medium transition-colors duration-300"
                    >
                      Admin
                    </Link>
                    <Link 
                      to="/admin/routes" 
                      className="text-amber-800 hover:text-rose-600 font-medium transition-colors duration-300"
                    >
                      🗺️ Routes
                    </Link>
                  </>
                )}
                <Link 
                  to="/routes" 
                  className="text-amber-800 hover:text-rose-600 font-medium transition-colors duration-300"
                >
                  My Routes
                </Link>
                <button
                  onClick={logout}
                  className="bg-gradient-to-r from-amber-200 to-orange-200 text-amber-900 px-6 py-2 rounded-full hover:from-amber-300 hover:to-orange-300 hover:shadow-lg transform hover:scale-105 transition-all duration-300 font-semibold border border-amber-300/50"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/login" 
                  className="text-amber-800 hover:text-rose-600 font-medium transition-colors duration-300"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="bg-gradient-to-r from-rose-400 to-rose-500 text-white px-6 py-2 rounded-full hover:from-rose-500 hover:to-rose-600 hover:shadow-lg transform hover:scale-105 transition-all duration-300 font-semibold"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="text-amber-800 hover:text-rose-600 transition-colors duration-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;