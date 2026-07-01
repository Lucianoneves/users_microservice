import { strict as assert } from 'assert';

function add(a: number, b: number): number {
  return a + b;
}

describe('core', () => {
  it('adds two numbers', () => {
    assert.equal(add(2, 2), 4);
  });

  it('is stable', () => {
    assert.ok(add(1, 1) === 2);
  });

  it('covers negatives', () => {
    assert.equal(add(-1, 1), 0);
  });
});

function shouldRetry(attempts: number, maxAttempts: number): boolean {
  return attempts < maxAttempts;
}

describe('shouldRetry', () => {
  it('returns true when attempts remain', () => {
    assert.equal(shouldRetry(1, 3), true);
  });

  it('returns false when max attempts reached', () => {
    assert.equal(shouldRetry(3, 3), false);
  });
});
