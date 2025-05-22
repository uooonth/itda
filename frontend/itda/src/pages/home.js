import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/home.css';

export default function Home() {
    const navigate = useNavigate();
    const isLoggedIn = !!localStorage.getItem('access_token');
    const [selectedTab, setSelectedTab] = useState("인기");

    const handleCreateClick = () => {
        if (!isLoggedIn) {
            alert("로그인이 필요한 서비스입니다.");
            navigate("/login");
        } else {
            navigate("/projectForm");
        }
    };

    const popularProjects = [
        { id: 1, title: "침착맨 유튜브 편집팀", image: "/images/projectImage.png", name: "침착맨", personnel: 10, remaining: 21 },
        { id: 2, title: "침착맨 유튜브 편집팀", image: "/images/projectImage.png", name: "침착맨", personnel: 10, remaining: 21 },
        { id: 3, title: "침착맨 유튜브 편집팀", image: "/images/projectImage.png", name: "침착맨", personnel: 10, remaining: 21 },
        { id: 4, title: "침착맨 유튜브 편집팀", image: "/images/projectImage.png", name: "침착맨", personnel: 10, remaining: 21 },
        { id: 5, title: "침착맨 유튜브 편집팀", image: "/images/projectImage.png", name: "침착맨", personnel: 10, remaining: 21 }
    ];

    const likedProjects = [
        { id: 6, title: "찜한 프로젝트 1", image: "/images/projectImage.png", name: "d", personnel: 1, remaining: 1 },
        { id: 7, title: "찜한 프로젝트 2", image: "/images/projectImage.png", name: "d", personnel: 1, remaining: 1 },
        { id: 8, title: "찜한 프로젝트 3", image: "/images/projectImage.png", name: "d", personnel: 1, remaining: 1 },
    ];

    const getDisplayedProjects = () => {
        switch (selectedTab) {
            case "인기":
                return popularProjects;
            case "찜한 프로젝트":
                return likedProjects;
            default:
                return [];
        }
    };

    const displayedProjects = getDisplayedProjects();

    return (
        <div className="home-content">
            <div className="project-create">
                <div className="main-banner-wrapper">
                    <img src="/images/mainButton.png" alt="로고" className="mainButtonImage" />
                    <div className="main-overlay">
                        <div className="text-overlay">
                            <h2>Collaborate without limits.</h2>
                            <h2>Share, innovate, and grow together.</h2>
                        </div>
                        <button className="create-button" onClick={handleCreateClick}>
                            프로젝트 생성하기 ▶
                        </button>
                    </div>

                    <div className="bottom-content">
                        <div className="left-panel">
                            <input className="search-input" type="text" placeholder="검색할 프로젝트를 입력하세요" />
                            <button
                                className={`tab-button ${selectedTab === "인기" ? "active" : ""}`}
                                onClick={() => setSelectedTab("인기")}
                            >
                                인기
                                <img src="/images/fire.png" alt="인기 아이콘" className="tab-icon" />
                            </button>
                            <button
                                className={`tab-button ${selectedTab === "찜한 프로젝트" ? "active" : ""}`}
                                onClick={() => setSelectedTab("찜한 프로젝트")}
                            >
                                찜한 프로젝트
                                <img src="/images/heart.png" alt="찜 아이콘" className="tab-icon" />
                            </button>
                            <button
                                className={`tab-button ${selectedTab === "작곡" ? "active" : ""}`}
                                onClick={() => setSelectedTab("작곡")}
                            >
                                작곡
                                <img src="/images/headphone.png" alt="작곡 아이콘" className="tab-icon" />
                            </button>
                            <button
                                className={`tab-button ${selectedTab === "틱톡" ? "active" : ""}`}
                                onClick={() => setSelectedTab("틱톡")}
                            >
                                틱톡
                                <img src="/images/thumbUp.png" alt="틱톡 아이콘" className="tab-icon" />
                            </button>
                            <button
                                className={`tab-button ${selectedTab === "그래픽" ? "active" : ""}`}
                                onClick={() => setSelectedTab("그래픽")}
                            >
                                그래픽
                                <img src="/images/brush.png" alt="그래픽 아이콘" className="tab-icon" />
                            </button>
                            <button
                                className={`tab-button ${selectedTab === "애니메이션" ? "active" : ""}`}
                                onClick={() => setSelectedTab("애니메이션")}
                            >
                                애니메이션
                                <img src="/images/paint.png" alt="애니 아이콘" className="tab-icon" />
                            </button>
                            <button
                                className={`tab-button ${selectedTab === "게임" ? "active" : ""}`}
                                onClick={() => setSelectedTab("게임")}
                            >
                                게임
                                <img src="/images/rocket.png" alt="게임 아이콘" className="tab-icon" />
                            </button>
                            <button
                                className={`tab-button ${selectedTab === "기타" ? "active" : ""}`}
                                onClick={() => setSelectedTab("기타")}
                            >
                                기타
                                <img src="/images/hash.png" alt="기타 아이콘" className="tab-icon" />
                            </button>
                        </div>

                        <div className="right-panel">
                            <h2 className="title">모집 중 프로젝트</h2>
                            <div className="project-grid">
                                {displayedProjects.length > 0 ? (
                                    displayedProjects.map((project) => (
                                        <div className="project-card" key={project.id}>
                                            <img src={project.image} alt={project.title} />
                                            <h3>{project.title}</h3>
                                            <h5>{project.name}</h5>
                                            <h4>{project.personnel}명 모집중 | {project.remaining}일 후 마감</h4>
                                        </div>
                                    ))
                                ) : (
                                    <p>프로젝트가 없습니다.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
