import "../../css/projectInvite.css";

export default function ProjectInvite() {
    <div className="Invite-container">
        <h2 className="projectInvite-title">회원가입</h2>

        <div className="projectInvite-step">
            <div className="step">
                <div className="circle">
                    <img src="/images/agreement.png" alt="" />
                </div>
                <p>정보 입력</p>
            </div>
            <div className="step-line"></div>
            <div className="step">
                <div className="circle now-circle">
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
    </div>
}