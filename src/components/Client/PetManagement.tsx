import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, ArrowLeft } from 'lucide-react';

interface Pet {
  id: string;
  name: string;
  breed: string;
  age: number;
  weight: number;
  notes?: string;
  species: 'dog' | 'cat';
}

interface Breed {
  id: number;
  name: string;
  species: 'dog' | 'cat';
  sizeCategory: string;
  fullGroomPrice: string;
  active: boolean;
}

const PetManagement: React.FC = () => {
  const navigate = useNavigate();
  const [pets, setPets] = useState<Pet[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    age: 0,
    weight: 0,
    notes: '',
    species: 'dog' as 'dog' | 'cat'
  });

  const getAvailableBreeds = () => {
    return breeds.filter(breed => breed.species === formData.species);
  };

  useEffect(() => {
    fetchPets();
    fetchBreeds();
  }, []);

  const fetchBreeds = async () => {
    try {
      const response = await fetch('http://localhost:5002/api/pricing/breeds');
      if (response.ok) {
        const breedsData = await response.json();
        setBreeds(breedsData);
      }
    } catch (error) {
      console.error('Failed to fetch breeds:', error);
    }
  };

  const fetchPets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5002/api/client/pets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setPets(await response.json());
      }
    } catch (error) {
      console.error('Failed to fetch pets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      const url = editingPet 
        ? `http://localhost:5002/api/client/pets/${editingPet.id}`
        : 'http://localhost:5002/api/client/pets';
      
      const response = await fetch(url, {
        method: editingPet ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchPets();
        resetForm();
      }
    } catch (error) {
      console.error('Failed to save pet:', error);
    }
  };

  const handleEdit = (pet: Pet) => {
    setEditingPet(pet);
    setFormData({
      name: pet.name,
      breed: pet.breed,
      age: pet.age,
      weight: pet.weight,
      notes: pet.notes || '',
      species: pet.species
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      breed: '',
      age: 0,
      weight: 0,
      notes: '',
      species: 'dog'
    });
    setShowAddForm(false);
    setEditingPet(null);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-amber-200 rounded w-1/3 mb-4"></div>
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2].map(i => (
              <div key={i} className="h-48 bg-amber-100 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/dashboard')}
            className="mr-4 p-2 rounded-lg text-amber-700 hover:bg-amber-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-amber-900">My Pets 🐾</h1>
            <p className="text-amber-700 mt-1">Manage your furry family members</p>
          </div>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="bg-gradient-to-r from-rose-500 to-rose-600 text-white px-6 py-3 rounded-full hover:from-rose-600 hover:to-rose-700 hover:shadow-lg transform hover:scale-105 transition-all duration-300 font-semibold"
        >
          <Plus className="w-5 h-5 mr-2 inline" />
          Add Pet
        </button>
      </div>

      {/* Add/Edit Pet Form */}
      {showAddForm && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-amber-900">
                  {editingPet ? 'Edit Pet' : 'Add New Pet'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pet Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm"
                    placeholder="Enter pet's name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Species *</label>
                  <select
                    value={formData.species}
                    onChange={(e) => setFormData(prev => ({ ...prev, species: e.target.value as 'dog' | 'cat', breed: '' }))}
                    className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm"
                  >
                    <option value="dog">Dog</option>
                    <option value="cat">Cat</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Breed *</label>
                  <select
                    required
                    value={formData.breed}
                    onChange={(e) => setFormData(prev => ({ ...prev, breed: e.target.value }))}
                    className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm"
                  >
                    <option value="">Select a breed</option>
                    {getAvailableBreeds().map(breed => (
                      <option key={breed.id} value={breed.name}>{breed.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age (years) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="30"
                      value={formData.age || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm"
                      placeholder="Age"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Weight (lbs) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="200"
                      value={formData.weight || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, weight: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm"
                      placeholder="Weight"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Special Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm"
                    placeholder="Any special notes about your pet (allergies, behavior, etc.)"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-2 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-lg hover:from-rose-600 hover:to-rose-700 transition-all duration-200"
                  >
                    {editingPet ? 'Update Pet' : 'Add Pet'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Pets Grid */}
      {pets.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
          {pets.map((pet) => (
            <div key={pet.id} className="bg-gradient-to-br from-cream-50 to-amber-50 rounded-2xl shadow-xl p-6 border border-amber-200/50 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center border border-rose-200">
                    <div className="text-2xl">{pet.species === 'dog' ? '🐕' : '🐱'}</div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-bold text-amber-900">{pet.name}</h3>
                    <p className="text-amber-700">{pet.breed}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleEdit(pet)}
                  className="p-2 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
                >
                  <Edit className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white/50 rounded-lg p-3 border border-amber-200">
                  <p className="text-sm text-amber-700 font-medium">Age</p>
                  <p className="text-lg font-bold text-amber-900">{pet.age} years</p>
                </div>
                <div className="bg-white/50 rounded-lg p-3 border border-amber-200">
                  <p className="text-sm text-amber-700 font-medium">Weight</p>
                  <p className="text-lg font-bold text-amber-900">{pet.weight} lbs</p>
                </div>
              </div>

              {pet.notes && (
                <div className="bg-white/50 rounded-lg p-3 border border-amber-200 mb-4">
                  <p className="text-sm text-amber-700 font-medium">Special Notes</p>
                  <p className="text-amber-800">{pet.notes}</p>
                </div>
              )}

              <button 
                onClick={() => navigate('/booking', { state: { selectedPet: pet } })}
                className="w-full bg-gradient-to-r from-rose-500 to-rose-600 text-white py-3 px-4 rounded-lg hover:from-rose-600 hover:to-rose-700 transition-all duration-200 font-semibold"
              >
                Book Appointment for {pet.name}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gradient-to-br from-cream-50 to-amber-50 rounded-2xl shadow-xl p-12 border border-amber-200/50 text-center">
          <div className="text-8xl mb-6">🐕</div>
          <h3 className="text-2xl font-bold text-amber-900 mb-4">No pets registered yet</h3>
          <p className="text-amber-700 mb-8 max-w-md mx-auto">
            Add your furry friends to get started! Once you add your pets, you can easily book grooming appointments for them.
          </p>
          <button 
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-rose-500 to-rose-600 text-white px-8 py-4 rounded-full hover:from-rose-600 hover:to-rose-700 hover:shadow-lg transform hover:scale-105 transition-all duration-300 font-semibold text-lg"
          >
            <Plus className="w-6 h-6 mr-3 inline" />
            Add Your First Pet
          </button>
        </div>
      )}
    </div>
  );
};

export default PetManagement;
