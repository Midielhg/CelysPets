import React, { useEffect, useRef, useState } from 'react';
import type { Appointment } from '../../types';

interface RouteMapProps {
  optimizedRoute: Appointment[];
  onRouteCalculated?: (distance: number, duration: number) => void;
}

declare global {
  interface Window {
    google: any;
  }
}

const RouteMap: React.FC<RouteMapProps> = ({
  optimizedRoute,
  onRouteCalculated
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const directionsServiceRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  // Check if Google Maps is loaded
  useEffect(() => {
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setIsMapLoaded(true);
      } else {
        setTimeout(checkGoogleMaps, 100);
      }
    };
    checkGoogleMaps();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current) return;

    // Initialize map centered on Miami area
    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 11,
      center: { lat: 25.7617, lng: -80.1918 }, // Miami, FL
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    mapInstanceRef.current = map;
    directionsServiceRef.current = new window.google.maps.DirectionsService();
    directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: '#3B82F6',
        strokeOpacity: 0.8,
        strokeWeight: 4
      }
    });
    
    directionsRendererRef.current.setMap(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null;
      }
    };
  }, [isMapLoaded]);

  // Calculate and display route
  useEffect(() => {
    if (!isMapLoaded || !mapInstanceRef.current || optimizedRoute.length < 2) {
      return;
    }

    setIsCalculating(true);

    const calculateRoute = async () => {
      try {
        // Clear existing route
        if (directionsRendererRef.current) {
          directionsRendererRef.current.setDirections({ routes: [] });
        }

        // Prepare waypoints (all appointments except first and last)
        const waypoints = optimizedRoute.slice(1, -1).map(appointment => ({
          location: appointment.client.address,
          stopover: true
        }));

        const request = {
          origin: optimizedRoute[0].client.address,
          destination: optimizedRoute[optimizedRoute.length - 1].client.address,
          waypoints: waypoints,
          optimizeWaypoints: false, // We already have optimized order
          travelMode: window.google.maps.TravelMode.DRIVING,
          unitSystem: window.google.maps.UnitSystem.IMPERIAL,
          avoidHighways: false,
          avoidTolls: false
        };

        directionsServiceRef.current.route(request, (result: any, status: any) => {
          if (status === 'OK') {
            directionsRendererRef.current.setDirections(result);

            // Calculate total distance and duration
            let totalDistance = 0;
            let totalDuration = 0;

            result.routes[0].legs.forEach((leg: any) => {
              totalDistance += leg.distance.value; // in meters
              totalDuration += leg.duration.value; // in seconds
            });

            // Convert to miles and minutes
            const distanceInMiles = totalDistance * 0.000621371;
            const durationInMinutes = totalDuration / 60;

            if (onRouteCalculated) {
              onRouteCalculated(distanceInMiles, durationInMinutes);
            }

            // Add custom markers for each appointment
            optimizedRoute.forEach((appointment, index) => {
              const marker = new window.google.maps.Marker({
                position: result.routes[0].legs[index]?.start_location || 
                         result.routes[0].legs[index - 1]?.end_location,
                map: mapInstanceRef.current,
                title: `${index + 1}. ${appointment.client.name}`,
                label: {
                  text: `${index + 1}`,
                  color: 'white',
                  fontWeight: 'bold'
                },
                icon: {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  fillColor: index === 0 ? '#10B981' : index === optimizedRoute.length - 1 ? '#EF4444' : '#3B82F6',
                  fillOpacity: 1,
                  strokeColor: '#FFFFFF',
                  strokeWeight: 2,
                  scale: 12
                }
              });

              // Info window for each marker
              const infoWindow = new window.google.maps.InfoWindow({
                content: `
                  <div style="padding: 8px;">
                    <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">
                      Stop ${index + 1}: ${appointment.client.name}
                    </h3>
                    <p style="margin: 0 0 4px 0; font-size: 12px;">
                      <strong>Time:</strong> ${appointment.time}
                    </p>
                    <p style="margin: 0 0 4px 0; font-size: 12px;">
                      <strong>Address:</strong> ${appointment.client.address}
                    </p>
                    <p style="margin: 0; font-size: 12px;">
                      <strong>Services:</strong> ${appointment.services.join(', ')}
                    </p>
                  </div>
                `
              });

              marker.addListener('click', () => {
                infoWindow.open(mapInstanceRef.current, marker);
              });
            });

          } else {
            console.error('Directions request failed due to ' + status);
          }
          setIsCalculating(false);
        });

      } catch (error) {
        console.error('Error calculating route:', error);
        setIsCalculating(false);
      }
    };

    calculateRoute();
  }, [optimizedRoute, isMapLoaded, onRouteCalculated]);

  if (!isMapLoaded) {
    return (
      <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div 
        ref={mapRef} 
        className="w-full h-64 rounded-lg border border-gray-200"
        style={{ minHeight: '256px' }}
      />
      {isCalculating && (
        <div className="absolute inset-0 bg-white bg-opacity-75 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Calculating route...</p>
          </div>
        </div>
      )}
      
      {/* Legend */}
      <div className="absolute top-2 right-2 bg-white rounded-lg shadow-lg p-2 text-xs">
        <div className="flex items-center space-x-1 mb-1">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Start</span>
        </div>
        <div className="flex items-center space-x-1 mb-1">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span>Stop</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>End</span>
        </div>
      </div>
    </div>
  );
};

export default RouteMap;
