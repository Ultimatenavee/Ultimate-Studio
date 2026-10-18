/** Closed, conceptual facility enclosures. Reference scope: research/facility-reference-v63.json.
 * No vendor rating, internal circuit, fan arrangement or live operating state is implied.
 * The supplied box/label factories retain the scene's shared geometry and static batching.
 */
export function buildFacility({T,box,label,mat,scene}) {
 const steel=mat('#aeb7bb',.55,.42),dark=mat('#303b42',.5,.5),panel=mat('#c5cbcd',.38,.5),seam=mat('#19242b',.2,.65),grille=mat('#55636b',.4,.6);
 const groups=[];
 function enclosure(x,z,w,h,d,name){
  const g=new T.Group();g.name=name;g.position.set(x,0,z);g.userData={facility:true,conceptual:true};scene.add(g);groups.push(g);
  const b=(W,H,D,X,Y,Z,M=steel)=>box(W,H,D,X,Y,Z,M,g,true);
  // Recessed casing leaves room for front hardware inside the original obstacle bounds.
  b(w-.04,h-.12,d-.09,0,h/2+.04,-.015);b(w-.04,.08,d-.06,0,.09,0,dark);
  for(const X of [-w/2+.12,w/2-.12])for(const Z of [-d/2+.12,d/2-.12])b(.09,.08,.09,X,.04,Z,seam);
  b(w-.025,.025,d-.07,0,h-.005,-.015,panel);
  for(const X of [-w/2+.025,w/2-.025])b(.018,h-.15,d-.08,X,h/2+.04,-.015,panel);
  return {g,b,f:d/2-.035,w,h};
 }
 function handle(c,x,y){c.b(.028,.15,.025,x,y,c.f+.018,dark);for(const dy of [-.065,.065])c.b(.043,.018,.035,x,y+dy,c.f+.01,steel)}
 function slats(c,x,y,w,h,count){c.b(w,h,.018,x,y,c.f,seam);for(let i=0;i<count;i++)c.b(w-.018,.014,.014,x,y-h/2+.02+i*(h-.04)/(count-1),c.f+.012,grille)}
 function display(c,x,y){c.b(.23,.15,.022,x,y,c.f+.006,dark);c.b(.174,.094,.006,x,y+.009,c.f+.02,'#536d76');/* Unlit schematic screen, not telemetry. */c.b(.044,.007,.007,x+.06,y-.055,c.f+.02,steel)}
 for(const [i,z] of [-6,-3,0,3,6].entries()){
  const c=enclosure(6.95,z,1.25,2.25,1.05,i<2?'facility-ups-'+(i?'B':'A'):'facility-distribution-'+i);
  if(i<2){
   // Galaxy VL exterior reference: pale full-height door, recessed ventilation and dark display fascia.
   c.b(1.12,1.95,.025,0,1.2,c.f-.007,panel);
   slats(c,0,.99,.92,1.38,40);
   c.b(1.10,.29,.035,0,1.91,c.f-.002,dark);display(c,0,1.91);
   handle(c,-.515,1.15);
  }else{
   // Generic closed distribution board: no fabricated breaker ratings or electrical diagram.
   for(const x of [-.29,.29]){c.b(.557,1.98,.025,x,1.21,c.f-.005,panel);handle(c,x+(x<0?.20:-.20),1.15)}
   c.b(.012,1.94,.01,0,1.2,c.f+.008,seam);display(c,-.29,1.82);
   slats(c,0,.30,1.04,.18,5);
  }
  const a=enclosure(-7,z,1.22,2.685,1.1,'facility-room-cooling-'+i);
  // PDX/PCW reference: accessible sheet-metal panels and lower service plinth.
  a.b(1.12,2.37,.025,0,1.43,a.f-.008,dark);
  a.b(1.065,.83,.026,0,2.10,a.f+.002,steel);
  display(a,-.28,2.18);handle(a,.46,2.05);
  slats(a,0,1.08,1.04,1.11,27); // Generic return grille, not an asserted PDX configuration.
  a.b(1.065,.23,.024,0,.35,a.f+.001,steel);handle(a,.46,.35);
  // Fastener heads on removable external panels; closed interior deliberately omitted.
  for(const x of [-.48,.48])for(const y of [.27,.44,1.76,2.43])a.b(.012,.012,.007,x,y,a.f+.018,seam);
 }
 return groups;
}
