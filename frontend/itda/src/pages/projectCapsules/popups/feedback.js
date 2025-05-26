import React, { useState, useEffect } from 'react';
import '../../../css/feedbackpopup.css';

const FeedbackPopup = ({ onClose }) => {
    const [folders, setFolders] = useState([]); // 폴더 및 파일을 저장하는 배열
    const [isUploadPopupOpen, setUploadPopupOpen] = useState(false); // 업로드 팝업 상태
    const [dragging, setDragging] = useState(false); // 드래그 상태
    //const [selectedFile, setSelectedFile] = useState(null); // 선택된 파일
    const [viewingFile, setViewingFile] = useState(null); // 상세 파일 보기 상태
    const [currentFolder, setCurrentFolder] = useState(null); // 현재 폴더 상태
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isDeletePopupOpen, setDeletePopupOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeletionConfirmed, setDeletionConfirmed] = useState(false);

    useEffect(() => {
        if (!viewingFile) return;

        const fetchMessages = async () => {
            try {
                const res = await fetch(`http://localhost:8008/feedbackchat/${viewingFile.name}`);
                const data = await res.json();
                setMessages(data.map((msg, idx) => ({
                    ...msg,
                    id: idx,
                    time: new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                })));
            } catch (err) {
                console.error("채팅 메시지 불러오기 실패", err);
            }
        };

        fetchMessages();
    }, [viewingFile]); // viewingFile이 바뀔 때마다 실행됨    
    
    // 폴더 추가하기
    const handleAddFolder = () => {
        const newFolder = { 
            name: '', 
            createdAt: new Date().toLocaleString(), 
            isEditing: false,
            type: 'folder', // 새로운 폴더로 설정
            image: 'folderIcon.png', // 폴더 이미지
            contents: [] // 폴더 내 콘텐츠
        };
        setFolders([...folders, newFolder]);
    };

    // 폴더 이름 변경하기
    const handleFolderNameChange = (index, newName) => {
        const updatedFolders = [...folders];
        updatedFolders[index].name = newName;
        setFolders(updatedFolders);
    };

    // 폴더 이름 저장하기
    const handleSaveFolderName = (index) => {
        const updatedFolders = [...folders];
        updatedFolders[index].isEditing = false;
        setFolders(updatedFolders);
    };

    // 폴더 이름 편집 모드로 전환하기
    const handleEditFolderName = (index) => {
        const updatedFolders = [...folders];
        updatedFolders[index].isEditing = true;
        setFolders(updatedFolders);
    };

    // 폴더나 파일 삭제하기
    const handleDeleteFolder = (index) => {
        const updatedFolders = folders.filter((_, folderIndex) => folderIndex !== index);
        setFolders(updatedFolders);
    };

    // 파일 업로드 팝업 열기/닫기
    const toggleUploadPopup = () => {
        setUploadPopupOpen(!isUploadPopupOpen);
    };

    // 파일 업로드 처리
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            //setSelectedFile(file);
            const newFile = {
                name: file.name, // 파일명
                size: file.size, // 파일 크기 (바이트)
                createdAt: new Date().toLocaleString(), // 생성일 (날짜 + 시간)
                type: 'file', // 파일 타입
                file: file, // 파일 정보 저장
                image: 'fileIcon.png'
            };
            if (currentFolder) {
                const updatedFolders = [...folders];
                updatedFolders[currentFolder.index].contents.push(newFile);
                setFolders(updatedFolders);
            } else {
                setFolders([...folders, newFile]);
            }
            setUploadPopupOpen(false); // 업로드 팝업 닫기
        }
    };

    // 드래그 오버 이벤트 처리
    const handleDragOver = (e) => {
        e.preventDefault();
        setDragging(true);
    };

    // 드래그 리브 이벤트 처리
    const handleDragLeave = () => {
        setDragging(false);
    };

    // 드래그 앤 드롭 이벤트 처리
    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            //setSelectedFile(file);
            const newFile = {
                name: file.name,
                size: file.size,
                createdAt: new Date().toLocaleString(),
                type: 'file',
                file: file,
                image: 'file-icon.png'
            };
            if (currentFolder) {
                const updatedFolders = [...folders];
                updatedFolders[currentFolder.index].contents.push(newFile);
                setFolders(updatedFolders);
            } else {
                setFolders([...folders, newFile]);
            }
            setUploadPopupOpen(false); // 팝업 닫기
        }
    };

    // 파일 상세 페이지 보기 (더블 클릭 시)
    const handleFileDoubleClick = (file) => {
        setViewingFile(file);
    };

    // 파일 상세 보기에서 뒤로가기
    const handleBackToFolder = () => {
        setViewingFile(null);
    };

    // 폴더 더블 클릭 시 폴더 열기
    const handleFolderDoubleClick = (folder, index) => {
        setCurrentFolder({ folder, index });
    };

    // 현재 폴더에서 상위 폴더로 이동
    const handleBackToParentFolder = () => {
        setCurrentFolder(null);
    };

    const handleSendMessage = async () => {
        if (!inputText.trim()) return;

        const newMessage = {
            text: inputText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            id: messages.length
        };

        setMessages([...messages, newMessage]);
        setInputText('');

        // 👉 Redis에 메시지 저장 요청
        try {
            await fetch("http://localhost:8008/feedbackchat/send", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                    // Authorization: `Bearer ${token}` 필요한 경우 추가
                },
                body: JSON.stringify({
                    feedback_id: viewingFile?.name ?? "temp-feedback-id", // ← 작업물 ID나 임시 ID
                    sender_id: "user-id",      // ← 실제 사용자 ID
                    sender_name: "User Name",  // ← 실제 사용자 이름
                    text: inputText,
                    time: new Date().toISOString()
                })
            });
        } catch (err) {
            console.error("채팅 메시지 저장 실패", err);
        }
    };


    const displayedFolders = currentFolder ? currentFolder.folder.contents : folders;

    // 파일 크기를 KB/MB 단위로 표시하는 함수
    const formatFileSize = (size) => {
        if (size < 1024) return `${size} bytes`;
        else if (size < 1048576) return `${(size / 1024).toFixed(2)} KB`;
        else return `${(size / 1048576).toFixed(2)} MB`;
    };
    
    // 삭제팝업 핸들
    const handleDeleteClick = (index) => {
        setItemToDelete(index);
        setDeletePopupOpen(true);
    };

    // 삭제 확인
    const handleConfirmDelete = () => {
        handleDeleteFolder(itemToDelete);
        setDeletePopupOpen(false);
        setDeletionConfirmed(true);
        setTimeout(() => setDeletionConfirmed(false), 2000); // Hide deletion message after 2 seconds
    };

    // 삭제 취소
    const handleCancelDelete = () => {
        setDeletePopupOpen(false);
        setItemToDelete(null);
    };

    // 타임스탬프 시간 감지
    const timeRegex = /\b(\d{1,2}):([0-5]\d)\b/g;

    const renderMessageText = (text) => {
        return text.split(timeRegex).map((part, i, arr) => {
            if (i % 3 === 1) {
                const minutes = parseInt(arr[i]);
                const seconds = parseInt(arr[i + 1]);
                const totalSeconds = minutes * 60 + seconds;
                const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                return (
                    <span
                        key={i}
                        className="seekTime"
                        onClick={() => {
                            const video = document.querySelector("video");
                            if (video) video.currentTime = totalSeconds;
                        }}
                    >
                        {timeString}
                    </span>
                );
            } else if (i % 3 === 2) {
                return null;
            }
            return <span key={i}>{part}</span>;
        });
    };

    

    return (
        <div className="feedbackPopup">
            <div className="popupContent">
                {/* 팝업업 네비게이션 바 */}
                <div className="feedbackNavBar">
                    <div className="popupTitle">작업물 코멘트</div>
                    <button className="closeBtn" onClick={onClose}>X</button>
                    {(currentFolder || viewingFile) && (
                        <button 
                            className="backBtn" 
                            onClick={viewingFile ? handleBackToFolder : handleBackToParentFolder}
                        >
                            ←
                        </button>
                    )}
                </div>
    
                {/* 본문 영역 */}
                {viewingFile ? (
                    // 파일 상세 보기 
                    <div className="fileDetailView">
                        <div className="videoContent">
                            <div className="fileInfo">
                                <div className="openedFileName">{viewingFile.name}</div>
                                <div className="videoPlayer">
                                    <video controls width="100%">
                                        {/*!동영상 여기입니닷!*/}
                                        <source src={URL.createObjectURL(viewingFile.file)} type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                </div>
                                <p>게시자:</p>
                                <p>파일 크기: {formatFileSize(viewingFile.size)}</p>
                                <p>생성일: {viewingFile.createdAt}</p>
                                <button className='reUploadBtn'>작업물 재업로드</button>
                                <button className='workDelBtn' onClick={() => setDeletePopupOpen(true)}>삭제</button>
                            </div>
                        </div>
                        <div className="chatContent">
                            <div className="messageList">
                                {messages.map((message, index) => (
                                    <div key={index} className="messageItem">
                                        <div className="profileContainer">
                                            <div className="profilePic" />
                                            {index > 0 && <div className="line" />}
                                        </div>
                                        <div className="messageDetails">
                                            <div className="messageHeader">
                                                <span className="profileName">User Name</span>
                                                <span className="messageTime">{message.time}</span>
                                            </div>
                                            <div className="messageText">{renderMessageText(message.text)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="chatInputContainer">
                                <img src="pencilIcon.png" alt="입력" className="pencilIcon" />
                                <input
                                    type="text"
                                    className="chatInput"
                                    placeholder="Type a message..."
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()} // 엔터 키로 전송
                                />
                                <button onClick={handleSendMessage}>
                                    <img src="sendIcon.png" alt="전송" />
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* 폴더/파일 리스트 */}
                        <div className="folderContainer">
                            {displayedFolders.map((folder, index) => (
                                <div key={index} className="folder">
                                    <div className="folderDate">{folder.createdAt}</div>
                                    
                                    {folder.type === 'file' ? (
                                        // 파일 항목
                                        <div className="fileItem" onDoubleClick={() => handleFileDoubleClick(folder)}>
                                            <img src="/fileIcon.png" className="folderIcon" alt="File Icon" />
                                            <span>{folder.name}</span>
                                            <span className="deleteIcon" onClick={() => handleDeleteFolder(index)}>🗑️</span>
                                        </div>
                                    ) : (
                                        // 폴더 항목
                                        <div className="folderItem" onDoubleClick={() => handleFolderDoubleClick(folder, index)}>
                                            <img src="/folderIcon.png" className="folderIcon" alt="Folder Icon" />
                                            
                                            {folder.isEditing ? (
                                                <input
                                                    type="text"
                                                    value={folder.name}
                                                    onChange={(e) => handleFolderNameChange(index, e.target.value)}
                                                    onBlur={() => handleSaveFolderName(index)}
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter') handleSaveFolderName(index);
                                                    }}
                                                    autoFocus
                                                />
                                            ) : (
                                                <div className="folderName" onDoubleClick={() => handleEditFolderName(index)}>
                                                    <span className="folderNameText">
                                                        {folder.name || '새 폴더'}
                                                    </span>
                                                    <span className="deleteIcon" onClick={() => handleDeleteFolder(index)}>🗑️</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="fileDescription">파일을 클릭하면 코멘트를 볼 수 있습니다.</div>

                        {/* 폴더 추가 / 업로드 버튼 */}
                        <button className="addFolderBtn" onClick={handleAddFolder}>폴더 추가</button>
                        <button className="uploadBtn" onClick={toggleUploadPopup}>작업물 업로드</button>

                        {/* 파일 업로드 팝업 */}
                        {isUploadPopupOpen && (
                            <div className="uploadPopup">
                                <div className="popupContent">
                                    <div className="popupTitle">파일 업로드</div>
                                    <div className="fileDescription">업로드할 파일을 선택하세요</div>
                                    <button className="closeBtn" onClick={toggleUploadPopup}>X</button>
                                    
                                    <div
                                        className={`fileUploadArea ${dragging ? 'dragging' : ''}`}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                    >
                                        <div className="fileUploadDescrit">업로드할 파일을 선택하거나 끌어오세요.</div>
                                        <p>영상, 이미지, 소리 파일을 업로드하세요.</p>
                                        
                                        <input
                                            type="file"
                                            onChange={handleFileUpload}
                                            className="fileInput"
                                            id="fileInput"
                                        />
                                        <label htmlFor="fileInput" className="fileSearchBtn">파일 찾기</label>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
                {/* 삭제 팝업                
                {isDeletePopupOpen && (
                        <div className="deletePopup">
                        <div className="popupContent">
                            <div className="popupTitle">정말 삭제하시겠습니까?</div>
                            <button className="confirmBtn" onClick={handleConfirmDelete}>예</button>
                            <button className="cancelBtn" onClick={handleCancelDelete}>아니요</button>
                        </div>
                    </div>
                )}
                */}
            </div>
        </div>
    );    
};
export default FeedbackPopup;