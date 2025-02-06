import React, { useState } from 'react';
import '../css/nav.css';
import { useLocation } from 'react-router-dom'; 

function Nav({ username, isLoggedIn }) {
  const location = useLocation();
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);

  const toggleProfilePopup = () => setShowProfilePopup(!showProfilePopup);
  const toggleNotificationPopup = () => setShowNotificationPopup(!showNotificationPopup);

  return (
    <div className="Nav">
      <div className="logo">itda</div>
      <div className="nav-links">
        <span className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Home</span>
        <span className={`nav-link ${location.pathname === '/project' ? 'active' : ''}`}>Project</span>
        <span className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}>Profile</span>
      </div>
      {isLoggedIn ? (
        <div className="user-section">
          <span className="username">{username}</span>
          <span className="icon" onClick={toggleProfilePopup}>😊</span>
          <span className="icon" onClick={toggleNotificationPopup}>🔔</span>
          {showProfilePopup && (
            <div className="popup profile-popup">
              <span className="close" onClick={toggleProfilePopup}>X</span>
              <div>Profile Popup Content</div>
            </div>
          )}
          {showNotificationPopup && (
            <div className="popup notification-popup">
              <span className="close" onClick={toggleNotificationPopup}>X</span>
              <div>Notification Popup Content</div>
            </div>
          )}
        </div>
      ) : (
        <div className="auth-section">
          <span className="signup">회원가입</span>
          <button className="login-button">
            로그인
            <span className="login-icon">🔑</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default Nav;