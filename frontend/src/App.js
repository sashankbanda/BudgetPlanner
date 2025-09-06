import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import BudgetDashboard from './pages/BudgetDashboard';
import AuthPage from './pages/AuthPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import ResetPasswordPage from './pages/ResetPasswordPage'; // ✨ IMPORT THE NEW PAGE
import { Toaster } from "./components/ui/toaster";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<AuthPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          {/* ✨ ADD THIS NEW ROUTE FOR PASSWORD RESET ✨ */}
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          
          {/* Protected route for the main dashboard */}
          <Route 
            path="/" 
            element={
              <PrivateRoute>
                <BudgetDashboard />
              </PrivateRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;