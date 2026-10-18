import {test} from 'node:test';
import assert from 'node:assert/strict';
import {release} from '../scripts/release.mjs';
test('release applies migrations before upload and never uploads after a migration failure',async()=>{
 const env={WORKERS_CI:'1',WORKERS_CI_BRANCH:'main'};const events=[];
 await release(env,async()=>events.push('migrate'),async()=>events.push('upload'));assert.deepEqual(events,['migrate','upload']);
 await assert.rejects(release(env,async()=>{throw Error('failed')},async()=>assert.fail('must not upload')));
 for(const settings of [{},{WORKERS_CI:'1',WORKERS_CI_BRANCH:'codex/review'}])await assert.rejects(release(settings,async()=>assert.fail('must not migrate'),async()=>assert.fail('must not upload')));
});
import {beforeWorkerBuild} from '../scripts/worker-build.mjs';
test('Wrangler guard cannot migrate and requires the explicit release runner in CI',async()=>{
 await beforeWorkerBuild({});
 await beforeWorkerBuild({WORKERS_CI:'1',WORKERS_CI_BRANCH:'main',SWOOVR_MIGRATIONS_READY:'1'});
 await assert.rejects(beforeWorkerBuild({WORKERS_CI:'1',WORKERS_CI_BRANCH:'main'}));
 await assert.rejects(beforeWorkerBuild({WORKERS_CI:'1',WORKERS_CI_BRANCH:'feature'}));
});

test('migration failures identify the stage and safe error code without leaking credentials',async()=>{
 const error=Object.assign(new Error('postgresql://private:password@host/postgres'),{code:'28P01'});
 await assert.rejects(release({WORKERS_CI:'1',WORKERS_CI_BRANCH:'main'},async()=>{throw error},async()=>assert.fail('must not upload')),failure=>failure.message.includes('28P01') && failure.message.includes('authentication') && !failure.message.includes('password@'));
});
test('npm deploy selects Cloudflare release and preserves local packaging',async()=>{
 const {deploy}=await import('../scripts/deploy.mjs');const events=[];
 await deploy({WORKERS_CI:'1'},[],async()=>events.push('release'),()=>events.push('local'));
 await deploy({},['--dry-run'],async()=>assert.fail('must not release'),args=>events.push(args));
 assert.deepEqual(events,['release',['--dry-run']]);
});
