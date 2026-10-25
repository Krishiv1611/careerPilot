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

