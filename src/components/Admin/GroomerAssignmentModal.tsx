import React, { useState, useEffect } from 'react';
import { X, User as UserIcon, Clock, MapPin, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { UserService, type User } from '../../services/userService';
import { AppointmentService } from '../../services/appointmentService';
import { useToast } from '../../contexts/ToastContext';
import type { Appointment } from '../../types';

interface GroomerAssignmentModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onAssignmentUpdated: (appointmentId: string, groomerName: string | null) => void;
}

const GroomerAssignmentModal: React.FC<GroomerAssignmentModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onAssignmentUpdated
}) => {
  const [groomers, setGroomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedGroomerId, setSelectedGroomerId] = useState<string>('');
  const { showToast } = useToast();

  // Load groomers when modal opens
  useEffect(() => {
    if (isOpen) {
      loadGroomers();
      // Set current groomer selection if appointment is assigned
      if (appointment?.assignedGroomer) {
        // We need to find the groomer ID from the name (this is a limitation we'll improve)
        setSelectedGroomerId(''); // Will be set after groomers are loaded
      } else {
        setSelectedGroomerId('');
      }
    }
  }, [isOpen, appointment]);

  // Set selected groomer after groomers are loaded
  useEffect(() => {
    if (groomers.length > 0 && appointment?.assignedGroomer) {
      const currentGroomer = groomers.find(g => g.name === appointment.assignedGroomer);
      if (currentGroomer) {
        setSelectedGroomerId(currentGroomer.id);
      }
    }
  }, [groomers, appointment]);

  const loadGroomers = async () => {
    try {
      setLoading(true);
      const fetchedGroomers = await UserService.getAssignableUsers();
      setGroomers(fetchedGroomers);
    } catch (error) {
      console.error('❌ Failed to load assignable users:', error);
      showToast('Failed to load assignable users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignGroomer = async () => {
    if (!appointment) return;

    try {
      setAssigning(true);
      
      if (selectedGroomerId === '') {
        // Unassign staff member
        await AppointmentService.unassignGroomer(parseInt(appointment.id));
        onAssignmentUpdated(appointment.id, null);
        showToast('Staff member unassigned successfully', 'success');
      } else {
        // Assign staff member
        await AppointmentService.assignToGroomer(parseInt(appointment.id), selectedGroomerId);
        const selectedUser = groomers.find(g => g.id === selectedGroomerId);
        onAssignmentUpdated(appointment.id, selectedUser?.name || null);
        const roleLabel = selectedUser?.role === 'admin' ? 'Admin' : 'Groomer';
        showToast(`Appointment assigned to ${selectedUser?.name} (${roleLabel})`, 'success');
      }

      onClose();
    } catch (error) {
      console.error('❌ Failed to assign staff member:', error);
      showToast('Failed to assign staff member', 'error');
    } finally {
      setAssigning(false);
    }
  };

  const handleClose = () => {
    setSelectedGroomerId('');
    onClose();
  };

  if (!isOpen || !appointment) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Assign Staff Member</h3>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Appointment Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Appointment Details</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                <span>{appointment.client.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(appointment.date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{appointment.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span className="text-xs">{appointment.client.name}'s Location</span>
              </div>
            </div>
            
            {/* Current Assignment Status */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2">
                {appointment.assignedGroomer ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">
                      Currently assigned to: <strong>{appointment.assignedGroomer}</strong>
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span className="text-sm text-amber-600">No groomer assigned</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Groomer Selection */}
          <div>
            <label htmlFor="groomer-select" className="block text-sm font-medium text-gray-700 mb-2">
              Select Staff Member
            </label>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-600">Loading staff members...</span>
              </div>
            ) : (
              <select
                id="groomer-select"
                value={selectedGroomerId}
                onChange={(e) => setSelectedGroomerId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={assigning}
              >
                <option value="">Unassigned (No staff member)</option>
                {groomers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.role === 'admin' ? 'Admin' : 'Groomer'}) - {user.email}
                  </option>
                ))}
              </select>
            )}

            {groomers.length === 0 && !loading && (
              <p className="text-sm text-gray-500 mt-2">
                No staff members available. Create groomer or admin accounts first.
              </p>
            )}
          </div>

          {/* Groomer Info */}
          {selectedGroomerId && (
            <div className="bg-blue-50 rounded-lg p-3">
              <h5 className="font-medium text-blue-900 mb-1">Selected Staff Member</h5>
              {(() => {
                const selectedUser = groomers.find(g => g.id === selectedGroomerId);
                return selectedUser ? (
                  <div className="text-sm text-blue-700">
                    <p><strong>{selectedUser.name}</strong></p>
                    <p>{selectedUser.email}</p>
                    <p className="text-xs text-blue-600 font-medium">
                      {selectedUser.role === 'admin' ? '👑 Admin' : '✂️ Groomer'}
                    </p>
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            disabled={assigning}
          >
            Cancel
          </button>
          
          <button
            onClick={handleAssignGroomer}
            disabled={assigning || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {assigning ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Assigning...</span>
              </div>
            ) : selectedGroomerId === '' ? (
              'Unassign Staff Member'
            ) : (
              'Assign Staff Member'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroomerAssignmentModal;