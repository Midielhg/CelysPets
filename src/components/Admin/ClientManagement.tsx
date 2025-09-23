import React, { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import type { Pet } from '../../types';
import { ClientService } from '../../services/clientService';
import { PricingService, type Breed } from '../../services/pricingService';
import type { Database } from '../../types/supabase';
import { Search, Users, Plus, Edit3, Trash2, Eye, Phone, Mail, MapPin } from 'lucide-react';

type Client = Database['public']['Tables']['clients']['Row'];

// Helper function to safely get pets array
const getPetsArray = (pets: Client['pets']): Pet[] => {
  if (!pets) return [];
  if (Array.isArray(pets)) return pets as unknown as Pet[];
  return [];
};

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
  const [breeds, setBreeds] = useState<Breed[]>([]);
  
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
      console.log('ClientManagement: Fetching breeds...');
      const breedsData = await PricingService.getAllBreeds();
      console.log('ClientManagement: Received breeds:', breedsData);
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
      setTotalClients(result.totalCount);
      
      console.log('Clients loaded:', result.clients.length, 'Total:', result.totalCount);
    } catch (error) {
      console.error('Error fetching clients:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showToast(`Failed to fetch clients: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async (clientId: number) => {
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
    <div className="bg-white rounded-lg shadow-md border border-amber-200 p-4 sm:p-6 hover:shadow-lg transition-shadow">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 sm:mb-4">
        <div className="flex-1 min-w-0 mb-3 sm:mb-0">
          <h3 className="text-base sm:text-lg font-semibold text-amber-900 truncate">{client.name}</h3>
          <div className="flex items-center text-xs sm:text-sm text-amber-600 mt-1">
            <Mail className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
            <span className="truncate">{client.email}</span>
          </div>
        </div>
        <div className="flex space-x-1 self-start">
          <button
            onClick={() => openModal('view', client)}
            className="p-1.5 sm:p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => openModal('edit', client)}
            className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Client"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteClient(client.id)}
            className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Client"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2 text-xs sm:text-sm">
        <div className="flex items-center text-amber-700">
          <Phone className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
          <span className="truncate">{formatPhone(client.phone)}</span>
        </div>
        <div className="flex items-start text-amber-700">
          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-2 mt-0.5 flex-shrink-0" />
          <span className="line-clamp-2 break-words">{client.address}</span>
        </div>
      </div>

      {(() => {
        const clientPets = getPetsArray(client.pets);
        return clientPets.length > 0 && (
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-amber-100">
            <div className="text-xs sm:text-sm font-medium text-amber-800 mb-2">
              Pets ({clientPets.length})
            </div>
            <div className="space-y-1">
              {clientPets.slice(0, 2).map((pet: Pet, index: number) => (
                <div key={index} className="text-xs text-amber-600 truncate">
                  {pet.name} - {pet.breed} {pet.type && `(${pet.type})`}
                </div>
              ))}
              {clientPets.length > 2 && (
                <div className="text-xs text-amber-500">
                  +{clientPets.length - 2} more pets
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );

  // Client Modal Component
  const ClientModal: React.FC = () => {
    const [formData, setFormData] = useState({
      name: selectedClient?.name || '',
      email: selectedClient?.email || '',
      phone: selectedClient?.phone || '',
      address: selectedClient?.address || '',
      pets: selectedClient?.pets ? getPetsArray(selectedClient.pets) : []
    });
    
    const [currentPet, setCurrentPet] = useState<Pet>({
      name: '',
      breed: '',
      breedId: null,
      age: undefined,
      type: undefined,
      weight: '',
      specialInstructions: ''
    });
    
    const [showPetForm, setShowPetForm] = useState(false);
    const [editingPetIndex, setEditingPetIndex] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load breeds when modal opens
    useEffect(() => {
      console.log('Modal useEffect: breeds.length =', breeds.length);
      if (breeds.length === 0) {
        console.log('Modal: Fetching breeds because array is empty');
        fetchBreeds();
      }
    }, []);

    // Reset form when selectedClient changes
    useEffect(() => {
      if (selectedClient) {
        setFormData({
          name: selectedClient.name || '',
          email: selectedClient.email || '',
          phone: selectedClient.phone || '',
          address: selectedClient.address || '',
          pets: getPetsArray(selectedClient.pets)
        });
      } else {
        setFormData({
          name: '',
          email: '',
          phone: '',
          address: '',
          pets: []
        });
      }
    }, [selectedClient]);

    const handleInputChange = (field: string, value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handlePetInputChange = (field: keyof Pet, value: string | number | undefined) => {
      setCurrentPet(prev => ({ ...prev, [field]: value }));
    };

    const addOrUpdatePet = () => {
      if (!currentPet.name || !currentPet.breed) {
        showToast('Pet name and breed are required', 'error');
        return;
      }

      const updatedPets = [...formData.pets];
      if (editingPetIndex !== null) {
        updatedPets[editingPetIndex] = currentPet;
        showToast('Pet updated successfully', 'success');
      } else {
        updatedPets.push(currentPet);
        showToast('Pet added successfully', 'success');
      }

      setFormData(prev => ({ ...prev, pets: updatedPets }));
      setCurrentPet({
        name: '',
        breed: '',
        breedId: null,
        age: undefined,
        type: undefined,
        weight: '',
        specialInstructions: ''
      });
      setShowPetForm(false);
      setEditingPetIndex(null);
    };

    const editPet = (index: number) => {
      const petToEdit = formData.pets[index];
      setCurrentPet({ ...petToEdit });
      setEditingPetIndex(index);
      setShowPetForm(true);
    };

    const removePet = (index: number) => {
      const updatedPets = formData.pets.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, pets: updatedPets }));
      showToast('Pet removed successfully', 'success');
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!formData.name || !formData.email || !formData.phone) {
        showToast('Name, email, and phone are required', 'error');
        return;
      }

      setIsSubmitting(true);
      try {
        if (modalMode === 'create') {
          await ClientService.create({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            pets: formData.pets as any
          });
          showToast('Client created successfully', 'success');
        } else if (modalMode === 'edit' && selectedClient) {
          await ClientService.update(selectedClient.id, {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            pets: formData.pets as any
          });
          showToast('Client updated successfully', 'success');
        }

        fetchClients();
        closeModal();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        showToast(`Failed to ${modalMode === 'create' ? 'create' : 'update'} client: ${errorMessage}`, 'error');
      } finally {
        setIsSubmitting(false);
      }
    };

    if (modalMode === 'view' && selectedClient) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-amber-900">Client Details</h2>
                <button
                  onClick={closeModal}
                  className="text-amber-600 hover:text-amber-800 text-xl sm:text-2xl p-1"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-amber-700 mb-1">Name</label>
                    <p className="text-sm sm:text-base text-amber-900 break-words">{selectedClient.name}</p>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-amber-700 mb-1">Email</label>
                    <p className="text-sm sm:text-base text-amber-900 break-all">{selectedClient.email}</p>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-amber-700 mb-1">Phone</label>
                    <p className="text-sm sm:text-base text-amber-900">{formatPhone(selectedClient.phone)}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs sm:text-sm font-medium text-amber-700 mb-1">Address</label>
                    <p className="text-sm sm:text-base text-amber-900 break-words">{selectedClient.address}</p>
                  </div>
                </div>

                {(() => {
                  const pets = getPetsArray(selectedClient.pets);
                  return pets.length > 0 && (
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-amber-700 mb-2">Pets ({pets.length})</label>
                      <div className="space-y-2 sm:space-y-3">
                        {pets.map((pet: Pet, index: number) => (
                          <div key={index} className="bg-amber-50 p-3 sm:p-4 rounded-lg">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                              <p className="break-words"><strong>Name:</strong> {pet.name}</p>
                              <p className="break-words"><strong>Breed:</strong> {pet.breed}</p>
                              {pet.type && <p><strong>Type:</strong> {pet.type}</p>}
                              {pet.age && <p><strong>Age:</strong> {pet.age} years</p>}
                              {pet.weight && <p><strong>Weight:</strong> {pet.weight}</p>}
                              {pet.specialInstructions && (
                                <p className="col-span-1 sm:col-span-2 break-words"><strong>Special Instructions:</strong> {pet.specialInstructions}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => openModal('edit', selectedClient)}
                  className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 sm:py-2 rounded-lg transition-colors text-sm sm:text-base"
                >
                  Edit Client
                </button>
                <button
                  onClick={closeModal}
                  className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 sm:py-2 rounded-lg transition-colors text-sm sm:text-base"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-amber-900">
                {modalMode === 'create' ? 'Add New Client' : 'Edit Client'}
              </h2>
              <button
                onClick={closeModal}
                className="text-amber-600 hover:text-amber-800 text-2xl"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Client Information */}
              <div>
                <h3 className="text-lg font-medium text-amber-800 mb-3">Client Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-amber-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                      placeholder="Client full name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-amber-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                      placeholder="client@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-amber-700 mb-1">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                      placeholder="(555) 123-4567"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-amber-700 mb-1">Address</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                      placeholder="123 Main St, City, State ZIP"
                    />
                  </div>
                </div>
              </div>

              {/* Pets Section */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-medium text-amber-800">Pets ({formData.pets.length})</h3>
                  <button
                    type="button"
                    onClick={() => setShowPetForm(true)}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    + Add Pet
                  </button>
                </div>

                {/* Pet List */}
                {formData.pets.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {formData.pets.map((pet, index) => (
                      <div key={index} className="bg-amber-50 p-3 rounded-lg flex justify-between items-center">
                        <div>
                          <p className="font-medium text-amber-900">{pet.name}</p>
                          <p className="text-sm text-amber-600">
                            {pet.breed} {pet.type && `(${pet.type})`} 
                            {pet.age && ` - ${pet.age} years`}
                            {pet.weight && ` - ${pet.weight}`}
                          </p>
                          {pet.specialInstructions && (
                            <p className="text-xs text-amber-500 mt-1">{pet.specialInstructions}</p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => editPet(index)}
                            className="text-blue-600 hover:bg-blue-50 p-1 rounded"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removePet(index)}
                            className="text-red-600 hover:bg-red-50 p-1 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pet Form */}
                {showPetForm && (
                  <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300">
                    <h4 className="font-medium text-gray-700 mb-3">
                      {editingPetIndex !== null ? 'Edit Pet' : 'Add New Pet'}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pet Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={currentPet.name}
                          onChange={(e) => handlePetInputChange('name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-rose-400"
                          placeholder="Pet name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Breed <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={currentPet.breed}
                          onChange={(e) => {
                            const selectedBreed = breeds.find(b => b.name === e.target.value);
                            handlePetInputChange('breed', e.target.value);
                            handlePetInputChange('breedId', selectedBreed?.id || undefined);
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-rose-400"
                        >
                          <option value="">Select breed</option>
                          {breeds.map((breed) => (
                            <option key={breed.id} value={breed.name}>
                              {breed.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                          value={currentPet.type || ''}
                          onChange={(e) => handlePetInputChange('type', e.target.value || undefined)}
                          className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-rose-400"
                        >
                          <option value="">Select type</option>
                          <option value="dog">Dog</option>
                          <option value="cat">Cat</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Age (years)</label>
                        <input
                          type="number"
                          value={currentPet.age || ''}
                          onChange={(e) => handlePetInputChange('age', e.target.value ? parseInt(e.target.value) : undefined)}
                          className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-rose-400"
                          placeholder="Pet age"
                          min="0"
                          max="30"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
                        <input
                          type="text"
                          value={currentPet.weight || ''}
                          onChange={(e) => handlePetInputChange('weight', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-rose-400"
                          placeholder="e.g., 15 lbs"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
                        <input
                          type="text"
                          value={currentPet.specialInstructions || ''}
                          onChange={(e) => handlePetInputChange('specialInstructions', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-rose-400"
                          placeholder="Any special notes..."
                        />
                      </div>
                    </div>
                    <div className="flex space-x-2 mt-3">
                      <button
                        type="button"
                        onClick={addOrUpdatePet}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        {editingPetIndex !== null ? 'Update Pet' : 'Add Pet'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPetForm(false);
                          setEditingPetIndex(null);
                          setCurrentPet({
                            name: '',
                            breed: '',
                            breedId: null,
                            age: undefined,
                            type: undefined,
                            weight: '',
                            specialInstructions: ''
                          });
                        }}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving...' : modalMode === 'create' ? 'Create Client' : 'Update Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-3 sm:p-6 bg-amber-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-amber-900 mb-1 sm:mb-2">Client Management</h1>
            <p className="text-sm sm:text-base text-amber-600">
              {loading ? 'Loading...' : `${totalClients} total clients`}
            </p>
          </div>
          <button
            onClick={() => openModal('create')}
            className="w-full sm:w-auto bg-rose-500 hover:bg-rose-600 text-white px-4 py-2.5 sm:py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm sm:text-base"
          >
            <Plus className="w-4 h-4" />
            Add New Client
          </button>
        </div>

        {/* Search */}
        <div className="mb-4 sm:mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-amber-200 rounded-lg focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-4 sm:mb-6">
              {clients.map((client) => (
                <ClientCard key={client.id} client={client} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-1 sm:space-x-2 px-4">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-2 sm:px-3 py-2 text-xs sm:text-sm border border-amber-300 rounded-lg text-amber-600 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                
                <div className="flex space-x-1 overflow-x-auto max-w-[200px] sm:max-w-none">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-2 sm:px-3 py-2 text-xs sm:text-sm rounded-lg flex-shrink-0 ${
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
                  className="px-2 sm:px-3 py-2 text-xs sm:text-sm border border-amber-300 rounded-lg text-amber-600 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Client Modal */}
        {showModal && <ClientModal />}
      </div>
    </div>
  );
};

export default ClientManagement;
