import React, { useState, useEffect } from "react";
import styled from "styled-components";
import axios from "axios";

const getStatusBgColor = (status) => {
    switch (status) {
      case "inProgress":
      case "in_progress":
        return "#e8f7ec";
      case "completed":
        return "#ffeaea";
      case "feedbackPending":
      case "feedback_pending":
        return "#f4f4f4";
      default:
        return "#f8fafd";
    }
  };
  
const getStatusFontColor = (status) => {
  switch (status) {
    case "inProgress":
    case "in_progress":
      return "#22b14c";
    case "completed":
      return "#ed1c24";
    case "feedbackPending":
    case "feedback_pending":
      return "#888";
    default:
      return "#3182f6";
  }
};

// 스타일 컴포넌트들은 동일...
const Container = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000000;

`;

const Content = styled.div`
  background: white;
  border-radius: 20px;
  padding: 48px;
  width: 95%;
  max-width: 1200px;
  height: 85vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
    border-bottom: 14px solid  ${props => props.$color};


`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e5e8eb;
`;

const TitleSection = styled.div`
  display: flex;
  gap: 16px;
`;

const StatusBadge = styled.span`
  background-color: ${props => props.$bg};
  color: ${props => props.$color};
  padding: 6px 16px;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 500;
`;

const ActionSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const AddButton = styled.button`
  background-color: #f8f9fa;
  color: #495057;
  border: 1px solid #dee2e6;
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-family: 'pretendard-semiBold';
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #e9ecef;
    border-color: #adb5bd;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 28px;
  font-family: 'pretendard-semiBold';
  color: #6c757d;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #f8f9fa;
    color: #495057;
  }
`;

const SearchContainer = styled.div`
  margin-bottom: 32px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 16px 20px;
  border: 1px solid #e5e8eb;
  border-radius: 12px;
  font-size: 16px;
  font-family: 'pretendard-semiBold';
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  &::placeholder {
    color: #9ca3af;
  }
`;

const TodoList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`;

const TodoCard = styled.div`
  background: white;
  border: 1px solid #e5e8eb;
  border-radius: 16px;
  padding: 28px;
  margin-bottom: 16px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  
  &:hover {
    border-color: #d1d5db;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
`;

const Title = styled.h3`
  font-size: 22px;
  font-family: 'pretendard-Bold';
  color: #1f2937;
  margin: 0;
  line-height: 1.4;
  flex: 1;
  margin-right: 16px;
`;

const EditButton = styled.button`
  background: none;
  border: 1px solid #e5e8eb;
  color: #6b7280;
  padding: 8px 16px;
  border-radius: 8px;
  font-family: 'pretendard-ExtraBold';
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #f9fafb;
    border-color: #d1d5db;
    color: #374151;
  }
`;

const CardContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
`;

const DateText = styled.span`
  font-size: 0.8rem;
  gap:3vw;
  color: #6b7280;
  font-family: 'pretendard-medium';
`;

const Status = styled.span`
  background-color: ${props => props.$bg};
  color: ${props => props.$color};
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
`;
const FormRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;
const FormLabel = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 4px;
`;
const EditContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 16px;
  padding: 24px;
  background-color: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e9ecef;
`;
const EditInput = styled.input`
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s ease;
  background-color: white;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  &::placeholder {
    color: #9ca3af;
  }
`;
const EditSelect = styled.select`
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;
const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
`;


const SaveButton = styled.button`
  background-color: #22c55e;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  
  &:hover {
    background-color: #16a34a;
  }
`;

const CancelButton = styled.button`
  background-color: #6b7280;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  
  &:hover {
    background-color: #4b5563;
  }
`;

const TodoMorePopup = ({ status, todos, projectId, onClose, onUpdate }) => {
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editedAssignee, setEditedAssignee] = useState("");
  const [editedDueDate, setEditedDueDate] = useState("");
  const [workers, setWorkers] = useState([]);
  const [newTodo, setNewTodo] = useState({ text: "", assigneeId: "", dueDate: "",  startDate: "" });
  const [isAdding, setIsAdding] = useState(false);
  const [todosWithUsers, setTodosWithUsers] = useState([]);

  // status 매핑 함수 수정
  const mapStatusToFrontend = (backendStatus) => {
    switch (backendStatus) {
      case "in_progress":
        return "inProgress";
      case "feedback_pending":
        return "feedbackPending";
      case "completed":
        return "completed";
      default:
        return backendStatus;
    }
  };

  const mapStatusToBackend = (frontendStatus) => {
    switch (frontendStatus) {
      case "inProgress":
        return "in_progress";
      case "feedbackPending":
        return "feedback_pending";
      case "completed":
        return "completed";
      default:
        return frontendStatus;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 프로젝트 정보 (workers)
        const projectRes = await axios.get(`http://localhost:8008/project/${projectId}`);
        setWorkers(projectRes.data.worker || []);
        
        // 전체 todos (user 정보 포함)
        const todosRes = await axios.get(`http://localhost:8008/projects/${projectId}/todos`);
        const allTodos = todosRes.data;
        
        setTodosWithUsers(allTodos);
        
      } catch (error) {
        console.error("데이터 가져오기 실패:", error);
        setWorkers([]);
        setTodosWithUsers([]);
      }
    };
    
    fetchData();
  }, [projectId]);
  
  const handleEdit = (todo) => {
    setEditingId(todo.id);
    setEditedAssignee(todo.user_id || ""); // user_id로 변경
    setEditedDueDate(todo.deadline || "");
    setEditedStartDate(todo.start_day || "");
  };
  const [editedStartDate, setEditedStartDate] = useState("");

  const handleSave = async (id) => {
    try {
      await axios.put(`http://localhost:8008/todos/${id}`, {
        user_id: editedAssignee,
        deadline: editedDueDate,
        start_day: editedStartDate, // 시작일 추가
      });
      setEditingId(null);
      
      // 데이터 새로고침
      const todosRes = await axios.get(`http://localhost:8008/projects/${projectId}/todos`);
      setTodosWithUsers(todosRes.data);
      
      if (onUpdate && typeof onUpdate === 'function') {
        onUpdate();
      }
    } catch (error) {
      console.error("할 일 수정 실패:", error);
      alert("수정에 실패했습니다.");
    }
  };
  

  const handleAddClick = () => {
    setIsAdding(true);
    setNewTodo({ text: "", assigneeId: "", dueDate: "",startDate: new Date().toISOString().split('T')[0] });
  };

  const handleAddTodo = async () => {
    if (!newTodo.text.trim()) {
      alert("할 일 내용을 입력해주세요.");
      return;
    }

    try {
        await axios.post(`http://localhost:8008/todos`, {
          text: newTodo.text,
          user_id: newTodo.assigneeId || null,
          deadline: newTodo.dueDate,
          start_day: newTodo.startDate, // 시작일 추가
          project_id: projectId,
          status: "in_progress", // 백엔드 형식으로 전송
        });
      setNewTodo({ text: "", assigneeId: "", dueDate: "" });
      setIsAdding(false);
      
      // 데이터 새로고침
      const todosRes = await axios.get(`http://localhost:8008/projects/${projectId}/todos`);
      setTodosWithUsers(todosRes.data);
      
      if (onUpdate && typeof onUpdate === 'function') {
        onUpdate();
      }
    } catch (error) {
      console.error("할 일 추가 실패:", error);
      alert("추가에 실패했습니다.");
    }
  };

  // 필터링된 todos - 백엔드 status와 프론트엔드 status 매핑
  const filteredTodos = todosWithUsers.filter(todo => {
    const mappedStatus = mapStatusToFrontend(todo.status);
    return mappedStatus === status;
  });

  const statusBg = getStatusBgColor(status);
  const statusFont = getStatusFontColor(status);

  return (
    <Container onClick={onClose}>
      <Content onClick={(e) => e.stopPropagation()} $color={statusFont}>
        <Header>
          <TitleSection>
            <h2 style={{ fontSize: "20px", fontWeight: 700, margin: 0, color: "#1f2937" }}>
              {status === "inProgress" && "진행중"}
              {status === "completed" && "완료"}
              {status === "feedbackPending" && "피드백 대기중"}
            </h2>
            <StatusBadge $bg={statusBg} $color={statusFont}>
              {filteredTodos.length}개
            </StatusBadge>
          </TitleSection>
          
          <ActionSection>
            <AddButton onClick={handleAddClick}>
              + 할 일 추가
            </AddButton>
            <CloseButton onClick={onClose}>
              ×
            </CloseButton>
          </ActionSection>
        </Header>

        <SearchContainer>
          <SearchInput
            type="text"
            placeholder="할 일 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </SearchContainer>

        {isAdding && (
        <EditContainer style={{ marginBottom: "24px" }}>
            <FormRow>
            <FormLabel>할 일 내용</FormLabel>
            <EditInput
                type="text"
                placeholder="할 일을 입력하세요"
                value={newTodo.text}
                onChange={(e) => setNewTodo({...newTodo, text: e.target.value})}
            />
            </FormRow>
            
            <FormRow>
            <FormLabel>담당자</FormLabel>
            <EditSelect
                value={newTodo.assigneeId}
                onChange={(e) => setNewTodo({...newTodo, assigneeId: e.target.value})}
            >
                <option value="">담당자를 선택해주세요</option>
                {workers.map(worker => (
                <option key={worker} value={worker}>
                    {worker}
                </option>
                ))}
            </EditSelect>
            </FormRow>
            
            <FormRow>
            <FormLabel>시작일</FormLabel>
            <EditInput
                type="date"
                value={newTodo.startDate}
                onChange={(e) => setNewTodo({...newTodo, startDate: e.target.value})}
            />
            </FormRow>
            
            <FormRow>
            <FormLabel>마감일</FormLabel>
            <EditInput
                type="date"
                value={newTodo.dueDate}
                onChange={(e) => setNewTodo({...newTodo, dueDate: e.target.value})}
            />
            </FormRow>
            
            <ButtonGroup>
            <CancelButton onClick={() => setIsAdding(false)}>
                취소
            </CancelButton>
            <SaveButton onClick={handleAddTodo}>
                할 일 추가
            </SaveButton>
            </ButtonGroup>
        </EditContainer>
        )}


        <TodoList>
          {filteredTodos
            .filter(todo => {
              if (!search || search.trim() === '') return true;
              const searchLower = search.toLowerCase();
              return todo.text?.toLowerCase().includes(searchLower) ||
                     todo.user_id?.toLowerCase().includes(searchLower);
            })
            .map((todo) => (
              <TodoCard key={todo.id}>
                <CardHeader>
                  <Title>{todo.text}</Title>
                  {editingId !== todo.id && (
                    <EditButton onClick={() => handleEdit(todo)}>
                      수정
                    </EditButton>
                  )}
                </CardHeader>
                
                {editingId === todo.id ? (
                <EditContainer>
                    <div>
                    <label>담당자:</label>
                    <EditSelect
                        value={editedAssignee}
                        onChange={(e) => setEditedAssignee(e.target.value)}
                    >
                        <option value="">담당자 선택</option>
                        {workers.map(worker => (
                        <option key={worker} value={worker}>
                            {worker}
                        </option>
                        ))}
                    </EditSelect>
                    </div>
                    <div>
                    <label>시작일:</label>
                    <EditInput
                        type="date"
                        value={editedStartDate}
                        onChange={(e) => setEditedStartDate(e.target.value)}
                    />
                    </div>
                    <div>
                    <label>마감일:</label>
                    <EditInput
                        type="date"
                        value={editedDueDate}
                        onChange={(e) => setEditedDueDate(e.target.value)}
                    />
                    </div>
                    <ButtonGroup>
                    <SaveButton onClick={() => handleSave(todo.id)}>
                        저장
                    </SaveButton>
                    <CancelButton onClick={() => setEditingId(null)}>
                        취소
                    </CancelButton>
                    </ButtonGroup>
                </EditContainer>
                ) : (
                <CardContent>
                    <DateText>
                    담당자: {todo.user_id || "미할당"} ㅤ|ㅤ 
                    시작일: {todo.start_day || "없음"} ㅤ|ㅤ
                    마감일: {todo.deadline || "없음"}ㅤ
                    </DateText>
                    <Status $bg={statusBg} $color={statusFont}>
                    {status === "inProgress" && "진행중"}
                    {status === "completed" && "완료"}
                    {status === "feedbackPending" && "피드백 대기중"}
                    </Status>
                </CardContent>
                )}
              </TodoCard>
            ))}
        </TodoList>
      </Content>
    </Container>
  );
};

export default TodoMorePopup;
