import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {release} from './release.mjs';

export async function deploy(env=process.env,args=[],publish=()=>release(env),local=options=>{
 const result=spawnSync('bash',['deploy.sh',...options],{stdio:'inherit',env});
 if(result.status!==0)throw new Error('Local deployment checks failed.');
}) {
 if(env.WORKERS_CI==='1') {
  if(args.length)throw new Error('Cloudflare deployment does not accept local packaging arguments.');
  await publish();
 } else await local(args);
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
 try{await deploy(process.env,process.argv.slice(2));}
 catch(error){console.error(error.message);process.exitCode=1;}
}
