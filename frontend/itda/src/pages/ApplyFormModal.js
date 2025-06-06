import React, { useState } from "react";
import "../css/ApplyFormModal.css";

export default function ApplyFormModal({ onClose, onSubmit, roles = [] }) {
  const [role, setRole] = useState("");
  const [education, setEducation] = useState("");
  const [contact, setContact] = useState("");
  const [introduce, setIntroduce] = useState("");
  const [file, setFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("role", role);
    formData.append("education", education);
    formData.append("contact", contact);
    formData.append("introduce", introduce);
    if (file) formData.append("file", file);
    onSubmit(formData);
  };

  return (
    <div className="apply-modal-backdrop">
      <div className="apply-modal">
        <h2>프로젝트 지원</h2>
        <form onSubmit={handleSubmit}>
          <label>
            지원 역할
            <select value={role} onChange={(e) => setRole(e.target.value)} required>
              <option value="">선택하세요</option>
              {roles.map((r, idx) => (
                <option key={idx} value={r}>{r}</option>
              ))}
            </select>
          </label>

          <label>
            학력
            <select value={education} onChange={(e) => setEducation(e.target.value)}>
              <option value="초졸">초졸</option>
              <option value="중졸">중졸</option>
              <option value="고졸">고졸</option>
              <option value="대졸">대졸</option>
              <option value="무관">무관</option>
            </select>
          </label>

          <label>
            연락수단
            <input type="text" value={contact} onChange={(e) => setContact(e.target.value)} required />
          </label>

          <label>
            자기소개
            <textarea value={introduce} onChange={(e) => setIntroduce(e.target.value)} rows={5} required />
          </label>

          <label>
            첨부파일
            <input type="file" onChange={(e) => setFile(e.target.files[0])} />
          </label>

          <div className="modal-buttons">
            <button type="submit">지원 제출</button>
            <button type="button" onClick={onClose}>닫기</button>
          </div>
        </form>
      </div>
    </div>
  );
}
