import React, { useState, useRef, useEffect } from 'react';
import '../../css/chat.css';

const ChatContent = () => {
    const [messages, setMessages] = useState([
        { id: 1, text: "안녕!", sender: "other", name: "유저1", profile: "/smileSo.jpg", time: "10:01 AM" },
        { id: 2, text: "안녕! 반가워", sender: "me", name: "나", time: "10:02 AM" },
        { id: 3, text: "테스트다 크하하하하하 요아정말고 요거트아이스크림 수혈?을 먹었는데 아 너무 달다 진짜로로", sender: "other", name: "유저1", profile: "/smileSo.jpg", time: "10:02 AM" },
        { id: 4, text: "물어보지 않았도다리어카세트라이앵글자수채우기너무힘둘다나혼자만레벨업 넷플에 나온 거 보는데 꽤 재밌음", sender: "me", name: "나", time: "10:03 AM" },
    ]);
    const [input, setInput] = useState("");
    const [search, setSearch] = useState("");
    const [rooms, setRooms] = useState([
        { id: 1, name: "프론트엔드 개발자 모임", lastMessage: "안녕ㅇㅇ아너를처음본순간부터좋아했어고백하고싶었는데바보같이...", time: "오전 9:30" },
        { id: 2, name: "데이터 분석 스터디", lastMessage: "이제 누가 개발해주냐.", time: "어제" },
        { id: 3, name: "React 프로젝트", lastMessage: "컴포넌트 구조 짰어요", time: "수요일" },
        { id: 4, name: "테스트1 프로젝트", lastMessage: "컴포넌트 구조 짰어요", time: "수요일" },
        { id: 5, name: "테스트2 프로젝트", lastMessage: "컴포넌트 구조 짰어요", time: "수요일" },
        { id: 6, name: "테스트3 프로젝트", lastMessage: "컴포넌트 구조 짰어요", time: "수요일" },

    ]);
    const messagesEndRef = useRef(null); // 스크롤 이동을 위한 ref

    // 메시지를 보낼 때 실행되는 함수
    const sendMessage = () => {
        if (!input.trim()) return;
        const newMessage = { 
            id: messages.length + 1, 
            text: input, 
            sender: "me", 
            name: "나", 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) 
        };
        setMessages([...messages, newMessage]);
        setInput("");
    };

    // 새 메시지가 추가될 때 자동으로 스크롤을 최하단으로 이동
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);
    
    const filteredRooms = rooms.filter(room =>
        room.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="chatPage">
            <div className="chatList">
                <div className="title">메시지 목록</div>
                <div className="chatSearchContainer">
                    <img src="/SearchIcon.png" alt="검색 아이콘" className="searchIcon" />
                    <input
                        type="text"
                        className="chatSearchInput"
                        placeholder="채팅방 검색"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="chatRoomList">
                    {filteredRooms.map(room => (
                        <div key={room.id} className="chatRoomItem">
                            <div className="chatRoomName">{room.name}</div>
                            <div className="chatRoomLastMessage">{room.lastMessage}</div>
                            <div className="chatRoomTime">{room.time}</div>
                        </div>
                    ))}
                </div>            
            </div>

            <div className="chatContent">
                {/* 채팅 메시지 영역 */}
                <div className="chatMessages">
                    {messages.map(({ id, text, sender, name, profile, time }) => (
                        <div key={id} className={`chatMessage ${sender}`}>
                            {/* 상대방 메시지: 프로필 왼쪽 배치 */}
                            {sender === "other" && <img src={profile} alt="프로필" className="profileImg" />}
                            <div className="chatTextContainer">
                                <span className="chatName">{name}</span>
                                <div className={`chatBubble ${sender}`}>{text}</div>
                                <span className="chatTime">{time}</span>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} /> {/* 스크롤 이동을 위한 요소 */}
                </div>

                {/* 입력창 영역 */}
                <div className="chatInput">
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
    );
};

export default ChatContent;
