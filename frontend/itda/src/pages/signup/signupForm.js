// SignupForm.jsx
import { useState, useMemo } from "react";
import "../../css/signupForm.css";
import { useNavigate, useLocation } from "react-router-dom";



export default function SignupForm() {
    const location = useLocation();
    const marketingConsent = location.state?.marketing ?? false;

    const navigate = useNavigate();
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [form, setForm] = useState({
        id: "",
        nickname: "",
        password: "",
        confirmPassword: "",
        email: ""
    });

    const [passwordLengthValid, setPasswordLengthValid] = useState(false);
    const [passwordMixValid, setPasswordMixValid] = useState(false);
    const [passwordMatchError, setPasswordMatchError] = useState(false);
    const [emailFormatError, setEmailFormatError] = useState(false);

    const [idError, setIdError] = useState("");
    const [nicknameError, setNicknameError] = useState("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });

        if (name === "id") {
            setIdError(value === "testid" ? "중복된 ID 입니다" : "");
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
        setPasswordMixValid(hasMix);
    };

    const isFormValid = useMemo(() => {
        return (
            form.id.trim() !== "" &&
            form.nickname.trim() !== "" &&
            form.password.trim() !== "" &&
            form.confirmPassword.trim() !== "" &&
            form.email.trim() !== "" &&
            passwordLengthValid &&
            passwordMixValid &&
            form.password === form.confirmPassword &&
            emailRegex.test(form.email) &&
            !idError &&
            !nicknameError
        );
    }, [form, passwordLengthValid, passwordMixValid, idError, nicknameError]);

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

                <form className="signup-form" onSubmit={e => e.preventDefault()}>
                    <div className="form-row">
                        <label
                            htmlFor="id"
                            className={`form-label ${idError ? "invalid" : ""}`}
                        >
                            아이디
                        </label>
                        <div className="input-area">
                            <p className="error-message">{idError}</p>
                            <input
                                id="id"
                                type="text"
                                name="id"
                                placeholder="아이디를 입력해 주세요"
                                value={form.id}
                                onChange={handleChange}
                                className={idError ? "invalid" : ""}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <label
                            htmlFor="nickname"
                            className={`form-label ${nicknameError ? "invalid" : ""}`}
                        >
                            닉네임
                        </label>
                        <div className="input-area">
                            <p className="error-message">{nicknameError}</p>
                            <input
                                id="nickname"
                                type="text"
                                name="nickname"
                                placeholder="닉네임을 입력해 주세요"
                                value={form.nickname}
                                onChange={handleChange}
                                className={nicknameError ? "invalid" : ""}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <label
                            htmlFor="password"
                            className={`form-label ${
                                form.password && (!passwordLengthValid || !passwordMixValid) ? "invalid" : ""
                            }`}
                        >
                            비밀번호
                        </label>
                        <div className="input-area no-error">
                        <p className="error-message"></p>
                            <input
                                id="password"
                                type="password"
                                name="password"
                                placeholder="비밀번호를 입력해 주세요"
                                value={form.password}
                                onChange={handleChange}
                                className={
                                    form.password && (!passwordLengthValid || !passwordMixValid) ? "invalid" : ""
                                }
                                required
                            />
                        </div>
                    </div>

                    <div className="password-conditions">
                        <p className={`condition ${passwordMixValid ? "valid" : "invalid"}`}>
                            영문/숫자가 포함되어야합니다
                        </p>
                        <p className={`condition ${passwordLengthValid ? "valid" : "invalid"}`}>
                            최소 10글자 이상 설정해주세요
                        </p>
                    </div>

                    <div className="form-row">
                        <label
                            htmlFor="confirmPassword"
                            className={`form-label ${passwordMatchError ? "invalid" : ""}`}
                        >
                            비밀번호 확인
                        </label>
                        <div className="input-area">
                            <input
                                id="confirmPassword"
                                type="password"
                                name="confirmPassword"
                                placeholder="비밀번호를 다시 입력해주세요"
                                value={form.confirmPassword}
                                onChange={handleChange}
                                className={passwordMatchError ? "invalid" : ""}
                                required
                            />
                            <p className="error-message" style={{ marginTop: "4px" }}>
                                {passwordMatchError ? "비밀번호가 일치하지 않습니다" : ""}
                            </p>
                        </div>
                    </div>

                    <div className="form-row">
                        <label
                            htmlFor="email"
                            className={`form-label ${emailFormatError ? "invalid" : ""}`}
                        >
                            이메일
                        </label>
                        <div className="input-area">
                            <p className="error-message">{emailFormatError ? "이메일 형식이 올바르지 않습니다" : ""}</p>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                placeholder="이메일을 입력해주세요"
                                value={form.email}
                                onChange={handleChange}
                                className={emailFormatError ? "invalid" : ""}
                                required
                            />
                        </div>
                    </div>
                </form>

                <hr className="form-line" />
            </div>

            <div className="form-button-group">
                <button className="form-cancel-button" onClick={() => setShowCancelModal(true)}>취소</button>
                <button
                    className="form-next-button"
                    disabled={!isFormValid}
                    onClick={() => navigate("/signupVerification")}
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
