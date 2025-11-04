import React, { useMemo, useState, useEffect } from "react";
import {
  TrendingUp,
  ShoppingCart,
  Package,
  Clock,
  ArrowUp,
  DollarSign,
  User,
  Shield,
  ChevronDown,
  ChevronUp,
  Calendar,
  Smartphone,
  Banknote,
  TrendingDown,
  AlertCircle,
} from "lucide-react";

export const Dashboard = ({ summaryData, credits }) => {
  const [user, setUser] = useState(null);
  const [expandedWalkIn, setExpandedWalkIn] = useState(false);
  const [expandedCatering, setExpandedCatering] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const analytics = useMemo(() => {
    if (!summaryData) {
      return {
        walkInTotal: 0,
        cateringPaid: 0,
        creditTotal: 0,
        grandTotal: 0,
        walkInCount: 0,
        cateringCount: 0,
        creditCount: 0,
        walkInSales: [],
        cateringSales: [],
        mpesaTotal: 0,
        cashTotal: 0,
        mpesaCount: 0,
        cashCount: 0,
        splitTotal: 0,
        splitCount: 0,
      };
    }

    const walkInData = summaryData.todaySales?.find(
      (s) => s._id === "walk-in"
    ) || { totalAmount: 0, count: 0 };
    const cateringData = summaryData.todaySales?.find(
      (s) => s._id === "outside-catering"
    ) || { totalAmount: 0, count: 0 };
    const creditTotal = credits.reduce((sum, c) => sum + c.amount, 0);

    const walkInSales = summaryData.walkInSales || [];
    const cateringSales = summaryData.cateringSales || [];

    // Calculate payment method totals from actual transactions
    let mpesaTotal = 0;
    let cashTotal = 0;
    let splitTotal = 0;
    let mpesaCount = 0;
    let cashCount = 0;
    let splitCount = 0;

    [...walkInSales, ...cateringSales.filter((s) => s.isPaid)].forEach(
      (sale) => {
        if (sale.paymentMethod === "mpesa") {
          mpesaTotal += sale.totalAmount || 0;
          mpesaCount++;
        } else if (sale.paymentMethod === "cash") {
          cashTotal += sale.totalAmount || 0;
          cashCount++;
        } else if (sale.paymentMethod === "split") {
          splitTotal += sale.totalAmount || 0;
          splitCount++;
          // Also count split payment components
          if (sale.splitPayment) {
            mpesaTotal += sale.splitPayment.mpesa || 0;
            cashTotal += sale.splitPayment.cash || 0;
          }
        }
      }
    );

    return {
      walkInTotal: walkInData.totalAmount,
      cateringPaid: cateringData.totalAmount,
      creditTotal,
      grandTotal: walkInData.totalAmount + cateringData.totalAmount,
      walkInCount: walkInData.count,
      cateringCount: cateringData.count,
      creditCount: credits.length,
      walkInSales: walkInSales.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      ),
      cateringSales: cateringSales.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      ),
      mpesaTotal,
      cashTotal,
      splitTotal,
      mpesaCount,
      cashCount,
      splitCount,
    };
  }, [summaryData, credits]);

  const canViewFullDashboard = user?.role === "manager";
  const canViewSales =
    user?.role === "manager" || user?.role === "shop-attendant";

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    return `KSh ${amount.toLocaleString()}`;
  };

  const getPaymentIcon = (method) => {
    if (method === "mpesa") return <Smartphone className="w-4 h-4" />;
    if (method === "cash") return <Banknote className="w-4 h-4" />;
    return <DollarSign className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 rounded-3xl shadow-2xl p-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              {summaryData?.date && (
                <div className="flex items-center gap-3 bg-white bg-opacity-20 px-5 py-3 rounded-xl w-fit backdrop-blur-sm">
                  <Calendar className="w-6 h-6 text-white" />
                  <p className="text-lg text-white font-bold">
                    {new Date(summaryData.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              )}
            </div>

            {user && (
              <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-xl shadow-lg border-2 border-red-500">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-md">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-base">
                    {user.fullName}
                  </p>
                  <div className="flex items-center gap-1">
                    <Shield className="w-4 h-4 text-red-600" />
                    <span className="text-xs font-bold text-red-600 uppercase">
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Total Revenue Card */}
        <div className="bg-gradient-to-br from-red-500 via-rose-500 to-red-600 rounded-3xl shadow-2xl p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-white rounded-xl shadow-lg">
              <DollarSign size={32} className="text-red-600" />
            </div>
            <div>
              <h3 className="text-white text-xl font-bold">
                {canViewFullDashboard ? "TOTAL REVENUE" : "TODAY'S SALES"}
              </h3>
              <p className="text-white text-base opacity-90">
                {canViewFullDashboard
                  ? "All paid transactions today"
                  : "Your transactions today"}
              </p>
            </div>
          </div>

          <div className="flex items-end gap-3 mb-6">
            <p className="text-white text-6xl font-bold">
              {formatCurrency(analytics.grandTotal)}
            </p>
            <div className="flex items-center gap-2 bg-white bg-opacity-20 px-4 py-2 rounded-xl mb-2 backdrop-blur-sm">
              <ArrowUp size={20} className="text-white" />
              <span className="text-white text-base font-bold">LIVE</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white bg-opacity-20 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-white text-sm mb-2 font-medium">
                Transactions
              </p>
              <p className="text-white text-2xl font-bold">
                {analytics.walkInCount + analytics.cateringCount}
              </p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-white text-sm mb-2 font-medium">Walk-In</p>
              <p className="text-white text-2xl font-bold">
                {analytics.walkInCount}
              </p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-white text-sm mb-2 font-medium">Catering</p>
              <p className="text-white text-2xl font-bold">
                {analytics.cateringCount}
              </p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-white text-sm mb-2 font-medium">Pending</p>
              <p className="text-white text-2xl font-bold">
                {analytics.creditCount}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        {canViewSales && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Walk-In Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-red-500 hover:shadow-2xl transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-md">
                  <ShoppingCart size={28} className="text-white" />
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-600 uppercase">
                    Walk-In
                  </p>
                  <p className="text-xs text-gray-500 font-medium mt-1">
                    {analytics.walkInCount} sales
                  </p>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-3">
                {formatCurrency(analytics.walkInTotal)}
              </p>
              <div className="flex items-center gap-2 text-sm text-red-600 font-bold">
                <TrendingUp size={16} />
                <span>Active today</span>
              </div>
            </div>

            {/* Catering Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-red-500 hover:shadow-2xl transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-md">
                  <Package size={28} className="text-white" />
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-600 uppercase">
                    Catering
                  </p>
                  <p className="text-xs text-gray-500 font-medium mt-1">
                    {analytics.cateringCount} paid
                  </p>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-3">
                {formatCurrency(analytics.cateringPaid)}
              </p>
              <div className="flex items-center gap-2 text-sm text-red-600 font-bold">
                <TrendingUp size={16} />
                <span>Completed</span>
              </div>
            </div>

            {/* Pending Credit Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-rose-500 hover:shadow-2xl transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-rose-500 to-red-600 rounded-xl shadow-md">
                  <Clock size={28} className="text-white" />
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-600 uppercase">
                    Pending
                  </p>
                  <p className="text-xs text-gray-500 font-medium mt-1">
                    {analytics.creditCount} credits
                  </p>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-3">
                {formatCurrency(analytics.creditTotal)}
              </p>
              <div className="flex items-center gap-2 text-sm text-rose-600 font-bold">
                <AlertCircle size={16} />
                <span>Awaiting payment</span>
              </div>
            </div>
          </div>
        )}

        {/* Payment Methods - M-PESA and Cash Totals */}
        {canViewFullDashboard &&
          (analytics.mpesaTotal > 0 || analytics.cashTotal > 0) && (
            <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-red-500">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-md">
                  <DollarSign size={28} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Payment Methods Breakdown
                </h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                {/* M-PESA */}
                <div className="p-6 rounded-2xl border-2 border-red-500 hover:shadow-xl transition-all bg-gradient-to-br from-green-50 to-emerald-50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl shadow-md">
                      <Smartphone className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-lg font-bold text-gray-900 uppercase">
                      M-PESA
                    </p>
                  </div>
                  <div className="flex items-end justify-between">
                    <p className="text-3xl font-bold text-gray-900">
                      {formatCurrency(analytics.mpesaTotal)}
                    </p>
                    <p className="text-xl font-bold text-gray-500">
                      {analytics.mpesaCount}{" "}
                      <span className="text-sm">txns</span>
                    </p>
                  </div>
                </div>

                {/* Cash */}
                <div className="p-6 rounded-2xl border-2 border-red-500 hover:shadow-xl transition-all bg-gradient-to-br from-amber-50 to-yellow-50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-gradient-to-br from-amber-600 to-yellow-600 rounded-xl shadow-md">
                      <Banknote className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-lg font-bold text-gray-900 uppercase">
                      CASH
                    </p>
                  </div>
                  <div className="flex items-end justify-between">
                    <p className="text-3xl font-bold text-gray-900">
                      {formatCurrency(analytics.cashTotal)}
                    </p>
                    <p className="text-xl font-bold text-gray-500">
                      {analytics.cashCount}{" "}
                      <span className="text-sm">txns</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Split Payment Info */}
              {analytics.splitCount > 0 && (
                <div className="mt-6 p-5 bg-red-50 rounded-xl border-2 border-red-200">
                  <p className="text-sm font-bold text-gray-700 mb-2">
                    Note: Split Payments ({analytics.splitCount} transactions)
                  </p>
                  <p className="text-sm text-gray-600">
                    Split payments of {formatCurrency(analytics.splitTotal)} are
                    included in the M-PESA and Cash totals above based on their
                    respective portions.
                  </p>
                </div>
              )}
            </div>
          )}

        {/* Walk-In Sales Section */}
        {canViewSales && analytics.walkInSales.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-red-500">
            <button
              onClick={() => setExpandedWalkIn(!expandedWalkIn)}
              className="w-full p-6 flex items-center justify-between hover:bg-red-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-md">
                  <ShoppingCart size={24} className="text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-2xl font-bold text-gray-900">
                    Walk-In Sales
                  </h3>
                  <p className="text-base text-red-600 font-bold">
                    {analytics.walkInSales.length} transactions •{" "}
                    {formatCurrency(analytics.walkInTotal)}
                  </p>
                </div>
              </div>
              {expandedWalkIn ? (
                <ChevronUp className="w-7 h-7 text-gray-900" />
              ) : (
                <ChevronDown className="w-7 h-7 text-gray-900" />
              )}
            </button>

            {expandedWalkIn && (
              <div className="p-6 pt-0 space-y-4 max-h-[600px] overflow-y-auto">
                {analytics.walkInSales.map((sale, idx) => (
                  <div
                    key={sale._id || idx}
                    className="p-5 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl border-2 border-red-200 hover:border-red-500 transition-all"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-sm rounded-lg shadow-md">
                            {formatTime(sale.timestamp)}
                          </span>
                          <span className="text-sm text-gray-600 font-bold">
                            #{idx + 1}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 font-bold">
                          👤 {sale.recordedBy?.fullName || "Unknown"}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-3xl font-bold text-gray-900">
                          {formatCurrency(sale.totalAmount)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4 bg-white rounded-xl p-4 border-2 border-red-100 shadow-sm">
                      {sale.items?.map((item, itemIdx) => (
                        <div
                          key={itemIdx}
                          className="flex justify-between items-center text-sm"
                        >
                          <span className="font-bold text-gray-800">
                            {item.name}{" "}
                            <span className="text-red-600">
                              ×{item.quantity}
                            </span>
                          </span>
                          <span className="font-bold text-gray-900">
                            {formatCurrency(item.total)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <div
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm shadow-md ${
                          sale.paymentMethod === "mpesa"
                            ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white"
                            : sale.paymentMethod === "split"
                            ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                            : "bg-gradient-to-r from-gray-700 to-gray-800 text-white"
                        }`}
                      >
                        {getPaymentIcon(sale.paymentMethod)}
                        {sale.paymentMethod === "mpesa"
                          ? "M-PESA"
                          : sale.paymentMethod === "split"
                          ? "SPLIT"
                          : "CASH"}
                      </div>
                      {sale.mpesaCode && (
                        <span className="text-sm text-gray-600 font-mono bg-gray-100 px-3 py-2 rounded-lg border border-gray-300">
                          {sale.mpesaCode}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Catering Sales Section */}
        {canViewSales && analytics.cateringSales.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-red-500">
            <button
              onClick={() => setExpandedCatering(!expandedCatering)}
              className="w-full p-6 flex items-center justify-between hover:bg-red-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-md">
                  <Package size={24} className="text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-2xl font-bold text-gray-900">
                    Outside Catering Orders
                  </h3>
                  <p className="text-base text-red-600 font-bold">
                    {analytics.cateringSales.length} orders •{" "}
                    {formatCurrency(analytics.cateringPaid)}
                  </p>
                </div>
              </div>
              {expandedCatering ? (
                <ChevronUp className="w-7 h-7 text-gray-900" />
              ) : (
                <ChevronDown className="w-7 h-7 text-gray-900" />
              )}
            </button>

            {expandedCatering && (
              <div className="p-6 pt-0 space-y-4 max-h-[600px] overflow-y-auto">
                {analytics.cateringSales.map((sale, idx) => (
                  <div
                    key={sale._id || idx}
                    className={`p-5 rounded-xl border-2 hover:border-red-500 transition-all ${
                      sale.isPaid
                        ? "bg-gradient-to-r from-red-50 to-rose-50 border-red-200"
                        : "bg-gradient-to-r from-rose-100 to-red-100 border-rose-300"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-4 py-2 font-bold text-sm rounded-lg shadow-md ${
                              sale.isPaid
                                ? "bg-gradient-to-r from-red-600 to-rose-600 text-white"
                                : "bg-gradient-to-r from-rose-600 to-red-700 text-white"
                            }`}
                          >
                            {formatTime(sale.timestamp)}
                          </span>
                          <span className="text-sm text-gray-600 font-bold">
                            #{idx + 1}
                          </span>
                        </div>
                        <p className="text-base font-bold text-gray-900 mb-2">
                          🏢 {sale.customerName || sale.vendorName || "N/A"}
                        </p>
                        <p className="text-sm text-gray-700 font-bold">
                          👤 {sale.recordedBy?.fullName || "Unknown"}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-3xl font-bold ${
                            sale.isPaid ? "text-gray-900" : "text-rose-600"
                          }`}
                        >
                          {formatCurrency(sale.totalAmount)}
                        </span>
                        <div className="mt-2">
                          {sale.isPaid ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-bold rounded-lg shadow-md">
                              ✓ PAID
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-rose-600 to-red-700 text-white text-sm font-bold rounded-lg shadow-md">
                              ⏰ PENDING
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4 bg-white rounded-xl p-4 border-2 border-red-100 shadow-sm">
                      {sale.items?.map((item, itemIdx) => (
                        <div
                          key={itemIdx}
                          className="flex justify-between items-center text-sm"
                        >
                          <span className="font-bold text-gray-800">
                            {item.name}{" "}
                            <span className="text-red-600">
                              ×{item.quantity}
                            </span>
                          </span>
                          <span className="font-bold text-gray-900">
                            {formatCurrency(item.total)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {sale.returnedItems?.length > 0 && (
                      <div className="mb-4 p-3 bg-rose-100 rounded-xl border-2 border-rose-300 shadow-sm">
                        <p className="text-sm font-bold text-rose-800 mb-2 uppercase">
                          ⚠️ Returned Items
                        </p>
                        {sale.returnedItems.map((ret, retIdx) => (
                          <p
                            key={retIdx}
                            className="text-sm text-rose-700 font-bold"
                          >
                            • {ret.item} ({ret.quantity}) - {ret.reason}
                          </p>
                        ))}
                      </div>
                    )}

                    {sale.isPaid && (
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm shadow-md ${
                            sale.paymentMethod === "mpesa"
                              ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white"
                              : sale.paymentMethod === "split"
                              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                              : "bg-gradient-to-r from-gray-700 to-gray-800 text-white"
                          }`}
                        >
                          {getPaymentIcon(sale.paymentMethod)}
                          {sale.paymentMethod === "mpesa"
                            ? "M-PESA"
                            : sale.paymentMethod === "split"
                            ? "SPLIT"
                            : "CASH"}
                        </div>
                        {sale.mpesaCode && (
                          <span className="text-sm text-gray-600 font-mono bg-gray-100 px-3 py-2 rounded-lg border border-gray-300">
                            {sale.mpesaCode}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Outstanding Credits */}
        {canViewSales && credits.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-rose-500">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-rose-500 to-red-600 rounded-xl shadow-md">
                <AlertCircle size={28} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Outstanding Credits
                </h3>
                <p className="text-base text-rose-600 font-bold">
                  {credits.length} pending •{" "}
                  {formatCurrency(analytics.creditTotal)}
                </p>
              </div>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {credits.map((credit, idx) => (
                <div
                  key={idx}
                  className="p-5 bg-gradient-to-r from-rose-50 to-red-50 rounded-xl border-2 border-rose-300 hover:border-rose-500 transition-all shadow-sm"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-lg mb-2 truncate">
                        🏢 {credit.customerName || credit.vendorName}
                      </p>
                      <p className="text-sm text-gray-700 font-bold mb-3 line-clamp-2">
                        {credit.items?.map((item) => item.name).join(", ")}
                      </p>
                      {credit.date && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span className="font-bold">
                            {new Date(credit.date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-rose-600 text-2xl whitespace-nowrap block mb-2">
                        {formatCurrency(credit.amount)}
                      </span>
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-rose-600 to-red-700 text-white text-sm font-bold rounded-lg shadow-md">
                        UNPAID
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vendor Welcome Message */}
        {user?.role === "vendor" && (
          <div className="bg-gradient-to-br from-red-600 via-rose-600 to-red-700 rounded-2xl shadow-2xl p-16 text-center">
            <div className="inline-block p-6 bg-white bg-opacity-20 rounded-2xl mb-6 backdrop-blur-sm">
              <Package size={56} className="text-white" />
            </div>
            <h3 className="text-4xl font-bold text-white mb-3">
              Welcome, {user.fullName}! 👋
            </h3>
            <p className="text-xl text-white opacity-90">
              Use the sidebar to manage your products and view your sales
              performance.
            </p>
          </div>
        )}

        {/* Empty State */}
        {canViewSales &&
          analytics.walkInCount === 0 &&
          analytics.cateringCount === 0 && (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-xl p-20 text-center border-2 border-gray-200">
              <TrendingDown size={80} className="text-gray-300 mx-auto mb-6" />
              <h3 className="text-3xl font-bold text-gray-400 mb-3">
                No Sales Yet Today
              </h3>
              <p className="text-lg text-gray-500">
                Start recording transactions to see them appear here.
              </p>
            </div>
          )}

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 font-medium">
            © 2024 Restaurant POS System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};
