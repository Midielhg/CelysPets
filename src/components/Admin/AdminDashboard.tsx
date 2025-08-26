import React from 'react';
import { useLocation } from 'react-router-dom';
import DashboardStats from './DashboardStats';
import IOSAppointmentManagement from './IOSAppointmentManagement';
import ClientManagement from './ClientManagement';
import UserManagement from './UserManagement';
import PricingManagement from './PricingManagement';
import TodaySchedule from './TodaySchedule';
import RecentActivity from './RecentActivity';

const AdminDashboard: React.FC = () => {
  const location = useLocation();

  const renderContent = () => {
    // Determine which view to show based on the current route
    if (location.pathname === '/admin/appointments') {
      return <IOSAppointmentManagement />;
    } else if (location.pathname === '/admin/clients') {
      return <ClientManagement />;
    } else if (location.pathname === '/admin/users') {
      return <UserManagement />;
    } else if (location.pathname === '/admin/settings') {
      return <PricingManagement />;
    } else {
      // Default to overview for /admin route
      return (
        <div className="space-y-6">
          <div className="mb-8">
            <DashboardStats />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TodaySchedule />
            <RecentActivity />
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;