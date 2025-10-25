import React, { useState } from "react";
import { Minus, Plus, Trash2, ShoppingBag, X } from "lucide-react";
import { PaymentModal } from "./PaymentModal";

export const WalkIn = ({ onCreateSale }) => {
  const [cart, setCart] = useState({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [processing, setProcessing] = useState(false);

  const menuCategories = {
    breakfast: [
      { name: "Mandazi", price: 10, icon: "🥐" },
      { name: "Chapati", price: 20, icon: "🫓" },
      { name: "Samosa", price: 30, icon: "🥟" },
      { name: "Bhajia", price: 70, icon: "🍟" },
    ],
    snacks: [
      { name: "Chips (Small)", price: 70, icon: "🍟" },
      { name: "Chips (Large)", price: 100, icon: "🍟" },
      { name: "Bhajia (Small)", price: 70, icon: "🍟" },
      { name: "Bhajia (Large)", price: 100, icon: "🍟" },
      { name: "Sausage", price: 40, icon: "🌭" },
      { name: "Smokie", price: 30, icon: "🌭" },
    ],
    drinks: [
      { name: "Tea", price: 30, icon: "☕" },
      { name: "Coffee", price: 25, icon: "☕" },
      { name: "Soda 500ml", price: 70, icon: "🥤" },
      { name: "Soda 300ml", price: 45, icon: "🥤" },
    ],
  };

  const categories = [
    { id: "all", name: "All", icon: "🍽️" },
    { id: "breakfast", name: "Breakfast", icon: "🌅" },
    { id: "snacks", name: "Snacks", icon: "🍟" },
    { id: "drinks", name: "Drinks", icon: "☕" },
  ];

  const allItems = Object.entries(menuCategories).flatMap(([category, items]) =>
    items.map((item) => ({ ...item, category }))
  );

  const filteredItems =
    activeCategory === "all"
      ? allItems
      : allItems.filter((item) => item.category === activeCategory);

  const updateQuantity = (itemName, newQuantity) => {
    if (newQuantity <= 0) {
      const newCart = { ...cart };
      delete newCart[itemName];
      setCart(newCart);
    } else {
      setCart({ ...cart, [itemName]: newQuantity });
    }
  };

  const cartItems = Object.entries(cart).map(([itemName, quantity]) => {
    const item = allItems.find((i) => i.name === itemName);
    return { ...item, quantity, total: item.price * quantity };
  });

  const total = cartItems.reduce((sum, item) => sum + item.total, 0);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handlePaymentComplete = async (paymentDetails) => {
    setProcessing(true);
    try {
      const isSplit =
        paymentDetails.mpesaAmount > 0 && paymentDetails.cashAmount > 0;

      const saleData = {
        type: "walk-in",
        items: cartItems.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          total: i.total,
        })),
        totalAmount: total,
        paymentMethod: isSplit
          ? "split"
          : paymentDetails.mpesaAmount > 0
          ? "mpesa"
          : "cash",
        isPaid: true,
        date: new Date().toISOString().split("T")[0],
      };

      // Add splitPayment only if it's a split payment
      if (isSplit) {
        saleData.splitPayment = {
          mpesa: Number(paymentDetails.mpesaAmount),
          cash: Number(paymentDetails.cashAmount),
        };
      }

      console.log("Sending sale data:", saleData); // Debug log

      await onCreateSale(saleData);
      setCart({});
      setShowPaymentModal(false);
      setShowCart(false);

      // Simple success notification without toast library
      alert("Sale recorded successfully! 🎉");
    } catch (error) {
      console.error("Sale error:", error);
      alert(`Failed to record sale: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };
  return (
    <div className="space-y-4 pb-32">
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        total={total}
        onComplete={handlePaymentComplete}
        allowCredit={false}
      />

      {/* Cart Drawer */}
      {showCart && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          onClick={() => setShowCart(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-red-800 text-white p-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">Your Cart</h3>
                  <p className="text-indigo-100 text-sm">{itemCount} items</p>
                </div>
                <button
                  onClick={() => setShowCart(false)}
                  className="p-2 hover:bg-white/20 rounded-full"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[calc(80vh-200px)] p-6">
              {cartItems.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🛒</div>
                  <p className="text-gray-500 font-medium">
                    Your cart is empty
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div
                      key={item.name}
                      className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-4 border-2 border-indigo-100"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{item.icon}</span>
                        <div className="flex-1">
                          <p className="font-bold text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-600">
                            KSh {item.price} × {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-indigo-600 text-lg">
                            KSh {item.total}
                          </p>
                          <button
                            onClick={() => updateQuantity(item.name, 0)}
                            className="text-red-500 text-xs font-medium hover:text-red-600 mt-1"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="sticky bottom-0 bg-white border-t-2 border-gray-200 p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-900">Total</span>
                  <span className="text-3xl font-bold text-indigo-600">
                    KSh {total.toLocaleString()}
                  </span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setCart({})}
                    className="px-6 py-4 rounded-xl border-2 border-red-300 text-red-600 font-bold hover:bg-red-50"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => {
                      setShowCart(false);
                      setShowPaymentModal(true);
                    }}
                    className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-lg"
                  >
                    Proceed to Payment
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-red-800 rounded-3xl shadow-xl overflow-hidden">
        <div className="p-8 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative z-10">
            <h2 className="text-4xl font-bold text-white mb-2">
              Walk-In Sales
            </h2>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white rounded-2xl shadow-sm p-3">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${
                activeCategory === category.id
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <span className="text-xl">{category.icon}</span>
              <span>{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const quantity = cart[item.name] || 0;
          return (
            <div
              key={item.name}
              className={`bg-white rounded-2xl shadow-sm hover:shadow-md transition-all p-5 ${
                quantity > 0 ? "ring-2 ring-indigo-500 shadow-lg" : ""
              }`}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="text-5xl">{item.icon}</div>
                <div className="flex-1">
                  <h4 className="font-bold text-lg text-gray-900 mb-1">
                    {item.name}
                  </h4>
                  <p className="text-2xl font-bold text-indigo-600">
                    KSh {item.price}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.name, quantity - 1)}
                  disabled={quantity === 0}
                  className="w-11 h-11 rounded-xl bg-gray-200 hover:bg-gray-300 disabled:opacity-30 flex items-center justify-center transition-colors"
                >
                  <Minus size={20} />
                </button>
                <input
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(e) =>
                    updateQuantity(item.name, parseInt(e.target.value) || 0)
                  }
                  className="flex-1 h-11 text-center border-2 border-gray-300 rounded-xl font-bold text-lg focus:border-indigo-500 focus:outline-none"
                />
                <button
                  onClick={() => updateQuantity(item.name, quantity + 1)}
                  className="w-11 h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md hover:shadow-lg transition-all"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Cart Button */}
      {cartItems.length > 0 && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-2xl p-5 flex items-center gap-3 hover:scale-110 transition-transform z-30"
        >
          <div className="relative">
            <ShoppingBag size={28} />
            <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {itemCount}
            </span>
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium opacity-90">View Cart</p>
            <p className="text-lg font-bold">KSh {total.toLocaleString()}</p>
          </div>
        </button>
      )}
    </div>
  );
};
