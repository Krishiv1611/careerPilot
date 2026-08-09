import assert from 'node:assert/strict';
import test from 'node:test';

import { buildEvidenceApprovalPayload, initialEvidenceDraft } from './github-evidence.js';


test('a GitHub project starts unconfirmed with only retrieved matching skills selected', () => {
  assert.deepEqual(
    initialEvidenceDraft({ matching_skills: ['FastAPI', 'PostgreSQL'] }),
    {
      selectedSkills: ['FastAPI', 'PostgreSQL'],
      contribution: '',
      wording: '',
      outcome: '',
      confirmed: false,
    },
  );
});


test('approval payload trims student-confirmed evidence', () => {
  assert.deepEqual(
    buildEvidenceApprovalPayload({
      selectedSkills: ['FastAPI'],
      contribution: '  I built the API routes. ',
      wording: ' Built FastAPI routes for the campus service. ',
      outcome: '  Used in our final demo. ',
      confirmed: true,
    }),
    {
      selected_skills: ['FastAPI'],
      contribution: 'I built the API routes.',
      wording: 'Built FastAPI routes for the campus service.',
      outcome: 'Used in our final demo.',
      confirmed: true,
    },
  );
});
