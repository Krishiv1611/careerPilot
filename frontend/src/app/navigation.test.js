import assert from 'node:assert/strict';
import test from 'node:test';

import { primaryNavigation } from './navigation.js';


test('student navigation exposes only the approved product destinations', () => {
  assert.deepEqual(
    primaryNavigation.map(({ label, path }) => ({ label, path })),
    [
      { label: 'Today', path: '/dashboard' },
      { label: 'Find Jobs', path: '/jobs' },
      { label: 'Resume & Profile', path: '/profile' },
      { label: 'Applications', path: '/applications' },
      { label: 'Growth', path: '/growth' },
    ],
  );
});

test('student navigation does not expose rejected prototype areas', () => {
  const labels = primaryNavigation.map(({ label }) => label.toLowerCase()).join(' ');
  const paths = primaryNavigation.map(({ path }) => path.toLowerCase()).join(' ');

  for (const marker of ['interview', 'add job', 'analyze jd', 'api key', 'careerpilot']) {
    assert.equal(labels.includes(marker), false, `Unexpected navigation label: ${marker}`);
    assert.equal(paths.includes(marker.replaceAll(' ', '-')), false, `Unexpected navigation path: ${marker}`);
  }
});
