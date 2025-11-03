import React, { useState } from "react";
import {
  Plus,
  Minus,
  Calculator,
  UserPlus,
  RotateCcw,
  PlayCircle,
  CheckCircle,
} from "lucide-react";

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

  const menuItems = {
    drinks: [
      {
        name: "Tea (Flask)",
        price: 270,
        unit: "flask",
        cupsPerFlask: 9,
        icon: "🫖",
      },
      { name: "Tea (Cups)", price: 30, unit: "cups", icon: "☕" },
      { name: "Coffee", price: 25, unit: "cups", icon: "☕" },
    ],
    food: [
      { name: "Mandazi", price: 10, unit: "pcs", icon: "🥐" },
      { name: "Chapati", price: 20, unit: "pcs", icon: "🫓" },
      { name: "Samosa", price: 30, unit: "pcs", icon: "🥟" },
      { name: "Sausage", price: 40, unit: "pcs", icon: "🌭" },
      { name: "Smokie", price: 30, unit: "pcs", icon: "🌭" },
    ],
    snacks: [
      { name: "Chips (Small)", price: 70, unit: "pcs", icon: "🍟" },
      { name: "Chips (Large)", price: 100, unit: "pcs", icon: "🍟" },
      { name: "Bhajia (Small)", price: 70, unit: "pcs", icon: "🍟" },
      { name: "Bhajia (Large)", price: 100, unit: "pcs", icon: "🍟" },
    ],
  };

  const categories = [
    { id: "all", name: "All" },
    { id: "drinks", name: "Drinks" },
    { id: "food", name: "Food" },
    { id: "snacks", name: "Snacks" },
  ];

  const allItems = Object.entries(menuItems).flatMap(([cat, items]) =>
    items.map((item) => ({ ...item, category: cat }))
  );

  const filteredItems =
    activeCategory === "all"
      ? allItems
      : allItems.filter((item) => item.category === activeCategory);

  const updateQuantity = (itemName, qty) => {
    if (qty <= 0) {
      const newItems = { ...currentRound.items };
      delete newItems[itemName];
      setCurrentRound({ ...currentRound, items: newItems });
    } else {
      setCurrentRound({
        ...currentRound,
        items: { ...currentRound.items, [itemName]: qty },
      });
    }
  };

  const updateReturnQuantity = (itemName, qty) => {
    const item = allItems.find((i) => i.name === itemName);
    const takenQty = currentRound.items[itemName] || 0;

    // For flasks, convert to cups for max validation
    const maxQty =
      item.name === "Tea (Flask)" ? takenQty * item.cupsPerFlask : takenQty;

    if (qty <= 0) {
      const newReturns = { ...currentRound.returns };
      delete newReturns[itemName];
      setCurrentRound({ ...currentRound, returns: newReturns });
    } else if (qty <= maxQty) {
      setCurrentRound({
        ...currentRound,
        returns: { ...currentRound.returns, [itemName]: qty },
      });
    }
  };

  const calculateRoundExpected = () => {
    return Object.entries(currentRound.items).reduce((sum, [name, qty]) => {
      const item = allItems.find((i) => i.name === name);
      return sum + item.price * qty;
    }, 0);
  };

  const calculateRoundReturns = () => {
    return Object.entries(currentRound.returns).reduce((sum, [name, qty]) => {
      const item = allItems.find((i) => i.name === name);
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
      items: Object.entries(currentRound.items).map(([name, qty]) => {
        const item = allItems.find((i) => i.name === name);
        return { ...item, quantity: qty, total: item.price * qty };
      }),
      returns: Object.entries(currentRound.returns).map(([name, qty]) => {
        const item = allItems.find((i) => i.name === name);
        return { ...item, quantity: qty, total: item.price * qty };
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
        if (!itemsSummary[item.name]) {
          itemsSummary[item.name] = {
            name: item.name,
            quantity: 0,
            price: item.price,
            total: 0,
          };
        }
        itemsSummary[item.name].quantity += item.quantity;
        itemsSummary[item.name].total += item.total;
      });

      const isSplit = settlement.cash > 0 && settlement.mpesa > 0;

      await onCreateSale({
        type: "outside-catering",
        vendorName: "Outside Catering Vendor",
        items: Object.values(itemsSummary),
        totalAmount: adjustedExpected,
        paymentMethod: isSplit
          ? settlement.mpesa >= settlement.cash
            ? "mpesa"
            : "cash"
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

  return (
    <div className="space-y-4 pb-32">
      {/* Header */}
      <div className="bg-[#E4002B] rounded-3xl shadow-xl p-6">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-1">
              Outside Catering
            </h2>
            <p className="text-white/90">Round-based vendor tracking</p>
          </div>
          <div className="flex gap-3">
            {outstandingCredits.length > 0 && (
              <div className="bg-white text-[#E4002B] px-4 py-2 rounded-xl text-center">
                <p className="text-xs font-bold">Credits</p>
                <p className="text-xl font-bold">{outstandingCredits.length}</p>
              </div>
            )}
            {rounds.length > 0 && (
              <button
                onClick={() => setShowGrandCalc(true)}
                className="bg-[#fd8200] text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-all flex items-center gap-2"
              >
                <Calculator size={20} />
                End of Day
              </button>
            )}
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
          <p className="text-xl font-bold text-[#E4002B]">
            KSh {totalExpected.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-gray-200">
          <p className="text-xs text-gray-600 font-bold">CREDITS</p>
          <p className="text-xl font-bold text-[#fd8200]">
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
          className="w-full bg-[#fd8200] text-white px-6 py-4 rounded-xl font-bold hover:bg-[#E4002B] transition-all flex items-center justify-center gap-2"
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
                className="bg-[#E4002B] text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-all flex items-center gap-2"
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
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? "bg-[#E4002B] text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Items Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredItems.map((item) => {
              const qty = currentRound.items[item.name] || 0;

              return (
                <div
                  key={item.name}
                  className={`bg-white border-2 rounded-xl p-4 transition-all ${
                    qty > 0 ? "border-[#E4002B] shadow-md" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 truncate">
                        {item.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        KSh {item.price}/{item.unit}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.name, qty - 1)}
                      disabled={qty === 0}
                      className="w-9 h-9 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-30 flex items-center justify-center"
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={qty}
                      onFocus={(e) =>
                        e.target.value === "0" && (e.target.value = "")
                      }
                      onChange={(e) =>
                        updateQuantity(item.name, parseInt(e.target.value) || 0)
                      }
                      className="flex-1 h-9 text-center border-2 border-gray-300 rounded-lg font-bold focus:outline-none focus:border-[#E4002B]"
                    />
                    <button
                      onClick={() => updateQuantity(item.name, qty + 1)}
                      className="w-9 h-9 rounded-lg bg-[#E4002B] text-white hover:bg-[#fd8200] flex items-center justify-center"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
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
              className="bg-[#E4002B] text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-all flex items-center gap-2"
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
              {Object.entries(currentRound.items).map(([name, qty]) => {
                const item = allItems.find((i) => i.name === name);
                return (
                  <div
                    key={name}
                    className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                  >
                    <span className="mr-1">{item.icon}</span>
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
                    <p className="text-2xl font-bold text-[#E4002B]">
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
                      (r) => r.name === item.name
                    );
                    return (
                      <div
                        key={i}
                        className="text-sm bg-white rounded-lg p-2 border border-gray-200"
                      >
                        <span className="mr-1">{item.icon}</span>
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
                  <p className="text-2xl font-bold text-[#E4002B] mb-2">
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
              {Object.entries(currentRound.items).map(([name, takenQty]) => {
                const item = allItems.find((i) => i.name === name);
                const returnQty = currentRound.returns[name] || 0;

                return (
                  <div
                    key={name}
                    className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{item.icon}</span>
                        <div>
                          <h4 className="font-bold text-gray-900">
                            {item.name}
                          </h4>
                          <p className="text-xs text-gray-600">
                            Taken: {takenQty} | KSh {item.price} each
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          updateReturnQuantity(name, returnQty - 1)
                        }
                        disabled={returnQty === 0}
                        className="w-9 h-9 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-30 flex items-center justify-center"
                      >
                        <Minus size={16} />
                      </button>
                      <input
                        type="number"
                        min="0"
                        max={takenQty}
                        value={returnQty}
                        onFocus={(e) =>
                          e.target.value === "0" && (e.target.value = "")
                        }
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          updateReturnQuantity(
                            name,
                            val > takenQty ? takenQty : val
                          );
                        }}
                        className="flex-1 h-9 text-center border-2 border-gray-300 rounded-lg font-bold focus:outline-none focus:border-red-500"
                      />
                      <button
                        onClick={() =>
                          updateReturnQuantity(name, returnQty + 1)
                        }
                        disabled={returnQty >= takenQty}
                        className="w-9 h-9 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-30 flex items-center justify-center"
                      >
                        <Plus size={16} />
                      </button>
                      <span className="text-sm text-gray-600 ml-2">
                        / {takenQty}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReturnsModal(false);
                  setCurrentRound({ ...currentRound, returns: {} });
                }}
                className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={completeRound}
                className="flex-1 px-6 py-3 rounded-xl bg-[#E4002B] text-white font-bold hover:bg-black"
              >
                Complete Round
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grand Calculation Modal */}
      {showGrandCalc && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              End of Day Settlement
            </h3>

            <div className="space-y-3 mb-6">
              <div className="bg-gray-50 rounded-xl p-3 flex justify-between">
                <span className="text-sm font-bold text-gray-600">
                  Total Expected:
                </span>
                <span className="font-bold text-gray-900">
                  KSh {totalExpected.toLocaleString()}
                </span>
              </div>
              <div className="bg-red-50 rounded-xl p-3 flex justify-between">
                <span className="text-sm font-bold text-gray-600">
                  Credits (Today):
                </span>
                <span className="font-bold text-[#fd8200]">
                  -KSh {creditAmount.toLocaleString()}
                </span>
              </div>
              <div className="bg-green-50 rounded-xl p-3 flex justify-between">
                <span className="text-sm font-bold text-gray-600">
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
                  Cash Received
                </label>
                <input
                  type="number"
                  value={settlement.cash || ""}
                  onFocus={(e) =>
                    e.target.value === "0" && (e.target.value = "")
                  }
                  onChange={(e) =>
                    setSettlement({
                      ...settlement,
                      cash: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-bold focus:border-[#E4002B] focus:outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  M-Pesa Received
                </label>
                <input
                  type="number"
                  value={settlement.mpesa || ""}
                  onFocus={(e) =>
                    e.target.value === "0" && (e.target.value = "")
                  }
                  onChange={(e) =>
                    setSettlement({
                      ...settlement,
                      mpesa: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-bold focus:border-[#E4002B] focus:outline-none"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl p-4 mb-6 text-white">
              <div className="flex justify-between mb-2">
                <span className="font-bold">Total Collected:</span>
                <span className="text-xl font-bold">
                  KSh {totalCollected.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between border-t border-white/20 pt-2">
                <span className="font-bold">Difference:</span>
                <span
                  className={`text-xl font-bold ${
                    difference >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {difference >= 0 ? "+" : ""}KSh {difference.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowGrandCalc(false)}
                className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleGrandCalculation}
                className="flex-1 px-6 py-3 rounded-xl bg-[#E4002B] text-white font-bold hover:bg-black"
              >
                Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credit Customer Modal */}
      {showCreditModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Add Credit Customer
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              This amount will be deducted from today's expected total
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
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-[#E4002B] focus:outline-none"
                  placeholder="Enter name"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Amount Owed (KSh)
                </label>
                <input
                  type="number"
                  value={creditCustomer.amount || ""}
                  onFocus={(e) =>
                    e.target.value === "0" && (e.target.value = "")
                  }
                  onChange={(e) =>
                    setCreditCustomer({
                      ...creditCustomer,
                      amount: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-bold focus:border-[#E4002B] focus:outline-none"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCreditModal(false)}
                className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCredit}
                className="flex-1 px-6 py-3 rounded-xl bg-[#E4002B] text-white font-bold hover:bg-black"
              >
                Add Credit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
