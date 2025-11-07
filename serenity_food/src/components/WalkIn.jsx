import React, { useState, useEffect } from "react";
import { Minus, Plus, Trash2, ShoppingBag, X } from "lucide-react";
import { PaymentModal } from "./PaymentModal";
import { toast } from "react-toastify";

const API_BASE_URL = "http://localhost:5000/serenityfoodcourt";

export const WalkIn = ({ onCreateSale }) => {
  const [cart, setCart] = useState({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [processing, setProcessing] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token") || "";

  // Fetch menu items and categories
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch categories
      const categoriesResponse = await fetch(`${API_BASE_URL}/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const categoriesData = await categoriesResponse.json();

      // Fetch menu items
      const menuItemsResponse = await fetch(`${API_BASE_URL}/menu-items`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const menuItemsData = await menuItemsResponse.json();

      if (categoriesData.success && menuItemsData.success) {
        const activeCategories = categoriesData.data.filter(
          (cat) => cat.isActive
        );
        setCategories([
          { _id: "all", name: "All Items", icon: "🍽️" },
          ...activeCategories,
        ]);
        setMenuItems(menuItemsData.data.filter((item) => item.isActive));
        toast.success("Menu loaded successfully!");
      } else {
        setError("Failed to load data");
        toast.error("Failed to load data");
      }
    } catch (err) {
      setError("Failed to fetch menu data");
      toast.error("Failed to fetch menu data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems =
    activeCategory === "all"
      ? menuItems
      : menuItems.filter(
          (item) => item.category && item.category._id === activeCategory
        );

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0 || newQuantity === "") {
      const newCart = { ...cart };
      delete newCart[itemId];
      setCart(newCart);
    } else {
      setCart({ ...cart, [itemId]: newQuantity });
    }
  };

  const cartItems = Object.entries(cart).map(([itemId, quantity]) => {
    const item = menuItems.find((i) => i._id === itemId);
    return { ...item, quantity, total: item.price * quantity };
  });

  const total = cartItems.reduce((sum, item) => sum + item.total, 0);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handlePaymentComplete = async (paymentDetails) => {
    setProcessing(true);
    const loadingToast = toast.loading("Processing sale...");

    try {
      const isSplit =
        paymentDetails.mpesaAmount > 0 && paymentDetails.cashAmount > 0;

      const saleData = {
        type: "walk-in",
        items: cartItems.map((i) => ({
          menuItem: i._id,
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

      if (isSplit) {
        saleData.splitPayment = {
          mpesa: Number(paymentDetails.mpesaAmount),
          cash: Number(paymentDetails.cashAmount),
        };
      }

      await onCreateSale(saleData);
      setCart({});
      setShowPaymentModal(false);
      setShowCart(false);

      toast.update(loadingToast, {
        render: "Sale recorded successfully! 🎉",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Sale error:", error);
      toast.update(loadingToast, {
        render: `Failed to record sale: ${error.message}`,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
        <p className="text-red-600 font-medium">{error}</p>
        <button
          onClick={fetchData}
          className="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

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
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">Your Cart</h3>
                  <p className="text-indigo-100 text-sm">{itemCount} items</p>
                </div>
                <button
                  onClick={() => setShowCart(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
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
                      key={item._id}
                      className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-4 border-2 border-indigo-100 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-4xl">{item.icon || "🍽️"}</span>
                        <div className="flex-1">
                          <p className="font-bold text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-600">
                            KSh {item.price} × {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-indigo-600 text-lg">
                            KSh {item.total.toLocaleString()}
                          </p>
                          <button
                            onClick={() => updateQuantity(item._id, 0)}
                            className="text-red-500 text-xs font-medium hover:text-red-600 mt-1 transition-colors"
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
                    onClick={() => {
                      setCart({});
                      toast.info("Cart cleared");
                    }}
                    className="px-6 py-4 rounded-xl border-2 border-red-300 text-red-600 font-bold hover:bg-red-50 transition-colors"
                  >
                    Clear Cart
                  </button>
                  <button
                    onClick={() => {
                      setShowCart(false);
                      setShowPaymentModal(true);
                    }}
                    disabled={processing}
                    className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50"
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
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl shadow-xl overflow-hidden">
        <div className="p-8 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
          <div className="relative z-10">
            <h2 className="text-4xl font-bold text-white mb-2">
              Walk-In Sales
            </h2>
            <p className="text-indigo-100 text-lg">
              Quick and easy point of sale
            </p>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category._id}
              onClick={() => setActiveCategory(category._id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all duration-200 ${
                activeCategory === category._id
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-102"
              }`}
            >
              <span className="text-2xl">{category.icon || "📦"}</span>
              <span>{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredItems.map((item) => {
          const quantity = cart[item._id] || 0;
          return (
            <div
              key={item._id}
              className={`bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 flex flex-col items-center ${
                quantity > 0
                  ? "ring-4 ring-indigo-400 shadow-2xl scale-105"
                  : "hover:scale-105"
              }`}
            >
              {/* Icon at the top - larger */}
              <div className="text-7xl mb-4">{item.icon || "🍽️"}</div>

              {/* Item name */}
              <h4 className="font-bold text-lg text-gray-900 text-center mb-2 min-h-[3.5rem] flex items-center">
                {item.name}
              </h4>

              {/* Price */}
              <p className="text-2xl font-bold text-indigo-600 mb-4">
                KSh {item.price}
              </p>

              {/* Quantity Input */}
              <div className="w-full">
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={quantity === 0 ? "" : quantity}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") {
                      updateQuantity(item._id, 0);
                    } else {
                      updateQuantity(item._id, parseInt(value) || 0);
                    }
                  }}
                  onFocus={(e) => {
                    if (e.target.value === "0") {
                      e.target.value = "";
                    }
                  }}
                  placeholder="0"
                  className="w-full h-14 text-center border-3 border-gray-300 rounded-xl font-bold text-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200 focus:outline-none transition-all touch-manipulation"
                />

                {/* Quick add buttons */}
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item._id, quantity + 1)}
                    className="py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-sm hover:shadow-lg transition-all hover:scale-105 touch-manipulation"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item._id, quantity + 5)}
                    className="py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold text-sm hover:shadow-lg transition-all hover:scale-105 touch-manipulation"
                  >
                    +5
                  </button>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item._id, 0)}
                    disabled={quantity === 0}
                    className="py-2 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold text-sm hover:shadow-lg transition-all hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Active indicator */}
              {quantity > 0 && (
                <div className="mt-3 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-bold">
                  {quantity} in cart
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-300">
          <div className="text-6xl mb-4">🍽️</div>
          <p className="text-lg font-medium text-gray-600">
            No items in this category
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Try selecting a different category
          </p>
        </div>
      )}

      {/* Floating Cart Button */}
      {cartItems.length > 0 && (
        <button
          type="button"
          onClick={() => setShowCart(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-2xl p-6 flex items-center gap-3 hover:scale-110 transition-all duration-300 z-30 animate-bounce touch-manipulation"
        >
          <div className="relative">
            <ShoppingBag size={32} />
            <span className="absolute -top-3 -right-3 bg-pink-500 text-white text-sm font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-lg">
              {itemCount}
            </span>
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium opacity-90">View Cart</p>
            <p className="text-xl font-bold">KSh {total.toLocaleString()}</p>
          </div>
        </button>
      )}
    </div>
  );
};
