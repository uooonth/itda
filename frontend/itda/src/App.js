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
      // 로그인된 경우 유저 이름 가져오기
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
          setUsername(data.username);  
        })
        .catch((err) => {
          console.error("유저 정보 요청 실패:", err);
          setIsLoggedIn(false);  // 토큰은 있는데 인증 실패했을 경우
        });
    }
  }, []);


  const hideNav = location.pathname === "/login" | location.pathname === "/signupAgreement" | location.pathname === "/signupForm" | location.pathname === "/signupVerification" | location.pathname === "/signupComplete";

  return (
    <div className="App">
      {!hideNav && <Nav username={username} isLoggedIn={isLoggedIn} />}
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
      </Routes>
    </div>
  );
}

export default App;
