'use strict';
(() => {
  const A=window.NOAH_APP,I=window.NOAH_IMPORT,$=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let pendingKey=null,busy=false,templatesLoading=false;
  function inspect(value){
    const parsed=I.parse(value),result=I.convert(parsed.data,A.getCatalog());
    if(parsed.repaired)result.warnings.unshift('ซ่อมอักขระขึ้นบรรทัดใหม่ในข้อความ JSON แล้ว');
    const project=A.sanitizeProject(result.project);
    if(result.source!=='NOAH Project')project.linkGridSize=window.NOAH_EDITOR.preferences.grid;
    $('importSummary').innerHTML=`<strong>${esc(project.name)}</strong><p>${project.devices.length} อุปกรณ์ · ${project.links.length} สาย · ${project.labels.length} Labels</p>${result.warnings.length?'<ul>'+result.warnings.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul>':''}`;
    $('importError').textContent='';return project;
  }
  $('projectMenuBtn').onclick=()=>$('projectMenuDialog').showModal();
  $('projectMenuDialog').onclick=e=>{if(e.target.closest('button'))$('projectMenuDialog').close();};
  function openJSON(){if(!$('importDialog').open)$('importDialog').showModal();$('importJSON').focus();}
  async function pasteClipboard(input,status){
    try{
      if(!window.navigator?.clipboard?.readText)throw new Error('unavailable');
      const text=await window.navigator.clipboard.readText();
      if(!text.trim()){status.textContent='Clipboard ไม่มีข้อความ JSON';input.focus();return false;}
      if(new Blob([text]).size>10*1024*1024){status.textContent='JSON ต้องไม่เกิน 10 MB';input.focus();return false;}
      input.value=text;status.textContent='';input.focus();return true;
    }catch{status.textContent='คลิกในกล่องแล้วกด Ctrl+V หรือ ⌘V เพื่อวาง JSON';input.focus();return false;}
  }
  $('pasteJSONBtn').onclick=openJSON;$('quickPasteJSONBtn').onclick=openJSON;
  $('pasteClipboardBtn').onclick=async()=>{const b=$('pasteClipboardBtn');b.disabled=true;try{if(await pasteClipboard($('importJSON'),$('importError')))$('importSummary').innerHTML='';}finally{b.disabled=false;}};
  $('importFileBtn').onclick=()=>$('projectFile').click();

  $('previewJSONBtn').onclick=()=>{try{inspect($('importJSON').value);}catch(e){$('importSummary').innerHTML='';$('importError').textContent=e.message;}};
  $('importForm').onsubmit=e=>{e.preventDefault();try{const project=inspect($('importJSON').value);window.NOAH_EDITOR.saveLocal();A.replaceProject(project);window.NOAH_EDITOR.saveLocal();$('importDialog').close();A.toast('สร้าง Topology จาก JSON แล้ว · ย้อนกลับได้');}catch(err){$('importError').textContent=err.message;}};
  window.NOAH_IMPORT_UI={fromText:async value=>{
    const parsed=I.parse(value);if(parsed.data?.format==='noah-topology')return A.sanitizeProject(parsed.data);
    $('importJSON').value=value;inspect(value);$('importDialog').showModal();return null;
  }};
  window.NOAH_ELEMENTS.init();
  window.NOAH_PROJECT_TOOLS={inspect,pasteClipboard,refreshTemplates:()=>window.NOAH_TEMPLATES?.refresh()};
})();
