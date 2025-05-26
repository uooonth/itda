import { useState } from "react";
import "../../css/signupAgreement.css";
import { useNavigate } from "react-router-dom";

export default function SignupAgreement() {
    const navigate = useNavigate();
    const [agreements, setAgreements] = useState({
        all: false,
        terms: false, 
        privacy: false,
        marketing: false, 
    });
    const [showCancelModal, setShowCancelModal] = useState(false);

    const handleAllCheck = () => {
        const newChecked = !agreements.all;
        setAgreements({
            all: newChecked,
            terms: newChecked,
            privacy: newChecked,
            marketing: newChecked,
        });
    };

    const handleSingleCheck = (key) => {
        const newAgreements = { ...agreements, [key]: !agreements[key] };

        newAgreements.all = newAgreements.terms && newAgreements.privacy && newAgreements.marketing;
        setAgreements(newAgreements);
    };

    const isNextEnabled = agreements.terms && agreements.privacy;

    return (
        <div className="signupAgreement-container">
            <div className="navigation">
                <div className="logo">itda</div>
            </div>
            <div className="signupAgreement-content">
                <h2 className="signup-title">회원가입</h2>

                <div className="signup-step">
                    <div className="step">
                        <div className="circle now-circle">
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

                <h3>* 필수 약관에 동의하셔야 회원가입이 가능합니다.</h3>
                
                <div className="agreement">
                    <div className="agreement-line" />
                    <label>
                        <input type="checkbox" checked={agreements.all} onChange={handleAllCheck} />
                        전체 약관 동의
                    </label>
                    <div className="agreement-line" />
                    <label>
                        <input type="checkbox" checked={agreements.terms} onChange={() => handleSingleCheck("terms")} />
                        회원 서비스 이용약관 (필수)
                    </label>
                    <div className="agreement-line" />
                    <label>
                        <input type="checkbox" checked={agreements.privacy} onChange={() => handleSingleCheck("privacy")} />
                        개인정보 수집 및 이용 동의 (필수)
                    </label>
                    <div className="agreement-line" />
                    <label>
                        <input type="checkbox" name="agree_marketing" checked={agreements.marketing} onChange={() => handleSingleCheck("marketing")} />
                        마케팅 수신 동의 (선택)
                    </label>
                    <div className="agreement-line" />
                </div>

                <div className="button-group">
                    <button className="cancel-button" onClick={() => setShowCancelModal(true)}>취소</button>
                    <button className="next-button" disabled={!isNextEnabled} onClick={() => navigate("/signupForm")}
                    >다음</button>
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
        </div>
    );
}
