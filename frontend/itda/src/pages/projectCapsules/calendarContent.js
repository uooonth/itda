import React, { useState } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/ko';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../../css/calendar.css';
import addEventIcon from '../../icons/addEventButton.png';
import axios from 'axios';

moment.locale('ko');
const localizer = momentLocalizer(moment);

const initialEvents = [
  {
    title: '디비 연결이 됐었는데요',
    start: new Date(2025, 3, 14, 10, 0),
    end: new Date(2025, 3, 15, 12, 0),
    color: '#3174ad',
  },
  {
    title: '안 됐습니다... 고치고 있어요 엉엉엉어엉엉',
    start: new Date(2025,3, 16, 14, 0),
    end: new Date(2025, 3, 17, 15, 0),
    color: '#ad4a31',
  },
];

const CalendarContent = () => {
  const [date, setDate] = useState(new Date(2025, 3));
  const [events, setEvents] = useState(initialEvents);
  const [showPopup, setShowPopup] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    start: '',
    end: '',
    color: '#3174ad',
  });

  const goToPrevMonth = () => {
    setDate(moment(date).subtract(1, 'month').toDate());
  };

  const goToNextMonth = () => {
    setDate(moment(date).add(1, 'month').toDate());
  };

  const handleAddEvent = async () => {
    const { title, start, end, color } = newEvent;
    if (!title || !start || !end) {
      alert('모든 항목을 입력해주세요.');
      return;
    }

    // DB 저장 요청
    try {
      await axios.post('http://localhost:8008/calendar', {
        text: title,
        start: start,
        end: end,
        owner: 'user_id', // 실제 사용자 ID로 교체 필요
        is_repeat: false,
        in_project: null,
      });
    } catch (err) {
      console.error('일정 저장 실패:', err);
    }

    // 로컬 상태 업데이트
    setEvents([
      ...events,
      {
        title,
        start: new Date(start),
        end: new Date(end),
        color,
      },
    ]);
    setShowPopup(false);
    setNewEvent({ title: '', start: '', end: '', color: '#3174ad' });
  };

  const formattedDate = moment(date).format('YYYY년 M월');

  const eventStyleGetter = (event) => {
    return {
      className: 'customEvent',
      style: {
        backgroundColor: event.color,
      },
    };
  };

  return (
    <div className="calendarPage">
      <img
        src={addEventIcon}
        alt="+"
        className="addEventButton"
        onClick={() => setShowPopup(true)}
      />
      <div className="calendarContainer">
        <div className="calendarHeader">
          <button onClick={goToPrevMonth} className="arrowButton">
            ◀
          </button>
          <span className="calendarTitle">{formattedDate}</span>
          <button onClick={goToNextMonth} className="arrowButton">
            ▶
          </button>
        </div>
        <Calendar
          localizer={localizer}
          events={events}
          date={date}
          view={Views.MONTH}
          toolbar={false}
          startAccessor="start"
          endAccessor="end"
          style={{ flex: 1 }}
          eventPropGetter={eventStyleGetter}
        />

        {showPopup && (
          <div className="popupOverlay">
            <div className="popup">
              <div className="popupTitle">일정 추가</div>
              <div className="popupDivider" />
              <div className="datetimeRow">
                <div className="datetimeInputWrapper">
                  <label htmlFor="start-date" className="datetimeLabel">시작 날짜</label>
                  <input
                    id="start-date"
                    type="datetime-local"
                    value={newEvent.start}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, start: e.target.value })
                    }
                  />
                </div>
                <div className="datetimeInputWrapper">
                  <label htmlFor="end-date" className="datetimeLabel">종료 날짜</label>
                  <input
                    id="end-date"
                    type="datetime-local"
                    value={newEvent.end}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, end: e.target.value })
                    }
                  />
                </div>
              </div>
              <label htmlFor="event-title" className="label">내용</label>
              <input
                type="text"
                placeholder="내용"
                value={newEvent.title}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, title: e.target.value })
                }
              />
              <label>색상</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="color"
                  value={newEvent.color}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, color: e.target.value })
                  }
                />
                <span style={{ fontFamily: 'Pretendard-Regular', fontSize: '0.9rem' }}>
                  {newEvent.color}
                </span>
              </div>
              <div className="popupButtons">
                <button className='addBtn' onClick={handleAddEvent}>추가</button>
                <button className="closeBtn" onClick={() => setShowPopup(false)}>X</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarContent;
