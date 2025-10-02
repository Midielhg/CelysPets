import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, Phone, Mail, MessageCircle, Calendar } from 'lucide-react';
import { AppointmentService } from '../../services/appointmentService';
import { DashboardService } from '../../services/dashboardService';

interface PendingAppointment {
  id: number;
  client: {
    name: string;
    email: string;
    phone: string;
  };
  date: string;
  time: string;
  services: any[];
  totalAmount: number;
  daysSincePending: number;
  appointmentDate: Date;
}

interface TodoManagerProps {
  onClose?: () => void;
}

const TodoManager: React.FC<TodoManagerProps> = () => {
  const navigate = useNavigate();
  const [pendingAppointments, setPendingAppointments] = useState<PendingAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactedToday, setContactedToday] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPendingAppointments();
    loadContactedToday();
  }, []);

  const fetchPendingAppointments = async () => {
    try {
      setLoading(true);
      
      // Get today's appointments using the same method as TodaySchedule
      const appointments = await DashboardService.getTodaySchedule() as any[];
      console.log('📋 Today\'s appointments fetched:', appointments.length);
      console.log('📋 Sample appointment:', appointments[0]);
      console.log('📋 All appointment statuses:', [...new Set(appointments.map(apt => apt.status))]);
      console.log('📋 Appointments by status:', appointments.reduce((acc: any, apt: any) => {
        acc[apt.status] = (acc[apt.status] || 0) + 1;
        return acc;
      }, {}));
      
      const pending = appointments
        .filter(apt => {
          console.log('📋 Checking appointment:', apt.id, 'Status:', apt.status, 'Is pending:', apt.status === 'pending');
          return apt.status === 'pending';
        })
        .map(apt => {
          console.log('📋 Processing pending appointment:', apt.id, apt.clients?.name || apt.client?.name, apt.status);
          const createdDate = new Date(apt.created_at);
          const appointmentDate = new Date(apt.date);
          const today = new Date();
          const daysSince = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
          
          // Handle both raw Supabase format (clients) and transformed format (client)
          const clientData = apt.clients || apt.client || {};
          
          return {
            id: apt.id,
            client: {
              name: clientData.name || 'Unknown Client',
              email: clientData.email || '',
              phone: clientData.phone || ''
            },
            date: apt.date,
            time: apt.time,
            services: Array.isArray(apt.services) ? apt.services : [apt.services],
            totalAmount: apt.total_amount || 0,
            daysSincePending: daysSince,
            appointmentDate: appointmentDate
          };
        })
        .sort((a, b) => {
          // Sort by appointment date first, then by time
          const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
          if (dateCompare !== 0) return dateCompare;
          return a.time.localeCompare(b.time);
        });

      console.log('📋 Pending appointments found:', pending.length);
      console.log('📋 Pending appointments data:', pending);
      setPendingAppointments(pending);
      
      // If no pending appointments found, log helpful info
      if (pending.length === 0) {
        console.log('🔍 No pending appointments found. Total appointments:', appointments.length);
        console.log('🔍 Available statuses:', [...new Set(appointments.map((apt: any) => apt.status))]);
      }
    } catch (error) {
      console.error('❌ Error fetching pending appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadContactedToday = () => {
    const today = new Date().toDateString();
    const contacted = localStorage.getItem(`contacted_${today}`);
    if (contacted) {
      setContactedToday(new Set(JSON.parse(contacted)));
    }
  };

  const handleContactMethod = (appointment: PendingAppointment, method: 'phone' | 'email' | 'message') => {
    const today = new Date().toDateString();
    const newContacted = new Set(contactedToday);
    const contactKey = `${appointment.id}_${method}`;
    newContacted.add(contactKey);
    setContactedToday(newContacted);
    
    localStorage.setItem(`contacted_${today}`, JSON.stringify([...newContacted]));
    
    // Open appropriate app based on method
    if (method === 'phone') {
      // Open phone app to call the client
      const phoneNumber = appointment.client.phone.replace(/\D/g, ''); // Remove non-digits
      window.open(`tel:${phoneNumber}`, '_self');
      console.log(`📞 Opening phone app to call ${appointment.client.name} at ${appointment.client.phone}`);
    } else if (method === 'message') {
      // Open SMS app to text the client
      const phoneNumber = appointment.client.phone.replace(/\D/g, ''); // Remove non-digits
      window.open(`sms:${phoneNumber}`, '_self');
      console.log(`💬 Opening SMS app to text ${appointment.client.name} at ${appointment.client.phone}`);
    } else if (method === 'email') {
      // Open email app to email the client
      const subject = encodeURIComponent(`Appointment Confirmation - ${new Date(appointment.date).toLocaleDateString()}`);
      const body = encodeURIComponent(`Hi ${appointment.client.name},\n\nWe wanted to confirm your grooming appointment scheduled for ${new Date(appointment.date).toLocaleDateString()} at ${appointment.time}.\n\nPlease let us know if this time still works for you.\n\nBest regards,\nCely's Pets`);
      window.open(`mailto:${appointment.client.email}?subject=${subject}&body=${body}`, '_self');
      console.log(`📧 Opening email app to email ${appointment.client.name} at ${appointment.client.email}`);
    }
    
    console.log(`📞 Marked appointment ${appointment.id} as contacted via ${method}`);
  };

  const getContactedMethods = (appointmentId: number) => {
    const today = new Date().toDateString();
    const contacted = localStorage.getItem(`contacted_${today}`);
    if (!contacted) return new Set();
    
    const contactedList = JSON.parse(contacted);
    return new Set(contactedList.filter((item: string) => item.startsWith(`${appointmentId}_`)).map((item: string) => item.split('_')[1]));
  };

  const markAsConfirmed = async (appointmentId: number) => {
    try {
      // Update appointment status to confirmed
      await AppointmentService.update(appointmentId, { status: 'confirmed' });
      
      // Remove from pending list
      setPendingAppointments(prev => prev.filter(apt => apt.id !== appointmentId));
      
      console.log(`✅ Appointment ${appointmentId} marked as confirmed`);
    } catch (error) {
      console.error('Error confirming appointment:', error);
    }
  };

  const getPriorityLabel = (daysSince: number) => {
    if (daysSince >= 3) return { label: 'HIGH PRIORITY', color: 'text-red-700 bg-red-100' };
    if (daysSince >= 1) return { label: 'MEDIUM', color: 'text-yellow-700 bg-yellow-100' };
    return { label: 'NEW', color: 'text-blue-700 bg-blue-100' };
  };

  const handleEditAppointment = (appointment: PendingAppointment) => {
    // Store the appointment ID in localStorage so the calendar can auto-open it
    localStorage.setItem('openAppointmentId', appointment.id.toString());
    
    // Navigate to appointments page
    navigate('/admin/appointments');
    
    console.log(`Navigating to appointments page to edit appointment ${appointment.id}`);
  };

  // Group appointments by date
  const groupedAppointments = pendingAppointments.reduce((groups: { [key: string]: PendingAppointment[] }, appointment) => {
    const dateKey = new Date(appointment.date).toDateString();
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(appointment);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading pending appointments...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <CheckSquare className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              <h3 className="text-sm sm:text-lg font-semibold text-gray-900">Customer Contact To-Do</h3>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-red-600 font-medium text-xs sm:text-sm">
                  {pendingAppointments.filter(apt => apt.daysSincePending >= 3).length}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-yellow-600 font-medium text-xs sm:text-sm">
                  {pendingAppointments.filter(apt => apt.daysSincePending >= 1 && apt.daysSincePending < 3).length}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-blue-600 font-medium text-xs sm:text-sm">
                  {pendingAppointments.filter(apt => apt.daysSincePending < 1).length}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="p-3 sm:p-6">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 sm:h-16 bg-gray-100 animate-pulse rounded" />
            ))}
          </div>
        ) : pendingAppointments.length === 0 ? (
          <div className="text-center py-12">
            <CheckSquare className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">All caught up! 🎉</h3>
            <p className="text-gray-600">No pending appointments need confirmation right now.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedAppointments)
              .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
              .map(([dateKey, appointments]) => (
              <div key={dateKey} className="space-y-3">
                {/* Date Header */}
                <div className="flex items-center space-x-2 px-1 sm:px-2 mb-1">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                  <h4 className="text-xs sm:text-sm font-semibold text-gray-700">
                    {new Date(dateKey).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </h4>
                  <span className="text-xs text-gray-500 hidden sm:inline">({appointments.length} appointment{appointments.length !== 1 ? 's' : ''})</span>
                </div>
                
                {/* Appointments for this date */}
                <div className="space-y-2 ml-3 sm:ml-6">
                  {appointments.map((appointment) => {
                      const priority = getPriorityLabel(appointment.daysSincePending);                    return (
                      <div 
                        key={appointment.id} 
                        className="p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        {/* Mobile: Stack everything vertically, Desktop: Side by side */}
                        <div className="flex flex-col space-y-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
                          {/* Main Info Section */}
                          <div 
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => handleEditAppointment(appointment)}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium text-gray-900 text-sm sm:text-base">
                                {appointment.time} - {appointment.client.name}
                              </p>
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ml-2 ${priority.color}`}>
                                {priority.label}
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 mb-1">
                              📞 {appointment.client.phone} • 💰 ${appointment.totalAmount}
                            </p>
                            <p className="text-xs text-gray-500">
                              ✉️ {appointment.client.email}
                            </p>
                          </div>
                          
                          {/* Actions Section */}
                          <div className="flex flex-col space-y-2 sm:ml-4 sm:min-w-max">
                            {/* Contact Methods - Better mobile layout */}
                            <div className="grid grid-cols-3 gap-1 sm:flex sm:space-x-1 sm:gap-0">
                              {(() => {
                                const contactedMethods = getContactedMethods(appointment.id);
                                return (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleContactMethod(appointment, 'phone');
                                      }}
                                      className={`flex items-center justify-center px-2 py-2 sm:py-1 rounded text-xs transition-colors min-h-[32px] sm:min-h-0 ${
                                        contactedMethods.has('phone') 
                                          ? 'bg-slate-200 text-slate-700 border border-slate-300' 
                                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                                      }`}
                                      title={contactedMethods.has('phone') ? 'Called (click to call again)' : 'Call client'}
                                    >
                                      <Phone className="h-3 w-3 sm:mr-1" />
                                      <span className="hidden sm:inline ml-1">{contactedMethods.has('phone') ? '✓' : ''} Call</span>
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleContactMethod(appointment, 'message');
                                      }}
                                      className={`flex items-center justify-center px-2 py-2 sm:py-1 rounded text-xs transition-colors min-h-[32px] sm:min-h-0 ${
                                        contactedMethods.has('message') 
                                          ? 'bg-emerald-200 text-emerald-700 border border-emerald-300' 
                                          : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200 border border-emerald-200'
                                      }`}
                                      title={contactedMethods.has('message') ? 'Texted (click to text again)' : 'Send message to client'}
                                    >
                                      <MessageCircle className="h-3 w-3 sm:mr-1" />
                                      <span className="hidden sm:inline ml-1">{contactedMethods.has('message') ? '✓' : ''} Text</span>
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleContactMethod(appointment, 'email');
                                      }}
                                      className={`flex items-center justify-center px-2 py-2 sm:py-1 rounded text-xs transition-colors min-h-[32px] sm:min-h-0 ${
                                        contactedMethods.has('email') 
                                          ? 'bg-purple-200 text-purple-700 border border-purple-300' 
                                          : 'bg-purple-100 text-purple-600 hover:bg-purple-200 border border-purple-200'
                                      }`}
                                      title={contactedMethods.has('email') ? 'Emailed (click to email again)' : 'Email client'}
                                    >
                                      <Mail className="h-3 w-3 sm:mr-1" />
                                      <span className="hidden sm:inline ml-1">{contactedMethods.has('email') ? '✓' : ''} Email</span>
                                    </button>
                                  </>
                                );
                              })()}
                            </div>
                            
                            {/* Action Buttons Row */}
                            <div className="flex space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditAppointment(appointment);
                                }}
                                className="flex items-center justify-center px-3 py-2 bg-amber-100 text-amber-700 rounded text-xs font-medium hover:bg-amber-200 border border-amber-200 transition-colors flex-1 sm:flex-none min-h-[32px]"
                                title="View/Edit appointment"
                              >
                                <Calendar className="h-3 w-3 mr-1" />
                                <span className="sm:hidden">View</span>
                                <span className="hidden sm:inline">Edit</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsConfirmed(appointment.id);
                                }}
                                className="flex items-center justify-center px-3 py-2 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200 border border-green-200 transition-colors flex-1 min-h-[32px]"
                                title="Mark appointment as confirmed"
                              >
                                <CheckSquare className="h-3 w-3 mr-1" />
                                <span className="sm:hidden">Confirm</span>
                                <span className="hidden sm:inline">Mark Confirmed</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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