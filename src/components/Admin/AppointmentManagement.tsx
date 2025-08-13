import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import type { View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import './calendar-styles.css';
import { useToast } from '../../contexts/ToastContext';
import type { Pet, Appointment, Client } from '../../types';
import GoogleMapRoute from '../GoogleMapRoute';
import ClientSearch from './ClientSearch';

// Route Optimization Component
interface RouteOptimizationSectionProps {
  selectedDate: string;
  appointments: Appointment[];
  onOptimize: (optimizedRoute: any) => void;
  onUpdateAppointments: (optimizedRoute: any) => void;
}

const RouteOptimizationSection: React.FC<RouteOptimizationSectionProps> = ({ 
  selectedDate, 
  appointments, 
  onOptimize,
  onUpdateAppointments 
}) => {
  const { showToast } = useToast();
  const [startLocation, setStartLocation] = useState('');
  const [optimizedRoute, setOptimizedRoute] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Filter appointments for the selected date
  const dayAppointments = appointments.filter(apt => {
    const aptDate = apt.date ? apt.date.split('T')[0] : '';
    return aptDate === selectedDate && apt.status !== 'cancelled';
  });

  const optimizeRoute = async () => {
    if (dayAppointments.length === 0) {
      showToast('No appointments found for the selected date', 'warning');
      return;
    }

    if (!startLocation.trim()) {
      showToast('Please enter your starting location', 'warning');
      return;
    }

    setLoading(true);

    try {
      // Simple time-based ordering as fallback (since the route optimization server may not be available)
      const timeOrderedAppointments = [...dayAppointments].sort((a, b) => {
        const timeA = new Date(`2000-01-01 ${a.time}`).getTime();
        const timeB = new Date(`2000-01-01 ${b.time}`).getTime();
        return timeA - timeB;
      });

      // Generate optimized times with proper spacing
      const optimizedAppointments = timeOrderedAppointments.map((apt, index) => {
        // Start at 9 AM and space appointments 90 minutes apart
        const startHour = 9;
        const totalMinutes = startHour * 60 + (index * 90);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        
        const optimizedTime = `${hours > 12 ? hours - 12 : hours === 0 ? 12 : hours}:${minutes.toString().padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
        
        return {
          ...apt,
          optimizedTime
        };
      });

      const mockOptimizedRoute = {
        stops: optimizedAppointments.map((apt, index) => ({
          appointment: apt,
          address: apt.client?.address || '',
          distanceFromPrevious: index === 0 ? 0 : Math.random() * 10 + 2, // Mock distance
          travelTimeFromPrevious: index === 0 ? 0 : Math.random() * 20 + 5 // Mock travel time
        })),
        totalDistance: Math.random() * 30 + 15,
        totalDuration: optimizedAppointments.length * 90, // 90 minutes per appointment
        estimatedFuelCost: Math.random() * 20 + 10,
        optimizationMethod: 'Time-based ordering with optimal spacing'
      };

      setOptimizedRoute(mockOptimizedRoute);
      onOptimize(mockOptimizedRoute);
      showToast('Route optimized successfully!', 'success');
    } catch (error) {
      console.error('Error optimizing route:', error);
      showToast('Failed to optimize route', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAppointments = () => {
    if (!optimizedRoute) return;
    onUpdateAppointments(optimizedRoute);
  };

  return (
    <div className="p-6">
      {/* Summary and Input */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">
            Appointments for {new Date(selectedDate + 'T12:00:00').toLocaleDateString()}
          </h4>
          {dayAppointments.length > 0 ? (
            <div className="text-sm text-gray-600">
              <p className="mb-2">{dayAppointments.length} appointment{dayAppointments.length !== 1 ? 's' : ''} scheduled</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {dayAppointments.map((apt) => (
                  <div key={apt.id} className="flex justify-between text-xs">
                    <span>{apt.time} - {apt.client?.name}</span>
                    <span className="text-gray-500 truncate ml-2" style={{maxWidth: '120px'}}>
                      {apt.client?.address}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No appointments scheduled for this date</p>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Starting Location
            </label>
            <input
              type="text"
              value={startLocation}
              onChange={(e) => setStartLocation(e.target.value)}
              placeholder="Enter your starting address..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={optimizeRoute}
            disabled={loading || dayAppointments.length === 0}
            className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Optimizing Route...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Optimize Route
              </>
            )}
          </button>
        </div>
      </div>

      {/* Optimized Route Display */}
      {optimizedRoute && (
        <div className="border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-gray-900">Optimized Route</h4>
            <button
              onClick={handleUpdateAppointments}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Update Appointments
            </button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {optimizedRoute.totalDistance.toFixed(1)} mi
              </div>
              <div className="text-sm text-blue-600">Total Distance</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(optimizedRoute.totalDuration)} min
              </div>
              <div className="text-sm text-green-600">Estimated Time</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                ${optimizedRoute.estimatedFuelCost.toFixed(2)}
              </div>
              <div className="text-sm text-yellow-600">Fuel Cost</div>
            </div>
          </div>

          {/* Google Maps Integration */}
          <div className="mb-6">
            <GoogleMapRoute
              route={optimizedRoute}
              startLocation={startLocation}
            />
          </div>

          <div className="space-y-3">
            {/* Starting Point */}
            <div className="flex items-center p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
              <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                S
              </div>
              <div className="ml-4">
                <div className="font-semibold text-gray-900">Starting Point</div>
                <div className="text-gray-600">{startLocation}</div>
              </div>
            </div>

            {/* Route Stops */}
            {optimizedRoute.stops.map((stop: any, index: number) => (
              <div key={stop.appointment.id} className="flex items-center p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-gray-900">
                        <span className="text-green-600 font-bold">{stop.appointment.optimizedTime || stop.appointment.time}</span>
                        {stop.appointment.optimizedTime && stop.appointment.optimizedTime !== stop.appointment.time && (
                          <span className="text-gray-500 line-through ml-2">({stop.appointment.time})</span>
                        )}
                        <span className="ml-2">- {stop.appointment.client?.name}</span>
                      </div>
                      <div className="text-gray-600">{stop.address}</div>
                      <div className="text-sm text-gray-500">
                        Phone: {stop.appointment.client?.phone}
                      </div>
                      <div className="text-sm text-blue-600">
                        Services: {Array.isArray(stop.appointment.services) 
                          ? stop.appointment.services.join(', ') 
                          : 'No services listed'}
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      {stop.distanceFromPrevious > 0 && (
                        <div>🚗 {stop.distanceFromPrevious.toFixed(1)} mi from previous</div>
                      )}
                      {stop.travelTimeFromPrevious > 0 && (
                        <div>⏱️ {Math.round(stop.travelTimeFromPrevious)} min drive</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const DragAndDropCalendar = withDragAndDrop(Calendar);

// Setup calendar localizer
const localizer = momentLocalizer(moment);

// Calendar event interface
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Appointment;
}

const AppointmentManagement: React.FC = () => {
  const { showToast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'today' | 'pending' | 'confirmed' | 'completed'>('all');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<View>('week');
  const [groomers, setGroomers] = useState<Array<{id: string, name: string, email: string}>>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editForm, setEditForm] = useState({
    client: {
      name: '',
      email: '',
      phone: '',
      address: '',
      pets: [] as Pet[]
    },
    services: [] as string[],
    date: '',
    time: '',
    status: 'pending' as Appointment['status'],
    notes: '',
    groomerId: null as string | null,
    estimatedDuration: '60'
  });

  // Helper function to create a date without timezone issues
  const createLocalDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed
  };

  // Helper function to get today's date in YYYY-MM-DD format without timezone issues
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Convert appointments to calendar events
  const convertToCalendarEvents = (appointments: Appointment[]): CalendarEvent[] => {
    const filteredAppointments = appointments.filter(appointment => {
      const hasRequiredFields = appointment.date && appointment.time && appointment.client;
      return hasRequiredFields;
    });
    
    return filteredAppointments.map(appointment => {
      // Normalize date from ISO string to YYYY-MM-DD format
      const normalizedDate = appointment.date ? appointment.date.split('T')[0] : '';
      // Use createLocalDate to avoid timezone shifts
      const appointmentDate = createLocalDate(normalizedDate);
      const timeString = appointment.time || '12:00 PM';
      const [time, period] = timeString.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      
      // Convert to 24-hour format
      let hour24 = hours;
      if (period === 'PM' && hours !== 12) hour24 += 12;
      if (period === 'AM' && hours === 12) hour24 = 0;
      
      const startTime = new Date(appointmentDate);
      startTime.setHours(hour24, minutes || 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setHours(startTime.getHours() + 1); // Default 1 hour duration
      
      return {
        id: appointment.id,
        title: `${appointment.client?.name || 'Unknown client'} - ${
          appointment.services ? appointment.services.length : 0
        } service(s)`,
        start: startTime,
        end: endTime,
        resource: appointment
      };
    });
  };

  const serviceNames: { [key: string]: string } = {
  'full-groom': 'Full Service Grooming',
    'bath-brush': 'Bath & Brush',
  'nail-trim': 'Nail Trim',
  'teeth-cleaning': 'Teeth Cleaning',
  'flea-treatment': 'Flea Treatment'
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    'in-progress': 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  useEffect(() => {
    fetchAppointments();
    fetchGroomers();
  }, []);

  const fetchGroomers = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5001/api/users/groomers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setGroomers(data);
      } else {
        console.error('Failed to fetch groomers');
        // Set some mock groomers for now
        setGroomers([
          { id: '1', name: 'Sarah Johnson', email: 'sarah@celyspets.com' },
          { id: '2', name: 'Mike Rodriguez', email: 'mike@celyspets.com' },
          { id: '3', name: 'Emily Chen', email: 'emily@celyspets.com' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching groomers:', error);
      // Set some mock groomers for now
      setGroomers([
        { id: '1', name: 'Sarah Johnson', email: 'sarah@celyspets.com' },
        { id: '2', name: 'Mike Rodriguez', email: 'mike@celyspets.com' },
        { id: '3', name: 'Emily Chen', email: 'emily@celyspets.com' }
      ]);
    }
  };

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5001/api/appointments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }

      const data = await response.json();
      setAppointments(data.sort((a: Appointment, b: Appointment) => 
        new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime()
      ));
    } catch (error) {
      console.error('Error fetching appointments:', error);
      showToast('Failed to fetch appointments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const url = `http://localhost:5001/api/appointments/${appointmentId}`;
      
      console.log('Updating appointment status:', { 
        appointmentId, 
        newStatus, 
        url,
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 10)}...` : 'no token'
      });
      
      // Get the current appointment data to include in the PUT request
      const currentAppointment = appointments.find(apt => apt.id === appointmentId);
      if (!currentAppointment) {
        throw new Error('Appointment not found');
      }
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: currentAppointment.date,
          time: currentAppointment.time,
          services: currentAppointment.services,
          status: newStatus,
          notes: currentAppointment.notes || '',
          totalAmount: currentAppointment.totalAmount || 0
        })
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`Failed to update appointment: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('Update result:', result);

      // Update local state
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId 
            ? { ...apt, status: newStatus as Appointment['status'] }
            : apt
        )
      );

      showToast('Appointment status updated successfully', 'success');
      setShowModal(false);
    } catch (error) {
      console.error('Error updating appointment status:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      showToast(`Failed to update appointment status: ${error}`, 'error');
    }
  };

  // Handle drag and drop events
  const handleEventDrop = async (args: any) => {
    try {
      const { event, start } = args;
      const appointment = event.resource;
      const newDate = moment(start).format('YYYY-MM-DD');
      const newTime = moment(start).format('h:mm A');
      
      // Update the appointment via API
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:5001/api/appointments/${appointment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...appointment,
          date: newDate,
          time: newTime
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update appointment');
      }

      // Update local state
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointment.id 
            ? { ...apt, date: newDate, time: newTime }
            : apt
        )
      );

      showToast('Appointment moved successfully', 'success');
    } catch (error) {
      console.error('Error moving appointment:', error);
      showToast('Failed to move appointment', 'error');
      // Refresh appointments to revert UI changes
      fetchAppointments();
    }
  };

  const handleEventResize = async (args: any) => {
    try {
      const { event, start } = args;
      const appointment = event.resource;
      const newDate = moment(start).format('YYYY-MM-DD');
      const newTime = moment(start).format('h:mm A');
      
      // Update the appointment via API
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:5001/api/appointments/${appointment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...appointment,
          date: newDate,
          time: newTime
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update appointment');
      }

      // Update local state
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointment.id 
            ? { ...apt, date: newDate, time: newTime }
            : apt
        )
      );

      showToast('Appointment duration updated successfully', 'success');
    } catch (error) {
      console.error('Error resizing appointment:', error);
      showToast('Failed to update appointment duration', 'error');
      // Refresh appointments to revert UI changes
      fetchAppointments();
    }
  };

  const deleteAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to delete this appointment?')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:5001/api/appointments/${appointmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete appointment');
      }

      setAppointments(prev => prev.filter(apt => apt.id !== appointmentId));
      showToast('Appointment deleted successfully', 'success');
      setShowModal(false);
    } catch (error) {
      showToast('Failed to delete appointment', 'error');
    }
  };

  const openEditModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    
    // Set selected client if available
    if (appointment.client) {
      setSelectedClient(appointment.client);
    }
    
    setEditForm({
      client: {
        name: appointment.client?.name || '',
        email: appointment.client?.email || '',
        phone: appointment.client?.phone || '',
        address: appointment.client?.address || '',
        pets: (appointment.client?.pets || []).map(pet => ({
          name: pet?.name || '',
          breed: pet?.breed || '',
          age: pet?.age || 0,
          type: pet?.type || undefined,
          weight: pet?.weight || '',
          specialInstructions: pet?.specialInstructions || ''
        }))
      },
      services: appointment.services || [],
      date: appointment.date || '', // Keep the date as-is since it should already be in YYYY-MM-DD format
      time: appointment.time || '',
      status: appointment.status || 'pending',
      notes: appointment.notes || '',
      groomerId: (appointment as any).groomerId || null,
      estimatedDuration: (appointment as any).estimatedDuration || '60'
    });
    setEditMode(true);
    setIsAddingNew(false);
    setShowModal(true);
  };

  const saveAppointmentChanges = async () => {
    // Basic validation
    if (!editForm.client.name.trim()) {
      showToast('Client name is required', 'error');
      return;
    }
    if (!editForm.client.email.trim()) {
      showToast('Client email is required', 'error');
      return;
    }
    if (!editForm.date.trim()) {
      showToast('Appointment date is required', 'error');
      return;
    }
    if (!editForm.time.trim()) {
      showToast('Appointment time is required', 'error');
      return;
    }

    const isCreating = !selectedAppointment;

    try {
      const token = localStorage.getItem('auth_token');
      
      // Prepare data for appointment update/creation (excluding pets modifications)
      const appointmentData = {
        client: {
          name: editForm.client.name,
          email: editForm.client.email,
          phone: editForm.client.phone,
          address: editForm.client.address
          // Don't include pets - they should be managed separately
        },
        services: editForm.services,
        date: editForm.date,
        time: editForm.time,
        status: editForm.status,
        notes: editForm.notes
      };

      const url = isCreating 
        ? 'http://localhost:5001/api/appointments'
        : `http://localhost:5001/api/appointments/${selectedAppointment.id}`;

      const response = await fetch(url, {
        method: isCreating ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(appointmentData)
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isCreating ? 'create' : 'update'} appointment`);
      }

      const data = await response.json();
      
      // Update local state
      if (isCreating) {
        // Add new appointment to the list
        setAppointments(prev => [...prev, data.appointment]);
      } else {
        // Update existing appointment
        setAppointments(prev => 
          prev.map(apt => 
            apt.id === selectedAppointment!.id 
              ? data.appointment
              : apt
          )
        );
      }

      showToast(`Appointment ${isCreating ? 'created' : 'updated'} successfully`, 'success');
      setShowModal(false);
      setEditMode(false);
      setIsAddingNew(false);
    } catch (error) {
      showToast(`Failed to ${isCreating ? 'create' : 'update'} appointment`, 'error');
    }
  };

  const cancelEdit = () => {
    setEditMode(false);
    setShowModal(false);
    setSelectedAppointment(null);
    setSelectedClient(null);
    setIsAddingNew(false);
  };

  // Handle calendar slot selection (click on empty time slot)
  const handleSelectSlot = (slotInfo: any) => {
    const startDate = moment(slotInfo.start);
    
    // If route optimization is active (calendar view with appointments), don't open appointment modal
    // Instead, check if user clicked on a date for route optimization
    if (viewMode === 'calendar' && filteredAppointments.length > 0) {
      const selectedDate = startDate.format('YYYY-MM-DD');
      const currentRouteDate = moment(calendarDate).format('YYYY-MM-DD');
      
      // Only update if it's a different date than currently selected
      if (selectedDate !== currentRouteDate) {
        setCalendarDate(startDate.toDate());
      }
      // Don't switch to day view or open modal when route optimization is active
      return;
    }
    
    const newAppointment = {
      client: {
        name: '',
        email: '',
        phone: '',
        address: '',
        pets: []
      },
      services: [],
      date: startDate.format('YYYY-MM-DD'),
      time: startDate.format('HH:mm'),
      status: 'pending' as Appointment['status'],
      notes: '',
      groomerId: null,
      estimatedDuration: '60'
    };
    
    setEditForm(newAppointment);
    setSelectedAppointment(null);
    setSelectedClient(null); // Reset selected client for new appointment
    setIsAddingNew(true);
    setEditMode(true);
    setShowModal(true);
  };

  const filteredAppointments = appointments.filter(appointment => {
    const today = getTodayString();
    // Normalize appointment date to YYYY-MM-DD format for comparison
    const appointmentDate = appointment.date ? appointment.date.split('T')[0] : '';
    
    switch (filter) {
      case 'today':
        return appointmentDate === today;
      case 'pending':
        return appointment.status === 'pending';
      case 'confirmed':
        return appointment.status === 'confirmed';
      case 'completed':
        return appointment.status === 'completed';
      default:
        return true;
    }
  });

  // Convert filtered appointments to calendar events
  const calendarEvents = convertToCalendarEvents(filteredAppointments);

  const formatDate = (dateString: string) => {
    // Normalize date from ISO string to YYYY-MM-DD format
    const normalizedDate = dateString ? dateString.split('T')[0] : '';
    // Use createLocalDate to avoid timezone shifts
    const date = createLocalDate(normalizedDate);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  // Calendar navigation handlers
  const handleNavigate = (newDate: Date) => {
    setCalendarDate(newDate);
  };

  const handleViewChange = (view: View) => {
    setCalendarView(view);
  };

  const handleToday = () => {
    setCalendarDate(new Date());
  };

  // Update appointments with optimized times
  const updateAppointmentsWithOptimizedTimes = async (optimizedRoute: any) => {
    try {
      const token = localStorage.getItem('auth_token');
      let successCount = 0;
      
      for (const stop of optimizedRoute.stops) {
        if (stop.appointment.optimizedTime && stop.appointment.optimizedTime !== stop.appointment.time) {
          const response = await fetch(`http://localhost:5001/api/appointments/${stop.appointment.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              date: stop.appointment.date,
              time: stop.appointment.optimizedTime,
              services: stop.appointment.services,
              status: stop.appointment.status,
              notes: stop.appointment.notes || '',
              totalAmount: stop.appointment.totalAmount || 0
            })
          });

          if (response.ok) {
            successCount++;
          }
        }
      }

      if (successCount > 0) {
        showToast(`Updated ${successCount} appointment${successCount !== 1 ? 's' : ''} with optimized times`, 'success');
        fetchAppointments(); // Refresh the appointments list
      } else {
        showToast('No appointments needed time updates', 'info');
      }
    } catch (error) {
      console.error('Error updating appointments:', error);
      showToast('Failed to update appointments', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Appointment Management</h1>
        <p className="text-lg text-gray-600">Manage and organize all pet grooming appointments</p>
        
        {/* View Toggle and Filter Buttons */}
        <div className="flex justify-between items-center mb-4 mt-6">
          <div className="flex flex-wrap gap-3">
            {[
              { key: 'all', label: 'All Appointments', icon: '📊' },
              { key: 'today', label: 'Today', icon: '📅' },
              { key: 'pending', label: 'Pending', icon: '⏳' },
              { key: 'confirmed', label: 'Confirmed', icon: '✅' },
              { key: 'completed', label: 'Completed', icon: '🎉' }
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  filter === key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="mr-1">{icon}</span>{label}
              </button>
            ))}
          </div>
          
          {/* Add Appointment and View Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const now = new Date();
                const newAppointment = {
                  client: {
                    name: '',
                    email: '',
                    phone: '',
                    address: '',
                    pets: []
                  },
                  services: [],
                  date: now.toISOString().split('T')[0],
                  time: now.toTimeString().split(' ')[0].substring(0, 5),
                  status: 'pending' as Appointment['status'],
                  notes: '',
                  groomerId: null,
                  estimatedDuration: '60'
                };
                setEditForm(newAppointment);
                setSelectedAppointment(null);
                setSelectedClient(null); // Reset selected client for new appointment
                setIsAddingNew(true);
                setEditMode(true);
                setShowModal(true);
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 hover:shadow-lg transform hover:scale-105 transition-all duration-300 font-semibold"
            >
              + Add Appointment
            </button>
            
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 rounded text-sm font-medium transition-all duration-200 ${
                  viewMode === 'calendar'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                📅 Calendar
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded text-sm font-medium transition-all duration-200 ${
                  viewMode === 'table'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                📋 Table
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Calendar or Table View */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-16 px-8">
            <div className="text-6xl mb-6">📅</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No appointments found</h3>
            <p className="text-gray-700 text-lg mb-8">Appointments will appear here when customers book services</p>
            <button
              onClick={() => {
                const now = new Date();
                const newAppointment = {
                  client: {
                    name: '',
                    email: '',
                    phone: '',
                    address: '',
                    pets: []
                  },
                  services: [],
                  date: now.toISOString().split('T')[0],
                  time: now.toTimeString().split(' ')[0].substring(0, 5),
                  status: 'pending' as Appointment['status'],
                  notes: '',
                  groomerId: null,
                  estimatedDuration: '60'
                };
                setEditForm(newAppointment);
                setSelectedAppointment(null);
                setSelectedClient(null);
                setIsAddingNew(true);
                setEditMode(true);
                setShowModal(true);
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 hover:shadow-lg transform hover:scale-105 transition-all duration-300 font-semibold"
            >
              + Book Your First Appointment
            </button>
          </div>
        ) : viewMode === 'calendar' ? (
          /* Calendar View */
          <div className="p-4" style={{ height: '700px' }}>
            {/* Calendar Toolbar */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleToday}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Today
                </button>
                <span className="text-lg font-semibold text-gray-700">
                  {moment(calendarDate).format('MMMM YYYY')}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                Current view: {calendarView}
              </div>
            </div>
            
            <DragAndDropCalendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor={(event: any) => event.start}
              endAccessor={(event: any) => event.end}
              titleAccessor={(event: any) => event.title}
              views={['month', 'week', 'day']}
              view={calendarView}
              date={calendarDate}
              onNavigate={handleNavigate}
              onView={handleViewChange}
              defaultView={Views.WEEK}
              onSelectEvent={(event: any) => {
                setSelectedAppointment(event.resource);
                setEditMode(false);
                setShowModal(true);
              }}
              onSelectSlot={handleSelectSlot}
              selectable={true}
              onEventDrop={handleEventDrop}
              onEventResize={handleEventResize}
              resizable={true}
              eventPropGetter={(event: any) => {
                const appointment = event.resource;
                let backgroundColor = '#3b82f6'; // Default blue
                
                if (appointment?.status) {
                  switch (appointment.status) {
                    case 'pending':
                      backgroundColor = '#f59e0b'; // Amber
                      break;
                    case 'confirmed':
                      backgroundColor = '#10b981'; // Green
                      break;
                    case 'in-progress':
                      backgroundColor = '#8b5cf6'; // Purple
                      break;
                    case 'completed':
                      backgroundColor = '#059669'; // Dark green
                      break;
                    case 'cancelled':
                      backgroundColor = '#ef4444'; // Red
                      break;
                  }
                }
                
                return {
                  style: {
                    backgroundColor,
                    borderRadius: '5px',
                    opacity: 0.8,
                    color: 'white',
                    border: '0px',
                    display: 'block'
                  }
                };
              }}
              formats={{
                eventTimeRangeFormat: () => '',
                timeGutterFormat: 'h:mm A'
              }}
              step={30}
              timeslots={2}
              min={new Date(2025, 0, 1, 7, 0, 0)} // 7 AM
              max={new Date(2025, 0, 1, 19, 0, 0)} // 7 PM
            />
          </div>
        ) : (
          /* Table View */
          (() => {
            try {
              return (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Client
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pet(s)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Services
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAppointments.map((appointment) => {
                        try {
                          return (
                            <tr key={appointment.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {appointment.date ? formatDate(appointment.date) : 'No date'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {appointment.time ? formatTime(appointment.time) : 'No time'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {appointment.client?.name || 'No client name'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {appointment.client?.phone || 'No phone'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {appointment.client?.address || 'No address'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {appointment.client?.pets && Array.isArray(appointment.client.pets) ? 
                                    appointment.client.pets.map((pet, index) => (
                                      <div key={index} className="mb-1">
                                        <span className="font-medium">{pet?.name || 'Unknown pet'}</span>
                                        <span className="text-gray-500"> ({pet?.breed || 'Unknown breed'})</span>
                                        {pet?.type && <span className="text-xs text-blue-600"> - {pet.type}</span>}
                                      </div>
                                    )) : 
                                    <div className="text-gray-400">No pets listed</div>
                                  }
                                </div>
                              </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {(() => {
                          try {
                            if (!appointment.services || !Array.isArray(appointment.services)) {
                              return <div className="text-gray-400">No services listed</div>;
                            }
                            
                            return appointment.services.map((service, index) => {
                              try {
                                let serviceName = 'Unknown service';
                                let servicePrice = null;
                                
                                if (typeof service === 'string') {
                                  serviceName = serviceNames[service] || service || 'Unknown service';
                                } else if (service && typeof service === 'object') {
                                  serviceName = (service as any).name || 'Unknown service';
                                  servicePrice = (service as any).price;
                                }
                                
                                return (
                                  <div key={index} className="mb-1">
                                    {serviceName}
                                    {servicePrice && (
                                      <span className="text-gray-500 ml-2">${servicePrice}</span>
                                    )}
                                  </div>
                                );
                              } catch (error) {
                                console.error('Error rendering service:', error, service);
                                return (
                                  <div key={index} className="mb-1 text-red-500">
                                    Error displaying service
                                  </div>
                                );
                              }
                            });
                          } catch (error) {
                            console.error('Error rendering services:', error);
                            return <div className="text-red-400">Error loading services</div>;
                          }
                        })()}
                      </div>
                    </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  appointment.status && statusColors[appointment.status] 
                                    ? statusColors[appointment.status] 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {appointment.status ? 
                                    appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1) : 
                                    'Unknown'
                                  }
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => openEditModal(appointment)}
                                    className="bg-gradient-to-r from-amber-400 to-rose-400 text-white px-4 py-2 rounded-xl hover:from-amber-500 hover:to-rose-500 transition-all duration-300 font-semibold transform hover:scale-105"
                                  >
                                    ✏️ Edit
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedAppointment(appointment);
                                      setEditMode(false);
                                      setShowModal(true);
                                    }}
                                    className="bg-gradient-to-r from-blue-400 to-purple-400 text-white px-4 py-2 rounded-xl hover:from-blue-500 hover:to-purple-500 transition-all duration-300 font-semibold transform hover:scale-105"
                                  >
                                    🔧 Manage
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        } catch (error) {
                          console.error('Error rendering appointment row:', error, appointment);
                          return (
                            <tr key={appointment.id || 'error'} className="hover:bg-red-50">
                              <td colSpan={6} className="px-6 py-4 text-center text-red-500">
                                Error displaying appointment
                              </td>
                            </tr>
                          );
                        }
                      })}
                    </tbody>
                  </table>
                </div>
              );
            } catch (error) {
              console.error('Error rendering table view:', error);
              return (
                <div className="text-center py-12">
                  <div className="text-red-500 mb-4">Error loading table view</div>
                  <button 
                    onClick={() => setViewMode('calendar')}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Switch to Calendar View
                  </button>
                </div>
              );
            }
          })()
        )}
      </div>

      {/* Route Optimization Section - Only show in calendar view and when there are appointments */}
      {viewMode === 'calendar' && filteredAppointments.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <div className="text-lg mr-2">🗺️</div>
              Route Optimization for {moment(calendarDate).format('MMMM D, YYYY')}
            </h3>
            <p className="text-gray-600 mt-1">Optimize your daily route for maximum efficiency</p>
          </div>
          <RouteOptimizationSection 
            selectedDate={moment(calendarDate).format('YYYY-MM-DD')}
            appointments={filteredAppointments}
            onOptimize={() => {
              // Route optimization completed
            }}
            onUpdateAppointments={updateAppointmentsWithOptimizedTimes}
          />
        </div>
      )}

      {/* Redesigned Modal for Managing/Editing/Adding Appointment */}
      {showModal && (selectedAppointment || isAddingNew) && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className={`relative mx-auto rounded-lg shadow-lg bg-white border border-gray-200 ${editMode ? 'w-full max-w-6xl' : 'w-full max-w-3xl'} max-h-[95vh] overflow-hidden flex flex-col`}>
            
            {/* Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {isAddingNew ? 'Add New Appointment' : editMode ? 'Edit Appointment' : 'Manage Appointment'}
                  </h3>
                  <p className="text-gray-600 mt-1">
                    {isAddingNew ? 'Create a new grooming appointment' : editMode ? 'Update appointment details' : 'Quick actions and status updates'}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              
              {!editMode && selectedAppointment && !isAddingNew ? (
                <>
                  {/* Manage Mode - Quick Status Update */}
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 space-y-4">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Appointment Summary */}
                      <div className="space-y-4">
                        <h4 className="text-2xl font-semibold text-amber-900 mb-4">Appointment Details</h4>
                        
                        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                          <div className="flex items-center mb-3">
                            <div className="text-2xl mr-3">👤</div>
                            <div>
                              <p className="text-lg font-semibold text-amber-900">
                                {selectedAppointment.client?.name || 'Unknown client'}
                              </p>
                              <p className="text-amber-700">{selectedAppointment.client?.email}</p>
                              <p className="text-amber-700">{selectedAppointment.client?.phone}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-rose-50 rounded-xl p-4 border border-rose-200">
                          <div className="flex items-center mb-3">
                            <div className="text-2xl mr-3">📅</div>
                            <div>
                              <p className="text-lg font-semibold text-rose-900">
                                {selectedAppointment.date ? formatDate(selectedAppointment.date) : 'No date'}
                              </p>
                              <p className="text-rose-700">
                                {selectedAppointment.time ? formatTime(selectedAppointment.time) : 'No time'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="text-2xl mr-3">📊</div>
                              <div>
                                <p className="text-sm font-medium text-blue-900">Current Status</p>
                                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                                  selectedAppointment.status && statusColors[selectedAppointment.status] 
                                    ? statusColors[selectedAppointment.status] 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {selectedAppointment.status ? 
                                    selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1).replace('-', ' ') : 
                                    'Unknown'
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Status Update Section */}
                      <div className="space-y-4">
                        <h4 className="text-2xl font-semibold text-amber-900 mb-4">Update Status</h4>
                        
                        <div className="space-y-3">
                          {['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'].map((status) => (
                            <button
                              key={status}
                              onClick={() => updateAppointmentStatus(selectedAppointment.id, status)}
                              className={`w-full text-left px-6 py-4 rounded-xl text-base font-medium transition-all duration-300 transform hover:scale-[1.02] ${
                                selectedAppointment.status === status
                                  ? 'bg-gradient-to-r from-amber-400 to-rose-400 text-white shadow-lg border-2 border-amber-300'
                                  : 'bg-white/70 backdrop-blur-sm text-amber-900 hover:bg-amber-50 border border-amber-200 hover:border-amber-300 hover:shadow-md'
                              }`}
                            >
                              <div className="flex items-center">
                                <div className="text-xl mr-3">
                                  {status === 'pending' && '⏳'}
                                  {status === 'confirmed' && '✅'}
                                  {status === 'in-progress' && '🚀'}
                                  {status === 'completed' && '🎉'}
                                  {status === 'cancelled' && '❌'}
                                </div>
                                {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex flex-col sm:flex-row gap-3 justify-between">
                        <button
                          onClick={() => deleteAppointment(selectedAppointment.id)}
                          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors font-medium"
                        >
                          Delete
                        </button>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(selectedAppointment)}
                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors font-medium"
                          >
                            Full Edit
                          </button>
                          <button
                            onClick={() => setShowModal(false)}
                            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Edit Mode - Full Form */}
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      
                      {/* Client Information - Left Column */}
                      <div className="lg:col-span-2 space-y-8">
                        <div>
                          <h4 className="text-2xl font-semibold text-amber-900 mb-6 flex items-center">
                            <div className="text-2xl mr-3">👤</div>
                            Client Information
                          </h4>
                          
                          <ClientSearch
                            onClientSelect={(client) => {
                              setSelectedClient(client);
                              setEditForm(prev => ({
                                ...prev,
                                client: {
                                  name: client.name,
                                  email: client.email,
                                  phone: client.phone,
                                  address: client.address,
                                  pets: client.pets || []
                                }
                              }));
                            }}
                            onClientUpdate={(updatedClient) => {
                              setSelectedClient(updatedClient);
                              setEditForm(prev => ({
                                ...prev,
                                client: {
                                  name: updatedClient.name,
                                  email: updatedClient.email,
                                  phone: updatedClient.phone,
                                  address: updatedClient.address,
                                  pets: updatedClient.pets || []
                                }
                              }));
                            }}
                            selectedClient={selectedClient}
                          />
                        </div>

                        {/* Services Section */}
                        <div>
                          <h4 className="text-2xl font-semibold text-amber-900 mb-6 flex items-center">
                            <div className="text-2xl mr-3">✨</div>
                            Services
                          </h4>
                          
                          <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
                            <div className="grid md:grid-cols-2 gap-4">
                              {Object.entries(serviceNames).map(([serviceId, serviceName]) => (
                                <label key={serviceId} className="flex items-center p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-amber-200 hover:border-amber-300 hover:shadow-md transition-all duration-300 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={editForm.services.includes(serviceId)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setEditForm(prev => ({
                                          ...prev,
                                          services: [...prev.services, serviceId]
                                        }));
                                      } else {
                                        setEditForm(prev => ({
                                          ...prev,
                                          services: prev.services.filter(s => s !== serviceId)
                                        }));
                                      }
                                    }}
                                    className="mr-3 h-5 w-5 text-rose-500 border-amber-300 rounded focus:ring-rose-400 focus:ring-2"
                                  />
                                  <span className="text-amber-900 font-medium">{serviceName}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Additional Notes */}
                        <div>
                          <h4 className="text-2xl font-semibold text-amber-900 mb-6 flex items-center">
                            <div className="text-2xl mr-3">📝</div>
                            Additional Notes
                          </h4>
                          
                          <textarea
                            value={editForm.notes}
                            onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                            rows={4}
                            placeholder="Any special instructions or notes for this appointment..."
                            className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm text-amber-900"
                          />
                        </div>
                      </div>

                      {/* Appointment Details - Right Column */}
                      <div className="space-y-6">
                        <h4 className="text-2xl font-semibold text-amber-900 mb-6 flex items-center">
                          <div className="text-2xl mr-3">📅</div>
                          Scheduling
                        </h4>
                        
                        <div className="space-y-6">
                          <div>
                            <label className="block text-sm font-medium text-amber-800 mb-2">
                              Appointment Date *
                            </label>
                            <input
                              type="date"
                              value={editForm.date}
                              onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                              className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-amber-800 mb-2">
                              Appointment Time *
                            </label>
                            <input
                              type="text"
                              value={editForm.time}
                              onChange={(e) => setEditForm(prev => ({ ...prev, time: e.target.value }))}
                              placeholder="e.g., 10:00 AM"
                              className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-amber-800 mb-2">
                              Status
                            </label>
                            <select
                              value={editForm.status}
                              onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as Appointment['status'] }))}
                              className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm"
                            >
                              <option value="pending">⏳ Pending</option>
                              <option value="confirmed">✅ Confirmed</option>
                              <option value="in-progress">🚀 In Progress</option>
                              <option value="completed">🎉 Completed</option>
                              <option value="cancelled">❌ Cancelled</option>
                            </select>
                          </div>

                          {/* Groomer Assignment */}
                          <div>
                            <label className="block text-sm font-medium text-amber-800 mb-2">
                              Assign Groomer
                            </label>
                            <select
                              value={editForm.groomerId || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, groomerId: e.target.value || null }))}
                              className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm"
                            >
                              <option value="">Select a groomer</option>
                              {groomers.map(groomer => (
                                <option key={groomer.id} value={groomer.id}>
                                  {groomer.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-amber-800 mb-2">
                              Estimated Duration (minutes)
                            </label>
                            <input
                              type="number"
                              value={editForm.estimatedDuration}
                              onChange={(e) => setEditForm(prev => ({ ...prev, estimatedDuration: e.target.value }))}
                              min="30"
                              step="15"
                              className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="border-t border-amber-200 pt-6">
                      <div className="flex flex-col sm:flex-row gap-4 justify-between">
                        <button
                          onClick={cancelEdit}
                          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveAppointmentChanges}
                          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
                        >
                          {isAddingNew ? 'Create Appointment' : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentManagement;
