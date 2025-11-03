import React, { useState, useEffect } from "react";
import { Menu, AlertCircle } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Dashboard } from "./Dashboard";
import { WalkIn } from "./WalkIn";
import { SalesReports } from "./SalesReports";
import { OutsideCatering } from "./OutsideCatering";
import UserManagement from "./UserManagement";
import ExpensesManagement from "./Expenses";

// API Configuration
const API_BASE_URL =
  "https://serenityfoodcourt-t8j7.vercel.app/serenityfoodcourt";

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

// API Service functions
const apiService = {
  // Sales endpoints
  getSummary: async () => {
    const response = await fetch(`${API_BASE_URL}/sales/summary`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch summary");
    return response.json();
  },

  getReport: async (date) => {
    const response = await fetch(`${API_BASE_URL}/sales/report?date=${date}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch report");
    return response.json();
  },

  createSale: async (saleData) => {
    console.log("Sending to API:", JSON.stringify(saleData, null, 2));
    const response = await fetch(`${API_BASE_URL}/sales/create-sale`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(saleData),
    });

    console.log("API Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error response:", errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      throw new Error(
        errorData.error ||
          errorData.message ||
          `Failed to create sale (${response.status})`
      );
    }
    return response.json();
  },

  // Credits endpoints - NOTE: These endpoints don't exist in your routes!
  getCredits: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/credits`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      // Credits endpoint doesn't exist - return empty array
      if (response.status === 404) {
        console.warn("Credits endpoint not found, returning empty array");
        return { success: true, data: [] };
      }

      if (!response.ok) throw new Error("Failed to fetch credits");
      return response.json();
    } catch (error) {
      console.warn(
        "Error fetching credits, returning empty array:",
        error.message
      );
      return { success: true, data: [] };
    }
  },

  collectCredit: async (creditId, paymentData) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/credits/${creditId}/collect`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(paymentData),
        }
      );

      if (response.status === 404) {
        throw new Error("Credits collection endpoint not found");
      }

      if (!response.ok) throw new Error("Failed to collect credit");
      return response.json();
    } catch (error) {
      console.error("Error collecting credit:", error);
      throw error;
    }
  },
};

// Placeholder component for features under development
const ComingSoon = ({ title, description }) => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="text-center max-w-md">
      <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <AlertCircle size={48} className="text-indigo-600" />
      </div>
      <h2 className="text-3xl font-bold text-gray-800 mb-3">{title}</h2>
      <p className="text-gray-600 mb-6">{description}</p>
      <div className="inline-block px-6 py-3 bg-indigo-100 text-indigo-700 rounded-lg font-semibold">
        Coming Soon
      </div>
    </div>
  </div>
);

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

  // Authentication check
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");

      if (!token || !user) {
        window.location.href = "/login";
        return false;
      }

      try {
        // Basic token validation
        const tokenParts = token.split(".");
        if (tokenParts.length !== 3) {
          throw new Error("Invalid token format");
        }

        console.log("User authenticated:", JSON.parse(user));
        return true;
      } catch (err) {
        console.error("Auth error:", err);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return false;
      }
    };

    if (checkAuth()) {
      fetchAllData();
    }
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
        apiService.getSummary(),
        apiService.getCredits(), // This will return empty array if endpoint doesn't exist
      ]);

      if (summaryResponse.success) {
        setSummaryData(summaryResponse.data);
      }

      // Credits will always be set to empty array if endpoint doesn't exist
      setCredits(creditsResponse.data || []);

      // Fetch today's report for initial load
      const reportResponse = await apiService.getReport(
        new Date().toISOString().split("T")[0]
      );
      if (reportResponse.success) {
        setReportData(reportResponse.data);
      }
    } catch (err) {
      console.error("Error fetching data:", err);

      // Handle authentication errors
      if (err.message.includes("401") || err.message.includes("403")) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return;
      }

      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async (date) => {
    try {
      const response = await apiService.getReport(date);
      if (response.success) {
        setReportData(response.data);
      }
    } catch (err) {
      console.error("Error fetching report:", err);
    }
  };

  const handleCreateSale = async (saleData) => {
    try {
      const response = await apiService.createSale(saleData);
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
      const response = await apiService.collectCredit(creditId, paymentData);
      if (response.success) {
        await fetchAllData();
        return response.data;
      }
    } catch (err) {
      console.error("Error collecting credit:", err);
      throw err;
    }
  };

  // Function to render the active tab content
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard summaryData={summaryData} credits={credits} />;

      case "walkin":
        return <WalkIn onCreateSale={handleCreateSale} />;

      case "catering":
        return (
          <OutsideCatering
            credits={credits}
            onCreateSale={handleCreateSale}
            onCollectCredit={handleCollectCredit}
          />
        );

      case "reports":
        return (
          <SalesReports
            reportData={reportData}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            onDateChange={fetchReport}
          />
        );

      case "users":
        return <UserManagement />;

      case "inventory":
        return (
          <ComingSoon
            title="Inventory Management"
            description="Track stock levels, manage raw materials, and monitor product availability."
          />
        );

      case "expenses":
        return <ExpensesManagement />;

      case "settings":
        return (
          <ComingSoon
            title="Settings"
            description="Configure system preferences, manage menu items, and customize your experience."
          />
        );

      case "vendor-products":
        return (
          <ComingSoon
            title="My Products"
            description="Manage your product catalog and track product performance."
          />
        );

      case "vendor-sales":
        return (
          <ComingSoon
            title="My Sales"
            description="View your sales history and performance metrics."
          />
        );

      default:
        return <Dashboard summaryData={summaryData} credits={credits} />;
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
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default MainApp;
