import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Filter,
  MapPin,
  Phone,
  User,
  X,
  Eye,
  Car,
  ArrowDown,
  Mail,
  DollarSign,
  Check
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import type { Appointment, Pet } from '../../types';
import PromoCodeInput from '../Booking/PromoCodeInput';
import GoogleMapRoute from '../GoogleMapRoute';
import { AppointmentService } from '../../services/appointmentService';
import { PricingService } from '../../services/pricingService';
import { ClientService } from '../../services/clientService';
import { UserService, type User as UserType } from '../../services/userService';
import GroomerAssignmentModal from './GroomerAssignmentModal';
import CalendarIntegrationSetup from './CalendarIntegrationSetup';

// Type declarations for Google Maps
declare global {
  interface Window {
    google: any;
  }
}

interface IOSAppointmentManagementProps {}

const IOSAppointmentManagement: React.FC<IOSAppointmentManagementProps> = () => {
  const { showToast } = useToast();

  // Helper function to parse services from various formats
  const parseServices = (servicesData: any): string[] => {
    if (!servicesData) return [];
    
    console.log('🔍 Parsing services data:', servicesData, 'Type:', typeof servicesData);
    
    // If it's already an array of strings
    if (Array.isArray(servicesData)) {
      return servicesData.map(service => {
        if (typeof service === 'string') return service;
        if (service && typeof service === 'object') {
          return service.name || service.id || String(service);
        }
        return String(service);
      });
    }
    
    // If it's a string (comma-separated or single service)
    if (typeof servicesData === 'string') {
      return servicesData.split(',').map(s => s.trim()).filter(s => s.length > 0);
    }
    
    // If it's an object with services property
    if (servicesData && typeof servicesData === 'object') {
      if (servicesData.services) {
        return parseServices(servicesData.services);
      }
      if (servicesData.name) {
        return [servicesData.name];
      }
      if (servicesData.id) {
        return [servicesData.id];
      }
    }
    
    console.warn('⚠️ Unable to parse services:', servicesData);
    return ['Unknown Service'];
  };

  // Helper function to transform Supabase appointment data to component format
  const transformAppointmentData = (apt: any): Appointment => ({
    id: apt.id.toString(),
    client: apt.clients || apt.client || { // Handle both joined data and direct client data
      id: apt.client_id?.toString() || apt.clients?.id?.toString() || '',
      name: apt.clients?.name || apt.client?.name || 'Unknown',
      email: apt.clients?.email || apt.client?.email || '',
      phone: apt.clients?.phone || apt.client?.phone || '',
      address: apt.clients?.address || apt.client?.address || '',
      pets: apt.clients?.pets || apt.client?.pets || []
    },
    services: parseServices(apt.services),
    date: apt.date,
    time: apt.time,
    endTime: apt.end_time,
    duration: apt.duration,
    assignedGroomer: apt.user_profiles?.name || '',
    status: apt.status,
    paymentStatus: apt.payment_status,
    notes: apt.notes || '',
    totalAmount: apt.total_amount,
    createdAt: apt.created_at,
    updatedAt: apt.updated_at,
  });
  
  // State management
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | '4day' | 'day' | 'agenda'>('month');
  const [filter, setFilter] = useState<'all' | 'today' | 'pending' | 'confirmed' | 'completed' | 'unpaid' | 'partial' | 'paid' | 'refunded' | 'disputed'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [staffFilter, setStaffFilter] = useState<string>('all'); // 'all' or staff member ID
  const [availableStaff, setAvailableStaff] = useState<UserType[]>([]);
  const [showStaffFilter, setShowStaffFilter] = useState(false);
  const [showCalendarIntegration, setShowCalendarIntegration] = useState(false);

  // Function to refresh appointments (can be called after calendar import)
  const refreshAppointments = () => {
    loadAllAppointments();
  };
  const staffFilterRef = useRef<HTMLDivElement>(null);
  const [showStaffAssignmentPopout, setShowStaffAssignmentPopout] = useState(false);
  const staffAssignmentRef = useRef<HTMLDivElement>(null);
  const [statusPopover, setStatusPopover] = useState<{ appointmentId: string; type: 'status' | 'payment' } | null>(null);
  const [modalStatusPopover, setModalStatusPopover] = useState<{ type: 'status' | 'payment' } | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [showGroomerAssignmentModal, setShowGroomerAssignmentModal] = useState(false);
  const [draggedAppointment, setDraggedAppointment] = useState<Appointment | null>(null);
  const [resizing, setResizing] = useState<{ appointmentId: string; edge: 'top' | 'bottom' } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [justFinishedResizing, setJustFinishedResizing] = useState(false);
  const [travelTimes, setTravelTimes] = useState<{[key: string]: number}>({});
  const [routeOptimization, setRouteOptimization] = useState<{
    available: boolean;
    originalRoute: Appointment[];
    optimizedRoute: Appointment[];
    timeSaved: number;
    distanceSaved: number;
    isOptimal: boolean;
  } | null>(null);
  const [showOptimizationAlert, setShowOptimizationAlert] = useState(false);

  // Booking form state for add/edit functionality
  const [bookingFormData, setBookingFormData] = useState<{
    customerName: string;
    email: string;
    phone: string;
    address: string;
    pets: any[];
    includeFullService: boolean;
    additionalServices: string[];
    preferredDate: string;
    preferredTime: string;
    notes: string;
  }>({
    customerName: '',
    email: '',
    phone: '',
    address: '',
    pets: [{ 
      name: '', 
      type: 'dog', 
      breedId: null, 
      weight: '', 
      specialInstructions: '' 
    }],
    includeFullService: false,
    additionalServices: [],
    preferredDate: '',
    preferredTime: '',
    notes: ''
  });

  // Additional state for form functionality
  const [breeds, setBreeds] = useState<any[]>([]);
  const [addons, setAddons] = useState<any[]>([]);

  // Promo code state
  const [promoCodeDiscount, setPromoCodeDiscount] = useState(0);
  const [appliedPromoCode, setAppliedPromoCode] = useState('');

  // Client search functionality
  const [clientSearch, setClientSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);

  // Payment collection modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeType, setQrCodeType] = useState<'zelle' | 'cashapp' | null>(null);

  // Click outside handler for staff filter popout
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (staffFilterRef.current && !staffFilterRef.current.contains(event.target as Node)) {
        setShowStaffFilter(false);
      }
      if (staffAssignmentRef.current && !staffAssignmentRef.current.contains(event.target as Node)) {
        setShowStaffAssignmentPopout(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Function to select a client and prefill form
  const selectClient = (client: any) => {
    console.log('🚨 FUNCTION CALLED - selectClient triggered!');
    console.log('🎯 PETS PREFILL DEBUG - selectClient called with:', client);
    console.log('🐕 Client pets data:', client.pets);
    console.log('🔍 FULL CLIENT OBJECT:', JSON.stringify(client, null, 2));
    console.log('📋 Available breeds count:', breeds.length);
    
    setSelectedClient(client);
    setClientSearch(client.name);
    setShowSearchResults(false);
    
    // Prefill form with client data
    const mappedPets = client.pets ? client.pets.map((pet: any, index: number) => {
      console.log(`🐾 Processing pet ${index + 1}:`, pet);
      console.log(`🔍 Pet breed value:`, pet.breed, 'Type:', typeof pet.breed);
      console.log(`📋 Available breeds:`, breeds.map(b => ({ id: b.id, name: b.name })));
      
      // Find breed by name in the breeds array
      const breedMatch = breeds.find(breed => 
        breed.name.toLowerCase() === (pet.breed || '').toLowerCase()
      );
      console.log(`🔍 Breed match for "${pet.breed}":`, breedMatch);
      
      // Also try matching by breed ID if it exists
      const breedByIdMatch = pet.breedId ? breeds.find(breed => breed.id === pet.breedId) : null;
      console.log(`🆔 Breed match by ID (${pet.breedId}):`, breedByIdMatch);
      
      const finalBreedId = breedMatch ? breedMatch.id : (breedByIdMatch ? breedByIdMatch.id : null);
      console.log(`✅ Final breed ID selected:`, finalBreedId);
      
      const mappedPet = {
        name: pet.name || '',
        type: pet.species || pet.type || 'dog',
        breedId: finalBreedId,
        weight: pet.weight ? pet.weight.toString() : (pet.age ? '' : ''), // Don't show age as weight
        specialInstructions: pet.notes || pet.specialInstructions || (pet.age ? `Age: ${pet.age} years` : '')
      };
      console.log(`✅ Mapped pet ${index + 1}:`, mappedPet);
      return mappedPet;
    }) : [];

    console.log('🎉 Final mappedPets array:', mappedPets);

    const newFormData = {
      ...bookingFormData,
      customerName: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address || '',
      pets: mappedPets.length > 0 ? mappedPets : [{ 
        name: '', 
        type: 'dog', 
        breedId: null, 
        weight: '', 
        specialInstructions: '' 
      }]
    };
    
    console.log('📝 Setting booking form data with pets:', newFormData.pets);
    setBookingFormData(newFormData);
  };

  // Function to clear client selection
  const clearClientSelection = () => {
    setSelectedClient(null);
    setClientSearch('');
    setSearchResults([]);
    setShowSearchResults(false);
    
    // Clear promo code state
    setAppliedPromoCode('');
    setPromoCodeDiscount(0);
    
    // Clear form data
    setBookingFormData(prev => ({
      ...prev,
      customerName: '',
      email: '',
      phone: '',
      address: '',
      pets: [{ 
        name: '', 
        type: 'dog', 
        breedId: null, 
        weight: '', 
        specialInstructions: '' 
      }]
    }));
  };

  // Pet management functions
  const addPet = () => {
    setBookingFormData(prev => ({
      ...prev,
      pets: [...prev.pets, { name: '', type: 'dog', breedId: null, weight: '', specialInstructions: '' }]
    }));
  };

  const removePet = (index: number) => {
    setBookingFormData(prev => ({
      ...prev,
      pets: prev.pets.filter((_, i) => i !== index)
    }));
  };

  const updatePet = (index: number, field: string, value: string | number | null) => {
    console.log(`🐕 Updating pet ${index} field '${field}' to:`, value);
    if (field === 'breedId') {
      const breedName = breeds.find(b => b.id === value)?.name || 'Unknown';
      console.log(`🐕 Breed ID ${value} corresponds to breed: ${breedName}`);
    }
    
    setBookingFormData(prev => ({
      ...prev,
      pets: prev.pets.map((pet, i) => 
        i === index ? { ...pet, [field]: value } : pet
      )
    }));
  };

  // Function to close modal and reset state
  const closeModal = () => {
    setShowModal(false);
    setEditMode(false);
    setIsAddingNew(false);
    setSelectedAppointment(null);
    clearClientSelection();
    
    // Clear promo code state
    setAppliedPromoCode('');
    setPromoCodeDiscount(0);
    
    // Reset form to default state
    setBookingFormData({
      customerName: '',
      email: '',
      phone: '',
      address: '',
      pets: [{ 
        name: '', 
        type: 'dog', 
        breedId: null, 
        weight: '', 
        specialInstructions: '' 
      }],
      includeFullService: false,
      additionalServices: [],
      preferredDate: '',
      preferredTime: '',
      notes: ''
    });
  };

  const getBreedById = (breedId: number | null) => {
    if (!breedId) return null;
    return breeds.find(breed => breed.id === breedId) || null;
  };

  const getBreedPrice = (pet: any) => {
    const breed = getBreedById(pet.breedId);
    const price = breed ? Number(breed.full_groom_price) : 0;
    return price;
  };

  const getAvailableBreeds = (petType: string) => {
    return breeds.filter(breed => 
      breed.species.toLowerCase() === petType.toLowerCase()
    );
  };

  const calculateTotal = () => {
    // Base grooming price for all pets (only if full service is selected)
    const groomingTotal = bookingFormData.includeFullService 
      ? bookingFormData.pets.reduce((sum, pet) => sum + getBreedPrice(pet), 0)
      : 0;
    
    // Additional services (apply to all pets, or 1 if no pets)
    const petCount = bookingFormData.pets.length > 0 ? bookingFormData.pets.length : 1;
    const additionalTotal = bookingFormData.additionalServices.reduce((sum, serviceId) => {
      const service = addons.find(addon => addon.code === serviceId);
      return sum + (service ? Number(service.price) * petCount : 0);
    }, 0);

    const subtotal = groomingTotal + additionalTotal;
    return Math.max(0, subtotal - promoCodeDiscount);
  };

  const calculateSubtotal = () => {
    const groomingTotal = bookingFormData.includeFullService 
      ? bookingFormData.pets.reduce((sum, pet) => sum + getBreedPrice(pet), 0)
      : 0;
    
    const petCount = bookingFormData.pets.length > 0 ? bookingFormData.pets.length : 1;
    const additionalTotal = bookingFormData.additionalServices.reduce((sum, serviceId) => {
      const service = addons.find(addon => addon.code === serviceId);
      return sum + (service ? Number(service.price) * petCount : 0);
    }, 0);

    return groomingTotal + additionalTotal;
  };

  // Promo code handlers
  const handlePromoCodeApplied = (discount: number, code: string) => {
    setAppliedPromoCode(code);
    setPromoCodeDiscount(discount);
    showToast(`Promo code "${code}" applied! Discount: $${discount.toFixed(2)}`, 'success');
  };

  const handlePromoCodeRemoved = () => {
    setAppliedPromoCode('');
    setPromoCodeDiscount(0);
    showToast('Promo code removed', 'info');
  };

  // Helper functions for time calculations
  const parseTime = (timeStr: string): number => {
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let totalMinutes = hours * 60 + (minutes || 0);
    if (period === 'PM' && hours !== 12) totalMinutes += 12 * 60;
    if (period === 'AM' && hours === 12) totalMinutes = minutes || 0;
    return totalMinutes;
  };

  const formatTimeFromMinutes = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
  };

  const calculateEndTime = (startTime: string, duration: number = 60): string => {
    const startMinutes = parseTime(startTime);
    const endMinutes = startMinutes + duration;
    return formatTimeFromMinutes(endMinutes);
  };

  const calculateDurationFromTimes = (startTime: string, endTime: string): number => {
    const startMinutes = parseTime(startTime);
    const endMinutes = parseTime(endTime);
    return Math.max(15, endMinutes - startMinutes); // Minimum 15 minutes
  };

  // Service duration mapping (in minutes)
  const SERVICE_DURATIONS = {
    // Full Service Grooming (base service)
    'Full Grooming': 90,
    'Full Service Grooming': 90,
    'Full Service': 90,
    'full-groom': 90,
    'full-grooming': 90,
    
    // Basic Services
    'Bath & Brush': 45,
    'Bath Only': 30,
    'Brush Only': 15,
    'Nail Trim': 15,
    'Nail Trimming': 15,
    'Ear Cleaning': 10,
    
    // Premium Add-ons
    'Teeth Cleaning': 20,
    'Dental Care': 20,
    'De-shedding Treatment': 30,
    'Flea Treatment': 25,
    'Medicated Bath': 40,
    'Aromatherapy Bath': 35,
    
    // Specialty Services
    'Anal Gland Expression': 10,
    'Paw Moisturizing': 10,
    'Cologne Application': 5,
    'Bandana/Bow Tie': 5,
    'Special Occasion Styling': 45,
    
    // Size-based adjustments for breeds
    'Extra Large Breed': 30, // Additional time for large dogs
    'Matted Fur Treatment': 45, // Additional time for severely matted fur
    'Aggressive Pet Handling': 20, // Additional time for difficult pets
    
    // Coat-specific treatments
    'Double Coat Brushing': 25,
    'Hand Stripping': 60,
    'Coat Conditioning': 15,
    'Undercoat Removal': 35,
    
    // Health & Wellness
    'Skin Treatment': 20,
    'Hot Spot Treatment': 15,
    'Tick Removal': 10,
    'Eye Cleaning': 5,
    
    // Default for unknown services
    'Unknown Service': 30
  };

  // Function to calculate actual duration based on services
  const getActualDuration = (appointment: Appointment): number => {
    // If both start and end times exist, calculate from times
    if (appointment.time && appointment.endTime) {
      return calculateDurationFromTimes(appointment.time, appointment.endTime);
    }
    
    // If duration is manually set, use that
    if (appointment.duration && appointment.duration > 0) {
      return appointment.duration;
    }
    
    // Calculate duration based on services
    if (appointment.services && appointment.services.length > 0) {
      console.log(`🕐 Calculating duration for appointment ${appointment.id}:`);
      console.log(`   Services: ${appointment.services.map(service => 
        typeof service === 'string' ? service : (service?.name || String(service))
      ).join(', ')}`);
      
      let totalDuration = 0;
      let hasFullService = false;
      
      appointment.services.forEach(service => {
        // Handle both string and object services
        const serviceString = typeof service === 'string' ? service : (service?.name || String(service));
        const duration = SERVICE_DURATIONS[serviceString as keyof typeof SERVICE_DURATIONS] || SERVICE_DURATIONS['Unknown Service'];
        console.log(`   - ${serviceString}: ${duration} minutes`);
        
        // Check if this is a full service (base service)
        if (['Full Grooming', 'Full Service Grooming', 'Full Service', 'full-groom', 'full-grooming'].includes(serviceString)) {
          hasFullService = true;
          totalDuration += duration;
        } else {
          // For additional services, add to the total
          totalDuration += duration;
        }
      });
      
      // If no full service but has other services, ensure minimum reasonable time
      if (!hasFullService && totalDuration < 30) {
        totalDuration = Math.max(totalDuration, 30);
      }
      
      // For multiple pets, add extra time (15 minutes per additional pet after the first)
      const numberOfPets = appointment.client?.pets?.length || 1;
      if (numberOfPets > 1) {
        const extraTime = (numberOfPets - 1) * 15;
        totalDuration += extraTime;
        console.log(`   + Extra time for ${numberOfPets} pets: ${extraTime} minutes`);
      }
      
      console.log(`   Total calculated duration: ${totalDuration} minutes`);
      return totalDuration;
    }
    
    // Default fallback
    console.log(`⚠️ No services found for appointment ${appointment.id}, using default 60 minutes`);
    return 60;
  };

  // Function to calculate estimated duration for booking form
  const calculateEstimatedDuration = (includeFullService: boolean, additionalServices: string[], numberOfPets: number = 1): number => {
    let totalDuration = 0;
    
    if (includeFullService) {
      totalDuration += SERVICE_DURATIONS['Full Service Grooming'];
    }
    
    additionalServices.forEach(service => {
      const duration = SERVICE_DURATIONS[service as keyof typeof SERVICE_DURATIONS] || SERVICE_DURATIONS['Unknown Service'];
      totalDuration += duration;
    });
    
    // Add extra time for multiple pets
    if (numberOfPets > 1) {
      totalDuration += (numberOfPets - 1) * 15;
    }
    
    // Ensure minimum time if no services selected
    if (totalDuration === 0) {
      totalDuration = 60; // Default minimum
    }
    
    return totalDuration;
  };

  const getAppointmentHeight = (duration: number = 60): number => {
    // Match the actual grid height: 48px on mobile, 64px on desktop
    const hourHeight = window.innerWidth >= 768 ? 64 : 48;
    return Math.max(30, (duration / 60) * hourHeight); // Minimum 30px height
  };

  const handleResizeStart = (e: React.MouseEvent, appointmentId: string, edge: 'top' | 'bottom') => {
    e.stopPropagation();
    e.preventDefault();
    setIsDragging(false); // Ensure we're not in drag mode
    setResizing({ appointmentId, edge });
    
    // Disable drag on the parent element while resizing
    const appointmentElement = document.querySelector(`[data-appointment-id="${appointmentId}"]`) as HTMLElement;
    if (appointmentElement) {
      appointmentElement.draggable = false;
      // Also prevent click events during resize
      appointmentElement.style.pointerEvents = 'none';
    }
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!resizing) return;
    
    // Prevent this from interfering with drag operations
    if (isDragging) {
      setResizing(null);
      return;
    }
    
    const appointment = appointments.find(apt => apt.id === resizing.appointmentId);
    if (!appointment) return;

    // Calculate new time based on mouse position
    const container = document.querySelector('.day-view-grid');
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    
    // Each hour height matches the grid: 64px on mobile, 80px on desktop
    const pixelsPerHour = window.innerWidth >= 768 ? 80 : 64;
    const startTimeMinutes = 6 * 60; // 6 AM in minutes from midnight
    
    // Calculate new time in minutes from midnight
    const hoursFromStart = relativeY / pixelsPerHour;
    const totalMinutesFromMidnight = startTimeMinutes + (hoursFromStart * 60);
    
    // Round to nearest 15-minute interval
    const roundedMinutes = Math.round(totalMinutesFromMidnight / 15) * 15;
    const clampedMinutes = Math.max(startTimeMinutes, Math.min(22 * 60, roundedMinutes)); // 6 AM to 10 PM
    
    const newTime = formatTimeFromMinutes(clampedMinutes);

    const currentStartMinutes = parseTime(appointment.time);
    const currentDuration = appointment.duration || 60;
    const currentEndMinutes = currentStartMinutes + currentDuration;

    let updatedAppointment = { ...appointment };

    if (resizing.edge === 'top') {
      // Adjust start time, keep end time
      const endTime = formatTimeFromMinutes(currentEndMinutes);
      const newDuration = Math.max(15, currentEndMinutes - clampedMinutes);
      updatedAppointment = {
        ...appointment,
        time: newTime,
        duration: newDuration,
        endTime
      };
    } else {
      // Adjust end time, keep start time
      const newEndMinutes = Math.max(currentStartMinutes + 15, clampedMinutes);
      const newDuration = newEndMinutes - currentStartMinutes;
      updatedAppointment = {
        ...appointment,
        duration: newDuration,
        endTime: formatTimeFromMinutes(newEndMinutes)
      };
    }

    // Update appointment only if resizing is still active
    if (resizing) {
      setAppointments(prev => prev.map(apt => 
        apt.id === resizing.appointmentId ? updatedAppointment : apt
      ));
    }
  };

  const handleResizeEnd = () => {
    setJustFinishedResizing(true);
    
    // Re-enable drag and click events on all appointment elements with a small delay
    setTimeout(() => {
      const appointmentElements = document.querySelectorAll('[data-appointment-id]') as NodeListOf<HTMLElement>;
      appointmentElements.forEach(element => {
        element.draggable = true;
        element.style.pointerEvents = 'auto';
      });
      setJustFinishedResizing(false);
    }, 100); // Small delay to prevent accidental clicks
    
    setResizing(null);
  };

  // Add event listeners for resize
  useEffect(() => {
    if (resizing && !isDragging) {
      const handleMouseMove = (e: MouseEvent) => handleResizeMove(e);
      const handleMouseUp = () => handleResizeEnd();
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      // Also listen for escape key to cancel resize
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleResizeEnd();
        }
      };
      document.addEventListener('keydown', handleEscape);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [resizing, isDragging]);

  // Keyboard navigation for agenda view
  useEffect(() => {
    if (viewMode === 'agenda') {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Only handle if no input field is focused and no modal is open
        if (e.target instanceof HTMLInputElement || 
            e.target instanceof HTMLTextAreaElement || 
            e.target instanceof HTMLSelectElement ||
            showModal) {
          return;
        }

        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            navigateDate('prev');
            break;
          case 'ArrowRight':
            e.preventDefault();
            navigateDate('next');
            break;
          case 'Home':
            e.preventDefault();
            setSelectedDate(new Date());
            break;
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [viewMode, showModal]);

  // Load appointments from both regular database and imported calendar data
  const loadAllAppointments = async () => {
    try {
      setLoading(true);
      
      // 1. Load regular appointments (sample data for now)
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      const sampleAppointments: Appointment[] = [
        {
          id: 'sample-1',
          date: today.toISOString(),
          time: '6:00 AM',
          endTime: '8:30 AM',
          duration: 150,
          assignedGroomer: 'Sofia Rodriguez',
          status: 'confirmed',
          paymentStatus: 'paid',
          services: ['Matted Fur Treatment', 'Teeth Cleaning'],
          createdAt: today.toISOString(),
          updatedAt: today.toISOString(),
          client: {
            id: 'client-1',
            name: 'Claritza Bosque',
            email: 'claritza@example.com',
            phone: '+1 (786) 734-9303',
            address: '14371 SW 157th St',
            pets: [
              { 
                name: 'Buddy', 
                breed: 'Golden Retriever', 
                type: 'dog', 
                age: 3, 
                weight: '65',
                specialInstructions: 'Very friendly, loves treats' 
              }
            ]
          }
        }
      ];

      // 2. Load imported calendar appointments
      const importedAppointments = await loadImportedCalendarAppointments();
      
      // 3. Combine all appointments
      const allAppointments = [...sampleAppointments, ...importedAppointments];
      
      setAppointments(allAppointments);
      setLoading(false);
      
      console.log(`📅 Loaded ${allAppointments.length} total appointments (${sampleAppointments.length} sample + ${importedAppointments.length} imported)`);
      
    } catch (error) {
      console.error('Error loading appointments:', error);
      setLoading(false);
    }
  };

  // Load imported calendar appointments from localStorage (where CalendarIntegrationSetup stores them)
  const loadImportedCalendarAppointments = async (): Promise<Appointment[]> => {
    try {
      const user = { id: 'current-user' }; // This should come from auth context
      const savedData = localStorage.getItem(`imported_appointments_${user.id}`);
      
      if (!savedData) {
        console.log('📅 No imported appointments found in localStorage');
        return [];
      }
      
      const importedData = JSON.parse(savedData);
      console.log(`📅 Found ${importedData.length} imported appointments in localStorage`);
      
      return importedData.map((apt: any, index: number) => ({
        id: `imported-${index}`,
        date: apt.appointment_date || apt.date,
        time: apt.appointment_time || apt.time,
        endTime: apt.end_time || apt.endTime,
        duration: apt.estimated_duration || apt.duration || 60,
        status: apt.status || 'imported',
        paymentStatus: 'unpaid' as const,
        services: apt.services || ['Imported Appointment'],
        assignedGroomer: apt.assigned_groomer,
        createdAt: apt.created_at || new Date().toISOString(),
        updatedAt: apt.updated_at || new Date().toISOString(),
        client: {
          id: `imported-client-${index}`,
          name: apt.client_name || 'Imported Client',
          email: apt.client_email || '',
          phone: apt.client_phone || '',
          address: apt.client_address || '',
          pets: apt.pets || [{ name: 'Pet', breed: 'Unknown', type: 'dog' as const, age: 0 }]
        },
        isImported: true // Flag to identify imported appointments
      }));
      
    } catch (error) {
      console.error('Error loading imported appointments:', error);
      return [];
    }
  };

  useEffect(() => {
    loadAllAppointments();
  }, []);

  // Close status popover when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setStatusPopover(null);
      setModalStatusPopover(null);
    };

    if (statusPopover || modalStatusPopover) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [statusPopover, modalStatusPopover]);

  // Date navigation helpers
  const today = new Date();
  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  // Generate calendar days for month view
  const generateCalendarDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // Navigation functions
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (viewMode === 'month') {
      newDate.setMonth(selectedDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 7 : -7));
    } else if (viewMode === '4day') {
      newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 4 : -4));
    } else if (viewMode === 'day' || viewMode === 'agenda') {
      newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Get color classes for appointment status
  const getStatusColors = (status: string) => {
    switch (status) {
      case 'confirmed':
        return {
          bg: 'bg-blue-200',
          bgLight: 'bg-blue-50',
          border: 'border-blue-300',
          text: 'text-blue-800',
          textDark: 'text-blue-700'
        };
      case 'pending':
        return {
          bg: 'bg-slate-200',
          bgLight: 'bg-slate-50',
          border: 'border-slate-300',
          text: 'text-slate-800',
          textDark: 'text-slate-700'
        };
      case 'completed':
        return {
          bg: 'bg-green-200',
          bgLight: 'bg-green-50',
          border: 'border-green-300',
          text: 'text-green-800',
          textDark: 'text-green-700'
        };
      default:
        return {
          bg: 'bg-gray-200',
          bgLight: 'bg-gray-50',
          border: 'border-gray-300',
          text: 'text-gray-800',
          textDark: 'text-gray-700'
        };
    }
  };

  const getPaymentStatusColors = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'paid':
        return {
          bg: 'bg-emerald-200',
          bgLight: 'bg-emerald-50',
          border: 'border-emerald-300',
          text: 'text-emerald-800',
          textDark: 'text-emerald-700'
        };
      case 'partial':
        return {
          bg: 'bg-amber-200',
          bgLight: 'bg-amber-50',
          border: 'border-amber-300',
          text: 'text-amber-800',
          textDark: 'text-amber-700'
        };
      case 'unpaid':
        return {
          bg: 'bg-red-200',
          bgLight: 'bg-red-50',
          border: 'border-red-300',
          text: 'text-red-800',
          textDark: 'text-red-700'
        };
      case 'refunded':
        return {
          bg: 'bg-purple-200',
          bgLight: 'bg-purple-50',
          border: 'border-purple-300',
          text: 'text-purple-800',
          textDark: 'text-purple-700'
        };
      case 'disputed':
        return {
          bg: 'bg-orange-200',
          bgLight: 'bg-orange-50',
          border: 'border-orange-300',
          text: 'text-orange-800',
          textDark: 'text-orange-700'
        };
      default:
        return {
          bg: 'bg-gray-200',
          bgLight: 'bg-gray-50',
          border: 'border-gray-300',
          text: 'text-gray-800',
          textDark: 'text-gray-700'
        };
    }
  };

  // Filter appointments based on current filter
  const getFilteredAppointments = () => {
    let filtered = appointments;
    
    if (filter === 'today') {
      const todayStr = today.toISOString().split('T')[0];
      filtered = appointments.filter(apt => {
        const aptDate = apt.date ? apt.date.split('T')[0] : '';
        return aptDate === todayStr;
      });
    } else if (['pending', 'confirmed', 'completed', 'in-progress', 'cancelled'].includes(filter)) {
      // Appointment status filters
      filtered = appointments.filter(apt => apt.status === filter);
    } else if (['unpaid', 'partial', 'paid', 'refunded', 'disputed'].includes(filter)) {
      // Payment status filters
      filtered = appointments.filter(apt => (apt.paymentStatus || 'unpaid') === filter);
    } else if (filter !== 'all') {
      filtered = appointments.filter(apt => apt.status === filter);
    }
    
    // Apply staff filter if selected
    if (staffFilter && staffFilter !== 'all') {
      const selectedStaff = availableStaff.find(staff => staff.id === staffFilter);
      if (selectedStaff) {
        filtered = filtered.filter(apt => apt.assignedGroomer === selectedStaff.name);
      }
    }
    
    return filtered;
  };

  // Get appointments for a specific date (filtered by current filter)
  const getAppointmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    console.log('🔍 getAppointmentsForDate called with:', date);
    console.log('🔍 Target date string:', dateStr);
    
    const filtered = getFilteredAppointments();
    const result = filtered.filter(apt => {
      const aptDate = apt.date ? apt.date.split('T')[0] : '';
      const matches = aptDate === dateStr;
      
      if (matches) {
        console.log(`✅ Found matching appointment: ${apt.client?.name} - ${apt.date} (${aptDate})`);
      }
      
      return matches;
    });
    
    console.log(`📊 getAppointmentsForDate returning ${result.length} appointments for ${dateStr}`);
    return result;
  };

  // Helper function to convert time string to minutes from midnight
  const convertTimeToMinutes = (timeString: string): number => {
    if (!timeString) return 720; // Default to noon if no time
    
    // Parse time formats like "9:00 AM", "2:30 PM", etc.
    const timeMatch = timeString.match(/(\d{1,2}):(\d{0,2})\s*(AM|PM)/i);
    if (!timeMatch) return 720;
    
    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]) || 0;
    const period = timeMatch[3].toUpperCase();
    
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return hours * 60 + minutes;
  };

  // Helper function to convert minutes from midnight to time string
  const convertMinutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) return `12:${mins.toString().padStart(2, '0')} AM`;
    if (hours === 12) return `12:${mins.toString().padStart(2, '0')} PM`;
    if (hours < 12) return `${hours}:${mins.toString().padStart(2, '0')} AM`;
    return `${hours - 12}:${mins.toString().padStart(2, '0')} PM`;
  };

  // Enhanced drag and drop handlers with 15-minute precision
  const handleDragStart = (e: React.DragEvent, appointment: Appointment) => {
    // Prevent drag if we're currently resizing
    if (resizing) {
      e.preventDefault();
      return;
    }
    
    setIsDragging(true);
    setDraggedAppointment(appointment);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', appointment.id);
    
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDrop = async (e: React.DragEvent, targetDate: Date, targetMinutes?: number) => {
    e.preventDefault();
    
    if (!draggedAppointment) return;
    
    // Reset visual feedback
    const draggedElement = document.querySelector(`[data-appointment-id="${draggedAppointment.id}"]`) as HTMLElement;
    if (draggedElement) {
      draggedElement.style.opacity = '1';
    }
    
    let finalMinutes = targetMinutes;
    
    // If no specific minutes provided, calculate from mouse position
    if (finalMinutes === undefined) {
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseY = e.clientY - rect.top;
      
      // Calculate which 15-minute slot based on mouse position
      // Each hour is 64px on mobile, 80px on desktop
      const hourHeight = window.innerWidth >= 768 ? 80 : 64;
      const totalHours = 17; // 6 AM to 10 PM
      const totalHeight = totalHours * hourHeight;
      
      // Calculate relative position (0 to 1)
      const relativePosition = Math.max(0, Math.min(1, mouseY / totalHeight));
      
      // Convert to minutes from 6 AM (360 minutes)
      const startMinutes = 360; // 6 AM
      const endMinutes = 1320; // 10 PM
      const totalMinutesRange = endMinutes - startMinutes;
      
      // Calculate exact minute position
      const exactMinutes = startMinutes + (relativePosition * totalMinutesRange);
      
      // Round to nearest 15-minute interval
      finalMinutes = Math.round(exactMinutes / 15) * 15;
    }
    
    // Create new date and time
    const newDate = new Date(targetDate);
    const newTime = convertMinutesToTime(finalMinutes);
    
    try {
      // Update appointment with new date and time
      const updatedAppointment = {
        ...draggedAppointment,
        date: newDate.toISOString(),
        time: newTime
      };

      // Update local state optimistically
      setAppointments(prev => prev.map(apt => 
        apt.id === draggedAppointment.id ? updatedAppointment : apt
      ));

      // Make API call to update appointment
      await AppointmentService.update(parseInt(draggedAppointment.id), {
        date: newDate.toISOString().split('T')[0],
        time: newTime
      });

      showToast(`Appointment moved to ${newDate.toLocaleDateString()} at ${newTime}`, 'success');
      
    } catch (error) {
      console.error('Error updating appointment:', error);
      showToast('Failed to move appointment', 'error');
      
      // Revert optimistic update on error
      setAppointments(prev => prev.map(apt => 
        apt.id === draggedAppointment.id ? draggedAppointment : apt
      ));
    } finally {
      setDraggedAppointment(null);
    }
  };

  // Appointment management functions
  const openAddModal = () => {
    setSelectedAppointment(null);
    setIsAddingNew(true);
    setEditMode(true);
    setShowModal(true);
  };

  const openViewModal = (appointment: Appointment) => {
    console.log('Opening appointment modal:', appointment);
    console.log('Client data:', appointment.client);
    setSelectedAppointment(appointment);
    setIsAddingNew(false);
    setEditMode(false);
    setShowModal(true);
  };

  const deleteAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to delete this appointment?')) {
      return;
    }

    try {
      await AppointmentService.delete(parseInt(appointmentId));

      setAppointments(prev => prev.filter(apt => apt.id !== appointmentId));
      showToast('Appointment deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting appointment:', error);
      showToast('Failed to delete appointment', 'error');
    }
  };

  // Open groomer assignment modal
  // Handle groomer assignment update
  const handleGroomerAssignmentUpdate = (appointmentId: string, groomerName: string | null) => {
    // Update the appointment in local state
    setAppointments(prev => prev.map(apt => 
      apt.id === appointmentId ? { ...apt, assignedGroomer: groomerName || '' } : apt
    ));

    // Update selectedAppointment if it's the same appointment being changed
    if (selectedAppointment && selectedAppointment.id === appointmentId) {
      setSelectedAppointment(prev => prev ? { ...prev, assignedGroomer: groomerName || '' } : null);
    }
  };

  // Handle direct staff assignment from popout
  const handleDirectStaffAssignment = async (staff: UserType | null) => {
    if (!selectedAppointment) return;

    try {
      const staffName = staff?.name || null;
      console.log(`🔄 Assigning staff ${staffName} to appointment ${selectedAppointment.id}`);
      
      // Use the existing groomer assignment service
      if (staff) {
        await AppointmentService.assignToGroomer(parseInt(selectedAppointment.id), staff.id);
      } else {
        await AppointmentService.unassignGroomer(parseInt(selectedAppointment.id));
      }
      
      // Update local state
      handleGroomerAssignmentUpdate(selectedAppointment.id, staffName);
      
      // Close the popout
      setShowStaffAssignmentPopout(false);
      
      showToast(staffName ? `Assigned ${staffName} to appointment` : 'Unassigned staff from appointment', 'success');
    } catch (error) {
      console.error('Error assigning staff:', error);
      showToast('Failed to assign staff member', 'error');
    }
  };

  // Change appointment status
  const changeAppointmentStatus = async (appointmentId: string, newStatus: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled') => {
    try {
      console.log(`🔄 Changing appointment ${appointmentId} status to: ${newStatus}`);
      
      await AppointmentService.update(parseInt(appointmentId), { status: newStatus });

      // Update the appointment in local state
      setAppointments(prev => prev.map(apt => 
        apt.id === appointmentId ? { ...apt, status: newStatus } : apt
      ));

      // Update selectedAppointment if it's the same appointment being changed
      if (selectedAppointment && selectedAppointment.id === appointmentId) {
        setSelectedAppointment(prev => prev ? { ...prev, status: newStatus } : null);
      }

      // Show success message with status emoji
      const statusEmoji = newStatus === 'confirmed' ? '✅' : 
                         newStatus === 'completed' ? '🎉' : 
                         newStatus === 'in-progress' ? '🔄' :
                         newStatus === 'pending' ? '⏳' : 
                         newStatus === 'cancelled' ? '❌' : '📝';
      
      showToast(`${statusEmoji} Appointment status changed to ${newStatus}`, 'success');
      console.log(`✅ Successfully updated appointment status to: ${newStatus}`);
      
    } catch (error) {
      console.error('Error changing appointment status:', error);
      showToast('Failed to update appointment status', 'error');
    }
  };

  // Change payment status
  const changePaymentStatus = async (appointmentId: string, newPaymentStatus: 'unpaid' | 'partial' | 'paid' | 'refunded' | 'disputed') => {
    try {
      console.log(`💳 Changing appointment ${appointmentId} payment status to: ${newPaymentStatus}`);
      
      // Update payment status in database
      await AppointmentService.update(parseInt(appointmentId), { payment_status: newPaymentStatus });
      console.log('✅ Payment status updated in database successfully');

      // Update the appointment in local state
      setAppointments(prev => prev.map(apt => 
        apt.id === appointmentId ? { ...apt, paymentStatus: newPaymentStatus } : apt
      ));

      // Update selectedAppointment if it's the same appointment being changed
      if (selectedAppointment && selectedAppointment.id === appointmentId) {
        setSelectedAppointment(prev => prev ? { ...prev, paymentStatus: newPaymentStatus } : null);
      }

      // Show success message with payment emoji
      const paymentEmoji = newPaymentStatus === 'paid' ? '💰' : 
                          newPaymentStatus === 'partial' ? '💳' : 
                          newPaymentStatus === 'unpaid' ? '❌' :
                          newPaymentStatus === 'refunded' ? '↩️' : 
                          newPaymentStatus === 'disputed' ? '⚠️' : '💸';
      
      showToast(`${paymentEmoji} Payment status changed to ${newPaymentStatus} (local only)`, 'success');
      console.log(`✅ Successfully updated payment status to: ${newPaymentStatus} (local only)`);
      
    } catch (error) {
      console.error('Error changing payment status:', error);
      showToast('Failed to update payment status', 'error');
    }
  };

  // Collect payment function
  // Collect payment function
  const handleCollectPayment = (paymentMethod: 'zelle' | 'cashapp') => {
    setShowPaymentModal(false);
    setQrCodeType(paymentMethod);
    setShowQRModal(true);
    
    if (paymentMethod === 'zelle') {
      showToast('💰 Showing Zelle QR code for payment collection', 'success');
    } else {
      showToast('💳 Showing CashApp QR code for payment collection', 'success');
    }
    
    // You can add actual payment processing logic here
    console.log(`Payment collection initiated via ${paymentMethod}`);
  };
  // Form submission handler for add/edit appointments
  const handleFormSubmit = async () => {
    // Basic validation
    if (!bookingFormData.customerName.trim()) {
      showToast('Please enter customer name', 'error');
      return;
    }
    
    if (!bookingFormData.email.trim() || !bookingFormData.phone.trim()) {
      showToast('Please enter email and phone number', 'error');
      return;
    }
    
    if (!bookingFormData.preferredDate || !bookingFormData.preferredTime) {
      showToast('Please select date and time', 'error');
      return;
    }

    try {
      // Calculate duration based on selected services and pets
      const selectedServices = bookingFormData.includeFullService 
        ? ['Full Service Grooming', ...bookingFormData.additionalServices]
        : bookingFormData.additionalServices;
      
      const calculatedDuration = calculateEstimatedDuration(
        bookingFormData.includeFullService,
        bookingFormData.additionalServices,
        bookingFormData.pets.length
      );
      
      console.log('📊 Appointment Duration Calculation:');
      console.log('   Services:', selectedServices);
      console.log('   Number of pets:', bookingFormData.pets.length);
      console.log('   Calculated duration:', calculatedDuration, 'minutes');
      
      // Prepare appointment data for API
      const appointmentData = {
        client: {
          name: bookingFormData.customerName,
          email: bookingFormData.email,
          phone: bookingFormData.phone,
          address: bookingFormData.address,
          pets: bookingFormData.pets
        },
        date: bookingFormData.preferredDate,
        time: bookingFormData.preferredTime,
        services: selectedServices,
        notes: bookingFormData.notes,
        groomerId: null // Can be set later if needed
      };

      console.log('🚀 APPOINTMENT DEBUG - Sending appointment data:', appointmentData);

      // Transform pets data from form format (breedId) to database format (breed name)
      const transformPetsForDatabase = (formPets: any[]) => {
        return formPets.map(pet => ({
          name: pet.name,
          type: pet.type,
          breed: pet.breedId ? 
            breeds.find(b => b.id === pet.breedId)?.name || 'Mixed Breed' : 'Mixed Breed',
          weight: pet.weight,
          specialInstructions: pet.specialInstructions
        }));
      };

      const transformedPets = transformPetsForDatabase(bookingFormData.pets);
      console.log('🔄 Transformed pets for database:', transformedPets);

      let appointmentResult: Appointment;

      if (editMode && selectedAppointment) {
        // Update existing appointment
        console.log('🔄 EDIT MODE - Updating appointment...');
        
        // Check if client information has changed
        const petsChanged = (() => {
          const currentPets = selectedAppointment.client?.pets || [];
          const formPets = bookingFormData.pets;
          
          console.log('🔍 Checking if pets changed:');
          console.log('   Current pets:', currentPets);
          console.log('   Form pets:', formPets);
          
          if (currentPets.length !== formPets.length) {
            console.log('   ✅ Pets count changed');
            return true;
          }
          
          const hasChanges = formPets.some((formPet, index) => {
            const currentPet = currentPets[index];
            if (!currentPet) {
              console.log(`   ✅ Missing current pet at index ${index}`);
              return true;
            }
            
            // Convert breedId to breed name for comparison
            const formBreed = formPet.breedId ? 
              breeds.find(b => b.id === formPet.breedId)?.name || '' : '';
            
            const nameChanged = currentPet.name !== formPet.name;
            const typeChanged = currentPet.type !== formPet.type;
            const breedChanged = (currentPet.breed || '') !== formBreed;
            const weightChanged = currentPet.weight !== formPet.weight;
            const instructionsChanged = currentPet.specialInstructions !== formPet.specialInstructions;
            
            if (nameChanged || typeChanged || breedChanged || weightChanged || instructionsChanged) {
              console.log(`   ✅ Pet ${index} changed:`);
              console.log(`      Name: ${currentPet.name} → ${formPet.name} (${nameChanged ? 'CHANGED' : 'same'})`);
              console.log(`      Type: ${currentPet.type} → ${formPet.type} (${typeChanged ? 'CHANGED' : 'same'})`);
              console.log(`      Breed: ${currentPet.breed || 'none'} → ${formBreed} (${breedChanged ? 'CHANGED' : 'same'})`);
              console.log(`      Weight: ${currentPet.weight} → ${formPet.weight} (${weightChanged ? 'CHANGED' : 'same'})`);
              console.log(`      Instructions: ${currentPet.specialInstructions} → ${formPet.specialInstructions} (${instructionsChanged ? 'CHANGED' : 'same'})`);
              return true;
            }
            
            return false;
          });
          
          console.log('   Result: pets changed =', hasChanges);
          return hasChanges;
        })();

        const clientChanged = (
          selectedAppointment.client?.name !== bookingFormData.customerName ||
          selectedAppointment.client?.email !== bookingFormData.email ||
          selectedAppointment.client?.phone !== bookingFormData.phone ||
          selectedAppointment.client?.address !== bookingFormData.address ||
          petsChanged
        );

        let clientId: number = selectedAppointment.client?.id ? parseInt(selectedAppointment.client.id.toString()) : 0;

        if (clientChanged && clientId > 0) {
          console.log('🔄 Client information changed, updating existing client...');
          
          try {
            // Try to update the existing client first
            const updatedClient = await ClientService.updateForBooking(clientId, {
              name: bookingFormData.customerName,
              phone: bookingFormData.phone,
              address: bookingFormData.address,
              pets: transformedPets
            });
            
            console.log('✅ Existing client updated successfully:', updatedClient.id);
          } catch (updateError) {
            console.warn('⚠️ Could not update existing client, creating/finding new client:', updateError);
            
            // Fallback: create or find client by email
            const clientData = await ClientService.createOrUpdateForBooking({
              name: bookingFormData.customerName,
              email: bookingFormData.email,
              phone: bookingFormData.phone,
              address: bookingFormData.address,
              pets: transformedPets
            });
            
            clientId = clientData.id;
            console.log('✅ Client created/found with ID:', clientId);
          }
        } else if (clientChanged && clientId === 0) {
          console.log('🔄 No existing client, creating new client...');
          
          // Create or find client by email
          const clientData = await ClientService.createOrUpdateForBooking({
            name: bookingFormData.customerName,
            email: bookingFormData.email,
            phone: bookingFormData.phone,
            address: bookingFormData.address,
            pets: transformedPets
          });
          
          clientId = clientData.id;
          console.log('✅ Client created/found with ID:', clientId);
        } else {
          console.log('✅ Client information unchanged, keeping existing client ID:', clientId);
          
          // Even if client info seems unchanged, let's update pets just in case
          // This ensures breed changes are always captured
          if (clientId > 0) {
            try {
              console.log('🔄 Updating pets data to ensure breed changes are saved...');
              await ClientService.updateForBooking(clientId, {
                pets: transformedPets
              });
              console.log('✅ Pets data updated successfully');
            } catch (error) {
              console.warn('⚠️ Could not update pets data:', error);
            }
          }
        }

        const updateData = {
          client_id: clientId,
          date: bookingFormData.preferredDate,
          time: bookingFormData.preferredTime,
          services: selectedServices,
          notes: bookingFormData.notes,
          total_amount: calculateTotal(),
          original_amount: calculateSubtotal(),
          // groomerId: can be set later if needed
        };

        console.log('🔄 Updating appointment with data:', updateData);
        await AppointmentService.update(parseInt(selectedAppointment.id), updateData);
        
        // Fetch the updated appointment with full client data
        const updatedApptWithClient = await AppointmentService.getById(parseInt(selectedAppointment.id));
        appointmentResult = transformAppointmentData(updatedApptWithClient);
        
        // Update the appointment in local state
        setAppointments(prev => prev.map(apt => 
          apt.id === selectedAppointment.id ? appointmentResult : apt
        ));
        
        showToast('Appointment updated successfully!', 'success');
      } else {
        // Create new appointment - First create or find the client
        console.log('🔍 Creating client for appointment...');
        
        try {
          console.log('🔄 Step 1: Creating client with data:', {
            name: bookingFormData.customerName,
            email: bookingFormData.email,
            phone: bookingFormData.phone,
            address: bookingFormData.address,
            pets: bookingFormData.pets
          });
          
          // Create client using ClientService
          const clientData = await ClientService.createOrUpdateForBooking({
            name: bookingFormData.customerName,
            email: bookingFormData.email,
            phone: bookingFormData.phone,
            address: bookingFormData.address,
            pets: transformedPets
          });
          
          console.log('✅ Step 1 Complete - Client created/found:', clientData);
          
          const createData = {
            client_id: clientData.id, // Use the actual client ID
            date: bookingFormData.preferredDate,
            time: bookingFormData.preferredTime,
            services: selectedServices,
            notes: bookingFormData.notes || '',
            status: 'pending' as const,
            total_amount: calculateTotal(),
            original_amount: calculateSubtotal(),
            groomer_id: null
          };
          
          console.log('🔄 Step 2: Creating appointment with data:', createData);

          const createdAppt = await AppointmentService.create(createData);
          console.log('✅ Step 2 Complete - Appointment created:', createdAppt);
          
          // Add client data to the appointment before transforming
          const appointmentWithClient = {
            ...createdAppt,
            client: clientData // Include the client data we created
          };
          
          appointmentResult = transformAppointmentData(appointmentWithClient);
          console.log('✅ Step 3 Complete - Appointment transformed:', appointmentResult);
        } catch (clientError) {
          console.error('❌ Error in appointment creation process:', clientError);
          console.error('❌ Client error details:', {
            message: clientError instanceof Error ? clientError.message : String(clientError),
            stack: clientError instanceof Error ? clientError.stack : undefined
          });
          throw new Error(`Failed to create appointment: ${clientError instanceof Error ? clientError.message : String(clientError)}`);
        }
        
        console.log('🎉 APPOINTMENT DEBUG - Created appointment:', appointmentResult);
        
        // Add the appointment to local state
        setAppointments(prev => [...prev, appointmentResult]);
        
        showToast('Appointment created successfully!', 'success');
      }
      
      // Reset form and state
      setBookingFormData({
        customerName: '',
        email: '',
        phone: '',
        address: '',
        pets: [],
        includeFullService: false,
        additionalServices: [],
        preferredDate: '',
        preferredTime: '',
        notes: ''
      });
      
      setSelectedAppointment(null);
      setEditMode(false);
      setIsAddingNew(false);
      setShowModal(false);

    } catch (error) {
      const operation = editMode ? 'updating' : 'creating';
      console.error(`❌ Error ${operation} appointment:`, error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        appointmentData: editMode ? 'Update data' : 'Create data',
        bookingFormData
      });
      
      // Show more specific error message
      const errorMessage = error instanceof Error ? error.message : `Error ${operation} appointment`;
      showToast(errorMessage, 'error');
    }
  };

  // Fetch appointments
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const data = await AppointmentService.getAll();
      
      console.log('Raw appointments from Supabase:', data);
      
      // Transform Supabase data to match component's Appointment interface
      const transformedAppointments = data.map(transformAppointmentData);
      
      // Log services to see what we're working with
      transformedAppointments.forEach((apt: any, index: number) => {
        if (apt.services) {
          console.log(`Appointment ${index} services:`, apt.services);
        }
      });
      
      setAppointments(transformedAppointments.sort((a: Appointment, b: Appointment) => 
        new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime()
      ));
    } catch (error) {
      console.error('Error fetching appointments:', error);
      showToast('Failed to load appointments for the calendar', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch breeds
  const fetchBreeds = async () => {
    try {
      const data = await PricingService.getAllBreeds();
      console.log('Breeds loaded:', data.length, 'breeds'); // Debug log
      setBreeds(data);
    } catch (error) {
      console.error('Error fetching breeds:', error);
    }
  };

  // Fetch additional services
  const fetchAddons = async () => {
    try {
      const data = await PricingService.getAllAdditionalServices();
      console.log('Addons loaded:', data); // Debug log
      setAddons(data);
    } catch (error) {
      console.error('Error fetching additional services:', error);
    }
  };

  const fetchStaff = async () => {
    try {
      const data = await UserService.getAssignableUsers();
      console.log('Staff loaded:', data); // Debug log
      setAvailableStaff(data);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchBreeds();
    fetchAddons();
    fetchStaff();
  }, []);

  // Effect to populate form when editing an appointment
  useEffect(() => {
    if (editMode && selectedAppointment && breeds.length > 0) {
      console.log('🔧 EDIT MODE - Loading appointment services:', selectedAppointment.services);
      console.log('Populating form for edit mode:', selectedAppointment);
      
      // Try to parse pets from the client data
      let appointmentPets: Pet[] = [];
      try {
        // Access pets through the client object
        if (selectedAppointment.client?.pets && Array.isArray(selectedAppointment.client.pets)) {
          appointmentPets = selectedAppointment.client.pets;
        }
      } catch (error) {
        console.error('Error parsing pets data:', error);
        appointmentPets = [];
      }

      // Map pets to form structure
      const formPets = appointmentPets.length > 0 ? appointmentPets.map((pet: Pet) => {
        const breedMatch = breeds.find(breed => 
          breed.name.toLowerCase() === (pet.breed || '').toLowerCase()
        );
        
        return {
          name: pet.name || '',
          type: pet.type || 'dog',
          breedId: breedMatch ? breedMatch.id : null,
          weight: pet.weight ? pet.weight.toString() : '',
          specialInstructions: pet.specialInstructions || ''
        };
      }) : [{
        name: '',
        type: 'dog',
        breedId: null,
        weight: '',
        specialInstructions: ''
      }];

      setBookingFormData({
        customerName: selectedAppointment.client?.name || '',
        email: selectedAppointment.client?.email || '',
        phone: selectedAppointment.client?.phone || '',
        address: selectedAppointment.client?.address || '',
        pets: formPets,
        includeFullService: false, // This property doesn't exist in Appointment type
        additionalServices: [], // This property doesn't exist in Appointment type
        preferredDate: selectedAppointment.date || '',
        preferredTime: selectedAppointment.time || '',
        notes: selectedAppointment.notes || ''
      });
    }
  }, [editMode, selectedAppointment, breeds]);

  // Debounced client search
  useEffect(() => {
    const performSearch = async () => {
      if (clientSearch.length < 2) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      console.log('🔍 Searching for clients in database:', clientSearch);
      setIsLoadingSearch(true);
      try {
        // Search clients using ClientService
        const clients = await ClientService.search(clientSearch);
        console.log('🎯 Response from ClientService:', clients);
        
        console.log('🔍 Found clients with pets data:', clients.map((c: any) => ({
          name: c.name,
          pets: c.pets?.length || 0
        })));

        setSearchResults(clients);
        setShowSearchResults(true);
      } catch (error) {
        console.error('Error searching clients:', error);
        setSearchResults([]);
      } finally {
        setIsLoadingSearch(false);
      }
    };

    const timeoutId = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [clientSearch, appointments]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.client-search-container')) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Populate form when editing an appointment
  useEffect(() => {
    if (editMode && selectedAppointment) {
      // Populate form with existing appointment data
      const pets = selectedAppointment.client.pets || [];
      const processedPets = pets.map(pet => ({
        name: pet.name || '',
        type: pet.type || 'dog',
        breedId: pet.breedId || null,
        weight: pet.weight || '',
        specialInstructions: pet.specialInstructions || ''
      }));

      const fullServiceNames = ['Full Service', 'Full Service Grooming', 'Full Grooming', 'full-groom', 'full-grooming'];
      const hasFullService = selectedAppointment.services.some(service => {
        const serviceString = typeof service === 'string' ? service : (service?.name || '');
        return fullServiceNames.includes(serviceString);
      });
      const additionalServices = selectedAppointment.services
        .filter(service => {
          const serviceString = typeof service === 'string' ? service : (service?.name || '');
          return !fullServiceNames.includes(serviceString);
        })
        .map(service => typeof service === 'string' ? service : (service?.name || service?.code || ''));
      
      console.log('🔧 EDIT MODE - Full service detected:', hasFullService);
      console.log('🔧 EDIT MODE - Additional services:', additionalServices);

      setBookingFormData({
        customerName: selectedAppointment.client.name || '',
        email: selectedAppointment.client.email || '',
        phone: selectedAppointment.client.phone || '',
        address: selectedAppointment.client.address || '',
        pets: processedPets,
        includeFullService: hasFullService,
        additionalServices: additionalServices,
        preferredDate: selectedAppointment.date || '',
        preferredTime: selectedAppointment.time || '',
        notes: selectedAppointment.notes || ''
      });
    } else if (!editMode && !isAddingNew) {
      // Reset form when not editing and not adding new
      setBookingFormData({
        customerName: '',
        email: '',
        phone: '',
        address: '',
        pets: [],
        includeFullService: false,
        additionalServices: [],
        preferredDate: '',
        preferredTime: '',
        notes: ''
      });
    } else if (isAddingNew) {
      // When adding new appointment, start with empty form
      setBookingFormData({
        customerName: '',
        email: '',
        phone: '',
        address: '',
        pets: [],
        includeFullService: false,
        additionalServices: [],
        preferredDate: '',
        preferredTime: '',
        notes: ''
      });
    }
  }, [editMode, selectedAppointment, isAddingNew]);

  // Calculate travel times when appointments change in agenda view
  useEffect(() => {
    if (viewMode === 'agenda') {
      console.log('🔍 ===== DATE FILTERING DEBUG =====');
      console.log('📅 Selected date:', selectedDate);
      console.log('📅 Selected date ISO string:', selectedDate.toISOString());
      console.log('📅 Selected date toDateString:', selectedDate.toDateString());
      console.log('📅 Selected date ISO split:', selectedDate.toISOString().split('T')[0]);
      
      // Use the same filtering logic as getAppointmentsForDate to ensure consistency
      const dayAppointments = getAppointmentsForDate(selectedDate).sort((a, b) => {
        const timeA = convertTimeToMinutes(a.time || '12:00 PM');
        const timeB = convertTimeToMinutes(b.time || '12:00 PM');
        return timeA - timeB;
      });
      
      console.log('📋 Filtered appointments for date:', dayAppointments.length);
      dayAppointments.forEach((apt, index) => {
        console.log(`   ${index + 1}. ${apt.client?.name} - ${apt.date} - ${apt.time}`);
      });
      
      if (dayAppointments.length > 0) {
        calculateAllTravelTimes(dayAppointments);
        // Also check for route optimization opportunities
        checkRouteOptimization(dayAppointments);
      } else {
        // Clear optimization if no appointments
        setRouteOptimization(null);
        setShowOptimizationAlert(false);
      }
    }
  }, [appointments, selectedDate, viewMode]);

  // Helper function to convert appointments to route format for GoogleMapRoute
  const convertAppointmentsToRoute = (appointments: Appointment[]) => {
    const stops = appointments.map((appointment, index) => ({
      appointment: {
        id: appointment.id,
        client: {
          name: appointment.client?.name || 'Unknown Client',
          address: appointment.client?.address || 'No address provided'
        },
        time: appointment.time || 'No time'
      },
      address: appointment.client?.address || 'No address provided',
      coordinates: undefined, // Will be geocoded by GoogleMapRoute
      distanceFromPrevious: index === 0 ? 0 : 2.5, // Estimated 2.5 miles between stops
      travelTimeFromPrevious: index === 0 ? 0 : 15 // Estimated 15 minutes travel time
    }));

    const totalDistance = stops.reduce((sum, stop) => sum + (stop.distanceFromPrevious || 0), 0);
    const totalDuration = stops.reduce((sum, stop) => sum + (stop.travelTimeFromPrevious || 0), 0);

    return {
      stops,
      totalDistance,
      totalDuration,
      estimatedFuelCost: totalDistance * 0.15, // Rough estimate at $0.15 per mile
      fuelDetails: {
        gasPrice: 3.50,
        mpg: 25,
        gallonsUsed: totalDistance / 25
      }
    };
  };

  // Render Agenda View - Route Optimized with Map
  // Route optimization algorithm using nearest neighbor with travel time
  const optimizeRoute = async (appointments: Appointment[]): Promise<{
    optimizedRoute: Appointment[];
    totalDistance: number;
    totalTime: number;
  }> => {
    if (appointments.length <= 1) {
      return {
        optimizedRoute: appointments,
        totalDistance: 0,
        totalTime: 0
      };
    }

    // Start from base location
    let unvisited = [...appointments];
    let optimizedRoute: Appointment[] = [];
    let currentLocation = BASE_LOCATION;
    let totalDistance = 0;
    let totalTime = 0;

    // Find nearest appointment from current location
    while (unvisited.length > 0) {
      let nearestIndex = 0;
      let shortestTime = Infinity;

      // Calculate travel time to each unvisited appointment
      for (let i = 0; i < unvisited.length; i++) {
        const appointment = unvisited[i];
        if (appointment.client?.address) {
          try {
            const travelTime = await calculateTravelTime(currentLocation, appointment.client.address);
            if (travelTime < shortestTime) {
              shortestTime = travelTime;
              nearestIndex = i;
            }
          } catch (error) {
            // Fallback to estimated distance if API fails
            const estimatedTime = 15; // Default 15 minutes
            if (estimatedTime < shortestTime) {
              shortestTime = estimatedTime;
              nearestIndex = i;
            }
          }
        }
      }

      // Add nearest appointment to optimized route
      const nearestAppointment = unvisited[nearestIndex];
      optimizedRoute.push(nearestAppointment);
      unvisited.splice(nearestIndex, 1);
      
      // Update current location and totals
      currentLocation = nearestAppointment.client?.address || currentLocation;
      totalTime += shortestTime;
      totalDistance += shortestTime * 0.5; // Rough estimate: 30 mph average
    }

    return {
      optimizedRoute,
      totalDistance,
      totalTime
    };
  };

  // Check if route optimization can save time
  const checkRouteOptimization = async (appointments: Appointment[]) => {
    if (appointments.length < 2) {
      setRouteOptimization(null);
      setShowOptimizationAlert(false);
      return;
    }

    try {
      // Calculate current route time
      let currentTotalTime = 0;
      let currentLocation = BASE_LOCATION;
      
      for (const appointment of appointments) {
        if (appointment.client?.address) {
          const travelTime = await calculateTravelTime(currentLocation, appointment.client.address);
          currentTotalTime += travelTime;
          currentLocation = appointment.client.address;
        }
      }
      
      // Add time back to base
      if (appointments.length > 0 && appointments[appointments.length - 1].client?.address) {
        currentTotalTime += await calculateTravelTime(appointments[appointments.length - 1].client.address, BASE_LOCATION);
      }

      // Get optimized route
      const optimization = await optimizeRoute(appointments);
      
      // Calculate optimized route time (including return to base)
      let optimizedTotalTime = optimization.totalTime;
      if (optimization.optimizedRoute.length > 0) {
        const lastAppointment = optimization.optimizedRoute[optimization.optimizedRoute.length - 1];
        if (lastAppointment.client?.address) {
          optimizedTotalTime += await calculateTravelTime(lastAppointment.client.address, BASE_LOCATION);
        }
      }

      const timeSaved = currentTotalTime - optimizedTotalTime;
      const distanceSaved = timeSaved * 0.5; // Rough estimate

      // Check if optimization is significant (more than 10 minutes)
      if (timeSaved > 10) {
        // Route can be optimized
        setRouteOptimization({
          available: true,
          originalRoute: appointments,
          optimizedRoute: optimization.optimizedRoute,
          timeSaved,
          distanceSaved,
          isOptimal: false
        });
        setShowOptimizationAlert(true);
      } else {
        // Route is already optimal or close to optimal
        setRouteOptimization({
          available: false,
          originalRoute: appointments,
          optimizedRoute: optimization.optimizedRoute,
          timeSaved: Math.max(0, timeSaved), // Show 0 if negative
          distanceSaved: Math.max(0, distanceSaved),
          isOptimal: true
        });
        setShowOptimizationAlert(true); // Still show alert but with "optimal" message
      }
    } catch (error) {
      console.error('Route optimization error:', error);
      setRouteOptimization(null);
      setShowOptimizationAlert(false);
    }
  };

  // Apply route optimization by updating appointment times based on end times + travel times
  const applyRouteOptimization = async () => {
    if (!routeOptimization) return;

    try {
      console.log('🔄 ===== APPLYING ROUTE OPTIMIZATION =====');
      console.log('📋 Optimizing route for', routeOptimization.optimizedRoute.length, 'appointments');
      
      // Calculate new times for optimized route based on end times + travel times
      const optimizedAppointments = [];
      let currentLocation = BASE_LOCATION;
      let currentTime = 8 * 60; // Start at 8:00 AM in minutes
      
      for (let i = 0; i < routeOptimization.optimizedRoute.length; i++) {
        const appointment = routeOptimization.optimizedRoute[i];
        
        console.log(`\n📍 Processing appointment ${i + 1}: ${appointment.client?.name}`);
        
        // Calculate travel time from current location to this appointment
        let travelTime = 0;
        if (appointment.client?.address) {
          travelTime = await calculateTravelTime(currentLocation, appointment.client.address);
          console.log(`🚗 Travel time from ${currentLocation} to ${appointment.client.address}: ${travelTime} minutes`);
        }
        
        // Add travel time to current time for the start time of this appointment
        const appointmentStartTime = currentTime + travelTime;
        
        // Convert to time string
        const startHours = Math.floor(appointmentStartTime / 60);
        const startMinutes = appointmentStartTime % 60;
        const startPeriod = startHours >= 12 ? 'PM' : 'AM';
        const startDisplayHours = startHours > 12 ? startHours - 12 : startHours === 0 ? 12 : startHours;
        const startTimeString = `${startDisplayHours}:${startMinutes.toString().padStart(2, '0')} ${startPeriod}`;
        
        // Calculate appointment duration and end time
        const duration = getActualDuration(appointment);
        const appointmentEndTime = appointmentStartTime + duration;
        
        // Convert end time to string
        const endHours = Math.floor(appointmentEndTime / 60);
        const endMinutes = appointmentEndTime % 60;
        const endPeriod = endHours >= 12 ? 'PM' : 'AM';
        const endDisplayHours = endHours > 12 ? endHours - 12 : endHours === 0 ? 12 : endHours;
        const endTimeString = `${endDisplayHours}:${endMinutes.toString().padStart(2, '0')} ${endPeriod}`;
        
        console.log(`⏰ Appointment time: ${startTimeString} - ${endTimeString} (${duration} minutes)`);
        
        // Create optimized appointment with calculated times
        const optimizedAppointment = {
          ...appointment,
          time: startTimeString,
          endTime: endTimeString,
          duration: duration
        };
        
        optimizedAppointments.push(optimizedAppointment);
        
        // Update current location and time for next iteration
        currentLocation = appointment.client?.address || currentLocation;
        currentTime = appointmentEndTime; // Next appointment can start after this one ends + travel time
        
        console.log(`📍 Updated current location: ${currentLocation}`);
        console.log(`⏰ Next appointment can start after: ${endTimeString}`);
      }
      
      console.log('\n🎯 ===== FINAL OPTIMIZED SCHEDULE =====');
      optimizedAppointments.forEach((apt, index) => {
        console.log(`${index + 1}. ${apt.client?.name}: ${apt.time} - ${apt.endTime} (${apt.duration} min)`);
      });

      // Update appointments in the system
      console.log('\n💾 ===== UPDATING APPOINTMENTS IN DATABASE =====');
      for (const appointment of optimizedAppointments) {
        try {
          console.log(`📝 Updating ${appointment.client?.name} (${appointment.id})`);
          await AppointmentService.update(parseInt(appointment.id), {
            time: appointment.time,
            // endTime: appointment.endTime, // TODO: Add endTime field to Supabase schema
            // duration: appointment.duration // TODO: Add duration field to Supabase schema
          });

          console.log(`✅ Successfully updated ${appointment.client?.name}`);
        } catch (error) {
          console.error(`❌ Error updating appointment ${appointment.id}:`, error);
        }
      }

      // Refresh appointments and hide optimization alert
      console.log('\n🔄 Refreshing appointments...');
      await fetchAppointments();
      setShowOptimizationAlert(false);
      setRouteOptimization(null);
      
      // Show success message
      const timeSavedMinutes = Math.round(routeOptimization.timeSaved);
      const successMessage = `Route optimized successfully! 🎉\n\n` +
                           `✅ Saved approximately ${timeSavedMinutes} minutes of travel time\n` +
                           `🗓️ Appointments rescheduled with proper spacing\n` +
                           `🚗 Start times adjusted for travel time between locations`;
      
      alert(successMessage);
      console.log('✅ Route optimization complete!');
      
    } catch (error) {
      console.error('❌ Error applying route optimization:', error);
      alert('Failed to apply route optimization. Please try again.');
    }
  };

  // Auto-schedule appointments based on travel times without changing order
  const autoScheduleAppointments = async () => {
    const dayAppointments = getAppointmentsForDate(selectedDate);
    
    if (dayAppointments.length < 2) {
      alert('Need at least 2 appointments to auto-schedule.');
      return;
    }

    // Confirmation dialog
    const confirmMessage = `Auto-Schedule Appointments 🕐\n\n` +
                          `This will automatically adjust start times for ${dayAppointments.length} appointments based on:\n` +
                          `• Service duration for each appointment\n` +
                          `• Travel time between locations\n` +
                          `• Proper spacing to prevent overlap\n\n` +
                          `The appointment order will remain the same.\n\n` +
                          `Continue with auto-scheduling?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      console.log('🔄 ===== AUTO-SCHEDULING APPOINTMENTS =====');
      console.log('📋 Auto-scheduling', dayAppointments.length, 'appointments');
      
      // Sort appointments by current time to maintain original order
      const sortedAppointments = [...dayAppointments].sort((a, b) => {
        const timeA = parseTime(a.time || '8:00 AM');
        const timeB = parseTime(b.time || '8:00 AM');
        return timeA - timeB;
      });
      
      // Calculate new times based on end times + travel times
      const rescheduledAppointments = [];
      let currentLocation = BASE_LOCATION;
      let currentTime = parseTime(sortedAppointments[0].time || '8:00 AM'); // Start with first appointment's current time
      
      for (let i = 0; i < sortedAppointments.length; i++) {
        const appointment = sortedAppointments[i];
        
        console.log(`\n📍 Processing appointment ${i + 1}: ${appointment.client?.name}`);
        
        // For first appointment, keep its original start time
        let appointmentStartTime = currentTime;
        
        // For subsequent appointments, calculate based on previous end time + travel time
        if (i > 0) {
          let travelTime = 0;
          if (appointment.client?.address) {
            travelTime = await calculateTravelTime(currentLocation, appointment.client.address);
            console.log(`🚗 Travel time from ${currentLocation} to ${appointment.client.address}: ${travelTime} minutes`);
          }
          
          // Start time = previous end time + travel time
          appointmentStartTime = currentTime + travelTime;
        }
        
        // Convert to time string
        const startTimeString = formatTimeFromMinutes(appointmentStartTime);
        
        // Calculate appointment duration and end time
        const duration = getActualDuration(appointment);
        const appointmentEndTime = appointmentStartTime + duration;
        const endTimeString = formatTimeFromMinutes(appointmentEndTime);
        
        console.log(`⏰ Appointment time: ${startTimeString} - ${endTimeString} (${duration} minutes)`);
        
        // Create rescheduled appointment with calculated times
        const rescheduledAppointment = {
          ...appointment,
          time: startTimeString,
          endTime: endTimeString,
          duration: duration
        };
        
        rescheduledAppointments.push(rescheduledAppointment);
        
        // Update current location and time for next iteration
        currentLocation = appointment.client?.address || currentLocation;
        currentTime = appointmentEndTime; // Next appointment can start after this one ends + travel time
        
        console.log(`📍 Updated current location: ${currentLocation}`);
        console.log(`⏰ Next appointment can start after: ${endTimeString}`);
      }
      
      console.log('\n🎯 ===== FINAL AUTO-SCHEDULED TIMES =====');
      rescheduledAppointments.forEach((apt, index) => {
        console.log(`${index + 1}. ${apt.client?.name}: ${apt.time} - ${apt.endTime} (${apt.duration} min)`);
      });

      // Update appointments in the system
      console.log('\n💾 ===== UPDATING APPOINTMENTS IN DATABASE =====');
      for (const appointment of rescheduledAppointments) {
        try {
          console.log(`📝 Updating ${appointment.client?.name} (${appointment.id})`);
          await AppointmentService.update(parseInt(appointment.id), {
            time: appointment.time,
            // endTime: appointment.endTime, // TODO: Add endTime field to Supabase schema
            // duration: appointment.duration // TODO: Add duration field to Supabase schema
          });

          console.log(`✅ Successfully updated ${appointment.client?.name}`);
        } catch (error) {
          console.error(`❌ Error updating appointment ${appointment.id}:`, error);
        }
      }

      // Refresh appointments
      console.log('\n🔄 Refreshing appointments...');
      await fetchAppointments();
      
      // Show success message
      const successMessage = `Appointments auto-scheduled successfully! 🎉\n\n` +
                           `✅ ${rescheduledAppointments.length} appointments rescheduled\n` +
                           `🗓️ Times adjusted based on service duration + travel time\n` +
                           `🚗 Proper spacing between appointments maintained`;
      
      alert(successMessage);
      console.log('✅ Auto-scheduling complete!');
      
    } catch (error) {
      console.error('❌ Error auto-scheduling appointments:', error);
      alert('Failed to auto-schedule appointments. Please try again.');
    }
  };

  // Function to wait for Google Maps to load
  const waitForGoogleMaps = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.google && window.google.maps) {
        resolve(true);
        return;
      }
      
      // Check every 100ms for up to 10 seconds
      let attempts = 0;
      const maxAttempts = 100;
      
      const checkInterval = setInterval(() => {
        attempts++;
        
        if (window.google && window.google.maps) {
          clearInterval(checkInterval);
          resolve(true);
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          console.log('❌ Google Maps failed to load after 10 seconds');
          resolve(false);
        }
      }, 100);
    });
  };

  // Function to calculate travel time between two addresses using Google Maps API
  const calculateTravelTime = async (origin: string, destination: string): Promise<number> => {
    return new Promise(async (resolve) => {
      try {
        console.log(`🚗 Calculating travel time from "${origin}" to "${destination}" using Google Maps`);
        
        // Wait for Google Maps to load
        const isGoogleMapsLoaded = await waitForGoogleMaps();
        
        if (!isGoogleMapsLoaded) {
          console.log('❌ Google Maps not loaded, using fallback calculation');
          resolve(calculateFallbackTravelTime(origin, destination));
          return;
        }

        const service = new window.google.maps.DistanceMatrixService();
        
        service.getDistanceMatrix({
          origins: [origin],
          destinations: [destination],
          travelMode: window.google.maps.TravelMode.DRIVING,
          unitSystem: window.google.maps.UnitSystem.IMPERIAL,
          avoidHighways: false,
          avoidTolls: false
        }, (response: any, status: any) => {
          console.log('📍 Google Maps API response status:', status);
          console.log('� Google Maps API response:', response);
          
          if (status === 'OK' && response && response.rows && response.rows.length > 0) {
            const element = response.rows[0].elements[0];
            
            if (element.status === 'OK' && element.duration) {
              const minutes = Math.ceil(element.duration.value / 60);
              console.log(`✅ Calculated travel time: ${minutes} minutes`);
              console.log(`� Distance: ${element.distance?.text || 'unknown'}`);
              resolve(minutes);
            } else {
              console.log('❌ Google Maps element error:', element.status);
              resolve(calculateFallbackTravelTime(origin, destination));
            }
          } else {
            console.log('❌ Google Maps API error:', status);
            resolve(calculateFallbackTravelTime(origin, destination));
          }
        });

      } catch (error) {
        console.log('❌ Google Maps calculation error:', error);
        resolve(calculateFallbackTravelTime(origin, destination));
      }
    });
  };

  // Fallback calculation for when Google Maps is not available
  const calculateFallbackTravelTime = (origin: string, destination: string): number => {
    console.log('📊 Using fallback estimation for travel time');
    
    // Simple estimation based on typical Miami distances
    // This is very rough but better than nothing
    const hashCode = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return Math.abs(hash);
    };
    
    const originHash = hashCode(origin);
    const destHash = hashCode(destination);
    const combinedHash = originHash + destHash;
    
    // Generate a semi-realistic time between 8-35 minutes based on addresses
    const estimatedMinutes = 8 + (combinedHash % 28);
    
    console.log(`⏱️ Fallback estimated time: ${estimatedMinutes} minutes`);
    return estimatedMinutes;
  };

  // Function to calculate travel times for all appointments in a day
  const calculateAllTravelTimes = async (appointments: Appointment[]) => {
    console.log('🔍 ===== STARTING TRAVEL TIME CALCULATIONS =====');
    console.log('📋 Number of appointments:', appointments.length);
    console.log('📅 Selected date:', selectedDate.toDateString());
    
    // Debug each appointment's data structure
    appointments.forEach((apt, index) => {
      console.log(`📍 Appointment ${index + 1} (ID: ${apt.id}):`);
      console.log(`   Client: ${apt.client?.name || 'NO CLIENT'}`);
      console.log(`   Address: ${apt.client?.address || 'NO ADDRESS'}`);
      console.log(`   Time: ${apt.time || 'NO TIME'}`);
      console.log(`   Full appointment data:`, apt);
    });
    
    if (appointments.length === 0) {
      console.log('❌ No appointments to calculate travel times for');
      return;
    }
    
    const newTravelTimes: {[key: string]: number} = {};
    
    try {
      // Calculate travel time from base to first appointment
      if (appointments[0]?.client?.address) {
        console.log('🏠 ===== CALCULATING BASE TO FIRST APPOINTMENT =====');
        console.log(`🏠 From: "${BASE_LOCATION}"`);
        console.log(`📍 To: "${appointments[0].client.address}"`);
        
        const timeToFirst = await calculateTravelTime(BASE_LOCATION, appointments[0].client.address);
        newTravelTimes[`base-to-${appointments[0].id}`] = timeToFirst;
        
        console.log(`✅ Base to first appointment result: ${timeToFirst} minutes`);
        console.log(`🔑 Stored with key: base-to-${appointments[0].id}`);
      } else {
        console.log('❌ First appointment has no address:', appointments[0]);
      }
      
      // Calculate travel times between consecutive appointments
      console.log('🔄 ===== CALCULATING TRAVEL BETWEEN APPOINTMENTS =====');
      for (let i = 0; i < appointments.length - 1; i++) {
        const current = appointments[i];
        const next = appointments[i + 1];
        
        console.log(`🚗 Processing appointment ${i + 1} to ${i + 2}:`);
        console.log(`   Current: ${current.client?.name} (ID: ${current.id})`);
        console.log(`   Next: ${next.client?.name} (ID: ${next.id})`);
        
        if (current?.client?.address && next?.client?.address) {
          console.log(`🗺️ From: "${current.client.address}"`);
          console.log(`🗺️ To: "${next.client.address}"`);
          
          const travelTime = await calculateTravelTime(current.client.address, next.client.address);
          const travelKey = `${current.id}-to-${next.id}`;
          newTravelTimes[travelKey] = travelTime;
          
          console.log(`✅ Travel time result: ${travelTime} minutes`);
          console.log(`🔑 Stored with key: ${travelKey}`);
        } else {
          console.log(`❌ Missing address data:`);
          console.log(`   Current address: ${current?.client?.address || 'MISSING'}`);
          console.log(`   Next address: ${next?.client?.address || 'MISSING'}`);
        }
      }
      
      // Calculate travel time from last appointment back to base
      if (appointments.length > 0 && appointments[appointments.length - 1]?.client?.address) {
        console.log('🏠 ===== CALCULATING LAST APPOINTMENT TO BASE =====');
        const lastAppt = appointments[appointments.length - 1];
        console.log(`📍 From: "${lastAppt.client.address}"`);
        console.log(`🏠 To: "${BASE_LOCATION}"`);
        
        const timeToBase = await calculateTravelTime(lastAppt.client.address, BASE_LOCATION);
        const baseKey = `${lastAppt.id}-to-base`;
        newTravelTimes[baseKey] = timeToBase;
        
        console.log(`✅ Last appointment to base result: ${timeToBase} minutes`);
        console.log(`🔑 Stored with key: ${baseKey}`);
      } else {
        console.log('❌ Last appointment has no address:', appointments[appointments.length - 1]);
      }
      
      console.log('🎯 ===== FINAL TRAVEL TIMES SUMMARY =====');
      console.log('📊 All calculated travel times:', newTravelTimes);
      console.log('🔄 Setting travel times state...');
      setTravelTimes(newTravelTimes);
      console.log('✅ Travel time calculations complete!');
      
    } catch (error) {
      console.error('❌ Error calculating travel times:', error);
      // Set fallback messages instead of fake times
      appointments.forEach((appointment, index) => {
        if (index === 0) {
          newTravelTimes[`base-to-${appointment.id}`] = -1; // -1 indicates calculation failed
        }
        if (index < appointments.length - 1) {
          newTravelTimes[`${appointment.id}-to-${appointments[index + 1].id}`] = -1;
        }
        if (index === appointments.length - 1) {
          newTravelTimes[`${appointment.id}-to-base`] = -1;
        }
      });
      console.log('🔄 Using fallback indicators for failed calculations:', newTravelTimes);
      setTravelTimes(newTravelTimes);
    }
  };

  // Base location
  const BASE_LOCATION = "14511 Jefferson St, Miami FL 33176";

  const renderAgendaView = () => {
    const dayAppointments = getAppointmentsForDate(selectedDate).sort((a, b) => {
      const timeA = convertTimeToMinutes(a.time || '12:00 PM');
      const timeB = convertTimeToMinutes(b.time || '12:00 PM');
      return timeA - timeB;
    });

    // Calculate total travel time and work time
    const totalWorkTime = dayAppointments.reduce((total, appointment) => {
      return total + getActualDuration(appointment);
    }, 0);
    const estimatedTravelTime = Math.max(0, (dayAppointments.length - 1) * 15); // 15 min between each

    return (
      <div className="space-y-4">
        {/* Route Map */}
        {dayAppointments.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-visible">
            <div className="bg-gray-50 px-2 md:px-4 py-2 md:py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm md:text-base font-semibold text-gray-900 flex items-center">
                  🗺️ Route Map
                </h3>
                <div className="flex items-center space-x-1 md:space-x-3">
                  {/* Auto-Schedule Button */}
                  <button
                    onClick={autoScheduleAppointments}
                    className="px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-1"
                    title="Auto-schedule appointments based on travel times"
                  >
                    <span>⏰</span>
                    <span className="hidden sm:inline">Auto-Schedule</span>
                  </button>
                  
                  {/* Route Optimization Buttons */}
                  {routeOptimization && (
                    <>
                      {routeOptimization.isOptimal ? (
                        <button
                          onClick={() => {
                            setShowOptimizationAlert(false);
                            setRouteOptimization(null);
                          }}
                          className="px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-lg hover:bg-green-200 transition-colors flex items-center space-x-1"
                          title="Route is already optimal"
                        >
                          <span>✅</span>
                          <span className="hidden sm:inline">Optimal Route</span>
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => setShowOptimizationAlert(!showOptimizationAlert)}
                            className="px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm font-medium text-amber-700 bg-amber-100 border border-amber-300 rounded-lg hover:bg-amber-200 transition-colors flex items-center space-x-1"
                            title={`View optimized route (saves ~${Math.round(routeOptimization.timeSaved)} min)`}
                          >
                            <span>🚀</span>
                            <span className="hidden sm:inline">Show Optimized</span>
                          </button>
                          <button
                            onClick={applyRouteOptimization}
                            className="px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm font-medium text-white bg-amber-600 border border-amber-600 rounded-lg hover:bg-amber-700 transition-colors flex items-center space-x-1"
                            title={`Apply optimization (saves ~${Math.round(routeOptimization.timeSaved)} min)`}
                          >
                            <span>🎯</span>
                            <span className="hidden sm:inline">Apply Optimization</span>
                          </button>
                        </>
                      )}
                    </>
                  )}
                  
                  <span className="text-xs md:text-sm text-gray-600">
                    Est. {(dayAppointments.length * 2.5).toFixed(1)} miles
                  </span>
                </div>
              </div>
              
              {/* Optimization Info Bar (when showing optimized route) */}
              {showOptimizationAlert && routeOptimization && !routeOptimization.isOptimal && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-amber-600 font-medium text-sm">
                        💡 Optimized route saves ~{Math.round(routeOptimization.timeSaved)} minutes
                        {routeOptimization.distanceSaved > 0 && 
                          ` and ${routeOptimization.distanceSaved.toFixed(1)} miles`
                        }
                      </span>
                    </div>
                    <button
                      onClick={() => setShowOptimizationAlert(false)}
                      className="text-amber-600 hover:text-amber-800 p-1"
                      title="Hide optimization info"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4">
              <div className="w-full h-64 rounded-lg border border-gray-200 overflow-hidden">
                <GoogleMapRoute 
                  route={convertAppointmentsToRoute(dayAppointments)}
                  startLocation={BASE_LOCATION}
                />
              </div>
            </div>
          </div>
        )}

        {/* Route Timeline */}
        {dayAppointments.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments today</h3>
            <p className="text-gray-600">
              No appointments scheduled for {selectedDate.toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Starting Location */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-l-4 border-green-500 shadow-sm">
              <div className="p-2 md:p-4">
                <div className="flex items-center justify-between mb-2 md:mb-3">
                  <div className="flex items-center space-x-2 md:space-x-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-xs md:text-sm">
                      🏠
                    </div>
                    <div>
                      <div className="text-sm md:text-lg font-semibold text-gray-900">
                        Starting Location
                      </div>
                      <div className="text-xs md:text-sm text-gray-600">
                        Base Location
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-2 text-gray-600">
                  <MapPin className="w-3 h-3 md:w-4 md:h-4 mt-0.5 flex-shrink-0" />
                  <span className="text-xs md:text-sm">{BASE_LOCATION}</span>
                </div>
              </div>
            </div>

            {/* Travel Time to First Appointment */}
            {dayAppointments.length > 0 && (
              <div className="flex items-center space-x-4 py-2">
                <div className="flex-1 border-t-2 border-dashed border-gray-300"></div>
                <div className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2">
                  <Car className="w-4 h-4" />
                  <span>
                    {(() => {
                      const travelTime = travelTimes[`base-to-${dayAppointments[0].id}`];
                      if (travelTime === -1) {
                        return '🚗 Cannot calculate route time to first appointment';
                      } else if (travelTime) {
                        return `🚗 ~${travelTime} min to first appointment`;
                      } else {
                        return '🚗 Calculating route time...';
                      }
                    })()}
                  </span>
                  <ArrowDown className="w-4 h-4" />
                </div>
                <div className="flex-1 border-t-2 border-dashed border-gray-300"></div>
              </div>
            )}

            {dayAppointments.map((appointment, index) => {
              const nextAppointment = dayAppointments[index + 1];
              const travelKey = nextAppointment ? `${appointment.id}-to-${nextAppointment.id}` : null;
              const travelTimeToNext = nextAppointment ? travelTimes[travelKey!] : 0;
              const isLast = index === dayAppointments.length - 1;
              
              // Debug travel time lookup
              if (nextAppointment) {
                console.log(`🎯 UI: Looking up travel time for appointment ${index + 1} to ${index + 2}:`);
                console.log(`   Key: ${travelKey}`);
                console.log(`   Value: ${travelTimeToNext}`);
                console.log(`   Available keys in travelTimes:`, Object.keys(travelTimes));
              }
              
              return (
                <div key={appointment.id} className="space-y-3">
                  {/* Appointment Card */}
                  <div 
                    className={`bg-white rounded-xl border-l-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-visible ${
                      getStatusColors(appointment.status).border
                    } ${getStatusColors(appointment.status).bgLight}`}
                    onClick={() => openViewModal(appointment)}
                  >
                    <div className="p-2 md:p-4">
                      {/* Header with route number and time */}
                      <div className="flex items-center justify-between mb-2 md:mb-3">
                        <div className="flex items-center space-x-2 md:space-x-3">
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs md:text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <div className="text-sm md:text-lg font-semibold text-gray-900">
                              {appointment.time || 'No time'} - {appointment.endTime || calculateEndTime(appointment.time || '', getActualDuration(appointment))}
                            </div>
                            <div className="text-xs md:text-sm text-gray-600">
                              {getActualDuration(appointment)} minutes
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex flex-col gap-1">
                          {/* Appointment Status Badge with Click Menu */}
                          <div className="relative group">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setStatusPopover(
                                  statusPopover?.appointmentId === appointment.id && statusPopover?.type === 'status' 
                                    ? null 
                                    : { appointmentId: appointment.id, type: 'status' }
                                );
                              }}
                              className={`px-2 md:px-3 py-0.5 md:py-1 text-xs font-medium font-sans rounded-full transition-all duration-200 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                                getStatusColors(appointment.status).bg
                              } ${getStatusColors(appointment.status).text}`}
                              title="Click to change appointment status"
                            >
                              {appointment.status === 'pending' && '⏳'}
                              {appointment.status === 'confirmed' && '✅'}
                              {appointment.status === 'in-progress' && '🔄'}
                              {appointment.status === 'completed' && '🎉'}
                              {appointment.status === 'cancelled' && '❌'}
                              <span className="ml-1 capitalize">{appointment.status.replace('-', ' ')}</span>
                            </button>
                            
                            {/* Status Popover */}
                            {statusPopover?.appointmentId === appointment.id && statusPopover?.type === 'status' && (
                              <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-2 z-[9999] min-w-[160px]">
                                <div className="grid gap-1">
                                  {(['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'] as const).map((status) => (
                                    <button
                                      key={status}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        changeAppointmentStatus(appointment.id, status);
                                        setStatusPopover(null);
                                      }}
                                      className={`flex items-center space-x-2 px-3 py-2 text-xs font-medium rounded-md transition-all duration-200 ${
                                        appointment.status === status
                                          ? `${getStatusColors(status).bg} ${getStatusColors(status).text}`
                                          : 'hover:bg-gray-100 text-gray-700'
                                      }`}
                                    >
                                      <span>
                                        {status === 'pending' && '⏳'}
                                        {status === 'confirmed' && '✅'}
                                        {status === 'in-progress' && '🔄'}
                                        {status === 'completed' && '🎉'}
                                        {status === 'cancelled' && '❌'}
                                      </span>
                                      <span className="capitalize">{status.replace('-', ' ')}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Payment Status Badge with Click Menu */}
                          <div className="relative group">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setStatusPopover(
                                  statusPopover?.appointmentId === appointment.id && statusPopover?.type === 'payment' 
                                    ? null 
                                    : { appointmentId: appointment.id, type: 'payment' }
                                );
                              }}
                              className={`px-2 md:px-3 py-0.5 md:py-1 text-xs font-medium font-sans rounded-full transition-all duration-200 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                                getPaymentStatusColors(appointment.paymentStatus || 'unpaid').bg
                              } ${getPaymentStatusColors(appointment.paymentStatus || 'unpaid').text}`}
                              title="Click to change payment status"
                            >
                              {(appointment.paymentStatus || 'unpaid') === 'unpaid' && '❌'}
                              {(appointment.paymentStatus || 'unpaid') === 'partial' && '💳'}
                              {(appointment.paymentStatus || 'unpaid') === 'paid' && '💰'}
                              {(appointment.paymentStatus || 'unpaid') === 'refunded' && '↩️'}
                              {(appointment.paymentStatus || 'unpaid') === 'disputed' && '⚠️'}
                              <span className="ml-1 capitalize">{(appointment.paymentStatus || 'unpaid').replace('-', ' ')}</span>
                            </button>
                            
                            {/* Payment Status Popover */}
                            {statusPopover?.appointmentId === appointment.id && statusPopover?.type === 'payment' && (
                              <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-2 z-[9999] min-w-[160px]">
                                <div className="grid gap-1">
                                  {(['unpaid', 'partial', 'paid', 'refunded', 'disputed'] as const).map((paymentStatus) => (
                                    <button
                                      key={paymentStatus}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        changePaymentStatus(appointment.id, paymentStatus);
                                        setStatusPopover(null);
                                      }}
                                      className={`flex items-center space-x-2 px-3 py-2 text-xs font-medium rounded-md transition-all duration-200 ${
                                        (appointment.paymentStatus || 'unpaid') === paymentStatus
                                          ? `${getPaymentStatusColors(paymentStatus).bg} ${getPaymentStatusColors(paymentStatus).text}`
                                          : 'hover:bg-gray-100 text-gray-700'
                                      }`}
                                    >
                                      <span>
                                        {paymentStatus === 'unpaid' && '❌'}
                                        {paymentStatus === 'partial' && '💳'}
                                        {paymentStatus === 'paid' && '💰'}
                                        {paymentStatus === 'refunded' && '↩️'}
                                        {paymentStatus === 'disputed' && '⚠️'}
                                      </span>
                                      <span className="capitalize">{paymentStatus.replace('-', ' ')}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Client Information */}
                      <div className="space-y-1 md:space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm md:text-lg font-semibold text-gray-900 mb-1">
                              {appointment.client?.name || 'No client'}
                            </h4>
                            
                            {appointment.client?.address && (
                              <div className="flex items-start space-x-1 md:space-x-2 text-gray-600 mb-1 md:mb-2">
                                <MapPin className="w-3 h-3 md:w-4 md:h-4 mt-0.5 flex-shrink-0" />
                                <span className="text-xs md:text-sm">{appointment.client.address}</span>
                              </div>
                            )}
                            
                            {appointment.client?.phone && (
                              <div className="flex items-center space-x-1 md:space-x-2 text-gray-600 mb-1 md:mb-2">
                                <Phone className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                                <span className="text-xs md:text-sm">{appointment.client.phone}</span>
                              </div>
                            )}
                          </div>
                          
                          {appointment.assignedGroomer && (
                            <div className="text-right">
                              <div className="text-xs md:text-sm text-gray-600">
                                👤 {appointment.assignedGroomer}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Services - Only show additional services, not default full-groom */}
                        {appointment.services && appointment.services.length > 0 && (() => {
                          // Filter out default/base services, but keep "Full Service Grooming"
                          const additionalServices = appointment.services.filter(service => {
                            // Handle both string and object services
                            const serviceString = typeof service === 'string' ? service : (service?.name || String(service));
                            const serviceLower = serviceString.toLowerCase();
                            return ![
                              'full grooming', 'full groom', 'full-groom', 'full-grooming',
                              'basic grooming', 'basic groom', 'basic-groom', 'basic-grooming',
                              'standard grooming', 'standard groom', 'standard-groom', 'standard-grooming',
                              'grooming', 'groom'
                            ].includes(serviceLower);
                          });
                          
                          return additionalServices.length > 0 ? (
                            <div className="pt-1 md:pt-2 border-t border-gray-100">
                              <div className="flex flex-wrap gap-1 md:gap-2">
                                {additionalServices.map((service, idx) => (
                                  <span 
                                    key={idx}
                                    className="px-2 md:px-3 py-0.5 md:py-1 bg-amber-100 text-amber-800 text-xs md:text-sm rounded-full font-medium"
                                  >
                                    ✂️ {typeof service === 'string' ? service : (service?.name || String(service))}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : null;
                        })()}

                        {/* Pet Information - Commented out as pets property doesn't exist in Appointment type */}
                        {/* {appointment.pets && appointment.pets.length > 0 && (
                          <div className="pt-2">
                            <div className="flex flex-wrap gap-2">
                              {appointment.pets.map((pet, idx) => (
                                <span 
                                  key={idx}
                                  className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full font-medium"
                                >
                                  � {pet.name} ({pet.breed})
                                </span>
                              ))}
                            </div>
                          </div>
                        )} */}
                      </div>
                    </div>
                  </div>

                  {/* Travel Time Divider */}
                  {!isLast && (
                    <div className="flex items-center space-x-2 md:space-x-4 py-1 md:py-2">
                      <div className="flex-1 border-t-2 border-dashed border-gray-300"></div>
                      <div className="bg-indigo-100 text-indigo-800 px-2 md:px-4 py-1 md:py-2 rounded-full text-xs md:text-sm font-medium flex items-center space-x-1 md:space-x-2">
                        <Car className="w-3 h-3 md:w-4 md:h-4" />
                        <span>
                          {(() => {
                            if (travelTimeToNext === -1) {
                              return '🚗 Cannot calculate route time';
                            } else if (travelTimeToNext && travelTimeToNext > 0) {
                              return `🚗 ~${travelTimeToNext} min travel time`;
                            } else {
                              return '🚗 Calculating route time...';
                            }
                          })()}
                        </span>
                        <ArrowDown className="w-3 h-3 md:w-4 md:h-4" />
                      </div>
                      <div className="flex-1 border-t-2 border-dashed border-gray-300"></div>
                    </div>
                  )}
                  
                  {/* Travel Time Back to Base - Show after last appointment */}
                  {isLast && (
                    <div className="flex items-center space-x-2 md:space-x-4 py-1 md:py-2">
                      <div className="flex-1 border-t-2 border-dashed border-gray-300"></div>
                      <div className="bg-green-100 text-green-800 px-2 md:px-4 py-1 md:py-2 rounded-full text-xs md:text-sm font-medium flex items-center space-x-1 md:space-x-2">
                        <Car className="w-3 h-3 md:w-4 md:h-4" />
                        <span>
                          {(() => {
                            const travelTimeToBase = travelTimes[`${appointment.id}-to-base`];
                            if (travelTimeToBase === -1) {
                              return '🚗 Cannot calculate route time back to base';
                            } else if (travelTimeToBase && travelTimeToBase > 0) {
                              return `🚗 ~${travelTimeToBase} min back to base`;
                            } else {
                              return '🚗 Calculating route time...';
                            }
                          })()}
                        </span>
                        <ArrowDown className="w-3 h-3 md:w-4 md:h-4" />
                      </div>
                      <div className="flex-1 border-t-2 border-dashed border-gray-300"></div>
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Return to Base Card */}
            {dayAppointments.length > 0 && (
              <div className="bg-gradient-to-r from-gray-50 to-stone-50 rounded-xl border-l-4 border-gray-500 shadow-sm">
                <div className="p-2 md:p-4">
                  <div className="flex items-center justify-between mb-2 md:mb-3">
                    <div className="flex items-center space-x-2 md:space-x-3">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-600 text-white rounded-full flex items-center justify-center font-bold text-xs md:text-sm">
                        🏠
                      </div>
                      <div>
                        <div className="text-sm md:text-lg font-semibold text-gray-900">
                          Return to Base
                        </div>
                        <div className="text-xs md:text-sm text-gray-600">
                          End of Route
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2 text-gray-600">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{BASE_LOCATION}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Daily Summary Footer */}
        {dayAppointments.length > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-2 md:p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 md:space-y-1">
                <h3 className="text-sm md:text-base font-semibold text-gray-900">🏁 Route Complete</h3>
                <p className="text-xs md:text-sm text-gray-600">
                  Total estimated time: {totalWorkTime + estimatedTravelTime} minutes
                </p>
              </div>
              <div className="text-right space-y-0.5 md:space-y-1">
                <div className="text-xs md:text-sm text-gray-600">
                  📊 Work: {totalWorkTime}min | 🚗 Travel: {estimatedTravelTime}min
                </div>
                <div className="text-xs md:text-sm text-gray-600">
                  📍 Distance: ~{(dayAppointments.length * 2.5).toFixed(1)} miles
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-center text-xs md:text-sm text-gray-500 bg-gray-50 rounded-lg p-2 md:p-3">
          <p>💡 <strong>Route-optimized agenda</strong> showing appointments in chronological order with travel times</p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const calendarDays = generateCalendarDays();

  return (
    <div className={`bg-gradient-to-br from-stone-50 to-neutral-50 md:rounded-lg md:shadow-sm md:border md:border-stone-200 overflow-hidden ${
      viewMode === 'month' ? 'min-h-[calc(100vh-4rem)] md:min-h-0' : ''
    }`}>
      {/* iOS-style Header */}
      <div className="bg-gradient-to-r from-stone-50 to-neutral-50 border-b border-stone-200">
        <div className="px-1 md:px-4 py-3 md:py-6">
          <div className="flex items-center justify-between mb-2 md:mb-4">
            <h1 className="text-base md:text-2xl font-semibold text-stone-800">
              {viewMode === 'month' && selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              {viewMode === 'week' && (() => {
                const currentDate = new Date(selectedDate);
                const startOfWeek = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay()));
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                
                const startMonth = startOfWeek.toLocaleDateString('en-US', { month: 'short' });
                const endMonth = endOfWeek.toLocaleDateString('en-US', { month: 'short' });
                const year = startOfWeek.getFullYear();
                
                if (startMonth === endMonth) {
                  return `${startMonth} ${startOfWeek.getDate()}-${endOfWeek.getDate()}, ${year}`;
                } else {
                  return `${startMonth} ${startOfWeek.getDate()} - ${endMonth} ${endOfWeek.getDate()}, ${year}`;
                }
              })()}
              {viewMode === '4day' && (() => {
                const startDate = new Date(selectedDate);
                const endDate = new Date(selectedDate);
                endDate.setDate(startDate.getDate() + 3);
                
                const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
                const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
                const year = startDate.getFullYear();
                
                if (startMonth === endMonth) {
                  return `${startMonth} ${startDate.getDate()}-${endDate.getDate()}, ${year}`;
                } else {
                  return `${startMonth} ${startDate.getDate()} - ${endMonth} ${endDate.getDate()}, ${year}`;
                }
              })()}
              {viewMode === 'day' && selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
              {viewMode === 'agenda' && selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long',
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </h1>
            <div className="flex items-center space-x-1 md:space-x-2">
              <button
                onClick={goToToday}
                className="px-1.5 md:px-3 py-0.5 md:py-1 text-xs md:text-sm font-medium text-stone-600 bg-white rounded-full border border-stone-300 hover:bg-stone-50 transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-1.5 md:p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-full transition-colors"
              >
                <Filter className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <button
                onClick={() => setShowCalendarIntegration(!showCalendarIntegration)}
                className="p-1.5 md:p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-full transition-colors"
                title="Calendar Integration"
              >
                <Calendar className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>

          {/* View Mode Selector */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-0.5 md:space-x-1 bg-white rounded-lg p-0.5 md:p-1 shadow-sm">
              {(['month', 'week', '4day', 'day', 'agenda'] as const).map((mode) => {
                const labelMap = {
                  'month': 'Month',
                  'week': 'Week', 
                  '4day': '4-Day',
                  'day': 'Day',
                  'agenda': 'Agenda'
                };
                
                return (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-1.5 md:px-3 py-0.5 md:py-1 text-xs md:text-sm font-medium rounded-md transition-colors ${
                      viewMode === mode
                        ? 'bg-stone-600 text-white shadow-sm'
                        : 'text-stone-600 hover:text-stone-800 hover:bg-stone-100'
                    }`}
                  >
                    {labelMap[mode]}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center space-x-1 md:space-x-2">
              <button
                onClick={() => navigateDate('prev')}
                className="p-1.5 md:p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
              >
                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <button
                onClick={() => navigateDate('next')}
                className="p-1.5 md:p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
              >
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="px-2 md:px-4 pb-3 md:pb-4 border-t border-gray-200 bg-white">
            <div className="flex flex-wrap gap-1 md:gap-2 pt-3 md:pt-4">
              {/* General & Appointment Status Filters */}
              {[
                { key: 'all', label: 'All' },
                { key: 'today', label: 'Today' },
                { key: 'pending', label: 'Pending' },
                { key: 'confirmed', label: 'Confirmed' },
                { key: 'completed', label: 'Completed' }
              ].map(({ key, label }) => {
                const getFilterColors = () => {
                  if (filter !== key) return 'bg-stone-100 text-stone-600 hover:bg-stone-200';
                  
                  switch (key) {
                    case 'confirmed':
                      return 'bg-blue-200 text-blue-800 border border-blue-300';
                    case 'pending':
                      return 'bg-slate-200 text-slate-800 border border-slate-300';
                    case 'completed':
                      return 'bg-green-200 text-green-800 border border-green-300';
                    default:
                      return 'bg-stone-200 text-stone-800 border border-stone-300';
                  }
                };
                
                return (
                  <button
                    key={key}
                    onClick={() => setFilter(key as any)}
                    className={`px-1.5 md:px-3 py-0.5 md:py-1 text-xs md:text-sm font-medium rounded-full transition-colors ${getFilterColors()}`}
                  >
                    {label}
                  </button>
                );
              })}
              
              {/* Payment Status Filters */}
              <div className="w-px h-6 bg-gray-300 mx-1 md:mx-2"></div>
              {[
                { key: 'unpaid', label: '❌ Unpaid' },
                { key: 'partial', label: '💳 Partial' },
                { key: 'paid', label: '💰 Paid' },
                { key: 'refunded', label: '↩️ Refunded' },
                { key: 'disputed', label: '⚠️ Disputed' }
              ].map(({ key, label }) => {
                const getPaymentFilterColors = () => {
                  if (filter !== key) return 'bg-stone-100 text-stone-600 hover:bg-stone-200';
                  
                  switch (key) {
                    case 'paid':
                      return 'bg-emerald-200 text-emerald-800 border border-emerald-300';
                    case 'partial':
                      return 'bg-amber-200 text-amber-800 border border-amber-300';
                    case 'unpaid':
                      return 'bg-red-200 text-red-800 border border-red-300';
                    case 'refunded':
                      return 'bg-purple-200 text-purple-800 border border-purple-300';
                    case 'disputed':
                      return 'bg-orange-200 text-orange-800 border border-orange-300';
                    default:
                      return 'bg-stone-200 text-stone-800 border border-stone-300';
                  }
                };
                
                return (
                  <button
                    key={key}
                    onClick={() => setFilter(key as any)}
                    className={`px-2 md:px-3 py-1 text-xs md:text-sm font-medium rounded-full transition-colors ${getPaymentFilterColors()}`}
                  >
                    {label}
                  </button>
                );
              })}

              {/* Staff Filter */}
              <div className="w-px h-6 bg-gray-300 mx-1 md:mx-2"></div>
              <div className="relative" ref={staffFilterRef}>
                <button
                  onClick={() => setShowStaffFilter(!showStaffFilter)}
                  className={`px-2 md:px-3 py-1 text-xs md:text-sm font-medium rounded-full transition-colors border ${
                    staffFilter === 'all' 
                      ? 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50' 
                      : 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600'
                  }`}
                >
                  {staffFilter === 'all' ? (
                    <>👥 All Staff</>
                  ) : (
                    <>
                      {availableStaff.find(s => s.id === staffFilter)?.role === 'admin' ? '👑' : '✂️'} 
                      {availableStaff.find(s => s.id === staffFilter)?.name || 'Staff'}
                    </>
                  )}
                </button>
                
                {showStaffFilter && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-48">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setStaffFilter('all');
                          setShowStaffFilter(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2 ${
                          staffFilter === 'all' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        <span>👥</span>
                        <span>All Staff</span>
                      </button>
                      <div className="border-t border-gray-100"></div>
                      {availableStaff.map((staff) => (
                        <button
                          key={staff.id}
                          onClick={() => {
                            setStaffFilter(staff.id);
                            setShowStaffFilter(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2 ${
                            staffFilter === staff.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                          }`}
                        >
                          <span>{staff.role === 'admin' ? '👑' : '✂️'}</span>
                          <span>{staff.name}</span>
                          <span className="text-xs text-gray-500 ml-auto">
                            {staff.role === 'admin' ? 'Admin' : 'Groomer'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Calendar Content */}
      <div className={`p-0.5 md:p-4 ${viewMode === 'month' ? 'flex-1 flex flex-col' : ''}`}>
        {viewMode === 'month' && (
          <div className="space-y-2 md:space-y-4 flex-1 flex flex-col">
            {/* Month Grid */}
            <div className="grid grid-cols-7 gap-px md:gap-1 flex-1">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="p-0.5 md:p-2 text-center text-xs md:text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {calendarDays.map((day, index) => {
                const dayAppointments = getAppointmentsForDate(day);
                const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
                const isSelected = day.toDateString() === selectedDate.toDateString();
                const isTodayDate = isToday(day);
                
                return (
                  <div
                    key={index}
                    onClick={() => setSelectedDate(day)}
                    className={`relative p-0.5 md:p-2 min-h-[calc((100vh-16rem)/6)] md:min-h-[100px] cursor-pointer md:rounded-lg border-0 md:border transition-colors ${
                      isSelected
                        ? 'bg-stone-100 md:bg-stone-50 md:border-stone-200'
                        : isCurrentMonth
                        ? 'bg-white md:border-stone-100 hover:bg-stone-50'
                        : 'bg-stone-50 md:border-stone-100 text-stone-400'
                    }`}
                    style={{
                      borderRight: '1px solid #e5e7eb'
                    }}
                  >
                    <div className={`text-xs md:text-sm font-medium mb-0.5 md:mb-1 flex justify-center ${
                      isTodayDate && isCurrentMonth
                        ? 'bg-stone-600 text-white rounded-full w-4 h-4 md:w-6 md:h-6 items-center justify-center text-xs mx-auto'
                        : ''
                    }`}>
                      {day.getDate()}
                    </div>
                    
                    {/* Appointment indicators - Mobile Optimized */}
                    {dayAppointments.length > 0 && (
                      <div className="space-y-px md:space-y-1">
                        {dayAppointments.slice(0, 4).map((apt, aptIndex) => (
                          <div
                            key={aptIndex}
                            className={`text-xs px-0.5 md:px-1 py-px md:py-0.5 rounded cursor-pointer hover:opacity-80 transition-opacity border-l-1 md:border-l-2 ${
                              getStatusColors(apt.status).bgLight
                            } ${getStatusColors(apt.status).textDark} ${getStatusColors(apt.status).border}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              openViewModal(apt);
                            }}
                            title={`${apt.time || 'No time'} - ${apt.client?.name || 'No client'} - ${apt.services?.join(', ') || 'No services'} (${apt.status})`}
                          >
                            <div className="flex items-center justify-between leading-tight">
                              <div className="truncate font-medium text-xs flex-1 min-w-0">
                                {apt.client?.name?.split(' ')[0] || 'No client'}
                              </div>
                              {apt.time && (
                                <div className="hidden sm:block text-xs opacity-75 ml-1 flex-shrink-0">
                                  {apt.time?.replace(' ', '') || ''}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {dayAppointments.length > 4 && (
                          <div className="text-xs text-gray-500 text-center font-medium">
                            +{dayAppointments.length - 4}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Week View */}
        {viewMode === 'week' && (
          <div className="space-y-2 md:space-y-4">
            {/* Week Header with Days */}
            <div className="bg-gray-50 rounded-lg p-1 md:p-2 mb-2 md:mb-4">
              <div className="flex">
                {/* Time column header - matches content width */}
                <div className="w-10 md:w-16 p-1 md:p-2 text-xs font-medium text-gray-500 text-center">
                  Time
                </div>
                {/* Day headers */}
                <div className="flex-1 grid grid-cols-7 gap-px md:gap-1">
                  {Array.from({ length: 7 }, (_, i) => {
                    const currentDate = new Date(selectedDate);
                    const startOfWeek = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay()));
                    const dayDate = new Date(startOfWeek);
                    dayDate.setDate(startOfWeek.getDate() + i);
                    const isTodayDate = isToday(dayDate);
                    
                    return (
                      <div key={i} className="text-center py-1 md:py-2">
                        <div className="text-xs text-stone-500 mb-1">
                          {dayDate.toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className={`text-xs md:text-sm font-semibold ${
                          isTodayDate 
                            ? 'bg-stone-600 text-white rounded-full w-5 h-5 md:w-7 md:h-7 flex items-center justify-center mx-auto text-xs' 
                            : 'text-stone-800'
                        }`}>
                          {dayDate.getDate()}
                        </div>
                        <div className="text-xs text-stone-400 mt-1 hidden md:block">
                          {dayDate.toLocaleDateString('en-US', { month: 'short' })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Time Grid */}
            <div className="bg-white md:rounded-lg border-0 md:border border-gray-200 overflow-hidden">
              <div className="relative">
                {/* Time slots */}
                <div className="flex">
                  {/* Time column - Mobile Optimized */}
                  <div className="w-10 md:w-16 border-r border-gray-200">
                    {Array.from({ length: 17 }, (_, hourIndex) => {
                      const hour = hourIndex + 6; // Start from 6 AM
                      const timeLabel = hour === 12 ? '12' : 
                                      hour > 12 ? `${hour - 12}` : 
                                      hour === 0 ? '12' :
                                      `${hour}`;
                      const period = hour >= 12 ? 'PM' : 'AM';
                      
                      return (
                        <div key={hourIndex} className="h-12 md:h-16 flex items-center justify-end border-b border-gray-200 last:border-b-0">
                          <div className="text-xs text-gray-500 mr-1 md:mr-2 text-right">
                            <div className="font-medium text-xs">{timeLabel}</div>
                            <div className="text-xs opacity-75">{period}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Days container */}
                  <div className="flex-1 relative">
                    {/* Single large drop zone covering entire week area */}
                    <div
                      className="absolute inset-0 z-10"
                      onDrop={(e) => {
                        // Calculate which day column was dropped on
                        const rect = e.currentTarget.getBoundingClientRect();
                        const relativeX = e.clientX - rect.left;
                        const dayWidth = rect.width / 7;
                        const dayIndex = Math.min(6, Math.floor(relativeX / dayWidth));
                        
                        // Calculate the target date
                        const currentDate = new Date(selectedDate);
                        const startOfWeek = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay()));
                        const targetDate = new Date(startOfWeek);
                        targetDate.setDate(startOfWeek.getDate() + dayIndex);
                        
                        handleDrop(e, targetDate);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('bg-blue-25');
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove('bg-blue-25');
                      }}
                      onDragEnter={(e) => e.preventDefault()}
                    />
                    
                    {/* Day columns grid */}
                    <div className="grid grid-cols-7 h-full">
                      {Array.from({ length: 7 }, (_, dayIndex) => (
                        <div key={dayIndex} className="border-r border-gray-100 last:border-r-0">
                          {/* Hour lines for each day */}
                          {Array.from({ length: 17 }, (_, hourIndex) => (
                            <div 
                              key={hourIndex} 
                              className="h-12 md:h-16 border-b border-gray-200 last:border-b-0 relative pointer-events-none"
                            >
                              {/* 15-minute markers */}
                              <div className="absolute inset-0">
                                {[15, 30, 45].map(minute => (
                                  <div 
                                    key={minute}
                                    className="absolute left-0 right-0 border-b border-gray-100"
                                    style={{ top: `${(minute / 60) * 100}%` }}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                    
                    {/* Appointments overlay */}
                    <div className="absolute inset-0 pointer-events-none z-20">
                      {Array.from({ length: 7 }, (_, dayIndex) => {
                        const currentDate = new Date(selectedDate);
                        const startOfWeek = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay()));
                        const dayDate = new Date(startOfWeek);
                        dayDate.setDate(startOfWeek.getDate() + dayIndex);
                        
                        return getAppointmentsForDate(dayDate).map((appointment) => {
                          const appointmentMinutes = convertTimeToMinutes(appointment.time || '12:00 PM');
                          const startMinutes = 360; // 6 AM
                          const relativeMinutes = appointmentMinutes - startMinutes;
                          
                          // Match the heights used in day view: 48px mobile, 64px desktop
                          const hourHeight = window.innerWidth >= 768 ? 64 : 48;
                          const topPosition = Math.max(0, (relativeMinutes * hourHeight) / 60);
                          
                          // Skip if appointment is outside visible hours
                          if (appointmentMinutes < startMinutes || appointmentMinutes > 1320) { // 22:00 PM
                            return null;
                          }
                          
                          return (
                            <div
                              key={appointment.id}
                              data-appointment-id={appointment.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, appointment)}
                              onDragEnd={(e) => {
                                if (e.currentTarget instanceof HTMLElement) {
                                  e.currentTarget.style.opacity = '1';
                                }
                              }}
                              onClick={() => openViewModal(appointment)}
                              className={`absolute pointer-events-auto text-xs p-0.5 md:p-1 mx-0.5 rounded cursor-move shadow-sm hover:shadow-md transition-all duration-200 z-30 border-l-2 ${
                                getStatusColors(appointment.status).bgLight
                              } ${getStatusColors(appointment.status).textDark} ${getStatusColors(appointment.status).border}`}
                              style={{
                                top: `${topPosition}px`,
                                left: `${(dayIndex * (100 / 7)) + 0.5}%`,
                                width: `${(100 / 7) - 1}%`,
                                height: `${Math.min(hourHeight - 4, getAppointmentHeight(getActualDuration(appointment)))}px`,
                              }}
                              title={`${appointment.time || 'No time'} - ${appointment.client?.name || 'No client'} (Drag to move)`}
                            >
                              <div className="flex items-center justify-between leading-tight overflow-hidden">
                                <div className="font-medium truncate text-xs flex-1 min-w-0">
                                  {appointment.client?.name?.split(' ')[0] || 'No client'}
                                </div>
                                {appointment.time && (
                                  <div className="hidden sm:block text-xs opacity-75 ml-0.5 flex-shrink-0">
                                    {appointment.time?.replace(' ', '') || ''}
                                  </div>
                                )}
                              </div>
                              {appointment.services && appointment.services.length > 0 && (() => {
                                // Filter out default/base services, but keep "Full Service Grooming"  
                                const additionalServices = appointment.services.filter(service => {
                                  // Handle both string and object services
                                  const serviceString = typeof service === 'string' ? service : (service?.name || String(service));
                                  const serviceLower = serviceString.toLowerCase();
                                  return ![
                                    'full grooming', 'full groom', 'full-groom', 'full-grooming',
                                    'basic grooming', 'basic groom', 'basic-groom', 'basic-grooming',
                                    'standard grooming', 'standard groom', 'standard-groom', 'standard-grooming',
                                    'grooming', 'groom'
                                  ].includes(serviceLower);
                                });
                                
                                return additionalServices.length > 0 ? (
                                  <div className="truncate opacity-90 text-xs leading-tight">
                                    {Array.isArray(additionalServices) 
                                      ? additionalServices.slice(0, 1).join('')
                                      : 'Services'
                                    }
                                    {additionalServices.length > 1 && ` +${additionalServices.length - 1}`}
                                  </div>
                                ) : null;
                              })()}
                            </div>
                          );
                        });
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Week View Instructions */}
            <div className="text-center text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
              <p>💡 <strong>Drag and drop appointments</strong> to reschedule them to different days and times (15-minute precision)</p>
            </div>
          </div>
        )}

        {/* Day View */}
        {viewMode === 'day' && (
          <div className="space-y-2 md:space-y-4">
            {/* Day Header - iOS Style */}
            <div className="bg-gray-50 rounded-lg p-2 md:p-4">
              <div className="text-center">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-1">
                  {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long' 
                  })}
                </h2>
                <div className="text-sm md:text-lg text-gray-600">
                  {selectedDate.toLocaleDateString('en-US', { 
                    month: 'long',
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </div>
                {isToday(selectedDate) && (
                  <span className="inline-block mt-2 text-xs md:text-sm text-stone-600 font-medium bg-stone-100 px-2 md:px-3 py-1 rounded-full">Today</span>
                )}
              </div>
            </div>

            {/* Day Time Grid - iOS Calendar Style */}
            <div className="bg-white md:rounded-lg border-0 md:border border-stone-200 overflow-hidden">
              <div className="relative">
                {/* Time slots */}
                <div className="flex">
                  {/* Time column - Mobile Optimized */}
                  <div className="w-10 md:w-16 border-r border-stone-200">
                    {Array.from({ length: 17 }, (_, hourIndex) => {
                      const hour = hourIndex + 6; // Start from 6 AM
                      const timeLabel = hour === 12 ? '12' : 
                                      hour > 12 ? `${hour - 12}` : 
                                      hour === 0 ? '12' :
                                      `${hour}`;
                      const period = hour >= 12 ? 'PM' : 'AM';
                      
                      return (
                        <div key={hourIndex} className="h-12 md:h-16 flex items-center justify-end border-b border-gray-200 last:border-b-0">
                          <div className="text-xs text-gray-500 mr-1 md:mr-2 text-right">
                            <div className="font-medium text-xs">{timeLabel}</div>
                            <div className="text-xs opacity-75">{period}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Appointment area */}
                  <div className="flex-1 relative day-view-grid">
                    {/* Single large drop zone covering entire appointment area */}
                    <div
                      className="absolute inset-0 z-10"
                      onDrop={(e) => handleDrop(e, selectedDate)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('bg-blue-25');
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove('bg-blue-25');
                      }}
                      onDragEnter={(e) => e.preventDefault()}
                    />
                    
                    {/* Hour lines */}
                    {Array.from({ length: 17 }, (_, hourIndex) => (
                      <div 
                        key={hourIndex} 
                        className="h-12 md:h-16 border-b border-gray-200 last:border-b-0 relative pointer-events-none"
                      >
                        {/* 15-minute markers */}
                        <div className="absolute inset-0">
                          {[15, 30, 45].map(minute => (
                            <div 
                              key={minute}
                              className="absolute left-0 right-0 border-b border-gray-100"
                              style={{ top: `${(minute / 60) * 100}%` }}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                    
                    {/* Appointments overlay */}
                    <div className="absolute inset-0 pointer-events-none z-20">
                      {getAppointmentsForDate(selectedDate).map((appointment) => {
                        const appointmentMinutes = convertTimeToMinutes(appointment.time || '12:00 PM');
                        const startMinutes = 360; // 6 AM
                        const relativeMinutes = appointmentMinutes - startMinutes;
                        
                        // Calculate position (each hour is 48px on mobile, 64px on desktop)
                        const hourHeight = window.innerWidth >= 768 ? 64 : 48;
                        const topPosition = Math.max(0, (relativeMinutes / 60) * hourHeight);
                        
                        // Skip if appointment is outside visible hours
                        if (appointmentMinutes < startMinutes || appointmentMinutes > 1320) { // 22:00 PM
                          return null;
                        }
                        
                        return (
                          <div
                            key={appointment.id}
                            data-appointment-id={appointment.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, appointment)}
                            onDragEnd={(e) => {
                              setIsDragging(false);
                              setDraggedAppointment(null);
                              if (e.currentTarget instanceof HTMLElement) {
                                e.currentTarget.style.opacity = '1';
                              }
                            }}
                            onClick={() => {
                              if (!justFinishedResizing && !resizing) {
                                openViewModal(appointment);
                              }
                            }}
                            className={`absolute pointer-events-auto rounded-md transition-all duration-200 z-20 mx-1 md:mx-2 hover:shadow-md border-l-4 group ${getStatusColors(appointment.status).bgLight} ${getStatusColors(appointment.status).border} ${
                              resizing?.appointmentId === appointment.id ? 'cursor-ns-resize' : 'cursor-move'
                            }`}
                            style={{
                              top: `${topPosition}px`,
                              left: '4px',
                              right: '4px',
                              height: `${Math.max(getAppointmentHeight(getActualDuration(appointment)), 40)}px`,
                            }}
                            title={`${appointment.time || 'No time'} - ${appointment.endTime || ''} - ${appointment.client?.name || 'No client'} (Drag to move)`}
                          >
                            {/* Top resize handle - only visible on hover on desktop */}
                            <div 
                              className="absolute top-0 left-0 right-0 h-2 md:h-3 cursor-n-resize z-30 opacity-0 md:group-hover:opacity-100 transition-opacity"
                              onMouseDown={(e) => handleResizeStart(e, appointment.id, 'top')}
                              title="Drag to adjust start time"
                            />
                            
                            {/* Main content - Mobile Optimized */}
                            <div className="p-1 md:p-2 h-full flex overflow-hidden relative mt-1 mb-1">
                              {/* Left side - Client info and address */}
                              <div className="flex-1 min-w-0 flex flex-col justify-start">
                                <div className="space-y-0.5 overflow-hidden">
                                  {/* Client Name */}
                                  <div className={`font-semibold truncate text-xs md:text-sm leading-tight ${
                                    getStatusColors(appointment.status).textDark
                                  }`}>
                                    {appointment.client?.name || 'No client'}
                                  </div>
                                  
                                  {/* Address - only show if there's space */}
                                  {appointment.client?.address && (
                                    <div className={`text-xs truncate opacity-75 leading-tight ${
                                      getStatusColors(appointment.status).textDark
                                    }`}>
                                      📍 {appointment.client.address}
                                    </div>
                                  )}
                                  
                                  {/* Time */}
                                  <div className={`text-xs truncate opacity-90 leading-tight ${
                                    getStatusColors(appointment.status).textDark
                                  }`}>
                                    {appointment.time || 'No time'} - {appointment.endTime || calculateEndTime(appointment.time, getActualDuration(appointment))}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Right side - Services and Groomer (hidden on very small mobile) */}
                              <div className="hidden sm:flex flex-col items-end text-right min-w-0 ml-2 justify-start">
                                <div className="space-y-0.5 overflow-hidden">
                                  {appointment.services && appointment.services.length > 0 && (() => {
                                    // Filter out default/base services, but keep "Full Service Grooming"
                                    const additionalServices = appointment.services.filter(service => {
                                      // Handle both string and object services
                                      const serviceString = typeof service === 'string' ? service : (service?.name || String(service));
                                      const serviceLower = serviceString.toLowerCase();
                                      return ![
                                        'full grooming', 'full groom', 'full-groom', 'full-grooming',
                                        'basic grooming', 'basic groom', 'basic-groom', 'basic-grooming',
                                        'standard grooming', 'standard groom', 'standard-groom', 'standard-grooming',
                                        'grooming', 'groom'
                                      ].includes(serviceLower);
                                    });
                                    
                                    return additionalServices.length > 0 ? (
                                      <div className={`text-xs truncate opacity-75 leading-tight ${
                                        getStatusColors(appointment.status).textDark
                                      }`}>
                                        ✂️ {Array.isArray(additionalServices) 
                                            ? additionalServices.slice(0, 1).map(service => 
                                                typeof service === 'string' ? service : (service?.name || String(service))
                                              ).join(', ')
                                            : 'Services'
                                          }
                                          {additionalServices.length > 1 && ` +${additionalServices.length - 1}`}
                                      </div>
                                    ) : null;
                                  })()}
                                  {appointment.assignedGroomer && (
                                    <div className={`text-xs truncate opacity-75 leading-tight ${
                                      getStatusColors(appointment.status).textDark
                                    }`}>
                                      👤 {appointment.assignedGroomer}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Bottom resize handle - only visible on hover on desktop */}
                            <div 
                              className="absolute bottom-0 left-0 right-0 h-2 md:h-3 cursor-s-resize z-30 opacity-0 md:group-hover:opacity-100 transition-opacity"
                              onMouseDown={(e) => handleResizeStart(e, appointment.id, 'bottom')}
                              title="Drag to adjust end time"
                            />
                            
                            {/* Action buttons - hidden on mobile, visible on hover on desktop */}
                            <div className="absolute top-1 md:top-2 right-1 md:right-2 hidden md:flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openViewModal(appointment);
                                }}
                                className="p-1 text-stone-500 hover:bg-stone-200 rounded"
                                title="View"
                              >
                                <Eye className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Day View Instructions */}
            <div className="text-center text-xs md:text-sm text-gray-500 bg-gray-50 rounded-lg p-2 md:p-3">
              <p>💡 <strong>Drag appointments</strong> to reschedule to different times (15-minute precision)</p>
            </div>
          </div>
        )}

        {viewMode === '4day' && (
          <div className="space-y-2 md:space-y-4">
            {/* 4-Day Header */}
            <div className="bg-gray-50 rounded-lg p-1 md:p-2 mb-2 md:mb-4">
              <div className="flex">
                {/* Time column header - matches content width */}
                <div className="w-10 md:w-16 p-1 md:p-2 text-xs font-medium text-gray-500 text-center">
                  Time
                </div>
                {/* Day headers */}
                <div className="flex-1 grid grid-cols-4 gap-px md:gap-1">
                  {Array.from({ length: 4 }, (_, i) => {
                    const dayDate = new Date(selectedDate);
                    dayDate.setDate(selectedDate.getDate() + i);
                    const isTodayDate = isToday(dayDate);
                    
                    return (
                      <div key={i} className="text-center py-1 md:py-2">
                        <div className="text-xs text-stone-500 mb-1">
                          {dayDate.toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className={`text-xs md:text-sm font-semibold ${
                          isTodayDate 
                            ? 'bg-stone-600 text-white rounded-full w-5 h-5 md:w-7 md:h-7 flex items-center justify-center mx-auto text-xs' 
                            : 'text-stone-800'
                        }`}>
                          {dayDate.getDate()}
                        </div>
                        <div className="text-xs text-stone-400 mt-1 hidden md:block">
                          {dayDate.toLocaleDateString('en-US', { month: 'short' })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Time Grid */}
            <div className="bg-white md:rounded-lg border-0 md:border border-gray-200 overflow-hidden">
              <div className="relative">
                {/* Time slots */}
                <div className="flex">
                  {/* Time column - Mobile Optimized */}
                  <div className="w-10 md:w-16 border-r border-gray-200">
                    {Array.from({ length: 17 }, (_, hourIndex) => {
                      const hour = hourIndex + 6; // Start from 6 AM
                      const timeLabel = hour === 12 ? '12' : 
                                      hour > 12 ? `${hour - 12}` : 
                                      hour === 0 ? '12' :
                                      `${hour}`;
                      const period = hour >= 12 ? 'PM' : 'AM';
                      
                      return (
                        <div key={hourIndex} className="h-12 md:h-16 flex items-center justify-end border-b border-gray-200 last:border-b-0">
                          <div className="text-xs text-gray-500 mr-1 md:mr-2 text-right">
                            <div className="font-medium text-xs">{timeLabel}</div>
                            <div className="text-xs opacity-75">{period}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Days container */}
                  <div className="flex-1 relative">
                    {/* Single large drop zone covering entire 4-day area */}
                    <div
                      className="absolute inset-0 z-10"
                      onDrop={(e) => {
                        // Calculate which day column was dropped on
                        const rect = e.currentTarget.getBoundingClientRect();
                        const relativeX = e.clientX - rect.left;
                        const dayWidth = rect.width / 4;
                        const dayIndex = Math.min(3, Math.floor(relativeX / dayWidth));
                        
                        // Calculate the target date
                        const targetDate = new Date(selectedDate);
                        targetDate.setDate(selectedDate.getDate() + dayIndex);
                        
                        handleDrop(e, targetDate);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('bg-blue-25');
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove('bg-blue-25');
                      }}
                      onDragEnter={(e) => e.preventDefault()}
                    />
                    
                    {/* Day columns grid */}
                    <div className="grid grid-cols-4 h-full">
                      {Array.from({ length: 4 }, (_, dayIndex) => (
                        <div key={dayIndex} className="border-r border-gray-100 last:border-r-0">
                          {/* Hour lines for each day */}
                          {Array.from({ length: 17 }, (_, hourIndex) => (
                            <div 
                              key={hourIndex} 
                              className="h-12 md:h-16 border-b border-gray-200 last:border-b-0 relative pointer-events-none"
                            >
                              {/* 15-minute markers */}
                              <div className="absolute inset-0">
                                {[15, 30, 45].map(minute => (
                                  <div 
                                    key={minute}
                                    className="absolute left-0 right-0 border-b border-gray-100"
                                    style={{ top: `${(minute / 60) * 100}%` }}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                    
                    {/* Appointments overlay */}
                    <div className="absolute inset-0 pointer-events-none z-20">
                      {Array.from({ length: 4 }, (_, dayIndex) => {
                        const dayDate = new Date(selectedDate);
                        dayDate.setDate(selectedDate.getDate() + dayIndex);
                        
                        return getAppointmentsForDate(dayDate).map((appointment) => {
                          const appointmentMinutes = convertTimeToMinutes(appointment.time || '12:00 PM');
                          const startMinutes = 360; // 6 AM
                          const relativeMinutes = appointmentMinutes - startMinutes;
                          
                          // Match the heights used in day view: 48px mobile, 64px desktop
                          const hourHeight = window.innerWidth >= 768 ? 64 : 48;
                          const topPosition = Math.max(0, (relativeMinutes * hourHeight) / 60);
                          
                          // Skip if appointment is outside visible hours
                          if (appointmentMinutes < startMinutes || appointmentMinutes > 1320) { // 22:00 PM
                            return null;
                          }
                          
                          return (
                            <div
                              key={appointment.id}
                              data-appointment-id={appointment.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, appointment)}
                              onDragEnd={(e) => {
                                if (e.currentTarget instanceof HTMLElement) {
                                  e.currentTarget.style.opacity = '1';
                                }
                              }}
                              onClick={() => openViewModal(appointment)}
                              className={`absolute pointer-events-auto text-xs p-0.5 md:p-1 mx-0.5 rounded cursor-move shadow-sm hover:shadow-md transition-all duration-200 z-30 border-l-2 ${
                                getStatusColors(appointment.status).bgLight
                              } ${getStatusColors(appointment.status).textDark} ${getStatusColors(appointment.status).border}`}
                              style={{
                                top: `${topPosition}px`,
                                left: `${(dayIndex * (100 / 4)) + 0.5}%`,
                                width: `${(100 / 4) - 1}%`,
                                height: `${Math.min(hourHeight - 4, getAppointmentHeight(getActualDuration(appointment)))}px`,
                              }}
                              title={`${appointment.time || 'No time'} - ${appointment.client?.name || 'No client'} (Drag to move)`}
                            >
                              <div className="flex items-center justify-between leading-tight overflow-hidden">
                                <div className="font-medium truncate text-xs flex-1 min-w-0">
                                  {appointment.client?.name?.split(' ')[0] || 'No client'}
                                </div>
                                {appointment.time && (
                                  <div className="hidden lg:block text-xs opacity-75 ml-0.5 flex-shrink-0">
                                    {appointment.time?.replace(' ', '') || ''}
                                  </div>
                                )}
                              </div>
                              {appointment.services && appointment.services.length > 0 && (() => {
                                // Filter out default/base services, but keep "Full Service Grooming"
                                const additionalServices = appointment.services.filter(service => {
                                  // Handle both string and object services
                                  const serviceString = typeof service === 'string' ? service : (service?.name || String(service));
                                  const serviceLower = serviceString.toLowerCase();
                                  return ![
                                    'full grooming', 'full groom', 'full-groom', 'full-grooming',
                                    'basic grooming', 'basic groom', 'basic-groom', 'basic-grooming',
                                    'standard grooming', 'standard groom', 'standard-groom', 'standard-grooming',
                                    'grooming', 'groom'
                                  ].includes(serviceLower);
                                });
                                
                                return additionalServices.length > 0 ? (
                                  <div className="truncate opacity-90 text-xs leading-tight">
                                    {Array.isArray(additionalServices) 
                                      ? additionalServices.slice(0, 1).map(service => 
                                          typeof service === 'string' ? service : (service?.name || String(service))
                                        ).join('')
                                      : 'Services'
                                    }
                                    {additionalServices.length > 1 && ` +${additionalServices.length - 1}`}
                                  </div>
                                ) : null;
                              })()}
                            </div>
                          );
                        });
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 4-Day View Instructions */}
            <div className="text-center text-xs md:text-sm text-gray-500 bg-gray-50 rounded-lg p-2 md:p-3">
              <p>💡 <strong>Drag and drop appointments</strong> to reschedule them to different days and times (15-minute precision)</p>
            </div>
          </div>
        )}

        {viewMode === 'agenda' && renderAgendaView()}
      </div>

      {/* Add Appointment Button */}
      <div className="fixed bottom-6 right-6">
        <button 
          onClick={openAddModal}
          className="bg-stone-600 hover:bg-stone-700 text-white rounded-full p-4 shadow-lg transition-colors"
          title="Add New Appointment"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Appointment Modal */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-amber-900">
                  {isAddingNew ? 'New Appointment' : editMode ? 'Edit Appointment' : 'View Appointment'}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="px-6 pb-6 space-y-4">
              {selectedAppointment && !editMode && !isAddingNew ? (
                <div className="space-y-6">
                  {/* Date & Time */}
                  <div>
                    <label className="block text-sm font-medium text-amber-700 mb-2">Date & Time</label>
                    <div className="bg-amber-50 rounded-lg p-3">
                      <div className="flex items-center space-x-2 text-amber-900 mb-1">
                        <Calendar className="w-4 h-4 text-amber-600" />
                        <span className="text-sm">{selectedAppointment?.date || 'No date'}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-amber-900">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span className="text-sm">{selectedAppointment?.time || 'No time'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-amber-700 mb-2">Status</label>
                    <div className="bg-amber-50 rounded-lg p-3">
                      <div className="relative">
                        <div className="relative group">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setModalStatusPopover(
                                modalStatusPopover?.type === 'status' 
                                  ? null 
                                  : { type: 'status' }
                              );
                            }}
                            className={`w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 ${
                              getStatusColors(selectedAppointment?.status).bg
                            } ${getStatusColors(selectedAppointment?.status).text}`}
                            title="Click to change appointment status"
                          >
                            <div className="flex items-center justify-center space-x-2">
                              <span>
                                {selectedAppointment?.status === 'pending' && '⏳'}
                                {selectedAppointment?.status === 'confirmed' && '✅'}
                                {selectedAppointment?.status === 'in-progress' && '🔄'}
                                {selectedAppointment?.status === 'completed' && '🎉'}
                                {selectedAppointment?.status === 'cancelled' && '❌'}
                              </span>
                              <span className="capitalize">{selectedAppointment?.status?.replace('-', ' ')}</span>
                            </div>
                          </button>
                          
                          {/* Status Popover */}
                          {modalStatusPopover?.type === 'status' && (
                            <div className="absolute left-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-2 z-[9999] w-full">
                              <div className="grid gap-1">
                                {(['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'] as const).map((status) => (
                                  <button
                                    key={status}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (selectedAppointment) {
                                        changeAppointmentStatus(selectedAppointment.id, status);
                                      }
                                      setModalStatusPopover(null);
                                    }}
                                    className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                                      selectedAppointment?.status === status
                                        ? `${getStatusColors(status).bg} ${getStatusColors(status).text}`
                                        : 'hover:bg-gray-100 text-gray-700'
                                    }`}
                                  >
                                    <span>
                                      {status === 'pending' && '⏳'}
                                      {status === 'confirmed' && '✅'}
                                      {status === 'in-progress' && '🔄'}
                                      {status === 'completed' && '🎉'}
                                      {status === 'cancelled' && '❌'}
                                    </span>
                                    <span className="capitalize">{status.replace('-', ' ')}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Status */}
                  <div>
                    <label className="block text-sm font-medium text-amber-700 mb-2">Payment Status</label>
                    <div className="bg-amber-50 rounded-lg p-3">
                      <div className="relative">
                        <div className="relative group">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setModalStatusPopover(
                                modalStatusPopover?.type === 'payment' 
                                  ? null 
                                  : { type: 'payment' }
                              );
                            }}
                            className={`w-full px-4 py-2 text-sm font-medium font-sans rounded-lg transition-all duration-200 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 ${
                              getPaymentStatusColors(selectedAppointment?.paymentStatus || 'unpaid').bg
                            } ${getPaymentStatusColors(selectedAppointment?.paymentStatus || 'unpaid').text}`}
                            title="Click to change payment status"
                          >
                            {(selectedAppointment?.paymentStatus || 'unpaid') === 'unpaid' && '❌'}
                            {(selectedAppointment?.paymentStatus || 'unpaid') === 'partial' && '💳'}
                            {(selectedAppointment?.paymentStatus || 'unpaid') === 'paid' && '💰'}
                            {(selectedAppointment?.paymentStatus || 'unpaid') === 'refunded' && '↩️'}
                            {(selectedAppointment?.paymentStatus || 'unpaid') === 'disputed' && '⚠️'}
                            <span className="ml-2 capitalize">{(selectedAppointment?.paymentStatus || 'unpaid').replace('-', ' ')}</span>
                          </button>
                          
                          {/* Payment Status Popover */}
                          {modalStatusPopover?.type === 'payment' && (
                            <div className="absolute left-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-2 z-[9999] w-full">
                              <div className="grid gap-1">
                                {/* Collect Payment Option - Only show for unpaid/partial */}
                                {selectedAppointment?.paymentStatus !== 'paid' && (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setModalStatusPopover(null);
                                        setShowPaymentModal(true);
                                      }}
                                      className="flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 hover:bg-green-50 text-green-700 border-b border-gray-200 mb-1"
                                    >
                                      <DollarSign className="w-4 h-4" />
                                      <span>Collect Payment</span>
                                    </button>
                                  </>
                                )}
                                
                                {(['unpaid', 'partial', 'paid', 'refunded', 'disputed'] as const).map((paymentStatus) => (
                                  <button
                                    key={paymentStatus}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (selectedAppointment) {
                                        changePaymentStatus(selectedAppointment.id, paymentStatus);
                                      }
                                      setModalStatusPopover(null);
                                    }}
                                    className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                                      (selectedAppointment?.paymentStatus || 'unpaid') === paymentStatus
                                        ? `${getPaymentStatusColors(paymentStatus).bg} ${getPaymentStatusColors(paymentStatus).text}`
                                        : 'hover:bg-gray-100 text-gray-700'
                                    }`}
                                  >
                                    <span>
                                      {paymentStatus === 'unpaid' && '❌'}
                                      {paymentStatus === 'partial' && '💳'}
                                      {paymentStatus === 'paid' && '💰'}
                                      {paymentStatus === 'refunded' && '↩️'}
                                      {paymentStatus === 'disputed' && '⚠️'}
                                    </span>
                                    <span className="capitalize">{paymentStatus.replace('-', ' ')}</span>
                                    {(selectedAppointment?.paymentStatus || 'unpaid') === paymentStatus && (
                                      <Check className="w-3 h-3 ml-auto" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Services */}
                  {selectedAppointment?.services && selectedAppointment.services.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-amber-700 mb-2">Services</label>
                      <div className="bg-amber-50 rounded-lg p-3 space-y-2">
                        {selectedAppointment.services.map((service, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-sm text-amber-900">
                              {typeof service === 'string' ? service : (service?.name || String(service) || 'Unknown Service')}
                            </span>
                            {typeof service === 'object' && service.price && (
                              <span className="text-sm font-medium text-amber-700">${service.price}</span>
                            )}
                          </div>
                        ))}
                        {selectedAppointment.totalAmount && (
                          <div className="border-t border-amber-200 pt-2 mt-2">
                            <div className="flex justify-between items-center font-medium">
                              <span className="text-amber-900">Total</span>
                              <span className="text-amber-700">${selectedAppointment.totalAmount}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Pet Information */}
                  {selectedAppointment?.client?.pets && selectedAppointment.client.pets.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-amber-700 mb-2">Pet Information</label>
                      <div className="bg-amber-50 rounded-lg p-3 space-y-3">
                        {selectedAppointment.client.pets.map((pet, index) => {
                          // Enhanced breed lookup - try multiple field names and breed ID lookup
                          const getDisplayBreed = (pet: any) => {
                            console.log('Admin pet breed lookup:', pet);
                            
                            // First, try to get breed by ID if available
                            if (pet.breedId) {
                              const breedObj = getBreedById(pet.breedId);
                              if (breedObj?.name) {
                                console.log('Found breed by ID:', breedObj.name);
                                return breedObj.name;
                              }
                            }
                            
                            // Then try different field names for breed
                            const breedFields = [
                              'breed', 'petBreed', 'pet_breed', 'dogBreed', 'dog_breed', 
                              'catBreed', 'cat_breed', 'breedName', 'breed_name'
                            ];
                            
                            for (const field of breedFields) {
                              if (pet[field] && pet[field] !== 'Mixed Breed') {
                                console.log(`Found breed in field ${field}:`, pet[field]);
                                return pet[field];
                              }
                            }
                            
                            // If it's a JSON string, try to parse it
                            if (typeof pet === 'string') {
                              try {
                                const parsed = JSON.parse(pet);
                                return getDisplayBreed(parsed);
                              } catch (e) {
                                console.log('Failed to parse pet JSON:', e);
                              }
                            }
                            
                            console.log('No breed found, using fallback');
                            return 'Mixed Breed';
                          };

                          const displayBreed = getDisplayBreed(pet);

                          return (
                            <div key={index} className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded">Name</span>
                                <span className="text-sm text-amber-900">{pet.name}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded">Breed</span>
                                <span className="text-sm text-amber-900">{displayBreed}</span>
                              </div>
                              {pet.age && (
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded">Age</span>
                                  <span className="text-sm text-amber-900">{pet.age} years</span>
                                </div>
                              )}
                              {pet.weight && (
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded">Weight</span>
                                  <span className="text-sm text-amber-900">{pet.weight}</span>
                                </div>
                              )}
                              {pet.specialInstructions && (
                                <div className="flex items-start space-x-2">
                                  <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded">Notes</span>
                                  <span className="text-sm text-amber-900">{pet.specialInstructions}</span>
                                </div>
                              )}
                              {selectedAppointment.client.pets.length > 1 && index < selectedAppointment.client.pets.length - 1 && (
                                <hr className="border-amber-200" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedAppointment?.notes && (
                    <div>
                      <label className="block text-sm font-medium text-amber-700 mb-2">Notes</label>
                      <div className="bg-amber-50 rounded-lg p-3">
                        <span className="text-sm text-amber-900">{selectedAppointment.notes}</span>
                      </div>
                    </div>
                  )}

                  {/* Client Information */}
                  <div>
                    <label className="block text-sm font-medium text-amber-700 mb-2">Client Information</label>
                    <div className="bg-amber-50 rounded-lg p-3 space-y-2">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-amber-600" />
                        <span className="font-medium text-amber-900">{selectedAppointment?.client?.name || 'No client name'}</span>
                      </div>
                      {selectedAppointment?.client?.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-amber-600" />
                          <span className="text-amber-900">{selectedAppointment.client.phone}</span>
                        </div>
                      )}
                      {selectedAppointment?.client?.email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-amber-600" />
                          <span className="text-amber-900">{selectedAppointment.client.email}</span>
                        </div>
                      )}
                      {selectedAppointment?.client?.address && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-amber-600" />
                          <span className="text-amber-900">{selectedAppointment.client.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Staff Assignment */}
                  <div className="relative" ref={staffAssignmentRef}>
                    <label className="block text-sm font-medium text-amber-700 mb-2">Assigned Staff Member</label>
                    <div 
                      className="bg-amber-50 rounded-lg p-3 cursor-pointer hover:bg-amber-100 transition-colors"
                      onClick={() => setShowStaffAssignmentPopout(!showStaffAssignmentPopout)}
                    >
                      {selectedAppointment?.assignedGroomer ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-blue-600" />
                            <span className="text-amber-900 font-medium">{selectedAppointment.assignedGroomer}</span>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Assigned</span>
                          </div>
                          <svg className={`w-4 h-4 text-amber-600 transition-transform ${showStaffAssignmentPopout ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-500 italic">No staff member assigned</span>
                            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">Unassigned</span>
                          </div>
                          <svg className={`w-4 h-4 text-amber-600 transition-transform ${showStaffAssignmentPopout ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Staff Assignment Popout */}
                    {showStaffAssignmentPopout && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                        <div className="p-2">
                          {/* Unassign option */}
                          <button
                            onClick={() => handleDirectStaffAssignment(null)}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors hover:bg-gray-50 text-gray-700 ${
                              !selectedAppointment?.assignedGroomer ? 'bg-orange-50 text-orange-700 border border-orange-200' : ''
                            }`}
                          >
                            <div className="flex items-center">
                              <User className="w-4 h-4 mr-2 text-gray-400" />
                              <span>Unassigned</span>
                              {!selectedAppointment?.assignedGroomer && (
                                <span className="ml-auto text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">Current</span>
                              )}
                            </div>
                          </button>
                          
                          <div className="border-t border-gray-100 my-1"></div>
                          
                          {/* Available staff */}
                          {availableStaff.map((staff) => (
                            <button
                              key={staff.id}
                              onClick={() => handleDirectStaffAssignment(staff)}
                              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors hover:bg-gray-50 text-gray-700 ${
                                selectedAppointment?.assignedGroomer === staff.name ? 'bg-blue-50 text-blue-700 border border-blue-200' : ''
                              }`}
                            >
                              <div className="flex items-center">
                                <span className="mr-2">
                                  {staff.role === 'admin' ? '👑' : '✂️'}
                                </span>
                                <span className="font-medium">{staff.name}</span>
                                <span className="ml-2 text-xs text-gray-500 capitalize">
                                  {staff.role}
                                </span>
                                {selectedAppointment?.assignedGroomer === staff.name && (
                                  <span className="ml-auto text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Current</span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-amber-200">
                    <button
                      onClick={() => setEditMode(true)}
                      className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                    >
                      Edit Appointment
                    </button>
                    {selectedAppointment && (
                      <button
                        onClick={() => deleteAppointment(selectedAppointment.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* Edit/Add Mode - Appointment Form */
                <form className="space-y-6">
                  {/* Customer Information */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <h4 className="text-lg sm:text-xl font-semibold text-amber-800">Customer Information</h4>
                      {selectedClient && (
                        <span className="text-xs sm:text-sm bg-green-100 text-green-700 px-2 sm:px-3 py-1 rounded-full w-fit">
                          Pre-filled from existing client
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div className="relative client-search-container sm:col-span-2 lg:col-span-1">
                        <label className="block text-sm font-medium text-amber-800 mb-2">
                          Customer Name *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={bookingFormData.customerName}
                            onChange={(e) => {
                              setBookingFormData(prev => ({
                                ...prev,
                                customerName: e.target.value
                              }));
                              setClientSearch(e.target.value);
                            }}
                            className={`w-full px-3 sm:px-4 py-2 sm:py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm text-sm sm:text-base ${
                              selectedClient ? 'bg-green-50 border-green-200' : ''
                            }`}
                            placeholder="Enter or search customer name"
                          />
                          {isLoadingSearch && (
                            <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2">
                              <div className="animate-spin h-4 w-4 sm:h-5 sm:w-5 border-2 border-amber-500 rounded-full border-t-transparent"></div>
                            </div>
                          )}
                          {selectedClient && (
                            <button
                              type="button"
                              onClick={clearClientSelection}
                              className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-rose-500 hover:text-rose-600"
                            >
                              <X className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          )}
                        </div>

                        {/* Search Results Dropdown */}
                        {showSearchResults && searchResults.length > 0 && !selectedClient && (
                          <div className="absolute z-20 w-full mt-1 sm:mt-2 bg-white border border-amber-200 rounded-xl shadow-lg max-h-48 sm:max-h-64 overflow-y-auto">
                            {searchResults.map((client, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => selectClient(client)}
                                className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 hover:bg-amber-50 focus:bg-amber-50 focus:outline-none border-b border-amber-100 last:border-b-0 transition-colors"
                              >
                                <div className="flex justify-between items-start">
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-amber-900 text-sm sm:text-base truncate">{client.name}</p>
                                    <p className="text-xs sm:text-sm text-amber-700 truncate">{client.email}</p>
                                    {client.phone && (
                                      <p className="text-xs sm:text-sm text-amber-600 truncate">{client.phone}</p>
                                    )}
                                  </div>
                                  {client.pets && client.pets.length > 0 && (
                                    <div className="text-xs text-amber-600 bg-amber-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded ml-2 flex-shrink-0">
                                      {client.pets.length} pet{client.pets.length > 1 ? 's' : ''}
                                    </div>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* No Results Message */}
                        {showSearchResults && searchResults.length === 0 && clientSearch.length >= 2 && !isLoadingSearch && !selectedClient && (
                          <div className="absolute z-20 w-full mt-1 sm:mt-2 bg-white border border-amber-200 rounded-xl shadow-lg p-3 sm:p-4">
                            <div className="text-center">
                              <p className="text-amber-700 mb-1 sm:mb-2 text-sm">No existing client found</p>
                              <p className="text-xs sm:text-sm text-amber-600">Continue filling the form to add a new client</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="sm:col-span-2 lg:col-span-1">
                        <label className="block text-sm font-medium text-amber-800 mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          value={bookingFormData.email}
                          onChange={(e) => setBookingFormData(prev => ({
                            ...prev,
                            email: e.target.value
                          }))}
                          className={`w-full px-3 sm:px-4 py-2 sm:py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm text-sm sm:text-base ${
                            selectedClient ? 'bg-green-50 border-green-200' : ''
                          }`}
                          placeholder="Enter email address"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-amber-800 mb-2">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          value={bookingFormData.phone}
                          onChange={(e) => setBookingFormData(prev => ({
                            ...prev,
                            phone: e.target.value
                          }))}
                          className={`w-full px-3 sm:px-4 py-2 sm:py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm text-sm sm:text-base ${
                            selectedClient ? 'bg-green-50 border-green-200' : ''
                          }`}
                          placeholder="Enter phone number"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-amber-800 mb-2">
                          Address *
                        </label>
                        <input
                          type="text"
                          value={bookingFormData.address}
                          onChange={(e) => setBookingFormData(prev => ({
                            ...prev,
                            address: e.target.value
                          }))}
                          className={`w-full px-3 sm:px-4 py-2 sm:py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm text-sm sm:text-base ${
                            selectedClient ? 'bg-green-50 border-green-200' : ''
                          }`}
                          placeholder="Enter address"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Appointment Details */}
                  <div className="space-y-4">
                    <h4 className="text-lg sm:text-xl font-semibold text-amber-800">Appointment Details</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <label className="block text-sm font-medium text-amber-800 mb-2">
                          Date *
                        </label>
                        <input
                          type="date"
                          value={bookingFormData.preferredDate}
                          onChange={(e) => setBookingFormData(prev => ({
                            ...prev,
                            preferredDate: e.target.value
                          }))}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm text-sm sm:text-base"
                          style={{ WebkitAppearance: 'none', maxWidth: '100%', boxSizing: 'border-box' }}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-amber-800 mb-2">
                          Time *
                        </label>
                        <select
                          value={bookingFormData.preferredTime}
                          onChange={(e) => setBookingFormData(prev => ({
                            ...prev,
                            preferredTime: e.target.value
                          }))}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm text-sm sm:text-base"
                        >
                          <option value="">Select time</option>
                          <option value="8:00 AM">8:00 AM</option>
                          <option value="9:00 AM">9:00 AM</option>
                          <option value="10:00 AM">10:00 AM</option>
                          <option value="11:00 AM">11:00 AM</option>
                          <option value="12:00 PM">12:00 PM</option>
                          <option value="1:00 PM">1:00 PM</option>
                          <option value="2:00 PM">2:00 PM</option>
                          <option value="3:00 PM">3:00 PM</option>
                          <option value="4:00 PM">4:00 PM</option>
                          <option value="5:00 PM">5:00 PM</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Pet Information */}
                  <div className="space-y-4">
                    <h4 className="text-lg sm:text-xl font-semibold text-amber-800">Pet Information</h4>
                    
                    {bookingFormData.pets.map((pet, index) => (
                      <div key={index} className="bg-white/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-amber-200/50 space-y-3 sm:space-y-4">
                        <div className="flex justify-between items-center">
                          <h5 className="text-base sm:text-lg font-medium text-amber-900">Pet #{index + 1}</h5>
                          {bookingFormData.pets.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removePet(index)}
                              className="text-rose-500 hover:text-rose-600 transition-colors p-1"
                            >
                              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <label className="block text-sm font-medium text-amber-800 mb-2">
                              Pet Name *
                            </label>
                            <input
                              type="text"
                              value={pet.name}
                              onChange={(e) => updatePet(index, 'name', e.target.value)}
                              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm text-sm sm:text-base"
                              placeholder="Enter pet name"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-amber-800 mb-2">
                              Pet Type *
                            </label>
                            <select
                              value={pet.type}
                              onChange={(e) => updatePet(index, 'type', e.target.value as 'dog' | 'cat')}
                              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm text-sm sm:text-base"
                            >
                              <option value="">Select pet type</option>
                              <option value="dog">Dog</option>
                              <option value="cat">Cat</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-amber-800 mb-2">
                              Breed *
                            </label>
                            <select
                              value={pet.breedId || ''}
                              onChange={(e) => updatePet(index, 'breedId', e.target.value ? Number(e.target.value) : null)}
                              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm text-sm sm:text-base"
                              disabled={!pet.type}
                            >
                              <option value="">Select breed</option>
                              {getAvailableBreeds(pet.type).map((breed) => (
                                <option key={breed.id} value={breed.id}>
                                  {breed.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-amber-800 mb-2">
                              Weight (lbs)
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="200"
                              value={pet.weight}
                              onChange={(e) => updatePet(index, 'weight', e.target.value)}
                              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm text-sm sm:text-base"
                              placeholder="Enter weight"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-amber-800 mb-2">
                            Special Instructions
                          </label>
                          <textarea
                            rows={3}
                            value={pet.specialInstructions}
                            onChange={(e) => updatePet(index, 'specialInstructions', e.target.value)}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm text-sm sm:text-base"
                            placeholder="Any special care instructions for this pet..."
                          />
                        </div>
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      onClick={addPet}
                      className="w-full py-2 sm:py-3 px-4 border-2 border-dashed border-amber-300 rounded-xl text-amber-700 hover:border-amber-400 hover:bg-amber-50 transition-all duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Add Another Pet</span>
                    </button>
                  </div>

                  {/* Service Selection */}
                  <div className="space-y-4">
                    <h4 className="text-lg sm:text-xl font-semibold text-amber-800">Service Selection</h4>
                    
                    {/* Full Service Option */}
                    <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-amber-200/50">
                      <label className="flex items-start space-x-3 sm:space-x-4 cursor-pointer group">
                        <div className="relative mt-1">
                          <input
                            type="checkbox"
                            checked={bookingFormData.includeFullService}
                            onChange={(e) => setBookingFormData(prev => ({
                              ...prev,
                              includeFullService: e.target.checked
                            }))}
                            className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500 border-2 border-amber-300 rounded focus:ring-rose-400 focus:ring-2"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start space-x-2 sm:space-x-3">
                            <span className="text-lg sm:text-2xl">✨</span>
                            <div>
                              <h5 className="text-base sm:text-lg font-semibold text-amber-900 group-hover:text-rose-600 transition-colors">
                                Full Service Grooming
                              </h5>
                              <p className="text-xs sm:text-sm text-amber-700 mt-1">
                                Complete grooming package including bath, haircut, nail trim, ear cleaning, and more
                              </p>
                            </div>
                          </div>
                        </div>
                      </label>
                    </div>

                    {/* Additional Services */}
                    <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-amber-200/50">
                      <h5 className="text-base sm:text-lg font-semibold text-amber-800 mb-3 sm:mb-4">Additional Services</h5>
                      {addons.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          {addons.map((addon) => (
                            <label key={addon.code} className="flex items-start space-x-2 sm:space-x-3 cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={bookingFormData.additionalServices.includes(addon.code)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setBookingFormData(prev => ({
                                      ...prev,
                                      additionalServices: [...prev.additionalServices, addon.code]
                                    }));
                                  } else {
                                    setBookingFormData(prev => ({
                                      ...prev,
                                      additionalServices: prev.additionalServices.filter(s => s !== addon.code)
                                    }));
                                  }
                                }}
                                className="w-3 h-3 sm:w-4 sm:h-4 text-rose-500 border-2 border-amber-300 rounded focus:ring-rose-400 focus:ring-2 mt-1"
                              />
                              <div className="flex-1 min-w-0">
                                <span className="text-xs sm:text-sm font-medium text-amber-900 group-hover:text-rose-600 transition-colors block">
                                  {addon.name}
                                </span>
                                <p className="text-xs text-amber-700">${Number(addon.price).toFixed(2)}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <p className="text-amber-600 text-sm">Loading additional services...</p>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-3 sm:space-y-4">
                    <h4 className="text-lg sm:text-xl font-semibold text-amber-800 mb-3 sm:mb-4">Additional Notes</h4>
                    <textarea
                      rows={3}
                      value={bookingFormData.notes}
                      onChange={(e) => setBookingFormData(prev => ({
                        ...prev,
                        notes: e.target.value
                      }))}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-amber-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm text-sm sm:text-base"
                      placeholder="Any additional information or special requests..."
                    />
                  </div>

                  {/* Price Summary */}
                  <div className="bg-gradient-to-br from-amber-50 to-rose-50 rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 border border-amber-200/50">
                    <h3 className="text-xl sm:text-2xl font-semibold text-amber-900 mb-4 sm:mb-6">Price Summary</h3>
                    
                    {/* Grooming Services - Only show if full service is selected */}
                    {bookingFormData.includeFullService && bookingFormData.pets.length > 0 && (
                      <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                        <h4 className="text-base sm:text-lg font-medium text-amber-800">Full Service Grooming</h4>
                        {bookingFormData.pets.map((pet, index) => {
                          const breed = getBreedById(pet.breedId);
                          const price = getBreedPrice(pet);
                          return (
                            <div key={index} className="flex justify-between items-center py-2 border-b border-amber-200/50">
                              <div className="flex-1 min-w-0 mr-3">
                                <p className="text-sm font-medium text-amber-900 truncate">
                                  {pet.name || `Pet #${index + 1}`}
                                </p>
                                <p className="text-xs text-amber-700 truncate">
                                  {breed ? breed.name : 'Breed not selected'}
                                </p>
                              </div>
                              <p className="text-base sm:text-lg font-semibold text-rose-600 flex-shrink-0">
                                ${price.toFixed(2)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Additional Services */}
                    {bookingFormData.additionalServices.length > 0 && (
                      <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                        <h4 className="text-base sm:text-lg font-medium text-amber-800">Additional Services</h4>
                        {bookingFormData.additionalServices.map((serviceId) => {
                          const service = addons.find(addon => addon.code === serviceId);
                          if (!service) return null;
                          
                          // Calculate price based on number of pets (or 1 if no pets for additional services only)
                          const petCount = bookingFormData.pets.length > 0 ? bookingFormData.pets.length : 1;
                          const totalPrice = Number(service.price) * petCount;
                          return (
                            <div key={serviceId} className="flex justify-between items-center py-2 border-b border-amber-200/50">
                              <div className="flex-1 min-w-0 mr-3">
                                <p className="text-sm font-medium text-amber-900 truncate">{service.name}</p>
                                <p className="text-xs text-amber-700">
                                  ${Number(service.price).toFixed(2)} × {petCount} pet{petCount > 1 ? 's' : ''}
                                </p>
                              </div>
                              <p className="text-base sm:text-lg font-semibold text-rose-600 flex-shrink-0">
                                ${totalPrice.toFixed(2)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Show message if no services selected */}
                    {!bookingFormData.includeFullService && bookingFormData.additionalServices.length === 0 && (
                      <div className="text-center py-6 sm:py-8">
                        <div className="text-3xl sm:text-4xl mb-3">🐾</div>
                        <p className="text-amber-700 text-sm">
                          Select Full Service Grooming or Additional Services to see pricing
                        </p>
                      </div>
                    )}

                    {/* Promo Code Input - Show if ANY services are selected */}
                    {(bookingFormData.includeFullService || bookingFormData.additionalServices.length > 0) && (
                      <div className="mb-6">
                        <PromoCodeInput
                          onPromoCodeApplied={handlePromoCodeApplied}
                          onPromoCodeRemoved={handlePromoCodeRemoved}
                          totalAmount={calculateSubtotal()}
                          customerEmail={bookingFormData.email}
                        />
                      </div>
                    )}

                    {/* Estimated Duration */}
                    {(bookingFormData.includeFullService || bookingFormData.additionalServices.length > 0) && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Clock className="w-5 h-5 text-blue-600" />
                          <h4 className="text-base sm:text-lg font-medium text-blue-900">Estimated Duration</h4>
                        </div>
                        <div className="text-sm text-blue-800">
                          <p>
                            <strong>{calculateEstimatedDuration(
                              bookingFormData.includeFullService,
                              bookingFormData.additionalServices,
                              bookingFormData.pets.length
                            )} minutes</strong> 
                            ({Math.floor(calculateEstimatedDuration(
                              bookingFormData.includeFullService,
                              bookingFormData.additionalServices,
                              bookingFormData.pets.length
                            ) / 60)}h {calculateEstimatedDuration(
                              bookingFormData.includeFullService,
                              bookingFormData.additionalServices,
                              bookingFormData.pets.length
                            ) % 60}m)
                          </p>
                          {bookingFormData.pets.length > 1 && (
                            <p className="text-xs mt-1">
                              * Includes additional time for {bookingFormData.pets.length} pets
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Total */}
                    {(bookingFormData.includeFullService || bookingFormData.additionalServices.length > 0) && (
                      <div className="border-t border-amber-300 pt-3 sm:pt-4">
                        {/* Subtotal */}
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-lg sm:text-xl font-medium text-amber-900">Subtotal:</p>
                          <p className="text-lg sm:text-xl font-medium text-amber-900">${calculateSubtotal().toFixed(2)}</p>
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
                          <p className="text-lg sm:text-xl font-bold text-amber-900">Total:</p>
                          <p className="text-xl sm:text-2xl font-bold text-rose-600">${calculateTotal().toFixed(2)}</p>
                        </div>
                        <p className="text-xs sm:text-sm text-amber-700 mt-2">
                          Final price may vary based on pet size and condition
                        </p>
                      </div>
                    )}

                    {/* Breed Categories Info */}
                    <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-white/50 rounded-lg sm:rounded-xl">
                      <h5 className="text-sm font-semibold text-amber-800 mb-3">Our Pricing Categories</h5>
                      <div className="space-y-1 sm:space-y-2 text-xs text-amber-700">
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

                  {/* Action Buttons */}
                  <div className="border-t border-amber-200 pt-4 sm:pt-6">
                    <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="px-4 sm:px-6 py-3 bg-amber-100 text-amber-700 rounded-lg sm:rounded-xl hover:bg-amber-200 transition-all duration-200 font-medium text-sm sm:text-base order-2 sm:order-1"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleFormSubmit}
                        className="w-full sm:flex-1 bg-gradient-to-r from-rose-500 to-rose-600 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-2xl text-base sm:text-lg font-semibold hover:from-rose-600 hover:to-rose-700 hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 order-1 sm:order-2"
                      >
                        {editMode ? 'Update Appointment' : 'Create Appointment'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Collection Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl max-w-md w-full mx-4 shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
                  <span>💰</span>
                  <span>Collect Payment</span>
                </h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              
              <p className="text-gray-600 mb-6">
                Choose a payment method to collect payment for this appointment:
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => handleCollectPayment('zelle')}
                  className="w-full p-4 border-2 border-blue-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 flex items-center space-x-4"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
                    🏦
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-800">Zelle</div>
                    <div className="text-sm text-gray-600">Quick bank transfer</div>
                  </div>
                </button>
                
                <button
                  onClick={() => handleCollectPayment('cashapp')}
                  className="w-full p-4 border-2 border-green-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all duration-200 flex items-center space-x-4"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">
                    💳
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-800">CashApp</div>
                    <div className="text-sm text-gray-600">Mobile payment app</div>
                  </div>
                </button>
              </div>
              
              <div className="mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && qrCodeType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl max-w-md w-full mx-4 shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
                  {qrCodeType === 'zelle' ? (
                    <>
                      <span>🏦</span>
                      <span>Zelle Payment</span>
                    </>
                  ) : (
                    <>
                      <span>💳</span>
                      <span>CashApp Payment</span>
                    </>
                  )}
                </h3>
                <button
                  onClick={() => {
                    setShowQRModal(false);
                    setQrCodeType(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              
              <p className="text-gray-600 mb-6 text-center">
                {qrCodeType === 'zelle' 
                  ? 'Scan this QR code with your banking app to pay via Zelle.'
                  : 'Scan this QR code with your CashApp to complete the payment.'
                }
              </p>
              
              <div className="bg-gray-100 rounded-xl p-4 flex items-center justify-center mb-4">
                <img 
                  src={qrCodeType === 'zelle' ? '/zelle-qr.png' : '/CashApp-qr.png'} 
                  alt={`${qrCodeType === 'zelle' ? 'Zelle' : 'CashApp'} QR Code`} 
                  className="w-64 h-64 object-contain" 
                />
              </div>
              
              <div className="mt-6 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowQRModal(false);
                    setQrCodeType(null);
                  }}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Integration Modal */}
      {showCalendarIntegration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Calendar Integration</h3>
              <button
                onClick={() => setShowCalendarIntegration(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <CalendarIntegrationSetup 
                onAppointmentsImported={refreshAppointments}
                onClose={() => {
                  setShowCalendarIntegration(false);
                  refreshAppointments(); // Refresh when closing to pick up any new imports
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Groomer Assignment Modal */}
      <GroomerAssignmentModal
        appointment={selectedAppointment}
        isOpen={showGroomerAssignmentModal}
        onClose={() => setShowGroomerAssignmentModal(false)}
        onAssignmentUpdated={handleGroomerAssignmentUpdate}
      />
    </div>
  );
};

export default IOSAppointmentManagement;
