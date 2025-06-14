import React,{useState,useEffect,useMemo,useRef} from 'react';
import { useParams,useLocation  } from 'react-router-dom';
import Picker from 'emoji-picker-react';
import Edit from '../../icons/edit.svg';
import leftBtn from '../../icons/left.svg';
import rightBtn from '../../icons/righ.svg';
import rechange from '../../icons/rechange.svg';
import TodoEditModal from './popups/todoEdit';
import TodoMorePopup from './popups/todoMore';
import FeedbackPopup from './popups/feedback';
import pencilIcon from '../../icons/pencilIcon.png';
import sendIcon from '../../icons/sendIcon.png';
/* timeline */ 
import { Timeline,DataSet } from 'vis-timeline/standalone'
import 'vis-timeline/styles/vis-timeline-graph2d.min.css';

/* css */
import '../../css/feedbackpopup.css';

import moment from 'moment'



import { DndContext, closestCenter ,useDroppable} from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import EditIcon from '../../icons/pencil.svg'; 
import DeleteIcon from '../../icons/trash.svg'; 


const ProjectContent = () => {
    const location = useLocation();
    const { username } = location.state || {};
    const [projectName,setProjectName]=useState(null);


    //===================================================================== //
    //---------------------------프로젝트정보 불러오기-------------------------//
    //===================================================================== // 
    const { Pg_id } = useParams(); 

    useEffect(() => {
        const fetchProjectInfo = async () => {
            const response = await fetch(`http://localhost:8008/project/name/${Pg_id}`);
            const data = await response.json();
            setProjectInfo(data);
        };
        fetchProjectInfo();
    }, [Pg_id]);
    const [projectInfo, setProjectInfo] = useState(null);
    const [projectData, setProjectData] = useState(null);


    useEffect(() => {
        const token = localStorage.getItem('access_token');
        const fetchProject= async () =>  {
            try{
                const response = await fetch(`http://127.0.0.1:8008/project/${Pg_id}`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                
                if (!response.ok) {
                    console.log("플젝불러오기단계실패")
                }
                const data = await response.json();
                setProjectData(data);
            }catch (error) {
                console.error(error.message);
            }
        };
        fetchProject();
    }, [Pg_id]);
    console.log(projectData)

    useEffect(() => {
        setProjectName(projectData?.project?.name || '');
      }, [projectData]);
    //===================================================================== //
    // ------------------------  공지 불러오기(redis)  -----------------------//
    //===================================================================== // 

    const [notice, setNotice] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [tempContent, setTempContent] = useState(''); 

    useEffect(() => {
        const fetchNotice = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`http://127.0.0.1:8008/project/${Pg_id}/notice`);
                if (!response.ok) {
                    setTempContent('');
                }
                const data = await response.json();
                console.log(data,"잘불러오지는데??????????????????????????????????????????????")
                setNotice(data.content);
                setError(null);
            } catch (err) {
                setError(err.message);
                console.log("ㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇ어디선가나는에러")
                setNotice('');
            } finally {
                setIsLoading(false);
            }
        };
        fetchNotice();
    }, [Pg_id]);
    const handleEditClick = () => {
        if (notice === null || notice === undefined) {
            setTempContent('');
        } else {
            setTempContent(notice);
        }        setIsEditing(true);
    };
    const handleInputChange = (e) => {
        setTempContent(e.target.value);
    };
    
    const handleSaveClick = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:8008/project/${Pg_id}/notice`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ content: tempContent }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({})); // JSON 파싱 실패 방지
                console.error("서버 응답 오류:", errorData);
                throw new Error("공지사항 수정에 실패했습니다.");
            } else {
                const result = await response.json().catch(() => null);
                console.log("공지사항 수정 응답:", result);
            }

            setNotice(tempContent);
            setIsEditing(false);   
            alert("공지사항이 수정되었습니다.");
        } catch (error) {
            console.error(error.message);
            alert("공지사항 수정 중 오류가 발생했습니다.");
        }
    };
    const handleCancelClick = () => {
        setIsEditing(false);
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
    // ------------------------      todoStatus     ------------------------//
    //===================================================================== // 
    const [inProgressCount, setInProgressCount] = useState(0);
    const [completedCount, setCompletedCount] = useState(0);
    const [waitingFeedbackCount, setWaitingFeedbackCount] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    
    const updateTodoCounts = async () => {
      if (!Pg_id) return;
    
      try {
        const [inProgressRes, completedRes, feedbackRes] = await Promise.all([
          fetch(`http://127.0.0.1:8008/projects/${Pg_id}/todos/status/in_progress`),
          fetch(`http://127.0.0.1:8008/projects/${Pg_id}/todos/status/completed`),
          fetch(`http://127.0.0.1:8008/projects/${Pg_id}/todos/status/waiting_feedback`)
        ]);
        
        const inProgressData = await inProgressRes.json();
        const completedData = await completedRes.json();
        const feedbackData = await feedbackRes.json();
        console.log(inProgressData,"ㄹ더랴러데ㅓ랻레")
        const inProgressLen = inProgressData.todos.length;
        const completedLen = completedData.todos.length;
        const feedbackLen = feedbackData.todos.length;
        console.log(inProgressLen,completedLen,feedbackLen,"길이가왜그럴까????????????????")
        setInProgressCount(inProgressLen);
        setCompletedCount(completedLen);
        setWaitingFeedbackCount(feedbackLen);
        setTotalCount(inProgressLen + completedLen + feedbackLen);
      } catch (err) {
        console.error("Error fetching todo counts:", err);
      }
    };
    
    useEffect(() => {
      if (Pg_id) {
        fetchTodos();

        updateTodoCounts();
      }
    }, [Pg_id]);
    








    //===================================================================== //
    // ------------------------      캘린더         ------------------------//
    //===================================================================== // 
    const [currentWeek, setCurrentWeek] = useState(getCurrentWeek());
    const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());
    const currentYear = today.getFullYear();
  
    function getCurrentWeek() {
      const today = new Date();
      const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay())); // 이번 주 일요일
      const week = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(firstDayOfWeek);
        date.setDate(firstDayOfWeek.getDate() + i);
        week.push(date);
      }
      return week;
    }
  
    function getCurrentMonth() {
      return new Date().getMonth();
    }
  
    function getLastDate(year, month) {
      return new Date(year, month + 1, 0).getDate();
    }
  
    const handleLeftWeek = () => {
      const newWeek = [];
      const firstDayOfCurrentWeek = new Date(currentWeek[0]); // 현재 주의 첫 날
  
      // 7일 전으로 이동
      for (let i = 0; i < 7; i++) {
        const prevDay = new Date(firstDayOfCurrentWeek);
        prevDay.setDate(firstDayOfCurrentWeek.getDate() - 7 + i); // 7일 전부터 하루씩 추가
        newWeek.push(prevDay);
      }
  
      // 월 업데이트
      setCurrentMonth(newWeek[0].getMonth());
      setCurrentWeek(newWeek);
    };
  
    const handleRightWeek = () => {
      const newWeek = [];
      const lastDayOfCurrentWeek = new Date(currentWeek[6]); // 현재 주의 마지막 날
  
      // 7일 후로 이동
      for (let i = 0; i < 7; i++) {
        const nextDay = new Date(lastDayOfCurrentWeek);
        nextDay.setDate(lastDayOfCurrentWeek.getDate() + 1 + i); // 다음 주 첫 날부터 하루씩 추가
        newWeek.push(nextDay);
      }
  
      // 월 업데이트
      setCurrentMonth(newWeek[0].getMonth());
      setCurrentWeek(newWeek);
    };
    //===================================================================== //
    // ------------------------      투두 칸반       ------------------------//
    //===================================================================== // 
    const [showDetail, setShowDetail] = useState({ open: false, status: null });
    const [todos, setTodos] = useState({
        inProgress: [],
        completed: [],
        feedbackPending: [],
    });
    
    const [editingId, setEditingId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [editDueDate, setEditDueDate] = useState('');
    // 전체 할 일 개수 계산
    const totalTodosCount = todos.inProgress.length + todos.completed.length + todos.feedbackPending.length;
    const [localEditContent, setLocalEditContent] = useState('');
    const [localEditDueDate, setLocalEditDueDate] = useState('');
    const handleEdit = (id, content, dueDate) => {
        setEditingId(id);
        setLocalEditContent(content);
        setLocalEditDueDate(dueDate);
    };
    // 투두 데이터 가져오기
    const fetchTodos = async () => {
        console.log("얘실행은됨?")
        try {
            const response = await fetch(`http://127.0.0.1:8008/projects/${Pg_id}/todos`);
            const data = await response.json();
            console.log(data,"펫치투두데이터가져온겁확인이나해보자")
            const inProgress = [];
            const completed = [];
            const feedbackPending = [];
    
            for (const todo of data) {
                const base = {
                    id: todo.id,
                    content: todo.text,
                    dueDate: todo.deadline,
                    completed: todo.status === 'completed',
                };
    
                switch (todo.status) {
                    case 'in_progress':
                        inProgress.push(base);
                        break;
                    case 'completed':
                        completed.push(base);
                        break;
                    case 'waiting_feedback':
                        feedbackPending.push(base);
                        break;
                    default:
                        console.warn(`Unknown status "${todo.status}" for todo ID: ${todo.id}`);
                }
            }
    
            setTodos({ inProgress, completed, feedbackPending });
            updateTodoCounts();
        } catch (error) {
            console.error("Todo 목록 불러오기 오류:", error);
        }
    };
    //마감일 자동 complete옮기기
    useEffect(() => {
        const today = new Date();
        const updatedTodos = { ...todos };
        Object.keys(updatedTodos).forEach((status) => {
            updatedTodos[status].forEach((item) => {
                const due = new Date(item.dueDate);
                if (due < today && status !== 'completed') {
                    const itemToMove = updatedTodos[status].splice(
                        updatedTodos[status].findIndex((i) => i.id === item.id),
                        1
                    )[0];
                    updatedTodos.completed.push({ ...itemToMove, completed: true });
                }
            });
        });
        setTodos(updatedTodos);
    }, []);
    const calculateDDay = (dueDate) => {
        const today = new Date();
        const due = new Date(dueDate);
        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 ? `D-${diffDays}` : `D+${Math.abs(diffDays)}`;
    };
    const handleDragEnd = async (event) => {
        const { active, over } = event;
    
        if (!active || !over || active.id === over.id) return;
    
        const activeId = active.id;
        const overStatus = over?.data?.current?.status || over?.id;
    
        const newStatusMap = {
            inProgress: "in_progress",
            completed: "completed",
            feedbackPending: "waiting_feedback",
        };
        
        const newStatus = newStatusMap[overStatus];
        if (!newStatus) {
            console.warn("ㅉㅉㅉㅉㅉ", overStatus);
            return;
        }
    
        try {
            const res = await fetch(`http://127.0.0.1:8008/todos/${activeId}/status?status=${newStatus}`, {
                method: "POST"
            });
            if (!res.ok) throw new Error("ㅉㅉ");
    
            await fetchTodos();
            updateTodoCounts();
        } catch (err) {
            console.error(err);
        }
    };
    // 체크박스 todo
    const handleCheck = (id, status) => {
        if (!todos[status]) return; // status가 유효하지 않으면 종료
        setTodos((prevTodos) => ({
            ...prevTodos,
            [status]: prevTodos[status].map((item) =>
                item.id === id ? { ...item, completed: !item.completed } : item
            ),
        }));
    };
    // 수정 todo
    const saveEdit = async (id, status) => {
        if (!todos[status]) return;
    
        const updatedData = {
            text: localEditContent,
            user_id: username,
            deadline: localEditDueDate.includes('.') 
                ? localEditDueDate.replaceAll('.', '-') 
                : localEditDueDate,
            start_day: '2025-04-01',
            project_id: Pg_id,
        };
    
        try {
            const response = await fetch(`http://127.0.0.1:8008/todos/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedData),
            });
    
            if (!response.ok) throw new Error("세이브에딧함수 ㅉㅉㅉㅉ");
    
            setTodos((prevTodos) => ({
                ...prevTodos,
                [status]: prevTodos[status].map((item) =>
                    item.id === id ? { ...item, content: localEditContent, dueDate: updatedData.deadline } : item
                ),
            }));
            setEditingId(null);
        } catch (error) {
            console.error("세이브에딧ㅉㅉㅉㅉㅉ", error);
        }
    };
    const handleDelete = async (id, status) => {
        if (!todos[status]) return;
    
        try {
            const response = await fetch(`http://127.0.0.1:8008/todos/${id}?project_id=${Pg_id}`, {
                method: "DELETE",
            });
    
            if (!response.ok) throw new Error("삭제 실패");
    
            await fetchTodos();
            updateTodoCounts();
        } catch (error) {
            console.error("핸들딜릿ㅉㅉㅉㅈ:", error);
        }
    };
    const SortableItem = ({ id, content, dueDate, status, completed }) => {
        const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
            id,  data: { status }, handle: '.drag-handle',
        });
        const inputRef = useRef(null);
        const style = {
            transform: CSS.Transform.toString(transform),
            transition: transform ? 'transform 0.1s ease' : 'transform 0.3s ease-out', 
            width: '100%',
            boxSizing: 'border-box',
            opacity: transform ? 0.7 : 1,
        };
        useEffect(() => {
            if (editingId === id && inputRef.current) {
                inputRef.current.focus();
            }
        }, [editingId]);
        return (
            <div ref={setNodeRef} style={style} className="todo-item">
                {editingId === id ? (
                    <div className="edit-form">
                        <input
                            ref={inputRef}
                            type="text"
                            value={localEditContent}
                            onChange={(e) => setLocalEditContent(e.target.value)}
                        />
                        <input
                            type="date"
                            value={localEditDueDate}
                            onChange={(e) => setLocalEditDueDate(e.target.value)}
                        />
                        <button onClick={() => saveEdit(id, status)}>저장</button>
                    </div>
                ) : (
                    <>
                        <div className="todo-content">
                            <span className="drag-handle" {...attributes} {...listeners}>≡</span>
                            <div style={{ textDecoration: completed ? 'line-through' : 'none' }}>
                                {content}
                            </div>
                            <span className="due-date">{calculateDDay(dueDate)}</span>
                        </div>
                        <div className="todo-meta">
                            <span>{dueDate}까지</span>
                            <div className="icons">
                                <img
                                    src={DeleteIcon}
                                    alt="delete"
                                    className="icon trash"
                                    onClick={() => handleDelete(id, status)}
                                />
                                <div
                                    className={`checkBox ${completed ? 'checked' : ''}`}
                                    onClick={() => handleCheck(id, status)}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    };
    const TodoColumn = ({ title, items, status, onDetail }) => {
        const { setNodeRef } = useDroppable({
            id: status,
            data: { status },
        });
    
        return (
            <div ref={setNodeRef} className={`todo-column ${status}`}>
                <div className="column-header">
                    <h2>{title}</h2>
                    <span>{`${items.length}/${totalTodosCount}`}</span>
                    <img   src={EditIcon}   alt="edit"  className="icon"    onClick={onDetail}/>

                </div>
                <SortableContext
                    id={status}
                    items={items.map((item) => item.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {items.map((item) => (
                        <SortableItem
                            key={item.id}
                            id={item.id}
                            content={item.content}
                            dueDate={item.dueDate}
                            status={status}
                            completed={item.completed}
                        />
                    ))}
                </SortableContext>
            </div>
        );
    };
    


    //===================================================================== //
    // ------------------------       타임라인       ------------------------//
    //===================================================================== // 
    const [timelineTodos, setTimelineTodos] = useState([]); 
    const [timelineItems, setTimelineItems] = useState(new DataSet([]));
    const [groups, setGroups] = useState(new DataSet([]));
    const [todoProgress, setTodoProgress] = useState({});
    const [todoEditModal, setTodoEditModal] = useState({
        isOpen: false,
        todoId: null
    });    const [selectedTodoId, setSelectedTodoId] = useState(null);
    const timelineRef = useRef(null);
    const groupColors = {};

// 컬러 설정 
    const colorClasses = [
        'color-white'
    ];  
    function getGroupColorClass(groupName) {
        if (!groupColors[groupName]) {
            groupColors[groupName] = colorClasses[colorIndex];
            colorIndex = (colorIndex + 1) % colorClasses.length; 
        }
        return groupColors[groupName];
    }
    let colorIndex = 0;
    //타임라인 리로드
    const fetchTimelineTodos = async () => {
        try {
          const res = await fetch(`http://localhost:8008/projects/${Pg_id}/todos`);
          const data = await res.json();
          setTimelineTodos(data);
        } catch (err) {
          console.error("타임라인 투두 불러오기 에러", err);
        }
      };
      
// 1. Pg_id ( 프로젝트 아이디로 ) 프로젝트 투두 목록 불러오기
    useEffect(() => {
        fetchTimelineTodos();
      }, [Pg_id]);
      
// 2. 각 투두의 user_id의 프로필 이미지 매핑 + timeline 아이템 생성
useEffect(() => {
    if (!timelineTodos.length) return;
    
    const fetchProfilesAndSetItems = async () => {
        const uniqueUsers = [...new Set(timelineTodos.map(todo => todo.user_id))];
        const userProfileMap = {};
        
        // 프로필 이미지 먼저 가져오기
        await Promise.all(
            uniqueUsers.map(async (userId) => {
                try {
                    const res = await fetch(`http://localhost:8008/users/${userId}/profile`);
                    if (!res.ok) {
                        console.error(`Failed to fetch profile for user ${userId}. Status: ${res.status}`);
                        userProfileMap[userId] = '/default_profile.png'; // 실패 시 기본 이미지
                        return; // 다음 사용자로 넘어감
                    }
                    const data = await res.json(); 
                    if (data && data.profile_image_url) {
                        userProfileMap[userId] = data.profile_image_url;
                    } else {
                        console.warn(`Profile image URL not found or is empty for user ${userId}. Response data:`, data);
                        userProfileMap[userId] = '/default_profile.png';
                    }
                } catch (error) {
                    console.error(`Error fetching or parsing profile for user ${userId}:`, error);
                    userProfileMap[userId] = '/default_profile.png';
                }
            })
        );
    
        // (2) 그룹 생성
        const groupData = uniqueUsers.map((user, idx) => ({
            id: user,
            content: user,
            value: idx + 1,
            className: 'groupStyle',
        }));
        setGroups(new DataSet(groupData));

        // (3) timelineItems 생성 (profile_image 매핑)
        const mappedItems = timelineTodos
            .filter(todo => todo.deadline)
            .map(todo => {
                const start = new Date(todo.start_day || todo.deadline);
                const end = new Date(todo.deadline);
                end.setDate(end.getDate());
                return {
                    id: todo.id,
                    start,
                    end,
                    group: todo.user_id,
                    content: todo.text,
                    className: `item-common ${getGroupColorClass(todo.user_id)}`,
                    editable: true,
                    profile_image_url: userProfileMap[todo.user_id], 
                };
            });
        setTimelineItems(new DataSet(mappedItems));
        };
        fetchProfilesAndSetItems();
    }, [timelineTodos]);
    const moveTimeoutRef = useRef(null);
    const [pendingMove, setPendingMove] = useState(null);


// 3. 각 투두 진행도 가져오기
    const fetchTodoProgress = async (todoIds) => {
        try {
            const progressData = {};
            const progressPromises = todoIds.map(async (todoId) => {
            const response = await fetch(`http://localhost:8008/todos/${todoId}/progress`);
                if (response.ok) {
                    const data = await response.json();
                    return { todoId, progress: data.progress };
                }
                console.log("000프로그레스데이터어어어어어ㅓㅇ")

                return { todoId, progress: 0 };
            });
            
            const results = await Promise.all(progressPromises);
            results.forEach(({ todoId, progress }) => {
                progressData[todoId] = progress;
            });
            setTodoProgress(progressData);
        } catch (error) {
            console.error('진행도 데이터 ㅉㅉ :', error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            if (projectInfoId) {
                await fetchTodos();
                if (todos.length > 0) {
                    const todoIds = todos.map(todo => todo.id);
                    await fetchTodoProgress(todoIds);
                }
            }
        };
        
        fetchData();
    }, [Pg_id]);

// todos가 변경될 때마다 실행
useEffect(() => {
    const allIds = [
        ...todos.inProgress.map(todo => todo.id),
        ...todos.completed.map(todo => todo.id),
        ...todos.feedbackPending.map(todo => todo.id)
    ];
    if (allIds.length > 0) {
        fetchTodoProgress(allIds);
    }
}, [todos]);




// 4. 타임라인 옵션 렌더링
    useEffect(() => {
        if (!timelineRef.current || !timelineItems || groups.length === 0) return;
        const today = new Date();
        const options = {
            groupOrder: 'content',
            editable: {
                updateTime: true,   // 아이템 위치(날짜) 이동 가능
                updateGroup: false, // 그룹 이동은 금지하려면 false
                overrideItems: false,
                add: false,
            },
            orientation: 'top',
            margin: { item: 30, axis: 50 },
            zoomable: true,
            zoomKey: 'ctrlKey',
            itemsAlwaysDraggable: false,
            stack: true,
            throttleRedraw: 15,
            border:'none',
            groupHeightMode: 'auto',

            start: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 2), 
            end: new Date(today.getTime() + 1000 * 60 * 60 * 24 * 2),   
            groupTemplate: (group) => {
                if (!group) return null;
                const container = document.createElement('div');
                container.style.display = 'flex';
                container.style.alignItems = 'center';
                container.style.justifyContent = 'space-between';
                container.style.padding = '5px';
                container.style.minHeight = group.minHeight || '180px'; 
                const label = document.createElement('span');
                label.innerHTML = group.content;
                container.appendChild(label);

                const toggleButton = document.createElement('button');
                toggleButton.innerHTML = group.visible !== false ? 'x' : '펼치기';
                toggleButton.style.fontSize = '1rem';
                toggleButton.style.fontFamily = 'pretendard-bold';
                toggleButton.style.cursor = 'pointer';
                toggleButton.style.backgroundColor = 'transparent';
                toggleButton.style.color = 'black';  
                toggleButton.style.border = 'none';
                toggleButton.style.position = 'absolute';
                toggleButton.style.marginBottom = '170px';
                toggleButton.style.transform = 'translateX(65px)';
                toggleButton.style.zIndex = '111';
                toggleButton.addEventListener('click', () => {
                    groups.update({ id: group.id, visible: group.visible !== false ? false : true });
                });
                container.appendChild(toggleButton);
                return container;
            },
            timeAxis: { scale: 'day', step: 1 },
            format: {
                minorLabels: { day: 'M월 D  일' },
                majorLabels: { day: '' },
            },
            zoomMin: 1000 * 60 * 60 * 24 * 5, 
            zoomMax: 1000 * 60 * 60 * 24 * 30,  
              dataAttributes: ['id'],
            
            //타임라인아이템 속 들어갈 내용 
            template: function (item) {console.log(item,"템플릿아이템이여기까지오긴하니?")
                const progress = todoProgress[item.id] || 0;
                const profileImageUrl = item.profile_image_url || '/default_profile.png';
                const html = '<div class="timeline-card">' +
                    '<div class="timeline-divider"></div>' +
                    '<div class="timeline-title">' + item.content + '</div>' +
                    `<img src="${profileImageUrl}" class="timeline-avatar" data-user="${item.user_id || ''}" data-group="${item.group}"/>` +
                    '</div>';
                return html;
            }
            
            ,
            

            //아이템 이동 설정 
            onMove: (item, callback) => {
                const dontShowExpire = localStorage.getItem('dontShowMoveModal');
                if (dontShowExpire && Date.now() < Number(dontShowExpire)) {
                    handleMoveConfirm(item, callback);
                    return;
                }
                setPendingMove({ item, callback });
                setShowCancelModal(true);
            },

            
        };
        const timeline = new Timeline(timelineRef.current, timelineItems, groups, options);          
        let currentTodayStr = moment().startOf('day').format('YYYY-MM-DD');
        timeline.on('doubleClick', (properties) => {
            if (properties.item) {
                setTodoEditModal({
                    isOpen: true,
                    todoId: properties.item
                });
            }
        });

        setTimeout(() => {
            const itemContents = timelineRef.current.querySelectorAll('.vis-item-content');
            itemContents.forEach(content => {
                if (!content.querySelector('.timeline-divider')) {
                    let timelineCard = content.querySelector('.vis-item-content');
                    if (!timelineCard) {
                        timelineCard = document.createElement('div');
                        timelineCard.className = 'timeline-card';
                        timelineCard.style.cssText = `
                            display: flex;
                            align-items: center;
                            width: 100%;
                            height: 100%;
                            gap: 8px;
                            padding: 5px;
                            box-sizing: border-box;
                        `;
                        content.appendChild(timelineCard);
                    }
                    const images = document.querySelectorAll('.vis-item-content img');
                    images.forEach(img => {
                        img.style.width = '32px';
                        img.style.height = '32px';
                        img.style.objectFit = 'cover';
                        img.style.borderRadius = '50%';
                    });
        
                    // timeline-divider 생성
                    const divider = document.createElement('div');
                    divider.className = 'timeline-divider';
                    divider.style.cssText = `
                        width: 100px;
                        height: 50.5px;
                        background: #f0f0f0;
                        margin-bottom: 4px;
                        margin-top: 2px;
                        border-radius: 4px;
                        position: relative;
                        overflow: hidden;
                        border: 1px solid #ddd;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    `;
                    
                    // 해당 아이템의 todo ID 찾기 (vis-item에서 data 속성으로 가져오기)
                    const visItem = content.closest('.vis-item');
                    const itemId = visItem ? visItem.getAttribute('data-id') : null;
                    const progress = itemId ? (todoProgress[itemId] || 0) : 0;
                    
                    // 진행도 바 컨테이너
                    const progressContainer = document.createElement('div');
                    progressContainer.style.cssText = `
                    width: 100%;
                    height: 100%;
                    position: relative;
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    justify-content: flex-start;
                `;
                    // 진행도 바 채우기
                    const progressFill = document.createElement('div');
                    progressFill.className = 'progress-bar-fill';
                    progressFill.style.cssText = `
                    height: 100%;
                    width: ${progress}%;
                    background: linear-gradient(90deg, #4CAF50 0%, #45a049 100%);
                    transition: width 0.3s ease-in-out;
                    border-radius: 3px 0 0 3px;
                    position: relative;
                `;
                
                    
                    // 진행도 텍스트
                    const progressText = document.createElement('span');
                    progressText.className = 'progress-text';
                    progressText.textContent = `${progress}%`;
                    progressText.style.cssText = `
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        font-size: 10px;
                        font-weight: bold;
                        font-family: "Pretendard-SemiBold";
                        color: #333;
                        text-shadow: 1px 1px 1px rgba(255,255,255,0.8);
                        z-index: 2;
                        pointer-events: none;
                    `;
                    
                    // 요소들 조립
                    progressContainer.appendChild(progressFill);
                    divider.appendChild(progressContainer);
                    divider.appendChild(progressText); 
                    


                    // 기존 내용 정리하고 새로운 구조로 재구성
                    timelineCard.innerHTML = '';
                    timelineCard.appendChild(divider);
                }
                
            });
        }, 100);

        setInterval(() => {
            const nowStr = moment().startOf('day').format('YYYY-MM-DD');
            if (nowStr !== currentTodayStr) {
                currentTodayStr = nowStr;
            }
        }, 1000 * 60 * 60); 
        const images = timelineRef.current.querySelectorAll('.timeline-avatar');
        images.forEach(img => {
          img.onerror = async function(e) {
            const userId = e.target.dataset.user;
            console.log(userId)
            try {
              const res = await fetch(`http://localhost:8008/users/${userId}/profile`);
              if (res.ok) {
                const data = await res.json();
                e.target.src = (Array.isArray(data) && data.length > 0 && data[1].profile_image_url) ? data[1].profile_image_url : '/default_profile.png';
              } else {
                e.target.src = '/default_profile.png';
              }
            } catch {
              e.target.src = '/default_profile.png';
            }
          };
        });
      
        return () => timeline.destroy();
    }, [timelineItems, groups,todoProgress])
// 그룹 모두보기 핸들러
    const handleShowAllGroups = () => {
        const updatedGroups = groups.get().map(group => ({
            ...group,
            visible: true
        }));
        groups.update(updatedGroups);
    };


//옮길때 경고 모달
    const [showCancelModal, setShowCancelModal] = useState(false);


    const [dontShowAgain, setDontShowAgain] = useState(false);
    const handleDontShowAgainChange = (e) => {
        setDontShowAgain(e.target.checked);
        if (e.target.checked) {
            const expireAt = Date.now() + 24 * 60 * 60 * 1000;
            localStorage.setItem('dontShowMoveModal', expireAt);
        } else {
            localStorage.removeItem('dontShowMoveModal');
        }
    };
    

    const handleConfirm = async () => {
        setShowCancelModal(false);
        if (!pendingMove) return;
        await handleMoveConfirm(pendingMove.item, pendingMove.callback);
        setPendingMove(null);
    };
    
    
    const handleCancel = () => {
        setShowCancelModal(false);
        if (pendingMove && pendingMove.callback) {
            pendingMove.callback(null); 
        }
        setPendingMove(null);
    };

    const handleMoveConfirm = async (item, callback) => {
        try {
            const startDate = new Date(item.start);
            const endDate = new Date(item.end);
            endDate.setDate(endDate.getDate());
    
            const updates = {
                start_day: startDate.toISOString().split("T")[0],
                deadline: endDate.toISOString().split("T")[0]
            };
    
            const res = await fetch(`http://localhost:8008/todos/${item.id}/schedule`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates)
            });
    
            if (!res.ok) {
                const errorText = await res.text();
                console.error("DB 저장 실패:", errorText);
                callback(null);
            } else {
                timelineItems.update(item);
                callback(item);
            }
        } catch (err) {
            console.error("서버 에러:", err);
            callback(null);
        }
    };
       
    

    const handleTodoEditClose = () => {
        setTodoEditModal({
            isOpen: false,
            todoId: null
        });
    };

    const handleTodoUpdate = () => {
        fetchTodos();
        fetchTimelineTodos();
    };


    //===================================================================== //
    // ------------------------    피드백 미리보기    -----------------------//
    //===================================================================== // 
    const [shouldRefresh, setShouldRefresh] = useState(false);
    const [folders, setFolders] = useState([]);
    const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);
    const [projectList, setProjectList] = useState([]);
    const [projectInfoId, setProjectInfoId] = useState(null);

    //우리가원하는건 ind 아이디. project.id가아니기땜에 부모 id를 찾는함수
    useEffect(() => {
        const fetchProjects = async () => {
          const res = await fetch("http://localhost:8008/getProjects");
          const data = await res.json();
          setProjectList(data);
      
          // 프로젝트 리스트가 도착한 직후, Pg_id로 int형 id 추출
          const match = data.find(p => p.project.id === Pg_id);
          setProjectInfoId(match?.id || null);
        };
      
        fetchProjects();
      }, [Pg_id]);

      useEffect(() => {
        if (!projectInfoId) return;
      
        const fetchFiles = async () => {
          try {
            const response = await fetch(`http://localhost:8008/projects/${projectInfoId}/files`);
            if (!response.ok) throw new Error("파일 로딩 실패");
      
            const data = await response.json();
      
            const mappedFiles = data.map(file => ({
              name: file.name,
              createdAt: new Date(file.uploaded_at).toLocaleString(),
              type: 'file',
              image: 'fileIcon.png',
              s3Url: file.s3_url,
              size: file.size ?? 0
            }));
      
            setFolders(mappedFiles);
          } catch (err) {
            console.error("작업물 파일 불러오기 실패:", err);
          }
        };
      
        fetchFiles();
        setShouldRefresh(false);
      }, [projectInfoId, shouldRefresh]);
    

    const handleMoreClick = () => {
        setShowFeedbackPopup(true);
    };

    const handleClosePopup = () => {
        setShowFeedbackPopup(false);
        setShouldRefresh(true); 
    };
    const [showMore, setShowMore] = useState(false);

    const [refreshKey, setRefreshKey] = useState(0);
    const handleUpdate = () => {
        setRefreshKey(prev => prev + 1); 
      };
      


   //=====================================================================//
    // ------------------------   챗 WebSocket    ------------------------ //
    //=====================================================================//
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const wsRef = useRef(null);
    const messagesEndRef = useRef(null);

    // JWT 파싱 함수
    const decodeJWT = (token) => {
        if (!token) return {};
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return {
                userId: payload.sub,
                userName: payload.name || payload.sub
            }
        } catch {
            return {};
        }
    };

    const token = localStorage.getItem("access_token");
    const { userId, userName } = decodeJWT(token);

    // 최초 Redis에 저장된 이전 메시지 불러오기 (이전 채팅 불러오기)
    useEffect(() => {
        if (!Pg_id) return;

        // 먼저 이전 메시지 한번 불러오기 (REST API 사용)
        fetch(`http://localhost:8008/livechat/${Pg_id}`)
            .then(res => res.json())
            .then(data => {
                const loadedMessages = data.map(msg => ({
                    ...msg,
                    sender: msg.sender_id === userId ? "me" : "other",
                    name: msg.sender_name,
                    time: new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
                }));
                setMessages(loadedMessages);
            });

    }, [Pg_id, userId]);

    // WebSocket 연결 (실시간 수신)
    useEffect(() => {
        if (!Pg_id) return;

        const ws = new WebSocket(`ws://localhost:8008/ws/livechat/${Pg_id}`);
        wsRef.current = ws;

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            const newMessage = {
                ...msg,
                sender: msg.sender_id === userId ? "me" : "other",
                name: msg.sender_name,
                time: new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
            };
            setMessages(prev => [...prev, newMessage]);
        };

        ws.onclose = () => console.log("WebSocket Closed");

        return () => ws.close();
    }, [Pg_id, userId]);

    // 메시지 전송
    const sendMessage = () => {
        if (!input.trim()) return;
        const wsMessage = {
            sender_id: userId,
            sender_name: userName,
            text: input,
        };
        wsRef.current?.send(JSON.stringify(wsMessage));
        setInput('');
    };

    // 스크롤 자동 내려가기
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ToggleNameDisplay 그대로 유지
    const ToggleNameDisplay = ({ name }) => {
        const [expanded, setExpanded] = useState(false);
        return (
            <div className={`folderName ${expanded ? 'expanded' : ''}`}
                onClick={() => setExpanded(!expanded)}
                title={name}
            >
                {name}
            </div>
        );
    };


    return (
        <div className="content">
            <div className="contentTitle">{projectName}</div>
            <div className="projectContent">
                <div className="gonji  box1">
                    <div className="gonjiIcon" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                      {selectedEmoji.emoji}
                    </div>
                    {showEmojiPicker && <Picker onEmojiClick={handleEmojiSelect} />}
                    {isLoading ? (
                        <div className="gonjiText">불러오는 중...</div>
                    ) : error ? (
                        <div className="gonjiText" style={{ color: 'red' }}>{error}</div>
                    ) : isEditing ? (
                        <div className="editMode">
                            <input 
                                className="editInput"
                                value={tempContent}
                                onChange={handleInputChange}
                            />
                            <button className="saveBtn" onClick={handleSaveClick}>저장</button>
                            <button className="cancelBtn" onClick={handleCancelClick}>취소</button>
                        </div>
                    ) : (
                        <div className="gonjiText">
                            {notice}
                        </div>
                    )}

                    <div className="gonjiEdit">
                        <img 
                            src={Edit} 
                            alt="edit" 
                            onClick={handleEditClick} 
                            style={{ cursor: 'pointer', opacity: 0.8 }}
                        />
                    </div>
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
                        <div className="objectCount">{inProgressCount}</div>
                        <div className="objectTitle">진행중</div>
                    </div>
                    <div className="object">
                        <div className="objectCount">{completedCount}</div>
                        <div className="objectTitle">완료</div>
                    </div>
                    <div className="object">
                        <div className="objectCount">{waitingFeedbackCount}</div>
                        <div className="objectTitle">피드백 대기</div>
                    </div>
                    <div className="object">
                        <div className="objectCount">{inProgressCount + completedCount + waitingFeedbackCount}</div>
                        <div className="objectTitle">전체 할 일</div>
                    </div>
                </div>
                <div className="timeLine">
                    <div className="title">타임라인 <img onClick={handleShowAllGroups} id="showAllGroup" src={rechange}></img>
                    </div>
                    <div style={{ height: '475px', overflowY: 'auto' }}>
                    <div ref={timelineRef} className="vis-timeline-container" /></div>
                </div>
                <div className="todoList">
                    <div className="top">
                        <div className="title">할 일 목록</div>
                    </div>
                    <div className="content-todo">
                        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <div className="todo-board">
                                <TodoColumn 
                                    title="진행중" 
                                    items={todos.inProgress} 
                                    status="inProgress"
                                    onDetail={() => setShowDetail({ open: true, status: "inProgress" })}
                                />
                                <TodoColumn 
                                    title="완료" 
                                    items={todos.completed} 
                                    status="completed" 
                                    onDetail={() => setShowDetail({ open: true, status: "completed" })}
                                />
                                <TodoColumn 
                                    title="피드백 대기중" 
                                    items={todos.feedbackPending} 
                                    status="feedbackPending"
                                    onDetail={() => setShowDetail({ open: true, status: "feedbackPending" })}
                                />
                            </div>
                        </DndContext>
                    </div>

                </div>
                <div className="liveChat">
                    <div className="title">실시간 채팅</div>
                    <div className="content box1">
                        <div className="chatMessages">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`chatMessageWrapper ${msg.sender}`}>

                                    {/* other - 왼쪽 프로필, 오른쪽 말풍선 */}
                                    {msg.sender === 'other' && (
                                    <div className="chatRow">
                                        <div className="chatProfileDot other" />
                                        <div>
                                        <div className="chatMeta">
                                            <span className="chatName">{msg.name}</span>
                                            <span className="chatTimeLeft">{msg.time}</span>
                                        </div>
                                        <div className="chatBubble other">{msg.text}</div>
                                        </div>
                                    </div>
                                    )}
                                    
                                    {msg.sender === 'me' && (
                                        <div className="chatRow me">
                                            <div className="chatBubbleTimeGroup">
                                            <div className="chatBubble me">{msg.text}</div>
                                            <div className="chatTimeRight">{msg.time}</div>                                            
                                            </div>
                                            <div className="chatProfileDot me" />
                                        </div>
                                        )}
                                    </div>
                                ))}


                        <div ref={messagesEndRef} />
                        </div>

                        <div className="chatInputArea">
                            <img src={pencilIcon} alt="입력" className="pencilIcon" />
                            <input 
                                type="text" 
                                value={input} 
                                onChange={(e) => setInput(e.target.value)} 
                                onKeyDown={(e) => e.key === "Enter" && sendMessage()} // 엔터 키로 전송
                                placeholder="메시지를 입력하세요..."
                            />
                            {/* 전송 버튼 */}
                            <button onClick={sendMessage}>
                                <img src={sendIcon} alt="전송" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="feedback">
                    <div className="top">
                        <div className="title">작업물 피드백</div>
                        <div className="more" onClick={handleMoreClick}>더보기</div>
                    </div>



                    <div className="content-feedback box1">
                    <div className="folderPreview">
    {folders.slice(0, 6).map((folder, index) => {
        const isFile = folder.type === 'file';

        return (
            <div key={index} className={`folderPreSee ${folder.type}PreSee`}>
                <div className="folderDate">{folder.createdAt}</div>

                {isFile ? (
                    <div className="fileItem">
                        <img src="/fileIcon.png" className="folderIcon" alt="File Icon" />
                        <ToggleNameDisplay name={folder.name} />
                    </div>
                ) : (
                    <div className="folderItem">
                        <img src="/folderIcon.png" className="folderIcon" alt="Folder Icon" />
                        <ToggleNameDisplay name={folder.name} />
                    </div>
                )}
            </div>
        );
    })}
</div>

</div>



                    
                </div>
            </div>
        {showCancelModal && (
            <>
                <div className="modal_overlay"></div> {/* 오버레이 */}
                <div className="modal_Pc">
                    <div className="modal_emoji">😶</div>
                    <div className="modal_realMsg">정말 일정을 옮기시겠습니까?</div>
                    <div className="modal-buttons_Pc">
                        <button onClick={handleCancel}>취소</button>
                        <button onClick={handleConfirm}>네</button>
                    </div>
                    <label className="modal_dontShow">
                        <input
                            type="checkbox"
                            checked={dontShowAgain}
                            onChange={handleDontShowAgainChange}
                        />
                        다시 보지 않기 (24시간)
                    </label>
                </div>
            </>
        )}

        <TodoEditModal
            isOpen={todoEditModal.isOpen}
            onClose={handleTodoEditClose}
            todoId={todoEditModal.todoId}
            onUpdate={handleTodoUpdate}
            projectId={Pg_id}
        />
        {showDetail.open && (
            <TodoMorePopup
            status={showDetail.status}
            projectId={Pg_id}
            todos={todos}
            onClose={() => setShowDetail({ open: false, status: null })}
            onUpdate={handleTodoUpdate}
            />
        )}


        {showFeedbackPopup && <FeedbackPopup onClose={handleClosePopup} username={username} projectId = {projectInfoId} onUpdate={handleTodoUpdate} />}
        </div>
    );
};

export default ProjectContent;