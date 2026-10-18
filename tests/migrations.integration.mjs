// Run only against a disposable local PostgreSQL cluster (never a live database).
import pg from 'pg';
import assert from 'node:assert/strict';
import {migrate} from '../scripts/migrate.mjs';
import {mkdtemp,writeFile,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
const client=new pg.Client({connectionString:'postgresql://postgres@127.0.0.1:55438/postgres'});
await client.connect();
try{
 for(const name of ['anon','authenticated'])await client.query(`do $$begin if not exists(select 1 from pg_roles where rolname='${name}') then create role ${name}; end if; end$$`);
 await migrate(client);await migrate(client);
 assert.equal((await client.query('select count(*)::int as count from private.website_migrations')).rows[0].count,2);
 await client.query('set role swoovr_signup');
 const id=crypto.randomUUID();await client.query("insert into private.enquiries(id,kind,encrypted_payload)values($1,'contact','SWOOVR2:synthetic') on conflict do nothing",[id]);
 await client.query("insert into private.enquiries(id,kind,encrypted_payload)values($1,'contact','SWOOVR2:retry') on conflict do nothing",[id]);
 await assert.rejects(client.query('select * from private.enquiries'),/permission denied/);
 await assert.rejects(client.query("update private.enquiries set kind='beta'"),/permission denied/);
 await client.query('reset role');assert.equal((await client.query('select count(*)::int as count from private.enquiries where id=$1',[id])).rows[0].count,1);
 await client.query('delete from private.enquiries where id=$1',[id]);
 const directory=await mkdtemp(tmpdir()+'/swoovr-migration-test-');const url=pathToFileURL(directory+'/');
 try{
  await writeFile(directory+'/202610180003_broken.sql','begin; create table private.must_rollback(id int); select nonexistent_function(); commit;');
  await assert.rejects(migrate(client,url));
  assert.equal((await client.query("select to_regclass('private.must_rollback') as name")).rows[0].name,null);
  assert.equal((await client.query("select count(*)::int as count from private.website_migrations where name='202610180003_broken.sql'")).rows[0].count,0);
  await writeFile(directory+'/202610180002_enquiries.sql','begin; select 1; commit;');
  await assert.rejects(migrate(client,url),/Applied migration changed/);
 }finally{await rm(directory,{recursive:true});}
 // Reject schemas that contain the expected words but weaken the policy/checks.
 await client.query("delete from private.website_migrations where name='202610180001_waitlist.sql'");
 await client.query("alter policy signup_insert on private.signups with check (true OR (marketing_state='opted_in' and email_confirmed_at is null and referral_sent_at is null))");
 await assert.rejects(migrate(client),/differs from the original baseline/);
 await client.query("alter policy signup_insert on private.signups with check (marketing_state='opted_in' and email_confirmed_at is null and referral_sent_at is null)");
 await client.query("alter table private.signups drop constraint signups_email_hash_check; alter table private.signups add constraint signups_email_hash_check check (email_hash ~ '^[a-f0-9]{64}$' OR true)");
 await assert.rejects(migrate(client),/differs from the original baseline/);
 await client.query("alter table private.signups drop constraint signups_email_hash_check; alter table private.signups add constraint signups_email_hash_check check (email_hash ~ '^[a-f0-9]{64}$')");
 await migrate(client);
 console.log('PASS: fresh migrations, replay, verified baseline adoption, checksum refusal, rollback, rejection of weakened policy/constraints, duplicate retries and insert-only RLS.');
}finally{await client.end();}
