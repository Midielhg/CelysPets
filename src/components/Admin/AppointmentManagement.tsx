import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import type { View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './calendar-styles.css';
import { useToast } from '../../contexts/ToastContext';

interface Pet {
  name: string;
  type: 'dog' | 'cat';
  breed: string;
  weight?: string;
  specialInstructions?: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  pets: Pet[];
}

interface Appointment {
  id: string;
  client: Client;
  services: string[];
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
  totalAmount?: number;
  createdAt: string;
  updatedAt: string;
}

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
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<View>('week');
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
    notes: ''
  });

  // Convert appointments to calendar events
  const convertToCalendarEvents = (appointments: Appointment[]): CalendarEvent[] => {
    return appointments.map(appointment => {
      const appointmentDate = new Date(appointment.date);
      const [time, period] = appointment.time.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      
      // Convert to 24-hour format
      let hour24 = hours;
      if (period === 'PM' && hours !== 12) hour24 += 12;
      if (period === 'AM' && hours === 12) hour24 = 0;
      
      const startTime = new Date(appointmentDate);
      startTime.setHours(hour24, minutes, 0);
      
      const endTime = new Date(startTime);
      endTime.setHours(startTime.getHours() + 1); // Default 1 hour duration
      
      return {
        id: appointment.id,
        title: `${appointment.client.name} - ${appointment.services.length} service(s)`,
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
  }, []);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/appointments`, {
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
      showToast('Failed to fetch appointments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const url = `${import.meta.env.VITE_API_URL}/api/appointments/${appointmentId}`;
      
      console.log('Updating appointment status:', { 
        appointmentId, 
        newStatus, 
        url,
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 10)}...` : 'no token'
      });
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
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

  const deleteAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to delete this appointment?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/appointments/${appointmentId}`, {
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
    setEditForm({
      client: {
        name: appointment.client.name,
        email: appointment.client.email,
        phone: appointment.client.phone,
        address: appointment.client.address,
        pets: appointment.client.pets || []
      },
      services: appointment.services,
      date: appointment.date.split('T')[0], // Convert to YYYY-MM-DD format
      time: appointment.time,
      status: appointment.status,
      notes: appointment.notes || ''
    });
    setEditMode(true);
    setShowModal(true);
  };

  const saveAppointmentChanges = async () => {
    if (!selectedAppointment) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/appointments/${selectedAppointment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      if (!response.ok) {
        throw new Error('Failed to update appointment');
      }

      const data = await response.json();
      
      // Update local state
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === selectedAppointment.id 
            ? data.appointment
            : apt
        )
      );

      showToast('Appointment updated successfully', 'success');
      setShowModal(false);
      setEditMode(false);
    } catch (error) {
      showToast('Failed to update appointment', 'error');
    }
  };

  const cancelEdit = () => {
    setEditMode(false);
    setShowModal(false);
    setSelectedAppointment(null);
  };

  const filteredAppointments = appointments.filter(appointment => {
    const today = new Date().toISOString().split('T')[0];
    
    switch (filter) {
      case 'today':
        return appointment.date === today;
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
    return new Date(dateString).toLocaleDateString('en-US', {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Appointment Management</h1>
        
        {/* View Toggle and Filter Buttons */}
        <div className="flex justify-between items-center mb-4">
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
          
          {/* View Toggle */}
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
            
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              titleAccessor="title"
              views={['month', 'week', 'day']}
              view={calendarView}
              date={calendarDate}
              onNavigate={handleNavigate}
              onView={handleViewChange}
              defaultView={Views.WEEK}
              onSelectEvent={(event) => {
                setSelectedAppointment(event.resource);
                setEditMode(false);
                setShowModal(true);
              }}
              eventPropGetter={(event) => {
                const appointment = event.resource;
                let backgroundColor = '#3b82f6'; // Default blue
                
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
                {filteredAppointments.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatDate(appointment.date)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatTime(appointment.time)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {appointment.client.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {appointment.client.phone}
                      </div>
                      <div className="text-sm text-gray-500">
                        {appointment.client.address}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {appointment.client.pets.map((pet, index) => (
                          <div key={index} className="mb-1">
                            <span className="font-medium">{pet.name}</span>
                            <span className="text-gray-500"> ({pet.breed})</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {appointment.services.map((serviceId, index) => (
                          <div key={index} className="mb-1">
                            {serviceNames[serviceId] || serviceId}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[appointment.status]}`}>
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Managing/Editing Appointment */}
      {showModal && selectedAppointment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className={`relative top-10 mx-auto p-5 border shadow-lg rounded-md bg-white ${editMode ? 'w-4/5 max-w-4xl' : 'w-96'}`}>
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editMode ? 'Edit Appointment' : 'Manage Appointment'}
              </h3>
              
              {!editMode ? (
                <>
                  {/* Manage Mode - Quick Status Update */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Client:</strong> {selectedAppointment.client.name}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Date:</strong> {formatDate(selectedAppointment.date)} at {formatTime(selectedAppointment.time)}
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                      <strong>Current Status:</strong> 
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[selectedAppointment.status]}`}>
                        {selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)}
                      </span>
                    </p>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Update Status:
                    </label>
                    <div className="space-y-2">
                      {['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'].map((status) => (
                        <button
                          key={status}
                          onClick={() => updateAppointmentStatus(selectedAppointment.id, status)}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            selectedAppointment.status === status
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <button
                      onClick={() => deleteAppointment(selectedAppointment.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                    <div className="space-x-2">
                      <button
                        onClick={() => openEditModal(selectedAppointment)}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                      >
                        Full Edit
                      </button>
                      <button
                        onClick={() => setShowModal(false)}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Edit Mode - Full Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Client Information */}
                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-gray-900">Client Information</h4>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                          type="text"
                          value={editForm.client.name}
                          onChange={(e) => setEditForm(prev => ({
                            ...prev,
                            client: { ...prev.client, name: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={editForm.client.email}
                          onChange={(e) => setEditForm(prev => ({
                            ...prev,
                            client: { ...prev.client, email: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={editForm.client.phone}
                          onChange={(e) => setEditForm(prev => ({
                            ...prev,
                            client: { ...prev.client, phone: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <textarea
                          value={editForm.client.address}
                          onChange={(e) => setEditForm(prev => ({
                            ...prev,
                            client: { ...prev.client, address: e.target.value }
                          }))}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Appointment Details */}
                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-gray-900">Appointment Details</h4>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <input
                          type="date"
                          value={editForm.date}
                          onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                        <input
                          type="text"
                          value={editForm.time}
                          onChange={(e) => setEditForm(prev => ({ ...prev, time: e.target.value }))}
                          placeholder="e.g., 10:00 AM"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as Appointment['status'] }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Services</label>
                        <div className="space-y-2">
                          {Object.entries(serviceNames).map(([serviceId, serviceName]) => (
                            <label key={serviceId} className="flex items-center">
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
                                className="mr-2"
                              />
                              <span className="text-sm">{serviceName}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea
                          value={editForm.notes}
                          onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
                    <button
                      onClick={cancelEdit}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveAppointmentChanges}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Save Changes
                    </button>
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
