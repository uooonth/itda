import React,{useState,useEffect} from 'react';
import search from '../../icons/search.svg';
import pinBefore from '../../icons/pinBefore.svg';


const STORAGE_KEY = 'itda_search_history';

const HomeContent = () => {
    const [searchHistory, setSearchHistory] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        try {
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });    const [searchInput, setSearchInput] = useState('');

    useEffect(() => {
        const savedHistory = localStorage.getItem(STORAGE_KEY);
        if (savedHistory) {
            setSearchHistory(JSON.parse(savedHistory));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(searchHistory));
    }, [searchHistory]);


    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            const trimmed = searchInput.trim();
            if (trimmed && !searchHistory.includes(trimmed)) {
                setSearchHistory(prev => {
                    const withoutDuplicate = prev.filter(item => item !== trimmed);
                    const updated = [trimmed, ...withoutDuplicate];
        
                    return updated.slice(0, 6);
                });}
            setSearchInput('');
        }
    };

    const handleDeleteOne = (itemToDelete) => {
        setSearchHistory(prev => prev.filter(item => item !== itemToDelete));
    };

    const handleDeleteAll = () => {
        setSearchHistory([]);
    };


    return (
        <div className="content">
            <div className="contentTitle">진행 프로젝트</div>

            <div className="searchBox">
                <div className="input">
                    <div className="icon">
                        <img src={search} alt="search" />
                    </div>
                    <input
                        type="text"
                        placeholder="검색할 프로젝트의 제목 혹은 게시자를 입력하세요."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        maxLength={20}
                    />
                </div>
            </div>

            <div className="searchHistroy">
                {searchHistory.map((item, idx) => (
                    <div className="object" key={idx}>
                        {item}
                        <div className="xBtn" onClick={() => handleDeleteOne(item)}>X</div>
                    </div>
                ))}
                {searchHistory.length > 0 && (
                    <div className="btn" onClick={handleDeleteAll}>모두삭제</div>
                )}
            </div>

            <div className="projectList">
                <div className="title">nn개의 프로젝트가 있어요.</div>
                {[1, 2, 3, 4].map((_, i) => (
                    <div className="object" key={i}>
                        <div className="object_icon">icon자리</div>
                        <div className="object_content">
                            <div className="title">침착맨 유튜브 편집팀</div>
                            <div className="explain">침착맨유튜브를 전문적으로 시청합시다</div>
                            <div className="status">
                                <div className="publisher">● 게시자 침착맨</div>
                                <div className="role">전문시청팀</div>
                            </div>
                        </div>
                        <div className="rightSide">
                            <img src={pinBefore} className="pin" alt="pin" />
                            <div className="deadLine">2025.01.25 마감</div>
                            <div className="lastaccess">3일전 접속</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default HomeContent;