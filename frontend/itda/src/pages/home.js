import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/home.css';

export default function Home() {
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();
    const isLoggedIn = !!localStorage.getItem('access_token');
    const [selectedTab, setSelectedTab] = useState("인기");
    const [projects, setProjects] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await axios.get("http://localhost:8008/projects");
                setProjects(res.data);
            } catch (err) {
                console.error("프로젝트 목록 가져오기 실패", err);
                alert("프로젝트 목록을 불러올 수 없습니다.");
            }
        };

        const fetchCurrentUser = async () => {
            const token = localStorage.getItem('access_token');
            if (!token) return;

            try {
                const res = await axios.get("http://localhost:8008/me", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCurrentUserId(res.data.id);
            } catch (err) {
                console.error("유저 정보 가져오기 실패", err);
            }
        };

        fetchProjects();
        fetchCurrentUser();
    }, []);

    const handleCreateClick = () => {
        if (!isLoggedIn) {
            alert("로그인이 필요한 서비스입니다.");
            navigate("/login");
        } else {
            navigate("/projectForm", { state: { fromButton: true } });
        }
    };

    const getDisplayedProjects = () => {
        return projects
            .filter(p => {
                if (selectedTab === "찜한 프로젝트") {
                    return p.starred_users?.includes(currentUserId);
                }
                return selectedTab === "인기" || p.project.classification === selectedTab;
            })
            .filter(p =>
                p.project.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
    };

    const displayedProjects = getDisplayedProjects();

    return (
        <div className="home-content">
            <div className="project-create">
                <div className="main-banner-wrapper">
                    <div className="project-create-button">
                        <img src="/images/mainButton.png" alt="로고" className="mainButtonImage" />
                        <div className="main-overlay">
                            <div className="text-overlay">
                                <p><span className='focus'>Collaborate</span> without limits.</p>
                                <p>Share, innovate, and grow <span className='focus'>together</span>.</p>
                            </div>
                            <button className="create-button" onClick={handleCreateClick}>
                                프로젝트 생성하기 ▶
                            </button>
                        </div>
                    </div>


                    <div className="bottom-content">
                        <div className="left-panel">
                            <input
                                className="search-input"
                                type="text"
                                placeholder="검색할 프로젝트를 입력하세요"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />

                            {["인기", "찜한 프로젝트", "유튜브", "작곡", "틱톡", "그래픽", "애니메이션", "게임", "기타"].map(tab => (
                                <button
                                    key={tab}
                                    className={`tab-button ${selectedTab === tab ? "active" : ""}`}
                                    onClick={() => setSelectedTab(tab)}
                                >
                                    {tab}
                                    <img
                                        src={`/images/${tab === "인기" ? "fire" :
                                            tab === "찜한 프로젝트" ? "heart" :
                                                tab === "작곡" ? "headphone" :
                                                    tab === "틱톡" ? "thumbUp" :
                                                        tab === "그래픽" ? "brush" :
                                                            tab === "애니메이션" ? "paint" :
                                                                tab === "게임" ? "rocket" : "hash"
                                            }.png`}
                                        alt={`${tab} 아이콘`}
                                        className="tab-icon"
                                    />
                                </button>
                            ))}
                        </div>

                        <div className="right-panel">
                            <h2 className="title">모집 중 프로젝트</h2>
                            <div className="project-grid">
                                {displayedProjects.length > 0 ? (
                                    displayedProjects.map((project) => (
                                        <div className="project-card" key={project.id} onClick={() => navigate(`/projects/${project.id}`)}>
                                            <img
                                                src={project.thumbnail ? `http://localhost:8008${project.thumbnail}` : "/images/projectImage.png"}
                                                alt={project.title}
                                            />

                                            <div className="card-overlay">
                                                <span className="overlay-text">정보 확인하기</span>
                                            </div>
                                            <h3>{project.project.name}</h3>
                                            <h5>{project.proposer?.[0] || "작성자 없음"}</h5>
                                            <h4>
                                                {(project.recruitNumber || 0)}명 모집중 |{" "}
                                                {project.sign_deadline ? (() => {
                                                    const remainingDays = Math.ceil(
                                                        (new Date(project.sign_deadline) - new Date()) / (1000 * 60 * 60 * 24)
                                                    );
                                                    return remainingDays < 0 ? "마감됨" : `${remainingDays}일 후 마감`;
                                                })() : "마감일 없음"}
                                            </h4>
                                        </div>
                                    ))
                                ) : (
                                    <p className='empty-p'>프로젝트가 없습니다.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
