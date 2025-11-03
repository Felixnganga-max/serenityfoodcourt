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
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-black rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-8 h-8 text-orange-500" />
                <h2 className="text-3xl font-bold text-white">Dashboard</h2>
              </div>
              {summaryData?.date && (
                <div className="flex items-center gap-2 bg-white bg-opacity-10 px-3 py-1 rounded-lg w-fit">
                  <Calendar className="w-4 h-4 text-white" />
                  <p className="text-sm text-white font-medium">
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
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border-2 border-orange-500">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-black text-sm">
                    {user.fullName}
                  </p>
                  <div className="flex items-center gap-1">
                    <Shield className="w-3 h-3 text-orange-500" />
                    <span className="text-xs font-bold text-orange-500 uppercase">
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Total Revenue Card */}
        <div className="bg-orange-500 rounded-2xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white rounded-lg">
              <DollarSign size={28} className="text-orange-500" />
            </div>
            <div>
              <h3 className="text-white text-base font-bold">
                {canViewFullDashboard ? "TOTAL REVENUE" : "TODAY'S SALES"}
              </h3>
              <p className="text-white text-sm opacity-90">
                {canViewFullDashboard
                  ? "All paid transactions today"
                  : "Your transactions today"}
              </p>
            </div>
          </div>

          <div className="flex items-end gap-3 mb-6">
            <p className="text-white text-5xl font-bold">
              {formatCurrency(analytics.grandTotal)}
            </p>
            <div className="flex items-center gap-1 bg-white bg-opacity-20 px-3 py-1 rounded-lg mb-1">
              <ArrowUp size={16} className="text-white" />
              <span className="text-white text-sm font-bold">LIVE</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <p className="text-white text-xs mb-1">Transactions</p>
              <p className="text-white text-xl font-bold">
                {analytics.walkInCount + analytics.cateringCount}
              </p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <p className="text-white text-xs mb-1">Walk-In</p>
              <p className="text-white text-xl font-bold">
                {analytics.walkInCount}
              </p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <p className="text-white text-xs mb-1">Catering</p>
              <p className="text-white text-xl font-bold">
                {analytics.cateringCount}
              </p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <p className="text-white text-xs mb-1">Pending</p>
              <p className="text-white text-xl font-bold">
                {analytics.creditCount}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        {canViewSales && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Walk-In Card */}
            <div className="bg-white rounded-xl shadow-lg p-5 border-2 border-black hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-black rounded-lg">
                  <ShoppingCart size={24} className="text-white" />
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-500 uppercase">
                    Walk-In
                  </p>
                  <p className="text-xs text-gray-400 font-medium mt-1">
                    {analytics.walkInCount} sales
                  </p>
                </div>
              </div>
              <p className="text-2xl font-bold text-black mb-2">
                {formatCurrency(analytics.walkInTotal)}
              </p>
              <div className="flex items-center gap-2 text-sm text-orange-500 font-medium">
                <TrendingUp size={14} />
                <span>Active today</span>
              </div>
            </div>

            {/* Catering Card */}
            <div className="bg-white rounded-xl shadow-lg p-5 border-2 border-black hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-black rounded-lg">
                  <Package size={24} className="text-white" />
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-500 uppercase">
                    Catering
                  </p>
                  <p className="text-xs text-gray-400 font-medium mt-1">
                    {analytics.cateringCount} paid
                  </p>
                </div>
              </div>
              <p className="text-2xl font-bold text-black mb-2">
                {formatCurrency(analytics.cateringPaid)}
              </p>
              <div className="flex items-center gap-2 text-sm text-orange-500 font-medium">
                <TrendingUp size={14} />
                <span>Completed</span>
              </div>
            </div>

            {/* Pending Credit Card */}
            <div className="bg-white rounded-xl shadow-lg p-5 border-2 border-red-500 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-red-500 rounded-lg">
                  <Clock size={24} className="text-white" />
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-500 uppercase">
                    Pending
                  </p>
                  <p className="text-xs text-gray-400 font-medium mt-1">
                    {analytics.creditCount} credits
                  </p>
                </div>
              </div>
              <p className="text-2xl font-bold text-black mb-2">
                {formatCurrency(analytics.creditTotal)}
              </p>
              <div className="flex items-center gap-2 text-sm text-red-500 font-medium">
                <AlertCircle size={14} />
                <span>Awaiting payment</span>
              </div>
            </div>
          </div>
        )}

        {/* Walk-In Sales Section */}
        {canViewSales && analytics.walkInSales.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-black">
            <button
              onClick={() => setExpandedWalkIn(!expandedWalkIn)}
              className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-black rounded-lg">
                  <ShoppingCart size={20} className="text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold text-black">
                    Walk-In Sales
                  </h3>
                  <p className="text-sm text-orange-500 font-medium">
                    {analytics.walkInSales.length} transactions •{" "}
                    {formatCurrency(analytics.walkInTotal)}
                  </p>
                </div>
              </div>
              {expandedWalkIn ? (
                <ChevronUp className="w-6 h-6 text-black" />
              ) : (
                <ChevronDown className="w-6 h-6 text-black" />
              )}
            </button>

            {expandedWalkIn && (
              <div className="p-5 pt-0 space-y-3 max-h-[600px] overflow-y-auto">
                {analytics.walkInSales.map((sale, idx) => (
                  <div
                    key={sale._id || idx}
                    className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200 hover:border-black transition-all"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-3 py-1 bg-black text-white font-bold text-xs rounded">
                            {formatTime(sale.timestamp)}
                          </span>
                          <span className="text-xs text-gray-500 font-medium">
                            #{idx + 1}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 font-medium">
                          👤 {sale.recordedBy?.fullName || "Unknown"}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-black">
                          {formatCurrency(sale.totalAmount)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-3 bg-white rounded-lg p-3 border border-gray-200">
                      {sale.items?.map((item, itemIdx) => (
                        <div
                          key={itemIdx}
                          className="flex justify-between items-center text-sm"
                        >
                          <span className="font-medium text-gray-800">
                            {item.name}{" "}
                            <span className="text-orange-500">
                              ×{item.quantity}
                            </span>
                          </span>
                          <span className="font-bold text-black">
                            {formatCurrency(item.total)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <div
                        className={`flex items-center gap-2 px-3 py-1 rounded font-bold text-xs ${
                          sale.paymentMethod === "mpesa"
                            ? "bg-black text-white"
                            : sale.paymentMethod === "split"
                            ? "bg-orange-500 text-white"
                            : "bg-gray-700 text-white"
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
                        <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
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
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-black">
            <button
              onClick={() => setExpandedCatering(!expandedCatering)}
              className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-black rounded-lg">
                  <Package size={20} className="text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold text-black">
                    Outside Catering Orders
                  </h3>
                  <p className="text-sm text-orange-500 font-medium">
                    {analytics.cateringSales.length} orders •{" "}
                    {formatCurrency(analytics.cateringPaid)}
                  </p>
                </div>
              </div>
              {expandedCatering ? (
                <ChevronUp className="w-6 h-6 text-black" />
              ) : (
                <ChevronDown className="w-6 h-6 text-black" />
              )}
            </button>

            {expandedCatering && (
              <div className="p-5 pt-0 space-y-3 max-h-[600px] overflow-y-auto">
                {analytics.cateringSales.map((sale, idx) => (
                  <div
                    key={sale._id || idx}
                    className={`p-4 rounded-lg border-2 hover:border-black transition-all ${
                      sale.isPaid
                        ? "bg-gray-50 border-gray-200"
                        : "bg-red-50 border-red-300"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-3 py-1 font-bold text-xs rounded ${
                              sale.isPaid
                                ? "bg-black text-white"
                                : "bg-red-500 text-white"
                            }`}
                          >
                            {formatTime(sale.timestamp)}
                          </span>
                          <span className="text-xs text-gray-500 font-medium">
                            #{idx + 1}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-black mb-1">
                          🏢 {sale.customerName || sale.vendorName || "N/A"}
                        </p>
                        <p className="text-xs text-gray-600 font-medium">
                          👤 {sale.recordedBy?.fullName || "Unknown"}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-2xl font-bold ${
                            sale.isPaid ? "text-black" : "text-red-500"
                          }`}
                        >
                          {formatCurrency(sale.totalAmount)}
                        </span>
                        <div className="mt-1">
                          {sale.isPaid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white text-xs font-bold rounded">
                              ✓ PAID
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
                              ⏰ PENDING
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-3 bg-white rounded-lg p-3 border border-gray-200">
                      {sale.items?.map((item, itemIdx) => (
                        <div
                          key={itemIdx}
                          className="flex justify-between items-center text-sm"
                        >
                          <span className="font-medium text-gray-800">
                            {item.name}{" "}
                            <span className="text-orange-500">
                              ×{item.quantity}
                            </span>
                          </span>
                          <span className="font-bold text-black">
                            {formatCurrency(item.total)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {sale.returnedItems?.length > 0 && (
                      <div className="mb-3 p-2 bg-red-100 rounded-lg border-2 border-red-300">
                        <p className="text-xs font-bold text-red-700 mb-1 uppercase">
                          ⚠️ Returned Items
                        </p>
                        {sale.returnedItems.map((ret, retIdx) => (
                          <p
                            key={retIdx}
                            className="text-xs text-red-600 font-medium"
                          >
                            • {ret.item} ({ret.quantity}) - {ret.reason}
                          </p>
                        ))}
                      </div>
                    )}

                    {sale.isPaid && (
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex items-center gap-2 px-3 py-1 rounded font-bold text-xs ${
                            sale.paymentMethod === "mpesa"
                              ? "bg-black text-white"
                              : sale.paymentMethod === "split"
                              ? "bg-orange-500 text-white"
                              : "bg-gray-700 text-white"
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
                          <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
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

        {/* Payment Methods - Separated M-PESA and Cash */}
        {canViewFullDashboard &&
          (analytics.mpesaTotal > 0 || analytics.cashTotal > 0) && (
            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-black">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <DollarSign size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-black">
                  Payment Methods Breakdown
                </h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {/* M-PESA */}
                <div className="p-5 rounded-lg border-2 border-black hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-black rounded-lg">
                      <Smartphone className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-base font-bold text-black uppercase">
                      M-PESA
                    </p>
                  </div>
                  <div className="flex items-end justify-between">
                    <p className="text-2xl font-bold text-black">
                      {formatCurrency(analytics.mpesaTotal)}
                    </p>
                    <p className="text-lg font-bold text-gray-400">
                      {analytics.mpesaCount}{" "}
                      <span className="text-xs">txns</span>
                    </p>
                  </div>
                </div>

                {/* Cash */}
                <div className="p-5 rounded-lg border-2 border-black hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-black rounded-lg">
                      <Banknote className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-base font-bold text-black uppercase">
                      CASH
                    </p>
                  </div>
                  <div className="flex items-end justify-between">
                    <p className="text-2xl font-bold text-black">
                      {formatCurrency(analytics.cashTotal)}
                    </p>
                    <p className="text-lg font-bold text-gray-400">
                      {analytics.cashCount}{" "}
                      <span className="text-xs">txns</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Split Payment Info */}
              {analytics.splitCount > 0 && (
                <div className="mt-4 p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
                  <p className="text-xs font-bold text-gray-600 mb-2">
                    Note: Split Payments ({analytics.splitCount} transactions)
                  </p>
                  <p className="text-xs text-gray-600">
                    Split payments of {formatCurrency(analytics.splitTotal)} are
                    included in the M-PESA and Cash totals above based on their
                    respective portions.
                  </p>
                </div>
              )}
            </div>
          )}

        {/* Outstanding Credits */}
        {canViewSales && credits.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-red-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500 rounded-lg">
                <AlertCircle size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-black">
                  Outstanding Credits
                </h3>
                <p className="text-sm text-red-500 font-medium">
                  {credits.length} pending •{" "}
                  {formatCurrency(analytics.creditTotal)}
                </p>
              </div>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {credits.map((credit, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-red-50 rounded-lg border-2 border-red-200 hover:border-red-500 transition-all"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-black text-base mb-1 truncate">
                        🏢 {credit.customerName || credit.vendorName}
                      </p>
                      <p className="text-sm text-gray-700 font-medium mb-2 line-clamp-2">
                        {credit.items?.map((item) => item.name).join(", ")}
                      </p>
                      {credit.date && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span className="font-medium">
                            {new Date(credit.date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-red-500 text-xl whitespace-nowrap block mb-1">
                        {formatCurrency(credit.amount)}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
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
          <div className="bg-black rounded-xl shadow-lg p-12 text-center">
            <div className="inline-block p-5 bg-orange-500 rounded-xl mb-4">
              <Package size={48} className="text-white" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-2">
              Welcome, {user.fullName}! 👋
            </h3>
            <p className="text-base text-gray-300">
              Use the sidebar to manage your products and view your sales
              performance.
            </p>
          </div>
        )}

        {/* Empty State */}
        {canViewSales &&
          analytics.walkInCount === 0 &&
          analytics.cateringCount === 0 && (
            <div className="bg-gray-50 rounded-xl shadow-lg p-16 text-center border-2 border-gray-200">
              <TrendingDown size={64} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-400 mb-2">
                No Sales Yet Today
              </h3>
              <p className="text-base text-gray-500">
                Start recording transactions to see them appear here.
              </p>
            </div>
          )}

        {/* Footer */}
        <div className="text-center py-6">
          <p className="text-sm text-gray-500">
            © 2024 Restaurant POS System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};
