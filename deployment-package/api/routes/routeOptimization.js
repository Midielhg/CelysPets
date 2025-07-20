"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Optimize route endpoint
router.post('/optimize', auth_1.auth, async (req, res) => {
    try {
        const { startLocation, appointments } = req.body;
        if (!startLocation || !appointments || appointments.length === 0) {
            return res.status(400).json({ message: 'Starting location and appointments are required' });
        }
        // For now, we'll use Google Maps optimization with fallback to simple
        const optimizedRoute = await optimizeRouteWithGoogleMaps(startLocation, appointments);
        res.json(optimizedRoute);
    }
    catch (error) {
        console.error('Route optimization error:', error);
        res.status(500).json({ message: 'Failed to optimize route' });
    }
});
// Simple time-based route optimization
async function optimizeRouteSimple(startLocation, appointments) {
    // Sort appointments by time
    const sortedAppointments = [...appointments].sort((a, b) => {
        const timeA = convertTimeToMinutes(a.time);
        const timeB = convertTimeToMinutes(b.time);
        return timeA - timeB;
    });
    // Calculate estimated distances and durations
    const stops = sortedAppointments.map((apt, index) => ({
        appointment: {
            _id: apt.id,
            client: {
                address: apt.address
            },
            time: apt.time
        },
        address: apt.address,
        coordinates: {
            lat: 25.7617 + Math.random() * 0.1, // Miami area coordinates
            lng: -80.1918 + Math.random() * 0.1
        },
        estimatedDuration: 60, // 60 minutes per appointment
        distanceFromPrevious: index === 0 ?
            estimateDistance(startLocation, apt.address) :
            estimateDistance(sortedAppointments[index - 1].address, apt.address)
    }));
    const totalDistance = stops.reduce((sum, stop) => sum + stop.distanceFromPrevious, 0);
    const totalDuration = stops.length * 60 + (stops.length - 1) * 15; // 60 min per stop + 15 min travel
    const estimatedFuelCost = calculateFuelCost(totalDistance);
    return {
        stops,
        totalDistance,
        totalDuration,
        estimatedFuelCost
    };
}
// Advanced route optimization using Google Maps Distance Matrix API
async function optimizeRouteWithGoogleMaps(startLocation, appointments) {
    const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!googleMapsApiKey) {
        console.warn('Google Maps API key not configured. Using simple optimization.');
        return optimizeRouteSimple(startLocation, appointments);
    }
    try {
        // Get coordinates for all locations first
        const allLocations = [startLocation, ...appointments.map(apt => apt.address)];
        const coordinates = await geocodeAddresses(allLocations, googleMapsApiKey);
        if (coordinates.length !== allLocations.length) {
            console.warn('Failed to geocode all addresses. Using simple optimization.');
            return optimizeRouteSimple(startLocation, appointments);
        }
        // Get distance matrix for all locations
        const distanceMatrix = await getDistanceMatrix(allLocations, googleMapsApiKey);
        // Apply traveling salesman algorithm for optimal route
        const optimizedOrder = solveTSP(distanceMatrix, appointments);
        // Build the optimized route response
        const stops = [];
        let totalDistance = 0;
        let totalDuration = 0;
        let previousLocationIndex = 0; // Start location
        for (let i = 0; i < optimizedOrder.length; i++) {
            const aptIndex = optimizedOrder[i];
            const appointment = appointments[aptIndex];
            const locationIndex = aptIndex + 1; // +1 because start location is at index 0
            const distanceInfo = distanceMatrix[previousLocationIndex][locationIndex];
            const travelDistance = distanceInfo.distance.value / 1609.34; // Convert meters to miles
            const travelTime = distanceInfo.duration.value / 60; // Convert seconds to minutes
            stops.push({
                appointment: {
                    _id: appointment.id,
                    client: {
                        address: appointment.address
                    },
                    time: appointment.time
                },
                address: appointment.address,
                coordinates: coordinates[locationIndex],
                estimatedDuration: 60, // 60 minutes per appointment
                distanceFromPrevious: travelDistance,
                travelTimeFromPrevious: travelTime
            });
            totalDistance += travelDistance;
            totalDuration += travelTime + 60; // Travel time + appointment time
            previousLocationIndex = locationIndex;
        }
        const estimatedFuelCost = calculateFuelCost(totalDistance);
        return {
            stops,
            totalDistance,
            totalDuration,
            estimatedFuelCost,
            optimizationMethod: 'google_maps_tsp'
        };
    }
    catch (error) {
        console.error('Google Maps optimization failed:', error);
        return optimizeRouteSimple(startLocation, appointments);
    }
}
// Helper function to convert time string to minutes
function convertTimeToMinutes(timeStr) {
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let totalMinutes = hours * 60 + (minutes || 0);
    if (period === 'PM' && hours !== 12) {
        totalMinutes += 12 * 60;
    }
    else if (period === 'AM' && hours === 12) {
        totalMinutes -= 12 * 60;
    }
    return totalMinutes;
}
// Estimate distance between two addresses (mock implementation)
function estimateDistance(address1, address2) {
    // In a real implementation, this would use Google Maps Geocoding + Distance Matrix APIs
    // For now, return a random distance between 2-15 miles
    return 2 + Math.random() * 13;
}
// Calculate estimated fuel cost
function calculateFuelCost(totalDistance) {
    const avgMpg = 25; // Average miles per gallon for a van
    const gasPrice = 3.50; // Average gas price per gallon
    const gallonsUsed = totalDistance / avgMpg;
    return gallonsUsed * gasPrice;
}
// Geocode addresses using Google Maps Geocoding API
async function geocodeAddresses(addresses, apiKey) {
    const coordinates = [];
    for (const address of addresses) {
        try {
            const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`);
            const data = await response.json();
            if (data.status === 'OK' && data.results.length > 0) {
                const location = data.results[0].geometry.location;
                coordinates.push({ lat: location.lat, lng: location.lng });
            }
            else {
                // Fallback to Miami coordinates if geocoding fails
                coordinates.push({
                    lat: 25.7617 + Math.random() * 0.1,
                    lng: -80.1918 + Math.random() * 0.1
                });
            }
        }
        catch (error) {
            console.error(`Failed to geocode address: ${address}`, error);
            // Fallback to Miami coordinates
            coordinates.push({
                lat: 25.7617 + Math.random() * 0.1,
                lng: -80.1918 + Math.random() * 0.1
            });
        }
    }
    return coordinates;
}
// Get distance matrix using Google Maps Distance Matrix API
async function getDistanceMatrix(locations, apiKey) {
    try {
        const origins = locations.join('|');
        const destinations = locations.join('|');
        const response = await fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origins)}&destinations=${encodeURIComponent(destinations)}&key=${apiKey}&units=metric`);
        const data = await response.json();
        if (data.status === 'OK') {
            return data.rows.map((row) => row.elements);
        }
        else {
            throw new Error(`Distance Matrix API error: ${data.status}`);
        }
    }
    catch (error) {
        console.error('Distance Matrix API failed:', error);
        // Return mock distance matrix for Miami area
        return createMockDistanceMatrix(locations.length);
    }
}
// Create mock distance matrix for testing
function createMockDistanceMatrix(size) {
    const matrix = [];
    for (let i = 0; i < size; i++) {
        const row = [];
        for (let j = 0; j < size; j++) {
            if (i === j) {
                row.push({
                    distance: { value: 0, text: '0 mi' },
                    duration: { value: 0, text: '0 mins' }
                });
            }
            else {
                const distance = (2 + Math.random() * 15) * 1609.34; // 2-17 miles in meters
                const duration = distance / 1609.34 * 2.5 * 60; // ~2.5 minutes per mile
                row.push({
                    distance: { value: distance, text: `${(distance / 1609.34).toFixed(1)} mi` },
                    duration: { value: duration, text: `${Math.round(duration / 60)} mins` }
                });
            }
        }
        matrix.push(row);
    }
    return matrix;
}
// Solve Traveling Salesman Problem using nearest neighbor heuristic
function solveTSP(distanceMatrix, appointments) {
    const n = appointments.length;
    if (n <= 1)
        return [0];
    // Start from location 0 (business address)
    const visited = new Set();
    const route = [];
    let currentLocation = 0; // Start location index
    while (route.length < n) {
        let nearestDistance = Infinity;
        let nearestIndex = -1;
        // Find nearest unvisited appointment
        for (let i = 0; i < n; i++) {
            if (!visited.has(i)) {
                const locationIndex = i + 1; // +1 because appointments start at index 1
                const distance = distanceMatrix[currentLocation][locationIndex].distance.value;
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestIndex = i;
                }
            }
        }
        if (nearestIndex !== -1) {
            visited.add(nearestIndex);
            route.push(nearestIndex);
            currentLocation = nearestIndex + 1; // Update current location
        }
    }
    return route;
}
// Get route suggestions
router.get('/suggestions/:date', auth_1.auth, async (req, res) => {
    try {
        const { date } = req.params;
        // Here you would fetch appointments for the date and provide route suggestions
        const suggestions = {
            bestStartTime: '8:00 AM',
            recommendedBreaks: ['12:00 PM', '3:30 PM'],
            trafficAlerts: [
                'Heavy traffic expected on I-95 between 7-9 AM and 4-6 PM',
                'US-1 through Coral Gables - expect delays during lunch hours',
                'Biscayne Blvd construction - add 15 minutes for downtown appointments'
            ],
            weatherAlert: 'Partly cloudy, 85°F - perfect weather for mobile grooming!',
            miamiSpecificTips: [
                'Start early to avoid afternoon thunderstorms (typical 2-4 PM)',
                'Beach areas (South Beach, Key Biscayne) - parking can be challenging',
                'Coral Gables has strict parking enforcement - allow extra time'
            ]
        };
        res.json(suggestions);
    }
    catch (error) {
        console.error('Error getting route suggestions:', error);
        res.status(500).json({ message: 'Failed to get route suggestions' });
    }
});
exports.default = router;
//# sourceMappingURL=routeOptimization.js.map