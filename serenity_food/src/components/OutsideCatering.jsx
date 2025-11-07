import React, { useState, useEffect } from "react";
import {
  Plus,
  Minus,
  Calculator,
  UserPlus,
  PlayCircle,
  CheckCircle,
  ShoppingBag,
  X,
  AlertTriangle,
  TrendingUp,
  Clock,
  DollarSign,
  Calendar,
  Phone,
} from "lucide-react";

const API_BASE_URL =
  "https://serenityfoodcourt-t8j7.vercel.app/serenityfoodcourt";

export default function OutsideCatering() {
  const [rounds, setRounds] = useState([]);
  const [currentRound, setCurrentRound] = useState({
    items: {},
    returns: {},
    started: false,
    startTime: null,
  });
  const [showReturnsModal, setShowReturnsModal] = useState(false);
  const [showGrandCalc, setShowGrandCalc] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [settlement, setSettlement] = useState({ cash: 0, mpesa: 0 });
  const [creditForm, setCreditForm] = useState({
    name: "",
    phone: "",
    amount: 0,
    notes: "",
  });
  const [activeCategory, setActiveCategory] = useState("all");
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [credits, setCredits] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Get token helper function
  const getToken = () => {
    return localStorage.getItem("token") || "";
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setError("Authentication required. Please log in.");
      setLoading(false);
      return;
    }
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    const token = getToken();
    if (!token) {
      setError("Authentication required. Please log in.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      await Promise.all([
        fetchMenuData(token),
        fetchRounds(token),
        fetchDashboardStats(token),
        fetchCredits(token),
        fetchHistoricalData(token),
      ]);
      setError("");
    } catch (err) {
      setError("Failed to fetch data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuData = async (token) => {
    try {
      const [categoriesRes, menuItemsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/categories`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/menu-items`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const categoriesData = await categoriesRes.json();
      const menuItemsData = await menuItemsRes.json();

      if (categoriesData.success && menuItemsData.success) {
        const activeCategories = categoriesData.data.filter(
          (cat) => cat.isActive
        );
        setCategories([
          { _id: "all", name: "All Items", icon: "🍽️" },
          ...activeCategories,
        ]);
        setMenuItems(menuItemsData.data.filter((item) => item.isActive));
      }
    } catch (err) {
      console.error("Failed to fetch menu data", err);
      throw err;
    }
  };

  const fetchRounds = async (token) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/outside-catering/rounds?date=${selectedDate}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (data.success) {
        setRounds(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch rounds", err);
      throw err;
    }
  };

  const fetchDashboardStats = async (token) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/outside-catering/dashboard?date=${selectedDate}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (data.success) {
        setDashboardStats(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard stats", err);
      throw err;
    }
  };

  const fetchCredits = async (token) => {
    try {
      const res = await fetch(`${API_BASE_URL}/outside-catering/credits`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setCredits(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch credits", err);
      throw err;
    }
  };

  const fetchHistoricalData = async (token) => {
    try {
      const endDate = new Date().toISOString().split("T")[0];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const startDateStr = startDate.toISOString().split("T")[0];

      const res = await fetch(
        `${API_BASE_URL}/outside-catering/summaries?startDate=${startDateStr}&endDate=${endDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        setHistoricalData(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch historical data", err);
      throw err;
    }
  };

  const filteredItems =
    activeCategory === "all"
      ? menuItems
      : menuItems.filter(
          (item) => item.category && item.category._id === activeCategory
        );

  const updateQuantity = (itemId, qty) => {
    if (qty <= 0) {
      const newItems = { ...currentRound.items };
      delete newItems[itemId];
      setCurrentRound({ ...currentRound, items: newItems });
    } else {
      setCurrentRound({
        ...currentRound,
        items: { ...currentRound.items, [itemId]: qty },
      });
    }
  };

  const updateReturnQuantity = (itemId, qty) => {
    const takenQty = currentRound.items[itemId] || 0;
    if (qty <= 0) {
      const newReturns = { ...currentRound.returns };
      delete newReturns[itemId];
      setCurrentRound({ ...currentRound, returns: newReturns });
    } else if (qty <= takenQty) {
      setCurrentRound({
        ...currentRound,
        returns: { ...currentRound.returns, [itemId]: qty },
      });
    }
  };

  const calculateRoundExpected = () => {
    return Object.entries(currentRound.items).reduce((sum, [itemId, qty]) => {
      const item = menuItems.find((i) => i._id === itemId);
      return sum + (item?.price || 0) * qty;
    }, 0);
  };

  const calculateRoundReturns = () => {
    return Object.entries(currentRound.returns).reduce((sum, [itemId, qty]) => {
      const item = menuItems.find((i) => i._id === itemId);
      return sum + (item?.price || 0) * qty;
    }, 0);
  };

  const currentRoundExpected = calculateRoundExpected();
  const currentRoundReturns = calculateRoundReturns();
  const currentRoundNet = currentRoundExpected - currentRoundReturns;
  const currentCommission = currentRoundNet * 0.19;

  const startRound = () => {
    if (Object.keys(currentRound.items).length === 0) {
      alert("Add items before starting the round!");
      return;
    }
    setCurrentRound({ ...currentRound, started: true, startTime: new Date() });
    alert(
      `✅ Round ${
        rounds.length + 1
      } started! Expected: KSh ${currentRoundExpected.toLocaleString()}`
    );
  };

  const completeRound = async () => {
    if (!currentRound.started) {
      alert("Start the round first!");
      return;
    }

    const token = getToken();
    if (!token) {
      alert("❌ Authentication required. Please log in.");
      return;
    }

    try {
      const roundData = {
        roundNumber: rounds.length + 1,
        items: Object.entries(currentRound.items)
          .map(([itemId, qty]) => {
            const item = menuItems.find((i) => i._id === itemId);
            if (!item) {
              console.error(`Item not found: ${itemId}`);
              return null;
            }
            return {
              menuItem: item._id,
              name: item.name,
              icon: item.icon || "",
              price: item.price,
              quantity: qty,
              total: item.price * qty,
            };
          })
          .filter(Boolean),
        returns: Object.entries(currentRound.returns)
          .map(([itemId, qty]) => {
            const item = menuItems.find((i) => i._id === itemId);
            if (!item) {
              console.error(`Item not found: ${itemId}`);
              return null;
            }
            return {
              menuItem: item._id,
              name: item.name,
              icon: item.icon || "",
              price: item.price,
              quantity: qty,
              total: item.price * qty,
            };
          })
          .filter(Boolean),
        expectedAmount: currentRoundExpected,
        returnsAmount: currentRoundReturns,
        netTotal: currentRoundNet,
        startTime: currentRound.startTime,
        endTime: new Date(),
      };

      const res = await fetch(`${API_BASE_URL}/outside-catering/rounds`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(roundData),
      });

      const data = await res.json();

      if (data.success) {
        await Promise.all([fetchRounds(token), fetchDashboardStats(token)]);
        setCurrentRound({
          items: {},
          returns: {},
          started: false,
          startTime: null,
        });
        setShowReturnsModal(false);
        alert(
          `✅ ${
            data.message
          }\n💰 Your Commission: KSh ${currentCommission.toLocaleString()}`
        );
      } else {
        throw new Error(data.error || "Failed to record round");
      }
    } catch (error) {
      alert("❌ Failed to record round: " + error.message);
    }
  };

  // Calculate totals using dashboard stats if available, otherwise calculate from rounds
  const totalExpected =
    dashboardStats?.rounds?.netTotal ||
    rounds.reduce((sum, r) => sum + r.netTotal, 0);

  const todayCreditsGiven = credits.filter(
    (c) => c.date === selectedDate && !c.isPaid
  );
  const creditAmount =
    dashboardStats?.credits?.givenAmount ||
    todayCreditsGiven.reduce((sum, c) => sum + c.amount, 0);

  const creditsCollectedToday = credits.filter(
    (c) => c.paidDate === selectedDate
  );
  const creditsCollectedAmount =
    dashboardStats?.credits?.collectedAmount ||
    creditsCollectedToday.reduce((sum, c) => sum + c.paidAmount, 0);

  const adjustedExpected =
    dashboardStats?.financial?.netTotal ||
    totalExpected - creditAmount + creditsCollectedAmount;
  const totalCommission =
    dashboardStats?.financial?.vendorCommission || adjustedExpected * 0.19;

  const totalCollected = settlement.cash + settlement.mpesa;
  const difference = totalCollected - adjustedExpected;

  const handleGrandCalculation = async () => {
    if (rounds.length === 0) {
      alert("No rounds to calculate!");
      return;
    }

    if (totalCollected <= 0) {
      alert("Enter cash and/or M-Pesa amounts!");
      return;
    }

    const token = getToken();
    if (!token) {
      alert("❌ Authentication required. Please log in.");
      return;
    }

    try {
      const summaryData = {
        totalRounds: rounds.length,
        rounds: rounds.map((r) => r._id),
        totalExpected: rounds.reduce((sum, r) => sum + r.expectedAmount, 0),
        totalReturns: rounds.reduce((sum, r) => sum + r.returnsAmount, 0),
        creditsGiven: creditAmount,
        creditsCollected: creditsCollectedAmount,
        netTotal: adjustedExpected,
        cashCollected: settlement.cash,
        mpesaCollected: settlement.mpesa,
        totalCollected,
        difference,
        reconciliationNotes:
          difference !== 0
            ? `Difference: ${difference > 0 ? "+" : ""}KSh ${difference}`
            : "Perfect balance",
      };

      const res = await fetch(`${API_BASE_URL}/outside-catering/day-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(summaryData),
      });

      const data = await res.json();

      if (data.success) {
        alert(
          `✅ ${
            data.message
          }\n\n📊 Summary:\nTotal Sales: KSh ${adjustedExpected.toLocaleString()}\n💰 Your Commission (19%): KSh ${totalCommission.toLocaleString()}\n${
            difference !== 0
              ? `\n⚠️ Difference: ${
                  difference > 0 ? "+" : ""
                }KSh ${difference.toLocaleString()}`
              : ""
          }`
        );
        await Promise.all([
          fetchRounds(token),
          fetchDashboardStats(token),
          fetchHistoricalData(token),
        ]);
        setRounds([]);
        setSettlement({ cash: 0, mpesa: 0 });
        setShowGrandCalc(false);
      } else {
        throw new Error(data.error || "Failed to record summary");
      }
    } catch (error) {
      alert("❌ Failed to record: " + error.message);
    }
  };

  const handleAddCredit = async () => {
    if (!creditForm.name.trim() || creditForm.amount <= 0) {
      alert("Please enter customer name and amount!");
      return;
    }

    const token = getToken();
    if (!token) {
      alert("❌ Authentication required. Please log in.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/outside-catering/credits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerName: creditForm.name.trim(),
          customerPhone: creditForm.phone.trim() || undefined,
          amount: creditForm.amount,
          notes: creditForm.notes.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert(
          `✅ ${data.message}\n\n⚠️ This amount will be deducted from today's total.\n📱 Customer will be reminded tomorrow.`
        );
        setCreditForm({ name: "", phone: "", amount: 0, notes: "" });
        setShowCreditModal(false);
        await Promise.all([fetchCredits(token), fetchDashboardStats(token)]);
      } else {
        throw new Error(data.error || "Failed to record credit");
      }
    } catch (error) {
      alert("❌ Failed to record credit: " + error.message);
    }
  };

  const handleCollectCredit = async (creditId, creditAmount, customerName) => {
    const method = window.confirm("Payment method:\nOK = Cash\nCancel = M-Pesa")
      ? "cash"
      : "mpesa";

    const token = getToken();
    if (!token) {
      alert("❌ Authentication required. Please log in.");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/outside-catering/credits/${creditId}/collect`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            paymentMethod: method,
            paidAmount: creditAmount,
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        alert(
          `✅ ${data.message}\n\n💰 This payment is added to today's collection!`
        );
        await Promise.all([fetchCredits(token), fetchDashboardStats(token)]);
      } else {
        throw new Error(data.error || "Failed to collect credit");
      }
    } catch (error) {
      alert("❌ Failed to collect credit: " + error.message);
    }
  };

  const outstandingCredits = credits.filter((c) => !c.isPaid);
  const overdueCredits = outstandingCredits.filter(
    (c) => c.status === "overdue"
  );
  const criticalCredits = overdueCredits.filter((c) => c.daysPastDue >= 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-4 flex items-center justify-center">
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center max-w-md">
          <AlertTriangle className="mx-auto mb-4 text-red-600" size={48} />
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-4 pb-32">
      {/* Critical Alerts */}
      {criticalCredits.length > 0 && (
        <div className="mb-4 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-2xl p-6 shadow-2xl animate-pulse">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle size={32} className="flex-shrink-0" />
            <div>
              <h3 className="text-xl font-bold">⚠️ CRITICAL DEBT ALERT!</h3>
              <p className="text-red-100 text-sm">
                These debts are 5+ days overdue and WILL BE DEDUCTED from your
                income!
              </p>
            </div>
          </div>
          <div className="bg-white/20 rounded-xl p-4">
            {criticalCredits.map((credit) => (
              <div
                key={credit._id}
                className="flex justify-between items-center mb-2 last:mb-0"
              >
                <span className="font-bold">
                  {credit.customerName} ({credit.daysPastDue} days)
                </span>
                <span className="font-bold text-xl">
                  KSh {credit.amount.toLocaleString()}
                </span>
              </div>
            ))}
            <div className="border-t-2 border-white/30 mt-3 pt-3 flex justify-between items-center">
              <span className="font-bold">TOTAL AT RISK:</span>
              <span className="text-2xl font-bold">
                KSh{" "}
                {criticalCredits
                  .reduce((s, c) => s + c.amount, 0)
                  .toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-red-600 via-orange-600 to-red-700 rounded-3xl shadow-2xl overflow-hidden mb-4">
        <div className="p-6">
          <div className="flex justify-between items-start flex-wrap gap-4 mb-4">
            <div>
              <h2 className="text-3xl font-bold text-white mb-1">
                Outside Catering
              </h2>
              <p className="text-red-100">
                Track rounds, manage credits & earn your 19% commission
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowHistory(true)}
                className="bg-white text-red-600 px-4 py-2 rounded-xl font-bold hover:scale-105 transition-all flex items-center gap-2"
              >
                <Calendar size={18} />
                History
              </button>
              {rounds.length > 0 && (
                <button
                  onClick={() => setShowGrandCalc(true)}
                  className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-all flex items-center gap-2"
                >
                  <Calculator size={20} />
                  End Day
                </button>
              )}
            </div>
          </div>

          {/* Today's Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-white">
              <p className="text-xs font-bold opacity-80">ROUNDS TODAY</p>
              <p className="text-3xl font-bold">
                {dashboardStats?.rounds?.total || rounds.length}
              </p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-white">
              <p className="text-xs font-bold opacity-80">TOTAL SALES</p>
              <p className="text-xl font-bold">
                KSh{" "}
                {(
                  dashboardStats?.rounds?.netTotal || totalExpected
                ).toLocaleString()}
              </p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-white">
              <p className="text-xs font-bold opacity-80">YOUR COMMISSION</p>
              <p className="text-xl font-bold">
                KSh {totalCommission.toLocaleString()}
              </p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-white">
              <p className="text-xs font-bold opacity-80">CREDITS OUT</p>
              <p className="text-xl font-bold text-yellow-300">
                {dashboardStats?.credits?.outstanding ||
                  outstandingCredits.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Credits Warning Section */}
      {outstandingCredits.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-4">
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
            <Clock className="text-orange-500" size={20} />
            Outstanding Credits ({outstandingCredits.length})
          </h3>
          <div className="space-y-2">
            {outstandingCredits.slice(0, 3).map((credit) => (
              <div
                key={credit._id}
                className={`rounded-xl p-3 border-2 ${
                  credit.daysPastDue >= 5
                    ? "bg-red-50 border-red-300"
                    : credit.status === "overdue"
                    ? "bg-orange-50 border-orange-300"
                    : "bg-blue-50 border-blue-300"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-gray-900">
                      {credit.customerName}
                    </p>
                    {credit.customerPhone && (
                      <p className="text-xs text-gray-600 flex items-center gap-1">
                        <Phone size={12} />
                        {credit.customerPhone}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      Due: {credit.dueDate}{" "}
                      {credit.daysPastDue > 0 &&
                        `(${credit.daysPastDue} days overdue)`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-red-600">
                      KSh {credit.amount.toLocaleString()}
                    </p>
                    <button
                      onClick={() =>
                        handleCollectCredit(
                          credit._id,
                          credit.amount,
                          credit.customerName
                        )
                      }
                      className="mt-1 bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-green-700"
                    >
                      Collect
                    </button>
                  </div>
                </div>
                {credit.daysPastDue >= 5 && (
                  <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded mt-2">
                    ⚠️ WILL BE DEDUCTED FROM YOUR INCOME!
                  </div>
                )}
              </div>
            ))}
            {outstandingCredits.length > 3 && (
              <button className="w-full text-center text-sm text-gray-600 hover:text-gray-900 font-medium py-2">
                View all {outstandingCredits.length} credits →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Add Credit Button */}
      {rounds.length > 0 && (
        <button
          onClick={() => setShowCreditModal(true)}
          className="w-full bg-orange-500 text-white px-6 py-4 rounded-xl font-bold hover:bg-red-600 transition-all flex items-center justify-center gap-2 mb-4"
        >
          <UserPlus size={20} />
          Give Credit to Customer
        </button>
      )}

      {/* Current Round Setup */}
      {!currentRound.started ? (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold text-gray-900">
              Setup Round {rounds.length + 1}
            </h3>
            {currentRoundExpected > 0 && (
              <button
                onClick={startRound}
                className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-all flex items-center gap-2"
              >
                <PlayCircle size={20} />
                Start Round
              </button>
            )}
          </div>

          {currentRoundExpected > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-4 border-2 border-green-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-gray-600">
                  Expected from this round:
                </span>
                <span className="text-2xl font-bold text-green-600">
                  KSh {currentRoundExpected.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center border-t-2 border-green-200 pt-2">
                <span className="text-sm font-bold text-gray-600">
                  Your Commission (19%):
                </span>
                <span className="text-xl font-bold text-orange-600">
                  KSh {(currentRoundExpected * 0.19).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Category Filter */}
          <div className="mb-4 overflow-x-auto pb-2">
            <div className="flex gap-2">
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => setActiveCategory(cat._id)}
                  className={`px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${
                    activeCategory === cat._id
                      ? "bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg scale-105"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <span className="text-2xl mr-2">{cat.icon}</span>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredItems.map((item) => {
              const qty = currentRound.items[item._id] || 0;
              return (
                <div
                  key={item._id}
                  className={`bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 flex flex-col items-center ${
                    qty > 0
                      ? "ring-4 ring-red-400 shadow-2xl scale-105"
                      : "hover:scale-105"
                  }`}
                >
                  <div className="text-7xl mb-4">{item.icon || "🍽️"}</div>
                  <h4 className="font-bold text-lg text-gray-900 text-center mb-2 min-h-[3.5rem] flex items-center">
                    {item.name}
                  </h4>
                  <p className="text-2xl font-bold text-red-600 mb-4">
                    KSh {item.price}
                  </p>
                  <div className="w-full">
                    <input
                      type="number"
                      min="0"
                      value={qty === 0 ? "" : qty}
                      onChange={(e) =>
                        updateQuantity(item._id, parseInt(e.target.value) || 0)
                      }
                      onFocus={(e) =>
                        e.target.value === "0" && (e.target.value = "")
                      }
                      placeholder="0"
                      className="w-full h-14 text-center border-3 border-gray-300 rounded-xl font-bold text-2xl focus:border-red-500 focus:ring-4 focus:ring-red-200 focus:outline-none transition-all"
                    />
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <button
                        onClick={() => updateQuantity(item._id, qty + 1)}
                        className="py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-sm hover:shadow-lg transition-all hover:scale-105"
                      >
                        +1
                      </button>
                      <button
                        onClick={() => updateQuantity(item._id, qty + 5)}
                        className="py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold text-sm hover:shadow-lg transition-all hover:scale-105"
                      >
                        +5
                      </button>
                      <button
                        onClick={() => updateQuantity(item._id, 0)}
                        disabled={qty === 0}
                        className="py-2 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold text-sm hover:shadow-lg transition-all hover:scale-105 disabled:opacity-30"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  {qty > 0 && (
                    <div className="mt-3 bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-bold">
                      {qty} in round
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                Round {rounds.length + 1} - In Progress
              </h3>
              <p className="text-sm text-gray-600">Vendor is out selling</p>
            </div>
            <button
              onClick={() => setShowReturnsModal(true)}
              className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-all flex items-center gap-2"
            >
              <CheckCircle size={20} />
              Vendor Returned
            </button>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
            <p className="text-sm text-gray-600 mb-1">
              Expected from this round:
            </p>
            <p className="text-3xl font-bold text-blue-600">
              KSh {currentRoundExpected.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Today's Completed Rounds */}
      {rounds.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ShoppingBag className="text-red-600" size={24} />
            Today's Completed Rounds ({rounds.length})
          </h3>
          <div className="space-y-3">
            {rounds.map((round) => (
              <div
                key={round._id}
                className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border-2 border-gray-200"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-lg text-gray-900">
                      Round {round.roundNumber}
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(round.startTime).toLocaleTimeString()} -{" "}
                      {new Date(round.endTime).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Net Total</p>
                    <p className="text-2xl font-bold text-green-600">
                      KSh {round.netTotal.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-white rounded-lg p-2">
                    <p className="text-gray-500">Expected</p>
                    <p className="font-bold text-blue-600">
                      KSh {round.expectedAmount.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-2">
                    <p className="text-gray-500">Returns</p>
                    <p className="font-bold text-red-600">
                      -KSh {round.returnsAmount.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-2">
                    <p className="text-gray-500">Commission</p>
                    <p className="font-bold text-orange-600">
                      KSh {(round.netTotal * 0.19).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Returns Modal */}
      {showReturnsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-red-600 to-orange-600 text-white p-6 rounded-t-3xl flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold">
                  Record Returns - Round {rounds.length + 1}
                </h3>
                <p className="text-red-100 text-sm">
                  Mark items that came back unsold
                </p>
              </div>
              <button
                onClick={() => setShowReturnsModal(false)}
                className="text-white hover:bg-white/20 p-2 rounded-xl transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 mb-6 border-2 border-blue-200">
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-sm text-gray-600">Expected Amount:</p>
                    <p className="text-2xl font-bold text-blue-600">
                      KSh {currentRoundExpected.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Returns Value:</p>
                    <p className="text-2xl font-bold text-red-600">
                      -KSh {currentRoundReturns.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="border-t-2 border-blue-200 pt-3">
                  <p className="text-sm text-gray-600 mb-1">
                    Net Total to Collect:
                  </p>
                  <p className="text-3xl font-bold text-green-600">
                    KSh {currentRoundNet.toLocaleString()}
                  </p>
                  <p className="text-sm text-orange-600 font-bold mt-1">
                    Your Commission: KSh {currentCommission.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                {Object.entries(currentRound.items).map(
                  ([itemId, takenQty]) => {
                    const item = menuItems.find((i) => i._id === itemId);
                    if (!item) return null;
                    const returnQty = currentRound.returns[itemId] || 0;
                    return (
                      <div
                        key={itemId}
                        className={`bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-md p-4 border-2 ${
                          returnQty > 0
                            ? "border-red-400 bg-red-50"
                            : "border-gray-200"
                        }`}
                      >
                        <div className="text-5xl mb-2 text-center">
                          {item.icon || "🍽️"}
                        </div>
                        <h4 className="font-bold text-center text-sm mb-2 min-h-[2.5rem] flex items-center justify-center">
                          {item.name}
                        </h4>
                        <p className="text-center text-xs text-gray-600 mb-3">
                          Took: {takenQty}
                        </p>
                        <input
                          type="number"
                          min="0"
                          max={takenQty}
                          value={returnQty === 0 ? "" : returnQty}
                          onChange={(e) =>
                            updateReturnQuantity(
                              itemId,
                              parseInt(e.target.value) || 0
                            )
                          }
                          placeholder="Returns"
                          className="w-full h-12 text-center border-2 border-gray-300 rounded-xl font-bold text-lg focus:border-red-500 focus:ring-4 focus:ring-red-200 focus:outline-none"
                        />
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <button
                            onClick={() =>
                              updateReturnQuantity(
                                itemId,
                                Math.min(returnQty + 1, takenQty)
                              )
                            }
                            className="py-1 rounded-lg bg-red-500 text-white font-bold text-xs hover:bg-red-600"
                          >
                            +1
                          </button>
                          <button
                            onClick={() => updateReturnQuantity(itemId, 0)}
                            disabled={returnQty === 0}
                            className="py-1 rounded-lg bg-gray-400 text-white font-bold text-xs hover:bg-gray-500 disabled:opacity-30"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              <button
                onClick={completeRound}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle size={24} />
                Complete Round {rounds.length + 1}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grand Calculation Modal */}
      {showGrandCalc && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-red-600 to-orange-600 text-white p-6 rounded-t-3xl flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold">
                  End of Day Reconciliation
                </h3>
                <p className="text-red-100 text-sm">
                  Record cash & M-Pesa collections
                </p>
              </div>
              <button
                onClick={() => setShowGrandCalc(false)}
                className="text-white hover:bg-white/20 p-2 rounded-xl transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 mb-6 border-2 border-blue-200">
                <h4 className="font-bold text-lg mb-3 text-gray-900">
                  Today's Summary
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Rounds:</span>
                    <span className="font-bold">{rounds.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gross Sales:</span>
                    <span className="font-bold text-blue-600">
                      KSh{" "}
                      {rounds
                        .reduce((sum, r) => sum + r.expectedAmount, 0)
                        .toLocaleString()}
                    </span>
                  </div>
                  {creditAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Credits Given Today:
                      </span>
                      <span className="font-bold text-red-600">
                        -KSh {creditAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {creditsCollectedAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Credits Collected Today:
                      </span>
                      <span className="font-bold text-green-600">
                        +KSh {creditsCollectedAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="border-t-2 border-blue-200 pt-2 flex justify-between">
                    <span className="font-bold text-gray-900">
                      Net Total Expected:
                    </span>
                    <span className="text-2xl font-bold text-green-600">
                      KSh {adjustedExpected.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between bg-orange-100 rounded-lg p-2 mt-2">
                    <span className="font-bold text-orange-700">
                      Your Commission (19%):
                    </span>
                    <span className="text-xl font-bold text-orange-600">
                      KSh {totalCommission.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <DollarSign size={18} />
                    Cash Collected (KSh)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={settlement.cash || ""}
                    onChange={(e) =>
                      setSettlement({
                        ...settlement,
                        cash: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full h-14 px-4 border-3 border-gray-300 rounded-xl font-bold text-2xl focus:border-green-500 focus:ring-4 focus:ring-green-200 focus:outline-none"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Phone size={18} />
                    M-Pesa Collected (KSh)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={settlement.mpesa || ""}
                    onChange={(e) =>
                      setSettlement({
                        ...settlement,
                        mpesa: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full h-14 px-4 border-3 border-gray-300 rounded-xl font-bold text-2xl focus:border-green-500 focus:ring-4 focus:ring-green-200 focus:outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              {totalCollected > 0 && (
                <div
                  className={`rounded-xl p-4 mb-6 border-2 ${
                    difference === 0
                      ? "bg-green-50 border-green-300"
                      : difference > 0
                      ? "bg-blue-50 border-blue-300"
                      : "bg-red-50 border-red-300"
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-gray-700">
                      Total Collected:
                    </span>
                    <span className="text-2xl font-bold text-gray-900">
                      KSh {totalCollected.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-700">Difference:</span>
                    <span
                      className={`text-2xl font-bold ${
                        difference === 0
                          ? "text-green-600"
                          : difference > 0
                          ? "text-blue-600"
                          : "text-red-600"
                      }`}
                    >
                      {difference === 0
                        ? "✓ Perfect"
                        : `${
                            difference > 0 ? "+" : ""
                          }KSh ${difference.toLocaleString()}`}
                    </span>
                  </div>
                  {difference !== 0 && (
                    <p className="text-xs text-gray-600 mt-2">
                      {difference > 0
                        ? "You collected more than expected"
                        : "You collected less than expected"}
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={handleGrandCalculation}
                disabled={totalCollected <= 0}
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Calculator size={24} />
                Complete Day & Calculate Commission
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credit Modal */}
      {showCreditModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full">
            <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6 rounded-t-3xl flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold">Give Credit</h3>
                <p className="text-orange-100 text-sm">Record customer debt</p>
              </div>
              <button
                onClick={() => setShowCreditModal(false)}
                className="text-white hover:bg-white/20 p-2 rounded-xl transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 mb-6">
                <p className="text-sm text-yellow-800 font-medium">
                  ⚠️ This amount will be deducted from today's expected total.
                  Customer will be reminded tomorrow.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={creditForm.name}
                    onChange={(e) =>
                      setCreditForm({ ...creditForm, name: e.target.value })
                    }
                    className="w-full h-12 px-4 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-200 focus:outline-none"
                    placeholder="Enter customer name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={creditForm.phone}
                    onChange={(e) =>
                      setCreditForm({ ...creditForm, phone: e.target.value })
                    }
                    className="w-full h-12 px-4 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-200 focus:outline-none"
                    placeholder="0712345678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Amount (KSh) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={creditForm.amount || ""}
                    onChange={(e) =>
                      setCreditForm({
                        ...creditForm,
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full h-14 px-4 border-3 border-gray-300 rounded-xl font-bold text-2xl focus:border-orange-500 focus:ring-4 focus:ring-orange-200 focus:outline-none"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={creditForm.notes}
                    onChange={(e) =>
                      setCreditForm({ ...creditForm, notes: e.target.value })
                    }
                    className="w-full h-24 px-4 py-2 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-200 focus:outline-none resize-none"
                    placeholder="Any additional notes..."
                  />
                </div>
              </div>

              <button
                onClick={handleAddCredit}
                disabled={!creditForm.name.trim() || creditForm.amount <= 0}
                className="w-full mt-6 bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserPlus size={24} />
                Record Credit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-red-600 to-orange-600 text-white p-6 rounded-t-3xl flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold">Sales History</h3>
                <p className="text-red-100 text-sm">Last 30 days performance</p>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="text-white hover:bg-white/20 p-2 rounded-xl transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {historicalData.length === 0 ? (
                <div className="text-center py-12">
                  <TrendingUp
                    size={64}
                    className="mx-auto text-gray-300 mb-4"
                  />
                  <p className="text-gray-500">No historical data yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historicalData.map((day) => (
                    <div
                      key={day._id}
                      className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border-2 border-gray-200"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-bold text-lg text-gray-900">
                            {new Date(day.date).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                          <p className="text-sm text-gray-600">
                            {day.totalRounds} rounds completed
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Net Sales</p>
                          <p className="text-2xl font-bold text-green-600">
                            KSh {day.netTotal.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div className="bg-white rounded-lg p-2">
                          <p className="text-gray-500">Gross</p>
                          <p className="font-bold text-blue-600">
                            KSh {day.totalExpected.toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-2">
                          <p className="text-gray-500">Returns</p>
                          <p className="font-bold text-red-600">
                            -{day.totalReturns.toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-2">
                          <p className="text-gray-500">Credits</p>
                          <p className="font-bold text-orange-600">
                            {day.creditsGiven > 0
                              ? `-${day.creditsGiven.toLocaleString()}`
                              : "0"}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-2">
                          <p className="text-gray-500">Commission</p>
                          <p className="font-bold text-green-600">
                            {(day.netTotal * 0.19).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {day.difference !== 0 && (
                        <div className="mt-2 text-xs">
                          <span className="text-gray-600">Difference: </span>
                          <span
                            className={`font-bold ${
                              day.difference > 0
                                ? "text-blue-600"
                                : "text-red-600"
                            }`}
                          >
                            {day.difference > 0 ? "+" : ""}
                            {day.difference.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
