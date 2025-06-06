import React, { useEffect, useState } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/ko';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../../css/calendar.css';
import addEventIcon from '../../icons/addEventButton.png';
import axios from 'axios';

moment.locale('ko');
const localizer = momentLocalizer(moment);

const CalendarContent = () => {
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    start: '',
    end: '',
    color: '#3174ad',
  });
  const [userId, setUserId] = useState(null);
  const [selectedEventIndex, setSelectedEventIndex] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      try {
        const response = await axios.get('http://localhost:8008/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserId(response.data.id);
      } catch (err) {
        console.error('사용자 정보 불러오기 실패:', err);
      }
    };

    fetchUserInfo();
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!userId) return;
      try {
        const res = await axios.get(`http://localhost:8008/calendar/${userId}`);
        const fetched = res.data.map((event) => ({
          title: event.text,
          start: new Date(event.start),
          end: new Date(event.end),
          color: event.color,
          created_at: event.created_at
        }));
        setEvents(fetched);
      } catch (err) {
        console.error('이벤트 불러오기 실패:', err);
      }
    };

    fetchEvents();
  }, [userId]);

  const handleSelectEvent = (event) => {
    const index = events.findIndex(e =>
      e.title === event.title &&
      e.start.getTime() === event.start.getTime() &&
      e.end.getTime() === event.end.getTime()
    );

    if (index !== -1) {
      setSelectedEventIndex(index);
      setNewEvent({
        title: event.title,
        start: moment(event.start).format("YYYY-MM-DDTHH:mm"),
        end: moment(event.end).format("YYYY-MM-DDTHH:mm"),
        color: event.color || '#3174ad',
        created_at: event.created_at
      });
      setIsEditMode(true);
      setShowPopup(true);
    }
  };

  const handleAddEvent = async () => {
    const { title, start, end, color } = newEvent;
    if (!title || !start || !end) {
      alert('모든 항목을 입력해주세요.');
      return;
    }
    if (!userId) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      await axios.post('http://localhost:8008/calendar', {
        text: title,
        start,
        end,
        user_id: userId,
        is_repeat: false,
        in_project: null,
        color,
      });
    } catch (err) {
      console.error('일정 저장 실패:', err);
    }

    setEvents([...events, { title, start: new Date(start), end: new Date(end), color }]);
    setShowPopup(false);
    setNewEvent({ title: '', start: '', end: '', color: '#3174ad' });
  };

  const handleUpdateEvent = async () => {
    if (!newEvent.title || !newEvent.start || !newEvent.end) {
      alert("모든 항목을 입력해주세요.");
      return;
    }

    const updated = [...events];
    updated[selectedEventIndex] = {
      title: newEvent.title,
      start: new Date(newEvent.start),
      end: new Date(newEvent.end),
      color: newEvent.color,
      created_at: newEvent.created_at
    };
    setEvents(updated);

    try {
      await axios.post('http://localhost:8008/calendar', {
        text: newEvent.title,
        start: newEvent.start,
        end: newEvent.end,
        user_id: userId,
        is_repeat: false,
        in_project: null,
        color: newEvent.color,
        created_at: newEvent.created_at
      });
    } catch (err) {
      console.error('일정 수정 실패:', err);
    }

    setShowPopup(false);
    setIsEditMode(false);
    setNewEvent({ title: '', start: '', end: '', color: '#3174ad' });
    setSelectedEventIndex(null);
  };

  const handleDeleteEvent = async () => {
    const originalEvent = events[selectedEventIndex];
    const createdAt = originalEvent.created_at;

    if (!createdAt || !userId) {
      alert("삭제할 정보를 찾을 수 없습니다.");
      return;
    }

    try {
      await axios.delete('http://localhost:8008/calendar', {
        data: {
          user_id: userId,
          created_at: originalEvent.created_at,
        },
      });
      const updatedEvents = [...events];
      updatedEvents.splice(selectedEventIndex, 1);
      setEvents(updatedEvents);
      setShowPopup(false);
      setSelectedEventIndex(null);
      setIsEditMode(false);
    } catch (err) {
      console.error("삭제 실패:", err);
    }
  };


  const formattedDate = moment(date).format('YYYY년 M월');

  const eventStyleGetter = (event) => ({
    className: 'customEvent',
    style: { backgroundColor: event.color },
  });

  return (
    <div className="calendarPage">
      <img
        src={addEventIcon}
        alt="+"
        className="addEventButton"
        onClick={() => {
          setShowPopup(true);
          setIsEditMode(false);
          setNewEvent({ title: '', start: '', end: '', color: '#3174ad' });
        }}
      />
      <div className="calendarContainer">
        <div className="calendarHeader">
          <button onClick={() => setDate(moment(date).subtract(1, 'month').toDate())} className="arrowButton">◀</button>
          <span className="calendarTitle">{formattedDate}</span>
          <button onClick={() => setDate(moment(date).add(1, 'month').toDate())} className="arrowButton">▶</button>
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
          onSelectEvent={handleSelectEvent}
        />

        {showPopup && (
          <div className="popupOverlay">
            <div className="popup">
              <div className="popupTitle">{isEditMode ? '일정 수정' : '일정 추가'}</div>
              <div className="popupDivider" />
              <div className="datetimeRow">
                <div className="datetimeInputWrapper">
                  <label htmlFor="start-date" className="datetimeLabel">시작 날짜</label>
                  <input
                    id="start-date"
                    type="datetime-local"
                    value={newEvent.start}
                    onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
                  />
                </div>
                <div className="datetimeInputWrapper">
                  <label htmlFor="end-date" className="datetimeLabel">종료 날짜</label>
                  <input
                    id="end-date"
                    type="datetime-local"
                    value={newEvent.end}
                    onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value })}
                  />
                </div>
              </div>
              <label htmlFor="event-title" className="label">내용</label>
              <input
                type="text"
                placeholder="내용"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              />
              <label>색상</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="color"
                  value={newEvent.color}
                  onChange={(e) => setNewEvent({ ...newEvent, color: e.target.value })}
                />
                <span style={{ fontFamily: 'Pretendard-Regular', fontSize: '0.9rem' }}>{newEvent.color}</span>
              </div>
              <div className="popupButtons">
                {isEditMode ? (
                <>
                  <button className="addBtn" onClick={handleUpdateEvent}>수정</button>
                  <button className="deleteBtn" onClick={handleDeleteEvent}>삭제</button>
                </>
                ) : (
                  <button className="addBtn" onClick={handleAddEvent}>추가</button>
                )}
                <button
                  className="closeBtn"
                  onClick={() => {
                    setShowPopup(false);
                    setIsEditMode(false);
                    setNewEvent({ title: '', start: '', end: '', color: '#3174ad' });
                  }}
                >X</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarContent;
