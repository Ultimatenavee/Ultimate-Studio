'use strict';
export default (()=>{
 const split=value=>String(value||'').split(/[,;\n]+/).map(v=>v.trim()).filter(Boolean);
 function normalized(value,brand=''){let v=String(value||'').replace(/\s+/g,'');if(/^Huawei$/i.test(brand))v=v.replace(/^(?:XEthernet|XGE)(?=\d)/i,'XGigabitEthernet').replace(/^(?:Gi|GE)(?=\d)/i,'GigabitEthernet');if(/^Cisco$/i.test(brand))v=v.replace(/^Gi(?=\d)/i,'GigabitEthernet').replace(/^Te(?=\d)/i,'TenGigabitEthernet').replace(/^Fa(?=\d)/i,'FastEthernet');return v.toLowerCase();}
 function resolve(model,value,cable){const exact=(model.ports||[]).find(p=>p.kind==='network'&&p.id===value);if(exact)return exact;const key=normalized(value,model.brand),ps=(model.ports||[]).filter(p=>p.kind==='network'&&p.cliVerified===true&&[p.name,...(p.cliAliases||[])].some(n=>normalized(n,model.brand)===key));if(ps.length===1)return ps[0];const matched=ps.filter(p=>(p.connector==='RJ45')===(cable==='copper'));return matched.length===1?matched[0]:null;}
 function keys(model,value,cable){return [...new Set(split(value).map(raw=>{const p=resolve(model,raw,cable);if(p)return p.group||p.id;const normalizedName=normalized(raw,model.brand);if(model.topologyOnly&&/^huawei-(?:ne8000|ne40e)/.test(model.id||'')){const m=normalizedName.match(/^(?:gigabitethernet|25ge|40ge|50ge|100ge|50\|100ge)(\d+\/\d+\/\d+)$/);if(m)return 'pe-socket-'+m[1];}return normalizedName;}))];}
 return {split,normalized,resolve,keys};
})();
