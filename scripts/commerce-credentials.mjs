const prefixes = {
  STRIPE_SECRET_KEY: ['rk_live_', 'sk_live_'],
  STRIPE_PUBLISHABLE_KEY: ['pk_live_'],
  RESEND_API_KEY: ['re_'],
};

export function normalizeCredential(value) {
  let key = String(value ?? '').replace(/\x1b\[(?:200|201)~/g, '').trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1).trim();
  }
  return key;
}

// Diagnose only the format. The provider still verifies the actual key.
// Never include the supplied value, even partially, in an error message.
export function credentialIssue(name, value) {
  const accepted = prefixes[name];
  if (!accepted) throw Error('Nepodporovaný typ prihlasovacieho kľúča.');
  const key = normalizeCredential(value);
  const issue = message => name + ': ' + message;
  if (!key) return issue('Nebol zadaný žiadny kľúč.');
  if (/\.{2,}|…|[•*]/u.test(key)) return issue('Kľúč je skrátený alebo zamaskovaný. Použite celý kľúč cez tlačidlo kopírovania v účte.');
  if (name.startsWith('STRIPE_') && /^(?:rk|sk|pk)_test_/.test(key)) return issue('Je zadaný testovací kľúč. Pre tento web vyberte v Stripe živý režim (live).');
  if (name === 'STRIPE_SECRET_KEY' && key.startsWith('pk_')) return issue('Sem patrí tajný kľúč rk_live_ (prípadne sk_live_). Verejný pk_live_ patrí do ďalšej výzvy.');
  if (name === 'STRIPE_PUBLISHABLE_KEY' && /^(?:rk|sk)_/.test(key)) return issue('Sem patrí verejný kľúč pk_live_, nie tajný kľúč.');
  if (key.includes('=')) return issue('Vložte iba hodnotu kľúča bez názvu premennej a znaku =.');
  if (/\s/u.test(key)) return issue('Vstup obsahuje medzeru alebo viac riadkov. Vložte jeden celý kľúč.');
  const prefix = accepted.find(p => key.startsWith(p));
  if (!prefix) return issue('Nesprávny typ kľúča. Očakávaný začiatok: ' + accepted.join(' alebo ') + '.');
  if (key.length === prefix.length) return issue('Chýba hodnota za začiatkom kľúča. Skopírujte celý kľúč.');
  if (!/^[a-zA-Z0-9_-]+$/.test(key)) return issue('Vstup obsahuje neočakávané znaky. Skopírujte iba celý kľúč.');
  return null;
}

function hidden(name, input, output) {
  return new Promise((resolve, reject) => {
    let value = '';
    const wasRaw = Boolean(input.isRaw);
    const stop = () => {
      input.off('data', read);
      input.off('end', end);
      input.setRawMode(wasRaw);
      input.pause();
      output.write('\n');
    };
    const end = () => { stop(); reject(Error('Zadávanie kľúčov bolo ukončené.')); };
    const read = buffer => {
      for (const char of buffer.toString()) {
        if (char === '\u0003' || char === '\u0004') { stop(); reject(Error('Zadávanie kľúčov bolo zrušené.')); return; }
        if (char === '\r' || char === '\n') { stop(); resolve(value); return; }
        if (char === '\u007f' || char === '\b') value = value.slice(0, -1);
        else value += char;
        if (value.length > 4096) { stop(); reject(Error('Vstup kľúča je príliš dlhý.')); return; }
      }
    };
    input.setRawMode(true);
    input.on('data', read);
    input.once('end', end);
    input.resume();
    // Disable terminal echo before showing the prompt: a paste can arrive
    // immediately after the prompt becomes visible.
    output.write(name + ': ');
  });
}

export async function readCredential(name, {
  env = process.env,
  input = process.stdin,
  output = process.stdout,
  interactive = process.argv.includes('--interactive'),
} = {}) {
  if (env[name]) {
    const issue = credentialIssue(name, env[name]);
    if (issue) throw Error(issue);
    return normalizeCredential(env[name]);
  }
  if (!input.isTTY || !interactive) throw Error(name + ': Chýba kľúč v prostredí. Spustite skript s --interactive v termináli.');
  for (;;) {
    const value = await hidden(name, input, output);
    const issue = credentialIssue(name, value);
    if (!issue) return normalizeCredential(value);
    output.write(issue + '\nSkúste znova; hodnota zostáva skrytá.\n');
  }
}
