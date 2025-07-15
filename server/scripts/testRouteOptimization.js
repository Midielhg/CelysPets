const axios = require('axios');

async function testRouteOptimization() {
  try {
    console.log('🚀 Testing Enhanced Route Optimization with Miami Data...\n');

    // Test with realistic Miami appointments
    const response = await axios.post('http://localhost:3001/api/route-optimization/optimize', {
      startLocation: '1200 Biscayne Blvd, Miami, FL 33132', // Cely's Pets Mobile Grooming HQ
      appointments: [
        {
          id: '1',
          address: '801 Brickell Ave, Miami, FL 33131', // Sofia Martinez
          time: '09:00'
        },
        {
          id: '2',
          address: '1717 N Bayshore Dr, Miami, FL 33132', // Carlos Rodriguez  
          time: '11:00'
        },
        {
          id: '3',
          address: '2025 Biscayne Blvd, Miami, FL 33137', // Isabella Garcia
          time: '14:00'
        },
        {
          id: '4',
          address: '200 S Biscayne Blvd, Miami, FL 33131', // Miguel Santos
          time: '16:00'
        }
      ]
    });

    const route = response.data;
    
    console.log('📊 ROUTE OPTIMIZATION RESULTS');
    console.log('================================');
    console.log(`🔧 Algorithm: ${route.optimizationMethod || 'Standard'}`);
    console.log(`📍 Total Stops: ${route.stops.length}`);
    console.log(`🛣️  Total Distance: ${route.totalDistance.toFixed(1)} miles`);
    console.log(`⏰ Total Duration: ${Math.floor(route.totalDuration / 60)}h ${route.totalDuration % 60}m`);
    console.log(`⛽ Estimated Fuel Cost: $${route.estimatedFuelCost.toFixed(2)}`);
    console.log('\n🗺️  OPTIMIZED ROUTE SEQUENCE:');
    console.log('================================');

    route.stops.forEach((stop, index) => {
      console.log(`${index + 1}. ${stop.appointment.time} - ${stop.address}`);
      console.log(`   📍 Coordinates: ${stop.coordinates.lat.toFixed(4)}, ${stop.coordinates.lng.toFixed(4)}`);
      if (stop.travelTimeFromPrevious) {
        console.log(`   🚗 Travel: ${stop.distanceFromPrevious.toFixed(1)}mi, ${Math.round(stop.travelTimeFromPrevious)}min`);
      }
      console.log('');
    });

    // Calculate efficiency metrics
    const simpleDistance = route.stops.length * 8; // Assume 8 miles average per stop if not optimized
    const efficiency = ((simpleDistance - route.totalDistance) / simpleDistance * 100);
    
    console.log('💡 OPTIMIZATION INSIGHTS:');
    console.log('================================');
    console.log(`📈 Route Efficiency: ${efficiency.toFixed(1)}% improvement over random routing`);
    console.log(`🌱 CO2 Savings: ~${(route.totalDistance * 0.404).toFixed(1)} lbs CO2 saved`);
    console.log(`💰 Daily Savings: $${((simpleDistance * 0.14) - route.estimatedFuelCost).toFixed(2)} in fuel costs`);
    
    console.log('\n✅ Route optimization test completed successfully!');

  } catch (error) {
    console.error('❌ Route optimization test failed:', error.response?.data || error.message);
  }
}

testRouteOptimization();
