import React,{useState,useEffect} from 'react';
import search from '../../icons/search.svg';
import { useNavigate } from 'react-router-dom';

const STORAGE_KEY = 'itda_search_history2';
const SEARCH_RESULTS_KEY = 'itda_search_results';


const SearchCom = ({username,isLoggedIn }) => {
//===============================================//
//================= 검색 히스토리 ================//
//===============================================//
    //검색기록
   const [searchHistory, setSearchHistory] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        try {
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });    
    const [searchInput, setSearchInput] = useState('');
    //프로필 데이터 기록
    const [searchResults, setSearchResults] = useState(() => {
        const saved = localStorage.getItem(SEARCH_RESULTS_KEY);
        try {
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });
    //================= 검색 ================//
    useEffect(() => {
        const savedHistory = localStorage.getItem(STORAGE_KEY);
        if (savedHistory) {
            setSearchHistory(JSON.parse(savedHistory));
        }
    }, []);
    //검색기록 유즈이펙트
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(searchHistory));
    }, [searchHistory]);
    //프로필 데이터 기록 유즈이페그
    useEffect(() => {
        localStorage.setItem(SEARCH_RESULTS_KEY, JSON.stringify(searchResults));
    }, [searchResults]);

    const handleDeleteOne = (itemToDelete) => {
        setSearchHistory(prev => prev.filter(item => item !== itemToDelete));
    };

    const handleDeleteAll = () => {
        setSearchHistory([]);
    };


    
//===============================================//
//================= 프로필 가져오기 ================//
//===============================================//
    const [userProfile, setUserProfile] = useState(null);
    const [userProfileUrl, setUserProfileUrl] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    // 프로필 가쟈오기
    useEffect(() => {
        const fetchAllData = async () => {
            if (!username) return;
            
            try {
                const [profileResponse, usersResponse] = await Promise.all([
                    fetch(`http://localhost:8008/users/${username}/profile`),
                    fetch(`http://localhost:8008/getUsers`)
                ]);
    
                const profileData = await profileResponse.json();
                console.log(profileData, "유저프로필데이터");
                setUserProfileUrl(profileData.profile_image_url);
                setUserProfile(profileData.profile);
    
                const usersData = await usersResponse.json();
                const filteringData2 = usersData.find(userData => userData.id === username);
                
                if (filteringData2) {
                    setUserInfo(filteringData2);
                } else {
                    console.error('user filtering fail');
                    setUserInfo(null);
                }
    
            } catch (error) {
                console.error('데이터 패치 실패:', error);
            }
        };
    
        fetchAllData();
    }, [username]);


//========================================================//
//================= 친구 검색하면 나오게 하기 ================//
//========================================================//
    const [searchProfileUrl, setSearchProfileUrl] = useState(null);

    // 서치함수 진짜는 이녀석이다...
    const searchUserProfile = async (searchId) => {
        try {
            const response = await fetch(`http://localhost:8008/users/${searchId}/profile`);
            if (!response.ok) {
                alert('해당 사용자를 찾을 수 없습니다.');
                return;
            }          
            const data = await response.json();
            
            if (data.profile) {
                // 따끈따끈검색된 데이터
                const newSearchResult = {
                    profile: data.profile,
                    profileImageUrl: data.profile_image_url,
                    searchTime: new Date().getTime() 
                };
    
                setSearchResults(prev => {
                    // 이미 같은 사용자가 검색 결과에 있는지 확인
                    const existingIndex = prev.findIndex(
                        result => result.profile.user.id === data.profile.user.id
                    );
                    
                    let updatedResults;
                    
                    if (existingIndex !== -1) {
                        // 이미 존재하는 사용자면 기존 결과를 제거하고 새로운 결과를 맨 앞에 추가
                        updatedResults = prev.filter((_, index) => index !== existingIndex);
                        updatedResults = [newSearchResult, ...updatedResults];
                    } else {
                        // 새로운 사용자면 맨 앞에 추가
                        updatedResults = [newSearchResult, ...prev];
                    }
                    
                    // 최대 4개까지
                    return updatedResults.slice(0, 4);
                });
            } else {
                alert('프로필 데이터가 없습니다.');
            }
        } catch (error) {
            console.error('프로필 검색 실패:', error);
        }
    };
    //엔터 핸들러 = 검색기록 + 서치함수 실행
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            const trimmed = searchInput.trim();
            if (trimmed && !searchHistory.includes(trimmed)) {
                setSearchHistory(prev => {
                    const withoutDuplicate = prev.filter(item => item !== trimmed);
                    const updated = [trimmed, ...withoutDuplicate];
        
                    return updated.slice(0, 6);
                });}
            searchUserProfile(trimmed);
            setSearchInput('');
        }
    };

    // 검색 결과 삭제 핸들러
    const handleDeleteSearchResult = (userIdToDelete) => {
        setSearchResults(prev => 
            prev.filter(result => result.profile.user.id !== userIdToDelete)
        );
    };



//========================================================//
//=================  프로필 보기 버튼 네비   ================//
//========================================================//
    const navigate = useNavigate();

    // 프로필 보기 버튼 핸들러
    const handleViewProfile = (userId) => {
        navigate(`/profile/${userId}`);
    };




    return (
        <div className="contentss">
            {/* ======================== 내프로필 =================== */}
            {isLoggedIn && (
                <div className='profile_top'>
                            <div className='img'>
                                {userProfileUrl ? (
                                    <img src={userProfileUrl} alt="프로필" />
                                ) : (
                                    "사진"
                                )}
                            </div>                    <div className='info'>
                        <div className='name'>{userInfo?.name}</div>
                        <div className='role'>{userProfile?.roles}</div>
                        <div className='email'>💌{userInfo?.email}</div>
                        <div className='grad'>🚩{userProfile?.education}</div> 
                    </div>
                </div>
            )}
                    
            {/* 비로그인 */}
            {!isLoggedIn && (
                <div style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '12px',
                    marginBottom: '30px',
                    border: '1px solid #e9ecef'
                }}>
                    <div style={{
                        fontSize: '1.2rem',
                        fontFamily: 'pretendard-SemiBold',
                        color: '#495057',
                        marginBottom: '10px'
                    }}>
                        🔍 사용자 검색
                    </div>
                    <div style={{
                        fontSize: '0.9rem',
                        color: '#6c757d',
                        fontFamily: 'pretendard-Regular'
                    }}>
                        다른 사용자의 프로필을 검색해보세요
                    </div>
                </div>
            )}
    
            {/* ======================== 검색 입력창 ======================== */}
            <div className="searchBox searchBox2" style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '20px',
                padding: '12px',
                border: '2px solid #e9ecef',
                borderRadius: '25px',
                backgroundColor: 'white'
            }}>
                <img 
                    src={search} 
                    alt="검색" 
                    style={{ 
                        width: '20px', 
                        height: '20px', 
                        marginRight: '12px',
                        opacity: 0.6 
                    }} 
                />
                <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="사용자 ID를 입력하세요"
                    style={{
                        flex: 1,
                        border: 'none',
                        outline: 'none',
                        fontSize: '16px',
                        fontFamily: 'pretendard-Regular',
                        backgroundColor: 'transparent'
                    }}
                />
            </div>
    
            {/* ======================== 검색 기록 ======================== */}
            {searchHistory.length > 0 && (
                <div className="searchHistroy">
                    <div style={{
                        fontSize: '14px',
                        fontFamily: 'pretendard-SemiBold',
                        color: '#6c757d',
                        marginBottom: '10px'
                    }}>
                        최근 검색어
                    </div>
                    {searchHistory.map((item, idx) => (
                        <div className="object" key={idx}>
                            {item}
                            <div className="xBtn" onClick={() => handleDeleteOne(item)}>X</div>
                        </div>
                    ))}
                    <div className="btn" onClick={handleDeleteAll}>모두삭제</div>
                </div>
            )}
    
            {/* ======================== 검색 결과 =================== */}
            {searchResults.length > 0 && (
                <div className="friendList">
                    <div className="title">검색 결과</div>
                    {searchResults.map((searchResult, i) => (
                        <div className="object" key={`${searchResult.profile.user.id}-${searchResult.searchTime}`}>
                            <div className="deleteBtn" onClick={() => handleDeleteSearchResult(searchResult.profile.user.id)}>X</div>
                            <div className="Friend_content">
                                <div className="profile_img">
                                    {searchResult.profileImageUrl ? (
                                        <img 
                                            src={searchResult.profileImageUrl} 
                                            alt="프로필"
                                            onError={(e) => {
                                                console.log('이미지 로드 실패:', e.target.src);
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        "img"
                                    )}
                                </div>
                                <div className="info">
                                    <div className="name">{searchResult.profile.user.id}</div>
                                    <div className="role">{searchResult.profile.roles}</div>
                                </div>
                            </div>
                            <div className="rightSides">
                                {searchResult.profile.is_public ? (
                                    <button 
                                        className="button-addFriend"
                                        onClick={() => handleViewProfile(searchResult.profile.user.id)}
                                    >
                                        프로필 보기
                                    </button>
                                ) : (
                                    <button 
                                        className="button-addFriend disabled"
                                        disabled
                                    >
                                        프로필 비공개
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}    
export default SearchCom;