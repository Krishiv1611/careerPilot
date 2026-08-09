import assert from 'node:assert/strict';
import test from 'node:test';


const module = await import('./career-track-suggestions.js').catch(() => ({}));
const { mergeTargetRole } = module;


test('career suggestion is added without losing existing preferences', () => {
  assert.equal(typeof mergeTargetRole, 'function');

  const profile = {
    target_roles: ['Backend Developer'],
    preferred_locations: ['Bengaluru', 'Remote'],
    employment_types: ['full-time'],
    skills: ['python'],
  };

  const result = mergeTargetRole(profile, 'Python Developer');

  assert.deepEqual(result, {
    target_roles: ['Backend Developer', 'Python Developer'],
    preferred_locations: ['Bengaluru', 'Remote'],
    employment_types: ['full-time'],
  });
  assert.deepEqual(profile.target_roles, ['Backend Developer']);
});


test('career suggestion does not duplicate a target role with different casing', () => {
  assert.equal(typeof mergeTargetRole, 'function');

  const result = mergeTargetRole({
    target_roles: ['Python Developer'],
    preferred_locations: [],
    employment_types: [],
  }, 'python developer');

  assert.deepEqual(result.target_roles, ['Python Developer']);
});
