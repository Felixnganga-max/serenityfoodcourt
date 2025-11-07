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
} from "lucide-react";

const API_BASE_URL = "http://localhost:5000/serenityfoodcourt";

export const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("today");

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
      // Fetch current user
      const userRes = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = await userRes.json();

      if (userData.success) {
        setUser(userData.data);

        // Fetch role-specific stats
        const statsRes = await fetch(
          `${API_BASE_URL}/dashboard/${userData.data.role}?period=${selectedPeriod}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const statsData = await statsRes.json();

        if (statsData.success) {
          let statsWithCredits = { ...statsData.data };

          // Fetch credits for manager and vendor roles (outside catering only)
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

                // Add day past due calculation if not present
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white font-bold text-lg">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-8">
        <div className="bg-red-900 rounded-2xl p-8 text-center max-w-md">
          <AlertCircle className="mx-auto mb-4 text-white" size={48} />
          <p className="text-white text-lg font-bold">
            Please log in to view your dashboard
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-900 via-black to-red-900 rounded-3xl shadow-2xl p-8 mb-6 border-2 border-red-900">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Welcome back, {user.fullName}! 🔥
            </h1>
            <p className="text-red-300 text-lg">
              {user.role === "manager" && "Managing Serenity Food Court"}
              {user.role === "shop-attendant" && "Walk-In Sales Dashboard"}
              {user.role === "vendor" && "Outside Catering Dashboard"}
            </p>
          </div>

          {/* Period Selector */}
          <div className="flex gap-2 bg-red-900/30 backdrop-blur-sm rounded-xl p-2 border border-red-900">
            {["today", "week", "month"].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-6 py-2 rounded-lg font-bold transition-all ${
                  selectedPeriod === period
                    ? "bg-red-900 text-white shadow-lg"
                    : "text-white hover:bg-red-900/50"
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Role-Based Dashboard Content */}
      {user.role === "manager" && <ManagerDashboard stats={stats} />}
      {user.role === "shop-attendant" && (
        <ShopAttendantDashboard stats={stats} user={user} />
      )}
      {user.role === "vendor" && <VendorDashboard stats={stats} user={user} />}
    </div>
  );
};

// Manager Dashboard - Full Access
const ManagerDashboard = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<DollarSign className="text-red-900" size={32} />}
          label="Total Revenue"
          value={`KSh ${stats.totalRevenue?.toLocaleString() || 0}`}
          trend={stats.revenueTrend}
          bgColor="bg-white"
          borderColor="border-red-900"
        />
        <MetricCard
          icon={<ShoppingCart className="text-red-900" size={32} />}
          label="Walk-In Sales"
          value={`KSh ${stats.walkInSales?.toLocaleString() || 0}`}
          count={`${stats.walkInCount || 0} transactions`}
          bgColor="bg-white"
          borderColor="border-red-900"
        />
        <MetricCard
          icon={<Package className="text-red-900" size={32} />}
          label="Outside Catering"
          value={`KSh ${stats.cateringSales?.toLocaleString() || 0}`}
          count={`${stats.cateringRounds || 0} rounds`}
          bgColor="bg-white"
          borderColor="border-red-900"
        />
        <MetricCard
          icon={<TrendingUp className="text-red-900" size={32} />}
          label="Net Profit"
          value={`KSh ${stats.netProfit?.toLocaleString() || 0}`}
          trend={stats.profitMargin}
          bgColor="bg-white"
          borderColor="border-red-900"
        />
      </div>

      {/* Staff Performance */}
      {stats.staffPerformance && stats.staffPerformance.length > 0 && (
        <div className="bg-red-900 rounded-2xl shadow-2xl p-6 border-2 border-white">
          <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-white">
            <Users size={24} />
            Staff Performance
          </h3>
          <div className="space-y-3">
            {stats.staffPerformance.map((staff) => (
              <div
                key={staff.userId}
                className="bg-black rounded-xl p-4 border-2 border-red-900"
              >
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="font-bold text-white">{staff.name}</p>
                    <p className="text-sm text-red-300 capitalize">
                      {staff.role}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-red-900">
                      KSh {staff.salesAmount?.toLocaleString() || 0}
                    </p>
                    <p className="text-sm text-red-300">
                      {staff.role === "vendor"
                        ? `${staff.rounds || 0} rounds completed`
                        : `${staff.transactions || 0} transactions`}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-red-900">
                  <span className="text-sm font-medium text-red-300">
                    {staff.role === "vendor"
                      ? "Commission (19%)"
                      : "Daily Wage"}
                    :
                  </span>
                  <span className="text-lg font-bold text-white">
                    KSh {staff.earnings?.toLocaleString() || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expenses & Profit Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-red-900 rounded-2xl shadow-2xl p-6 border-2 border-white">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
            <TrendingDown size={24} />
            Expenses Breakdown
          </h3>
          <div className="space-y-3">
            {stats.expenses && stats.expenses.length > 0 ? (
              <>
                {stats.expenses.map((expense, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center pb-3 border-b border-white/20 last:border-0"
                  >
                    <span className="font-medium text-red-300">
                      {expense.category}
                    </span>
                    <span className="font-bold text-white">
                      KSh {expense.amount?.toLocaleString()}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-3 border-t-2 border-white">
                  <span className="font-bold text-white">Total Expenses:</span>
                  <span className="text-xl font-bold text-white">
                    KSh {stats.totalExpenses?.toLocaleString() || 0}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-red-300 text-center py-4">
                No expenses recorded
              </p>
            )}
          </div>
        </div>

        <div className="bg-red-900 rounded-2xl shadow-2xl p-6 border-2 border-white">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
            <Target size={24} />
            Profit Analysis
          </h3>
          <div className="space-y-4">
            <div className="bg-black rounded-xl p-4 border-2 border-white">
              <p className="text-sm text-red-300 mb-1">Gross Revenue</p>
              <p className="text-3xl font-bold text-white">
                KSh {stats.totalRevenue?.toLocaleString() || 0}
              </p>
            </div>
            <div className="bg-black rounded-xl p-4 border-2 border-red-900">
              <p className="text-sm text-red-300 mb-1">Total Costs</p>
              <p className="text-3xl font-bold text-white">
                KSh{" "}
                {(
                  (stats.totalExpenses || 0) + (stats.staffWages || 0)
                )?.toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 border-2 border-red-900">
              <p className="text-sm text-red-900 mb-1">Net Profit</p>
              <p className="text-4xl font-bold text-red-900">
                KSh {stats.netProfit?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-black mt-2">
                Margin: {stats.profitMargin?.toFixed(1) || 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Outstanding Credits */}
      {stats.outstandingCredits && stats.outstandingCredits.length > 0 && (
        <div className="bg-red-900 rounded-2xl shadow-2xl p-6 border-2 border-white">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
            <AlertCircle size={24} />
            Outstanding Credits ({stats.outstandingCredits.length})
          </h3>
          <div className="space-y-2">
            {stats.outstandingCredits.map((credit) => {
              const dueDate = new Date(credit.dueDate);
              const formattedDate = dueDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <div
                  key={credit._id}
                  className="bg-black rounded-xl p-4 border-2 border-red-900"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-white">
                        {credit.customerName}
                      </p>
                      <p className="text-sm text-red-300">
                        Due: {formattedDate}
                        {credit.daysPastDue > 0 && (
                          <span className="text-red-500 font-semibold ml-2">
                            ({credit.daysPastDue} days overdue)
                          </span>
                        )}
                      </p>
                    </div>
                    <p className="text-xl font-bold text-red-900">
                      KSh {credit.amount?.toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
            <div className="bg-white rounded-xl p-4 border-2 border-red-900 mt-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-black">Total Outstanding:</span>
                <span className="text-2xl font-bold text-red-900">
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

// Shop Attendant Dashboard - Walk-In Sales Focus
const ShopAttendantDashboard = ({ stats, user }) => {
  if (!stats) return null;

  const dailyWage = 550;

  return (
    <div className="space-y-6">
      {/* Personal Earnings */}
      <div className="bg-gradient-to-r from-red-900 via-black to-red-900 rounded-2xl shadow-2xl p-8 border-2 border-white">
        <div className="flex items-center gap-4 mb-4">
          <Award size={48} className="text-white" />
          <div>
            <h2 className="text-3xl font-bold text-white">
              Your Earnings Today
            </h2>
            <p className="text-red-300">Fixed daily wage</p>
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border-2 border-white">
          <p className="text-5xl font-bold text-white">
            KSh {dailyWage.toLocaleString()}
          </p>
          <p className="text-red-300 mt-2">Daily Rate</p>
        </div>
      </div>

      {/* Your Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          icon={<ShoppingCart className="text-red-900" size={32} />}
          label="Sales Processed"
          value={stats.salesCount || 0}
          subtext="transactions"
          bgColor="bg-white"
          borderColor="border-red-900"
        />
        <MetricCard
          icon={<DollarSign className="text-red-900" size={32} />}
          label="Total Sales Value"
          value={`KSh ${stats.totalSales?.toLocaleString() || 0}`}
          bgColor="bg-white"
          borderColor="border-red-900"
        />
        <MetricCard
          icon={<TrendingUp className="text-red-900" size={32} />}
          label="Average Sale"
          value={`KSh ${stats.averageSale?.toLocaleString() || 0}`}
          bgColor="bg-white"
          borderColor="border-red-900"
        />
      </div>

      {/* Performance Metrics */}
      <div className="bg-red-900 rounded-2xl shadow-2xl p-6 border-2 border-white">
        <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-white">
          <Target size={24} />
          Your Performance
        </h3>
        <div className="space-y-4">
          <div className="bg-black rounded-xl p-4 border-2 border-white">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-red-300">Today's Target</span>
              <span className="font-bold text-white">20 sales</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-4">
              <div
                className="bg-gradient-to-r from-red-900 to-white h-4 rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    ((stats.salesCount || 0) / 20) * 100,
                    100
                  )}%`,
                }}
              ></div>
            </div>
            <p className="text-sm text-red-300 mt-2">
              {stats.salesCount || 0} of 20 completed (
              {Math.round(((stats.salesCount || 0) / 20) * 100)}%)
            </p>
          </div>

          <div className="bg-black rounded-xl p-4 border-2 border-red-900">
            <p className="font-medium text-white mb-2">
              Payment Methods Breakdown
            </p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-red-300">Cash:</span>
                <span className="font-bold text-white">
                  KSh {stats.cashSales?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-300">M-Pesa:</span>
                <span className="font-bold text-white">
                  KSh {stats.mpesaSales?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-300">Split:</span>
                <span className="font-bold text-white">
                  KSh {stats.splitSales?.toLocaleString() || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Selling Items */}
      {stats.topItems && stats.topItems.length > 0 && (
        <div className="bg-red-900 rounded-2xl shadow-2xl p-6 border-2 border-white">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
            <Package size={24} />
            Top Selling Items Today
          </h3>
          <div className="space-y-3">
            {stats.topItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-black rounded-xl p-4 border-2 border-red-900"
              >
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{item.icon || "🍽️"}</span>
                  <div>
                    <p className="font-bold text-white">{item.name}</p>
                    <p className="text-sm text-red-300">{item.quantity} sold</p>
                  </div>
                </div>
                <p className="font-bold text-red-900">
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

// Vendor Dashboard - Outside Catering Commission Focus
const VendorDashboard = ({ stats, user }) => {
  if (!stats) return null;

  const commissionRate = 0.19; // 19%

  return (
    <div className="space-y-6">
      {/* Commission Earnings - Hero Section */}
      <div className="bg-gradient-to-r from-red-900 via-black to-red-900 rounded-2xl shadow-2xl p-8 border-2 border-white">
        <div className="flex items-center gap-4 mb-4">
          <Award size={48} className="flex-shrink-0 text-white" />
          <div>
            <h2 className="text-3xl font-bold text-white">
              Your Commission Today
            </h2>
            <p className="text-red-300">19% of net sales from rounds</p>
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-4 border-2 border-white">
          <p className="text-6xl font-bold mb-2 text-white">
            KSh {stats.totalCommission?.toLocaleString() || 0}
          </p>
          <p className="text-red-300">
            From {stats.roundsCompleted || 0} rounds completed
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-black rounded-xl p-4 border-2 border-red-900">
            <p className="text-sm text-red-300">Gross Sales</p>
            <p className="text-2xl font-bold text-white">
              KSh {stats.grossSales?.toLocaleString() || 0}
            </p>
          </div>
          <div className="bg-black rounded-xl p-4 border-2 border-red-900">
            <p className="text-sm text-red-300">Returns</p>
            <p className="text-2xl font-bold text-white">
              KSh {stats.totalReturns?.toLocaleString() || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Today's Rounds */}
      {stats.rounds && stats.rounds.length > 0 && (
        <div className="bg-red-900 rounded-2xl shadow-2xl p-6 border-2 border-white">
          <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-white">
            <Clock size={24} />
            Today's Rounds ({stats.roundsCompleted || 0})
          </h3>
          <div className="space-y-3">
            {stats.rounds.map((round, idx) => (
              <div
                key={idx}
                className="bg-black rounded-xl p-4 border-2 border-red-900"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-white text-lg">
                      Round {round.number}
                    </p>
                    <p className="text-sm text-red-300">
                      {new Date(round.startTime).toLocaleTimeString()} -{" "}
                      {new Date(round.endTime).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">
                      KSh {round.netTotal?.toLocaleString()}
                    </p>
                    <p className="text-sm text-red-300">Net Sales</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-red-900">
                  <div>
                    <p className="text-xs text-red-300">Expected</p>
                    <p className="font-bold text-white">
                      KSh {round.expected?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-red-300">Returns</p>
                    <p className="font-bold text-white">
                      KSh {round.returns?.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-red-900 rounded-lg p-2 border border-white">
                    <p className="text-xs text-red-300">Your Cut</p>
                    <p className="font-bold text-white">
                      KSh {round.commission?.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Credits Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-red-900 rounded-2xl shadow-2xl p-6 border-2 border-white">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
            <DollarSign size={24} />
            Credits Given Today
          </h3>
          <div className="bg-black rounded-xl p-6 border-2 border-red-900">
            <p className="text-4xl font-bold text-white mb-2">
              KSh {stats.creditsGiven?.toLocaleString() || 0}
            </p>
            <p className="text-sm text-red-300">
              {stats.creditCount || 0} customers on credit
            </p>
          </div>
        </div>

        <div className="bg-red-900 rounded-2xl shadow-2xl p-6 border-2 border-white">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
            <CheckCircle size={24} />
            Credits Collected
          </h3>
          <div className="bg-white rounded-xl p-6 border-2 border-red-900">
            <p className="text-4xl font-bold text-red-900 mb-2">
              KSh {stats.creditsCollected?.toLocaleString() || 0}
            </p>
            <p className="text-sm text-black">
              {stats.collectionsCount || 0} payments received
            </p>
          </div>
        </div>
      </div>

      {/* Outstanding Credits Warning */}
      {stats.outstandingCredits && stats.outstandingCredits.length > 0 && (
        <div className="bg-gradient-to-r from-red-900 via-black to-red-900 border-4 border-red-900 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle size={32} className="text-white" />
            <div>
              <h3 className="text-2xl font-bold text-white">
                ⚠️ Outstanding Credits
              </h3>
              <p className="text-red-300">
                These will be deducted from your commission!
              </p>
            </div>
          </div>
          <div className="bg-black/50 backdrop-blur-sm rounded-xl p-4 border-2 border-white">
            <div className="space-y-2">
              {stats.outstandingCredits.map((credit) => {
                const dueDate = new Date(credit.dueDate);
                const today = new Date();
                const isOverdue = dueDate < today;

                return (
                  <div
                    key={credit._id}
                    className="flex justify-between items-center py-2 border-b border-white/30 last:border-0"
                  >
                    <div>
                      <p className="font-bold text-white">
                        {credit.customerName}
                      </p>
                      <p className="text-sm text-red-300">
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
                    <p className="text-xl font-bold text-white">
                      KSh {credit.amount?.toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="border-t-2 border-white mt-4 pt-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg text-white">
                  Total at Risk:
                </span>
                <span className="text-3xl font-bold text-white">
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

// Reusable Metric Card Component
const MetricCard = ({
  icon,
  label,
  value,
  subtext,
  trend,
  count,
  bgColor,
  borderColor,
}) => {
  return (
    <div
      className={`${bgColor} rounded-2xl shadow-2xl p-6 border-2 ${borderColor}`}
    >
      <div className="flex items-center justify-between mb-3">
        {icon}
        {trend && (
          <span
            className={`text-sm font-bold ${
              trend > 0 ? "text-red-900" : "text-black"
            }`}
          >
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
      <p className="text-3xl font-bold text-black mb-1">{value}</p>
      {(subtext || count) && (
        <p className="text-sm text-gray-600">{subtext || count}</p>
      )}
    </div>
  );
};
