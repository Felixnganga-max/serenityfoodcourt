import React, { useState, useEffect } from "react";
import { Menu, AlertCircle } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Dashboard } from "./Dashboard";
import { WalkIn } from "./WalkIn";
import { SalesReports } from "./SalesReports";
import { OutsideCatering } from "./OutsideCatering";

// API Configuration
const API_BASE_URL = "http://localhost:5000/serenityfoodcourt";

// API Service
const api = {
  getSummary: async () => {
    const response = await fetch(`${API_BASE_URL}/sales/summary`);
    if (!response.ok) throw new Error("Failed to fetch summary");
    return response.json();
  },
  getReport: async (date) => {
    const response = await fetch(`${API_BASE_URL}/sales/report?date=${date}`);
    if (!response.ok) throw new Error("Failed to fetch report");
    return response.json();
  },
  createSale: async (saleData) => {
    const response = await fetch(`${API_BASE_URL}/sales/create-sale`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(saleData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to create sale");
    }
    return response.json();
  },
  getCredits: async () => {
    const response = await fetch(`${API_BASE_URL}/credits`);
    if (!response.ok) throw new Error("Failed to fetch credits");
    return response.json();
  },
  collectCredit: async (creditId, paymentData) => {
    const response = await fetch(
      `${API_BASE_URL}/credits/${creditId}/collect`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      }
    );
    if (!response.ok) throw new Error("Failed to collect credit");
    return response.json();
  },
};

const MainApp = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (activeTab === "reports") {
      fetchReport(selectedDate);
    }
  }, [selectedDate, activeTab]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryResponse, creditsResponse] = await Promise.all([
        api.getSummary(),
        api.getCredits(),
      ]);

      if (summaryResponse.success) {
        setSummaryData(summaryResponse.data);
      }

      if (creditsResponse.success) {
        setCredits(creditsResponse.data);
      }

      // Fetch today's report for initial load
      const reportResponse = await api.getReport(
        new Date().toISOString().split("T")[0]
      );
      if (reportResponse.success) {
        setReportData(reportResponse.data);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(
        "Failed to connect to server. Make sure backend is running on http://localhost:5000"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async (date) => {
    try {
      const response = await api.getReport(date);
      if (response.success) {
        setReportData(response.data);
      }
    } catch (err) {
      console.error("Error fetching report:", err);
    }
  };

  const handleCreateSale = async (saleData) => {
    try {
      const response = await api.createSale(saleData);
      if (response.success) {
        await fetchAllData();
        return response.data;
      }
    } catch (err) {
      console.error("Error creating sale:", err);
      throw err;
    }
  };

  const handleCollectCredit = async (creditId, paymentData) => {
    try {
      const response = await api.collectCredit(creditId, paymentData);
      if (response.success) {
        await fetchAllData();
        return response.data;
      }
    } catch (err) {
      console.error("Error collecting credit:", err);
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading cafe data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle size={64} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Connection Error
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchAllData}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition-all"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white shadow-lg p-6 flex items-center justify-between lg:justify-end sticky top-0 z-30 border-b-4 border-indigo-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-3 hover:bg-indigo-50 rounded-xl transition-all"
          >
            <Menu size={28} className="text-indigo-700" />
          </button>
          <div className="text-right">
            <p className="text-sm text-indigo-600 font-semibold">
              Welcome back!
            </p>
            <p className="font-bold text-gray-900 text-xl">Cafe Manager</p>
          </div>
        </header>

        <main className="p-6 md:p-10 lg:p-12 max-w-[1800px] mx-auto w-full">
          {activeTab === "dashboard" && (
            <Dashboard summaryData={summaryData} credits={credits} />
          )}
          {activeTab === "walkin" && <WalkIn onCreateSale={handleCreateSale} />}
          {activeTab === "catering" && (
            <OutsideCatering
              credits={credits}
              onCreateSale={handleCreateSale}
              onCollectCredit={handleCollectCredit}
            />
          )}
          {activeTab === "reports" && (
            <SalesReports
              reportData={reportData}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              onDateChange={fetchReport}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default MainApp;
