import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emailRecordName} from '../scripts/email-dns.mjs';

const host = 'pixelkovia.rodulab.com';
const zone = 'rodulab.com';

test('Resend subdomain records are relative to the Cloudflare zone', () => {
  for (const prefix of ['send', 'rsend', 'resend._domainkey']) {
    assert.equal(emailRecordName(prefix + '.pixelkovia', host, zone), prefix + '.' + host);
    assert.equal(emailRecordName(prefix + '.' + host, host, zone), prefix + '.' + host);
  }
  assert.equal(emailRecordName(host + '.', host, zone), host);
});

test('email setup cannot change the parent domain or another application', () => {
  for (const name of [zone, 'other.rodulab.com', 'send', 'resend._domainkey']) {
    assert.throws(() => emailRecordName(name, host, zone), /outside Pixelkovia/);
  }
});
