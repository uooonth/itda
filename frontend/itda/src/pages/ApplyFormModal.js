import React, { useState } from "react";
import "../css/ApplyFormModal.css";

export default function ApplyFormModal({ onClose, onSubmit, roles = [] }) {
  const [role, setRole] = useState("");
  const [education, setEducation] = useState("");
  const [contact, setContact] = useState("");
  const [introduce, setIntroduce] = useState("");
  const [file, setFile] = useState(null);

  const educationOptions = ["초졸", "중졸", "고졸", "대졸", "무관"];
  const isFormValid = role && education && contact;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid) return;
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
        <button className="close-button" onClick={onClose}>×</button>
        <h2>신청</h2>
        <div className="h2-description">신청 후에 신청서 수정 및 삭제가 불가능하니, 신중히 작성해주시기 바랍니다.</div>

        <form onSubmit={handleSubmit}>

          <div className="horizontal-selection-group">
            <div className="selection-group">
              <div className="selection-title">지원 역할</div>
              <div className="button-group">
                {roles.map((r, idx) => (
                  <button
                    type="button"
                    key={idx}
                    className={role === r ? "select-button active" : "select-button"}
                    onClick={() => setRole(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="selection-group">
              <div className="selection-title">학력</div>
              <div className="button-group">
                {educationOptions.map((e, idx) => (
                  <button
                    type="button"
                    key={idx}
                    className={education === e ? "select-button active" : "select-button"}
                    onClick={() => setEducation(e)}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <label>
            연락수단
            <div className="field-description">모집자가 연락할 수 있는 수단을 작성해주세요. (예: 010-xxxx-xxxx, example@gmail.com, Discord ID)</div>
            <input type="text" value={contact} onChange={(e) => setContact(e.target.value)} required />
          </label>

          <label>
            자기소개
            <div className="field-description">프로젝트 이력이나 기술 스택은 프로필을 참고하니, 간단히 어필하고 싶은 내용만 작성해주세요. (최대 300자)</div>
            <textarea value={introduce} onChange={(e) => setIntroduce(e.target.value)} rows={5} />
          </label>

          <label>
            첨부파일
            <div className="field-description">요구된 자료가 있다면 첨부해주시고, 이외에 본인을 어필할 수 있는 포트폴리오나 이력서 드으이 자료가 있다면 하나의 파일로 제출해주세요.</div>
            <input type="file" onChange={(e) => setFile(e.target.files[0])} />
          </label>

          <div className="modal-buttons">
            <button className="apply-button" type="submit" disabled={!isFormValid}>신청하기</button>
          </div>
        </form>
      </div>
    </div>
  );
}
