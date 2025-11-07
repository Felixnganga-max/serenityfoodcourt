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

  if (!token) {
    console.error("No token found in localStorage");
    return null;
  }

  console.log("Token exists:", token.substring(0, 20) + "...");

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

// API Service functions
const apiService = {
  // Sales endpoints
  getSummary: async () => {
    const headers = getAuthHeaders();
    if (!headers) throw new Error("No authentication token");

    const response = await fetch(`${API_BASE_URL}/sales/summary`, {
      method: "GET",
      headers,
    });

    if (response.status === 401 || response.status === 403) {
      throw new Error("AUTH_ERROR");
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Summary API Error:", errorText);
      throw new Error(`Failed to fetch summary: ${response.status}`);
    }

    return response.json();
  },

  getReport: async (date) => {
    const headers = getAuthHeaders();
    if (!headers) throw new Error("No authentication token");

    const response = await fetch(`${API_BASE_URL}/sales/report?date=${date}`, {
      method: "GET",
      headers,
    });

    if (response.status === 401 || response.status === 403) {
      throw new Error("AUTH_ERROR");
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Report API Error:", errorText);
      throw new Error(`Failed to fetch report: ${response.status}`);
    }

    return response.json();
  },

  createSale: async (saleData) => {
    const headers = getAuthHeaders();
    if (!headers) throw new Error("No authentication token");

    console.log("Creating sale with data:", JSON.stringify(saleData, null, 2));

    const response = await fetch(`${API_BASE_URL}/sales/create-sale`, {
      method: "POST",
      headers,
      body: JSON.stringify(saleData),
    });

    console.log("API Response status:", response.status);

    if (response.status === 401 || response.status === 403) {
      throw new Error("AUTH_ERROR");
    }

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

  // Credits endpoints
  getCredits: async () => {
    const headers = getAuthHeaders();
    if (!headers) {
      console.warn("No auth token, returning empty credits");
      return { success: true, data: [] };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/credits`, {
        method: "GET",
        headers,
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error("AUTH_ERROR");
      }

      // Credits endpoint doesn't exist - return empty array
      if (response.status === 404) {
        console.warn("Credits endpoint not found, returning empty array");
        return { success: true, data: [] };
      }

      if (!response.ok) {
        console.error("Credits fetch failed:", response.status);
        return { success: true, data: [] };
      }

      return response.json();
    } catch (error) {
      if (error.message === "AUTH_ERROR") {
        throw error;
      }
      console.warn(
        "Error fetching credits, returning empty array:",
        error.message
      );
      return { success: true, data: [] };
    }
  },

  collectCredit: async (creditId, paymentData) => {
    const headers = getAuthHeaders();
    if (!headers) throw new Error("No authentication token");

    try {
      const response = await fetch(
        `${API_BASE_URL}/credits/${creditId}/collect`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(paymentData),
        }
      );

      if (response.status === 401 || response.status === 403) {
        throw new Error("AUTH_ERROR");
      }

      if (response.status === 404) {
        throw new Error("Credits collection endpoint not found");
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Collect credit error:", errorText);
        throw new Error(`Failed to collect credit: ${response.status}`);
      }

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

      console.log("Checking authentication...");
      console.log("Token exists:", !!token);
      console.log("User exists:", !!user);

      if (!token || !user) {
        console.error("Missing authentication credentials");
        window.location.href = "/login";
        return false;
      }

      try {
        // Basic token validation
        const tokenParts = token.split(".");
        if (tokenParts.length !== 3) {
          throw new Error("Invalid token format");
        }

        const userData = JSON.parse(user);
        console.log("User authenticated:", userData.username, userData.role);
        return true;
      } catch (err) {
        console.error("Auth validation error:", err);
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
    if (activeTab === "reports" && !loading) {
      fetchReport(selectedDate);
    }
  }, [selectedDate, activeTab]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching all data...");

      // Fetch summary first
      let summaryResponse;
      try {
        summaryResponse = await apiService.getSummary();
        console.log("Summary response:", summaryResponse);
        if (summaryResponse.success) {
          setSummaryData(summaryResponse.data);
        }
      } catch (err) {
        if (err.message === "AUTH_ERROR") {
          console.error("Authentication failed, redirecting to login");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login";
          return;
        }
        console.error("Summary fetch failed:", err);
        throw err;
      }

      // Fetch credits (non-critical)
      try {
        const creditsResponse = await apiService.getCredits();
        console.log("Credits response:", creditsResponse);
        setCredits(creditsResponse.data || []);
      } catch (err) {
        if (err.message === "AUTH_ERROR") {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login";
          return;
        }
        console.warn("Credits fetch failed, continuing without credits:", err);
        setCredits([]);
      }

      // Fetch today's report
      try {
        const todayDate = new Date().toISOString().split("T")[0];
        const reportResponse = await apiService.getReport(todayDate);
        console.log("Report response:", reportResponse);
        if (reportResponse.success) {
          setReportData(reportResponse.data);
        }
      } catch (err) {
        if (err.message === "AUTH_ERROR") {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login";
          return;
        }
        console.warn("Report fetch failed:", err);
      }

      console.log("Data fetch completed successfully");
    } catch (err) {
      console.error("Error fetching data:", err);

      // Handle authentication errors
      if (
        err.message === "AUTH_ERROR" ||
        err.message.includes("401") ||
        err.message.includes("403")
      ) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return;
      }

      setError("Failed to connect to server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async (date) => {
    try {
      console.log("Fetching report for date:", date);
      const response = await apiService.getReport(date);
      if (response.success) {
        setReportData(response.data);
        console.log("Report data updated");
      }
    } catch (err) {
      if (err.message === "AUTH_ERROR") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return;
      }
      console.error("Error fetching report:", err);
    }
  };

  const handleCreateSale = async (saleData) => {
    try {
      console.log("Creating sale:", saleData);
      const response = await apiService.createSale(saleData);
      if (response.success) {
        console.log("Sale created successfully:", response.data);
        await fetchAllData();
        return response.data;
      }
    } catch (err) {
      if (err.message === "AUTH_ERROR") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return;
      }
      console.error("Error creating sale:", err);
      throw err;
    }
  };

  const handleCollectCredit = async (creditId, paymentData) => {
    try {
      console.log("Collecting credit:", creditId, paymentData);
      const response = await apiService.collectCredit(creditId, paymentData);
      if (response.success) {
        console.log("Credit collected successfully:", response.data);
        await fetchAllData();
        return response.data;
      }
    } catch (err) {
      if (err.message === "AUTH_ERROR") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return;
      }
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
          <p className="text-gray-600 font-semibold">Loading...</p>
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
        <main className="p-6 md:p-10 lg:p-12 max-w-[1800px] mx-auto w-full">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default MainApp;
