import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emailRecordName,funnelDns} from '../scripts/email-dns.mjs';

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

test('Pages deployment preserves only the approved receiving MX alongside its flattened CNAME',()=>{
  const cname={type:'CNAME',content:'pixelkovia-funnel.pages.dev',proxied:true},mx={type:'MX',content:'receive-euw1.forge.rmta.net',priority:10};
  assert.equal(funnelDns([mx,cname],cname.content,mx.content),cname);
  for(const records of [[cname,{...mx,content:'other.example.com'}],[{...cname,proxied:false},mx],[{...cname,content:'other.pages.dev'},mx],[cname,mx,{type:'A',content:'192.0.2.1'}],[cname,cname]])assert.throws(()=>funnelDns(records,cname.content,mx.content),/Conflicting/);
});
