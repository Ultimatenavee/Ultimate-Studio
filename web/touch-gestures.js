'use strict';
(() => {
  // Two pointers take ownership from an in-progress one-finger edit. The edit is
  // cancelled before the viewport snapshot so pinching can never move hardware.
  function install(surface, adapter) {
    const pointers = new Map();
    let pinch = null, cancelling = false, suppressUntil = 0;
    const pair = () => {
      const [a,b] = [...pointers.values()];
      const box = surface.getBoundingClientRect();
      return { x:(a.x+b.x)/2-box.left, y:(a.y+b.y)/2-box.top, distance:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y)) };
    };
    const stop = e => { e.preventDefault(); e.stopImmediatePropagation(); };
    surface.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'touch' || e.target.closest('.zoom-controls,.mini-map,#exitPresentation,#bayfaceExitPresent,[data-add-first-rack]')) return;
      if (pointers.size >= 2) { stop(e); return; }
      pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if (pointers.size !== 2) return;
      const first = [...pointers.keys()][0];
      cancelling = true;
      surface.dispatchEvent(new PointerEvent('pointercancel',{pointerId:first,pointerType:'touch',bubbles:false}));
      cancelling = false;
      const anchor = pair();
      pinch = {anchor,view:adapter.read()};
      for (const id of pointers.keys()) surface.setPointerCapture(id);
      stop(e);
    }, {capture:true,passive:false});
    surface.addEventListener('pointermove', e => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if (!pinch) return;
      stop(e);
      if (pointers.size < 2) return;
      const current = pair(), {anchor,view} = pinch;
      const zoom = Math.max(adapter.min,Math.min(adapter.max,view.zoom*current.distance/anchor.distance));
      adapter.write({zoom,pan:{
        x:current.x-(anchor.x-view.pan.x)*zoom/view.zoom,
        y:current.y-(anchor.y-view.pan.y)*zoom/view.zoom
      }});
    }, {capture:true,passive:false});
    function end(e) {
      if (cancelling || !pointers.has(e.pointerId)) return;
      pointers.delete(e.pointerId);
      if (!pinch) return;
      stop(e); suppressUntil = Date.now()+450;
      if (surface.hasPointerCapture(e.pointerId)) surface.releasePointerCapture(e.pointerId);
      if (!pointers.size) pinch = null;
    }
    surface.addEventListener('pointerup',end,true);
    surface.addEventListener('pointercancel',end,true);
    surface.addEventListener('click',e => { if (Date.now()<suppressUntil) stop(e); },true);
    window.addEventListener('blur',() => { pointers.clear(); pinch=null; });
  }
  window.NOAH_TOUCH = {install};
})();
