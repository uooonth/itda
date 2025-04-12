import "../../css/signupVerification.css";

export default function signupVerification() {
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
                <hr className="line"/>
                <p className="title1">이메일 주소 인증</p>
                <div className="title2">
                    <p>작성한 이메일로 인증 번호를 전송하였습니다. 인증 번호를 입력해주세요.</p>
                    <p>이메일 인증 미진행시 사이트 이용이 불가능합니다.</p>
                </div>
                
            </div>
        </div>
    );
}