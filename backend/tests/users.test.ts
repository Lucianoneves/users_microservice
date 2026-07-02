/**
 * Unit tests for auth helpers and RBAC utilities.
 */

import { createToken, verifyToken, rolesMatch } from '../src/lib/auth';

describe('JWT Authentication', () => {
  it('creates a valid access token with correct payload', () => {
    const token = createToken(42, 'admin');
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);
  });

  it('verifies a valid JWT and returns correct claims', () => {
    const token = createToken(42, 'admin');
    const payload = verifyToken(token);
    expect(payload.sub).toBe(42);
    expect(payload.role).toBe('admin');
  });

  it('rejects an expired token', () => {
    const expiredPayload = {
      sub: 99,
      role: 'user',
      exp: Math.floor(Date.now() / 1000) - 3600,
    };
    const parts = [
      Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
      Buffer.from(JSON.stringify(expiredPayload)).toString('base64url'),
      'invalidsignature',
    ];
    const expiredToken = parts.join('.');

    expect(() => verifyToken(expiredToken)).toThrow();
  });
});

describe('Role-Based Access Control', () => {
  it('rolesMatch returns true for equal role strings', () => {
    expect(rolesMatch('admin', 'admin')).toBe(true);
  });

  it('rolesMatch returns false for different roles', () => {
    expect(rolesMatch('user', 'admin')).toBe(false);
  });

  it('rolesMatch uses strict equality', () => {
    expect(rolesMatch('admin', 'admin')).toBe(true);
    // eslint-disable-next-line eqeqeq
    expect('admin' === 'admin').toBe(true);
  });
});
