import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, privateDecrypt, constants, createDecipheriv } from 'node:crypto';
import { handleEnquiry } from '../src/enquiries.mjs';
const {publicKey,privateKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const env=()=>({DATABASE_URL:'unused',WAITLIST_PUBLIC_KEY:publicKey.export({type:'spki',format:'pem'}),WAITLIST_RATE_LIMIT:{limit:async()=>({success:true})}});
const data=()=>({requestId:crypto.randomUUID(),kind:'contact',name:'Test Person',email:'person@example.com',topic:'general',message:'I would like to learn about Swoovr.',replyConsent:true});
const req=(body=data(),overrides={})=>new Request('https://swoovr.com/api/enquiries',{method:'POST',headers:{origin:'https://swoovr.com','content-type':'application/json'},body:JSON.stringify(body),...overrides});
const never=()=>assert.fail('must not store');
test('enquiries require bounded fields, reply permission and beta adulthood',async()=>{
 for(const fields of [{name:''},{email:'bad'},{replyConsent:false},{topic:'unknown'},{message:'x'.repeat(3001)},{kind:'beta',adult:false},{requestId:'bad'},{city:'Unknownville'},{device:'anything'},{organisation:[]}]) assert.equal((await handleEnquiry(req({...data(),...fields}),env(),never)).status,400);
});
test('enquiries enforce origin, method, JSON, limits and no false success',async()=>{
 assert.equal((await handleEnquiry(req(data(),{headers:{origin:'https://evil.test','content-type':'application/json'}}),env(),never)).status,403);
 assert.equal((await handleEnquiry(req(data(),{method:'GET',body:undefined}),env(),never)).status,405);
 assert.equal((await handleEnquiry(req(data(),{body:'{'}),env(),never)).status,400);
 assert.equal((await handleEnquiry(req({...data(),message:'x'.repeat(20000)}),env(),never)).status,413);
 assert.equal((await handleEnquiry(req(data(),{headers:{origin:'https://swoovr.com','content-type':'text/plain'}}),env(),never)).status,415);
 const limited=env();limited.WAITLIST_RATE_LIMIT.limit=async()=>({success:false});assert.equal((await handleEnquiry(req(),limited,never)).status,429);
 assert.equal((await handleEnquiry(req(),{},never)).status,503);
 assert.equal((await handleEnquiry(req(),env(),async()=>{throw Error('offline')})).status,502);
 assert.equal((await handleEnquiry(req({...data(),website:'bot'}),env(),never)).status,202);
});
test('contact and beta messages are encrypted and acknowledged only after storage',async()=>{
 for(const kind of ['contact','beta']){
 let saved; const input={...data(),kind,adult:true,city:'Adelaide',device:'iOS',availability:'Evenings'};
 const response=await handleEnquiry(req(input),env(),async record=>{saved=record});
 assert.equal(response.status,202);assert.deepEqual(await response.json(),{ok:true});
 assert.equal(saved.id,input.requestId);assert.equal(saved.kind,kind);assert.ok(!JSON.stringify(saved).includes(input.email));
 const envelope=JSON.parse(Buffer.from(saved.encrypted.slice(8),'base64'));
 const key=privateDecrypt({key:privateKey,padding:constants.RSA_PKCS1_OAEP_PADDING,oaepHash:'sha256'},Buffer.from(envelope.key,'base64'));
 const encrypted=Buffer.from(envelope.data,'base64');const decipher=createDecipheriv('aes-256-gcm',key,Buffer.from(envelope.iv,'base64'));
 decipher.setAAD(Buffer.from('SWOOVR2:'+saved.id));decipher.setAuthTag(encrypted.subarray(-16));
 const payload=JSON.parse(Buffer.concat([decipher.update(encrypted.subarray(0,-16)),decipher.final()]));
 assert.equal(payload.email,input.email);assert.equal(payload.message,input.message);assert.equal(payload.replyConsent,true);
 assert.equal(payload.marketingConsent,undefined);
 }
});
