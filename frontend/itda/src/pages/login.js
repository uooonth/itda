import '../css/login.css';
import { NavLink,useNavigate } from 'react-router-dom'; 
import { useState } from 'react';

export default function Login({ setIsLoggedIn, setUsername }) {

    const [id, setId] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const handleLogin = async () => {
        try {
            const response = await fetch("http://localhost:8008/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: id,
                    password: password,
                }),
            });

            if (!response.ok) throw new Error("로그인 실패");

            const data = await response.json();
            localStorage.setItem("access_token", data.access_token);

            const userRes = await fetch("http://localhost:8008/me", {
                headers: {
                    Authorization: `Bearer ${data.access_token}`,
                },
            });
            if (userRes.ok) {
                const userData = await userRes.json();
                setUsername(userData.username); 
            }

            setIsLoggedIn(true); 
            navigate("/");
        } catch (error) {
            alert("로그인 실패");
        }
    };
    return (
        <div className="login-container">
            <div className="navigation">
                <div className="logo">itda</div>
            </div>
            <div className="login-content">
                <h1>로그인</h1>
                <div className="login-image-container">
                    <img src="/images/loginImage.png" className="login-image" alt="" />
                    <div className="input-fields">
                        <h2>아이디</h2>
                        <input
                            type="text"
                            placeholder="아이디를 입력해주세요."
                            className="login-input"
                            value={id}
                            onChange={(e) => setId(e.target.value)}
                        />
                        <h2>비밀번호</h2>
                        <input
                            type="password"
                            placeholder="비밀번호를 입력해주세요."
                            className="login-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button className="login-button" onClick={handleLogin}>
                            로그인
                        </button>
                        <NavLink to="/signupAgreement" className="navLink">
                            <button className="signup-button">회원가입</button>
                        </NavLink>
                    </div>
                </div>
            </div>
        </div>
    );
}