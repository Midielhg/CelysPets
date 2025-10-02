import React, { useState, useEffect } from 'react';
import { 
  Repeat, 
  Trash2, 
  SkipForward, 
  Edit3, 
  AlertTriangle,
  Calendar,
  X,
  Info,
  Plus,
  Clock,
  Save,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { RecurringAppointmentService } from '../../services/recurringAppointmentManager';
import { useToast } from '../../contexts/ToastContext';
import type { Appointment } from '../../types';

interface RecurringControlsProps {
  appointment: Appointment;
  onAction?: (action: string, data?: any) => void;
  onClose?: () => void;
  onRefresh?: () => void;
  showAdvanced?: boolean;
}

interface RecurrenceModification {
  newTime?: string;
  newDate?: string;
  addOccurrences?: number;
  changeInterval?: number;
  changeFrequency?: 'daily' | 'weekly' | 'monthly';
}

interface SeriesStats {
  total: number;
  completed: number;
  upcoming: number;
  cancelled: number;
  nextAppointment?: any;
  lastAppointment?: any;
}

interface RecurringAction {
  type: 'delete-series' | 'skip-occurrence' | 'modify-series' | 'view-series' | 'extend-series' | 'change-pattern';
  title: string;
  description: string;
  icon: React.ReactNode;
  variant: 'danger' | 'warning' | 'primary' | 'info';
  requiresConfirmation: boolean;
}

const RecurringControls: React.FC<RecurringControlsProps> = ({ 
  appointment,
  onAction,
  onClose
}) => {
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState<string | null>(null);
  const [seriesData, setSeriesData] = useState<any[]>([]);
  const [showSeriesView, setShowSeriesView] = useState(false);
  const [showModifyForm, setShowModifyForm] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [seriesStats, setSeriesStats] = useState<SeriesStats | null>(null);
  const [modificationData, setModificationData] = useState<RecurrenceModification>({});
  const { showToast } = useToast();

  // Load series data and calculate stats when component mounts or appointment changes
  useEffect(() => {
    if (appointment && isRecurring) {
      loadSeriesStats();
    }
  }, [appointment]);

  // Check if this appears to be a recurring appointment
  const isRecurring = appointment.notes?.includes('RECURRING') || 
                     appointment.notes?.includes('Every') ||
                     appointment.notes?.includes('Monthly') ||
                     appointment.notes?.includes('Weekly');

  // Load series statistics and data
  const loadSeriesStats = async () => {
    try {
      const clientId = parseInt(appointment.client.id);
      const recurringPattern = extractRecurringPattern(appointment.notes || '');
      
      const series = await RecurringAppointmentService.getRecurringSeries(
        clientId,
        appointment.time,
        recurringPattern
      );
      
      setSeriesData(series);
      
      // Calculate statistics
      const today = new Date().toISOString().split('T')[0];
      const stats: SeriesStats = {
        total: series.length,
        completed: series.filter(apt => apt.status === 'completed').length,
        upcoming: series.filter(apt => apt.date >= today && apt.status !== 'cancelled').length,
        cancelled: series.filter(apt => apt.status === 'cancelled').length,
        nextAppointment: series.find(apt => apt.date >= today && apt.status !== 'cancelled'),
        lastAppointment: series.filter(apt => apt.date < today).pop()
      };
      
      setSeriesStats(stats);
    } catch (error) {
      console.error('Error loading series stats:', error);
    }
  };

  const recurringActions: RecurringAction[] = [
    {
      type: 'view-series',
      title: 'View Full Series',
      description: 'See all appointments in this recurring series with statistics',
      icon: <Calendar className="w-4 h-4" />,
      variant: 'info',
      requiresConfirmation: false
    },
    {
      type: 'skip-occurrence',
      title: 'Skip This Occurrence',
      description: 'Cancel only this appointment, keep the rest of the series',
      icon: <SkipForward className="w-4 h-4" />,
      variant: 'warning',
      requiresConfirmation: true
    },
    {
      type: 'modify-series',
      title: 'Modify Future Appointments',
      description: 'Change time, add occurrences, or update details for future appointments',
      icon: <Edit3 className="w-4 h-4" />,
      variant: 'primary',
      requiresConfirmation: false
    },
    {
      type: 'extend-series',
      title: 'Extend Series',
      description: 'Add more appointments to extend the recurring series',
      icon: <Plus className="w-4 h-4" />,
      variant: 'primary',
      requiresConfirmation: false
    },
    {
      type: 'change-pattern',
      title: 'Change Recurrence Pattern',
      description: 'Modify the frequency or interval of future appointments',
      icon: <RefreshCw className="w-4 h-4" />,
      variant: 'primary',
      requiresConfirmation: true
    },
    {
      type: 'delete-series',
      title: 'Delete Entire Series',
      description: 'Remove all future appointments in this recurring series',
      icon: <Trash2 className="w-4 h-4" />,
      variant: 'danger',
      requiresConfirmation: true
    }
  ];

  const handleAction = async (actionType: string) => {
    if (recurringActions.find(a => a.type === actionType)?.requiresConfirmation) {
      setShowConfirmation(actionType);
      return;
    }

    await executeAction(actionType);
  };

  const executeAction = async (actionType: string) => {
    setLoading(true);
    try {
      const clientId = parseInt(appointment.client.id);
      const recurringPattern = extractRecurringPattern(appointment.notes || '');

      switch (actionType) {
        case 'view-series':
          const series = await RecurringAppointmentService.getRecurringSeries(
            clientId,
            appointment.time,
            recurringPattern
          );
          setSeriesData(series);
          setShowSeriesView(true);
          break;

        case 'skip-occurrence':
          await RecurringAppointmentService.skipSingleOccurrence(parseInt(appointment.id));
          showToast('Appointment skipped successfully', 'success');
          onAction?.(actionType);
          break;

        case 'delete-series':
          const result = await RecurringAppointmentService.deleteRecurringSeries(
            clientId,
            appointment.time,
            recurringPattern
          );
          showToast(`Deleted ${result.deleted} future appointments`, 'success');
          onAction?.(actionType);
          break;

        case 'modify-series':
          setShowModifyForm(true);
          break;

        case 'extend-series':
          await handleExtendSeries();
          break;

        case 'change-pattern':
          setShowModifyForm(true);
          setModificationData({ changeFrequency: 'weekly', changeInterval: 1 });
          break;
      }
    } catch (error) {
      console.error('Error executing recurring action:', error);
      showToast('Error performing action', 'error');
    } finally {
      setLoading(false);
      setShowConfirmation(null);
    }
  };

  const extractRecurringPattern = (notes: string): string => {
    // Extract recurring pattern from notes
    const patterns = [
      /Every (\d+) (weekly?|monthly?|daily?)/i,
      /(Weekly?|Monthly?|Daily?)/i,
      /RECURRING/i
    ];

    for (const pattern of patterns) {
      const match = notes.match(pattern);
      if (match) return match[0];
    }

    return 'RECURRING';
  };

  const handleExtendSeries = async () => {
    try {
      const additionalOccurrences = modificationData.addOccurrences || 4;
      // This would require extending the RecurringAppointmentService
      showToast(`Would extend series by ${additionalOccurrences} appointments`, 'info');
      onAction?.('extend-series', { occurrences: additionalOccurrences });
    } catch (error) {
      console.error('Error extending series:', error);
      showToast('Error extending series', 'error');
    }
  };

  const handleModifyPattern = async () => {
    try {
      const clientId = parseInt(appointment.client.id);
      const recurringPattern = extractRecurringPattern(appointment.notes || '');
      
      if (modificationData.newTime) {
        await RecurringAppointmentService.modifyFutureOccurrences(
          clientId,
          appointment.time,
          recurringPattern,
          { newTime: modificationData.newTime }
        );
        showToast('Updated appointment times for future occurrences', 'success');
      }

      if (modificationData.changeFrequency || modificationData.changeInterval) {
        showToast('Pattern change functionality requires database updates', 'info');
      }

      onAction?.('modify-series', modificationData);
      setShowModifyForm(false);
    } catch (error) {
      console.error('Error modifying series:', error);
      showToast('Error modifying series', 'error');
    }
  };

  const getActionButtonClass = (variant: string) => {
    const base = "w-full p-3 rounded-lg border transition-all duration-200 flex items-center space-x-3 text-left";
    switch (variant) {
      case 'danger':
        return `${base} border-red-200 hover:border-red-300 hover:bg-red-50 text-red-700`;
      case 'warning':
        return `${base} border-yellow-200 hover:border-yellow-300 hover:bg-yellow-50 text-yellow-700`;
      case 'primary':
        return `${base} border-blue-200 hover:border-blue-300 hover:bg-blue-50 text-blue-700`;
      case 'info':
        return `${base} border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700`;
      default:
        return `${base} border-gray-200 hover:border-gray-300 hover:bg-gray-50`;
    }
  };

  if (!isRecurring) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2 text-gray-600">
          <Info className="w-4 h-4" />
          <span className="text-sm">This appointment is not part of a recurring series.</span>
        </div>
      </div>
    );
  }

  if (showSeriesView) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Recurring Series</h3>
          <button
            onClick={() => setShowSeriesView(false)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Series Statistics */}
        {seriesStats && (
          <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50 rounded-lg border">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{seriesStats.total}</div>
              <div className="text-xs text-blue-700">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{seriesStats.upcoming}</div>
              <div className="text-xs text-green-700">Upcoming</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{seriesStats.completed}</div>
              <div className="text-xs text-gray-700">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{seriesStats.cancelled}</div>
              <div className="text-xs text-red-700">Cancelled</div>
            </div>
          </div>
        )}

        {/* Next Appointment Info */}
        {seriesStats?.nextAppointment && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="font-medium text-green-800">Next Appointment</div>
            <div className="text-sm text-green-700">
              {seriesStats.nextAppointment.date} at {seriesStats.nextAppointment.time}
            </div>
          </div>
        )}
        
        {/* Appointments List */}
        <div className="max-h-60 overflow-y-auto space-y-2">
          {seriesData.map((apt) => (
            <div
              key={apt.id}
              className={`p-3 rounded-lg border ${
                apt.status === 'cancelled' 
                  ? 'bg-red-50 border-red-200' 
                  : apt.status === 'completed'
                  ? 'bg-gray-50 border-gray-200'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{apt.date}</span>
                  <span className="text-sm text-gray-500 ml-2">{apt.time}</span>
                  {apt.total_amount && (
                    <span className="text-sm text-green-600 ml-2">${apt.total_amount}</span>
                  )}
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  apt.status === 'cancelled' 
                    ? 'bg-red-100 text-red-800'
                    : apt.status === 'confirmed'
                    ? 'bg-green-100 text-green-800'
                    : apt.status === 'completed'
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {apt.status}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        <button
          onClick={() => setShowSeriesView(false)}
          className="w-full py-2 text-sm text-gray-600 hover:text-gray-800"
        >
          Back to Controls
        </button>
      </div>
    );
  }

  if (showModifyForm) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Modify Recurring Series</h3>
          <button
            onClick={() => setShowModifyForm(false)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Change Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Change Time for Future Appointments
            </label>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <input
                type="time"
                value={modificationData.newTime || appointment.time}
                onChange={(e) => setModificationData(prev => ({ ...prev, newTime: e.target.value }))}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Add Occurrences */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Extend Series (Add More Appointments)
            </label>
            <div className="flex items-center space-x-2">
              <Plus className="w-4 h-4 text-gray-400" />
              <input
                type="number"
                min="1"
                max="20"
                value={modificationData.addOccurrences || 4}
                onChange={(e) => setModificationData(prev => ({ ...prev, addOccurrences: parseInt(e.target.value) }))}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-20"
              />
              <span className="text-sm text-gray-600">additional appointments</span>
            </div>
          </div>

          {/* Change Pattern */}
          <div>
            <button
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="flex items-center justify-between w-full p-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
            >
              <span>Advanced Pattern Changes</span>
              {showAdvancedOptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {showAdvancedOptions && (
              <div className="mt-2 space-y-3 p-3 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                  <select
                    value={modificationData.changeFrequency || 'weekly'}
                    onChange={(e) => setModificationData(prev => ({ ...prev, changeFrequency: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Interval</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={modificationData.changeInterval || 1}
                    onChange={(e) => setModificationData(prev => ({ ...prev, changeInterval: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Every {modificationData.changeInterval || 1} {modificationData.changeFrequency || 'week'}(s)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex space-x-3 pt-4 border-t">
          <button
            onClick={handleModifyPattern}
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Apply Changes
          </button>
          <button
            onClick={() => setShowModifyForm(false)}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (showConfirmation) {
    const action = recurringActions.find(a => a.type === showConfirmation);
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-yellow-600">
          <AlertTriangle className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Confirm Action</h3>
        </div>
        
        <p className="text-gray-700">
          Are you sure you want to <strong>{action?.title.toLowerCase()}</strong>?
        </p>
        <p className="text-sm text-gray-600">{action?.description}</p>
        
        <div className="flex space-x-3">
          <button
            onClick={() => executeAction(showConfirmation)}
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            {loading ? 'Processing...' : 'Confirm'}
          </button>
          <button
            onClick={() => setShowConfirmation(null)}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 text-blue-600">
        <Repeat className="w-5 h-5" />
        <h3 className="text-lg font-semibold">Recurring Appointment Controls</h3>
      </div>
      
      <p className="text-sm text-gray-600">
        This appointment is part of a recurring series. Choose an action:
      </p>
      
      <div className="space-y-2">
        {recurringActions.map((action) => (
          <button
            key={action.type}
            onClick={() => handleAction(action.type)}
            disabled={loading}
            className={getActionButtonClass(action.variant)}
          >
            <div className="flex-shrink-0">
              {action.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium">{action.title}</div>
              <div className="text-sm opacity-75">{action.description}</div>
            </div>
          </button>
        ))}
      </div>
      
      {onClose && (
        <button
          onClick={onClose}
          className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 border-t pt-4"
        >
          Close
        </button>
      )}
    </div>
  );
};

export default RecurringControls;