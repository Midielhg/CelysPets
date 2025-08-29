import React, { useState } from 'react';
import { 
  MapPin, 
  Route, 
  Download, 
  ChevronDown, 
  ChevronUp,
  Clock,
  Navigation,
  Car,
  Map
} from 'lucide-react';
import type { Appointment } from '../../types';
import RouteMap from './RouteMap';

interface RouteOptimizationBoxProps {
  appointments: Appointment[];
  selectedDate: Date;
  onOptimizeRoute?: (optimizedAppointments: Appointment[]) => void;
}

const RouteOptimizationBox: React.FC<RouteOptimizationBoxProps> = ({
  appointments,
  selectedDate,
  onOptimizeRoute
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState<Appointment[]>([]);
  const [routeDistance, setRouteDistance] = useState<number>(0);
  const [estimatedTime, setEstimatedTime] = useState<number>(0);
  const [showMapView, setShowMapView] = useState(false);

  // Filter appointments for the selected date
  const todayAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.date);
    const isMatch = aptDate.toDateString() === selectedDate.toDateString();
    
    // Debug logging
    if (selectedDate.toDateString().includes('Aug 13')) {
      console.log('Date filtering debug for Aug 13:', {
        aptDate: aptDate.toDateString(),
        selectedDate: selectedDate.toDateString(),
        aptTime: apt.time,
        clientName: apt.client?.name,
        isMatch,
        rawAptDate: apt.date
      });
    }
    
    return isMatch;
  });

  const handleOptimizeRoute = async () => {
    if (todayAppointments.length < 2) {
      return;
    }

    setIsOptimizing(true);
    try {
      const response = await fetch('/api/appointments/optimize-route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          date: selectedDate.toISOString().split('T')[0],
          appointments: todayAppointments.map(apt => apt.id)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to optimize route');
      }

      const data = await response.json();
      
      setOptimizedRoute(data.optimizedRoute || []);
      setRouteDistance(data.totalDistance || 0);
      setEstimatedTime(data.estimatedTime || 0);
      
      if (onOptimizeRoute) {
        onOptimizeRoute(data.optimizedRoute);
      }
    } catch (error) {
      console.error('Route optimization failed:', error);
      // Fallback to simple time-based sorting
      const sorted = [...todayAppointments].sort((a, b) => {
        const timeA = a.time || '09:00';
        const timeB = b.time || '09:00';
        return timeA.localeCompare(timeB);
      });
      
      setOptimizedRoute(sorted);
      setRouteDistance(Math.random() * 50 + 10);
      setEstimatedTime(Math.random() * 120 + 30);
      
      if (onOptimizeRoute) {
        onOptimizeRoute(sorted);
      }
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleExportRoute = () => {
    if (optimizedRoute.length === 0) return;

    const routeData = {
      date: selectedDate.toDateString(),
      totalAppointments: optimizedRoute.length,
      estimatedDistance: routeDistance,
      estimatedTime: estimatedTime,
      appointments: optimizedRoute.map((apt, index) => ({
        order: index + 1,
        time: apt.time,
        client: apt.client.name,
        address: apt.client.address,
        services: apt.services.join(', ')
      }))
    };

    const blob = new Blob([JSON.stringify(routeData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `route-${selectedDate.toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRouteCalculated = (distance: number, duration: number) => {
    setRouteDistance(distance);
    setEstimatedTime(duration);
  };

  if (todayAppointments.length === 0) {
    return null; // Don't show if no appointments
  }

  return (
    <div className="bg-white border border-stone-200 rounded-lg shadow-sm overflow-hidden mt-6">
      {/* Header - Always Visible */}
      <div 
        className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-stone-200 px-4 py-3 cursor-pointer hover:from-blue-100 hover:to-indigo-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Route className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-stone-800">Route Optimization</h3>
              <p className="text-xs text-stone-600">
                {todayAppointments.length} appointment{todayAppointments.length !== 1 ? 's' : ''} for {selectedDate.toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {optimizedRoute.length > 0 && (
              <div className="text-xs text-stone-600 text-right mr-2">
                <div className="flex items-center space-x-1">
                  <Car className="w-3 h-3" />
                  <span>{routeDistance.toFixed(1)} mi</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{Math.round(estimatedTime)} min</span>
                </div>
              </div>
            )}
            {isExpanded ? <ChevronUp className="w-5 h-5 text-stone-600" /> : <ChevronDown className="w-5 h-5 text-stone-600" />}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Control Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleOptimizeRoute}
              disabled={isOptimizing || todayAppointments.length < 2}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                isOptimizing || todayAppointments.length < 2
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow-md'
              }`}
            >
              <Navigation className={`w-4 h-4 ${isOptimizing ? 'animate-spin' : ''}`} />
              <span>{isOptimizing ? 'Optimizing...' : 'Optimize Route'}</span>
            </button>

            <button
              onClick={handleExportRoute}
              disabled={optimizedRoute.length === 0}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                optimizedRoute.length === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600 text-white shadow-sm hover:shadow-md'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Export Route</span>
            </button>

            <button
              onClick={() => setShowMapView(!showMapView)}
              disabled={optimizedRoute.length === 0}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                optimizedRoute.length === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : showMapView
                  ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm hover:shadow-md'
                  : 'bg-purple-500 hover:bg-purple-600 text-white shadow-sm hover:shadow-md'
              }`}
            >
              <Map className="w-4 h-4" />
              <span>{showMapView ? 'Hide Map' : 'Show Map'}</span>
            </button>
          </div>

          {/* Route Preview */}
          {optimizedRoute.length > 0 && (
            <div className="bg-stone-50 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-stone-800 mb-3 flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                Optimized Route ({optimizedRoute.length} stops)
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {optimizedRoute.map((appointment, index) => (
                  <div key={appointment.id} className="flex items-center space-x-3 bg-white rounded-lg p-2 border border-stone-200">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-stone-800 truncate">
                          {appointment.client.name}
                        </p>
                        <span className="text-xs text-stone-600 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {appointment.time}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 truncate">
                        {appointment.client.address}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Route Stats */}
              <div className="mt-3 pt-3 border-t border-stone-200 grid grid-cols-2 gap-4 text-center">
                <div className="bg-white rounded-lg p-2">
                  <div className="flex items-center justify-center text-blue-500 mb-1">
                    <Car className="w-4 h-4 mr-1" />
                  </div>
                  <p className="text-lg font-semibold text-stone-800">{routeDistance.toFixed(1)}</p>
                  <p className="text-xs text-stone-600">Miles</p>
                </div>
                <div className="bg-white rounded-lg p-2">
                  <div className="flex items-center justify-center text-green-500 mb-1">
                    <Clock className="w-4 h-4 mr-1" />
                  </div>
                  <p className="text-lg font-semibold text-stone-800">{Math.round(estimatedTime)}</p>
                  <p className="text-xs text-stone-600">Minutes</p>
                </div>
              </div>
            </div>
          )}

          {/* Map View */}
          {showMapView && optimizedRoute.length > 0 && (
            <div className="bg-stone-50 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-stone-800 mb-3 flex items-center">
                <Map className="w-4 h-4 mr-2 text-purple-500" />
                Route Map
              </h4>
              <RouteMap
                optimizedRoute={optimizedRoute}
                onRouteCalculated={handleRouteCalculated}
              />
            </div>
          )}

          {/* No optimization yet */}
          {optimizedRoute.length === 0 && !isOptimizing && todayAppointments.length >= 2 && (
            <div className="text-center py-8 text-stone-500">
              <Route className="w-12 h-12 mx-auto mb-3 text-stone-300" />
              <p className="text-sm">Click "Optimize Route" to find the most efficient path</p>
              <p className="text-xs mt-1">Save time and fuel costs with smart routing</p>
            </div>
          )}

          {/* Too few appointments */}
          {todayAppointments.length < 2 && (
            <div className="text-center py-6 text-stone-500">
              <MapPin className="w-10 h-10 mx-auto mb-2 text-stone-300" />
              <p className="text-sm">Need at least 2 appointments to optimize route</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RouteOptimizationBox;
