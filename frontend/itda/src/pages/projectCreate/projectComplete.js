// import "../../css/projectComplete.css";
import { useNavigate } from "react-router-dom";

export default function ProjectComplete() {
    const navigate = useNavigate();

    return (
        <div className="projectComplete-container">
            <div className="signupComplete-content">
                <h2 className="projectInvite-title">프로젝트 생성</h2>

                <div className="projectForm-step">
                    <div className="step">
                        <div className="circle">
                            <img src="/images/agreement.png" alt="" />
                        </div>
                        <p>정보 입력</p>
                    </div>
                    {/* <div className="step-line"></div>
                    <div className="step">
                        <div className="circle now-circle">
                            <img src="/images/form.png" alt="" />
                        </div>
                        <p>인원 초대</p>
                    </div> */}
                    <div className="step-line"></div>
                    <div className="step">
                        <div className="circle now-circle">
                            <img src="/images/verification.png" alt="" />
                        </div>
                        <p>생성 완료</p>
                    </div>
                </div>
                <p className="complete-announcement">생성이 완료되었습니다.</p>
                <div className="complete-button-group ">
                    <button className="signup-main-button" onClick={() => navigate("/")}>메인화면</button>
                    <button className="signup-login-button" onClick={() => navigate("/project")}>대시보드</button>
                </div>
            </div>
        </div>
    );
}
