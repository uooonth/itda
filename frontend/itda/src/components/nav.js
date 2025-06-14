import React, { useState, useEffect } from 'react';
import '../css/nav.css';
import { NavLink, useLocation } from 'react-router-dom';
import smileIcon from '../icons/smile.svg';
import bellIcon from '../icons/bell.svg';
import loginIcon from '../icons/login.svg';
import goProjectIcon from '../icons/goProject.svg';
import closeIcon from '../icons/close.svg';
import alarmIcon from '../icons/alarm.svg';
import chatIcon from '../icons/chat.svg';
import paperIcon from '../icons/paper.svg';
import starIcon from '../icons/star.svg';
import uploadIcon from '../icons/upload.svg';
import timerIcon from '../icons/timer.svg';
import Picker from 'emoji-picker-react';

function Navigation({ isLoggedIn, username }) {
  const location = useLocation();

  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showAlarmPopup, setShowAlarmPopup] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState({ emoji: '🥰' });

  const [notifications, setNotifications] = useState([]);

  const toggleProfilePopup = () => setShowProfilePopup(!showProfilePopup);
  const toggleAlarmPopup = () => setShowAlarmPopup(!showAlarmPopup);
  const handleEmojiSelect = (emojiObject) => {
    setSelectedEmoji(emojiObject);
    setShowEmojiPicker(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    window.location.href = "/";
  };

  // 🔥 실시간 WebSocket 알림 추가
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8008/ws/livechat/notification");

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      let notification;

      if (msg.type === "join") {
        notification = {
          id: Date.now(),
          type: "join",
          time: new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          projectName: msg.project_name,
          joinedUser: msg.joined_user
        };
      } else if (msg.type === "chat") {
        notification = {
          id: Date.now(),
          type: "chat",
          time: new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          projectName: msg.project_name
        };
      } else if (msg.type === "upload") {
        notification = {
          id: Date.now(),
          type: "upload",
          time: new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          fileName: msg.file_name,
          projectName: msg.project_name,
          uploader: msg.uploader
        };
      }

      setNotifications(prev => [notification, ...prev]);
    };


    ws.onclose = () => console.log("WebSocket closed");
    return () => ws.close();
  }, []);

    useEffect(() => {
    const ws = new WebSocket("ws://localhost:8008/ws/livechat/notification");

    ws.onopen = () => console.log("✅ WebSocket 연결 성공");
    ws.onerror = (error) => console.error("❌ WebSocket 오류:", error);
    ws.onclose = () => console.log("❌ WebSocket 연결 종료");

    ws.onmessage = (event) => {
      console.log("📦 수신된 원본 메시지:", event.data);
      try {
        const msg = JSON.parse(event.data);
        console.log("🧪 파싱 성공 메시지:", msg);
      } catch (e) {
        console.error("💥 JSON 파싱 실패:", e);
      }
    };

    return () => ws.close();
  }, []);

  useEffect(() => {
      const ws = new WebSocket("ws://127.0.0.1:8008/ws/livechat/notification");

      ws.onopen = () => console.log("✅ WebSocket 연결 성공");
      ws.onerror = (error) => console.error("❌ WebSocket 에러:", error);
      ws.onclose = () => console.log("❌ WebSocket 닫힘");
      
      return () => ws.close();
  }, []);


  return (
    <div className="navigation">
      <div className="logo">itda</div>
      <div className="navLinks">
        <NavLink to="/home" className={`navLink ${location.pathname === '/home' ? 'active' : ''}`}>Home</NavLink>
        <NavLink to="/project" className={`navLink ${location.pathname === '/project' ? 'active' : ''}`}>Project</NavLink>
        <NavLink to="/profile" className={`navLink ${location.pathname === '/profile' ? 'active' : ''}`}>Profile</NavLink>
      </div>

      {isLoggedIn ? (
        <div className="userSection">
          <div className="userName">{username}님</div>
          <img src={smileIcon} alt="Smile" className="icon" onClick={toggleProfilePopup} />
          <img src={bellIcon} alt="Bell" className="icon" onClick={toggleAlarmPopup} />

          {showProfilePopup && (
            <div className="popup profilePopup">
              <span className="close"><img src={closeIcon} alt="close" className="icon" onClick={toggleProfilePopup} /></span>
              <div className="section">
                <span className="popupUserName userName" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                  {username}님 {selectedEmoji.emoji}
                </span>
                {showEmojiPicker && <Picker onEmojiClick={handleEmojiSelect} />}
              </div>
              <div className="section">
                <div className="content-nav">
                  <span className="email">email@example.com</span>
                  <span className="profileSettings">설정</span>
                </div>
              </div>
              <div className="divider"></div>
              <div className="section">
                <div className="title">참여중인 프로젝트</div>
                <div className="content">
                  <span>침착맨 유튜브편집팀</span>
                  <img src={goProjectIcon} alt="goProject" className="icon" />
                </div>
              </div>
              <div className="divider"></div>
              <div className="logout" onClick={handleLogout}>로그아웃</div>
            </div>
          )}

          {showAlarmPopup && (
            <div className="popup alarmPopup">
              <span className="close"><img src={closeIcon} alt="close" className="icon" onClick={toggleAlarmPopup} /></span>
              <div className="section">
                <span className="popupUserName userName">알림</span>
              </div>

              {/* 실시간 알림 먼저 출력 */}
              {notifications.map((notif) => (
                <div key={notif.id} className="notification">
                  <div className="toptext">
                    <img
                      src={notif.type === "join" ? paperIcon : notif.type === "upload" ? uploadIcon : chatIcon}
                      alt="icon"
                      className="icon"
                    />
                    <div className="title">프로젝트 알림</div>
                  </div>
                  <div className="time">{notif.time}</div>
                  <div className='bottomtext'>
                    <div className="content-alam">
                      {notif.type === "join" && `‘${notif.projectName}’ 프로젝트에 ${notif.joinedUser}님이 참여했습니다.`}
                      {notif.type === "upload" && `‘${notif.projectName}’에 ${notif.uploader}님이 파일을 올렸습니다.`}
                      {notif.type === "chat" && `‘${notif.projectName}’에 새로운 채팅이 있습니다.`}
                    </div>
                  </div>
                  <div className="divider"></div>
                </div>
              ))}

              {/* 기존 고정 알림 */}
              <div className="notification">
                <div className="toptext">
                  <img src={paperIcon} alt="paper" className="icon" />
                  <div className="title">프로젝트 알림</div>
                </div>
                <div className="time">방금 전</div>
              </div>
              <div className='bottomtext'>
                <div className="content-alam">‘침착맨 유튜브 편집팀‘ 프로젝트에 누군가 참여했습니다.</div>
              </div>
              <div className="divider"></div>
              {/* 나머지 기존 알림 생략 (스타, 업로드 등등) */}
            </div>
          )}
        </div>
      ) : (
        <div className="authSection">
          <NavLink to="/signupAgreement" className="signUp">회원가입</NavLink>
          <NavLink to="/login" className="navLink">
            <button className="loginButton">
              로그인 <img src={loginIcon} alt="login" className="icon" />
            </button>
          </NavLink>
        </div>
      )}
    </div>
  );
}

export default Navigation;
