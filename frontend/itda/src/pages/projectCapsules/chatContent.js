import React, { useState, useRef, useEffect } from 'react';
import '../../css/chat.css';
import pencilIcon from '../../icons/pencilIcon.png';
import sendIcon from '../../icons/sendIcon.png';
import normalProfile from '../../icons/normal.png';
import { jwtDecode } from "jwt-decode";


const ChatContent = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [search, setSearch] = useState("");
    const [rooms, setRooms] = useState([]);
    const [showCreateRoom, setShowCreateRoom] = useState(false);
    const [showMemberSelect, setShowMemberSelect] = useState(false); // 인원 선택 모달 표시 여부
    const [selectedImage, setSelectedImage] = useState(null); // 업로드한 방 이미지
    const [projectMembers, setProjectMembers] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [newRoomName, setNewRoomName] = useState("");
    const [currentRoomId, setCurrentRoomId] = useState(null);
    const [userId, setUserId] = useState("");
    const [userName, setUserName] = useState("");
    const messagesEndRef = useRef(null);
    const wsRef = useRef(null);
    

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (token) {
            const decoded = jwtDecode(token);
            setUserId(decoded.sub);

            const fetchUserName = async () => {
                try {
                    const res = await fetch(`http://localhost:8008/users-forchatpage/${decoded.sub}`);
                    const data = await res.json();
                    setUserName(data.name);

                } catch {
                    setUserName("알수없음");
                }
            };
            fetchUserName();
        }
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const filteredRooms = rooms.filter(room =>
        room.name.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        if (!userId) return;
        fetchRooms();
    }, [userId]);

    const fetchRooms = async () => {
        try {
            const accessToken = localStorage.getItem("access_token");
            const res = await fetch("http://localhost:8008/chat-rooms", {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            const data = await res.json();
            const roomList = Array.isArray(data) ? data : (data.rooms || []);
            setRooms(roomList);
            if (roomList.length > 0 && !currentRoomId) {
                setCurrentRoomId(roomList[0].id);
            }
        } catch (error) {
            console.error('채팅방 목록 로드 실패:', error);
        }
    };

    useEffect(() => {
        if (!currentRoomId || !userId) return;
        fetchMessages();
    }, [currentRoomId, userId]);

    const fetchMessages = async () => {
        try {
            const accessToken = localStorage.getItem("access_token");
            const res = await fetch(`http://localhost:8008/chat-rooms/${currentRoomId}/messages`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            const data = await res.json();
            const formatted = data.map((msg, idx) => ({
                id: msg.id || idx + 1,
                text: msg.text,
                sender: msg.sender_id === userId ? "me" : "other",
                name: msg.sender_name,
                profile: normalProfile,
                time: new Date(msg.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                }),
            }));
            setMessages(formatted);
        } catch (err) {
            console.error('메시지 불러오기 실패:', err);
        }
    };

    useEffect(() => {
        if (!currentRoomId || !userId) return;

        if (wsRef.current) wsRef.current.close();
        const ws = new WebSocket(`ws://localhost:8008/ws/chat-room/${currentRoomId}`);
        wsRef.current = ws;

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            const newMessage = {
                id: Date.now() + Math.random(),
                text: msg.text,
                sender: msg.sender_id === userId ? "me" : "other",
                name: msg.sender_name,
                profile: normalProfile,
                time: new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
            };
            setMessages(prev => [...prev, newMessage]);
        };

        ws.onclose = () => console.log("WebSocket Closed");
        return () => { if (ws.readyState === WebSocket.OPEN) ws.close(); };
    }, [currentRoomId, userId]);

    useEffect(() => {
        if (showCreateRoom) fetchProjectMembers();
    }, [showCreateRoom]);

    const fetchProjectMembers = async () => {
        try {
            const accessToken = localStorage.getItem("access_token");
            const res = await fetch('http://localhost:8008/users/all', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (!res.ok) {
                setProjectMembers([]);
                return;
            }
            const data = await res.json();
            setProjectMembers(data.users || []);
        } catch {
            setProjectMembers([]);
        }
    };


    const sendMessage = async () => {
        if (!input.trim()) return;
        const messageText = input;
        const newMessage = {
            id: messages.length + 1,
            text: messageText,
            sender: "me",
            name: userName,  
            profile: normalProfile,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
        };
        setMessages(prev => [...prev, newMessage]);
        setInput("");

        try {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                const wsMessage = {
                    sender_id: userId,
                    sender_name: userName,
                    text: messageText,
                    time: new Date().toISOString()
                };
                wsRef.current.send(JSON.stringify(wsMessage));
            }
        } catch (error) {
            console.error('메시지 전송 실패:', error);
        }
    };

    const createChatRoom = async () => {
        if (selectedMembers.length === 0 && !window.confirm('혼자 대화방을 만드시겠습니까?')) return;

        try {
            const accessToken = localStorage.getItem("access_token");

            let finalRoomName = newRoomName.trim();
            if (!finalRoomName) {
                const names = selectedMembers.map(member => member.name);
                finalRoomName = names.join(", ");
            }

            const res = await fetch('http://localhost:8008/chat-rooms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    name: finalRoomName,
                    member_ids: selectedMembers.map(m => m.id)
                })
            });

            if (res.ok) {
                await fetchRooms();
                setShowCreateRoom(false);
                setSelectedMembers([]);
                setNewRoomName("");
                alert('채팅방이 생성되었습니다!');
            } else {
                const errorData = await res.json();
                alert(`채팅방 생성 실패: ${errorData.detail || '알 수 없는 오류'}`);
            }
        } catch {
            alert('네트워크 오류가 발생했습니다.');
        }
    };


    return (
        <div className="chatPage">
            <div className="chatList">
                <div className="title">
                    메시지 목록
                    <button className="createRoomBtn" onClick={() => setShowCreateRoom(true)}>+</button>
                </div>
                <div className="chatSearchContainer">
                    <img src="/SearchIcon.png" alt="검색" className="searchIcon" />
                    <input type="text" className="chatSearchInput" placeholder="채팅방 검색"
                        value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className="chatRoomList">
                    {filteredRooms.map(room => (
                        <div key={room.id}
                            className={`chatRoomItem ${currentRoomId === room.id ? 'active' : ''}`}
                            onClick={() => setCurrentRoomId(room.id)}>
                            <div className="chatRoomName">{room.name}</div>
                            <div className="chatRoomLastMessage">{room.lastMessage}</div>
                            <div className="chatRoomTime">{room.time}</div>
                        </div>
                    ))}
                </div>
            </div>

            {showCreateRoom && (
            <div className="createRoomModal">
                <div className="modalContent">
                <button className="closeBtn" onClick={() => setShowCreateRoom(false)}>×</button>
                <h3 className="modalTitle">초대</h3>

                {/* 방 이름 입력 */}
                <div className="formGroup">
                    <label>방 이름</label>
                    <input
                    type="text"
                    placeholder="방 이름을 입력하세요."
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    className="roomNameInput"
                    />
                </div>

                {/* 초대 인원 */}
                <div className="formGroup">
                    <label>초대 인원</label>
                    <button className="selectBtn" onClick={() => setShowMemberSelect(true)}>인원 선택</button>
                </div>

                {/* 방 이미지 */}
                <div className="formGroup">
                    <label>방 이미지</label>
                    <input
                    type="file"
                    accept="image/*"
                    id="roomImageUpload"
                    onChange={(e) => setSelectedImage(e.target.files[0])}
                    style={{ display: 'none' }}
                    />
                    {selectedImage && <span className="fileName">{selectedImage.name}</span>}
                    <label htmlFor="roomImageUpload" className="imageUploadBtn">
                    이미지 등록/변경
                    </label>
                </div>

                {/* 생성 버튼 */}
                <button onClick={createChatRoom} className="createRoomButton">생성</button>
                </div>
            </div>
            )}
            {showMemberSelect && (
                <div className="memberSelectModal">
                    <div className="modalContent">
                    <button className="backBtn" onClick={() => setShowMemberSelect(false)}>←</button>
                    <h3 className="modalTitle">초대</h3>

                    <input
                        type="text"
                        placeholder="검색할 사용자의 이름을 입력하세요."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="searchInput"
                    />

                    <div className="memberList">
                        {projectMembers
                        .filter(m => m.name.includes(search))
                        .map(member => (
                            <div key={member.id} className="memberItem">
                            <img src={normalProfile} alt="프로필" className="memberProfile" />
                            <div className="memberInfo">
                                <span>{member.name}</span>
                                <span className="memberEmail">{member.email}</span>
                            </div>
                            <button
                                className="addBtn"
                                onClick={() => setSelectedMembers(prev => [...prev, member])}
                            >
                                추가
                            </button>
                            </div>
                        ))}
                    </div>
                    </div>
                </div>
                )}


            <div className="chatContent">
                <div className="chatMessages">
                    {messages.map(({ id, text, sender, name, profile, time }) => (
                        <div key={id} className={`chatMessage ${sender}`}>
                            {sender === "other" && <img src={profile} alt="프로필" className="profileImg" />}
                            <div className="chatTextContainer">
                                <span className="chatName">{name}</span>
                                <div className={`chatBubble ${sender}`}>{text}</div>
                                <span className="chatTime">{time}</span>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <div className="chatInput">
                    <img src={pencilIcon} alt="입력" className="pencilIcon" />
                    <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="메시지를 입력하세요..." />
                    <button onClick={sendMessage}><img src={sendIcon} alt="전송" /></button>
                </div>
            </div>
        </div>
    );
};

export default ChatContent;
