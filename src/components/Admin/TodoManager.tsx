import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Phone, MessageCircle, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { AppointmentService } from '../../services/appointmentService';
import { DashboardService } from '../../services/dashboardService';

interface PendingAppointment {
  id: number;
  client_id: number;
  groomer_id: number | null;
  services: any;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string | null;
  total_amount?: number | null;
  promo_code_id?: number | null;
  // Enhanced properties for display
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  phone: string; // Add phone property
  email: string; // Add email property
  petName: string;
  service: string;
  totalAmount?: number;
  isNew?: boolean;
}

interface TodoManagerProps {
  onClose?: () => void;
}

const TodoManager: React.FC<TodoManagerProps> = ({ onClose }) => {
  const [pendingAppointments, setPendingAppointments] = useState<PendingAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [contactMethods, setContactMethods] = useState<Map<number, Set<string>>>(new Map());
  const [openStatusDropdown, setOpenStatusDropdown] = useState<number | null>(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    loadPendingAppointments();
    
    // Set up auto-refresh every 30 seconds to keep data current
    const interval = setInterval(() => {
      loadPendingAppointments();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (openStatusDropdown && !target.closest('.status-dropdown')) {
        setOpenStatusDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openStatusDropdown]);

  const loadPendingAppointments = async () => {
    try {
      // Only set loading to true on initial load, not on refresh
      if (!isRefreshing) {
        setIsLoading(true);
      }
      
      // Use exact same pattern as Today's Schedule
      console.log('TodoManager: Fetching pending appointments from Supabase...');
      const pendingAppointments = await DashboardService.getPendingAppointments();
      console.log('TodoManager: Received pending appointments:', pendingAppointments);
      
      // Create PendingAppointments with enhanced data
      const pendingWithDetails: PendingAppointment[] = pendingAppointments.map((appointment, index) => {
        // Parse services
        let servicesList: string[] = [];
        try {
          if (typeof appointment.services === 'string') {
            servicesList = JSON.parse(appointment.services);
          } else if (Array.isArray(appointment.services)) {
            servicesList = appointment.services.map(s => String(s));
          }
        } catch (e) {
          console.warn('Failed to parse services for appointment', appointment.id);
        }
        
        // Get client data from DashboardService response (clients is an object, not array)
        const clientData = (appointment as any).clients;
        const petData = clientData?.pets ? (Array.isArray(clientData.pets) ? clientData.pets[0] : clientData.pets) : null;
        
        return {
          // Add required fields for PendingAppointment interface
          id: appointment.id,
          client_id: clientData?.id || 0, // Get from clients relation or default
          groomer_id: appointment.groomer_id,
          services: appointment.services,
          date: appointment.date,
          time: appointment.time,
          status: appointment.status,
          notes: null,
          total_amount: appointment.total_amount,
          promo_code_id: null,
          // Enhanced display properties
          clientName: clientData?.name || 'Unknown Client',
          clientPhone: clientData?.phone || '',
          clientEmail: clientData?.email || '',
          phone: clientData?.phone || '',
          email: clientData?.email || '',
          petName: petData?.name || 'Pet',
          service: servicesList[0] || 'Grooming Service',
          totalAmount: appointment.total_amount || 0,
          isNew: index < 5 // Mark first 5 as new for demo
        };
      });
      
      setPendingAppointments(pendingWithDetails);
    } catch (error) {
      console.error('Error loading pending appointments:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };  const handleContactMethod = (appointment: PendingAppointment, method: 'phone' | 'email' | 'message') => {
    const appointmentMethods = contactMethods.get(appointment.id) || new Set();
    appointmentMethods.add(method);
    
    const newContactMethods = new Map(contactMethods);
    newContactMethods.set(appointment.id, appointmentMethods);
    setContactMethods(newContactMethods);

    // Open respective apps
    if (method === 'phone' && appointment.phone) {
      window.open(`tel:${appointment.phone}`);
      showToast(`Calling ${appointment.clientName}...`, 'success');
    } else if (method === 'message' && appointment.phone) {
      const message = `Hi ${appointment.clientName}, this is CelysPets regarding ${appointment.petName}'s ${appointment.service} appointment on ${appointment.date} at ${appointment.time}. Please confirm your appointment.`;
      window.open(`sms:${appointment.phone}?body=${encodeURIComponent(message)}`);
      showToast(`Opening message to ${appointment.clientName}...`, 'success');
    } else if (method === 'email' && appointment.email) {
      const subject = `Appointment Confirmation - ${appointment.petName}`;
      const body = `Hi ${appointment.clientName},\n\nWe wanted to confirm ${appointment.petName}'s ${appointment.service} appointment scheduled for ${appointment.date} at ${appointment.time}.\n\nPlease reply to confirm or call us if you need to reschedule.\n\nThank you!\nCelysPets Team`;
      window.open(`mailto:${appointment.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
      showToast(`Opening email to ${appointment.clientName}...`, 'success');
    }
  };

    const handleStatusChange = async (appointmentId: number, newStatus: string) => {
    try {
      setOpenStatusDropdown(null);
      setIsRefreshing(true);
      
      // Find the appointment name for the toast message
      const updatedAppointment = pendingAppointments.find(
        apt => apt.id === appointmentId
      );
      
      // Update appointment status
      await AppointmentService.updateStatus(appointmentId, newStatus as any);
      
      // Show success message
      if (updatedAppointment) {
        showToast(`Appointment for ${updatedAppointment.clientName} updated to ${newStatus}`, 'success');
      }
      
      // Automatically refresh the pending appointments list
      await loadPendingAppointments();
      
    } catch (error) {
      console.error('Error updating appointment status:', error);
      showToast('Failed to update appointment status', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAppointmentClick = (appointmentId: number) => {
    localStorage.setItem('editAppointmentId', appointmentId.toString());
    navigate('/admin/appointments');
    onClose?.();
  };

  const getContactedMethods = (appointmentId: number): Set<string> => {
    return contactMethods.get(appointmentId) || new Set();
  };

  const groupAppointmentsByDate = (appointments: PendingAppointment[]) => {
    const groups: { [key: string]: PendingAppointment[] } = {};
    
    appointments.forEach(appointment => {
      const date = appointment.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(appointment);
    });

    // Sort dates
    const sortedDates = Object.keys(groups).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    
    const result: { [key: string]: PendingAppointment[] } = {};
    sortedDates.forEach(date => {
      // Sort appointments within each date by time
      result[date] = groups[date].sort((a, b) => a.time.localeCompare(b.time));
    });

    return result;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const groupedAppointments = groupAppointmentsByDate(pendingAppointments);

  const getStatusCounts = () => {
    const counts = { red: 0, yellow: 0, blue: 0 };
    pendingAppointments.forEach(apt => {
      if (apt.status === 'pending') counts.red++;
      else if (apt.status === 'confirmed') counts.yellow++;
      // Add other status mappings as needed
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="bg-white rounded-xl shadow-lg h-[600px] flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Customer Contact To-Do</h2>
            {isRefreshing && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Updating...</span>
              </div>
            )}
          </div>
          
          {/* Status Counts */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium">{statusCounts.red}</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-sm font-medium">{statusCounts.yellow}</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium">{statusCounts.blue}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {pendingAppointments.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
            <p className="text-gray-600">No pending appointments need your attention right now.</p>
            <p className="text-gray-500 text-sm mt-2">Check the browser console for loading details</p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {Object.entries(groupedAppointments).map(([date, appointments]) => (
              <div key={date} className="space-y-3">
                <div className="flex items-center space-x-2 mb-3">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <h3 className="font-medium text-gray-900 text-sm sm:text-base">{formatDate(date)}</h3>
                  <div className="h-px bg-gray-200 flex-1"></div>
                </div>
                
                <div className="space-y-3 sm:space-y-4">
                  {appointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      onClick={() => handleAppointmentClick(appointment.id)}
                      className="p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <div className="flex flex-row items-start justify-between">
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                            {appointment.time} - {appointment.clientName}
                            {appointment.isNew && (
                              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                New
                              </span>
                            )}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">
                            🐕 {appointment.petName} • {appointment.service}
                            {appointment.totalAmount && ` • $${appointment.totalAmount}`}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            📞 {appointment.phone || 'No phone'} • ✉️ {appointment.email || 'No email'}
                          </p>
                        </div>

                        {/* Contact Buttons and Status */}
                        <div className="flex flex-col items-end space-y-1.5 flex-shrink-0">
                            {/* Contact Action Buttons */}
                            <div className="flex items-center space-x-1">
                              {(() => {
                                const contactedMethods = getContactedMethods(appointment.id);
                                return (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleContactMethod(appointment, 'phone');
                                      }}
                                      className={`flex items-center justify-center p-2 rounded-lg text-xs transition-colors ${
                                        contactedMethods.has('phone') 
                                          ? 'bg-gray-300 text-gray-700' 
                                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                      }`}
                                      title="Call client"
                                    >
                                      <Phone className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleContactMethod(appointment, 'message');
                                      }}
                                      className={`flex items-center justify-center p-2 rounded-lg text-xs transition-colors ${
                                        contactedMethods.has('message') 
                                          ? 'bg-gray-300 text-gray-700' 
                                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                      }`}
                                      title="Send message"
                                    >
                                      <MessageCircle className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleContactMethod(appointment, 'email');
                                      }}
                                      className={`flex items-center justify-center p-2 rounded-lg text-xs transition-colors ${
                                        contactedMethods.has('email') 
                                          ? 'bg-gray-300 text-gray-700' 
                                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                      }`}
                                      title="Send email"
                                    >
                                      <Mail className="h-4 w-4" />
                                    </button>
                                  </>
                                );
                              })()}
                            </div>
                            
                            {/* Status Dropdown */}
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenStatusDropdown(openStatusDropdown === appointment.id ? null : appointment.id);
                                }}
                                className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap cursor-pointer hover:opacity-80 ${
                                  appointment.status === 'confirmed' ? 'text-blue-800 bg-blue-100' :
                                  appointment.status === 'pending' ? 'text-yellow-800 bg-yellow-100' :
                                  appointment.status === 'completed' ? 'text-green-800 bg-green-100' : 'text-gray-800 bg-gray-100'
                                }`}
                              >
                                {appointment.status}
                              </button>
                              
                              {/* Status Dropdown Menu */}
                              {openStatusDropdown === appointment.id && (
                                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200 p-1 z-50 min-w-[140px]">
                                  {(['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'] as const).map((status) => (
                                    <button
                                      key={status}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleStatusChange(appointment.id, status);
                                      }}
                                      className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                                        appointment.status === status
                                          ? 'bg-blue-100 text-blue-700 font-medium'
                                          : 'hover:bg-gray-100 text-gray-700'
                                      }`}
                                    >
                                      <span className="flex items-center space-x-2">
                                        <span>
                                          {status === 'pending' && '⏳'}
                                          {status === 'confirmed' && '✅'}
                                          {status === 'in-progress' && '🔄'}
                                          {status === 'completed' && '🎉'}
                                          {status === 'cancelled' && '❌'}
                                        </span>
                                        <span className="capitalize">{status.replace('-', ' ')}</span>
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoManager;
