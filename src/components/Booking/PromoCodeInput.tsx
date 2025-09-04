import React, { useState } from 'react';
import { Check, Loader2, X, Tag } from 'lucide-react';
import { apiUrl } from '../../config/api';

interface PromoCodeInputProps {
  onPromoCodeApplied: (discount: number, promoCode: string) => void;
  onPromoCodeRemoved: () => void;
  totalAmount: number;
  customerEmail?: string;
}

interface PromoCodeValidationResponse {
  valid: boolean;
  discountAmount: number;
  message: string;
  promoCode?: {
    id: number;
    code: string;
    name: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
  };
}

const PromoCodeInput: React.FC<PromoCodeInputProps> = ({
  onPromoCodeApplied,
  onPromoCodeRemoved,
  totalAmount,
  customerEmail
}) => {
  const [promoCode, setPromoCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<PromoCodeValidationResponse | null>(null);
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);

  const validatePromoCode = async () => {
    if (!promoCode.trim()) return;

    setIsValidating(true);
    try {
      console.log('🎯 PROMO DEBUG - Validating code:', promoCode.trim().toUpperCase());
      console.log('🎯 PROMO DEBUG - Total amount:', totalAmount);
      console.log('🎯 PROMO DEBUG - API URL:', apiUrl('/promo-codes/validate'));
      
      const response = await fetch(apiUrl('/promo-codes/validate'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: promoCode.trim().toUpperCase(),
          totalAmount: totalAmount,
          customerEmail: customerEmail || 'guest@example.com'
        }),
      });

      console.log('🎯 PROMO DEBUG - Response status:', response.status);
      console.log('🎯 PROMO DEBUG - Response ok:', response.ok);
      
      const result: PromoCodeValidationResponse = await response.json();
      console.log('🎯 PROMO DEBUG - Response data:', result);
      
      setValidationResult(result);

      if (result.valid && result.promoCode) {
        setAppliedPromoCode(result.promoCode.code);
        onPromoCodeApplied(result.discountAmount, result.promoCode.code);
      }
    } catch (error) {
      console.error('Error validating promo code:', error);
      setValidationResult({
        valid: false,
        discountAmount: 0,
        message: 'Failed to validate promo code. Please try again.'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const removePromoCode = () => {
    setPromoCode('');
    setValidationResult(null);
    setAppliedPromoCode(null);
    onPromoCodeRemoved();
  };

  return (
    <div className="border border-amber-200/50 p-4 rounded-xl bg-white/50 backdrop-blur-sm w-full">
      <div className="flex items-center gap-2 mb-3">
        <Tag className="h-5 w-5 text-amber-600" />
        <h3 className="font-medium text-amber-900">Discount Code</h3>
      </div>

      {!appliedPromoCode ? (
        <div className="space-y-3">
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => {
                setPromoCode(e.target.value.toUpperCase());
                setValidationResult(null);
              }}
              placeholder="ENTER PROMO CODE"
              className="w-full px-3 py-2.5 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white/70 backdrop-blur-sm uppercase text-center placeholder:text-gray-400 placeholder:text-xs font-medium text-sm"
              disabled={isValidating}
            />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!appliedPromoCode) {
                  validatePromoCode();
                }
              }}
              disabled={!promoCode.trim() || isValidating}
              className="w-full px-4 py-2.5 bg-slate-500 hover:bg-slate-600 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-300 font-medium text-sm"
            >
              {isValidating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : (
                'Apply'
              )}
            </button>
          </div>

          {validationResult && (
            <div className={`p-3 rounded-lg flex items-start gap-2 ${
              validationResult.valid 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              {validationResult.valid ? (
                <Check className="h-4 w-4 text-green-600 mt-0.5" />
              ) : (
                <X className="h-4 w-4 text-red-600 mt-0.5" />
              )}
              <div>
                <p className={`text-sm font-medium ${
                  validationResult.valid ? 'text-green-800' : 'text-red-800'
                }`}>
                  {validationResult.message}
                </p>
                {validationResult.valid && validationResult.discountAmount > 0 && (
                  <p className="text-sm text-green-700 mt-1">
                    Discount: ${validationResult.discountAmount.toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                {appliedPromoCode} applied
              </span>
            </div>
            <button
              onClick={removePromoCode}
              className="text-sm text-green-700 hover:text-green-900 underline"
            >
              Remove
            </button>
          </div>
          {validationResult?.discountAmount && (
            <p className="text-sm text-green-700 mt-1">
              Discount: ${validationResult.discountAmount.toFixed(2)}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default PromoCodeInput;
