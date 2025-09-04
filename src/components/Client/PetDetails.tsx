import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Calendar } from 'lucide-react';

interface Pet {
  id: string;
  name: string;
  breed: string;
  age: number;
  weight: number;
  notes?: string;
  species: 'dog' | 'cat';
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  service: string;
  status: 'completed' | 'confirmed' | 'cancelled' | 'pending';
  groomerName?: string;
  address: string;
  price: number;
  notes?: string;
}

const PetDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pet, setPet] = useState<Pet | null>(null);
  const [petAppointments, setPetAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPetDetails();
  }, [id]);

  const fetchPetDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');

      // Fetch pet details
      const petResponse = await fetch(`http://localhost:5002/api/client/pets/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (petResponse.ok) {
        setPet(await petResponse.json());
      }

      // Fetch pet's appointments
      const appointmentsResponse = await fetch('http://localhost:5002/api/client/appointments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (appointmentsResponse.ok) {
        const allAppointments = await appointmentsResponse.json();
        // Filter appointments for this specific pet
        const filteredAppointments = allAppointments.filter((apt: any) => 
          apt.petName === pet?.name || apt.petId === id
        );
        setPetAppointments(filteredAppointments.slice(0, 5)); // Show last 5 appointments
      }
    } catch (error) {
      console.error('Failed to fetch pet details:', error);
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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-amber-200 rounded w-1/3 mb-4"></div>
          <div className="bg-amber-100 rounded-2xl h-96"></div>
        </div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-amber-900 mb-4">Pet not found</h2>
          <button 
            onClick={() => navigate('/dashboard')}
            className="bg-gradient-to-r from-rose-500 to-rose-600 text-white px-6 py-3 rounded-full hover:from-rose-600 hover:to-rose-700 transition-all duration-300"
          >
            Back to Dashboard
          </button>
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
            <h1 className="text-3xl font-bold text-amber-900">{pet.name}'s Profile 🐾</h1>
            <p className="text-amber-700 mt-1">Detailed information about your pet</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/pets')}
          className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-6 py-3 rounded-full hover:from-amber-600 hover:to-amber-700 hover:shadow-lg transform hover:scale-105 transition-all duration-300 font-semibold"
        >
          <Edit className="w-5 h-5 mr-2 inline" />
          Edit Pet
        </button>
      </div>

      {/* Pet Information Card */}
      <div className="bg-gradient-to-br from-cream-50 to-amber-50 rounded-2xl shadow-xl p-8 border border-amber-200/50 mb-8">
        <div className="flex items-center mb-6">
          <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center border-4 border-rose-200">
            <div className="text-3xl">{pet.species === 'dog' ? '🐕' : '🐱'}</div>
          </div>
          <div className="ml-6">
            <h2 className="text-3xl font-bold text-amber-900">{pet.name}</h2>
            <p className="text-xl text-amber-700 font-medium">{pet.breed}</p>
            <p className="text-amber-600 capitalize">{pet.species}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-white/50 rounded-lg p-4 border border-amber-200">
              <h3 className="text-lg font-semibold text-amber-900 mb-3">Basic Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-amber-700 font-medium">Age:</span>
                  <span className="text-amber-900">{pet.age} years old</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700 font-medium">Weight:</span>
                  <span className="text-amber-900">{pet.weight} lbs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700 font-medium">Species:</span>
                  <span className="text-amber-900 capitalize">{pet.species}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white/50 rounded-lg p-4 border border-amber-200">
              <h3 className="text-lg font-semibold text-amber-900 mb-3">Special Notes</h3>
              <p className="text-amber-800">
                {pet.notes || 'No special notes recorded for this pet.'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <button 
            onClick={() => navigate('/booking', { state: { selectedPet: pet } })}
            className="bg-gradient-to-r from-rose-500 to-rose-600 text-white py-3 px-6 rounded-lg hover:from-rose-600 hover:to-rose-700 transition-all duration-200 font-semibold"
          >
            <Calendar className="w-5 h-5 mr-2 inline" />
            Book Appointment
          </button>
          <button 
            onClick={() => navigate('/pets')}
            className="border border-amber-300 text-amber-700 py-3 px-6 rounded-lg hover:bg-amber-50 transition-colors duration-200 font-semibold"
          >
            <Edit className="w-5 h-5 mr-2 inline" />
            Edit Information
          </button>
        </div>
      </div>

      {/* Recent Appointments */}
      <div className="bg-gradient-to-br from-cream-50 to-amber-50 rounded-2xl shadow-xl p-8 border border-amber-200/50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-amber-900">Recent Appointments</h2>
          <button 
            onClick={() => navigate('/appointments')}
            className="text-amber-700 hover:text-amber-900 font-medium transition-colors"
          >
            View All →
          </button>
        </div>

        {petAppointments.length > 0 ? (
          <div className="space-y-4">
            {petAppointments.map((appointment) => (
              <div key={appointment.id} className="bg-white/50 rounded-lg p-4 border border-amber-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-amber-600 mr-3" />
                    <div>
                      <h3 className="font-semibold text-amber-900">{appointment.service}</h3>
                      <p className="text-sm text-amber-700">
                        {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                      </p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(appointment.status)}`}>
                    {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 text-sm text-amber-700">
                  {appointment.groomerName && (
                    <div className="flex items-center">
                      <span className="font-medium">Groomer:</span>
                      <span className="ml-2">{appointment.groomerName}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <span className="font-medium">Price:</span>
                    <span className="ml-2 font-semibold text-amber-900">${appointment.price}</span>
                  </div>
                </div>

                {appointment.notes && (
                  <div className="mt-3 pt-3 border-t border-amber-200">
                    <p className="text-sm text-amber-700">
                      <span className="font-medium">Notes:</span> {appointment.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-amber-900 mb-2">No appointments yet</h3>
            <p className="text-amber-700 mb-6">
              {pet.name} hasn't had any grooming appointments yet. Book the first one!
            </p>
            <button 
              onClick={() => navigate('/booking', { state: { selectedPet: pet } })}
              className="bg-gradient-to-r from-rose-500 to-rose-600 text-white px-6 py-3 rounded-full hover:from-rose-600 hover:to-rose-700 hover:shadow-lg transform hover:scale-105 transition-all duration-300 font-semibold"
            >
              <Calendar className="w-5 h-5 mr-2 inline" />
              Book First Appointment
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PetDetails;
