import React, { useEffect, useMemo, useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { PricingService } from '../../services/pricingService';
import type { Breed, AdditionalService, BreedInsert, BreedUpdate, AdditionalServiceInsert, AdditionalServiceUpdate } from '../../services/pricingService';

type Species = 'dog' | 'cat';
type SizeCategory = 'small' | 'medium' | 'large' | 'extra-large';

const emptyBreed: Partial<BreedInsert> = { 
  species: 'dog', 
  name: '', 
  size_category: 'small', 
  full_groom_price: 0, 
  bath_only_price: 0,
  active: true 
};

const emptyAddon: Partial<AdditionalServiceInsert> = { 
  code: '', 
  name: '', 
  price: 0, 
  description: '', 
  active: true 
};

const sizeLabels: Record<SizeCategory, string> = {
  small: 'Small (0-15 lbs)',
  medium: 'Medium (16-40 lbs)',
  large: 'Large (41-70 lbs)',
  'extra-large': 'X Large (71+ lbs)',
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
  const [breedForm, setBreedForm] = useState<Partial<Breed>>(emptyBreed as any);
  const [addonForm, setAddonForm] = useState<Partial<AdditionalService>>(emptyAddon as any);
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
      console.log('Loading pricing data from Supabase...');
      const [breedsData, addonsData] = await Promise.all([
        PricingService.getAllBreeds(),
        PricingService.getAllAdditionalServices(),
      ]);
      
      console.log('Loaded breeds:', breedsData);
      console.log('Loaded additional services:', addonsData);
      
      setBreeds(breedsData);
      setAddons(addonsData);
    } catch (e) {
      console.error('Error loading pricing data:', e);
      showToast('Failed to load pricing data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const saveBreed = async () => {
    if (!breedForm.name || !breedForm.full_groom_price || !breedForm.species || !breedForm.size_category) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    
    try {
      console.log('Saving breed:', breedForm);
      
      if ((breedForm as any).id) {
        // Update existing breed
        const updates: BreedUpdate = {
          name: breedForm.name,
          species: breedForm.species,
          size_category: breedForm.size_category,
          full_groom_price: breedForm.full_groom_price,
          bath_only_price: breedForm.bath_only_price || 0,
          active: breedForm.active
        };
        await PricingService.updateBreed((breedForm as any).id, updates);
        showToast('Breed updated successfully', 'success');
      } else {
        // Create new breed
        const newBreed: BreedInsert = {
          name: breedForm.name,
          species: breedForm.species,
          size_category: breedForm.size_category,
          full_groom_price: breedForm.full_groom_price,
          bath_only_price: breedForm.bath_only_price || 0,
          active: breedForm.active !== false
        };
        await PricingService.createBreed(newBreed);
        showToast('Breed added successfully', 'success');
      }
      
      setBreedForm(emptyBreed as any);
      setShowBreedModal(false);
      loadData();
    } catch (e) {
      console.error('Error saving breed:', e);
      showToast('Failed to save breed', 'error');
    }
  };

  const saveAddon = async () => {
    if (!addonForm.code || !addonForm.name || !addonForm.price) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    
    try {
      console.log('Saving additional service:', addonForm);
      
      if ((addonForm as any).id) {
        // Update existing service
        const updates: AdditionalServiceUpdate = {
          code: addonForm.code,
          name: addonForm.name,
          price: addonForm.price,
          description: addonForm.description || '',
          active: addonForm.active
        };
        await PricingService.updateAdditionalService((addonForm as any).id, updates);
        showToast('Service updated successfully', 'success');
      } else {
        // Create new service
        const newService: AdditionalServiceInsert = {
          code: addonForm.code,
          name: addonForm.name,
          price: addonForm.price,
          description: addonForm.description || '',
          active: addonForm.active !== false
        };
        await PricingService.createAdditionalService(newService);
        showToast('Service added successfully', 'success');
      }
      
      setAddonForm(emptyAddon as any);
      setShowAddonModal(false);
      loadData();
    } catch (e) {
      console.error('Error saving additional service:', e);
      showToast('Failed to save service', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    
    try {
      console.log('Deleting:', deleteTarget);
      
      if (deleteTarget.type === 'breed') {
        await PricingService.deleteBreed(deleteTarget.id);
      } else {
        await PricingService.deleteAdditionalService(deleteTarget.id);
      }
      
      setShowDeleteModal(false);
      setDeleteTarget(null);
      loadData();
      showToast(`${deleteTarget.type === 'breed' ? 'Breed' : 'Service'} deleted successfully`, 'success');
    } catch (e) {
      console.error('Error deleting:', e);
      showToast(`Failed to delete ${deleteTarget?.type}`, 'error');
    }
  };

  const openEditBreed = (breed: Breed) => {
    console.log('Opening edit breed modal for:', breed);
    setBreedForm(breed);
    setShowBreedModal(true);
  };

  const openAddBreed = () => {
    console.log('Opening add breed modal');
    setBreedForm(emptyBreed as any);
    setShowBreedModal(true);
  };

  const openEditAddon = (addon: AdditionalService) => {
    console.log('Opening edit addon modal for:', addon);
    setAddonForm(addon);
    setShowAddonModal(true);
  };

  const openAddAddon = () => {
    console.log('Opening add addon modal');
    setAddonForm(emptyAddon as any);
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
                  <td className="px-6 py-4 text-amber-700">{sizeLabels[breed.size_category as SizeCategory]}</td>
                  <td className="px-6 py-4 font-semibold text-rose-600">${Number(breed.full_groom_price).toFixed(2)}</td>
                  <td className="px-6 py-4 text-amber-700">Standard</td>
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
              value={breedForm.size_category || 'small'} 
              onChange={e => setBreedForm(prev => ({...prev, size_category: e.target.value as SizeCategory}))} 
              className="w-full border border-amber-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
            >
              {(['small','medium','large','extra-large'] as SizeCategory[]).map(size => (
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
              value={Number(breedForm.full_groom_price) || ''} 
              onChange={e => setBreedForm(prev => ({...prev, full_groom_price: parseFloat(e.target.value) || 0}))} 
              className="w-full border border-amber-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-amber-800 mb-2">Bath Only Price ($)</label>
            <input 
              type="number" 
              step="0.01" 
              min="0" 
              placeholder="0.00"
              value={Number(breedForm.bath_only_price) || ''} 
              onChange={e => setBreedForm(prev => ({...prev, bath_only_price: parseFloat(e.target.value) || 0}))} 
              className="w-full border border-amber-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button 
              onClick={() => {
                setShowBreedModal(false);
                setBreedForm(emptyBreed as any);
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
          setAddonForm(emptyAddon as any);
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
                setAddonForm(emptyAddon as any);
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
