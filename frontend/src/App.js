import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import BudgetDashboard from './components/BudgetDashboard';
import AuthPage from './components/AuthPage';
import { Toaster } from "./components/ui/toaster";

// This component checks if a user is authenticated.
// If they are, it renders the requested component (children).
// If not, it redirects them to the login page.
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('accessToken');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          {/* Public route for login/signup */}
          <Route path="/login" element={<AuthPage />} />
          
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
