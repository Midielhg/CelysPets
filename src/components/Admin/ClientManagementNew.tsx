import React, { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import type { Pet, Client } from '../../types';
import { ClientService } from '../../services/clientService';
import { PricingService } from '../../services/pricingService';
import { Search, Users, Plus, Edit3, Trash2, Eye, Phone, Mail, MapPin } from 'lucide-react';

const ClientManagement: React.FC = () => {
  const { showToast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalClients, setTotalClients] = useState(0);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view');
  const [breeds, setBreeds] = useState<any[]>([]);
  
  const itemsPerPage = 12;

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load data when page or search changes
  useEffect(() => {
    fetchClients();
    if (breeds.length === 0) {
      fetchBreeds();
    }
  }, [currentPage, debouncedSearchTerm, breeds.length]);

  const fetchBreeds = async () => {
    try {
      const breedsData = await PricingService.getAllBreeds();
      setBreeds(breedsData);
    } catch (error) {
      console.error('Error fetching breeds:', error);
      showToast('Failed to load breeds', 'error');
    }
  };

  const fetchClients = async () => {
    try {
      setLoading(true);
      
      const result = await ClientService.getAllWithPagination({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearchTerm
      });
      
      setClients(result.clients);
      setTotalPages(result.totalPages);
      setTotalClients(result.total);
      
      console.log('Clients loaded:', result.clients.length, 'Total:', result.total);
    } catch (error) {
      console.error('Error fetching clients:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showToast(`Failed to fetch clients: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      return;
    }

    try {
      await ClientService.deleteById(clientId);
      showToast('Client deleted successfully', 'success');
      fetchClients();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showToast(`Failed to delete client: ${errorMessage}`, 'error');
    }
  };

  const openModal = (mode: 'view' | 'edit' | 'create', client?: Client) => {
    setModalMode(mode);
    setSelectedClient(client || null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedClient(null);
    setModalMode('view');
  };

  const formatPhone = (phone: string) => {
    if (!phone) return 'N/A';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const ClientCard: React.FC<{ client: Client }> = ({ client }) => (
    <div className="bg-white rounded-lg shadow-md border border-amber-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-amber-900">{client.name}</h3>
          <div className="flex items-center text-sm text-amber-600 mt-1">
            <Mail className="w-4 h-4 mr-1" />
            {client.email}
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => openModal('view', client)}
            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => openModal('edit', client)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Client"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteClient(client.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Client"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center text-amber-700">
          <Phone className="w-4 h-4 mr-2" />
          {formatPhone(client.phone)}
        </div>
        <div className="flex items-start text-amber-700">
          <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
          <span className="line-clamp-2">{client.address}</span>
        </div>
      </div>

      {client.pets && client.pets.length > 0 && (
        <div className="mt-4 pt-4 border-t border-amber-100">
          <div className="text-sm font-medium text-amber-800 mb-2">
            Pets ({client.pets.length})
          </div>
          <div className="space-y-1">
            {client.pets.slice(0, 2).map((pet: Pet, index: number) => (
              <div key={index} className="text-xs text-amber-600">
                {pet.name} - {pet.breed} {pet.type && `(${pet.type})`}
              </div>
            ))}
            {client.pets.length > 2 && (
              <div className="text-xs text-amber-500">
                +{client.pets.length - 2} more pets
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 bg-amber-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-amber-900 mb-2">Client Management</h1>
            <p className="text-amber-600">
              {loading ? 'Loading...' : `${totalClients} total clients`}
            </p>
          </div>
          <button
            onClick={() => openModal('create')}
            className="mt-4 sm:mt-0 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New Client
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search clients by name, email, phone, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
            <p className="mt-2 text-amber-600">Loading clients...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && clients.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-amber-400 mb-4" />
            <h3 className="text-lg font-medium text-amber-900 mb-2">
              {searchTerm ? 'No clients found' : 'No clients yet'}
            </h3>
            <p className="text-amber-600 mb-4">
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : 'Get started by adding your first client'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => openModal('create')}
                className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Add First Client
              </button>
            )}
          </div>
        )}

        {/* Clients Grid */}
        {!loading && clients.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
              {clients.map((client) => (
                <ClientCard key={client.id} client={client} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-amber-300 rounded-lg text-amber-600 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-lg ${
                          currentPage === page
                            ? 'bg-rose-500 text-white'
                            : 'border border-amber-300 text-amber-600 hover:bg-amber-100'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-amber-300 rounded-lg text-amber-600 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Modal Placeholder - You can implement detailed modal here */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-amber-900">
                    {modalMode === 'create' ? 'Add New Client' : 
                     modalMode === 'edit' ? 'Edit Client' : 'Client Details'}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="text-amber-600 hover:text-amber-800"
                  >
                    ×
                  </button>
                </div>
                
                <p className="text-amber-600 mb-4">
                  Modal implementation for {modalMode} mode coming soon...
                </p>
                
                {selectedClient && (
                  <div className="space-y-2 text-sm">
                    <p><strong>Name:</strong> {selectedClient.name}</p>
                    <p><strong>Email:</strong> {selectedClient.email}</p>
                    <p><strong>Phone:</strong> {formatPhone(selectedClient.phone)}</p>
                    <p><strong>Address:</strong> {selectedClient.address}</p>
                    {selectedClient.pets && selectedClient.pets.length > 0 && (
                      <div>
                        <strong>Pets:</strong>
                        <ul className="ml-4 list-disc">
                          {selectedClient.pets.map((pet: Pet, index: number) => (
                            <li key={index}>
                              {pet.name} - {pet.breed} {pet.type && `(${pet.type})`}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientManagement;
