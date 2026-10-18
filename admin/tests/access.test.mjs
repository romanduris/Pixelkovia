import {test} from 'node:test';import assert from 'node:assert/strict';
import {generateKeyPair,SignJWT} from 'jose';import {verifyAdminToken} from '../src/auth.mjs';
test('Access verifies RS256 signature, issuer, audience, expiry, required claims and explicit admin email',async()=>{
 const {publicKey,privateKey}=await generateKeyPair('RS256');const config={ACCESS_TEAM_DOMAIN:'treasurequest-test.cloudflareaccess.com',ACCESS_AUD:'test-audience',ADMIN_EMAILS:'owner@example.invalid'};
 const sign=async(overrides={})=>new SignJWT({email:'owner@example.invalid',...overrides.payload}).setProtectedHeader({alg:'RS256'}).setSubject('test-admin').setIssuedAt().setExpirationTime(overrides.exp||'1h').setIssuer(overrides.issuer||'https://treasurequest-test.cloudflareaccess.com').setAudience(overrides.audience||'test-audience').sign(privateKey);
 const verified=await verifyAdminToken(await sign(),config,publicKey);assert.equal(verified.email,'owner@example.invalid');
 for(const wrong of [{payload:{email:'other@example.invalid'}},{audience:'wrong-app'},{issuer:'https://other.cloudflareaccess.com'},{exp:'-1h'}])await assert.rejects(()=>sign(wrong).then(t=>verifyAdminToken(t,config,publicKey)));
 const other=await generateKeyPair('RS256');await assert.rejects(()=>sign().then(t=>verifyAdminToken(t,config,other.publicKey)));
});
