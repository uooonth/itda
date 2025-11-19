import { useState } from "react";
import "../../css/signupAgreement.css";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from 'react-markdown';
import downArrow from "../../icons/down-arrow.png";



export default function SignupAgreement() {
    const navigate = useNavigate();
    const [agreements, setAgreements] = useState({
        all: false,
        terms: false,
        privacy: false,
        marketing: false,
    });
    const [showCancelModal, setShowCancelModal] = useState(false);

    const [activeModal, setActiveModal] = useState(null); // 어떤 모달을 띄울지 결정

    const [toggle, setToggle] = useState({
        terms: false,
        privacy: false,
        marketing: false,
    });


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

    const toggleSection = (key) => {
        setToggle(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const isNextEnabled = agreements.terms && agreements.privacy && agreements.marketing;

    const termsContent = `# **[잇다] 회원 서비스 이용 약관**

본 약관은 [크리에이터 협업 웹사이트](이하 “회사”)에서 제공하는 서비스 “잇다”(이하 “서비스”)와 관련하여 회사와 회원 간의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.

## 제 1 조 (목적)

본 약관은 회사가 제공하는 서비스의 이용 조건 및 절차, 회원과 회사의 권리 및 의무, 기타 필요한 사항을 규정함을 목적으로 합니다.

## 제 2 조 (정의)

1. **서비스**: 회사가 제공하는 프로젝트 팀원 모집, 일정 공유, 피드백 기능 등을 포함한 모든 온라인 서비스를 말합니다.
2. **회원**: 서비스에 접속하여 본 약관에 동의하고 회사와 서비스 이용 계약을 체결한 자를 말합니다.
3. **ID(이메일)**: 회원 식별과 서비스 이용을 위해 회원이 설정하고 회사가 승인한 고유의 이메일 주소를 말합니다.
4. **닉네임**: 서비스 이용 시 회원이 설정하는 고유의 이름을 말합니다.
5. **비밀번호**: 회원의 정보 보호를 위해 회원이 설정한 문자와 숫자의 조합을 말합니다.

## 제 3 조 (약관의 명시, 효력 및 개정)

1. 회사는 본 약관의 내용을 회원이 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.
2. 회사는 관련 법령을 위반하지 않는 범위에서 본 약관을 개정할 수 있습니다.
3. 개정된 약관은 게시한 날로부터 7일 후 효력이 발생합니다. 회원은 개정된 약관에 동의하지 않을 경우, 서비스 이용을 중단하고 탈퇴할 수 있습니다.

## 제 4 조 (회원 가입 및 정보 수집)

1. 회원으로 가입하고자 하는 사용자는 회사가 요청하는 정보(이메일, 비밀번호, 닉네임)를 정확히 제공하여야 합니다.
2. 회사는 수집한 개인정보를 관련 법령에 따라 적법하게 관리하며, 회원의 동의 없이 제3자에게 제공하지 않습니다. 자세한 사항은 회사의 [개인정보 처리방침]에 따릅니다.

## 제 5 조 (서비스의 제공 및 변경)

1. 회사는 다음과 같은 서비스를 제공합니다:
    - 프로젝트 팀원 찾기 및 모집 기능
    - 협업 페이지에서의 일정 공유 및 영상 피드백 기능
2. 회사는 서비스 내용이 변경되는 경우, 변경 사유 및 내용을 회원에게 사전 공지합니다.

## 제 6 조 (회원의 의무)

1. 회원은 서비스 이용 시 다음 행위를 하지 않아야 합니다:
    - 타인의 정보를 도용하거나 허위 정보를 제공하는 행위
    - 회사의 서비스 운영을 방해하는 행위
    - 타인의 권리를 침해하거나 법령에 위반되는 행위
2. 회원은 ID 및 비밀번호를 관리할 책임이 있으며, 이를 제3자에게 양도 또는 대여할 수 없습니다.

## 제 7 조 (개인정보 보호)

1. 회사는 회원의 개인정보를 보호하기 위해 관련 법령에 따른 개인정보 처리방침을 따릅니다.
2. 회원은 언제든지 회사가 보유한 본인의 개인정보에 대해 열람 및 수정 요청을 할 수 있습니다.
3. 회사는 회원의 동의 없이 제3자에게 개인정보를 제공하지 않으며, 개인정보 처리방침에서 정한 바에 따라 안전하게 관리합니다.

## 제 8 조 (서비스 이용 제한 및 계약 해지)

본 사이트 이용 및 행위가 다음 각 항에 해당하는 경우 회사는 해당 이용자의 이용을 제한하거나 계약을 해지할 수 있습니다.

1. 공공질서 및 미풍양속, 기타 사회질서를 해하는 경우
2. 범죄행위를 목적으로 하거나 기타 범죄행위와 관련된다고 객관적으로 인정되는 경우
3. 타인의 명예를 손상시키거나 타인의 서비스 이용을 현저히 저해하는 경우
4. 타인의 의사에 반하는 내용이나 광고성 정보 등을 지속적으로 전송하는 경우
5. 해킹 및 컴퓨터 바이러스 유포 등으로 서비스의 건전한 운영을 저해하는 경우
6. 다른 이용자 또는 제3자의 지적재산권을 침해하거나 지적재산권자가 지적 재산권의 침해를 주장할 수 있다고 판단되는 경우
7. 타인의 아이디 및 비밀번호를 도용한 경우
8. 기타 관계 법령에 위배되는 경우 및 회사가 이용자로서 부적당하다고 판단한 경우

회원은 언제든지 서비스 탈퇴를 요청할 수 있으며, 탈퇴 시 회사는 관련 법령에 따라 회원의 개인정보를 삭제 처리합니다.

## 제 9 조 (면책조항)

회사는 다음 각 호에 해당하는 경우 서비스의 전부 또는 일부의 제공을 중지할 수 있습니다.

1. 전기통신사업법 상에 규정된 기간통신 사업자 또는 인터넷 망 사업자가 서비스를 중지했을 경우
2. 정전으로 서비스 제공이 불가능할 경우
3. 설비의 이전, 보수 또는 공사로 인해 부득이한 경우
4. 서비스 설비의 장애 또는 서비스 이용의 폭주 등으로 정상적인 서비스 제공이 어려운 경우
5. 전시, 사변, 천재지변 또는 이에 준하는 국가비상사태가 발생하거나 발생할 우려가 있는 경우

## 제 10 조 (게시물 관리)

회사는 건전한 통신문화 정착과 효율적인 사이트 운영을 위하여 이용자가 게시하거나 제공하는 자료가 제12조에 해당한다고 판단되는 경우에 임의로 삭제, 자료이동, 등록거부를 할 수 있다.

## 제 10 조 (분쟁 해결)

1. 회사와 회원 간의 서비스 이용과 관련하여 발생한 분쟁에 대하여는 대한민국 법령을 적용합니다.
2. 본 약관에 명시되지 않은 사항은 관련 법령 및 상관례에 따릅니다.`;

    const privacyContent = `# **[잇다] 개인정보 수집 및 이용 동의 약관**
본  약관은 [잇다](이하 “회사”)가 제공하는 서비스와 관련하여 회원의 개인정보 수집 및 이용에 대해 동의받기 위한 절차를 규정합니다.

## 제 1 조 (개인정보 수집 항목)

회사는 서비스 제공을 위하여 다음과 같은 개인정보를 수집합니다:

1. **필수 수집 항목**:
    - ID
    - 이메일
    - 비밀번호
    - 닉네임
2. **선택 수집 항목**:
    - 전화번호 (고객 서비스 제공을 위한 경우)
    - 프로필 이미지 (회원 식별을 위한 경우)

## 제 2 조 (개인정보 수집 목적)

회사는 수집된 개인정보를 다음의 목적을 위해 이용합니다:

1. 회원 식별, 서비스 이용 의사 확인, 본인 인증
2. 프로젝트 팀원 매칭 및 협업 페이지 제공
3. 고객 문의 대응 및 공지 사항 전달
4. 서비스 개선 및 맞춤형 서비스 제공을 위한 분석

## 제 3 조 (개인정보 보유 및 이용 기간)

회사는 원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 다만, 관련 법령에 의해 보존해야 하는 경우에는 다음과 같은 기간 동안 보관됩니다:

1. 회원 탈퇴 시: 즉시 파기
2. 관련 법령에 따른 보존:
    - 계약 또는 청약 철회 기록: 5년 (전자상거래 등에서의 소비자 보호에 관한 법률)
    - 서비스 이용에 따른 불만 또는 분쟁 처리 기록: 3년 (전자상거래 등에서의 소비자 보호에 관한 법률)

## 제 4 조 (개인정보 제3자 제공)

회사는 원칙적으로 회원의 개인정보를 외부에 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다:

1. 회원의 사전 동의를 받은 경우
2. 법령의 규정에 의하거나 수사 목적으로 법령에 따라 요청받은 경우

## 제 5 조 (개인정보 처리 위탁)

회사는 서비스 제공을 위하여 필요한 업무 중 일부를 외부에 위탁할 수 있으며, 이 경우 관련 법령에 따라 위탁 계약을 체결하고 개인정보가 안전하게 관리될 수 있도록 필요한 조치를 취합니다.

## 제 6 조 (회원의 권리)

회원은 언제든지 다음의 권리를 행사할 수 있습니다:

1. 개인정보 열람, 정정, 삭제 요청
2. 개인정보 처리에 대한 동의 철회
3. 개인정보 제공 및 처리 거부에 따른 서비스 이용 제한에 대한 고지

## 제 7 조 (개인정보 파기 절차 및 방법)

회사는 원칙적으로 개인정보 보유 기간의 경과, 처리 목적 달성 등 개인정보가 불필요하게 되었을 때에는 해당 정보를 지체 없이 파기합니다.

1. **전자적 파일 형태**: 복구 및 재생이 불가능한 방법으로 영구 삭제
2. **서면 자료**: 분쇄 또는 소각을 통해 파기

## 제 8 조 (개인정보 보호를 위한 조치)

회사는 회원의 개인정보를 안전하게 보호하기 위해 다음과 같은 기술적, 관리적 조치를 취합니다:

1. 개인정보의 암호화 저장 및 전송
2. 개인정보에 대한 접근 권한의 차등 부여
3. 개인정보 처리 인원의 최소화 및 교육

## 제 9 조 (개인정보 문의처)

개인정보와 관련된 문의, 불만 처리 또는 피해 구제 요청은 다음의 연락처로 문의할 수 있습니다:

- 담당 부서: 개인정보 보호 담당자
- 이메일: [이메일 주소]
- 전화번호: [전화번호]`;

    const marketingContent = `# **[잇다] 마케팅 수신 동의 약관**

본 약관은 [잇다](이하 “회사”)가 회원에게 다양한 정보 및 혜택을 제공하기 위하여 필요한 사항을 규정합니다.

## 제 1 조 (수집 목적 및 활용 내용)

회사는 회원에게 다음과 같은 정보 제공 및 혜택을 목적으로 마케팅 정보를 수신합니다:

1. 신규 서비스, 기능 업데이트 및 플랫폼 개선사항 안내
2. 프로모션, 이벤트, 할인 및 제휴 서비스 관련 정보 제공
3. 크리에이터 매칭 및 협업 기회 추천
4. 설문조사, 서비스 만족도 조사 및 사용자 피드백 요청
5. 커뮤니티 소식 및 공지사항 안내

## 제 2 조 (수신 방법)

회사는 다음과 같은 방법으로 회원에게 정보를 제공할 수 있습니다:

- 이메일
- SMS / 문자메시지
- 모바일 앱 알림 (푸시 알림)
- 서비스 내 알림 기능

## 제 3 조 (보유 및 이용 기간)

회원의 마케팅 수신 동의는 동의 철회 시까지 유효하며, 철회 시 즉시 수신이 중단됩니다.

## 제 4 조 (동의 철회)

회원은 언제든지 마케팅 정보 수신을 거부하거나 수신 동의를 철회할 수 있습니다.
동의 철회 방법:
- 서비스 내 설정 메뉴
- 고객센터 문의
- 이메일 내 수신 거부 링크

## 제 5 조 (수신 거부에 따른 서비스 이용 제한 여부)

회원이 마케팅 수신에 동의하지 않거나 수신을 철회하더라도 서비스 기본 이용에는 어떠한 제한도 발생하지 않습니다.

## 제 6 조 (기타)

기타 사항은 회사의 개인정보 처리방침 및 관련 법령을 따릅니다.
`;


    const renderModalContent = () => {
        let content = "";
        if (activeModal === "terms") content = termsContent;
        if (activeModal === "privacy") content = privacyContent;
        if (activeModal === "marketing") content = marketingContent;
        return <ReactMarkdown>{content}</ReactMarkdown>;
    };

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

                <h4>* 필수 약관에 동의하셔야 회원가입이 가능합니다.</h4>

                <div className="agreement">
                    <div className="agreement-line" />
                    <div className="agreement-item">
                        <div className="agreement-item-label">
                            <label>
                                <input type="checkbox" checked={agreements.all} onChange={handleAllCheck} />
                                전체 약관 동의
                            </label>
                        </div>
                    </div>
                    <div className="agreement-line" />
                    {["terms", "privacy", "marketing"].map((key) => (
                        <div className="agreement-item" key={key}>
                            <div className="agreement-item-label">
                                <div className="agreement-item-label-left">
                                    <input type="checkbox" checked={agreements[key]} onChange={() => handleSingleCheck(key)} />
                                    <span>
                                        {key === "terms" && "회원 서비스 이용약관 (필수)"}
                                        {key === "privacy" && "개인정보 수집 및 이용 동의 (필수)"}
                                        {key === "marketing" && "마케팅 수신 동의 (필수)"}
                                    </span>
                                </div>
                                <button className="toggle-button" onClick={() => toggleSection(key)}>

                                    <img
                                        src={downArrow}
                                        alt="toggle"
                                        className={`arrow-icon ${toggle[key] ? "open" : ""}`}
                                    />
                                </button>


                            </div>
                            {toggle[key] && (
                                <div className="agreement-detail">
                                    {key === "terms" && <ReactMarkdown>{termsContent}</ReactMarkdown>}
                                    {key === "privacy" && <ReactMarkdown>{privacyContent}</ReactMarkdown>}
                                    {key === "marketing" && <ReactMarkdown>{marketingContent}</ReactMarkdown>}
                                </div>
                            )}


                            <div className="agreement-line" />
                        </div>

                    ))}
                    <div className="button-group">
                        <button className="cancel-button" onClick={() => setShowCancelModal(true)}>취소</button>
                        <button className="next-button" disabled={!isNextEnabled} onClick={() => navigate("/signupForm")}>다음</button>
                    </div>
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

                {activeModal && (
                    <div className="popup1">
                        <div className="popupContent1">
                            <button className="closeButton" onClick={() => setActiveModal(null)}>×</button>
                            {renderModalContent()}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
