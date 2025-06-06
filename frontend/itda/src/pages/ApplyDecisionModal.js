import React, { useState } from "react";
import "../css/ApplyDecisionModal.css";

export default function ApplyDecisionModal({ open, onClose, applicants = [], projectId, onDecision }) {
  const [expandedId, setExpandedId] = useState(null);

  if (!open) return null;

  const toggleExpand = (userId) => {
    setExpandedId(expandedId === userId ? null : userId);
  };

  const handleAccept = async (user_id) => {
    try {
      await fetch(`/api/projects/${projectId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id }),
      });
      onDecision("accepted", user_id);
    } catch (err) {
      console.error(err);
      alert("수락 처리 중 오류가 발생했습니다.");
    }
  };

  const handleReject = async (user_id) => {
    try {
      await fetch(`/api/projects/${projectId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id }),
      });
      onDecision("rejected", user_id);
    } catch (err) {
      console.error(err);
      alert("거절 처리 중 오류가 발생했습니다.");
    }
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <h2>지원자 관리</h2>
        <ul className="applicant-list">
          {applicants.length === 0 && <li>지원자가 없습니다.</li>}
          {applicants.map(applicant => (
            <li key={applicant.user_id} className="applicant-item">
              <div className="applicant-summary">
        
                <span className="applicant-name">{applicant.name}</span>
                <span className="applicant-role">{applicant.role}</span>

                <div className="decision-buttons">
                  <button className="btn btn-accept" onClick={() => handleAccept(applicant.user_id)}>수락</button>
                  <button className="btn btn-reject" onClick={() => handleReject(applicant.user_id)}>거절</button>
                </div>
                <button
                  className="expand-btn"
                  onClick={() => toggleExpand(applicant.user_id)}
                  aria-label="지원자 상세 정보 토글"
                >
                  {expandedId === applicant.user_id ? "▼" : "▶"}
                </button>
              </div>

              {expandedId === applicant.user_id && (
                <div className="applicant-details">
                  <p><strong>이메일:</strong> {applicant.email}</p>
                  <p><strong>소개:</strong> {applicant.introduce}</p>
                  <p><strong>연락처:</strong> {applicant.contact}</p>
                </div>
              )}
            </li>
          ))}
        </ul>

        <button className="close-btn" onClick={onClose}>닫기</button>
      </div>
    </>
  );
}
