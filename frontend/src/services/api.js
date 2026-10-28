import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const uploadResume = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/resume/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const getAllResumes = async () => {
    const response = await api.get('/resume/all');
    return response.data;
};

export const deleteResume = async (resumeId) => {
    const response = await api.delete(`/resume/${resumeId}`);
    return response.data;
};

export const getAllJobs = async () => {
    const response = await api.get('/jobs/all');
    return response.data;
};

export const saveJob = async (jobId) => {
    const response = await api.post(`/jobs/${jobId}/save`);
    return response.data;
};

export const dismissJob = async (jobId) => {
    const response = await api.post(`/jobs/${jobId}/dismiss`);
    return response.data;
};

export const discoverJobs = async (search) => {
    const response = await api.post('/discovery/search', search);
    return response.data;
};

export const getAllApplications = async () => {
    const response = await api.get('/applications/all');
    return response.data;
};

export const getToday = async () => {
    const response = await api.get('/today');
    return response.data;
};

export const createApplication = async (jobId, resumeId = null) => {
    const response = await api.post('/applications', {
        job_id: jobId,
        resume_id: resumeId,
        confirmed: true,
    });
    return response.data;
};

export const updateApplicationStatus = async (applicationId, update) => {
    const response = await api.patch(`/applications/${applicationId}/status`, update);
    return response.data;
};

export const updateApplicationDetails = async (applicationId, update) => {
    const response = await api.patch(`/applications/${applicationId}`, update);
    return response.data;
};

export const deleteApplication = async (appId) => {
    const response = await api.delete(`/applications/${appId}`);
    return response.data;
};

export const analyzeResumeForJob = async (payload) => {
    const response = await api.post('/resume-studio/analyze', payload);
    return response.data;
};

export const getResumeVersions = async (resumeId) => {
    const response = await api.get('/resume-studio/versions', {
        params: resumeId ? { resume_id: resumeId } : {},
    });
    return response.data;
};

export const promptResumeVersion = async (versionId, instruction) => {
    const response = await api.post(`/resume-studio/versions/${versionId}/prompt`, {
        instruction,
    });
    return response.data;
};

export const reviewResumeVersion = async (versionId, payload) => {
    const response = await api.post(`/resume-studio/versions/${versionId}/review`, payload);
    return response.data;
};

export const downloadResumeVersion = async (versionId) => {
    const response = await api.get(`/resume-studio/versions/${versionId}/download`, {
        responseType: 'blob',
    });
    return response.data;
};

export const getGitHubStatus = async () => {
    const response = await api.get('/github/status');
    return response.data;
};

export const connectGitHub = async () => {
    const response = await api.post('/github/connect');
    return response.data;
};

export const getGitHubRepositories = async () => {
    const response = await api.get('/github/repositories');
    return response.data;
};

export const findGitHubEvidence = async (resumeVersionId, repositories) => {
    const response = await api.post('/github/evidence', {
        resume_version_id: resumeVersionId,
        repositories,
    });
    return response.data;
};

export const approveGitHubEvidence = async (evidenceId, payload) => {
    const response = await api.post(`/github/evidence/${evidenceId}/approve`, payload);
    return response.data;
};

export const disconnectGitHub = async () => {
    const response = await api.delete('/github/connection');
    return response.data;
};

export const getGrowthPlan = async () => {
    const response = await api.get('/growth/plan');
    return response.data;
};

export const completeGrowthPriority = async (priorityId, completion) => {
    const response = await api.post(`/growth/priorities/${priorityId}/complete`, completion);
    return response.data;
};

export const analyzeJobMatch = async (jobId, resumeId = null) => {
    const response = await api.post('/matches/analyze', {
        job_id: jobId,
        resume_id: resumeId,
    });
    return response.data;
};

export const getCandidateProfile = async () => {
    const response = await api.get('/profile');
    return response.data;
};

export const updateCandidateProfile = async (profile) => {
    const response = await api.put('/profile', profile);
    return response.data;
};


export const getSavedJobs = async () => {
    const response = await api.get('/jobs/saved');
    return response.data;
};

export const unsaveJob = async (jobId) => {
    const response = await api.post(`/jobs/${jobId}/unsave`);
    return response.data;
};

export const generateOutreach = async (payload) => {
    const response = await api.post('/outreach/generate', payload);
    return response.data;
};

export const fetchLeetCodeProfile = async (username) => {
    const response = await api.post('/connectors/leetcode', { username });
    return response.data;
};

export const fetchGitHubProfile = async (username) => {
    const response = await api.post('/connectors/github', { username });
    return response.data;
};

export const importLinkedInProfile = async (text) => {
    const response = await api.post('/connectors/linkedin', { text });
    return response.data;
};


export const getSkillBlueprint = async (skill) => {
    const response = await api.get(`/growth/blueprints/${encodeURIComponent(skill)}`);
    return response.data;
};

export const verifyGitHubRepo = async (repoUrl, skill) => {
    const response = await api.post('/growth/verify-repo', {
        repo_url: repoUrl,
        skill,
    });
    return response.data;
};

export default api;
