import test from 'node:test';
import assert from 'node:assert/strict';
import { updateProfileSchema } from '../src/validators/profile.schema.js';

test('profile update accepts a valid name', () => {
  const result = updateProfileSchema.safeParse({ fullName: 'Shreya Raykar' });
  assert.equal(result.success, true);
});

test('profile update rejects unknown role field', () => {
  const result = updateProfileSchema.safeParse({ role: 'admin' });
  assert.equal(result.success, false);
});

test('profile update rejects empty object', () => {
  const result = updateProfileSchema.safeParse({});
  assert.equal(result.success, false);
});

test('profile update rejects an invalid avatar URL', () => {
  const result = updateProfileSchema.safeParse({ avatarUrl: 'not-a-url' });
  assert.equal(result.success, false);
});
