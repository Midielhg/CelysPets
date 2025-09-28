import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { GroomerService, type GroomerAppointment, type GroomerStats } from '../../services/groomerService';
import { 
  Calendar, 
  Clock, 
  User, 
  CheckCircle, 
  MapPin, 
  DollarSign, 
  Phone
} from 'lucide-react';
import AppointmentActionModal from './AppointmentActionModal';

const GroomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<GroomerAppointment[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<GroomerAppointment[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<GroomerAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<GroomerStats>({
    todayEarnings: 0,
    weeklyEarnings: 0,
    completedToday: 0,
    totalClients: 0,
    thisMonthEarnings: 0,
    totalAppointments: 0
  });
  const [selectedAppointmentForAction, setSelectedAppointmentForAction] = useState<GroomerAppointment | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [viewType, setViewType] = useState<'today' | 'previous' | 'upcoming'>('today');
  const [pastAppointments, setPastAppointments] = useState<GroomerAppointment[]>([]);

  // Utility functions to extract data from JSON fields
  const getServiceName = (services: any) => {
    // Debug: Log the entire services object to see the structure
    console.log('🛠️ SERVICES DEBUG:', JSON.stringify(services, null, 2));
    
    if (!services) {
      return 'Grooming Service';
    }
    
    let serviceList = services;
    
    // Handle JSON string
    if (typeof services === 'string') {
      try {
        serviceList = JSON.parse(services);
      } catch {
        return 'Grooming Service';
      }
    }
    
    // Handle array of services
    if (Array.isArray(serviceList) && serviceList.length > 0) {
      const service = serviceList[0];
      const serviceName = service.name || service.service || service.serviceName || service.service_name || service.title || service.type || service.category;
      return serviceName || 'Grooming Service';
    }
    
    // Handle single service object
    if (serviceList && typeof serviceList === 'object') {
      const serviceName = serviceList.name || serviceList.service || serviceList.serviceName || serviceList.service_name || serviceList.title || serviceList.type || serviceList.category;
      return serviceName || 'Grooming Service';
    }
    
    // Handle direct string
    if (typeof serviceList === 'string' && serviceList.trim()) {
      return serviceList.trim();
    }
    
    return 'Grooming Service';
  };

  const getServicePrice = (appointment: GroomerAppointment) => {
    return appointment.totalAmount || appointment.originalAmount || 0;
  };

  const getPetInfo = (client: any) => {
    // Debug: Log the entire client object to see the structure
    console.log('🐕 CLIENT DEBUG:', JSON.stringify(client, null, 2));
    
    if (!client) {
      return { name: 'Pet', breed: 'Mixed Breed', species: 'dog' };
    }
    
    // Try different possible pet data locations
    let pets = client.pets || client.pet || client.petInfo;
    
    // Handle JSON string
    if (typeof pets === 'string') {
      try {
        pets = JSON.parse(pets);
      } catch {
        return { name: 'Pet', breed: 'Mixed Breed', species: 'dog' };
      }
    }
    
    // Handle array of pets
    if (Array.isArray(pets) && pets.length > 0) {
      const pet = pets[0];
      return {
        name: pet.name || pet.petName || pet.pet_name || 'Pet',
        breed: pet.breed || pet.petBreed || pet.pet_breed || pet.dogBreed || pet.dog_breed || pet.animalBreed || 'Mixed Breed',
        species: pet.species || pet.petType || pet.pet_type || pet.animalType || pet.animal_type || 'dog'
      };
    }
    
    // Handle single pet object
    if (pets && typeof pets === 'object') {
      return {
        name: pets.name || pets.petName || pets.pet_name || 'Pet',
        breed: pets.breed || pets.petBreed || pets.pet_breed || pets.dogBreed || pets.dog_breed || pets.animalBreed || 'Mixed Breed', 
        species: pets.species || pets.petType || pets.pet_type || pets.animalType || pets.animal_type || 'dog'
      };
    }
    
    // If no pets object, try direct fields on client
    if (client.petName || client.pet_name || client.petBreed || client.pet_breed) {
      return {
        name: client.petName || client.pet_name || 'Pet',
        breed: client.petBreed || client.pet_breed || client.dogBreed || client.dog_breed || 'Mixed Breed',
        species: client.petType || client.pet_type || client.animalType || client.animal_type || 'dog'
      };
    }
    
    return { name: 'Pet', breed: 'Mixed Breed', species: 'dog' };
  };

  const getEstimatedDuration = (services: any) => {
    if (Array.isArray(services) && services.length > 0) {
      return services[0].duration || services[0].estimatedDuration || 60;
    }
    return services?.duration || services?.estimatedDuration || 60;
  };

  // Helper function to convert time string to minutes for proper sorting
  const timeToMinutes = (timeStr: string): number => {
    try {
      // Handle various time formats: "9:00 AM", "09:00", "9:30 PM", etc.
      const cleanTime = timeStr.trim().toUpperCase();
      let hours = 0;
      let minutes = 0;
      
      if (cleanTime.includes('AM') || cleanTime.includes('PM')) {
        // 12-hour format
        const isPM = cleanTime.includes('PM');
        const timeWithoutPeriod = cleanTime.replace(/[AP]M/g, '').trim();
        const [hourStr, minuteStr = '0'] = timeWithoutPeriod.split(':');
        
        hours = parseInt(hourStr);
        minutes = parseInt(minuteStr);
        
        // Convert to 24-hour format
        if (isPM && hours !== 12) {
          hours += 12;
        } else if (!isPM && hours === 12) {
          hours = 0;
        }
      } else {
        // 24-hour format
        const [hourStr, minuteStr = '0'] = cleanTime.split(':');
        hours = parseInt(hourStr);
        minutes = parseInt(minuteStr);
      }
      
      return hours * 60 + minutes;
    } catch (error) {
      console.warn('Error parsing time:', timeStr, error);
      return 0; // Fallback to midnight
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchGroomerData();
    }
  }, [user?.id]);

  const fetchGroomerData = async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        console.error('No user ID available');
        return;
      }

      // Fetch all groomer data using Supabase
      const [allAppointments, todayAppts, upcomingAppts, groomerStats] = await Promise.all([
        GroomerService.getGroomerAppointments(user.id),
        GroomerService.getTodaysAppointments(user.id),
        GroomerService.getUpcomingAppointments(user.id),
        GroomerService.getGroomerStats(user.id)
      ]);

      // Debug: Log raw appointment data
      console.log('📅 RAW APPOINTMENTS:', JSON.stringify(allAppointments, null, 2));
      console.log('📅 RAW TODAY APPOINTMENTS:', JSON.stringify(todayAppts, null, 2));
      
      setAppointments(allAppointments);
      setTodayAppointments(todayAppts);
      setUpcomingAppointments(upcomingAppts);
      setStats(groomerStats);

    } catch (error) {
      console.error('Failed to fetch groomer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId: number, newStatus: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled') => {
    try {
      await GroomerService.updateAppointmentStatus(appointmentId, newStatus);
      fetchGroomerData(); // Refresh data
    } catch (error) {
      console.error('Failed to update appointment status:', error);
    }
  };

  const getNextAppointment = () => {
    const now = new Date();
    return appointments
      .filter(apt => new Date(`${apt.date} ${apt.time}`) > now && apt.status !== 'cancelled')
      .sort((a, b) => new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime())[0];
  };

  const openActionModal = (appointment: GroomerAppointment) => {
    setSelectedAppointmentForAction(appointment);
    setShowActionModal(true);
  };

  const handleAppointmentUpdated = () => {
    fetchGroomerData(); // Refresh all data
  };

  const fetchPastAppointments = async () => {
    if (!user?.id) return;
    try {
      const allAppointments = await GroomerService.getGroomerAppointments(user.id);
      const today = new Date().toISOString().split('T')[0];
      const past = allAppointments.filter(appointment => appointment.date < today);
      setPastAppointments(past.reverse()); // Most recent first
    } catch (error) {
      console.error('Failed to fetch past appointments:', error);
    }
  };

  const markAsPaid = async (appointmentId: number) => {
    try {
      console.log('🔄 GroomerDashboard: Marking appointment as paid:', appointmentId);
      await GroomerService.updatePaymentStatus(appointmentId, 'paid');
      console.log('✅ GroomerDashboard: Payment status updated, refreshing data...');
      await handleAppointmentUpdated(); // Refresh data
      console.log('✅ GroomerDashboard: Data refreshed successfully');
      return true;
    } catch (error: any) {
      console.error('❌ GroomerDashboard: Failed to update payment status:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-blue-200 rounded w-1/3 mb-4"></div>
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-blue-100 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const nextAppointment = getNextAppointment();

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6">
      {/* Welcome Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-blue-900">Welcome back, {user?.name}! ✂️</h1>
        <p className="text-blue-700 mt-2 text-sm sm:text-base">Manage your grooming appointments and clients</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-3 sm:p-6 border border-green-200/50">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-100 rounded-lg sm:rounded-xl flex items-center justify-center border border-green-200">
              <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
            </div>
            <div className="ml-2 sm:ml-4">
              <h3 className="text-xs sm:text-lg font-semibold text-blue-900">Today's Earnings</h3>
              <p className="text-lg sm:text-2xl font-bold text-green-600">${stats.todayEarnings}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-3 sm:p-6 border border-blue-200/50">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center border border-blue-200">
              <Calendar className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div className="ml-2 sm:ml-4">
              <h3 className="text-xs sm:text-lg font-semibold text-blue-900">This Week</h3>
              <p className="text-lg sm:text-2xl font-bold text-blue-600">${stats.weeklyEarnings}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-3 sm:p-6 border border-purple-200/50">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-purple-100 rounded-lg sm:rounded-xl flex items-center justify-center border border-purple-200">
              <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" />
            </div>
            <div className="ml-2 sm:ml-4">
              <h3 className="text-xs sm:text-lg font-semibold text-blue-900">Completed Today</h3>
              <p className="text-lg sm:text-2xl font-bold text-purple-600">{stats.completedToday}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-3 sm:p-6 border border-orange-200/50">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-orange-100 rounded-lg sm:rounded-xl flex items-center justify-center border border-orange-200">
              <User className="w-4 h-4 sm:w-6 sm:h-6 text-orange-600" />
            </div>
            <div className="ml-2 sm:ml-4">
              <h3 className="text-xs sm:text-lg font-semibold text-blue-900">Total Clients</h3>
              <p className="text-lg sm:text-2xl font-bold text-orange-600">{stats.totalClients}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Next Appointment */}
      {nextAppointment && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">🚀 Next Appointment</h2>
              <div className="space-y-1">
                <p className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  {new Date(nextAppointment.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
                <p className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  {nextAppointment.time}
                </p>
                                <h3 className="text-lg font-semibold text-white mb-2">Next Appointment</h3>
                <div className="text-white">
                  {nextAppointment.client.name} - {getPetInfo(nextAppointment.client).name}
                </div>
                <div className="text-indigo-100 text-sm flex items-center mt-1">
                  <MapPin className="w-4 h-4 mr-1" />
                  <a 
                    href={`maps://?q=${encodeURIComponent(nextAppointment.client.address || '')}`}
                    className="hover:text-white hover:underline cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      // Try Apple Maps first, fallback to Google Maps
                      const mapsUrl = `maps://?q=${encodeURIComponent(nextAppointment.client.address || '')}`;
                      const googleUrl = `https://maps.google.com/?q=${encodeURIComponent(nextAppointment.client.address || '')}`;
                      
                      // Check if we're on iOS/macOS for Apple Maps
                      const isApple = /iPad|iPhone|iPod|Mac/.test(navigator.userAgent);
                      
                      if (isApple) {
                        window.location.href = mapsUrl;
                        // Fallback to Google Maps if Apple Maps doesn't open
                        setTimeout(() => window.open(googleUrl, '_blank'), 1000);
                      } else {
                        window.open(googleUrl, '_blank');
                      }
                    }}
                  >
                    {nextAppointment.client.address}
                  </a>
                </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">${getServicePrice(nextAppointment)}</div>
              <div className="text-indigo-100 text-sm">{getServiceName(nextAppointment.services)}</div>
              <div className="text-indigo-100 text-sm">{getEstimatedDuration(nextAppointment.services)} min</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">${getServicePrice(nextAppointment)}</div>
              <div className="text-indigo-100 text-sm">{getServiceName(nextAppointment.services)}</div>
              <div className="text-indigo-100 text-sm">{getEstimatedDuration(nextAppointment.services)} min</div>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Navigation */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-blue-900 mb-3 sm:mb-0">Appointments 📅</h2>
          <div className="flex bg-blue-100 rounded-lg p-1 text-sm">
            <button
              onClick={() => {setViewType('previous'); fetchPastAppointments();}}
              className={`px-3 sm:px-4 py-2 rounded-md transition-colors ${
                viewType === 'previous' 
                  ? 'bg-blue-500 text-white shadow-sm' 
                  : 'text-blue-700 hover:bg-blue-200'
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => setViewType('today')}
              className={`px-3 sm:px-4 py-2 rounded-md transition-colors ${
                viewType === 'today' 
                  ? 'bg-blue-500 text-white shadow-sm' 
                  : 'text-blue-700 hover:bg-blue-200'
              }`}
            >
              Today ({todayAppointments.length})
            </button>
            <button
              onClick={() => setViewType('upcoming')}
              className={`px-3 sm:px-4 py-2 rounded-md transition-colors ${
                viewType === 'upcoming' 
                  ? 'bg-blue-500 text-white shadow-sm' 
                  : 'text-blue-700 hover:bg-blue-200'
              }`}
            >
              Upcoming ({upcomingAppointments.length})
            </button>
          </div>
        </div>
        
        {/* Today's Appointments */}
        {viewType === 'today' && (
          <div>
            {todayAppointments.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {todayAppointments
                  .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))
                  .map((appointment) => (
              <div 
                key={appointment.id} 
                className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-xl p-6 border border-blue-200/50 cursor-pointer hover:shadow-2xl hover:scale-[1.02] transition-all duration-200"
                onClick={() => openActionModal(appointment)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${
                      appointment.status === 'completed' 
                        ? 'bg-emerald-100 border-emerald-200' 
                        : appointment.status === 'in-progress'
                        ? 'bg-blue-100 border-blue-200'
                        : appointment.status === 'confirmed'
                        ? 'bg-amber-100 border-amber-200'
                        : 'bg-gray-100 border-gray-200'
                    }`}>
                      {appointment.status === 'completed' ? (
                        <CheckCircle className="w-6 h-6 text-emerald-600" />
                      ) : appointment.status === 'in-progress' ? (
                        <Clock className="w-6 h-6 text-blue-600" />
                      ) : (
                        <Calendar className="w-6 h-6 text-amber-600" />
                      )}
                    </div>
                    <div className="ml-4">
                      <h3 className="font-semibold text-blue-900">
                        {appointment.time} - {appointment.client.name}
                      </h3>
                      <p className="text-blue-700 text-sm">
                        {getPetInfo(appointment.client).name} ({getPetInfo(appointment.client).breed}) - {getServiceName(appointment.services)}
                      </p>
                      <div className="flex items-center text-gray-600 text-sm mt-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        <a 
                          href={`maps://?q=${encodeURIComponent(appointment.client.address || '')}`}
                          className="hover:text-blue-600 hover:underline cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const mapsUrl = `maps://?q=${encodeURIComponent(appointment.client.address || '')}`;
                            const googleUrl = `https://maps.google.com/?q=${encodeURIComponent(appointment.client.address || '')}`;
                            const isApple = /iPad|iPhone|iPod|Mac/.test(navigator.userAgent);
                            
                            if (isApple) {
                              window.location.href = mapsUrl;
                              setTimeout(() => window.open(googleUrl, '_blank'), 1000);
                            } else {
                              window.open(googleUrl, '_blank');
                            }
                          }}
                        >
                          {appointment.client.address}
                        </a>
                      </div>
                      <div className="flex items-center text-gray-600 text-sm">
                        <Phone className="w-3 h-3 mr-1" />
                        <a 
                          href={`tel:${appointment.client.phone}`}
                          className="hover:text-blue-600 hover:underline cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {appointment.client.phone}
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium mb-2 ${
                      appointment.status === 'completed' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : appointment.status === 'in-progress'
                        ? 'bg-blue-100 text-blue-800'
                        : appointment.status === 'confirmed'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {appointment.status.replace('-', ' ')}
                    </div>
                    <div className="text-lg font-bold text-blue-900">${getServicePrice(appointment)}</div>
                    <div className="text-sm text-gray-600">{getEstimatedDuration(appointment.services)} min</div>
                    
                    {/* Action buttons */}
                    <div className="mt-2 space-x-1">
                      {/* Quick action for confirmed appointments */}
                      {appointment.status === 'confirmed' && (
                        <button
                          onClick={() => updateAppointmentStatus(appointment.id, 'in-progress')}
                          className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                        >
                          Start
                        </button>
                      )}
                      
                      {/* Quick action for in-progress appointments */}
                      {appointment.status === 'in-progress' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateAppointmentStatus(appointment.id, 'completed');
                          }}
                          className="bg-emerald-500 text-white px-2 py-1 rounded text-xs hover:bg-emerald-600"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {appointment.notes && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700"><span className="font-medium">Notes:</span> {appointment.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-xl p-8 border border-blue-200/50 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-semibold text-blue-900 mb-2">No appointments today</h3>
            <p className="text-blue-700 mb-6">Enjoy your day off or check for new bookings!</p>
          </div>
        )}
      </div>
        )}

      {/* Previous Appointments */}
      {viewType === 'previous' && (
        <div>
          {pastAppointments.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {pastAppointments.map((appointment) => (
                <div 
                  key={appointment.id} 
                  className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-200/50"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start sm:items-center">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-lg sm:rounded-xl flex items-center justify-center border-2 border-gray-300 flex-shrink-0">
                        <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
                      </div>
                      <div className="ml-3 sm:ml-4 flex-grow">
                        <h3 className="font-semibold text-gray-700 text-sm sm:text-base">
                          {new Date(appointment.date).toLocaleDateString()} at {appointment.time} - {appointment.client.name}
                        </h3>
                        <p className="text-gray-600 text-xs sm:text-sm">
                          {getPetInfo(appointment.client).name} ({getPetInfo(appointment.client).breed}) - {getServiceName(appointment.services)}
                        </p>
                        <div className="flex items-center text-gray-500 text-xs sm:text-sm mt-1">
                          <MapPin className="w-3 h-3 mr-1" />
                          <a 
                            href={`maps://?q=${encodeURIComponent(appointment.client.address || '')}`}
                            className="hover:text-gray-700 hover:underline cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const mapsUrl = `maps://?q=${encodeURIComponent(appointment.client.address || '')}`;
                              const googleUrl = `https://maps.google.com/?q=${encodeURIComponent(appointment.client.address || '')}`;
                              const isApple = /iPad|iPhone|iPod|Mac/.test(navigator.userAgent);
                              
                              if (isApple) {
                                window.location.href = mapsUrl;
                                setTimeout(() => window.open(googleUrl, '_blank'), 1000);
                              } else {
                                window.open(googleUrl, '_blank');
                              }
                            }}
                          >
                            {appointment.client.address}
                          </a>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 sm:mt-0 sm:text-right">
                      <div className="text-lg font-bold text-gray-700">${getServicePrice(appointment)}</div>
                      <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                        appointment.paymentStatus === 'paid' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {appointment.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No previous appointments</h3>
              <p className="text-gray-500">Your appointment history will appear here.</p>
            </div>
          )}
        </div>
      )}

      {/* Upcoming Appointments */}
      {viewType === 'upcoming' && (
        <div>
          {upcomingAppointments.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {upcomingAppointments
                .sort((a, b) => {
                  // First sort by date
                  const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
                  if (dateCompare !== 0) return dateCompare;
                  // Then sort by time within the same date
                  return timeToMinutes(a.time) - timeToMinutes(b.time);
                })
                .slice(0, 10)
                .map((appointment) => (
                <div 
                  key={appointment.id} 
                  className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-indigo-200/50 cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-[1.01] sm:hover:scale-[1.02]"
                  onClick={() => openActionModal(appointment)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start sm:items-center">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 rounded-lg sm:rounded-xl flex items-center justify-center border border-indigo-200 flex-shrink-0">
                        <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                      </div>
                      <div className="ml-3 sm:ml-4 flex-grow">
                        <h3 className="font-semibold text-indigo-900 text-sm sm:text-base">
                          {new Date(appointment.date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })} at {appointment.time} - {appointment.client.name}
                        </h3>
                        <p className="text-indigo-700 text-xs sm:text-sm">
                          {getPetInfo(appointment.client).name} ({getPetInfo(appointment.client).breed}) - {getServiceName(appointment.services)}
                        </p>
                        <div className="flex items-center text-indigo-600 text-xs sm:text-sm mt-1">
                          <MapPin className="w-3 h-3 mr-1" />
                          <a 
                            href={`maps://?q=${encodeURIComponent(appointment.client.address || '')}`}
                            className="hover:text-indigo-800 hover:underline cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault();
                              const mapsUrl = `maps://?q=${encodeURIComponent(appointment.client.address || '')}`;
                              const googleUrl = `https://maps.google.com/?q=${encodeURIComponent(appointment.client.address || '')}`;
                              const isApple = /iPad|iPhone|iPod|Mac/.test(navigator.userAgent);
                              
                              if (isApple) {
                                window.location.href = mapsUrl;
                                setTimeout(() => window.open(googleUrl, '_blank'), 1000);
                              } else {
                                window.open(googleUrl, '_blank');
                              }
                            }}
                          >
                            {appointment.client.address}
                          </a>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 sm:mt-0 sm:text-right">
                      <div className="text-lg font-bold text-indigo-900">${getServicePrice(appointment)}</div>
                      <div className="text-xs text-indigo-600 mb-2">{getEstimatedDuration(appointment.services)} min</div>

                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No upcoming appointments</h3>
              <p className="text-gray-500">New appointments will appear here.</p>
            </div>
          )}
        </div>
      )}

      {/* Empty state for today when no appointments */}
      {viewType === 'today' && todayAppointments.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-blue-600 mb-2">No appointments today</h3>
          <p className="text-blue-500">Enjoy your day off or check for new bookings!</p>
        </div>
      )}
    </div>

      {/* Appointment Action Modal */}
      <AppointmentActionModal
        appointment={selectedAppointmentForAction}
        isOpen={showActionModal}
        onClose={() => setShowActionModal(false)}
        onAppointmentUpdated={handleAppointmentUpdated}
        onMarkAsPaid={markAsPaid}
      />
    </div>
  );
};

export default GroomerDashboard;
