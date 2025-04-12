import React,{useState,useEffect} from 'react';
import search from '../../icons/search.svg';

const STORAGE_KEY = 'itda_search_history';

const SearchCom = () => {
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
        <div className="contentss">
           <div className='profile_top'>
               <div className='img'>사진</div>
               <div className='info'>
                  <div className='name'>돌멩이리듐</div>
                  <div className='role'>Web-Designer</div>
                  <div className='email'>💌okcoco03@naver.com</div>
                  <div className='grad'>🚩경상국립대학교 컴퓨터공학과 재학중</div>
              </div>
           </div>
            <div className="searchBox searchBox2">
                <div className="input">
                    <div className="icon">
                        <img src={search} alt="search" />
                    </div>
                    <input
                        type="text"
                        placeholder="검색할 친구의 아이디를 입력해 주세요."
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
 



            <div className="friendList">

                <div className="title">친구 목록</div>
                {[1, 2, 3, 4].map((_, i) => (
                    <div className="object" key={i}>
                        <div className="Friend_content">
                            <div className="profile_img">img</div>
                            <div className="info">
                                <div className="name">침착맨</div>
                                <div className="role">Web-Disigner</div>
                            </div>
                        </div>
                        <div className="rightSides">
                            <button className="button-addFriend">프로필 보기</button>
                        </div>
                    </div>
                ))}
            </div>


        </div>
    );
};

export default SearchCom;