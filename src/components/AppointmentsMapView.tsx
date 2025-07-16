import React, { useState, useEffect } from 'react';
import GoogleMapRoute from './GoogleMapRoute';

interface AppointmentWithMap {
  _id: string;
  client: {
    name: string;
    address: string;
    phone: string;
  };
  date: string;
  time: string;
  services: string[];
  status: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface MapViewProps {
  appointments: AppointmentWithMap[];
  selectedDate: string;
  startLocation?: string;
}

const AppointmentsMapView: React.FC<MapViewProps> = ({ 
  appointments, 
  selectedDate, 
  startLocation = "Miami, FL" 
}) => {
  const [optimizedRoute, setOptimizedRoute] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const createRouteFromAppointments = () => {
    if (appointments.length === 0) return null;

    const stops = appointments.map((apt, index) => ({
      appointment: apt,
      address: apt.client.address,
      coordinates: apt.coordinates,
      distanceFromPrevious: index > 0 ? 5 : 0, // Default estimate
      travelTimeFromPrevious: index > 0 ? 15 : 0 // Default estimate
    }));

    return {
      stops,
      totalDistance: stops.reduce((sum, stop) => sum + (stop.distanceFromPrevious || 0), 0),
      totalDuration: stops.length * 60 + (stops.length - 1) * 15,
      estimatedFuelCost: stops.length * 3.50
    };
  };

  const optimizeRoute = async () => {
    if (appointments.length === 0) return;
    
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/route-optimization/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startLocation,
          appointments: appointments.map(apt => ({
            id: apt._id,
            address: apt.client.address,
            time: apt.time
          }))
        })
      });

      if (response.ok) {
        const optimizedData = await response.json();
        setOptimizedRoute(optimizedData);
      } else {
        // Fallback to basic route
        const basicRoute = createRouteFromAppointments();
        setOptimizedRoute(basicRoute);
      }
    } catch (error) {
      console.error('Route optimization failed:', error);
      const basicRoute = createRouteFromAppointments();
      setOptimizedRoute(basicRoute);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (appointments.length > 0) {
      optimizeRoute();
    }
  }, [appointments, startLocation]);

  if (appointments.length === 0) {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-8 text-center border border-amber-200">
        <div className="text-6xl mb-4">📅</div>
        <h3 className="text-xl font-semibold text-amber-900 mb-2">No Appointments Scheduled</h3>
        <p className="text-amber-700">
          No appointments found for {new Date(selectedDate).toLocaleDateString()}. 
          Schedule some appointments to see your route!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-50 to-amber-50 rounded-xl p-6 border border-rose-200">
        <h2 className="text-2xl font-bold text-rose-900 mb-2">
          📍 Appointments Map View
        </h2>
        <p className="text-rose-700">
          {appointments.length} appointment{appointments.length !== 1 ? 's' : ''} scheduled for{' '}
          {new Date(selectedDate).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Appointments List */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-amber-900 flex items-center">
            📋 Today's Schedule
            {loading && (
              <div className="ml-2 animate-spin w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full"></div>
            )}
          </h3>
          
          {appointments.map((appointment, index) => (
            <div 
              key={appointment._id} 
              className="bg-white rounded-lg p-4 shadow-lg border border-amber-200 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center font-bold text-sm mr-3">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{appointment.client.name}</h4>
                      <p className="text-sm text-amber-600">{appointment.time}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">📍 {appointment.client.address}</p>
                  <p className="text-sm text-gray-600 mb-2">📞 {appointment.client.phone}</p>
                  <div className="flex flex-wrap gap-1">
                    {appointment.services.map((service, idx) => (
                      <span 
                        key={idx}
                        className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  appointment.status === 'confirmed' 
                    ? 'bg-green-100 text-green-800' 
                    : appointment.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {appointment.status}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Route Summary */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-amber-900">🗺️ Route Summary</h3>
          
          {optimizedRoute && (
            <div className="bg-white rounded-lg p-4 shadow-lg border border-amber-200">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-rose-600">{optimizedRoute.stops?.length || appointments.length}</div>
                  <div className="text-sm text-amber-700">Stops</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {optimizedRoute.totalDistance?.toFixed(1) || 'N/A'}
                  </div>
                  <div className="text-sm text-amber-700">Miles</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-600">
                    {optimizedRoute.totalDuration ? Math.round(optimizedRoute.totalDuration / 60) : 'N/A'}
                  </div>
                  <div className="text-sm text-amber-700">Hours</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-600">
                    ${optimizedRoute.estimatedFuelCost?.toFixed(2) || 'N/A'}
                  </div>
                  <div className="text-sm text-amber-700">Fuel Cost</div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-amber-200">
                <button
                  onClick={optimizeRoute}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2 px-4 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50"
                >
                  {loading ? 'Optimizing...' : '🔄 Optimize Route'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map Visualization */}
      {optimizedRoute && (
        <GoogleMapRoute 
          route={optimizedRoute} 
          startLocation={startLocation}
        />
      )}
    </div>
  );
};

export default AppointmentsMapView;
