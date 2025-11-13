import React, { useState, useEffect, useLayoutEffect, useRef ,location} from 'react';
import { useParams, useLocation } from 'react-router-dom';
import Picker from 'emoji-picker-react';
import { Timeline, DataSet } from 'vis-timeline/standalone';
import 'vis-timeline/styles/vis-timeline-graph2d.min.css';
import moment from 'moment';

// DnD Kit
import { DndContext, closestCenter, useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Icons
import Edit from '../../icons/edit.svg';
import leftBtn from '../../icons/left.svg';
import rightBtn from '../../icons/righ.svg';
import rechange from '../../icons/rechange.svg';
import EditIcon from '../../icons/pencil.svg'; 
import DeleteIcon from '../../icons/trash.svg'; 

// Components
import TodoEditModal from './popups/todoEdit';
import TodoMorePopup from './popups/todoMore';
import FeedbackPopup from './popups/feedback';
import pencilIcon from '../../icons/pencilIcon.png';
import sendIcon from '../../icons/sendIcon.png';
/* timeline */ 


// CSS
import '../../css/feedbackpopup.css';

const ProjectContent = () => {
    const { Pg_id } = useParams(); 


    const location = useLocation();
    const { username } = location.state || {};

    // ⭐ 스크롤 초기화 - 컴포넌트 최상위에서 호출
    useLayoutEffect(() => {
        const scrollToTop = () => {
            window.scrollTo({ top: 0, behavior: 'auto' });
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
        };
        
        scrollToTop();
        
        // 여러 번 시도하여 확실히 초기화
        const timeouts = [0, 50, 150, 300, 500].map(delay => 
            setTimeout(scrollToTop, delay)
        );
        
        return () => timeouts.forEach(clearTimeout);
    }, [Pg_id, location.pathname]);

    /* ========================================================= */
    /* =============    프로젝트 기본 정보 관리    ================ */
    /* ========================================================= */
    const [projectName, setProjectName] = useState(null);
    const [projectInfo, setProjectInfo] = useState(null);
    const [projectData, setProjectData] = useState(null);
    const [projectInfoId, setProjectInfoId] = useState(null);

    // 프로젝트 정보 불러오기
    useEffect(() => {
        if (!Pg_id) return;

        const fetchProjectData = async () => {
            try {
                const [infoResponse, dataResponse, projectsResponse] = await Promise.all([
                    fetch(`http://localhost:8008/project/name/${Pg_id}`),
                    fetch(`http://127.0.0.1:8008/project/${Pg_id}`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
                    }),
                    fetch("http://localhost:8008/getProjects")
                ]);

                const [infoData, dataData, projectsData] = await Promise.all([
                    infoResponse.json(),
                    dataResponse.json(),
                    projectsResponse.json()
                ]);

                setProjectInfo(infoData);
                setProjectData(dataData);
                setProjectName(dataData?.project?.name || '');

                // 프로젝트 int형 ID 추출
                const match = projectsData.find(p => p.project.id === Pg_id);
                setProjectInfoId(match?.id || null);

            } catch (error) {
                console.error('프로젝트 데이터 로딩 실패:', error);
            }
        };

        fetchProjectData();
        fetchTodos();
        updateTodoCounts();
        setTimelineTodos([]);
        setTodoProgress({});
        setTimelineItems(new DataSet([]));
        const initializeTimeline = async () => {
            try {
                await fetchTodos();
                await fetchTimelineTodos();
                
                // 데이터 로딩 완료 후 자동으로 모든 그룹 표시
                setTimeout(() => {
                    handleShowAllGroups();
                }, 1000);
                
            } catch (error) {
                console.error('타임라인 초기화 실패:', error);
            }
        };
        
        initializeTimeline();
    }, [Pg_id]);
    // 프로젝트 아이디가 없다면


    /* ========================================================= */
    /* =================    공지사항 관리    ==================== */
    /* ========================================================= */
    const [notice, setNotice] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [tempContent, setTempContent] = useState('');
    const [showGonjiModal, setshowGonjiModal] = useState(false);
    // 이모지 관리
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [selectedEmoji, setSelectedEmoji] = useState({ emoji: '🚩' });

    // 공지사항 불러오기
    useEffect(() => {
        if (!Pg_id) return;

        const fetchNotice = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`http://127.0.0.1:8008/project/${Pg_id}/notice`);
                if (response.ok) {
                    const data = await response.json();
                    setNotice(data.content);
                } else {
                    setNotice('공지사항이 없습니다.');
                }
                setError(null);
            } catch (err) {
                setError(err.message);
                setNotice('');
            } finally {
                setIsLoading(false);
            }
        };

        fetchNotice();
    }, [Pg_id]);

    const handleEditClick = () => {
        setTempContent(notice || '');
        setIsEditing(true);
    };

    const handleSaveClick = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:8008/project/${Pg_id}/notice`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: tempContent }),
            });

            if (response.ok) {
                setNotice(tempContent);
                setIsEditing(false);            setshowGonjiModal(false); 
                alert("공지사항이 수정되었습니다.");
            } else {
                throw new Error("공지사항 수정에 실패했습니다.");
            }
        } catch (error) {
            console.error(error.message);
            alert("공지사항 수정 중 오류가 발생했습니다.");
        }
    };

    const handleCancelClick = () => {
        setshowGonjiModal(false); setIsEditing(false);
    };

    const handleEmojiSelect = (emojiObject) => {
        setSelectedEmoji(emojiObject);
        setShowEmojiPicker(false);
    };

    /* ========================================================= */
    /* =================    캘린더 관리    ===================== */
    /* ========================================================= */
    const today = new Date();
    const [currentWeek, setCurrentWeek] = useState(getCurrentWeek());
    const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());

    function getCurrentWeek() {
        const today = new Date();
        const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
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

    const handleLeftWeek = () => {
        const newWeek = [];
        const firstDayOfCurrentWeek = new Date(currentWeek[0]);

        for (let i = 0; i < 7; i++) {
            const prevDay = new Date(firstDayOfCurrentWeek);
            prevDay.setDate(firstDayOfCurrentWeek.getDate() - 7 + i);
            newWeek.push(prevDay);
        }

        setCurrentMonth(newWeek[0].getMonth());
        setCurrentWeek(newWeek);
    };

    const handleRightWeek = () => {
        const newWeek = [];
        const lastDayOfCurrentWeek = new Date(currentWeek[6]);

        for (let i = 0; i < 7; i++) {
            const nextDay = new Date(lastDayOfCurrentWeek);
            nextDay.setDate(lastDayOfCurrentWeek.getDate() + 1 + i);
            newWeek.push(nextDay);
        }

        setCurrentMonth(newWeek[0].getMonth());
        setCurrentWeek(newWeek);
    };

    /* ========================================================= */
    /* =================    Todo 상태 관리    ================== */
    /* ========================================================= */
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
    
            const [inProgressData, completedData, feedbackData] = await Promise.all([
                inProgressRes.json(),
                completedRes.json(),
                feedbackRes.json()
            ]);
    
            const inProgressLen = Array.isArray(inProgressData) ? inProgressData.length : 0;
            const completedLen = Array.isArray(completedData) ? completedData.length : 0;
            const feedbackLen = Array.isArray(feedbackData) ? feedbackData.length : 0;
    
            setInProgressCount(inProgressLen);
            setCompletedCount(completedLen);
            setWaitingFeedbackCount(feedbackLen);
            setTotalCount(inProgressLen + completedLen + feedbackLen);
        } catch (err) {
            console.error("Todo 카운트 조회 실패:", err);
        }
    };
    

    /* ========================================================= */
    /* =================    Todo 칸반 관리    ================== */
    /* ========================================================= */
    const [showDetail, setShowDetail] = useState({ open: false, status: null });
    const [todos, setTodos] = useState({
        inProgress: [],
        completed: [],
        feedbackPending: [],
    });
    const [editingId, setEditingId] = useState(null);
    const [localEditContent, setLocalEditContent] = useState('');
    const [localEditDueDate, setLocalEditDueDate] = useState('');

    const totalTodosCount = todos.inProgress.length + todos.completed.length + todos.feedbackPending.length;

    // Todo 데이터 가져오기
    const fetchTodos = async () => {
        if (!Pg_id) return;

        try {
            const response = await fetch(`http://127.0.0.1:8008/projects/${Pg_id}/todos`);
            const data = await response.json();

            const categorizedTodos = {
                inProgress: [],
                completed: [],
                feedbackPending: []
            };

            data.forEach(todo => {
                const base = {
                    id: todo.id,
                    content: todo.text,
                    dueDate: todo.deadline,
                    completed: todo.status === 'completed',
                };

                switch (todo.status) {
                    case 'in_progress':
                        categorizedTodos.inProgress.push(base);
                        break;
                    case 'completed':
                        categorizedTodos.completed.push(base);
                        break;
                    case 'waiting_feedback':
                        categorizedTodos.feedbackPending.push(base);
                        break;
                    default:
                        console.warn(`Unknown status "${todo.status}" for todo ID: ${todo.id}`);
                }
            });

            setTodos(categorizedTodos);
            updateTodoCounts();
        } catch (error) {
            console.error("Todo 목록 불러오기 오류:", error);
        }
    };

    const calculateDDay = (dueDate) => {
        const today = new Date();
        const due = new Date(dueDate);
        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 ? `D-${diffDays}` : `D+${Math.abs(diffDays)}`;
    };

    const handleEdit = (id, content, dueDate) => {
        setEditingId(id);
        setLocalEditContent(content);
        setLocalEditDueDate(dueDate);
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
        if (!newStatus) return;

        try {
            const res = await fetch(`http://127.0.0.1:8008/todos/${activeId}/status?status=${newStatus}`, {
                method: "POST"
            });
            
            if (res.ok) {
                await fetchTodos();
                updateTodoCounts();
            }
        } catch (err) {
            console.error("Todo 상태 변경 실패:", err);
        }
    };

    const handleCheck = (id, status) => {
        if (!todos[status]) return;
        
        setTodos((prevTodos) => ({
            ...prevTodos,
            [status]: prevTodos[status].map((item) =>
                item.id === id ? { ...item, completed: !item.completed } : item
            ),
        }));
    };

    const saveEdit = async (id, status) => {
        if (!todos[status]) return;
        const originalTodo = todos[status].find(todo => todo.id === id);
        if (!originalTodo) return;
        const updatedData = {
            text: localEditContent,
            user_id: username,
            deadline: localEditDueDate.includes('.') 
                ? localEditDueDate.replaceAll('.', '-') 
                : localEditDueDate,
            project_id: Pg_id,
            start_day: originalTodo.start_day,  // ✅ 기존 값 그대로 반영

        };

        try {
            const response = await fetch(`http://127.0.0.1:8008/todos/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedData),
            });

            if (response.ok) {
                setTodos((prevTodos) => ({
                    ...prevTodos,
                    [status]: prevTodos[status].map((item) =>
                        item.id === id ? { ...item, content: localEditContent, dueDate: updatedData.deadline } : item
                    ),
                }));
                setEditingId(null);
                window.location.reload()

            }
        } catch (error) {
            console.error("Todo 수정 실패:", error);
        }
    };
    const handleDelete = async (id, status) => {
        if (!todos[status]) return;
    
        try {
            const response = await fetch(`http://127.0.0.1:8008/todos/${id}?project_id=${Pg_id}`, {
                method: "DELETE",
            });
    
            if (response.ok) {
                await fetchTodos();
                updateTodoCounts();
                window.location.reload()
            }
        } catch (error) {
            console.error("Todo 삭제 실패:", error);
        }
    };
    const handleDeleteWithModal = (id, status) => {
        setModal_realMsg('정말 삭제하시겠습니까?');
        setPendingAction(() => () => handleDelete(id, status));
        setShowCancelModal(true);
    };
    
    // Sortable Item 컴포넌트
    const SortableItem = ({ id, content, dueDate, status, completed }) => {
        const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
            id, data: { status }, handle: '.drag-handle',
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
                    <div className="edit-form edit-form-Pc">
                        <input
                            ref={inputRef}
                            type="text"
                            value={localEditContent}
                            onChange={(e) => setLocalEditContent(e.target.value)}
                            placeholder="할 일 내용을 입력하세요"
                        />
                        <input
                            type="date"
                            value={localEditDueDate}
                            onChange={(e) => setLocalEditDueDate(e.target.value)}
                        />
                        <div className="edit-buttons edit-buttons-Pc">
                            <button className="save" onClick={() => saveEdit(id, status)}>저장</button>
                            <button className="cancle" onClick={() => setEditingId(null)}>취소</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="todo-content">
                            <span className="drag-handle" {...attributes} {...listeners}>≡</span>
                            <div 
                                style={{ textDecoration: completed ? 'line-through' : 'none' }}
                                onClick={() => handleEdit(id, content, dueDate)} // 클릭으로 편집 모드 진입
                            >
                                {content}
                            </div>
                            <span className="due-date">{calculateDDay(dueDate)}</span>
                        </div>
                        <div className="todo-meta">
                            <span>{dueDate}까지</span>
                            <div className="icons">
                                <img
                                    src={EditIcon}
                                    alt="edit"
                                    className="icon edit"
                                    onClick={() => handleEdit(id, content, dueDate)}
                                />
                                <img
                                    src={DeleteIcon}
                                    alt="delete"
                                    className="icon trash"
                                    onClick={() => handleDeleteWithModal(id, status)} // 모달로 변경
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

    // Todo Column 컴포넌트
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
                    <img src={EditIcon} alt="edit" className="icon" onClick={onDetail} />
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
    const [modal_realMsg, setModal_realMsg] = useState('');
    const [pendingAction, setPendingAction] = useState(null);
    const [pendingMove, setPendingMove] = useState(null);

    const [todoEditModal, setTodoEditModal] = useState({
        isOpen: false,
        todoId: null
    });
    const [selectedTodoId, setSelectedTodoId] = useState(null);
    const timelineRef = useRef(null);
 

    // 그룹 모두보기 핸들러
    const handleShowAllGroups = () => {
        const updatedGroups = groups.get().map(group => ({
            ...group,
            visible: true
        }));
        groups.update(updatedGroups);
    };
    // 컬러 설정 
    const colorClasses = [
    'color-red',   // 빨강
    'color-blue',  // 파랑
    'color-green', // 초록  ,
    'color-orange','color-gray' ,'color-purple','color-yellow','color-pink','color-cyan','color-teal','color-brouwn','color-navy'
    ];  
    const groupColorMap = useRef({});  
    const colorIndex = useRef(0);
    function getGroupColorClass(groupId) {
    if (!groupColorMap.current[groupId]) {
        groupColorMap.current[groupId] = colorClasses[colorIndex.current];
        colorIndex.current = (colorIndex.current + 1) % colorClasses.length;
    }
    return groupColorMap.current[groupId];
    }


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
            // 모든 담당자 ID 수집 (배열 형태로 처리)
            const allUserIds = new Set();
            timelineTodos.forEach(todo => {
                if (Array.isArray(todo.user_id)) {
                    todo.user_id.forEach(userId => allUserIds.add(userId));
                } else if (todo.user_id) {
                    allUserIds.add(todo.user_id);
                }
            });
            
            const uniqueUsers = Array.from(allUserIds);
            const userProfileMap = {};
            
            // 프로필 이미지 먼저 가져오기
            await Promise.all(
                uniqueUsers.map(async (userId) => {
                    try {
                        const res = await fetch(`http://localhost:8008/users/${userId}/profile`);
                        if (!res.ok) {
                            console.error(`Failed to fetch profile for user ${userId}. Status: ${res.status}`);
                            userProfileMap[userId] = '/default_profile.png';
                            return;
                        }
                        const data = await res.json(); 
                        if (data && data.profile_image_url) {
                            userProfileMap[userId] = data.profile_image_url;
                        } else {
                            console.warn(`Profile image URL not found for user ${userId}`);
                            userProfileMap[userId] = '/default_profile.png';
                        }
                    } catch (error) {
                        console.error(`Error fetching profile for user ${userId}:`, error);
                        userProfileMap[userId] = '/default_profile.png';
                    }
                })
            );

            // 내가 포함된 할 일만 필터링
            const myTodos = timelineTodos;

            // 그룹 생성 (내가 포함된 할 일의 모든 담당자)
            const groupUsers = new Set();
            myTodos.forEach(todo => {
                const assignees = Array.isArray(todo.user_id) ? todo.user_id : [todo.user_id];
                assignees.forEach(userId => groupUsers.add(userId));
            });

            const groupData = Array.from(groupUsers).map((user, idx) => ({
                id: user,
                content: user,
                value: idx + 1,
                className: 'groupStyle',
            }));
            setGroups(new DataSet(groupData));

            // MODIFIED: 각 담당자별로 별도의 타임라인 아이템 생성
            const mappedItems = [];
            myTodos
            .filter(todo => todo.deadline)
            .forEach(todo => {
                const start = new Date(todo.start_day || todo.deadline);
                const end = new Date(todo.deadline);
                end.setDate(end.getDate());
                
                const assignees = Array.isArray(todo.user_id) ? todo.user_id : [todo.user_id];
                const assigneeProfiles = assignees.map(userId => ({
                    userId,
                    profileUrl: userProfileMap[userId] || '/default_profile.png'
                }));

                assignees.forEach((assignee, index) => {
                mappedItems.push({
                    id: `${todo.id}_${assignee}`,
                    original_id: todo.id,
                    start,
                    end,
                    group: assignee,
                    content: todo.text,
                    className: `item-common ${getGroupColorClass(assignee)}`,
                    editable: true,
                    assignee_profiles: assigneeProfiles,
                    assignees: assignees,
                    todo_data: todo
                });
                });
            });

            
            setTimelineItems(new DataSet(mappedItems));
        };
        
        fetchProfilesAndSetItems();
    }, [timelineTodos, username]);
// 3. 진행도 데이터 가져오기 (추가)
    useEffect(() => {
        const fetchProgress = async () => {
            const progressData = {};
            for (const todo of timelineTodos) {
                try {
                    const res = await fetch(`http://localhost:8008/todos/${todo.id}/progress`);
                    if (res.ok) {
                        const data = await res.json();
                        progressData[todo.id] = data.progress || 0;
                    }
                } catch (error) {
                    console.error(`진행도 가져오기 실패 (${todo.id}):`, error);
                    progressData[todo.id] = 0;
                }
            }
            setTodoProgress(progressData);
        };

        if (timelineTodos.length > 0) {
            fetchProgress();
        }
    }, [timelineTodos]);
// 4. 타임라인 옵션 렌더링 (수정된 부분)
    useEffect(() => {
        if (!timelineRef.current) return;
        if (timelineItems.length === 0 || groups.length === 0) return;
        
        const today = new Date();
        const options = {
            groupOrder: 'content',
            editable: {
                updateTime: true,
                updateGroup: false,
                overrideItems: false,
                add: false,
            },
            orientation: 'top',
            margin: { item: 30, axis: 50 },
            zoomable: true,
            zoomKey: 'ctrlKey',
            itemsAlwaysDraggable: false,
            stack: true,
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
                minorLabels: { day: 'M월 D일' },
                majorLabels: { day: '' },
            },
            zoomMin: 1000 * 60 * 60 * 24 * 5, 
            zoomMax: 1000 * 60 * 60 * 24 * 30,  
            dataAttributes: ['id'],
            
            // 타임라인 아이템 템플릿
            template: function (item) {
                // FIXED: original_id를 사용하여 진행도 가져오기
                const progress = todoProgress[item.original_id] || 0;
                
                // 담당자 프로필 이미지들 생성
                let profileImagesHtml = '';
                if (item.assignee_profiles && item.assignee_profiles.length > 0) {
                    profileImagesHtml = item.assignee_profiles.map(profile => 
                        `<img src="${profile.profileUrl}" class="timeline-avatar" data-user="${profile.userId}" title="${profile.userId}"/>`
                    ).join('');
                }
                
                const html = `<div class="timeline-card">
                    <div class="timeline-title">${item.content}</div>
                    <div class="progress-container">
                        <div class="timeline-avatars">${profileImagesHtml}</div>
                        <div>${progress}%</div>
                    </div>
                </div>`;
                return html;
            },

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
        console.log('todoProgress', todoProgress);

        const timeline = new Timeline(timelineRef.current, timelineItems, groups, options);          
        
        timeline.on('doubleClick', (properties) => {
            if (properties.item) {
                const item = timelineItems.get(properties.item);
                setTodoEditModal({
                    isOpen: true,
                    todoId: item.original_id || item.id // 원본 ID 사용
                });
            }
        });

        // 타임라인 렌더링 후 스타일 적용
        setTimeout(() => {
            const itemContents = timelineRef.current.querySelectorAll('.vis-item-content');
            itemContents.forEach(content => {
                const divider = content.querySelector('.timeline-divider');
                if (divider) {
                    // 기존에 progressContainer가 있으면 제거
                    const existing = divider.querySelector('.progress-bar-fill');
                    if (existing) divider.removeChild(existing.parentElement);
        
                    const progress = parseInt(divider.getAttribute('data-progress')) || 0;
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
                    
                    // 진행도 바 설정
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
        
                    progressContainer.appendChild(progressFill);
                    divider.appendChild(progressContainer);
                    divider.appendChild(progressText);
                }
            });
        }, 100);
        
        
        // 프로필 이미지 오류 처리
        setTimeout(() => {
            const images = timelineRef.current.querySelectorAll('.timeline-avatar');
            images.forEach(img => {
                img.onerror = async function(e) {
                    const userId = e.target.dataset.user;
                    try {
                        const res = await fetch(`http://localhost:8008/users/${userId}/profile`);
                        if (res.ok) {
                            const data = await res.json();
                            e.target.src = data.profile_image_url || '/default_profile.png';
                        } else {
                            e.target.src = '/default_profile.png';
                        }
                    } catch {
                        e.target.src = '/default_profile.png';
                    }
                };
            });
        }, 200);
        handleShowAllGroups();

        timeline.on('ready', () => {
            handleShowAllGroups();
            setTimeout(() => {
                window.scrollTo(0, 0);
            }, 100);
        });

        return () => timeline.destroy();
    }, [timelineItems, groups, todoProgress, username]);

    console.log(groups,"dddddddddddddddddd")


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
        if (pendingAction) {
            await pendingAction();
            setPendingAction(null);
        }
        if (!pendingMove) return;
        await handleMoveConfirm(pendingMove.item, pendingMove.callback);
        setPendingMove(null);            window.location.reload();

    };
    const handleCancel = () => {
        setShowCancelModal(false);
        setPendingAction(null);
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
    
            // FIXED: original_id 사용
            const todoId = item.original_id || item.id;
            const res = await fetch(`http://localhost:8008/todos/${todoId}/schedule`, {
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
                handleShowAllGroups()
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
    
    /* ========================================================= */
    /* =================    피드백 관리    ===================== */
    /* ========================================================= */
    const [folders, setFolders] = useState([]);
    const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);
    const [shouldRefresh, setShouldRefresh] = useState(false);

    useEffect(() => {
        if (!projectInfoId) return;

        const fetchFilesAndFolders = async () => {
            try {
                // 📁 폴더 트리 가져오기
                const folderResponse = await fetch(`http://localhost:8008/projects/${projectInfoId}/folders/tree`);
                const folderData = folderResponse.ok ? await folderResponse.json() : [];

                // 📄 파일 목록 가져오기
                const fileResponse = await fetch(`http://localhost:8008/projects/${projectInfoId}/files`);
                const fileData = fileResponse.ok ? await fileResponse.json() : [];

                // 폴더 매핑
                const mappedFolders = folderData.map(folder => ({
                    name: folder.name,
                    createdAt: new Date(folder.createdAt).toLocaleString(),
                    type: 'folder',
                    image: 'folderIcon.png'
                }));

                // 파일 매핑
                const mappedFiles = fileData.map(file => ({
                    name: file.name,
                    createdAt: new Date(file.uploaded_at).toLocaleString(),
                    type: 'file',
                    image: 'fileIcon.png',
                    s3Url: file.s3_url,
                    size: file.size ?? 0
                }));

                // 🧩 폴더 + 파일 합치기
                setFolders([...mappedFolders, ...mappedFiles]);

            } catch (err) {
                console.error("작업물 데이터 불러오기 실패:", err);
            }
        };

        fetchFilesAndFolders();
        setShouldRefresh(false);
    }, [projectInfoId, shouldRefresh]);


    const handleMoreClick = () => {
        setShowFeedbackPopup(true);
    };

    const handleClosePopup = () => {
        setShowFeedbackPopup(false);
        setShouldRefresh(true);
    };


   //=====================================================================//
    // ------------------------   라이브 챗       ------------------------ //
    //=====================================================================//
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const wsRef = useRef(null);
    const messagesEndRef = useRef(null);
    const [loginUserId, setLoginUserId] = useState(null);
    const [loginUserName, setLoginUserName] = useState(null);


    // JWT 파싱 함수 (최초 1회 파싱)
    const decodeJWT = (token) => {
        if (!token) return {};
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return {
                userId: payload.sub,
                userName: payload.name || payload.sub
            };
        } catch {
            return {};
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        const { userId, userName } = decodeJWT(token);
        setLoginUserId(userId);
        setLoginUserName(userName);
    }, []);

    // 최초 Redis에 저장된 이전 메시지 불러오기
    useEffect(() => {
        if (!Pg_id || !loginUserId) return;

        const fetchPreviousMessages = async () => {
            try {
                const res = await fetch(`http://localhost:8008/livechat/${Pg_id}`);
                if (!res.ok) throw new Error("이전 채팅 불러오기 실패");


                const data = await res.json();
                const loadedMessages = data.map(msg => ({
                    ...msg,
                    sender: msg.sender_id === loginUserId ? "me" : "other",
                    name: msg.sender_name,
                    time: new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
                }));
                setMessages(loadedMessages);
            } catch (err) {
                console.error("이전 메시지 불러오기 에러:", err);
            }
        };

        fetchPreviousMessages();
    }, [Pg_id, loginUserId]);

    //  WebSocket 연결 (loginUserId 준비된 이후 연결)
    useEffect(() => {
        if (!Pg_id || !loginUserId) return;

        const ws = new WebSocket(`ws://localhost:8008/ws/livechat/${Pg_id}`);
        wsRef.current = ws;

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            const newMessage = {
                ...msg,
                sender: msg.sender_id === loginUserId ? "me" : "other",
                name: msg.sender_name,
                time: new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
            };
            setMessages(prev => [...prev, newMessage]);
        };

        ws.onclose = () => console.log("WebSocket Closed");
        ws.onerror = (err) => console.error("WebSocket Error:", err);

        return () => {
            ws.close();
        };
    }, [Pg_id, loginUserId]);

    useEffect(() => {
        const ws = new WebSocket("ws://localhost:8008/ws/livechat/notification");

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            console.log("📢 알림 도착:", msg);
        };

        ws.onclose = () => console.log("알림 WebSocket Closed");

        return () => ws.close();
    }, []);



    //  메시지 전송
    const sendMessage = () => {
        if (!input.trim() || !loginUserId || !loginUserName) return;

        const wsMessage = {
            sender_id: loginUserId,
            sender_name: loginUserName,
            text: input,
        };

        console.log("메시지 전송:", wsMessage);
        wsRef.current?.send(JSON.stringify(wsMessage));
        setInput('');
    };

    //  스크롤 자동 내려가기
    useEffect(() => {
    const container = messagesEndRef.current?.parentNode;
    if (container) {
        container.scrollTop = container.scrollHeight;
    }
    }, [messages]);

    //  이름 토글
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

    // 라이브챗 유저 프로필 관련
    const [chatProfileMap, setChatProfileMap] = useState({});
    useEffect(() => {
        if (!messages.length) return;

        const fetchProfiles = async () => {
            const userIds = [...new Set(messages.map(msg => msg.sender_id))];
            const map = {};

            await Promise.all(userIds.map(async (userId) => {
                try {
                    const res = await fetch(`http://localhost:8008/users/${userId}/profile`);
                    if (res.ok) {
                        const data = await res.json();
                        map[userId] = data?.profile_image_url || '/default_profile.png';
                    } else {
                        map[userId] = '/default_profile.png';
                    }
                } catch {
                    map[userId] = '/default_profile.png';
                }
            }));

            setChatProfileMap(map);
        };

        fetchProfiles();
    }, [messages]);

    



    //플젝아이디없을때
    if (!Pg_id) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '60vh',
                textAlign: 'center',
                color: '#666'
            }}>
                <h2 style={{ marginBottom: '20px', color: '#333' }}>
                    📋 프로젝트를 선택해주세요
                </h2>
                <p style={{ fontSize: '16px', lineHeight: '1.5' }}>
                    대시보드에서 프로젝트를 선택하면<br />
                    프로젝트 관리 기능을 사용할 수 있습니다.
                </p>
            </div>
        );
    }





    /* ========================================================= */
    /* =================    메인 렌더링    ==================== */
    /* ========================================================= */
    return (
        <div className="content">
            <div className="contentTitle">{projectName}</div>
            <div className="projectContent">
                {/* 공지사항 */}
                <div className="gonji box1">
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
                                onChange={(e) => setTempContent(e.target.value)}
                                placeholder='현재 수정하는 공지는 모두가 볼 수 있습니다.'
                            />
                            <div>
                            <button className="saveBtn" onClick={()=>setshowGonjiModal(true)}>저장</button>
                            <button className="cancelBtn" onClick={handleCancelClick}>취소</button></div>
                        </div>
                    ) : (
                        <>

                        <div className="gonjiText">{notice}</div>

                        <div className="gonjiEdit">
                        <img 
                            src={Edit} 
                            alt="edit" 
                            onClick={handleEditClick} 
                            style={{ cursor: 'pointer', opacity: 0.8 }}
                        />
                    </div>

                    </>
                    )}


                </div>

                {/* 캘린더 */}
                <div className="calendar box1">
                    <div className="calendarTop">
                        <div className="date">{currentMonth + 1}월</div>
                        <div className="temp">
                            <div className="moveBtn left" onClick={handleLeftWeek}>
                                <img src={leftBtn} alt="leftBtn" />
                            </div>
                            <div className="moveBtn right" onClick={handleRightWeek}>
                                <img src={rightBtn} alt="rightBtn" />
                            </div>
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
                                {date !== '_' && date.toDateString() === today.toDateString() && 
                                    <div className="calendarTodayDot">●</div>
                                }
                            </div>
                        ))}
                    </div>
                </div>

                {/* Todo 상태 */}
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
                        <div className="objectCount">{totalCount}</div>
                        <div className="objectTitle">전체 할 일</div>
                    </div>
                </div>

                {/* 타임라인 */}
                <div className="timeLine">
                    <div className="title">
                        타임라인 
                        <img onClick={handleShowAllGroups} id="showAllGroup" src={rechange} alt="모두보기" />
                    </div>
                    <div style={{ height: '475px', overflowY: 'auto', position: 'relative' }}>
                    {/* 안내 문구 조건부 렌더링 */}
                    {timelineItems.length === 0 && (
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            color: '#888',
                            fontSize: '16px',
                            textAlign: 'center'
                        }}>
                            현재 할 일이 없습니다.
                        </div>
                    )}                        
                    <div ref={timelineRef} className="vis-timeline-container" />
                    </div>
                </div>

                {/* Todo 칸반 */}
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
                                    onDetail={() => setShowDetail({ open: true, status: "waiting_feedback" })}
                                />
                            </div>
                        </DndContext>
                    </div>
                </div>

                {/* 실시간 채팅 */}
                <div className="liveChat">
                    <div className="title">실시간 채팅</div>
                    <div className="content box1">
                        <div className="chatMessages">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`chatMessageWrapper ${msg.sender}`}>
                                    {msg.sender === 'other' && (
                                        <div className="chatRow">
                                            <img 
                                                src={chatProfileMap[msg.sender_id] || '/default_profile.png'} 
                                                alt="profile" 
                                                className="chatProfileAvatarOther"
                                            />
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
                                            <img 
                                                src={chatProfileMap[loginUserId] || '/default_profile.png'} 
                                                alt="profile" 
                                                className="chatProfileAvatarMe"
                                            />
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
                                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                                placeholder="메시지를 입력하세요..."
                            />
                            <button onClick={sendMessage}>
                                <img src={sendIcon} alt="전송" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* 작업물 피드백 */}
                <div className="feedback">
                    <div className="top">
                        <div className="title_top">작업물 피드백</div>
                        <div className="more" onClick={handleMoreClick}>더보기</div>
                    </div>
                    <div className="content-feedback box1">
                        <div className="folderPreview">
                            {folders.slice(0, 6).map((folder, index) => (
                                <div key={index} className={`folderPreSee ${folder.type}PreSee`}>
                                    <div className="folderDate">{folder.createdAt}</div>
                                    <div className="fileItem">
                                        <img
                                            src={folder.type === 'folder' ? '/folderIcon.png' : '/fileIcon.png'}
                                            className="folderIcon"
                                            alt={folder.type === 'folder' ? 'Folder Icon' : 'File Icon'}
                                        />
                                        <ToggleNameDisplay name={folder.name} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 모달들 */}
            {showCancelModal && (
                <>
                    <div className="modal_overlay"></div>
                    <div className="modal_Pc">
                        <div className="modal_emoji">😶</div>
                        <div className="modal_realMsg">
                            {modal_realMsg || '정말 일정을 옮기시겠습니까?'}
                        </div>
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
            {showGonjiModal && (
                <>
                    <div className="modal_overlay"></div>
                    <div className="modal_Pc">
                        <div className="modal_emoji">😶</div>
                        <div className="modal_realMsg">
                            {modal_realMsg || '정말 공지를 수정하시겠습니까?'}
                        </div>
                        <div className="modal-buttons_Pc">
                            <button onClick={handleCancelClick}>취소</button>
                            <button onClick={handleSaveClick}>네</button>
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

            {showFeedbackPopup && (
                <FeedbackPopup 
                    onClose={handleClosePopup} 
                    username={username} 
                    projectId={projectInfoId}
                    onUpdate={handleTodoUpdate}
                />
            )}
        </div>
    );
};

export default ProjectContent;
