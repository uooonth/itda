import React,{useState,useEffect} from 'react';
import search from '../../icons/search.svg';
import pinBefore from '../../icons/pinBefore.svg';
import { useNavigate } from 'react-router-dom';


const STORAGE_KEY = 'itda_search_history';

const HomeContent = ({ username }) => {

    /*--------------------------------------------------------*/
    /*---------------------  검색 History ---------------------*/
    /*--------------------------------------------------------*/
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




    /*--------------------------------------------------------*/
    /*----------------  Project List 불러오기------------------*/
    /*--------------------------------------------------------*/
    const [projects, filteredList] = useState([]);
    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (!token || !username) return;
    
        const fetchProjects = async () => {
          const res = await fetch("http://127.0.0.1:8008/getProjects", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const data = await res.json();
          console.log(data);

          const filtered = data.filter((project) => {
            return project.worker.includes(username);
          });
          
          
          filteredList(filtered);
        };
    
        fetchProjects();
      }, [username]);
    



    /*--------------------------------------------------------*/
    /*----------------  Project 대시보드 입장 ------------------*/
    /*--------------------------------------------------------*/
    const navigate = useNavigate();
    const handleProjectClick = (projectId) => {
        navigate(`/project/${projectId}`, {
            state: { username: username }
        });    };


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
                <div className="title">{projects.length}개의 프로젝트가 있어요.</div>
                {projects.map((project) => (
                    <div className="object" key={project.project.id} onClick={() => handleProjectClick(project.project.id)} style={{ cursor: 'pointer' }}>
                        <div className="object_icon">
                            {/* 썸네일 이미지가 있다면 표시 */}
                            <img src={project.thumbnail || "https://your-default-thumbnail.url"} alt="thumbnail" style={{ width: '60px', height: '60px' }} />
                        </div>
                        <div className="object_content">
                            <div className="title">{project.project.name}</div>
                            <div className="explain">{project.explain}</div>
                            <div className="status">
                                <div className="publisher">● 게시자 {project.proposer?.join(', ')}</div>
                                <div className="role">작업자 {project.worker?.join(', ')}</div>
                            </div>
                        </div>
                        <div className="rightSide">
                            <img src={pinBefore} className="pin" alt="pin" />
                            <div className="deadLine">{project.sign_deadline} 마감</div>
                            <div className="lastaccess">최근 접속 정보 없음</div>
                        </div>
                    </div>
                ))}

            </div>
        </div>
    );
};
export default HomeContent;