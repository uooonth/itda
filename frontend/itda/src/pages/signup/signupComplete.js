import "../../css/signupComplete.css";
import { useNavigate } from "react-router-dom";

export default function SignupComplete() {
    const navigate = useNavigate();

    return (
        <div className="signupComplete-container">
            <div className="navigation">
                <div className="logo">itda</div>
            </div>
            <div className="signupComplete-content">
                <h2 className="signup-title">회원가입</h2>
                <div className="signup-step">
                    <div className="step">
                        <div className="circle">
                            <img src="/images/agreement.png" alt="약관 동의" />
                        </div>
                        <p>약관 동의</p>
                    </div>
                    <div className="step-line"></div>
                    <div className="step">
                        <div className="circle">
                            <img src="/images/form.png" alt="정보 입력" />
                        </div>
                        <p>정보 입력</p>
                    </div>
                    <div className="step-line"></div>
                    <div className="step">
                        <div className="circle">
                            <img src="/images/verification.png" alt="이메일 인증" />
                        </div>
                        <p>이메일 인증</p>
                    </div>
                    <div className="step-line"></div>
                    <div className="step">
                        <div className="circle now-circle">
                            <img src="/images/verification.png" alt="가입 완료" />
                        </div>
                        <p>가입 완료</p>
                    </div>
                </div>
                <p className="complete-announcement">가입이 완료되었습니다.</p>
                <div className="complete-button-group ">
                    <button className="signup-main-button" onClick={() => navigate("/")}>메인화면</button>
                    <button className="signup-login-button" onClick={() => navigate("/login")}>로그인</button>
                </div>
            </div>
        </div>
    );
}
