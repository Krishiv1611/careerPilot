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
