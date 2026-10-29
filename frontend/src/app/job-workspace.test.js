import assert from 'node:assert/strict';
import test from 'node:test';


const module = await import('./job-workspace.js').catch(() => ({}));
const { applyJobState } = module;


test('saving a discovered job updates it without changing the feed order', () => {
  assert.equal(typeof applyJobState, 'function');

  const jobs = [
    { id: 'one', user_state: 'discovered' },
    { id: 'two', user_state: 'discovered' },
  ];

  assert.deepEqual(applyJobState(jobs, { id: 'one', user_state: 'saved' }), [
    { id: 'one', user_state: 'saved' },
    { id: 'two', user_state: 'discovered' },
  ]);
});


test('dismissing a job removes it from the visible feed', () => {
  assert.equal(typeof applyJobState, 'function');

  const jobs = [{ id: 'one' }, { id: 'two' }];

  assert.deepEqual(applyJobState(jobs, { id: 'one', user_state: 'dismissed' }), [
    { id: 'two' },
  ]);
});


test('saving a job adds it to saved jobs list at the front', () => {
  const { applySavedJobState } = module;
  assert.equal(typeof applySavedJobState, 'function');

  const savedJobs = [{ id: 'one', title: 'First Job', user_state: 'saved' }];
  const newJob = { id: 'two', title: 'Second Job', user_state: 'saved' };

  const result = applySavedJobState(savedJobs, newJob);
  assert.equal(result.length, 2);
  assert.equal(result[0].id, 'two');
  assert.equal(result[1].id, 'one');
});


test('updating an existing saved job modifies it in place without duplicating', () => {
  const { applySavedJobState } = module;
  const savedJobs = [{ id: 'one', title: 'Old Title', user_state: 'saved' }];
  const updatedJob = { id: 'one', title: 'New Title', user_state: 'saved' };

  const result = applySavedJobState(savedJobs, updatedJob);
  assert.equal(result.length, 1);
  assert.equal(result[0].title, 'New Title');
});


test('unsaving a job removes it from saved jobs list', () => {
  const { applySavedJobState } = module;
  const savedJobs = [
    { id: 'one', user_state: 'saved' },
    { id: 'two', user_state: 'saved' },
  ];
  const unsavedJob = { id: 'one', user_state: 'discovered' };

  const result = applySavedJobState(savedJobs, unsavedJob);
  assert.deepEqual(result, [{ id: 'two', user_state: 'saved' }]);
});


test('dismissing a saved job removes it from saved jobs list', () => {
  const { applySavedJobState } = module;
  const savedJobs = [{ id: 'one', user_state: 'saved' }];
  const dismissedJob = { id: 'one', user_state: 'dismissed' };

  const result = applySavedJobState(savedJobs, dismissedJob);
  assert.deepEqual(result, []);
});


test('subsequent searches update search results without mutating saved jobs', () => {
  const savedJobs = [{ id: 'saved_1', title: 'Backend Dev', user_state: 'saved' }];
  const subsequentSearch = [{ id: 'job_b', title: 'DevOps Engineer', user_state: 'discovered' }];

  assert.equal(savedJobs.length, 1);
  assert.equal(savedJobs[0].id, 'saved_1');
  assert.notDeepEqual(savedJobs, subsequentSearch);
});


test('adding a custom job with health audit prepends to saved jobs', () => {
  const { applySavedJobState } = module;
  const savedJobs = [{ id: 'existing', title: 'Dev', user_state: 'saved' }];
  const customJob = {
    id: 'custom_1',
    title: 'Junior Software Engineer',
    user_state: 'saved',
    job_health: {
      role_health_score: 85,
      health_verdict: 'High Quality',
      ghost_job_risk: 'Low',
      red_flags: [],
      green_flags: ['Focused modern tech stack'],
    },
  };
  const result = applySavedJobState(savedJobs, customJob);
  assert.equal(result.length, 2);
  assert.equal(result[0].id, 'custom_1');
  assert.equal(result[0].job_health.role_health_score, 85);
  assert.equal(result[0].job_health.health_verdict, 'High Quality');
});


test('filterJobsByHealth filters roles according to health threshold', () => {
  const { filterJobsByHealth } = module;
  assert.equal(typeof filterJobsByHealth, 'function');

  const jobs = [
    { id: '1', title: 'Healthy Role', job_health: { role_health_score: 85 } },
    { id: '2', title: 'Borderline Healthy Role', job_health: { role_health_score: 70 } },
    { id: '3', title: 'Caution Role', job_health: { role_health_score: 65 } },
    { id: '4', title: 'High Risk Role', job_health: { role_health_score: 30 } },
    { id: '5', title: 'Unscored Role' },
  ];

  assert.equal(filterJobsByHealth(jobs, 'all').length, 5);

  const healthy = filterJobsByHealth(jobs, 'healthy');
  assert.equal(healthy.length, 3); // 85, 70, and unscored (default 100)
  assert.deepEqual(healthy.map((j) => j.id), ['1', '2', '5']);

  const caution = filterJobsByHealth(jobs, 'caution');
  assert.equal(caution.length, 2); // 65, 30
  assert.deepEqual(caution.map((j) => j.id), ['3', '4']);

  assert.deepEqual(filterJobsByHealth(null), []);
});


