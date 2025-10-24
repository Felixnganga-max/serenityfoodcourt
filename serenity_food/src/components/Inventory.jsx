import React, { useState, useMemo } from "react";
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
} from "lucide-react";

export const Inventory = () => {
  const [inventory, setInventory] = useState([
    {
      name: "Coffee Beans",
      quantity: 50,
      unit: "kg",
      image:
        "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=300&fit=crop",
    },
    {
      name: "Milk",
      quantity: 100,
      unit: "liters",
      image:
        "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=300&fit=crop",
    },
    {
      name: "Sugar",
      quantity: 30,
      unit: "kg",
      image:
        "https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=400&h=300&fit=crop",
    },
    {
      name: "Flour",
      quantity: 80,
      unit: "kg",
      image:
        "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop",
    },
    {
      name: "Butter",
      quantity: 25,
      unit: "kg",
      image:
        "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&h=300&fit=crop",
    },
    {
      name: "Eggs",
      quantity: 200,
      unit: "pieces",
      image:
        "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&h=300&fit=crop",
    },
  ]);

  const updateQuantity = (index, change) => {
    const newInventory = [...inventory];
    newInventory[index].quantity = Math.max(
      0,
      newInventory[index].quantity + change
    );
    setInventory(newInventory);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl font-bold text-gray-900 mb-2">
          Inventory Management
        </h2>
        <p className="text-gray-600 text-lg">
          Track and manage your cafe's stock
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {inventory.map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl shadow-xl overflow-hidden transform hover:scale-105 transition-all duration-300"
          >
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {item.name}
              </h3>
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl font-bold text-emerald-600">
                  {item.quantity} {item.unit}
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => updateQuantity(idx, -5)}
                  className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  - 5
                </button>
                <button
                  onClick={() => updateQuantity(idx, 5)}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  + 5
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
