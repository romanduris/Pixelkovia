import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PassThrough, Writable} from 'node:stream';
import {setImmediate} from 'node:timers/promises';
import {credentialIssue, normalizeCredential, readCredential} from '../scripts/commerce-credentials.mjs';

const secret = 'rk_live_' + 'synthetic_fixture_123';
const publicKey = 'pk_live_' + 'synthetic_fixture_456';

test('copied credentials tolerate surrounding quotes and bracketed terminal paste', () => {
  assert.equal(normalizeCredential('\x1b[200~ "' + secret + '" \x1b[201~\r\n'), secret);
  assert.equal(credentialIssue('STRIPE_SECRET_KEY', secret), null);
  assert.equal(credentialIssue('STRIPE_PUBLISHABLE_KEY', publicKey), null);
  assert.equal(credentialIssue('RESEND_API_KEY', 're_' + 'synthetic_fixture_789'), null);
});

test('diagnostics identify the failing field and disclose none of its supplied value', () => {
  for (const [name, value, expected] of [
    ['STRIPE_SECRET_KEY', publicKey, /tajný/],
    ['STRIPE_PUBLISHABLE_KEY', secret, /verejný/],
    ['STRIPE_SECRET_KEY', 'rk_test_' + 'synthetic_fixture', /testovací/],
    ['STRIPE_PUBLISHABLE_KEY', 'pk_live_' + 'synthetic…fixture', /skrátený/],
    ['RESEND_API_KEY', 'bad_synthetic_fixture', /Nesprávny typ/],
    ['STRIPE_SECRET_KEY', 'STRIPE_SECRET_KEY=' + secret, /bez názvu/],
    ['STRIPE_SECRET_KEY', secret + ' extra', /medzeru/],
  ]) {
    const issue = credentialIssue(name, value);
    assert.ok(issue.startsWith(name + ':'));
    assert.match(issue, expected);
    assert.ok(!issue.includes('synthetic'));
  }
});

function terminal() {
  const input = new PassThrough();
  input.isTTY = true;
  input.isRaw = false;
  input.setRawMode = value => { input.isRaw = value; };
  let text = '';
  const promptStates = [];
  const output = new Writable({write(chunk, encoding, done) {
    const message = chunk.toString();
    if (/^(?:STRIPE_SECRET_KEY|STRIPE_PUBLISHABLE_KEY|RESEND_API_KEY): $/.test(message)) promptStates.push(input.isRaw);
    text += message;
    done();
  }});
  return {input, output, env: {}, interactive: true, promptStates, log: () => text};
}

test('hidden input retries the incorrect field without echoing either key', async () => {
  const tty = terminal();
  const pending = readCredential('STRIPE_SECRET_KEY', tty);
  tty.input.write(publicKey + '\r\n');
  await setImmediate();
  assert.equal(tty.log().split('STRIPE_SECRET_KEY: ').length - 1, 3); // two prompts and the diagnostic
  tty.input.write('\x1b[200~"' + secret + '"\x1b[201~\r\n');
  assert.equal(await pending, secret);
  assert.deepEqual(tty.promptStates, [true, true], 'terminal echo must be disabled before either prompt is visible');
  assert.ok(!tty.log().includes('synthetic'));
  assert.equal(tty.input.isRaw, false);
  assert.equal(tty.input.listenerCount('data'), 0);
});

test('cancelling a partly entered secret restores the terminal and reveals no input', async () => {
  const tty = terminal();
  const pending = readCredential('STRIPE_SECRET_KEY', tty);
  tty.input.write(secret + '\x03');
  await assert.rejects(pending, /zrušené/);
  assert.equal(tty.input.isRaw, false);
  assert.equal(tty.input.listenerCount('data'), 0);
  assert.ok(!tty.log().includes('synthetic'));
});

test('invalid environment credentials fail safely without opening a prompt', async () => {
  const tty = terminal();
  await assert.rejects(readCredential('STRIPE_SECRET_KEY', {...tty, env: {STRIPE_SECRET_KEY: publicKey}}), /STRIPE_SECRET_KEY: Sem patrí tajný/);
  assert.equal(tty.log(), '');
  assert.equal(await readCredential('STRIPE_SECRET_KEY', {...tty, env: {STRIPE_SECRET_KEY: '"' + secret + '"'}}), secret);
});
