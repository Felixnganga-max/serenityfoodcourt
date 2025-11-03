import React, { useState, useEffect } from "react";
import {
  Calendar,
  TrendingUp,
  Package,
  Filter,
  DollarSign,
  Users,
  ShoppingBag,
  Layers,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

const API_BASE_URL = "http://localhost:5000/serenityfoodcourt";

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

  const token = localStorage.getItem("token") || "";

  useEffect(() => {
    fetchRawMaterialGroups();
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [selectedDate]);

  const fetchRawMaterialGroups = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/raw-material-groups`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setRawMaterialGroups(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch raw material groups:", err);
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/sales/report?date=${selectedDate}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();

      if (data.success) {
        setReportData(data.data);
      } else {
        setError(data.error || "Failed to fetch report data");
      }
    } catch (err) {
      setError("Failed to fetch report data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    return `KSh ${amount.toLocaleString()}`;
  };

  // Filter items by raw material group - FIXED
  const getFilteredItems = () => {
    if (!reportData?.itemsAnalysis) return [];
    if (selectedRawMaterial === "all") return reportData.itemsAnalysis;

    return reportData.itemsAnalysis.filter((item) => {
      // Check multiple possible ID formats
      const itemGroupId =
        item.rawMaterialGroup?._id ||
        item.rawMaterialGroup?.id ||
        item.rawMaterialGroup;
      return itemGroupId?.toString() === selectedRawMaterial;
    });
  };

  // Calculate grand totals for filtered items - NEW
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

  const getRawMaterialSummary = () => {
    if (!reportData?.rawMaterialAnalysis) return [];
    return reportData.rawMaterialAnalysis;
  };

  if (loading && !reportData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading report data...</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-8 relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <TrendingUp className="w-10 h-10 text-white" />
                <h2 className="text-4xl md:text-5xl font-bold text-white">
                  Sales Reports
                </h2>
              </div>
              <p className="text-xl text-indigo-100">
                Comprehensive sales analysis & insights
              </p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 flex items-start gap-4">
            <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
            <div className="flex-1">
              <p className="text-red-800 font-medium">{error}</p>
              <button
                onClick={fetchReportData}
                className="mt-2 text-red-600 hover:text-red-700 font-semibold text-sm flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Date & Filter Controls */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date Selector */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Calendar size={18} className="text-indigo-600" />
                Select Date
              </label>
              <div className="flex gap-3">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl text-lg font-semibold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200 focus:outline-none transition-all"
                />
                <button
                  onClick={fetchReportData}
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <RefreshCw
                    size={18}
                    className={loading ? "animate-spin" : ""}
                  />
                  Refresh
                </button>
              </div>
            </div>

            {/* Report Type Selector */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Filter size={18} className="text-indigo-600" />
                Report View
              </label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => setReportType("daily")}
                  className={`px-4 py-3 rounded-xl font-bold transition-all ${
                    reportType === "daily"
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Daily
                </button>
                <button
                  onClick={() => setReportType("items")}
                  className={`px-4 py-3 rounded-xl font-bold transition-all ${
                    reportType === "items"
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Items
                </button>
                <button
                  onClick={() => setReportType("materials")}
                  className={`px-4 py-3 rounded-xl font-bold transition-all ${
                    reportType === "materials"
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Materials
                </button>
                <button
                  onClick={() => setReportType("payment")}
                  className={`px-4 py-3 rounded-xl font-bold transition-all ${
                    reportType === "payment"
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Payment
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 text-white shadow-xl hover:scale-105 transition-transform">
            <div className="flex items-center gap-3 mb-2">
              <ShoppingBag size={24} />
              <h3 className="text-sm font-semibold opacity-90">
                Walk-In Sales
              </h3>
            </div>
            <p className="text-3xl font-bold mb-1">
              {formatCurrency(summary.walkInTotal || 0)}
            </p>
            <p className="text-sm opacity-75">
              {walkInSales.length} transactions
            </p>
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl hover:scale-105 transition-transform">
            <div className="flex items-center gap-3 mb-2">
              <Package size={24} />
              <h3 className="text-sm font-semibold opacity-90">
                Catering (Paid)
              </h3>
            </div>
            <p className="text-3xl font-bold mb-1">
              {formatCurrency(summary.cateringPaid || 0)}
            </p>
            <p className="text-sm opacity-75">
              {cateringSales.filter((s) => s.isPaid).length} orders
            </p>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl hover:scale-105 transition-transform">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle size={24} />
              <h3 className="text-sm font-semibold opacity-90">
                Pending Credit
              </h3>
            </div>
            <p className="text-3xl font-bold mb-1">
              {formatCurrency(summary.cateringPending || 0)}
            </p>
            <p className="text-sm opacity-75">
              {cateringSales.filter((s) => !s.isPaid).length} unpaid
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl hover:scale-105 transition-transform">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign size={24} />
              <h3 className="text-sm font-semibold opacity-90">
                Total Revenue
              </h3>
            </div>
            <p className="text-3xl font-bold mb-1">
              {formatCurrency(
                (summary.walkInTotal || 0) + (summary.cateringPaid || 0)
              )}
            </p>
            <p className="text-sm opacity-75">
              {walkInSales.length +
                cateringSales.filter((s) => s.isPaid).length}{" "}
              paid
            </p>
          </div>
        </div>

        {/* Report Content */}
        {reportType === "daily" && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Walk-In Sales */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-100 rounded-xl p-3">
                  <ShoppingBag className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Walk-In Sales
                  </h3>
                  <p className="text-sm text-gray-600">
                    {walkInSales.length} transactions
                  </p>
                </div>
              </div>

              {walkInSales.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ShoppingBag
                    size={48}
                    className="mx-auto mb-3 text-gray-300"
                  />
                  <p className="font-medium">No walk-in sales on this date</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {walkInSales.map((sale) => (
                    <div
                      key={sale._id}
                      className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-100 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-sm font-bold text-gray-700">
                            {formatTime(sale.timestamp)}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            By: {sale.recordedBy?.fullName || "N/A"}
                          </p>
                        </div>
                        <span className="text-xl font-bold text-blue-600">
                          {formatCurrency(sale.totalAmount)}
                        </span>
                      </div>

                      <div className="space-y-1 mb-3">
                        {sale.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between text-sm text-gray-800"
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

                      <div className="flex items-center gap-2 text-xs">
                        <span
                          className={`px-3 py-1 rounded-full font-semibold ${
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
                            ? `Split (M-PESA: ${formatCurrency(
                                sale.splitPayment?.mpesa || 0
                              )}, Cash: ${formatCurrency(
                                sale.splitPayment?.cash || 0
                              )})`
                            : "Cash"}
                        </span>
                        {sale.mpesaCode && (
                          <span className="text-gray-500">
                            • {sale.mpesaCode}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Catering Sales */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-indigo-100 rounded-xl p-3">
                  <Package className="text-indigo-600" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Catering Orders
                  </h3>
                  <p className="text-sm text-gray-600">
                    {cateringSales.length} orders
                  </p>
                </div>
              </div>

              {cateringSales.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Package size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No catering orders on this date</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {cateringSales.map((sale) => (
                    <div
                      key={sale._id}
                      className={`p-4 rounded-xl border-2 hover:shadow-md transition-shadow ${
                        sale.isPaid
                          ? "bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100"
                          : "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-sm font-bold text-gray-700">
                            {formatTime(sale.timestamp)}
                          </span>
                          <p className="text-xs font-semibold text-gray-600 mt-1">
                            {sale.customerName || sale.vendorName || "N/A"}
                          </p>
                          <p className="text-xs text-gray-500">
                            By: {sale.recordedBy?.fullName || "N/A"}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`text-xl font-bold ${
                              sale.isPaid ? "text-indigo-600" : "text-amber-600"
                            }`}
                          >
                            {formatCurrency(sale.totalAmount)}
                          </span>
                          <span
                            className={`block text-xs font-semibold mt-1 ${
                              sale.isPaid ? "text-green-600" : "text-orange-600"
                            }`}
                          >
                            {sale.isPaid ? "✓ Paid" : "⏰ Pending"}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1 mb-3">
                        {sale.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between text-sm text-gray-800"
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

                      {sale.returnedItems?.length > 0 && (
                        <div className="mb-3 p-2 bg-red-50 rounded-lg border border-red-200">
                          <p className="text-xs font-semibold text-red-700 mb-1">
                            Returned Items:
                          </p>
                          {sale.returnedItems.map((ret, idx) => (
                            <p key={idx} className="text-xs text-red-600">
                              • {ret.item} ({ret.quantity}) - {ret.reason}
                            </p>
                          ))}
                        </div>
                      )}

                      {sale.isPaid && (
                        <div className="flex items-center gap-2 text-xs">
                          <span
                            className={`px-3 py-1 rounded-full font-semibold ${
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
                              ? `Split (M-PESA: ${formatCurrency(
                                  sale.splitPayment?.mpesa || 0
                                )}, Cash: ${formatCurrency(
                                  sale.splitPayment?.cash || 0
                                )})`
                              : "Cash"}
                          </span>
                          {sale.mpesaCode && (
                            <span className="text-gray-500">
                              • {sale.mpesaCode}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {reportType === "items" && (
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 rounded-xl p-3">
                  <Package className="text-purple-600" size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Items Sold Breakdown
                  </h3>
                  <p className="text-sm text-gray-600">
                    {getFilteredItems().length} unique items
                    {selectedRawMaterial !== "all" && " in selected group"}
                  </p>
                </div>
              </div>

              {/* Raw Material Filter */}
              <select
                value={selectedRawMaterial}
                onChange={(e) => setSelectedRawMaterial(e.target.value)}
                className="px-4 py-2 border-2 border-gray-300 rounded-xl font-semibold focus:border-purple-500 focus:ring-4 focus:ring-purple-200 focus:outline-none"
              >
                <option value="all">All Items</option>
                {rawMaterialGroups.map((group) => (
                  <option key={group._id} value={group._id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Grand Total Card - NEW */}
            {selectedRawMaterial !== "all" && getFilteredItems().length > 0 && (
              <div className="mb-6 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-6 text-white">
                <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Layers size={20} />
                  {
                    rawMaterialGroups.find((g) => g._id === selectedRawMaterial)
                      ?.name
                  }{" "}
                  - Grand Total
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white bg-opacity-20 rounded-xl p-4 backdrop-blur">
                    <p className="text-xs opacity-90 mb-1">Total Units</p>
                    <p className="text-3xl font-bold">
                      {filteredTotals.totalQuantity}
                    </p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-xl p-4 backdrop-blur">
                    <p className="text-xs opacity-90 mb-1">Total Revenue</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(filteredTotals.totalRevenue)}
                    </p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-xl p-4 backdrop-blur">
                    <p className="text-xs opacity-90 mb-1">Walk-In</p>
                    <p className="text-3xl font-bold">
                      {filteredTotals.walkInQty}
                    </p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-xl p-4 backdrop-blur">
                    <p className="text-xs opacity-90 mb-1">Catering</p>
                    <p className="text-3xl font-bold">
                      {filteredTotals.cateringQty}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {getFilteredItems().length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Package size={48} className="mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No items sold on this date</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {getFilteredItems().map((item) => (
                  <div
                    key={item.name}
                    className="border-2 border-purple-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h4 className="font-bold text-lg text-gray-900 mb-2">
                            {item.name}
                          </h4>
                          {item.rawMaterialGroup && (
                            <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold mb-3">
                              {item.rawMaterialGroup.name}
                            </span>
                          )}
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="bg-blue-100 rounded-lg p-2">
                              <p className="text-xs text-gray-600 font-medium">
                                Walk-In
                              </p>
                              <p className="text-lg font-bold text-blue-600">
                                {item.walkInQty}
                              </p>
                            </div>
                            <div className="bg-indigo-100 rounded-lg p-2">
                              <p className="text-xs text-gray-600 font-medium">
                                Catering
                              </p>
                              <p className="text-lg font-bold text-indigo-600">
                                {item.cateringQty}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-3xl font-bold text-purple-600">
                            {item.totalQuantity}
                          </p>
                          <p className="text-xs text-gray-500 mb-2">
                            units sold
                          </p>
                          <p className="text-lg font-bold text-green-600">
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

        {reportType === "materials" && (
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-orange-100 rounded-xl p-3">
                <Layers className="text-orange-600" size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Raw Material Groups Analysis
                </h3>
                <p className="text-sm text-gray-600">
                  {getRawMaterialSummary().length} material groups
                </p>
              </div>
            </div>

            {getRawMaterialSummary().length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Layers size={48} className="mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No material data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {getRawMaterialSummary().map((group) => (
                  <div
                    key={group.name}
                    className="border-2 border-orange-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h4 className="font-bold text-2xl text-gray-900 mb-3">
                            {group.name}
                          </h4>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {group.items.map((itemName, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-white rounded-full text-xs font-semibold text-gray-700 border border-orange-200"
                              >
                                {itemName}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-4xl font-bold text-orange-600 mb-1">
                            {group.totalQuantity}
                          </p>
                          <p className="text-xs text-gray-500 mb-2">
                            units sold
                          </p>
                          <p className="text-xl font-bold text-green-600">
                            {formatCurrency(group.totalRevenue)}
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

        {reportType === "payment" && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Payment Breakdown */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-green-100 rounded-xl p-3">
                  <DollarSign className="text-green-600" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Payment Breakdown
                  </h3>
                  <p className="text-sm text-gray-600">All payment methods</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">📱</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600">
                          M-PESA
                        </p>
                        <p className="text-xs text-gray-500">Mobile payments</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(paymentBreakdown.mpesa || 0)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {paymentBreakdown.mpesaCount || 0} transactions
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-6 border-2 border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-500 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">💵</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600">
                          Cash
                        </p>
                        <p className="text-xs text-gray-500">
                          Physical currency
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-600">
                        {formatCurrency(paymentBreakdown.cash || 0)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {paymentBreakdown.cashCount || 0} transactions
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">🔀</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600">
                          Split Payment
                        </p>
                        <p className="text-xs text-gray-500">M-PESA + Cash</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-600">
                        {formatCurrency(paymentBreakdown.split || 0)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {paymentBreakdown.splitCount || 0} transactions
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">💰</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600">
                          Total Collected
                        </p>
                        <p className="text-xs text-gray-500">
                          All payment methods
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-blue-600">
                        {formatCurrency(
                          (paymentBreakdown.mpesa || 0) +
                            (paymentBreakdown.cash || 0) +
                            (paymentBreakdown.split || 0)
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(paymentBreakdown.mpesaCount || 0) +
                          (paymentBreakdown.cashCount || 0) +
                          (paymentBreakdown.splitCount || 0)}{" "}
                        total transactions
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Distribution Chart */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-indigo-100 rounded-xl p-3">
                  <TrendingUp className="text-indigo-600" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Payment Distribution
                  </h3>
                  <p className="text-sm text-gray-600">Visual breakdown</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* M-PESA Bar */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-700">
                      M-PESA
                    </span>
                    <span className="text-sm font-bold text-green-600">
                      {(
                        ((paymentBreakdown.mpesa || 0) /
                          ((paymentBreakdown.mpesa || 0) +
                            (paymentBreakdown.cash || 0) +
                            (paymentBreakdown.split || 0) || 1)) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-600 h-full rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                      style={{
                        width: `${
                          ((paymentBreakdown.mpesa || 0) /
                            ((paymentBreakdown.mpesa || 0) +
                              (paymentBreakdown.cash || 0) +
                              (paymentBreakdown.split || 0) || 1)) *
                          100
                        }%`,
                      }}
                    >
                      <span className="text-xs font-bold text-white">
                        {formatCurrency(paymentBreakdown.mpesa || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cash Bar */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-700">
                      Cash
                    </span>
                    <span className="text-sm font-bold text-gray-600">
                      {(
                        ((paymentBreakdown.cash || 0) /
                          ((paymentBreakdown.mpesa || 0) +
                            (paymentBreakdown.cash || 0) +
                            (paymentBreakdown.split || 0) || 1)) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-gray-500 to-slate-600 h-full rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                      style={{
                        width: `${
                          ((paymentBreakdown.cash || 0) /
                            ((paymentBreakdown.mpesa || 0) +
                              (paymentBreakdown.cash || 0) +
                              (paymentBreakdown.split || 0) || 1)) *
                          100
                        }%`,
                      }}
                    >
                      <span className="text-xs font-bold text-white">
                        {formatCurrency(paymentBreakdown.cash || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Split Bar */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-700">
                      Split
                    </span>
                    <span className="text-sm font-bold text-purple-600">
                      {(
                        ((paymentBreakdown.split || 0) /
                          ((paymentBreakdown.mpesa || 0) +
                            (paymentBreakdown.cash || 0) +
                            (paymentBreakdown.split || 0) || 1)) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-600 h-full rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                      style={{
                        width: `${
                          ((paymentBreakdown.split || 0) /
                            ((paymentBreakdown.mpesa || 0) +
                              (paymentBreakdown.cash || 0) +
                              (paymentBreakdown.split || 0) || 1)) *
                          100
                        }%`,
                      }}
                    >
                      <span className="text-xs font-bold text-white">
                        {formatCurrency(paymentBreakdown.split || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="mt-6 pt-6 border-t-2 border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl">
                    <p className="text-xs font-semibold text-gray-600 mb-1">
                      Avg Transaction
                    </p>
                    <p className="text-xl font-bold text-indigo-600">
                      {formatCurrency(
                        ((paymentBreakdown.mpesa || 0) +
                          (paymentBreakdown.cash || 0) +
                          (paymentBreakdown.split || 0)) /
                          ((paymentBreakdown.mpesaCount || 0) +
                            (paymentBreakdown.cashCount || 0) +
                            (paymentBreakdown.splitCount || 0) || 1)
                      )}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                    <p className="text-xs font-semibold text-gray-600 mb-1">
                      Total Transactions
                    </p>
                    <p className="text-xl font-bold text-green-600">
                      {(paymentBreakdown.mpesaCount || 0) +
                        (paymentBreakdown.cashCount || 0) +
                        (paymentBreakdown.splitCount || 0)}
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
