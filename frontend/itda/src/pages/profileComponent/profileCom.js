import React, { useState, useEffect, useRef } from 'react';
import chim from '../../icons/chim.png';
import TechStackModal from './popups/techStackModal';
import ProjectAddModal from './popups/projectAddPopup';
import PersonalWorkModal from './popups/PersonalWorkModal';

// 개인작업물 이미지 컴포넌트
const PersonalWorkImage = ({ workId, filename, username }) => {
    const [imageUrl, setImageUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const isImageFile = (filename) => {
        if (!filename) return false;
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.jfif'];
        const extension = '.' + filename.split('.').pop().toLowerCase();
        return imageExtensions.includes(extension);
    };

    useEffect(() => {
        const loadImage = async () => {
            if (!filename || !isImageFile(filename)) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(
                    `http://localhost:8008/users/${username}/personal-works/${workId}/file/preview`
                );
                
                if (response.ok) {
                    const data = await response.json();
                    setImageUrl(data.preview_url);
                } else {
                    setError(true);
                }
            } catch (error) {
                console.error('이미지 로드 실패:', error);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        loadImage();
    }, [workId, filename, username]);

    if (loading) {
        return (
            <div className="project-thumbnail">
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '100px',
                    fontSize: '12px',
                    color: '#666'
                }}>
                    🔄 로딩중...
                </div>
            </div>
        );
    }

    if (!isImageFile(filename)) {
        return (
            <div className="project-thumbnail">
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '100px',
                    fontSize: '12px',
                    color: '#999',
                    border: '2px dashed #ddd',
                    borderRadius: '8px',
                    backgroundColor: '#f9f9f9'
                }}>
                    <div style={{ fontSize: '24px', marginBottom: '5px' }}>📄</div>
                    <div style={{ fontWeight: 'bold' }}>미리볼 수 없음</div>
                    <div style={{ fontSize: '10px', marginTop: '2px' }}>
                        {filename?.split('.').pop()?.toUpperCase() || 'FILE'}
                    </div>
                </div>
            </div>
        );
    }

    if (error || !imageUrl) {
        return (
            <div className="project-thumbnail">
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '100px',
                    fontSize: '12px',
                    color: '#999',
                    border: '2px dashed #ddd',
                    borderRadius: '8px'
                }}>
                    <div style={{ fontSize: '24px', marginBottom: '5px' }}>❌</div>
                    <div>이미지 로드 실패</div>
                </div>
            </div>
        );
    }

    return (
        <div className="project-thumbnail">
            <img 
                src={imageUrl} 
                alt={filename || "개인작업물"} 
                className="project-thumb-img"
                onError={() => setError(true)}
            />
        </div>
    );
};

// 태그 추가 컴포넌트
const TagsInput = ({ tags, onTagsChange }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState('');

    const handleKeyUp = (e) => {
        if (e.key === 'Enter' && inputValue.trim() !== '') {
            const newTag = inputValue.trim();
            if (!tags.includes(newTag)) {
                const newTags = [...tags, newTag];
                onTagsChange(newTags);
            }
            setInputValue('');
        }
        if (e.key === 'Escape') {
            setIsEditing(false);
            setInputValue('');
        }
    };

    const removeTag = (tagToRemove) => {
        const newTags = tags.filter(tag => tag !== tagToRemove);
        onTagsChange(newTags);
    };

    const handleBlur = () => {
        if (inputValue.trim() !== '') {
            const newTag = inputValue.trim();
            if (!tags.includes(newTag)) {
                const newTags = [...tags, newTag];
                onTagsChange(newTags);
            }
        }
        setInputValue('');
        setIsEditing(false);
    };

    return (
        <div className='tags'>
            {tags && tags.map((tag, idx) => (
                <div className='tag' key={idx}>
                    {tag}
                    <span 
                        className='tag-remove'
                        onClick={() => removeTag(tag)}
                        style={{
                            marginLeft: '5px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            color: '#999'
                        }}
                    >
                        ×
                    </span>
                </div>
            ))}
            
            {isEditing ? (
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyUp={handleKeyUp}
                    onBlur={handleBlur}
                    placeholder="태그 입력 후 Enter"
                    autoFocus
                    style={{
                        border: '1px solid #ddd',
                        borderRadius: '15px',
                        padding: '5px 10px',
                        fontSize: '12px',
                        outline: 'none',
                        minWidth: '120px'
                    }}
                />
            ) : (
                <div 
                    className='plus'
                    onClick={() => setIsEditing(true)}
                    style={{ cursor: 'pointer' }}
                >
                    태그+
                </div>
            )}
        </div>
    );
};

// 자동완성 데이터
const UNIVERSITIES = [
    '서울대학교', '연세대학교', '고려대학교', '성균관대학교', '한양대학교', '중앙대학교', '경희대학교',
    '한국외국어대학교', '서강대학교', '이화여자대학교', '홍익대학교', '건국대학교', '동국대학교',
    '국민대학교', '숭실대학교', '세종대학교', '광운대학교', '명지대학교', '가천대학교', '인하대학교',
    '아주대학교', '단국대학교', '한국항공대학교', '경기대학교', '수원대학교', '용인대학교',
    '부산대학교', '경상국립대학교', '영남대학교', '동아대학교', '부경대학교', '인제대학교',
    '대구대학교', '계명대학교', '영진전문대학교', '전남대학교', '조선대학교', '목포대학교',
    '충남대학교', '충북대학교', '한밭대학교', '공주대학교', '강원대학교', '한라대학교',
    '제주대학교', '서원대학교', '청주대학교', '대전대학교', '호서대학교', '배재대학교'
];

const COMPANIES = [
    '삼성전자', '삼성SDS', '삼성생명', '삼성화재', '삼성물산', 'SK하이닉스', 'SK텔레콤', 'SK이노베이션',
    'LG전자', 'LG화학', 'LG디스플레이', 'LG CNS', '현대자동차', '기아', '현대모비스', '현대건설',
    '포스코', 'POSCO홀딩스', '한화시스템', '한화솔루션', 'KT', 'KT&G', '신한은행', 'KB국민은행',
    '하나은행', '우리은행', 'NH농협은행', '카카오', '네이버', '라인', '쿠팡', '배달의민족',
    '토스', '당근마켓', '야놀자', '마켓컬리', '무신사', '29CM', '지그재그', '오늘의집'
];

const EDUCATION_STATUS = ['재학', '휴학', '졸업', '수료', '중퇴', '졸업예정', '수료예정'];

            // 자동완성 인라인 편집 컴포넌트
            const InlineAutocompleteEdit = ({ value, onSave, suggestions, placeholder, canEdit, withStatus = false }) => 
                {
                    const [isEditing, setIsEditing] = useState(false);
                    const [editValue, setEditValue] = useState(value || '');
                    const [status, setStatus] = useState('');
                    const [filteredSuggestions, setFilteredSuggestions] = useState([]);
                    const [showSuggestions, setShowSuggestions] = useState(false);

                    useEffect(() => {
                        if (withStatus && value) {
                            const parts = value.split(' - ');
                            if (parts.length === 2) {
                                setEditValue(parts[0]);
                                setStatus(parts[1]);
                            }
                        }
                    }, [value, withStatus]);

                    const handleInputChange = (inputValue) => {
                        setEditValue(inputValue);
                        
                        if (inputValue.length > 0) {
                            const filtered = suggestions.filter(suggestion =>
                                suggestion.toLowerCase().includes(inputValue.toLowerCase())
                            ).slice(0, 8);
                            setFilteredSuggestions(filtered);
                            setShowSuggestions(true);
                        } else {
                            setShowSuggestions(false);
                        }
                    };

                    const handleSave = () => {
                        const finalValue = withStatus && status ? `${editValue} - ${status}` : editValue;
                        onSave(finalValue);
                        setIsEditing(false);
                        setShowSuggestions(false);
                    };

                    const handleKeyDown = (e) => {
                        if (e.key === 'Enter') {
                            handleSave();
                        } else if (e.key === 'Escape') {
                            setIsEditing(false);
                            setShowSuggestions(false);
                        }
                    };

                    const selectSuggestion = (suggestion) => {
                        setEditValue(suggestion);
                        setShowSuggestions(false);
                    };

                    if (!canEdit) {
                        return <span>{value || placeholder}</span>;
                    }

                    if (isEditing) {
                        return (
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input
                                        type="text"
                                        value={editValue}
                                        onChange={(e) => handleInputChange(e.target.value)}
                                        onBlur={() => setTimeout(handleSave, 150)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={placeholder}
                                        autoFocus
                                        style={{
                                            border: '2px solid #667eea',
                                            borderRadius: '4px',
                                            padding: '4px 8px',
                                            fontSize: 'inherit',
                                            fontFamily: 'inherit',
                                            minWidth: '200px'
                                        }}
                                    />
                                    {withStatus && (
                                        <select
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value)}
                                            style={{
                                                border: '2px solid #667eea',
                                                borderRadius: '4px',
                                                padding: '4px 8px',
                                                fontSize: 'inherit',
                                                fontFamily: 'inherit'
                                            }}
                                        >
                                            <option value="">상태 선택</option>
                                            {EDUCATION_STATUS.map(stat => (
                                                <option key={stat} value={stat}>{stat}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                                
                                {showSuggestions && filteredSuggestions.length > 0 && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        right: 0,
                                        background: 'white',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '4px',
                                        maxHeight: '200px',
                                        overflowY: 'auto',
                                        zIndex: 1000,
                                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                                    }}>
                                        {filteredSuggestions.map((suggestion, index) => (
                                            <div
                                                key={index}
                                                onClick={() => selectSuggestion(suggestion)}
                                                style={{
                                                    padding: '8px 12px',
                                                    cursor: 'pointer',
                                                    borderBottom: index < filteredSuggestions.length - 1 ? '1px solid #f3f4f6' : 'none',
                                                    fontSize: '14px',
                                                    transition: 'background-color 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                                                onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                                            >
                                                {suggestion}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    return (
                        <span 
                            onClick={() => setIsEditing(true)}
                            style={{
                                cursor: 'pointer',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                border: '2px solid transparent',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                        >
                            {value || placeholder}
                        </span>
                    );
                };

// 편집 가능한 프로필 이미지 컴포넌트
const EditableProfileImage = ({ currentImage, onImageSelect, selectedImage }) => {
    const fileInputRef = useRef(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        if (selectedImage) {
            const url = URL.createObjectURL(selectedImage);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [selectedImage]);

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            onImageSelect(file);
        }
    };

    return (
        <div 
            className='img'
            onClick={handleClick}
            style={{
                cursor: 'pointer',
                border: '3px dashed #667eea',
                position: 'relative'
            }}
        >
            {previewUrl || currentImage ? (
                <img src={previewUrl || currentImage} alt="프로필" />
            ) : (
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    color: '#667eea'
                }}>
                    <span style={{ fontSize: '24px' }}>📷</span>
                    <span style={{ fontSize: '12px' }}>클릭하여 변경</span>
                </div>
            )}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
            />
        </div>
    );
};

const ProfileCom = ({ username, isOwnProfile = true, isLoggedIn = true, viewMode = 'edit' }) => {
    const [userProfile, setUserProfile] = useState(null);
    const [userProfileUrl, setUserProfileUrl] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [platformProjects, setPlatformProjects] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [personalWorks, setPersonalWorks] = useState([]);
    const [showPersonalWorkModal, setShowPersonalWorkModal] = useState(false);
    const [showTechStackModal, setShowTechStackModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editFormData, setEditFormData] = useState({
        name: '',
        roles: '',
        education: '',
        intro: '',
        phone: '',
        location: '',
        birth: '',
        portfolio_url: ''
    });
    const [selectedImage, setSelectedImage] = useState(null);

    const canEdit = isOwnProfile && isLoggedIn && viewMode === 'edit';

    const fetchUserProjects = async () => {
        try {
            const userId = userProfile?.user?.id || username;
            const response = await fetch(`http://localhost:8008/users/${userId}/projects`);
            const data = await response.json();
            setPlatformProjects(data || []);
        } catch (error) {
            console.error('fetchUserProjects 오류', error);
            setPlatformProjects([]);
        }
    };

    const fetchPersonalWorks = async () => {
        try {
            const response = await fetch(`http://localhost:8008/users/${username}/personal-works`);
            const works = await response.json();
            setPersonalWorks(works.slice(0, 3));
        } catch (error) {
            console.error('개인작업물 조회 실패:', error);
        }
    };

    // 유저 데이터 로드
    useEffect(() => {
        const fetchAllData = async () => {
            if (!username) {
                setUserProfile({
                    roles: "로그인이 필요합니다",
                    education: "로그인이 필요합니다",
                    intro: "로그인이 필요합니다",
                    tech_stack: [],
                    tags: []
                });
                setUserInfo({ email: "로그인이 필요합니다" });
                setLoading(false);
                return;
            }
    
            setLoading(true);
            
            try {
                const [profileResponse, usersResponse] = await Promise.all([
                    fetch(`http://localhost:8008/users/${username}/profile`),
                    fetch(`http://localhost:8008/getUsers`)
                ]);
    
                const profileData = await profileResponse.json();
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
            } finally {
                setLoading(false); 
            }
        };
    
        fetchAllData();
    }, [username]);

    useEffect(() => {
        if (userProfile) {
            fetchUserProjects();
        }
    }, [userProfile]);

    useEffect(() => {
        if (userProfile && username) {
            fetchUserProjects();
        }
    }, [userProfile, username]);
    // 태그 업데이트 함수
    const handleTagsUpdate = async (newTags) => {
        try {
            const response = await fetch(`http://localhost:8008/users/${username}/profile/tags`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ tags: newTags })
            });

            if (response.ok) {
                setUserProfile(prev => ({
                    ...prev,
                    tags: newTags
                }));
                console.log('태그 업데이트 성공:', newTags);
            } else {
                console.error('태그 업데이트 실패');
                alert('태그 업데이트에 실패했습니다.');
            }
        } catch (error) {
            console.error('태그 업데이트 오류:', error);
            alert('태그 업데이트 중 오류가 발생했습니다.');
        }
    };

    // 기술스택 업데이트 함수
    const handleTechStackUpdated = async () => {
        try {
            const response = await fetch(`http://localhost:8008/users/${username}/profile`);
            const profileData = await response.json();
            setUserProfile(profileData.profile);
            setShowTechStackModal(false);
        } catch (error) {
            console.error('프로필 새로고침 실패:', error);
        }
    };

    const handleProjectAdded = () => {
        fetchUserProjects();
        setShowAddModal(false);
    };

    const handlePersonalWorkUpdated = () => {
        fetchPersonalWorks();
        setShowPersonalWorkModal(false);
    };

    useEffect(() => {
        if (username) {
            fetchPersonalWorks();
        }
    }, [username]);
    // 편집 모드 관련 함수들
    const startEditMode = () => {
        setEditFormData({
            name: username || '',
            roles: userProfile?.roles || '',
            education: userProfile?.education || '',
            intro: userProfile?.intro || '',
            phone: userProfile?.phone || '',
            location: userProfile?.location || '',
            birth: userProfile?.birth || '',
            portfolio_url: userProfile?.portfolio_url || ''
        });
        setIsEditMode(true);
    };

    const cancelEdit = () => {
        setIsEditMode(false);
        setSelectedImage(null);
        setEditFormData({});
    };

    const saveProfile = async () => {
        try {
            const formData = new FormData();
            
            Object.keys(editFormData).forEach(key => {
                let currentValue;
                if (key === 'name') {
                    currentValue = username;
                } else {
                    currentValue = userProfile?.[key] || '';
                }
                
                if (editFormData[key] !== currentValue && editFormData[key].trim() !== '') {
                    formData.append(key, editFormData[key]);
                    console.log(`변경된 필드: ${key} = ${editFormData[key]}`);
                }
            });

            if (selectedImage) {
                formData.append('profile_image', selectedImage);
            }

            const response = await fetch(`http://localhost:8008/users/${username}/profile/edit`, {
                method: 'PUT',
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                console.log('서버 응답:', data);
                
                if (data.user && data.user.name) {
                    console.log(`닉네임 업데이트: ${username} -> ${data.user.name}`);
                }
                
                setUserProfile(prev => ({
                    ...prev,
                    ...data.profile
                }));
                
                if (data.user) {
                    setUserInfo(prev => ({
                        ...prev,
                        name: data.user.name,
                        email: data.user.email
                    }));
                }
                
                if (data.profile_image_url) {
                    setUserProfileUrl(data.profile_image_url);
                }

                setIsEditMode(false);
                setSelectedImage(null);
                alert('프로필이 성공적으로 업데이트되었습니다.');
                window.location.reload();
            } else {
                const errorData = await response.json();
                console.error('업데이트 실패:', errorData);
                alert('프로필 업데이트에 실패했습니다.');
            }
        } catch (error) {
            console.error('프로필 저장 오류:', error);
            alert('프로필 저장 중 오류가 발생했습니다.');
        }
    };

    const handleFormChange = (field, value) => {
        setEditFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleImageSelect = (file) => {
        setSelectedImage(file);
    };

    const parseTechStack = (techStackItem) => {
        if (techStackItem.includes(':')) {
            const [name, level] = techStackItem.split(':');
            return { name: name.trim(), level: level.trim() };
        }
        return { name: techStackItem.trim(), level: '중' };
    };

    if (loading) {
        return <div>프로필 로딩 중...</div>;
    }

    return (
        <div className="profile-main-wrapper">
            <div className="contentss">
                {/* ========================= 프로필 상단================================ */}
                <div className='profile_top'>
                    {/* 편집 버튼 - 우측 상단 */}
                    {canEdit && (
                        <div className="edit-profile-btn" style={{
                            position: 'absolute',
                            top: '20px',
                            right: '20px',
                            zIndex: 10
                        }}>
                            {isEditMode ? (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button 
                                        onClick={saveProfile}
                                        style={{
                                            background: '#28a745',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            padding: '8px 16px',
                                            cursor: 'pointer',
                                            fontSize: '14px'
                                        }}
                                    >
                                        ✓ 저장
                                    </button>
                                    <button 
                                        onClick={cancelEdit}
                                        style={{
                                            background: '#6c757d',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            padding: '8px 16px',
                                            cursor: 'pointer',
                                            fontSize: '14px'
                                        }}
                                    >
                                        ✕ 취소
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    onClick={startEditMode}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '40px',
                                        height: '40px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'black',
                                        fontSize: '16px'
                                    }}
                                    title="프로필 편집"
                                >
                                    ✏️
                                </button>
                            )}
                        </div>
                    )}

                    {/* 프로필 이미지 */}
                    <div className="profile-image-section">
                        {isEditMode ? (
                            <EditableProfileImage 
                                currentImage={userProfileUrl}
                                onImageSelect={handleImageSelect}
                                selectedImage={selectedImage}
                            />
                        ) : (
                            <div className='img'>
                                {userProfileUrl ? (
                                    <img src={userProfileUrl} alt="프로필" />
                                ) : (
                                    "사진"
                                )}
                            </div>
                        )}
                    </div>

                    {/* 프로필 정보 */}
                    <div className='info'>
                        <div className='name'>
                            {isEditMode ? (
                                <input
                                    type="text"
                                    value={editFormData.name}
                                    onChange={(e) => handleFormChange('name', e.target.value)}
                                    style={{
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        padding: '8px',
                                        fontSize: '1.8rem',
                                        fontFamily: 'pretendard-Bold',
                                        width: '250px',
                                        background: 'white'
                                    }}
                                />
                            ) : (
                                userInfo?.name || username || "이름을 입력하세요"
                            )}
                        </div>
                        
                        <div className='role'>
                            {isEditMode ? (
                                <input
                                    type="text"
                                    value={editFormData.roles}
                                    onChange={(e) => handleFormChange('roles', e.target.value)}
                                    placeholder="직장을 입력하세요"
                                    style={{
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        padding: '8px',
                                        fontSize: '1.2rem',
                                        fontFamily: 'pretendard-Regular',
                                        width: '300px',
                                        background: 'white'
                                    }}
                                />
                            ) : (
                                userProfile?.roles || "직업 정보가 없습니다."
                            )}
                        </div>
                        
                        <div className='email'>💌{userInfo?.email}</div>
                        
                        <div className='grad'>
                            🚩
                            {isEditMode ? (
                                <input
                                    type="text"
                                    value={editFormData.education}
                                    onChange={(e) => handleFormChange('education', e.target.value)}
                                    placeholder="학교를 입력하세요"
                                    style={{
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        padding: '8px',
                                        fontSize: '1rem',
                                        fontFamily: 'pretendard-Regular',
                                        width: '300px',
                                        background: 'white'
                                    }}
                                />
                            ) : (
                                userProfile?.education || "재학 정보가 없습니다."
                            )}
                        </div>
                    </div>
                </div>

                {/* ========================= 프로필 설명 =============================== */}
                <div className='profile_explain'>
                    <div className='content'>
                        {isEditMode ? (
                            <textarea
                                value={editFormData.intro}
                                onChange={(e) => handleFormChange('intro', e.target.value)}
                                placeholder="소개글을 입력하세요"
                                style={{
                                    width: '100%',
                                    minHeight: '100px',
                                    border: '2px solid #667eea',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    fontSize: '1.1rem',
                                    fontFamily: 'pretendard-Regular',
                                    resize: 'vertical'
                                }}
                            />
                        ) : (
                            userProfile?.intro || "소개글이 없습니다."
                        )}
                    </div>
                    <div className='tags'>
                        {canEdit ? (
                            <TagsInput
                                tags={userProfile?.tags || []}
                                onTagsChange={handleTagsUpdate}
                            />
                        ) : (
                            <>
                                {userProfile?.tags && Array.isArray(userProfile.tags) && userProfile.tags.length > 0 ? (
                                    userProfile.tags.map((tag, index) => (
                                        <div key={index} className='tag'>
                                            {tag}
                                        </div>
                                    ))
                                ) : (
                                    <div>등록된 태그가 없습니다.</div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/*  ======================== itda 참여 프로젝트  ======================== */}
                <div className='profile_project semiTitle'>
                    <div className='title'>
                        <span>itda 참여 프로젝트</span>
                        {canEdit && (
                            <button 
                                className='add-project-btn' 
                                onClick={() => setShowAddModal(true)}
                                title="프로젝트 추가"
                            >
                                +
                            </button>
                        )}
                    </div>
                    <div className='project-container'>
                        {platformProjects && platformProjects.length > 0 ? (
                            platformProjects.map((project, index) => (
                                <div key={project.participation_id || index} className='project_'>
                                    <div className='name'>{project.project.project.name}</div>
                                    <div className='info'>
                                        <div className='datesDivider'>
                                            <div className='date startDate'>{project.joined_at}</div>
                                            <div className='date lineProfile'>|</div>
                                            <div className='date endDate'>{project.left_at}</div>
                                        </div>
                                        <div className='cooper'>분류 : {project.project.project.classification}</div>
                                    </div>
                                    <div className='project_name'>
                                        <div className='project-thumbnail'>
                                            <img 
                                                src={`http://localhost:8008${project.project.thumbnail}`}
                                                alt={project.project.project.name}
                                                className="project-thumb-img"
                                            />
                                        </div>
                                        <div className='project-text'>
                                            <div className='role'>{project.project.explain}</div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className='no-projects'>
                                <p>참여 중인 프로젝트가 없습니다.</p>
                                <p>+ 버튼을 클릭해서 프로젝트를 추가하세요!</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ======================== 개인 참여 프로젝트 =========================== */}
                <div className='profile_upload semiTitle'>
                    <div className='title'>
                        <span>개인 작업물</span>
                        {canEdit && (
                            <button 
                                className='add-project-btn' 
                                onClick={() => setShowPersonalWorkModal(true)}
                                title="개인 작업물 관리"
                            >
                                +
                            </button>
                        )}
                    </div>
                    <div className='project-container'>
                        {personalWorks.length > 0 ? (
                            personalWorks.map((work) => (
                                <div key={work.id} className='project_'>
                                    <div className='name'>{work.title}</div>
                                    <div className='info'>
                                        <div className='datesDivider'>
                                            <div className='date startDate'>{work.start_date}</div>
                                            <div className='date lineProfile'>|</div>
                                            <div className='date endDate'>{work.end_date || '진행중'}</div>
                                        </div>
                                        <div className='cooper'>@ 기업명 : {work.company}</div>
                                    </div>
                                    
                                    {work.file_info?.has_file && work.file_info?.has_s3_file ? (
                                        <PersonalWorkImage 
                                            workId={work.id}
                                            filename={work.file_info.filename}
                                            username={username}
                                        />
                                    ) : (
                                        <div className='project-thumbnail'>
                                            <img src={chim} alt="개인작업물" className="project-thumb-img" />
                                        </div>
                                    )}
                                    
                                    <div className='project_name'>
                                        <div className='project-text'>
                                            <div className='role'>{work.description}</div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className='no-projects'>
                                <p>등록된 개인 작업물이 없습니다.</p>
                                <p>+ 버튼을 클릭해서 작업물을 추가하세요!</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ======================== 기술스택 ===================================  */}
                <div className='profile_stack semiTitle'>
                    <div className='title'>
                        <span>기술 스택</span>
                        {canEdit && (
                            <button 
                                className='add-project-btn' 
                                onClick={() => setShowTechStackModal(true)}
                                title="기술스택 관리"
                            >
                                +
                            </button>
                        )}
                    </div>
                    <div className='project_'>
                        {userProfile?.tech_stack && Array.isArray(userProfile.tech_stack) && userProfile.tech_stack.length > 0 ? (
                            userProfile.tech_stack.map((stackItem, index) => {
                                const { name, level } = parseTechStack(stackItem);
                                return (
                                    <div key={index} className='stack'>
                                        <div className='stack_img'>
                                            <span style={{ fontSize: '24px' }}>⚡</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                            <div className='stack_name'>{name}</div>
                                            <span style={{
                                                fontSize: '12px',
                                                padding: '2px 8px',
                                                borderRadius: '8px',
                                                marginTop: '4px',
                                                background: level === '상' ? '#10b98115' : 
                                                        level === '중' ? '#f59e0b15' : '#ef444415',
                                                color: level === '상' ? '#10b981' : 
                                                    level === '중' ? '#f59e0b' : '#ef4444',
                                                fontFamily: 'pretendard-Medium'
                                            }}>
                                                {level}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="no-projects">
                                등록된 기술 스택이 없습니다.
                            </div>
                        )}
                    </div>
                </div>
                
                {/* ======================== 모든 모달 open 관리 ========================== */}
                {canEdit && showAddModal && (
                    <ProjectAddModal 
                        username={username}
                        onClose={() => setShowAddModal(false)}
                        onProjectAdded={handleProjectAdded}
                    />
                )}

                {canEdit && showPersonalWorkModal && (
                    <PersonalWorkModal 
                        username={username}
                        onClose={() => setShowPersonalWorkModal(false)}
                        onWorkUpdated={handlePersonalWorkUpdated}
                    />
                )}

                {canEdit && showTechStackModal && (
                    <TechStackModal 
                        username={username}
                        onClose={() => setShowTechStackModal(false)}
                        onStackUpdated={handleTechStackUpdated}
                    />
                )}
            </div>
        </div>
    );
};

export default ProfileCom;
