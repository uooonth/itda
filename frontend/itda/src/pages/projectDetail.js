import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../css/projectDetail.css";
import { FaRegStar, FaStar } from "react-icons/fa";

export default function ProjectDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const token = localStorage.getItem("access_token");

    const [project, setProject] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [isStarred, setIsStarred] = useState(false);
    const [starCount, setStarCount] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            let userId = null;

            if (token) {
                try {
                    const meRes = await axios.get("http://localhost:8008/me", {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    userId = meRes.data.id;
                    setCurrentUserId(userId);
                } catch {
                    setCurrentUserId(null);
                }
            }

            try {
                const projectRes = await axios.get(`http://localhost:8008/projects/${id}`);
                const data = projectRes.data;
                setProject(data);
                setStarCount(data.starred_users?.length || 0);
                if (token && userId && data.starred_users?.includes(userId)) {
                    setIsStarred(true);
                } else {
                    setIsStarred(false);
                }
            } catch (err) {
                console.error("프로젝트 상세 정보 가져오기 실패", err);
                alert("프로젝트 정보를 불러오지 못했습니다.");
            }
        };

        fetchData();
    }, [id, token]);


    const handleStarToggle = async () => {
        if (!token) {
            alert("로그인이 필요합니다.");
            return;
        }

        try {
            const res = await axios.post(
                `http://localhost:8008/projects/${id}/star`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setIsStarred(res.data.isStarred);
            setStarCount(res.data.starCount);
        } catch (err) {
            console.error("찜 토글 실패", err);
            alert("찜 처리 중 오류가 발생했습니다.");
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("정말로 이 프로젝트를 삭제하시겠습니까?")) return;

        try {
            await axios.delete(`http://localhost:8008/projects/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("프로젝트가 삭제되었습니다.");
            navigate("/home");
        } catch (err) {
            console.error("삭제 실패", err);
            alert("삭제 중 오류가 발생했습니다.");
        }
    };

    if (!project) return <div>로딩 중...</div>;

    const isOwner = currentUserId && project.proposer?.includes(currentUserId);

    return (
        <div className="project-detail">
            <header
                className="project-header"
                style={{
                    backgroundImage: `url(${project.thumbnail ? `http://localhost:8008${project.thumbnail}` : "/images/projectImage.png"})`,
                    backgroundSize: "auto 100%",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right",
                }}
            >

                <div className="header-left">
                    <div className="header-empty" />
                    <div>
                        <div className="header-title">
                            <div className="header-button">
                                <button className="application">지원하기</button>
                                <button className="star" onClick={handleStarToggle}>
                                    {isStarred ? (
                                        <FaStar className="starIcon filled" />
                                    ) : (
                                        <FaRegStar className="starIcon" />
                                    )}
                                    <div className="star-count">{starCount}</div>
                                </button>
                                {isOwner && (
                                    <button className="delete-button" onClick={handleDelete}>삭제</button>
                                )}
                            </div>
                            <p className="project-name">{project.project.name}</p>
                            <p className="explain">{project.explain}</p>
                            <p className="recruitment">신청 인원: {project.proposer.length - 1 || 0}명</p>
                        </div>
                    </div>
                </div>
            </header>

            <p className="detail-title">상세 내용</p>
            <p className="detail-subtitle">해당 내용은 itda에서 제공하는 기본적인 계약 조건이며,</p>
            <p className="detail-subtitle">구체적인 사항은 계약 당사자인 계약자와 근로자가 협의하여 결정하시기 바랍니다.</p>
            <section className="project-details">
                <h2>{project.project.name}</h2>
                <div className="detail-grid">
                    <DetailCard label="모집인원" value={`${project.recruit_number || 0}명`} />
                    <DetailCard label="계약기간" value={project.contract_until} />
                    <DetailCard label="모집분야" value={project.project.classification} />
                    <DetailCard label="급여" value={project.salary_type} />
                    <DetailCard label="대표이메일" value={project.email} />
                    <DetailCard label="경력" value={project.career} />
                    <DetailCard label="모집마감기한" value={project.sign_deadline} />
                    <DetailCard label="학력" value={project.education} />
                </div>
            </section>
        </div>
    );
}

function DetailCard({ label, value }) {
    return (
        <div className="detail-card">
            <p className="label">{label}</p>
            <p className="value">{value}</p>
        </div>
    );
}
