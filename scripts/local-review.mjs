// Dedicated local-only PostgreSQL + Worker + Astro. Never reads .env/.dev.vars.
import {spawn,spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {generateKeyPairSync,randomBytes} from 'node:crypto';
import pg from 'pg';
import {runMigrations} from './migrate.mjs';
const root=resolve('.wrangler/corporate-review');mkdirSync(root,{recursive:true});
const pgBin=process.env.SWOOVR_POSTGRES_BIN || '/opt/homebrew/opt/postgresql@18/bin';
const data=resolve(root,'postgres');const port=55439;
const run=(file,args)=>{const result=spawnSync(file,args,{stdio:'pipe'});if(result.status!==0)throw Error(`${file.split('/').pop()} failed; inspect local PostgreSQL setup.`);};
if(!existsSync(data))run(`${pgBin}/initdb`,['-D',data,'-A','trust','-U','postgres','--no-instructions']);
const running=spawnSync(`${pgBin}/pg_ctl`,['-D',data,'status'],{stdio:'ignore'}).status===0;
if(!running)run(`${pgBin}/pg_ctl`,['-D',data,'-l',resolve(root,'postgres.log'),'-o',`-p ${port} -h 127.0.0.1`,'start']);
const admin=`postgresql://postgres@127.0.0.1:${port}/postgres`;
const client=new pg.Client({connectionString:admin});await client.connect();
for(const name of ['anon','authenticated'])await client.query(`do $$begin if not exists(select 1 from pg_roles where rolname='${name}') then create role ${name}; end if; end$$`);
await client.end();
await runMigrations({MIGRATION_DATABASE_URL:admin,LOCAL_DEVELOPMENT:'true'});
// Persist an isolated local keypair so local submissions can be read after restart.
const keyFile=resolve(root,'private.pem');const publicFile=resolve(root,'public.pem');
if(!existsSync(keyFile)){const pair=generateKeyPairSync('rsa',{modulusLength:3072});writeFileSync(keyFile,pair.privateKey.export({type:'pkcs8',format:'pem'}),{mode:0o600});writeFileSync(publicFile,pair.publicKey.export({type:'spki',format:'pem'}));}
const {readFileSync}=await import('node:fs');
const dedupeFile=resolve(root,'dedupe.key');if(!existsSync(dedupeFile))writeFileSync(dedupeFile,randomBytes(32).toString('hex'),{mode:0o600});
const config={name:'swoovr-local-review',main:resolve('src/worker.mjs'),compatibility_date:'2026-10-17',compatibility_flags:['nodejs_compat'],assets:{directory:resolve('dist'),binding:'ASSETS',run_worker_first:true,not_found_handling:'404-page'},ratelimits:[{name:'WAITLIST_RATE_LIMIT',namespace_id:'1002',simple:{limit:30,period:60}}],vars:{LOCAL_DEVELOPMENT:'true',LOCAL_REVIEW:'true',DATABASE_URL:`postgresql://swoovr_signup@127.0.0.1:${port}/postgres`,WAITLIST_DEDUPE_KEY:readFileSync(dedupeFile,'utf8'),WAITLIST_PUBLIC_KEY:readFileSync(publicFile,'utf8')}};
const configFile=resolve(root,'wrangler.json');writeFileSync(configFile,JSON.stringify(config,null,2),{mode:0o600});
const emptyEnv=resolve(root,'empty.env');writeFileSync(emptyEnv,'# Local review deliberately does not load project secrets.\n');
const env={...process.env,CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV:'false',SWOOVR_LOCAL_WORKER_URL:'http://127.0.0.1:8795',SWOOVR_LOCAL_REVIEW:'true'};
const worker=spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js','dev','--config',configFile,'--env-file',emptyEnv,'--port','8795','--ip','127.0.0.1','--local-upstream','127.0.0.1:8795','--local'],{stdio:'inherit',env});
const astro=spawn(process.execPath,['node_modules/astro/bin/astro.mjs','dev','--host','127.0.0.1','--port','4325','--ignore-lock'],{stdio:'inherit',env});
console.log('Local review: http://127.0.0.1:4325 (includes draft articles) · http://127.0.0.1:8795 (production build). Forms save only to the isolated local database.');
let stopping=false;
function stop(){if(stopping)return;stopping=true;worker.kill('SIGTERM');astro.kill('SIGTERM');spawnSync(`${pgBin}/pg_ctl`,['-D',data,'stop','-m','fast'],{stdio:'ignore'});}
process.on('SIGINT',()=>{stop();process.exit(0)});process.on('SIGTERM',()=>{stop();process.exit(0)});
worker.on('exit',()=>{stop();process.exitCode=1});astro.on('exit',()=>{stop();process.exitCode=1});
