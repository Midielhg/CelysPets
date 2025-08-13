import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ClientDashboard from '../Client/ClientDashboard';
import GroomerDashboard from '../Groomer/GroomerDashboard';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin');
      return;
    }
  }, [user, navigate]);

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Please log in to continue</h2>
        </div>
      </div>
    );
  }

  // Route to appropriate dashboard based on user role
  switch (user.role) {
    case 'client':
      return <ClientDashboard />;
    case 'groomer':
      return <GroomerDashboard />;
    case 'admin':
      // This case is handled by the useEffect above
      return null;
    default:
      return (
        <div className="max-w-7xl mx-auto p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600">Invalid user role</h2>
            <p className="text-gray-600">Please contact support for assistance.</p>
          </div>
        </div>
      );
  }
};

export default Dashboard;