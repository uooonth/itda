import React, { useState,useEffect,useCallback } from 'react';
import { useParams,useLocation  } from 'react-router-dom';
import sendIcon from '../../../icons/sendIcon.png';
import pencilIcon from '../../../icons/pencilIcon.png';
import '../../../css/feedbackpopup.css';

const FeedbackPopup = ({ onClose ,projectId,onUploadComplete }) => {
    
    const [folders, setFolders] = useState([]);
    const [isUploadPopupOpen, setUploadPopupOpen] = useState(false); // 업로드 팝업 상태
    const [dragging, setDragging] = useState(false); // 드래그 상태
    const [viewingFile, setViewingFile] = useState(null);
    const [currentFolder, setCurrentFolder] = useState(null); // 현재 폴더 상태
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isDeletePopupOpen, setDeletePopupOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeletionConfirmed, setDeletionConfirmed] = useState(false);
    const [isLoadingSize, setIsLoadingSize] = useState(false); 
    // 데이터 불러오기
    const fetchFoldersAndFiles = useCallback(async () => {

        try {
                const [treeRes, rootFilesRes] = await Promise.all([
                    fetch(`http://localhost:8008/projects/${projectId}/folders/tree`),
                    fetch(`http://localhost:8008/projects/${projectId}/files?no_folder=true`)
                ]);
                const [treeData, rootFilesData] = await Promise.all([
                    treeRes.json(),
                    rootFilesRes.json()
                ]);
                //바보같이 디비에 저장할때 미시간대로 저장돼서 ;;;;;;;;;;;;;;;한국시간대변환을위한 ....
                const dateTimeOptions = {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false, 
                    timeZone: 'Asia/Seoul'
                 };


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
                    uploader:file.uploader
                }));

 
                // 폴더 및 그 폴더에 직접 포함된 파일만 매핑
                const mapFolder = (folder) => {
                    const mappedFiles = (folder.files || []).map(f => ({
                        id: f.id,
                        name: f.name,
                        createdAt: f.uploaded_at
                            ? new Date(f.uploaded_at).toLocaleString('ko-KR', dateTimeOptions)
                            : new Date().toLocaleString('ko-KR', dateTimeOptions),
                        type: 'file',
                        s3Url: f.s3_url,
                        size: f.size ,
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
                console.error("폴더/파일 로딩 실패:", err);
            }
    }, [projectId]);
    useEffect(() => {
        
        fetchFoldersAndFiles();
    }, [projectId]);
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
    
// FeedbackPopup.js 내부
useEffect(() => {
    if (viewingFile) {
        fetchFeedbackMessages(projectId, viewingFile.id);
    }
}, [viewingFile]);

    //애드 폴더
    const handleAddFolder = async () => {
        const name = prompt("새 폴더 이름을 입력하세요");
        if (!name) return;
    
        const parent_id = currentFolder?.folder?.id || null; 
    
        try {
            const response = await fetch(`http://localhost:8008/projects/${projectId}/folders`, {
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

            }        alert("폴더 생성이 완료되었습니다.");
            await fetchFoldersAndFiles(); 
            setCurrentFolder(null);
        } catch (err) {
            alert("폴더 생성 중 오류 발생");
            console.error(err);
        }
    };
    
    // 부모를 재귀적으로 찾아 새 폴더를 추가하는 헬퍼 함수
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

    // 폴더 삭제하기
    const handleDeleteFolder = async (index) => {
        const targetFolder = displayedFolders[index];
        if (!targetFolder || targetFolder.type !== 'folder') return;
    
        await deleteFolderFromServer(targetFolder.id);
    
        const updated = removeFolderById(folders, targetFolder.id);
        setFolders(updated);
        setCurrentFolder(null);
        alert("폴더가 삭제되었습니다.");
    };
    
    //서버에서 파일삭제
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
    
    
    // 파일 업로드 팝업 열기/닫기
    const toggleUploadPopup = () => {
        setUploadPopupOpen(!isUploadPopupOpen);
    };
    // 폴더 찾기 헬퍼 함수
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
    // 파일 업로드 처리
    const location = useLocation();
    const { username } = location.state || {};
    const handleFileUpload = async (e) => {
        const localFile = e.target.files[0];
        if (!localFile || !projectId) return;

        const formData = new FormData();
        formData.append("file", localFile);
        formData.append("uploader", username)
        if (currentFolder && currentFolder.folder?.id) {
            formData.append("folder_id", currentFolder.folder.id);
            console.log("currentFolder.folder.id", currentFolder.folder.id);
        }

        try {
            const response = await fetch(`http://localhost:8008/upload/s3/${projectId}`, {
                method: "POST",
                body: formData
            });
            if (!response.ok) throw new Error("파일 업로드 실패");
    
            const data = await response.json();
            const newFile = {
                id: data.id,
                name: data.name,
                size: data.size, 
                createdAt: data.uploaded_at 
                    ? new Date(data.uploaded_at).toLocaleString() 
                    : new Date().toLocaleString(),                
                    type: 'file',
                s3Url: data.s3_url || "", 
            
            };

            if (currentFolder && currentFolder.folder?.id) {
                const updatedFolders = insertFileIntoFolderById(folders, currentFolder.folder.id, newFile);
                setFolders(updatedFolders);
                const refreshedCurrent = findFolderById(updatedFolders, currentFolder.folder.id);
                if (refreshedCurrent) { 
                    setCurrentFolder({ folder: refreshedCurrent });
                }
            } else {
                
            }
            alert("파일 업로드에 성공했습니다.");
            setUploadPopupOpen(false);
            setCurrentFolder(null);
            fetchFoldersAndFiles();

        } catch (err) {
            alert("파일 업로드에 실패했습니다.");
            console.error(err);
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
            setUploadPopupOpen(false); // 팝업 닫기
        }
    };

    // 파일 상세 페이지 보기 (더블 클릭 시)
    const handleFileDoubleClick = async (file) => {
        try {
            setViewingFile(null); 
            const res = await fetch(`http://localhost:8008/files/presigned/${file.id}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Presigned URL fetch 실패");
            const tempRes = await fetch(`http://localhost:8008/projects/${projectId}/files`);
            const fileList = await tempRes.json();
    
            // id로 해당 파일 찾기
            const matched = fileList.find((f) => f.id === file.id);
            const uploaderId = matched?.uploader?.id ?? "정보없음";
            const updatedFile = { ...file, s3Url: data.url, uploader: { id: uploaderId },
        };console.log(uploaderId)
            setViewingFile(updatedFile);
            console.log(updatedFile)
        } catch (error) {
            alert("파일 미리보기를 불러올 수 없습니다.");
        }
    };
    
    
    
    //부모폴더찾기헬퍼
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
      
    // 파일 상세 보기에서 뒤로가기
    const handleBackToFolder = () => {
        setViewingFile(null);
    };

    // 폴더 더블 클릭 시 폴더 열기
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
      
    //폴더 재귀로 렌더링
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
    
                        {/* 재귀적으로 children 렌더링 */}
                        {folder.contents && folder.contents.length > 0 }

                    </div>
                )}
            </div>
        );
    };
    
    //메시지보내기
    const handleSendMessage = async () => {
        if (!inputText.trim()) return;
    
        const msg = {
            user: username,
            message: inputText,
            timestamp: new Date().toISOString()
        };

        setMessages([...messages, msg]);
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
        if (size === null || size === undefined || size < 0) return '크기 정보 없음';
        if (size === 0 && typeof size === 'number') return '0 bytes'; 
        if (size < 1024) return `${size} bytes`;
        if (size < 1048576) return `${(size / 1024).toFixed(2)} KB`;
        return `${(size / 1048576).toFixed(2)} MB`;
    };
    // 파일 확장자 추출 헬퍼 함수
    const getFileExtension = (filename) => {
        if (!filename || typeof filename !== 'string') return '';
        return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2).toLowerCase();
    };
    // 삭제팝업 핸들
    const handleDeleteClick = (index) => {
        setItemToDelete(index);
        setDeletePopupOpen(true);
    };
    //삭제 폴더 with서버
    const deleteFolderFromServer = async (folderId) => {
        try {
            const response = await fetch(`http://localhost:8008/projects/${projectId}/folders/${folderId}`, {
                method: "DELETE"
            });
            if (!response.ok) throw new Error("서버 폴더 삭제 실패");
        } catch (error) {
            alert("오류가 발생했습니다. 지속되면 관리자에게 문의 하세요.");
            console.error(error);
        }
    };
    //재귀삭제헬퍼
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
    
    // 삭제 확인
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
      
    
    // 삭제 취소
    const handleCancelDelete = () => {
        setDeletePopupOpen(false);
        setItemToDelete(null);
    };
    // 접었다 펼치기 이름
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
   // TXT 파일 미리보기 컴포넌트
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
    //재업로드
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
    
    //피드백페이지에서 파일 삭제하기
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
    
                // 삭제 후 폴더/파일 목록 다시 불러오기
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
    
    //메시지 가져오기
    const fetchFeedbackMessages = async (projectId, fileId) => {
        try {
            const res = await fetch(`http://localhost:8008/projects/${projectId}/files/${fileId}/feedback`);
            const data = await res.json();
            setMessages(data); // state에 저장
        } catch (error) {
            console.error("피드백 메시지 불러오기 실패:", error);
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
                    <div className="fileDetailView">
                        <div className="videoContent"> {/* 미리보기 및 파일 정보를 포함하는 왼쪽 영역 */}
                            <div className="fileInfo"> {/* 이름, 미리보기, 메타데이터 래퍼 */}
                                <div className="openedFileName">{viewingFile.name}</div>
                                <div className="videoPlayer"> {/* 실제 미리보기 컨텐츠가 렌더링될 곳 */}
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
    <React.Fragment key={index}>
        <div className="messageItem">
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
        <div className="messageText">{message.message}</div>
    </React.Fragment>
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
                                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()} // 엔터 키로 전송
                                />
                                <button onClick={handleSendMessage}>
                                    <img src={sendIcon} alt="전송" />
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* 폴더/파일 리스트 */}
                        <div className="folderContainer">
                        {displayedFolders.map((folder, index) => renderFolderRecursively(folder, index))}

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