/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import Dashboard from "./components/Dashboard";

enum PageState {
  LOGIN,
  REGISTER,
  DASHBOARD,
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageState>(PageState.LOGIN);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Check for remembered session on mount
  useEffect(() => {
    const savedSession = localStorage.getItem("fitlife_session_email");
    const rememberedEmail = localStorage.getItem("fitlife_remembered_email");

    if (savedSession) {
      setUserEmail(savedSession);
      setCurrentPage(PageState.DASHBOARD);
    } else if (rememberedEmail) {
      // Pre-fill email, let them log in
      setUserEmail(rememberedEmail);
    }
  }, []);

  const handleLoginSuccess = (token: string, user: any) => {
    setUserEmail(token);
    localStorage.setItem("fitlife_session_email", token);
    setCurrentPage(PageState.DASHBOARD);
  };

  const handleLogout = () => {
    localStorage.removeItem("fitlife_session_email");
    setUserEmail(null);
    setCurrentPage(PageState.LOGIN);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {currentPage === PageState.LOGIN && (
        <LoginPage
          onNavigateToRegister={() => setCurrentPage(PageState.REGISTER)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
      {currentPage === PageState.REGISTER && (
        <RegisterPage
          onNavigateToLogin={() => setCurrentPage(PageState.LOGIN)}
        />
      )}
      {currentPage === PageState.DASHBOARD && userEmail && (
        <Dashboard
          userEmail={userEmail}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
