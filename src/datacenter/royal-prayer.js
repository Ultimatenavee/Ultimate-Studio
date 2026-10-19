import {nearRoyalPrayer,sixDigitBlessing} from './royal-temple-layout.js';
export function createRoyalPrayer(host,{pause,sit,focus,isSitting}){
 const abort=new AbortController();let available=false,timer=null,previousSit=false;
 const style=document.createElement('style');style.textContent=`
 .royal-pray{position:absolute;z-index:45;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 102px);transform:translateX(-50%);min-height:48px;padding:10px 22px;border:1px solid #dbbd76;border-radius:12px;background:#33291deb;color:#ffe4a7;box-shadow:0 4px 24px #0005;font:600 15px sans-serif;max-width:calc(100% - 170px)}
 .royal-prayer-dialog{box-sizing:border-box;width:min(430px,calc(100vw - 28px));max-height:calc(100dvh - 24px);overflow:auto;padding:28px;border:1px solid #d5b877;border-radius:20px;background:#fff9eb;color:#493723;text-align:center;box-shadow:0 24px 80px #0006}
 .royal-prayer-dialog::backdrop{background:#131c29a8;backdrop-filter:blur(4px)}
 .royal-prayer-dialog h2{font-size:23px;margin:10px 0}.royal-prayer-dialog p{font-size:14px;line-height:1.6}.royal-prayer-dialog output{display:block;font:700 clamp(30px,8vw,48px) monospace;letter-spacing:.12em;color:#7b5420;margin:18px 0;min-height:60px}.royal-prayer-dialog button{padding:12px 24px;min-height:46px;border:1px solid #b8944c;border-radius:10px;background:#5e4630;color:#fff7e6;cursor:pointer}.royal-prayer-dialog small{display:block;margin:15px 0;color:#796749}.royal-prayer-mark{font-size:38px}
 @media(max-width:600px) and (min-height:501px){.royal-pray{bottom:calc(env(safe-area-inset-bottom,0px) + 180px)}}
 @media(max-height:500px){.royal-pray{bottom:70px;min-height:42px;padding:8px 15px}.royal-prayer-dialog{padding:14px}.royal-prayer-dialog h2{font-size:19px;margin:3px}.royal-prayer-mark{font-size:25px}.royal-prayer-dialog output{margin:6px 0;min-height:40px}.royal-prayer-dialog p,.royal-prayer-dialog small{margin:6px 0}}
 `;host.append(style);
 const button=document.createElement('button');button.type='button';button.className='royal-pray';button.textContent='🙏 ไหว้พระ · E';button.hidden=true;host.append(button);
 const dialog=document.createElement('dialog');dialog.className='royal-prayer-dialog';dialog.setAttribute('aria-labelledby','royalPrayerTitle');dialog.innerHTML='<div class="royal-prayer-mark" aria-hidden="true">🙏</div><h2 id="royalPrayerTitle">ไหว้พระประธาน</h2><p>พระอุโบสถหลวงศิริน</p><output aria-live="polite"></output><small>เลขสุ่ม 6 หลักเพื่อความเพลิดเพลิน</small><button type="button">กลับสู่พระอุโบสถ</button>';host.append(dialog);
 const output=dialog.querySelector('output');
 function close(){if(timer!==null){clearTimeout(timer);timer=null;}sit(previousSit);focus();}
 dialog.addEventListener('close',close,{signal:abort.signal});dialog.querySelector('button').onclick=()=>dialog.close();
 function pray(){if(!available||dialog.open)return;pause();previousSit=isSitting();sit(true);output.textContent='ตั้งจิตสงบ…';output.style.fontSize='22px';dialog.showModal();timer=setTimeout(()=>{timer=null;if(!dialog.open)return;output.style.fontSize='';output.textContent=sixDigitBlessing();},1800);}
 button.onclick=pray;
 window.addEventListener('keydown',e=>{if(e.code==='KeyE'&&!e.repeat&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!e.target.closest?.('input,textarea,select,[contenteditable=true]')&&!document.querySelector('dialog[open]')&&available){e.preventDefault();pray();}},{signal:abort.signal});
 return {update(area,walking,x,z){available=area==='royalTemple'&&walking&&nearRoyalPrayer(x,z);button.hidden=!available;if(area!=='royalTemple'&&dialog.open)dialog.close();},dispose(){abort.abort();clearTimeout(timer);dialog.remove();button.remove();style.remove();}};
}
