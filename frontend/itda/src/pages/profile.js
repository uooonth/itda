import React, { useState } from 'react';
import '../css/profile.css';

/* 메뉴별 컴포넌트 임포트 */
import Profiles from './profileComponent/profileCom.js';
import Searchs from './profileComponent/searchCom.js';

function Profile() {
    const [activeTab, setActiveTab] = useState('Profiles');

    const toggleTab = (tab) => {
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
            <div className='header'>프로필</div>
            <div className='tab'>
                <div className={`tab-item tab-Profiles ${activeTab === 'Profiles' ? 'active_tab_profile' : ''}`} onClick={() => toggleTab('Profiles')}>
                    프로필
                </div>
                <div className={`tab-item tab-Searchs ${activeTab === 'Searchs' ? 'active_tab_profile' : ''}`} onClick={() => toggleTab('Searchs')}>
                    검색
                </div>
            </div>
            {activeTab === 'Profiles' && <Profiles />}
            {activeTab === 'Searchs' && <Searchs />}
        </div>
    );
}

export default Profile;
