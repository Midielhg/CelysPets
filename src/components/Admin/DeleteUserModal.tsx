import React, { useState } from 'react';
import { AlertTriangle, User } from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'client' | 'admin' | 'groomer';
}

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserDeleted: () => void;
  user: User;
}

const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  isOpen,
  onClose,
  onUserDeleted,
  user
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationText, setConfirmationText] = useState('');

  const handleDelete = async () => {
    if (confirmationText !== 'DELETE') {
      setError('Please type "DELETE" to confirm');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }

      onUserDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setConfirmationText('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/20 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <AlertTriangle className="w-6 h-6 text-red-600 mr-2" />
              <h2 className="text-xl font-bold text-amber-900">Delete User</h2>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
            >
              ×
            </button>
          </div>

          <div className="mb-4">
            <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
              <User className="w-8 h-8 text-red-600 mr-3" />
              <div>
                <h3 className="font-medium text-red-900">{user.name}</h3>
                <p className="text-sm text-red-700">{user.email}</p>
                <p className="text-xs text-red-600 capitalize">Role: {user.role}</p>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Are you sure you want to delete this user?</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• This action cannot be undone</p>
              <p>• The user will lose access to their account immediately</p>
              {user.role === 'groomer' && (
                <p>• Any assigned appointments will need to be reassigned</p>
              )}
              {user.role === 'client' && (
                <p>• Any existing appointments will need to be handled first</p>
              )}
              {user.role === 'admin' && (
                <p>• Administrative privileges will be revoked</p>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="confirmation" className="block text-sm font-medium text-gray-700 mb-2">
              Type <span className="font-bold text-red-600">DELETE</span> to confirm:
            </label>
            <input
              type="text"
              id="confirmation"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Type DELETE here"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={loading || confirmationText !== 'DELETE'}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Deleting...' : 'Delete User'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteUserModal;
