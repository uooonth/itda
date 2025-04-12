import React, { useState } from 'react';
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
function Navigation({ username, isLoggedIn }) {
  const location = useLocation();
    //팝업 끄고 켜기 상태
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showAlarmPopup, setShowAlarmPopup] = useState(false);
    //팝업 끄고 켜기  함수
  const toggleProfilePopup = () => setShowProfilePopup(!showProfilePopup);
  const toggleAlarmPopup = () => setShowAlarmPopup(!showAlarmPopup);

   
    //이모지
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [selectedEmoji, setSelectedEmoji] = useState({ emoji: '🥰' });
    
    function handleEmojiSelect(emojiObject) {
        setSelectedEmoji(emojiObject);
        setShowEmojiPicker(false); // 이모지 선택 후 선택 창 닫기
    }
    
  return (
    <div className="navigation">
      <div className="logo">itda</div>
      <div className="navLinks">
        <NavLink to="/" className={`navLink ${location.pathname === '/' ? 'active' : ''}`}>Home</NavLink>
        <NavLink to="/project" className={`navLink ${location.pathname === '/project' ? 'active' : ''}`}>Project</NavLink>
        <NavLink to="/profile" className={`navLink ${location.pathname === '/profile' ? 'active' : ''}`}>Profile</NavLink>
      </div>
      {isLoggedIn ? (
        <div className="userSection">
          <div className="userName">{username}님</div>
          <img src={smileIcon} alt="Smile" className="icon"  onClick={toggleProfilePopup} />
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
                  <img src={goProjectIcon} alt="goProject" className="icon"  />
                  </div>
              </div>
              <div className="divider"></div>
              <div className="logout">로그아웃</div>
            </div>
          )}
         {showAlarmPopup && (
            <div className="popup alarmPopup">
               <span className="close"><img src={closeIcon} alt="close" className="icon" onClick={toggleAlarmPopup} /></span>
               <div className="section">
                <span className="popupUserName userName">알림</span>
              </div>
              <div className="notification">
                <div className="toptext">
                <img src={paperIcon} alt="paper" className="icon" />
                <div className="title">프로젝트 알림</div>
                </div>
                  <div className="time">방금 전</div></div>
              <div className='bottomtext'>
              <div className="content-alam">‘침착맨 유튜브 편집팀‘ 프로젝트에 누군가 
              참여했습니다.</div>
              </div>
              <div className="divider"></div>
              <div className="notification">
                <div className="toptext">
                <img src={starIcon} alt=" star" className="icon" />
                <div className="title">프로젝트 알림</div>
                </div>
                <div className="time">방금 전</div></div>
                <div className='bottomtext'>
                <div className="content-alam">찜 목록에 있는 ‘ 침투부 썸네일 편집팀’의
                모집 마감 기한이 하루 남았습니다!</div>
                </div>
              <div className="divider"></div>
              <div className="notification">
                <div className="toptext">
                <img src={uploadIcon} alt="upload" className="icon" />
                  <div className="title">프로젝트 알림</div>
              </div>
              <div className="time">방금 전</div></div>
              <div className='bottomtext'>
              <div className="content-alam">‘침착맨 유튜브 편집팀‘에 서지혜씨가 파일을 올렸습니다.</div>
              </div>
              <div className="divider"></div>
              <div className="notification">
                <div className="toptext">
                <img src={chatIcon} alt="chat" className="icon" />
                <div className="title">프로젝트 알림</div>
                </div>
                <div className="time">방금 전</div></div>
                <div className='bottomtext'>
                <div className="content-alam">‘침착맨 유튜브 편집팀‘ 에 새로운 채팅이 있습니다.</div>
                </div>
              <div className="divider"></div>
              <div className="notification">
                <div className="toptext">
                <img src={timerIcon} alt="timer" className="icon" />
                <div className="title">프로젝트 알림</div>
                </div>
                <div className="time">방금 전</div></div>
                <div className='bottomtext'>
                  <div className="content-alam">‘침착맨 유튜브 편집팀‘ 의 ‘썸넬제작하기‘ 
                  마감기한이 10일 남았습니다.</div>
              </div>
              </div>
          )}
        </div>
      ) : (
        <div className="authSection">
          <span className="signUp">회원가입</span>
          <button className="loginButton">
            로그인
            <img src={loginIcon} alt="login" className="icon" />
            </button>
        </div>
      )}
    </div>
  );
}

export default Navigation;