import {clone,toBayface,validateRacks} from './rack-placement.js';
import {isPassivePower} from './power.js';
export function rackToBayface(rack,models){
 if(!rack)throw Error('เลือก Rack ก่อนส่งออก');const known=new Set(['generic-network-device',...models.map(m=>m.id)]);validateRacks([rack],known);
 const data=toBayface([rack],rack.name,models),source=new Map(rack.items.map(i=>[i.id,i]));
 for(const item of data.items){const original=source.get(item.id),model=models.find(m=>m.id===original.model);if(model||original.original)continue;
  if(isPassivePower(original)){item.kind=['blank','reserved'].includes(original.kind)?original.kind:'patch';item.modelId='';}
  else{item.kind='device';item.modelId='generic-network-device';item.notes=[item.notes,'Generic reference / Simulator type: '+(original.kind||'device')].filter(Boolean).join('\n');}
 }
 return clone(data);
}
