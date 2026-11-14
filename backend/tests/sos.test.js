import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizePhoneNumber,
  getContacts,
  addContact,
  updateContact,
  deleteContact,
  verifyContactOtp,
  triggerSosAlert
} from '../src/services/sos.service.js';

test('normalizePhoneNumber formats standard 10-digit Indian mobile number to E.164', () => {
  const normalized = normalizePhoneNumber('9876543210');
  assert.equal(normalized, '+919876543210');
});

test('normalizePhoneNumber formats number with leading zero to E.164', () => {
  const normalized = normalizePhoneNumber('09876543210');
  assert.equal(normalized, '+919876543210');
});

test('normalizePhoneNumber retains valid +91 international format and removes whitespace/hyphens', () => {
  const normalized = normalizePhoneNumber('+91 94481-23456');
  assert.equal(normalized, '+919448123456');
});

test('normalizePhoneNumber handles 00 international prefix', () => {
  const normalized = normalizePhoneNumber('00919876543210');
  assert.equal(normalized, '+919876543210');
});

test('normalizePhoneNumber rejects invalid or too short numbers', () => {
  assert.throws(() => normalizePhoneNumber('12345'), /could not be normalized to E\.164/i);
  assert.throws(() => normalizePhoneNumber(''), /invalid phone number/i);
});

test('emergency contacts enforces max limit of 5 contacts per user', async () => {
  const testUserId = `test-user-${Date.now()}`;
  
  // Add 5 contacts
  for (let i = 1; i <= 5; i++) {
    await addContact(testUserId, {
      contact_name: `Contact ${i}`,
      phone_number: `+91987650000${i}`,
      relationship: 'Friend'
    });
  }

  const contacts = await getContacts(testUserId);
  assert.equal(contacts.length, 5);

  // Attempt 6th contact must fail
  await assert.rejects(
    async () => {
      await addContact(testUserId, {
        contact_name: 'Contact 6',
        phone_number: '+919876500006',
        relationship: 'Sibling'
      });
    },
    /Maximum limit of 5 emergency contacts reached/i
  );
});

test('addContact rejects duplicate phone number for same user', async () => {
  const testUserId = `test-user-dup-${Date.now()}`;
  await addContact(testUserId, {
    contact_name: 'Original Contact',
    phone_number: '9123456789',
    relationship: 'Family'
  });

  await assert.rejects(
    async () => {
      await addContact(testUserId, {
        contact_name: 'Duplicate Number',
        phone_number: '+91 91234 56789',
        relationship: 'Friend'
      });
    },
    /already exists/i
  );
});

test('primary contact switching preserves single primary contact constraint', async () => {
  const testUserId = `test-user-pri-${Date.now()}`;
  const c1 = await addContact(testUserId, {
    contact_name: 'First Contact',
    phone_number: '9800000001',
    is_primary: true
  });
  const c2 = await addContact(testUserId, {
    contact_name: 'Second Contact',
    phone_number: '9800000002',
    is_primary: false
  });

  let contacts = await getContacts(testUserId);
  assert.equal(contacts.find(c => c.id === c1.id).is_primary, true);
  assert.equal(contacts.find(c => c.id === c2.id).is_primary, false);

  // Switch primary to c2
  await updateContact(testUserId, c2.id, { is_primary: true });
  contacts = await getContacts(testUserId);
  assert.equal(contacts.find(c => c.id === c2.id).is_primary, true);
  assert.equal(contacts.find(c => c.id === c1.id).is_primary, false);
});

test('verifyContactOtp verifies matching code and rejects incorrect code', async () => {
  const testUserId = `test-user-otp-${Date.now()}`;
  const contact = await addContact(testUserId, {
    contact_name: 'OTP Contact',
    phone_number: '9700000001',
    relationship: 'Colleague'
  });

  // Inject a 6-digit test OTP directly
  contact.verification_otp = '654321';
  contact.otp_expires_at = new Date(Date.now() + 600000).toISOString();

  // Test incorrect code
  await assert.rejects(
    async () => {
      await verifyContactOtp(testUserId, contact.id, '111111');
    },
    /Incorrect verification code/i
  );

  // Test correct code
  const result = await verifyContactOtp(testUserId, contact.id, '654321');
  assert.equal(result.is_verified, true);
  assert.equal(contact.is_verified, true);
  assert.equal(contact.verification_otp, null);
});

test('triggerSosAlert suppresses duplicate activations within 60-second window', async () => {
  const testUserId = `test-user-sos-${Date.now()}`;
  
  // First activation
  const res1 = await triggerSosAlert(testUserId, {
    rideId: 'RIDE-DUP-01',
    latitude: 15.8500,
    longitude: 74.5000,
    customerName: 'Audit Passenger'
  });
  assert.equal(res1.incident.status, 'OPEN');
  assert.equal(res1.isDuplicateSuppressed, undefined);

  // Immediate second activation must be caught by duplicate prevention
  const res2 = await triggerSosAlert(testUserId, {
    rideId: 'RIDE-DUP-01',
    latitude: 15.8500,
    longitude: 74.5000,
    customerName: 'Audit Passenger'
  });
  assert.equal(res2.isDuplicateSuppressed, true);
  assert.equal(res2.incident.id, res1.incident.id);
});
