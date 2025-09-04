import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../contexts/ToastContext';
import type { Pet, Client } from '../../types';
import { apiUrl } from '../../config/api';

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
  const [editMode, setEditMode] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [showAddModal, setShowAddModal] = useState(false);
  const [breeds, setBreeds] = useState<any[]>([]);
  
  const [clientForm, setClientForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    pets: [] as Pet[],
    notes: ''
  });

  const [addressVerification, setAddressVerification] = useState<{
    isVerifying: boolean;
    suggestions: Array<{ description: string; place_id: string }>;
    showSuggestions: boolean;
  }>({
    isVerifying: false,
    suggestions: [],
    showSuggestions: false
  });

  const itemsPerPage = 12;

  // Debounce search term to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay for debouncing

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to first page when search changes
  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm]);

  // Fetch clients when page or debounced search term changes
  useEffect(() => {
    fetchClients();
    fetchBreeds();
  }, [currentPage, debouncedSearchTerm]);

  const fetchBreeds = async () => {
    try {
      const response = await fetch(apiUrl('/pricing/breeds'));
      if (response.ok) {
        const breedsData = await response.json();
        setBreeds(breedsData);
      }
    } catch (error) {
      console.error('Error fetching breeds:', error);
    }
  };

  const getBreedById = (breedId: number | null) => {
    if (!breedId) return null;
    return breeds.find((breed: any) => breed.id === breedId);
  };

  const getBreedByName = (breedName: string) => {
    if (!breedName) return null;
    return breeds.find((breed: any) => 
      breed.name.toLowerCase() === breedName.toLowerCase()
    );
  };

  const fetchClients = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(debouncedSearchTerm && { search: debouncedSearchTerm })
      });

      const clientApiUrl = apiUrl(`/clients?${params}`);
      console.log('Fetching clients from:', clientApiUrl);

      let response = await fetch(clientApiUrl, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      // Fallback to appointments API if clients API fails
      if (!response.ok) {
        console.log('Clients API failed, trying appointments API as fallback...');
        const fallbackUrl = apiUrl('/appointments');
        response = await fetch(fallbackUrl, {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        });
        
        if (response.ok) {
          const appointmentsData = await response.json();
          // Extract unique clients from appointments
          const clientsMap = new Map();
          appointmentsData.forEach((appointment: any) => {
            if (appointment.client && appointment.client.id) {
              clientsMap.set(appointment.client.id, {
                id: appointment.client.id,
                name: appointment.client.name,
                email: appointment.client.email,
                phone: appointment.client.phone,
                address: appointment.client.address,
                pets: appointment.client.pets || [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                appointment_count: 1
              });
            }
          });
          
          const uniqueClients = Array.from(clientsMap.values());
          
          // Apply client-side filtering if we have a search term
          let filteredClients = uniqueClients;
          if (debouncedSearchTerm) {
            const searchLower = debouncedSearchTerm.toLowerCase();
            filteredClients = uniqueClients.filter(client => 
              client.name?.toLowerCase().includes(searchLower) ||
              client.email?.toLowerCase().includes(searchLower) ||
              client.phone?.toLowerCase().includes(searchLower) ||
              client.address?.toLowerCase().includes(searchLower) ||
              client.pets?.some((pet: any) => 
                pet.name?.toLowerCase().includes(searchLower) ||
                pet.breed?.toLowerCase().includes(searchLower)
              )
            );
          }
          
          // Apply pagination to filtered results
          const startIndex = (currentPage - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          const paginatedClients = filteredClients.slice(startIndex, endIndex);
          
          setClients(paginatedClients);
          setTotalPages(Math.ceil(filteredClients.length / itemsPerPage));
          setTotalClients(filteredClients.length);
          console.log('Fallback successful, extracted and filtered clients:', paginatedClients);
          return;
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error text:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Data received:', data);
      setClients(data.clients || []);
      setTotalPages(data.totalPages || 1);
      setTotalClients(data.total || 0);
    } catch (error) {
      console.error('Error fetching clients:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showToast(`Failed to fetch clients: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    // The page reset will be handled by the useEffect above when debouncedSearchTerm changes
  }, []);

  const openClientModal = (client: Client) => {
    setSelectedClient(client);
    setEditMode(false);
    setShowModal(true);
  };

  const openEditModal = (client: Client) => {
    setSelectedClient(client);
    
    // Map existing pet breeds to breedIds
    const petsWithBreedIds = (client.pets || []).map(pet => {
      let breedId = pet.breedId || null;
      
      // If pet has a breed name but no breedId, try to find the matching breedId
      if (pet.breed && !breedId) {
        const matchingBreed = getBreedByName(pet.breed);
        if (matchingBreed) {
          breedId = matchingBreed.id;
        }
      }
      
      return {
        ...pet,
        breedId: breedId
      };
    });
    
    setClientForm({
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,
      pets: petsWithBreedIds,
      notes: client.notes || ''
    });
    setEditMode(true);
    setShowModal(true);
  };

  // Phone number validation function
  const validatePhoneNumber = (phone: string): { isValid: boolean; formatted?: string; error?: string } => {
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');
    
    // Check for common US/international formats
    if (digitsOnly.length === 10) {
      // US number without country code
      const formatted = `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
      return { isValid: true, formatted };
    } else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
      // US number with country code
      const formatted = `+1 (${digitsOnly.slice(1, 4)}) ${digitsOnly.slice(4, 7)}-${digitsOnly.slice(7)}`;
      return { isValid: true, formatted };
    } else if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
      // International number
      return { isValid: true, formatted: `+${digitsOnly}` };
    }
    
    return { 
      isValid: false, 
      error: 'Please enter a valid phone number (10-15 digits)' 
    };
  };

  // Address verification using Google Places API
  const verifyAddress = async (address: string) => {
    if (!address.trim()) return;
    
    setAddressVerification(prev => ({ ...prev, isVerifying: true }));
    
    try {
      // Use backend proxy to avoid CORS issues with Google Maps API
      const response = await fetch(
        `/api/maps/autocomplete?input=${encodeURIComponent(address)}&types=address`,
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.predictions && data.predictions.length > 0) {
          setAddressVerification({
            isVerifying: false,
            suggestions: data.predictions.slice(0, 5), // Show top 5 suggestions
            showSuggestions: true
          });
        } else {
          // No suggestions found - ask user to confirm
          const confirmed = confirm(`Address "${address}" could not be verified. Do you want to use it anyway?`);
          if (!confirmed) {
            setClientForm(prev => ({ ...prev, address: '' }));
          }
          setAddressVerification({ isVerifying: false, suggestions: [], showSuggestions: false });
        }
      } else {
        // API not available - continue without verification
        setAddressVerification({ isVerifying: false, suggestions: [], showSuggestions: false });
      }
    } catch (error) {
      // Network error or API key not configured - continue without verification
      console.warn('Address verification unavailable:', error);
      setAddressVerification({ isVerifying: false, suggestions: [], showSuggestions: false });
    }
  };

  // Select suggested address
  const selectSuggestedAddress = (suggestion: { description: string; place_id: string }) => {
    setClientForm(prev => ({ ...prev, address: suggestion.description }));
    setAddressVerification({ isVerifying: false, suggestions: [], showSuggestions: false });
  };

  const openAddModal = () => {
    setClientForm({
      name: '',
      email: '',
      phone: '',
      address: '',
      pets: [],
      notes: ''
    });
    setEditMode(false); // Ensure we're in add mode, not edit mode
    setSelectedClient(null); // Clear any selected client
    setShowAddModal(true);
  };

  const saveClient = async () => {
    // Basic validation
    if (!clientForm.name.trim()) {
      showToast('Client name is required', 'error');
      return;
    }
    if (!clientForm.email.trim()) {
      showToast('Client email is required', 'error');
      return;
    }
    if (!clientForm.phone.trim()) {
      showToast('Client phone is required', 'error');
      return;
    }

    // Phone number validation
    const phoneValidation = validatePhoneNumber(clientForm.phone);
    if (!phoneValidation.isValid) {
      showToast(phoneValidation.error || 'Invalid phone number format', 'error');
      return;
    }

    // Address verification (if provided)
    if (clientForm.address.trim()) {
      // Check if we have Google Maps API key
      if (import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
        try {
          await verifyAddress(clientForm.address);
          // If address verification shows suggestions, wait for user to select
          if (addressVerification.showSuggestions) {
            showToast('Please select a valid address from the suggestions', 'warning');
            return;
          }
        } catch (error) {
          console.warn('Address verification failed:', error);
          // Continue without verification
        }
      }
    }

    try {
      const token = localStorage.getItem('auth_token');
      const url = editMode 
        ? `http://localhost:5002/api/clients/${selectedClient?.id}`
        : `http://localhost:5002/api/clients`;
      
      // Prepare client data with formatted phone number
      const clientData = {
        ...clientForm,
        phone: phoneValidation.formatted || clientForm.phone
      };
      
      const response = await fetch(url, {
        method: editMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(clientData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save client');
      }

      showToast(`Client ${editMode ? 'updated' : 'created'} successfully`, 'success');
      setShowModal(false);
      setShowAddModal(false);
      fetchClients();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showToast(`Failed to ${editMode ? 'update' : 'create'} client: ${errorMessage}`, 'error');
    }
  };

  const deleteClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(apiUrl(`/clients?id=${clientId}`), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: clientId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete client');
      }

      const result = await response.json();
      showToast(result.message || 'Client deleted successfully', 'success');
      setShowModal(false);
      fetchClients();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showToast(`Failed to delete client: ${errorMessage}`, 'error');
    }
  };

  const addPet = () => {
    setClientForm(prev => ({
      ...prev,
      pets: [...prev.pets, { name: '', breed: '', breedId: null, age: 1, type: 'dog' as const }]
    }));
  };

  const updatePet = (index: number, field: keyof Pet, value: string | number | null) => {
    setClientForm(prev => ({
      ...prev,
      pets: prev.pets.map((pet, i) => {
        if (i === index) {
          const updatedPet = { ...pet, [field]: value };
          
          // If breedId is being updated, sync the breed name
          if (field === 'breedId') {
            const breed = getBreedById(value as number);
            updatedPet.breed = breed ? breed.name : '';
          }
          
          return updatedPet;
        }
        return pet;
      })
    }));
  };

  const removePet = (index: number) => {
    setClientForm(prev => ({
      ...prev,
      pets: prev.pets.filter((_, i) => i !== index)
    }));
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-amber-900 mb-2">Client Management</h1>
            <p className="text-amber-700">Manage client information and pet details</p>
          </div>
          <button
            onClick={openAddModal}
            className="bg-gradient-to-r from-rose-500 to-rose-600 text-white px-6 py-3 rounded-full hover:from-rose-600 hover:to-rose-700 hover:shadow-lg transform hover:scale-105 transition-all duration-300 font-semibold"
          >
            + Add New Client
          </button>
        </div>
        
        {/* Search and View Toggle */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex-1 max-w-md relative">
            <div className="relative">
              <input
                type="text"
                placeholder="Search clients by name, email, phone, or address..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full px-4 py-3 pl-10 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm"
              />
              <svg 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-amber-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchTerm && (
                <button
                  onClick={() => handleSearch('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-600 hover:text-amber-800 transition-colors"
                  title="Clear search"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {searchTerm && searchTerm !== debouncedSearchTerm && (
                <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600"></div>
                </div>
              )}
            </div>
            {debouncedSearchTerm && (
              <div className="mt-1 text-xs text-amber-600">
                Searching for "{debouncedSearchTerm}"...
              </div>
            )}
          </div>
          
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📱 Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📋 Table
            </button>
          </div>
        </div>

        {/* Results Summary */}
        <div className="text-sm text-gray-600 mb-4">
          Showing {clients.length} of {totalClients} clients
          {searchTerm && ` for "${searchTerm}"`}
        </div>
      </div>

      {/* Main Content */}
      {clients.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-gray-500 text-lg">
            {searchTerm ? 'No clients found matching your search' : 'No clients found'}
          </p>
          <p className="text-gray-400">
            {searchTerm ? 'Try adjusting your search terms' : 'Start by adding your first client'}
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {clients.map((client) => (
            <div key={client.id} className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{client.name}</h3>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => openEditModal(client)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => openClientModal(client)}
                      className="text-green-600 hover:text-green-800 text-sm"
                    >
                      👁️
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <span className="w-4">📧</span>
                    <span className="ml-2 truncate">{client.email}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-4">📞</span>
                    <span className="ml-2">{client.phone}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-4 mt-0.5">📍</span>
                    <span className="ml-2 text-xs line-clamp-2">{client.address}</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {client.pets?.length || 0} pet{(client.pets?.length || 0) !== 1 ? 's' : ''}
                    </span>
                    <span className="text-xs text-gray-400">
                      Added {formatDate(client.createdAt)}
                    </span>
                  </div>
                  
                  {client.pets && client.pets.length > 0 && (
                    <div className="mt-2">
                      <div className="flex flex-wrap gap-1">
                        {client.pets.slice(0, 2).map((pet, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            🐕 {pet.name}
                          </span>
                        ))}
                        {client.pets.length > 2 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                            +{client.pets.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pets
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{client.name}</div>
                      <div className="text-sm text-gray-500">Added {formatDate(client.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{client.email}</div>
                      <div className="text-sm text-gray-500">{client.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">{client.address}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {client.pets && client.pets.length > 0 ? (
                          <div>
                            {client.pets.slice(0, 2).map((pet, index) => (
                              <div key={index} className="mb-1">
                                <span className="font-medium">{pet.name}</span>
                                <span className="text-gray-500"> ({pet.breed})</span>
                              </div>
                            ))}
                            {client.pets.length > 2 && (
                              <div className="text-gray-400 text-xs">
                                +{client.pets.length - 2} more pets
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">No pets</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openClientModal(client)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View
                      </button>
                      <button
                        onClick={() => openEditModal(client)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                  page === currentPage
                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </nav>
        </div>
      )}

      {/* Client Detail/Edit Modal */}
      {showModal && selectedClient && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/20 overflow-y-auto h-full w-full z-50 p-4">
          <div className="relative top-10 mx-auto rounded-2xl shadow-2xl bg-white w-4/5 max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-amber-900">
                  {editMode ? 'Edit Client' : 'Client Details'}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedClient(null);
                    setEditMode(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
                >
                  ×
                </button>
              </div>
              
              {!editMode ? (
                /* View Mode */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedClient.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedClient.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedClient.phone}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Address</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedClient.address}</p>
                    </div>
                    {selectedClient.notes && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Notes</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedClient.notes}</p>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pets</label>
                    {selectedClient.pets && selectedClient.pets.length > 0 ? (
                      <div className="space-y-3">
                        {selectedClient.pets.map((pet, index) => (
                          <div key={index} className="bg-gray-50 p-3 rounded-lg">
                            <div className="font-medium">{pet.name}</div>
                            <div className="text-sm text-gray-600">
                              {pet.breed} • Age: {pet.age}
                              {pet.weight && ` • Weight: ${pet.weight}`}
                            </div>
                            {pet.specialInstructions && (
                              <div className="text-sm text-gray-500 mt-1">{pet.specialInstructions}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No pets registered</p>
                    )}
                  </div>
                </div>
              ) : (
                /* Edit Mode */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name *</label>
                      <input
                        type="text"
                        value={clientForm.name}
                        onChange={(e) => setClientForm(prev => ({ ...prev, name: e.target.value }))}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email *</label>
                      <input
                        type="email"
                        value={clientForm.email}
                        onChange={(e) => setClientForm(prev => ({ ...prev, email: e.target.value }))}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone *</label>
                      <input
                        type="tel"
                        value={clientForm.phone}
                        onChange={(e) => setClientForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Address *</label>
                      <textarea
                        value={clientForm.address}
                        onChange={(e) => setClientForm(prev => ({ ...prev, address: e.target.value }))}
                        rows={3}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Notes</label>
                      <textarea
                        value={clientForm.notes}
                        onChange={(e) => setClientForm(prev => ({ ...prev, notes: e.target.value }))}
                        rows={3}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Pets</label>
                        {clientForm.pets.length > 2 && (
                          <p className="text-xs text-gray-500 mt-1">Scroll down to see all pets</p>
                        )}
                      </div>
                      <button
                        onClick={addPet}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        + Add Pet
                      </button>
                    </div>
                    
                    <div className="space-y-3 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50/50">
                      {clientForm.pets.map((pet, index) => (
                        <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-sm font-semibold text-gray-700">Pet {index + 1}</span>
                            <button
                              onClick={() => removePet(index)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Remove
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              placeholder="Pet name"
                              value={pet.name}
                              onChange={(e) => updatePet(index, 'name', e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                            <select
                              value={pet.breedId || ''}
                              onChange={(e) => updatePet(index, 'breedId', e.target.value ? Number(e.target.value) : null)}
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="">Select breed</option>
                              {breeds
                                .filter((breed: any) => breed.species === (pet.type || 'dog'))
                                .map((breed: any) => (
                                  <option key={breed.id} value={breed.id}>
                                    {breed.name}
                                  </option>
                                ))}
                            </select>
                            <select
                              value={pet.type || ''}
                              onChange={(e) => {
                                updatePet(index, 'type', e.target.value);
                                // Reset breed when type changes
                                updatePet(index, 'breedId', null);
                              }}
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="">Select Type</option>
                              <option value="dog">Dog</option>
                              <option value="cat">Cat</option>
                            </select>
                            <input
                              type="number"
                              placeholder="Age"
                              value={pet.age}
                              onChange={(e) => updatePet(index, 'age', parseInt(e.target.value) || 0)}
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                            <input
                              type="text"
                              placeholder="Weight (optional)"
                              value={pet.weight || ''}
                              onChange={(e) => updatePet(index, 'weight', e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>
                          
                          <textarea
                            placeholder="Special instructions (optional)"
                            value={pet.specialInstructions || ''}
                            onChange={(e) => updatePet(index, 'specialInstructions', e.target.value)}
                            rows={2}
                            className="mt-2 w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
                {!editMode ? (
                  <>
                    <button
                      onClick={() => deleteClient(selectedClient.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                    >
                      Delete Client
                    </button>
                    <div className="space-x-2">
                      <button
                        onClick={() => openEditModal(selectedClient)}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                      >
                        Edit Client
                      </button>
                      <button
                        onClick={() => setShowModal(false)}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-x-2">
                      <button
                        onClick={() => deleteClient(selectedClient.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                      >
                        Delete Client
                      </button>
                      <button
                        onClick={() => setEditMode(false)}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                    <button
                      onClick={saveClient}
                      className="bg-gradient-to-r from-rose-500 to-rose-600 text-white px-4 py-2 rounded-lg hover:from-rose-600 hover:to-rose-700 transition-all duration-200"
                    >
                      Save Changes
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/20 overflow-y-auto h-full w-full z-50 p-4">
          <div className="relative top-10 mx-auto rounded-2xl shadow-2xl bg-white w-4/5 max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-amber-900">Add New Client</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name *</label>
                    <input
                      type="text"
                      value={clientForm.name}
                      onChange={(e) => setClientForm(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email *</label>
                    <input
                      type="email"
                      value={clientForm.email}
                      onChange={(e) => setClientForm(prev => ({ ...prev, email: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone *</label>
                    <input
                      type="tel"
                      value={clientForm.phone}
                      onChange={(e) => setClientForm(prev => ({ ...prev, phone: e.target.value }))}
                      onBlur={(e) => {
                        // Format phone number when user leaves the field
                        const phoneValidation = validatePhoneNumber(e.target.value);
                        if (phoneValidation.isValid && phoneValidation.formatted) {
                          setClientForm(prev => ({ ...prev, phone: phoneValidation.formatted || e.target.value }));
                        }
                      }}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="(786) 222-3785 or +1 786 222 3785"
                    />
                    {clientForm.phone && (
                      <div className="mt-1">
                        {validatePhoneNumber(clientForm.phone).isValid ? (
                          <p className="text-xs text-green-600">✓ Valid phone number</p>
                        ) : (
                          <p className="text-xs text-red-600">⚠ Please enter a valid phone number (10-15 digits)</p>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Address *</label>
                    <div className="relative">
                      <textarea
                        value={clientForm.address}
                        onChange={(e) => {
                          setClientForm(prev => ({ ...prev, address: e.target.value }));
                          // Clear previous suggestions when user types
                          setAddressVerification(prev => ({ ...prev, showSuggestions: false }));
                        }}
                        onBlur={(e) => {
                          // Verify address when user leaves the field
                          if (e.target.value.trim()) {
                            verifyAddress(e.target.value);
                          }
                        }}
                        rows={3}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter full address for verification"
                      />
                      {addressVerification.isVerifying && (
                        <div className="absolute right-2 top-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                    </div>
                    
                    {/* Address suggestions */}
                    {addressVerification.showSuggestions && addressVerification.suggestions.length > 0 && (
                      <div className="mt-2 border border-gray-300 rounded-md bg-white shadow-lg max-h-48 overflow-y-auto z-10">
                        <div className="p-2 bg-blue-50 border-b">
                          <p className="text-sm text-blue-700 font-medium">Select a verified address:</p>
                        </div>
                        {addressVerification.suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => selectSuggestedAddress(suggestion)}
                            className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0 focus:outline-none focus:bg-blue-50"
                          >
                            <div className="text-sm text-gray-900">{suggestion.description}</div>
                          </button>
                        ))}
                        <div className="p-2 bg-gray-50 border-t">
                          <button
                            type="button"
                            onClick={() => setAddressVerification(prev => ({ ...prev, showSuggestions: false }))}
                            className="text-xs text-gray-600 hover:text-gray-800"
                          >
                            Use address as entered
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                      value={clientForm.notes}
                      onChange={(e) => setClientForm(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Pets</label>
                      {clientForm.pets.length > 2 && (
                        <p className="text-xs text-gray-500 mt-1">Scroll down to see all pets</p>
                      )}
                    </div>
                    <button
                      onClick={addPet}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      + Add Pet
                    </button>
                  </div>
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50/50">
                    {clientForm.pets.map((pet, index) => (
                      <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-sm font-semibold text-gray-700">Pet {index + 1}</span>
                          <button
                            onClick={() => removePet(index)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Pet name"
                            value={pet.name}
                            onChange={(e) => updatePet(index, 'name', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          <select
                            value={pet.breedId || ''}
                            onChange={(e) => updatePet(index, 'breedId', e.target.value ? Number(e.target.value) : null)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="">Select breed</option>
                            {breeds
                              .filter((breed: any) => breed.species === (pet.type || 'dog'))
                              .map((breed: any) => (
                                <option key={breed.id} value={breed.id}>
                                  {breed.name}
                                </option>
                              ))}
                          </select>
                          <select
                            value={pet.type || ''}
                            onChange={(e) => {
                              updatePet(index, 'type', e.target.value);
                              // Reset breed when type changes
                              updatePet(index, 'breedId', null);
                            }}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="">Select Type</option>
                            <option value="dog">Dog</option>
                            <option value="cat">Cat</option>
                          </select>
                          <input
                            type="number"
                            placeholder="Age"
                            value={pet.age}
                            onChange={(e) => updatePet(index, 'age', parseInt(e.target.value) || 0)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          <input
                            type="text"
                            placeholder="Weight (optional)"
                            value={pet.weight || ''}
                            onChange={(e) => updatePet(index, 'weight', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        
                        <textarea
                          placeholder="Special instructions (optional)"
                          value={pet.specialInstructions || ''}
                          onChange={(e) => updatePet(index, 'specialInstructions', e.target.value)}
                          rows={2}
                          className="mt-2 w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveClient}
                  className="bg-gradient-to-r from-rose-500 to-rose-600 text-white px-4 py-2 rounded-lg hover:from-rose-600 hover:to-rose-700 transition-all duration-200"
                >
                  Add Client
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManagement;
