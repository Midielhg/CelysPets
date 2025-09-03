// Test data for GoogleMapRoute component
export const sampleRouteData = {
  stops: [
    {
      appointment: {
        id: "1",
        client: {
          name: "Sarah Johnson",
          address: "123 Main St, Miami, FL 33101"
        },
        time: "9:00 AM"
      },
      address: "123 Main St, Miami, FL 33101",
      distanceFromPrevious: 0,
      travelTimeFromPrevious: 0
    },
    {
      appointment: {
        id: "2", 
        client: {
          name: "Mike Rodriguez",
          address: "456 Ocean Dr, Miami Beach, FL 33139"
        },
        time: "10:30 AM"
      },
      address: "456 Ocean Dr, Miami Beach, FL 33139",
      distanceFromPrevious: 3.2,
      travelTimeFromPrevious: 15
    },
    {
      appointment: {
        id: "3",
        client: {
          name: "Lisa Chen",
          address: "789 Coral Way, Coral Gables, FL 33134"
        },
        time: "12:00 PM"
      },
      address: "789 Coral Way, Coral Gables, FL 33134", 
      distanceFromPrevious: 4.1,
      travelTimeFromPrevious: 18
    }
  ],
  totalDistance: 7.3,
  totalDuration: 33,
  estimatedFuelCost: 1.10,
  fuelDetails: {
    gasPrice: 3.50,
    mpg: 25,
    gallonsUsed: 0.29
  }
};
