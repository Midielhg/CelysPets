import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Filter,
  MapPin,
  Phone,
  User,
  Edit,
  Trash2,
  X,
  Eye
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import type { Appointment, Client } from '../../types';
import { apiUrl } from '../../config/api';

interface IOSAppointmentManagementProps {}

const IOSAppointmentManagement: React.FC<IOSAppointmentManagementProps> = () => {
  const { showToast } = useToast();
  
  // State management
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'list'>('month');
  const [filter, setFilter] = useState<'all' | 'today' | 'pending' | 'confirmed' | 'completed'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [draggedAppointment, setDraggedAppointment] = useState<Appointment | null>(null);

  // Sample data for demonstration (will be replaced by API data)
  useEffect(() => {
    if (appointments.length === 0) {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);

      const sampleAppointments: Appointment[] = [
        {
          id: 'sample-1',
          date: today.toISOString(),
          time: '9:00 AM',
          status: 'confirmed',
          services: ['Full Grooming', 'Nail Trim'],
          createdAt: today.toISOString(),
          updatedAt: today.toISOString(),
          client: {
            id: 'client-1',
            name: 'Sarah Johnson',
            email: 'sarah@example.com',
            phone: '(555) 123-4567',
            address: '123 Main St, City, State',
            pets: [
              { name: 'Buddy', breed: 'Golden Retriever', type: 'dog', age: 3 }
            ]
          }
        },
        {
          id: 'sample-2',
          date: tomorrow.toISOString(),
          time: '2:15 PM',
          status: 'pending',
          services: ['Bath & Brush'],
          createdAt: tomorrow.toISOString(),
          updatedAt: tomorrow.toISOString(),
          client: {
            id: 'client-2',
            name: 'Mike Chen',
            email: 'mike@example.com',
            phone: '(555) 987-6543',
            address: '456 Oak Ave, City, State',
            pets: [
              { name: 'Luna', breed: 'Persian', type: 'cat', age: 2 }
            ]
          }
        },
        {
          id: 'sample-3',
          date: today.toISOString(),
          time: '11:30 AM',
          status: 'completed',
          services: ['Full Grooming', 'Teeth Cleaning'],
          createdAt: today.toISOString(),
          updatedAt: today.toISOString(),
          client: {
            id: 'client-3',
            name: 'Emma Davis',
            email: 'emma@example.com',
            phone: '(555) 456-7890',
            address: '789 Pine Rd, City, State',
            pets: [
              { name: 'Max', breed: 'Poodle', type: 'dog', age: 5 }
            ]
          }
        },
        {
          id: 'sample-4',
          date: tomorrow.toISOString(),
          time: '4:45 PM',
          status: 'confirmed',
          services: ['Nail Trim', 'Ear Cleaning'],
          createdAt: tomorrow.toISOString(),
          updatedAt: tomorrow.toISOString(),
          client: {
            id: 'client-4',
            name: 'John Smith',
            email: 'john@example.com',
            phone: '(555) 321-9876',
            address: '321 Elm St, City, State',
            pets: [
              { name: 'Bella', breed: 'Labrador', type: 'dog', age: 4 }
            ]
          }
        }
      ];
      
      setAppointments(sampleAppointments);
      setLoading(false);
    }
  }, [appointments.length]);

  // Date navigation helpers
  const today = new Date();
  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const formatShortDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Generate calendar days for month view
  const generateCalendarDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // Navigation functions
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (viewMode === 'month') {
      newDate.setMonth(selectedDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 7 : -7));
    } else if (viewMode === 'day') {
      newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Get color classes for appointment status
  const getStatusColors = (status: string) => {
    switch (status) {
      case 'confirmed':
        return {
          bg: 'bg-blue-200',
          bgLight: 'bg-blue-50',
          border: 'border-blue-300',
          text: 'text-blue-800',
          textDark: 'text-blue-700'
        };
      case 'pending':
        return {
          bg: 'bg-slate-200',
          bgLight: 'bg-slate-50',
          border: 'border-slate-300',
          text: 'text-slate-800',
          textDark: 'text-slate-700'
        };
      case 'completed':
        return {
          bg: 'bg-green-200',
          bgLight: 'bg-green-50',
          border: 'border-green-300',
          text: 'text-green-800',
          textDark: 'text-green-700'
        };
      default:
        return {
          bg: 'bg-gray-200',
          bgLight: 'bg-gray-50',
          border: 'border-gray-300',
          text: 'text-gray-800',
          textDark: 'text-gray-700'
        };
    }
  };

  // Filter appointments based on current filter
  const getFilteredAppointments = () => {
    let filtered = appointments;
    
    if (filter === 'today') {
      const todayStr = today.toISOString().split('T')[0];
      filtered = appointments.filter(apt => {
        const aptDate = apt.date ? apt.date.split('T')[0] : '';
        return aptDate === todayStr;
      });
    } else if (filter !== 'all') {
      filtered = appointments.filter(apt => apt.status === filter);
    }
    
    return filtered;
  };

  // Get appointments for a specific date (filtered by current filter)
  const getAppointmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const filtered = getFilteredAppointments();
    return filtered.filter(apt => {
      const aptDate = apt.date ? apt.date.split('T')[0] : '';
      return aptDate === dateStr;
    });
  };

  // Helper function to convert time string to minutes from midnight
  const convertTimeToMinutes = (timeString: string): number => {
    if (!timeString) return 720; // Default to noon if no time
    
    // Parse time formats like "9:00 AM", "2:30 PM", etc.
    const timeMatch = timeString.match(/(\d{1,2}):(\d{0,2})\s*(AM|PM)/i);
    if (!timeMatch) return 720;
    
    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]) || 0;
    const period = timeMatch[3].toUpperCase();
    
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return hours * 60 + minutes;
  };

  // Helper function to convert minutes from midnight to time string
  const convertMinutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) return `12:${mins.toString().padStart(2, '0')} AM`;
    if (hours === 12) return `12:${mins.toString().padStart(2, '0')} PM`;
    if (hours < 12) return `${hours}:${mins.toString().padStart(2, '0')} AM`;
    return `${hours - 12}:${mins.toString().padStart(2, '0')} PM`;
  };

  // Enhanced drag and drop handlers with 15-minute precision
  const handleDragStart = (e: React.DragEvent, appointment: Appointment) => {
    setDraggedAppointment(appointment);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', appointment.id);
    
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDrop = async (e: React.DragEvent, targetDate: Date, targetMinutes?: number) => {
    e.preventDefault();
    
    if (!draggedAppointment) return;
    
    // Reset visual feedback
    const draggedElement = document.querySelector(`[data-appointment-id="${draggedAppointment.id}"]`) as HTMLElement;
    if (draggedElement) {
      draggedElement.style.opacity = '1';
    }
    
    let finalMinutes = targetMinutes;
    
    // If no specific minutes provided, calculate from mouse position
    if (finalMinutes === undefined) {
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseY = e.clientY - rect.top;
      
      // Calculate which 15-minute slot based on mouse position
      // Each hour is 64px on mobile, 80px on desktop
      const hourHeight = window.innerWidth >= 768 ? 80 : 64;
      const totalHours = 17; // 6 AM to 10 PM
      const totalHeight = totalHours * hourHeight;
      
      // Calculate relative position (0 to 1)
      const relativePosition = Math.max(0, Math.min(1, mouseY / totalHeight));
      
      // Convert to minutes from 6 AM (360 minutes)
      const startMinutes = 360; // 6 AM
      const endMinutes = 1320; // 10 PM
      const totalMinutesRange = endMinutes - startMinutes;
      
      // Calculate exact minute position
      const exactMinutes = startMinutes + (relativePosition * totalMinutesRange);
      
      // Round to nearest 15-minute interval
      finalMinutes = Math.round(exactMinutes / 15) * 15;
    }
    
    // Create new date and time
    const newDate = new Date(targetDate);
    const newTime = convertMinutesToTime(finalMinutes);
    
    try {
      // Update appointment with new date and time
      const updatedAppointment = {
        ...draggedAppointment,
        date: newDate.toISOString(),
        time: newTime
      };

      // Update local state optimistically
      setAppointments(prev => prev.map(apt => 
        apt.id === draggedAppointment.id ? updatedAppointment : apt
      ));

      // Make API call to update appointment
      const response = await fetch(apiUrl(`/appointments/${draggedAppointment.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          date: newDate.toISOString(),
          time: newTime
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update appointment');
      }

      showToast(`Appointment moved to ${newDate.toLocaleDateString()} at ${newTime}`, 'success');
      
    } catch (error) {
      console.error('Error updating appointment:', error);
      showToast('Failed to move appointment', 'error');
      
      // Revert optimistic update on error
      setAppointments(prev => prev.map(apt => 
        apt.id === draggedAppointment.id ? draggedAppointment : apt
      ));
    } finally {
      setDraggedAppointment(null);
    }
  };

  // Appointment management functions
  const openAddModal = () => {
    setSelectedAppointment(null);
    setIsAddingNew(true);
    setEditMode(true);
    setShowModal(true);
  };

  const openViewModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsAddingNew(false);
    setEditMode(false);
    setShowModal(true);
  };

  const openEditModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsAddingNew(false);
    setEditMode(true);
    setShowModal(true);
  };

  const deleteAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to delete this appointment?')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(apiUrl(`/appointments/${appointmentId}`), {
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
    } catch (error) {
      console.error('Error deleting appointment:', error);
      showToast('Failed to delete appointment', 'error');
    }
  };

  // Fetch appointments
  const fetchAppointments = async () => {
    try {
      setLoading(true);
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
      showToast('Failed to load appointments for the calendar', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const calendarDays = generateCalendarDays();
  const filteredAppointments = getFilteredAppointments();

  return (
    <div className="bg-gradient-to-br from-stone-50 to-neutral-50 rounded-lg shadow-sm border border-stone-200 overflow-hidden">
      {/* iOS-style Header */}
      <div className="bg-gradient-to-r from-stone-50 to-neutral-50 border-b border-stone-200">
        <div className="px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-stone-800">
              {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={goToToday}
                className="px-3 py-1 text-sm font-medium text-stone-600 bg-white rounded-full border border-stone-300 hover:bg-stone-50 transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-full transition-colors"
              >
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* View Mode Selector */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 bg-white rounded-lg p-1 shadow-sm">
              {(['month', 'week', 'day', 'list'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    viewMode === mode
                      ? 'bg-stone-600 text-white shadow-sm'
                      : 'text-stone-600 hover:text-stone-800 hover:bg-stone-100'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2">
                            <button
                onClick={() => navigateDate('prev')}
                className="p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigateDate('next')}
                className="p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="px-4 pb-4 border-t border-gray-200 bg-white">
            <div className="flex flex-wrap gap-2 pt-4">
              {[
                { key: 'all', label: 'All' },
                { key: 'today', label: 'Today' },
                { key: 'pending', label: 'Pending' },
                { key: 'confirmed', label: 'Confirmed' },
                { key: 'completed', label: 'Completed' }
              ].map(({ key, label }) => {
                const getFilterColors = () => {
                  if (filter !== key) return 'bg-stone-100 text-stone-600 hover:bg-stone-200';
                  
                  switch (key) {
                    case 'confirmed':
                      return 'bg-blue-200 text-blue-800 border border-blue-300';
                    case 'pending':
                      return 'bg-slate-200 text-slate-800 border border-slate-300';
                    case 'completed':
                      return 'bg-green-200 text-green-800 border border-green-300';
                    default:
                      return 'bg-stone-200 text-stone-800 border border-stone-300';
                  }
                };
                
                return (
                  <button
                    key={key}
                    onClick={() => setFilter(key as any)}
                    className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${getFilterColors()}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Calendar Content */}
      <div className="p-4">
        {viewMode === 'month' && (
          <div className="space-y-4">
            {/* Month Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {calendarDays.map((day, index) => {
                const dayAppointments = getAppointmentsForDate(day);
                const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
                const isSelected = day.toDateString() === selectedDate.toDateString();
                const isTodayDate = isToday(day);
                
                return (
                  <div
                    key={index}
                    onClick={() => setSelectedDate(day)}
                    className={`relative p-2 min-h-[60px] cursor-pointer rounded-lg border transition-colors ${
                      isSelected
                        ? 'bg-stone-50 border-stone-200'
                        : isCurrentMonth
                        ? 'bg-white border-stone-100 hover:bg-stone-50'
                        : 'bg-stone-50 border-stone-100 text-stone-400'
                    }`}
                  >
                    <div className={`text-sm font-medium ${
                      isTodayDate && isCurrentMonth
                        ? 'bg-stone-600 text-white rounded-full w-6 h-6 flex items-center justify-center'
                        : ''
                    }`}>
                      {day.getDate()}
                    </div>
                    
                    {/* Appointment indicators */}
                    {dayAppointments.length > 0 && (
                      <div className="mt-1 space-y-1">
                        {dayAppointments.slice(0, 2).map((apt, aptIndex) => (
                          <div
                            key={aptIndex}
                            className={`text-xs px-1 py-0.5 rounded cursor-pointer hover:opacity-80 transition-opacity ${
                              getStatusColors(apt.status).bg
                            } ${getStatusColors(apt.status).text}`}
                            onClick={() => openViewModal(apt)}
                            title={`${apt.time || 'No time'} - ${apt.client?.name || 'No client'} (${apt.status})`}
                          >
                            <div className="truncate font-medium leading-tight">
                              {apt.client?.name || 'No client'}
                            </div>
                            <div className="truncate text-xs opacity-90">
                              {apt.time || 'No time'}
                            </div>
                          </div>
                        ))}
                        {dayAppointments.length > 2 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{dayAppointments.length - 2} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Week View */}
        {viewMode === 'week' && (
          <div className="space-y-4">
            {/* Week Header with Days */}
            <div className="grid grid-cols-8 gap-1 mb-4 bg-gray-50 rounded-lg p-2">
              {/* Empty corner cell for time column */}
              <div className="p-2 text-xs font-medium text-gray-500">Time</div>
              {Array.from({ length: 7 }, (_, i) => {
                const currentDate = new Date(selectedDate);
                const startOfWeek = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay()));
                const dayDate = new Date(startOfWeek);
                dayDate.setDate(startOfWeek.getDate() + i);
                const isTodayDate = isToday(dayDate);
                
                return (
                  <div key={i} className="text-center py-2">
                    <div className="text-xs text-stone-500 mb-1">
                      {dayDate.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className={`text-sm font-semibold ${
                      isTodayDate 
                        ? 'bg-stone-600 text-white rounded-full w-7 h-7 flex items-center justify-center mx-auto' 
                        : 'text-stone-800'
                    }`}>
                      {dayDate.getDate()}
                    </div>
                    <div className="text-xs text-stone-400 mt-1">
                      {dayDate.toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Time Grid */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="relative">
                {/* Time slots */}
                <div className="flex">
                  {/* Time column */}
                  <div className="w-16 md:w-20 border-r border-gray-200">
                    {Array.from({ length: 17 }, (_, hourIndex) => {
                      const hour = hourIndex + 6; // Start from 6 AM
                      const timeLabel = hour === 12 ? '12' : 
                                      hour > 12 ? `${hour - 12}` : 
                                      hour === 0 ? '12' :
                                      `${hour}`;
                      const period = hour >= 12 ? 'PM' : 'AM';
                      
                      return (
                        <div key={hourIndex} className="h-16 md:h-20 flex items-center justify-end border-b-2 border-gray-200 last:border-b-0">
                          <div className="text-xs text-gray-500 mr-2 text-right">
                            <div className="font-medium">{timeLabel}</div>
                            <div className="text-xs opacity-75">{period}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Days container */}
                  <div className="flex-1 relative">
                    {/* Single large drop zone covering entire week area */}
                    <div
                      className="absolute inset-0 z-10"
                      onDrop={(e) => {
                        // Calculate which day column was dropped on
                        const rect = e.currentTarget.getBoundingClientRect();
                        const relativeX = e.clientX - rect.left;
                        const dayWidth = rect.width / 7;
                        const dayIndex = Math.min(6, Math.floor(relativeX / dayWidth));
                        
                        // Calculate the target date
                        const currentDate = new Date(selectedDate);
                        const startOfWeek = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay()));
                        const targetDate = new Date(startOfWeek);
                        targetDate.setDate(startOfWeek.getDate() + dayIndex);
                        
                        handleDrop(e, targetDate);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('bg-blue-25');
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove('bg-blue-25');
                      }}
                      onDragEnter={(e) => e.preventDefault()}
                    />
                    
                    {/* Day columns grid */}
                    <div className="grid grid-cols-7 h-full">
                      {Array.from({ length: 7 }, (_, dayIndex) => (
                        <div key={dayIndex} className="border-r border-gray-100 last:border-r-0">
                          {/* Hour lines for each day */}
                          {Array.from({ length: 17 }, (_, hourIndex) => (
                            <div 
                              key={hourIndex} 
                              className="h-16 md:h-20 border-b-2 border-gray-200 last:border-b-0 relative pointer-events-none"
                            >
                              {/* 15-minute markers */}
                              <div className="absolute inset-0">
                                {[15, 30, 45].map(minute => (
                                  <div 
                                    key={minute}
                                    className="absolute left-0 right-0 border-b border-gray-100"
                                    style={{ top: `${(minute / 60) * 100}%` }}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                    
                    {/* Appointments overlay */}
                    <div className="absolute inset-0 pointer-events-none z-20">
                      {Array.from({ length: 7 }, (_, dayIndex) => {
                        const currentDate = new Date(selectedDate);
                        const startOfWeek = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay()));
                        const dayDate = new Date(startOfWeek);
                        dayDate.setDate(startOfWeek.getDate() + dayIndex);
                        
                        return getAppointmentsForDate(dayDate).map((appointment) => {
                          const appointmentMinutes = convertTimeToMinutes(appointment.time || '12:00 PM');
                          const startMinutes = 360; // 6 AM
                          const relativeMinutes = appointmentMinutes - startMinutes;
                          
                          // Each hour is 64px (h-16) or 80px (h-20), calculate based on screen size
                          const hourHeight = window.innerWidth >= 768 ? 80 : 64; // md:h-20 vs h-16
                          const topPosition = Math.max(0, (relativeMinutes * hourHeight) / 60);
                          
                          // Skip if appointment is outside visible hours
                          if (appointmentMinutes < startMinutes || appointmentMinutes > 1320) { // 22:00 PM
                            return null;
                          }
                          
                          return (
                            <div
                              key={appointment.id}
                              data-appointment-id={appointment.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, appointment)}
                              onDragEnd={(e) => {
                                if (e.currentTarget instanceof HTMLElement) {
                                  e.currentTarget.style.opacity = '1';
                                }
                              }}
                              onClick={() => openViewModal(appointment)}
                              className={`absolute pointer-events-auto text-xs p-2 mx-1 rounded-lg cursor-move shadow-sm hover:shadow-md transition-all duration-200 z-30 ${
                                getStatusColors(appointment.status).bg
                              } ${getStatusColors(appointment.status).text}`}
                              style={{
                                top: `${topPosition}px`,
                                left: `${(dayIndex * (100 / 7)) + 1}%`,
                                width: `${(100 / 7) - 2}%`,
                                height: `${Math.min(hourHeight - 4, 52)}px`,
                              }}
                              title={`${appointment.time || 'No time'} - ${appointment.client?.name || 'No client'} (Drag to move)`}
                            >
                              <div className="font-medium truncate text-xs leading-tight">
                                {appointment.client?.name || 'No client'}
                              </div>
                              <div className="truncate opacity-90 text-xs mt-1">
                                {appointment.time || 'No time'}
                              </div>
                              <div className="truncate opacity-75 text-xs">
                                {appointment.services?.slice(0, 1).join(', ') || 'No services'}
                              </div>
                            </div>
                          );
                        });
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Week View Instructions */}
            <div className="text-center text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
              <p>💡 <strong>Drag and drop appointments</strong> to reschedule them to different days and times (15-minute precision)</p>
            </div>
          </div>
        )}

        {/* Day View */}
        {viewMode === 'day' && (
          <div className="space-y-4">
            {/* Day Header - iOS Style */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long' 
                  })}
                </h2>
                <div className="text-lg text-gray-600">
                  {selectedDate.toLocaleDateString('en-US', { 
                    month: 'long',
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </div>
                {isToday(selectedDate) && (
                  <span className="inline-block mt-2 text-sm text-stone-600 font-medium bg-stone-100 px-3 py-1 rounded-full">Today</span>
                )}
              </div>
            </div>

            {/* Day Time Grid - iOS Calendar Style */}
            <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
              <div className="relative">
                {/* Time slots */}
                <div className="flex">
                  {/* Time column */}
                  <div className="w-16 md:w-20 border-r border-stone-200">
                    {Array.from({ length: 17 }, (_, hourIndex) => {
                      const hour = hourIndex + 6; // Start from 6 AM
                      const timeLabel = hour === 12 ? '12' : 
                                      hour > 12 ? `${hour - 12}` : 
                                      hour === 0 ? '12' :
                                      `${hour}`;
                      const period = hour >= 12 ? 'PM' : 'AM';
                      
                      return (
                        <div key={hourIndex} className="h-16 md:h-20 flex items-center justify-end border-b-2 border-gray-200 last:border-b-0">
                          <div className="text-xs text-gray-500 mr-2 text-right">
                            <div className="font-medium">{timeLabel}</div>
                            <div className="text-xs opacity-75">{period}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Appointment area */}
                  <div className="flex-1 relative">
                    {/* Single large drop zone covering entire appointment area */}
                    <div
                      className="absolute inset-0 z-10"
                      onDrop={(e) => handleDrop(e, selectedDate)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('bg-blue-25');
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove('bg-blue-25');
                      }}
                      onDragEnter={(e) => e.preventDefault()}
                    />
                    
                    {/* Hour lines */}
                    {Array.from({ length: 17 }, (_, hourIndex) => (
                      <div 
                        key={hourIndex} 
                        className="h-16 md:h-20 border-b-2 border-gray-200 last:border-b-0 relative pointer-events-none"
                      >
                        {/* 15-minute markers */}
                        <div className="absolute inset-0">
                          {[15, 30, 45].map(minute => (
                            <div 
                              key={minute}
                              className="absolute left-0 right-0 border-b border-gray-100"
                              style={{ top: `${(minute / 60) * 100}%` }}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                    
                    {/* Appointments overlay */}
                    <div className="absolute inset-0 pointer-events-none z-20">
                      {getAppointmentsForDate(selectedDate).map((appointment) => {
                        const appointmentMinutes = convertTimeToMinutes(appointment.time || '12:00 PM');
                        const startMinutes = 360; // 6 AM
                        const relativeMinutes = appointmentMinutes - startMinutes;
                        
                        // Calculate position (each hour is 64px on mobile, 80px on desktop)
                        const hourHeight = window.innerWidth >= 768 ? 80 : 64;
                        const topPosition = Math.max(0, (relativeMinutes / 60) * hourHeight);
                        
                        // Skip if appointment is outside visible hours
                        if (appointmentMinutes < startMinutes || appointmentMinutes > 1320) { // 22:00 PM
                          return null;
                        }
                        
                        return (
                          <div
                            key={appointment.id}
                            data-appointment-id={appointment.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, appointment)}
                            onDragEnd={(e) => {
                              if (e.currentTarget instanceof HTMLElement) {
                                e.currentTarget.style.opacity = '1';
                              }
                            }}
                            onClick={() => openViewModal(appointment)}
                            className={`absolute pointer-events-auto rounded-md cursor-move transition-all duration-200 z-20 mx-2 hover:shadow-md border-l-4 ${getStatusColors(appointment.status).bgLight} ${getStatusColors(appointment.status).border}`}
                            style={{
                              top: `${topPosition}px`,
                              left: '8px',
                              right: '8px',
                              minHeight: '40px',
                              maxHeight: '56px',
                            }}
                            title={`${appointment.time || 'No time'} - ${appointment.client?.name || 'No client'} (Drag to move)`}
                          >
                            <div className="p-2 md:p-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className={`font-semibold truncate text-sm ${
                                    getStatusColors(appointment.status).textDark
                                  }`}>
                                    {appointment.client?.name || 'No client'}
                                  </div>
                                  <div className={`text-xs mt-1 truncate ${
                                    getStatusColors(appointment.status).textDark
                                  }`}>
                                    {appointment.time || 'No time'} • {appointment.services?.slice(0, 1).join(', ') || 'No services'}
                                  </div>
                                </div>
                                
                                {/* Action buttons - hidden on mobile, visible on hover on desktop */}
                                <div className="hidden md:flex space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openViewModal(appointment);
                                    }}
                                    className="p-1 text-stone-500 hover:bg-stone-200 rounded"
                                    title="View"
                                  >
                                    <Eye className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Day View Instructions */}
            <div className="text-center text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
              <p>💡 <strong>Drag appointments</strong> to reschedule to different times (15-minute precision)</p>
            </div>
          </div>
        )}

        {viewMode === 'list' && (
          <div className="space-y-3">
            {filteredAppointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No appointments found</p>
              </div>
            ) : (
              filteredAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {appointment.time || 'No time set'}
                          </span>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          getStatusColors(appointment.status).bgLight
                        } ${getStatusColors(appointment.status).textDark}`}>
                          {appointment.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2 mb-1">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {appointment.client?.name || 'No client name'}
                        </span>
                      </div>
                      
                      {appointment.client?.phone && (
                        <div className="flex items-center space-x-2 mb-1">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {appointment.client.phone}
                          </span>
                        </div>
                      )}
                      
                      {appointment.client?.address && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {appointment.client.address}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col justify-between">
                      <div className="text-right mb-3">
                        <div className="text-sm font-medium text-gray-900">
                          {appointment.date ? formatShortDate(new Date(appointment.date)) : 'No date'}
                        </div>
                        {appointment.client?.pets && appointment.client.pets.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {appointment.client.pets.length} pet{appointment.client.pets.length > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openViewModal(appointment);
                          }}
                          className="p-1 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(appointment);
                          }}
                          className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAppointment(appointment.id);
                          }}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Add Appointment Button */}
      <div className="fixed bottom-6 right-6">
        <button 
          onClick={openAddModal}
          className="bg-stone-600 hover:bg-stone-700 text-white rounded-full p-4 shadow-lg transition-colors"
          title="Add New Appointment"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Appointment Modal */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/40 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative mx-auto rounded-3xl shadow-2xl bg-white border border-gray-200 w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="px-8 py-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold tracking-tight text-gray-900">
                    {isAddingNew ? '✨ New Appointment' : editMode ? '📝 Edit Appointment' : '👁️ View Appointment'}
                  </h3>
                  <p className="text-gray-700 mt-1 text-sm">
                    {isAddingNew ? 'Schedule a new grooming service' : editMode ? 'Update appointment information' : 'Appointment details'}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full p-2 transition-all duration-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-8">
              {selectedAppointment && !editMode && !isAddingNew ? (
                /* View Mode */
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date & Time</label>
                      <div className="flex items-center space-x-2 text-gray-900">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{selectedAppointment.date || 'No date'}</span>
                        <Clock className="w-4 h-4 text-gray-400 ml-4" />
                        <span>{selectedAppointment.time || 'No time'}</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                        getStatusColors(selectedAppointment.status).bgLight
                      } ${getStatusColors(selectedAppointment.status).textDark}`}>
                        {selectedAppointment.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Client Information</label>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{selectedAppointment.client?.name || 'No client name'}</span>
                      </div>
                      {selectedAppointment.client?.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{selectedAppointment.client.phone}</span>
                        </div>
                      )}
                      {selectedAppointment.client?.address && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>{selectedAppointment.client.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      onClick={() => setEditMode(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Edit Appointment
                    </button>
                    <button
                      onClick={() => deleteAppointment(selectedAppointment.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                /* Edit/Add Mode - Placeholder for form */
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">
                    {isAddingNew ? 'Add appointment form will be implemented here' : 'Edit appointment form will be implemented here'}
                  </p>
                  <div className="space-x-3">
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        showToast('Form functionality to be implemented', 'info');
                        setShowModal(false);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {isAddingNew ? 'Create Appointment' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IOSAppointmentManagement;
