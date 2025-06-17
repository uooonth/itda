// TodoEditModal.jsx
import React, { useState, useEffect,location } from 'react';
import '../../../css/todoEdit.css';

const DONT_SHOW_EDIT_KEY = 'dontShowEditModal';
const DONT_SHOW_DELETE_KEY = 'dontShowDeleteModal';

const TodoEditModal = ({ isOpen, onClose, todoId, onUpdate, projectId }) => {
    const [todoData, setTodoData] = useState({
        text: '',
        deadline: '',
        start_day: '',
        progress: 0,
        participants: [],
        background_color: '#ffffff'
    });
    const [projectMembers, setProjectMembers] = useState([]);
    const [loading, setLoading] = useState(false);

    const colorOptions = [
        '#ffffff', '#ffebee', '#e8f5e8', '#e3f2fd', '#fff3e0',
        '#f3e5f5', '#fce4ec', '#e0f2f1', '#e8eaf6', '#fff8e1'
    ];

    // 모달 상태
    const [showEditConfirm, setShowEditConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [dontShowEdit, setDontShowEdit] = useState(false);
    const [dontShowDelete, setDontShowDelete] = useState(false);

    useEffect(() => {
        if (isOpen && todoId) {
            fetchTodoDetails();
            fetchProjectMembers();
        }
    }, [isOpen, todoId]);

    const fetchTodoDetails = async () => {
        try {
            const response = await fetch(`http://localhost:8008/todos/${todoId}/details`);
            if (response.ok) {
                const data = await response.json();
                setTodoData(data);
            }
        } catch (error) {
            console.error('TODO 상세 정보 가져오기 실패:', error);
        }
    };

    const fetchProjectMembers = async () => {
        try {
            const response = await fetch(`http://localhost:8008/projects/${projectId}/members`);
            if (response.ok) {
                const members = await response.json();
                setProjectMembers(members);
            }
        } catch (error) {
            console.error('프로젝트 멤버 가져오기 실패:', error);
        }
    };

    // 모달 띄우기 전 체크
    const handleEditClick = () => {
        const dontShow = localStorage.getItem(DONT_SHOW_EDIT_KEY);
        if (dontShow && Date.now() < Number(dontShow)) {
            // 바로 저장
            handleSave();
        } else {
            setShowEditConfirm(true);
        }
    };

    const handleDeleteClick = () => {
        const dontShow = localStorage.getItem(DONT_SHOW_DELETE_KEY);
        if (dontShow && Date.now() < Number(dontShow)) {
            // 바로 삭제
            handleDelete();
        } else {
            setShowDeleteConfirm(true);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // 1. 텍스트, 날짜, 참여자 등 일반 정보 업데이트
            const response = await fetch(`http://localhost:8008/todos/${todoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: todoData.text,
                    deadline: todoData.deadline,
                    start_day: todoData.start_day,
                    participants: todoData.participants,
                    background_color: todoData.background_color
                }),
            });
    
            if (response.status !== 200 && response.status !== 204) {
                alert('할일 정보 수정에 실패했습니다.');
                return;
            }
            
    
            // 2. 진행도 별도 업데이트
            const progressResponse = await fetch(`http://localhost:8008/todos/${todoId}/progress?progress=${todoData.progress}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
            });
    
            if (!progressResponse.ok) {
                const errMsg = await progressResponse.text();
                console.error('진행도 업데이트 실패:', errMsg);
                alert('진행도 수정에 실패했습니다.');
                return;
            }
    
            // 3. 성공 시
            onClose();
            window.location.reload(true);
    
        } catch (error) {
            console.error('저장 중 오류 발생:', error);
            alert('서버 오류로 인해 저장에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };
    

    const handleDelete = async () => {
        try {
            const response = await fetch(`http://localhost:8008/todos/${todoId}?project_id=${projectId}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                onClose();
                window.location.reload(); // ✅ 삭제 후 새로고침
            } else {
                const errMsg = await response.text();
                console.error('TODO 삭제 실패:', errMsg);
                alert('삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('TODO 삭제 오류:', error);
            alert('서버 오류로 인해 삭제에 실패했습니다.');
        }
    };
    
    // 모달에서 "네" 클릭 시
    const handleEditConfirm = () => {
        if (dontShowEdit) {
            localStorage.setItem(DONT_SHOW_EDIT_KEY, String(Date.now() + 24 * 60 * 60 * 1000));
        }
        setShowEditConfirm(false);
        handleSave();
    };

    const handleDeleteConfirm = () => {
        if (dontShowDelete) {
            localStorage.setItem(DONT_SHOW_DELETE_KEY, String(Date.now() + 24 * 60 * 60 * 1000));
        }
        setShowDeleteConfirm(false);
        handleDelete();
    };

    // 모달 닫기
    const handleCancel = () => {
        setShowEditConfirm(false);
        setShowDeleteConfirm(false);
        setDontShowEdit(false);
        setDontShowDelete(false);
    };

    const handleParticipantToggle = (memberId) => {
        setTodoData(prev => ({
            ...prev,
            participants: prev.participants.includes(memberId)
                ? prev.participants.filter(id => id !== memberId)
                : [...prev.participants, memberId]
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="todo-edit-modal-overlay">
            <div className="todo-edit-modal">
                <div className="modal-header">
                    <h3>할일 수정</h3>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="modal-content">
                    {/* 할일 내용 */}
                    <div className="form-group">
                        <label>할일 내용</label>
                        <input
                            type="text"
                            value={todoData.text}
                            onChange={(e) => setTodoData(prev => ({ ...prev, text: e.target.value }))}
                            placeholder="할일을 입력하세요"
                        />
                    </div>
                    {/* 시작일/마감일 */}
                    <div className="form-row">
                        <div className="form-group">
                            <label>시작일</label>
                            <input
                                type="date"
                                value={todoData.start_day}
                                onChange={(e) => setTodoData(prev => ({ ...prev, start_day: e.target.value }))}
                            />
                        </div>
                        <div className="form-group">
                            <label>마감일</label>
                            <input
                                type="date"
                                value={todoData.deadline}
                                onChange={(e) => setTodoData(prev => ({ ...prev, deadline: e.target.value }))}
                            />
                        </div>
                    </div>
                    {/* 진행도 */}
                    <div className="form-group">
                        <label>진행도: {todoData.progress}%</label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={todoData.progress}
                            onChange={(e) => setTodoData(prev => ({ ...prev, progress: parseInt(e.target.value) }))}
                            className="progress-slider"
                        />
                    </div>
                    {/* 참여자 선택 */}
                    <div className="form-group">
                        <label>참여자</label>
                        <div className="participants-list">
                            {projectMembers.map(member => (
                                <div
                                    key={member.id}
                                    className={`participant-item ${todoData.participants.includes(member.id) ? 'selected' : ''}`}
                                    onClick={() => handleParticipantToggle(member.id)}
                                >
                                    <img src={member.profile_image} alt={member.name} />
                                    <span>{member.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* 배경색 선택 */}
                    <div className="form-group">
                        <label>배경색</label>
                        <div className="color-options">
                            {colorOptions.map(color => (
                                <div
                                    key={color}
                                    className={`color-option ${todoData.background_color === color ? 'selected' : ''}`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setTodoData(prev => ({ ...prev, background_color: color }))}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="delete-btn" onClick={handleDeleteClick}>삭제</button>
                    <div className="action-buttons">
                        <button className="cancel-btn" onClick={onClose}>취소</button>
                        <button
                            className="save-btn"
                            onClick={handleEditClick}
                            disabled={loading}
                        >
                            {loading ? '저장 중...' : '저장'}
                        </button>
                    </div>
                </div>
            </div>

            {/* 수정 확인 모달 */}
            {showEditConfirm && (
                <>
                    <div className="modal_overlay"></div>
                    <div className="modal_Pc">
                        <div className="modal_emoji">✏️</div>
                        <div className="modal_realMsg">정말 일정을 수정하시겠습니까?</div>
                        <div className="modal-buttons_Pc">
                            <button onClick={handleCancel}>취소</button>
                            <button onClick={handleEditConfirm}>네</button>
                        </div>
                        <label className="modal_dontShow">
                            <input
                                type="checkbox"
                                checked={dontShowEdit}
                                onChange={() => setDontShowEdit(v => !v)}
                            />
                            다시 보지 않기 (24시간)
                        </label>
                    </div>
                </>
            )}
            {/* 삭제 확인 모달 */}
            {showDeleteConfirm && (
                <>
                    <div className="modal_overlay"></div>
                    <div className="modal_Pc">
                        <div className="modal_emoji">🗑️</div>
                        <div className="modal_realMsg">정말 일정을 삭제하시겠습니까?</div>
                        <div className="modal-buttons_Pc">
                            <button onClick={handleCancel}>취소</button>
                            <button onClick={handleDeleteConfirm}>네</button>
                        </div>
                        <label className="modal_dontShow">
                            <input
                                type="checkbox"
                                checked={dontShowDelete}
                                onChange={() => setDontShowDelete(v => !v)}
                            />
                            다시 보지 않기 (24시간)
                        </label>
                    </div>
                </>
            )}
        </div>
    );
};

export default TodoEditModal;
