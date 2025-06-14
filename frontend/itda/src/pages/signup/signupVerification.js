import "../../css/signupVerification.css";
import { useNavigate, useLocation } from "react-router-dom";
import { useRef, useState, useMemo, useEffect } from "react";

export default function SignupVerification() {
    const location = useLocation();
    const email = location.state?.email ?? "";
    const formData = location.state?.formData;
    console.log(formData)
    const navigate = useNavigate();
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [code, setCode] = useState(['', '', '', '', '']);
    const [loading, setLoading] = useState(false);

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

        if (index < code.length - 1) {
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

    const sendVerificationCode = () => {
        if (!email) {
            alert("이메일 정보가 없습니다.");
            return;
        }
        setLoading(true);
        fetch("http://localhost:8008/email/send-code", {

            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        })
            .then(res => {
                if (!res.ok) throw new Error("인증코드 전송 실패");
                return res.json();
            })
            .then(() => {
                alert("인증코드가 전송되었습니다.");
            })
            .catch(() => {
                alert("인증코드 전송에 실패했습니다.");
            })
            .finally(() => {
                setLoading(false);
            });
    };
    const hasSentRef = useRef(false);
    useEffect(() => {
    if (!hasSentRef.current && email) {
        sendVerificationCode();
        hasSentRef.current = true;
    }
}, [email]);

const verifyCode = () => {
    if (!isVerificationValid) return;

    setLoading(true);
    fetch("http://localhost:8008/email/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: code.join('') }),
    })
        .then(res => {
            if (!res.ok) throw new Error("인증 실패");
            return res.json();
        })
        .then(() => {
            alert("인증 성공");
            // fetch를 return해야 다음 then에서 받을 수 있음
            return fetch("http://localhost:8008/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: formData.id,
                    name: formData.nickname,     
                    pw_hash: formData.password, 
                    email: formData.email
                }),
            });
        })
        .then(async (signupResponse) => {
            if (!signupResponse.ok) {
                throw new Error("회원가입 실패");
            }
            
            // 회원가입 성공 후 기본 프로필 생성
            await createDefaultProfile(formData.id);
            
            // 완료 페이지로 이동
            navigate("/signupComplete", { state: { email } });
        })
        .catch((error) => {
            console.error('회원가입 또는 프로필 생성 오류:', error);
            if (error.message.includes("인증")) {
                alert("인증 코드가 틀렸습니다.");
            } else {
                alert("회원가입 중 오류가 발생했습니다.");
            }
        })
        .finally(() => setLoading(false));

    console.log("전송된 이메일:", email);
    console.log("입력한 인증 코드:", code.join(''));
};






    // 기본 프로필 셋팅
      // 기본 프로필 생성 함수
      const createDefaultProfile = async (userId) => {
        try {
            const formData = new FormData();
            
            // 기본값들 설정
            formData.append('education', '저장된 학력이 없습니다.');
            formData.append('intro', '저장된 소개글이 없습니다.');
            formData.append('phone', '저장된 연락처가 없습니다.');
            formData.append('location', '저장된 거주지역이 없습니다.');
            formData.append('roles', '저장된 직업이 없습니다.');
            formData.append('birth', '저장된 생년월일이 없습니다.');
            formData.append('career_summary', '');
            formData.append('portfolio_url', '');
            formData.append('tags', '');
            formData.append('tech_stack', '');
            formData.append('is_public', 'true');

            const response = await fetch(`http://localhost:8008/users/${userId}/profile`, {
                method: 'PUT',
                body: formData
            });

            if (!response.ok) {
                throw new Error('기본 프로필 생성 실패');
            }

            console.log('기본 프로필 생성 완료');
        } catch (error) {
            console.error('기본 프로필 생성 실패:', error);
            // 프로필 생성 실패해도 회원가입은 완료된 상태이므로 계속 진행
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
                <p
                    className="resend"
                    onClick={() => {
                        if (loading) return;
                        sendVerificationCode();
                    }}
                    style={{ cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}
                >
                    {loading ? "전송중..." : "재전송"}
                </p>
                <div className="verification-line" />
            </div>

            <div className="verification-button-group">
                <button className="verification-cancel-button" onClick={() => setShowCancelModal(true)}>취소</button>
                <button
                    className="verification-next-button"
                    disabled={!isVerificationValid || loading}
                    onClick={verifyCode}

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
