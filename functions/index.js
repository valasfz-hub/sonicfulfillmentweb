/**
 * Quote requests from the website.
 *
 * The contact form posts JSON to /api/quote (see the rewrite in firebase.json).
 * Each request is saved to the Firestore collection "leads", then two emails go
 * out through Resend: the request to Sonic Fulfillment, and a thank-you to the
 * customer.
 *
 * Secret needed:  firebase functions:secrets:set RESEND_API_KEY
 */
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

initializeApp();

const RESEND_API_KEY = defineSecret('RESEND_API_KEY');

// The "from" address must be on a domain verified in Resend.
const FROM = 'Sonic Fulfillment <info@sonicfulfillment.com>';
const QUOTES_INBOX = 'info@sonicfulfillment.com';
const PHONE = '(949) 912-2931';
const ADDRESS = '3731 W Warner Ave, Santa Ana, CA 92704';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value, max) {
  return String(value == null ? '' : value).replace(/[\r\n]+/g, ' ').trim().slice(0, max);
}

/** Returns { lead } for a valid request, or { error } describing what's wrong. */
function parseLead(body) {
  const lead = {
    name: clean(body.name, 120),
    email: clean(body.email, 200).toLowerCase(),
    website: clean(body.website, 200),
    volume: clean(body.volume, 60),
    skus: clean(body.skus, 60),
  };
  if (!lead.name) return { error: 'Enter your name.' };
  if (!EMAIL_RE.test(lead.email)) return { error: 'Enter a valid email.' };
  return { lead };
}

function leadDetails(lead) {
  return [
    `Name: ${lead.name}`,
    `Email: ${lead.email}`,
    `Store website: ${lead.website || '(not given)'}`,
    `Orders per month: ${lead.volume}`,
    `Number of SKUs: ${lead.skus}`,
  ].join('\n');
}

async function sendEmail(apiKey, message) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

exports.quote = onRequest(
  { region: 'us-central1', secrets: [RESEND_API_KEY], maxInstances: 5, memory: '256MiB' },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ ok: false, error: 'Use POST.' });
      return;
    }
    const body = req.body && typeof req.body === 'object' ? req.body : {};

    // Hidden field that people never fill in. Bots do, so pretend it worked.
    if (body.company_url) {
      res.json({ ok: true });
      return;
    }

    const { lead, error } = parseLead(body);
    if (error) {
      res.status(400).json({ ok: false, error });
      return;
    }

    // Save first: once the lead is stored, a failed email can't lose it.
    const doc = await getFirestore().collection('leads').add({
      ...lead,
      source: 'website-quote-form',
      status: 'new',
      createdAt: FieldValue.serverTimestamp(),
    });

    const details = leadDetails(lead);
    const apiKey = RESEND_API_KEY.value();
    const [notify, confirm] = await Promise.allSettled([
      sendEmail(apiKey, {
        from: FROM,
        to: [QUOTES_INBOX],
        reply_to: lead.email,
        subject: `Quote request from ${lead.name}`,
        text: `${details}\n\nSaved in Firebase as lead ${doc.id}.\n`,
      }),
      sendEmail(apiKey, {
        from: FROM,
        to: [lead.email],
        reply_to: QUOTES_INBOX,
        subject: 'Thank you for contacting Sonic Fulfillment',
        text:
          `Hi ${lead.name},\n\n` +
          'Thank you for contacting Sonic Fulfillment. We have received your details and are working on your quote. ' +
          'We will get back to you by email as soon as it is ready.\n\n' +
          `Here is what you sent us:\n\n${details}\n\n` +
          `If you would like to add anything, reply to this email or call us at ${PHONE}.\n\n` +
          `Sonic Fulfillment\n${ADDRESS}\n${PHONE} | ${QUOTES_INBOX}\n`,
      }),
    ]);

    const emails = {
      notifySent: notify.status === 'fulfilled',
      confirmationSent: confirm.status === 'fulfilled',
    };
    for (const result of [notify, confirm]) {
      if (result.status === 'rejected') logger.error('Quote email failed', { lead: doc.id, reason: String(result.reason) });
    }
    await doc.update({ emails });

    res.json({ ok: true });
  }
);

// Exported for tests.
exports._parseLead = parseLead;
exports._leadDetails = leadDetails;
