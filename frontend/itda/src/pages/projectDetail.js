import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../css/projectDetail.css";

export default function ProjectDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const token = localStorage.getItem("access_token");

    const [project, setProject] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);

    useEffect(() => {
        if (token) {
            axios.get("http://localhost:8008/me", {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => setCurrentUserId(res.data.id))
                .catch(() => setCurrentUserId(null));
        }

        axios.get(`http://localhost:8008/projects/${id}`)
            .then(res => setProject(res.data))
            .catch(err => {
                console.error("프로젝트 상세 정보 가져오기 실패", err);
                alert("프로젝트 정보를 불러오지 못했습니다.");
            });
    }, [id, token]);

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
                    backgroundImage: `url(${project.thumbnail || "/images/projectImage.png"})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            >
                <div className="header-left">
                    <div className="header-empty" />
                    <div>
                        <div className="header-title">
                            <div className="header-button">
                                <button>지원하기</button>
                                <button>즐겨찾기</button>
                                {isOwner && (
                                    <button className="delete-button" onClick={handleDelete}>삭제</button>
                                )}
                            </div>
                            <h1>{project.project.name}</h1>
                            <p>{project.explain}</p>
                            <p className="recruitment">신청 인원: {project.proposer.length - 1 || 0}명</p>
                        </div>
                    </div>
                </div>
            </header>

            <h2>상세 내용</h2>
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
