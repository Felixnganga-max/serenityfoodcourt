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
  FileText,
} from "lucide-react";

export const Sidebar = ({
  activeTab,
  setActiveTab,
  sidebarOpen,
  setSidebarOpen,
}) => {
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
    <div
      className={`fixed lg:relative inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl transform transition-transform duration-300 lg:transform-none ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      <div className="h-full flex flex-col">
        <div className="p-8 bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600">
          <h1 className="text-3xl font-bold text-white mb-2">
            ☕ SERENITY FOOD COURT
          </h1>
        </div>
        <nav className="flex-1 p-6 space-y-3">
          <NavButton icon={Home} label="Dashboard" tabName="dashboard" />
          <NavButton
            icon={ShoppingCart}
            label="Walk-In Sales"
            tabName="walkin"
          />
          <NavButton icon={Truck} label="Outside Catering" tabName="catering" />
          <NavButton icon={FileText} label="Sales Reports" tabName="reports" />
          <NavButton icon={Package} label="Inventory" tabName="inventory" />
        </nav>
        <div className="p-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">© 2025 Serenity Food Court</p>
        </div>
      </div>
    </div>
  );
};
