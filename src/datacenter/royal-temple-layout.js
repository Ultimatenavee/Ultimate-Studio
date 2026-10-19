// World-space metres, Y up. The royal parcel is separate from both labs.
export const ROYAL_TEMPLE={x:0,z:-131.362,frontZ:-111,parcel:[-26,26,-164,-109],gate:{x:14.6,z:-113.2,width:3,depth:2.4},return:{x:14.6,z:-107.4,yaw:Math.PI},spawn:{x:0,z:12,yaw:0},exit:{x:0,z:15.6,width:3.8,depth:1.8},prayer:{x:0,z:-2.7,radius:3.3}};
// Shared with the release packager so in-use fixtures cannot be pruned away.
export const ROYAL_LANTERNS=[-23,23].flatMap(x=>[-153,-126,-109].map(z=>({id:'L266',x,y:0,z,height:3})));
export const ROYAL_OBSTACLES=[{minX:-5.8,maxX:5.8,minZ:-15.5,maxZ:-6.3},{minX:-1.65,maxX:1.65,minZ:-6.3,maxZ:-4.8},...[-8.4,8.4].flatMap(x=>[-12,-6,0,6,12].map(z=>({minX:x-.55,maxX:x+.55,minZ:z-.55,maxZ:z+.55})))];
export const royalCanStand=(x,z,r=.18)=>Number.isFinite(x)&&Number.isFinite(z)&&Math.abs(x)<11.6-r&&Math.abs(z)<16.6-r&&!ROYAL_OBSTACLES.some(b=>x>b.minX-r&&x<b.maxX+r&&z>b.minZ-r&&z<b.maxZ+r);
export const nearRoyalPrayer=(x,z)=>Math.hypot(x-ROYAL_TEMPLE.prayer.x,z-ROYAL_TEMPLE.prayer.z)<=ROYAL_TEMPLE.prayer.radius;
export function royalNavigation(nav){
 const next={...nav,colliders:[],footprints:[]};nav.colliders.forEach((b,i)=>{if(nav.footprints[i]?.object.startsWith('A02_Inn_016'))return;next.colliders.push(b);next.footprints.push(nav.footprints[i]);});
 // Intact keep stone base and raised stair podium. Side/rear paths stay open.
 // The portal is beside the right-hand stair foot, not against the solid front.
 for(const b of [[-18.2,18.2,-149.6,-123.4],[-13.3,13.3,-123.4,-110.9]]){next.colliders.push(b);next.footprints.push({object:'RoyalUbosot',polygons:[[[b[0],b[2]],[b[1],b[2]],[b[1],b[3]],[b[0],b[3]]]]});}
 return next;
}
export function sixDigitBlessing(randomWords=words=>globalThis.crypto.getRandomValues(words)){
 // Rejection sampling avoids modulo bias and preserves leading zeroes.
 const word=new Uint32Array(1),limit=4294000000;
 do{randomWords(word);}while(word[0]>=limit);
 return String(word[0]%1000000).padStart(6,'0');
}
