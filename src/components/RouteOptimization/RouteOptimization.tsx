import React, { useState, useEffect } from 'react';
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

const RouteOptimization: React.FC = () => {
  const { showToast } = useToast();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);
  const [loading, setLoading] = useState(false);
  const [startLocation, setStartLocation] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate]);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/appointments.php`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }

      const data = await response.json();
      
      // Filter appointments for selected date
      const filteredAppointments = data.filter((apt: Appointment) => {
        const aptDate = new Date(apt.date).toISOString().split('T')[0];
        return aptDate === selectedDate && apt.status !== 'cancelled';
      });

      setAppointments(filteredAppointments);
    } catch (error) {
      showToast('Failed to fetch appointments', 'error');
    }
  };

  const optimizeRoute = async () => {
    if (appointments.length === 0) {
      showToast('No appointments found for the selected date', 'warning');
      return;
    }

    if (!startLocation.trim()) {
      showToast('Please enter your starting location', 'warning');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/route-optimization.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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
    let totalMinutes = hours * 60 + (minutes || 0);
    
    if (period === 'PM' && hours !== 12) {
      totalMinutes += 12 * 60;
    } else if (period === 'AM' && hours === 12) {
      totalMinutes -= 12 * 60;
    }
    
    return totalMinutes;
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const exportRoute = () => {
    if (!optimizedRoute) return;

    const routeData = {
      date: selectedDate,
      startLocation,
      stops: optimizedRoute.stops.map((stop, index) => ({
        order: index + 1,
        time: stop.appointment.time,
        client: stop.appointment.client.name,
        address: stop.address,
        phone: stop.appointment.client.phone,
        services: stop.appointment.services
      })),
      summary: {
        totalStops: optimizedRoute.stops.length,
        totalDistance: optimizedRoute.totalDistance,
        totalDuration: formatDuration(optimizedRoute.totalDuration),
        estimatedFuelCost: optimizedRoute.estimatedFuelCost
      }
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
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Route Optimization</h1>
        <p className="text-gray-600">Optimize your daily route for maximum efficiency and minimum travel time</p>
      </div>

      {/* Route Planning Controls */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Route Planning</h2>
        
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Starting Location
            </label>
            <input
              type="text"
              placeholder="Enter your starting address"
              value={startLocation}
              onChange={(e) => setStartLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={optimizeRoute}
              disabled={loading || appointments.length === 0}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Optimizing...' : 'Optimize Route'}
            </button>
          </div>
        </div>

        {/* Appointments Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">
            Appointments for {new Date(selectedDate).toLocaleDateString()}
          </h3>
          {appointments.length > 0 ? (
            <div className="text-sm text-gray-600">
              {appointments.length} appointment{appointments.length !== 1 ? 's' : ''} found
              <div className="mt-2 space-y-1">
                {appointments.map((apt) => (
                  <div key={apt._id} className="flex justify-between">
                    <span>{apt.time} - {apt.client.name}</span>
                    <span className="text-gray-500">{apt.client.address}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No appointments scheduled for this date</p>
          )}
        </div>
      </div>

      {/* Optimized Route Display */}
      {optimizedRoute && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Optimized Route</h2>
              {optimizedRoute.optimizationMethod === 'google_maps_tsp' && (
                <div className="mt-1">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    🚀 Google Maps + TSP Algorithm
                  </span>
                </div>
              )}
            </div>
            <div className="space-x-2">
              <button
                onClick={exportRoute}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                📋 Export Route
              </button>
              <button
                onClick={openInGoogleMaps}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                📍 Open in Google Maps
              </button>
            </div>
          </div>

          {/* Route Summary */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-blue-600 text-sm font-medium">Total Stops</div>
              <div className="text-2xl font-bold text-blue-900">{optimizedRoute.stops.length}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-green-600 text-sm font-medium">Total Distance</div>
              <div className="text-2xl font-bold text-green-900">{optimizedRoute.totalDistance.toFixed(1)} mi</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-purple-600 text-sm font-medium">Total Time</div>
              <div className="text-2xl font-bold text-purple-900">{formatDuration(optimizedRoute.totalDuration)}</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-yellow-600 text-sm font-medium">Fuel Cost</div>
              <div className="text-2xl font-bold text-yellow-900">${optimizedRoute.estimatedFuelCost.toFixed(2)}</div>
            </div>
          </div>

          {/* Visual Map Component */}
          <div className="mb-6">
            <GoogleMapRoute 
              route={optimizedRoute} 
              startLocation={startLocation}
            />
          </div>

          {/* Route Steps */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Route Steps</h3>
            
            {/* Starting Point */}
            <div className="flex items-center p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
              <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                S
              </div>
              <div className="ml-4">
                <div className="font-semibold text-gray-900">Starting Point</div>
                <div className="text-gray-600">{startLocation}</div>
              </div>
            </div>

            {/* Route Stops */}
            {optimizedRoute.stops.map((stop, index) => (
              <div key={stop.appointment._id} className="flex items-center p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {stop.appointment.time} - {stop.appointment.client.name}
                      </div>
                      <div className="text-gray-600">{stop.address}</div>
                      <div className="text-sm text-gray-500">
                        Phone: {stop.appointment.client.phone}
                      </div>
                      <div className="text-sm text-blue-600">
                        Services: {stop.appointment.services.join(', ')}
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      {stop.distanceFromPrevious && (
                        <div>🚗 {stop.distanceFromPrevious.toFixed(1)} mi from previous</div>
                      )}
                      {stop.travelTimeFromPrevious && (
                        <div>⏱️ {Math.round(stop.travelTimeFromPrevious)} min travel</div>
                      )}
                      {stop.estimatedDuration && (
                        <div>📋 Est. {formatDuration(stop.estimatedDuration)} service</div>
                      )}
                      {stop.coordinates && (
                        <div className="text-xs text-gray-400 mt-1">
                          📍 {stop.coordinates.lat.toFixed(4)}, {stop.coordinates.lng.toFixed(4)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* End Point */}
            <div className="flex items-center p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
              <div className="flex-shrink-0 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold">
                E
              </div>
              <div className="ml-4">
                <div className="font-semibold text-gray-900">Return to Base</div>
                <div className="text-gray-600">{startLocation}</div>
              </div>
            </div>
          </div>

          {/* Route Tips */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Route Optimization Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• This route is optimized to minimize travel time and distance</li>
              <li>• Allow extra time for traffic and unexpected delays</li>
              <li>• Check appointment confirmations before departure</li>
              <li>• Keep client contact information handy for updates</li>
              <li>• Consider fuel stops along the route</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteOptimization;
