import React,{useState,useEffect } from 'react';
import Picker from 'emoji-picker-react';
import Edit from '../../icons/edit.svg';
import leftBtn from '../../icons/left.svg';
import rightBtn from '../../icons/righ.svg';
import FeedbackPopup from './popups/feedback';
/* css */
/* 지수야 이 파일에다 너 팝업 css넣으면돼 */
import '../../css/feedbackpopup.css';



import '../../lib/Timeline.scss'
import Timeline from 'react-calendar-timeline'
import moment from 'moment'




const ProjectContent = () => {

    //팝업 상태
    const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);
    //팝업 함수 열고 닫기
    const handleMoreClick = () => {
        setShowFeedbackPopup(true);
    };
    const handleClosePopup = () => {
        setShowFeedbackPopup(false);
    };


    //이모지
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [selectedEmoji, setSelectedEmoji] = useState({ emoji: '🚩' });
    
    function handleEmojiSelect(emojiObject) {
        setSelectedEmoji(emojiObject);
        setShowEmojiPicker(false); 
    }    
    
    
    const today = new Date();


    const currentLastDaysOfYearArr = getLastDaysOfYear(today.getFullYear());
    function getLastDaysOfYear(year) {
        return Array.from({ length: 12 }, (_, month) => {
            return new Date(year, month + 1, 0).getDate();
        });
    }





    //===================================================================== //
    // ------------------------      캘린더         ------------------------//
    //===================================================================== // 
   
    const [currentWeek,setCurrentWeek] = useState(getCurrentWeek());
    const [currentMonth,setCurrentMonth] = useState(getCurrentMonth());
    const currentYear = today.getFullYear();
    //달이 바뀌어야하는 상태인가?
    let nextMonthStart =false

    function getCurrentWeek() {
        const today = new Date();
        const currentMonth = today.getMonth();
        const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        const week = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(firstDayOfWeek);
            date.setDate(firstDayOfWeek.getDate() + i);
            if (date.getDate() > currentLastDaysOfYearArr[currentMonth]) {
                date.setDate(1);
            }
            week.push(date instanceof Date ? date : null); // `_` 대신 null을 사용
        }
        return week;
    }
    
    
    
    function getCurrentMonth() {
        const todays = new Date();
        return todays.getMonth();
    }
    function getLastDate(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }
// 왼쪽 버튼 클릭 시
    const handleLeftWeek = () => {
        const newWeek = [];
        let tempCounting = currentWeek[0] instanceof Date ? currentWeek[0].getDate() : 0; // 현재 주 첫 날짜
        let prevMonthLastDate = getLastDate(currentWeek[0].getFullYear(), currentWeek[0].getMonth() - 1); // 이전 달의 마지막 날짜

        for (let i = 0; i < 7; i++) {
            if (currentWeek[i] !== '_' && currentWeek[i] instanceof Date) {
                const prevDate = currentWeek[i].getDate() - 7; // 7일씩 빼기
                const prevDateObj = new Date(currentWeek[i].getFullYear(), currentWeek[i].getMonth(), prevDate);

                // 날짜가 월의 첫 번째 날짜보다 작을 경우, 이전 달의 마지막 날짜로 처리
                if (prevDate < 1) {
                    newWeek.unshift(prevDateObj);
                } else {
                    newWeek.push(prevDateObj);
                }
            } else if (currentWeek[i] === '_') {
                const prevDate = prevMonthLastDate - (7 - i);
                if (prevDate < 1) {
                    prevMonthLastDate--;
                    newWeek.unshift('_');
                } else {
                    const prevMonthDate = new Date(currentWeek[0].getFullYear(), currentWeek[0].getMonth(), prevDate);
                    newWeek.unshift(prevMonthDate);
                    prevMonthLastDate--;
                }
            }
        }
        setCurrentWeek(newWeek);
    };
    
    
    const handleRightWeek = () => {
        let tempCounting = currentWeek[6] instanceof Date ? currentWeek[6].getDate() : 0; // 현재 주 마지막 날짜
        let nextMonthStart = false;
    
        const newWeek = [];
    
        // 현재 주의 날짜를 다음 주로 계산
        for (let i = 0; i < 7; i++) {
            if (currentWeek[i] !== '_' && currentWeek[i] instanceof Date) {
                const lastDate = currentWeek[i].getDate() + 7; // 7일씩 더하기
    
                const lastDayOfMonth = getLastDate(currentWeek[i].getFullYear(), currentWeek[i].getMonth());
    
                if (lastDate <= lastDayOfMonth) {
                    newWeek.push(new Date(currentWeek[i].setDate(lastDate)));
                } else {
                    // 다음 달로 넘어가면 _로 처리
                    newWeek.push('_');
                    nextMonthStart = true;
                }
            }
            // _일 때, 새로운 주의 첫날이 시작하는 경우
            else if (currentWeek[i] === '_' && nextMonthStart) {
                const nextMonthFirstDay = new Date(
                    currentWeek[0] instanceof Date ? currentWeek[0].getFullYear() : today.getFullYear(),
                    currentMonth + 1,
                    tempCounting + 1
                );
                newWeek.push(nextMonthFirstDay);
                tempCounting++; // 날짜 증가
            }
            // _인데 달이 바뀌지 않는 경우
            else if (currentWeek[i] === '_' && !nextMonthStart) {
                const nextMonthFirstDay = new Date(
                    currentWeek[0] instanceof Date ? currentWeek[0].getFullYear() : today.getFullYear(),
                    currentMonth,
                    tempCounting + 1
                );
                newWeek.push(nextMonthFirstDay);
                tempCounting++; // 날짜 증가
            }
        }
    
        // 첫 번째 날짜로 월 업데이트
        if (newWeek[0] !== '_') {
            setCurrentMonth(newWeek[0].getMonth());
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    
        setCurrentWeek(newWeek);
    };
    
    //===================================================================== //
    // ------------------------       타임라인       ------------------------//
    //===================================================================== // 
    const groups = [{ id: 1, title: '서지혜' }, { id: 2, title: '황윤성' }, { id: 3, title: '박지수' }]

    const items = [
        {
          id: 1,
          group: 1,
          title: '침투부 유튜브 편집',
          start_time: moment(),
          end_time: moment().add(1, 'hour')
        },
        {
          id: 2,
          group: 2,
          title: '어금지의 비밀폴더 생성',
          start_time: moment().add(-0.5, 'hour'),
          end_time: moment().add(0.5, 'hour')
        },
        {
          id: 3,
          group: 1,
          title: '바락바락하우스에서 바락바락하기',
          start_time: moment().add(2, 'hour'),
          end_time: moment().add(3, 'hour')
        }
      ]





    return (
        <div className="content">
            <div className="contentTitle">침착맨 유튜브  편집팀</div>
            <div className="projectContent">
                <div className="gonji  box1">
                    <div className="gonjiIcon" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                      {selectedEmoji.emoji}
                    </div>
                    {showEmojiPicker && <Picker onEmojiClick={handleEmojiSelect} />}

                    <div className="gonjiText">허허 다들 화이팅 합시다잉</div>
                    <div className="gonjiEdit"><img src={Edit} alt="edit"/></div>
                </div>
                <div className="calendar box1">
                    <div className="calendarTop">
                    <div className="date">{currentMonth+1}월</div>
                        <div className="temp">
                            <div className="moveBtn left" onClick={handleLeftWeek}><img src={leftBtn} alt="leftBtn" /></div>
                            <div className="moveBtn right" onClick={handleRightWeek}><img src={rightBtn} alt="rightBtn" /></div>
                        </div>
                    </div>
                    <div className="calendarMid">
                        {['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'].map((day, index) => (
                            <div
                                key={index}
                                className={`day ${
                                    currentWeek[index] instanceof Date && currentWeek[index].toDateString() === today.toDateString() 
                                        ? 'activeCal' 
                                        : ''
                                }`}
                            >
                                {day}
                            </div>
                        ))}
                    </div>
                    <div className="calendarBot">
                        {currentWeek.map((date, index) => (
                            <div
                                key={index}
                                className={`day ${
                                    date instanceof Date && date.toDateString() === today.toDateString() 
                                        ? 'activeCal' 
                                        : ''
                                }`}
                            >
                                {date !== '_' ? date.getDate() : ''}
                                {date !== '_' && date.toDateString() === today.toDateString() && <div className="calendarTodayDot">●</div>}
                            </div>
                        ))}
                    </div>

                </div>
                <div className="todoStatus box1">
                    <div className="object">
                        <div className="objectCount">3</div>
                        <div className="objectTitle">진행중</div>
                    </div>
                    <div className="object">
                        <div className="objectCount">3</div>
                        <div className="objectTitle">완료</div>
                    </div>
                    <div className="object">
                        <div className="objectCount">3</div>
                        <div className="objectTitle">시작 전</div>
                    </div>
                    <div className="object">
                        <div className="objectCount">3</div>
                        <div className="objectTitle">전체 할 일</div>
                    </div>
                </div>
                <div className="timeLine ">
                    <div className="title">타임라인</div>
                    <div>
                        <Timeline
                        groups={groups}
                        items={items}
                        defaultTimeStart={moment().add(-12, 'hour')}
                        defaultTimeEnd={moment().add(12, 'hour')}
                        />
                    </div>
                    <div className="contentt box1">

                        {/* <div className="index">
                            <div className="title name">이름</div>
                            <div className="title top">6월 1주차</div>
                            <div className="title top">6월 2주차</div>
                            <div className="title top">6월 3주차</div>
                            <div className="title top">6월 4주차</div>
                        </div>
                        <div className="object">
                            <div className="name">서지혜</div>
                            <div className="todoLine">
                                <div className="todo">침투부 좋아요 누르기</div>
                                <div className="todo">침투부 좋아요 누르기</div>
                                <div className="todo">침투부 좋아요 누르기</div>
                            </div>
                        </div>
                        <div className="object">
                            <div className="name">서지혜</div>
                            <div className="todoLine">
                                <div className="todo">침투부 좋아요 누르기</div>
                                <div className="todo">침투부 좋아요 누르기</div>
                                <div className="todo">침투부 좋아요 누르기</div>
                            </div>
                        </div>
                        <div className="object">
                            <div className="name">서지혜</div>
                            <div className="todoLine">
                                <div className="todo">침투부 좋아요 누르기</div>
                                <div className="todo">침투부 좋아요 누르기</div>
                                <div className="todo">침투부 좋아요 누르기</div>
                            </div>
                        </div>  */}
                    </div>
                </div>
                <div className="todoList">
                    <div className="top">
                        <div className="title">할 일 목록</div>
                        <div className="more">더보기</div>
                    </div>
                    <div className="content box1">
                            암거나ㅓㄴㅎ끼암거나ㅓㄴㅎ끼암거나ㅓㄴㅎ끼
                            암거나ㅓㄴㅎ끼
                            암거나ㅓㄴㅎ끼
                            ㅍ
                    </div>
                </div>
                <div className="liveChat">
                    <div className="title">실시간 채팅</div>
                    <div className="content box1">
                        이거어케하냐
                    </div>
                </div>
                <div className="feedback">
                    <div className="top">
                        <div className="title">작업물 피드백</div>
                        <div className="more" onClick={handleMoreClick}>더보기</div>
                    </div>
                    <div className="content box1">
                        <div className="object">
                            <div className="date">2024.05.12</div>
                            <div className="icon">앙</div>
                            <div className="name">어금지의 비밀폴더</div>
                        </div>
                    </div>
                </div>
            </div>

            
            {showFeedbackPopup && <FeedbackPopup onClose={handleClosePopup} />}

        </div>
    );
};

export default ProjectContent;