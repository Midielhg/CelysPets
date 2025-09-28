import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 5003;

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Supabase Server Configuration:');
console.log('URL:', supabaseUrl);
console.log('Service Key:', supabaseServiceKey ? 'Present' : 'Missing');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174', 
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://localhost:5178'
  ],
  credentials: true
}));

app.use(express.json());

// Test endpoint
app.get('/api/test', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('count(*)')
      .limit(1);
    
    if (error) {
      throw error;
    }

    res.json({ 
      status: 'ok', 
      message: 'Supabase connection working!',
      data 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
});

// Calendar Info endpoint
app.get('/api/calendar/info', async (req, res) => {
  try {
    const { groomer } = req.query;
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    let subscriptionUrl = `${baseUrl}/api/calendar/feed.ics`;
    let appointmentCount = 0;
    
    // Add groomer filter if specified
    if (groomer && typeof groomer === 'string') {
      subscriptionUrl += `?groomer=${groomer}`;
    }

    // Try to get appointment count
    try {
      let query = supabase
        .from('appointments')
        .select('id', { count: 'exact' })
        .gte('date', new Date().toISOString().split('T')[0])
        .in('status', ['pending', 'confirmed', 'in-progress']);

      if (groomer && typeof groomer === 'string') {
        query = query.eq('groomer_id', groomer);
      }

      const { count, error } = await query;

      if (error) {
        throw error;
      }

      appointmentCount = count || 0;
    } catch (dbError) {
      console.warn('Could not get appointment count, using fallback:', dbError);
      appointmentCount = 1; // Fallback for demo
    }

    res.json({
      subscriptionUrl,
      appointmentCount,
      instructions: {
        ios: [
          'Copy the subscription URL',
          'Open Settings > Calendar > Accounts',
          'Tap "Add Account" > "Other"',
          'Tap "Add Subscribed Calendar"',
          'Paste the URL and tap "Next"',
          'Configure settings and tap "Save"'
        ],
        macos: [
          'Copy the subscription URL',
          'Open Calendar app',
          'Go to File > New Calendar Subscription',
          'Paste the URL and click "Subscribe"',
          'Configure refresh frequency and click "OK"'
        ],
        general: [
          'The calendar will refresh automatically',
          'New appointments will appear within 1 hour',
          'Completed or cancelled appointments will be removed'
        ]
      },
      calendarName: 'CelysPets Appointments',
      refreshInterval: '1 hour'
    });

  } catch (error) {
    console.error('❌ Calendar info error:', error);
    res.status(500).json({ error: 'Failed to get calendar information' });
  }
});

// Calendar ICS Feed endpoint
app.get('/api/calendar/feed.ics', async (req, res) => {
  try {
    const { groomer } = req.query;

    // Set proper headers for ICS file
    res.set({
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="celyspets-appointments.ics"',
      'Cache-Control': 'no-cache, must-revalidate',
      'Expires': '0'
    });

    let appointments = [];
    
    try {
      // Build Supabase query
      let query = supabase
        .from('appointments')
        .select(`
          id,
          date,
          time,
          duration,
          service,
          status,
          notes,
          clients!inner(name, phone, address),
          users!groomer_id(name)
        `)
        .gte('date', new Date().toISOString().split('T')[0])
        .in('status', ['pending', 'confirmed', 'in-progress'])
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      // Filter by groomer if specified
      if (groomer && typeof groomer === 'string') {
        query = query.eq('groomer_id', groomer);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      appointments = data || [];
    } catch (dbError) {
      console.warn('Database query failed, returning sample calendar:', dbError);
      // Return sample appointments for testing when DB is down
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      appointments = [{
        id: 1,
        date: tomorrow.toISOString().split('T')[0],
        time: '10:00',
        duration: 120,
        service: 'Full Grooming',
        status: 'confirmed',
        clients: { name: 'Sample Client', phone: '555-0123', address: '123 Main St' },
        users: { name: 'Sample Groomer' }
      }];
    }

    if (!appointments || appointments.length === 0) {
      res.send(createEmptyICS());
      return;
    }

    // Generate ICS content
    const icsContent = createICSContent(appointments);
    res.send(icsContent);

  } catch (error) {
    console.error('❌ Calendar feed error:', error);
    res.status(500).send(createErrorICS('Server error occurred'));
  }
});

// Helper functions for ICS generation
function createICSContent(appointments) {
  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CelysPets//Grooming Appointments//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:CelysPets Appointments',
    'X-WR-CALDESC:Grooming appointments from CelysPets booking system',
    'X-WR-TIMEZONE:America/New_York',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H', // Refresh every hour
  ].join('\r\n');

  appointments.forEach(appointment => {
    const event = createICSEvent(appointment);
    icsContent += '\r\n' + event;
  });

  icsContent += '\r\nEND:VCALENDAR';
  return icsContent;
}

function createICSEvent(appointment) {
  const appointmentDate = new Date(appointment.date + 'T' + appointment.time);
  const durationMinutes = appointment.duration || 120;
  const endDate = new Date(appointmentDate.getTime() + (durationMinutes * 60000));
  
  // Format dates for ICS (YYYYMMDDTHHMMSSZ)
  const startDateStr = appointmentDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const endDateStr = endDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const createdDateStr = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  
  // Generate unique ID
  const uid = `appointment-${appointment.id}@celyspets.com`;
  
  // Handle service name
  const serviceNames = appointment.service || 'Grooming Service';

  // Handle nested client and groomer data from Supabase join
  const clientName = appointment.clients?.name || 'Unknown Client';
  const groomerName = appointment.users?.name || 'Assigned Groomer';
  const clientPhone = appointment.clients?.phone || '';
  const clientAddress = appointment.clients?.address || '';

  // Create event summary and description
  const summary = `${serviceNames} - ${clientName}`;
  const description = escapeICSText([
    `Grooming Appointment`,
    `Client: ${clientName}`,
    clientPhone ? `Phone: ${clientPhone}` : '',
    `Service: ${serviceNames}`,
    `Groomer: ${groomerName}`,
    `Status: ${formatStatus(appointment.status)}`,
    appointment.notes ? `Notes: ${appointment.notes}` : '',
    clientAddress ? `Address: ${clientAddress}` : '',
  ].filter(Boolean).join('\\n'));

  const location = escapeICSText(clientAddress || 'CelysPets Grooming');

  return [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART:${startDateStr}`,
    `DTEND:${endDateStr}`,
    `DTSTAMP:${createdDateStr}`,
    `CREATED:${createdDateStr}`,
    `LAST-MODIFIED:${createdDateStr}`,
    `SUMMARY:${escapeICSText(summary)}`,
    `DESCRIPTION:${description}`,
    clientAddress ? `LOCATION:${location}` : '',
    `STATUS:${appointment.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED'}`,
    `CATEGORIES:Grooming,${formatStatus(appointment.status)}`,
    'TRANSP:OPAQUE',
    'END:VEVENT'
  ].filter(Boolean).join('\r\n');
}

function escapeICSText(text) {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

function formatStatus(status) {
  if (!status) return 'Pending';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function createEmptyICS() {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CelysPets//Grooming Appointments//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:CelysPets Appointments',
    'X-WR-CALDESC:No upcoming appointments',
    'END:VCALENDAR'
  ].join('\r\n');
}

function createErrorICS(error) {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CelysPets//Grooming Appointments//EN',
    'X-WR-CALNAME:CelysPets Appointments',
    `X-WR-CALDESC:Error: ${error}`,
    'END:VCALENDAR'
  ].join('\r\n');
}

// Start server
app.listen(PORT, () => {
  console.log('🚀 Supabase Calendar Server running on port', PORT);
  console.log(`📅 Calendar feed: http://localhost:${PORT}/api/calendar/feed.ics`);
  console.log(`ℹ️  Calendar info: http://localhost:${PORT}/api/calendar/info`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
});