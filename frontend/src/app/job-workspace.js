export const applyJobState = (jobs, updatedJob) => {
  if (updatedJob.user_state === 'dismissed') {
    return jobs.filter((job) => job.id !== updatedJob.id);
  }

  return jobs.map((job) => (job.id === updatedJob.id ? { ...job, ...updatedJob } : job));
};

export const applySavedJobState = (savedJobs, updatedJob) => {
  if (updatedJob.user_state === 'saved') {
    const exists = savedJobs.some((job) => job.id === updatedJob.id);
    if (exists) {
      return savedJobs.map((job) => (job.id === updatedJob.id ? { ...job, ...updatedJob } : job));
    }
    return [updatedJob, ...savedJobs];
  }

  return savedJobs.filter((job) => job.id !== updatedJob.id);
};

export function filterJobsByHealth(jobs, filterMode = 'all') {
  if (!Array.isArray(jobs)) return [];
  if (filterMode === 'healthy') {
    return jobs.filter((j) => (j.job_health?.role_health_score ?? 100) >= 70);
  }
  if (filterMode === 'caution') {
    return jobs.filter((j) => (j.job_health?.role_health_score ?? 100) < 70);
  }
  return jobs;
}


