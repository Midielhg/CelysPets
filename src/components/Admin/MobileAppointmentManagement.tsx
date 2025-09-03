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
  User
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import type { Appointment } from '../../types';
import { apiUrl } from '../../config/api';

interface MobileAppointmentManagementProps {}

const MobileAppointmentManagement: React.FC<MobileAppointmentManagementProps> = () => {
  const { showToast } = useToast();
  
  // State management
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'agenda'>('month');
  const [filter, setFilter] = useState<'all' | 'today' | 'pending' | 'confirmed' | 'completed'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showAppointmentDetail, setShowAppointmentDetail] = useState(false);

  // Date navigation helpers
  const today = new Date();
  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Generate calendar days for month view
  const generateCalendarDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    const endDate = new Date(lastDay);

    // Adjust to start on Sunday
    startDate.setDate(startDate.getDate() - startDate.getDay());
    // Adjust to end on Saturday
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    const days = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    return days;
  };

  // Generate week days for week view
  const generateWeekDays = () => {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // Get appointments for a specific date
  const getAppointmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(apt => {
      const aptDate = apt.date ? apt.date.split('T')[0] : '';
      return aptDate === dateStr;
    });
  };

  // Navigation handlers
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Fetch appointments
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${apiUrl}/appointments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      } else {
        showToast('Failed to fetch appointments', 'error');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      showToast('Error loading appointments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Filter appointments based on current filter
  const filteredAppointments = appointments.filter(appointment => {
    const today = new Date().toISOString().split('T')[0];
    
    switch (filter) {
      case 'today':
        const aptDate = appointment.date ? appointment.date.split('T')[0] : '';
        return aptDate === today;
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

  const statusColors = {
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    confirmed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    completed: 'bg-blue-100 text-blue-800 border-blue-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200'
  };

  const renderMonthView = () => {
    const days = generateCalendarDays();
    const currentMonth = selectedDate.getMonth();

    return (
      <div className="flex-1 bg-white">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
            <div key={index} className="p-2 text-center text-sm font-medium text-gray-500 bg-gray-50">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 flex-1">
          {days.map((day, index) => {
            const dayAppointments = getAppointmentsForDate(day);
            const isCurrentMonth = day.getMonth() === currentMonth;
            const isSelected = day.toDateString() === selectedDate.toDateString();

            return (
              <div
                key={index}
                className={`min-h-[80px] border-r border-b border-gray-100 p-1 ${
                  !isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'
                } ${isSelected ? 'bg-blue-50' : ''}`}
                onClick={() => {
                  setSelectedDate(day);
                  if (dayAppointments.length > 0) {
                    setViewMode('day');
                  }
                }}
              >
                <div className="flex flex-col h-full">
                  <div className={`text-sm font-medium mb-1 ${
                    isToday(day) 
                      ? 'w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs'
                      : isSelected 
                        ? 'text-blue-600 font-semibold'
                        : ''
                  }`}>
                    {day.getDate()}
                  </div>
                  <div className="flex-1 space-y-1">
                    {dayAppointments.slice(0, 2).map((apt) => (
                      <div
                        key={apt.id}
                        className="text-xs bg-blue-100 text-blue-800 rounded px-1 py-0.5 truncate"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAppointment(apt);
                          setShowAppointmentDetail(true);
                        }}
                      >
                        {apt.time} {apt.client?.name}
                      </div>
                    ))}
                    {dayAppointments.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{dayAppointments.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const days = generateWeekDays();

    return (
      <div className="flex-1 bg-white">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {days.map((day, index) => {
            const isSelectedDay = day.toDateString() === selectedDate.toDateString();
            return (
              <div key={index} className={`p-3 text-center border-r border-gray-100 ${
                isSelectedDay ? 'bg-blue-50' : 'bg-gray-50'
              }`}>
                <div className="text-xs text-gray-500 uppercase">
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className={`text-lg font-semibold mt-1 ${
                  isToday(day) 
                    ? 'w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto'
                    : isSelectedDay 
                      ? 'text-blue-600'
                      : 'text-gray-900'
                }`}>
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Time slots */}
        <div className="flex-1 overflow-y-auto">
          {Array.from({ length: 12 }, (_, i) => {
            const hour = i + 7; // 7 AM to 6 PM
            const timeLabel = hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`;
            
            return (
              <div key={hour} className="flex border-b border-gray-100 min-h-[60px]">
                <div className="w-16 p-2 text-xs text-gray-500 bg-gray-50 border-r border-gray-100">
                  {timeLabel}
                </div>
                <div className="flex-1 grid grid-cols-7">
                  {days.map((day, dayIndex) => {
                    const dayAppointments = getAppointmentsForDate(day);
                    const hourAppointments = dayAppointments.filter(apt => {
                      const aptHour = parseInt(apt.time?.split(':')[0] || '0');
                      const aptPeriod = apt.time?.includes('PM') ? 'PM' : 'AM';
                      let normalizedHour = aptHour;
                      if (aptPeriod === 'PM' && aptHour !== 12) normalizedHour += 12;
                      if (aptPeriod === 'AM' && aptHour === 12) normalizedHour = 0;
                      return normalizedHour === hour;
                    });

                    return (
                      <div
                        key={dayIndex}
                        className="border-r border-gray-100 p-1 relative"
                        onClick={() => setSelectedDate(day)}
                      >
                        {hourAppointments.map((apt) => (
                          <div
                            key={apt.id}
                            className="text-xs bg-blue-500 text-white rounded p-1 mb-1 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAppointment(apt);
                              setShowAppointmentDetail(true);
                            }}
                          >
                            <div className="font-medium">{apt.client?.name}</div>
                            <div className="opacity-90">{apt.time}</div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayAppointments = getAppointmentsForDate(selectedDate);

    return (
      <div className="flex-1 bg-white">
        {/* Date header */}
        <div className="bg-gray-50 p-4 border-b border-gray-200">
          <div className="text-center">
            <div className="text-sm text-gray-500 uppercase">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
            </div>
            <div className={`text-2xl font-bold mt-1 ${
              isToday(selectedDate) ? 'text-red-500' : 'text-gray-900'
            }`}>
              {selectedDate.getDate()}
            </div>
            <div className="text-sm text-gray-600">
              {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Appointments list */}
        <div className="flex-1 overflow-y-auto">
          {dayAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Calendar className="w-12 h-12 mb-4 text-gray-300" />
              <p className="text-lg font-medium">No appointments</p>
              <p className="text-sm">No appointments scheduled for this day</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {dayAppointments
                .sort((a, b) => {
                  const timeA = new Date(`2000-01-01 ${a.time}`).getTime();
                  const timeB = new Date(`2000-01-01 ${b.time}`).getTime();
                  return timeA - timeB;
                })
                .map((appointment) => (
                  <div
                    key={appointment.id}
                    className="p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                    onClick={() => {
                      setSelectedAppointment(appointment);
                      setShowAppointmentDetail(true);
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {appointment.client?.name}
                          </p>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                            statusColors[appointment.status as keyof typeof statusColors]
                          }`}>
                            {appointment.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{appointment.time}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {Array.isArray(appointment.services) 
                            ? appointment.services.join(', ') 
                            : 'No services listed'}
                        </p>
                        {appointment.client?.address && (
                          <p className="text-xs text-gray-500 flex items-center mt-1">
                            <MapPin className="w-3 h-3 mr-1" />
                            {appointment.client.address}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAgendaView = () => {
    // Group appointments by date
    const groupedAppointments = filteredAppointments.reduce((groups, appointment) => {
      const date = appointment.date ? appointment.date.split('T')[0] : '';
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(appointment);
      return groups;
    }, {} as Record<string, Appointment[]>);

    // Sort dates
    const sortedDates = Object.keys(groupedAppointments).sort();

    return (
      <div className="flex-1 bg-gray-50 overflow-y-auto">
        {sortedDates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="w-16 h-16 mb-4 text-gray-300" />
            <p className="text-xl font-medium text-gray-500">No appointments</p>
            <p className="text-sm text-gray-400">No appointments found for the current filter</p>
          </div>
        ) : (
          <div className="space-y-1">
            {sortedDates.map((dateStr) => {
              const date = new Date(dateStr + 'T00:00:00');
              const dayAppointments = groupedAppointments[dateStr].sort((a, b) => {
                const timeA = new Date(`2000-01-01 ${a.time}`).getTime();
                const timeB = new Date(`2000-01-01 ${b.time}`).getTime();
                return timeA - timeB;
              });

              const totalDuration = dayAppointments.reduce((total) => {
                // Estimate 1 hour per appointment if no duration specified
                return total + 60; 
              }, 0);

              const totalDistance = dayAppointments.length * 2.5; // Estimate 2.5 miles between appointments

              return (
                <div key={dateStr} className="bg-white">
                  {/* Date Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 border-b border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-blue-900">
                          {date.toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </h3>
                        <p className="text-sm text-blue-700">
                          {dayAppointments.length} appointment{dayAppointments.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-4 text-sm text-blue-700">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{Math.floor(totalDuration / 60)}h {totalDuration % 60}m</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{totalDistance.toFixed(1)} mi</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Appointments List */}
                  <div className="divide-y divide-gray-100">
                    {dayAppointments.map((appointment, index) => {
                      const estimatedDriveTime = index === 0 ? 0 : 8; // 8 minutes between appointments
                      const estimatedDistance = index === 0 ? 0 : 2.5; // 2.5 miles between appointments

                      return (
                        <div
                          key={appointment.id}
                          className="px-4 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setShowAppointmentDetail(true);
                          }}
                        >
                          <div className="flex items-center space-x-3">
                            {/* Time indicator */}
                            <div className="flex-shrink-0">
                              <div className="text-right">
                                <div className="text-sm font-medium text-gray-900">
                                  {appointment.time}
                                </div>
                                {estimatedDriveTime > 0 && (
                                  <div className="flex items-center justify-end space-x-1 mt-1">
                                    <div className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                                      <span>{estimatedDriveTime} mins</span>
                                      <span>{estimatedDistance} mi</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Status indicator */}
                            <div className="flex-shrink-0">
                              <div className={`w-3 h-3 rounded-full ${
                                appointment.status === 'confirmed' ? 'bg-green-500' :
                                appointment.status === 'pending' ? 'bg-yellow-500' :
                                appointment.status === 'completed' ? 'bg-blue-500' :
                                'bg-red-500'
                              }`}></div>
                            </div>

                            {/* Appointment details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {appointment.client?.name}
                                </p>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                                  statusColors[appointment.status as keyof typeof statusColors]
                                }`}>
                                  {appointment.status?.toUpperCase()}
                                </span>
                              </div>
                              
                              <div className="mt-1">
                                <p className="text-sm text-gray-600">
                                  {Array.isArray(appointment.services) 
                                    ? appointment.services.join(', ') 
                                    : 'No services listed'}
                                </p>
                                {appointment.client?.address && (
                                  <p className="text-xs text-gray-500 flex items-center mt-1">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    {appointment.client.address}
                                  </p>
                                )}
                                {appointment.client?.phone && (
                                  <p className="text-xs text-gray-500 flex items-center mt-1">
                                    <Phone className="w-3 h-3 mr-1" />
                                    {appointment.client.phone}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            
            <div className="text-center">
              <h1 className="text-lg font-semibold text-gray-900">
                {viewMode === 'month' && selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                {viewMode === 'week' && `Week of ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                {viewMode === 'day' && formatDate(selectedDate)}
              </h1>
              <p className="text-xs text-gray-500 uppercase font-medium">
                {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? 's' : ''}
              </p>
            </div>

            <button
              onClick={() => navigateDate('next')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Filter className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* View mode selector */}
        <div className="flex justify-center mt-3">
          <div className="bg-gray-100 rounded-lg p-1 flex space-x-1">
            {['month', 'week', 'day', 'agenda'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All' },
              { key: 'today', label: 'Today' },
              { key: 'pending', label: 'Pending' },
              { key: 'confirmed', label: 'Confirmed' },
              { key: 'completed', label: 'Completed' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filter === key
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main content */}
      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'day' && renderDayView()}
      {viewMode === 'agenda' && renderAgendaView()}

      {/* Floating Add Button */}
      <button
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
        onClick={() => {
          // Handle add appointment
          showToast('Add appointment feature coming soon!', 'info');
        }}
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Appointment Detail Modal */}
      {showAppointmentDetail && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-2xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Appointment Details</h3>
                <button
                  onClick={() => setShowAppointmentDetail(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <span className="sr-only">Close</span>
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {/* Client info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{selectedAppointment.client?.name}</p>
                      {selectedAppointment.client?.phone && (
                        <p className="text-sm text-gray-600 flex items-center">
                          <Phone className="w-4 h-4 mr-1" />
                          {selectedAppointment.client.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Appointment info */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">
                      {new Date(selectedAppointment.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{selectedAppointment.time}</span>
                  </div>
                  {selectedAppointment.client?.address && (
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{selectedAppointment.client.address}</span>
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                    statusColors[selectedAppointment.status as keyof typeof statusColors]
                  }`}>
                    {selectedAppointment.status}
                  </span>
                </div>

                {/* Services */}
                {selectedAppointment.services && (
                  <div>
                    <span className="text-gray-600 block mb-2">Services</span>
                    <div className="space-y-1">
                      {Array.isArray(selectedAppointment.services) ? (
                        selectedAppointment.services.map((service, index) => (
                          <div key={index} className="bg-blue-50 text-blue-800 px-3 py-1 rounded-lg text-sm">
                            {service}
                          </div>
                        ))
                      ) : (
                        <div className="bg-blue-50 text-blue-800 px-3 py-1 rounded-lg text-sm">
                          {selectedAppointment.services}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-3 pt-4">
                  <button className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors">
                    Edit
                  </button>
                  <button className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                    Contact
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileAppointmentManagement;
