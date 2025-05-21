import { useState, useMemo } from "react";
import "../../css/projectForm.css";
import { useNavigate } from "react-router-dom";

export default function ProjectForm() {
    const navigate = useNavigate();

    const [showCancelModal, setShowCancelModal] = useState(false);
    const [form, setForm] = useState({
        projectName: "",
        roles: [],
        roleInput: "",
        description: "",
        deadline: "",
        payType: "",
        education: "",
        customEducation: "",
        experience: "",
        customExperience: "",
        category: "",
        email: ""
    });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    const addRole = () => {
        if (form.roleInput.trim() !== "" && !form.roles.includes(form.roleInput)) {
            setForm({
                ...form,
                roles: [...form.roles, form.roleInput.trim()],
                roleInput: ""
            });
        }
    };

    const removeRole = (role) => {
        setForm({
            ...form,
            roles: form.roles.filter(r => r !== role)
        });
    };

    // 모든 필수 필드가 입력되었는지 확인
    const isFormValid = useMemo(() => {
        return (
            form.projectName.trim() !== "" &&
            form.roles.length > 0 &&
            form.description.trim() !== "" &&
            form.deadline !== "" &&
            form.payType !== "" &&
            form.education !== "" &&
            (form.education !== "기타" || form.customEducation.trim() !== "") &&
            form.experience !== "" &&
            (form.experience !== "기타" || form.customExperience.trim() !== "") &&
            form.category !== "" &&
            form.email.trim() !== "" &&
            emailRegex.test(form.email)
        );
    }, [form]);

    return (
        <div className="projectForm-container">
            <h2 className="projectForm-title">회원가입</h2>

            <div className="projectForm-step">
                <div className="step">
                    <div className="circle now-circle">
                        <img src="/images/agreement.png" alt="" />
                    </div>
                    <p>정보 입력</p>
                </div>
                <div className="step-line"></div>
                <div className="step">
                    <div className="circle">
                        <img src="/images/form.png" alt="" />
                    </div>
                    <p>인원 초대</p>
                </div>
                <div className="step-line"></div>
                <div className="step">
                    <div className="circle">
                        <img src="/images/verification.png" alt="" />
                    </div>
                    <p>생성 완료</p>
                </div>
            </div>

            <hr className="projectform-line" />

            <div className="project-form">
                <div className="projectForm-row">
                    <label>프로젝트 이름<span className="required">*</span></label>
                    <input 
                        name="projectName" 
                        placeholder="제목을 입력해주세요"
                        value={form.projectName} 
                        onChange={handleChange} required />
                </div>

                <div className="projectForm-row">
                    <label>역할 설정<span className="required">*</span></label>
                    <div className="tag-input">
                        <input
                            type="text"
                            name="roleInput"
                            value={form.roleInput}
                            onChange={handleChange}
                            placeholder="추가할 역할을 입력해주세요"
                        />
                        <button type="button" onClick={addRole}>+</button>
                        <div className="tag-list">
                            {form.roles.map((role, idx) => (
                                <span key={idx} className="tag">
                                    {role} <button type="button" onClick={() => removeRole(role)}>x</button>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="projectForm-row">
                    <label>프로젝트 소개<span className="required">*</span></label>
                    <textarea name="description" value={form.description} onChange={handleChange} placeholder="프로젝트 소개를 입력해 주세요. 가능한 자세히 입력하시면 좋습니다"/>
                </div>

                <div className="projectForm-row">
                    <label>모집 마감 기한<span className="required">*</span></label>
                    <input type="date" name="deadline" value={form.deadline} onChange={handleChange} required />
                </div>

                <div className="projectForm-row">
                    <label>급여 형태<span className="required">*</span></label>
                    <select name="payType" value={form.payType} onChange={handleChange} required>
                        <option value="">선택</option>
                        <option value="시급">시급</option>
                        <option value="주급">주급</option>
                        <option value="월급">월급</option>
                        <option value="건당">건당</option>
                    </select>
                </div>

                <div className="projectForm-row">
                    <label>학력<span className="required">*</span></label>
                    <div className="radio-group">
                        {['학력무관', '초졸이상', '중졸이상', '고졸이상', '대졸이상'].map(level => (
                            <label key={level}>
                                <input
                                    type="radio"
                                    name="education"
                                    value={level}
                                    checked={form.education === level}
                                    onChange={handleChange}
                                /> {level}
                            </label>
                        ))}
                        <label>
                            <input
                                type="radio"
                                name="education"
                                value="기타"
                                checked={form.education === '기타'}
                                onChange={handleChange}
                            /> 기타
                            <input
                                type="text"
                                name="customEducation"
                                value={form.customEducation}
                                onChange={handleChange}
                                placeholder="직접 입력"
                            />

                        </label>
                    </div>
                </div>

                <div className="projectForm-row">
                    <label>경력<span className="required">*</span></label>
                    <div className="radio-group">
                        {['신입', '경력무관'].map(exp => (
                            <label key={exp}>
                                <input
                                    type="radio"
                                    name="experience"
                                    value={exp}
                                    checked={form.experience === exp}
                                    onChange={handleChange}
                                /> {exp}
                            </label>
                        ))}
                        <label>
                            <input
                                type="radio"
                                name="experience"
                                value="기타"
                                checked={form.experience === '기타'}
                                onChange={handleChange}
                            /> 기타
                            <input
                                type="text"
                                name="customExperience"
                                value={form.customExperience}
                                onChange={handleChange}
                                placeholder="직접 입력"
                            />
                        </label>
                    </div>
                </div>

                <div className="projectForm-row">
                    <label>프로젝트 분류<span className="required">*</span></label>
                    <select name="category" value={form.category} onChange={handleChange} required>
                        <option value="">선택</option>
                        <option value="영상편집">영상편집</option>
                        <option value="디자인">디자인</option>
                        <option value="개발">개발</option>
                        <option value="기획">기획</option>
                    </select>
                </div>

                <div className="projectForm-row">
                    <label>대표 이메일<span className="required">*</span></label>
                    <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        placeholder="example@domain.com"
                    />
                </div>
            </div>

            <hr className="projectform-line" />

            <div className="form-button-group">
                <button className="form-cancel-button" onClick={() => setShowCancelModal(true)}>취소</button>
                <button
                    className="form-next-button"
                    disabled={!isFormValid}
                    onClick={() => navigate("/projectInvite")}
                >
                    다음
                </button>
            </div>

            {showCancelModal && (
                <div className="modal">
                    <p className="imotion">🧐</p>
                    <p>정말로 취소하시겠습니까?</p>
                    <div className="modal-buttons">
                        <button onClick={() => setShowCancelModal(false)}>취소</button>
                        <button onClick={() => navigate("/home")}>네</button>
                    </div>
                </div>
            )}
        </div>
    );
} 