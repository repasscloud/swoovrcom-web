import {test} from 'node:test';
import assert from 'node:assert/strict';
import {migrationConnectionOptions} from '../scripts/migrate.mjs';
test('migration TLS trusts the supplied CA and cannot be disabled by URL options',()=>{
 const options=migrationConnectionOptions({MIGRATION_DATABASE_URL:'postgresql://postgres:secret@example.com:5432/postgres?sslmode=no-verify',MIGRATION_DATABASE_CA:'certificate-content'});
 assert.equal(options.ssl.rejectUnauthorized,true);
 assert.ok(options.ssl.ca.includes('certificate-content'));
 assert.ok(options.ssl.ca.some(cert=>cert.includes('BEGIN CERTIFICATE')));
 assert.equal(new URL(options.connectionString).searchParams.has('sslmode'),false);
});
test('migration connections retain default verification and reject transaction pooling',()=>{
 assert.equal(migrationConnectionOptions({MIGRATION_DATABASE_URL:'postgresql://postgres:secret@example.com:5432/postgres'}).ssl.rejectUnauthorized,true);
 assert.throws(()=>migrationConnectionOptions({MIGRATION_DATABASE_URL:'postgresql://postgres:secret@example.com:6543/postgres'}),/session/);
});
test('Supabase migrations trust the bundled root without a dashboard CA setting',async()=>{
 const {X509Certificate}=await import('node:crypto');
 const options=migrationConnectionOptions({MIGRATION_DATABASE_URL:'postgresql://postgres:secret@example.com:5432/postgres'});
 const cert=new X509Certificate(options.ssl.ca);
 assert.match(cert.subject,/Supabase Root 2021 CA/);
 assert.equal(cert.ca,true);
});
