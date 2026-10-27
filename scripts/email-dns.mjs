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
