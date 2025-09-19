#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

/**
 * Filter extracted appointments to only include those from the last two years (2024-2025)
 */

console.log('🗓️ Filtering appointments to last 2 years (2024-2025)...\n');

// Read the extracted appointments
const extractedDataPath = './celyspets-appointments-extracted.json';
if (!fs.existsSync(extractedDataPath)) {
  console.error('❌ Extracted appointments file not found:', extractedDataPath);
  process.exit(1);
}

const extractedData = JSON.parse(fs.readFileSync(extractedDataPath, 'utf8'));
console.log(`📊 Total appointments in full dataset: ${extractedData.appointments.length}`);

// Filter appointments from 2024-2025
const currentYear = new Date().getFullYear();
const targetYears = [2024, 2025];

const recentAppointments = extractedData.appointments.filter(appointment => {
  if (!appointment.date) return false;
  
  const appointmentYear = new Date(appointment.date).getFullYear();
  return targetYears.includes(appointmentYear);
});

console.log(`🎯 Appointments from 2024-2025: ${recentAppointments.length}`);

// Calculate statistics for recent appointments
let totalRevenue = 0;
const clientsSet = new Set();
const servicesSet = new Set();
const yearStats = {};

recentAppointments.forEach(appointment => {
  // Revenue calculation
  if (appointment.amount && typeof appointment.amount === 'number') {
    totalRevenue += appointment.amount;
  }
  
  // Client tracking
  if (appointment.clientName) {
    clientsSet.add(appointment.clientName.toLowerCase().trim());
  }
  
  // Services tracking
  if (appointment.services && Array.isArray(appointment.services)) {
    appointment.services.forEach(service => servicesSet.add(service));
  }
  
  // Year statistics
  if (appointment.date) {
    const year = new Date(appointment.date).getFullYear();
    if (!yearStats[year]) {
      yearStats[year] = { count: 0, revenue: 0 };
    }
    yearStats[year].count++;
    if (appointment.amount && typeof appointment.amount === 'number') {
      yearStats[year].revenue += appointment.amount;
    }
  }
});

// Sort appointments by date (most recent first)
recentAppointments.sort((a, b) => {
  if (!a.date && !b.date) return 0;
  if (!a.date) return 1;
  if (!b.date) return -1;
  return new Date(b.date) - new Date(a.date);
});

// Create filtered dataset
const filteredData = {
  timestamp: new Date().toISOString(),
  filterCriteria: 'Last 2 years (2024-2025)',
  totalFiltered: recentAppointments.length,
  originalTotal: extractedData.appointments.length,
  appointments: recentAppointments,
  statistics: {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    uniqueClients: clientsSet.size,
    services: Array.from(servicesSet),
    yearBreakdown: yearStats
  }
};

// Save filtered data
const outputPath = './celyspets-appointments-recent.json';
fs.writeFileSync(outputPath, JSON.stringify(filteredData, null, 2));

// Create CSV for easy review
const csvPath = './celyspets-appointments-recent.csv';
const csvHeader = 'Date,Time,Client,Pet Info,Amount,Services,Location,Notes,UID\n';
const csvRows = recentAppointments.map(appointment => {
  const services = appointment.services ? appointment.services.join('; ') : '';
  const amount = appointment.amount || '';
  const notes = (appointment.notes || '').replace(/"/g, '""').replace(/\n/g, ' ');
  const location = (appointment.location || '').replace(/"/g, '""').replace(/\n/g, ' ');
  
  return `"${appointment.date || ''}","${appointment.time || ''}","${appointment.clientName || ''}","${appointment.petInfo || ''}","${amount}","${services}","${location}","${notes}","${appointment.uid || ''}"`;
}).join('\n');

fs.writeFileSync(csvPath, csvHeader + csvRows);

// Display summary
console.log('\n📈 Recent Appointments Summary:');
console.log('================================');
console.log(`📅 Total appointments (2024-2025): ${recentAppointments.length}`);
console.log(`💰 Total revenue: $${filteredData.statistics.totalRevenue.toLocaleString()}`);
console.log(`👥 Unique clients: ${filteredData.statistics.uniqueClients}`);
console.log(`🎨 Services: ${filteredData.statistics.services.join(', ')}`);

console.log('\n📊 Year Breakdown:');
Object.entries(yearStats).forEach(([year, stats]) => {
  console.log(`  ${year}: ${stats.count} appointments, $${stats.revenue.toLocaleString()} revenue`);
});

console.log(`\n✅ Filtered data saved to: ${outputPath}`);
console.log(`✅ CSV export saved to: ${csvPath}`);

// Show sample of recent appointments
console.log('\n🔍 Sample of Recent Appointments:');
console.log('==================================');
recentAppointments.slice(0, 10).forEach((appointment, index) => {
  const amount = appointment.amount ? `$${appointment.amount}` : 'No amount';
  console.log(`${index + 1}. ${appointment.date} - ${appointment.clientName} (${appointment.petInfo}) - ${amount}`);
});

if (recentAppointments.length > 10) {
  console.log(`... and ${recentAppointments.length - 10} more appointments`);
}

console.log('\n🎯 Ready for database import!');