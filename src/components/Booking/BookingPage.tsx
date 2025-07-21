import React, { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';

interface Pet {
  name: string;
  type: 'dog' | 'cat';
  breed: string;
  weight: string;
  specialInstructions: string;
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
  services: string[];
  preferredDate: string;
  preferredTime: string;
  
  // Additional Information
  notes: string;
}

const BookingPage: React.FC = () => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState<BookingFormData>({
    customerName: '',
    email: '',
    phone: '',
    address: '',
    pets: [{ name: '', type: 'dog', breed: '', weight: '', specialInstructions: '' }],
    services: [],
    preferredDate: '',
    preferredTime: '',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const services = [
    { id: 'full-groom', name: 'Full Service Grooming', price: 65, description: 'Complete wash, cut, nail trim, ear cleaning' },
    { id: 'bath-brush', name: 'Bath & Brush', price: 45, description: 'Refreshing bath and thorough brushing' },
    { id: 'nail-trim', name: 'Nail Trim', price: 25, description: 'Professional nail trimming and paw care' },
    { id: 'teeth-cleaning', name: 'Teeth Cleaning', price: 35, description: 'Dental hygiene and breath freshening' },
    { id: 'flea-treatment', name: 'Flea Treatment', price: 40, description: 'Flea bath and prevention treatment' }
  ];

  const timeSlots = [
    '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'
  ];

  const handleServiceToggle = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter(id => id !== serviceId)
        : [...prev.services, serviceId]
    }));
  };

  const addPet = () => {
    setFormData(prev => ({
      ...prev,
      pets: [...prev.pets, { name: '', type: 'dog', breed: '', weight: '', specialInstructions: '' }]
    }));
  };

  const removePet = (index: number) => {
    setFormData(prev => ({
      ...prev,
      pets: prev.pets.filter((_, i) => i !== index)
    }));
  };

  const updatePet = (index: number, field: keyof Pet, value: string) => {
    setFormData(prev => ({
      ...prev,
      pets: prev.pets.map((pet, i) => 
        i === index ? { ...pet, [field]: value } : pet
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Basic validation
      if (!formData.customerName || !formData.email || !formData.phone || !formData.address) {
        throw new Error('Please fill in all required customer information');
      }

      if (formData.pets.some(pet => !pet.name || !pet.breed)) {
        throw new Error('Please complete all pet information');
      }

      if (formData.services.length === 0) {
        throw new Error('Please select at least one service');
      }

      if (!formData.preferredDate || !formData.preferredTime) {
        throw new Error('Please select your preferred date and time');
      }

      // Submit to backend
      const response = await fetch(`${import.meta.env.VITE_API_URL}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client: {
            name: formData.customerName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            pets: formData.pets
          },
          services: formData.services,
          date: formData.preferredDate,
          time: formData.preferredTime,
          notes: formData.notes
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to book appointment');
      }

      showToast('Appointment booked successfully! We will contact you to confirm.', 'success');
      
      // Reset form
      setFormData({
        customerName: '',
        email: '',
        phone: '',
        address: '',
        pets: [{ name: '', type: 'dog', breed: '', weight: '', specialInstructions: '' }],
        services: [],
        preferredDate: '',
        preferredTime: '',
        notes: ''
      });

    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to book appointment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotal = () => {
    return formData.services.reduce((total, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      return total + (service ? service.price * formData.pets.length : 0);
    }, 0);
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
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-amber-900 mb-4">
          Book Your Mobile Grooming Appointment
        </h1>
        <p className="text-lg text-amber-700">
          Fill out the form below and we'll contact you to confirm your appointment
        </p>
      </div>

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
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-800 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-800 mb-2">
                Service Address *
              </label>
              <input
                type="text"
                required
                placeholder="123 Main St, City, State, ZIP"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm"
              />
            </div>
          </div>
        </div>

        {/* Pet Information */}
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
                    onChange={(e) => updatePet(index, 'type', e.target.value as 'dog' | 'cat')}
                    className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm"
                  >
                    <option value="dog">Dog</option>
                    <option value="cat">Cat</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-amber-800 mb-2">
                    Breed *
                  </label>
                  <input
                    type="text"
                    required
                    value={pet.breed}
                    onChange={(e) => updatePet(index, 'breed', e.target.value)}
                    className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm"
                  />
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

        {/* Services */}
        <div>
          <h2 className="text-2xl font-semibold text-amber-900 mb-6">Select Services</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {services.map((service) => (
              <div key={service.id} className="border border-amber-200 rounded-xl p-4 bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-all duration-300">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id={service.id}
                    checked={formData.services.includes(service.id)}
                    onChange={() => handleServiceToggle(service.id)}
                    className="mt-1 h-4 w-4 text-rose-600 focus:ring-rose-500 border-amber-300 rounded"
                  />
                  <div className="flex-1">
                    <label htmlFor={service.id} className="block text-sm font-medium text-amber-900 cursor-pointer">
                      {service.name}
                    </label>
                    <p className="text-sm text-amber-700 mt-1">{service.description}</p>
                    <p className="text-sm font-semibold text-rose-600 mt-2">${service.price}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

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

        {/* Total and Submit */}
        <div className="border-t border-amber-200 pt-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-lg font-semibold text-amber-900">
                Estimated Total: ${calculateTotal()}
              </p>
              <p className="text-sm text-amber-700">
                Final price may vary based on pet size and condition
              </p>
            </div>
          </div>
          
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
  );
};

export default BookingPage;
