import React, { useState, useEffect } from "react";
import {
  Calendar,
  TrendingUp,
  Package,
  Filter,
  DollarSign,
  ShoppingBag,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const API_BASE_URL =
  "https://serenityfoodcourt-t8j7.vercel.app/serenityfoodcourt";

export const SalesReports = () => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [reportType, setReportType] = useState("daily");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reportData, setReportData] = useState(null);
  const [rawMaterialGroups, setRawMaterialGroups] = useState([]);
  const [selectedRawMaterial, setSelectedRawMaterial] = useState("all");
  const [cateringRounds, setCateringRounds] = useState([]);
  const [expandedSales, setExpandedSales] = useState({});

  const getToken = () => {
    try {
      return localStorage.getItem("token") || "";
    } catch (err) {
      console.error("LocalStorage not available:", err);
      return "";
    }
  };

  useEffect(() => {
    fetchRawMaterialGroups();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchReportData();
      fetchCateringRounds();
    }
  }, [selectedDate]);

  const fetchRawMaterialGroups = async () => {
    const token = getToken();
    if (!token) {
      setError("Authentication required. Please log in.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/raw-material-groups`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setRawMaterialGroups(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch raw material groups:", err);
    }
  };

  const fetchCateringRounds = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/outside-catering/rounds?date=${selectedDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCateringRounds(data.data || []);
        }
      }
    } catch (err) {
      console.error("Failed to fetch catering rounds:", err);
    }
  };

  const fetchReportData = async () => {
    const token = getToken();
    if (!token) {
      setError("Authentication required. Please log in.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/sales/report?date=${selectedDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.");
        } else if (response.status === 403) {
          throw new Error("You don't have permission to view sales reports.");
        } else {
          throw new Error(`Failed to fetch report (${response.status})`);
        }
      }

      const data = await response.json();

      if (data.success) {
        setReportData(data.data);
        setError("");
      } else {
        setError(data.error || "Failed to fetch report data");
      }
    } catch (err) {
      setError(err.message || "Failed to fetch report data");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (err) {
      return "Invalid time";
    }
  };

  const formatCurrency = (amount) => {
    const value = Number(amount) || 0;
    return `KSh ${value.toLocaleString()}`;
  };

  const toggleSaleExpansion = (saleId) => {
    setExpandedSales((prev) => ({
      ...prev,
      [saleId]: !prev[saleId],
    }));
  };

  const getFilteredItems = () => {
    if (!reportData?.itemsAnalysis) return [];
    if (selectedRawMaterial === "all") return reportData.itemsAnalysis;

    return reportData.itemsAnalysis.filter((item) => {
      const itemGroupId =
        item.rawMaterialGroup?._id ||
        item.rawMaterialGroup?.id ||
        item.rawMaterialGroup;
      return itemGroupId?.toString() === selectedRawMaterial;
    });
  };

  const getFilteredTotals = () => {
    const filteredItems = getFilteredItems();
    const totals = {
      totalQuantity: 0,
      totalRevenue: 0,
      walkInQty: 0,
      cateringQty: 0,
    };

    filteredItems.forEach((item) => {
      totals.totalQuantity += item.totalQuantity || 0;
      totals.totalRevenue += item.totalRevenue || 0;
      totals.walkInQty += item.walkInQty || 0;
      totals.cateringQty += item.cateringQty || 0;
    });

    return totals;
  };

  // Calculate totals from catering rounds
  const getCateringTotals = () => {
    const totals = {
      totalRounds: cateringRounds.length,
      totalExpected: 0,
      totalReturns: 0,
      netTotal: 0,
    };

    cateringRounds.forEach((round) => {
      totals.totalExpected += round.expectedAmount || 0;
      totals.totalReturns += round.returnsAmount || 0;
      totals.netTotal += round.netTotal || 0;
    });

    return totals;
  };

  if (loading && !reportData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600 font-medium text-sm">Loading report...</p>
        </div>
      </div>
    );
  }

  const {
    walkInSales = [],
    cateringSales = [],
    itemsAnalysis = [],
    summary = {},
    paymentBreakdown = {},
  } = reportData || {};

  const filteredTotals = getFilteredTotals();
  const cateringTotals = getCateringTotals();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden">
          <div className="p-4 sm:p-6 md:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                Sales Reports
              </h2>
            </div>
            <p className="text-sm sm:text-base md:text-lg text-indigo-100">
              Comprehensive sales analysis
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 flex items-start gap-3 sm:gap-4">
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
            <div className="flex-1 min-w-0">
              <p className="text-red-800 font-medium text-sm sm:text-base break-words">
                {error}
              </p>
              <button
                onClick={() => {
                  fetchReportData();
                  fetchCateringRounds();
                }}
                className="mt-2 text-red-600 hover:text-red-700 font-semibold text-xs sm:text-sm flex items-center gap-2"
              >
                <RefreshCw size={14} />
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Date & Filter Controls */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 border border-gray-100">
          <div className="space-y-4 sm:space-y-6">
            {/* Date Selector */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
                <Calendar size={16} className="text-indigo-600" />
                Select Date
              </label>
              <div className="flex gap-2 sm:gap-3">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold focus:border-indigo-500 focus:ring-2 sm:focus:ring-4 focus:ring-indigo-200 focus:outline-none transition-all"
                />
                <button
                  onClick={() => {
                    fetchReportData();
                    fetchCateringRounds();
                  }}
                  disabled={loading}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg sm:rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2 text-sm sm:text-base"
                >
                  <RefreshCw
                    size={16}
                    className={loading ? "animate-spin" : ""}
                  />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>

            {/* Report Type Selector */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
                <Filter size={16} className="text-indigo-600" />
                Report View
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["daily", "items", "payment"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setReportType(type)}
                    className={`px-2 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold transition-all capitalize text-xs sm:text-sm ${
                      reportType === type
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {reportData && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 text-white shadow-lg hover:scale-105 transition-transform">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingBag size={18} className="sm:w-5 sm:h-5" />
                <h3 className="text-xs sm:text-sm font-semibold opacity-90">
                  Walk-In
                </h3>
              </div>
              <p className="text-lg sm:text-2xl md:text-3xl font-bold mb-1">
                {formatCurrency(summary.walkInTotal || 0)}
              </p>
              <p className="text-xs opacity-75">{walkInSales.length} sales</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 text-white shadow-lg hover:scale-105 transition-transform">
              <div className="flex items-center gap-2 mb-2">
                <Package size={18} className="sm:w-5 sm:h-5" />
                <h3 className="text-xs sm:text-sm font-semibold opacity-90">
                  Catering (Paid)
                </h3>
              </div>
              <p className="text-lg sm:text-2xl md:text-3xl font-bold mb-1">
                {formatCurrency(summary.cateringPaid || 0)}
              </p>
              <p className="text-xs opacity-75">
                {cateringSales.filter((s) => s.isPaid).length} paid
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 text-white shadow-lg hover:scale-105 transition-transform">
              <div className="flex items-center gap-2 mb-2">
                <Package size={18} className="sm:w-5 sm:h-5" />
                <h3 className="text-xs sm:text-sm font-semibold opacity-90">
                  Outside Catering
                </h3>
              </div>
              <p className="text-lg sm:text-2xl md:text-3xl font-bold mb-1">
                {formatCurrency(cateringTotals.netTotal)}
              </p>
              <p className="text-xs opacity-75">
                {cateringTotals.totalRounds} rounds
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 text-white shadow-lg hover:scale-105 transition-transform">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={18} className="sm:w-5 sm:h-5" />
                <h3 className="text-xs sm:text-sm font-semibold opacity-90">
                  Total Revenue
                </h3>
              </div>
              <p className="text-lg sm:text-2xl md:text-3xl font-bold mb-1">
                {formatCurrency(
                  (summary.walkInTotal || 0) +
                    (summary.cateringPaid || 0) +
                    cateringTotals.netTotal
                )}
              </p>
              <p className="text-xs opacity-75">All paid sales</p>
            </div>
          </div>
        )}

        {/* Report Content */}
        {!reportData && !loading && (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-8 sm:p-12 text-center">
            <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600 text-sm sm:text-base md:text-lg font-medium">
              Select a date and click Refresh to view sales report
            </p>
          </div>
        )}

        {reportType === "daily" && reportData && (
          <div className="space-y-4 sm:space-y-6">
            {/* Walk-In Sales */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 border border-gray-100">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="bg-blue-100 rounded-lg sm:rounded-xl p-2 sm:p-3">
                  <ShoppingBag className="text-blue-600" size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
                    Walk-In Sales
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {walkInSales.length} transactions
                  </p>
                </div>
              </div>

              {walkInSales.length === 0 ? (
                <div className="text-center py-8 sm:py-12 text-gray-500">
                  <ShoppingBag
                    size={40}
                    className="mx-auto mb-3 text-gray-300"
                  />
                  <p className="font-medium text-sm sm:text-base">
                    No walk-in sales on this date
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {walkInSales.map((sale) => (
                    <div
                      key={sale._id}
                      className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg sm:rounded-xl border-2 border-blue-100"
                    >
                      <div
                        className="p-3 sm:p-4 cursor-pointer"
                        onClick={() => toggleSaleExpansion(sale._id)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 min-w-0">
                            <span className="text-xs sm:text-sm font-bold text-gray-700">
                              {formatTime(sale.timestamp)}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                              By: {sale.recordedBy?.fullName || "N/A"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-base sm:text-lg md:text-xl font-bold text-blue-600">
                              {formatCurrency(sale.totalAmount)}
                            </span>
                            {expandedSales[sale._id] ? (
                              <ChevronUp size={20} className="text-gray-400" />
                            ) : (
                              <ChevronDown
                                size={20}
                                className="text-gray-400"
                              />
                            )}
                          </div>
                        </div>

                        {expandedSales[sale._id] && (
                          <>
                            <div className="space-y-1 mb-3 pt-2 border-t border-blue-200">
                              {sale.items?.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex justify-between text-xs sm:text-sm text-gray-800"
                                >
                                  <span className="font-medium">
                                    {item.name} x{item.quantity}
                                  </span>
                                  <span className="font-semibold">
                                    {formatCurrency(item.total)}
                                  </span>
                                </div>
                              ))}
                            </div>

                            <div className="flex items-center gap-2 text-xs flex-wrap">
                              <span
                                className={`px-2 sm:px-3 py-1 rounded-full font-semibold ${
                                  sale.paymentMethod === "mpesa"
                                    ? "bg-green-100 text-green-700"
                                    : sale.paymentMethod === "split"
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {sale.paymentMethod === "mpesa"
                                  ? "M-PESA"
                                  : sale.paymentMethod === "split"
                                  ? "Split"
                                  : "Cash"}
                              </span>
                              {sale.mpesaCode && (
                                <span className="text-gray-500 text-xs truncate">
                                  {sale.mpesaCode}
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Catering Sales */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 border border-gray-100">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="bg-orange-100 rounded-lg sm:rounded-xl p-2 sm:p-3">
                  <Package className="text-orange-600" size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
                    Catering Orders
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {cateringSales.length} orders
                  </p>
                </div>
              </div>

              {cateringSales.length === 0 ? (
                <div className="text-center py-8 sm:py-12 text-gray-500">
                  <Package size={40} className="mx-auto mb-3 text-gray-300" />
                  <p className="font-medium text-sm sm:text-base">
                    No catering sales on this date
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {cateringSales.map((sale) => (
                    <div
                      key={sale._id}
                      className={`rounded-lg sm:rounded-xl border-2 ${
                        sale.isPaid
                          ? "bg-gradient-to-r from-orange-50 to-red-50 border-orange-100"
                          : "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200"
                      }`}
                    >
                      <div
                        className="p-3 sm:p-4 cursor-pointer"
                        onClick={() => toggleSaleExpansion(sale._id)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 min-w-0">
                            <span className="text-xs sm:text-sm font-bold text-gray-700">
                              {formatTime(sale.timestamp)}
                            </span>
                            <p className="text-xs font-semibold text-gray-600 mt-1">
                              {sale.vendorName || sale.customerName || "Vendor"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <span
                                className={`text-base sm:text-lg md:text-xl font-bold ${
                                  sale.isPaid
                                    ? "text-orange-600"
                                    : "text-amber-600"
                                }`}
                              >
                                {formatCurrency(sale.totalAmount)}
                              </span>
                              <span
                                className={`block text-xs font-semibold ${
                                  sale.isPaid
                                    ? "text-green-600"
                                    : "text-orange-600"
                                }`}
                              >
                                {sale.isPaid ? "✓ Paid" : "⏰ Pending"}
                              </span>
                            </div>
                            {expandedSales[sale._id] ? (
                              <ChevronUp size={20} className="text-gray-400" />
                            ) : (
                              <ChevronDown
                                size={20}
                                className="text-gray-400"
                              />
                            )}
                          </div>
                        </div>

                        {expandedSales[sale._id] && (
                          <div className="space-y-1 pt-2 border-t border-orange-200">
                            {sale.items?.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between text-xs sm:text-sm text-gray-800"
                              >
                                <span className="font-medium">
                                  {item.name} x{item.quantity}
                                </span>
                                <span className="font-semibold">
                                  {formatCurrency(item.total)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Outside Catering Rounds */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 border border-gray-100">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="bg-purple-100 rounded-lg sm:rounded-xl p-2 sm:p-3">
                  <Package className="text-purple-600" size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
                    Outside Catering Rounds
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {cateringRounds.length} rounds
                  </p>
                </div>
              </div>

              {cateringRounds.length === 0 ? (
                <div className="text-center py-8 sm:py-12 text-gray-500">
                  <Package size={40} className="mx-auto mb-3 text-gray-300" />
                  <p className="font-medium text-sm sm:text-base">
                    No outside catering rounds on this date
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {cateringRounds.map((round) => (
                    <div
                      key={round._id}
                      className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg sm:rounded-xl border-2 border-purple-100 p-3 sm:p-4"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-sm sm:text-base font-bold text-purple-700">
                            Round {round.roundNumber}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatTime(round.startTime)} -{" "}
                            {formatTime(round.endTime)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-base sm:text-lg md:text-xl font-bold text-purple-600">
                            {formatCurrency(round.netTotal)}
                          </p>
                          <p className="text-xs text-gray-500">Net total</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-white rounded-lg p-2">
                          <p className="text-xs text-gray-600">Expected</p>
                          <p className="text-sm font-bold text-gray-800">
                            {formatCurrency(round.expectedAmount)}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-2">
                          <p className="text-xs text-gray-600">Returns</p>
                          <p className="text-sm font-bold text-red-600">
                            {formatCurrency(round.returnsAmount)}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-2">
                          <p className="text-xs text-gray-600">Items</p>
                          <p className="text-sm font-bold text-gray-800">
                            {round.items?.length || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {reportType === "items" && reportData && (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 border border-gray-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="bg-purple-100 rounded-lg sm:rounded-xl p-2 sm:p-3">
                  <Package className="text-purple-600" size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg md:text-2xl font-bold text-gray-900">
                    Items Sold
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {getFilteredItems().length} items
                    {selectedRawMaterial !== "all" && " in group"}
                  </p>
                </div>
              </div>

              {rawMaterialGroups.length > 0 && (
                <select
                  value={selectedRawMaterial}
                  onChange={(e) => setSelectedRawMaterial(e.target.value)}
                  className="w-full sm:w-auto px-3 sm:px-4 py-2 border-2 border-gray-300 rounded-lg sm:rounded-xl text-sm font-semibold focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none"
                >
                  <option value="all">All Items</option>
                  {rawMaterialGroups.map((group) => (
                    <option key={group._id} value={group._id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {selectedRawMaterial !== "all" && getFilteredItems().length > 0 && (
              <div className="mb-4 sm:mb-6 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white">
                <h4 className="text-sm sm:text-base md:text-lg font-bold mb-3 sm:mb-4">
                  {
                    rawMaterialGroups.find((g) => g._id === selectedRawMaterial)
                      ?.name
                  }{" "}
                  - Total
                </h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                  <div className="bg-white bg-opacity-20 rounded-lg sm:rounded-xl p-3 sm:p-4 backdrop-blur">
                    <p className="text-xs opacity-90 mb-1">Units</p>
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold">
                      {filteredTotals.totalQuantity}
                    </p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg sm:rounded-xl p-3 sm:p-4 backdrop-blur">
                    <p className="text-xs opacity-90 mb-1">Revenue</p>
                    <p className="text-base sm:text-lg md:text-2xl font-bold">
                      {formatCurrency(filteredTotals.totalRevenue)}
                    </p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg sm:rounded-xl p-3 sm:p-4 backdrop-blur">
                    <p className="text-xs opacity-90 mb-1">Walk-In</p>
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold">
                      {filteredTotals.walkInQty}
                    </p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg sm:rounded-xl p-3 sm:p-4 backdrop-blur">
                    <p className="text-xs opacity-90 mb-1">Catering</p>
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold">
                      {filteredTotals.cateringQty}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {getFilteredItems().length === 0 ? (
              <div className="text-center py-8 sm:py-12 text-gray-500">
                <Package size={40} className="mx-auto mb-3 text-gray-300" />
                <p className="font-medium text-sm sm:text-base">
                  No items sold on this date
                </p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4 max-h-[600px] overflow-y-auto">
                {getFilteredItems().map((item, index) => (
                  <div
                    key={`${item.name}-${index}`}
                    className="border-2 border-purple-200 rounded-lg sm:rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-3 sm:p-4 md:p-5">
                      <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4">
                        <div className="flex-1">
                          <h4 className="font-bold text-sm sm:text-base md:text-lg text-gray-900 mb-2">
                            {item.name}
                          </h4>
                          {item.rawMaterialGroup?.name && (
                            <span className="inline-block px-2 sm:px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold mb-3">
                              {item.rawMaterialGroup.name}
                            </span>
                          )}
                          <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                            <div className="bg-blue-100 rounded-lg p-2">
                              <p className="text-xs text-gray-600 font-medium">
                                Walk-In
                              </p>
                              <p className="text-base sm:text-lg font-bold text-blue-600">
                                {item.walkInQty || 0}
                              </p>
                            </div>
                            <div className="bg-orange-100 rounded-lg p-2">
                              <p className="text-xs text-gray-600 font-medium">
                                Catering
                              </p>
                              <p className="text-base sm:text-lg font-bold text-orange-600">
                                {item.cateringQty || 0}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-center sm:text-right">
                          <p className="text-2xl sm:text-3xl font-bold text-purple-600">
                            {item.totalQuantity || 0}
                          </p>
                          <p className="text-xs text-gray-500 mb-2">
                            units sold
                          </p>
                          <p className="text-base sm:text-lg font-bold text-green-600">
                            {formatCurrency(item.totalRevenue)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {reportType === "payment" && reportData && (
          <div className="space-y-4 sm:space-y-6">
            {/* Payment Breakdown */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 border border-gray-100">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="bg-green-100 rounded-lg sm:rounded-xl p-2 sm:p-3">
                  <DollarSign className="text-green-600" size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
                    Payment Breakdown
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    All methods
                  </p>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg sm:rounded-xl p-4 sm:p-6 border-2 border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-lg sm:rounded-xl flex items-center justify-center">
                        <span className="text-xl sm:text-2xl">📱</span>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-gray-600">
                          M-PESA
                        </p>
                        <p className="text-xs text-gray-500">Mobile</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">
                        {formatCurrency(paymentBreakdown.mpesa || 0)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg sm:rounded-xl p-4 sm:p-6 border-2 border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-500 rounded-lg sm:rounded-xl flex items-center justify-center">
                        <span className="text-xl sm:text-2xl">💵</span>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-gray-600">
                          Cash
                        </p>
                        <p className="text-xs text-gray-500">Physical</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-600">
                        {formatCurrency(paymentBreakdown.cash || 0)}
                      </p>
                    </div>
                  </div>
                </div>

                {paymentBreakdown.credit > 0 && (
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg sm:rounded-xl p-4 sm:p-6 border-2 border-amber-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-500 rounded-lg sm:rounded-xl flex items-center justify-center">
                          <span className="text-xl sm:text-2xl">⏰</span>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-semibold text-gray-600">
                            Credit
                          </p>
                          <p className="text-xs text-gray-500">Unpaid</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg sm:text-xl md:text-2xl font-bold text-amber-600">
                          {formatCurrency(paymentBreakdown.credit || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg sm:rounded-xl p-4 sm:p-6 border-2 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-lg sm:rounded-xl flex items-center justify-center">
                        <span className="text-xl sm:text-2xl">💰</span>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-gray-600">
                          Total Collected
                        </p>
                        <p className="text-xs text-gray-500">All paid</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600">
                        {formatCurrency(
                          (paymentBreakdown.mpesa || 0) +
                            (paymentBreakdown.cash || 0)
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Distribution */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 border border-gray-100">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="bg-indigo-100 rounded-lg sm:rounded-xl p-2 sm:p-3">
                  <TrendingUp className="text-indigo-600" size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
                    Distribution
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Visual breakdown
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* M-PESA Bar */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs sm:text-sm font-semibold text-gray-700">
                      M-PESA
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-green-600">
                      {(
                        ((paymentBreakdown.mpesa || 0) /
                          ((paymentBreakdown.mpesa || 0) +
                            (paymentBreakdown.cash || 0) +
                            (paymentBreakdown.credit || 0) || 1)) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-5 sm:h-6 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-600 h-full rounded-full flex items-center justify-end pr-2 sm:pr-3 transition-all duration-500"
                      style={{
                        width: `${Math.max(
                          5,
                          ((paymentBreakdown.mpesa || 0) /
                            ((paymentBreakdown.mpesa || 0) +
                              (paymentBreakdown.cash || 0) +
                              (paymentBreakdown.credit || 0) || 1)) *
                            100
                        )}%`,
                      }}
                    >
                      {paymentBreakdown.mpesa > 0 && (
                        <span className="text-xs font-bold text-white hidden sm:inline">
                          {formatCurrency(paymentBreakdown.mpesa || 0)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cash Bar */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs sm:text-sm font-semibold text-gray-700">
                      Cash
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-gray-600">
                      {(
                        ((paymentBreakdown.cash || 0) /
                          ((paymentBreakdown.mpesa || 0) +
                            (paymentBreakdown.cash || 0) +
                            (paymentBreakdown.credit || 0) || 1)) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-5 sm:h-6 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-gray-500 to-slate-600 h-full rounded-full flex items-center justify-end pr-2 sm:pr-3 transition-all duration-500"
                      style={{
                        width: `${Math.max(
                          5,
                          ((paymentBreakdown.cash || 0) /
                            ((paymentBreakdown.mpesa || 0) +
                              (paymentBreakdown.cash || 0) +
                              (paymentBreakdown.credit || 0) || 1)) *
                            100
                        )}%`,
                      }}
                    >
                      {paymentBreakdown.cash > 0 && (
                        <span className="text-xs font-bold text-white hidden sm:inline">
                          {formatCurrency(paymentBreakdown.cash || 0)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Credit Bar */}
                {paymentBreakdown.credit > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs sm:text-sm font-semibold text-gray-700">
                        Credit (Unpaid)
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-amber-600">
                        {(
                          ((paymentBreakdown.credit || 0) /
                            ((paymentBreakdown.mpesa || 0) +
                              (paymentBreakdown.cash || 0) +
                              (paymentBreakdown.credit || 0) || 1)) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-5 sm:h-6 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-orange-600 h-full rounded-full flex items-center justify-end pr-2 sm:pr-3 transition-all duration-500"
                        style={{
                          width: `${Math.max(
                            5,
                            ((paymentBreakdown.credit || 0) /
                              ((paymentBreakdown.mpesa || 0) +
                                (paymentBreakdown.cash || 0) +
                                (paymentBreakdown.credit || 0) || 1)) *
                              100
                          )}%`,
                        }}
                      >
                        <span className="text-xs font-bold text-white hidden sm:inline">
                          {formatCurrency(paymentBreakdown.credit || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Summary Stats */}
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t-2 border-gray-200">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg sm:rounded-xl">
                    <p className="text-xs font-semibold text-gray-600 mb-1">
                      Total Paid
                    </p>
                    <p className="text-base sm:text-lg md:text-xl font-bold text-indigo-600">
                      {formatCurrency(
                        (paymentBreakdown.mpesa || 0) +
                          (paymentBreakdown.cash || 0)
                      )}
                    </p>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg sm:rounded-xl">
                    <p className="text-xs font-semibold text-gray-600 mb-1">
                      Total + Credit
                    </p>
                    <p className="text-base sm:text-lg md:text-xl font-bold text-green-600">
                      {formatCurrency(
                        (paymentBreakdown.mpesa || 0) +
                          (paymentBreakdown.cash || 0) +
                          (paymentBreakdown.credit || 0)
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesReports;
