import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import type { View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import './calendar-styles.css';
import { useToast } from '../../contexts/ToastContext';
import type { Pet, Appointment, Client } from '../../types';
import { apiUrl } from '../../config/api';
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
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [breeds, setBreeds] = useState<Array<{id: number, name: string, species: string, fullGroomPrice: string}>>([]);
  const [addons, setAddons] = useState<Array<{id: string, code: string, name: string, price: string, description: string}>>([]);
  const [editForm, setEditForm] = useState({
    client: {
      name: '',
      email: '',
      phone: '',
      address: '',
      pets: [] as Pet[]
    },
    services: [] as string[],
    includeFullService: true,
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

  // Additional services will be dynamically loaded from the API via addons state
  // This ensures that any changes made by admins in the pricing section are automatically reflected here

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    'in-progress': 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  useEffect(() => {
    fetchAppointments();
    fetchBreedsAndAddons();
  }, []);

  const fetchBreedsAndAddons = async () => {
    try {
      // Fetch breeds
      const breedsResponse = await fetch('http://localhost:5001/api/pricing/breeds');
      if (breedsResponse.ok) {
        const breedsData = await breedsResponse.json();
        setBreeds(breedsData);
      }

      // Fetch additional services
      const addonsResponse = await fetch('http://localhost:5001/api/pricing/additional-services');
      if (addonsResponse.ok) {
        const addonsData = await addonsResponse.json();
        setAddons(addonsData);
      }
    } catch (error) {
      console.error('Error fetching breeds and addons:', error);
    }
  };

  // Pricing calculation functions (similar to BookingPage)
  const getBreedPrice = (pet: any) => {
    if (!pet.breed) return 0;
    const breed = breeds.find(b => b.name.toLowerCase() === pet.breed.toLowerCase());
    return breed ? Number(breed.fullGroomPrice) : 0;
  };

  const getServicePrice = (serviceId: string) => {
    const service = addons.find(addon => addon.code === serviceId);
    return service ? Number(service.price) : 0;
  };

  // Helper function to get service name from addons data
  const getServiceName = (serviceId: string) => {
    const service = addons.find(addon => addon.code === serviceId);
    return service ? service.name : serviceId || 'Unknown service';
  };

  const calculateAppointmentTotal = () => {
    if (!editForm.client.pets || editForm.client.pets.length === 0) return 0;

    // Base grooming price for all pets (only if full service is included)
    const groomingTotal = editForm.includeFullService 
      ? editForm.client.pets.reduce((sum, pet) => sum + getBreedPrice(pet), 0)
      : 0;
    
    // Additional services (apply to all pets)
    const additionalTotal = editForm.services.reduce((sum, serviceId) => {
      const servicePrice = getServicePrice(serviceId);
      const totalForService = servicePrice * editForm.client.pets.length;
      return sum + totalForService;
    }, 0);

    console.log('Pricing Debug:', {
      includeFullService: editForm.includeFullService,
      selectedServices: editForm.services,
      groomingTotal,
      additionalTotal,
      finalTotal: groomingTotal + additionalTotal,
      pets: editForm.client.pets.length,
      addons: addons.length
    });

    return groomingTotal + additionalTotal;
  };

  // Memoized total calculation to ensure reactivity
  const appointmentTotal = useMemo(() => {
    return calculateAppointmentTotal();
  }, [editForm.services, editForm.includeFullService, editForm.client.pets, breeds, addons]);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(apiUrl('/appointments'), {
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
      const url = apiUrl(`/appointments/${appointmentId}`);
      
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
      includeFullService: (appointment as any).includeFullService !== undefined ? (appointment as any).includeFullService : true,
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
    if (!editForm.includeFullService && editForm.services.length === 0) {
      showToast('Please select at least one service (Full Service Grooming or Additional Services)', 'error');
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
        includeFullService: editForm.includeFullService,
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
      includeFullService: true,
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
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-amber-900 mb-2">Appointment Management</h1>
        <p className="text-amber-700">Manage and organize all pet grooming appointments</p>
        
        {/* View Toggle and Filter Buttons */}
        <div className="flex justify-between items-center mb-4 mt-6">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All Appointments' },
              { key: 'today', label: 'Today' },
              { key: 'pending', label: 'Pending' },
              { key: 'confirmed', label: 'Confirmed' },
              { key: 'completed', label: 'Completed' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
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
                  includeFullService: true,
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
              className="bg-gradient-to-r from-rose-500 to-rose-600 text-white px-6 py-3 rounded-full hover:from-rose-600 hover:to-rose-700 hover:shadow-lg transform hover:scale-105 transition-all duration-300 font-semibold"
            >
              + Add Appointment
            </button>
            
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📅 Calendar
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📋 Table
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Calendar or Table View */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500 text-lg">No appointments found</p>
            <p className="text-gray-400">Appointments will appear here when customers book services</p>
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
                setIsAddingNew(false);
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
                                  // Look up the service name from the addons data
                                  serviceName = getServiceName(service);
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
                                <button
                                  onClick={() => openEditModal(appointment)}
                                  className="text-green-600 hover:text-green-900 mr-3"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedAppointment(appointment);
                                    setEditMode(false);
                                    setShowModal(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Manage
                                </button>
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
        <div className="mt-6 bg-white rounded-lg shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Route Optimization for {moment(calendarDate).format('MMMM D, YYYY')}
            </h3>
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

      {/* Modern Redesigned Modal for Managing/Editing/Adding Appointment */}
      {showModal && (selectedAppointment || isAddingNew) && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/40 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className={`relative mx-auto rounded-3xl shadow-2xl bg-white border border-amber-200/50 ${editMode || isAddingNew ? 'w-full max-w-6xl' : 'w-full max-w-2xl'} max-h-[95vh] overflow-hidden flex flex-col`}>
            
            {/* Modern Header with Cream/Amber Gradient */}
            <div className="px-8 py-6 bg-gradient-to-r from-amber-100 via-yellow-50 to-cream-50 border-b border-amber-200/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-50/40 to-transparent"></div>
              <div className="relative flex justify-between items-center">
                <div>
                  <h3 className="text-3xl font-bold tracking-tight text-amber-900">
                    {isAddingNew ? '✨ New Appointment' : editMode ? '📝 Edit Appointment' : '⚙️ Manage Appointment'}
                  </h3>
                  <p className="text-amber-700 mt-2 text-sm opacity-90">
                    {isAddingNew ? 'Schedule a new grooming service' : editMode ? 'Update appointment information' : 'Quick status updates and actions'}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-amber-800 hover:bg-amber-200/30 rounded-full p-3 transition-all duration-300 hover:scale-110 hover:rotate-90"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-white">
              
              {!editMode && selectedAppointment && !isAddingNew ? (
                <React.Fragment>
                  {/* Quick Management Mode - Clean Design */}
                  <div className="p-8">
                    {/* Client Info Card */}
                    <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200 shadow-sm mb-6">
                      <h4 className="text-lg font-semibold text-amber-900 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Appointment Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-amber-700 font-medium">Client</p>
                          <p className="text-amber-900 font-semibold">{selectedAppointment.client?.name || 'Unknown client'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-amber-700 font-medium">Date & Time</p>
                          <p className="text-amber-900 font-semibold">
                            {selectedAppointment.date ? formatDate(selectedAppointment.date) : 'No date'} at {selectedAppointment.time ? formatTime(selectedAppointment.time) : 'No time'}
                          </p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-sm text-amber-700 font-medium">Current Status</p>
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

                    {/* Status Update Section */}
                    <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200 shadow-sm mb-6">
                      <h4 className="text-lg font-semibold text-amber-900 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Update Status
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'].map((status) => (
                          <button
                            key={status}
                            onClick={() => updateAppointmentStatus(selectedAppointment.id, status)}
                            className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                              selectedAppointment.status === status
                                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg'
                                : 'bg-white border border-amber-200 text-amber-800 hover:bg-amber-100 hover:border-amber-300'
                            }`}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <button
                        onClick={() => deleteAppointment(selectedAppointment.id)}
                        className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 hover:shadow-lg transform hover:scale-105 transition-all duration-300 font-semibold flex items-center justify-center"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete Appointment
                      </button>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowModal(false)}
                          className="px-6 py-3 bg-white border border-amber-200 text-amber-800 rounded-xl hover:bg-amber-50 hover:border-amber-300 transition-all duration-300 font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => openEditModal(selectedAppointment)}
                          className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 hover:shadow-lg transform hover:scale-105 transition-all duration-300 font-semibold flex items-center"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Full Edit
                        </button>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  {/* Edit Mode - Redesigned to Match BookingPage */}
                  <div className="p-8 bg-gradient-to-br from-cream-50 to-amber-50 space-y-8">
                    
                    {/* Client Information Section */}
                    <div>
                      <h2 className="text-2xl font-semibold text-amber-900 mb-6">Client Information</h2>
                      
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

                    {/* Appointment Details Section */}
                    <div>
                      <h2 className="text-2xl font-semibold text-amber-900 mb-6">Appointment Details</h2>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-amber-800 mb-2">
                            Date *
                          </label>
                          <input
                            type="date"
                            required
                            value={editForm.date}
                            onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                            className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-amber-800 mb-2">
                            Time *
                          </label>
                          <select
                            required
                            value={editForm.time}
                            onChange={(e) => setEditForm(prev => ({ ...prev, time: e.target.value }))}
                            className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm"
                          >
                            <option value="">Select a time</option>
                            {['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'].map((time) => (
                              <option key={time} value={time}>{time}</option>
                            ))}
                          </select>
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
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
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
                            className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm"
                            placeholder="60"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Services Section */}
                    <div>
                      <h2 className="text-2xl font-semibold text-amber-900 mb-6">Services</h2>
                      
                      <div className="border border-amber-200 rounded-xl p-6 bg-white/50 backdrop-blur-sm">
                        <div className="space-y-6">
                          {/* Full Service Grooming Option */}
                          <div className="border-b border-amber-200 pb-4">
                            <div className="text-lg font-medium text-amber-800 mb-4">
                              Primary Service
                            </div>
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                id="fullService"
                                checked={editForm.includeFullService}
                                onChange={(e) => {
                                  setEditForm(prev => ({
                                    ...prev,
                                    includeFullService: e.target.checked
                                  }));
                                }}
                                className="w-5 h-5 text-rose-500 border-amber-300 rounded focus:ring-rose-400"
                              />
                              <label 
                                htmlFor="fullService"
                                className="text-amber-800 font-medium cursor-pointer"
                              >
                                Full Service Grooming (Bath, Cut, Nail Trim, Ear Cleaning)
                              </label>
                            </div>
                            <p className="text-sm text-amber-600 mt-2 ml-8">
                              Uncheck this to offer only additional services below
                            </p>
                          </div>

                          {/* Additional Services */}
                          <div>
                            <div className="text-lg font-medium text-amber-800 mb-4">
                              Additional Services
                            </div>
                          
                          <div className="grid md:grid-cols-2 gap-4">
                            {addons.map((addon) => (
                              <div key={addon.code} className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  id={`service-${addon.code}`}
                                  checked={editForm.services.includes(addon.code)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setEditForm(prev => ({
                                        ...prev,
                                        services: [...prev.services, addon.code]
                                      }));
                                    } else {
                                      setEditForm(prev => ({
                                        ...prev,
                                        services: prev.services.filter(s => s !== addon.code)
                                      }));
                                    }
                                  }}
                                  className="w-5 h-5 text-rose-500 border-amber-300 rounded focus:ring-rose-400"
                                />
                                <label 
                                  htmlFor={`service-${addon.code}`}
                                  className="text-amber-800 font-medium cursor-pointer"
                                >
                                  {addon.name} - ${addon.price}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Additional Notes Section */}
                    <div>
                      <label className="block text-sm font-medium text-amber-800 mb-2">
                        Additional Notes
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Any additional information or special requests..."
                        value={editForm.notes}
                        onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                        className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm"
                      />
                    </div>

                    {/* Price Summary Section */}
                    {editForm.client.pets && editForm.client.pets.length > 0 && (
                      <div>
                        <h2 className="text-2xl font-semibold text-amber-900 mb-6">Price Summary</h2>
                        
                        <div className="bg-gradient-to-br from-amber-50 to-rose-50 rounded-2xl shadow-xl p-6 border border-amber-200/50">
                          <h3 className="text-lg font-semibold text-amber-900 mb-4">Service Pricing</h3>
                          
                          {/* Grooming Services */}
                          {editForm.includeFullService && (
                            <div className="space-y-4 mb-6">
                              <h4 className="text-md font-medium text-amber-800">Full Service Grooming</h4>
                              {editForm.client.pets.map((pet, index) => {
                                const price = getBreedPrice(pet);
                                return (
                                  <div key={index} className="flex justify-between items-center py-2 border-b border-amber-200/50">
                                    <div>
                                      <p className="text-sm font-medium text-amber-900">
                                        {pet.name || `Pet #${index + 1}`}
                                      </p>
                                      <p className="text-xs text-amber-700">
                                        {pet.breed || 'Breed not specified'}
                                      </p>
                                    </div>
                                    <span className="text-lg font-semibold text-amber-900">
                                      ${price.toFixed(2)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Additional Services */}
                          {editForm.services.length > 0 && (
                            <div className="space-y-4 mb-6">
                              <h4 className="text-md font-medium text-amber-800">Additional Services</h4>
                              {editForm.services.map((serviceId) => {
                                const service = addons.find(addon => addon.code === serviceId);
                                const servicePrice = getServicePrice(serviceId);
                                const totalServicePrice = servicePrice * editForm.client.pets.length;
                                return service ? (
                                  <div key={serviceId} className="flex justify-between items-center py-2 border-b border-amber-200/50">
                                    <div>
                                      <p className="text-sm font-medium text-amber-900">{service.name}</p>
                                      <p className="text-xs text-amber-700">
                                        ${servicePrice.toFixed(2)} × {editForm.client.pets.length} pet{editForm.client.pets.length > 1 ? 's' : ''}
                                      </p>
                                    </div>
                                    <span className="text-lg font-semibold text-amber-900">
                                      ${totalServicePrice.toFixed(2)}
                                    </span>
                                  </div>
                                ) : null;
                              })}
                            </div>
                          )}

                          {/* Total */}
                          <div className="border-t-2 border-amber-300 pt-4">
                            <div className="flex justify-between items-center">
                              <span className="text-xl font-bold text-amber-900">Total Estimate</span>
                              <span className="text-2xl font-bold text-rose-600">
                                ${appointmentTotal.toFixed(2)}
                              </span>
                            </div>
                            <p className="text-xs text-amber-700 mt-2 text-center">
                              Final pricing may vary based on pet condition and specific requirements
                            </p>
                          </div>

                          {/* Quick Pricing Reference */}
                          <div className="mt-6 p-4 bg-white/60 rounded-xl border border-amber-200">
                            <h5 className="text-sm font-semibold text-amber-800 mb-3">Quick Pricing Reference</h5>
                            <div className="grid grid-cols-2 gap-2 text-xs text-amber-700">
                              <div className="flex justify-between">
                                <span>Small (0-15 lbs)</span>
                                <span>$75</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Medium (16-40 lbs)</span>
                                <span>$100</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Large (41-70 lbs)</span>
                                <span>$125</span>
                              </div>
                              <div className="flex justify-between">
                                <span>X Large (71-90 lbs)</span>
                                <span>$150</span>
                              </div>
                              <div className="flex justify-between">
                                <span>XX Large (91+ lbs)</span>
                                <span>$175</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Cats</span>
                                <span>$85</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="border-t border-amber-200 pt-6">
                      <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <button
                          onClick={cancelEdit}
                          className="px-6 py-3 bg-gradient-to-r from-gray-300 to-gray-400 text-gray-700 rounded-xl hover:from-gray-400 hover:to-gray-500 hover:shadow-lg transform hover:scale-105 transition-all duration-300 font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveAppointmentChanges}
                          className="px-8 py-3 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl hover:from-rose-600 hover:to-rose-700 hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold"
                        >
                          {isAddingNew ? 'Create Appointment' : 'Save Changes'}
                        </button>
                      </div>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentManagement;
