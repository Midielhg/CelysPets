import React, { useState, useEffect } from 'react';
import { Calendar, Plus, RotateCw, Check, X, AlertCircle } from 'lucide-react';
import { CalendarImportService } from '../../services/calendarImportService';
import { useAuth } from '../../contexts/AuthContext';

interface CalendarConnection {
  id: string;
  calendar_type: string;
  calendar_name: string;
  calendar_url: string;
  sync_enabled: boolean;
  last_sync: string;
}

interface CalendarIntegrationSetupProps {
  onAppointmentsImported?: () => void;
  onClose?: () => void;
}

const CalendarIntegrationSetup: React.FC<CalendarIntegrationSetupProps> = ({ 
  onAppointmentsImported, 
  onClose 
}) => {
  const { user } = useAuth();
  const [connections, setConnections] = useState<CalendarConnection[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{
    syncing: boolean;
    connectionId?: string;
    progress: string;
    results?: { imported: number; updated: number; errors: string[] };
  }>({ syncing: false, progress: '' });

  // Form state for adding new calendar
  const [newCalendar, setNewCalendar] = useState({
    name: '',
    url: '',
    type: 'apple' as 'apple' | 'google' | 'outlook'
  });

  const [importMethod, setImportMethod] = useState<'url' | 'file'>('url');

  useEffect(() => {
    if (user) {
      loadCalendarConnections();
    }
  }, [user]);

  const loadCalendarConnections = async () => {
    setLoading(true);
    try {
      // This would normally fetch from Supabase
      // For now, we'll use localStorage for demo
      const saved = localStorage.getItem(`calendar_connections_${user?.id}`);
      if (saved) {
        setConnections(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load calendar connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const addCalendarConnection = async () => {
    if (!newCalendar.name || (importMethod === 'url' && !newCalendar.url) || !user) return;

    setLoading(true);
    try {
      // Basic URL validation for URL method
      if (importMethod === 'url') {
        if (!newCalendar.url.includes('webcal://') && !newCalendar.url.includes('https://')) {
          throw new Error('Please enter a valid calendar URL (webcal:// or https://)');
        }
        
        // Quick test of the URL format
        const testUrl = newCalendar.url.replace('webcal:', 'https:');
        try {
          new URL(testUrl);
        } catch {
          throw new Error('Invalid URL format. Please check your calendar URL.');
        }
        
        // Special handling for iCloud URLs
        if (testUrl.includes('icloud.com')) {
          const useFileUpload = confirm(
            'iCloud calendars often have network restrictions that prevent automatic syncing.\n\n' +
            'Would you like to use the more reliable FILE UPLOAD method instead?\n\n' +
            'Click "OK" to switch to file upload, or "Cancel" to try URL sync anyway.'
          );
          
          if (useFileUpload) {
            setImportMethod('file');
            alert('Switched to file upload method. Please export your calendar as an .ics file and upload it.');
            return;
          }
        }
      }

      const connection: CalendarConnection = {
        id: Date.now().toString(),
        calendar_type: newCalendar.type,
        calendar_name: newCalendar.name,
        calendar_url: newCalendar.url || '',
        sync_enabled: true,
        last_sync: new Date().toISOString()
      };

      const updatedConnections = [...connections, connection];
      setConnections(updatedConnections);
      
      // Save to localStorage (in real app, this would be Supabase)
      localStorage.setItem(`calendar_connections_${user.id}`, JSON.stringify(updatedConnections));

      setNewCalendar({ name: '', url: '', type: 'apple' });
      setShowAddModal(false);
      
      // Show success message
      alert('Calendar connection added successfully! Use the sync button to import appointments.');
      
    } catch (error: any) {
      alert(`Failed to add calendar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileImport = async (file: File) => {
    if (!file || !user) return;

    setLoading(true);
    try {
      const content = await file.text();
      
      if (!content.includes('BEGIN:VCALENDAR')) {
        throw new Error('Invalid calendar file. Please make sure you uploaded a .ics file exported from your calendar app.');
      }
      
      const events = CalendarImportService.parseICalendar(content);
      const appointments = CalendarImportService.convertEventsToAppointments(events);

      // Store the appointments in localStorage for the appointment management to access
      if (appointments.length > 0) {
        const existingData = localStorage.getItem(`imported_appointments_${user.id}`);
        let allImportedAppointments = existingData ? JSON.parse(existingData) : [];
        
        // Add new appointments from file
        appointments.forEach((apt: any) => {
          const isDuplicate = allImportedAppointments.some((existing: any) => 
            existing.appointment_date === apt.appointment_date && 
            existing.appointment_time === apt.appointment_time &&
            existing.client_name === apt.client_name
          );
          
          if (!isDuplicate) {
            allImportedAppointments.push(apt);
          }
        });
        
        localStorage.setItem(`imported_appointments_${user.id}`, JSON.stringify(allImportedAppointments));
        console.log(`📅 Stored ${appointments.length} appointments from file import, total: ${allImportedAppointments.length}`);
      }

      // Create a connection for the imported file
      const connection: CalendarConnection = {
        id: Date.now().toString(),
        calendar_type: newCalendar.type,
        calendar_name: newCalendar.name || file.name.replace('.ics', ''),
        calendar_url: '',
        sync_enabled: false, // File imports don't sync automatically
        last_sync: new Date().toISOString()
      };

      const updatedConnections = [...connections, connection];
      setConnections(updatedConnections);
      localStorage.setItem(`calendar_connections_${user.id}`, JSON.stringify(updatedConnections));

      // Show import results with more details
      const message = appointments.length > 0 
        ? `Successfully imported ${appointments.length} appointments from ${file.name}!\n\nYou can now view and manage these appointments in your dashboard.`
        : `File imported but no valid appointments found. Please check that your calendar file contains appointment data.`;
      
      alert(message);
      
      setNewCalendar({ name: '', url: '', type: 'apple' });
      setShowAddModal(false);

      // Notify parent component that appointments were imported
      if (onAppointmentsImported && appointments.length > 0) {
        onAppointmentsImported();
      }
      
    } catch (error: any) {
      alert(`Failed to import file: ${error.message}\n\nPlease ensure you're uploading a valid .ics calendar file.`);
    } finally {
      setLoading(false);
    }
  };

  // Demo function for testing when sync fails
  const createDemoConnection = () => {
    if (!user) return;
    
    const demoConnection: CalendarConnection = {
      id: Date.now().toString(),
      calendar_type: 'apple',
      calendar_name: 'Demo Calendar (Sample Data)',
      calendar_url: '',
      sync_enabled: false,
      last_sync: new Date().toISOString()
    };

    const updatedConnections = [...connections, demoConnection];
    setConnections(updatedConnections);
    localStorage.setItem(`calendar_connections_${user.id}`, JSON.stringify(updatedConnections));
    
    alert('Demo calendar connection created! This shows how the system would work with your real calendar data.');
    setShowAddModal(false);
  };

  const syncCalendar = async (connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId);
    if (!connection) return;

    setSyncProgress({ 
      syncing: true, 
      connectionId, 
      progress: 'Fetching calendar data...' 
    });

    try {
      // Try to fetch calendar data with multiple fallback methods
      const calendarUrl = connection.calendar_url.replace('webcal:', 'https:');
      let icsContent = '';
      
      // Skip direct fetch for iCloud URLs as they always block CORS
      const isICloudUrl = calendarUrl.includes('icloud.com');
      
      if (!isICloudUrl) {
        // Method 1: Try direct fetch first (for non-iCloud public calendars)
        try {
          setSyncProgress({ 
            syncing: true, 
            connectionId, 
            progress: 'Attempting direct connection...' 
          });
          
          const directResponse = await fetch(calendarUrl, {
            method: 'GET',
            headers: {
              'Accept': 'text/calendar,application/calendar,text/plain',
            },
            mode: 'cors'
          });
          
          if (directResponse.ok) {
            icsContent = await directResponse.text();
          } else {
            throw new Error('Direct fetch failed');
          }
        } catch (directError) {
          console.log('Direct fetch failed, trying proxy...', directError);
        }
      }
      
      // If direct fetch failed or skipped, try proxy methods
      if (!icsContent) {
        // Method 2: Try primary CORS proxy
        try {
          setSyncProgress({ 
            syncing: true, 
            connectionId, 
            progress: 'Using CORS proxy service...' 
          });
          
          const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(calendarUrl)}`;
          const proxyResponse = await fetch(proxyUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            }
          });
          
          if (proxyResponse.ok) {
            const result = await proxyResponse.json();
            if (result.contents) {
              icsContent = result.contents;
            } else {
              throw new Error('No content in proxy response');
            }
          } else {
            throw new Error(`Proxy fetch failed: ${proxyResponse.status}`);
          }
        } catch (proxyError) {
          console.log('Primary proxy failed, trying alternative...', proxyError);
          
          // Method 3: Try alternative approach with different proxy
          try {
            setSyncProgress({ 
              syncing: true, 
              connectionId, 
              progress: 'Trying alternative proxy...' 
            });
            
            const altProxyUrl = `https://corsproxy.io/?${encodeURIComponent(calendarUrl)}`;
            const altResponse = await fetch(altProxyUrl, {
              method: 'GET',
              headers: {
                'Accept': 'text/calendar,text/plain',
              }
            });
            
            if (altResponse.ok) {
              icsContent = await altResponse.text();
            } else {
              throw new Error(`Alternative proxy failed: ${altResponse.status}`);
            }
          } catch (altError: any) {
            // Final fallback: Provide clear instructions for manual import
            throw new Error(
              `Unable to automatically fetch iCloud calendar data due to security restrictions.\n\n` +
              `Please use the FILE UPLOAD method instead:\n` +
              `1. Open Calendar app on Mac\n` +
              `2. Select your calendar → File → Export → Export...\n` +
              `3. Save as .ics file and upload it here\n\n` +
              `This is more reliable for iCloud calendars!`
            );
          }
        }
      }

      if (!icsContent || !icsContent.includes('BEGIN:VCALENDAR')) {
        throw new Error('Invalid calendar data received. Please check that your calendar URL points to a valid iCalendar file.');
      }

      setSyncProgress({ 
        syncing: true, 
        connectionId, 
        progress: 'Parsing appointments...' 
      });

      const events = CalendarImportService.parseICalendar(icsContent);
      const appointments = CalendarImportService.convertEventsToAppointments(events);

      setSyncProgress({ 
        syncing: true, 
        connectionId, 
        progress: `Processing ${appointments.length} appointments...` 
      });

      // Store the appointments in localStorage for the appointment management to access
      if (appointments.length > 0 && user) {
        const existingData = localStorage.getItem(`imported_appointments_${user.id}`);
        let allImportedAppointments = existingData ? JSON.parse(existingData) : [];
        
        // Add new appointments (avoid duplicates based on date+time+client)
        appointments.forEach((apt: any) => {
          const isDuplicate = allImportedAppointments.some((existing: any) => 
            existing.appointment_date === apt.appointment_date && 
            existing.appointment_time === apt.appointment_time &&
            existing.client_name === apt.client_name
          );
          
          if (!isDuplicate) {
            allImportedAppointments.push(apt);
          }
        });
        
        localStorage.setItem(`imported_appointments_${user.id}`, JSON.stringify(allImportedAppointments));
        console.log(`📅 Stored ${appointments.length} new appointments, total: ${allImportedAppointments.length}`);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      const results = {
        imported: appointments.length,
        updated: 0,
        errors: []
      };

      setSyncProgress({ 
        syncing: false, 
        connectionId, 
        progress: 'Sync complete!',
        results
      });

      // Update last sync time
      const updatedConnections = connections.map(c => 
        c.id === connectionId 
          ? { ...c, last_sync: new Date().toISOString() }
          : c
      );
      setConnections(updatedConnections);
      localStorage.setItem(`calendar_connections_${user?.id}`, JSON.stringify(updatedConnections));

      // Notify parent component that appointments were imported
      if (onAppointmentsImported && appointments.length > 0) {
        onAppointmentsImported();
      }

      // Clear progress after a moment
      setTimeout(() => {
        setSyncProgress({ syncing: false, progress: '' });
      }, 3000);

    } catch (error: any) {
      console.error('Calendar sync error:', error);
      setSyncProgress({ 
        syncing: false, 
        connectionId, 
        progress: `Sync failed: ${error.message}` 
      });
      
      // Show user-friendly error message
      alert(
        `Calendar sync failed: ${error.message}\n\n` +
        `If the issue persists, try using the file upload method instead.`
      );
    }
  };

  const removeCalendarConnection = async (connectionId: string) => {
    if (!confirm('Are you sure you want to remove this calendar connection?')) return;

    const updatedConnections = connections.filter(c => c.id !== connectionId);
    setConnections(updatedConnections);
    localStorage.setItem(`calendar_connections_${user?.id}`, JSON.stringify(updatedConnections));
  };

  const toggleCalendarSync = async (connectionId: string) => {
    const updatedConnections = connections.map(c => 
      c.id === connectionId 
        ? { ...c, sync_enabled: !c.sync_enabled }
        : c
    );
    setConnections(updatedConnections);
    localStorage.setItem(`calendar_connections_${user?.id}`, JSON.stringify(updatedConnections));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Calendar Integration</h3>
          <p className="text-sm text-gray-600">Connect your existing calendars to sync appointments</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Calendar
        </button>
      </div>

      {/* Connected Calendars List */}
      {loading && connections.length === 0 ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calendars...</p>
        </div>
      ) : connections.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No calendars connected</h4>
          <p className="text-gray-600 mb-4">Connect your Apple Calendar or other calendars to sync appointments</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Connect Your First Calendar
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {connections.map((connection) => (
            <div key={connection.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Calendar className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">{connection.calendar_name}</h4>
                    <p className="text-xs text-gray-500 capitalize">{connection.calendar_type} Calendar</p>
                    <p className="text-xs text-gray-400">
                      Last sync: {new Date(connection.last_sync).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* Sync Status */}
                  {syncProgress.syncing && syncProgress.connectionId === connection.id ? (
                    <div className="flex items-center text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      <span className="text-xs">{syncProgress.progress}</span>
                    </div>
                  ) : syncProgress.results && syncProgress.connectionId === connection.id ? (
                    <div className="flex items-center text-green-600">
                      <Check className="w-4 h-4 mr-1" />
                      <span className="text-xs">
                        {syncProgress.results.imported} imported
                      </span>
                    </div>
                  ) : null}

                  {/* Sync Button */}
                  <button
                    onClick={() => syncCalendar(connection.id)}
                    disabled={syncProgress.syncing}
                    className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-50"
                    title="Sync now"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>

                  {/* Enable/Disable Toggle */}
                  <button
                    onClick={() => toggleCalendarSync(connection.id)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      connection.sync_enabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        connection.sync_enabled ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeCalendarConnection(connection.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Remove calendar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Calendar Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Add Calendar Connection</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Import Method Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Import Method
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="url"
                      checked={importMethod === 'url'}
                      onChange={(e) => setImportMethod(e.target.value as 'url' | 'file')}
                      className="mr-2"
                    />
                    Calendar URL
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="file"
                      checked={importMethod === 'file'}
                      onChange={(e) => setImportMethod(e.target.value as 'url' | 'file')}
                      className="mr-2"
                    />
                    Upload File (.ics)
                  </label>
                </div>
              </div>

              {/* Calendar Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calendar Type
                </label>
                <select
                  value={newCalendar.type}
                  onChange={(e) => setNewCalendar(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="apple">Apple Calendar (iCloud)</option>
                  <option value="google">Google Calendar</option>
                  <option value="outlook">Outlook Calendar</option>
                </select>
              </div>

              {/* Calendar Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calendar Name
                </label>
                <input
                  type="text"
                  value={newCalendar.name}
                  onChange={(e) => setNewCalendar(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={importMethod === 'file' ? 'Will use filename if empty' : 'My Appointments'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Calendar URL or File Upload */}
              {importMethod === 'url' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Calendar Subscription URL
                  </label>
                  <input
                    type="url"
                    value={newCalendar.url}
                    onChange={(e) => setNewCalendar(prev => ({ ...prev, url: e.target.value }))}
                    placeholder={newCalendar.type === 'apple' ? "webcal://p127-caldav.icloud.com/..." : "webcal://example.com/calendar.ics"}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {newCalendar.type === 'apple' && newCalendar.url.includes('icloud.com') && (
                    <div className="bg-amber-50 border border-amber-200 rounded p-2 mt-2">
                      <p className="text-xs text-amber-800">
                        ⚠️ <strong>iCloud Note:</strong> URL sync may fail due to CORS restrictions. 
                        Consider using the "Upload File" method for better reliability.
                      </p>
                    </div>
                  )}
                  
                  {/* URL Instructions */}
                  <div className="bg-blue-50 rounded-lg p-4 mt-4">
                    <div className="flex items-start">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-semibold text-blue-900 mb-2">
                          How to get your calendar URL:
                        </h4>
                        {newCalendar.type === 'apple' && (
                          <div>
                            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside mb-3">
                              <li>Open Calendar app on Mac or go to iCloud.com</li>
                              <li>Right-click your calendar → Share Calendar</li>
                              <li>Make it Public and copy the URL</li>
                              <li>Paste the URL here</li>
                            </ol>
                            <div className="bg-yellow-100 border border-yellow-300 rounded p-2 mt-2">
                              <p className="text-xs text-yellow-800">
                                <strong>Note:</strong> If URL sync fails due to network restrictions, 
                                use the "Upload File" option instead - it's more reliable.
                              </p>
                            </div>
                          </div>
                        )}
                        {newCalendar.type === 'google' && (
                          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                            <li>Go to Google Calendar settings</li>
                            <li>Select your calendar → Integrate calendar</li>
                            <li>Copy the "Public URL to this calendar"</li>
                            <li>Paste the URL here</li>
                          </ol>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Calendar File
                  </label>
                  <input
                    type="file"
                    accept=".ics,.ical"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileImport(file);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Export your calendar as .ics file and upload it here
                  </p>
                  
                  {/* File Instructions */}
                  <div className="bg-green-50 rounded-lg p-4 mt-4">
                    <div className="flex items-start">
                      <AlertCircle className="w-5 h-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-semibold text-green-900 mb-2">
                          How to export your calendar:
                        </h4>
                        {newCalendar.type === 'apple' && (
                          <ol className="text-sm text-green-800 space-y-1 list-decimal list-inside">
                            <li>Open Calendar app on Mac</li>
                            <li>Select your calendar on the left</li>
                            <li>File → Export → Export...</li>
                            <li>Save as .ics file and upload here</li>
                          </ol>
                        )}
                        {newCalendar.type === 'google' && (
                          <ol className="text-sm text-green-800 space-y-1 list-decimal list-inside">
                            <li>Go to Google Calendar settings</li>
                            <li>Import & Export → Export</li>
                            <li>Download the .ics file</li>
                            <li>Upload the file here</li>
                          </ol>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Demo Option for Testing */}
              <div className="bg-gray-50 rounded-lg p-3 border-t border-gray-200">
                <p className="text-xs text-gray-600 mb-2">
                  Can't sync your calendar due to network restrictions?
                </p>
                <button
                  onClick={createDemoConnection}
                  className="w-full px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                >
                  Create Demo Connection (for testing)
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={addCalendarConnection}
                  disabled={!newCalendar.name || (importMethod === 'url' && !newCalendar.url) || loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Adding...' : importMethod === 'file' ? 'Import File' : 'Add Calendar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarIntegrationSetup;