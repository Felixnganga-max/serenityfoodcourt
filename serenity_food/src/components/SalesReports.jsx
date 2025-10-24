import React, { useState, useMemo } from "react";
import {
  Calendar,
  TrendingUp,
  Package,
  ChevronDown,
  ChevronUp,
  Filter,
} from "lucide-react";

export const SalesReports = ({
  reportData,
  selectedDate,
  setSelectedDate,
  onDateChange,
}) => {
  const [reportType, setReportType] = useState("daily");
  const [expandedItems, setExpandedItems] = useState({});

  // Handle date change
  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    onDateChange(newDate);
  };

  const toggleExpanded = (itemName) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemName]: !prev[itemName],
    }));
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!reportData) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <p className="text-gray-600">Loading report data...</p>
          </div>
        </div>
      </div>
    );
  }

  const {
    walkInSales = [],
    cateringSales = [],
    itemsAnalysis = [],
    potatoAnalysis = [],
    summary = {},
  } = reportData;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 shadow-lg text-white mb-6">
          <h2 className="text-3xl md:text-4xl font-bold">Sales Reports</h2>
          <p className="text-lg opacity-90 mt-1">
            Daily sales analysis & item tracking
          </p>
        </div>

        {/* Date Selector */}
        <div className="bg-white rounded-xl p-6 shadow-md mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                <Calendar className="inline mr-2" size={18} />
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-semibold focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                <Filter className="inline mr-2" size={18} />
                Report Type
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setReportType("daily")}
                  className={`flex-1 px-4 py-3 rounded-lg font-bold transition-all ${
                    reportType === "daily"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Daily View
                </button>
                <button
                  onClick={() => setReportType("items")}
                  className={`flex-1 px-4 py-3 rounded-lg font-bold transition-all ${
                    reportType === "items"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Items
                </button>
                <button
                  onClick={() => setReportType("potato")}
                  className={`flex-1 px-4 py-3 rounded-lg font-bold transition-all ${
                    reportType === "potato"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  🥔 Potato
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-6 text-white shadow-lg">
            <h3 className="text-sm font-semibold opacity-90 mb-2">
              Walk-In Sales
            </h3>
            <p className="text-3xl font-bold">
              KSh {(summary.walkInTotal || 0).toLocaleString()}
            </p>
            <p className="text-sm opacity-75 mt-1">
              {walkInSales.length} transactions
            </p>
          </div>
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <h3 className="text-sm font-semibold opacity-90 mb-2">
              Catering (Paid)
            </h3>
            <p className="text-3xl font-bold">
              KSh {(summary.cateringPaid || 0).toLocaleString()}
            </p>
            <p className="text-sm opacity-75 mt-1">
              {cateringSales.filter((s) => s.isPaid).length} orders
            </p>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
            <h3 className="text-sm font-semibold opacity-90 mb-2">
              Pending Credit
            </h3>
            <p className="text-3xl font-bold">
              KSh {(summary.cateringPending || 0).toLocaleString()}
            </p>
            <p className="text-sm opacity-75 mt-1">
              {cateringSales.filter((s) => !s.isPaid).length} unpaid
            </p>
          </div>
        </div>

        {/* Report Content */}
        {reportType === "daily" && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Walk-In Sales */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="text-blue-600" />
                Walk-In Sales ({walkInSales.length})
              </h3>
              {walkInSales.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No walk-in sales on this date
                </p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {walkInSales.map((sale) => (
                    <div
                      key={sale._id}
                      className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-bold text-gray-700">
                          {formatTime(sale.timestamp)}
                        </span>
                        <span className="font-bold text-blue-600">
                          KSh {sale.totalAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {sale.items.map((item, idx) => (
                          <p
                            key={idx}
                            className="text-sm text-gray-800 font-medium"
                          >
                            {item.name} x{item.quantity} - KSh {item.total}
                          </p>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {sale.paymentMethod === "mpesa" ? "M-PESA" : "Cash"}
                        {sale.mpesaCode && ` • ${sale.mpesaCode}`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Catering Sales */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="text-indigo-600" />
                Catering Orders ({cateringSales.length})
              </h3>
              {cateringSales.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No catering orders on this date
                </p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {cateringSales.map((sale) => (
                    <div
                      key={sale._id}
                      className={`p-4 rounded-lg border ${
                        sale.isPaid
                          ? "bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200"
                          : "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-sm font-bold text-gray-700">
                            {formatTime(sale.timestamp)}
                          </span>
                          <span className="ml-2 text-xs font-semibold text-gray-600">
                            {sale.customerName || sale.vendorName}
                          </span>
                        </div>
                        <span
                          className={`font-bold ${
                            sale.isPaid ? "text-indigo-600" : "text-amber-600"
                          }`}
                        >
                          KSh {sale.totalAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {sale.items.map((item, idx) => (
                          <p
                            key={idx}
                            className="text-sm text-gray-800 font-medium"
                          >
                            {item.name} x{item.quantity} - KSh {item.total}
                          </p>
                        ))}
                      </div>
                      {sale.returnedItems?.length > 0 && (
                        <p className="text-xs text-red-600 font-medium mt-2">
                          Returned:{" "}
                          {sale.returnedItems.map((r) => r.item).join(", ")}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {sale.isPaid
                          ? sale.paymentMethod === "mpesa"
                            ? `M-PESA${
                                sale.mpesaCode ? ` • ${sale.mpesaCode}` : ""
                              }`
                            : "Cash"
                          : "⏰ Payment Pending"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {reportType === "items" && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Package className="text-purple-600" />
              Items Sold Breakdown
            </h3>
            {itemsAnalysis.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No items sold on this date
              </p>
            ) : (
              <div className="space-y-3">
                {itemsAnalysis.map((item) => (
                  <div
                    key={item.name}
                    className="border-2 border-gray-200 rounded-lg overflow-hidden"
                  >
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <h4 className="font-bold text-lg text-gray-900">
                            {item.name}
                          </h4>
                          <div className="flex gap-4 mt-1 text-sm">
                            <span className="text-blue-600 font-semibold">
                              Walk-In: {item.walkInQty}
                            </span>
                            <span className="text-indigo-600 font-semibold">
                              Catering: {item.cateringQty}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-purple-600">
                            {item.totalQuantity}
                          </p>
                          <p className="text-xs text-gray-500">units sold</p>
                          <p className="text-sm font-bold text-green-600 mt-1">
                            KSh {item.totalRevenue.toLocaleString()}
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

        {reportType === "potato" && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                🥔 Potato-Based Items Analysis
              </h3>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Units</p>
                <p className="text-3xl font-bold text-orange-600">
                  {potatoAnalysis.reduce(
                    (sum, item) => sum + item.totalQuantity,
                    0
                  )}
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                <p className="text-sm text-gray-700 font-semibold mb-1">
                  Walk-In Sales
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {potatoAnalysis.reduce(
                    (sum, item) => sum + item.walkInQty,
                    0
                  )}{" "}
                  units
                </p>
              </div>
              <div className="bg-indigo-50 rounded-lg p-4 border-2 border-indigo-200">
                <p className="text-sm text-gray-700 font-semibold mb-1">
                  Catering Sales
                </p>
                <p className="text-2xl font-bold text-indigo-600">
                  {potatoAnalysis.reduce(
                    (sum, item) => sum + item.cateringQty,
                    0
                  )}{" "}
                  units
                </p>
              </div>
            </div>

            {potatoAnalysis.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No potato-based items sold on this date
              </p>
            ) : (
              <div className="space-y-3">
                {potatoAnalysis.map((item) => (
                  <div
                    key={item.name}
                    className="border-2 border-orange-200 rounded-lg overflow-hidden"
                  >
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <h4 className="font-bold text-lg text-gray-900">
                            {item.name}
                          </h4>
                          <div className="flex gap-4 mt-1 text-sm">
                            <span className="text-blue-600 font-semibold">
                              Walk-In: {item.walkInQty}
                            </span>
                            <span className="text-indigo-600 font-semibold">
                              Catering: {item.cateringQty}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-orange-600">
                            {item.totalQuantity}
                          </p>
                          <p className="text-xs text-gray-500">units sold</p>
                          <p className="text-sm font-bold text-green-600 mt-1">
                            KSh {item.totalRevenue.toLocaleString()}
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
      </div>
    </div>
  );
};
