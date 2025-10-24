import React, { useState, useEffect, useMemo } from "react";
import {
  Menu,
  Home,
  ShoppingCart,
  Truck,
  Package,
  Minus,
  Plus,
  Trash2,
  User,
  Calendar,
  Filter,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Banknote,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  X,
} from "lucide-react";

// API Configuration
const API_BASE_URL = "http://localhost:5000/serenityfoodcourt";

// API Service
export const api = {
  getSales: async () => {
    const response = await fetch(`${API_BASE_URL}/sales/get-sales`);
    if (!response.ok) throw new Error("Failed to fetch sales");
    return response.json();
  },
  createSale: async (saleData) => {
    const response = await fetch(`${API_BASE_URL}/sales/create-sale`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(saleData),
    });
    if (!response.ok) throw new Error("Failed to create sale");
    return response.json();
  },
  getCredits: async () => {
    const response = await fetch(`${API_BASE_URL}/credits`);
    if (!response.ok) throw new Error("Failed to fetch credits");
    return response.json();
  },
  collectCredit: async (creditId, paymentData) => {
    const response = await fetch(
      `${API_BASE_URL}/credits/${creditId}/collect`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      }
    );
    if (!response.ok) throw new Error("Failed to collect credit");
    return response.json();
  },
};
