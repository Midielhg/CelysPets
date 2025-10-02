import React from 'react';
import { useLocation } from 'react-router-dom';
import DashboardStats from './DashboardStats';
import IOSAppointmentManagement from './IOSAppointmentManagement';
import ClientManagement from './ClientManagement';
import UserManagement from './UserManagement';
import PricingManagement from './PricingManagement';
import PromoCodeManagement from './PromoCodeManagement';
import TodaySchedule from './TodaySchedule';
import RecentActivity from './RecentActivity';
import TodoManager from './TodoManager';

const AdminDashboard: React.FC = () => {
  const location = useLocation();

  console.log('AdminDashboard: Current pathname is:', location.pathname);

  const renderContent = () => {
    // Determine which view to show based on the current route
    if (location.pathname === '/admin/appointments') {
      return <IOSAppointmentManagement />;
    } else if (location.pathname === '/admin/clients') {
      return <ClientManagement />;
    } else if (location.pathname === '/admin/users') {
      return <UserManagement />;
    } else if (location.pathname === '/admin/pricings') {
      return <PricingManagement />;
    } else if (location.pathname === '/admin/promo-codes') {
      return <PromoCodeManagement />;
    } else {
      // Default to overview for /admin route
      return (
        <div className="space-y-4 sm:space-y-6">
          <div className="mb-6 sm:mb-8">
            <DashboardStats />
          </div>

          {/* Customer Contact To-Do Section */}
          <div className="mb-6">
            <TodoManager />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;