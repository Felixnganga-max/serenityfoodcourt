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
} from "lucide-react";

const API_BASE_URL =
  "https://serenityfoodcourt-t8j7.vercel.app/serenityfoodcourt";

export const OutsideCatering = ({ credits, onCreateSale, onCollectCredit }) => {
  const [rounds, setRounds] = useState([]);
  const [currentRound, setCurrentRound] = useState({
    items: {},
    returns: {},
    started: false,
  });
  const [showReturnsModal, setShowReturnsModal] = useState(false);
  const [showGrandCalc, setShowGrandCalc] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [settlement, setSettlement] = useState({ cash: 0, mpesa: 0 });
  const [creditCustomer, setCreditCustomer] = useState({ name: "", amount: 0 });
  const [activeCategory, setActiveCategory] = useState("all");

  // API state
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token") || "";

  // Fetch menu items and categories
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const categoriesResponse = await fetch(`${API_BASE_URL}/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const categoriesData = await categoriesResponse.json();

      const menuItemsResponse = await fetch(`${API_BASE_URL}/menu-items`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const menuItemsData = await menuItemsResponse.json();

      if (categoriesData.success && menuItemsData.success) {
        const activeCategories = categoriesData.data.filter(
          (cat) => cat.isActive
        );
        setCategories([
          { _id: "all", name: "All Items", icon: "🍽️" },
          ...activeCategories,
        ]);
        setMenuItems(menuItemsData.data.filter((item) => item.isActive));
      } else {
        setError("Failed to load data");
      }
    } catch (err) {
      setError("Failed to fetch menu data");
      console.error(err);
    } finally {
      setLoading(false);
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
      return sum + item.price * qty;
    }, 0);
  };

  const calculateRoundReturns = () => {
    return Object.entries(currentRound.returns).reduce((sum, [itemId, qty]) => {
      const item = menuItems.find((i) => i._id === itemId);
      return sum + item.price * qty;
    }, 0);
  };

  const currentRoundExpected = calculateRoundExpected();
  const currentRoundReturns = calculateRoundReturns();
  const currentRoundNet = currentRoundExpected - currentRoundReturns;

  const startRound = () => {
    if (Object.keys(currentRound.items).length === 0) {
      alert("Add items before starting the round!");
      return;
    }
    setCurrentRound({ ...currentRound, started: true });
    alert(
      `✅ Round ${
        rounds.length + 1
      } started! Expected: KSh ${currentRoundExpected.toLocaleString()}`
    );
  };

  const completeRound = () => {
    if (!currentRound.started) {
      alert("Start the round first!");
      return;
    }

    const roundData = {
      number: rounds.length + 1,
      items: Object.entries(currentRound.items).map(([itemId, qty]) => {
        const item = menuItems.find((i) => i._id === itemId);
        return {
          _id: item._id,
          name: item.name,
          icon: item.icon,
          price: item.price,
          quantity: qty,
          total: item.price * qty,
        };
      }),
      returns: Object.entries(currentRound.returns).map(([itemId, qty]) => {
        const item = menuItems.find((i) => i._id === itemId);
        return {
          _id: item._id,
          name: item.name,
          icon: item.icon,
          price: item.price,
          quantity: qty,
          total: item.price * qty,
        };
      }),
      expected: currentRoundExpected,
      returnsAmount: currentRoundReturns,
      netTotal: currentRoundNet,
      time: new Date().toLocaleTimeString(),
    };

    setRounds([...rounds, roundData]);
    setCurrentRound({ items: {}, returns: {}, started: false });
    setShowReturnsModal(false);
    alert(
      `✅ Round ${
        roundData.number
      } completed! Net Total: KSh ${currentRoundNet.toLocaleString()}`
    );
  };

  const totalExpected = rounds.reduce((sum, r) => sum + r.netTotal, 0);

  const todayCredits = credits.filter(
    (c) => c.date === new Date().toISOString().split("T")[0] && !c.isPaid
  );
  const creditAmount = todayCredits.reduce((sum, c) => sum + c.amount, 0);
  const adjustedExpected = totalExpected - creditAmount;

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

    try {
      const allItems = rounds.flatMap((r) => r.items);
      const itemsSummary = {};

      allItems.forEach((item) => {
        if (!itemsSummary[item._id]) {
          itemsSummary[item._id] = {
            menuItem: item._id,
            name: item.name,
            quantity: 0,
            price: item.price,
            total: 0,
          };
        }
        itemsSummary[item._id].quantity += item.quantity;
        itemsSummary[item._id].total += item.total;
      });

      const isSplit = settlement.cash > 0 && settlement.mpesa > 0;

      await onCreateSale({
        type: "outside-catering",
        vendorName: "Outside Catering Vendor",
        items: Object.values(itemsSummary),
        totalAmount: adjustedExpected,
        paymentMethod: isSplit
          ? "split"
          : settlement.mpesa > 0
          ? "mpesa"
          : "cash",
        isPaid: true,
        date: new Date().toISOString().split("T")[0],
        splitPayment: isSplit
          ? { mpesa: settlement.mpesa, cash: settlement.cash }
          : undefined,
      });

      alert("✅ Grand calculation recorded successfully!");
      setRounds([]);
      setSettlement({ cash: 0, mpesa: 0 });
      setShowGrandCalc(false);
    } catch (error) {
      alert("❌ Failed to record: " + error.message);
    }
  };

  const handleAddCredit = async () => {
    if (!creditCustomer.name.trim() || creditCustomer.amount <= 0) {
      alert("Please enter customer name and amount!");
      return;
    }

    try {
      await onCreateSale({
        type: "outside-catering",
        customerName: creditCustomer.name.trim(),
        items: [
          {
            name: "Credit Sale",
            quantity: 1,
            price: creditCustomer.amount,
            total: creditCustomer.amount,
          },
        ],
        totalAmount: creditCustomer.amount,
        paymentMethod: "credit",
        isPaid: false,
        date: new Date().toISOString().split("T")[0],
      });

      alert(
        `✅ Credit recorded for ${creditCustomer.name}. Expected total reduced by KSh ${creditCustomer.amount}`
      );
      setCreditCustomer({ name: "", amount: 0 });
      setShowCreditModal(false);
    } catch (error) {
      alert("❌ Failed to record credit: " + error.message);
    }
  };

  const handleCollectCredit = async (creditId, creditAmount) => {
    try {
      await onCollectCredit(creditId, { method: "cash" });
      alert(`✅ Credit payment of KSh ${creditAmount} collected!`);
    } catch (error) {
      alert("❌ Failed to collect credit: " + error.message);
    }
  };

  const outstandingCredits = credits.filter((c) => !c.isPaid);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
        <p className="text-red-600 font-medium">{error}</p>
        <button
          onClick={fetchData}
          className="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-32">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 via-orange-600 to-red-700 rounded-3xl shadow-xl overflow-hidden">
        <div className="p-8 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div>
                <h2 className="text-4xl font-bold text-white mb-2">
                  Outside Catering
                </h2>
                <p className="text-red-100 text-lg">
                  Round-based vendor tracking
                </p>
              </div>
              <div className="flex gap-3">
                {outstandingCredits.length > 0 && (
                  <div className="bg-white text-red-600 px-4 py-2 rounded-xl text-center">
                    <p className="text-xs font-bold">Credits</p>
                    <p className="text-xl font-bold">
                      {outstandingCredits.length}
                    </p>
                  </div>
                )}
                {rounds.length > 0 && (
                  <button
                    onClick={() => setShowGrandCalc(true)}
                    className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-all flex items-center gap-2"
                  >
                    <Calculator size={20} />
                    End of Day
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-gray-200">
          <p className="text-xs text-gray-600 font-bold">ROUNDS</p>
          <p className="text-3xl font-bold text-gray-900">{rounds.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-gray-200">
          <p className="text-xs text-gray-600 font-bold">EXPECTED</p>
          <p className="text-xl font-bold text-red-600">
            KSh {totalExpected.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-gray-200">
          <p className="text-xs text-gray-600 font-bold">CREDITS</p>
          <p className="text-xl font-bold text-orange-600">
            -KSh {creditAmount.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-gray-200">
          <p className="text-xs text-gray-600 font-bold">NET TOTAL</p>
          <p className="text-xl font-bold text-green-600">
            KSh {adjustedExpected.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Action Button */}
      {rounds.length > 0 && (
        <button
          onClick={() => setShowCreditModal(true)}
          className="w-full bg-orange-500 text-white px-6 py-4 rounded-xl font-bold hover:bg-red-600 transition-all flex items-center justify-center gap-2"
        >
          <UserPlus size={20} />
          Add Credit Customer
        </button>
      )}

      {/* Current Round Setup */}
      {!currentRound.started ? (
        <div className="bg-white rounded-2xl shadow-lg p-6">
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
            <div className="bg-green-50 rounded-xl p-4 mb-4 border-2 border-green-200">
              <p className="text-sm text-gray-600 mb-1">
                Expected from this round:
              </p>
              <p className="text-3xl font-bold text-green-600">
                KSh {currentRoundExpected.toLocaleString()}
              </p>
            </div>
          )}

          {/* Category Filter */}
          <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100 mb-4">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((category) => (
                <button
                  key={category._id}
                  onClick={() => setActiveCategory(category._id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all duration-200 ${
                    activeCategory === category._id
                      ? "bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg scale-105"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-102"
                  }`}
                >
                  <span className="text-2xl">{category.icon || "📦"}</span>
                  <span>{category.name}</span>
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
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "") {
                          updateQuantity(item._id, 0);
                        } else {
                          updateQuantity(item._id, parseInt(value) || 0);
                        }
                      }}
                      onFocus={(e) => {
                        if (e.target.value === "0") {
                          e.target.value = "";
                        }
                      }}
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
                        className="py-2 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold text-sm hover:shadow-lg transition-all hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed"
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
        /* Round In Progress */
        <div className="bg-white rounded-2xl shadow-lg p-6">
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

          <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200 mb-4">
            <p className="text-sm text-gray-600 mb-1">
              Expected from this round:
            </p>
            <p className="text-3xl font-bold text-blue-600">
              KSh {currentRoundExpected.toLocaleString()}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-bold text-gray-600">ITEMS TAKEN:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(currentRound.items).map(([itemId, qty]) => {
                const item = menuItems.find((i) => i._id === itemId);
                return (
                  <div
                    key={itemId}
                    className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                  >
                    <span className="mr-1">{item.icon || "🍽️"}</span>
                    <span className="font-bold text-gray-900">{qty}</span>{" "}
                    {item.name}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Completed Rounds */}
      {rounds.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Completed Rounds Today ({rounds.length})
          </h3>
          <div className="space-y-3">
            {rounds.map((round, idx) => (
              <div
                key={idx}
                className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-lg text-gray-900">
                      Round {round.number}
                    </h4>
                    <p className="text-xs text-gray-500">{round.time}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Net Total</p>
                    <p className="text-2xl font-bold text-red-600">
                      KSh {round.netTotal.toLocaleString()}
                    </p>
                  </div>
                </div>

                {round.returnsAmount > 0 && (
                  <div className="bg-red-50 rounded-lg p-2 mb-3 text-sm">
                    <span className="text-red-600 font-bold">
                      Returns: -KSh {round.returnsAmount.toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {round.items.map((item, i) => {
                    const returned = round.returns.find(
                      (r) => r._id === item._id
                    );
                    return (
                      <div
                        key={i}
                        className="text-sm bg-white rounded-lg p-2 border border-gray-200"
                      >
                        <span className="mr-1">{item.icon || "🍽️"}</span>
                        <span className="font-bold text-gray-900">
                          {item.quantity}
                        </span>
                        {returned && (
                          <span className="text-red-600 font-bold">
                            {" "}
                            (-{returned.quantity})
                          </span>
                        )}{" "}
                        {item.name}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outstanding Credits */}
      {outstandingCredits.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Outstanding Credits ({outstandingCredits.length})
          </h3>
          <div className="space-y-3">
            {outstandingCredits.map((credit) => (
              <div
                key={credit._id}
                className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-bold text-gray-900 text-lg">
                    {credit.customerName}
                  </p>
                  <p className="text-sm text-gray-600">{credit.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-red-600 mb-2">
                    KSh {credit.amount.toLocaleString()}
                  </p>
                  <button
                    onClick={() =>
                      handleCollectCredit(credit._id, credit.amount)
                    }
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition-all"
                  >
                    Collect
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Returns Modal */}
      {showReturnsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Process Returns - Round {rounds.length + 1}
            </h3>

            <div className="bg-blue-50 rounded-xl p-4 mb-4 border-2 border-blue-200">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-bold text-gray-600">
                  Expected:
                </span>
                <span className="font-bold text-gray-900">
                  KSh {currentRoundExpected.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-bold text-gray-600">
                  Returns:
                </span>
                <span className="font-bold text-red-600">
                  -KSh {currentRoundReturns.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between border-t-2 border-blue-200 pt-2">
                <span className="text-sm font-bold text-gray-900">
                  Net Total:
                </span>
                <span className="text-xl font-bold text-green-600">
                  KSh {currentRoundNet.toLocaleString()}
                </span>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Mark any items that were returned or not sold:
            </p>

            <div className="space-y-3 mb-6">
              {Object.entries(currentRound.items).map(([itemId, takenQty]) => {
                const item = menuItems.find((i) => i._id === itemId);
                const returnQty = currentRound.returns[itemId] || 0;

                return (
                  <div
                    key={itemId}
                    className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{item.icon || "🍽️"}</span>
                        <div>
                          <h4 className="font-bold text-gray-900">
                            {item.name}
                          </h4>
                          <p className="text-xs text-gray-600">
                            Taken: {takenQty} | KSh {item.price} each{" "}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-600">
                        Max: {takenQty}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          updateReturnQuantity(itemId, returnQty - 1)
                        }
                        disabled={returnQty === 0}
                        className="w-12 h-12 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        <Minus size={20} />
                      </button>

                      <input
                        type="number"
                        min="0"
                        max={takenQty}
                        value={returnQty === 0 ? "" : returnQty}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "") {
                            updateReturnQuantity(itemId, 0);
                          } else {
                            const numValue = parseInt(value) || 0;
                            updateReturnQuantity(
                              itemId,
                              Math.min(numValue, takenQty)
                            );
                          }
                        }}
                        placeholder="0"
                        className="flex-1 h-12 text-center border-2 border-gray-300 rounded-xl font-bold text-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 focus:outline-none"
                      />

                      <button
                        onClick={() =>
                          updateReturnQuantity(itemId, returnQty + 1)
                        }
                        disabled={returnQty >= takenQty}
                        className="w-12 h-12 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        <Plus size={20} />
                      </button>
                    </div>

                    {returnQty > 0 && (
                      <div className="mt-3 bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm font-bold text-center">
                        Returning {returnQty} × KSh {item.price} = KSh{" "}
                        {(returnQty * item.price).toLocaleString()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowReturnsModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={completeRound}
                className="flex-1 bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle size={20} />
                Complete Round
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grand Calculation Modal */}
      {showGrandCalc && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              End of Day Settlement
            </h3>

            <div className="bg-blue-50 rounded-xl p-4 mb-4 border-2 border-blue-200">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-bold text-gray-600">
                  Total Expected:
                </span>
                <span className="font-bold text-gray-900">
                  KSh {totalExpected.toLocaleString()}
                </span>
              </div>
              {creditAmount > 0 && (
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-bold text-gray-600">
                    Credits:
                  </span>
                  <span className="font-bold text-red-600">
                    -KSh {creditAmount.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t-2 border-blue-200 pt-2">
                <span className="text-sm font-bold text-gray-900">
                  Net Expected:
                </span>
                <span className="text-xl font-bold text-green-600">
                  KSh {adjustedExpected.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Cash Collected (KSh)
                </label>
                <input
                  type="number"
                  min="0"
                  value={settlement.cash === 0 ? "" : settlement.cash}
                  onChange={(e) =>
                    setSettlement({
                      ...settlement,
                      cash: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                  className="w-full h-14 px-4 text-xl border-2 border-gray-300 rounded-xl font-bold focus:border-red-500 focus:ring-2 focus:ring-red-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  M-Pesa Collected (KSh)
                </label>
                <input
                  type="number"
                  min="0"
                  value={settlement.mpesa === 0 ? "" : settlement.mpesa}
                  onChange={(e) =>
                    setSettlement({
                      ...settlement,
                      mpesa: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                  className="w-full h-14 px-4 text-xl border-2 border-gray-300 rounded-xl font-bold focus:border-red-500 focus:ring-2 focus:ring-red-200 focus:outline-none"
                />
              </div>
            </div>

            {totalCollected > 0 && (
              <div
                className={`rounded-xl p-4 mb-4 border-2 ${
                  difference === 0
                    ? "bg-green-50 border-green-200"
                    : difference > 0
                    ? "bg-blue-50 border-blue-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-bold text-gray-600">
                    Total Collected:
                  </span>
                  <span className="font-bold text-gray-900">
                    KSh {totalCollected.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t-2 pt-2">
                  <span className="text-sm font-bold text-gray-900">
                    Difference:
                  </span>
                  <span
                    className={`text-xl font-bold ${
                      difference === 0
                        ? "text-green-600"
                        : difference > 0
                        ? "text-blue-600"
                        : "text-red-600"
                    }`}
                  >
                    {difference === 0
                      ? "Perfect!"
                      : difference > 0
                      ? `+KSh ${difference.toLocaleString()}`
                      : `KSh ${difference.toLocaleString()}`}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowGrandCalc(false)}
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleGrandCalculation}
                className="flex-1 bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2"
              >
                <Calculator size={20} />
                Record Settlement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credit Customer Modal */}
      {showCreditModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-gray-900">
                Add Credit Customer
              </h3>
              <button
                onClick={() => setShowCreditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Record a credit sale - this will reduce today's expected total
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={creditCustomer.name}
                  onChange={(e) =>
                    setCreditCustomer({
                      ...creditCustomer,
                      name: e.target.value,
                    })
                  }
                  placeholder="Enter customer name"
                  className="w-full h-12 px-4 border-2 border-gray-300 rounded-xl font-medium focus:border-red-500 focus:ring-2 focus:ring-red-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Credit Amount (KSh)
                </label>
                <input
                  type="number"
                  min="0"
                  value={
                    creditCustomer.amount === 0 ? "" : creditCustomer.amount
                  }
                  onChange={(e) =>
                    setCreditCustomer({
                      ...creditCustomer,
                      amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                  className="w-full h-14 px-4 text-xl border-2 border-gray-300 rounded-xl font-bold focus:border-red-500 focus:ring-2 focus:ring-red-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCreditModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCredit}
                className="flex-1 bg-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-600 transition-all flex items-center justify-center gap-2"
              >
                <UserPlus size={20} />
                Add Credit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OutsideCatering;
