import React,{useState,useEffect,useMemo,useRef} from 'react';
import { useParams,useLocation  } from 'react-router-dom';
import Picker from 'emoji-picker-react';
import Edit from '../../icons/edit.svg';
import leftBtn from '../../icons/left.svg';
import rightBtn from '../../icons/righ.svg';
import rechange from '../../icons/rechange.svg';

import FeedbackPopup from './popups/feedback';
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

    //===================================================================== //
    // ------------------------  프로젝트정보 불러오기  -----------------------//
    //===================================================================== // 
    const { Pg_id } = useParams(); 
    console.log(Pg_id,)
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



    //===================================================================== //
    // ------------------------  공지 불러오기(redis)  -----------------------//
    //===================================================================== // 

    const [notice, setNotice] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [tempContent, setTempContent] = useState(''); 


    useEffect(() => {
        console.log(Pg_id)
        const fetchNotice = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`http://127.0.0.1:8008/project/${projectInfo.id}/notice`);
                if (!response.ok) {
                    setTempContent('');
                }
                const data = await response.json();
                setNotice(data.content);
            } catch (err) {
                setError(err.message);
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
        const dateValue = e.target.value;
    
        if (dateValue.includes('.')) {
            const [year, month, day] = dateValue.split('.');
            const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            setLocalEditDueDate(formattedDate);
        } else {
            setLocalEditDueDate(dateValue);
        }
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
                throw new Error("공지사항 수정에 실패했습니다.");
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
  
    // 상태별 Todo 개수 가져오기
    const todoCount = async (status, setter) => {
      try {
        const response = await fetch(`http://127.0.0.1:8008/projects/${Pg_id}/todos/status/${status}`);
        const data = await response.json();
        setter(data.todos.length);
      } catch (error) {
        console.error("Error fetching todos: ", error);
      }
    };
  
    useEffect(() => {
      if (Pg_id) {
        todoCount("in_progress", setInProgressCount);
        todoCount("completed", setCompletedCount);
        todoCount("waiting_feedback", setWaitingFeedbackCount);
        setTotalCount(inProgressCount + completedCount + waitingFeedbackCount);
      }
    }, [Pg_id, inProgressCount, completedCount, waitingFeedbackCount]);
  










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
    // ------------------------       타임라인       ------------------------//
    //===================================================================== // 
    const timelineRef = useRef(null);
    const groups = useMemo(
        () =>
            new DataSet([
                { id: '서지혜', content: '서지혜', value: 1, className:'groupStyle' },
                { id: '박지수', content: '박지수', value: 2, className:'groupStyle'},
                { id: '황윤성', content: '황윤성', value: 3, className:'groupStyle'},
            ]),
        []
    );
    const groupColors = {};
    const colorClasses = [
        'color-coral', 'color-mustard', 'color-lavender', 'color-mint', 
        'color-sky', 'color-orange', 'color-indigo', 'color-steel'
    ];  
    let colorIndex = 0;

    function getGroupColorClass(groupName) {
        if (!groupColors[groupName]) {
            groupColors[groupName] = colorClasses[colorIndex];
            colorIndex = (colorIndex + 1) % colorClasses.length; 
        }
        return groupColors[groupName];
    }
    const items = useMemo(
        () =>
            new DataSet([
                { start: new Date(2025, 3, 20), end: new Date(2025, 4, 5), group: '서지혜', content: '프로젝트 기획 회의 진행',        className: `item-common ${getGroupColorClass('서지혜')}` },
                { start: new Date(2025, 4, 1), end: new Date(2025, 4, 12), group: '황윤성', content: 'UI 디자인 초안 작성',        className: `item-common ${getGroupColorClass('황윤성')}` },
                { start: new Date(2025, 4, 5), end: new Date(2025, 4, 18), group: '박지수', content: '백엔드 API 개발',        className: `item-common ${getGroupColorClass('박지수')}` },
                { start: new Date(2025, 4, 10), end: new Date(2025, 4, 25), group: '서지혜', content: '프론트엔드 UI 구현',        className: `item-common ${getGroupColorClass('서지혜')}` },  
                { start: new Date(2025, 4, 8), end: new Date(2025, 4, 22), group: '서지혜', content: '데이터베이스 스키마 설계' ,       className: `item-common ${getGroupColorClass('서지혜')}` },
                { start: new Date(2025, 3, 10), end: new Date(2025, 3, 24), group: '황윤성', content: '프론트엔드 컴포넌트 구현',       className: `item-common ${getGroupColorClass('황윤성')}` },
                { start: new Date(2025, 4, 15), end: new Date(2025, 4, 30), group: '박지수', content: '테스트 및 디버깅 진행',        className: `item-common ${getGroupColorClass('박지수')}` },
                { start: new Date(2025, 4, 15), end: new Date(2025, 4, 30), group: '박지수', content: '테스트 및 디버깅 진행',        className: `item-common ${getGroupColorClass('박지수')}` },

                { start: new Date(2025, 4, 15), end: new Date(2025, 4, 30), group: '박지수', content: '테스트 및 디버깅 진행',        className: `item-common ${getGroupColorClass('박지수')}` },

                { start: new Date(2025, 4, 15), end: new Date(2025, 4, 30), group: '박지수', content: '테스트 및 디버깅 진행',        className: `item-common ${getGroupColorClass('박지수')}` },

                { start: new Date(2025, 4, 15), end: new Date(2025, 4, 30), group: '박지수', content: '테스트 및 디버깅 진행',        className: `item-common ${getGroupColorClass('박지수')}` },

                { start: new Date(2025, 4, 15), end: new Date(2025, 4, 30), group: '박지수', content: '테스트 및 디버깅 진행',        className: `item-common ${getGroupColorClass('박지수')}` },


            ]),
        []
    );
    useEffect(() => {
        if (!timelineRef.current) return;

        const today = new Date();

        const options = {
            groupOrder: 'content',
            editable: true,
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
                container.style.minHeight = group.minHeight || '180px'; // 개별 최소 높이 적용
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
            zoomMax: 1000 * 60 * 60 * 24 * 30,        };

        const timeline = new Timeline(timelineRef.current, items, groups, options);
        let currentTodayStr = moment().startOf('day').format('YYYY-MM-DD');
        // 오늘 날짜 셀 강조 
        const highlightTodayCell = () => {
            const minorCells = timelineRef.current?.querySelectorAll('.vis-time-axis .vis-minor');
            if (!minorCells) return;
        
            minorCells.forEach((cell) => {
                cell.classList.remove('today');
        
                const cellDate = cell.innerText.trim(); // 예: "4월 9일"
                const formattedCellDate = moment(cellDate, 'M월 D일').format('YYYY-MM-DD');
        
                if (formattedCellDate === currentTodayStr) {
                    cell.classList.add('today');
                }
                console.log(cellDate, formattedCellDate, currentTodayStr);
            });
        };
        
        setTimeout(() => {
            highlightTodayCell();
        }, 100); 
        setInterval(() => {
            const nowStr = moment().startOf('day').format('YYYY-MM-DD');
            if (nowStr !== currentTodayStr) {
                currentTodayStr = nowStr;
                highlightTodayCell();
            }
        }, 1000 * 60 * 60); 

    return () => {
        timeline.destroy();
    };
    }, [groups, items]);  

    // 그룹 모두보기 핸들러
    const handleShowAllGroups = () => {
        const updatedGroups = groups.get().map(group => ({
            ...group,
            visible: true
        }));
        groups.update(updatedGroups);
    };

    //===================================================================== //
    // ------------------------      투두 칸반       ------------------------//
    //===================================================================== // 
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
            try{
                const response = await fetch(`http://127.0.0.1:8008/projects/${Pg_id}/todos`);
                const data = await response.json();
                const inProgress = [];
                const completed = [];   
                const feedbackPending = [];

                for ( const todo of data){
                    const statusResponse = await fetch(`http://127.0.0.1:8008/todos/${todo.id}/status`);
                    const statusData = await statusResponse.json();

                    switch (statusData.status) {
                        case 'in_progress':
                            inProgress.push({id:todo.id, content: todo.text, dueDate: todo.deadline, completed: false});
                            break;
                        case 'completed':
                            completed.push({id:todo.id, content: todo.text, dueDate: todo.deadline, completed: true});
                            break;
                        case 'waiting_feedback':
                            feedbackPending.push({id:todo.id, content: todo.text, dueDate: todo.deadline, completed: false});
                            break;
                } }
                setTodos({ inProgress, completed, feedbackPending });
                updateTodoCounts();
            }catch(error){
                console.error(error.message);
        };};

        useEffect(() => {
            if (Pg_id) {
                fetchTodos();
            }
        }, [Pg_id]);

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
            if (active.id === over?.id) return;
        
            const activeContainer = Object.keys(todos).find((key) =>
                todos[key].some((item) => item.id === active.id)
            );
        
            if (!activeContainer) return;
        
            const overContainer = over?.data?.current?.status || over?.id;
        
            setTodos((prevTodos) => {
                const newTodos = { ...prevTodos };
                const sourceItems = [...newTodos[activeContainer]];
                const activeIndex = sourceItems.findIndex((item) => item.id === active.id);
                const [movedItem] = sourceItems.splice(activeIndex, 1);
        
                if (!overContainer) {
                    newTodos[activeContainer] = [...sourceItems, movedItem];
                    return newTodos;
                }
        
                const destItems = [...newTodos[overContainer]];
                destItems.push(movedItem);
                newTodos[activeContainer] = sourceItems;
                newTodos[overContainer] = destItems;
        
                const newStatusMap = {
                    inProgress: "in_progress",
                    completed: "completed",
                    feedbackPending: "waiting_feedback",
                };
        
                fetch(`http://127.0.0.1:8008/todos/${active.id}/status?status=${newStatusMap[overContainer]}`, {
                    method: "POST",
                })
                    .then((res) => {
                        if (!res.ok) {
                            console.error("Failed to update status");
                        } else {
                            fetchTodos(); 
                            updateTodoCounts();
                        }
                    })
                    .catch((err) => console.error(err));
        
                return newTodos;
            });
        };
        const updateTodoCounts = () => {
            if (Pg_id) {
                todoCount("in_progress", setInProgressCount);
                todoCount("completed", setCompletedCount);
                todoCount("waiting_feedback", setWaitingFeedbackCount);
                setTotalCount(inProgressCount + completedCount + waitingFeedbackCount);
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
        const saveEdit = async (id, status, userId, start_day) => {
            if (!todos[status]) return; 
            const existingTodo = todos[status].find((item) => item.id === id);
            if (!existingTodo) {
                console.error("해당 Todo를 찾을 수 없습니다.");
                return;
            }

            const updatedData = {
                text: localEditContent,
                user_id: username,
                deadline: localEditDueDate.includes('.') 
                    ? localEditDueDate.replaceAll('.', '-') 
                    : localEditDueDate,                     
                start_day: '2025-04-01',
                project_id: Pg_id, 
            };
            console.log(updatedData)
            try {
                const response = await fetch(`http://127.0.0.1:8008/todos/${id}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        text: localEditContent,
                        user_id: username,
                        deadline: localEditDueDate.includes('.') 
                            ? localEditDueDate.replaceAll('.', '-') 
                            : localEditDueDate,                     
                        start_day: '2025-04-01',
                        project_id: Pg_id, 
                    }),
                });
        
                if (!response.ok) {
                    return;
                }
        
                // 정상 응답 시 상태 업데이트
                setTodos((prevTodos) => ({
                    ...prevTodos,
                    [status]: prevTodos[status].map((item) =>
                        item.id === id ? { ...item, content: localEditContent, dueDate: updatedData.deadline } : item
                    ),
                }));
                setEditingId(null);
        
            } catch (error) {
            }
        };
        
        // 삭제 todo
        const handleDelete = async (id, status) => {
            if (!todos[status]) return;
        
            try {
                const response = await fetch(`http://127.0.0.1:8008/todos/${id}?project_id=${Pg_id}`, {
                    method: "DELETE",
                });
                setTodos((prevTodos) => ({
                    ...prevTodos,
                    [status]: prevTodos[status].filter((item) => item.id !== id),
                }));
                fetchTodos(); 
                updateTodoCounts();
        
            } catch (error) {
            }
        };
        

        const SortableItem = ({ id, content, dueDate, status, completed }) => {
            const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
                id,
                handle: '.drag-handle',
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
                                        src={EditIcon}
                                        alt="edit"
                                        className="icon"
                                        onClick={() => handleEdit(id, content, dueDate)}
                                    />
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
        
        const TodoColumn = ({ title, items, status }) => {
            const { setNodeRef } = useDroppable({
                id: status, // 각 컬럼의 고유 ID로 설정
                data: { status }, // 드롭 시 status 전달
            });

            return (
                <div ref={setNodeRef} className={`todo-column ${status}`}>
                    <div className="column-header">
                        <h2>{title}</h2>
                        <span>{`${items.length}/${totalTodosCount}`}</span>
                    </div>
                    <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
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
    // ------------------------    피드백 미리보기    -----------------------//
    //===================================================================== // 
    const [shouldRefresh, setShouldRefresh] = useState(false);
    const [folders, setFolders] = useState([]);
    const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);


    useEffect(() => {
        if (!projectInfo?.id) return;
    
        const fetchFiles = async () => {
            try {
                const response = await fetch(`http://localhost:8008/projects/${projectInfo.id}/files`);
                if (!response.ok) throw new Error("파일 로딩 실패");
    
                const data = await response.json();
    
                const mappedFiles = data.map(file => ({
                    name: file.name,
                    createdAt: new Date(file.uploaded_at).toLocaleString(),
                    type: 'file',
                    image: 'fileIcon.png',
                    s3Url: file.s3_url,
                    size: 0 
                }));
    
                setFolders(mappedFiles);
            } catch (err) {
                console.error("작업물 파일 불러오기 실패:", err);
            }
        };
    
        fetchFiles();
        setShouldRefresh(false); 
    }, [projectInfo?.id, shouldRefresh]);
    

    const handleMoreClick = () => {
        setShowFeedbackPopup(true);
    };

    const handleClosePopup = () => {
        setShowFeedbackPopup(false);
        setShouldRefresh(true); 
    };

const ToggleNameDisplay = ({ name }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div
            className={`folderName ${expanded ? 'expanded' : ''}`}
            onClick={() => setExpanded(!expanded)}
            title={name}
        >
            {name}
        </div>
    );
};



useEffect(() => {
  const now = new Date();
  const formattedTime = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const initialMessages = [
    {
      name: "침착맨",
      text: "안녕하세요! 여기는 실시간 채팅방입니다.",
      sender: "other",
      time: formattedTime,
    },
    {
      name: "나",
      text: "안녕하세요~!",
      sender: "me",
      time: formattedTime,
    },
  ];

  setMessages(initialMessages);
}, []);


    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    const sendMessage = () => {
    if (!input.trim()) return;
    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });

    const newMsg = {
        name: "나",
        text: input,
        sender: "me",
        time: formattedTime,
    };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    };

    useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);



    return (
        <div className="content">
            <div className="contentTitle">침착맨 유튜브  편집팀</div>
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
                        <div className="more">더보기</div>
                    </div>
                    <div className="content-todo">
                    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <div className="todo-board">
                        <TodoColumn title="진행중" items={todos.inProgress} status="inProgress" />
                        <TodoColumn title="완료" items={todos.completed} status="completed" />
                        <TodoColumn title="피드백 대기중" items={todos.feedbackPending} status="feedbackPending" />
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
                            <img src="pencilIcon.png" alt="입력" className="pencilIcon" />
                            <input 
                                type="text" 
                                value={input} 
                                onChange={(e) => setInput(e.target.value)} 
                                onKeyDown={(e) => e.key === "Enter" && sendMessage()} // 엔터 키로 전송
                                placeholder="메시지를 입력하세요..."
                            />
                            {/* 전송 버튼 */}
                            <button onClick={sendMessage}>
                                <img src="sendIcon.png" alt="전송" />
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

            
            {showFeedbackPopup && <FeedbackPopup onClose={handleClosePopup} username={username} projectId = {projectInfo.id}/>}

        </div>
    );
};

export default ProjectContent;