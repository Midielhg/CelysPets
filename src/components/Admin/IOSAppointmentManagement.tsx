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
import type { Appointment } from '../../types';
import { apiUrl } from '../../config/api';

interface IOSAppointmentManagementProps {}

const IOSAppointmentManagement: React.FC<IOSAppointmentManagementProps> = () => {
  const { showToast } = useToast();
  
  // State management
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | '4day' | 'day'>('month');
  const [filter, setFilter] = useState<'all' | 'today' | 'pending' | 'confirmed' | 'completed'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [draggedAppointment, setDraggedAppointment] = useState<Appointment | null>(null);
  const [resizing, setResizing] = useState<{ appointmentId: string; edge: 'top' | 'bottom' } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [justFinishedResizing, setJustFinishedResizing] = useState(false);

  // Helper functions for time calculations
  const parseTime = (timeStr: string): number => {
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let totalMinutes = hours * 60 + (minutes || 0);
    if (period === 'PM' && hours !== 12) totalMinutes += 12 * 60;
    if (period === 'AM' && hours === 12) totalMinutes = minutes || 0;
    return totalMinutes;
  };

  const formatTimeFromMinutes = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
  };

  const calculateEndTime = (startTime: string, duration: number = 60): string => {
    const startMinutes = parseTime(startTime);
    const endMinutes = startMinutes + duration;
    return formatTimeFromMinutes(endMinutes);
  };

  const calculateDurationFromTimes = (startTime: string, endTime: string): number => {
    const startMinutes = parseTime(startTime);
    const endMinutes = parseTime(endTime);
    return Math.max(15, endMinutes - startMinutes); // Minimum 15 minutes
  };

  const getActualDuration = (appointment: Appointment): number => {
    // If both start and end times exist, calculate from times
    if (appointment.time && appointment.endTime) {
      return calculateDurationFromTimes(appointment.time, appointment.endTime);
    }
    // Otherwise use the duration field or default to 60 minutes
    return appointment.duration || 60;
  };

  const getAppointmentHeight = (duration: number = 60): number => {
    // Match the actual grid height: 48px on mobile, 64px on desktop
    const hourHeight = window.innerWidth >= 768 ? 64 : 48;
    return Math.max(30, (duration / 60) * hourHeight); // Minimum 30px height
  };

  const handleResizeStart = (e: React.MouseEvent, appointmentId: string, edge: 'top' | 'bottom') => {
    e.stopPropagation();
    e.preventDefault();
    setIsDragging(false); // Ensure we're not in drag mode
    setResizing({ appointmentId, edge });
    
    // Disable drag on the parent element while resizing
    const appointmentElement = document.querySelector(`[data-appointment-id="${appointmentId}"]`) as HTMLElement;
    if (appointmentElement) {
      appointmentElement.draggable = false;
      // Also prevent click events during resize
      appointmentElement.style.pointerEvents = 'none';
    }
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!resizing) return;
    
    // Prevent this from interfering with drag operations
    if (isDragging) {
      setResizing(null);
      return;
    }
    
    const appointment = appointments.find(apt => apt.id === resizing.appointmentId);
    if (!appointment) return;

    // Calculate new time based on mouse position
    const container = document.querySelector('.day-view-grid');
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    
    // Each hour height matches the grid: 64px on mobile, 80px on desktop
    const pixelsPerHour = window.innerWidth >= 768 ? 80 : 64;
    const startTimeMinutes = 6 * 60; // 6 AM in minutes from midnight
    
    // Calculate new time in minutes from midnight
    const hoursFromStart = relativeY / pixelsPerHour;
    const totalMinutesFromMidnight = startTimeMinutes + (hoursFromStart * 60);
    
    // Round to nearest 15-minute interval
    const roundedMinutes = Math.round(totalMinutesFromMidnight / 15) * 15;
    const clampedMinutes = Math.max(startTimeMinutes, Math.min(22 * 60, roundedMinutes)); // 6 AM to 10 PM
    
    const newTime = formatTimeFromMinutes(clampedMinutes);

    const currentStartMinutes = parseTime(appointment.time);
    const currentDuration = appointment.duration || 60;
    const currentEndMinutes = currentStartMinutes + currentDuration;

    let updatedAppointment = { ...appointment };

    if (resizing.edge === 'top') {
      // Adjust start time, keep end time
      const endTime = formatTimeFromMinutes(currentEndMinutes);
      const newDuration = Math.max(15, currentEndMinutes - clampedMinutes);
      updatedAppointment = {
        ...appointment,
        time: newTime,
        duration: newDuration,
        endTime
      };
    } else {
      // Adjust end time, keep start time
      const newEndMinutes = Math.max(currentStartMinutes + 15, clampedMinutes);
      const newDuration = newEndMinutes - currentStartMinutes;
      updatedAppointment = {
        ...appointment,
        duration: newDuration,
        endTime: formatTimeFromMinutes(newEndMinutes)
      };
    }

    // Update appointment only if resizing is still active
    if (resizing) {
      setAppointments(prev => prev.map(apt => 
        apt.id === resizing.appointmentId ? updatedAppointment : apt
      ));
    }
  };

  const handleResizeEnd = () => {
    setJustFinishedResizing(true);
    
    // Re-enable drag and click events on all appointment elements with a small delay
    setTimeout(() => {
      const appointmentElements = document.querySelectorAll('[data-appointment-id]') as NodeListOf<HTMLElement>;
      appointmentElements.forEach(element => {
        element.draggable = true;
        element.style.pointerEvents = 'auto';
      });
      setJustFinishedResizing(false);
    }, 100); // Small delay to prevent accidental clicks
    
    setResizing(null);
  };

  // Add event listeners for resize
  useEffect(() => {
    if (resizing && !isDragging) {
      const handleMouseMove = (e: MouseEvent) => handleResizeMove(e);
      const handleMouseUp = () => handleResizeEnd();
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      // Also listen for escape key to cancel resize
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleResizeEnd();
        }
      };
      document.addEventListener('keydown', handleEscape);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [resizing, isDragging]);

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
          time: '6:15 AM',
          endTime: '8:00 AM',
          duration: 105, // 1 hour 45 minutes
          assignedGroomer: 'Maria Rodriguez',
          status: 'confirmed',
          services: ['Full Grooming', 'Nail Trim'],
          createdAt: today.toISOString(),
          updatedAt: today.toISOString(),
          client: {
            id: 'client-1',
            name: 'Greta Raya recomendado por Clariza',
            email: 'greta@example.com',
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
          endTime: '3:00 PM',
          duration: 45,
          assignedGroomer: 'Carlos Martinez',
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
          endTime: '1:15 PM',
          duration: 105,
          assignedGroomer: 'Ana Silva',
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
    } else if (viewMode === '4day') {
      newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 4 : -4));
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
    // Prevent drag if we're currently resizing
    if (resizing) {
      e.preventDefault();
      return;
    }
    
    setIsDragging(true);
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
    <div className="bg-gradient-to-br from-stone-50 to-neutral-50 md:rounded-lg md:shadow-sm md:border md:border-stone-200 overflow-hidden">
      {/* iOS-style Header */}
      <div className="bg-gradient-to-r from-stone-50 to-neutral-50 border-b border-stone-200">
        <div className="px-2 md:px-4 py-4 md:py-6">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h1 className="text-lg md:text-2xl font-semibold text-stone-800">
              {viewMode === 'month' && selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              {viewMode === 'week' && (() => {
                const currentDate = new Date(selectedDate);
                const startOfWeek = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay()));
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                
                const startMonth = startOfWeek.toLocaleDateString('en-US', { month: 'short' });
                const endMonth = endOfWeek.toLocaleDateString('en-US', { month: 'short' });
                const year = startOfWeek.getFullYear();
                
                if (startMonth === endMonth) {
                  return `${startMonth} ${startOfWeek.getDate()}-${endOfWeek.getDate()}, ${year}`;
                } else {
                  return `${startMonth} ${startOfWeek.getDate()} - ${endMonth} ${endOfWeek.getDate()}, ${year}`;
                }
              })()}
              {viewMode === '4day' && (() => {
                const startDate = new Date(selectedDate);
                const endDate = new Date(selectedDate);
                endDate.setDate(startDate.getDate() + 3);
                
                const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
                const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
                const year = startDate.getFullYear();
                
                if (startMonth === endMonth) {
                  return `${startMonth} ${startDate.getDate()}-${endDate.getDate()}, ${year}`;
                } else {
                  return `${startMonth} ${startDate.getDate()} - ${endMonth} ${endDate.getDate()}, ${year}`;
                }
              })()}
              {viewMode === 'day' && selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </h1>
            <div className="flex items-center space-x-1 md:space-x-2">
              <button
                onClick={goToToday}
                className="px-2 md:px-3 py-1 text-xs md:text-sm font-medium text-stone-600 bg-white rounded-full border border-stone-300 hover:bg-stone-50 transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-1.5 md:p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-full transition-colors"
              >
                <Filter className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>

          {/* View Mode Selector */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 bg-white rounded-lg p-0.5 md:p-1 shadow-sm">
              {(['month', 'week', '4day', 'day'] as const).map((mode) => {
                const labelMap = {
                  'month': 'Month',
                  'week': 'Week', 
                  '4day': '4-Day',
                  'day': 'Day'
                };
                
                return (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-2 md:px-3 py-1 text-xs md:text-sm font-medium rounded-md transition-colors ${
                      viewMode === mode
                        ? 'bg-stone-600 text-white shadow-sm'
                        : 'text-stone-600 hover:text-stone-800 hover:bg-stone-100'
                    }`}
                  >
                    {labelMap[mode]}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center space-x-1 md:space-x-2">
              <button
                onClick={() => navigateDate('prev')}
                className="p-1.5 md:p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
              >
                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <button
                onClick={() => navigateDate('next')}
                className="p-1.5 md:p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
              >
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="px-2 md:px-4 pb-3 md:pb-4 border-t border-gray-200 bg-white">
            <div className="flex flex-wrap gap-1 md:gap-2 pt-3 md:pt-4">
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
                    className={`px-2 md:px-3 py-1 text-xs md:text-sm font-medium rounded-full transition-colors ${getFilterColors()}`}
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
      <div className="p-1 md:p-4">
        {viewMode === 'month' && (
          <div className="space-y-2 md:space-y-4">
            {/* Month Grid */}
            <div className="grid grid-cols-7 gap-px md:gap-1">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="p-1 md:p-2 text-center text-xs md:text-sm font-medium text-gray-500">
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
                    className={`relative p-1 md:p-2 min-h-[80px] md:min-h-[100px] cursor-pointer md:rounded-lg border-0 md:border transition-colors ${
                      isSelected
                        ? 'bg-stone-100 md:bg-stone-50 md:border-stone-200'
                        : isCurrentMonth
                        ? 'bg-white md:border-stone-100 hover:bg-stone-50'
                        : 'bg-stone-50 md:border-stone-100 text-stone-400'
                    }`}
                    style={{
                      borderRight: '1px solid #e5e7eb'
                    }}
                  >
                    <div className={`text-xs md:text-sm font-medium mb-1 flex justify-center ${
                      isTodayDate && isCurrentMonth
                        ? 'bg-stone-600 text-white rounded-full w-5 h-5 md:w-6 md:h-6 items-center justify-center text-xs mx-auto'
                        : ''
                    }`}>
                      {day.getDate()}
                    </div>
                    
                    {/* Appointment indicators - Mobile Optimized */}
                    {dayAppointments.length > 0 && (
                      <div className="space-y-0.5 md:space-y-1">
                        {dayAppointments.slice(0, 5).map((apt, aptIndex) => (
                          <div
                            key={aptIndex}
                            className={`text-xs px-1 py-0.5 rounded cursor-pointer hover:opacity-80 transition-opacity border-l-2 ${
                              getStatusColors(apt.status).bgLight
                            } ${getStatusColors(apt.status).textDark} ${getStatusColors(apt.status).border}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              openViewModal(apt);
                            }}
                            title={`${apt.time || 'No time'} - ${apt.client?.name || 'No client'} - ${apt.services?.join(', ') || 'No services'} (${apt.status})`}
                          >
                            <div className="flex items-center justify-between leading-tight">
                              <div className="truncate font-medium text-xs flex-1 min-w-0">
                                {apt.client?.name?.split(' ')[0] || 'No client'}
                              </div>
                              {apt.time && (
                                <div className="hidden sm:block text-xs opacity-75 ml-1 flex-shrink-0">
                                  {apt.time?.replace(' ', '') || ''}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {dayAppointments.length > 5 && (
                          <div className="text-xs text-gray-500 text-center font-medium">
                            +{dayAppointments.length - 5}
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
          <div className="space-y-2 md:space-y-4">
            {/* Week Header with Days */}
            <div className="bg-gray-50 rounded-lg p-1 md:p-2 mb-2 md:mb-4">
              <div className="flex">
                {/* Time column header - matches content width */}
                <div className="w-10 md:w-16 p-1 md:p-2 text-xs font-medium text-gray-500 text-center">
                  Time
                </div>
                {/* Day headers */}
                <div className="flex-1 grid grid-cols-7 gap-px md:gap-1">
                  {Array.from({ length: 7 }, (_, i) => {
                    const currentDate = new Date(selectedDate);
                    const startOfWeek = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay()));
                    const dayDate = new Date(startOfWeek);
                    dayDate.setDate(startOfWeek.getDate() + i);
                    const isTodayDate = isToday(dayDate);
                    
                    return (
                      <div key={i} className="text-center py-1 md:py-2">
                        <div className="text-xs text-stone-500 mb-1">
                          {dayDate.toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className={`text-xs md:text-sm font-semibold ${
                          isTodayDate 
                            ? 'bg-stone-600 text-white rounded-full w-5 h-5 md:w-7 md:h-7 flex items-center justify-center mx-auto text-xs' 
                            : 'text-stone-800'
                        }`}>
                          {dayDate.getDate()}
                        </div>
                        <div className="text-xs text-stone-400 mt-1 hidden md:block">
                          {dayDate.toLocaleDateString('en-US', { month: 'short' })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Time Grid */}
            <div className="bg-white md:rounded-lg border-0 md:border border-gray-200 overflow-hidden">
              <div className="relative">
                {/* Time slots */}
                <div className="flex">
                  {/* Time column - Mobile Optimized */}
                  <div className="w-10 md:w-16 border-r border-gray-200">
                    {Array.from({ length: 17 }, (_, hourIndex) => {
                      const hour = hourIndex + 6; // Start from 6 AM
                      const timeLabel = hour === 12 ? '12' : 
                                      hour > 12 ? `${hour - 12}` : 
                                      hour === 0 ? '12' :
                                      `${hour}`;
                      const period = hour >= 12 ? 'PM' : 'AM';
                      
                      return (
                        <div key={hourIndex} className="h-12 md:h-16 flex items-center justify-end border-b border-gray-200 last:border-b-0">
                          <div className="text-xs text-gray-500 mr-1 md:mr-2 text-right">
                            <div className="font-medium text-xs">{timeLabel}</div>
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
                              className="h-12 md:h-16 border-b border-gray-200 last:border-b-0 relative pointer-events-none"
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
                          
                          // Match the heights used in day view: 48px mobile, 64px desktop
                          const hourHeight = window.innerWidth >= 768 ? 64 : 48;
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
                              className={`absolute pointer-events-auto text-xs p-0.5 md:p-1 mx-0.5 rounded cursor-move shadow-sm hover:shadow-md transition-all duration-200 z-30 border-l-2 ${
                                getStatusColors(appointment.status).bgLight
                              } ${getStatusColors(appointment.status).textDark} ${getStatusColors(appointment.status).border}`}
                              style={{
                                top: `${topPosition}px`,
                                left: `${(dayIndex * (100 / 7)) + 0.5}%`,
                                width: `${(100 / 7) - 1}%`,
                                height: `${Math.min(hourHeight - 4, getAppointmentHeight(getActualDuration(appointment)))}px`,
                              }}
                              title={`${appointment.time || 'No time'} - ${appointment.client?.name || 'No client'} (Drag to move)`}
                            >
                              <div className="flex items-center justify-between leading-tight overflow-hidden">
                                <div className="font-medium truncate text-xs flex-1 min-w-0">
                                  {appointment.client?.name?.split(' ')[0] || 'No client'}
                                </div>
                                {appointment.time && (
                                  <div className="hidden sm:block text-xs opacity-75 ml-0.5 flex-shrink-0">
                                    {appointment.time?.replace(' ', '') || ''}
                                  </div>
                                )}
                              </div>
                              {appointment.services && appointment.services.length > 0 && (
                                <div className="truncate opacity-90 text-xs leading-tight">
                                  {Array.isArray(appointment.services) 
                                    ? appointment.services.slice(0, 1).join('')
                                    : 'Services'
                                  }
                                  {appointment.services.length > 1 && ` +${appointment.services.length - 1}`}
                                </div>
                              )}
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
          <div className="space-y-2 md:space-y-4">
            {/* Day Header - iOS Style */}
            <div className="bg-gray-50 rounded-lg p-2 md:p-4">
              <div className="text-center">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-1">
                  {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long' 
                  })}
                </h2>
                <div className="text-sm md:text-lg text-gray-600">
                  {selectedDate.toLocaleDateString('en-US', { 
                    month: 'long',
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </div>
                {isToday(selectedDate) && (
                  <span className="inline-block mt-2 text-xs md:text-sm text-stone-600 font-medium bg-stone-100 px-2 md:px-3 py-1 rounded-full">Today</span>
                )}
              </div>
            </div>

            {/* Day Time Grid - iOS Calendar Style */}
            <div className="bg-white md:rounded-lg border-0 md:border border-stone-200 overflow-hidden">
              <div className="relative">
                {/* Time slots */}
                <div className="flex">
                  {/* Time column - Mobile Optimized */}
                  <div className="w-10 md:w-16 border-r border-stone-200">
                    {Array.from({ length: 17 }, (_, hourIndex) => {
                      const hour = hourIndex + 6; // Start from 6 AM
                      const timeLabel = hour === 12 ? '12' : 
                                      hour > 12 ? `${hour - 12}` : 
                                      hour === 0 ? '12' :
                                      `${hour}`;
                      const period = hour >= 12 ? 'PM' : 'AM';
                      
                      return (
                        <div key={hourIndex} className="h-12 md:h-16 flex items-center justify-end border-b border-gray-200 last:border-b-0">
                          <div className="text-xs text-gray-500 mr-1 md:mr-2 text-right">
                            <div className="font-medium text-xs">{timeLabel}</div>
                            <div className="text-xs opacity-75">{period}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Appointment area */}
                  <div className="flex-1 relative day-view-grid">
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
                        className="h-12 md:h-16 border-b border-gray-200 last:border-b-0 relative pointer-events-none"
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
                        
                        // Calculate position (each hour is 48px on mobile, 64px on desktop)
                        const hourHeight = window.innerWidth >= 768 ? 64 : 48;
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
                              setIsDragging(false);
                              setDraggedAppointment(null);
                              if (e.currentTarget instanceof HTMLElement) {
                                e.currentTarget.style.opacity = '1';
                              }
                            }}
                            onClick={() => {
                              if (!justFinishedResizing && !resizing) {
                                openViewModal(appointment);
                              }
                            }}
                            className={`absolute pointer-events-auto rounded-md transition-all duration-200 z-20 mx-1 md:mx-2 hover:shadow-md border-l-4 group ${getStatusColors(appointment.status).bgLight} ${getStatusColors(appointment.status).border} ${
                              resizing?.appointmentId === appointment.id ? 'cursor-ns-resize' : 'cursor-move'
                            }`}
                            style={{
                              top: `${topPosition}px`,
                              left: '4px',
                              right: '4px',
                              height: `${Math.max(getAppointmentHeight(getActualDuration(appointment)), 40)}px`,
                            }}
                            title={`${appointment.time || 'No time'} - ${appointment.endTime || ''} - ${appointment.client?.name || 'No client'} (Drag to move)`}
                          >
                            {/* Top resize handle - only visible on hover on desktop */}
                            <div 
                              className="absolute top-0 left-0 right-0 h-2 md:h-3 cursor-n-resize z-30 opacity-0 md:group-hover:opacity-100 transition-opacity"
                              onMouseDown={(e) => handleResizeStart(e, appointment.id, 'top')}
                              title="Drag to adjust start time"
                            />
                            
                            {/* Main content - Mobile Optimized */}
                            <div className="p-1 md:p-2 h-full flex overflow-hidden relative mt-1 mb-1">
                              {/* Left side - Client info and address */}
                              <div className="flex-1 min-w-0 flex flex-col justify-start">
                                <div className="space-y-0.5 overflow-hidden">
                                  {/* Client Name */}
                                  <div className={`font-semibold truncate text-xs md:text-sm leading-tight ${
                                    getStatusColors(appointment.status).textDark
                                  }`}>
                                    {appointment.client?.name || 'No client'}
                                  </div>
                                  
                                  {/* Address - only show if there's space */}
                                  {appointment.client?.address && (
                                    <div className={`text-xs truncate opacity-75 leading-tight ${
                                      getStatusColors(appointment.status).textDark
                                    }`}>
                                      📍 {appointment.client.address}
                                    </div>
                                  )}
                                  
                                  {/* Time */}
                                  <div className={`text-xs truncate opacity-90 leading-tight ${
                                    getStatusColors(appointment.status).textDark
                                  }`}>
                                    {appointment.time || 'No time'} - {appointment.endTime || calculateEndTime(appointment.time, getActualDuration(appointment))}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Right side - Services and Groomer (hidden on very small mobile) */}
                              <div className="hidden sm:flex flex-col items-end text-right min-w-0 ml-2 justify-start">
                                <div className="space-y-0.5 overflow-hidden">
                                  {appointment.services && appointment.services.length > 0 && (
                                    <div className={`text-xs truncate opacity-75 leading-tight ${
                                      getStatusColors(appointment.status).textDark
                                    }`}>
                                      ✂️ {Array.isArray(appointment.services) 
                                          ? appointment.services.slice(0, 1).join(', ')
                                          : 'Services'
                                        }
                                        {appointment.services.length > 1 && ` +${appointment.services.length - 1}`}
                                    </div>
                                  )}
                                  {appointment.assignedGroomer && (
                                    <div className={`text-xs truncate opacity-75 leading-tight ${
                                      getStatusColors(appointment.status).textDark
                                    }`}>
                                      👤 {appointment.assignedGroomer}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Bottom resize handle - only visible on hover on desktop */}
                            <div 
                              className="absolute bottom-0 left-0 right-0 h-2 md:h-3 cursor-s-resize z-30 opacity-0 md:group-hover:opacity-100 transition-opacity"
                              onMouseDown={(e) => handleResizeStart(e, appointment.id, 'bottom')}
                              title="Drag to adjust end time"
                            />
                            
                            {/* Action buttons - hidden on mobile, visible on hover on desktop */}
                            <div className="absolute top-1 md:top-2 right-1 md:right-2 hidden md:flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Day View Instructions */}
            <div className="text-center text-xs md:text-sm text-gray-500 bg-gray-50 rounded-lg p-2 md:p-3">
              <p>💡 <strong>Drag appointments</strong> to reschedule to different times (15-minute precision)</p>
            </div>
          </div>
        )}

        {viewMode === '4day' && (
          <div className="space-y-2 md:space-y-4">
            {/* 4-Day Header */}
            <div className="bg-gray-50 rounded-lg p-1 md:p-2 mb-2 md:mb-4">
              <div className="flex">
                {/* Time column header - matches content width */}
                <div className="w-10 md:w-16 p-1 md:p-2 text-xs font-medium text-gray-500 text-center">
                  Time
                </div>
                {/* Day headers */}
                <div className="flex-1 grid grid-cols-4 gap-px md:gap-1">
                  {Array.from({ length: 4 }, (_, i) => {
                    const dayDate = new Date(selectedDate);
                    dayDate.setDate(selectedDate.getDate() + i);
                    const isTodayDate = isToday(dayDate);
                    
                    return (
                      <div key={i} className="text-center py-1 md:py-2">
                        <div className="text-xs text-stone-500 mb-1">
                          {dayDate.toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className={`text-xs md:text-sm font-semibold ${
                          isTodayDate 
                            ? 'bg-stone-600 text-white rounded-full w-5 h-5 md:w-7 md:h-7 flex items-center justify-center mx-auto text-xs' 
                            : 'text-stone-800'
                        }`}>
                          {dayDate.getDate()}
                        </div>
                        <div className="text-xs text-stone-400 mt-1 hidden md:block">
                          {dayDate.toLocaleDateString('en-US', { month: 'short' })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Time Grid */}
            <div className="bg-white md:rounded-lg border-0 md:border border-gray-200 overflow-hidden">
              <div className="relative">
                {/* Time slots */}
                <div className="flex">
                  {/* Time column - Mobile Optimized */}
                  <div className="w-10 md:w-16 border-r border-gray-200">
                    {Array.from({ length: 17 }, (_, hourIndex) => {
                      const hour = hourIndex + 6; // Start from 6 AM
                      const timeLabel = hour === 12 ? '12' : 
                                      hour > 12 ? `${hour - 12}` : 
                                      hour === 0 ? '12' :
                                      `${hour}`;
                      const period = hour >= 12 ? 'PM' : 'AM';
                      
                      return (
                        <div key={hourIndex} className="h-12 md:h-16 flex items-center justify-end border-b border-gray-200 last:border-b-0">
                          <div className="text-xs text-gray-500 mr-1 md:mr-2 text-right">
                            <div className="font-medium text-xs">{timeLabel}</div>
                            <div className="text-xs opacity-75">{period}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Days container */}
                  <div className="flex-1 relative">
                    {/* Single large drop zone covering entire 4-day area */}
                    <div
                      className="absolute inset-0 z-10"
                      onDrop={(e) => {
                        // Calculate which day column was dropped on
                        const rect = e.currentTarget.getBoundingClientRect();
                        const relativeX = e.clientX - rect.left;
                        const dayWidth = rect.width / 4;
                        const dayIndex = Math.min(3, Math.floor(relativeX / dayWidth));
                        
                        // Calculate the target date
                        const targetDate = new Date(selectedDate);
                        targetDate.setDate(selectedDate.getDate() + dayIndex);
                        
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
                    <div className="grid grid-cols-4 h-full">
                      {Array.from({ length: 4 }, (_, dayIndex) => (
                        <div key={dayIndex} className="border-r border-gray-100 last:border-r-0">
                          {/* Hour lines for each day */}
                          {Array.from({ length: 17 }, (_, hourIndex) => (
                            <div 
                              key={hourIndex} 
                              className="h-12 md:h-16 border-b border-gray-200 last:border-b-0 relative pointer-events-none"
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
                      {Array.from({ length: 4 }, (_, dayIndex) => {
                        const dayDate = new Date(selectedDate);
                        dayDate.setDate(selectedDate.getDate() + dayIndex);
                        
                        return getAppointmentsForDate(dayDate).map((appointment) => {
                          const appointmentMinutes = convertTimeToMinutes(appointment.time || '12:00 PM');
                          const startMinutes = 360; // 6 AM
                          const relativeMinutes = appointmentMinutes - startMinutes;
                          
                          // Match the heights used in day view: 48px mobile, 64px desktop
                          const hourHeight = window.innerWidth >= 768 ? 64 : 48;
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
                              className={`absolute pointer-events-auto text-xs p-0.5 md:p-1 mx-0.5 rounded cursor-move shadow-sm hover:shadow-md transition-all duration-200 z-30 border-l-2 ${
                                getStatusColors(appointment.status).bgLight
                              } ${getStatusColors(appointment.status).textDark} ${getStatusColors(appointment.status).border}`}
                              style={{
                                top: `${topPosition}px`,
                                left: `${(dayIndex * (100 / 4)) + 0.5}%`,
                                width: `${(100 / 4) - 1}%`,
                                height: `${Math.min(hourHeight - 4, getAppointmentHeight(getActualDuration(appointment)))}px`,
                              }}
                              title={`${appointment.time || 'No time'} - ${appointment.client?.name || 'No client'} (Drag to move)`}
                            >
                              <div className="flex items-center justify-between leading-tight overflow-hidden">
                                <div className="font-medium truncate text-xs flex-1 min-w-0">
                                  {appointment.client?.name?.split(' ')[0] || 'No client'}
                                </div>
                                {appointment.time && (
                                  <div className="hidden lg:block text-xs opacity-75 ml-0.5 flex-shrink-0">
                                    {appointment.time?.replace(' ', '') || ''}
                                  </div>
                                )}
                              </div>
                              {appointment.services && appointment.services.length > 0 && (
                                <div className="truncate opacity-90 text-xs leading-tight">
                                  {Array.isArray(appointment.services) 
                                    ? appointment.services.slice(0, 1).join('')
                                    : 'Services'
                                  }
                                  {appointment.services.length > 1 && ` +${appointment.services.length - 1}`}
                                </div>
                              )}
                            </div>
                          );
                        });
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 4-Day View Instructions */}
            <div className="text-center text-xs md:text-sm text-gray-500 bg-gray-50 rounded-lg p-2 md:p-3">
              <p>💡 <strong>Drag and drop appointments</strong> to reschedule them to different days and times (15-minute precision)</p>
            </div>
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
