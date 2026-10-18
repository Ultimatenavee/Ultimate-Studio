'use strict';
(()=>{const A=window.NOAH_APP,V=window.NOAH_AUDIENCE,$=id=>document.getElementById(id),E=window.NOAH_EDITOR;
let last;function update(){const p=A.getProject(),external=V.external(p),locked=p.designOrigin==='external';document.body.classList.toggle('audience-external',external);if(last!==external){last=external;$('search').value='';A.renderCatalog();}$('audienceStatus').textContent=external?'External · ไอคอนกลาง':'Internal · อุปกรณ์จริง';$('audienceSwap').textContent=external?'สลับเป็น Internal':'สลับเป็น External';$('audienceSwap').disabled=locked;$('audienceHint').textContent=locked?'สร้างเป็น External · ไม่มีรุ่นอุปกรณ์ต้นฉบับ':external?'สำหรับนำเสนอภายนอก · ซ่อนรุ่น PE':'สำหรับใช้งานภายใน';}
const old=E.onRender;E.onRender=function(){old.apply(this,arguments);update();};
$('audienceSwap').onclick=()=>A.setAudience(V.external(A.getProject())?'internal':'external');
$('newBtn').onclick=()=>$('newAudienceDialog').showModal();
$('newAudienceDialog').onclick=e=>{const b=e.target.closest('[data-new-audience]');if(b){A.startProject(b.dataset.newAudience);$('newAudienceDialog').close();}};
$('externalIconStyle').onchange=()=>A.renderCatalog();
$('serviceToolsBtn').onclick=()=>{const open=document.body.classList.toggle('service-tools-open');$('serviceToolsBtn').setAttribute('aria-expanded',String(open));window.NOAH_EDITOR.onViewChange();};
update();})();
