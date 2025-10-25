import React, { useMemo } from "react";
import {
  TrendingUp,
  ShoppingCart,
  Package,
  Clock,
  ArrowUp,
  DollarSign,
} from "lucide-react";

export const Dashboard = ({ summaryData, credits }) => {
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
        paymentMethods: [],
      };
    }

    const walkInData = summaryData.todaySales?.find(
      (s) => s._id === "walk-in"
    ) || { totalAmount: 0, count: 0 };
    const cateringData = summaryData.todaySales?.find(
      (s) => s._id === "outside-catering"
    ) || { totalAmount: 0, count: 0 };
    const creditTotal = credits.reduce((sum, c) => sum + c.amount, 0);

    return {
      walkInTotal: walkInData.totalAmount,
      cateringPaid: cateringData.totalAmount,
      creditTotal,
      grandTotal: walkInData.totalAmount + cateringData.totalAmount,
      walkInCount: walkInData.count,
      cateringCount: cateringData.count,
      creditCount: credits.length,
      paymentMethods: summaryData.paymentMethods || [],
    };
  }, [summaryData, credits]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-1">Dashboard</h2>
        {/* <p className="text-gray-500">Real-time cafe performance overview</p> */}
        {summaryData?.date && (
          <p className="text-sm text-indigo-600 font-medium mt-2">
            {new Date(summaryData.date).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}
      </div>

      {/* Grand Total Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-3xl shadow-2xl p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <TrendingUp size={28} className="text-white" />
            </div>
            <div>
              <h3 className="text-white/90 text-sm font-medium">
                Total Revenue
              </h3>
              <p className="text-white text-xs">All paid transactions</p>
            </div>
          </div>
          <p className="text-white text-5xl md:text-6xl font-bold tracking-tight">
            KSh {analytics.grandTotal.toLocaleString()}
          </p>
          <div className="mt-4 flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <ArrowUp size={16} className="text-white" />
              <span className="text-white text-sm font-medium">Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <ShoppingCart size={24} className="text-blue-600" />
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-500">Walk-In</p>
              <p className="text-xs text-gray-400">
                {analytics.walkInCount} sales
              </p>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            KSh {analytics.walkInTotal.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 rounded-xl">
              <Package size={24} className="text-purple-600" />
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-500">Catering</p>
              <p className="text-xs text-gray-400">
                {analytics.cateringCount} paid
              </p>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            KSh {analytics.cateringPaid.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border-l-4 border-amber-500">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-50 rounded-xl">
              <Clock size={24} className="text-amber-600" />
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-xs text-gray-400">
                {analytics.creditCount} credits
              </p>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            KSh {analytics.creditTotal.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Payment Methods */}
      {analytics.paymentMethods.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign size={24} className="text-indigo-600" />
            Payment Methods
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {analytics.paymentMethods.map((method) => (
              <div
                key={method._id}
                className={`p-5 rounded-xl ${
                  method._id === "mpesa"
                    ? "bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200"
                    : "bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200"
                }`}
              >
                <p className="text-sm font-semibold text-gray-600 mb-2">
                  {method._id === "mpesa" ? "M-PESA" : "Cash"}
                </p>
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-bold text-gray-900">
                    KSh {method.totalAmount.toLocaleString()}
                  </p>
                  <p className="text-lg font-bold text-gray-400">
                    {method.count}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outstanding Credits */}
      {credits.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Outstanding Credits
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {credits.map((credit, idx) => (
              <div
                key={idx}
                className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">
                      {credit.customerName || credit.vendorName}
                    </p>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {credit.items?.map((item) => item.name).join(", ")}
                    </p>
                    {credit.date && (
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(credit.date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <span className="font-bold text-amber-600 text-lg whitespace-nowrap">
                    KSh {credit.amount.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
