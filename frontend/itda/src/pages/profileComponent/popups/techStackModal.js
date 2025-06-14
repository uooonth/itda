import React, { useState, useEffect } from 'react';
import '../../../css/profile.css';

//  기술스택 자동완성 목록 
const PREDEFINED_TECH_STACKS = [
    // Frontend
    'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Angular', 'HTML', 'CSS', 'SCSS', 'Tailwind CSS',
    'jQuery', 'Bootstrap', 'Material-UI', 'Ant Design', 'Styled Components', 'Next.js', 'Nuxt.js',
    
    // Backend
    'Node.js', 'Express.js', 'Python', 'Django', 'Flask', 'FastAPI', 'Java', 'Spring Boot', 'Spring',
    'PHP', 'Laravel', 'CodeIgniter', 'Ruby', 'Ruby on Rails', 'C#', '.NET', 'ASP.NET', 'Go', 'Gin',
    
    // Database
    'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle', 'MariaDB', 'Firebase', 'Supabase',
    
    // DevOps & Tools
    'Docker', 'Kubernetes', 'AWS', 'Azure', 'Google Cloud', 'Git', 'GitHub', 'GitLab', 'Jenkins',
    'Nginx', 'Apache', 'Linux', 'Ubuntu', 'CentOS',
    
    // Mobile
    'React Native', 'Flutter', 'Swift', 'Kotlin', 'Ionic', 'Xamarin',
    
    // Others
    'GraphQL', 'REST API', 'Socket.io', 'Webpack', 'Vite', 'Babel', 'ESLint', 'Prettier',
       // Video Production & Editing
       'Adobe Premiere Pro', 'Final Cut Pro', 'DaVinci Resolve', 'After Effects', 'CapCut', 'iMovie',
       'Wondershare Filmora', 'Sony VEGAS Pro', 'HitFilm', 'Blender', 'Avid Media Composer', 'Lightworks',
       
       // Design & Creative Tools
       'Adobe Photoshop', 'Adobe Illustrator', 'Adobe InDesign', 'Adobe XD', 'Figma', 'Sketch',
       'Canva', 'Procreate', 'Affinity Designer', 'Affinity Photo', 'CorelDRAW', 'GIMP', 'Inkscape',
       
       // 3D & Animation
       'Blender', 'Maya', 'Cinema 4D', 'Unity', 'Unreal Engine', '3ds Max', 'ZBrush', 'Houdini',
       'Substance Painter', 'Substance Designer', 'Marvelous Designer',
       
       // Audio & Music Production
       'Pro Tools', 'Logic Pro', 'Ableton Live', 'FL Studio', 'Cubase', 'Reaper', 'GarageBand',
       'Audacity', 'Adobe Audition', 'Studio One',
       
       // Content Creation Platforms
       'WordPress', 'Webflow', 'Squarespace', 'Wix', 'Notion', 'Airtable', 'Trello', 'Asana',
       
       // Video Streaming & CDN
       'FFmpeg', 'OBS Studio', 'Streamlabs', 'Wirecast', 'XSplit', 'RTMP', 'WebRTC', 'HLS',
       'DASH', 'VP9', 'AV1', 'H.264', 'H.265', 'CloudFlare', 'AWS CloudFront',
       
       // Machine Learning & AI (Creative)
       'TensorFlow', 'PyTorch', 'OpenCV', 'YOLO', 'Stable Diffusion', 'DALL-E', 'Midjourney',
       'RunwayML', 'Adobe Sensei', 'Topaz AI', 'DeepArt',
       
       // Social Media & Marketing
       'Facebook Ads Manager', 'Google Ads', 'Instagram Creator Studio', 'TikTok Ads Manager',
       'YouTube Studio', 'Hootsuite', 'Buffer', 'Later', 'Sprout Social',
       
       // Photography
       'Adobe Lightroom', 'Capture One', 'Luminar', 'ON1 Photo RAW', 'Skylum Aurora HDR',
       'Phase One', 'DxO PhotoLab', 'RawTherapee',
       
       // Live Streaming
       'OBS Studio', 'Streamlabs OBS', 'XSplit', 'Wirecast', 'vMix', 'Restream', 'StreamYard',
       'Twitch Studio', 'YouTube Live', 'Facebook Live',
       
       // Color Grading & VFX
       'DaVinci Resolve', 'Adobe After Effects', 'Nuke', 'Fusion', 'Mocha Pro', 'SynthEyes',
       'PFTrack', 'Silhouette', 'Red Giant Universe', 'Magic Bullet Suite',
       
       // Motion Graphics
       'Adobe After Effects', 'Cinema 4D', 'Blender', 'Apple Motion', 'HitFilm Pro', 'Fusion',
       'Cavalry', 'Lottie', 'Bodymovin',
       
       // Game Development
       'Unity', 'Unreal Engine', 'Godot', 'GameMaker Studio', 'Construct 3', 'RPG Maker',
       'Defold', 'Cocos2d', 'Phaser',
       
       // AR/VR Development
       'Unity AR Foundation', 'ARKit', 'ARCore', 'Vuforia', 'Spark AR', 'Lens Studio',
       'A-Frame', 'Three.js', 'WebXR', 'Oculus SDK',
       
       // Analytics & Data
       'Google Analytics', 'Adobe Analytics', 'Mixpanel', 'Amplitude', 'Hotjar', 'Crazy Egg',
       'YouTube Analytics', 'TikTok Analytics', 'Instagram Insights',
       
       // Collaboration & Project Management
       'Slack', 'Discord', 'Microsoft Teams', 'Zoom', 'Frame.io', 'Wipster', 'ReviewBoard',
       'Monday.com', 'ClickUp', 'Basecamp',
       
       // Others
       'GraphQL', 'REST API', 'Socket.io', 'Webpack', 'Vite', 'Babel', 'ESLint', 'Prettier',
];

const SKILL_LEVELS = [
    { value: '상', label: '상 (능숙)', color: '#10b981' },
    { value: '중', label: '중 (보통)', color: '#f59e0b' },
    { value: '하', label: '하 (초급)', color: '#ef4444' }
];

const TechStackModal = ({ username, onClose, onStackUpdated }) => {
    const [techStacks, setTechStacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredStacks, setFilteredStacks] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        level: '중'
    });

    // 기존 함수들은 동일...
    const parseExistingTechStacks = (techStackArray) => {
        return techStackArray.map((item, index) => {
            if (item.includes(':')) {
                const [name, level] = item.split(':');
                return { index, name: name.trim(), level: level.trim() };
            } else {
                return { index, name: item.trim(), level: '중' };
            }
        });
    };

    const fetchTechStacks = async () => {
        try {
            const response = await fetch(`http://localhost:8008/users/${username}/profile`);
            const data = await response.json();
            
            if (data.profile && data.profile.tech_stack) {
                const parsedStacks = parseExistingTechStacks(data.profile.tech_stack);
                setTechStacks(parsedStacks);
            } else {
                setTechStacks([]);
            }
        } catch (error) {
            console.error('기술스택 조회 실패:', error);
            setTechStacks([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTechStacks();
    }, [username]);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredStacks([]);
        } else {
            const filtered = PREDEFINED_TECH_STACKS.filter(stack =>
                stack.toLowerCase().includes(searchTerm.toLowerCase())
            ).slice(0, 8);
            setFilteredStacks(filtered);
        }
    }, [searchTerm]);

    const resetForm = () => {
        setFormData({ name: '', level: '중' });
        setSearchTerm('');
        setFilteredStacks([]);
        setEditingIndex(null);
        setShowForm(false);
    };

    const updateTechStacksAPI = async (newTechStackArray) => {
        try {
            const response = await fetch(`http://localhost:8008/users/${username}/tech-stack`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tech_stack: newTechStackArray })
            });

            if (response.ok) {
                await fetchTechStacks();
                onStackUpdated();
                return true;
            } else {
                alert('기술스택 업데이트에 실패했습니다.');
                return false;
            }
        } catch (error) {
            console.error('기술스택 업데이트 실패:', error);
            alert('기술스택 업데이트 중 오류가 발생했습니다.');
            return false;
        }
    };

    const handleAddStack = async () => {
        if (!formData.name.trim()) {
            alert('기술스택 이름을 입력해주세요.');
            return;
        }

        if (techStacks.some(stack => stack.name.toLowerCase() === formData.name.toLowerCase())) {
            alert('이미 추가된 기술스택입니다.');
            return;
        }

        const newStackString = `${formData.name}:${formData.level}`;
        const currentStackStrings = techStacks.map(stack => `${stack.name}:${stack.level}`);
        const newTechStackArray = [...currentStackStrings, newStackString];

        const success = await updateTechStacksAPI(newTechStackArray);
        if (success) {
            resetForm();
        }
    };

    const handleUpdateStack = async () => {
        if (!formData.name.trim()) {
            alert('기술스택 이름을 입력해주세요.');
            return;
        }

        const newTechStackArray = techStacks.map((stack, index) => {
            if (index === editingIndex) {
                return `${formData.name}:${formData.level}`;
            }
            return `${stack.name}:${stack.level}`;
        });

        const success = await updateTechStacksAPI(newTechStackArray);
        if (success) {
            resetForm();
        }
    };

    const handleDeleteStack = async (deleteIndex) => {
        if (!window.confirm('이 기술스택을 삭제하시겠습니까?')) return;

        const newTechStackArray = techStacks
            .filter((_, index) => index !== deleteIndex)
            .map(stack => `${stack.name}:${stack.level}`);

        await updateTechStacksAPI(newTechStackArray);
    };

    const startEdit = (stack, index) => {
        setEditingIndex(index);
        setFormData({ name: stack.name, level: stack.level });
        setSearchTerm(stack.name);
        setShowForm(true);
    };

    const selectPredefinedStack = (stackName) => {
        setFormData(prev => ({ ...prev, name: stackName }));
        setSearchTerm(stackName);
        setFilteredStacks([]);
    };

    const getLevelColor = (level) => {
        const skillLevel = SKILL_LEVELS.find(sl => sl.value === level);
        return skillLevel ? skillLevel.color : '#6b7280';
    };

    return (
        <div className="modal-overlay">
            <div className="profile-content">
                <div className="profile-header">
                    <div className="title">기술 스택 관리</div>
                    <button className="close-btns" onClick={onClose}>×</button>
                </div>
                
                <div className="modal-body">
                    {loading ? (
                        <div>🔄 기술스택을 불러오는 중...</div>
                    ) : (
                        <>


                            {/* 기술스택 목록 - 프로젝트 팝업과 동일한 스타일 */}
                            <div className="projects-list">
                                <div className="titleDivinder">
                                    <span>등록된 기술스택 ({techStacks.length}개)</span>
                                </div>
                                
                                {techStacks.length > 0 ? (
                                    techStacks.map((stack, index) => (
                                        <div key={index} className="project-item">
                                            <div className="project-info">
                                            <div className="titleDivinder">
                                                    {stack.name}
                                                    <div className="project-actions">
                                                    <button className="per-edit-btn" onClick={() => startEdit(stack, index)}>
                                                        ⚙️ 수정
                                                    </button>
                                                    <button className="per-delete-btn" onClick={() => handleDeleteStack(index)}>
                                                        🗑️ 삭제
                                                    </button>
                                                    </div>
                                                </div>
                                                <div className="profile-detail">
                                                    <div style={{
                                                        padding: '4px 12px',
                                                        borderRadius: '12px',
                                                        fontSize: '12px',
                                                        fontFamily: 'pretendard-Medium',
                                                        background: `${getLevelColor(stack.level)}15`,
                                                        color: getLevelColor(stack.level),
                                                        border: `1px solid ${getLevelColor(stack.level)}30`,
                                                        display: 'inline-block'
                                                    }}>
                                                        사용 수준: {stack.level}
                                                    </div>
                                                </div>
                                            </div>
                                            

                                        </div>
                                    ))
                                ) : (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '40px 20px',
                                        color: '#9ca3af',
                                        fontFamily: 'pretendard-Regular'
                                    }}>
                                        등록된 기술스택이 없습니다.<br />
                                        새 기술스택을 추가해보세요!
                                    </div>
                                )}
                            </div>
                                                        {/* 추가 버튼 - 프로젝트 팝업과 동일한 위치 */}
                                                        {!showForm && (
                                <div className="per-add-work-section">
                                    <button 
                                        className="teck-add-btn"
                                        onClick={() => setShowForm(true)}
                                    >
                                        + 새 기술스택 추가
                                    </button>
                                </div>
                            )}

                            {/* 추가/수정 폼 - 프로젝트 팝업과 동일한 스타일 */}
                            {showForm && (
                                <div className="per-add-work-form">
                                    <div className="titleDivinder">
                                        <span>{editingIndex !== null ? '기술스택 수정' : '새 기술스택 추가'}</span>
                                        <button 
                                            onClick={resetForm}
                                            className="close-btns"
                                        >
                                            ×
                                        </button>
                                    </div>

                                    {/* 기술스택 이름 입력 */}
                                    <div className="per-form-group" style={{ position: 'relative' }}>
                                        <label>기술스택 이름</label>
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => {
                                                setSearchTerm(e.target.value);
                                                setFormData(prev => ({ ...prev, name: e.target.value }));
                                            }}
                                            placeholder="기술스택을 입력하거나 선택하세요"
                                        />
                                        
                                        {/* 검색 결과 드롭다운 */}
                                        {filteredStacks.length > 0 && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '100%',
                                                left: 0,
                                                right: 0,
                                                background: 'white',
                                                border: '1px solid #d1d5db',
                                                borderTop: 'none',
                                                borderRadius: '0 0 8px 8px',
                                                maxHeight: '200px',
                                                overflowY: 'auto',
                                                zIndex: 10,
                                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                                            }}>
                                                {filteredStacks.map((stack, index) => (
                                                    <div
                                                        key={index}
                                                        onClick={() => selectPredefinedStack(stack)}
                                                        style={{
                                                            padding: '12px',
                                                            cursor: 'pointer',
                                                            borderBottom: index < filteredStacks.length - 1 ? '1px solid #f3f4f6' : 'none',
                                                            fontSize: '14px',
                                                            fontFamily: 'pretendard-Regular',
                                                            transition: 'background-color 0.2s'
                                                        }}
                                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                                                        onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                                                    >
                                                        {stack}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* 사용 수준 선택 */}
                                    <div className="per-form-group">
                                        <label>사용 수준</label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {SKILL_LEVELS.map((level) => (
                                                <button
                                                    key={level.value}
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, level: level.value }))}
                                                    style={{
                                                        flex: 1,
                                                        padding: '10px',
                                                        border: formData.level === level.value ? `2px solid ${level.color}` : '2px solid #e0e0e0',
                                                        borderRadius: '8px',
                                                        background: formData.level === level.value ? `${level.color}15` : 'white',
                                                        color: formData.level === level.value ? level.color : '#6b7280',
                                                        fontSize: '13px',
                                                        fontFamily: 'pretendard-Medium',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    {level.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 버튼 그룹 */}
                                    <div className="per-form-actions">
                                        <button
                                            onClick={editingIndex !== null ? handleUpdateStack : handleAddStack}
                                            className="per-save-btn"
                                        >
                                            {editingIndex !== null ? '수정하기' : '추가하기'}
                                        </button>
                                        <button
                                            onClick={resetForm}
                                            className="per-cancel-btn"
                                        >
                                            취소
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TechStackModal;
