import React, { useState, useEffect } from 'react';
import '../css/nav.css';
import { NavLink, useLocation,useNavigate  } from 'react-router-dom'; 
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

    // 유저 아이디
  const [userProfile, setUserProfile] = useState(null);
  function handleEmojiSelect(emojiObject) {
      setSelectedEmoji(emojiObject);
      setShowEmojiPicker(false); // 이모지 선택 후 선택 창 닫기
  }

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

    /*-------------------------------------------------------------*/
    /*-----------------------     스마일팝     ---------------------*/
    /*-------------------------------------------------------------*/
    const [userProjects, setUserProjects] = useState([]);
    const [loadingProjects, setLoadingProjects] = useState(false);

    const navigate = useNavigate();
    // 프로젝트로 이동하는 함수
    const goToProject = (projectId) => {
      navigate(`/project/${projectId}`);
      setShowProfilePopup(false); // 팝업 닫기
    };

    // 사용자 프로필과 프로젝트 데이터 가져오기
    useEffect(() => {
        const fetchAllData = async () => {
            if (!username) return;
            
            try {
                setLoadingProjects(true);
                
                // 사용자 프로필 정보 가져오기
                const [usersResponse, projectsResponse] = await Promise.all([
                    fetch(`http://localhost:8008/getUsers`),
                    fetch(`http://localhost:8008/users/${username}/projects`) // 사용자의 프로젝트 목록
                ]);

                const usersData = await usersResponse.json();
                const filteringData = usersData.find(userData => userData.id === username);
                
                if (filteringData) {
                    setUserProfile(filteringData);
                } else {
                    console.error('user filtering fail');
                    setUserProfile(null);
                }

                // 프로젝트 데이터 처리
                if (projectsResponse.ok) {
                    const projectsData = await projectsResponse.json();
                    setUserProjects(projectsData);
                } else {
                    console.error('프로젝트 데이터 가져오기 실패');
                    setUserProjects([]);
                }

            } catch (error) {
                console.error('데이터 패치 실패:', error);
                setUserProjects([]);
            } finally {
                setLoadingProjects(false);
            }
        };

        fetchAllData();
    }, [username]);
    console.log("userProjects", userProjects);
    console.log("userProfile", userProfile);
    console.log("loadingProjects", loadingProjects);

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
                <div className="userName">{userProfile?.name}님</div>
                <img src={smileIcon} alt="Smile" className="icon" onClick={toggleProfilePopup} />
                <img src={bellIcon} alt="Bell" className="icon" onClick={toggleAlarmPopup} />
                
                {showProfilePopup && (
                    <div className="popup profilePopup">
                        <span className="close">
                            <img src={closeIcon} alt="close" className="icon" onClick={toggleProfilePopup} />
                        </span>

                        <div className="section">
                            <span className="popupUserName userName" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                                {userProfile?.name}님 {selectedEmoji.emoji}
                            </span>
                            {showEmojiPicker && <Picker onEmojiClick={handleEmojiSelect} />}
                        </div>
                        
                        <div className="section">
                            <div className="content-nav">
                                <span className="email">
                                    {userProfile?.email || 'email@example.com'}
                                </span>
                                <span className="profileSettings">설정</span>
                            </div>
                        </div>
                        
                        <div className="divider"></div>
                        
                        <div className="section">
                            <div className="title">참여중인 프로젝트</div>
                            {loadingProjects ? (
                                <div className="content">
                                    <span style={{ color: '#999', fontSize: '14px' }}>로딩 중...</span>
                                </div>
                            ) : userProjects.length > 0 ? (
                                <div className="projects-list">
                                    {userProjects.map((project, index) => (
                                        <div key={project.id || index} className="content" style={{ 
                                            marginBottom: '8px',
                                            cursor: 'pointer',
                                            padding: '4px 0',
                                            borderRadius: '4px',
                                            transition: 'background-color 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                        onClick={() => goToProject(project.project.project.id)}
                                        >
                                            <span style={{ flex: 1 }}>
                                                {project.project.project.name || '프로젝트 이름 없음'}
                                            </span>
                                            <img src={goProjectIcon} alt="goProject" className="icon" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="content">
                                    <span style={{ color: '#999', fontSize: '14px' }}>
                                        참여 중인 프로젝트가 없습니다
                                    </span>
                                </div>
                            )}
                        </div>
                        
                        <div className="divider"></div>
                        <div className="logout" onClick={handleLogout}>로그아웃</div>
                    </div>
                )}

                {/* 알림 팝업은 기존 코드 그대로 유지 */}
                {showAlarmPopup && (
                    <div className="popup alarmPopup">
                        {/* 기존 알림 팝업 코드 */}
                    </div>
                )}
            </div>
        ) : (
            <div className="authSection">
                <NavLink to="/signupAgreement" className="signUp">
                    회원가입
                </NavLink>
                <NavLink to="/login" className="navLink">
                    <button className="loginButton">
                        로그인
                        <img src={loginIcon} alt="login" className="icon" />
                    </button>
                </NavLink>
            </div>
        )}
    </div>
);
}

export default Navigation;
