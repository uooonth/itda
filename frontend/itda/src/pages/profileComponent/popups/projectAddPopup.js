import React, { useState, useEffect } from 'react';
import '../../../css/profile.css';

const ProjectAddModal = ({ username, onClose, onProjectAdded }) => {
    const [workerProjects, setWorkerProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        fetchWorkerProjects();
    }, [username]);

    const fetchWorkerProjects = async () => {
        try {
            const response = await fetch(`http://localhost:8008/users/${username}/worker-projects`);
            const data = await response.json();
            setWorkerProjects(data.worker_projects || []);
        } catch (error) {
            console.error('Worker 프로젝트 조회 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddProject = async (projectId) => {
        setActionLoading(projectId);
        try {
            const response = await fetch(
                `http://localhost:8008/users/${username}/join-project/${projectId}`,
                { method: 'POST' }
            );
            
            if (response.ok) {
                // 프로젝트 상태 업데이트
                setWorkerProjects(prev => 
                    prev.map(project => 
                        project.project_info_id === projectId 
                            ? { ...project, is_participated: true }
                            : project
                    )
                );
                onProjectAdded(); // ProfileCom.js 새로고침
            }
        } catch (error) {
            console.error('프로젝트 추가 실패:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleRemoveProject = async (projectId) => {
        setActionLoading(projectId);
        try {
            const response = await fetch(
                `http://localhost:8008/users/${username}/leave-project/${projectId}`,
                { method: 'DELETE' }
            );
            
            if (response.ok) {
                // 프로젝트 상태 업데이트
                setWorkerProjects(prev => 
                    prev.map(project => 
                        project.project_info_id === projectId 
                            ? { ...project, is_participated: false }
                            : project
                    )
                );
                onProjectAdded(); // ProfileCom.js 새로고침
            }
        } catch (error) {
            console.error('프로젝트 제거 실패:', error);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="profile-content">
                <div className="profile-header">
                    <div className="title">추가 가능 프로젝트</div>
                    <button className="close-btns" onClick={onClose}>×</button>
                </div>
                
                <div className="modal-body">
                    {loading ? (
                        <div>🔄 프로젝트 목록을 불러오는 중...</div>
                    ) : workerProjects.length > 0 ? (
                        <div className="projects-list">
                            {workerProjects.map((project) => (
                                <div key={project.project_info_id} className="project-item">
                                    <div className="project-info">
                                        <h4>{project.project_name}</h4>
                                        <p>{project.project_description}</p>
                                        <div className="profile-detail">
                                            <div>📁 분류 : {project.classification}</div>
                                            <div>📅 계약 마감일 : {project.contract_until}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="project-actions">
                                        {project.is_participated ? (
                                            <button 
                                                className="hide-btn"
                                                onClick={() => handleRemoveProject(project.project_info_id)}
                                                disabled={actionLoading === project.project_info_id}
                                            >
                                                {actionLoading === project.project_info_id ? '⏳ 처리중...' : '- 숨기기'}
                                            </button>
                                        ) : (
                                            <button 
                                                className="add-btn"
                                                onClick={() => handleAddProject(project.project_info_id)}
                                                disabled={actionLoading === project.project_info_id}
                                            >
                                                {actionLoading === project.project_info_id ? '⏳ 처리중...' : '+ 추가하기'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div>📋 참여 가능한 프로젝트가 없습니다.</div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default ProjectAddModal;