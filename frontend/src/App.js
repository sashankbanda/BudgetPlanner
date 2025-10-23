import React, { useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import BudgetDashboard from './pages/BudgetDashboard';
import AuthPage from './pages/AuthPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import { Toaster } from "./components/ui/toaster";
import { setupApiClient } from "./services/api";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  return token ? children : <Navigate to="/login" />;
};

// This component will pass the navigate function to our api client
const ApiNavigator = () => {
    const navigate = useNavigate();
    useEffect(() => {
        setupApiClient(navigate);
    }, [navigate]);
    return null; // This component does not render anything
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <ApiNavigator />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<AuthPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          
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
