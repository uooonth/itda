import React, { useState, useEffect } from 'react';
import '../../../css/profile.css';
import chim from '../../../icons/chim.png';

const initialForm = {
    company: '',
    title: '',
    description: '',
    start_date: '',
    end_date: ''
};

const getFileIcon = (filename) => {
    if (!filename) return '📄';
    const extension = filename.split('.').pop().toLowerCase();
    const iconMap = {
        'pdf': '📄', 'doc': '📝', 'docx': '📝', 'xls': '📊', 'xlsx': '📊',
        'ppt': '📈', 'pptx': '📈', 'zip': '🗜️', 'rar': '🗜️', 'mp4': '🎬',
        'avi': '🎬', 'mov': '🎬', 'mp3': '🎵', 'wav': '🎵', 'txt': '📝',
        'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️'
    };
    return iconMap[extension] || '📄';
};

// 파일 아이콘 
const FileDisplay = ({ filename, isImage }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    if (isImage) {
        return (
                <div className="file-icon-display" style={{ fontSize: '48px', textAlign: 'center' }}>
                    {getFileIcon(filename)}
                </div>
        );
    }
    
    return (
        <div className="file-icon-display" style={{ fontSize: '48px', textAlign: 'center' }}>
            {getFileIcon(filename)}
            <div style={{ fontSize: '12px', marginTop: '5px' }}>
                {filename}
            </div>
        </div>
    );
};

const PersonalWorkModal = ({ username, onClose, onWorkUpdated }) => {
    const [personalWorks, setPersonalWorks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingWork, setEditingWork] = useState(null);
    const [formData, setFormData] = useState(initialForm);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [keepExistingFile, setKeepExistingFile] = useState(true);

    useEffect(() => { fetchWorks(); }, [username]);

    const fetchWorks = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:8008/users/${username}/personal-works`);
            const works = await res.json();
            setPersonalWorks(works);
        } catch (e) {
            console.error('작업물 조회 실패:', e);
        }
        setLoading(false);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setSelectedFile(file);
        setPreviewUrl(file ? URL.createObjectURL(file) : null);
        setKeepExistingFile(false);
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setKeepExistingFile(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('정말 삭제하시겠습니까?')) return;
        try {
            await fetch(`http://localhost:8008/users/${username}/personal-works/${id}`, { 
                method: 'DELETE' 
            });
            fetchWorks();
            onWorkUpdated();
        } catch (e) {
            console.error('삭제 실패:', e);
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingWork(null);
        setFormData(initialForm);
        setSelectedFile(null);
        setPreviewUrl(null);
        setKeepExistingFile(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const fd = new FormData();
            Object.entries(formData).forEach(([k, v]) => v && fd.append(k, v));
            
            // 파일 처리 로직 개선
            if (selectedFile) {
                fd.append('file', selectedFile);
                fd.append('keep_existing_file', false); // 새 파일이 있으면 기존 파일 교체
            } else {
                fd.append('keep_existing_file', keepExistingFile);
            }
    
            const url = editingWork
                ? `http://localhost:8008/users/${username}/personal-works/${editingWork.id}`
                : `http://localhost:8008/users/${username}/personal-works`;
            
            const response = await fetch(url, { 
                method: editingWork ? 'PUT' : 'POST', 
                body: fd 
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('저장 결과:', result);
                fetchWorks();
                resetForm();
                onWorkUpdated();
            } else {
                const errorText = await response.text();
                console.error('저장 실패:', errorText);
                alert('저장에 실패했습니다.');
            }
        } catch (e) {
            console.error('저장 실패:', e);
            alert('저장 중 오류가 발생했습니다.');
        }
    };
    const handleFileDownload = async (workId, filename) => {
        try {
            console.log(`다운로드 시도: workId=${workId}, filename=${filename}`);
            
            const response = await fetch(`http://localhost:8008/users/${username}/personal-works/${workId}/download`);
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                console.log(`다운로드 완료: ${filename}`);
            } else {
                const errorText = await response.text();
                console.error(`다운로드 실패 (${response.status}):`, errorText);
                alert('파일 다운로드에 실패했습니다.');
            }
        } catch (error) {
            console.error('다운로드 오류:', error);
            alert('파일 다운로드 중 오류가 발생했습니다.');
        }
    };
    
    const handleEdit = (w) => {
        setEditingWork(w);
        setFormData({
            company: w.company || '',
            title: w.title || '',
            description: w.description || '',
            start_date: w.start_date || '',
            end_date: w.end_date || ''
        });
        setSelectedFile(null);
        setPreviewUrl(null);
        setKeepExistingFile(true);
        setShowForm(true);
    };

    return (
        <div className="modal-overlay">
            <div className="profile-content">
                <div className="profile-header">
                    <div className="title">개인 작업물 관리</div>
                    <button className="close-btns" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    {!showForm ? (
                        <>
                            {loading ? (
                                <div>🔄 작업물 목록을 불러오는 중...</div>
                            ) : personalWorks.length ? (
                                <div className="projects-list">
                                <div className="titleDivinder">
                                    <span>등록된 작업물 ({personalWorks.length}개)</span>
                                </div>
                                    {personalWorks.map(w => (
                                        
                                        <div key={w.id} className="project-item">
                                            <div className="per-project-image">
                                                <div className="project-thumbnail">
                                                    {w.file_info?.has_file ? (
                                                        <FileDisplay 
                                                            filename={w.file_info.filename}
                                                            isImage={w.file_info.is_image}
                                                        />
                                                    ) : (
                                                        <div className="no-attachment">첨부파일없음</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="project-info">
                                                <div className="titleDivinder">
                                                    {w.title}
                                                    <div className="project-actions">
                                                        <button className="per-edit-btn" onClick={() => handleEdit(w)}>
                                                            ⚙️ 수정
                                                        </button>
                                                        <button className="per-delete-btn" onClick={() => handleDelete(w.id)}>
                                                            🗑️ 삭제
                                                        </button>
                                                    </div>
                                                </div>
                                                <p>{w.description}</p>
                                                <div className="profile-detail">
                                                    <div>🏢 회사 : {w.company}</div>
                                                    <div>📅 기간 : {w.start_date} ~ {w.end_date || '진행중'}</div>
                                                    {w.file_info?.has_file && (
                                                        <div 
                                                            className="file-download-link"
                                                            onClick={() => {
                                                                if (w.file_info.has_s3_file) {
                                                                    handleFileDownload(w.id, w.file_info.filename);
                                                                } else {
                                                                    alert('다운로드할 수 있는 파일이 없습니다.');
                                                                }
                                                            }}
                                                            style={{ 
                                                                cursor: w.file_info.has_s3_file ? 'pointer' : 'not-allowed', 
                                                                textDecoration: w.file_info.has_s3_file ? 'underline' : 'none' 
                                                            }}
                                                        >
                                                            📎 파일 : {w.file_info.filename} 
                                                        </div>
                                                    )}

                                                </div>
                                            </div>

                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div>📋 등록된 개인 작업물이 없습니다.</div>
                            )}
                            
                            <div className="per-add-work-section">
                                <button className="per-add-work-btn" onClick={() => setShowForm(true)}>
                                    + 작업물 추가
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="per-add-work-form">
                            <h3>{editingWork ? '작업물 수정' : '새 작업물 추가'}</h3>
                            <form onSubmit={handleSubmit}>
                                <div className="per-form-group">
                                    <label>회사/조직명</label>
                                    <input 
                                        type="text" 
                                        value={formData.company} 
                                        onChange={e => setFormData({ ...formData, company: e.target.value })} 
                                        required 
                                    />
                                </div>
                                
                                <div className="per-form-group">
                                    <label>작업물 제목</label>
                                    <input 
                                        type="text" 
                                        value={formData.title} 
                                        onChange={e => setFormData({ ...formData, title: e.target.value })} 
                                        required 
                                    />
                                </div>
                                
                                <div className="per-form-group">
                                    <label>설명</label>
                                    <textarea 
                                        value={formData.description} 
                                        onChange={e => setFormData({ ...formData, description: e.target.value })} 
                                        rows="4" 
                                    />
                                </div>

                                <div className="per-form-group">
                                    <label>첨부파일</label>
                                    <input type="file" onChange={handleFileChange} />
                                    
                                    {previewUrl && (
                                        <div className="file-preview">
                                            {selectedFile && selectedFile.type.startsWith('image/') ? (
                                                <img src={previewUrl} alt="미리보기" className="preview-image" />
                                            ) : (
                                                <div className="file-info">
                                                    <div className="file-icon-large">
                                                        {selectedFile ? getFileIcon(selectedFile.name) : '📄'}
                                                    </div>
                                                    <div className="file-name">
                                                        {selectedFile ? selectedFile.name : '파일'}
                                                    </div>
                                                </div>
                                            )}
                                            <button type="button" className="remove-file-btn" onClick={handleRemoveFile}>
                                                파일 삭제
                                            </button>
                                        </div>
                                    )}
                                    
                                    {editingWork && editingWork.attachment_url && !selectedFile && keepExistingFile && (
                                        <div className="existing-file">
                                            <p>기존 파일: {editingWork.attachment_url}</p>
                                            <button type="button" onClick={handleRemoveFile}>
                                                기존 파일 삭제
                                            </button>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="per-form-row">
                                    <div className="per-form-group">
                                        <label>시작일</label>
                                        <input 
                                            type="date" 
                                            value={formData.start_date} 
                                            onChange={e => setFormData({ ...formData, start_date: e.target.value })} 
                                            required 
                                        />
                                    </div>
                                    
                                    <div className="per-form-group">
                                        <label>종료일</label>
                                        <input 
                                            type="date" 
                                            value={formData.end_date} 
                                            onChange={e => setFormData({ ...formData, end_date: e.target.value })} 
                                        />
                                    </div>
                                </div>
                                
                                <div className="per-form-actions">
                                    <button type="submit" className="per-save-btn">
                                        {editingWork ? '수정하기' : '추가하기'}
                                    </button>
                                    <button type="button" className="per-cancel-btn" onClick={resetForm}>
                                        취소
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PersonalWorkModal;
