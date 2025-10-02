import React from 'react';
import { Calendar } from 'lucide-react';

interface RecurringDashboardProps {
  onClose?: () => void;
}

export const RecurringDashboard: React.FC<RecurringDashboardProps> = ({ onClose }) => {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Calendar className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Recurring Appointments Dashboard</h2>
        </div>
        {onClose && (
          <button onClick={onClose} className="px-4 py-2 border rounded-md">Close</button>
        )}
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold mb-4">Dashboard Overview</h3>
        <p className="text-gray-600">This dashboard provides comprehensive management for recurring appointments.</p>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">8</div>
            <div className="text-sm text-gray-600">Active Series</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">156</div>
            <div className="text-sm text-gray-600">Total Appointments</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecurringDashboard;
