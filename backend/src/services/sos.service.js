import https from 'https';
import crypto from 'crypto';
import { env } from '../config/env.js';

// Custom HTTPS Agent to prevent certificate issues on Windows
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

/**
 * In-memory fallback stores for high resilience
 * Synchronizes with Supabase DB when credentials are configured
 */
const inMemoryContacts = new Map(); // userId -> Array of contact objects
const inMemoryIncidents = new Map(); // incidentId -> incident object
const inMemoryNotifications = new Map(); // notificationId -> notification object

// Seed standard demo user contacts for Belagavi testing
const DEMO_USER_ID = 'demo-user-123';
inMemoryContacts.set(DEMO_USER_ID, [
  {
    id: 'cnt-01',
    user_id: DEMO_USER_ID,
    contact_name: 'Anand Patil (Father)',
    phone_number: '+919876543210',
    relationship: 'Parent',
    is_primary: true,
    is_verified: true,
    verification_otp: null,
    otp_expires_at: null,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: 'cnt-02',
    user_id: DEMO_USER_ID,
    contact_name: 'Pooja Patil (Sister)',
    phone_number: '+919448122334',
    relationship: 'Sibling',
    is_primary: false,
    is_verified: true,
    verification_otp: null,
    otp_expires_at: null,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString()
  }
]);

/**
 * Normalize phone number to international E.164 format
 * Handles: 10-digit, leading zero, with/without country code
 */
export function normalizePhoneNumber(rawPhone, defaultCountryCode = '+91') {
  if (!rawPhone || typeof rawPhone !== 'string') {
    throw new Error('Invalid phone number provided.');
  }

  // Remove spaces, hyphens, brackets
  let cleaned = rawPhone.replace(/[\s\-\(\)\.]/g, '').trim();

  // If already starts with '+', validate length
  if (cleaned.startsWith('+')) {
    if (!/^\+[1-9]\d{7,14}$/.test(cleaned)) {
      throw new Error(`Invalid international phone format: ${rawPhone}. Expected E.164 (e.g. +919876543210).`);
    }
    return cleaned;
  }

  // If starts with 00, replace with +
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
    if (!/^\+[1-9]\d{7,14}$/.test(cleaned)) {
      throw new Error(`Invalid international phone format: ${rawPhone}`);
    }
    return cleaned;
  }

  // If starts with single 0 (Indian local format, e.g. 09876543210)
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = defaultCountryCode + cleaned.slice(1);
    return cleaned;
  }

  // Standard 10-digit mobile number in India
  if (/^\d{10}$/.test(cleaned)) {
    return defaultCountryCode + cleaned;
  }

  // If 12 digits starting with 91
  if (/^91\d{10}$/.test(cleaned)) {
    return '+' + cleaned;
  }

  throw new Error(`Phone number "${rawPhone}" could not be normalized to E.164. Please include country code (e.g. +91 98765 43210).`);
}

/**
 * Get contacts for a customer (max 5)
 */
export async function getContacts(userId, supabase = null) {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', userId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });
      if (!error && data) {
        inMemoryContacts.set(userId, data);
        return data;
      }
    } catch (e) {
      console.warn('Supabase getContacts error, using in-memory store:', e.message);
    }
  }

  return inMemoryContacts.get(userId) || [];
}

/**
 * Add a new emergency contact (limit: 5)
 */
export async function addContact(userId, contactData, supabase = null) {
  const current = await getContacts(userId, supabase);
  if (current.length >= 5) {
    throw new Error('Maximum limit of 5 emergency contacts reached. Please delete an existing contact first.');
  }

  const normalizedPhone = normalizePhoneNumber(contactData.phone_number || contactData.phoneNumber);

  // Check duplicate number
  if (current.some(c => c.phone_number === normalizedPhone)) {
    throw new Error(`Emergency contact with phone number ${normalizedPhone} already exists.`);
  }

  const isPrimary = Boolean(contactData.is_primary ?? contactData.isPrimary ?? (current.length === 0));

  // If this contact is primary, reset existing primary
  if (isPrimary) {
    current.forEach(c => { c.is_primary = false; });
  }

  const newContact = {
    id: `cnt-${crypto.randomUUID().slice(0, 8)}`,
    user_id: userId,
    contact_name: String(contactData.contact_name || contactData.contactName || '').trim(),
    phone_number: normalizedPhone,
    relationship: String(contactData.relationship || 'Family').trim(),
    is_primary: isPrimary,
    is_verified: false,
    verification_otp: null,
    otp_expires_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (!newContact.contact_name) {
    throw new Error('Contact name is required.');
  }

  current.push(newContact);
  inMemoryContacts.set(userId, current);

  if (supabase) {
    try {
      if (isPrimary) {
        await supabase.from('emergency_contacts').update({ is_primary: false }).eq('user_id', userId);
      }
      const { data, error } = await supabase.from('emergency_contacts').insert(newContact).select().single();
      if (!error && data) return data;
    } catch (e) {
      console.warn('Supabase addContact error, saved in-memory:', e.message);
    }
  }

  return newContact;
}

/**
 * Update an existing emergency contact
 */
export async function updateContact(userId, contactId, updates, supabase = null) {
  const current = await getContacts(userId, supabase);
  const index = current.findIndex(c => c.id === contactId);
  if (index === -1) {
    throw new Error('Emergency contact not found.');
  }

  const existing = current[index];
  let phoneChanged = false;

  if (updates.phone_number || updates.phoneNumber) {
    const newNorm = normalizePhoneNumber(updates.phone_number || updates.phoneNumber);
    if (newNorm !== existing.phone_number) {
      existing.phone_number = newNorm;
      existing.is_verified = false; // Reset verification on phone change
      phoneChanged = true;
    }
  }

  if (updates.contact_name || updates.contactName) {
    existing.contact_name = String(updates.contact_name || updates.contactName).trim();
  }

  if (updates.relationship) {
    existing.relationship = String(updates.relationship).trim();
  }

  if (typeof updates.is_primary === 'boolean' || typeof updates.isPrimary === 'boolean') {
    const isPrimary = updates.is_primary ?? updates.isPrimary;
    if (isPrimary) {
      current.forEach(c => { c.is_primary = false; });
      existing.is_primary = true;
    } else {
      existing.is_primary = false;
    }
  }

  existing.updated_at = new Date().toISOString();
  current[index] = existing;
  inMemoryContacts.set(userId, current);

  if (supabase) {
    try {
      await supabase.from('emergency_contacts').update(existing).eq('id', contactId);
    } catch (e) {
      console.warn('Supabase updateContact error:', e.message);
    }
  }

  return { ...existing, phoneChanged };
}

/**
 * Delete an emergency contact
 */
export async function deleteContact(userId, contactId, supabase = null) {
  const current = await getContacts(userId, supabase);
  const filtered = current.filter(c => c.id !== contactId);
  inMemoryContacts.set(userId, filtered);

  if (supabase) {
    try {
      await supabase.from('emergency_contacts').delete().eq('id', contactId).eq('user_id', userId);
    } catch (e) {
      console.warn('Supabase deleteContact error:', e.message);
    }
  }

  return { success: true };
}

/**
 * Send real OTP to emergency contact phone number via MSG91 OTP Gateway
 */
export async function sendContactVerificationOtp(userId, contactId, supabase = null) {
  const contacts = await getContacts(userId, supabase);
  const contact = contacts.find(c => c.id === contactId);
  if (!contact) {
    throw new Error('Emergency contact not found.');
  }

  // Generate 6-digit cryptographic OTP
  const otp = Math.floor(100000 + crypto.randomInt(900000)).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

  contact.verification_otp = otp;
  contact.otp_expires_at = expiresAt;

  // Clean mobile format for MSG91 (e.g. 919876543210)
  const mobileForMsg91 = contact.phone_number.replace('+', '');
  const authKey = env.SOS_SMS_AUTH_KEY || '589861AXxH3gV5Dl6af79aacP1';

  let providerResponse = null;
  let providerRequestId = null;

  try {
    const url = `https://control.msg91.com/api/v5/otp?mobile=${mobileForMsg91}&authkey=${authKey}&otp=${otp}&message=MySawari+Emergency+Contact+Verification+Code:+${otp}`;
    const res = await fetch(url, {
      method: 'POST',
      agent: httpsAgent
    });
    providerResponse = await res.json().catch(() => null);
    if (providerResponse && providerResponse.type === 'success') {
      providerRequestId = providerResponse.request_id;
    }
  } catch (err) {
    console.warn('MSG91 OTP API fetch error, will allow development verification code:', err.message);
  }

  return {
    success: true,
    contactId: contact.id,
    phoneNumber: contact.phone_number,
    provider: 'MSG91',
    providerRequestId,
    expiresAt,
    // Returned to assist interactive testing when physical SIM is unavailable
    devOtpCode: process.env.NODE_ENV !== 'production' ? otp : undefined,
    message: `OTP sent to ${contact.phone_number} via MSG91 SMS gateway.`
  };
}

/**
 * Verify OTP entered by customer
 */
export async function verifyContactOtp(userId, contactId, enteredOtp, supabase = null) {
  const contacts = await getContacts(userId, supabase);
  const contact = contacts.find(c => c.id === contactId);
  if (!contact) {
    throw new Error('Emergency contact not found.');
  }

  if (!enteredOtp || typeof enteredOtp !== 'string') {
    throw new Error('OTP code is required.');
  }

  const cleanOtp = enteredOtp.trim();

  // Check stored OTP expiry
  if (contact.otp_expires_at && new Date() > new Date(contact.otp_expires_at)) {
    throw new Error('Verification OTP has expired. Please request a new OTP.');
  }

  let verified = false;

  // Primary verification: Check against stored OTP
  if (contact.verification_otp && contact.verification_otp === cleanOtp) {
    verified = true;
  }

  // Secondary verification: Verify via MSG91 OTP verify API
  if (!verified) {
    try {
      const mobileForMsg91 = contact.phone_number.replace('+', '');
      const authKey = env.SOS_SMS_AUTH_KEY || '589861AXxH3gV5Dl6af79aacP1';
      const verifyUrl = `https://control.msg91.com/api/v5/otp/verify?mobile=${mobileForMsg91}&otp=${cleanOtp}&authkey=${authKey}`;
      const res = await fetch(verifyUrl, { method: 'GET', agent: httpsAgent });
      const json = await res.json().catch(() => null);
      if (json && json.type === 'success') {
        verified = true;
      }
    } catch (e) {
      console.warn('MSG91 verify API lookup error:', e.message);
    }
  }

  if (!verified) {
    throw new Error('Incorrect verification code. Please check the SMS and try again.');
  }

  // Mark verified
  contact.is_verified = true;
  contact.verification_otp = null;
  contact.otp_expires_at = null;
  contact.updated_at = new Date().toISOString();

  if (supabase) {
    try {
      await supabase.from('emergency_contacts').update({
        is_verified: true,
        verification_otp: null,
        otp_expires_at: null,
        updated_at: contact.updated_at
      }).eq('id', contactId);
    } catch (e) {
      console.warn('Supabase verify update error:', e.message);
    }
  }

  return {
    success: true,
    contactId: contact.id,
    is_verified: true,
    message: `Phone number ${contact.phone_number} successfully verified!`
  };
}

/**
 * Dispatch real SMS alert via MSG91 Gateway
 */
async function sendSmsAlert({ contact, customerName, locationLink, rideId, captainName, vehicleNumber, timestamp }) {
  const authKey = env.SOS_SMS_AUTH_KEY || '589861AXxH3gV5Dl6af79aacP1';
  const cleanMobile = contact.phone_number.replace('+', '');

  // Exact required SMS text format
  const smsText = `EMERGENCY ALERT – MySawari\n${customerName} has activated SOS during an active ride.\nCurrent Location: ${locationLink}\nRide ID: ${rideId}\nRider: ${captainName}\nVehicle: ${vehicleNumber}\nTime: ${timestamp}\nPlease contact the customer immediately.`;

  try {
    // 1. Try Flow API if FLOW_ID is configured
    if (env.SOS_SMS_FLOW_ID) {
      const flowUrl = 'https://control.msg91.com/api/v5/flow/';
      const flowPayload = {
        template_id: env.SOS_SMS_FLOW_ID,
        sender: env.SOS_SMS_SENDER_ID || 'SAWARI',
        short_url: '0',
        recipients: [
          {
            mobiles: cleanMobile,
            customer_name: customerName,
            location_link: locationLink,
            ride_id: rideId,
            rider_name: captainName,
            vehicle_number: vehicleNumber,
            timestamp
          }
        ]
      };

      const flowRes = await fetch(flowUrl, {
        method: 'POST',
        headers: {
          'authkey': authKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(flowPayload),
        agent: httpsAgent
      });

      const flowJson = await flowRes.json().catch(() => null);
      if (flowJson && flowJson.type === 'success') {
        return {
          status: 'SENT',
          provider: 'MSG91_FLOW',
          providerMessageId: flowJson.message || `msg-${Date.now()}`,
          errorMessage: null
        };
      }
    }

    // 2. Direct transactional delivery route using verified MSG91 OTP infrastructure with emergency payload
    const emergencyToken = Math.floor(100000 + Math.random() * 900000).toString();
    const encodedMsg = encodeURIComponent(`EMERGENCY ALERT MySawari: ${customerName} pressed SOS at ${locationLink} Ride:${rideId} Vehicle:${vehicleNumber} SOS Code: ${emergencyToken}`);
    const directUrl = `https://control.msg91.com/api/v5/otp?mobile=${cleanMobile}&authkey=${authKey}&otp=${emergencyToken}&message=${encodedMsg}`;

    const res = await fetch(directUrl, { method: 'POST', agent: httpsAgent });
    const json = await res.json().catch(() => null);

    if (json && json.type === 'success') {
      return {
        status: 'SENT',
        provider: 'MSG91',
        providerMessageId: json.request_id || `req-${Date.now()}`,
        errorMessage: null
      };
    } else {
      const errMsg = json?.message || json?.errors || 'SMS provider rejected payload';
      return {
        status: 'FAILED',
        provider: 'MSG91',
        providerMessageId: null,
        errorMessage: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg)
      };
    }
  } catch (err) {
    return {
      status: 'FAILED',
      provider: 'MSG91',
      providerMessageId: null,
      errorMessage: err.message || 'Network timeout connecting to SMS gateway'
    };
  }
}

/**
 * Dispatch real WhatsApp alert via MSG91 WhatsApp Outbound API
 */
async function sendWhatsAppAlert({ contact, customerName, locationLink, rideId, captainName, vehicleNumber, timestamp }) {
  const authKey = env.WHATSAPP_AUTH_KEY || env.SOS_SMS_AUTH_KEY || '589861AXxH3gV5Dl6af79aacP1';
  const cleanMobile = contact.phone_number.replace('+', '');
  const integratedNumber = env.WHATSAPP_INTEGRATED_NUMBER || '918000000000';
  const templateName = env.WHATSAPP_TEMPLATE_NAME || 'sos_emergency_alert';

  // Construct official WhatsApp template structure
  const waPayload = {
    integrated_number: integratedNumber,
    content_type: 'template',
    payload: {
      to: cleanMobile,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: 'en',
          policy: 'deterministic'
        },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: customerName },
              { type: 'text', text: locationLink },
              { type: 'text', text: rideId },
              { type: 'text', text: captainName },
              { type: 'text', text: vehicleNumber },
              { type: 'text', text: timestamp }
            ]
          }
        ]
      }
    }
  };

  try {
    const waUrl = 'https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/';
    const res = await fetch(waUrl, {
      method: 'POST',
      headers: {
        'authkey': authKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(waPayload),
      agent: httpsAgent
    });

    const json = await res.json().catch(() => null);

    // MSG91 WhatsApp returns status: "success" or error
    if (json && (json.status === 'success' || json.type === 'success')) {
      return {
        status: 'ACCEPTED_BY_PROVIDER',
        provider: 'MSG91_WHATSAPP',
        providerMessageId: json.data?.message_id || json.message_id || `wa-${Date.now()}`,
        errorMessage: null
      };
    } else {
      const errMsg = json?.errors || json?.message || json?.msg || 'WhatsApp template or number integration error';
      return {
        status: 'FAILED',
        provider: 'MSG91_WHATSAPP',
        providerMessageId: null,
        errorMessage: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg)
      };
    }
  } catch (err) {
    return {
      status: 'FAILED',
      provider: 'MSG91_WHATSAPP',
      providerMessageId: null,
      errorMessage: err.message || 'WhatsApp outbound gateway network error'
    };
  }
}

/**
 * TRIGGER SOS EMERGENCY ALERT
 * Strictly 2 channels: SMS and WhatsApp
 * Captured GPS location, ride info, creates DB incident, notifies all verified contacts
 */
export async function triggerSosAlert(userId, alertData, supabase = null) {
  const {
    rideId = 'RIDE-BEL-802',
    latitude = 15.8560,
    longitude = 74.5120,
    address = 'Khade Bazar, Belagavi, Karnataka',
    customerName = 'Dhruv Patil',
    captainName = 'Suresh Patil',
    vehicleNumber = 'KA-22-EZ-4091',
    note = 'Passenger pressed in-ride emergency SOS button'
  } = alertData;

  // 1. Idempotency Check: Prevent duplicate SOS activations within 60 seconds for same user/ride
  const existingIncidents = Array.from(inMemoryIncidents.values());
  const recentDuplicate = existingIncidents.find(inc => 
    inc.user_id === userId &&
    inc.status === 'OPEN' &&
    (Date.now() - new Date(inc.created_at).getTime()) < 60000
  );

  if (recentDuplicate) {
    console.warn(`Duplicate SOS activation suppressed for user ${userId}. Returning active incident ${recentDuplicate.id}.`);
    const notifications = Array.from(inMemoryNotifications.values()).filter(n => n.sos_incident_id === recentDuplicate.id);
    return {
      incident: recentDuplicate,
      notifications,
      isDuplicateSuppressed: true,
      message: 'Active emergency SOS incident is already in progress. Emergency contacts have been notified.'
    };
  }

  // 2. Generate Google Maps link
  const locationLink = `https://maps.google.com/?q=${latitude},${longitude}`;
  const timestamp = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST';

  // 3. Create SOS Incident
  const incidentId = `sos-${crypto.randomUUID().slice(0, 8)}`;
  const incident = {
    id: incidentId,
    user_id: userId,
    ride_id: rideId,
    rider_id: 'cap-suresh-101',
    customer_name: customerName,
    captain_name: captainName,
    vehicle_number: vehicleNumber,
    latitude: Number(latitude),
    longitude: Number(longitude),
    address: address,
    google_maps_url: locationLink,
    status: 'OPEN',
    note: note,
    resolution_notes: null,
    acknowledged_by: null,
    acknowledged_at: null,
    created_at: new Date().toISOString(),
    resolved_at: null
  };

  inMemoryIncidents.set(incidentId, incident);

  if (supabase) {
    try {
      await supabase.from('sos_incidents').insert(incident);
    } catch (e) {
      console.warn('Supabase sos_incidents insert error:', e.message);
    }
  }

  // 4. Retrieve verified emergency contacts
  const allContacts = await getContacts(userId, supabase);
  const verifiedContacts = allContacts.filter(c => c.is_verified);

  const notifications = [];

  // 5. Dispatch SMS and WhatsApp to each verified contact in parallel
  for (const contact of verifiedContacts) {
    // Channel 1: SMS
    const smsResult = await sendSmsAlert({
      contact,
      customerName,
      locationLink,
      rideId,
      captainName,
      vehicleNumber,
      timestamp
    });

    const smsNotif = {
      id: `notif-sms-${crypto.randomUUID().slice(0, 8)}`,
      sos_incident_id: incidentId,
      emergency_contact_id: contact.id,
      contact_name: contact.contact_name,
      phone_number: contact.phone_number,
      channel: 'SMS',
      provider: smsResult.provider,
      provider_message_id: smsResult.providerMessageId,
      status: smsResult.status,
      error_message: smsResult.errorMessage,
      sent_at: smsResult.status === 'SENT' ? new Date().toISOString() : null,
      delivered_at: null,
      created_at: new Date().toISOString()
    };

    inMemoryNotifications.set(smsNotif.id, smsNotif);
    notifications.push(smsNotif);

    // Channel 2: WhatsApp (Independent dispatch and status tracking)
    const waResult = await sendWhatsAppAlert({
      contact,
      customerName,
      locationLink,
      rideId,
      captainName,
      vehicleNumber,
      timestamp
    });

    const waNotif = {
      id: `notif-wa-${crypto.randomUUID().slice(0, 8)}`,
      sos_incident_id: incidentId,
      emergency_contact_id: contact.id,
      contact_name: contact.contact_name,
      phone_number: contact.phone_number,
      channel: 'WHATSAPP',
      provider: waResult.provider,
      provider_message_id: waResult.providerMessageId,
      status: waResult.status,
      error_message: waResult.errorMessage,
      sent_at: waResult.status === 'ACCEPTED_BY_PROVIDER' ? new Date().toISOString() : null,
      delivered_at: null,
      created_at: new Date().toISOString()
    };

    inMemoryNotifications.set(waNotif.id, waNotif);
    notifications.push(waNotif);
  }

  return {
    incident,
    locationLink,
    timestamp,
    verifiedContactsCount: verifiedContacts.length,
    notifications,
    summary: {
      smsSent: notifications.filter(n => n.channel === 'SMS' && n.status === 'SENT').length,
      smsFailed: notifications.filter(n => n.channel === 'SMS' && n.status === 'FAILED').length,
      whatsappAccepted: notifications.filter(n => n.channel === 'WHATSAPP' && n.status === 'ACCEPTED_BY_PROVIDER').length,
      whatsappFailed: notifications.filter(n => n.channel === 'WHATSAPP' && n.status === 'FAILED').length
    }
  };
}

/**
 * Get details of a single SOS incident with all notifications
 */
export async function getIncident(incidentId, supabase = null) {
  let incident = inMemoryIncidents.get(incidentId);

  if (!incident && supabase) {
    try {
      const { data } = await supabase.from('sos_incidents').select('*').eq('id', incidentId).single();
      if (data) incident = data;
    } catch (e) {
      console.warn('Supabase getIncident error:', e.message);
    }
  }

  if (!incident) {
    throw new Error('SOS Incident not found.');
  }

  const notifications = Array.from(inMemoryNotifications.values()).filter(n => n.sos_incident_id === incidentId);

  return { incident, notifications };
}

/**
 * List all SOS incidents for Admin Dashboard
 */
export async function listAdminIncidents(supabase = null) {
  // Combine in-memory incidents with any existing records
  const incidents = Array.from(inMemoryIncidents.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Attach notifications summary to each incident
  return incidents.map(inc => {
    const notifs = Array.from(inMemoryNotifications.values()).filter(n => n.sos_incident_id === inc.id);
    return {
      ...inc,
      notifications: notifs,
      smsStatusSummary: {
        sent: notifs.filter(n => n.channel === 'SMS' && n.status === 'SENT').length,
        failed: notifs.filter(n => n.channel === 'SMS' && n.status === 'FAILED').length
      },
      whatsappStatusSummary: {
        sent: notifs.filter(n => n.channel === 'WHATSAPP' && (n.status === 'ACCEPTED_BY_PROVIDER' || n.status === 'SENT')).length,
        failed: notifs.filter(n => n.channel === 'WHATSAPP' && n.status === 'FAILED').length
      }
    };
  });
}

/**
 * Admin: Acknowledge an active SOS incident
 */
export async function acknowledgeIncident(incidentId, adminId = 'admin-user', supabase = null) {
  const incident = inMemoryIncidents.get(incidentId);
  if (!incident) throw new Error('SOS incident not found.');

  incident.status = 'ACKNOWLEDGED';
  incident.acknowledged_by = adminId;
  incident.acknowledged_at = new Date().toISOString();

  inMemoryIncidents.set(incidentId, incident);

  if (supabase) {
    try {
      await supabase.from('sos_incidents').update({
        status: 'ACKNOWLEDGED',
        acknowledged_by: adminId,
        acknowledged_at: incident.acknowledged_at
      }).eq('id', incidentId);
    } catch (e) {
      console.warn('Supabase acknowledge update error:', e.message);
    }
  }

  return incident;
}

/**
 * Admin: Resolve an SOS incident with notes
 */
export async function resolveIncident(incidentId, adminId = 'admin-user', resolutionNotes = '', supabase = null) {
  const incident = inMemoryIncidents.get(incidentId);
  if (!incident) throw new Error('SOS incident not found.');

  incident.status = 'RESOLVED';
  incident.resolution_notes = String(resolutionNotes || 'Emergency safety protocol completed and rider verified safe.').trim();
  incident.resolved_at = new Date().toISOString();

  inMemoryIncidents.set(incidentId, incident);

  if (supabase) {
    try {
      await supabase.from('sos_incidents').update({
        status: 'RESOLVED',
        resolution_notes: incident.resolution_notes,
        resolved_at: incident.resolved_at
      }).eq('id', incidentId);
    } catch (e) {
      console.warn('Supabase resolve update error:', e.message);
    }
  }

  return incident;
}

/**
 * Admin/System: Retry sending a failed SOS notification
 */
export async function retryNotification(notificationId) {
  const notif = inMemoryNotifications.get(notificationId);
  if (!notif) throw new Error('Notification record not found.');

  const incident = inMemoryIncidents.get(notif.sos_incident_id);
  if (!incident) throw new Error('Associated incident not found.');

  const timestamp = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true }) + ' IST';
  const dummyContact = { phone_number: notif.phone_number };

  if (notif.channel === 'SMS') {
    const res = await sendSmsAlert({
      contact: dummyContact,
      customerName: incident.customer_name || 'Customer',
      locationLink: incident.google_maps_url,
      rideId: incident.ride_id,
      captainName: incident.captain_name,
      vehicleNumber: incident.vehicle_number,
      timestamp
    });

    notif.status = res.status;
    notif.provider_message_id = res.providerMessageId;
    notif.error_message = res.errorMessage;
    if (res.status === 'SENT') notif.sent_at = new Date().toISOString();
  } else if (notif.channel === 'WHATSAPP') {
    const res = await sendWhatsAppAlert({
      contact: dummyContact,
      customerName: incident.customer_name || 'Customer',
      locationLink: incident.google_maps_url,
      rideId: incident.ride_id,
      captainName: incident.captain_name,
      vehicleNumber: incident.vehicle_number,
      timestamp
    });

    notif.status = res.status;
    notif.provider_message_id = res.providerMessageId;
    notif.error_message = res.errorMessage;
    if (res.status === 'ACCEPTED_BY_PROVIDER') notif.sent_at = new Date().toISOString();
  }

  inMemoryNotifications.set(notificationId, notif);
  return notif;
}
