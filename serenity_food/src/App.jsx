import React, { useState } from "react";
import MainApp from "./components/MainApp";
import Accounts from "./pages/Accounts";
import { Routes, Route, Navigate } from "react-router-dom";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  if (!token || !user) {
    return <Navigate to="/account" replace />;
  }

  return children;
};

function App() {
  return (
    <div className="mt-8">
      <Routes>
        {/* Public Route - Login/Register */}
        <Route path="/account" element={<Accounts />} />

        {/* Protected Route - Main App */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainApp />
            </ProtectedRoute>
          }
        />

        {/* Catch all - redirect to account or home */}
        <Route
          path="*"
          element={
            localStorage.getItem("token") ? (
              <Navigate to="/" replace />
            ) : (
              <Navigate to="/account" replace />
            )
          }
        />
      </Routes>
    </div>
  );
}

export default App;
