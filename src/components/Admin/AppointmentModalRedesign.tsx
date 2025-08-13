import React from 'react';
import type { Pet, Appointment } from '../../types';

interface AppointmentModalProps {
  showModal: boolean;
  selectedAppointment: Appointment | null;
  isAddingNew: boolean;
  editMode: boolean;
  editForm: {
    client: {
      name: string;
      email: string;
      phone: string;
      address: string;
      pets: Pet[];
    };
    services: string[];
    date: string;
    time: string;
    status: Appointment['status'];
    notes: string;
    groomerId: string | null;
    estimatedDuration: string;
  };
  groomers: Array<{id: string, name: string, email: string}>;
  serviceNames: { [key: string]: string };
  statusColors: { [key: string]: string };
  setShowModal: (show: boolean) => void;
  setEditForm: (form: any) => void;
  openEditModal: (appointment: Appointment) => void;
  updateAppointmentStatus: (id: string, status: string) => void;
  deleteAppointment: (id: string) => void;
  saveAppointmentChanges: () => void;
  cancelEdit: () => void;
  formatDate: (date: string) => string;
  formatTime: (time: string) => string;
  convertTo24Hour: (time: string) => string;
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({
  showModal,
  selectedAppointment,
  isAddingNew,
  editMode,
  editForm,
  groomers,
  serviceNames,
  statusColors,
  setShowModal,
  setEditForm,
  openEditModal,
  updateAppointmentStatus,
  deleteAppointment,
  saveAppointmentChanges,
  cancelEdit,
  formatDate,
  formatTime,
  convertTo24Hour
}) => {
  if (!showModal || (!selectedAppointment && !isAddingNew)) {
    return null;
  }

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className={`relative mx-auto rounded-2xl shadow-2xl bg-white ${editMode ? 'w-full max-w-5xl' : 'w-full max-w-2xl'} max-h-[95vh] overflow-hidden flex flex-col`}>
        
        {/* Header */}
        <div className="px-8 py-6 bg-gradient-to-r from-rose-500 to-pink-600 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold">
                {isAddingNew ? '📋 Add New Appointment' : editMode ? '✏️ Edit Appointment' : '🔧 Manage Appointment'}
              </h3>
              <p className="text-rose-100 mt-1">
                {isAddingNew ? 'Create a new grooming appointment' : editMode ? 'Update appointment details' : 'Quick actions and status updates'}
              </p>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {!editMode && selectedAppointment && !isAddingNew ? (
            <>
              {/* Manage Mode - Enhanced Quick Management */}
              <div className="p-8 space-y-6">
                {/* Appointment Overview Card */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">👤</span>
                    Appointment Overview
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Client</p>
                      <p className="font-medium text-gray-900">{selectedAppointment.client?.name || 'Unknown client'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Contact</p>
                      <p className="font-medium text-gray-900">{selectedAppointment.client?.phone || 'No phone'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Date & Time</p>
                      <p className="font-medium text-gray-900">
                        {selectedAppointment.date ? formatDate(selectedAppointment.date) : 'No date'} at {selectedAppointment.time ? formatTime(selectedAppointment.time) : 'No time'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Current Status</p>
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                        selectedAppointment.status && statusColors[selectedAppointment.status] 
                          ? statusColors[selectedAppointment.status] 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedAppointment.status ? 
                          selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1) : 
                          'Unknown'
                        }
                      </span>
                    </div>
                  </div>
                  {selectedAppointment.client?.address && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-1">Address</p>
                      <p className="font-medium text-gray-900">{selectedAppointment.client.address}</p>
                    </div>
                  )}
                </div>

                {/* Pet Information Card */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">🐕</span>
                    Pet Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedAppointment.client?.pets && Array.isArray(selectedAppointment.client.pets) ? 
                      selectedAppointment.client.pets.map((pet, index) => (
                        <div key={index} className="bg-white rounded-lg p-4 border border-green-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-green-700">{pet?.name || 'Unknown pet'}</span>
                            <span className="text-xs text-gray-500">{pet?.type || 'Pet'}</span>
                          </div>
                          <p className="text-sm text-gray-600">Breed: {pet?.breed || 'Unknown breed'}</p>
                          {pet?.age && <p className="text-sm text-gray-600">Age: {pet.age} years</p>}
                          {pet?.weight && <p className="text-sm text-gray-600">Weight: {pet.weight}</p>}
                        </div>
                      )) : 
                      <div className="text-gray-400 col-span-2">No pets listed</div>
                    }
                  </div>
                </div>

                {/* Services Card */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">✂️</span>
                    Services Selected
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedAppointment.services && Array.isArray(selectedAppointment.services) ? 
                      selectedAppointment.services.map((service, index) => {
                        let serviceName = 'Unknown service';
                        if (typeof service === 'string') {
                          serviceName = serviceNames[service] || service;
                        } else if (service && typeof service === 'object') {
                          serviceName = (service as any).name || 'Unknown service';
                        }
                        
                        return (
                          <div key={index} className="bg-white rounded-lg p-3 border border-purple-200">
                            <span className="font-medium text-purple-700">{serviceName}</span>
                          </div>
                        );
                      }) : 
                      <div className="text-gray-400 col-span-2">No services selected</div>
                    }
                  </div>
                </div>

                {/* Status Update Section */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">🔄</span>
                    Update Status
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { status: 'pending', icon: '⏳', color: 'bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100' },
                      { status: 'confirmed', icon: '✅', color: 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100' },
                      { status: 'in-progress', icon: '🔄', color: 'bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100' },
                      { status: 'completed', icon: '🎉', color: 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100' },
                      { status: 'cancelled', icon: '❌', color: 'bg-red-50 border-red-200 text-red-800 hover:bg-red-100' }
                    ].map(({ status, icon, color }) => (
                      <button
                        key={status}
                        onClick={() => updateAppointmentStatus(selectedAppointment.id, status)}
                        className={`p-4 rounded-lg border-2 text-center font-medium transition-all ${
                          selectedAppointment.status === status
                            ? 'ring-2 ring-offset-2 ring-blue-500 border-blue-300'
                            : color
                        }`}
                      >
                        <div className="text-2xl mb-2">{icon}</div>
                        <div className="text-sm font-semibold">
                          {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-4 justify-between items-center">
                  <button
                    onClick={() => deleteAppointment(selectedAppointment.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
                  >
                    🗑️ Delete Appointment
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={() => openEditModal(selectedAppointment)}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all flex items-center"
                    >
                      ✏️ Full Edit
                    </button>
                    <button
                      onClick={() => setShowModal(false)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Edit Mode - Comprehensive Form */}
              <div className="p-8">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  
                  {/* Client Information Section */}
                  <div className="xl:col-span-1 space-y-6">
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">👤</span>
                        Client Information
                      </h4>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                          <input
                            type="text"
                            value={editForm.client.name}
                            onChange={(e) => setEditForm(prev => ({
                              ...prev,
                              client: { ...prev.client, name: e.target.value }
                            }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Enter client's full name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                          <input
                            type="email"
                            value={editForm.client.email}
                            onChange={(e) => setEditForm(prev => ({
                              ...prev,
                              client: { ...prev.client, email: e.target.value }
                            }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="client@example.com"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                          <input
                            type="tel"
                            value={editForm.client.phone}
                            onChange={(e) => setEditForm(prev => ({
                              ...prev,
                              client: { ...prev.client, phone: e.target.value }
                            }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="(555) 123-4567"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Service Address *</label>
                          <textarea
                            value={editForm.client.address}
                            onChange={(e) => setEditForm(prev => ({
                              ...prev,
                              client: { ...prev.client, address: e.target.value }
                            }))}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Enter full service address"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Pet Information */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">🐕</span>
                        Pet Information
                      </h4>
                      
                      <div className="space-y-3">
                        {editForm.client.pets.map((pet, index) => (
                          <div key={index} className="bg-white rounded-lg p-4 border border-green-200">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-green-700">Pet #{index + 1}</span>
                              <button
                                onClick={() => {
                                  const newPets = editForm.client.pets.filter((_, i) => i !== index);
                                  setEditForm(prev => ({
                                    ...prev,
                                    client: { ...prev.client, pets: newPets }
                                  }));
                                }}
                                className="text-red-500 hover:text-red-700 text-sm"
                              >
                                Remove
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <input
                                type="text"
                                value={pet.name}
                                onChange={(e) => {
                                  const newPets = [...editForm.client.pets];
                                  newPets[index] = { ...pet, name: e.target.value };
                                  setEditForm(prev => ({
                                    ...prev,
                                    client: { ...prev.client, pets: newPets }
                                  }));
                                }}
                                placeholder="Pet name"
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                              />
                              <input
                                type="text"
                                value={pet.breed}
                                onChange={(e) => {
                                  const newPets = [...editForm.client.pets];
                                  newPets[index] = { ...pet, breed: e.target.value };
                                  setEditForm(prev => ({
                                    ...prev,
                                    client: { ...prev.client, pets: newPets }
                                  }));
                                }}
                                placeholder="Breed"
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                              />
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            setEditForm(prev => ({
                              ...prev,
                              client: {
                                ...prev.client,
                                pets: [...prev.client.pets, { name: '', breed: '' }]
                              }
                            }));
                          }}
                          className="w-full bg-green-100 hover:bg-green-200 text-green-700 py-3 rounded-lg font-medium transition-colors"
                        >
                          + Add Pet
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Appointment Details Section */}
                  <div className="xl:col-span-2 space-y-6">
                    
                    {/* Scheduling */}
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">📅</span>
                        Appointment Scheduling
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                          <input
                            type="date"
                            value={editForm.date}
                            onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Time *</label>
                          <input
                            type="time"
                            value={editForm.time.includes('AM') || editForm.time.includes('PM') ? 
                              convertTo24Hour(editForm.time) : editForm.time}
                            onChange={(e) => setEditForm(prev => ({ ...prev, time: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                          <select
                            value={editForm.status}
                            onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as Appointment['status'] }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="pending">⏳ Pending</option>
                            <option value="confirmed">✅ Confirmed</option>
                            <option value="in-progress">🔄 In Progress</option>
                            <option value="completed">🎉 Completed</option>
                            <option value="cancelled">❌ Cancelled</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Groomer Assignment */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="bg-amber-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">👨‍💼</span>
                        Groomer Assignment
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Assign Groomer</label>
                          <select
                            value={editForm.groomerId || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, groomerId: e.target.value || null }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          >
                            <option value="">👤 Not Assigned</option>
                            {groomers.map((groomer) => (
                              <option key={groomer.id} value={groomer.id}>
                                {groomer.name} ({groomer.email})
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Duration</label>
                          <select
                            value={editForm.estimatedDuration || '60'}
                            onChange={(e) => setEditForm(prev => ({ ...prev, estimatedDuration: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          >
                            <option value="30">30 minutes</option>
                            <option value="45">45 minutes</option>
                            <option value="60">1 hour</option>
                            <option value="90">1.5 hours</option>
                            <option value="120">2 hours</option>
                            <option value="150">2.5 hours</option>
                            <option value="180">3 hours</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Services Selection */}
                    <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-6 border border-rose-100">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="bg-rose-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">✂️</span>
                        Services Selection
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(serviceNames).map(([serviceId, serviceName]) => (
                          <label key={serviceId} className="flex items-start space-x-3 p-4 bg-white rounded-lg border border-rose-200 hover:bg-rose-25 transition-colors cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editForm.services.includes(serviceId)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditForm(prev => ({
                                    ...prev,
                                    services: [...prev.services, serviceId]
                                  }));
                                } else {
                                  setEditForm(prev => ({
                                    ...prev,
                                    services: prev.services.filter(s => s !== serviceId)
                                  }));
                                }
                              }}
                              className="mt-1 w-4 h-4 text-rose-600 focus:ring-rose-500 border-gray-300 rounded"
                            />
                            <div>
                              <span className="text-sm font-medium text-gray-900">{serviceName}</span>
                              <p className="text-xs text-gray-500 mt-1">Professional grooming service</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Additional Notes */}
                    <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="bg-gray-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">📝</span>
                        Additional Notes
                      </h4>
                      
                      <textarea
                        value={editForm.notes}
                        onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                        placeholder="Add any special instructions, pet behaviors, or other important notes..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <button
                    onClick={cancelEdit}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveAppointmentChanges}
                    className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {isAddingNew ? 'Create Appointment' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentModal;
