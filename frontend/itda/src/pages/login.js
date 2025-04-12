import '../css/login.css';
import { NavLink} from 'react-router-dom'; 

export default function Login() {
    return (
        <div className="login-container">
            <div className="navigation">
                <div className="logo">itda</div>
            </div>
            <div className="login-content">
                <h1>로그인</h1>
                <div className="login-image-container">
                    <img src="/images/loginImage.png" className="login-image" alt=''/>
                    <div className="input-fields">
                        <h2>아이디</h2>
                        <input type="text" placeholder="아이디를 입력해주세요." className="login-input" />
                        <h2>비밀번호</h2>
                        <input type="password" placeholder="비밀번호를 입력해주세요." className="login-input" />
                        <button className="login-button">로그인</button>
                        <NavLink to="/signupAgreement" className="navLink">
                            <button className="signup-button">회원가입</button>
                        </NavLink>
                    </div>
                </div>
            </div>
        </div>
    );
}
