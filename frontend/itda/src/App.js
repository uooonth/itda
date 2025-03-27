import React from 'react';
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import Nav from './components/nav';

// page 요소
import Home from './pages/home'; 
import Profile from './pages/profile';
import Project from './pages/project';
import Login from './pages/login';

// component 요소
import "./App.css";

function App() {
  const isLoggedIn = false; 
  const username = "어금지"; 
  const location = useLocation();

  // Login 페이지에서는 Nav 숨김
  const hideNav = location.pathname === "/login";

  return (
    <div className="App">
      {!hideNav && <Nav username={username} isLoggedIn={isLoggedIn} />}
      <Routes>
        <Route path="/" element={<Navigate replace to="/home" />} />
        <Route path="/home" element={<Home />} />
        <Route path="/project" element={<Project />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </div>
  );
}

export default App;
