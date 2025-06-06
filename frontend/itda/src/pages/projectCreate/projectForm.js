import { useEffect, useState, useMemo } from "react";
import "../../css/projectForm.css";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { v4 as uuidv4 } from 'uuid';

export default function ProjectForm() {
    const navigate = useNavigate();
    const location = useLocation();
    const token = localStorage.getItem("access_token");

    const [showCancelModal, setShowCancelModal] = useState(false);
    const [form, setForm] = useState({
        projectName: "",
        roleInput: "",
        roles: [],
        description: "",
        deadline: "",
        payType: "",
        education: "",
        customEducation: "",
        experience: "",
        customExperience: "",
        category: "",
        email: "",
        recruitNumber: "",
        contractUntil: "",
        career: "",
        thumbnail: null
    });

    const [currentUserId, setCurrentUserId] = useState("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    useEffect(() => {
        if (!token || !location.state?.fromButton) {
            navigate("/login");
        } else {
            axios.get("http://localhost:8008/me", {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => {
                    setCurrentUserId(res.data.id);
                })
                .catch(() => {
                    navigate("/login");
                });
        }
    }, [token, location, navigate]);

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

    const isFormValid = useMemo(() => {
        return (
            form.projectName.trim() !== "" &&
            form.roles.length > 0 &&
            form.description.trim() !== "" &&
            form.deadline !== "" &&
            form.payType !== "" &&
            form.education !== "" &&
            (form.education !== "기타" || form.customEducation.trim() !== "") &&
            form.category !== "" &&
            form.email.trim() !== "" &&
            emailRegex.test(form.email) &&
            form.recruitNumber !== "" &&
            parseInt(form.recruitNumber) > 0 &&
            form.contractUntil !== "" &&
            form.career !== "" &&
            form.thumbnail !== null
        );
    }, [form]);



    const handleSubmit = async () => {
        try {
            const generatedProjectId = uuidv4().replaceAll("-", "").slice(0, 25);
            const formData = new FormData();

            formData.append("id", generatedProjectId);
            formData.append("name", form.projectName);
            formData.append("classification", form.category);
            formData.append("explain", form.description);
            formData.append("sign_deadline", form.deadline);
            formData.append("salary_type", form.payType);
            formData.append("education", form.education === "기타" ? form.customEducation || "기타" : form.education);
            formData.append("email", form.email);
            formData.append("proposer", JSON.stringify([currentUserId]));
            formData.append("worker", JSON.stringify([currentUserId]));
            formData.append("roles", JSON.stringify(form.roles));
            formData.append("recruit_number", form.recruitNumber);
            formData.append("career", form.career);
            formData.append("contract_until", form.contractUntil);

            if (form.thumbnail) {
                formData.append("thumbnail", form.thumbnail);
            }

            await axios.post("http://localhost:8008/projects", formData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            navigate("/ProjectComplete");
        } catch (error) {
            console.error("프로젝트 생성 실패", error);
            alert("프로젝트 생성 중 오류가 발생했습니다. 콘솔을 확인해주세요.");
        }
    };

    return (
        <div className="projectForm-container">
            <h2 className="projectForm-title">프로젝트 생성</h2>

            <div className="projectForm-step">
                <div className="step">
                    <div className="circle now-circle">
                        <img src="/images/agreement.png" alt="" />
                    </div>
                    <p>정보 입력</p>
                </div>
                {/* <div className="step-line"></div>
                <div className="step">
                    <div className="circle">
                        <img src="/images/form.png" alt="" />
                    </div>
                    <p>인원 초대</p>
                </div> */}
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
                    <input name="projectName" placeholder="제목을 입력해주세요" value={form.projectName} onChange={handleChange} />
                </div>

                <div className="projectForm-row">
                    <label>역할 설정<span className="required">*</span></label>
                    <div className="tag-input">
                        <div className="tag-input-wrapper">
                            <input
                                type="text"
                                name="roleInput"
                                value={form.roleInput}
                                onChange={handleChange}
                                placeholder="추가할 역할을 입력해주세요"
                            />
                            <button type="button" onClick={addRole}>+</button>
                        </div>
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
                    <textarea name="description" value={form.description} onChange={handleChange} placeholder="프로젝트 소개를 입력해 주세요." />
                </div>

                <div className="projectForm-row">
                    <label>모집 마감 기한<span className="required">*</span></label>
                    <input type="date" name="deadline" value={form.deadline} onChange={handleChange} />
                </div>

                <div className="projectForm-row">
                    <label>급여 형태<span className="required">*</span></label>
                    <div className="radio-group">
                        {["무급", "시급", "주급", "월급", "연봉", "건당"].map((option) => (
                            <div
                                key={option}
                                className={`pay-type-option ${form.payType === option ? "selected" : ""}`}
                                onClick={() => setForm({ ...form, payType: option })}
                            >
                                {option}
                            </div>
                        ))}
                    </div>
                </div>


                <div className="projectForm-row">
                    <label>학력<span className="required">*</span></label>
                    <div className="radio-group">
                        {['무관', '초졸', '중졸', '고졸', '대졸'].map(level => (
                            <label key={level}>
                                <input type="radio" name="education" value={level} checked={form.education === level} onChange={handleChange} /> {level}
                            </label>
                        ))}
                        <label>
                            <input type="radio" name="education" value="기타" checked={form.education === '기타'} onChange={handleChange} /> 기타
                            <input type="text" name="customEducation" value={form.customEducation} onChange={handleChange} placeholder="직접 입력" />
                        </label>
                    </div>
                </div>

                <div className="projectForm-row">
                    <label>경력 조건<span className="required">*</span></label>
                    <div className="radio-group">
                        {["신입", "경력", "무관"].map(option => (
                            <label key={option}>
                                <input type="radio" name="career" value={option} checked={form.career === option} onChange={handleChange} /> {option}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="projectForm-row">
                    <label>프로젝트 분류<span className="required">*</span></label>
                    <select name="category" value={form.category} onChange={handleChange}>
                        <option value="">선택</option>
                        <option value="유튜브">유튜브</option>
                        <option value="작곡">작곡</option>
                        <option value="틱톡">틱톡</option>
                        <option value="그래픽">그래픽</option>
                        <option value="애니메이션">애니메이션</option>
                        <option value="게임">게임</option>
                        <option value="기타">기타</option>
                    </select>
                </div>

                <div className="projectForm-row">
                    <label>대표 이메일<span className="required">*</span></label>
                    <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="example@domain.com" />
                </div>

                <div className="projectForm-row">
                    <label>모집 인원<span className="required">*</span></label>
                    <input type="number" name="recruitNumber" value={form.recruitNumber} onChange={handleChange} placeholder="예: 3" min="1" />
                </div>

                <div className="projectForm-row">
                    <label>계약 종료일<span className="required">*</span></label>
                    <input type="date" name="contractUntil" value={form.contractUntil} onChange={handleChange} />
                </div>

                <div className="projectForm-row">
                    <label>대표 이미지<span className="required">*</span></label>
                    <input
                        type="file"
                        name="thumbnail"
                        accept="image/*"
                        onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                                setForm({ ...form, thumbnail: file });
                            }
                        }}
                    />
                </div>



            </div>

            <hr className="projectform-line" />

            <div className="form-button-group">
                <button className="form-cancel-button" onClick={() => setShowCancelModal(true)}>취소</button>
                <button className="form-next-button" disabled={!isFormValid} onClick={handleSubmit}>다음</button>
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
