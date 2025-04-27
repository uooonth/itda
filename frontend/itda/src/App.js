import React from 'react';
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import Nav from './components/nav';

// page 요소
import Home from './pages/home'; 
import Profile from './pages/profile';
import Project from './pages/project';
import Login from './pages/login';
import SignupAgreement from './pages/signup/signupAgreement';
import SignupForm from './pages/signup/signupForm';
import SignupVerification from './pages/signup/signupVerification';
import SignupComplete from './pages/signup/signupComplete';

// component 요소
import "./App.css";

function App() {
  const location = useLocation();
  const isLoggedIn = false; 

  const username = "어금지"; 


  const hideNav = location.pathname === "/login" | location.pathname === "/signupAgreement" | location.pathname === "/signupForm" | location.pathname === "/signupVerification" | location.pathname === "/signupComplete";

  return (
    <div className="App">
      {!hideNav && <Nav username={username} isLoggedIn={isLoggedIn} />}
      <Routes>
        <Route path="/" element={<Navigate replace to="/home" />} />
        <Route path="/home" element={<Home />} />
        <Route path="/project" element={<Project />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signupAgreement" element={<SignupAgreement />} />
        <Route path="/signupForm" element={<SignupForm />} />
        <Route path="/signupVerification" element={<SignupVerification />} />
        <Route path="/signupComplete" element={<SignupComplete />} />
      </Routes>
    </div>
  );
}

export default App;
