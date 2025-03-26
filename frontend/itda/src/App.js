import React from 'react';
import { Route, Routes, useLocation } from "react-router-dom";
import Nav from './components/nav';

// page 요소
import Home from './pages/home'; 
import Profile from './pages/profile';
import Project from './pages/project';

// component 요소
import "./App.css";

function App() {
  const location = useLocation();
  const isLoggedIn = true; 
  const username = "어금지"; 

  return (
    <div className="App">
      {location.pathname !== '/home' && <Nav username={username} isLoggedIn={isLoggedIn} />}
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/project" element={<Project />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </div>
  );
}

export default App;
