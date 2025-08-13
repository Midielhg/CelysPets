import React, { useState } from 'react';
import DashboardStats from './DashboardStats';
import TodaySchedule from './TodaySchedule';
import RecentActivity from './RecentActivity';
import AppointmentManagement from './AppointmentManagement';
import ClientManagement from './ClientManagement';
import UserManagement from './UserManagement';
import PricingManagement from './PricingManagement';

type AdminView = 'dashboard' | 'appointments' | 'clients' | 'users' | 'pricing';

const AdminDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<AdminView>('dashboard');

  const renderContent = () => {
    switch (currentView) {
      case 'appointments':
        return <AppointmentManagement />;
      case 'clients':
        return <ClientManagement />;
      case 'users':
        return <UserManagement />;
      case 'pricing':
        return <PricingManagement />;
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => (
    <>
      <div className="mb-8">
        <DashboardStats />
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <button 
          onClick={() => setCurrentView('appointments')}
          className="bg-blue-600 text-white p-6 rounded-lg hover:bg-blue-700 transition-colors text-left"
        >
          <div className="flex items-center mb-2">
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-semibold">Manage Appointments</span>
          </div>
          <p className="text-blue-100 text-sm">View, edit, organize schedule & optimize routes</p>
        </button>

        <button 
          onClick={() => setCurrentView('clients')}
          className="bg-purple-600 text-white p-6 rounded-lg hover:bg-purple-700 transition-colors text-left"
        >
          <div className="flex items-center mb-2">
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="font-semibold">Client Management</span>
          </div>
          <p className="text-purple-100 text-sm">Manage client profiles and pet information</p>
        </button>

        <button 
          onClick={() => setCurrentView('users')}
          className="bg-amber-600 text-white p-6 rounded-lg hover:bg-amber-700 transition-colors text-left"
        >
          <div className="flex items-center mb-2">
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <span className="font-semibold">User Management</span>
          </div>
          <p className="text-amber-100 text-sm">Manage user accounts, roles, and permissions</p>
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <TodaySchedule />
        <RecentActivity />
      </div>
    </>
  );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Navigation Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage your mobile grooming business</p>
          </div>
          
          {currentView !== 'dashboard' && (
            <button
              onClick={() => setCurrentView('dashboard')}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </button>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="mt-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'dashboard', label: 'Overview', icon: '📊' },
              { key: 'appointments', label: 'Appointments', icon: '📅' },
              { key: 'clients', label: 'Clients', icon: '👥' },
              { key: 'pricing', label: 'Pricing', icon: '💲' },
              { key: 'users', label: 'Users', icon: '👤' }
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setCurrentView(key as AdminView)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  currentView === key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{icon}</span>
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  );
};

export default AdminDashboard;