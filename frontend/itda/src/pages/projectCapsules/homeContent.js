import React,{useState,useEffect} from 'react';
import search from '../../icons/search.svg';
import pinBefore from '../../icons/pinBefore.svg';
import pinAfter from '../../icons/pinAfter.png'
import { useNavigate } from 'react-router-dom';


const STORAGE_KEY = 'itda_search_history';

const HomeContent = ({ username }) => {

/*--------------------------------------------------------*/
/*---------------------  검색 History ---------------------*/
/*--------------------------------------------------------*/
    const [projects, setProjects] = useState([])

    const [filteredProjects, setFilteredProjects] = useState([]);
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
                performSearch(trimmed);
        }
    };
    const performSearch = (searchTerm) => {
        //검색 입력값 searchTerm이 없다면 > 모든 프로젝트 리스트 출력
        if (!searchTerm.trim()) {
            setFilteredProjects(projects);
            return;
        }
        //검색 입력값 searchTerm이 있다면 > 글자만 일치하면 되므로 글자 필터링 해준 후 모든 리스트
        // projects에서 일치하는 값(프로젝트 이름, 설명, 작업자)이 있는 결과만 출력
        const filtered = projects.filter(project => {
            const projectName = project.project.name.toLowerCase();
            const projectExplain = project.explain.toLowerCase();
            const workers = project.worker?.join(' ').toLowerCase() || '';
            const searchLower = searchTerm.toLowerCase();

            return projectName.includes(searchLower) ||
                   projectExplain.includes(searchLower) ||
                   workers.includes(searchLower);
        });

        setFilteredProjects(filtered);
    };

    useEffect(() => {
        performSearch(searchInput);
    }, [searchInput, projects]);

    const handleDeleteOne = (itemToDelete) => {
        setSearchHistory(prev => prev.filter(item => item !== itemToDelete));
    };

    const handleDeleteAll = () => {
        setSearchHistory([]);
    };




/*--------------------------------------------------------*/
/*----------------  Project List 불러오기------------------*/
/*--------------------------------------------------------*/
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
          const filtered = data.filter((project) => {
            return project.worker.includes(username);
          });
          //전역변수 filteredProjects에 필터링 된 데이터 저장
          setFilteredProjects(filtered);
          setProjects(filtered);
        };
    
        fetchProjects();
        fetchPinnedProjects(); 
      }, [username]);
    



/*--------------------------------------------------------*/
/*----------------  Project 대시보드 입장 ------------------*/
/*--------------------------------------------------------*/
    const navigate = useNavigate();

    const handleProjectClick = (projectId) => {
        // 최근 접속일 체킹을 위한 현재 시각 저장
        const now = new Date().toISOString();
        const updatedTimes = {
            ...lastAccessTimes,
            [projectId]: now
        };
        //현재 시각을 최근 접속일로 변경 & 로컬 storage저장
        setLastAccessTimes(updatedTimes);
        localStorage.setItem(`project_access_${username}`, JSON.stringify(updatedTimes));
        //입장 할 프로젝트의 id를 담은 url로 프로젝트 관리 탭 입장
        navigate(`/project/${projectId}`, {
            state: { username: username }
        });
    };
    




/*--------------------------------------------------------*/
/*------------------  Project 고정 -----------------------*/
/*--------------------------------------------------------*/
    const [pinnedProjects, setPinnedProjects] = useState([])
    const fetchPinnedProjects = async () => {
        if (!username) return;
        
        try {
            const response = await fetch(`http://127.0.0.1:8008/users/${username}/pinned-projects`);
            const data = await response.json();
            setPinnedProjects(data.pinned_projects || []);
        } catch (error) {
            console.error('핀된 프로젝트 조회 실패:', error);
        }
    };

    const handlePinToggle = async (e, projectId) => {
        e.stopPropagation(); // 프로젝트 클릭 이벤트 방지
        
        try {
            const response = await fetch(`http://127.0.0.1:8008/users/${username}/pin-project/${projectId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem("access_token")}`,
                }
            });

            if (response.ok) {
                const data = await response.json();
                setPinnedProjects(data.pinned_projects);
                console.log(data.message);
            } else {
                const errorData = await response.json();
                alert(errorData.detail || '핀 업데이트에 실패했습니다.');
            }
        } catch (error) {
            console.error('핀 토글 실패:', error);
            alert('핀 업데이트 중 오류가 발생했습니다.');
        }
    };

    const sortedProjects = [...filteredProjects].sort((a, b) => {
        const aIsPinned = pinnedProjects.includes(a.project.id);
        const bIsPinned = pinnedProjects.includes(b.project.id);
        
        if (aIsPinned && !bIsPinned) return -1;
        if (!aIsPinned && bIsPinned) return 1;
        return 0;
    });





/*--------------------------------------------------------*/
/*-----------------------  최근접속 -----------------------*/
/*--------------------------------------------------------*/
    const [lastAccessTimes, setLastAccessTimes] = useState({});

    // 컴포넌트 마운트 시 로컬스토리지에서 불러오기
    useEffect(() => {
        const savedTimes = localStorage.getItem(`project_access_${username}`);
        if (savedTimes) {
            setLastAccessTimes(JSON.parse(savedTimes));
        }
    }, [username]);
    
    // 시간 포맷팅 함수
    const formatLastAccess = (timestamp) => {
        if (!timestamp) return "접속 기록 없음";
        
        const now = new Date();
        const accessTime = new Date(timestamp);
        const diffMs = now - accessTime;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMins < 1) return "방금 전";
        if (diffMins < 60) return `${diffMins}분 전`;
        if (diffHours < 24) return `${diffHours}시간 전`;
        if (diffDays < 7) return `${diffDays}일 전`;
        return accessTime.toLocaleDateString();
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

            {!searchInput && searchHistory.length > 0 && (
                <div className="searchHistroy">
                    {searchHistory.map((item, idx) => (
                        <div 
                            className="object" 
                            key={idx}
                            onClick={() => setSearchInput(item)} 
                            style={{ cursor: 'pointer' }}
                        >
                            {item}
                            <div className="xBtn" onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteOne(item);
                            }}>X</div>
                        </div>
                    ))}
                    <div className="btn" onClick={handleDeleteAll}>모두삭제</div>
                </div>
            )}

            <div className="projectList">
                <div className="title">
                    {searchInput ? (
                        <>
                            "{searchInput}" 검색 결과: {filteredProjects.length}개
                            {filteredProjects.length !== projects.length && (
                                <span style={{ color: '#666', fontSize: '14px', marginLeft: '10px' }}>
                                    (전체 {projects.length}개 중)
                                </span>
                            )}
                        </>
                    ) : (
                        `${projects.length}개의 프로젝트가 있어요.`
                    )}

                </div>
                
                {sortedProjects.length > 0 ? (
                    sortedProjects.map((project) => {
                        const isPinned = pinnedProjects.includes(project.project.id);
                        const lastAccess = lastAccessTimes[project.project.id]; 
                        
                        return (
                            <div 
                                className={`object ${isPinned ? 'pinned-project' : ''}`}
                                key={project.project.id} 
                                onClick={() => handleProjectClick(project.project.id)} 
                                style={{ 
                                    cursor: 'pointer',
                                    border: isPinned ? '2px solid #ffd700' : '1px solid #e0e0e0',
                                    backgroundColor: isPinned ? '#fffbf0' : 'white'
                                }}
                            >
                                <div className="object_icon">
                                    <img 
                                        src={project.thumbnail || "https://your-default-thumbnail.url"} 
                                        alt="thumbnail" 
                                        style={{ width: '60px', height: '60px' }} 
                                    />
                                </div>
                                <div className="object_content">
                                    <div className="title">
                                        {isPinned && <span style={{ color: '#ffd700' }}></span>}
                                        {project.project.name}
                                    </div>
                                    <div className="explain">{project.explain}</div>
                                    <div className="status">
                                        <div className="publisher">● 게시자 {project.proposer?.join(', ')}</div>
                                        <div className="role">작업자 {project.worker?.join(', ')}</div>
                                    </div>
                                </div>
                                <div className="rightSide">
                                    <img 
                                        src={isPinned ? pinAfter : pinBefore} 
                                        className="pin" 
                                        alt="pin" 
                                        onClick={(e) => handlePinToggle(e, project.project.id)}
                                        style={{ 
                                            cursor: 'pointer',
                                            filter: isPinned ? 'none' : 'grayscale(100%)',
                                            transition: 'all 0.2s ease'
                                        }}
                                        title={isPinned ? '핀 해제' : '핀 고정'}
                                    />
                                    <div className="deadLine">{project.sign_deadline} 마감</div>
                                    <div className="lastaccess">
                                        {formatLastAccess(lastAccess)} 
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '40px 20px', 
                        color: '#666',
                        fontSize: '16px'
                    }}>
                        {searchInput ? 
                            `"${searchInput}"에 대한 검색 결과가 없습니다.` : 
                            '참여 중인 프로젝트가 없습니다.'
                        }
                    </div>
                )}
            </div>
        </div>
    );
};

export default HomeContent;
