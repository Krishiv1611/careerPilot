export const applyJobState = (jobs, updatedJob) => {
  if (updatedJob.user_state === 'dismissed') {
    return jobs.filter((job) => job.id !== updatedJob.id);
  }

  return jobs.map((job) => (job.id === updatedJob.id ? { ...job, ...updatedJob } : job));
};
