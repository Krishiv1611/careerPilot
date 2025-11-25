import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

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

export const addJob = async (jobData) => {
    const response = await api.post('/jobs/add', jobData);
    return response.data;
};

export const getAllJobs = async () => {
    const response = await api.get('/jobs/all');
    return response.data;
};

export const deleteJob = async (jobId) => {
    const response = await api.delete(`/jobs/${jobId}`);
    return response.data;
};

export const runCareerPilot = async (payload) => {
    const response = await api.post('/careerpilot/analyze', payload);
    return response.data;
};

export const getAllApplications = async () => {
    const response = await api.get('/applications/all');
    return response.data;
};

export const deleteApplication = async (appId) => {
    const response = await api.delete(`/applications/${appId}`);
    return response.data;
};

export default api;
