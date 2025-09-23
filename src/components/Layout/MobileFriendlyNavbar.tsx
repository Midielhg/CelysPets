import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  BarChart3, 
  Calendar, 
  Users, 
  User,
  Tag,
  DollarSign,
  Home,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import Logo from './Logo';

const MobileFriendlyNavbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const location = useLocation();

  // Admin navigation items
  const adminNavItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: BarChart3,
      path: '/admin'
    },
    {
      id: 'appointments',
      label: 'Appointments',
      icon: Calendar,
      path: '/admin/appointments'
    },
    {
      id: 'clients',
      label: 'Clients',
      icon: Users,
      path: '/admin/clients'
    },
    {
      id: 'users',
      label: 'Users',
      icon: User,
      path: '/admin/users'
    },
    {
      id: 'promo-codes',
      label: 'Promo Codes',
      icon: Tag,
      path: '/admin/promo-codes'
    },
    {
      id: 'pricings',
      label: 'Pricings',
      icon: DollarSign,
      path: '/admin/pricings'
    }
  ];

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
    <>
      {/* Mobile menu backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-white/20 backdrop-blur-sm z-40 md:hidden"
          onClick={closeMobileMenu}
        />
      )}
      
      <nav ref={navRef} className="bg-gradient-to-r from-orange-50 to-amber-50 backdrop-blur-md border-b border-orange-100/50 shadow-sm relative z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Logo size="md" />

            {/* Navigation Links - Desktop */}
            <div className="hidden md:flex items-center space-x-8">
              {user?.role === 'admin' ? (
                /* Admin Navigation Tabs */
                <div className="flex items-center space-x-6">
                  {adminNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path || 
                      (item.id === 'overview' && location.pathname === '/admin');
                    
                    return (
                      <Link
                        key={item.id}
                        to={item.path}
                        className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                          isActive
                            ? 'bg-blue-100 text-blue-700 shadow-sm'
                            : 'text-amber-800 hover:text-rose-600 hover:bg-orange-100/30'
                        }`}
                      >
                        <Icon className="w-5 h-5 mr-2" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              ) : (
                /* Regular User Navigation */
                <div className="flex items-center space-x-6">
                  <Link 
                    to="/" 
                    className="text-amber-800 hover:text-rose-600 font-medium transition-colors duration-300"
                  >
                    Home
                  </Link>
                  {!user && (
                    <Link 
                      to="/book" 
                      className="text-amber-800 hover:text-rose-600 font-medium transition-colors duration-300"
                    >
                      Book Now
                    </Link>
                  )}
                  {user && user.role === 'client' && (
                    <Link 
                      to="/dashboard" 
                      className="text-amber-800 hover:text-rose-600 font-medium transition-colors duration-300"
                    >
                      Dashboard
                    </Link>
                  )}
                </div>
              )}

              {/* Right side - User menu or Auth buttons */}
              {user ? (
                <div className="flex items-center space-x-4">
                  <Link 
                    to="/settings" 
                    className="text-amber-800 hover:text-rose-600 font-medium transition-colors duration-300"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={logout}
                    className="bg-gradient-to-r from-amber-200 to-orange-200 text-amber-900 px-4 py-2 rounded-lg hover:from-amber-300 hover:to-orange-300 font-semibold border border-amber-300/50 transition-all duration-300"
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
                className="text-amber-800 hover:text-rose-600 transition-colors duration-300 p-3 rounded-lg hover:bg-orange-100/50 relative"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* Enhanced Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-orange-100/50 bg-gradient-to-r from-orange-50 to-amber-50 shadow-lg">
              <div className="px-3 py-4 space-y-1 max-h-[70vh] overflow-y-auto">
                {user?.role === 'admin' ? (
                  /* Admin Mobile Navigation */
                  <>
                    {adminNavItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path || 
                        (item.id === 'overview' && location.pathname === '/admin');
                      return (
                        <Link
                          key={item.id}
                          to={item.path}
                          className={`flex items-center py-4 px-4 rounded-lg font-medium transition-all duration-300 ${
                            isActive
                              ? 'bg-blue-100 text-blue-700 shadow-sm'
                              : 'text-amber-800 hover:text-rose-600 hover:bg-orange-100/50'
                          }`}
                          onClick={closeMobileMenu}
                        >
                          <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                          <span className="text-base font-medium">{item.label}</span>
                        </Link>
                      );
                    })}
                    
                    {/* Settings and Logout for Admin */}
                    <div className="border-t border-orange-200/50 mt-3 pt-3 space-y-1">
                      <Link 
                        to="/settings" 
                        className="flex items-center py-4 px-4 text-amber-800 hover:text-rose-600 hover:bg-orange-100/50 rounded-lg font-medium transition-all duration-300"
                        onClick={closeMobileMenu}
                      >
                        <Settings className="w-5 h-5 mr-3 flex-shrink-0" />
                        <span className="text-base font-medium">Settings</span>
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          closeMobileMenu();
                        }}
                        className="w-full flex items-center py-4 px-4 bg-gradient-to-r from-amber-200 to-orange-200 text-amber-900 rounded-lg hover:from-amber-300 hover:to-orange-300 font-semibold border border-amber-300/50 transition-all duration-300"
                      >
                        <LogOut className="w-5 h-5 mr-3 flex-shrink-0" />
                        <span className="text-base font-medium">Logout</span>
                      </button>
                    </div>
                  </>
                ) : (
                  /* Regular User Mobile Navigation */
                  <>
                    <Link 
                      to="/" 
                      className="flex items-center py-4 px-4 text-amber-800 hover:text-rose-600 hover:bg-orange-100/50 rounded-lg font-medium transition-all duration-300"
                      onClick={closeMobileMenu}
                    >
                      <Home className="w-5 h-5 mr-3 flex-shrink-0" />
                      <span className="text-base font-medium">Home</span>
                    </Link>
                    
                    {!user && (
                      <Link 
                        to="/book" 
                        className="flex items-center py-4 px-4 text-amber-800 hover:text-rose-600 hover:bg-orange-100/50 rounded-lg font-medium transition-all duration-300"
                        onClick={closeMobileMenu}
                      >
                        <Calendar className="w-5 h-5 mr-3 flex-shrink-0" />
                        <span className="text-base font-medium">Book Now</span>
                      </Link>
                    )}
                    
                    {user && user.role === 'client' && (
                      <Link 
                        to="/dashboard" 
                        className="flex items-center py-4 px-4 text-amber-800 hover:text-rose-600 hover:bg-orange-100/50 rounded-lg font-medium transition-all duration-300"
                        onClick={closeMobileMenu}
                      >
                        <BarChart3 className="w-5 h-5 mr-3 flex-shrink-0" />
                        <span className="text-base font-medium">Dashboard</span>
                      </Link>
                    )}
                    
                    {/* Auth section */}
                    <div className="border-t border-orange-200/50 mt-3 pt-3 space-y-1">
                      {user ? (
                        <>
                          <Link 
                            to="/settings" 
                            className="flex items-center py-4 px-4 text-amber-800 hover:text-rose-600 hover:bg-orange-100/50 rounded-lg font-medium transition-all duration-300"
                            onClick={closeMobileMenu}
                          >
                            <Settings className="w-5 h-5 mr-3 flex-shrink-0" />
                            <span className="text-base font-medium">Settings</span>
                          </Link>
                          <button
                            onClick={() => {
                              logout();
                              closeMobileMenu();
                            }}
                            className="w-full flex items-center py-4 px-4 bg-gradient-to-r from-amber-200 to-orange-200 text-amber-900 rounded-lg hover:from-amber-300 hover:to-orange-300 font-semibold border border-amber-300/50 transition-all duration-300"
                          >
                            <LogOut className="w-5 h-5 mr-3 flex-shrink-0" />
                            <span className="text-base font-medium">Logout</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <Link 
                            to="/login" 
                            className="flex items-center py-4 px-4 text-amber-800 hover:text-rose-600 hover:bg-orange-100/50 rounded-lg font-medium transition-all duration-300"
                            onClick={closeMobileMenu}
                          >
                            <User className="w-5 h-5 mr-3 flex-shrink-0" />
                            <span className="text-base font-medium">Login</span>
                          </Link>
                          <Link 
                            to="/register" 
                            className="flex items-center py-4 px-4 bg-gradient-to-r from-rose-400 to-rose-500 text-white rounded-lg hover:from-rose-500 hover:to-rose-600 font-semibold transition-all duration-300"
                            onClick={closeMobileMenu}
                          >
                            <User className="w-5 h-5 mr-3 flex-shrink-0" />
                            <span className="text-base font-medium">Register</span>
                          </Link>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default MobileFriendlyNavbar;