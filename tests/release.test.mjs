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
