import React, { useState, useEffect, useCallback } from 'react';
import { Search, Edit, Trash2, Users, UserCheck, UserCog, Shield } from 'lucide-react';
import CreateUserModal from './CreateUserModal';
import EditUserModal from './EditUserModal';
import DeleteUserModal from './DeleteUserModal';
import { UserService, type User, type UserStats, type UserPagination } from '../../services/userService';

// Interfaces are now imported from UserService

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [pagination, setPagination] = useState<UserPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Selected users for bulk operations
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

  const fetchUsers = useCallback(async (page = 1, search = '', role = 'all') => {
    try {
      setLoading(true);
      console.log('� Fetching users...', { page, search, role });
      
      const response = await UserService.getUsers(page, 10, search, role);
      
      setUsers(response.users);
      setPagination(response.pagination);
      setError(null);
    } catch (err) {
      console.error('❌ fetchUsers error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array since we don't want this to recreate on every render

  const fetchUserStats = useCallback(async () => {
    try {
      console.log('� Fetching user statistics...');
      const data = await UserService.getUserStats();
      setUserStats(data);
    } catch (err) {
      console.error('❌ fetchUserStats error:', err);
    }
  }, []);

  useEffect(() => {
    fetchUsers(currentPage, searchTerm, roleFilter);
    fetchUserStats();
  }, [currentPage, searchTerm, roleFilter, fetchUsers, fetchUserStats]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleRoleFilter = (role: string) => {
    setRoleFilter(role);
    setCurrentPage(1);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleUserCreated = () => {
    fetchUsers(currentPage, searchTerm, roleFilter);
    fetchUserStats();
    setIsCreateModalOpen(false);
  };

  const handleUserUpdated = () => {
    fetchUsers(currentPage, searchTerm, roleFilter);
    fetchUserStats();
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  const handleUserDeleted = () => {
    fetchUsers(currentPage, searchTerm, roleFilter);
    fetchUserStats();
    setIsDeleteModalOpen(false);
    setSelectedUser(null);
  };

  const handleBulkRoleUpdate = async (newRole: 'client' | 'admin' | 'groomer') => {
    if (selectedUserIds.length === 0) return;

    try {
      // TODO: Implement bulk update with Supabase
      console.log('Bulk update not yet implemented for Supabase, newRole:', newRole);
      setSelectedUserIds([]);
      /*
      const token = localStorage.getItem('auth_token');
      const response = await fetch(apiUrl('/users/bulk-update-roles'), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userIds: selectedUserIds,
          role: newRole
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update user roles');
      }

      fetchUsers(currentPage, searchTerm, roleFilter);
      fetchUserStats();
      setSelectedUserIds([]);
      */
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user roles');
    }
  };

  const toggleUserSelection = (userId: number) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.length === users.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(users.map(user => user.id));
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4 text-red-500" />;
      case 'groomer':
        return <UserCog className="w-4 h-4 text-blue-500" />;
      case 'client':
        return <UserCheck className="w-4 h-4 text-green-500" />;
      default:
        return <Users className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'groomer':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'client':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading && !users.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">Manage user accounts, roles, and permissions</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-gradient-to-r from-rose-500 to-rose-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-full hover:from-rose-600 hover:to-rose-700 hover:shadow-lg transform hover:scale-105 transition-all duration-300 font-semibold text-sm md:text-base"
          >
            + Add User
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {userStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-gray-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.overview?.users || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <UserCheck className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Clients</p>
                                <p className="text-2xl font-bold text-gray-900">{userStats.overview?.clients || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <UserCog className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Groomers</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.overview?.groomers || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.overview?.admins || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={roleFilter}
              onChange={(e) => handleRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="client">Clients</option>
              <option value="groomer">Groomers</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions - Responsive */}
        {selectedUserIds.length > 0 && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-amber-800">
                {selectedUserIds.length} user(s) selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkRoleUpdate('client')}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Make Clients
                </button>
                <button
                  onClick={() => handleBulkRoleUpdate('groomer')}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Make Groomers
                </button>
                <button
                  onClick={() => handleBulkRoleUpdate('admin')}
                  className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Make Admins
                </button>
                <button
                  onClick={() => setSelectedUserIds([])}
                  className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Users List - Responsive Design */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 md:px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUserIds.length === users.length && users.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                </th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="hidden sm:table-cell px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-3 md:px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                  </td>
                  <td className="px-3 md:px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-xs md:text-sm text-gray-500 truncate">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-3 md:px-6 py-4">
                    <span className={`inline-flex items-center px-2 md:px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeClass(user.role)}`}>
                      {getRoleIcon(user.role)}
                      <span className="ml-1 capitalize">{user.role}</span>
                    </span>
                  </td>
                  <td className="hidden sm:table-cell px-3 md:px-6 py-4 text-xs md:text-sm text-gray-500">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-3 md:px-6 py-4">
                    <div className="flex items-center gap-1 md:gap-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-amber-600 hover:text-amber-700 p-1 rounded"
                        title="Edit user"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="text-red-600 hover:text-red-700 p-1 rounded"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden">
          {/* Mobile Select All */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={selectedUserIds.length === users.length && users.length > 0}
                onChange={toggleSelectAll}
                className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="ml-2 text-sm text-gray-600">
                Select all ({users.length} users)
              </span>
            </label>
          </div>

          {/* Mobile User Cards */}
          <div className="divide-y divide-gray-200">
            {users.map((user) => (
              <div key={user.id} className="p-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(user.id)}
                    onChange={() => toggleUserSelection(user.id)}
                    className="mt-1 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900 truncate">{user.name}</h3>
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-amber-600 hover:text-amber-700 p-1 rounded"
                          title="Edit user"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-600 hover:text-red-700 p-1 rounded"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeClass(user.role)}`}>
                        {getRoleIcon(user.role)}
                        <span className="ml-1 capitalize">{user.role}</span>
                      </span>
                      <span className="text-xs text-gray-500">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-3 md:px-6 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs md:text-sm text-gray-500">
              Showing {users.length} of {pagination.total} users
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => prev - 1)}
                disabled={currentPage <= 1}
                className="px-2 md:px-3 py-1 text-xs md:text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-2 md:px-3 py-1 text-xs md:text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={currentPage >= pagination.totalPages}
                className="px-2 md:px-3 py-1 text-xs md:text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {users.length === 0 && !loading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 md:p-12 text-center">
          <Users className="w-10 h-10 md:w-12 md:h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">No users found</h3>
          <p className="text-sm md:text-base text-gray-500 mb-4">
            {searchTerm || roleFilter !== 'all' 
              ? 'Try adjusting your search criteria or filters.'
              : 'Get started by creating your first user.'}
          </p>
          {!searchTerm && roleFilter === 'all' && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gradient-to-r from-rose-500 to-rose-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-full hover:from-rose-600 hover:to-rose-700 hover:shadow-lg transform hover:scale-105 transition-all duration-300 font-semibold text-sm md:text-base"
            >
              + Add First User
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onUserCreated={handleUserCreated}
      />

      {selectedUser && (
        <>
          <EditUserModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedUser(null);
            }}
            onUserUpdated={handleUserUpdated}
            user={selectedUser}
          />

          <DeleteUserModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setSelectedUser(null);
            }}
            onUserDeleted={handleUserDeleted}
            user={selectedUser}
          />
        </>
      )}
    </div>
  );
};

export default UserManagement;
