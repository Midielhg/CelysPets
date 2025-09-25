import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { PricingService, type Breed, type AdditionalService } from '../../services/pricingService';
import { AppointmentService } from '../../services/appointmentService';
import { ClientService } from '../../services/clientService';
import { PromoCodeService } from '../../services/promoCodeService';
import PromoCodeInput from './PromoCodeInput';

// Validation functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  // Check if it's a valid US phone number (10 digits)
  return cleanPhone.length === 10;
};

const formatPhone = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length === 10) {
    return `(${cleanPhone.slice(0, 3)}) ${cleanPhone.slice(3, 6)}-${cleanPhone.slice(6)}`;
  }
  return phone;
};

interface Pet {
  name: string;
  type: 'dog' | 'cat';
  breedId: number | null;
  weight: string;
  specialInstructions: string;
}

interface RegisteredPet {
  id: string;
  name: string;
  breed: string;
  age: number;
  weight: number;
  species: 'dog' | 'cat';
  notes?: string;
}

interface BookingFormData {
  // Customer Information
  customerName: string;
  email: string;
  phone: string;
  address: string;
  
  // Pet Information
  pets: Pet[];
  
  // Service Information
  includeFullService: boolean; // New option to include full service
  additionalServices: string[];
  preferredDate: string;
  preferredTime: string;
  
  // Additional Information
  notes: string;
}

const BookingPage: React.FC = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const location = useLocation();
  const [formData, setFormData] = useState<BookingFormData>({
    customerName: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    pets: [{ name: '', type: 'dog', breedId: null, weight: '', specialInstructions: '' }], // Start with one empty pet form
    includeFullService: false, // Default to false - customer must choose
    additionalServices: [],
    preferredDate: '',
    preferredTime: '',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [addons, setAddons] = useState<AdditionalService[]>([]);
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  
  // Promo code state
  const [promoCodeDiscount, setPromoCodeDiscount] = useState<number>(0);
  const [appliedPromoCode, setAppliedPromoCode] = useState<string>('');

  // Address autocomplete simulation (in production, use Google Places API)
  const handleAddressChange = async (value: string) => {
    setFormData(prev => ({ ...prev, address: value }));
    
    // Clear previous validation errors
    setValidationErrors(prev => ({ ...prev, address: '' }));
    
    if (value.length > 3) {
      // Simulate address suggestions (in production, use Google Places API)
      const suggestions = [
        `${value}, Miami, FL`,
        `${value}, Fort Lauderdale, FL`,
        `${value}, Hollywood, FL`,
        `${value}, Aventura, FL`,
        `${value}, Coral Gables, FL`
      ];
      setAddressSuggestions(suggestions);
      setShowAddressSuggestions(true);
    } else {
      setShowAddressSuggestions(false);
    }
  };

  const selectAddress = (address: string) => {
    setFormData(prev => ({ ...prev, address }));
    setShowAddressSuggestions(false);
    setValidationErrors(prev => ({ ...prev, address: '' }));
  };

  // Validate form fields
  const validateField = (field: string, value: string) => {
    let error = '';
    
    switch (field) {
      case 'email':
        if (!validateEmail(value)) {
          error = 'Please enter a valid email address';
        }
        break;
      case 'phone':
        if (!validatePhone(value)) {
          error = 'Please enter a valid 10-digit phone number';
        }
        break;
      case 'address':
        if (value.length < 10) {
          error = 'Please enter a complete address';
        }
        break;
    }
    
    setValidationErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [breedsData, addonsData] = await Promise.all([
          PricingService.getAllBreeds(),
          PricingService.getAllAdditionalServices(),
        ]);
        
        console.log('Loaded breeds:', breedsData);
        console.log('Loaded addons:', addonsData);
        
        setBreeds(breedsData);
        setAddons(addonsData);

        // Load user's profile and pets if authenticated
        if (user) {
          try {
            // Fetch user profile using Supabase
            const client = await ClientService.getByEmail(user.email);
            
            if (client) {
              // Auto-populate customer information from profile
              setFormData(prev => ({
                ...prev,
                customerName: client.name || user.name || '',
                email: client.email || user.email || '',
                phone: client.phone || '',
                address: client.address || ''
              }));

              // Auto-populate with registered pets if available
              if (client.pets && Array.isArray(client.pets) && client.pets.length > 0) {
                // Use the freshly loaded breeds data for matching
                const defaultPets = (client.pets as any[]).map((pet: any) => {
                  const breedMatch = breedsData.find((b: Breed) => 
                    b.name.toLowerCase() === pet.breed?.toLowerCase() ||
                    b.name.toLowerCase().includes(pet.breed?.toLowerCase() || '') ||
                    (pet.breed?.toLowerCase() || '').includes(b.name.toLowerCase())
                  );
                  return {
                    name: pet.name,
                    type: pet.species,
                    breedId: breedMatch?.id || null,
                    weight: pet.weight?.toString() || '',
                    specialInstructions: pet.notes || ''
                  };
                });
                setFormData(prev => ({ ...prev, pets: defaultPets }));
              }
            }
            
            // If user came from pet selection, pre-populate specific pet
            if (client?.pets && Array.isArray(client.pets) && client.pets.length > 0 && location.state?.selectedPet) {
              const selectedPet = location.state.selectedPet;
              populatePetFromRegistered(selectedPet, 0);
            }
          } catch (error) {
            console.error('Error loading client data:', error);
            // Continue without client data - user can still book
          }
        }
      } catch (e) {
        console.error('Failed to load data', e);
        // Ensure arrays are set even on error to prevent UI crashes
        setBreeds([]);
        setAddons([]);
      }
    };
    loadData();
  }, [user, location.state]);

  const populatePetFromRegistered = (registeredPet: RegisteredPet, index: number) => {
    const breedMatch = breeds.find(b => b.name.toLowerCase() === registeredPet.breed.toLowerCase());
    
    setFormData(prev => ({
      ...prev,
      pets: prev.pets.map((pet, i) => 
        i === index ? {
          name: registeredPet.name,
          type: registeredPet.species,
          breedId: breedMatch?.id || null,
          weight: registeredPet.weight.toString(),
          specialInstructions: registeredPet.notes || ''
        } : pet
      )
    }));
  };

  const timeSlots = [
    'Morning (8:00 AM - 12:00 PM)',
    'Afternoon (12:00 PM - 5:00 PM)',
    'Evening (5:00 PM - 8:00 PM)'
  ];

  const handleAdditionalServiceToggle = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      additionalServices: prev.additionalServices.includes(serviceId)
        ? prev.additionalServices.filter(id => id !== serviceId)
        : [...prev.additionalServices, serviceId]
    }));
  };

  const addPet = () => {
    setFormData(prev => ({
      ...prev,
      pets: [...prev.pets, { name: '', type: 'dog', breedId: null, weight: '', specialInstructions: '' }]
    }));
  };

  const removePet = (index: number) => {
    setFormData(prev => {
      // Don't allow removing the last pet - always keep at least one
      if (prev.pets.length <= 1) return prev;
      
      return {
        ...prev,
        pets: prev.pets.filter((_, i) => i !== index)
      };
    });
  };

  const updatePet = (index: number, field: keyof Pet, value: string | number | null) => {
    setFormData(prev => ({
      ...prev,
      pets: prev.pets.map((pet, i) => 
        i === index ? { ...pet, [field]: value } : pet
      )
    }));
  };

  const getBreedById = (breedId: number | null) => {
    if (!breedId) return null;
    return breeds.find(breed => breed.id === breedId) || null;
  };

  const getBreedPrice = (pet: Pet) => {
    const breed = getBreedById(pet.breedId);
    return breed ? Number(breed.full_groom_price) : 0;
  };

  const calculateTotal = () => {
    // Base grooming price for all pets (only if full service is selected)
    const groomingTotal = formData.includeFullService 
      ? formData.pets.reduce((sum, pet) => sum + getBreedPrice(pet), 0)
      : 0;
    
    // Additional services (apply to all pets, or 1 if no pets)
    const petCount = formData.pets.length > 0 ? formData.pets.length : 1;
    const additionalTotal = formData.additionalServices.reduce((sum, serviceId) => {
      const service = addons.find(addon => addon.code === serviceId);
      return sum + (service ? Number(service.price) * petCount : 0);
    }, 0);

    const subtotal = groomingTotal + additionalTotal;
    return Math.max(0, subtotal - promoCodeDiscount); // Ensure total doesn't go below 0
  };

  const calculateSubtotal = () => {
    // Base grooming price for all pets (only if full service is selected)
    const groomingTotal = formData.includeFullService 
      ? formData.pets.reduce((sum, pet) => sum + getBreedPrice(pet), 0)
      : 0;
    
    // Additional services (apply to all pets, or 1 if no pets)
    const petCount = formData.pets.length > 0 ? formData.pets.length : 1;
    const additionalTotal = formData.additionalServices.reduce((sum, serviceId) => {
      const service = addons.find(addon => addon.code === serviceId);
      return sum + (service ? Number(service.price) * petCount : 0);
    }, 0);

    return groomingTotal + additionalTotal;
  };

  // Promo code handlers
  const handlePromoCodeApplied = (discount: number, code: string) => {
    setPromoCodeDiscount(discount);
    setAppliedPromoCode(code);
    showToast(`Promo code ${code} applied! You saved $${discount.toFixed(2)}`, 'success');
  };

  const handlePromoCodeRemoved = () => {
    setPromoCodeDiscount(0);
    setAppliedPromoCode('');
    showToast('Promo code removed', 'info');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Enhanced validation
      if (!formData.customerName || !formData.email || !formData.phone || !formData.address) {
        throw new Error('Please fill in all required customer information');
      }

      // Validate email format
      if (!validateEmail(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      // Validate phone format
      if (!validatePhone(formData.phone)) {
        throw new Error('Please enter a valid 10-digit phone number');
      }

      // Validate address length
      if (formData.address.length < 10) {
        throw new Error('Please enter a complete service address');
      }

      // Check if at least one service is selected
      if (!formData.includeFullService && formData.additionalServices.length === 0) {
        throw new Error('Please select at least one service (Full Service Grooming or Additional Services)');
      }

      // Always validate basic pet information since we always show it
      if (formData.pets.some(pet => !pet.name.trim())) {
        throw new Error('Please enter a name for all pets');
      }

      // If full service is selected, validate breed information as well
      if (formData.includeFullService && formData.pets.some(pet => !pet.breedId)) {
        throw new Error('Please select a breed for all pets when choosing Full Service Grooming');
      }

      if (!formData.preferredDate || !formData.preferredTime) {
        throw new Error('Please select your preferred date and time');
      }

      // Always prepare pets data - for full service we need breed info, for additional services we just need basic info
      const petsWithBreeds = formData.pets.map(pet => {
        const breed = formData.includeFullService ? getBreedById(pet.breedId) : null;
        return {
          name: pet.name,
          type: pet.type,
          breed: breed?.name || '',
          weight: pet.weight,
          specialInstructions: pet.specialInstructions
        };
      });

      // Prepare services array
      const services = [];
      if (formData.includeFullService) {
        services.push({ 
          id: 'full-groom', 
          breedPrice: formData.pets.reduce((sum, pet) => sum + getBreedPrice(pet), 0) 
        });
      }
      services.push(...formData.additionalServices.map(serviceId => ({ id: serviceId })));

      // First, create or update the client using Supabase
      let clientId: number;
      console.log('🚀 Starting client creation process for booking...');
      try {
        const clientData = {
          name: formData.customerName,
          email: formData.email,
          phone: formatPhone(formData.phone),
          address: formData.address,
          pets: petsWithBreeds
        };
        
        console.log('📝 Client data prepared:', {
          name: clientData.name,
          email: clientData.email,
          hasPhone: !!clientData.phone,
          hasAddress: !!clientData.address,
          petsCount: clientData.pets.length
        });

        const client = await ClientService.createOrUpdateForBooking(clientData);
        clientId = client.id;
        console.log('✅ Client saved successfully with ID:', clientId);
      } catch (error: any) {
        console.error('❌ Error creating/updating client:', {
          message: error.message,
          code: error.code,
          details: error.details,
          stack: error.stack
        });
        throw new Error(`Failed to save client information: ${error.message}`);
      }

      // Get promo code ID if one was applied
      let promoCodeId: number | null = null;
      if (appliedPromoCode) {
        try {
          const promoCode = await PromoCodeService.getByCode(appliedPromoCode);
          promoCodeId = promoCode?.id || null;
        } catch (error) {
          console.warn('Could not find promo code ID:', error);
        }
      }

      // Create the appointment using Supabase
      try {
        await AppointmentService.create({
          client_id: clientId,
          groomer_id: null, // Will be assigned later by admin
          services: services,
          date: formData.preferredDate,
          time: formData.preferredTime,
          status: 'pending',
          notes: formData.notes,
          total_amount: calculateTotal(),
          original_amount: calculateSubtotal(),
          promo_code_id: promoCodeId,
          promo_code_discount: promoCodeDiscount
        });
      } catch (error) {
        console.error('Error creating appointment:', error);
        throw new Error('Failed to book appointment');
      }

      showToast('Appointment booked successfully! We will contact you to confirm.', 'success');
      
      // Reset form
      setFormData({
        customerName: '',
        email: '',
        phone: '',
        address: '',
        pets: [{ name: '', type: 'dog', breedId: null, weight: '', specialInstructions: '' }],
        includeFullService: false,
        additionalServices: [],
        preferredDate: '',
        preferredTime: '',
        notes: ''
      });
      
      // Reset promo code state
      setPromoCodeDiscount(0);
      setAppliedPromoCode('');

    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to book appointment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get minimum date (today) without timezone issues
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const today = getTodayString();

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-amber-900 mb-4">
          Book Your Mobile Grooming Appointment
        </h1>
        <p className="text-lg text-amber-700">
          Select your pet's breed and see the exact pricing instantly
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-gradient-to-br from-cream-50 to-amber-50 rounded-2xl shadow-xl p-8 space-y-8 border border-amber-200/50">
            {/* Customer Information */}
            <div>
              <h2 className="text-2xl font-semibold text-amber-900 mb-6">Customer Information</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-amber-800 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                    className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-amber-800 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, email: e.target.value }));
                      validateField('email', e.target.value);
                    }}
                    onBlur={(e) => validateField('email', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm ${
                      validationErrors.email ? 'border-red-400' : 'border-amber-200'
                    }`}
                  />
                  {validationErrors.email && (
                    <p className="text-red-600 text-sm mt-1">{validationErrors.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-amber-800 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="(786) 222-3785"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, phone: e.target.value }));
                      validateField('phone', e.target.value);
                    }}
                    onBlur={(e) => validateField('phone', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm ${
                      validationErrors.phone ? 'border-red-400' : 'border-amber-200'
                    }`}
                  />
                  {validationErrors.phone && (
                    <p className="text-red-600 text-sm mt-1">{validationErrors.phone}</p>
                  )}
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-amber-800 mb-2">
                    Service Address *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="123 Main St, City, State, ZIP"
                    value={formData.address}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    onBlur={(e) => validateField('address', e.target.value)}
                    onFocus={() => {
                      if (formData.address.length > 3) {
                        setShowAddressSuggestions(true);
                      }
                    }}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm ${
                      validationErrors.address ? 'border-red-400' : 'border-amber-200'
                    }`}
                  />
                  {validationErrors.address && (
                    <p className="text-red-600 text-sm mt-1">{validationErrors.address}</p>
                  )}
                  {showAddressSuggestions && addressSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-amber-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {addressSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => selectAddress(suggestion)}
                          className="w-full text-left px-4 py-2 hover:bg-amber-50 focus:bg-amber-50 focus:outline-none border-b border-amber-100 last:border-b-0"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pet Information - Always show this section */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-amber-900">Pet Information</h2>
                <button
                  type="button"
                  onClick={addPet}
                  className="bg-gradient-to-r from-rose-400 to-rose-500 text-white px-6 py-3 rounded-full hover:from-rose-500 hover:to-rose-600 hover:shadow-lg transform hover:scale-105 transition-all duration-300 font-semibold"
                >
                  + Add Another Pet
                </button>
              </div>

              {/* Show message when pets are pre-populated */}
              {user && formData.pets.length > 0 && formData.pets[0].name && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">✅</div>
                    <div>
                      <h3 className="text-lg font-medium text-green-900">Your pets have been automatically added!</h3>
                      <p className="text-green-700">You can modify their information below or add additional pets using the button above.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* First time booking message for authenticated users */}
              {user && formData.pets.length === 0 && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">💡</div>
                    <div>
                      <h3 className="text-lg font-medium text-blue-900">First time booking?</h3>
                      <p className="text-blue-700">Add your pet information below. You can save it to your profile for faster bookings next time!</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Show pets section even if no pets yet */}
              {formData.pets.length === 0 && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">🐾</div>
                    <div>
                      <h3 className="text-lg font-medium text-amber-900">Add your pet information</h3>
                      <p className="text-amber-700">Start by adding your pet's details. This will help us provide accurate pricing and service recommendations.</p>
                      <button
                        type="button"
                        onClick={addPet}
                        className="mt-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2 rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all duration-200 font-medium"
                      >
                        + Add First Pet
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {formData.pets.map((pet, index) => (
                <div key={index} className="border border-amber-200 rounded-xl p-6 mb-4 bg-white/50 backdrop-blur-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-amber-900">Pet #{index + 1}</h3>
                    {formData.pets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePet(index)}
                        className="text-rose-600 hover:text-rose-700 font-medium transition-colors duration-300"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-amber-800 mb-2">
                        Pet Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={pet.name}
                        onChange={(e) => updatePet(index, 'name', e.target.value)}
                        className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-amber-800 mb-2">
                        Pet Type *
                      </label>
                      <select
                        required
                        value={pet.type}
                        onChange={(e) => {
                          updatePet(index, 'type', e.target.value as 'dog' | 'cat');
                          // Clear breed selection when type changes
                          updatePet(index, 'breedId', null);
                        }}
                        className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm"
                      >
                        <option value="dog">Dog</option>
                        <option value="cat">Cat</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-amber-800 mb-2">
                        Breed {formData.includeFullService ? '*' : '(optional)'}
                      </label>
                      <select
                        required={formData.includeFullService}
                        value={pet.breedId || ''}
                        onChange={(e) => updatePet(index, 'breedId', e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm"
                      >
                        <option value="">Select a breed</option>
                        {breeds
                          .filter(breed => breed.species === pet.type)
                          .map(breed => (
                            <option key={breed.id} value={breed.id}>
                              {breed.name}
                            </option>
                          ))}
                      </select>
                      {formData.includeFullService && (
                        <p className="text-xs text-amber-600 mt-1">Required for Full Service pricing calculation</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-amber-800 mb-2">
                        Weight (approximate)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., 25 lbs"
                        value={pet.weight}
                        onChange={(e) => updatePet(index, 'weight', e.target.value)}
                        className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-amber-800 mb-2">
                        Special Instructions
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Any special needs, behavioral notes, or preferences..."
                        value={pet.specialInstructions}
                        onChange={(e) => updatePet(index, 'specialInstructions', e.target.value)}
                        className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Service Selection - Now comes AFTER pet information */}
            <div>
              <h2 className="text-2xl font-semibold text-amber-900 mb-6">Service Selection</h2>
              <div className="border border-amber-200 rounded-xl p-6 bg-white/50 backdrop-blur-sm">
                <div className="flex items-center space-x-3 mb-4">
                  <input
                    type="checkbox"
                    id="fullService"
                    checked={formData.includeFullService}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, includeFullService: e.target.checked }));
                    }}
                    className="w-5 h-5 text-rose-600 border-2 border-amber-300 rounded focus:ring-rose-400 focus:ring-2"
                  />
                  <label htmlFor="fullService" className="text-lg font-medium text-amber-900 cursor-pointer">
                    Full Service Grooming
                  </label>
                </div>
                <p className="text-amber-700 text-sm mb-4">
                  Includes bath, brush, nail trim, ear cleaning, and professional styling based on breed.
                </p>
                {formData.pets.length === 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-amber-800 text-sm">
                      <span className="font-medium">Note:</span> Please add your pet information above to see exact pricing based on breed and size.
                    </p>
                  </div>
                )}
                {formData.pets.length > 0 && formData.includeFullService && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 text-sm">
                      <span className="font-medium">✓ Ready:</span> Your pets are added! You can see the exact pricing in the summary on the right.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Services */}
            {addons.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold text-amber-900 mb-6">Additional Services</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {addons.map((addon) => (
                    <div key={addon.id} className="border border-amber-200 rounded-xl p-4 bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-all duration-300">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          id={addon.code}
                          checked={formData.additionalServices.includes(addon.code)}
                          onChange={() => handleAdditionalServiceToggle(addon.code)}
                          className="mt-1 h-4 w-4 text-rose-600 focus:ring-rose-500 border-amber-300 rounded"
                        />
                        <div className="flex-1">
                          <label htmlFor={addon.code} className="block text-sm font-medium text-amber-900 cursor-pointer">
                            {addon.name}
                          </label>
                          {addon.description && (
                            <p className="text-sm text-amber-700 mt-1">{addon.description}</p>
                          )}
                          <p className="text-sm font-semibold text-rose-600 mt-2">${addon.price}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scheduling */}
            <div>
              <h2 className="text-2xl font-semibold text-amber-900 mb-6">Preferred Date & Time</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-amber-800 mb-2">
                    Preferred Date *
                  </label>
                  <input
                    type="date"
                    required
                    min={today}
                    value={formData.preferredDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, preferredDate: e.target.value }))}
                    className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-amber-800 mb-2">
                    Preferred Time *
                  </label>
                  <select
                    required
                    value={formData.preferredTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, preferredTime: e.target.value }))}
                    className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm"
                  >
                    <option value="">Select a time</option>
                    {timeSlots.map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-amber-800 mb-2">
                Additional Notes
              </label>
              <textarea
                rows={4}
                placeholder="Any additional information or special requests..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm"
              />
            </div>

            {/* Submit Button */}
            <div className="border-t border-amber-200 pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-rose-500 to-rose-600 text-white py-4 px-6 rounded-2xl text-lg font-semibold hover:from-rose-600 hover:to-rose-700 hover:shadow-xl transform hover:scale-[1.02] disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:transform-none transition-all duration-300"
              >
                {isSubmitting ? 'Booking...' : 'Book Appointment'}
              </button>
              
              <p className="text-sm text-amber-700 text-center mt-4">
                We'll contact you within 24 hours to confirm your appointment and payment details.
              </p>
            </div>
          </form>
        </div>

        {/* Price Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-amber-50 to-rose-50 rounded-2xl shadow-xl p-4 lg:p-6 border border-amber-200/50 sticky top-6">
            <h3 className="text-2xl font-semibold text-amber-900 mb-6">Price Summary</h3>
            
            {/* Promo Code Input - Always visible for better UX */}
            <div className="mb-6 w-full overflow-hidden">
              <PromoCodeInput
                onPromoCodeApplied={handlePromoCodeApplied}
                onPromoCodeRemoved={handlePromoCodeRemoved}
                totalAmount={calculateSubtotal()}
                customerEmail={formData.email}
              />
            </div>
            
            {/* Grooming Services - Only show if full service is selected */}
            {formData.includeFullService && formData.pets.length > 0 && (
              <div className="space-y-4 mb-6">
                <h4 className="text-lg font-medium text-amber-800">Full Service Grooming</h4>
                {formData.pets.map((pet, index) => {
                  const breed = getBreedById(pet.breedId);
                  const price = getBreedPrice(pet);
                  return (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-amber-200/50">
                      <div>
                        <p className="text-sm font-medium text-amber-900">
                          {pet.name || `Pet #${index + 1}`}
                        </p>
                        <p className="text-xs text-amber-700">
                          {breed ? breed.name : 'Breed not selected'}
                        </p>
                      </div>
                      <p className="text-lg font-semibold text-rose-600">
                        ${price.toFixed(2)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Additional Services */}
            {formData.additionalServices.length > 0 && (
              <div className="space-y-4 mb-6">
                <h4 className="text-lg font-medium text-amber-800">Additional Services</h4>
                {formData.additionalServices.map((serviceId) => {
                  const service = addons.find(addon => addon.code === serviceId);
                  if (!service) return null;
                  
                  // Calculate price based on number of pets (or 1 if no pets for additional services only)
                  const petCount = formData.pets.length > 0 ? formData.pets.length : 1;
                  const totalPrice = Number(service.price) * petCount;
                  return (
                    <div key={serviceId} className="flex justify-between items-center py-2 border-b border-amber-200/50">
                      <div>
                        <p className="text-sm font-medium text-amber-900">{service.name}</p>
                        <p className="text-xs text-amber-700">
                          ${Number(service.price).toFixed(2)} × {petCount} pet{petCount > 1 ? 's' : ''}
                        </p>
                      </div>
                      <p className="text-lg font-semibold text-rose-600">
                        ${totalPrice.toFixed(2)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Show message if no services selected */}
            {!formData.includeFullService && formData.additionalServices.length === 0 && (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🐾</div>
                <p className="text-amber-700 text-sm">
                  Select Full Service Grooming or Additional Services to see pricing
                </p>
              </div>
            )}

            {/* Total */}
            {(formData.includeFullService || formData.additionalServices.length > 0) && (
              <div className="border-t border-amber-300 pt-4">
                {/* Subtotal */}
                <div className="flex justify-between items-center mb-2">
                  <p className="text-lg font-medium text-amber-900">Subtotal:</p>
                  <p className="text-lg font-medium text-amber-900">${calculateSubtotal().toFixed(2)}</p>
                </div>
                
                {/* Discount */}
                {promoCodeDiscount > 0 && (
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-green-700">Discount ({appliedPromoCode}):</p>
                    <p className="text-sm text-green-700">-${promoCodeDiscount.toFixed(2)}</p>
                  </div>
                )}
                
                {/* Final Total */}
                <div className="flex justify-between items-center">
                  <p className="text-xl font-bold text-amber-900">Total:</p>
                  <p className="text-2xl font-bold text-rose-600">${calculateTotal().toFixed(2)}</p>
                </div>
                <p className="text-sm text-amber-700 mt-2">
                  Final price may vary based on pet size and condition
                </p>
              </div>
            )}

            {/* Breed Categories Info */}
            <div className="mt-6 p-4 bg-white/50 rounded-xl">
              <h5 className="text-sm font-semibold text-amber-800 mb-3">Our Pricing Categories</h5>
              <div className="space-y-2 text-xs text-amber-700">
                <div className="flex justify-between">
                  <span>Small (0-15 lbs)</span>
                  <span>$75</span>
                </div>
                <div className="flex justify-between">
                  <span>Medium (16-40 lbs)</span>
                  <span>$100</span>
                </div>
                <div className="flex justify-between">
                  <span>Large (41-70 lbs)</span>
                  <span>$125</span>
                </div>
                <div className="flex justify-between">
                  <span>X Large (71-90 lbs)</span>
                  <span>$150</span>
                </div>
                <div className="flex justify-between">
                  <span>XX Large (91+ lbs)</span>
                  <span>$175</span>
                </div>
                <div className="flex justify-between">
                  <span>Cats</span>
                  <span>$85</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
