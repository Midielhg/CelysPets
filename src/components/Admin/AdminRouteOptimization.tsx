import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import GoogleMapRoute from '../GoogleMapRoute';

interface Appointment {
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
}

interface RouteStop {
  appointment: Appointment;
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  estimatedDuration?: number;
  distanceFromPrevious?: number;
  travelTimeFromPrevious?: number;
}

interface OptimizedRoute {
  stops: RouteStop[];
  totalDistance: number;
  totalDuration: number;
  estimatedFuelCost: number;
  optimizationMethod?: string;
}

const AdminRouteOptimization: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);
  const [loading, setLoading] = useState(false);
  const [startLocation, setStartLocation] = useState('8401 Coral Way, Miami, FL 33155'); // Default company location
  const [viewMode, setViewMode] = useState<'list' | 'map'>('map');

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate]);

  const fetchAppointments = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/appointments?date=${selectedDate}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAppointments(data.filter((apt: Appointment) => apt.status !== 'cancelled'));
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
      showToast('Failed to fetch appointments', 'error');
    }
  };

  const optimizeRoute = async () => {
    if (appointments.length === 0) {
      showToast('No appointments to optimize', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/route-optimization/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
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

      if (!response.ok) {
        throw new Error('Failed to optimize route');
      }

      const optimizedData = await response.json();
      setOptimizedRoute(optimizedData);
      showToast('Route optimized successfully!', 'success');
    } catch (error) {
      console.error('Route optimization failed:', error);
      showToast('Failed to optimize route. Using time-based ordering.', 'warning');
      
      // Fallback: Simple time-based ordering
      const timeBasedRoute = createTimeBasedRoute();
      setOptimizedRoute(timeBasedRoute);
    } finally {
      setLoading(false);
    }
  };

  const createTimeBasedRoute = (): OptimizedRoute => {
    const sortedAppointments = [...appointments].sort((a, b) => {
      const timeA = convertTimeToMinutes(a.time);
      const timeB = convertTimeToMinutes(b.time);
      return timeA - timeB;
    });

    const stops: RouteStop[] = sortedAppointments.map((apt, index) => ({
      appointment: apt,
      address: apt.client.address,
      estimatedDuration: 60, // Default 60 minutes per appointment
      distanceFromPrevious: index > 0 ? 5 : 0 // Estimated 5 miles between stops
    }));

    return {
      stops,
      totalDistance: stops.reduce((sum, stop) => sum + (stop.distanceFromPrevious || 0), 0),
      totalDuration: stops.length * 60 + (stops.length - 1) * 15, // 60 min per stop + 15 min travel
      estimatedFuelCost: stops.length * 3.50 // Estimated fuel cost
    };
  };

  const convertTimeToMinutes = (timeStr: string): number => {
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes;
    if (period === 'PM' && hours !== 12) totalMinutes += 12 * 60;
    if (period === 'AM' && hours === 12) totalMinutes -= 12 * 60;
    return totalMinutes;
  };

  const exportRoute = () => {
    if (!optimizedRoute) return;
    
    const routeData = {
      date: selectedDate,
      startLocation,
      optimizedRoute,
      generatedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(routeData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `route-${selectedDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Route exported successfully!', 'success');
  };

  const openInGoogleMaps = () => {
    if (!optimizedRoute || optimizedRoute.stops.length === 0) return;

    const waypoints = optimizedRoute.stops.map(stop => 
      encodeURIComponent(stop.address)
    ).join('/');
    
    const googleMapsUrl = `https://www.google.com/maps/dir/${encodeURIComponent(startLocation)}/${waypoints}`;
    window.open(googleMapsUrl, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-amber-900">Admin Route Optimization</h1>
            <p className="text-amber-700 mt-2">Optimize daily routes for maximum efficiency</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-amber-600">Welcome, {user?.name}</p>
            <p className="text-xs text-amber-500">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Route Planning Controls */}
      <div className="bg-gradient-to-br from-cream-50 to-amber-50 rounded-2xl shadow-xl p-6 mb-6 border border-amber-200">
        <h2 className="text-xl font-semibold text-amber-900 mb-4">📅 Route Planning</h2>
        
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-amber-700 mb-2">
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-amber-700 mb-2">
              Starting Location
            </label>
            <input
              type="text"
              placeholder="Enter starting address"
              value={startLocation}
              onChange={(e) => setStartLocation(e.target.value)}
              className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={optimizeRoute}
              disabled={loading || appointments.length === 0}
              className="w-full bg-gradient-to-r from-rose-500 to-rose-600 text-white px-4 py-2 rounded-lg hover:from-rose-600 hover:to-rose-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '🔄 Optimizing...' : '🚀 Optimize Route'}
            </button>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all"
            >
              {viewMode === 'map' ? '📋 List View' : '🗺️ Map View'}
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 text-center">
          <div className="bg-white rounded-lg p-4 border border-amber-200">
            <div className="text-2xl font-bold text-rose-600">{appointments.length}</div>
            <div className="text-amber-700 text-sm">Appointments</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-amber-200">
            <div className="text-2xl font-bold text-amber-600">
              {appointments.filter(apt => apt.status === 'confirmed').length}
            </div>
            <div className="text-amber-700 text-sm">Confirmed</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-amber-200">
            <div className="text-2xl font-bold text-orange-600">
              {appointments.filter(apt => apt.status === 'pending').length}
            </div>
            <div className="text-amber-700 text-sm">Pending</div>
          </div>
        </div>
      </div>

      {/* Route Optimization Results */}
      {optimizedRoute && (
        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={exportRoute}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg"
            >
              📋 Export Route
            </button>
            <button
              onClick={openInGoogleMaps}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg"
            >
              📍 Open in Google Maps
            </button>
            <button
              onClick={() => window.print()}
              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg"
            >
              🖨️ Print Route
            </button>
          </div>

          {/* Map or List View */}
          {viewMode === 'map' ? (
            <GoogleMapRoute 
              route={optimizedRoute} 
              startLocation={startLocation}
            />
          ) : (
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-amber-200">
              <h3 className="text-xl font-semibold text-amber-900 mb-4">📋 Route Steps</h3>
              
              <div className="space-y-4">
                {/* Starting Point */}
                <div className="flex items-center p-4 bg-emerald-50 rounded-lg border-l-4 border-emerald-500">
                  <div className="flex-shrink-0 w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold">
                    🏠
                  </div>
                  <div className="ml-4">
                    <div className="font-semibold text-emerald-900">Starting Point</div>
                    <div className="text-emerald-700">{startLocation}</div>
                  </div>
                </div>

                {/* Route Stops */}
                {optimizedRoute.stops.map((stop, index) => (
                  <div key={stop.appointment._id} className="flex items-center p-4 bg-amber-50 rounded-lg border-l-4 border-amber-500">
                    <div className="flex-shrink-0 w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-amber-900">
                            {stop.appointment.time} - {stop.appointment.client.name}
                          </div>
                          <div className="text-amber-700">{stop.address}</div>
                          <div className="text-sm text-amber-600">
                            📞 {stop.appointment.client.phone}
                          </div>
                        </div>
                        <div className="text-right text-sm text-amber-600">
                          {stop.distanceFromPrevious && (
                            <div>🚗 {stop.distanceFromPrevious.toFixed(1)} mi</div>
                          )}
                          {stop.travelTimeFromPrevious && (
                            <div>⏱️ {Math.round(stop.travelTimeFromPrevious)} min</div>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {stop.appointment.services.map((service, idx) => (
                          <span 
                            key={idx}
                            className="px-2 py-1 bg-amber-200 text-amber-800 text-xs rounded-full"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Appointments Message */}
      {appointments.length === 0 && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 text-center border border-amber-200">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-xl font-semibold text-amber-900 mb-2">No Appointments Scheduled</h3>
          <p className="text-amber-700">
            No appointments found for {new Date(selectedDate).toLocaleDateString()}. 
            Check the appointment calendar or select a different date.
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminRouteOptimization;
