import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import sendIcon from '../../../icons/sendIcon.png';
import pencilIcon from '../../../icons/pencilIcon.png';
import '../../../css/feedbackpopup.css';

const FeedbackPopup = ({ onClose, projectId, onUploadComplete, onUpdate }) => {
    const { project_id } = useParams();
    const location = useLocation();
    const { username } = location.state || {};
    
    const [folders, setFolders] = useState([]);
    const [isUploadPopupOpen, setUploadPopupOpen] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [viewingFile, setViewingFile] = useState(null);
    const [currentFolder, setCurrentFolder] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isDeletePopupOpen, setDeletePopupOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeletionConfirmed, setDeletionConfirmed] = useState(false);
    const [isLoadingSize, setIsLoadingSize] = useState(false);
    
    // JWT 토큰 기반 사용자 정보 상태
    const [currentUser, setCurrentUser] = useState(null);
    const [userLoading, setUserLoading] = useState(true);

    // 프로젝트 ID 결정
    const currentProjectId = projectId || project_id;

    // JWT 토큰으로 현재 사용자 정보 가져오기
    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const token = localStorage.getItem('access_token');
                if (!token) {
                    console.error('토큰이 없습니다.');
                    setUserLoading(false);
                    return;
                }
                
                const response = await fetch('http://localhost:8008/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const userData = await response.json();
                    setCurrentUser(userData);
                } else {
                    console.error('사용자 정보 로드 실패:', response.status);
                }
            } catch (error) {
                console.error('사용자 정보 요청 중 오류:', error);
            } finally {
                setUserLoading(false);
            }
        };
        
        fetchCurrentUser();
    }, []);

    // 데이터 불러오기
    const fetchFoldersAndFiles = useCallback(async () => {
        try {
            const [treeRes, rootFilesRes] = await Promise.all([
                fetch(`http://localhost:8008/projects/${currentProjectId}/folders/tree`),
                fetch(`http://localhost:8008/projects/${currentProjectId}/files?no_folder=true`)
            ]);
            const [treeData, rootFilesData] = await Promise.all([treeRes.json(),rootFilesRes.json()
            ]);
            //한국시간대 리렌더링
            const dateTimeOptions = {
                year: 'numeric',month: '2-digit', day: '2-digit', hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false, 
                timeZone: 'Asia/Seoul'
            };
            //부모 파일가져오기
            const mappedRootFiles = (rootFilesData || [])
                .filter(file => file.folder_id === null) 
                .map(file => ({
                    id: file.id,
                    name: file.name,
                    createdAt: file.uploaded_at
                        ? new Date(file.uploaded_at).toLocaleString('ko-KR', dateTimeOptions)
                        : new Date().toLocaleString('ko-KR', dateTimeOptions),
                    type: 'file',
                    s3Url: file.s3_url,
                    size: file.size ?? -1,
                    folder_id: file.folder_id,
                    uploader: file.uploader
                }));
            //가져온 폴더 정보 가졍오기
            const mapFolder = (folder) => {
                const mappedFiles = (folder.files || []).map(f => ({
                    id: f.id,
                    name: f.name,
                    createdAt: f.uploaded_at
                        ? new Date(f.uploaded_at).toLocaleString('ko-KR', dateTimeOptions)
                        : new Date().toLocaleString('ko-KR', dateTimeOptions),
                    type: 'file',
                    s3Url: f.s3_url,
                    size: f.size,
                    folder_id: folder.id
                }));

                const mappedChildren = (folder.children || []).map(child => mapFolder(child));

                return {
                    id: folder.id,
                    name: folder.name,
                    createdAt: folder.createdAt
                        ? new Date(folder.createdAt).toLocaleString()
                        : new Date().toLocaleString(),
                    type: 'folder',
                    contents: [
                        ...mappedFiles,     
                        ...mappedChildren   
                    ]
                };
            };
            const mappedFolders = treeData.map(mapFolder);
            setFolders([...mappedRootFiles, ...mappedFolders]);
        } catch (err) {
            console.error("피드백제이에스 64오류",err);
        }
    }, [currentProjectId]);

    // 백엔드 FeedbackMessage 모델에 맞춘 메시지 가져오기 함수
    const fetchFeedbackMessages = useCallback(async (projectId, fileId) => {
        if (!projectId || !fileId) return;
        
        try {
            const res = await fetch(`http://localhost:8008/projects/${projectId}/files/${fileId}/feedback`);
            if (res.ok) {
                const data = await res.json();
                // 백엔드 모델 필드명(user, message, timestamp)을 프론트엔드 형식으로 변환
                const formattedMessages = data.map(msg => ({
                    sender_name: msg.user,           // user → sender_name
                    text: msg.message,               // message → text
                    time: new Date(msg.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    })                               // timestamp → time (형식 변환)
                }));
                setMessages(formattedMessages);
            } else {
                console.error("메시지 불러오기 실패:", res.status);
                setMessages([]);
            }
        } catch (error) {
            console.error("피드백 메시지 불러오기 실패:", error);
            setMessages([]);
        }
    }, []);

    useEffect(() => {
        fetchFoldersAndFiles();
    }, [currentProjectId]);

    // 파일 선택 시 FeedbackStore API로 메시지 로드
    useEffect(() => {
        if (viewingFile && currentProjectId) {
            fetchFeedbackMessages(currentProjectId, viewingFile.id);
        }
    }, [viewingFile, currentProjectId, fetchFeedbackMessages]);


    // 백엔드 FeedbackMessage 모델에 맞춘 메시지 전송 함수
    const handleSendMessage = async () => {
        if (!inputText.trim() || !viewingFile || !currentProjectId || !currentUser) {
            console.error('필수 정보가 누락되었습니다.');
            return;
        }

        // 백엔드 FeedbackMessage 모델에 정확히 맞는 데이터 구조
        const messageData = {
            user: currentUser.name || currentUser.id,    // sender_id → user
            message: inputText.trim(),                   // text → message
            timestamp: new Date().toISOString()          // time → timestamp
        };

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`http://localhost:8008/projects/${currentProjectId}/files/${viewingFile.id}/feedback`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(messageData)
            });

            if (response.ok) {
                setInputText('');
                fetchFeedbackMessages(currentProjectId, viewingFile.id);

                // ===== Todo 생성 요청 추가 =====
                const todoData = {
                    text: inputText.trim(),
                    user_id: String(currentUser.id),  
                    start_day: new Date().toISOString().split("T")[0],
                    project_id: String(currentProjectId),
                    status: "feedbackPending"
                };


                try {
                    const todoResponse = await fetch(`http://localhost:8008/todos`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(todoData)
                    });

                    if (!todoResponse.ok) {
                        console.error('Todo 생성 실패', await todoResponse.text());
                        } else {
                            if (onUpdate) {
                                onUpdate();
                            }
                        }
                } catch (error) {
                    console.error('Todo 생성 중 오류', error);
                }

            } else {
                console.error('메시지 전송 실패:', response.status);
            }
        } catch (error) {
            console.error('메시지 전송 중 오류:', error);
        }
    };

    const handleAddFolder = async () => {
        const name = prompt("새 폴더 이름을 입력하세요");
        if (!name) return;
    
        const parent_id = currentFolder?.folder?.id || null; 
    
        try {
            const response = await fetch(`http://localhost:8008/projects/${currentProjectId}/folders`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name, parent_id }),
            });
    
            if (!response.ok) {
                throw new Error("폴더 생성 실패");
            }
    
            const newFolderData = await response.json();
    
            const folderObj = {
                id: newFolderData.id,
                name: newFolderData.name,
                createdAt: new Date(newFolderData.createdAt).toLocaleString(), 
                type: 'folder',
                contents: [],
            };

            if (currentFolder && currentFolder.folder?.id) {
                setFolders(prevFolders => {
                    const updatedFolders = prevFolders.map(folder => {
                        return addFolderToSpecificParent(folder, currentFolder.folder.id, folderObj);
                    });
                    const refreshedCurrentFolder = findFolderById(updatedFolders, currentFolder.folder.id);
                    if (refreshedCurrentFolder) {
                        setCurrentFolder({ folder: refreshedCurrentFolder });
                    }
                    return updatedFolders;
                });
            } else {
                setFolders(prev => {
                    return [...prev, folderObj];
                });
                fetchFoldersAndFiles();
            }        
            alert("폴더 생성이 완료되었습니다.");
            await fetchFoldersAndFiles(); 
            setCurrentFolder(null);
        } catch (err) {
            alert("폴더 생성 중 오류 발생");
            console.error(err);
        }
    };
    
    const addFolderToSpecificParent = (node, targetParentId, newFolder) => {
        if (node.type === 'folder' && node.id === targetParentId) {
            return {
                ...node,
                contents: [...(node.contents || []), newFolder]
            };
        }
    
        if (node.type === 'folder' && node.contents && node.contents.length > 0) {
            return {
                ...node,
                contents: node.contents.map(child => addFolderToSpecificParent(child, targetParentId, newFolder))
            };
        }
        return node;
    };

    const handleFolderNameChange = (index, newName) => {
        const updatedFolders = [...folders];
        updatedFolders[index].name = newName;
        setFolders(updatedFolders);
    };

    const handleSaveFolderName = (index) => {
        const updatedFolders = [...folders];
        updatedFolders[index].isEditing = false;
        setFolders(updatedFolders);
    };

    const handleEditFolderName = (index) => {
        const updatedFolders = [...folders];
        updatedFolders[index].isEditing = true;
        setFolders(updatedFolders);
    };

    const handleDeleteFolder = async (index) => {
        const targetFolder = displayedFolders[index];
        if (!targetFolder || targetFolder.type !== 'folder') return;
    
        await deleteFolderFromServer(targetFolder.id);
    
        const updated = removeFolderById(folders, targetFolder.id);
        setFolders(updated);
        setCurrentFolder(null);
        alert("폴더가 삭제되었습니다.");
    };
    
    const handleDeleteFromServer = async (fileId, index) => {
        try {
            const response = await fetch(`http://localhost:8008/delete/s3/${fileId}`, {
                method: "DELETE"
            });
    
            if (!response.ok) {
                throw new Error("삭제 실패");
            }
    
            const updatedFolders = [...folders];
            updatedFolders.splice(index, 1);
            setFolders(updatedFolders);
    
            setCurrentFolder(null);
    
            alert("파일이 정상적으로 삭제되었습니다.");
        } catch (err) {
            alert("파일 삭제 중 오류가 발생했습니다. 문제가 있다면 관리자에게 문의하세요.");
            console.error(err);
        }
    };
    
    const toggleUploadPopup = () => {
        setUploadPopupOpen(!isUploadPopupOpen);
    };

    const insertFileIntoFolderById = (nodes, targetId, newFile) => {
        return nodes.map(node => {
            if (node.type === 'folder') {
                if (node.id === targetId) {
                    return {
                        ...node,
                        contents: [...(node.contents || []), newFile]
                    };
                } else if (node.contents && node.contents.length > 0) {
                    return {
                        ...node,
                        contents: insertFileIntoFolderById(node.contents, targetId, newFile)
                    };
                }
            }
            return node;
        });
    };
    
    const findFolderById = (nodes, targetId) => {
        for (const node of nodes) {
            if (node.type === 'folder' && node.id === targetId) {
                return node;
            }
            if (node.type === 'folder' && node.contents) {
                const found = findFolderById(node.contents, targetId);
                if (found) return found;
            }
        }
        return null;
    };

    const handleFileUpload = async (e) => {
        const localFile = e.target.files[0];
        if (!localFile || !currentProjectId) return;

        const formData = new FormData();
        formData.append("file", localFile);
        formData.append("uploader", username);
        if (currentFolder && currentFolder.folder?.id) {
            formData.append("folder_id", currentFolder.folder.id);
        }

        try {
            const response = await fetch(`http://localhost:8008/upload/s3/${currentProjectId}`, {
                method: "POST",
                body: formData
            });
            if (!response.ok) throw new Error("파일 업로드 실패");

            const data = await response.json();

            // 기존 폴더 처리 코드 생략...

            alert("파일 업로드에 성공했습니다.");
            setUploadPopupOpen(false);
            setCurrentFolder(null);
            fetchFoldersAndFiles();

            // ✅ WebSocket 알림 전송 추가
            const ws = new WebSocket("ws://localhost:8008/ws/fileupload");
            ws.onopen = () => {
                const notifyData = {
                    type: "upload",
                    project_name: data.project_name || "프로젝트명",
                    uploader: username
                };
                ws.send(JSON.stringify(notifyData));
                ws.close();
            };

        } catch (err) {
            alert("파일 업로드에 실패했습니다.");
            console.error(err);
        }
    };
    
    const handleDragOver = (e) => {
        e.preventDefault();
        setDragging(true);
    };

    const handleDragLeave = () => {
        setDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            const newFile = {
                name: file.name,
                size: file.size,
                createdAt: new Date().toISOString(),
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
            setUploadPopupOpen(false);
        }
    };

    const handleFileDoubleClick = async (file) => {
        try {
            setViewingFile(null); 
            const res = await fetch(`http://localhost:8008/files/presigned/${file.id}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Presigned URL fetch 실패");
            const tempRes = await fetch(`http://localhost:8008/projects/${currentProjectId}/files`);
            const fileList = await tempRes.json();
    
            const matched = fileList.find((f) => f.id === file.id);
            const uploaderId = matched?.uploader?.id ?? "정보없음";
            const updatedFile = { 
                ...file, 
                s3Url: data.url, 
                uploader: { id: uploaderId }
            };
            console.log(uploaderId)
            setViewingFile(updatedFile);
            console.log(updatedFile)
        } catch (error) {
            alert("파일 미리보기를 불러올 수 없습니다.");
        }
    };
    
    const findParentFolder = (folders, targetId) => {
        for (const folder of folders) {
          if (!folder.contents) continue;
      
          for (const child of folder.contents) {
            if (child.id === targetId) {
              return folder;
            }
          }
      
          const foundInChild = findParentFolder(folder.contents, targetId);
          if (foundInChild) return foundInChild;
        }
      
        return null;
    };
      
    const handleBackToFolder = () => {
        setViewingFile(null);
    };

    const handleFolderDoubleClick = (folder, index) => {
        setCurrentFolder({ folder, index });
    };
    
    const handleBackToParentFolder = () => {
        if (!currentFolder || !currentFolder.folder?.id) {
          setCurrentFolder(null); 
          return;
        }
      
        const parent = findParentFolder(folders, currentFolder.folder.id);
        if (parent) {
          setCurrentFolder({ folder: parent });
        } else {
          setCurrentFolder(null); 
        }
    };
      
    const renderFolderRecursively = (folder, index) => {
        return (
            <div key={folder.id} className="folder">
                <div className="folderDate">{folder.createdAt}</div>
    
                {folder.type === 'file' ? (
                    <div className="fileItem" onDoubleClick={() => handleFileDoubleClick(folder)}>
                        <img src="/fileIcon.png" className="folderIcon" alt="File Icon" />
                        <ToggleNameDisplay name={folder.name} />
                        <div className="deleteIcon" onClick={() => handleDeleteFromServer(folder.id, index)}>🗑️</div>
                    </div>
                ) : (
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
                                <ToggleNameDisplay name={folder.name || '새 폴더'} />
                                <span className="deleteIcon" onClick={() => handleDeleteFolder(index)}>🗑️</span>
                            </div>
                        )}

                        {folder.contents && folder.contents.length > 0 }
                    </div>
                )}
            </div>
        );
    };
    
    const displayedFolders = currentFolder ? currentFolder.folder.contents : folders;

    const formatFileSize = (size) => {
        if (size === null || size === undefined || size < 0) return '크기 정보 없음';
        if (size === 0 && typeof size === 'number') return '0 bytes'; 
        if (size < 1024) return `${size} bytes`;
        if (size < 1048576) return `${(size / 1024).toFixed(2)} KB`;
        return `${(size / 1048576).toFixed(2)} MB`;
    };

    const getFileExtension = (filename) => {
        if (!filename || typeof filename !== 'string') return '';
        return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2).toLowerCase();
    };

    const handleDeleteClick = (index) => {
        setItemToDelete(index);
        setDeletePopupOpen(true);
    };

    const deleteFolderFromServer = async (folderId) => {
        try {
            const response = await fetch(`http://localhost:8008/projects/${currentProjectId}/folders/${folderId}`, {
                method: "DELETE"
            });
            if (!response.ok) throw new Error("서버 폴더 삭제 실패");
        } catch (error) {
            alert("오류가 발생했습니다. 지속되면 관리자에게 문의 하세요.");
            console.error(error);
        }
    };

    const removeFolderById = (nodes, targetId) => {
        return nodes
            .filter(node => !(node.type === 'folder' && node.id === targetId))
            .map(node => {
                if (node.type === 'folder' && node.contents) {
                    return {
                        ...node,
                        contents: removeFolderById(node.contents, targetId)
                    };
                }
                return node;
            });
    };
    
    const handleConfirmDelete = () => {
        handleDeleteFolder(itemToDelete);
        setDeletePopupOpen(false);
        setDeletionConfirmed(true);
        setTimeout(() => setDeletionConfirmed(false), 2000); 
    };

    const addFolderToTree = (nodes, parentId, newFolder) => {
        let inserted = false;
      
        const deepCloneAndInsert = (items) =>
          items.map(item => {
            if (item.type === 'folder') {
              const cloned = {
                ...item,
                contents: item.contents ? deepCloneAndInsert(item.contents) : []
              };
      
              if (!inserted && item.id === parentId) {
                cloned.contents.push({ ...newFolder });
                inserted = true;
              }
      
              return cloned;
            }
            return { ...item };
          });
      
        return deepCloneAndInsert(nodes);
    };
      
    const handleCancelDelete = () => {
        setDeletePopupOpen(false);
        setItemToDelete(null);
    };

    const ToggleNameDisplay = ({ name }) => {
        const [expanded, setExpanded] = useState(false);
    
        return (
            <div
                className={`folderNameText ${expanded ? 'expanded' : ''}`}
                onClick={() => setExpanded(!expanded)}
                title={name}
            >
                {name || '새 폴더'}
            </div>
        );
    };

    const TextPreview = ({ fileSrc }) => {
        const [textContent, setTextContent] = useState('');
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState(null);

        useEffect(() => {
            if (!fileSrc) {
                setError('파일 경로가 없습니다.');
                setLoading(false);
                return;
            }
            setLoading(true);
            setError(null);
            fetch(fileSrc)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`파일을 불러올 수 없습니다 (HTTP ${response.status})`);
                    }
                    return response.text();
                })
                .then(text => {
                    setTextContent(text);
                    setLoading(false);
                })
                .catch(err => {
                    console.error("텍스트 파일 로드 실패:", err);
                    setError(err.message || '텍스트 파일을 불러오는 데 실패했습니다.');
                    setLoading(false);
                });
        }, [fileSrc]);

        if (loading) return <p>텍스트 파일을 불러오는 중...</p>;
        if (error) return <p style={{ color: 'red' }}>오류: {error}</p>;

        return (
            <pre style={{
                whiteSpace: 'pre-wrap', wordWrap: 'break-word',
                border: '1px solid #eee', padding: '15px',
                maxHeight: '500px', overflowY: 'auto', textAlign: 'left',
                fontFamily: 'monospace', backgroundColor: '#f9f9f9'
            }}>
                {textContent}
            </pre>
        );
    };

    const renderFilePreview = (fileToView) => {
        if (!fileToView) return <p>미리볼 파일을 선택해주세요.</p>;

        const extension = getFileExtension(fileToView.name);
        const fileSrc = fileToView.s3Url || (fileToView.file instanceof File ? URL.createObjectURL(fileToView.file) : '');

        if (!fileSrc) return <p>파일 경로를 찾을 수 없습니다. 업로드가 완료되었는지 확인해주세요.</p>;

        switch (extension) {
            case 'pdf':
                return (
                    <iframe src={fileSrc} width="100%" height="600px" title={fileToView.name} style={{ border: '1px solid #ccc' }}>
                        이 브라우저는 PDF 인라인 프레임을 지원하지 않습니다. <a href={fileSrc} target="_blank" rel="noopener noreferrer">PDF 다운로드</a>
                    </iframe>
                );
            case 'txt':
                return <TextPreview fileSrc={fileSrc} />;
            case 'mp4': case 'webm': case 'ogv':
                return (
                    <video controls width="100%" key={fileSrc} style={{ maxHeight: '600px', backgroundColor:'#000' }}>
                        <source src={fileSrc} type={`video/${extension}`} />
                        브라우저가 비디오 태그를 지원하지 않습니다.
                    </video>
                );
            case 'mp3': case 'wav': case 'ogg':
                return (
                    <audio controls style={{ width: '100%' }} key={fileSrc}>
                        <source src={fileSrc} type={`audio/${extension}`} />
                        브라우저가 오디오 태그를 지원하지 않습니다.
                    </audio>
                );
            case 'png': case 'jpg': case 'jpeg': case 'gif': case 'bmp': case 'svg':
                return (
                    <img src={fileSrc} alt={fileToView.name} style={{ maxWidth: '100%', maxHeight: '600px', display: 'block', margin: 'auto', border: '1px solid #eee' }}/>
                );
            default:
                return (
                    <div style={{ padding: '20px', textAlign: 'center' }}>
                        <p><b>'{extension}'</b> 파일 형식은 미리보기를 지원하지 않습니다.</p>
                        <p>파일을 다운로드하여 확인해주세요.</p>
                        <a href={fileSrc} target="_blank" rel="noopener noreferrer" download={fileToView.name}
                           style={{ display: 'inline-block', marginTop: '10px', padding: '10px 15px', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
                            {fileToView.name} 다운로드
                        </a>
                    </div>
                );
        }
    };

    const handleReupload = async () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "*";
        input.onchange = async (e) => {
            const selectedFile = e.target.files[0];
            if (!selectedFile) return;
    
            const formData = new FormData();
            formData.append("file", selectedFile);
    
            try {
                const res = await fetch(`http://localhost:8008/upload/s3/${viewingFile.id}`, {
                    method: "PUT",
                    body: formData
                });
                if (!res.ok) throw new Error(" 실패");
    
                const data = await res.json();
                const updatedFile = {
                    ...viewingFile,
                    name: data.name,
                    createdAt: new Date(data.uploaded_at).toLocaleString('ko-KR'),
                    s3Url: data.s3_url
                };
    
                setViewingFile(updatedFile);
                alert("정상적으로 재업로드 되었습니다.");
                onClose();
            } catch (err) {
                console.error(err);
                alert("재업로드에 실패하였습니다. 오류가 계속되면 관리자에게 문의하세요");
            }
        };
        input.click();
    };
    
    const deleteInFeedBack = async (item) => {
        const isFolder = item.children !== undefined;
        const url = isFolder
            ? `http://localhost:8008/folders/${item.id}`
            : `http://localhost:8008/files/${item.id}`;
    
        if (!window.confirm(`${item.name}을(를) 삭제하시겠습니까?`)) return;
    
        try {
            const response = await fetch(url, {
                method: "DELETE",
            });
            if (response.ok) {
                alert("삭제 완료되었습니다.");
                fetchFoldersAndFiles();
                handleBackToFolder()
            } else {
                const data = await response.json();
                alert("삭제 실패: " + data.detail);
            }
        } catch (error) {
            alert("삭제 요청 중 오류 발생");
        }
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

    // 로딩 상태 처리
    if (userLoading) {
        return (
            <div className="feedbackPopup">
                <div className="popupContent">
                    <div className="feedbackNavBar">
                        <div className="popupTitle">작업물 코멘트</div>
                        <button className="closeBtn" onClick={onClose}>X</button>
                    </div>
                    <div style={{ padding: '20px', textAlign: 'center' }}>
                        <p>사용자 정보를 불러오는 중...</p>
                    </div>
                </div>
            </div>
        );
    }


    return (
        <div className="feedbackPopup">
            <div className="popupContent">
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
    
                {viewingFile ? (
                    <div className="fileDetailView">
                        <div className="videoContent">
                            <div className="fileInfo">
                                <div className="openedFileName">{viewingFile.name}</div>
                                <div className="videoPlayer">
                                    {renderFilePreview(viewingFile)}
                                </div>
                                <p>게시자: {viewingFile.uploader?.id ?? "정보없음"}</p>
                                <p>파일 크기: {isLoadingSize ? '크기 계산 중...' : formatFileSize(viewingFile.size)}</p>
                                <p>생성일: {viewingFile.createdAt}</p>
                                <button className='reUploadBtn'onClick={handleReupload}>작업물 재업로드</button>
                                <button className='workDelBtn' onClick={() => deleteInFeedBack(viewingFile)}>삭제</button>
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
                                                <span className="profileName">{message.sender_name}</span>
                                                <span className="messageTime">{message.time}</span>
                                            </div>
                                            <div className="messageText">{renderMessageText(message.text)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="chatInputContainer">
                                <img src={pencilIcon} alt="입력" className="pencilIcon" />
                                <input
                                    type="text"
                                    className="chatInput"
                                    placeholder="Type a message..."
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                                />
                                <button onClick={handleSendMessage}>
                                    <img src={sendIcon} alt="전송" />
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="folderContainer">
                            {displayedFolders.map((folder, index) => renderFolderRecursively(folder, index))}
                        </div>

                        <div className="fileDescription">파일을 클릭하면 코멘트를 볼 수 있습니다.</div>

                        <button className="addFolderBtn" onClick={handleAddFolder}>폴더 추가</button>
                        <button className="uploadBtn" onClick={toggleUploadPopup}>작업물 업로드</button>

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
            </div>
        </div>
    );    
};

export default FeedbackPopup;
