// Credit Management Modal Component
import React, { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";

export const CreditManagementModal = ({
  isOpen,
  onClose,
  credits,
  onCollectCredit,
}) => {
  const [selectedCredit, setSelectedCredit] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [mpesaCode, setMpesaCode] = useState("");
  const [showError, setShowError] = useState(false);

  if (!isOpen) return null;

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  const todayCredits = credits.filter((c) => c.date === today);
  const yesterdayCredits = credits.filter((c) => c.date === yesterday);
  const olderCredits = credits.filter(
    (c) => c.date !== today && c.date !== yesterday
  );

  const totalOutstanding = credits.reduce((sum, c) => sum + c.amount, 0);

  const handleCollect = () => {
    if (!paymentMethod) {
      setShowError(true);
      return;
    }
    if (paymentMethod === "mpesa" && !mpesaCode.trim()) {
      setShowError(true);
      return;
    }

    onCollectCredit(selectedCredit, paymentMethod, mpesaCode);
    setSelectedCredit(null);
    setPaymentMethod(null);
    setMpesaCode("");
    setShowError(false);
  };

  const CreditCard = ({ credit, index }) => (
    <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border-l-4 border-amber-500">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <p className="font-bold text-gray-900 text-lg">
            {credit.customerName}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {credit.items.join(", ")}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(credit.timestamp).toLocaleString()}
          </p>
        </div>
        <span className="font-bold text-amber-600 text-xl ml-4">
          KSh {credit.amount.toLocaleString()}
        </span>
      </div>
      <button
        onClick={() => setSelectedCredit(index)}
        className="mt-3 w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 rounded-lg font-bold hover:shadow-lg transition-all"
      >
        Collect Payment
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-white">
                Credit Management
              </h2>
              <p className="text-orange-100 mt-1">
                Total Outstanding: KSh {totalOutstanding.toLocaleString()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {credits.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                All Clear! 🎉
              </h3>
              <p className="text-gray-600">
                No outstanding credits. Great job collecting payments!
              </p>
            </div>
          ) : (
            <>
              {selectedCredit === null ? (
                <div className="space-y-6">
                  {yesterdayCredits.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <AlertCircle className="text-red-600" size={24} />
                        <h3 className="text-xl font-bold text-red-600">
                          Yesterday's Credits - URGENT! (
                          {yesterdayCredits.length})
                        </h3>
                      </div>
                      <div className="space-y-3 mb-4">
                        {yesterdayCredits.map((credit, idx) => (
                          <CreditCard
                            key={idx}
                            credit={credit}
                            index={credits.indexOf(credit)}
                          />
                        ))}
                      </div>
                      <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 mb-6">
                        <p className="text-red-800 font-bold text-center">
                          ⚠️ Please visit:{" "}
                          {yesterdayCredits
                            .map((c) => c.customerName)
                            .join(", ")}{" "}
                          to collect payment
                        </p>
                      </div>
                    </div>
                  )}

                  {olderCredits.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <AlertCircle className="text-red-700" size={24} />
                        <h3 className="text-xl font-bold text-red-700">
                          Overdue Credits - ACTION REQUIRED! (
                          {olderCredits.length})
                        </h3>
                      </div>
                      <div className="space-y-3 mb-4">
                        {olderCredits.map((credit, idx) => (
                          <CreditCard
                            key={idx}
                            credit={credit}
                            index={credits.indexOf(credit)}
                          />
                        ))}
                      </div>
                      <div className="bg-red-100 border-2 border-red-400 rounded-xl p-4 mb-6">
                        <p className="text-red-900 font-bold text-center">
                          🚨 OVERDUE: Visit{" "}
                          {olderCredits.map((c) => c.customerName).join(", ")}{" "}
                          immediately!
                        </p>
                      </div>
                    </div>
                  )}

                  {todayCredits.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4">
                        Today's Credits ({todayCredits.length})
                      </h3>
                      <div className="space-y-3">
                        {todayCredits.map((credit, idx) => (
                          <CreditCard
                            key={idx}
                            credit={credit}
                            index={credits.indexOf(credit)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <button
                    onClick={() => {
                      setSelectedCredit(null);
                      setPaymentMethod(null);
                      setMpesaCode("");
                      setShowError(false);
                    }}
                    className="text-gray-600 hover:text-gray-900 font-semibold flex items-center gap-2 mb-4"
                  >
                    ← Back to Credits
                  </button>

                  <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-6 mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {credits[selectedCredit].customerName}
                    </h3>
                    <p className="text-gray-600 mb-2">
                      {credits[selectedCredit].items.join(", ")}
                    </p>
                    <p className="text-3xl font-bold text-amber-600">
                      KSh {credits[selectedCredit].amount.toLocaleString()}
                    </p>
                  </div>

                  <p className="text-gray-700 font-semibold mb-4">
                    How did they pay?
                  </p>

                  <button
                    onClick={() => {
                      setPaymentMethod("mpesa");
                      setShowError(false);
                    }}
                    className={`w-full p-5 rounded-xl border-2 transition-all duration-300 flex items-center gap-4 ${
                      paymentMethod === "mpesa"
                        ? "border-green-500 bg-green-50 shadow-lg scale-105"
                        : "border-gray-200 hover:border-green-300 hover:bg-green-50"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                      <CreditCard size={24} className="text-white" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-bold text-gray-900 text-lg">M-PESA</p>
                      <p className="text-sm text-gray-600">
                        Mobile money payment
                      </p>
                    </div>
                    {paymentMethod === "mpesa" && (
                      <CheckCircle size={24} className="text-green-500" />
                    )}
                  </button>

                  {paymentMethod === "mpesa" && (
                    <div className="ml-16 -mt-2 mb-4">
                      <input
                        type="text"
                        placeholder="Enter M-PESA Code"
                        value={mpesaCode}
                        onChange={(e) => {
                          setMpesaCode(e.target.value.toUpperCase());
                          setShowError(false);
                        }}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none font-mono"
                      />
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setPaymentMethod("cash");
                      setShowError(false);
                    }}
                    className={`w-full p-5 rounded-xl border-2 transition-all duration-300 flex items-center gap-4 ${
                      paymentMethod === "cash"
                        ? "border-emerald-500 bg-emerald-50 shadow-lg scale-105"
                        : "border-gray-200 hover:border-emerald-300 hover:bg-emerald-50"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Banknote size={24} className="text-white" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-bold text-gray-900 text-lg">Cash</p>
                      <p className="text-sm text-gray-600">Physical currency</p>
                    </div>
                    {paymentMethod === "cash" && (
                      <CheckCircle size={24} className="text-emerald-500" />
                    )}
                  </button>

                  {showError && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle size={20} className="text-red-500" />
                      <p className="text-sm text-red-700 font-semibold">
                        {!paymentMethod
                          ? "Please select payment method"
                          : "Please enter M-PESA code"}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleCollect}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-bold text-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all mt-6"
                  >
                    Confirm Payment Collected
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
