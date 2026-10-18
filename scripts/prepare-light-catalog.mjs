import fs from 'node:fs';
const base='web/assets/ayothaya/light-catalog',db=JSON.parse(fs.readFileSync(base+'/inventory.json'));
const regions={'거북이섬':'Turtle Island','글래스트':'Glast Heim','나무잡초꽃':'Nature props','내부소품':'Interior props','니플헤임':'Niflheim','대만':'Gonryun','동굴마을':'Cave village','등대섬':'Lighthouse island','라헬':'Rachel','러시아':'Moscovia','리히타르젠':'Lighthalzen','모로코':'Morroc','무명섬':'Nameless Island','사막도시':'Desert city','아요타야':'Ayothaya','아인브로크':'Einbroch','알베르타':'Alberta','외부소품':'Town props','유노추가':'Yuno','인던01':'Dungeon 01','인던02':'Dungeon 02','일본':'Amatsu','전장':'Battleground','중국':'Louyang','지하감옥':'Underground prison','크리스마스마을':'Lutie','타나토스':'Thanatos','토르화산':'Thor Volcano','페이욘':'Payon','프론테라':'Prontera','해변마을':'Comodo','휘겔':'Hugel','흑마법사방':'Wizard room','히나마쯔리':'Hinamatsuri'};
const groups={street:'เสาไฟถนน',standing:'โคมตั้ง / โคมถือ',hanging:'โคมแขวน / โคมระย้า',wall:'โคมติดผนัง',fire:'เชิงเทียน / คบไฟ / เตาผิง',lab:'ไฟแล็บ / อุตสาหกรรม',signal:'เสาไฟฟ้า / ไฟสัญญาณ',other:'อาคาร / ชิ้นส่วนอื่น'};
const picks={L047:'โคมหินทรงศาลา',L107:'เสาไฟคู่ Malaya',L228:'เสาโคมเดี่ยว Lighthalzen',L139:'เสาโคมสามดวง Prontera',L266:'เสาโคมหิน Amatsu',L294:'โคมกระดาษตั้งพื้น',L213:'โคมแขวนลายทอง',L241:'โคมระย้าอโยธยา',L269:'โคมแดง Louyang',L003:'โคมติดผนังทรงกระบอก',L005:'ตะเกียงมีหูหิ้ว',L188:'โคมแดงบนก้านไม้ไผ่'};
const forced={L047:'standing',L213:'hanging',L241:'hanging',L269:'hanging',L294:'standing',L188:'hanging',L198:'other',L217:'other',L218:'other',L219:'other',L249:'other',L149:'other',L266:'street',L170:'lab',L171:'lab',L181:'lab',L182:'lab',L183:'lab'};
for(const item of db.items){
 const name=item.name.toLowerCase();item.regionLabel=regions[item.region]||item.region.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
 item.category=forced[item.id]||(/전봇|전신주|신호등|경보등|비상등/.test(name)?'signal':/street|가로등|외부등/.test(name)?'street':/wall|벽/.test(name)?'wall':/chandelier|샹들|천정|천장|celight|stringlight/.test(name)?'hanging':/candle|candel|torch|fireplace|bonfire|brazier|촛|횃|화로/.test(name)?'fire':/robot|lighting|조명/.test(name)||['sch_lab','gevent'].includes(item.region)?'lab':'standing');
 item.categoryLabel=groups[item.category];item.label=picks[item.id]||item.categoryLabel+' · '+item.regionLabel;item.suggested=!!picks[item.id];item.current=['L047','L026','L027','L013','L241','L233','L238'].includes(item.id);
 const bytes=fs.readFileSync(base+'/'+item.file),gltf=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());item.missingTextures=(gltf.materials||[]).filter(m=>m.name?.startsWith('missing:')).map(m=>m.name.slice(9));
 item.status=item.error||item.previewError?'error':item.missingTextures.length?'missing':item.category==='other'?'other':'ready';
}
db.groups=groups;db.summary={ready:db.items.filter(i=>i.status==='ready').length,missing:db.items.filter(i=>i.status==='missing').length,other:db.items.filter(i=>i.status==='other').length};
fs.writeFileSync(base+'/catalog.json',JSON.stringify(db,null,2));console.log(db.summary);
