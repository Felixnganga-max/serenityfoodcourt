import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  DollarSign,
  Package,
  Tag,
  Layers,
  Check,
  Sparkles,
} from "lucide-react";

const API_BASE_URL =
  "https://serenityfoodcourt-un3u.vercel.app/serenityfoodcourt";

const ExpensesManagement = () => {
  const [activeTab, setActiveTab] = useState("expenses");
  const token = localStorage.getItem("token") || "";

  // Expenses State
  const [expenses, setExpenses] = useState([]);
  const [expenseForm, setExpenseForm] = useState({
    name: "",
    amount: "",
    type: "fixed",
    category: "",
    allocationPeriod: "daily",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    description: "",
  });
  const [editingExpense, setEditingExpense] = useState(null);

  // Categories State
  const [categories, setCategories] = useState([]);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    icon: "",
  });
  const [editingCategory, setEditingCategory] = useState(null);

  // Raw Material Groups State
  const [rawMaterialGroups, setRawMaterialGroups] = useState([]);
  const [rawMaterialForm, setRawMaterialForm] = useState({
    name: "",
    description: "",
  });
  const [editingRawMaterial, setEditingRawMaterial] = useState(null);

  // Menu Items State
  const [menuItems, setMenuItems] = useState([]);
  const [menuItemForm, setMenuItemForm] = useState({
    name: "",
    price: "",
    category: "",
    rawMaterialGroup: "",
    description: "",
    icon: "",
  });
  const [editingMenuItem, setEditingMenuItem] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch data based on active tab
  useEffect(() => {
    switch (activeTab) {
      case "expenses":
        fetchExpenses();
        break;
      case "categories":
        fetchCategories();
        break;
      case "rawMaterials":
        fetchRawMaterialGroups();
        break;
      case "menuItems":
        fetchCategories();
        fetchRawMaterialGroups();
        fetchMenuItems();
        break;
      default:
        break;
    }
  }, [activeTab]);

  // ============= EXPENSES FUNCTIONS =============
  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/expenses`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setExpenses(data.data);
      } else {
        setError(data.error || "Failed to fetch expenses");
      }
    } catch (err) {
      setError("Failed to fetch expenses");
    } finally {
      setLoading(false);
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const url = editingExpense
        ? `${API_BASE_URL}/expenses/${editingExpense._id}`
        : `${API_BASE_URL}/expenses`;

      const method = editingExpense ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(expenseForm),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(editingExpense ? "Expense updated!" : "Expense created!");
        fetchExpenses();
        resetExpenseForm();
      } else {
        setError(data.error || "Failed to save expense");
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const deleteExpense = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?"))
      return;

    try {
      const response = await fetch(`${API_BASE_URL}/expenses/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setSuccess("Expense deleted!");
        fetchExpenses();
      } else {
        setError(data.error || "Failed to delete expense");
      }
    } catch (err) {
      setError("Failed to delete expense");
    }
  };

  const resetExpenseForm = () => {
    setExpenseForm({
      name: "",
      amount: "",
      type: "fixed",
      category: "",
      allocationPeriod: "daily",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      description: "",
    });
    setEditingExpense(null);
  };

  // ============= CATEGORIES FUNCTIONS =============
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/categories?includeInactive=true`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      } else {
        setError(data.error || "Failed to fetch categories");
      }
    } catch (err) {
      setError("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const url = editingCategory
        ? `${API_BASE_URL}/categories/${editingCategory._id}`
        : `${API_BASE_URL}/categories`;

      const method = editingCategory ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(categoryForm),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(editingCategory ? "Category updated!" : "Category created!");
        fetchCategories();
        resetCategoryForm();
      } else {
        setError(data.error || "Failed to save category");
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const toggleCategoryStatus = async (id, currentStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess("Category status updated!");
        fetchCategories();
      }
    } catch (err) {
      setError("Failed to update category status");
    }
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      name: "",
      description: "",
      icon: "",
    });
    setEditingCategory(null);
  };

  // ============= RAW MATERIAL GROUPS FUNCTIONS =============
  const fetchRawMaterialGroups = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/raw-material-groups`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setRawMaterialGroups(data.data);
      } else {
        setError(data.error || "Failed to fetch raw material groups");
      }
    } catch (err) {
      setError("Failed to fetch raw material groups");
    } finally {
      setLoading(false);
    }
  };

  const handleRawMaterialSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const url = editingRawMaterial
        ? `${API_BASE_URL}/raw-material-groups/${editingRawMaterial._id}`
        : `${API_BASE_URL}/raw-material-groups`;

      const method = editingRawMaterial ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(rawMaterialForm),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(
          editingRawMaterial
            ? "Raw Material Group updated!"
            : "Raw Material Group created!"
        );
        fetchRawMaterialGroups();
        resetRawMaterialForm();
      } else {
        setError(data.error || "Failed to save raw material group");
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const resetRawMaterialForm = () => {
    setRawMaterialForm({
      name: "",
      description: "",
    });
    setEditingRawMaterial(null);
  };

  // ============= MENU ITEMS FUNCTIONS =============
  const fetchMenuItems = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/menu-items?includeInactive=true`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setMenuItems(data.data);
      } else {
        setError(data.error || "Failed to fetch menu items");
      }
    } catch (err) {
      setError("Failed to fetch menu items");
    } finally {
      setLoading(false);
    }
  };

  const handleMenuItemSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const url = editingMenuItem
        ? `${API_BASE_URL}/menu-items/${editingMenuItem._id}`
        : `${API_BASE_URL}/menu-items`;

      const method = editingMenuItem ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...menuItemForm,
          price: parseFloat(menuItemForm.price),
          category: menuItemForm.category || undefined,
          rawMaterialGroup: menuItemForm.rawMaterialGroup || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(
          editingMenuItem ? "Menu Item updated!" : "Menu Item created!"
        );
        fetchMenuItems();
        resetMenuItemForm();
      } else {
        setError(data.error || "Failed to save menu item");
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const deleteMenuItem = async (id) => {
    if (!window.confirm("Are you sure you want to deactivate this menu item?"))
      return;

    try {
      const response = await fetch(`${API_BASE_URL}/menu-items/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setSuccess("Menu Item deactivated!");
        fetchMenuItems();
      } else {
        setError(data.error || "Failed to deactivate menu item");
      }
    } catch (err) {
      setError("Failed to delete menu item");
    }
  };

  const resetMenuItemForm = () => {
    setMenuItemForm({
      name: "",
      price: "",
      category: "",
      rawMaterialGroup: "",
      description: "",
      icon: "",
    });
    setEditingMenuItem(null);
  };

  const iconOptions = [
    "🍕",
    "🍔",
    "🍟",
    "🌭",
    "☕",
    "🍰",
    "🫓",
    "🍜",
    "🌮",
    "🍱",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl p-8 mb-8 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="w-8 h-8" />
              <h1 className="text-4xl md:text-5xl font-bold drop-shadow-lg">
                Setup & Management
              </h1>
            </div>
            <p className="text-indigo-100 text-lg md:text-xl">
              Configure your cafe products, categories, and expenses with style
            </p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-white border-l-4 border-red-500 text-red-800 px-6 py-4 rounded-2xl mb-6 flex justify-between items-center shadow-lg animate-in slide-in-from-top">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 rounded-full p-2">
                <X size={20} className="text-red-600" />
              </div>
              <span className="font-medium">{error}</span>
            </div>
            <button
              onClick={() => setError("")}
              className="hover:bg-red-50 rounded-full p-2 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {success && (
          <div className="bg-white border-l-4 border-green-500 text-green-800 px-6 py-4 rounded-2xl mb-6 flex justify-between items-center shadow-lg animate-in slide-in-from-top">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 rounded-full p-2">
                <Check size={20} className="text-green-600" />
              </div>
              <span className="font-medium">{success}</span>
            </div>
            <button
              onClick={() => setSuccess("")}
              className="hover:bg-green-50 rounded-full p-2 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-3xl shadow-xl mb-8 overflow-hidden">
          <div className="flex border-b overflow-x-auto bg-gradient-to-r from-gray-50 to-gray-100">
            <button
              onClick={() => setActiveTab("categories")}
              className={`px-6 py-5 font-semibold flex items-center gap-3 whitespace-nowrap transition-all duration-300 ${
                activeTab === "categories"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105"
                  : "text-gray-600 hover:bg-white hover:text-indigo-600"
              }`}
            >
              <Tag size={22} />
              <span>Categories</span>
            </button>
            <button
              onClick={() => setActiveTab("rawMaterials")}
              className={`px-6 py-5 font-semibold flex items-center gap-3 whitespace-nowrap transition-all duration-300 ${
                activeTab === "rawMaterials"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105"
                  : "text-gray-600 hover:bg-white hover:text-indigo-600"
              }`}
            >
              <Layers size={22} />
              <span>Raw Material Groups</span>
            </button>
            <button
              onClick={() => setActiveTab("menuItems")}
              className={`px-6 py-5 font-semibold flex items-center gap-3 whitespace-nowrap transition-all duration-300 ${
                activeTab === "menuItems"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105"
                  : "text-gray-600 hover:bg-white hover:text-indigo-600"
              }`}
            >
              <Package size={22} />
              <span>Menu Items</span>
            </button>
            <button
              onClick={() => setActiveTab("expenses")}
              className={`px-6 py-5 font-semibold flex items-center gap-3 whitespace-nowrap transition-all duration-300 ${
                activeTab === "expenses"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105"
                  : "text-gray-600 hover:bg-white hover:text-indigo-600"
              }`}
            >
              <DollarSign size={22} />
              <span>Expenses</span>
            </button>
          </div>

          <div className="p-8">
            {/* CATEGORIES TAB */}
            {activeTab === "categories" && (
              <div className="space-y-8">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-100">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <div className="bg-indigo-600 rounded-xl p-2">
                      <Plus className="text-white" size={24} />
                    </div>
                    {editingCategory ? "Edit Category" : "Add New Category"}
                  </h2>
                  <form onSubmit={handleCategorySubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Category Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={categoryForm.name}
                          onChange={(e) =>
                            setCategoryForm({
                              ...categoryForm,
                              name: e.target.value,
                            })
                          }
                          className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-200 focus:border-indigo-400 transition-all duration-200 bg-white"
                          placeholder="e.g., Drinks, Snacks, Main Course"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Pick an Icon
                        </label>
                        <div className="flex gap-2 flex-wrap">
                          {iconOptions.map((icon) => (
                            <button
                              key={icon}
                              type="button"
                              onClick={() =>
                                setCategoryForm({ ...categoryForm, icon })
                              }
                              className={`text-3xl p-3 rounded-xl transition-all duration-200 ${
                                categoryForm.icon === icon
                                  ? "bg-indigo-600 scale-110 shadow-lg"
                                  : "bg-white hover:bg-indigo-50 hover:scale-105 shadow border-2 border-gray-200"
                              }`}
                            >
                              {icon}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Description
                        </label>
                        <textarea
                          value={categoryForm.description}
                          onChange={(e) =>
                            setCategoryForm({
                              ...categoryForm,
                              description: e.target.value,
                            })
                          }
                          className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-200 focus:border-indigo-400 transition-all duration-200 bg-white"
                          rows="3"
                          placeholder="Category description..."
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                      >
                        <Save size={20} />
                        {editingCategory ? "Update" : "Create"} Category
                      </button>
                      {editingCategory && (
                        <button
                          type="button"
                          onClick={resetCategoryForm}
                          className="bg-gray-200 text-gray-700 px-8 py-3 rounded-xl hover:bg-gray-300 font-semibold transition-all duration-200"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-6">
                    Your Categories
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map((category) => (
                      <div
                        key={category._id}
                        className={`group relative rounded-2xl p-6 transition-all duration-300 hover:scale-105 cursor-pointer ${
                          category.isActive
                            ? "bg-gradient-to-br from-white to-indigo-50 border-2 border-indigo-200 shadow-lg hover:shadow-xl"
                            : "bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-300 opacity-75"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            {category.icon && (
                              <span className="text-4xl">{category.icon}</span>
                            )}
                            <div>
                              <h4 className="font-bold text-gray-800 text-lg">
                                {category.name}
                              </h4>
                              <span
                                className={`text-xs font-semibold px-3 py-1 rounded-full inline-block mt-1 ${
                                  category.isActive
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {category.isActive ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditingCategory(category);
                                setCategoryForm({
                                  name: category.name,
                                  description: category.description || "",
                                  icon: category.icon || "",
                                });
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className="bg-indigo-100 text-indigo-600 hover:bg-indigo-200 rounded-lg p-2 transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() =>
                                toggleCategoryStatus(
                                  category._id,
                                  category.isActive
                                )
                              }
                              className={`rounded-lg p-2 transition-colors ${
                                category.isActive
                                  ? "bg-red-100 text-red-600 hover:bg-red-200"
                                  : "bg-green-100 text-green-600 hover:bg-green-200"
                              }`}
                              title={
                                category.isActive ? "Deactivate" : "Activate"
                              }
                            >
                              <X size={18} />
                            </button>
                          </div>
                        </div>
                        {category.description && (
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {category.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  {categories.length === 0 && (
                    <div className="text-center py-16 text-gray-500 bg-white rounded-2xl border-2 border-dashed border-gray-300">
                      <Tag size={48} className="mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium">No categories yet</p>
                      <p className="text-sm">
                        Add your first category above to get started
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* RAW MATERIALS TAB */}
            {activeTab === "rawMaterials" && (
              <div className="space-y-8">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <div className="bg-purple-600 rounded-xl p-2">
                      <Plus className="text-white" size={24} />
                    </div>
                    {editingRawMaterial
                      ? "Edit Raw Material Group"
                      : "Add New Raw Material Group"}
                  </h2>
                  <form
                    onSubmit={handleRawMaterialSubmit}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Group Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={rawMaterialForm.name}
                          onChange={(e) =>
                            setRawMaterialForm({
                              ...rawMaterialForm,
                              name: e.target.value,
                            })
                          }
                          className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-400 transition-all duration-200 bg-white"
                          placeholder="e.g., Wheat-based, Potato-based, Beverages"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Description
                        </label>
                        <textarea
                          value={rawMaterialForm.description}
                          onChange={(e) =>
                            setRawMaterialForm({
                              ...rawMaterialForm,
                              description: e.target.value,
                            })
                          }
                          className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-400 transition-all duration-200 bg-white"
                          rows="3"
                          placeholder="Group description..."
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                      >
                        <Save size={20} />
                        {editingRawMaterial ? "Update" : "Create"} Raw Material
                        Group
                      </button>
                      {editingRawMaterial && (
                        <button
                          type="button"
                          onClick={resetRawMaterialForm}
                          className="bg-gray-200 text-gray-700 px-8 py-3 rounded-xl hover:bg-gray-300 font-semibold transition-all duration-200"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-6">
                    Your Raw Material Groups
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rawMaterialGroups.map((group) => (
                      <div
                        key={group._id}
                        className="group relative bg-gradient-to-br from-white to-purple-50 border-2 border-purple-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-bold text-gray-800 text-lg">
                              {group.name}
                            </h4>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditingRawMaterial(group);
                                setRawMaterialForm({
                                  name: group.name,
                                  description: group.description || "",
                                });
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className="bg-purple-100 text-purple-600 hover:bg-purple-200 rounded-lg p-2 transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                          </div>
                        </div>
                        {group.description && (
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {group.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  {rawMaterialGroups.length === 0 && (
                    <div className="text-center py-16 text-gray-500 bg-white rounded-2xl border-2 border-dashed border-gray-300">
                      <Layers
                        size={48}
                        className="mx-auto mb-4 text-gray-400"
                      />
                      <p className="text-lg font-medium">
                        No raw material groups yet
                      </p>
                      <p className="text-sm">
                        Add your first group above to get started
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* MENU ITEMS TAB */}
            {activeTab === "menuItems" && (
              <div className="space-y-8">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 border border-blue-100">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <div className="bg-blue-600 rounded-xl p-2">
                      <Plus className="text-white" size={24} />
                    </div>
                    {editingMenuItem ? "Edit Menu Item" : "Add New Menu Item"}
                  </h2>
                  <form onSubmit={handleMenuItemSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Item Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={menuItemForm.name}
                          onChange={(e) =>
                            setMenuItemForm({
                              ...menuItemForm,
                              name: e.target.value,
                            })
                          }
                          className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-400 transition-all duration-200 bg-white"
                          placeholder="e.g., Cappuccino, Burger, Fries"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Price *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={menuItemForm.price}
                          onChange={(e) =>
                            setMenuItemForm({
                              ...menuItemForm,
                              price: e.target.value,
                            })
                          }
                          className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-400 transition-all duration-200 bg-white"
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Category
                        </label>
                        <select
                          value={menuItemForm.category}
                          onChange={(e) =>
                            setMenuItemForm({
                              ...menuItemForm,
                              category: e.target.value,
                            })
                          }
                          className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-400 transition-all duration-200 bg-white"
                        >
                          <option value="">Select Category</option>
                          {categories
                            .filter((cat) => cat.isActive)
                            .map((cat) => (
                              <option key={cat._id} value={cat._id}>
                                {cat.icon} {cat.name}
                              </option>
                            ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Raw Material Group
                        </label>
                        <select
                          value={menuItemForm.rawMaterialGroup}
                          onChange={(e) =>
                            setMenuItemForm({
                              ...menuItemForm,
                              rawMaterialGroup: e.target.value,
                            })
                          }
                          className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-400 transition-all duration-200 bg-white"
                        >
                          <option value="">Select Raw Material Group</option>
                          {rawMaterialGroups.map((group) => (
                            <option key={group._id} value={group._id}>
                              {group.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Pick an Icon
                        </label>
                        <div className="flex gap-2 flex-wrap">
                          {iconOptions.map((icon) => (
                            <button
                              key={icon}
                              type="button"
                              onClick={() =>
                                setMenuItemForm({ ...menuItemForm, icon })
                              }
                              className={`text-3xl p-3 rounded-xl transition-all duration-200 ${
                                menuItemForm.icon === icon
                                  ? "bg-blue-600 scale-110 shadow-lg"
                                  : "bg-white hover:bg-blue-50 hover:scale-105 shadow border-2 border-gray-200"
                              }`}
                            >
                              {icon}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Description
                        </label>
                        <textarea
                          value={menuItemForm.description}
                          onChange={(e) =>
                            setMenuItemForm({
                              ...menuItemForm,
                              description: e.target.value,
                            })
                          }
                          className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-400 transition-all duration-200 bg-white"
                          rows="3"
                          placeholder="Item description..."
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                      >
                        <Save size={20} />
                        {editingMenuItem ? "Update" : "Create"} Menu Item
                      </button>
                      {editingMenuItem && (
                        <button
                          type="button"
                          onClick={resetMenuItemForm}
                          className="bg-gray-200 text-gray-700 px-8 py-3 rounded-xl hover:bg-gray-300 font-semibold transition-all duration-200"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-6">
                    Your Menu Items
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {menuItems.map((item) => (
                      <div
                        key={item._id}
                        className={`group relative rounded-2xl p-6 transition-all duration-300 hover:scale-105 cursor-pointer ${
                          item.isActive
                            ? "bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 shadow-lg hover:shadow-xl"
                            : "bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-300 opacity-75"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            {item.icon && (
                              <span className="text-4xl">{item.icon}</span>
                            )}
                            <div>
                              <h4 className="font-bold text-gray-800 text-lg">
                                {item.name}
                              </h4>
                              <p className="text-xl font-bold text-blue-600 mt-1">
                                ${parseFloat(item.price).toFixed(2)}
                              </p>
                              <span
                                className={`text-xs font-semibold px-3 py-1 rounded-full inline-block mt-1 ${
                                  item.isActive
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {item.isActive ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditingMenuItem(item);
                                setMenuItemForm({
                                  name: item.name,
                                  price: item.price.toString(),
                                  category: item.category?._id || "",
                                  rawMaterialGroup:
                                    item.rawMaterialGroup?._id || "",
                                  description: item.description || "",
                                  icon: item.icon || "",
                                });
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className="bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg p-2 transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => deleteMenuItem(item._id)}
                              className="bg-red-100 text-red-600 hover:bg-red-200 rounded-lg p-2 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-600 leading-relaxed mb-3">
                            {item.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 text-xs">
                          {item.category && (
                            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium">
                              {item.category.icon} {item.category.name}
                            </span>
                          )}
                          {item.rawMaterialGroup && (
                            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
                              {item.rawMaterialGroup.name}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {menuItems.length === 0 && (
                    <div className="text-center py-16 text-gray-500 bg-white rounded-2xl border-2 border-dashed border-gray-300">
                      <Package
                        size={48}
                        className="mx-auto mb-4 text-gray-400"
                      />
                      <p className="text-lg font-medium">No menu items yet</p>
                      <p className="text-sm">
                        Add your first menu item above to get started
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* EXPENSES TAB */}
            {activeTab === "expenses" && (
              <div className="space-y-8">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <div className="bg-green-600 rounded-xl p-2">
                      <Plus className="text-white" size={24} />
                    </div>
                    {editingExpense ? "Edit Expense" : "Add New Expense"}
                  </h2>
                  <form onSubmit={handleExpenseSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Expense Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={expenseForm.name}
                          onChange={(e) =>
                            setExpenseForm({
                              ...expenseForm,
                              name: e.target.value,
                            })
                          }
                          className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-200 focus:border-green-400 transition-all duration-200 bg-white"
                          placeholder="e.g., Rent, Utilities, Salaries"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Amount *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={expenseForm.amount}
                          onChange={(e) =>
                            setExpenseForm({
                              ...expenseForm,
                              amount: e.target.value,
                            })
                          }
                          className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-200 focus:border-green-400 transition-all duration-200 bg-white"
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Type *
                        </label>
                        <select
                          value={expenseForm.type}
                          onChange={(e) =>
                            setExpenseForm({
                              ...expenseForm,
                              type: e.target.value,
                            })
                          }
                          className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-200 focus:border-green-400 transition-all duration-200 bg-white"
                        >
                          <option value="fixed">Fixed</option>
                          <option value="variable">Variable</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Category *
                        </label>
                        <input
                          type="text"
                          required
                          value={expenseForm.category}
                          onChange={(e) =>
                            setExpenseForm({
                              ...expenseForm,
                              category: e.target.value,
                            })
                          }
                          className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-200 focus:border-green-400 transition-all duration-200 bg-white"
                          placeholder="e.g., Operations, Marketing, Staff"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Allocation Period *
                        </label>
                        <select
                          value={expenseForm.allocationPeriod}
                          onChange={(e) =>
                            setExpenseForm({
                              ...expenseForm,
                              allocationPeriod: e.target.value,
                            })
                          }
                          className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-200 focus:border-green-400 transition-all duration-200 bg-white"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Start Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={expenseForm.startDate}
                          onChange={(e) =>
                            setExpenseForm({
                              ...expenseForm,
                              startDate: e.target.value,
                            })
                          }
                          className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-200 focus:border-green-400 transition-all duration-200 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          End Date (Optional)
                        </label>
                        <input
                          type="date"
                          value={expenseForm.endDate}
                          onChange={(e) =>
                            setExpenseForm({
                              ...expenseForm,
                              endDate: e.target.value,
                            })
                          }
                          className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-200 focus:border-green-400 transition-all duration-200 bg-white"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Description
                        </label>
                        <textarea
                          value={expenseForm.description}
                          onChange={(e) =>
                            setExpenseForm({
                              ...expenseForm,
                              description: e.target.value,
                            })
                          }
                          className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-200 focus:border-green-400 transition-all duration-200 bg-white"
                          rows="3"
                          placeholder="Expense description..."
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                      >
                        <Save size={20} />
                        {editingExpense ? "Update" : "Create"} Expense
                      </button>
                      {editingExpense && (
                        <button
                          type="button"
                          onClick={resetExpenseForm}
                          className="bg-gray-200 text-gray-700 px-8 py-3 rounded-xl hover:bg-gray-300 font-semibold transition-all duration-200"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-6">
                    Your Expenses
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {expenses.map((expense) => (
                      <div
                        key={expense._id}
                        className="group relative bg-gradient-to-br from-white to-green-50 border-2 border-green-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-bold text-gray-800 text-lg">
                              {expense.name}
                            </h4>
                            <p className="text-2xl font-bold text-green-600 mt-1">
                              ${parseFloat(expense.amount).toFixed(2)}
                            </p>
                            <div className="flex gap-2 mt-2">
                              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                                {expense.type}
                              </span>
                              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-100 text-purple-700">
                                {expense.allocationPeriod}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditingExpense(expense);
                                setExpenseForm({
                                  name: expense.name,
                                  amount: expense.amount.toString(),
                                  type: expense.type,
                                  category: expense.category,
                                  allocationPeriod: expense.allocationPeriod,
                                  startDate: expense.startDate.split("T")[0],
                                  endDate: expense.endDate
                                    ? expense.endDate.split("T")[0]
                                    : "",
                                  description: expense.description || "",
                                });
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className="bg-green-100 text-green-600 hover:bg-green-200 rounded-lg p-2 transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => deleteExpense(expense._id)}
                              className="bg-red-100 text-red-600 hover:bg-red-200 rounded-lg p-2 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                        {expense.description && (
                          <p className="text-sm text-gray-600 leading-relaxed mb-3">
                            {expense.description}
                          </p>
                        )}
                        <div className="text-xs text-gray-500 space-y-1">
                          <p>
                            <span className="font-semibold">Category:</span>{" "}
                            {expense.category}
                          </p>
                          <p>
                            <span className="font-semibold">Start:</span>{" "}
                            {new Date(expense.startDate).toLocaleDateString()}
                          </p>
                          {expense.endDate && (
                            <p>
                              <span className="font-semibold">End:</span>{" "}
                              {new Date(expense.endDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {expenses.length === 0 && (
                    <div className="text-center py-16 text-gray-500 bg-white rounded-2xl border-2 border-dashed border-gray-300">
                      <DollarSign
                        size={48}
                        className="mx-auto mb-4 text-gray-400"
                      />
                      <p className="text-lg font-medium">No expenses yet</p>
                      <p className="text-sm">
                        Add your first expense above to get started
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpensesManagement;
