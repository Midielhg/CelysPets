import React, { useState, useEffect, useRef } from 'react';
import type { Pet } from '../../types';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  pets: Pet[];
}

interface ClientSearchProps {
  selectedClient: Client | null;
  onClientSelect: (client: Client) => void;
  onClientUpdate: (client: Client) => void;
}

const ClientSearch: React.FC<ClientSearchProps> = ({
  selectedClient,
  onClientSelect,
  onClientUpdate
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [newClientForm, setNewClientForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    pets: [] as Pet[]
  });

  // Search for clients
  const searchClients = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:5002/api/appointments/search-clients?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
        setShowResults(true);
      } else {
        console.error('Failed to search clients');
      }
    } catch (error) {
      console.error('Error searching clients:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchClients(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle client selection
  const handleClientSelect = (client: Client) => {
    onClientSelect(client);
    setSearchQuery(client.name);
    setShowResults(false);
    setShowCreateForm(false);
  };

  // Create new client
  const createNewClient = async () => {
    setIsCreating(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5002/api/appointments/create-client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newClientForm)
      });

      if (response.ok) {
        const newClient = await response.json();
        handleClientSelect(newClient);
        setNewClientForm({
          name: '',
          email: '',
          phone: '',
          address: '',
          pets: []
        });
        setShowCreateForm(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create client');
      }
    } catch (error) {
      console.error('Error creating client:', error);
      alert('Failed to create client');
    } finally {
      setIsCreating(false);
    }
  };

  // Update selected client
  const updateClient = async () => {
    if (!selectedClient) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:5001/api/appointments/update-client/${selectedClient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(selectedClient)
      });

      if (response.ok) {
        const updatedClient = await response.json();
        onClientUpdate(updatedClient);
      } else {
        alert('Failed to update client');
      }
    } catch (error) {
      console.error('Error updating client:', error);
      alert('Failed to update client');
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-6 border border-amber-100">
      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <span className="bg-amber-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">🔍</span>
        Client Search & Management
      </h4>

      {/* Search Section */}
      <div className="relative mb-6" ref={searchRef}>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value !== selectedClient?.name) {
                onClientSelect({ id: '', name: '', email: '', phone: '', address: '', pets: [] });
              }
            }}
            placeholder="Search clients by name, email, or phone..."
            className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-500"></div>
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {searchResults.length > 0 ? (
              <>
                {searchResults.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => handleClientSelect(client)}
                    className="w-full text-left px-4 py-3 hover:bg-amber-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900">{client.name}</div>
                    <div className="text-sm text-gray-600">{client.email} • {client.phone}</div>
                    <div className="text-xs text-gray-500">{client.pets?.length || 0} pets</div>
                  </button>
                ))}
                <button
                  onClick={() => {
                    setShowCreateForm(true);
                    setShowResults(false);
                    setNewClientForm(prev => ({ ...prev, name: searchQuery }));
                  }}
                  className="w-full text-left px-4 py-3 text-amber-600 hover:bg-amber-50 border-t border-amber-200"
                >
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create new client "{searchQuery}"
                  </div>
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setShowCreateForm(true);
                  setShowResults(false);
                  setNewClientForm(prev => ({ ...prev, name: searchQuery }));
                }}
                className="w-full text-left px-4 py-3 text-amber-600 hover:bg-amber-50"
              >
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create new client "{searchQuery}"
                </div>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Selected Client Information */}
      {selectedClient && selectedClient.id && (
        <div className="bg-white rounded-lg p-4 border border-amber-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h5 className="font-medium text-gray-900">Selected Client</h5>
            <button
              onClick={() => {
                onClientSelect({ id: '', name: '', email: '', phone: '', address: '', pets: [] });
                setSearchQuery('');
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={selectedClient.name}
                onChange={(e) => onClientUpdate({ ...selectedClient, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={selectedClient.email}
                onChange={(e) => onClientUpdate({ ...selectedClient, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={selectedClient.phone}
                onChange={(e) => onClientUpdate({ ...selectedClient, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="md:col-span-1">
              <button
                onClick={updateClient}
                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Update Client
              </button>
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              value={selectedClient.address}
              onChange={(e) => onClientUpdate({ ...selectedClient, address: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Pet Management */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">Pets</label>
              <button
                onClick={() => {
                  const newPets = [...selectedClient.pets, { name: '', breed: '', age: 0, weight: '', type: 'dog' as const }];
                  onClientUpdate({ ...selectedClient, pets: newPets });
                }}
                className="text-amber-600 hover:text-amber-800 text-sm font-medium"
              >
                + Add Pet
              </button>
            </div>
            
            <div className="space-y-3">
              {selectedClient.pets.map((pet, index) => (
                <div key={index} className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-amber-700">Pet #{index + 1}</span>
                    <button
                      onClick={() => {
                        const newPets = selectedClient.pets.filter((_, i) => i !== index);
                        onClientUpdate({ ...selectedClient, pets: newPets });
                      }}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <input
                      type="text"
                      value={pet.name}
                      onChange={(e) => {
                        const newPets = [...selectedClient.pets];
                        newPets[index] = { ...pet, name: e.target.value };
                        onClientUpdate({ ...selectedClient, pets: newPets });
                      }}
                      placeholder="Pet name"
                      className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <input
                      type="text"
                      value={pet.breed}
                      onChange={(e) => {
                        const newPets = [...selectedClient.pets];
                        newPets[index] = { ...pet, breed: e.target.value };
                        onClientUpdate({ ...selectedClient, pets: newPets });
                      }}
                      placeholder="Breed"
                      className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <select
                      value={pet.type || 'dog'}
                      onChange={(e) => {
                        const newPets = [...selectedClient.pets];
                        newPets[index] = { ...pet, type: e.target.value as 'dog' | 'cat' };
                        onClientUpdate({ ...selectedClient, pets: newPets });
                      }}
                      className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="dog">Dog</option>
                      <option value="cat">Cat</option>
                    </select>
                    <input
                      type="number"
                      value={pet.age || ''}
                      onChange={(e) => {
                        const newPets = [...selectedClient.pets];
                        newPets[index] = { ...pet, age: parseInt(e.target.value) || 0 };
                        onClientUpdate({ ...selectedClient, pets: newPets });
                      }}
                      placeholder="Age"
                      className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create New Client Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg p-4 border border-amber-200">
          <div className="flex items-center justify-between mb-4">
            <h5 className="font-medium text-gray-900">Create New Client</h5>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={newClientForm.name}
                onChange={(e) => setNewClientForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={newClientForm.email}
                onChange={(e) => setNewClientForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={newClientForm.phone}
                onChange={(e) => setNewClientForm(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              value={newClientForm.address}
              onChange={(e) => setNewClientForm(prev => ({ ...prev, address: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={createNewClient}
              disabled={isCreating || !newClientForm.name || !newClientForm.email}
              className="bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              {isCreating ? 'Creating...' : 'Create Client'}
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientSearch;
