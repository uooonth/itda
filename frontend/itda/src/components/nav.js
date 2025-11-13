import React, { useState, useEffect, useRef } from 'react';
import '../css/nav.css';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
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
  const [notifications, setNotifications] = useState([]);
  const wsAlarmRef = useRef(null);

  function handleEmojiSelect(emojiObject) {
    setSelectedEmoji(emojiObject);
    setShowEmojiPicker(false); // 이모지 선택 후 선택 창 닫기
  }
  const toggleProfilePopup = () => setShowProfilePopup(!showProfilePopup);
  const toggleAlarmPopup = () => setShowAlarmPopup(!showAlarmPopup);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    window.location.href = "/";
  };

  // 찜 마감 남았다 알람
  useEffect(() => {
    const fetchPinnedProjects = async () => {
      if (!username) return;

      try {
        // 찜한 프로젝트 ID 리스트 가져오기
        const pinnedRes = await fetch(`http://localhost:8008/users/${username}/pinned-projects`);
        const pinnedData = await pinnedRes.json();
        const pinnedIds = pinnedData.pinned_projects;

        if (!pinnedIds || pinnedIds.length === 0) return;  // 찜한 프로젝트 없으면 종료

        // 전체 프로젝트 목록 가져오기
        const allProjectsRes = await fetch("http://localhost:8008/getProjects");
        const allProjectsData = await allProjectsRes.json();

        const today = new Date();

        // 하루 남은 프로젝트 필터링
        const upcomingDeadlineProjects = allProjectsData.filter(project => {
          const deadline = new Date(project.sign_deadline);
          const diffDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
          return pinnedIds.includes(project.project.id) && diffDays === 1;
        });

        // 알림 추가
        upcomingDeadlineProjects.forEach(project => {
          const notification = {
            id: Date.now() + Math.random(),
            type: "deadline",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: `찜 목록에 있는 ‘${project.project.name}’의 모집 마감 기한이 하루 남았습니다!`
          };
          setNotifications(prev => [notification, ...prev]);
        });


      } catch (err) {
        console.error("찜 프로젝트 알림 로드 실패", err);
      }
    };

    fetchPinnedProjects();
  }, [username]);


  // 파일 업로드 알림
  useEffect(() => {
    const fileWs = new WebSocket("ws://localhost:8008/ws/fileupload");

    fileWs.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      console.log("파일 알림 도착:", msg);

      let notification = {
        id: Date.now(),
        type: "upload",
        time: new Date(msg.time).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        }),
        projectName: msg.project_name,
        uploaderName: msg.uploader,
        fileName: msg.file_name,
        text: `프로젝트에 ${msg.uploader}님이 파일을 올렸습니다.` //${msg.project_name} 이거 써야하는데
      };

      setNotifications(prev => [notification, ...prev]);
    };

    fileWs.onclose = () => console.log("파일 WebSocket 종료");
    fileWs.onerror = (error) => console.error("파일 WebSocket 오류:", error);

    return () => {
      fileWs.close();
    };
  }, []);


  // 라이브챗 알림 WebSocket 연결
  useEffect(() => {
    // WebSocket 연결 설정
    const ws = new WebSocket("ws://localhost:8008/ws/livechat/notification");
    wsAlarmRef.current = ws;

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      console.log("알림 도착:", msg);

      let notification;

      if (msg.type === "chat") {
        notification = {
          id: Date.now(),
          type: "chat",
          time: new Date(msg.time).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          }),
          projectName: msg.project_name,
          senderName: msg.sender_name,
          text: `'${msg.project_name}' 에 새로운 채팅이 있습니다.`
        };
      }
      else if (msg.type === "upload") {
        notification = {
          id: Date.now(),
          type: "upload",
          time: new Date(msg.time).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          }),
          projectName: msg.project_name,
          uploaderName: msg.uploader,
          fileName: msg.file_name,
          text: `프로젝트에 ${msg.uploader}님이 작업물을 업로드했습니다.`
        };
      }

      if (notification) {
        setNotifications(prev => [notification, ...prev]);
      }
    };



    ws.onclose = () => console.log("알림 WebSocket 연결 종료");
    ws.onerror = (error) => console.error("알림 WebSocket 오류:", error);

    return () => {
      if (ws) ws.close();
    };
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

          {/* 알림 팝업 */}
          {showAlarmPopup && (
            <div className="popup alarmPopup">
              <span className="close">
                <img src={closeIcon} alt="close" className="icon" onClick={toggleAlarmPopup} />
              </span>
              <div className="section">
                <span className="popupUserName userName">알림</span>
              </div>

              {/* 알림 */}
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div className="notification">
                    <div className="toptext">
                      {notification.type === "chat" ? (
                        <img src={chatIcon} alt="chat" className="icon" />
                      ) : notification.type === "upload" ? (
                        <img src={uploadIcon} alt="upload" className="icon" />
                      ) : (
                        <img src={starIcon} alt="star" className="icon" />
                      )}
                      <div className="title">프로젝트 알림</div>
                    </div>
                    <div className="time">{notification.time}</div>
                  </div>
                  <div className='bottomtext'>
                    <div className="content-alam">{notification.text}</div>
                  </div>
                  <div className="divider"></div>
                </div>
              ))}

              {/* 알림이 없을 때 */}
              {notifications.length === 0 && (
                <div>
                  <div className="notification">
                    <div className="toptext">
                      <img src={alarmIcon} alt="alarm" className="icon" />
                      <div className="title">알림 없음</div>
                    </div>
                    <div className="time">-</div>
                  </div>
                  <div className='bottomtext'>
                    <div className="content-alam">새로운 알림이 없습니다.</div>
                  </div>
                  <div className="divider"></div>
                </div>
              )}
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
