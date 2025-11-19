import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/ko';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../../css/calendar.css';
import addEventIcon from '../../icons/addEventButton.png';
import axios from 'axios';

moment.locale('ko');
const localizer = momentLocalizer(moment);

<<<<<<< HEAD
=======
// 드롭다운에서 쓸 색상 옵션
const COLOR_OPTIONS = [
  { key: 'burgundy', name: '벌건디', value: '#FF4B4B' },
  { key: 'orange',   name: '오렌지', value: '#FF8A3C' },
  { key: 'yellow',   name: '옐로우', value: '#FFD447' },
  { key: 'green',    name: '그린',   value: '#2ECC71' },
  { key: 'blue',     name: '블루',   value: '#3498DB' },
  { key: 'navy',     name: '네이비', value: '#34495E' },
  { key: 'purple',   name: '퍼플',   value: '#9B59B6' },
  { key: 'custom',   name: '직접 선택', value: 'custom' },
];

const findColorKeyByValue = (value) => {
  if (!value) return 'custom';
  const found = COLOR_OPTIONS.find(
    (c) => c.value.toLowerCase() === value.toLowerCase()
  );
  return found ? found.key : 'custom';
};

>>>>>>> main
const CalendarContent = () => {
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    start: '',
    end: '',
<<<<<<< HEAD
    color: '#ff7676',
    project_id: '',
    created_at: null, // created_at 필드 추가
=======
    color: COLOR_OPTIONS[0].value, // 기본 버건디
    project_id: '',
    created_at: null,
>>>>>>> main
  });
  const [userId, setUserId] = useState(null);
  const [selectedEventIndex, setSelectedEventIndex] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
<<<<<<< HEAD
  
  // 분리된 드롭다운 상태 관리
=======

  // 색상 드롭다운 상태
  const [selectedColorKey, setSelectedColorKey] = useState('burgundy');
  const [showColorDropdown, setShowColorDropdown] = useState(false);

  // 프로젝트 드롭다운 상태
>>>>>>> main
  const [userProjects, setUserProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showEventProjectDropdown, setShowEventProjectDropdown] = useState(false);

<<<<<<< HEAD
  // 외부 클릭 감지를 위한 ref
  const filterDropdownRef = useRef(null);
  const eventDropdownRef = useRef(null);

  // 외부 클릭 감지 효과
=======
  // 외부 클릭 감지용 ref
  const filterDropdownRef = useRef(null);
  const eventDropdownRef = useRef(null);
  const colorDropdownRef = useRef(null);

  // 외부 클릭 감지
>>>>>>> main
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        setShowFilterDropdown(false);
      }
      if (eventDropdownRef.current && !eventDropdownRef.current.contains(event.target)) {
        setShowEventProjectDropdown(false);
      }
<<<<<<< HEAD
=======
      if (colorDropdownRef.current && !colorDropdownRef.current.contains(event.target)) {
        setShowColorDropdown(false);
      }
>>>>>>> main
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

<<<<<<< HEAD
  // 사용자가 참여한 프로젝트 목록 가져오기
  useEffect(() => {
    const fetchUserProjects = async () => {
      if (!userId) return;
      
=======
  // 사용자가 참여한 프로젝트 목록
  useEffect(() => {
    const fetchUserProjects = async () => {
      if (!userId) return;

>>>>>>> main
      const token = localStorage.getItem('access_token');
      try {
        const response = await axios.get('http://localhost:8008/my-projects/participants', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserProjects(response.data);
      } catch (err) {
        console.error('프로젝트 목록 불러오기 실패:', err);
      }
    };

    fetchUserProjects();
  }, [userId]);

<<<<<<< HEAD
=======
  // 일정 목록
>>>>>>> main
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
          created_at: event.created_at,
          project_id: event.in_project || null,
        }));
        setEvents(fetched);
      } catch (err) {
        console.error('이벤트 불러오기 실패:', err);
      }
    };

    fetchEvents();
  }, [userId]);

<<<<<<< HEAD
  // 프로젝트 필터링 효과
=======
  // 프로젝트 필터링
>>>>>>> main
  useEffect(() => {
    if (selectedProjectId === 'all') {
      setFilteredEvents(events);
    } else {
<<<<<<< HEAD
      const filtered = events.filter(event => 
        event.project_id === selectedProjectId
=======
      const filtered = events.filter(
        (event) => event.project_id === selectedProjectId
>>>>>>> main
      );
      setFilteredEvents(filtered);
    }
  }, [events, selectedProjectId]);

<<<<<<< HEAD
  // 프로젝트 선택 핸들러 (필터용)
=======
>>>>>>> main
  const handleFilterProjectSelect = useCallback((projectId) => {
    setSelectedProjectId(projectId);
    setShowFilterDropdown(false);
  }, []);

<<<<<<< HEAD
  // 이벤트 프로젝트 선택 핸들러 (팝업용)
  const handleEventProjectSelect = useCallback((projectId) => {
    setNewEvent(prev => ({ ...prev, project_id: projectId }));
=======
  const handleEventProjectSelect = useCallback((projectId) => {
    setNewEvent((prev) => ({ ...prev, project_id: projectId }));
>>>>>>> main
    setShowEventProjectDropdown(false);
  }, []);

  const handleSelectEvent = (event) => {
<<<<<<< HEAD
    const index = events.findIndex(e =>
      e.title === event.title &&
      e.start.getTime() === event.start.getTime() &&
      e.end.getTime() === event.end.getTime() &&
      e.created_at === event.created_at // created_at도 비교에 추가
=======
    const index = events.findIndex(
      (e) =>
        e.title === event.title &&
        e.start.getTime() === event.start.getTime() &&
        e.end.getTime() === event.end.getTime() &&
        e.created_at === event.created_at
>>>>>>> main
    );

    if (index !== -1) {
      setSelectedEventIndex(index);
      setNewEvent({
        title: event.title,
<<<<<<< HEAD
        start: moment(event.start).format("YYYY-MM-DDTHH:mm"),
        end: moment(event.end).format("YYYY-MM-DDTHH:mm"),
        color: event.color || '#ff7676',
        created_at: event.created_at, // created_at 설정
        project_id: event.project_id || '',
      });
=======
        start: moment(event.start).format('YYYY-MM-DDTHH:mm'),
        end: moment(event.end).format('YYYY-MM-DDTHH:mm'),
        color: event.color || COLOR_OPTIONS[0].value,
        created_at: event.created_at,
        project_id: event.project_id || '',
      });
      setSelectedColorKey(findColorKeyByValue(event.color || COLOR_OPTIONS[0].value));
>>>>>>> main
      setIsEditMode(true);
      setShowPopup(true);
    }
  };

  const handleAddEvent = async () => {
    const { title, start, end, color, project_id } = newEvent;
    if (!title || !start || !end) {
      alert('모든 항목을 입력해주세요.');
      return;
    }
    if (!userId) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:8008/calendar', {
        text: title,
        start,
        end,
        user_id: userId,
        is_repeat: false,
        in_project: project_id || null,
        color,
      });
<<<<<<< HEAD
      
      // 서버에서 반환된 created_at을 사용하여 이벤트 생성
      const newEventObj = { 
        title, 
        start: new Date(start), 
        end: new Date(end), 
        color,
        project_id: project_id || null,
        created_at: response.data.created_at || new Date().toISOString()
      };
      setEvents([...events, newEventObj]);
      
=======

      const newEventObj = {
        title,
        start: new Date(start),
        end: new Date(end),
        color,
        project_id: project_id || null,
        created_at: response.data.created_at || new Date().toISOString(),
      };
      setEvents([...events, newEventObj]);

>>>>>>> main
      alert('일정이 추가되었습니다.');
    } catch (err) {
      console.error('일정 저장 실패:', err);
      alert('일정 저장에 실패했습니다.');
    }

    setShowPopup(false);
<<<<<<< HEAD
    setNewEvent({ title: '', start: '', end: '', color: '#ff7676', project_id: '', created_at: null });
=======
    setIsEditMode(false);
    setSelectedColorKey('burgundy');
    setNewEvent({
      title: '',
      start: '',
      end: '',
      color: COLOR_OPTIONS[0].value,
      project_id: '',
      created_at: null,
    });
>>>>>>> main
  };

  const handleUpdateEvent = async () => {
    if (!newEvent.title || !newEvent.start || !newEvent.end) {
<<<<<<< HEAD
      alert("모든 항목을 입력해주세요.");
=======
      alert('모든 항목을 입력해주세요.');
>>>>>>> main
      return;
    }

    if (!newEvent.created_at) {
<<<<<<< HEAD
      alert("수정할 이벤트 정보가 없습니다.");
=======
      alert('수정할 이벤트 정보가 없습니다.');
>>>>>>> main
      return;
    }

    try {
<<<<<<< HEAD
      // 수정 API 호출
=======
>>>>>>> main
      const response = await axios.put('http://localhost:8008/calendar', {
        user_id: userId,
        original_created_at: newEvent.created_at,
        text: newEvent.title,
        start: newEvent.start,
        end: newEvent.end,
        color: newEvent.color,
        in_project: newEvent.project_id || null,
      });

<<<<<<< HEAD
      // 로컬 상태 업데이트
=======
>>>>>>> main
      const updated = [...events];
      updated[selectedEventIndex] = {
        title: newEvent.title,
        start: new Date(newEvent.start),
        end: new Date(newEvent.end),
        color: newEvent.color,
        project_id: newEvent.project_id || null,
<<<<<<< HEAD
        created_at: response.data.new_created_at, // 새로운 created_at 사용
=======
        created_at: response.data.new_created_at,
>>>>>>> main
      };
      setEvents(updated);

      alert('일정이 수정되었습니다.');
    } catch (err) {
      console.error('일정 수정 실패:', err);
      alert('일정 수정에 실패했습니다.');
    }

    setShowPopup(false);
    setIsEditMode(false);
<<<<<<< HEAD
    setNewEvent({ title: '', start: '', end: '', color: '#ff7676', project_id: '', created_at: null });
=======
    setSelectedColorKey('burgundy');
    setNewEvent({
      title: '',
      start: '',
      end: '',
      color: COLOR_OPTIONS[0].value,
      project_id: '',
      created_at: null,
    });
>>>>>>> main
    setSelectedEventIndex(null);
  };

  const handleDeleteEvent = async () => {
    if (!newEvent.created_at || !userId) {
<<<<<<< HEAD
      alert("삭제할 정보를 찾을 수 없습니다.");
=======
      alert('삭제할 정보를 찾을 수 없습니다.');
>>>>>>> main
      return;
    }

    try {
      await axios.delete('http://localhost:8008/calendar', {
        data: {
          user_id: userId,
          created_at: newEvent.created_at,
        },
      });
<<<<<<< HEAD
      
      const updatedEvents = [...events];
      updatedEvents.splice(selectedEventIndex, 1);
      setEvents(updatedEvents);
      
=======

      const updatedEvents = [...events];
      updatedEvents.splice(selectedEventIndex, 1);
      setEvents(updatedEvents);

>>>>>>> main
      alert('일정이 삭제되었습니다.');
      setShowPopup(false);
      setSelectedEventIndex(null);
      setIsEditMode(false);
    } catch (err) {
<<<<<<< HEAD
      console.error("삭제 실패:", err);
=======
      console.error('삭제 실패:', err);
>>>>>>> main
      alert('일정 삭제에 실패했습니다.');
    }
  };

  const formattedDate = moment(date).format('YYYY년 M월');

  const eventStyleGetter = (event) => ({
    className: 'customEvent',
    style: { backgroundColor: event.color },
  });

<<<<<<< HEAD
  // 선택된 프로젝트 이름 가져오기
  const getSelectedProjectName = () => {
    if (selectedProjectId === 'all') return '전체 프로젝트';
    const project = userProjects.find(p => p.project_id === selectedProjectId);
    return project ? project.project_name : '프로젝트 선택';
  };

  // 선택된 이벤트 프로젝트 이름 가져오기
  const getSelectedEventProjectName = () => {
    if (!newEvent.project_id) return '개인 일정';
    const project = userProjects.find(p => p.project_id === newEvent.project_id);
    return project ? project.project_name : '프로젝트 선택';
  };

=======
  const getSelectedProjectName = () => {
    if (selectedProjectId === 'all') return '전체 프로젝트';
    const project = userProjects.find((p) => p.project_id === selectedProjectId);
    return project ? project.project_name : '프로젝트 선택';
  };

  const getSelectedEventProjectName = () => {
    if (!newEvent.project_id) return '개인 일정';
    const project = userProjects.find((p) => p.project_id === newEvent.project_id);
    return project ? project.project_name : '프로젝트 선택';
  };

  const selectedColorOption = COLOR_OPTIONS.find(
    (c) => c.key === selectedColorKey
  );
  const selectedColorName =
    selectedColorOption?.name || '직접 선택';
  const selectedColorPreview =
    selectedColorKey === 'custom'
      ? newEvent.color
      : selectedColorOption?.value || newEvent.color;

  const handleSelectColor = (key) => {
    setSelectedColorKey(key);
    if (key === 'custom') {
      // 색은 그대로 두고, 아래 커스텀 컬러 input에서 조정
      setShowColorDropdown(false);
      return;
    }
    const option = COLOR_OPTIONS.find((c) => c.key === key);
    if (option) {
      setNewEvent((prev) => ({ ...prev, color: option.value }));
    }
    setShowColorDropdown(false);
  };

>>>>>>> main
  return (
    <div className="calendarPage">
      <img
        src={addEventIcon}
        alt="+"
        className="addEventButton"
        onClick={() => {
          setShowPopup(true);
          setIsEditMode(false);
<<<<<<< HEAD
          setNewEvent({ title: '', start: '', end: '', color: '#ff7676', project_id: '', created_at: null });
=======
          setSelectedColorKey('burgundy');
          setNewEvent({
            title: '',
            start: '',
            end: '',
            color: COLOR_OPTIONS[0].value,
            project_id: '',
            created_at: null,
          });
>>>>>>> main
        }}
      />

      <div className="calendarContainer">
<<<<<<< HEAD
        {/* 프로젝트 필터 드롭다운 */}
        <div className="emptyFill"></div>
        <div className="projectFilterContainer">
          <div className="projectDropdown" ref={filterDropdownRef}>
            <button 
              className="projectDropdownButton"
              onClick={() => setShowFilterDropdown(prev => !prev)}
=======
        <div className="emptyFill"></div>
        <div className="projectFilterContainer">
          <div className="projectDropdown" ref={filterDropdownRef}>
            <button
              className="projectDropdownButton"
              onClick={() => setShowFilterDropdown((prev) => !prev)}
>>>>>>> main
            >
              <span className="projectName">{getSelectedProjectName()}</span>
              <span className="dropdownArrow">▼</span>
            </button>
            {showFilterDropdown && (
              <div className="projectDropdownMenu">
<<<<<<< HEAD
                <div 
=======
                <div
>>>>>>> main
                  className="projectDropdownItem"
                  onClick={() => handleFilterProjectSelect('all')}
                >
                  전체 프로젝트
                </div>
                {userProjects.map((project) => (
                  <div
                    key={project.project_id}
                    className="projectDropdownItem"
                    onClick={() => handleFilterProjectSelect(project.project_id)}
                  >
                    {project.project_name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
<<<<<<< HEAD
        <div className="calendarHeader">
          <button onClick={() => setDate(moment(date).subtract(1, 'month').toDate())} className="arrowButton">◀</button>
          <span className="calendarTitle">{formattedDate}</span>
          <button onClick={() => setDate(moment(date).add(1, 'month').toDate())} className="arrowButton">▶</button>
        </div>
=======

        <div className="calendarHeader">
          <button
            onClick={() =>
              setDate(moment(date).subtract(1, 'month').toDate())
            }
            className="arrowButton"
          >
            ◀
          </button>
          <span className="calendarTitle">{formattedDate}</span>
          <button
            onClick={() => setDate(moment(date).add(1, 'month').toDate())}
            className="arrowButton"
          >
            ▶
          </button>
        </div>

>>>>>>> main
        <Calendar
          localizer={localizer}
          events={filteredEvents}
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
<<<<<<< HEAD
              <div className="popupTitle">{isEditMode ? '일정 수정' : '일정 추가'}</div>
              <div className="popupDivider" />
              
              {/* 이벤트 프로젝트 선택 드롭다운 */}
              <label className="label">프로젝트</label>
              <div className="projectDropdown2" ref={eventDropdownRef}>
                <button 
                  className="projectSelect2"
                  onClick={() => setShowEventProjectDropdown(prev => !prev)}  // ⭐ 드롭다운 열기 추가
                >
                  <span className="projectName">{getSelectedEventProjectName()}</span>
=======
              <div className="calendarPopupTitle">
                {isEditMode ? '일정 수정' : '일정 추가'}
              </div>

              {/* 프로젝트 선택 */}
              <label className="label">프로젝트</label>
              <div className="projectDropdown2" ref={eventDropdownRef}>
                <button
                  className="projectSelect2"
                  onClick={() =>
                    setShowEventProjectDropdown((prev) => !prev)
                  }
                >
                  <span className="projectName">
                    {getSelectedEventProjectName()}
                  </span>
>>>>>>> main
                  <span className="dropdownArrow">▼</span>
                </button>
                {showEventProjectDropdown && (
                  <div className="projectDropdownMenu">
<<<<<<< HEAD
                    <div 
=======
                    <div
>>>>>>> main
                      className="projectDropdownItem"
                      onClick={() => handleEventProjectSelect('')}
                    >
                      개인 일정
                    </div>
                    {userProjects.map((project) => (
                      <div
                        key={project.project_id}
                        className="projectDropdownItem"
<<<<<<< HEAD
                        onClick={() => handleEventProjectSelect(project.project_id)}
=======
                        onClick={() =>
                          handleEventProjectSelect(project.project_id)
                        }
>>>>>>> main
                      >
                        {project.project_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

<<<<<<< HEAD
              <div className="datetimeRow">
                <div className="datetimeInputWrapper">
                  <label htmlFor="start-date" className="datetimeLabel">시작 날짜</label>
=======
              {/* 날짜 */}
              <div className="datetimeRow">
                <div className="datetimeInputWrapper">
                  <label htmlFor="start-date" className="datetimeLabel">
                    시작 날짜
                  </label>
>>>>>>> main
                  <input
                    id="start-date"
                    type="datetime-local"
                    value={newEvent.start}
<<<<<<< HEAD
                    onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
                  />
                </div>
                <div className="datetimeInputWrapper">
                  <label htmlFor="end-date" className="datetimeLabel">종료 날짜</label>
=======
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, start: e.target.value })
                    }
                  />
                </div>
                <div className="datetimeInputWrapper">
                  <label htmlFor="end-date" className="datetimeLabel">
                    종료 날짜
                  </label>
>>>>>>> main
                  <input
                    id="end-date"
                    type="datetime-local"
                    value={newEvent.end}
<<<<<<< HEAD
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
              <text className='colorText'>색상</text>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="color"
                  value={newEvent.color}
                  onChange={(e) => setNewEvent({ ...newEvent, color: e.target.value })}
                  style={{ border: 'none', outline: 'none', backgroundColor:'white'}}
                />
                <span style={{ fontFamily: 'Pretendard-Regular', fontSize: '0.9rem' }}>{newEvent.color}</span>
              </div>
              <div className="popupButtons">
                {isEditMode ? (
                  <>
                    <button className="addBtn" onClick={handleUpdateEvent}>수정</button>
                    <button className="editBtn" onClick={handleDeleteEvent}>삭제</button>
                  </>
                ) : (
                  <button className="addBtn" onClick={handleAddEvent}>추가</button>
                )}
                <button
                  className="closeBtn"
                  onClick={() => {
                    setShowPopup(false);
                    setIsEditMode(false);
                    setNewEvent({ title: '', start: '', end: '', color: '#ff7676', project_id: '', created_at: null });
                  }}
                >X</button>
=======
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, end: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* 내용 */}
              <div className="contentField">
                <label htmlFor="event-title" className="label">
                  내용
                </label>
                <input
                  id="event-title"
                  type="text"
                  placeholder="내용"
                  value={newEvent.title}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, title: e.target.value })
                  }
                />
              </div>

              {/* 색상 드롭다운 */}
              <div className="bottomRow">
                <div className="colorField">
                  <span className="colorText">색상</span>
                  <div
                    className="colorDropdownWrapper"
                    ref={colorDropdownRef}
                  >
                    <button
                      className="colorDropdownButton"
                      onClick={() =>
                        setShowColorDropdown((prev) => !prev)
                      }
                    >
                      <div className="colorButtonLeft">
                        <span
                          className="colorSquare"
                          style={{ backgroundColor: selectedColorPreview }}
                        />
                        <span className="colorName">{selectedColorName}</span>
                      </div>
                      <span className="dropdownArrow">▼</span>
                    </button>

                    {showColorDropdown && (
                      <div className="colorDropdownMenu">
                        {COLOR_OPTIONS.map((opt) => (
                          <div
                            key={opt.key}
                            className="colorDropdownItem"
                            onClick={() => handleSelectColor(opt.key)}
                          >
                            <span
                              className="colorSquare"
                              style={{
                                backgroundColor:
                                  opt.value === 'custom'
                                    ? '#ffffff'
                                    : opt.value,
                                border:
                                  opt.value === 'custom'
                                    ? '1px solid #ccc'
                                    : 'none',
                              }}
                            />
                            <span className="colorName">{opt.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedColorKey === 'custom' && (
                    <div className="customColorRow">
                      <input
                        type="color"
                        value={newEvent.color}
                        onChange={(e) =>
                          setNewEvent({
                            ...newEvent,
                            color: e.target.value,
                          })
                        }
                        style={{
                          border: 'none',
                          outline: 'none',
                          backgroundColor: 'white',
                        }}
                      />
                      <span className="customColorCode">
                        {newEvent.color}
                      </span>
                    </div>
                  )}
                </div>

                <div className="popupButtons">
                  {isEditMode ? (
                    <>
                      <button
                        className="scheduleAddBtn"
                        onClick={handleUpdateEvent}
                      >
                        수정
                      </button>
                      <button
                        className="editBtn"
                        onClick={handleDeleteEvent}
                      >
                        삭제
                      </button>
                    </>
                  ) : (
                    <button
                      className="scheduleAddBtn"
                      onClick={handleAddEvent}
                    >
                      추가
                    </button>
                  )}
                  <button
                    className="closeBtn"
                    onClick={() => {
                      setShowPopup(false);
                      setIsEditMode(false);
                      setSelectedColorKey('burgundy');
                      setNewEvent({
                        title: '',
                        start: '',
                        end: '',
                        color: COLOR_OPTIONS[0].value,
                        project_id: '',
                        created_at: null,
                      });
                    }}
                  >
                    X
                  </button>
                </div>
>>>>>>> main
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

<<<<<<< HEAD
export default CalendarContent;
=======
export default CalendarContent;
>>>>>>> main
