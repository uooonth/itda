import { useState, useMemo } from "react";
import "../../css/signupForm.css";
import { useNavigate } from "react-router-dom";

export default function SignupForm() {
    const navigate = useNavigate();
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [form, setForm] = useState({
        id: "",
        nickname: "",
        password: "",
        confirmPassword: "",
        email: ""
    });

    const [passwordValid, setPasswordValid] = useState(false);
    const [passwordLengthValid, setPasswordLengthValid] = useState(false);
    const [passwordMatchError, setPasswordMatchError] = useState(false);
    const [emailFormatError, setEmailFormatError] = useState(false);

    // 에러 상태
    const [idError, setIdError] = useState("");
    const [nicknameError, setNicknameError] = useState("");

    const [passwordMessage] = useState({
        length: "최소 10글자 이상 설정해주세요",
        mix: "영문/숫자가 포함되어야합니다"
    });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });

        if (name === "id") {
            // 예시 중복 확인: 실제로는 API로 확인
            setIdError(value === "testid" ? "중복된 아이디입니다" : "");
        }

        if (name === "nickname") {
            setNicknameError(value === "testnick" ? "중복된 닉네임입니다" : "");
        }

        if (name === "password") {
            validatePassword(value);
            setPasswordMatchError(form.confirmPassword !== "" && value !== form.confirmPassword);
        }

        if (name === "confirmPassword") {
            setPasswordMatchError(value !== form.password);
        }

        if (name === "email") {
            setEmailFormatError(value !== "" && !emailRegex.test(value));
        }
    };

    const validatePassword = (password) => {
        const hasMinLength = password.length >= 10;
        const hasMix = /^(?=.*[A-Za-z])(?=.*\d)/.test(password);

        setPasswordLengthValid(hasMinLength);
        setPasswordValid(hasMinLength && hasMix);
    };

    const isFormValid = useMemo(() => {
        return (
            form.id.trim() !== "" &&
            form.nickname.trim() !== "" &&
            form.password.trim() !== "" &&
            form.confirmPassword.trim() !== "" &&
            form.email.trim() !== "" &&
            passwordValid &&
            form.password === form.confirmPassword &&
            emailRegex.test(form.email) &&
            !idError &&
            !nicknameError
        );
    }, [form, passwordValid, idError, nicknameError]);

    return (
        <div className="signupForm-container">
            <div className="navigation">
                <div className="logo">itda</div>
            </div>
            <div className="signupForm-content">
                <h2 className="signup-title">회원가입</h2>

                <div className="signup-step">
                    <div className="step">
                        <div className="circle">
                            <img src="/images/agreement.png" alt="" />
                        </div>
                        <p>약관 동의</p>
                    </div>
                    <div className="step-line"></div>
                    <div className="step">
                        <div className="circle now-circle">
                            <img src="/images/form.png" alt="" />
                        </div>
                        <p>정보 입력</p>
                    </div>
                    <div className="step-line"></div>
                    <div className="step">
                        <div className="circle">
                            <img src="/images/verification.png" alt="" />
                        </div>
                        <p>이메일 인증</p>
                    </div>
                    <div className="step-line"></div>
                    <div className="step">
                        <div className="circle">
                            <img src="/images/verification.png" alt="" />
                        </div>
                        <p>가입 완료</p>
                    </div>
                </div>

                <hr className="form-line" />

                <div className="signup-form">
                    <div className="form-group">
                        <p>아이디</p>
                        {idError && <p className="error-message">{idError}</p>}
                        <input
                            type="text"
                            name="id"
                            placeholder="아이디를 입력해 주세요"
                            value={form.id}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <p>닉네임</p>
                        {nicknameError && <p className="error-message">{nicknameError}</p>}
                        <input
                            type="text"
                            name="nickname"
                            placeholder="닉네임을 입력해 주세요"
                            value={form.nickname}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <p>비밀번호</p>
                        <input
                            type="password"
                            name="password"
                            placeholder="비밀번호를 입력해 주세요"
                            value={form.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="condition-group">
                        <p
                            className="condition"
                            style={{
                                color: form.password === ""
                                    ? "gray"
                                    : passwordValid
                                        ? "green"
                                        : "red"
                            }}
                        >
                            {passwordMessage.mix}
                        </p>
                        <p
                            className="condition"
                            style={{
                                color: form.password === ""
                                    ? "gray"
                                    : passwordLengthValid
                                        ? "green"
                                        : "red"
                            }}
                        >
                            {passwordMessage.length}
                        </p>
                    </div>

                    <div className="form-group">
                        <p>비밀번호 확인</p>
                        {passwordMatchError && <p className="error-message">비밀번호가 일치하지 않습니다</p>}
                        <input
                            type="password"
                            name="confirmPassword"
                            placeholder="비밀번호를 다시 입력해주세요"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <p>이메일</p>
                        {emailFormatError && <p className="error-message">이메일 형식이 올바르지 않습니다</p>}
                        <input
                            type="email"
                            name="email"
                            placeholder="이메일을 입력해주세요"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <hr className="form-line" />
            </div>

            <div className="form-button-group">
                <button className="form-cancel-button" onClick={() => setShowCancelModal(true)}>취소</button>
                <button className="form-next-button" disabled={!isFormValid}>다음</button>
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
