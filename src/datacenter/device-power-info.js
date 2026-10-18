import {deviceLoad,loadBasisLabel,powerIssue} from './power.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const powerW=value=>Number(value).toLocaleString('en-US',{maximumFractionDigits:1})+' W';
export function inspectionPower(model,{item,powerBasis='auto'}={}){
 const device=item||{model:model.id,kind:model.accessory?model.kind:'device'},row=deviceLoad(device,[model],powerBasis);row.item=device;const issue=powerIssue(row,powerBasis,[model]);
 return {row,issue,value:row.known?powerW(row.watts):'ยังไม่ทราบค่า',basis:row.known?loadBasisLabel(row):issue?.reason||'ไม่มีข้อมูล Consumption'};
}
export function devicePowerMarkup(model,options={}){const {row,value,basis}=inspectionPower(model,options);return `<section class="dv-power-current" aria-label="กำลังไฟเพื่อวางแผน"><small>${options.item?'Power ของอุปกรณ์เครื่องนี้':'Power ตามข้อมูลรุ่น'}</small><strong>${esc(value)}</strong><span>${esc(basis)}</span><p>ค่าเพื่อวางแผน · ไม่ใช่ค่าที่วัดสดจากอุปกรณ์</p>${row.manual&&options.item?.powerOverrideNote?'<p>'+esc(options.item.powerOverrideNote)+'</p>':''}</section>`;}
