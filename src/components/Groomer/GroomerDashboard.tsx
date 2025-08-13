import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Calendar, 
  Clock, 
  User, 
  CheckCircle, 
  MapPin, 
  DollarSign, 
  Phone,
  Navigation
} from 'lucide-react';

interface GroomerAppointment {
  id: string;
  date: string;
  time: string;
  service: string;
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  petName: string;
  petBreed: string;
  petSpecies: 'dog' | 'cat';
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  price: number;
  notes?: string;
  estimatedDuration: number; // in minutes
}

const GroomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<GroomerAppointment[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<GroomerAppointment[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<GroomerAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayEarnings: 0,
    weeklyEarnings: 0,
    completedToday: 0,
    totalClients: 0
  });

  useEffect(() => {
    fetchGroomerData();
  }, []);

  const fetchGroomerData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      
      // Fetch groomer's appointments
      const appointmentsResponse = await fetch('http://localhost:5001/api/groomers/appointments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (appointmentsResponse.ok) {
        const allAppointments = await appointmentsResponse.json();
        setAppointments(allAppointments);
        
        // Filter today's appointments
        const today = new Date().toDateString();
        const todayAppts = allAppointments.filter((apt: GroomerAppointment) => 
          new Date(apt.date).toDateString() === today
        );
        setTodayAppointments(todayAppts);
        
        // Filter upcoming appointments (next 7 days, excluding today)
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const upcomingAppts = allAppointments.filter((apt: GroomerAppointment) => {
          const apptDate = new Date(apt.date);
          return apptDate > new Date() && apptDate <= nextWeek && 
                 apptDate.toDateString() !== today;
        });
        setUpcomingAppointments(upcomingAppts);
        
        // Calculate stats
        const todayEarnings = todayAppts
          .filter((apt: GroomerAppointment) => apt.status === 'completed')
          .reduce((sum: number, apt: GroomerAppointment) => sum + apt.price, 0);
        
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        const weeklyEarnings = allAppointments
          .filter((apt: GroomerAppointment) => {
            const apptDate = new Date(apt.date);
            return apptDate >= weekStart && apptDate <= weekEnd && apt.status === 'completed';
          })
          .reduce((sum: number, apt: GroomerAppointment) => sum + apt.price, 0);
        
        const completedToday = todayAppts.filter((apt: GroomerAppointment) => 
          apt.status === 'completed'
        ).length;
        
        const uniqueClients = new Set(allAppointments.map((apt: GroomerAppointment) => apt.clientName));
        
        setStats({
          todayEarnings,
          weeklyEarnings,
          completedToday,
          totalClients: uniqueClients.size
        });
      }
    } catch (error) {
      console.error('Failed to fetch groomer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:5001/api/groomers/appointments/${appointmentId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        fetchGroomerData(); // Refresh data
      }
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
    <div className="max-w-7xl mx-auto p-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-blue-900">Welcome back, {user?.name}! ✂️</h1>
        <p className="text-blue-700 mt-2">Manage your grooming appointments and clients</p>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-xl p-6 border border-green-200/50">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center border border-green-200">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-blue-900">Today's Earnings</h3>
              <p className="text-2xl font-bold text-green-600">${stats.todayEarnings}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-xl p-6 border border-blue-200/50">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center border border-blue-200">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-blue-900">This Week</h3>
              <p className="text-2xl font-bold text-blue-600">${stats.weeklyEarnings}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl shadow-xl p-6 border border-purple-200/50">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center border border-purple-200">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-blue-900">Completed Today</h3>
              <p className="text-2xl font-bold text-purple-600">{stats.completedToday}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl shadow-xl p-6 border border-orange-200/50">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center border border-orange-200">
              <User className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-blue-900">Total Clients</h3>
              <p className="text-2xl font-bold text-orange-600">{stats.totalClients}</p>
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
                <p className="flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  {nextAppointment.clientName} - {nextAppointment.petName}
                </p>
                <p className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  {nextAppointment.clientAddress}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">${nextAppointment.price}</div>
              <div className="text-indigo-100 text-sm">{nextAppointment.service}</div>
              <div className="text-indigo-100 text-sm">{nextAppointment.estimatedDuration} min</div>
            </div>
          </div>
        </div>
      )}

      {/* Today's Schedule */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-blue-900">Today's Schedule 📅</h2>
          <div className="text-blue-700 font-medium">
            {todayAppointments.length} appointments
          </div>
        </div>
        
        {todayAppointments.length > 0 ? (
          <div className="space-y-4">
            {todayAppointments
              .sort((a, b) => a.time.localeCompare(b.time))
              .map((appointment) => (
              <div key={appointment.id} className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-xl p-6 border border-blue-200/50">
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
                        {appointment.time} - {appointment.clientName}
                      </h3>
                      <p className="text-blue-700 text-sm">
                        {appointment.petName} ({appointment.petBreed}) - {appointment.service}
                      </p>
                      <div className="flex items-center text-gray-600 text-sm mt-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        {appointment.clientAddress}
                      </div>
                      <div className="flex items-center text-gray-600 text-sm">
                        <Phone className="w-3 h-3 mr-1" />
                        {appointment.clientPhone}
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
                    <div className="text-lg font-bold text-blue-900">${appointment.price}</div>
                    <div className="text-sm text-gray-600">{appointment.estimatedDuration} min</div>
                    
                    {/* Action buttons */}
                    <div className="mt-2 space-x-1">
                      {appointment.status === 'confirmed' && (
                        <button
                          onClick={() => updateAppointmentStatus(appointment.id, 'in-progress')}
                          className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                        >
                          Start
                        </button>
                      )}
                      {appointment.status === 'in-progress' && (
                        <button
                          onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                          className="bg-emerald-500 text-white px-2 py-1 rounded text-xs hover:bg-emerald-600"
                        >
                          Complete
                        </button>
                      )}
                      <button
                        onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(appointment.clientAddress)}`, '_blank')}
                        className="bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600"
                      >
                        <Navigation className="w-3 h-3 inline" />
                      </button>
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

      {/* Upcoming This Week */}
      {upcomingAppointments.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-6">This Week's Schedule</h2>
          <div className="space-y-4">
            {upcomingAppointments
              .sort((a, b) => new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime())
              .slice(0, 5)
              .map((appointment) => (
              <div key={appointment.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-xl p-6 border border-blue-200/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center border border-blue-200">
                      <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="font-semibold text-blue-900">
                        {new Date(appointment.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })} at {appointment.time}
                      </h3>
                      <p className="text-blue-700">
                        {appointment.clientName} - {appointment.petName} ({appointment.petBreed})
                      </p>
                      <p className="text-blue-600 text-sm">{appointment.service}</p>
                      <div className="flex items-center text-gray-600 text-sm">
                        <MapPin className="w-3 h-3 mr-1" />
                        {appointment.clientAddress}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-900">${appointment.price}</div>
                    <div className="text-sm text-blue-600">{appointment.estimatedDuration} min</div>
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

export default GroomerDashboard;
