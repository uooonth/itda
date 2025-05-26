import React, { useState, useEffect } from 'react';
import '../css/project.css';
import { useLocation } from 'react-router-dom';


/* 메뉴별 컴포넌트  */
import HomeContent from './projectCapsules/homeContent';
import ProjectContent from './projectCapsules/projectContent';
import ChatContent from './projectCapsules/chatContent';
import CalendarContent from './projectCapsules/calendarContent';

/* 아이콘,이미지 */
import calendar from '../icons/calendar.svg';
import home from '../icons/home.svg';
import project from '../icons/project.svg';
import chat from '../icons/chat_project.svg';


function Project({ isLoggedIn,username }) {
    console.log("Project", username);
    const location = useLocation();
    //페이지 토글 상태
    const [show_Home, setShowHome] = useState(true);
    const [show_project, setShowProject] = useState(false);
    const [show_chat, setShowChat] = useState(false);
    const [show_calendar, setShowCalendar] = useState(false);
    const [activeTab, setActiveTab] = useState('home');
    const [barPosition, setBarPosition] = useState(0);




    useEffect(() => {
        const tabElement = document.querySelector(`.tab-${activeTab}`);
        if (tabElement) {
            setBarPosition(tabElement.offsetTop);
        }
    }, [activeTab]);


    //뒤에 id 붙어도 project으로 인식
    useEffect(() => {
        if (location.pathname.startsWith('/project/')) {
            toggleTab('project');
        }
    }, [location.pathname]);

    //페이지 토글 함수
    const toggleTab = (tab) => {
        setShowHome(tab === 'home');
        setShowProject(tab === 'project');
        setShowChat(tab === 'chat');
        setShowCalendar(tab === 'calendar');
        setActiveTab(tab);

        document.querySelectorAll('.tab').forEach(el => el.classList.remove('active_tab'));
        document.querySelector(`.tab-${tab}`).classList.add('active_tab');
    };

    return (
        <div className="project">
            <div className="leftNavBar">
                <div className="active-bar" style={{ top: barPosition }}></div>
                <div className='tabs'>
                    <div className='tab tab-home active_tab' onClick={() => toggleTab('home')}>
                        <div className='icon'><img src={home} alt="Home" className="icon" /></div>
                        <div className='title'>대시보드</div>
                    </div>
                    <div className='tab tab-project' onClick={() => toggleTab('project')}>
                        <div className='icon'><img src={project} alt="project" className="icon" /></div>
                        <div className='title'>프로젝트</div>
                    </div>
                    <div className='tab tab-chat' onClick={() => toggleTab('chat')}>
                        <div className='icon'><img src={chat} alt="chat" className="icon" /></div>
                        <div className='title'>개인채팅</div>
                    </div>
                    <div className='tab tab-calendar' onClick={() => toggleTab('calendar')}>
                        <div className='icon'><img src={calendar} alt="calendar" className="icon" /></div>
                        <div className='title'>캘린더</div>
                    </div>
                </div>
            </div>
            <div className="rightContent">
                 {show_Home && <HomeContent username={username} />} {/* => HomeContent 파일*/}
                 {show_project && <ProjectContent />} {/* => ProjectContent 파일*/}
                 {show_chat && <ChatContent />} {/*=>ChatContent 파일*/}
                 {show_calendar && <CalendarContent />} {/* => CalendarContent 파일*/}
            </div>
        </div>
    );
}

export default Project;