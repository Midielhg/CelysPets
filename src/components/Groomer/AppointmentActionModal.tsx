import React, { useState } from 'react';
import { 
  X, 
  CheckCircle, 
  XCircle, 
  Play
} from 'lucide-react';
import { GroomerService } from '../../services/groomerService';
import type { GroomerAppointment } from '../../services/groomerService';
import { useToast } from '../../contexts/ToastContext';

interface AppointmentActionModalProps {
  appointment: GroomerAppointment | null;
  isOpen: boolean;
  onClose: () => void;
  onAppointmentUpdated: () => void;
}

const AppointmentActionModal: React.FC<AppointmentActionModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onAppointmentUpdated
}) => {
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeType, setQrCodeType] = useState<'zelle' | 'cashapp' | null>(null);
  const { showToast } = useToast();

  if (!isOpen || !appointment) return null;

  const updateAppointmentStatus = async (newStatus: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled') => {
    try {
      setLoading(true);
      await GroomerService.updateAppointmentStatus(appointment.id, newStatus);
      
      const statusEmoji = newStatus === 'confirmed' ? '✅' : 
                         newStatus === 'completed' ? '🎉' : 
                         newStatus === 'in-progress' ? '🔄' :
                         newStatus === 'pending' ? '⏳' : 
                         newStatus === 'cancelled' ? '❌' : '📝';
      
      showToast(`${statusEmoji} Appointment status updated to ${newStatus}`, 'success');
      onAppointmentUpdated();
      
      // Auto-show payment collection when appointment is completed and not already paid
      console.log('🔍 Payment trigger check:', {
        newStatus,
        paymentStatus: appointment.paymentStatus,
        paymentStatusType: typeof appointment.paymentStatus,
        shouldTrigger: newStatus === 'completed' && appointment.paymentStatus !== 'paid'
      });
      
      if (newStatus === 'completed' && appointment.paymentStatus !== 'paid') {
        console.log('💰 Auto-triggering payment collection');
        showToast('💰 Ready to collect payment!', 'info');
        setTimeout(() => {
          console.log('💳 Setting showPaymentModal to true');
          setShowPaymentModal(true);
        }, 500); // Small delay for better UX
      } else {
        console.log('❌ Not showing payment modal - condition not met');
        onClose();
      }
    } catch (error) {
      console.error('Failed to update appointment status:', error);
      showToast('Failed to update appointment status', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCollectPayment = (paymentMethod: 'zelle' | 'cashapp') => {
    setShowPaymentModal(false);
    setQrCodeType(paymentMethod);
    setShowQRModal(true);
    
    if (paymentMethod === 'zelle') {
      showToast('💰 Showing Zelle QR code for payment collection', 'success');
    } else {
      showToast('💳 Showing CashApp QR code for payment collection', 'success');
    }
  };

  const markPaymentComplete = async () => {
    try {
      setLoading(true);
      await GroomerService.updatePaymentStatus(appointment.id, 'paid');
      showToast('💰 Payment marked as collected', 'success');
      setShowQRModal(false);
      setQrCodeType(null);
      onAppointmentUpdated();
    } catch (error) {
      console.error('Failed to update payment status:', error);
      showToast('Failed to update payment status', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'confirmed': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusColor = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'partial': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'unpaid': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <>
      {/* Main Action Modal */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl w-full max-w-2xl mx-2 sm:mx-4 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200/50 sticky top-0 bg-white/95 backdrop-blur-md rounded-t-2xl">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Manage Appointment</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/50 rounded-full transition-all duration-200"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Appointment Details */}
            <div className="bg-blue-50 rounded-xl p-3 sm:p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3 text-sm sm:text-base">Appointment Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                <div className="space-y-1 sm:space-y-0">
                  <p><strong>Client:</strong> {appointment.client.name}</p>
                  <p><strong>Date:</strong> {new Date(appointment.date).toLocaleDateString()}</p>
                  <p><strong>Time:</strong> {appointment.time}</p>
                </div>
                <div className="space-y-1 sm:space-y-0">
                  <p><strong>Service:</strong> {appointment.services}</p>
                  <p><strong>Amount:</strong> ${appointment.totalAmount}</p>
                  <p><strong>Phone:</strong> {appointment.client.phone}</p>
                </div>
              </div>
            </div>

            {/* Current Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <h5 className="font-medium text-gray-700 mb-2 text-sm sm:text-base">Current Status</h5>
                <span className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium border ${getStatusColor(appointment.status)}`}>
                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1).replace('-', ' ')}
                </span>
              </div>
              <div>
                <h5 className="font-medium text-gray-700 mb-2 text-sm sm:text-base">Payment Status</h5>
                <span className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium border ${getPaymentStatusColor(appointment.paymentStatus || 'unpaid')}`}>
                  {(appointment.paymentStatus || 'unpaid').charAt(0).toUpperCase() + (appointment.paymentStatus || 'unpaid').slice(1)}
                </span>
              </div>
            </div>

            {/* Status Actions */}
            <div>
              <h5 className="font-medium text-gray-700 mb-3 text-sm sm:text-base">Update Status</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                {appointment.status !== 'confirmed' && (
                  <button
                    onClick={() => updateAppointmentStatus('confirmed')}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 p-3 sm:p-3 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors disabled:opacity-50 text-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Confirm</span>
                  </button>
                )}
                
                {appointment.status === 'confirmed' && (
                  <button
                    onClick={() => updateAppointmentStatus('in-progress')}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 p-3 sm:p-3 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50 text-sm"
                  >
                    <Play className="w-4 h-4" />
                    <span>Start</span>
                  </button>
                )}

                {appointment.status === 'in-progress' && (
                  <button
                    onClick={() => updateAppointmentStatus('completed')}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 p-3 sm:p-3 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 text-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Complete</span>
                  </button>
                )}

                {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                  <button
                    onClick={() => updateAppointmentStatus('cancelled')}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 p-3 sm:p-3 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 text-sm"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                )}
              </div>
            </div>

            {/* Payment Actions */}
            {appointment.paymentStatus !== 'paid' && (
              <div>
                <h5 className="font-medium text-gray-700 mb-3 text-sm sm:text-base">Collect Payment</h5>
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="flex items-center gap-3 p-3 sm:p-4 w-full bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors"
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center text-lg">
                    💰
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-green-800 text-sm sm:text-base">Collect Payment</div>
                    <div className="text-xs sm:text-sm text-green-600">Show QR code for Zelle or CashApp</div>
                  </div>
                </button>
              </div>
            )}

            {/* Notes */}
            {appointment.notes && (
              <div>
                <h5 className="font-medium text-gray-700 mb-2 text-sm sm:text-base">Notes</h5>
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                  {appointment.notes}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end p-4 sm:p-6 border-t border-gray-200/50 bg-gray-50/80 backdrop-blur-sm rounded-b-2xl sticky bottom-0">
            <button
              onClick={onClose}
              className="px-4 sm:px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm sm:text-base"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Payment Method Selection Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[60] p-2 sm:p-4">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl w-full max-w-md mx-2 sm:mx-4 shadow-2xl border border-white/30">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center space-x-2">
                  <span>💰</span>
                  <span>Collect Payment</span>
                </h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-full p-1 transition-all duration-200"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
              
              <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
                Choose a payment method to collect payment for this appointment:
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => handleCollectPayment('zelle')}
                  className="w-full p-3 sm:p-4 border-2 border-blue-200/50 bg-blue-50/30 backdrop-blur-sm rounded-xl hover:border-blue-400/70 hover:bg-blue-50/50 transition-all duration-300 flex items-center space-x-3 sm:space-x-4 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100/80 backdrop-blur-sm rounded-lg flex items-center justify-center text-xl sm:text-2xl border border-blue-200/30">
                    🏦
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-800 text-sm sm:text-base">Zelle</div>
                    <div className="text-xs sm:text-sm text-gray-600">Quick bank transfer</div>
                  </div>
                </button>
                
                <button
                  onClick={() => handleCollectPayment('cashapp')}
                  className="w-full p-3 sm:p-4 border-2 border-green-200/50 bg-green-50/30 backdrop-blur-sm rounded-xl hover:border-green-400/70 hover:bg-green-50/50 transition-all duration-300 flex items-center space-x-3 sm:space-x-4 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100/80 backdrop-blur-sm rounded-lg flex items-center justify-center text-xl sm:text-2xl border border-green-200/30">
                    💳
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-800 text-sm sm:text-base">CashApp</div>
                    <div className="text-xs sm:text-sm text-gray-600">Mobile payment app</div>
                  </div>
                </button>
              </div>
              
              <div className="mt-4 sm:mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="w-full px-4 py-2 sm:py-3 bg-gray-100/60 backdrop-blur-sm text-gray-700 rounded-xl hover:bg-gray-200/60 transition-colors text-sm sm:text-base border border-gray-200/50"
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[60] p-2 sm:p-4">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl w-full max-w-md mx-2 sm:mx-4 shadow-2xl border border-white/30 max-h-[95vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center space-x-2">
                  {qrCodeType === 'zelle' ? (
                    <>
                      <span className="text-lg sm:text-xl">🏦</span>
                      <span>Zelle Payment</span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg sm:text-xl">💳</span>
                      <span>CashApp Payment</span>
                    </>
                  )}
                </h3>
                <button
                  onClick={() => {
                    setShowQRModal(false);
                    setQrCodeType(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-full p-1 transition-all duration-200"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
              
              <p className="text-gray-600 mb-4 sm:mb-6 text-center text-sm sm:text-base">
                {qrCodeType === 'zelle' 
                  ? 'Customer can scan this QR code with their banking app to pay via Zelle.'
                  : 'Customer can scan this QR code with their CashApp to complete the payment.'
                }
              </p>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 flex items-center justify-center mb-4 border border-gray-200/30">
                <img 
                  src={qrCodeType === 'zelle' ? '/zelle-qr.png' : '/CashApp-qr.png'} 
                  alt={`${qrCodeType === 'zelle' ? 'Zelle' : 'CashApp'} QR Code`} 
                  className="w-48 h-48 sm:w-64 sm:h-64 object-contain" 
                />
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={markPaymentComplete}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-green-500/90 backdrop-blur-sm text-white rounded-xl hover:bg-green-600/90 hover:scale-105 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 font-medium shadow-lg text-sm sm:text-base"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    'Mark as Paid'
                  )}
                </button>
                
                <button
                  onClick={() => {
                    setShowQRModal(false);
                    setQrCodeType(null);
                  }}
                  className="w-full px-4 py-2 sm:py-3 bg-gray-100/60 backdrop-blur-sm text-gray-700 rounded-xl hover:bg-gray-200/60 hover:scale-105 active:scale-[0.98] transition-all duration-200 border border-gray-200/50 text-sm sm:text-base"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AppointmentActionModal;