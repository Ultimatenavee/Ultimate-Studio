// Native fullscreen where available; an in-page immersive viewport on iOS/WebViews.
export function bindFullscreen(stage,buttons){
 const doc=stage.ownerDocument,win=doc.defaultView,abort=new AbortController();let immersive=false,busy=false,disposed=false,scrollY=0;
 const nativeElement=()=>doc.fullscreenElement||doc.webkitFullscreenElement;
 const active=()=>immersive||nativeElement()===stage;
 function resize(){if(!active())return;const v=win.visualViewport;stage.style.setProperty('--fullscreen-width',(v?.width||win.innerWidth)+'px');stage.style.setProperty('--fullscreen-height',(v?.height||win.innerHeight)+'px');win.dispatchEvent(new Event('resize'));}
 function sync(){const on=active();stage.classList.toggle('is-fullscreen',on);doc.body.classList.toggle('immersive-active',on);for(const b of buttons){b.setAttribute('aria-pressed',String(on));b.setAttribute('aria-label',on?'ออกจากเต็มหน้าจอ':'เต็มหน้าจอ');b.title=on?'ออกจากเต็มหน้าจอ':'เต็มหน้าจอ';}const exit=doc.getElementById('exitFullscreen');if(exit)exit.hidden=!on;if(on)resize();else{stage.style.removeProperty('--fullscreen-width');stage.style.removeProperty('--fullscreen-height');win.dispatchEvent(new Event('resize'));}}
 function fallback(){scrollY=win.scrollY;immersive=true;sync();}
 async function leave(){if(immersive){immersive=false;sync();win.scrollTo(0,scrollY);}else if(nativeElement()===stage){const exit=doc.fullscreenElement===stage?doc.exitFullscreen:(doc.webkitExitFullscreen||doc.exitFullscreen);try{await exit?.call(doc);}catch{/* A browser exit gesture may already have closed fullscreen. */}sync();}}
 async function toggle(){if(busy||disposed)return;busy=true;try{if(active()){await leave();return;}const request=stage.requestFullscreen||stage.webkitRequestFullscreen;if(request){try{await request.call(stage);sync();try{await win.navigator.keyboard?.lock?.(['Escape']);}catch{/* Optional desktop Keyboard Lock. */}return;}catch{/* Safari/WebViews can expose the method but reject the request. */}}fallback();}finally{busy=false;}}
 for(const type of ['fullscreenchange','webkitfullscreenchange'])doc.addEventListener(type,sync,{signal:abort.signal});
 // Keep orientation free: the user can rotate between portrait and landscape.
 win.addEventListener('orientationchange',()=>{if(active())requestAnimationFrame(resize);},{signal:abort.signal});
 win.visualViewport?.addEventListener('resize',()=>{if(active())resize();},{signal:abort.signal});
 doc.addEventListener('keydown',e=>{if(e.key==='Escape'&&immersive){e.preventDefault();void leave();}},{signal:abort.signal});
 const nativeResize=()=>{if(active()){const v=win.visualViewport;stage.style.setProperty('--fullscreen-width',(v?.width||win.innerWidth)+'px');stage.style.setProperty('--fullscreen-height',(v?.height||win.innerHeight)+'px');}};
 win.addEventListener('resize',nativeResize,{signal:abort.signal});
 doc.getElementById('exitFullscreen')?.addEventListener('click',()=>void leave(),{signal:abort.signal});
 if(win.matchMedia('(display-mode: standalone)').matches||win.navigator.standalone)fallback();else sync();
 return {toggle,active,dispose(){disposed=true;abort.abort();immersive=false;stage.classList.remove('is-fullscreen');doc.body.classList.remove('immersive-active');}};
}
