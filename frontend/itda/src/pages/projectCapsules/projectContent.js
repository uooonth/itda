import React,{useState} from 'react';

/* 지수야 여기 js에다 피드백 팝업 컴포넌트 넣으면돼 */
import FeedbackPopup from './popups/feedback';


/* css */
/* 지수야 이 파일에다 너 팝업 css넣으면돼 */
import '../../css/feedbackpopup.css';

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










    return (
        <div className="content">
            <div className="contentTitle">침착맨 유튜브  편집팀</div>
            <div className="projectContent">
                <div className="gonji  box1">
                    <div className="gonjiIcon">ㅇ</div>
                    <div className="gonjiText">곤지</div>
                    <div className="gonjiEdit">ㅇ</div>
                </div>
                <div className="calendar box1">
                    <div className="calendarTop">
                        <div className="date">2024년 06월</div>
                        <div className="moveBtn right">{'>'}</div>
                        <div className="moveBtn left">{'<'}</div>
                    </div>
                    <div className="calendarMid">
                        <div className="day">일요일</div>
                        <div className="day">월요일</div>
                        <div className="day">화요일</div>
                        <div className="day">수요일</div>
                        <div className="day">목요일</div>
                        <div className="day">금요일</div>
                        <div className="day">토요일</div>
                    </div>
                    <div className="calendarBot">
                        <div className="day">1</div>
                        <div className="day">2</div>
                        <div className="day">3</div>
                        <div className="day">4</div>
                        <div className="day">5</div>
                        <div className="day">6</div>
                        <div className="day">7</div>
                    </div>
                    <div className="calendarTodayDot">o</div>
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
                <div className="timeLine box1">
                    <div className="title">타임라인</div>
                    <div className="content">
                        <div className="index">
                            <div className="title">할 일</div>
                            <div className="title">6월 1주차</div>
                            <div className="title">6월 2주차</div>
                            <div className="title">6월 3주차</div>
                            <div className="title">6월 4주차</div>
                        </div>
                        <div className="object">
                            <div className="name">서지혜</div>
                            <div className="todoLine">
                                <div className="todo">침투부 좋아요 누르기</div>
                            </div>
                            <div className="todoLine">
                                <div className="todo">침투부 좋아요 누르기</div>
                            </div>
                            <div className="todoLine">
                                <div className="todo">침투부 좋아요 누르기</div>
                            </div>
                        </div>
                        <div className="object">
                            <div className="name">서지혜</div>
                            <div className="todoLine">
                                <div className="todo">침투부 좋아요 누르기</div>
                            </div>
                            <div className="todoLine">
                                <div className="todo">침투부 좋아요 누르기</div>
                            </div>
                            <div className="todoLine">
                                <div className="todo">침투부 좋아요 누르기</div>
                            </div>
                        </div>
                        <div className="object">
                            <div className="name">서지혜</div>
                            <div className="todoLine">
                                <div className="todo">침투부 좋아요 누르기</div>
                            </div>
                            <div className="todoLine">
                                <div className="todo">침투부 좋아요 누르기</div>
                            </div>
                            <div className="todoLine">
                                <div className="todo">침투부 좋아요 누르기</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="todoList box1">
                    <div className="top">
                        <div className="title">할 일 목록</div>
                        <div className="more">더보기</div>
                    </div>
                    <div className="content">

                    </div>
                </div>
                <div className="liveChat box1">
                    <div className="title">실시간 채팅</div>
                    <div classNAme="content">
                        이거어케하냐
                    </div>
                </div>
                <div className="feedback box1">
                    <div className="top">
                        <div className="title">작업물 피드백</div>
                        <div className="more" onClick={handleMoreClick}>더보기</div>
                    </div>
                    <div className="content">
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