import "../../css/signupVerification.css";
import { useNavigate } from "react-router-dom";
import { useRef, useState, useMemo } from "react";

export default function SignupVerification() {
    const navigate = useNavigate();
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [code, setCode] = useState(['', '', '', '', '']);
    const [form, setForm] = useState({
        id: '',
        email: '',
        verificationCode: '',
    });
    const isVerificationValid = useMemo(() => {
        return code.every((digit) => digit !== '');
    }, [code]);




    const inputsRef = useRef([]);

    const handleChange = (e, index) => {
        const value = e.target.value.replace(/\D/, '');
        if (!value) return;

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        if (index < 4) {
            inputsRef.current[index + 1].focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace') {
            const newCode = [...code];
            if (code[index] === '') {
                if (index > 0) inputsRef.current[index - 1].focus();
            } else {
                newCode[index] = '';
                setCode(newCode);
            }
        }
    };

    return (
        <div className="signupVerification-container">
            <div className="navigation">
                <div className="logo">itda</div>
            </div>
            <div className="signupVerification-content">
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
                        <div className="circle">
                            <img src="/images/form.png" alt="" />
                        </div>
                        <p>정보 입력</p>
                    </div>
                    <div className="step-line"></div>
                    <div className="step">
                        <div className="circle now-circle">
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
                <div className="verification-line" />
                <p className="verification-title1">이메일 주소 인증</p>
                <div className="verification-title2">
                    <p>작성한 이메일로 인증 번호를 전송하였습니다. 인증 번호를 입력해주세요.</p>
                    <p>이메일 인증 미진행시 사이트 이용이 불가능합니다.</p>
                </div>
                <div className="code-container">
                    {code.map((digit, i) => (
                        <input
                            key={i}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            ref={(el) => (inputsRef.current[i] = el)}
                            onChange={(e) => handleChange(e, i)}
                            onKeyDown={(e) => handleKeyDown(e, i)}
                            className="code-input"
                        />
                    ))}
                </div>
                <p className="resend">재전송</p>
                <div className="verification-line" />
            </div>

            <div className="verification-button-group">
                <button className="verification-cancel-button" onClick={() => setShowCancelModal(true)}>취소</button>
                <button
                    className="verification-next-button"
                    disabled={!isVerificationValid}
                    onClick={() => navigate("/signupComplete")}
                >
                    다음
                </button>
            </div>
            
            {showCancelModal && (
                <div className="modal">
                    <p className="imotion">🧐</p>
                    <p>정말로 취소하시겠습니s까?</p>
                    <div className="modal-buttons">
                        <button onClick={() => setShowCancelModal(false)}>취소</button>
                        <button onClick={() => navigate("/home")}>네</button>
                    </div>
                </div>
            )}
        </div>
    );
}