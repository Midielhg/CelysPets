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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/appointments`, {
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

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Book Your Mobile Grooming Appointment
        </h1>
        <p className="text-lg text-gray-600">
          Fill out the form below and we'll contact you to confirm your appointment
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8 space-y-8">
        {/* Customer Information */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Customer Information</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.customerName}
                onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Address *
              </label>
              <input
                type="text"
                required
                placeholder="123 Main St, City, State, ZIP"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Pet Information */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Pet Information</h2>
            <button
              type="button"
              onClick={addPet}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              + Add Another Pet
            </button>
          </div>
          
          {formData.pets.map((pet, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-6 mb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Pet #{index + 1}</h3>
                {formData.pets.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePet(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pet Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={pet.name}
                    onChange={(e) => updatePet(index, 'name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pet Type *
                  </label>
                  <select
                    required
                    value={pet.type}
                    onChange={(e) => updatePet(index, 'type', e.target.value as 'dog' | 'cat')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="dog">Dog</option>
                    <option value="cat">Cat</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Breed *
                  </label>
                  <input
                    type="text"
                    required
                    value={pet.breed}
                    onChange={(e) => updatePet(index, 'breed', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight (approximate)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 25 lbs"
                    value={pet.weight}
                    onChange={(e) => updatePet(index, 'weight', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Instructions
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Any special needs, behavioral notes, or preferences..."
                    value={pet.specialInstructions}
                    onChange={(e) => updatePet(index, 'specialInstructions', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Services */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Select Services</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {services.map((service) => (
              <div key={service.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id={service.id}
                    checked={formData.services.includes(service.id)}
                    onChange={() => handleServiceToggle(service.id)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <label htmlFor={service.id} className="block text-sm font-medium text-gray-900 cursor-pointer">
                      {service.name}
                    </label>
                    <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                    <p className="text-sm font-semibold text-blue-600 mt-2">${service.price}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scheduling */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Preferred Date & Time</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Date *
              </label>
              <input
                type="date"
                required
                min={today}
                value={formData.preferredDate}
                onChange={(e) => setFormData(prev => ({ ...prev, preferredDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Time *
              </label>
              <select
                required
                value={formData.preferredTime}
                onChange={(e) => setFormData(prev => ({ ...prev, preferredTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes
          </label>
          <textarea
            rows={4}
            placeholder="Any additional information or special requests..."
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Total and Submit */}
        <div className="border-t pt-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-lg font-semibold text-gray-900">
                Estimated Total: ${calculateTotal()}
              </p>
              <p className="text-sm text-gray-600">
                Final price may vary based on pet size and condition
              </p>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg text-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Booking...' : 'Book Appointment'}
          </button>
          
          <p className="text-sm text-gray-600 text-center mt-4">
            We'll contact you within 24 hours to confirm your appointment and payment details.
          </p>
        </div>
      </form>
    </div>
  );
};

export default BookingPage;
