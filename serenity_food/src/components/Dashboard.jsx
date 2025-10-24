import React, { useMemo } from "react";
import { TrendingUp, ShoppingCart, Package, Clock } from "lucide-react";

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
        todaySales: [],
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
      todaySales: summaryData.todaySales || [],
      paymentMethods: summaryData.paymentMethods || [],
    };
  }, [summaryData, credits]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h2>
        <p className="text-gray-600 text-lg">
          Overview of your cafe's performance
        </p>
        {summaryData?.date && (
          <p className="text-sm text-gray-500 mt-1">
            Data for:{" "}
            {new Date(summaryData.date).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}
      </div>

      <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl shadow-2xl p-10 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold mb-2">Grand Total Revenue</h3>
            <p className="text-blue-100">All paid transactions today</p>
          </div>
          <TrendingUp size={48} />
        </div>
        <p className="text-6xl font-bold">
          KSh {analytics.grandTotal.toLocaleString()}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center gap-3 mb-3">
            <ShoppingCart size={28} />
            <h3 className="text-lg font-semibold">Walk-In Sales</h3>
          </div>
          <p className="text-4xl font-bold mb-2">
            KSh {analytics.walkInTotal.toLocaleString()}
          </p>
          <p className="text-sm opacity-75">
            {analytics.walkInCount} transactions
          </p>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center gap-3 mb-3">
            <Package size={28} />
            <h3 className="text-lg font-semibold">Catering Paid</h3>
          </div>
          <p className="text-4xl font-bold mb-2">
            KSh {analytics.cateringPaid.toLocaleString()}
          </p>
          <p className="text-sm opacity-75">
            {analytics.cateringCount} orders paid
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center gap-3 mb-3">
            <Clock size={28} />
            <h3 className="text-lg font-semibold">Pending Credit</h3>
          </div>
          <p className="text-4xl font-bold mb-2">
            KSh {analytics.creditTotal.toLocaleString()}
          </p>
          <p className="text-sm opacity-75">{analytics.creditCount} unpaid</p>
        </div>
      </div>

      {/* Payment Methods Breakdown */}
      {analytics.paymentMethods.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Payment Methods Today
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {analytics.paymentMethods.map((method) => (
              <div
                key={method._id}
                className={`p-6 rounded-xl border-l-4 ${
                  method._id === "mpesa"
                    ? "bg-green-50 border-green-500"
                    : "bg-blue-50 border-blue-500"
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">
                      {method._id === "mpesa" ? "M-PESA" : "Cash"}
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      KSh {method.totalAmount.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-600">
                      {method.count}
                    </p>
                    <p className="text-xs text-gray-500">transactions</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outstanding Credits */}
      {credits.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Outstanding Credits
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {credits.map((credit, idx) => (
              <div
                key={idx}
                className="p-4 bg-amber-50 rounded-xl border-l-4 border-amber-500"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-gray-900">
                      {credit.customerName || credit.vendorName}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {credit.items?.map((item) => item.name).join(", ")}
                    </p>
                    {credit.date && (
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(credit.date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <span className="font-bold text-amber-600 text-lg">
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
