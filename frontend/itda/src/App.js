import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import Nav from './components/nav';
import React, { useState, useEffect } from 'react';

// page 요소
import Home from './pages/home'; 
import Profile from './pages/profile';
import Project from './pages/project';
import Login from './pages/login';
import SignupAgreement from './pages/signup/signupAgreement';
import SignupForm from './pages/signup/signupForm';
import SignupVerification from './pages/signup/signupVerification';
import SignupComplete from './pages/signup/signupComplete';
import ProjectDetail from './pages/projectDetail';
import ProjectForm from './pages/projectCreate/projectForm';
import ProjectInvite from './pages/projectCreate/projectInvite';

// component 요소
import "./App.css";

function App() {
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [username, setUsername] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    setIsLoggedIn(!!token);

    if (token) {
      fetch("http://127.0.0.1:8008/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error("인증 실패");
          return res.json();
        })
        .then((data) => {
          setUsername(data.id);  
        })
        .catch((err) => {
          setIsLoggedIn(false);  
        });
    }
  }, []);


  const hideNav = location.pathname === "/login" | location.pathname === "/signupAgreement" | location.pathname === "/signupForm" | location.pathname === "/signupVerification" | location.pathname === "/signupComplete";

  return (
    <div className="App">
      {!hideNav && <Nav isLoggedIn={isLoggedIn}  username={username} />}
      <Routes>
        <Route path="/" element={<Navigate replace to="/home" />} />
        <Route path="/home" element={<Home />} />
        <Route path="/project" element={<Project />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} setUsername={setUsername} />} />
        <Route path="/signupAgreement" element={<SignupAgreement />} />
        <Route path="/signupForm" element={<SignupForm />} />
        <Route path="/signupVerification" element={<SignupVerification />} />
        <Route path="/signupComplete" element={<SignupComplete />} />
        <Route path="/projectDetail" element={<ProjectDetail />} />
        <Route path="/projectForm" element={<ProjectForm />} />
        <Route path="/projectInvite" element={<ProjectInvite />} />
      </Routes>
    </div>
  );
}

export default App;
