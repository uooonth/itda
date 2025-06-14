import React, { useState } from "react";
import ReactDOM from "react-dom";
import "../css/ApplyDecisionModal.css";
import { useNavigate } from "react-router-dom";
import { FaTimes } from "react-icons/fa";
import axios from "axios";

export default function ApplyDecisionModal({ open, onClose, applicants = [], projectId, onDecision }) {
  const [expandedId, setExpandedId] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");

  if (!open) return null;

  const toggleExpand = (userId) => {
    setExpandedId(expandedId === userId ? null : userId);
  };

  const handleAccept = async (user_id) => {
    try {
      await axios.post(
        `http://localhost:8008/projects/${projectId}/accept`,
        { user_id },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      onDecision("accepted", user_id);
    } catch (err) {
      console.error(err);
      alert("수락 처리 중 오류가 발생했습니다.");
    }
  };

  const handleReject = async (user_id) => {
    try {
      await axios.post(
        `http://localhost:8008/projects/${projectId}/reject`,
        { user_id },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      onDecision("rejected", user_id);
    } catch (err) {
      console.error(err);
      alert("거절 처리 중 오류가 발생했습니다.");
    }
  };

  return ReactDOM.createPortal(
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}><FaTimes size={20} /></button>
        <h2>신청자 목록</h2>
        <p className="description">프로필 사진을 클릭하면 잇다 프로필화면으로 이동합니다.</p>
        <ul className="applicant-list">
          {applicants.length === 0 && <li>지원자가 없습니다.</li>}
          {applicants.map(applicant => (
            <li key={applicant.user_id} className="applicant-item">
              <div className="applicant-summary">
                <img
                  src={applicant.profile_image}
                  alt={applicant.name}
                  className="profile-image"
                  onClick={() => navigate(`/profile/${applicant.user_id}`)}
                />
                <span className="applicant-name">{applicant.name}</span>

                <button className="btn reject" onClick={() => handleReject(applicant.user_id)}>거절</button>
                <button className="btn accept" onClick={() => handleAccept(applicant.user_id)}>승인</button>
                <button className="btn view" onClick={() => toggleExpand(applicant.user_id)}>신청서보기</button>
              </div>

              {expandedId === applicant.user_id && (
                <div className="applicant-details">
                  <p><strong>지원 역할:</strong> {applicant.role}</p>
                  <p><strong>학력:</strong> {applicant.education}</p>
                  <p><strong>이메일:</strong> {applicant.email}</p>
                  <p><strong>소개:</strong> {applicant.introduce}</p>
                  <p><strong>연락처:</strong> {applicant.contact}</p>
                  {applicant.file && (
                    <p>
                      <strong>첨부파일:</strong> <a className="file-link" href={applicant.file} target="_blank" rel="noopener noreferrer">다운로드</a>
                    </p>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </>,
    document.body
  );
}
