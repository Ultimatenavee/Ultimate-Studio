// An unavailable resource must not leave the initial overlay spinning forever.
export async function waitForStartup(pending,timeout=45000){
 let timer;
 try{return await Promise.race([pending,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('โหลดทรัพยากรเกินเวลา กรุณาลองใหม่')),timeout)})]);}
 finally{clearTimeout(timer);}
}
