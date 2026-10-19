// An unavailable resource must not leave the initial overlay spinning forever.
export async function waitForStartup(pending,timeout=45000,label='โหลดทรัพยากร'){
 let timer;
 try{return await Promise.race([pending,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(label+'เกินเวลา กรุณาลองใหม่')),timeout)})]);}
 finally{clearTimeout(timer);}
}

// A late scene must never attach itself after the user has retried startup.
export async function startupResource(pending,timeout=60000,label='โหลดฉาก 3D'){
 let expired=false;
 const observed=Promise.resolve(pending).then(resource=>{if(expired){resource?.dispose?.();throw Error(label+'ถูกยกเลิก');}return resource;});
 try{return await waitForStartup(observed,timeout,label);}
 catch(error){expired=true;throw error;}
}
