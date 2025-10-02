import React from 'react';
import { Repeat, Calendar } from 'lucide-react';

interface RecurringBadgeProps {
  appointment: any;
  variant?: 'compact' | 'full' | 'stats';
  onClick?: () => void;
  seriesStats?: {
    total: number;
    upcoming: number;
    completed: number;
    totalRevenue: number;
  };
}

const RecurringBadge: React.FC<RecurringBadgeProps> = ({ 
  appointment, 
  variant = 'compact', 
  onClick,
  seriesStats 
}) => {
  // Determine if appointment is recurring
  const isRecurring = appointment.notes?.includes('RECURRING') || 
                     appointment.notes?.includes('Every') ||
                     appointment.notes?.includes('Monthly') ||
                     appointment.notes?.includes('Weekly');

  if (!isRecurring) return null;

  // Extract pattern info
  const getPatternInfo = () => {
    if (!appointment.notes) return 'Series';
    
    // Try to extract frequency info
    const weeklyMatch = appointment.notes.match(/Every (\d+) week/i);
    const monthlyMatch = appointment.notes.match(/Every (\d+) month/i);
    
    if (weeklyMatch) {
      const interval = parseInt(weeklyMatch[1]);
      return interval === 1 ? 'Weekly' : `Every ${interval} weeks`;
    }
    
    if (monthlyMatch) {
      const interval = parseInt(monthlyMatch[1]);
      return interval === 1 ? 'Monthly' : `Every ${interval} months`;
    }
    
    if (appointment.notes.includes('Weekly')) return 'Weekly';
    if (appointment.notes.includes('Monthly')) return 'Monthly';
    
    return 'Series';
  };

  const patternText = getPatternInfo();

  if (variant === 'compact') {
    return (
      <span 
        className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full cursor-pointer hover:bg-blue-200 transition-colors"
        onClick={onClick}
        title="Recurring Appointment - Click to manage series"
      >
        <Repeat className="w-3 h-3 mr-1" />
        {patternText}
      </span>
    );
  }

  if (variant === 'stats' && seriesStats) {
    return (
      <div 
        className="bg-blue-50 border border-blue-200 rounded-lg p-3 cursor-pointer hover:bg-blue-100 transition-colors"
        onClick={onClick}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Repeat className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-800">Recurring Series</span>
          </div>
          <span className="text-xs text-blue-600">{patternText}</span>
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div className="font-semibold text-blue-700">{seriesStats.total}</div>
            <div className="text-blue-600">Total</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-green-700">{seriesStats.upcoming}</div>
            <div className="text-green-600">Upcoming</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-700">${seriesStats.totalRevenue}</div>
            <div className="text-gray-600">Revenue</div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div 
        className="bg-blue-50 border border-blue-200 rounded-lg p-4 cursor-pointer hover:bg-blue-100 transition-colors"
        onClick={onClick}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 text-white rounded-lg">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900">Recurring Appointment</h4>
              <p className="text-sm text-blue-700">Part of a {patternText.toLowerCase()} series</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-blue-600">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>Manage Series</span>
            </div>
          </div>
        </div>

        {seriesStats && (
          <div className="mt-3 pt-3 border-t border-blue-200">
            <div className="grid grid-cols-4 gap-3 text-sm">
              <div className="text-center">
                <div className="font-semibold text-blue-700">{seriesStats.total}</div>
                <div className="text-blue-600">Total</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-green-700">{seriesStats.upcoming}</div>
                <div className="text-green-600">Upcoming</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-700">{seriesStats.completed}</div>
                <div className="text-gray-600">Done</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-emerald-700">${seriesStats.totalRevenue}</div>
                <div className="text-emerald-600">Revenue</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default RecurringBadge;