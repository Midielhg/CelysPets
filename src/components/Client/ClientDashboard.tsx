import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Heart, Calendar, Plus, Clock, User, CheckCircle } from 'lucide-react';
import { apiUrl } from '../../config/api';

interface Pet {
  id: string;
  name: string;
  breed: string;
  age: number;
  weight: number;
  species: 'dog' | 'cat';
  notes?: string;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  service: string;
  petName: string;
  status: string;
  groomerName?: string;
  price: number;
  notes?: string;
}

const ClientDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pets, setPets] = useState<Pet[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClientData();
  }, []);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      
            // Fetch pets
      const petsResponse = await fetch(apiUrl('/client/pets'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (petsResponse.ok) {
        const petsData = await petsResponse.json();
        setPets(petsData);
      } else {
        console.error('Failed to fetch pets:', await petsResponse.text());
      }

      // Fetch all appointments
      const appointmentsResponse = await fetch(apiUrl('/client/appointments'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (appointmentsResponse.ok) {
        const allAppointments = await appointmentsResponse.json();
        
        // Filter upcoming and recent appointments
        const upcoming = allAppointments.filter((apt: Appointment) => 
          apt.status === 'confirmed' || apt.status === 'pending'
        );
        const recent = allAppointments.filter((apt: Appointment) => 
          apt.status === 'completed'
        ).slice(0, 3);
        
        setUpcomingAppointments(upcoming);
        setRecentAppointments(recent);
      } else {
        console.error('Failed to fetch appointments:', await appointmentsResponse.text());
      }
    } catch (error) {
      console.error('Failed to fetch client data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNextAppointment = () => {
    return upcomingAppointments.length > 0 ? upcomingAppointments[0] : null;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-amber-200 rounded w-1/3 mb-4"></div>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-amber-100 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-amber-900">Welcome back, {user?.name}! 🐾</h1>
        <p className="text-amber-700 mt-2">Manage your pets and appointments with ease</p>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-cream-50 to-amber-50 rounded-2xl shadow-xl p-6 border border-amber-200/50">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center border border-rose-200">
              <Heart className="w-6 h-6 text-rose-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-amber-900">My Pets</h3>
              <p className="text-2xl font-bold text-rose-600">{pets.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-cream-50 to-amber-50 rounded-2xl shadow-xl p-6 border border-amber-200/50">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center border border-amber-200">
              <Calendar className="w-6 h-6 text-amber-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-amber-900">Upcoming</h3>
              <p className="text-2xl font-bold text-amber-600">{upcomingAppointments.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-cream-50 to-amber-50 rounded-2xl shadow-xl p-6 border border-amber-200/50">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center border border-emerald-200">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-amber-900">Completed</h3>
              <p className="text-2xl font-bold text-emerald-600">{recentAppointments.length}</p>
            </div>
          </div>
        </div>
      </div>

            {/* Next Appointment */}
      {getNextAppointment() && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">🚀 Next Appointment</h2>
              <div className="space-y-1">
                <p className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  {new Date(getNextAppointment()!.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
                <p className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  {getNextAppointment()!.time}
                </p>
                <p className="flex items-center">
                  <Heart className="w-4 h-4 mr-2" />
                  {getNextAppointment()!.petName} - {getNextAppointment()!.service}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">${getNextAppointment()!.price}</div>
              <div className="text-blue-100 text-sm">Total Amount</div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <button 
          onClick={() => navigate('/booking')}
          className="bg-gradient-to-br from-rose-500 to-rose-600 text-white p-6 rounded-2xl hover:from-rose-600 hover:to-rose-700 hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-left"
        >
          <div className="flex items-center mb-3">
            <Plus className="w-6 h-6 mr-3" />
            <span className="font-semibold">Book Appointment</span>
          </div>
          <p className="text-rose-100 text-sm">Schedule grooming for your pets</p>
        </button>

        <button 
          onClick={() => navigate('/pets')}
          className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-6 rounded-2xl hover:from-emerald-600 hover:to-emerald-700 hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-left"
        >
          <div className="flex items-center mb-3">
            <Heart className="w-6 h-6 mr-3" />
            <span className="font-semibold">Manage Pets</span>
          </div>
          <p className="text-emerald-100 text-sm">Add or update pet information</p>
        </button>

        <button 
          onClick={() => navigate('/appointments')}
          className="bg-gradient-to-br from-amber-500 to-orange-600 text-white p-6 rounded-2xl hover:from-amber-600 hover:to-orange-700 hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-left"
        >
          <div className="flex items-center mb-3">
            <Calendar className="w-6 h-6 mr-3" />
            <span className="font-semibold">View History</span>
          </div>
          <p className="text-amber-100 text-sm">See all past appointments</p>
        </button>

        <button 
          onClick={() => navigate('/profile')}
          className="bg-gradient-to-br from-violet-500 to-purple-600 text-white p-6 rounded-2xl hover:from-violet-600 hover:to-purple-700 hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-left"
        >
          <div className="flex items-center mb-3">
            <User className="w-6 h-6 mr-3" />
            <span className="font-semibold">Profile Settings</span>
          </div>
          <p className="text-violet-100 text-sm">Update your account details</p>
        </button>
      </div>

      {/* My Pets Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-amber-900">My Pets 🐾</h2>
          <button 
            onClick={() => navigate('/pets')}
            className="bg-gradient-to-r from-rose-500 to-rose-600 text-white px-4 py-2 rounded-full hover:from-rose-600 hover:to-rose-700 hover:shadow-lg transform hover:scale-105 transition-all duration-300 font-semibold text-sm"
          >
            + Add Pet
          </button>
        </div>
        
        {pets.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pets.map((pet) => (
              <div key={pet.id} className="bg-gradient-to-br from-cream-50 to-amber-50 rounded-2xl shadow-xl p-6 border border-amber-200/50 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center border border-rose-200">
                    <div className="text-2xl">{pet.species === 'dog' ? '🐕' : '🐱'}</div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-bold text-amber-900">{pet.name}</h3>
                    <p className="text-amber-700 text-sm">{pet.breed}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-amber-700">
                  <p><span className="font-medium">Age:</span> {pet.age} years</p>
                  <p><span className="font-medium">Weight:</span> {pet.weight} lbs</p>
                  {pet.notes && <p><span className="font-medium">Notes:</span> {pet.notes}</p>}
                </div>
                <button 
                  onClick={() => navigate(`/pets/${pet.id}`)}
                  className="mt-4 w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white py-2 px-4 rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all duration-200 font-medium text-sm"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-cream-50 to-amber-50 rounded-2xl shadow-xl p-8 border border-amber-200/50 text-center">
            <div className="text-6xl mb-4">🐕</div>
            <h3 className="text-xl font-semibold text-amber-900 mb-2">No pets registered yet</h3>
            <p className="text-amber-700 mb-6">Add your furry friends to get started with booking appointments!</p>
            <button 
              onClick={() => navigate('/pets')}
              className="bg-gradient-to-r from-rose-500 to-rose-600 text-white px-6 py-3 rounded-full hover:from-rose-600 hover:to-rose-700 hover:shadow-lg transform hover:scale-105 transition-all duration-300 font-semibold"
            >
              + Add Your First Pet
            </button>
          </div>
        )}
      </div>

      {/* Recent Appointments */}
      {recentAppointments.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-amber-900">Recent Appointments</h2>
            <button 
              onClick={() => navigate('/appointments')}
              className="text-amber-700 hover:text-amber-900 font-medium text-sm hover:underline"
            >
              View All
            </button>
          </div>
          
          <div className="space-y-4">
            {recentAppointments.slice(0, 3).map((appointment) => (
              <div key={appointment.id} className="bg-gradient-to-br from-cream-50 to-amber-50 rounded-2xl shadow-xl p-6 border border-amber-200/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${
                      appointment.status === 'completed' 
                        ? 'bg-emerald-100 border-emerald-200' 
                        : appointment.status === 'upcoming'
                        ? 'bg-amber-100 border-amber-200'
                        : 'bg-gray-100 border-gray-200'
                    }`}>
                      {appointment.status === 'completed' ? (
                        <CheckCircle className="w-6 h-6 text-emerald-600" />
                      ) : appointment.status === 'upcoming' ? (
                        <Clock className="w-6 h-6 text-amber-600" />
                      ) : (
                        <Calendar className="w-6 h-6 text-gray-600" />
                      )}
                    </div>
                    <div className="ml-4">
                      <h3 className="font-semibold text-amber-900">{appointment.petName}</h3>
                      <p className="text-amber-700 text-sm">{appointment.service}</p>
                      <p className="text-gray-600 text-sm">
                        {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      appointment.status === 'completed' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : appointment.status === 'upcoming'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {appointment.status}
                    </div>
                    <div className="text-lg font-bold text-amber-900 mt-1">${appointment.price}</div>
                  </div>
                </div>
                {appointment.notes && (
                  <div className="mt-4 p-3 bg-white/50 rounded-lg border border-amber-200">
                    <p className="text-sm text-amber-700"><span className="font-medium">Notes:</span> {appointment.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 1 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-amber-900 mb-6">Upcoming Appointments</h2>
          <div className="space-y-4">
            {upcomingAppointments.slice(1).map((appointment) => (
              <div key={appointment.id} className="bg-gradient-to-r from-amber-50 to-rose-50 rounded-2xl shadow-xl p-6 border border-amber-200/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center border border-amber-200">
                      <Calendar className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="font-semibold text-amber-900">{appointment.petName} - {appointment.service}</h3>
                      <p className="text-amber-700">
                        {new Date(appointment.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'long', 
                          day: 'numeric' 
                        })} at {appointment.time}
                      </p>
                      <p className="text-gray-600 text-sm">Groomer: {appointment.groomerName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-amber-900">${appointment.price}</div>
                    {appointment.status === 'pending' && (
                      <button 
                        onClick={() => {
                          // Navigate to booking page with reschedule parameters
                          navigate('/booking', { 
                            state: { 
                              rescheduleAppointment: appointment,
                              isReschedule: true 
                            } 
                          });
                        }}
                        className="mt-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2 rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all duration-200 font-medium text-sm"
                      >
                        Reschedule
                      </button>
                    )}
                    {appointment.status === 'confirmed' && (
                      <div className="mt-2 px-4 py-2 bg-emerald-100 text-emerald-800 rounded-lg text-sm font-medium">
                        Confirmed
                      </div>
                    )}
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

export default ClientDashboard;
