'use strict';
(()=>{
// Neutral document layout: no company logo, source deck, or vendor color band.
function decorate(pptx,slide){slide.addShape(pptx.ShapeType.rect,{x:0,y:7.28,w:13.333,h:.02,fill:{color:'E2E8F0'},line:{transparency:100},objectName:'Document footer'});}
function cover(pptx,title){const slide=pptx.addSlide();slide.background={color:'FFFFFF'};decorate(pptx,slide);slide.addText(title,{x:.8,y:2.3,w:11.73,h:2.4,fontFace:'Tahoma',fontSize:38,color:'173348',align:'center',valign:'mid',fit:'shrink',margin:0,objectName:'Customer name'});return slide;}
function closing(pptx){const slide=pptx.addSlide();slide.background={color:'FFFFFF'};decorate(pptx,slide);slide.addText('Thank You',{x:.8,y:3,w:11.73,h:1,fontFace:'Tahoma',fontSize:42,color:'173348',bold:true,align:'center',margin:0,objectName:'Thank You'});return slide;}
window.NOAH_PPT_TEMPLATE={decorate,cover,closing};})();
