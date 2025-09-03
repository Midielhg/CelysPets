import React, { useEffect, useRef } from 'react';

interface RouteStop {
  appointment: {
    id: string;
    client: {
      name: string;
      address: string;
    };
    time: string;
  };
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  distanceFromPrevious?: number;
  travelTimeFromPrevious?: number;
}

interface OptimizedRoute {
  stops: RouteStop[];
  totalDistance: number;
  totalDuration: number;
  estimatedFuelCost: number;
  fuelDetails?: {
    gasPrice: number;
    mpg: number;
    gallonsUsed: number;
  };
}

interface GoogleMapRouteProps {
  route: OptimizedRoute;
  startLocation: string;
  startCoordinates?: { lat: number; lng: number };
}

declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

const GoogleMapRoute: React.FC<GoogleMapRouteProps> = ({ 
  route, 
  startLocation, 
  startCoordinates // Will be calculated if not provided
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    const loadGoogleMaps = () => {
      // Check if API key is available
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.warn('Google Maps API key not found. Map will show placeholder.');
        return;
      }

      if (window.google && window.google.maps) {
        initializeMap();
        return;
      }

      // Create script element
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,places`;
      script.async = true;
      script.defer = true;
      
      window.initGoogleMaps = initializeMap;
      script.onload = initializeMap;
      script.onerror = () => {
        console.error('Failed to load Google Maps API');
      };
      
      document.head.appendChild(script);
    };

    const initializeMap = () => {
      if (!mapRef.current || !window.google) return;

      // Geocode the start location if coordinates aren't provided
      const geocoder = new window.google.maps.Geocoder();
      
      if (startCoordinates) {
        // Use provided coordinates
        createMap(startCoordinates);
      } else {
        // Geocode the start location
        geocoder.geocode({ address: startLocation }, (results: any, status: any) => {
          if (status === 'OK' && results[0]) {
            const location = results[0].geometry.location;
            const coords = { lat: location.lat(), lng: location.lng() };
            createMap(coords);
          } else {
            // Fallback to Miami if geocoding fails
            console.warn('Geocoding failed for start location:', startLocation);
            createMap({ lat: 25.7617, lng: -80.1918 });
          }
        });
      }
    };

    const createMap = (mapCenter: { lat: number; lng: number }) => {
      if (!mapRef.current || !window.google) return;

      // Create map
      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 11,
        center: mapCenter,
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

      // Add start location marker
      new window.google.maps.Marker({
        position: mapCenter,
        map: map,
        title: `Start: ${startLocation}`,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="#10b981" stroke="#065f46" stroke-width="2"/>
              <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">🏠</text>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 32),
          anchor: new window.google.maps.Point(16, 16)
        }
      });

      // Create DirectionsService and DirectionsRenderer
      const directionsService = new window.google.maps.DirectionsService();
      const directionsRenderer = new window.google.maps.DirectionsRenderer({
        draggable: false,
        suppressMarkers: true, // We'll create custom markers
        polylineOptions: {
          strokeColor: '#f59e0b',
          strokeWeight: 4,
          strokeOpacity: 0.8
        }
      });

      directionsRenderer.setMap(map);

      // Create waypoints from route stops
      const waypoints = route.stops.slice(0, -1).map((stop) => ({
        location: stop.coordinates ? 
          new window.google.maps.LatLng(stop.coordinates.lat, stop.coordinates.lng) : 
          stop.address,
        stopover: true
      }));

      const destination = route.stops[route.stops.length - 1];
      
      // Calculate and display route
      directionsService.route({
        origin: mapCenter,
        destination: destination.coordinates ? 
          new window.google.maps.LatLng(destination.coordinates.lat, destination.coordinates.lng) : 
          destination.address,
        waypoints: waypoints,
        optimizeWaypoints: false, // We already optimized on the backend
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.IMPERIAL
      }, (result: any, status: any) => {
        if (status === 'OK') {
          directionsRenderer.setDirections(result);
          
          // Add custom markers for each stop
          // Use coordinates from the directions result if not provided
          const routeLegs = result.routes[0].legs;
          
          route.stops.forEach((stop, index) => {
            let markerPosition;
            
            if (stop.coordinates) {
              markerPosition = { lat: stop.coordinates.lat, lng: stop.coordinates.lng };
            } else if (routeLegs[index] && routeLegs[index].end_location) {
              // Use the end location from the directions result
              markerPosition = {
                lat: routeLegs[index].end_location.lat(),
                lng: routeLegs[index].end_location.lng()
              };
            } else {
              // Skip this marker if we can't determine position
              console.warn(`Cannot determine position for stop ${index + 1}`);
              return;
            }

            const marker = new window.google.maps.Marker({
              position: markerPosition,
              map: map,
              title: `${index + 1}. ${stop.appointment.client.name || 'Appointment'} - ${stop.appointment.time}`,
              icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="18" cy="18" r="16" fill="#f43f5e" stroke="#e11d48" stroke-width="2"/>
                    <text x="18" y="23" text-anchor="middle" fill="white" font-size="14" font-weight="bold">${index + 1}</text>
                  </svg>
                `),
                scaledSize: new window.google.maps.Size(36, 36),
                anchor: new window.google.maps.Point(18, 18)
              }
            });

            // Info window for each marker
            const infoWindow = new window.google.maps.InfoWindow({
              content: `
                <div style="padding: 8px; min-width: 200px;">
                  <h3 style="margin: 0 0 8px 0; color: #f43f5e; font-size: 16px;">
                    Stop ${index + 1}: ${stop.appointment.time}
                  </h3>
                  <p style="margin: 4px 0; font-weight: bold; color: #374151;">
                    ${stop.appointment.client.name || 'Customer'}
                  </p>
                  <p style="margin: 4px 0; color: #6b7280; font-size: 14px;">
                    ${stop.address}
                  </p>
                  <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
                    ${stop.distanceFromPrevious ? `Distance: ${stop.distanceFromPrevious.toFixed(1)} miles` : ''}
                    ${stop.travelTimeFromPrevious ? ` • Travel: ${Math.round(stop.travelTimeFromPrevious)} min` : ''}
                  </div>
                </div>
              `
            });

            marker.addListener('click', () => {
              infoWindow.open(map, marker);
            });
          });
          
        } else {
          console.error('Directions request failed due to ' + status);
        }
      });
    };

    loadGoogleMaps();
  }, [route, startLocation, startCoordinates]);

  // Check if Google Maps API key is available
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    return (
      <div className="w-full h-96 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🗺️</div>
          <h3 className="text-xl font-semibold text-blue-900 mb-2">Route Map</h3>
          <p className="text-blue-700 mb-4">
            {route.stops.length} stops • {route.totalDistance.toFixed(1)} miles • {route.totalDuration} min travel
          </p>
          <div className="space-y-2 text-sm text-blue-600">
            {route.stops.map((stop, index) => (
              <div key={index} className="flex items-center justify-center space-x-2">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center">
                  {index + 1}
                </span>
                <span>{stop.appointment.client.name} - {stop.appointment.time}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-blue-500 mt-4">
            Configure Google Maps API key to enable interactive map
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div 
        ref={mapRef} 
        className="w-full h-96 rounded-xl border border-gray-200 shadow-lg"
        style={{ minHeight: '400px' }}
      />
      
      <div className="mt-2 text-xs text-gray-600 text-center space-y-1">
        <div>🟢 Start Location • 🔴 Appointment Stops • Click markers for details</div>
        <div className="text-gray-500">
          Route optimized for minimum travel time and fuel efficiency
        </div>
      </div>
    </div>
  );
};

export default GoogleMapRoute;
