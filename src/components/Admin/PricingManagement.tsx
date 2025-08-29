import React, { useEffect, useMemo, useState } from 'react';
import { apiUrl } from '../../config/api';
import { useToast } from '../../contexts/ToastContext';
import type { Breed, AdditionalService, Species, SizeCategory } from '../../types/pricing';

const emptyBreed: Partial<Breed> = { species: 'dog', name: '', sizeCategory: 'small', fullGroomPrice: 0, fullGroomDuration: 90, active: true };
const emptyAddon: Partial<AdditionalService> = { code: '', name: '', price: 0, duration: 30, description: '', active: true };

const sizeLabels: Record<SizeCategory, string> = {
  small: 'Small (0-15 lbs)',
  medium: 'Medium (16-40 lbs)',
  large: 'Large (41-70 lbs)',
  xlarge: 'X Large (71-90 lbs)',
  xxlarge: 'XX Large (91+ lbs)',
  all: 'All sizes',
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/20 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-amber-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
            >
              ×
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

const PricingManagement: React.FC = () => {
  const { showToast } = useToast();
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [addons, setAddons] = useState<AdditionalService[]>([]);
  const [loading, setLoading] = useState(true);
  const [breedForm, setBreedForm] = useState<Partial<Breed>>(emptyBreed);
  const [addonForm, setAddonForm] = useState<Partial<AdditionalService>>(emptyAddon);
  const [filterSpecies, setFilterSpecies] = useState<Species | 'all'>('all');
  
  // Modal states
  const [showBreedModal, setShowBreedModal] = useState(false);
  const [showAddonModal, setShowAddonModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'breed' | 'addon'; id: number; name: string } | null>(null);

  const filteredBreeds = useMemo(() =>
    breeds.filter(b => filterSpecies === 'all' ? true : b.species === filterSpecies)
  , [breeds, filterSpecies]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bRes, aRes] = await Promise.all([
        fetch(apiUrl('/pricing/breeds')),
        fetch(apiUrl('/pricing/additional-services')),
      ]);
      
      if (!bRes.ok || !aRes.ok) {
        throw new Error('Failed to load pricing data');
      }
      
      setBreeds(await bRes.json());
      setAddons(await aRes.json());
    } catch (e) {
      console.error(e);
      showToast('Failed to load pricing data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const saveBreed = async () => {
    if (!breedForm.name || !breedForm.fullGroomPrice || !breedForm.species || !breedForm.sizeCategory) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    
    try {
      const method = (breedForm as any).id ? 'PUT' : 'POST';
      const url = (breedForm as any).id ? `/pricing/breeds/${(breedForm as any).id}` : '/pricing/breeds';
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(apiUrl(url), {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(breedForm),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Server error:', errorData);
        throw new Error('Failed to save breed');
      }
      
      setBreedForm(emptyBreed);
      setShowBreedModal(false);
      loadData();
      showToast((breedForm as any).id ? 'Breed updated successfully' : 'Breed added successfully', 'success');
    } catch (e) {
      console.error(e);
      showToast('Failed to save breed', 'error');
    }
  };

  const saveAddon = async () => {
    if (!addonForm.code || !addonForm.name || !addonForm.price) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    
    try {
      const method = (addonForm as any).id ? 'PUT' : 'POST';
      const url = (addonForm as any).id ? `/pricing/additional-services/${(addonForm as any).id}` : '/pricing/additional-services';
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(apiUrl(url), {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(addonForm),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save service');
      }
      
      setAddonForm(emptyAddon);
      setShowAddonModal(false);
      loadData();
      showToast((addonForm as any).id ? 'Service updated successfully' : 'Service added successfully', 'success');
    } catch (e) {
      console.error(e);
      showToast('Failed to save service', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      const endpoint = deleteTarget.type === 'breed' 
        ? `/pricing/breeds/${deleteTarget.id}`
        : `/pricing/additional-services/${deleteTarget.id}`;
      
      const response = await fetch(apiUrl(endpoint), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete ${deleteTarget.type}`);
      }
      
      setShowDeleteModal(false);
      setDeleteTarget(null);
      loadData();
      showToast(`${deleteTarget.type === 'breed' ? 'Breed' : 'Service'} deleted successfully`, 'success');
    } catch (e) {
      console.error(e);
      showToast(`Failed to delete ${deleteTarget?.type}`, 'error');
    }
  };

  const openEditBreed = (breed: Breed) => {
    setBreedForm(breed);
    setShowBreedModal(true);
  };

  const openAddBreed = () => {
    setBreedForm(emptyBreed);
    setShowBreedModal(true);
  };

  const openEditAddon = (addon: AdditionalService) => {
    setAddonForm(addon);
    setShowAddonModal(true);
  };

  const openAddAddon = () => {
    setAddonForm(emptyAddon);
    setShowAddonModal(true);
  };

  const openDeleteConfirm = (type: 'breed' | 'addon', id: number, name: string) => {
    setDeleteTarget({ type, id, name });
    setShowDeleteModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-amber-700">Loading pricing data...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-amber-900 mb-4">Pricing Management</h2>
        <p className="text-amber-700">Manage breed pricing and additional services for your grooming business.</p>
      </div>

      {/* Breeds Section */}
      <div className="bg-gradient-to-br from-cream-50 to-amber-50 rounded-2xl shadow-xl p-6 border border-amber-200/50">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <h3 className="text-xl font-semibold text-amber-900">Pet Breeds & Pricing</h3>
            <select 
              value={filterSpecies} 
              onChange={e => setFilterSpecies(e.target.value as Species | 'all')} 
              className="border border-amber-200 rounded-lg px-3 py-2 bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
            >
              <option value="all">All Species</option>
              <option value="dog">Dogs</option>
              <option value="cat">Cats</option>
            </select>
          </div>
          <button
            onClick={openAddBreed}
            className="bg-gradient-to-r from-rose-500 to-rose-600 text-white px-6 py-3 rounded-full hover:from-rose-600 hover:to-rose-700 hover:shadow-lg transform hover:scale-105 transition-all duration-300 font-semibold"
          >
            + Add Breed
          </button>
        </div>
        
        <div className="bg-white/70 backdrop-blur-sm border border-amber-200 rounded-xl overflow-hidden shadow-lg">
          <table className="min-w-full divide-y divide-amber-200">
            <thead className="bg-gradient-to-r from-amber-100 to-rose-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Species</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Breed</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Size Category</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Full Groom Price</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Duration</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-amber-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-200/50">
              {filteredBreeds.map(breed => (
                <tr key={breed.id} className="hover:bg-amber-50/50 transition-colors duration-200">
                  <td className="px-6 py-4 capitalize text-amber-800">{breed.species}</td>
                  <td className="px-6 py-4 font-medium text-amber-900">{breed.name}</td>
                  <td className="px-6 py-4 text-amber-700">{sizeLabels[breed.sizeCategory as SizeCategory]}</td>
                  <td className="px-6 py-4 font-semibold text-rose-600">${Number(breed.fullGroomPrice).toFixed(2)}</td>
                  <td className="px-6 py-4 text-amber-700">{breed.fullGroomDuration ? `${breed.fullGroomDuration} min` : 'Not set'}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center space-x-2">
                      <button 
                        onClick={() => openEditBreed(breed)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => openDeleteConfirm('breed', breed.id, breed.name)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredBreeds.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-amber-600">
                    No breeds found. Click "Add Breed" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Additional Services Section */}
      <div className="bg-gradient-to-br from-cream-50 to-amber-50 rounded-2xl shadow-xl p-6 border border-amber-200/50">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-amber-900">Additional Services</h3>
          <button
            onClick={openAddAddon}
            className="bg-gradient-to-r from-rose-500 to-rose-600 text-white px-6 py-3 rounded-full hover:from-rose-600 hover:to-rose-700 hover:shadow-lg transform hover:scale-105 transition-all duration-300 font-semibold"
          >
            + Add Service
          </button>
        </div>
        
        <div className="bg-white/70 backdrop-blur-sm border border-amber-200 rounded-xl overflow-hidden shadow-lg">
          <table className="min-w-full divide-y divide-amber-200">
            <thead className="bg-gradient-to-r from-amber-100 to-rose-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Code</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Service Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Price</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Duration</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Description</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-amber-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-200/50">
              {addons.map(addon => (
                <tr key={addon.id} className="hover:bg-amber-50/50 transition-colors duration-200">
                  <td className="px-6 py-4 font-mono text-sm text-amber-800 bg-amber-50/50 rounded">{addon.code}</td>
                  <td className="px-6 py-4 font-medium text-amber-900">{addon.name}</td>
                  <td className="px-6 py-4 font-semibold text-rose-600">${Number(addon.price).toFixed(2)}</td>
                  <td className="px-6 py-4 text-amber-700">{addon.duration ? `${addon.duration} min` : 'Not set'}</td>
                  <td className="px-6 py-4 text-sm text-amber-700">{addon.description || '—'}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center space-x-2">
                      <button 
                        onClick={() => openEditAddon(addon)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => openDeleteConfirm('addon', addon.id, addon.name)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {addons.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-amber-600">
                    No additional services found. Click "Add Service" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Breed Modal */}
      <Modal 
        isOpen={showBreedModal} 
        onClose={() => {
          setShowBreedModal(false);
          setBreedForm(emptyBreed);
        }}
        title={(breedForm as any).id ? 'Edit Breed' : 'Add New Breed'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-amber-800 mb-2">Species</label>
            <select 
              value={breedForm.species || 'dog'} 
              onChange={e => setBreedForm(prev => ({...prev, species: e.target.value as Species}))} 
              className="w-full border border-amber-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
            >
              <option value="dog">Dog</option>
              <option value="cat">Cat</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-amber-800 mb-2">Breed Name</label>
            <input 
              type="text"
              placeholder="e.g., Golden Retriever, Persian Cat"
              value={breedForm.name || ''} 
              onChange={e => setBreedForm(prev => ({...prev, name: e.target.value}))} 
              className="w-full border border-amber-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-amber-800 mb-2">Size Category</label>
            <select 
              value={breedForm.sizeCategory || 'small'} 
              onChange={e => setBreedForm(prev => ({...prev, sizeCategory: e.target.value as SizeCategory}))} 
              className="w-full border border-amber-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
            >
              {(['small','medium','large','xlarge','xxlarge'] as SizeCategory[]).map(size => (
                <option value={size} key={size}>{sizeLabels[size]}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-amber-800 mb-2">Full Groom Price ($)</label>
            <input 
              type="number" 
              step="0.01" 
              min="0" 
              placeholder="0.00"
              value={Number(breedForm.fullGroomPrice) || ''} 
              onChange={e => setBreedForm(prev => ({...prev, fullGroomPrice: parseFloat(e.target.value) || 0}))} 
              className="w-full border border-amber-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-amber-800 mb-2">Full Groom Duration (minutes)</label>
            <input 
              type="number" 
              min="1" 
              placeholder="90"
              value={Number(breedForm.fullGroomDuration) || ''} 
              onChange={e => setBreedForm(prev => ({...prev, fullGroomDuration: parseInt(e.target.value) || 90}))} 
              className="w-full border border-amber-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button 
              onClick={() => {
                setShowBreedModal(false);
                setBreedForm(emptyBreed);
              }}
              className="flex-1 px-4 py-2 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button 
              onClick={saveBreed}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-lg hover:from-rose-600 hover:to-rose-700 transition-all duration-200"
            >
              {(breedForm as any).id ? 'Update Breed' : 'Add Breed'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Addon Modal */}
      <Modal 
        isOpen={showAddonModal} 
        onClose={() => {
          setShowAddonModal(false);
          setAddonForm(emptyAddon);
        }}
        title={(addonForm as any).id ? 'Edit Service' : 'Add New Service'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-amber-800 mb-2">Service Code</label>
            <input 
              type="text"
              placeholder="e.g., de-shedding, nail-trim"
              value={addonForm.code || ''} 
              onChange={e => setAddonForm(prev => ({...prev, code: e.target.value}))} 
              className="w-full border border-amber-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-amber-800 mb-2">Service Name</label>
            <input 
              type="text"
              placeholder="e.g., De-Shedding Treatment"
              value={addonForm.name || ''} 
              onChange={e => setAddonForm(prev => ({...prev, name: e.target.value}))} 
              className="w-full border border-amber-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-amber-800 mb-2">Price ($)</label>
            <input 
              type="number" 
              step="0.01" 
              min="0" 
              placeholder="0.00"
              value={Number(addonForm.price) || ''} 
              onChange={e => setAddonForm(prev => ({...prev, price: parseFloat(e.target.value) || 0}))} 
              className="w-full border border-amber-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-amber-800 mb-2">Duration (minutes)</label>
            <input 
              type="number" 
              min="1" 
              placeholder="30"
              value={Number(addonForm.duration) || ''} 
              onChange={e => setAddonForm(prev => ({...prev, duration: parseInt(e.target.value) || 30}))} 
              className="w-full border border-amber-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-amber-800 mb-2">Description (Optional)</label>
            <textarea 
              placeholder="Brief description of the service..."
              value={addonForm.description || ''} 
              onChange={e => setAddonForm(prev => ({...prev, description: e.target.value}))} 
              rows={3}
              className="w-full border border-amber-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button 
              onClick={() => {
                setShowAddonModal(false);
                setAddonForm(emptyAddon);
              }}
              className="flex-1 px-4 py-2 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button 
              onClick={saveAddon}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-lg hover:from-rose-600 hover:to-rose-700 transition-all duration-200"
            >
              {(addonForm as any).id ? 'Update Service' : 'Add Service'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={showDeleteModal} 
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteTarget(null);
        }}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Delete {deleteTarget?.type === 'breed' ? 'Breed' : 'Service'}
            </h3>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
            </p>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button 
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteTarget(null);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button 
              onClick={handleDelete}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PricingManagement;
