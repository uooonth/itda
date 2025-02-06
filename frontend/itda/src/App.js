import React from 'react';
import { Route, Routes, useLocation } from "react-router-dom";
import Nav from './components/nav';

// page 요소
import Home from './pages/home'; 
import Profile from './pages/profile';
import Calendar from './pages/calendar';

// component 요소
import "./App.css";

function App() {
  const location = useLocation();
  const isLoggedIn = true; 
  const username = "어금지님"; 

  return (
    <div className="App">
      {location.pathname !== '/' && <Nav username={username} isLoggedIn={isLoggedIn} />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/calendar" element={<Calendar />} />
      </Routes>
    </div>
  );
}

export default App;
