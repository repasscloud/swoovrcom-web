// Wrangler invokes this guard before bundling. Database work belongs to the
// explicit release runner so packaging/dry-run commands cannot migrate a DB.
import {pathToFileURL} from 'node:url';
export async function beforeWorkerBuild(env=process.env){
 if(env.WORKERS_CI!=='1')return;
 if(env.WORKERS_CI_BRANCH!=='main' || env.SWOOVR_MIGRATIONS_READY!=='1')throw new Error('Use npm run release on main so migrations complete before upload.');
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
 try{await beforeWorkerBuild();}
 catch{console.error('Worker build stopped: configure the deploy command as npm run release. Local packaging never runs database migrations.');process.exitCode=1;}
}
