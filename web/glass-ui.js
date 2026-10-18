'use strict';
(() => {
 const title=document.getElementById('projectName'),header=document.querySelector('.topbar');
 function resizeTitle(){title.style.height='auto';title.style.height=title.scrollHeight+'px';document.documentElement.style.setProperty('--app-header-height',(header.getBoundingClientRect().height+10)+'px');}
 title.addEventListener('input',resizeTitle);window.addEventListener('resize',resizeTitle);
 if(window.ResizeObserver)new ResizeObserver(resizeTitle).observe(header);
 const motion=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 document.addEventListener('pointermove',event=>{if(motion?.matches)return;const surface=event.target.closest('.topbar,.design-tabs,.bayface-toolbar,.spec-controls');if(!surface)return;const box=surface.getBoundingClientRect();surface.style.setProperty('--glow-x',Math.round((event.clientX-box.left)/box.width*100)+'%');surface.style.setProperty('--glow-y',Math.round((event.clientY-box.top)/box.height*100)+'%');});
 window.NOAH_GLASS={resizeTitle};resizeTitle();
})();
