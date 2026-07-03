import {
  buildResetLink,
  generateResetToken,
  getResetTokenExpiry,
  hashResetToken,
} from '../src/lib/passwordReset';

describe('Password reset helpers', () => {
  it('generates a token and matching hash', () => {
    const { token, tokenHash } = generateResetToken();
    expect(token).toHaveLength(64);
    expect(tokenHash).toBe(hashResetToken(token));
  });

  it('produces deterministic hashes for the same token', () => {
    const token = 'abc123';
    expect(hashResetToken(token)).toBe(hashResetToken(token));
  });

  it('builds a frontend reset link with encoded token', () => {
    const link = buildResetLink('token/with+special');
    expect(link).toContain('http://localhost:5173/redefinir-senha?token=');
    expect(link).toContain(encodeURIComponent('token/with+special'));
  });

  it('sets expiry in the future', () => {
    const before = Date.now();
    const expiry = getResetTokenExpiry();
    expect(expiry.getTime()).toBeGreaterThan(before);
  });
});
