import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AppointmentsMapView from '../AppointmentsMapView';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showMapView, setShowMapView] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate]);

  const fetchAppointments = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/appointments.php?date=${selectedDate}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-amber-900">Welcome back, {user?.name}!</h1>
        <p className="text-amber-700 mt-2">Manage your appointments and account settings</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <div className="bg-gradient-to-br from-cream-50 to-amber-50 rounded-2xl shadow-xl p-6 border border-amber-200/50">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center border border-amber-200">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-amber-900">Upcoming Appointments</h3>
              <p className="text-2xl font-bold text-rose-600">3</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-cream-50 to-amber-50 rounded-2xl shadow-xl p-6 border border-amber-200/50">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center border border-emerald-200">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-amber-900">Completed</h3>
              <p className="text-2xl font-bold text-emerald-600">12</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-cream-50 to-amber-50 rounded-2xl shadow-xl p-6 border border-amber-200/50">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center border border-rose-200">
              <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-amber-900">Pets Registered</h3>
              <p className="text-2xl font-bold text-rose-600">2</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Appointments */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-amber-900 mb-6">Recent Appointments</h2>
        <div className="bg-gradient-to-br from-cream-50 to-amber-50 rounded-2xl shadow-xl overflow-hidden border border-amber-200/50">
          <div className="px-6 py-4 border-b border-amber-200">
            <h3 className="text-lg font-semibold text-amber-900">Appointment History</h3>
          </div>
          <div className="p-6">
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-amber-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-amber-700">No appointments yet</p>
              <button className="mt-4 bg-gradient-to-r from-rose-500 to-rose-600 text-white px-6 py-3 rounded-full hover:from-rose-600 hover:to-rose-700 hover:shadow-lg transform hover:scale-105 transition-all duration-300 font-semibold">
                Book Your First Appointment
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Appointments Map */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-amber-900">Today's Appointments</h2>
          <div className="flex items-center space-x-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-cream-50"
            />
            <button
              onClick={() => setShowMapView(!showMapView)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                showMapView 
                  ? 'bg-amber-500 text-white' 
                  : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
              }`}
            >
              {showMapView ? '📋 List View' : '🗺️ Map View'}
            </button>
          </div>
        </div>

        {showMapView ? (
          <AppointmentsMapView 
            appointments={appointments} 
            selectedDate={selectedDate} 
            startLocation="Miami, FL"
          />
        ) : (
          <div className="bg-gradient-to-br from-cream-50 to-amber-50 rounded-2xl p-6 border border-amber-200">
            {appointments.length > 0 ? (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div key={appointment._id} className="bg-white rounded-lg p-4 shadow-lg border border-amber-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-amber-900">{appointment.client.name}</h3>
                        <p className="text-amber-700">{appointment.time}</p>
                        <p className="text-sm text-gray-600">📍 {appointment.client.address}</p>
                      </div>
                      <div className="text-right">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          appointment.status === 'confirmed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {appointment.status}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🐾</div>
                <h3 className="text-xl font-semibold text-amber-900 mb-2">No appointments today</h3>
                <p className="text-amber-700">Enjoy your free day or schedule some new appointments!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-amber-900 mb-6">Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <button className="bg-gradient-to-br from-rose-500 to-rose-600 text-white p-6 rounded-2xl hover:from-rose-600 hover:to-rose-700 hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-left">
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="font-semibold">Book New Appointment</span>
            </div>
            <p className="text-rose-100 mt-2 text-sm">Schedule a grooming session for your pet</p>
          </button>

          <button className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-6 rounded-2xl hover:from-emerald-600 hover:to-emerald-700 hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-left">
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="font-semibold">Manage Pets</span>
            </div>
            <p className="text-emerald-100 mt-2 text-sm">Add or update your pet information</p>
          </button>

          <button className="bg-gradient-to-br from-amber-500 to-orange-600 text-white p-6 rounded-2xl hover:from-amber-600 hover:to-orange-700 hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-left">
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="font-semibold">Account Settings</span>
            </div>
            <p className="text-amber-100 mt-2 text-sm">Update your profile and preferences</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;