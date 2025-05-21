import React from "react";
import "../css/projectDetail.css";

const exampleProject = {
    title: "AI 기반 협업 플랫폼 개발",
    description: "AI 기술을 활용한 차세대 협업 도구 개발 프로젝트입니다.",
    thumbnailUrl: "https://mblogthumb-phinf.pstatic.net/MjAyMTA5MDNfOSAg/MDAxNjMwNjA3MDg1MzQw.thP3RTMsLwHI4bGHnlm2omRPQ3cCXAy6k_AjbSAn6ucg.2kbpPTZyS5WHxKPdCAug2xmj5XGI11Bo4GFVSWG2TP4g.PNG.pudingy/%EC%B9%A8%ED%88%AC%EB%B6%80%EA%B0%84%ED%8C%90%EF%BC%BF2019%EF%BC%8D2.png?type=w800",
    recruitment: "5명",
    details: {
        모집인원: "5명",
        계약기간: "6개월",
        모집분야: "프론트엔드",
        급여: "협의",
        대표이메일: "contact@example.com",
        경력: "무관",
        모집마감기한: "2025-06-15",
        학력: "무관",
    },
};

export default function ProjectDetail() {
    return (
        <div className="project-detail">
            <header
                className="project-header"
                style={{
                    backgroundImage: `url(${exampleProject.thumbnailUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            >
                <div className="header-left">
                    <div className="header-empty">
                    </div>
                    <div>
                        <div className="header-title">
                            <div className="header-button">
                                <button>지원하기</button>
                                <button>즐겨찾기</button>
                            </div>
                            <h1>{exampleProject.title}</h1>
                            <p>{exampleProject.description}</p>
                            <p className="recruitment">모집 인원: {exampleProject.recruitment}</p>
                        </div>
                    </div>
                </div>
            </header>
            <h2>상세 내용</h2>
            <section className="project-details">
                <h2>{exampleProject.title}</h2>
                <div className="detail-grid">
                    {Object.entries(exampleProject.details).map(([label, value], index) => (
                        <DetailCard key={index} label={label} value={value} />
                    ))}
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
