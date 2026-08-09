import assert from 'node:assert/strict';
import test from 'node:test';

import { apiErrorMessage } from './api-errors.js';


test('uses a normal FastAPI string detail', () => {
  assert.equal(
    apiErrorMessage({ response: { data: { detail: 'Incorrect email or password' } } }),
    'Incorrect email or password',
  );
});


test('turns FastAPI validation details into readable text', () => {
  assert.equal(
    apiErrorMessage({
      response: {
        data: {
          detail: [{ msg: 'String should have at least 10 characters' }],
        },
      },
    }),
    'String should have at least 10 characters',
  );
});
