import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  Home,
  ShoppingCart,
  Truck,
  Package,
  FileText,
  LogOut,
  Shield,
  User,
  DollarSign,
  Users,
  Settings,
  X,
} from "lucide-react";

export const Sidebar = ({
  activeTab,
  setActiveTab,
  sidebarOpen,
  setSidebarOpen,
}) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/account");
  };

  // Define navigation items based on role
  const getNavItems = () => {
    if (!user) return [];

    const baseItems = {
      manager: [
        { icon: Home, label: "Dashboard", tabName: "dashboard" },
        { icon: ShoppingCart, label: "Walk-In Sales", tabName: "walkin" },
        { icon: Truck, label: "Outside Catering", tabName: "catering" },
        { icon: FileText, label: "Sales Reports", tabName: "reports" },
        { icon: Package, label: "Inventory", tabName: "inventory" },
        { icon: DollarSign, label: "Smart Manager", tabName: "expenses" },
        { icon: Users, label: "User Management", tabName: "users" },
      ],
      "shop-attendant": [
        { icon: Home, label: "Dashboard", tabName: "dashboard" },
        { icon: ShoppingCart, label: "Walk-In Sales", tabName: "walkin" },
        { icon: Truck, label: "Outside Catering", tabName: "catering" },
      ],
      vendor: [
        { icon: Home, label: "Dashboard", tabName: "dashboard" },
        { icon: Truck, label: "Outside Catering", tabName: "catering" },
      ],
    };

    return baseItems[user.role] || [];
  };

  const navItems = getNavItems();

  const NavButton = ({ icon: Icon, label, tabName }) => (
    <button
      onClick={() => {
        setActiveTab(tabName);
        setSidebarOpen(false);
      }}
      className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-300 text-left ${
        activeTab === tabName
          ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-xl transform scale-105"
          : "text-gray-700 hover:bg-indigo-50 hover:translate-x-2"
      }`}
    >
      <Icon size={24} />
      <span className="font-semibold text-lg">{label}</span>
    </button>
  );

  return (
    <>
      {/* Mobile Menu Button - Fixed at top */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
        aria-label="Toggle menu"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile - closes sidebar when clicked */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:relative inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl transform transition-transform duration-300 lg:transform-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-8 bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600">
            <h1 className="text-3xl font-bold text-white mb-2">
              ☕ SERENITY FOOD COURT
            </h1>
          </div>

          {/* User Info */}
          {user && (
            <div className="p-6 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 truncate">
                    {user.fullName}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Shield className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-xs font-semibold text-indigo-600 uppercase">
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-6 space-y-3 overflow-y-auto">
            {navItems.map((item) => (
              <NavButton
                key={item.tabName}
                icon={item.icon}
                label={item.label}
                tabName={item.tabName}
              />
            ))}
          </nav>

          {/* Footer with Settings & Logout */}
          <div className="p-6 border-t border-gray-200 space-y-2">
            <button
              onClick={() => {
                setActiveTab("settings");
                setSidebarOpen(false);
              }}
              className="w-full flex items-center gap-4 px-6 py-3 rounded-xl text-gray-700 hover:bg-slate-50 transition-all duration-200"
            >
              <Settings size={20} />
              <span className="font-medium">Settings</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-6 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>

            <p className="text-sm text-gray-500 text-center mt-4">
              © 2025 Serenity Food Court
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
