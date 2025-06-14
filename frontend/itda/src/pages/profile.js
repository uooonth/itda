import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../css/profile.css';

/* 메뉴별 컴포넌트 임포트 */
import Profiles from './profileComponent/profileCom.js';
import Searchs from './profileComponent/searchCom.js';

function Profile({isLoggedIn,username}) {
    const navigate = useNavigate();

    // url에서 view할 유저네임 추출
    const { viewUsername } = useParams();

   // viewUsername이 있으면 다른 유저 프로필 보기, 없으면 자신의 프로필
   const targetUsername = viewUsername || username;
   const isOwnProfile = !viewUsername && isLoggedIn;
   const isViewingOtherProfile = !!viewUsername;
   
    // 비로그인 유저는 검색 탭으로 시작, 로그인 유저는 프로필 탭으로 시작
    const [activeTab, setActiveTab] = useState(
        !isLoggedIn || isViewingOtherProfile ? 'Searchs' : 'Profiles'
    );

    // ⭐ URL 파라미터 변경 시 프로필 탭으로 자동 전환
    useEffect(() => {
        if (isViewingOtherProfile) {
            setActiveTab('Profiles');
        }
    }, [isViewingOtherProfile, viewUsername]); // viewUsername도 의존성에 추가

    //토글 탭 관리
    const toggleTab = (tab) => {
        // 비로그인 유저는 프로필 탭 접근 불가
        if (!isLoggedIn && tab === 'Profiles' && !isViewingOtherProfile) {return;}
        
        // 내 프로필 탭 클릭 시 내 프로필 페이지로 이동
        if (tab === 'MyProfile') {
            navigate('/profile');
            return;
        }
        
        // 검색 탭 클릭 시 검색 탭 활성화
        if (tab === 'Searchs') {
            setActiveTab('Searchs');
            return;
        }
        
        setActiveTab(tab);
        // 모든 탭의 active 클래스 제거
        document.querySelectorAll('.tab-item').forEach(el => el.classList.remove('active_tab_profile'));

        // 선택한 탭에 active 클래스 추가 (요소가 존재할 때만)
        const selectedTab = document.querySelector(`.tab-${tab}`);
        if (selectedTab) {
            selectedTab.classList.add('active_tab_profile');
        }
    };

    return (
        <div className="profile">
            <div className='header'>
                {activeTab === 'Profiles' 
                    ? (isViewingOtherProfile ? `${targetUsername}의 프로필` : '프로필')
                    : '검색'
                }
            </div>

            <div className='tab'>
                {/* 비로그인 상태에서는 프로필 탭 완전히 숨김 */}
                {(isLoggedIn || isViewingOtherProfile) && (
                    <div 
                        className={`tab-item tab-Profiles ${activeTab === 'Profiles' ? 'active_tab_profile' : ''} ${!isLoggedIn && !isViewingOtherProfile ? 'disabled-tab' : ''}`} 
                        onClick={() => toggleTab('Profiles')}
                        style={{
                            opacity: !isLoggedIn && !isViewingOtherProfile ? 0.5 : 1,
                            cursor: !isLoggedIn && !isViewingOtherProfile ? 'not-allowed' : 'pointer'
                        }}
                    >
                        프로필
                    </div>
                )}
                
                {/* 검색 탭은 항상 표시 */}
                <div 
                    className={`tab-item tab-Searchs ${activeTab === 'Searchs' ? 'active_tab_profile' : ''}`} 
                    onClick={() => toggleTab('Searchs')}
                >
                    검색
                </div>

                {/* 내 프로필 탭 - 로그인 상태이면서 다른 사람 프로필을 보고 있을 때만 표시 */}
                {isLoggedIn && isViewingOtherProfile && (
                    <div 
                        className="tab-item tab-MyProfile"
                        onClick={() => toggleTab('MyProfile')}
                        style={{
                            cursor: 'pointer',
                            color: '#6B705C',
                            fontWeight: '600'
                        }}
                    >
                        내 프로필
                    </div>
                )}
            </div>
            
            {/* ⭐ key prop 추가로 컴포넌트 강제 리렌더링 */}
            {activeTab === 'Profiles' && (
                <Profiles 
                    key={targetUsername} // username이 변경될 때마다 컴포넌트 재생성
                    username={targetUsername}
                    isOwnProfile={isOwnProfile}
                    isLoggedIn={isLoggedIn}
                    viewMode={isViewingOtherProfile ? 'view' : 'edit'}
                />
            )}
            {activeTab === 'Searchs' && (
                <Searchs 
                    username={username}
                    isLoggedIn={isLoggedIn}
                />
            )}
        </div>
    );
}

export default Profile;
