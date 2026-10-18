import {supabaseDatabaseCA} from '../src/database-ca.mjs';
import pg from 'pg';
import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

export async function migrate(client, directory = new URL('../supabase/migrations/', import.meta.url)) {
 const files = (await readdir(directory)).filter(name => /^\d+_[a-z0-9_]+\.sql$/.test(name)).sort();
 await client.query("set lock_timeout = '15s'");
 await client.query("set statement_timeout = '60s'");
 // A session connection is required: this lock spans migration transactions.
 await client.query('select pg_advisory_lock(742642243801)');
 try {
  await client.query(`create schema if not exists private; revoke all on schema private from public;
   create table if not exists private.website_migrations (name text primary key, checksum text not null, applied_at timestamptz not null default now());
   revoke all on private.website_migrations from public`);
  for (const name of files) {
   const source = await readFile(new URL(name, directory), 'utf8');
   const checksum = createHash('sha256').update(source).digest('hex');
   const previous = await client.query('select checksum from private.website_migrations where name = $1', [name]);
   if (previous.rows.length) {
    if (previous.rows[0].checksum !== checksum) throw new Error('Applied migration changed; restore it and add a new migration.');
    continue;
   }
   await client.query('begin');
   try {
    if (name === '202610180001_waitlist.sql' && (await client.query("select to_regclass('private.signups') as existing")).rows[0].existing) {
     // Initial deployments used the exact migration in the SQL editor. Validate
     // its constraints and permissions in full before recording adoption.
     await verifyLegacyBaseline(client);
     console.log(`Adopting verified existing baseline: ${name}`);
    } else {
     const sql = source.replace(/^\s*begin\s*;/i, '').replace(/commit\s*;\s*$/i, '');
     if (/^\s*(begin|commit|rollback)\s*;/im.test(sql)) throw new Error('Migration must contain one outer transaction only.');
     await client.query(sql);
    }
    await client.query('insert into private.website_migrations (name, checksum) values ($1,$2)', [name,checksum]);
    await client.query('commit');
    console.log(`Migration ready: ${name}`);
   } catch(error) { await client.query('rollback'); throw error; }
  }
 } finally { await client.query('select pg_advisory_unlock(742642243801)'); }
}

async function verifyLegacyBaseline(client) {
 // Verify the known table shape, constraints, defaults and restricted role.
 // No deployed table or signup role is mutated during adoption.
 const columns = await client.query(`select column_name, data_type, is_nullable, column_default
  from information_schema.columns where table_schema='private' and table_name='signups' order by ordinal_position`);
 const expected = ['id','email_hash','encrypted_payload','referral_code','created_at','expires_at','marketing_state','email_confirmed_at','referral_sent_at'];
 const names = columns.rows.map(row=>row.column_name);
 const checks = await client.query(`select
  (select relrowsecurity and relforcerowsecurity from pg_class where oid='private.signups'::regclass) as rls,
  (select not rolsuper and not rolcreatedb and not rolcreaterole and not rolbypassrls and not rolinherit from pg_roles where rolname='swoovr_signup') as restricted,
  (select count(*)=1 from pg_policies where schemaname='private' and tablename='signups' and policyname='signup_insert' and cmd='INSERT' and roles=array['swoovr_signup']::name[] and with_check like '%opted_in%' and with_check like '%email_confirmed_at IS NULL%' and with_check like '%referral_sent_at IS NULL%') as policy,
  has_column_privilege('swoovr_signup','private.signups','id','INSERT') and has_column_privilege('swoovr_signup','private.signups','email_hash','INSERT') and has_column_privilege('swoovr_signup','private.signups','encrypted_payload','INSERT') and has_column_privilege('swoovr_signup','private.signups','referral_code','INSERT') as inserts,
  not has_any_column_privilege('swoovr_signup','private.signups','SELECT,UPDATE,REFERENCES') and not has_table_privilege('swoovr_signup','private.signups','DELETE,TRUNCATE') as no_reads,
  (select count(*)=7 from pg_constraint where conrelid='private.signups'::regclass and contype in ('p','u','c')) as constraints`);
 const normalise = value => value.replace(/\s+/g,' ').trim();
 const constraints = (await client.query("select pg_get_constraintdef(oid) as definition from pg_constraint where conrelid='private.signups'::regclass and contype in ('p','u','c')")).rows.map(row=>normalise(row.definition)).sort();
 const expectedConstraints = [
  'PRIMARY KEY (id)', 'UNIQUE (email_hash)', 'UNIQUE (referral_code)',
  "CHECK ((email_hash ~ '^[a-f0-9]{64}$'::text))",
  "CHECK ((encrypted_payload ~~ 'SWOOVR2:%'::text))",
  "CHECK ((referral_code ~ '^[a-f0-9]{32}$'::text))",
  "CHECK ((marketing_state = ANY (ARRAY['opted_in'::text, 'suppressed'::text, 'unsubscribed'::text])))",
 ].map(normalise).sort();
 const types = ['uuid','text','text','text','timestamp with time zone','timestamp with time zone','text','timestamp with time zone','timestamp with time zone'];
 const expectedDefaults = [null,null,null,null,'now()',"(now() + '1 year'::interval)","'opted_in'::text",null,null];
 const exactPolicy = (await client.query("select with_check, qual, permissive from pg_policies where schemaname='private' and tablename='signups' and policyname='signup_insert'")).rows[0];
 const policyMatches = exactPolicy && exactPolicy.qual === null && exactPolicy.permissive === 'PERMISSIVE' && normalise(exactPolicy.with_check) === "((marketing_state = 'opted_in'::text) AND (email_confirmed_at IS NULL) AND (referral_sent_at IS NULL))";
 const schemaMatches = policyMatches && columns.rows.every((row,index)=>row.data_type===types[index] && row.column_default===expectedDefaults[index]) && JSON.stringify(constraints)===JSON.stringify(expectedConstraints);
 const policies = (await client.query("select count(*)::int as count from pg_policies where schemaname='private' and tablename='signups'")).rows[0].count;
 const requiredNotNull = columns.rows.every((row,index)=>row.is_nullable === (index < 7 ? 'NO' : 'YES'));
 if (JSON.stringify(names)!==JSON.stringify(expected) || !schemaMatches || policies !== 1 || !requiredNotNull || !Object.values(checks.rows[0]).every(Boolean)) throw new Error('Existing signup schema differs from the original baseline; review before deployment.');
}

export function migrationConnectionOptions(env = process.env) {
 if (!env.MIGRATION_DATABASE_URL) throw new Error('Set the build-only MIGRATION_DATABASE_URL secret using an administrator direct/session connection.');
 const url = new URL(env.MIGRATION_DATABASE_URL);
 if (url.port === '6543') throw new Error('Migrations require a direct or session connection, not a transaction pooler.');
 const local = env.LOCAL_DEVELOPMENT === 'true' && ['localhost','127.0.0.1'].includes(url.hostname);
 // pg connection-string SSL parameters override the explicit ssl object.
 // Keep verification and the configured CA authoritative for migrations.
 for (const key of ['sslmode','sslcert','sslkey','sslrootcert','ssl','uselibpqcompat']) url.searchParams.delete(key);
 const ssl = {rejectUnauthorized:true,ca:supabaseDatabaseCA};
 if (env.MIGRATION_DATABASE_CA) ssl.ca = [supabaseDatabaseCA,env.MIGRATION_DATABASE_CA];
 return {connectionString:url.toString(),ssl:local ? false : ssl,connectionTimeoutMillis:10000};
}

export async function runMigrations(env = process.env) {
 const client = new pg.Client(migrationConnectionOptions(env));
 try { await client.connect(); await migrate(client); }
 finally { await client.end(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
 try { await runMigrations(); }
 catch { console.error('Database migrations failed. Check the migration connection, schema and migration checksums in a private environment. Deployment must stop.'); process.exitCode=1; }
}
