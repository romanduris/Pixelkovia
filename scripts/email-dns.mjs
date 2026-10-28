// Resend returns names relative to the DNS zone (send.pixelkovia), or
// fully qualified names. Cloudflare's API accepts the fully qualified form.
export function emailRecordName(recordName, host, zoneName) {
  const raw = recordName.toLowerCase().replace(/\.$/, '');
  const name = raw === zoneName || raw.endsWith('.' + zoneName)
    ? raw
    : raw + '.' + zoneName;
  if (name !== host && !name.endsWith('.' + host)) {
    throw Error('Unexpected email DNS record outside Pixelkovia.');
  }
  return name;
}

// A flattened Pages CNAME may coexist with this exact receiving MX. Never
// replace unrelated mail records or accept another web origin during deploy.
export function funnelDns(records,target,mx){
  const cnames=records.filter(r=>r.type==='CNAME');
  const receiving=records.filter(r=>r.type==='MX'&&r.content.replace(/\.$/,'')===mx&&r.priority===10);
  if(cnames.length>1||receiving.length>1||records.length!==cnames.length+receiving.length||cnames.some(r=>r.content.replace(/\.$/,'')!==target.replace(/\.$/,''))||(receiving.length&&cnames.some(r=>!r.proxied)))throw Error('Conflicting funnel DNS records; existing website and mail records were preserved.');
  return cnames[0];
}
