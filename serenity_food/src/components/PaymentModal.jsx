import React, { useState, useEffect } from "react";
import {
  Menu,
  Home,
  ShoppingCart,
  Truck,
  Package,
  CreditCard,
  Banknote,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Minus,
  Plus,
  Trash2,
  User,
  Calendar,
  Filter,
  ChevronDown,
  ChevronUp,
  Download,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

// Payment Modal Component
export const PaymentModal = ({
  isOpen,
  onClose,
  total,
  onComplete,
  allowCredit = false,
}) => {
  const [paymentType, setPaymentType] = useState("mpesa");
  const [mpesaAmount, setMpesaAmount] = useState(total);
  const [cashAmount, setCashAmount] = useState(0);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPaymentType("mpesa");
      setMpesaAmount(total);
      setCashAmount(0);
    }
  }, [isOpen, total]);

  const handleAmountChange = (field, value) => {
    const numValue = parseFloat(value) || 0;
    if (field === "mpesa") {
      const newMpesa = Math.min(numValue, total);
      setMpesaAmount(newMpesa);
      setCashAmount(Math.max(0, total - newMpesa));
    } else {
      const newCash = Math.min(numValue, total);
      setCashAmount(newCash);
      setMpesaAmount(Math.max(0, total - newCash));
    }
  };

  const handlePaymentTypeChange = (type) => {
    setPaymentType(type);
    if (type === "mpesa") {
      setMpesaAmount(total);
      setCashAmount(0);
    } else if (type === "cash") {
      setCashAmount(total);
      setMpesaAmount(0);
    } else if (type === "split") {
      const half = total / 2;
      setMpesaAmount(half);
      setCashAmount(half);
    }
  };

  const totalPaid = mpesaAmount + cashAmount;
  const isValid = Math.abs(totalPaid - total) < 0.01;
  const isSplit = mpesaAmount > 0 && cashAmount > 0;

  const handleSubmit = async () => {
    if (!isValid) {
      toast.error("Payment amounts don't match total!");
      return;
    }

    setProcessing(true);
    try {
      const paymentData = isSplit
        ? {
            method: "split",
            mpesaAmount,
            cashAmount,
            splitDetails: { mpesa: mpesaAmount, cash: cashAmount },
          }
        : { method: paymentType };

      await onComplete(paymentData);
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white p-6 sm:rounded-t-3xl rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">Complete Payment</h3>
              <p className="text-white/90 text-sm mt-1">
                Choose how customer pays
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Total Amount */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-200">
            <p className="text-sm font-semibold text-gray-600 mb-1">
              Total Amount
            </p>
            <p className="text-4xl font-bold text-gray-900">
              KSh {total.toLocaleString()}
            </p>
          </div>

          {/* Quick Payment Buttons */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-700">
              Quick Select
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handlePaymentTypeChange("mpesa")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  paymentType === "mpesa" && !isSplit
                    ? "border-green-500 bg-green-50 shadow-lg scale-105"
                    : "border-gray-200 hover:border-green-300"
                }`}
              >
                <div className="text-3xl mb-1">📱</div>
                <p className="font-bold text-xs">M-PESA</p>
                <p className="text-xs text-gray-500">Full</p>
              </button>
              <button
                onClick={() => handlePaymentTypeChange("cash")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  paymentType === "cash" && !isSplit
                    ? "border-blue-500 bg-blue-50 shadow-lg scale-105"
                    : "border-gray-200 hover:border-blue-300"
                }`}
              >
                <div className="text-3xl mb-1">💵</div>
                <p className="font-bold text-xs">Cash</p>
                <p className="text-xs text-gray-500">Full</p>
              </button>
              <button
                onClick={() => handlePaymentTypeChange("split")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  paymentType === "split" || isSplit
                    ? "border-purple-500 bg-purple-50 shadow-lg scale-105"
                    : "border-gray-200 hover:border-purple-300"
                }`}
              >
                <div className="text-3xl mb-1">💳</div>
                <p className="font-bold text-xs">Split</p>
                <p className="text-xs text-gray-500">Mix</p>
              </button>
            </div>
          </div>

          {/* Payment Amount Inputs */}
          <div className="space-y-4">
            <label className="text-sm font-bold text-gray-700">
              Payment Breakdown
            </label>

            {/* M-PESA Amount */}
            <div
              className={`rounded-2xl p-4 border-2 transition-all ${
                mpesaAmount > 0
                  ? "bg-green-50 border-green-300"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📱</span>
                  <span className="font-bold text-gray-700">M-PESA</span>
                </div>
                {mpesaAmount > 0 && (
                  <button
                    onClick={() => handleAmountChange("mpesa", 0)}
                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 font-semibold">KSh</span>
                <input
                  type="number"
                  value={mpesaAmount}
                  onChange={(e) => handleAmountChange("mpesa", e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-green-300 focus:border-green-500 focus:outline-none font-bold text-xl bg-white"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Cash Amount */}
            <div
              className={`rounded-2xl p-4 border-2 transition-all ${
                cashAmount > 0
                  ? "bg-blue-50 border-blue-300"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💵</span>
                  <span className="font-bold text-gray-700">Cash</span>
                </div>
                {cashAmount > 0 && (
                  <button
                    onClick={() => handleAmountChange("cash", 0)}
                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 font-semibold">KSh</span>
                <input
                  type="number"
                  value={cashAmount}
                  onChange={(e) => handleAmountChange("cash", e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-blue-300 focus:border-blue-500 focus:outline-none font-bold text-xl bg-white"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div
            className={`p-5 rounded-xl border-2 transition-all ${
              isValid
                ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-400"
                : "bg-gradient-to-r from-red-50 to-pink-50 border-red-400"
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-gray-700">Total Paying:</span>
              <span className="text-2xl font-bold flex items-center gap-2">
                {isValid ? (
                  <span className="text-green-600">✓</span>
                ) : (
                  <span className="text-red-600">✗</span>
                )}
                <span className={isValid ? "text-green-700" : "text-red-700"}>
                  KSh {totalPaid.toLocaleString()}
                </span>
              </span>
            </div>
            {!isValid && (
              <p className="text-sm text-red-600 font-semibold text-right">
                {totalPaid > total ? "Over" : "Under"} by KSh{" "}
                {Math.abs(totalPaid - total).toFixed(2)}
              </p>
            )}
            {isValid && isSplit && (
              <p className="text-sm text-green-600 font-medium text-right">
                Split: M-PESA {mpesaAmount} + Cash {cashAmount}
              </p>
            )}
          </div>

          {/* Credit Option */}
          {allowCredit && (
            <button
              onClick={() => {
                setMpesaAmount(0);
                setCashAmount(0);
                setPaymentType("credit");
              }}
              className={`w-full p-5 rounded-xl border-2 transition-all ${
                paymentType === "credit" && totalPaid === 0
                  ? "border-amber-500 bg-amber-50 shadow-lg"
                  : "border-gray-200 hover:border-amber-300"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center">
                  <Clock size={24} className="text-white" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-bold text-gray-900">Pay Later (Credit)</p>
                  <p className="text-sm text-gray-600">
                    Collect payment tomorrow
                  </p>
                </div>
              </div>
            </button>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-4 rounded-xl border-2 border-gray-300 font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={processing || !isValid}
              className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white font-bold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {processing ? "Processing..." : "Confirm Payment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
