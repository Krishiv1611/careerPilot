import assert from 'node:assert/strict';
import test from 'node:test';


const module = await import('./resume-proposals.js').catch(() => ({}));
const { buildReviewPayload, reviewProgress } = module;


test('review payload contains one explicit decision for every proposed change', () => {
  assert.equal(typeof buildReviewPayload, 'function');

  const changes = [{ id: 'change-1' }, { id: 'change-2' }];
  const decisions = { 'change-1': 'accepted', 'change-2': 'rejected' };

  assert.deepEqual(buildReviewPayload(changes, decisions), {
    decisions: [
      { change_id: 'change-1', status: 'accepted' },
      { change_id: 'change-2', status: 'rejected' },
    ],
  });
});


test('review progress counts only accepted and rejected decisions', () => {
  assert.equal(typeof reviewProgress, 'function');

  assert.deepEqual(reviewProgress(
    [{ id: 'one' }, { id: 'two' }, { id: 'three' }],
    { one: 'accepted', two: 'pending', three: 'rejected' },
  ), {
    reviewed: 2,
    total: 3,
    complete: false,
  });
});
