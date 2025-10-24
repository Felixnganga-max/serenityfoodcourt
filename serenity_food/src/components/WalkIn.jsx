import React, { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { PaymentModal } from "./PaymentModal";

export const WalkIn = ({ onCreateSale }) => {
  const [cart, setCart] = useState({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
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
    { id: "all", name: "All Items" },
    { id: "breakfast", name: "Breakfast" },
    { id: "snacks", name: "Snacks" },
    { id: "drinks", name: "Drinks" },
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

  const handlePaymentComplete = async (paymentDetails) => {
    setProcessing(true);
    try {
      await onCreateSale({
        type: "walk-in",
        items: cartItems.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          total: i.total, // Add this - backend expects it
        })),
        totalAmount: total, // Changed from 'total' to 'totalAmount'
        paymentMethod: paymentDetails.method,
        isPaid: true,
        date: new Date().toISOString().split("T")[0], // Add this
      });
      setCart({});
      setShowPaymentModal(false);
      alert("✅ Sale recorded successfully!");
    } catch (error) {
      console.error("Sale error details:", error);
      alert(`❌ Failed to record sale: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        total={total}
        onComplete={handlePaymentComplete}
        allowCredit={false}
      />

      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-6 shadow-lg text-white mb-6">
          <h2 className="text-3xl md:text-4xl font-bold">Walk-In Sales</h2>
          <p className="text-lg opacity-90 mt-1">Add items to cart</p>
        </div>

        <div className="bg-white rounded-xl p-3 shadow-md mb-6">
          <div className="flex gap-2 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-6 py-2.5 rounded-lg font-bold whitespace-nowrap transition-all ${
                  activeCategory === category.id
                    ? "bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Menu Items</h3>
            <div className="space-y-2">
              {filteredItems.map((item) => {
                const quantity = cart[item.name] || 0;
                return (
                  <div
                    key={item.name}
                    className={`bg-white rounded-xl p-4 shadow-md transition-all ${
                      quantity > 0 ? "ring-2 ring-blue-500" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-4xl flex-shrink-0">{item.icon}</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-lg text-gray-900 truncate">
                          {item.name}
                        </h4>
                        <p className="text-blue-600 font-bold text-lg">
                          KSh {item.price}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() =>
                            updateQuantity(item.name, quantity - 1)
                          }
                          disabled={quantity === 0}
                          className="w-10 h-10 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-30 flex items-center justify-center"
                        >
                          <Minus size={20} />
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={quantity}
                          onChange={(e) =>
                            updateQuantity(
                              item.name,
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-16 h-10 text-center border-2 border-gray-300 rounded-lg font-bold text-lg focus:border-blue-500 focus:outline-none"
                        />
                        <button
                          onClick={() =>
                            updateQuantity(item.name, quantity + 1)
                          }
                          className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600 text-white flex items-center justify-center"
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="md:sticky md:top-6 h-fit">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-900">Cart</h3>
                {cartItems.length > 0 && (
                  <button
                    onClick={() => setCart({})}
                    className="text-red-600 hover:text-red-700 font-semibold text-sm flex items-center gap-1"
                  >
                    <Trash2 size={16} />
                    Clear All
                  </button>
                )}
              </div>

              {cartItems.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🛒</div>
                  <p className="text-gray-500 font-medium">
                    No items in cart yet
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                    {cartItems.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{item.icon}</span>
                          <div>
                            <p className="font-bold text-gray-900">
                              {item.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {item.quantity} × KSh {item.price}
                            </p>
                          </div>
                        </div>
                        <p className="font-bold text-blue-600 text-lg">
                          KSh {item.total}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t-2 border-gray-200 pt-4 mb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-gray-900">
                        Total
                      </span>
                      <span className="text-3xl font-bold text-blue-600">
                        KSh {total}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowPaymentModal(true)}
                    disabled={processing}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 rounded-xl font-bold text-xl shadow-lg hover:shadow-xl disabled:opacity-50"
                  >
                    {processing ? "Processing..." : "Process Payment"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
