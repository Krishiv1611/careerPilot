import test from 'node:test';
import assert from 'node:assert/strict';

import {
  APPLICATION_STATUSES,
  ALLOWED_NEXT_STATUSES,
  groupApplicationsByStatus,
  generateClientOutreachNote,
} from './application-pipeline.js';

test('pipeline statuses include standard recruiting stages', () => {
  assert.ok(APPLICATION_STATUSES.includes('Saved'));
  assert.ok(APPLICATION_STATUSES.includes('Preparing'));
  assert.ok(APPLICATION_STATUSES.includes('Applied'));
  assert.ok(APPLICATION_STATUSES.includes('Interview'));
  assert.ok(APPLICATION_STATUSES.includes('Offer'));
  assert.ok(APPLICATION_STATUSES.includes('Rejected'));
});

test('state machine allows direct transition from Saved to Applied', () => {
  const allowedFromSaved = ALLOWED_NEXT_STATUSES.Saved;
  assert.ok(allowedFromSaved.includes('Applied'));
});

test('state machine allows reopening Rejected and Withdrawn applications', () => {
  assert.ok(ALLOWED_NEXT_STATUSES.Rejected.includes('Applied'));
  assert.ok(ALLOWED_NEXT_STATUSES.Rejected.includes('Preparing'));
  assert.ok(ALLOWED_NEXT_STATUSES.Withdrawn.includes('Saved'));
});

test('groupApplicationsByStatus partitions applications accurately', () => {
  const apps = [
    { id: '1', status: 'Saved' },
    { id: '2', status: 'Applied' },
    { id: '3', status: 'Applied' },
    { id: '4', status: 'Interview' },
  ];
  const grouped = groupApplicationsByStatus(apps);
  assert.equal(grouped.Saved.length, 1);
  assert.equal(grouped.Applied.length, 2);
  assert.equal(grouped.Interview.length, 1);
  assert.equal(grouped.Offer.length, 0);
});

test('generateClientOutreachNote stays strictly under 300 characters', () => {
  const note = generateClientOutreachNote({
    jobTitle: 'Senior Distributed Systems Infrastructure Platform Lead Engineer',
    company: 'Enterprise Financial Technology Solutions Global Corporation',
    keySkill: 'Distributed Systems & High Frequency Kubernetes Engine',
    recruiterName: 'Alexander Montgomery-Smith',
  });
  assert.ok(note.length <= 300, `Length was ${note.length}, expected <= 300`);
  assert.ok(note.includes('Alexander Montgomery-Smith'));
});

test('generateClientOutreachNote handles default parameters strictly within 300 characters', () => {
  const note = generateClientOutreachNote({});
  assert.ok(note.length <= 300);
  assert.ok(note.length > 20);
});

