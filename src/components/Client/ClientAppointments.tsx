import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, User, Plus, Star, AlertCircle } from 'lucide-react';

interface Appointment {
  id: string;
  date: string;
  time: string;
  service: string;
  petName: string;
  status: 'completed' | 'confirmed' | 'cancelled' | 'pending';
  groomerName?: string;
  address: string;
  price: number;
  notes?: string;
}

const ClientAppointments: React.FC = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5001/api/client/appointments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setAppointments(await response.json());
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <Star className="w-4 h-4" />;
      case 'confirmed': return <Calendar className="w-4 h-4" />;
      case 'cancelled': return <AlertCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return appointment.status === 'confirmed' || appointment.status === 'pending';
    return appointment.status === filter;
  });

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-amber-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-amber-100 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/dashboard')}
            className="mr-4 p-2 rounded-lg text-amber-700 hover:bg-amber-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-amber-900">My Appointments 📅</h1>
            <p className="text-amber-700 mt-1">Track your grooming appointments</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/booking')}
          className="bg-gradient-to-r from-rose-500 to-rose-600 text-white px-6 py-3 rounded-full hover:from-rose-600 hover:to-rose-700 hover:shadow-lg transform hover:scale-105 transition-all duration-300 font-semibold"
        >
          <Plus className="w-5 h-5 mr-2 inline" />
          Book New
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-amber-100 p-1 rounded-lg max-w-md">
          {[
            { key: 'all', label: 'All' },
            { key: 'upcoming', label: 'Upcoming' },
            { key: 'completed', label: 'Completed' },
            { key: 'cancelled', label: 'Cancelled' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-white text-amber-900 shadow-sm'
                  : 'text-amber-700 hover:text-amber-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments List */}
      {filteredAppointments.length > 0 ? (
        <div className="space-y-4">
          {filteredAppointments.map((appointment) => (
            <div key={appointment.id} className="bg-gradient-to-br from-cream-50 to-amber-50 rounded-2xl shadow-xl p-6 border border-amber-200/50 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center border border-rose-200">
                    <div className="text-2xl">🐕</div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-amber-900">{appointment.petName}</h3>
                    <p className="text-amber-700 font-medium">{appointment.service}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(appointment.status)} flex items-center gap-2`}>
                  {getStatusIcon(appointment.status)}
                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-3">
                  <div className="flex items-center text-amber-700">
                    <Calendar className="w-5 h-5 mr-3 text-rose-500" />
                    <span className="font-medium">{new Date(appointment.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</span>
                  </div>
                  <div className="flex items-center text-amber-700">
                    <Clock className="w-5 h-5 mr-3 text-rose-500" />
                    <span className="font-medium">{appointment.time}</span>
                  </div>
                  <div className="flex items-center text-amber-700">
                    <MapPin className="w-5 h-5 mr-3 text-rose-500" />
                    <span className="font-medium">{appointment.address}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {appointment.groomerName && (
                    <div className="flex items-center text-amber-700">
                      <User className="w-5 h-5 mr-3 text-rose-500" />
                      <span className="font-medium">{appointment.groomerName}</span>
                    </div>
                  )}
                  <div className="bg-white/50 rounded-lg p-3 border border-amber-200">
                    <p className="text-sm text-amber-700 font-medium">Total Cost</p>
                    <p className="text-lg font-bold text-amber-900">${appointment.price}</p>
                  </div>
                </div>
              </div>

              {appointment.notes && (
                <div className="bg-white/50 rounded-lg p-3 border border-amber-200 mb-4">
                  <p className="text-sm text-amber-700 font-medium">Notes</p>
                  <p className="text-amber-800">{appointment.notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                {appointment.status === 'pending' && (
                  <button className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-4 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium">
                    Confirm Appointment
                  </button>
                )}
                {(appointment.status === 'confirmed' || appointment.status === 'pending') && (
                  <button className="flex-1 border border-amber-300 text-amber-700 py-2 px-4 rounded-lg hover:bg-amber-50 transition-colors duration-200 font-medium">
                    Reschedule
                  </button>
                )}
                {appointment.status === 'completed' && (
                  <button 
                    onClick={() => navigate('/booking', { state: { rebookAppointment: appointment } })}
                    className="flex-1 bg-gradient-to-r from-rose-500 to-rose-600 text-white py-2 px-4 rounded-lg hover:from-rose-600 hover:to-rose-700 transition-all duration-200 font-medium"
                  >
                    Book Again
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gradient-to-br from-cream-50 to-amber-50 rounded-2xl shadow-xl p-12 border border-amber-200/50 text-center">
          <div className="text-8xl mb-6">📅</div>
          <h3 className="text-2xl font-bold text-amber-900 mb-4">
            {filter === 'all' ? 'No appointments yet' : `No ${filter} appointments`}
          </h3>
          <p className="text-amber-700 mb-8 max-w-md mx-auto">
            {filter === 'all' 
              ? "You haven't booked any grooming appointments yet. Book your first appointment to get started!"
              : `You don't have any ${filter} appointments at this time.`
            }
          </p>
          <button 
            onClick={() => navigate('/booking')}
            className="bg-gradient-to-r from-rose-500 to-rose-600 text-white px-8 py-4 rounded-full hover:from-rose-600 hover:to-rose-700 hover:shadow-lg transform hover:scale-105 transition-all duration-300 font-semibold text-lg"
          >
            <Plus className="w-6 h-6 mr-3 inline" />
            Book Your First Appointment
          </button>
        </div>
      )}
    </div>
  );
};

export default ClientAppointments;
