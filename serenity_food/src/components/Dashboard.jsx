import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  DollarSign,
  Package,
  Users,
  Calendar,
  Clock,
  Award,
  Target,
  ShoppingCart,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Store,
  User,
  BarChart3,
} from "lucide-react";
import { OutsideCatering } from "./OutsideCatering";
import { WalkIn } from "./WalkIn";
import { SalesReports } from "./SalesReports";

const API_BASE_URL =
  "https://serenityfoodcourt-t8j7.vercel.app/serenityfoodcourt";

export const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  const [activeView, setActiveView] = useState("dashboard");

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const userRes = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = await userRes.json();

      if (userData.success) {
        setUser(userData.data);

        const statsRes = await fetch(
          `${API_BASE_URL}/dashboard/${userData.data.role}?period=${selectedPeriod}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const statsData = await statsRes.json();

        if (statsData.success) {
          let statsWithCredits = { ...statsData.data };

          if (
            userData.data.role === "manager" ||
            userData.data.role === "vendor"
          ) {
            try {
              const creditsRes = await fetch(
                `${API_BASE_URL}/outside-catering/credits`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );

              if (!creditsRes.ok) {
                throw new Error(`HTTP ${creditsRes.status}`);
              }

              const creditsData = await creditsRes.json();

              if (creditsData.success && Array.isArray(creditsData.data)) {
                const outstandingCredits = creditsData.data.filter(
                  (c) => !c.isPaid
                );

                const enrichedCredits = outstandingCredits.map((credit) => {
                  if (!credit.daysPastDue && credit.dueDate) {
                    const dueDate = new Date(credit.dueDate);
                    const today = new Date();
                    const diffTime = today - dueDate;
                    const diffDays = Math.ceil(
                      diffTime / (1000 * 60 * 60 * 24)
                    );
                    return { ...credit, daysPastDue: Math.max(0, diffDays) };
                  }
                  return credit;
                });

                statsWithCredits.outstandingCredits = enrichedCredits;
                statsWithCredits.totalOutstanding = enrichedCredits.reduce(
                  (sum, c) => sum + c.amount,
                  0
                );
              } else {
                statsWithCredits.outstandingCredits = [];
                statsWithCredits.totalOutstanding = 0;
              }
            } catch (err) {
              console.error("Failed to fetch credits:", err);
              statsWithCredits.outstandingCredits = [];
              statsWithCredits.totalOutstanding = 0;
            }
          }

          setStats(statsWithCredits);
        }
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getNavigationItems = () => {
    if (!user) return [];

    const baseItems = [
      { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    ];

    if (user.role === "manager") {
      return [
        ...baseItems,
        { id: "sales", label: "Sales Reports", icon: TrendingUp },
        { id: "catering", label: "Outside Catering", icon: Package },
        { id: "walkin", label: "Walk-In Sales", icon: ShoppingCart },
      ];
    } else if (user.role === "vendor") {
      return [
        ...baseItems,
        { id: "catering", label: "Outside Catering", icon: Package },
      ];
    } else if (user.role === "shop-attendant") {
      return [
        ...baseItems,
        { id: "walkin", label: "Walk-In Sales", icon: ShoppingCart },
      ];
    }

    return baseItems;
  };

  const renderActiveView = () => {
    switch (activeView) {
      case "sales":
        return <SalesReports />;
      case "catering":
        return <OutsideCatering />;
      case "walkin":
        return <WalkIn />;
      case "dashboard":
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => {
    if (!user || !stats) return null;

    switch (user.role) {
      case "manager":
        return <ManagerDashboard stats={stats} />;
      case "shop-attendant":
        return <ShopAttendantDashboard stats={stats} user={user} />;
      case "vendor":
        return <VendorDashboard stats={stats} user={user} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-6 text-center max-w-md border border-gray-200 shadow-sm">
          <AlertCircle className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-gray-700 font-medium">
            Please log in to view your dashboard
          </p>
        </div>
      </div>
    );
  }

  const navigationItems = getNavigationItems();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <div className="bg-white border-b border-gray-200 p-3 sm:p-4 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            {/* Logo & User Info */}
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 rounded-lg p-2">
                <Store className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                  Serenity Food Court
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 capitalize">
                  {user.role.replace("-", " ")} • {user.fullName}
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 flex-wrap w-full sm:w-auto">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                      activeView === item.id
                        ? "bg-indigo-600 text-white shadow-md"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Icon size={16} />
                    <span className="hidden sm:inline">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-3 sm:p-4 md:p-6">{renderActiveView()}</div>
    </div>
  );
};

// Manager Dashboard
const ManagerDashboard = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          icon={<DollarSign className="text-indigo-600" size={24} />}
          label="Total Revenue"
          value={`KSh ${stats.totalRevenue?.toLocaleString() || 0}`}
          trend={stats.revenueTrend}
        />
        <MetricCard
          icon={<ShoppingCart className="text-blue-600" size={24} />}
          label="Walk-In Sales"
          value={`KSh ${stats.walkInSales?.toLocaleString() || 0}`}
          count={`${stats.walkInCount || 0} transactions`}
        />
        <MetricCard
          icon={<Package className="text-purple-600" size={24} />}
          label="Outside Catering"
          value={`KSh ${stats.cateringSales?.toLocaleString() || 0}`}
          count={`${stats.cateringRounds || 0} rounds`}
        />
        <MetricCard
          icon={<TrendingUp className="text-green-600" size={24} />}
          label="Net Profit"
          value={`KSh ${stats.netProfit?.toLocaleString() || 0}`}
          trend={stats.profitMargin}
        />
      </div>

      {/* Staff Performance */}
      {stats.staffPerformance && stats.staffPerformance.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200">
          <h3 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
            <Users size={20} />
            Staff Performance
          </h3>
          <div className="space-y-3">
            {stats.staffPerformance.map((staff) => (
              <div
                key={staff.userId}
                className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200"
              >
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="font-bold text-gray-900 text-sm sm:text-base">
                      {staff.name}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 capitalize">
                      {staff.role}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg sm:text-xl font-bold text-indigo-600">
                      KSh {staff.salesAmount?.toLocaleString() || 0}
                    </p>
                    <p className="text-xs text-gray-600">
                      {staff.role === "vendor"
                        ? `${staff.rounds || 0} rounds`
                        : `${staff.transactions || 0} sales`}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                  <span className="text-xs sm:text-sm font-medium text-gray-600">
                    {staff.role === "vendor"
                      ? "Commission (19%)"
                      : "Daily Wage"}
                    :
                  </span>
                  <span className="text-sm sm:text-base font-bold text-gray-900">
                    KSh {staff.earnings?.toLocaleString() || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expenses & Profit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200">
          <h3 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
            <TrendingDown size={20} />
            Expenses
          </h3>
          <div className="space-y-3">
            {stats.expenses && stats.expenses.length > 0 ? (
              <>
                {stats.expenses.map((expense, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center pb-3 border-b border-gray-200 last:border-0"
                  >
                    <span className="font-medium text-gray-700 text-sm sm:text-base">
                      {expense.category}
                    </span>
                    <span className="font-bold text-gray-900 text-sm sm:text-base">
                      KSh {expense.amount?.toLocaleString()}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-3 border-t-2 border-gray-300">
                  <span className="font-bold text-gray-900">Total:</span>
                  <span className="text-lg sm:text-xl font-bold text-gray-900">
                    KSh {stats.totalExpenses?.toLocaleString() || 0}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-gray-500 text-center py-4 text-sm">
                No expenses recorded
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200">
          <h3 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
            <Target size={20} />
            Profit Analysis
          </h3>
          <div className="space-y-3">
            <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">
                Gross Revenue
              </p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600">
                KSh {stats.totalRevenue?.toLocaleString() || 0}
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3 sm:p-4 border border-orange-200">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">
                Total Costs
              </p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-orange-600">
                KSh{" "}
                {(
                  (stats.totalExpenses || 0) + (stats.staffWages || 0)
                )?.toLocaleString()}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 sm:p-4 border border-green-200">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">
                Net Profit
              </p>
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-600">
                KSh {stats.netProfit?.toLocaleString() || 0}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Margin: {stats.profitMargin?.toFixed(1) || 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Outstanding Credits */}
      {stats.outstandingCredits && stats.outstandingCredits.length > 0 && (
        <div className="bg-amber-50 rounded-xl shadow-sm p-4 sm:p-6 border-2 border-amber-300">
          <h3 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2 text-amber-900">
            <AlertCircle size={20} />
            Outstanding Credits ({stats.outstandingCredits.length})
          </h3>
          <div className="space-y-2">
            {stats.outstandingCredits.map((credit) => {
              const dueDate = new Date(credit.dueDate);
              const formattedDate = dueDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });

              return (
                <div
                  key={credit._id}
                  className="bg-white rounded-lg p-3 sm:p-4 border border-amber-200"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-gray-900 text-sm sm:text-base">
                        {credit.customerName}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Due: {formattedDate}
                        {credit.daysPastDue > 0 && (
                          <span className="text-red-600 font-semibold ml-2">
                            ({credit.daysPastDue} days overdue)
                          </span>
                        )}
                      </p>
                    </div>
                    <p className="text-base sm:text-lg md:text-xl font-bold text-amber-900">
                      KSh {credit.amount?.toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
            <div className="bg-amber-100 rounded-lg p-3 sm:p-4 border border-amber-300 mt-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900 text-sm sm:text-base">
                  Total Outstanding:
                </span>
                <span className="text-lg sm:text-xl md:text-2xl font-bold text-amber-900">
                  KSh {stats.totalOutstanding?.toLocaleString() || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Shop Attendant Dashboard
const ShopAttendantDashboard = ({ stats, user }) => {
  if (!stats) return null;

  const dailyWage = 550;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
      {/* Earnings */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 sm:p-8 text-white">
        <div className="flex items-center gap-3 sm:gap-4 mb-4">
          <Award size={36} className="sm:w-12 sm:h-12" />
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">
              Your Earnings Today
            </h2>
            <p className="text-indigo-200 text-sm sm:text-base">
              Fixed daily wage
            </p>
          </div>
        </div>
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 sm:p-6">
          <p className="text-3xl sm:text-4xl md:text-5xl font-bold">
            KSh {dailyWage.toLocaleString()}
          </p>
          <p className="text-indigo-200 mt-1 text-sm sm:text-base">
            Daily Rate
          </p>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <MetricCard
          icon={<ShoppingCart className="text-blue-600" size={24} />}
          label="Sales Processed"
          value={stats.salesCount || 0}
          subtext="transactions"
        />
        <MetricCard
          icon={<DollarSign className="text-green-600" size={24} />}
          label="Total Sales Value"
          value={`KSh ${stats.totalSales?.toLocaleString() || 0}`}
        />
        <MetricCard
          icon={<TrendingUp className="text-purple-600" size={24} />}
          label="Average Sale"
          value={`KSh ${stats.averageSale?.toLocaleString() || 0}`}
        />
      </div>

      {/* Performance Details */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200">
        <h3 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
          <Target size={20} />
          Your Performance
        </h3>
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-gray-700 text-sm sm:text-base">
                Today's Target
              </span>
              <span className="font-bold text-gray-900">20 sales</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 sm:h-4">
              <div
                className="bg-gradient-to-r from-indigo-600 to-purple-600 h-3 sm:h-4 rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    ((stats.salesCount || 0) / 20) * 100,
                    100
                  )}%`,
                }}
              ></div>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mt-2">
              {stats.salesCount || 0} of 20 completed (
              {Math.round(((stats.salesCount || 0) / 20) * 100)}%)
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
            <p className="font-medium text-gray-900 mb-3 text-sm sm:text-base">
              Payment Methods
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm sm:text-base">
                <span className="text-gray-600">Cash:</span>
                <span className="font-bold text-gray-900">
                  KSh {stats.cashSales?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between text-sm sm:text-base">
                <span className="text-gray-600">M-Pesa:</span>
                <span className="font-bold text-gray-900">
                  KSh {stats.mpesaSales?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between text-sm sm:text-base">
                <span className="text-gray-600">Split:</span>
                <span className="font-bold text-gray-900">
                  KSh {stats.splitSales?.toLocaleString() || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Items */}
      {stats.topItems && stats.topItems.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200">
          <h3 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
            <Package size={20} />
            Top Selling Items
          </h3>
          <div className="space-y-3">
            {stats.topItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl sm:text-3xl">
                    {item.icon || "🍽️"}
                  </span>
                  <div>
                    <p className="font-bold text-gray-900 text-sm sm:text-base">
                      {item.name}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {item.quantity} sold
                    </p>
                  </div>
                </div>
                <p className="font-bold text-indigo-600 text-sm sm:text-base">
                  KSh {item.total?.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Vendor Dashboard
const VendorDashboard = ({ stats, user }) => {
  if (!stats) return null;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
      {/* Commission Earnings */}
      <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl shadow-lg p-6 sm:p-8 text-white">
        <div className="flex items-center gap-3 sm:gap-4 mb-4">
          <Award size={36} className="sm:w-12 sm:h-12" />
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">
              Your Commission Today
            </h2>
            <p className="text-green-200 text-sm sm:text-base">
              19% of net sales
            </p>
          </div>
        </div>
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 sm:p-6 mb-4">
          <p className="text-4xl sm:text-5xl md:text-6xl font-bold mb-2">
            KSh {stats.totalCommission?.toLocaleString() || 0}
          </p>
          <p className="text-green-200 text-sm sm:text-base">
            From {stats.roundsCompleted || 0} rounds
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-white/10 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-green-200">Gross Sales</p>
            <p className="text-lg sm:text-xl md:text-2xl font-bold">
              KSh {stats.grossSales?.toLocaleString() || 0}
            </p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-green-200">Returns</p>
            <p className="text-lg sm:text-xl md:text-2xl font-bold">
              KSh {stats.totalReturns?.toLocaleString() || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Today's Rounds */}
      {stats.rounds && stats.rounds.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200">
          <h3 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
            <Clock size={20} />
            Today's Rounds ({stats.roundsCompleted || 0})
          </h3>
          <div className="space-y-3">
            {stats.rounds.map((round, idx) => (
              <div
                key={idx}
                className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-gray-900 text-sm sm:text-base">
                      Round {round.number}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {new Date(round.startTime).toLocaleTimeString()} -{" "}
                      {new Date(round.endTime).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                      KSh {round.netTotal?.toLocaleString()}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Net Sales
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-3 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-600">Expected</p>
                    <p className="font-bold text-gray-900 text-sm sm:text-base">
                      KSh {round.expected?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Returns</p>
                    <p className="font-bold text-gray-900 text-sm sm:text-base">
                      KSh {round.returns?.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-green-100 rounded-lg p-2 border border-green-200">
                    <p className="text-xs text-gray-600">Your Cut</p>
                    <p className="font-bold text-green-700 text-sm sm:text-base">
                      KSh {round.commission?.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Credits */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200">
          <h3 className="text-base sm:text-lg font-bold mb-4 flex items-center gap-2 text-gray-900">
            <DollarSign size={18} />
            Credits Given
          </h3>
          <div className="bg-orange-50 rounded-lg p-4 sm:p-6 border border-orange-200">
            <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-orange-600 mb-2">
              KSh {stats.creditsGiven?.toLocaleString() || 0}
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              {stats.creditCount || 0} customers
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200">
          <h3 className="text-base sm:text-lg font-bold mb-4 flex items-center gap-2 text-gray-900">
            <CheckCircle size={18} />
            Credits Collected
          </h3>
          <div className="bg-green-50 rounded-lg p-4 sm:p-6 border border-green-200">
            <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-600 mb-2">
              KSh {stats.creditsCollected?.toLocaleString() || 0}
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              {stats.collectionsCount || 0} payments
            </p>
          </div>
        </div>
      </div>

      {/* Outstanding Credits */}
      {stats.outstandingCredits && stats.outstandingCredits.length > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3 mb-4">
            <AlertCircle size={24} className="text-red-600 flex-shrink-0" />
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-red-900">
                Outstanding Credits
              </h3>
              <p className="text-xs sm:text-sm text-red-700">
                Will be deducted from your commission!
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 sm:p-4 border border-red-200">
            <div className="space-y-2">
              {stats.outstandingCredits.map((credit) => {
                const dueDate = new Date(credit.dueDate);
                const today = new Date();
                const isOverdue = dueDate < today;

                return (
                  <div
                    key={credit._id}
                    className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0"
                  >
                    <div>
                      <p className="font-bold text-gray-900 text-sm sm:text-base">
                        {credit.customerName}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {credit.daysPastDue > 0
                          ? `${credit.daysPastDue} days overdue`
                          : isOverdue
                          ? "Overdue"
                          : `Due ${dueDate.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}`}
                      </p>
                    </div>
                    <p className="text-base sm:text-lg font-bold text-red-600">
                      KSh {credit.amount?.toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="border-t-2 border-red-300 mt-4 pt-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900 text-sm sm:text-base">
                  Total at Risk:
                </span>
                <span className="text-xl sm:text-2xl md:text-3xl font-bold text-red-600">
                  KSh {stats.totalOutstanding?.toLocaleString() || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ icon, label, value, subtext, trend, count }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="bg-gray-50 rounded-lg p-2">{icon}</div>
        {trend !== undefined && (
          <span
            className={`text-xs sm:text-sm font-bold ${
              trend > 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">
        {label}
      </p>
      <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1">
        {value}
      </p>
      {(subtext || count) && (
        <p className="text-xs sm:text-sm text-gray-600">{subtext || count}</p>
      )}
    </div>
  );
};

export default Dashboard;
