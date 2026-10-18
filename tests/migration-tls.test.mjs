import {test} from 'node:test';
import assert from 'node:assert/strict';
import {migrationConnectionOptions} from '../scripts/migrate.mjs';
test('migration TLS trusts the supplied CA and cannot be disabled by URL options',()=>{
 const options=migrationConnectionOptions({MIGRATION_DATABASE_URL:'postgresql://postgres:secret@example.com:5432/postgres?sslmode=no-verify',MIGRATION_DATABASE_CA:'certificate-content'});
 assert.equal(options.ssl.rejectUnauthorized,true);
 assert.equal(options.ssl.ca,'certificate-content');
 assert.equal(new URL(options.connectionString).searchParams.has('sslmode'),false);
});
test('migration connections retain default verification and reject transaction pooling',()=>{
 assert.deepEqual(migrationConnectionOptions({MIGRATION_DATABASE_URL:'postgresql://postgres:secret@example.com:5432/postgres'}).ssl,{rejectUnauthorized:true});
 assert.throws(()=>migrationConnectionOptions({MIGRATION_DATABASE_URL:'postgresql://postgres:secret@example.com:6543/postgres'}),/session/);
});
