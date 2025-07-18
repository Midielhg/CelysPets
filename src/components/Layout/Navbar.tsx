import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Logo from './Logo';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  return (
    <nav ref={navRef} className="bg-gradient-to-r from-orange-50 to-amber-50 backdrop-blur-md border-b border-orange-100/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Logo size="md" />

          {/* Navigation Links - Desktop */}
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
            <button 
              onClick={toggleMobileMenu}
              className="text-amber-800 hover:text-rose-600 transition-colors duration-300 p-2"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div className={`md:hidden border-t border-orange-100/50 bg-gradient-to-r from-orange-50 to-amber-50 transition-all duration-300 ease-in-out overflow-hidden ${
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="px-4 pt-2 pb-4 space-y-2">
            <Link 
              to="/" 
              className="block py-3 px-2 text-amber-800 hover:text-rose-600 hover:bg-orange-100/30 rounded-lg font-medium transition-all duration-300"
              onClick={closeMobileMenu}
            >
              Home
            </Link>
            <Link 
              to="/book" 
              className="block py-3 px-2 text-amber-800 hover:text-rose-600 hover:bg-orange-100/30 rounded-lg font-medium transition-all duration-300"
              onClick={closeMobileMenu}
            >
              Book Now
            </Link>
            
            {user ? (
              <>
                <Link 
                  to="/dashboard" 
                  className="block py-3 px-2 text-amber-800 hover:text-rose-600 hover:bg-orange-100/30 rounded-lg font-medium transition-all duration-300"
                  onClick={closeMobileMenu}
                >
                  Dashboard
                </Link>
                {user.role === 'admin' && (
                  <>
                    <Link 
                      to="/admin" 
                      className="block py-3 px-2 text-amber-800 hover:text-rose-600 hover:bg-orange-100/30 rounded-lg font-medium transition-all duration-300"
                      onClick={closeMobileMenu}
                    >
                      Admin
                    </Link>
                    <Link 
                      to="/admin/routes" 
                      className="block py-3 px-2 text-amber-800 hover:text-rose-600 hover:bg-orange-100/30 rounded-lg font-medium transition-all duration-300"
                      onClick={closeMobileMenu}
                    >
                      🗺️ Routes
                    </Link>
                  </>
                )}
                <Link 
                  to="/routes" 
                  className="block py-3 px-2 text-amber-800 hover:text-rose-600 hover:bg-orange-100/30 rounded-lg font-medium transition-all duration-300"
                  onClick={closeMobileMenu}
                >
                  My Routes
                </Link>
                <button
                  onClick={() => {
                    logout();
                    closeMobileMenu();
                  }}
                  className="w-full text-left py-3 px-2 bg-gradient-to-r from-amber-200 to-orange-200 text-amber-900 rounded-lg hover:from-amber-300 hover:to-orange-300 font-semibold border border-amber-300/50 transition-all duration-300"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="block py-3 px-2 text-amber-800 hover:text-rose-600 hover:bg-orange-100/30 rounded-lg font-medium transition-all duration-300"
                  onClick={closeMobileMenu}
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="block py-3 px-2 bg-gradient-to-r from-rose-400 to-rose-500 text-white rounded-lg hover:from-rose-500 hover:to-rose-600 font-semibold transition-all duration-300"
                  onClick={closeMobileMenu}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;