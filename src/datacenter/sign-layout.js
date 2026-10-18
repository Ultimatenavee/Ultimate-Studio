// Wrap at readable font sizes instead of clipping or horizontally compressing text.
export function signLayout(title,subtitle,{resolution=1024,small=false,titleSize=small?92:56,subtitleSize=small?56:30,padding=24,measure}={}){
 const factor=resolution/1024,pad=padding*factor,available=resolution-pad*2;
 const width=(text,size)=>{const n=measure?.(text,size*factor);return Number.isFinite(n)?n:Array.from(text).reduce((v,c)=>v+(c===' '? .28:/[ilI.,|]/.test(c)?.28:/[MW@]/.test(c)?.85:.56),0)*size*factor;};
 function wrap(text,size){const output=[];for(const paragraph of String(text??'').split('\n')){let line='';for(const word of paragraph.split(/\s+/)){if(!word)continue;const joined=line?line+' '+word:word;if(width(joined,size)<=available){line=joined;continue;}if(line){output.push(line);line='';}for(const c of word){if(line&&width(line+c,size)>available){output.push(line);line='';}line+=c;}}if(line)output.push(line);}return output;}
 const titleLines=wrap(title,titleSize),subtitleLines=wrap(subtitle,subtitleSize),gap=subtitleLines.length?14*factor:0,titleLineHeight=titleSize*factor*1.2,subtitleLineHeight=subtitleSize*factor*1.3;
 return {width:resolution,height:Math.ceil(pad*2+titleLines.length*titleLineHeight+gap+subtitleLines.length*subtitleLineHeight),padding:pad,titleSize:titleSize*factor,subtitleSize:subtitleSize*factor,titleLineHeight,subtitleLineHeight,gap,titleLines,subtitleLines};
}
