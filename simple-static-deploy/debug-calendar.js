// Debug script to test appointment calendar rendering
const sampleAppointment = {
  "id": "3",
  "client": {
    "id": "1",
    "name": "Maria Rodriguez",
    "phone": "305-123-4567",
    "pets": [{"name": "Max"}, {"name": "Luna"}]
  },
  "services": [{"name": "Puppy Special", "price": 35}],
  "date": "2025-07-28 00:00:00",
  "time": "11:30",
  "status": "pending"
};

console.log('Original date:', sampleAppointment.date);
console.log('Original time:', sampleAppointment.time);

// Test the date parsing logic from the frontend
const normalizedDate = sampleAppointment.date ? sampleAppointment.date.split('T')[0] : '';
console.log('Normalized date:', normalizedDate);

// Parse the date parts
const [year, month, day] = normalizedDate.split('-').map(Number);
const appointmentDate = new Date(year, month - 1, day);
console.log('Appointment date object:', appointmentDate);

// Parse time
const timeString = sampleAppointment.time || '12:00 PM';
const [time, period] = timeString.split(' ');
const [hours, minutes] = (time || '12:00').split(':').map(Number);

console.log('Time parts:', { time, period, hours, minutes });

// Convert to 24-hour format
let hour24 = hours;
if (period === 'PM' && hours !== 12) hour24 += 12;
if (period === 'AM' && hours === 12) hour24 = 0;

console.log('24-hour format:', hour24);

const startTime = new Date(appointmentDate);
startTime.setHours(hour24, minutes || 0, 0);

console.log('Final start time:', startTime);
console.log('Is valid date?', !isNaN(startTime.getTime()));

module.exports = { sampleAppointment, startTime };
