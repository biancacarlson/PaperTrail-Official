'use strict';
const LS=(k,d)=>{try{return localStorage.getItem(k)||d}catch(e){return d}};
const $=s=>document.querySelector(s),S={start:'North Park, San Diego, CA 92104',mode:'purchase',rec:null,records:[],sel:[],words:[],idle:15,img:null,z:1,x:0,y:0};
const est=r=>Parser.net30(r.endDate||r.jobDate);
const chk=()=>S.rec.location?true:(st('Enter the job location first.'),false);
const IOS=/iPhone|iPad|iPod/.test(navigator.userAgent);
const gurl=(r,c)=>(c?'googlechromes://':'https://')+'www.google.com/search?q='+encodeURIComponent('round trip driving distance from '+S.start+' to '+(r.location||''));
const N=v=>{const n=parseFloat(String(v).replace(/[$,]/g,''));return isNaN(n)?null:n},M=v=>v==null?'Not entered':'$'+v.toFixed(2);
const PF={purchase:[['date','Date'],['merchant','Merchant'],['number','Receipt/Invoice #'],['tax','Tax'],['extSub','Subtotal $'],['extTotal','Total $']],
freelance:[['employer','Employer'],['client','Client'],['jobDate','Job date'],['endDate','Event end date'],['location','Job location'],['roundTrip','Round-trip miles'],['hours','Regular hours'],['overtime','Overtime hours'],['amount','Amount $'],['invoice','Invoice #'],['notes','Notes']]};
function setMode(m){S.mode=m;S.rec=newRec();S.pages=[];S.undo=[];S.redo=[];{const dw=$('#docwrap');if(dw)dw.style.display='none'}$('.head h1').textContent=m=='purchase'?'':'New freelance job record';$('#m1').className=m=='purchase'?'on':'';$('#m2').className=m=='freelance'?'on':'';render();renderPages()}
const newRec=()=>({mode:S.mode,items:[],src:{},edited:{},loaded:false,doc:false,employer:S.mode=='freelance'?'AVLancer':''});
function manual(){dismissRestore();S.rec.loaded=true;render()}
/* ---------- lock (passcode hash via PBKDF2; screen lock only) ---------- */
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
async function hash(p,salt){const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(p),'PBKDF2',false,['deriveBits']);return hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:310000,hash:'SHA-256'},k,256))}
function lockUI(h){const L=$('#lock');L.style.display='block';$('#app').style.display='none';L.innerHTML=h}
let fails=0;
function wipe(){S.cleared=null;showRestore();snackHide();S.img=null;S.dim=null;S.records=[];S.words=[];S.sel=[];S.conf=null;S.home=null;['#view','#ocr','#print','#status'].forEach(i=>{const e=$(i);if(e){e.innerHTML='';e.textContent=''}});$('#docwrap').style.display='none';$('#file').value='';$('#copypanel').style.display='none';$('#copyta').value='';setMode(S.mode)}
var snT;function snackHide(){clearTimeout(snT);const e=$('#snack');if(e)e.style.display='none'}
function snack(m,fn){let e=$('#snack');if(!e){e=document.createElement('div');e.id='snack';document.body.appendChild(e)}e.innerHTML='<span></span><button></button>';e.firstChild.textContent=m;const b=e.lastChild;b.textContent='Undo';b.style.display=fn?'':'none';if(!fn)e.style.paddingRight='16px';else e.style.paddingRight='';b.onclick=()=>{snackHide();fn&&fn()};e.style.display='flex';clearTimeout(snT);snT=setTimeout(snackHide,10000)}
function clearAll(){const c={mode:S.mode,rec:S.rec,pages:S.pages,undo:S.undo,redo:S.redo,img:S.img,dim:S.dim,words:S.words,conf:S.conf};wipe();S.cleared=c;showRestore();snack('Record cleared',restoreCleared)}
function showRestore(){const b=$('#restore');if(b)b.style.display=S.cleared?'flex':'none'}
function dismissRestore(){S.cleared=null;showRestore()}
function restoreCleared(){const c=S.cleared;if(!c)return;if(S.rec&&S.rec.loaded&&!confirm('Replace what is on screen with the cleared record?'))return;S.cleared=null;
 Object.assign(S,{mode:c.mode,rec:c.rec,pages:c.pages,undo:c.undo,redo:c.redo,img:c.img,dim:c.dim,words:c.words,conf:c.conf,selM:null});
 $('#m1').className=S.mode=='purchase'?'on':'';$('#m2').className=S.mode=='freelance'?'on':'';$('.head h1').textContent=S.mode=='purchase'?'':'New freelance job record';
 if(S.mode!='purchase'&&S.img){showDoc(S.img);if(S.words&&S.words.length&&S.dim)drawWords(S.dim[0],S.dim[1])}
 render();renderPages();showRestore()}
async function lockNow(){clearTimeout(pt);S.key=null;wipe();try{await idb('del')}catch(e){}$('#lock').style.display='block';showLock()}
const PW={"s":"62f53ba61516d37ff300ce68df2b2afe","h":"ba82c58f3766e930b59ed2480c7f8db564f999a0e0f1a415a9dedd4cb2b2f32a","e":"7a8c7dd61c94dcf41108ee71ee436129"};
function showLock(){if(localStorage.getItem('lk'))return lockUI('<h2>Locked</h2><div class="msg">Too many wrong attempts. This app is locked on this device.</div>');lockUI('<h2>Enter passcode</h2><input id="pw" type="password" autocomplete="off"><button class="pri" onclick="unlock()">Log in</button><div id="lm" class="msg"></div>')}


async function unlock(){if(localStorage.getItem('lk'))return showLock();const o=PW,s=new Uint8Array(o.s.match(/../g).map(h=>parseInt(h,16)));
 if(await hash($('#pw').value,s)===o.h){localStorage.removeItem('lf');S.key=await dk($('#pw').value,o.e);try{await idb('del')}catch(e){}open_()}else{const f=(+localStorage.getItem('lf')||0)+1;localStorage.setItem('lf',f);if(f>=3){localStorage.setItem('lk','1');showLock()}else $('#lm').textContent='Wrong passcode. '+(3-f)+' attempt'+(3-f==1?'':'s')+' left.'}}
function open_(){try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}$('#lock').style.display='none';$('#app').style.display='block'}
let t;function bump(){clearTimeout(t);S.last=Date.now();t=setTimeout(lockNow,S.idle*60000)}document.addEventListener('visibilitychange',()=>{if(!document.hidden&&$('#app').style.display!='none'&&Date.now()-S.last>S.idle*60000)lockNow()});['touchstart','click','keydown'].forEach(e=>addEventListener(e,bump));
function setIdle(){S.idle=Math.max(1,+$('#idle').value||15);bump()}
/* ---------- upload / extract ---------- */
/* PDF text layer -> rows of word tokens. Glyph-level items (common in "print to PDF" files) are merged back into words by gap size. */
function pdfRows(items){const rows=[];items.forEach(i=>{if(!i.str)return;const fs=Math.hypot(i.transform[0],i.transform[1])||10,y=i.transform[5];let r=rows.find(r=>Math.abs(r.y-y)<4);if(!r){r={y,a:[]};rows.push(r)}const tot=Math.max(1,i.str.length);let pos=0;
 i.str.split(/(\s+)/).forEach(tok=>{if(tok!=='')r.a.push({s:tok,x:i.transform[4]+i.width*pos/tot,w:i.width*tok.length/tot,fs});pos+=tok.length})});
 rows.sort((p,q)=>q.y-p.y);
 return rows.map(r=>{r.a.sort((p,q)=>p.x-q.x);const toks=[];let cur=null,end=null,brk=false;
  r.a.forEach(p=>{if(!p.s.trim()){brk=true;return}const gap=end==null?0:p.x-end;
   if(cur&&!brk&&gap<.15*p.fs){cur.s+=p.s;cur.x1=p.x+p.w}else{cur={s:p.s,x0:p.x,x1:p.x+p.w,fs:p.fs,y:r.y,wide:end!=null&&gap>Math.max(10,p.fs*1.5)};toks.push(cur)}end=p.x+p.w;brk=false});return toks})}
function pdfLines(items){return pdfRows(items).map(r=>r.map((t,i)=>(i?(t.wide?'   ':' '):'')+t.s).join('')).filter(Boolean).join('\n')}
function pdfWords(items,vp){const out=[];pdfRows(items).forEach(r=>r.forEach(t=>{const X=v=>vp.transform[0]*v+vp.transform[4],Y=vp.transform[3]*t.y+vp.transform[5],h=t.fs*vp.scale;out.push({text:t.s,confidence:100,bbox:{x0:X(t.x0),y0:Y-h,x1:X(t.x1),y1:Y+h*.2}})}));return out}
/* light-gray text on white (e.g. iOS print-to-PDF invoices) is invisible to OCR; this turns it black */
function prep(c){const o=document.createElement('canvas');o.width=c.width;o.height=c.height;const x=o.getContext('2d');x.drawImage(c,0,0);const d=x.getImageData(0,0,o.width,o.height),p=d.data;for(let i=0;i<p.length;i+=4){const l=.299*p[i]+.587*p[i+1]+.114*p[i+2],v=l>=228?255:0;p[i]=p[i+1]=p[i+2]=v}x.putImageData(d,0,0);return o}
const st=m=>$('#status').textContent=m||'';
async function handle(f){if(!f)return;S.rec=newRec();S.pages=[];S.undo=[];S.redo=[];S.rec.loaded=true;S.rec.doc=true;S.sel=[];S.words=[];S.conf=null;st('Reading…');try{
 let canvas,text='',pw=[];
 if(f.type=='application/pdf'||/\.pdf$/i.test(f.name)){pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const pdf=await pdfjsLib.getDocument({data:await f.arrayBuffer()}).promise,pg=await pdf.getPage(1);
  let vp=pg.getViewport({scale:2}),one=0,tot=0;
  for(let n=1;n<=Math.min(pdf.numPages,10);n++){const c=await (await pdf.getPage(n)).getTextContent();c.items.forEach(i=>{const s=i.str.trim();if(s){tot++;if(s.length==1)one++}});text+=pdfLines(c.items)+'\n';if(n==1)pw=pdfWords(c.items,vp)}
  canvas=document.createElement('canvas');canvas.width=vp.width;canvas.height=vp.height;await pg.render({canvasContext:canvas.getContext('2d'),viewport:vp}).promise;
  if(text.trim().length<30)text=''}
 else if(/^image\//.test(f.type)){const b=await createImageBitmap(f),sc=Math.min(1,1600/Math.max(b.width,b.height));canvas=document.createElement('canvas');canvas.width=b.width*sc;canvas.height=b.height*sc;canvas.getContext('2d').drawImage(b,0,0,canvas.width,canvas.height)}
 else{return st('Unsupported file. Use PDF, JPG or PNG.')}
 S.img=canvas.toDataURL('image/jpeg',.85);S.dim=[canvas.width,canvas.height];showDoc(S.img);if(text&&pw.length){S.words=pw;drawWords(canvas.width,canvas.height)}
 {const key=S.rec.mode=='purchase'?['merchant','date','extTotal']:['jobDate','client','amount','location'],cnt=t=>{const f=Parser.parse(t||'',S.rec.mode).found;return key.filter(k=>f[k]).length},need=Math.min(3,key.length);
  const ocr=async c=>{const r=await Promise.race([Tesseract.recognize(c,'eng'),new Promise((_,j)=>setTimeout(()=>j(0),60000))]);return {t:r.data.text,w:(r.data.words||[]).filter(w=>w.text.trim()),c:r.data.confidence}};
  let best=text?{t:text,w:S.words,c:null,n:cnt(text)}:null;
  for(const pre of [0,1]){if(best&&best.n>=need)break;st('Running OCR on this device (first run downloads language data)…');try{const o=await ocr(pre?prep(canvas):canvas),n=cnt(o.t);if(!best||n>best.n)best={t:o.t,w:o.w,c:o.c,n}}catch(e){}}
  if(best&&best.t!==text){document.querySelectorAll('.wb').forEach(e=>e.remove());text=best.t;S.words=best.w;S.conf=best.c;drawWords(canvas.width,canvas.height)}}
 $('#ocr').textContent=text;parse(text);lowConf();if(S.rec.mode=='purchase'&&canvas){S.pages=[{id:++PGID,words:S.words,c:canvas,url:S.img,w:canvas.width,h:canvas.height,marks:autoHL(S.words,canvas.width,canvas.height)}];locate(S.pages[0],S.rec.items)}const q=[];if(S.conf!=null&&S.conf<70)q.push('Low scan quality ('+Math.round(S.conf)+'% confidence). Retake in good light if fields look wrong.');if(canvas&&Math.min(canvas.width,canvas.height)<500)q.push('Low-resolution image.');if(S.rec.mode=='purchase'&&/\bhours\b/i.test(text)&&/\brate\b/i.test(text)&&/position|event|crew|technician|labor/i.test(text))q.push('This looks like a freelance job. Tap Freelance Job above and upload again.');st(text.trim()?q.join(' ')||(Object.keys(S.rec.src).length?'':'Text was read but no fields matched. Enter values manually.'):'No text found. Enter values manually.');render();renderPages()
}catch(e){st('Extraction failed ('+((e&&e.message)||e||'unknown')+'). Enter values manually or try a clearer file.');showOcr();render()}}
function lowConf(){const r=S.rec;r.low={};(S.words||[]).length&&Object.keys(r.src).forEach(k=>{if(!r.src[k]||r[k]==null||typeof r[k]=='object')return;const t=String(r[k]).toLowerCase().split(/\s+/).filter(x=>x.length>1);if(t.some(x=>S.words.some(w=>w.confidence<60&&w.text.toLowerCase().includes(x))))r.low[k]=1})}
function drawWords(cw,ch){const L=$('#layer');if(!L)return;L.insertAdjacentHTML('beforeend',S.words.map((w,i)=>{const b=w.bbox;return `<div class="wb${w.confidence<60?' lowc':''}" data-i="${i}" style="left:${b.x0/cw*100}%;top:${b.y0/ch*100}%;width:${(b.x1-b.x0)/cw*100}%;height:${(b.y1-b.y0)/ch*100}%"></div>`}).join(''))}
const selText=()=>[...S.sel].sort((a,b)=>a-b).map(i=>S.words[i].text).join(' ');
function tapWord(el){if(!el||!el.dataset||el.dataset.i==null)return;const i=+el.dataset.i,k=S.sel.indexOf(i);k<0?S.sel.push(i):S.sel.splice(k,1);el.classList.toggle('sel');updBar()}
function clearSel(){S.sel=[];document.querySelectorAll('.wb.sel').forEach(e=>e.classList.remove('sel'));updBar()}
function updBar(){const s=getSelection(),ok=s&&!s.isCollapsed&&$('#ocr').contains(s.anchorNode);$('#addbar').style.display=(ok||S.sel.length)?'block':'none';$('#selt').textContent=S.sel.length?selText():''}
function showOcr(){$('#docwrap').style.display='block'}
function showDoc(u){showOcr();const v=$('#view');v.innerHTML='<div id="layer" style="position:absolute;top:0;left:0;width:100%;transform-origin:0 0"><img src="'+u+'" style="position:static;width:100%;display:block"></div>';const im=v.firstChild;S.z=1;S.x=S.y=0;const ap=()=>im.style.transform=`translate(${S.x}px,${S.y}px) scale(${S.z})`;im.style.width='100%';ap();
 const P=new Map();let d0=0;v.onpointerdown=e=>{v.setPointerCapture(e.pointerId);P.set(e.pointerId,e);d0=0;if(P.size==1){sx=e.clientX;sy=e.clientY;mv=0}else mv=1};let sx=0,sy=0,mv=0;v.onpointerup=e=>{const one=P.size==1&&!mv;P.delete(e.pointerId);if(one)tapWord(document.elementFromPoint(e.clientX,e.clientY))};v.onpointercancel=e=>P.delete(e.pointerId);
 v.onpointermove=e=>{const o=P.get(e.pointerId);if(!o)return;if(Math.hypot(e.clientX-sx,e.clientY-sy)>8)mv=1;if(P.size==2){const a=[...P.values()],d=Math.hypot(a[0].clientX-a[1].clientX,a[0].clientY-a[1].clientY);if(d0)S.z=Math.min(6,Math.max(1,S.z*d/d0));d0=d}else{S.x+=e.clientX-o.clientX;S.y+=e.clientY-o.clientY}P.set(e.pointerId,e);ap()}}
/* ---------- parsing (deterministic) ---------- */
function parse(t){const r=S.rec,o=Parser.parse(t,r.mode);Object.assign(r,o.fields);r.src=Object.assign(r.src,o.found);if(r.mode=='purchase')r.items=o.items}
/* ---------- form ---------- */
function render(){const r=S.rec;if(!r||!r.loaded){$('#form').innerHTML='';$('#calc').innerHTML='';$('#actions').style.display='none';renderRecs();return}
 const fs=PF[r.mode],sel=$('#addto');sel.innerHTML=fs.map(f=>`<option value="${f[0]}">${f[1]}</option>`).join('')+(r.mode=='purchase'?'<option value="+item">New item</option>':'');
 const lab=(k,l)=>`<label for="f_${k}">${l}${r.edited[k]?' (edited)':''}${miss(k)?' (needs review)':''}${r.low&&r.low[k]&&!r.edited[k]?' - low confidence, check':''}</label>`,
 W=['location','notes','number','client','employer'],
 fld=k=>{const l=(fs.find(f=>f[0]==k)||[])[1];return `<div class="f${W.includes(k)?' w':''}">`+lab(k,l)+(k=='notes'?`<textarea id="f_${k}" class="${String(r[k]??'').trim()?'ext':''}" rows="3" oninput="ed('${k}',this.value)">${esc(r[k])}</textarea>`:(inp=>k=='roundTrip'?`<div class="row" style="margin:0">${inp}<button class="pri" style="flex:0 0 auto" onclick="render()">Recalculate</button></div>`:inp)(`<input autocomplete="off" id="f_${k}" class="${String(r[k]??'').trim()?'ext':''}${miss(k)?' warn':''}" value="${esc(r[k])}" oninput="ed('${k}',this.value)">`))+(k=='roundTrip'?`<div class="srch"><a id="gs" class="btn" target="_blank" rel="noopener noreferrer" href="${esc(gurl(r))}" onclick="return chk()">Search round-trip distance</a></div>`:'')+'</div>'},
 G=r.mode=='purchase'?[['Receipt',['date','merchant','number']],['Amounts',['tax','extSub','extTotal']]]:[['',['employer','client','invoice']],['',['jobDate','endDate','location']],['Mileage',['roundTrip']],['Hours & pay',['hours','overtime','amount']],['',['notes']]];
 let h=G.map(([t,ks])=>`<section class="grp${t=='Amounts'?' amt':''}">${t?`<h3>${t}</h3>`:''}<div class="fg">${ks.map(fld).join('')}</div></section>`).join('');
 if(r.mode=='purchase')h+=itemsHtml();
 $('#form').className=r.mode;$('#form').innerHTML=h;$('#actions').style.display='block';calc();renderRecs();refreshActs()}
const esc=v=>String(v??'').replace(/"/g,'&quot;').replace(/</g,'&lt;'),miss=k=>{const r=S.rec;return r.doc&&!r[k]&&['date','merchant','client','jobDate','location','amount'].includes(k)};
function ed(k,v){S.rec[k]=v;if(k=='location'){const g=$('#gs'),c=$('#gc');if(g)g.href=gurl(S.rec);if(c)c.href=gurl(S.rec,1)}S.rec.edited[k]=1;const e=$('#f_'+k);if(e){const f=String(v).trim()!=='';e.classList.toggle('ext',f);e.classList.remove('usr');if(f)e.classList.remove('warn')}calc();if(k=='date')refreshActs()}
function it(i,k,v){S.rec.items[i][k]=k=='n'?v:N(v)||0;S.rec.items[i].ext=0;calc();const e=$('#it_'+i);if(e)e.textContent=M(S.rec.items[i].t)}
function r_del(i){S.rec.items.splice(i,1);render()}
/* ---------- calculation ---------- */
function compute(r){const o={};if(r.mode=='purchase'){const A=r.items;A.forEach(i=>i.t=+((i.q||0)*(i.p||0)).toFixed(2));const sm=a=>+a.reduce((s,i)=>s+i.t,0).toFixed(2);o.all=sm(A);o.sub=sm(A.filter(i=>!i.off));o.removed=+(o.all-o.sub).toFixed(2);o.nOff=A.filter(i=>i.off).length;const tx=N(r.tax)||0,sh=N(r.shipping)||0,k=o.all>0?o.sub/o.all:1;o.ship=+(sh*k).toFixed(2);o.tax=+(tx*k).toFixed(2);o.total=+(o.sub+o.ship+o.tax).toFixed(2);o.full=+(o.all+sh+tx).toFixed(2);o.warn=[];
 if(r.extSub&&Math.abs(N(r.extSub)-o.all)>0.01)o.warn.push('Item prices add up to '+M(o.all)+' but the receipt subtotal is '+M(N(r.extSub))+'. Check for a missed or misread item.');
 if(r.extTotal&&Math.abs(N(r.extTotal)-o.full)>0.01)o.warn.push('Calculated order total '+M(o.full)+' differs from the receipt total '+M(N(r.extTotal))+'.');
 if(r.expected&&A.length!=r.expected)o.warn.push('Receipt lists '+r.expected+' items; '+A.length+' found here.');
 if(r.tax===undefined||r.tax==='')o.warn.push('Tax not entered; total excludes tax.')}
 else{const rt=N(r.roundTrip),hr=N(r.hours),ot=N(r.overtime);o.rt=rt;o.tot=hr==null&&ot==null?null:+((hr||0)+(ot||0)).toFixed(2);o.rate=Parser.irs(r.jobDate);o.wear=rt!=null&&o.rate!=null?+(rt*o.rate).toFixed(2):null}return o}
function calc(){const r=S.rec;if(!r)return;const o=compute(r);
 const row=(l,v,sub)=>'<div class="crow"><div class="cl">'+l+'</div><div class="cv">'+v+(sub?'<small>'+sub+'</small>':'')+'</div></div>',
  us=d=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(d||''));return m?m[2]+'/'+m[3]+'/'+m[1]:d};
 let h='<div class="cal2"><h3>Calculated</h3>';
 if(r.mode=='purchase')h+='<div class="hero"><span>'+(o.nOff?'Work-related total':'Total')+'</span><b>'+M(o.total)+'</b>'+''+'</div>'+row('Items ('+(r.items.length-o.nOff)+')',M(o.sub))+(o.ship?row('Shipping',M(o.ship)):'')+row('Tax',M(N(r.tax)==null?null:o.tax),o.nOff&&N(r.tax)?'adjusted to work items':'')+o.warn.map(w=>'<div class="msg">⚠ '+w+'</div>').join('');
 else{const d=est(r);
  if(d)h+='<div class="hero"><span>Net-30 payout'+(r.endDate?'':' (estimate)')+'</span><b>'+us(d)+'</b><small>'+(r.endDate?'30 days after the event end date':'No event end date found, so counted from the job date')+'</small><button onclick="addCal()">Add to Calendar</button></div>';
  h+=row('Hours',o.tot==null?'Not entered':o.tot+' total',o.tot==null?'':(N(r.hours)||0)+' regular + '+(N(r.overtime)||0)+' overtime')
   +row('Round trip',o.rt==null?'Not entered':o.rt.toFixed(1)+' mi')
   +row('Mileage Deduction',M(o.wear),o.wear!=null?o.rt.toFixed(1)+' mi × $'+o.rate+'/mi<br>IRS standard mileage rate':o.rate==null&&o.rt!=null?'No IRS rate on file for this year':'')
   +'<div class="note">Recordkeeping info, not tax advice.</div>'}
 $('#calc').innerHTML=h+'</div>';persist()}
/* ---------- selection → field ---------- */
document.addEventListener('selectionchange',updBar);
function addSel(){const v=(S.sel.length?selText():getSelection().toString().trim()),k=$('#addto').value,r=S.rec;if(k=='+item'){const m=v.match(/(\d+[.,]\d{2})\s*$/);r.items.push({n:v.replace(/\$?\s?\d+[.,]\d{2}\s*$/,'').trim(),q:1,p:m?N(m[1].replace(',','.')):0});render()}else{r[k]=v.replace(/^\$/,'');r.edited[k]=1;render()}getSelection().removeAllRanges();clearSel()}
/* ---------- output ---------- */
const fm=v=>v==null?null:'$'+v.toFixed(2);
/* Uniform record layout (same for every log): title, info table, detail table (shaded), totals table.
   groups: [{k:'info'|'det'|'tot', rows:[[label,value]]}] */
const niceMerch=m=>{m=String(m||'').trim();return m.length>=4&&m===m.toUpperCase()&&/[A-Z]/.test(m)?m.toLowerCase().replace(/\b[a-z]/g,c=>c.toUpperCase()):m};
function rows(r){const o=compute(r),G=[],g=k=>{const x={k,rows:[]};G.push(x);return(l,v)=>{if(v!=null&&String(v).trim()!=='')x.rows.push([l,String(v).trim()])}};
 if(r.mode=='purchase'){const i=g('info');i('Date',r.date);i('Merchant',niceMerch(r.merchant));i('Receipt/Invoice #',r.number);
  const d=g('det');r.items.filter(x=>!x.off).forEach(x=>d((String(x.n||'Item').replace(/\s*(\.{2,}|…)\s*$/,'').trim()),M(x.t)));
  const t=g('tot');t('Subtotal',M(o.sub));if(o.ship)t('Shipping',M(o.ship));if(N(r.tax)!=null)t('Tax',M(o.tax));t('Total',M(o.total));
  return{t:'PURCHASE',G:G.filter(x=>x.rows.length)}}
 const i=g('info');i('Date',r.jobDate);i('Employer',r.employer);i('Client',r.client);i('Location',r.location);i('Invoice #',r.invoice);
 const d=g('det');d('Round-Trip Distance',o.rt!=null?o.rt.toFixed(1)+' mi':null);d('IRS Rate',o.rate!=null&&o.rt!=null?'$'+o.rate+'/mi':null);
 const t=g('tot');t('Amount Paid',fm(N(r.amount)));t('Mileage Deduction',fm(o.wear));
 return{t:'CALL SHEET',G:G.filter(x=>x.rows.length)}}
/* plain text (print + fallback) */
function text(r){const{t,G}=rows(r),out=['~ '+t+' ~'];G.forEach(x=>{out.push('');x.rows.forEach(([l,v])=>out.push(l+': '+v))});return out}
/* rich version for pasting into Google Docs / Word: three simple full-width tables */
const hx=v=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const TD='border:1px solid #000;padding:4pt 6pt;vertical-align:top;font-family:Arial,sans-serif;box-sizing:border-box;';
function html(r){const{t,G}=rows(r),sp='<p style="margin:0;font-size:6pt">&nbsp;</p>';
 return'<p style="margin:0 0 4pt 0;font-size:13pt;font-family:Arial,sans-serif"><b><u>'+hx(t)+'</u></b></p>'+G.map(x=>{const det=x.k=='det',info=x.k=='info',bg=det?'background-color:#f3f3f3;color:#434343;font-size:9pt;':'font-size:10pt;',w1=info?173:360,w2=info?287:100,cell=(w,txt)=>'<td width="'+w+'" style="'+TD+bg+'width:'+w+'px;font-weight:'+(w==w1?'bold':'normal')+'">'+hx(txt)+'</td>';
  return sp+'<table width="460" border="1" cellspacing="0" cellpadding="0" style="border-collapse:collapse;table-layout:fixed;width:460px"><colgroup><col width="'+w1+'"/><col width="'+w2+'"/></colgroup><tbody>'+x.rows.map(([l,v])=>'<tr>'+cell(w1,l)+cell(w2,v)+'</tr>').join('')+'</tbody></table>'}).join('')}
/* Copy: 1) clipboard API  2) hidden textarea + execCommand  3) visible selectable panel. Never fails silently. */
function copied(){$('#copypanel').style.display='none';st('');toast('Copied to clipboard');return true}
async function copyText(rs){const tx=rs.map(r=>text(r).join('\n')).join('\n\n');
const rh='<div style="font-family:Arial,sans-serif">'+rs.map(html).join('<p style="margin:0"><br></p>')+'</div>';
 try{const d=document.createElement('div');d.contentEditable='true';d.innerHTML=rh;d.style.cssText='position:fixed;top:0;left:0;width:500px;opacity:0;pointer-events:none;background:#fff';document.body.appendChild(d);const g=getSelection(),q=document.createRange();q.selectNodeContents(d);g.removeAllRanges();g.addRange(q);const k=document.execCommand('copy');g.removeAllRanges();d.remove();if(k)return copied()}catch(e){}
 try{if(navigator.clipboard&&navigator.clipboard.write&&window.ClipboardItem){await navigator.clipboard.write([new ClipboardItem({'text/html':new Blob([rh],{type:'text/html'}),'text/plain':new Blob([tx],{type:'text/plain'})})]);return copied()}}catch(e){}
 try{if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(tx);return copied()}}catch(e){}
 try{const a=document.createElement('textarea');a.value=tx;a.setAttribute('readonly','');a.style.cssText='position:fixed;top:0;left:0;opacity:0;font-size:16px';document.body.appendChild(a);a.focus();a.select();a.setSelectionRange(0,tx.length);const k=document.execCommand('copy');a.remove();if(k)return copied()}catch(e){}
 const ta=$('#copyta');ta.value=tx;$('#copypanel').style.display='block';$('#copymsg').textContent='Select and copy the text below';st('');ta.focus();ta.select();try{ta.setSelectionRange(0,tx.length)}catch(e){}$('#copypanel').scrollIntoView({block:'center'});return false}
/* Image copy: draws each record as one clean phone-sized card image (no tables), copies it as a PNG */
function paintRecs(x,rs,draw){const W=900,P=36,IN=26,F='Arial,Helvetica,sans-serif',CW=W-2*P-2*IN;let y=P;
 const wrap=(t,w)=>{const o=[];let l='';String(t).split(' ').forEach(wd=>{const n=l?l+' '+wd:wd;if(x.measureText(n).width>w&&l){o.push(l);l=wd}else l=n});if(l)o.push(l);return o};
 const rr=(a,b,w,h,r)=>{x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath()};
 rs.forEach((r,ri)=>{const{t,G}=rows(r);if(ri)y+=36;
  if(draw){x.font='bold 46px '+F;x.fillStyle='#111';x.textAlign='left';x.fillText(t,P,y+46);x.fillStyle='#45818e';x.fillRect(P,y+62,Math.ceil(x.measureText(t).width),6)}y+=98;
  G.forEach(g=>{const info=g.k=='info',det=g.k=='det',lw=CW*(info?.40:.66),vw=CW*(info?.58:.32);
   const L=g.rows.map(([l,v],i)=>{const last=g.k=='tot'&&i==g.rows.length-1,fs=last?32:28;
    x.font=(info?'':(det?'':'bold '))+(info?'26':fs)+'px '+F;const a=wrap(l,lw);
    x.font=(det?'':'bold ')+fs+'px '+F;const b=wrap(v,vw);return{a,b,fs,last,h:Math.max(a.length,b.length)*38+28}});
   const H=L.reduce((s,q)=>s+q.h,0);
   if(draw){rr(P,y,W-2*P,H,18);x.fillStyle=det?'#f3f4f6':'#fff';x.fill();x.lineWidth=2;x.strokeStyle='#d5dae0';x.stroke();
    let ry=y;L.forEach((q,i)=>{if(i){x.fillStyle=q.last?'#9aa4ad':'#e3e7ea';x.fillRect(P+IN,ry,W-2*P-2*IN,q.last?3:2)}
     x.fillStyle=info?'#5f6b76':'#111';x.font=(info?'':(det?'':'bold '))+(info?'26':q.fs)+'px '+F;if(det)x.fillStyle='#333';x.textAlign='left';
     q.a.forEach((s,k)=>x.fillText(s,P+IN,ry+14+36+k*38-10));
     x.fillStyle='#111';x.font=(det?'':'bold ')+q.fs+'px '+F;x.textAlign='right';
     q.b.forEach((s,k)=>x.fillText(s,W-P-IN,ry+14+36+k*38-10));ry+=q.h})}
   y+=H+24})});
 return y+P-24}
function recsBlob(rs){return new Promise((res,rej)=>{const c=document.createElement('canvas'),x=c.getContext('2d'),h=paintRecs(x,rs,false),K=Math.max(1,Math.min(4,Math.sqrt(15000000/(900*h))));c.width=Math.round(900*K);c.height=Math.round(h*K);x.scale(c.width/900,c.height/h);x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.fillStyle='#fff';x.fillRect(0,0,900,h);paintRecs(x,rs,true);c.toBlob(b=>b?res(b):rej(new Error('img')),'image/png')})}
async function copy(rs){
 try{if(navigator.clipboard&&navigator.clipboard.write&&window.ClipboardItem){await navigator.clipboard.write([new ClipboardItem({'image/png':recsBlob(rs)})]);return copied()}}catch(e){}
 try{const b=await recsBlob(rs),f=new File([b],'record.png',{type:'image/png'});if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f]});return true}}catch(e){}
 return copyText(rs)}
async function saveImg(){try{const b=await recsBlob([S.rec]),f=new File([b],'record.png',{type:'image/png'});
 if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f]});return}
 const u=URL.createObjectURL(b);window.open(u,'_blank')}catch(e){if(e&&e.name=='AbortError')return;toast('Could not save image')}}
function toast(m){$('#status').style.color='#0a0';$('#status').textContent=m;setTimeout(()=>{$('#status').textContent='';$('#status').style.color=''},2500)}
let ct;const copyRec=async()=>{if(await copy([S.rec])){const b=$('#cpbtn');b.textContent='Copied';clearTimeout(ct);ct=setTimeout(()=>b.textContent='Copy Clean Record',2500)}};
function saveRec(){S.records.push(JSON.parse(JSON.stringify(S.rec)));toast('Saved for this session');renderRecs()}
function key(r){const d=Parser.pd(r.date||r.jobDate);return d?+d:Infinity}
function renderRecs(){persist();$('#recs').innerHTML=S.records.length?`<h3>Saved (${S.records.length}, this session only)</h3><button class="pri" onclick="copy([...S.records].sort((a,b)=>key(a)-key(b)))">Copy All Records</button><button onclick="S.records=[];renderRecs()">Delete all</button>`:''}
function dl(f){const r=S.rec,o=compute(r);let d,n='record.'+f;if(f=='json')d=JSON.stringify({...r,calculated:o},null,1);else{const rows=r.mode=='purchase'?[['Item','Qty','Unit','Total'],...r.items.filter(i=>!i.off).map(i=>[i.n,i.q,i.p,i.t]),['Subtotal','','',o.sub],['Tax','','',N(r.tax)==null?'':o.tax],['Total','','',o.total]]:[['Field','Value'],...text(r).filter(l=>l.includes(': ')).map(l=>l.split(/: (.*)/s).slice(0,2))];d=rows.map(x=>x.map(c=>'"'+String(c??'').replace(/"/g,'""')+'"').join(',')).join('\n')}
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([d]));a.download=n;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}
function addCal(){const r=S.rec,d=est(r);if(!d)return;const e=d.replace(/-/g,''),n=Parser.net30(d,1).replace(/-/g,''),x=t=>String(t).replace(/[\\;,]/g,'\\$&').replace(/\n/g,' '),
 ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//PaperTrail//EN','BEGIN:VEVENT','UID:'+e+'-'+Date.now()+'@papertrail','DTSTAMP:'+new Date().toISOString().replace(/[-:]|\.\d+/g,''),'DTSTART;VALUE=DATE:'+e,'DTEND;VALUE=DATE:'+n,'SUMMARY:'+x('Net-30 payout'+(r.client?' - '+r.client:'')),'DESCRIPTION:'+x('Expected payment (net 30)'+(r.amount?'. Amount: '+M(N(r.amount)):'')),'BEGIN:VALARM','TRIGGER:-PT15H','ACTION:DISPLAY','DESCRIPTION:Payout due today','END:VALARM','END:VEVENT','END:VCALENDAR'].join('\r\n'),
 a=document.createElement('a');a.href=URL.createObjectURL(new Blob([ics],{type:'text/calendar'}));a.download='payout.ics';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}
function doPrint(){$('#print').textContent=text(S.rec).join('\n');print()}
/* ---------- encrypted autosave (AES-GCM, key from passcode, IndexedDB on this device) ---------- */
const idb=(m,v)=>new Promise((ok,no)=>{const q=indexedDB.open('bench',1);q.onupgradeneeded=()=>q.result.createObjectStore('s');q.onerror=()=>no(q.error);q.onsuccess=()=>{const d=q.result,tx=d.transaction('s',m=='get'?'readonly':'readwrite'),o=tx.objectStore('s'),r=m=='get'?o.get('state'):m=='put'?o.put(v,'state'):o.delete('state');tx.oncomplete=()=>{d.close();ok(r.result)};tx.onerror=()=>no(tx.error)}});
async function dk(p,e){const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(p),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt:new Uint8Array(e.match(/../g).map(h=>parseInt(h,16))),iterations:310000,hash:'SHA-256'},k,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
async function dec(x){return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:x.iv},S.key,x.c)))}
let pt;function persist(){}/* session-only: nothing is saved */
async function flush(){}
async function nuke(){if(!confirm('Clear the current session and any leftover saved data? Your passcode stays.'))return;try{await idb('del')}catch(e){}wipe();st('Saved data deleted.')}

setMode('purchase');showLock();bump();

addEventListener('dragover',e=>e.preventDefault());addEventListener('drop',e=>{e.preventDefault();handleFiles(e.dataTransfer.files)});
addEventListener('afterprint',()=>{$('#print').textContent=''});

/* Self-contained UI fixes: applied from app.js so they work even if an older index.html is still deployed */
(function(){const st=document.createElement('style');st.textContent=[
 '#ocr{display:none!important}',
 /* iOS Safari zooms the whole page when focusing an input under 16px, which pushes the right-hand borders off-screen */
 'input,select,textarea{font-size:16px!important}',
 'html,body{width:100%;max-width:100%;overflow-x:hidden}.shell,.main,.work,.src,.out,.drop,.grp{min-width:0;max-width:100%}',
 '.drop{position:relative}#actions{max-width:none!important}',
 '.cal2{background:var(--card);border:1px solid var(--ln);border-radius:16px;padding:18px}.cal2 h3{margin:0 0 12px}',
 '.cal2 .hero{background:var(--g);color:#fff;border-radius:12px;padding:16px;margin-bottom:4px}',
 '.cal2 .hero span{display:block;font:600 10px var(--mono);letter-spacing:.1em;text-transform:uppercase;opacity:.85}',
 '.cal2 .hero b{display:block;font-size:32px;letter-spacing:-.03em;line-height:1.15;margin:4px 0}',
 '.cal2 .hero small{display:block;opacity:.85;font-size:12px}',
 '.cal2 .hero button{margin-top:12px;width:100%;background:#fff;color:var(--gd);border-color:#fff}',
 '.cal2 .crow{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;padding:14px 0}.cal2 .hero+.crow,.cal2 h3+.crow{padding-top:12px}.cal2 .crow+.crow{border-top:1px solid var(--ln)}',
 '.cal2 .cl{font:600 11px var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--mut);padding-top:4px;white-space:nowrap}',
 '.cal2 .cv{text-align:right;font-size:18px;font-weight:700}.cal2 .cv small{display:block;font-size:12px;font-weight:400;color:var(--mut);margin-top:3px;line-height:1.4}',
 '.cal2 .note{font-size:12px;color:var(--mut);margin-top:4px}',
 '.cal2 .msg{background:var(--warn);color:#b3261e;border-radius:10px;padding:8px 10px;margin-top:10px}'
].join('');document.head.appendChild(st);
 
 /* replace the native iOS file control (it adds a grey thumbnail square and can widen the page) with a plain button */
 const f=document.getElementById('file');if(f&&!document.getElementById('pick')){f.style.cssText='position:absolute;width:1px;height:1px;opacity:0;pointer-events:none';const k=document.createElement('button');k.id='pick';k.type='button';k.textContent='Choose Files';k.style.cssText='background:var(--g);color:#fff;border-color:var(--g)';k.onclick=()=>f.click();f.parentNode.insertBefore(k,f)}})();

/* ---------- build 28: multi-screenshot purchases ---------- */
async function readImg(f){const b=await createImageBitmap(f),sc=Math.min(1,1600/Math.max(b.width,b.height)),c=document.createElement('canvas');c.width=b.width*sc;c.height=b.height*sc;c.getContext('2d').drawImage(b,0,0,c.width,c.height);
 let best={t:'',n:-1,w:[],c:null};
 for(const pre of [0,1]){try{const r=await Promise.race([Tesseract.recognize(pre?prep(c):c,'eng'),new Promise((_,j)=>setTimeout(()=>j(0),60000))]),t=r.data.text,p=Parser.parse(t,'purchase'),n=p.items.length+Object.keys(p.found).length;if(n>best.n)best={t,n,w:(r.data.words||[]).filter(w=>w.text.trim()),c:r.data.confidence};if(best.n>=5)break}catch(e){}}
 return{c,text:best.t,words:best.w,conf:best.c,url:c.toDataURL('image/jpeg',.85)}}
function handleFiles(fl){const a=[...(fl||[])];if(!a.length)return;dismissRestore();if(S.mode!='purchase'||a.some(f=>!/^image\//.test(f.type)))return handle(a[0]);return addShots(a)}
async function addShots(files){let r=S.rec;if(!r.doc){S.rec=r=newRec();r.loaded=true;r.doc=true;S.sel=[];S.words=[];S.pages=[];S.undo=[];S.redo=[]}r.shots=r.shots||0;let dup=0,bad=0;
 const kf=x=>String(x.n).toLowerCase().replace(/[^a-z0-9]/g,'')+'|'+x.p;
 for(let i=0;i<files.length;i++){st('Reading screenshot '+(i+1)+' of '+files.length+'… (first run downloads language data)');
  try{const o=await readImg(files[i]),P=Parser.parse(o.text,'purchase'),cur=r.shots++;S.pages.push({id:++PGID,words:o.words,c:o.c,url:o.url,w:o.c.width,h:o.c.height,marks:autoHL(o.words,o.c.width,o.c.height)});locate(S.pages[S.pages.length-1],P.items);
   if(cur===0){S.img=o.url;S.dim=[o.c.width,o.c.height];S.words=o.words;S.conf=o.conf;showDoc(o.url);drawWords(o.c.width,o.c.height)}
   Object.keys(P.fields).forEach(k=>{if(k=='merchant'?(P.found.mk||!r.merchant):(r[k]==null||r[k]===''))r[k]=P.fields[k]});
   Object.keys(P.found).forEach(k=>r.src[k]=1);
   P.items.forEach(x=>{const ex=r.items.find(y=>y.s!==cur&&kf(y)===kf(x));if(ex){dup++;if(x.pos)(ex.alts=ex.alts||[]).push(x.pos)}else r.items.push({...x,s:cur})})}
  catch(e){bad++}}
 $('#file').value='';S.undo=[];S.redo=[];render();renderPages();
 const n=r.items.length;
 if(bad||dup)st((bad?bad+' screenshot'+(bad>1?'s':'')+' could not be read. ':'')+(dup?'Skipped '+dup+' repeated line'+(dup>1?'s':'')+' from overlapping screenshots.':''));else toast(n+' item'+(n==1?'':'s')+' from '+r.shots+' screenshot'+(r.shots>1?'s':''))}
const FLUFF=/\b(?:Resettable|Portable|Compact|Thickened|Texture|Universal|Sports|Durable|Premium|Upgraded|Professional|Multifunctional)\b/gi;
function tidyName(n){let t=String(n||'').replace(/\bCombination\b/gi,'Combo').replace(/\b(\d+)\s?pes\b/gi,'$1pc').replace(/\s+\b(?:a|an|the)\b(?=\s)/gi,'').replace(/\bwith\b/gi,'w/').replace(/\s{2,}/g,' ').trim();
 const d=t.replace(FLUFF,'').replace(/\s{2,}/g,' ').trim();if(/[A-Za-z]{3,}/.test(d.replace(/\b(?:\d+pc|set|of)\b/gi,'')))t=d;
 const m=t.match(/^(\d+pc )(.+) Set$/i);if(m)t=m[1]+'Set of '+m[2];
 return t}
function itemsHtml(){const r=S.rec,on=r.items.filter(i=>!i.off).length;r.items.forEach(it=>{it.n=tidyName(it.n)});
 return '<section class="grp"><div class="ih"><h3>Items</h3><span class="chip">'+on+' of '+r.items.length+' work-related</span></div><div class="irh"><span class="a"></span><span class="b">Tap ✓ to exclude personal items</span><span class="c">Qty</span><span class="d">Price</span><span class="e"></span></div>'
 +r.items.map((it,i)=>`<div class="ir${it.off?' off':''}"><button class="ck" onclick="tog(${i})" aria-label="Include or exclude item">${it.off?'':'✓'}</button><input type="text" class="in" oninput="it(${i},'n',this.value)" value="${esc(it.n).replace(/"/g,'&quot;')}"><input class="q" type="number" inputmode="numeric" value="${it.q}" oninput="it(${i},'q',this.value)"><input class="p" type="number" inputmode="decimal" step="0.01" value="${it.p}" oninput="it(${i},'p',this.value)"><button class="x" onclick="r_del(${i})" aria-label="Delete item">✕</button></div>`).join('')
 +'<button class="addi" onclick="S.rec.items.push({n:\'\',q:1,p:0});render()">+ Add item</button><button class="lnk idb" onclick="idPhotos()">Identify unclear items from their photos</button><div id="idst" class="hint"></div>'+idHtml()+'</section>'}
function tog(i){const it=S.rec.items[i];pushU();it.off=!it.off;const r=autoRedact(it);render();if(r!=null)if(r=='none')snack('Could not find this item on the receipt. Redact it by hand.')}
(function(){const s=document.createElement('style');s.textContent='.irow{display:flex;gap:8px;align-items:center;margin-bottom:8px}.irow>*{min-width:0}.irow input:not(.q):not(.p){flex:1}.irow .q{flex:0 0 52px;padding-inline:6px;text-align:center}.irow .p{flex:0 0 78px;padding-inline:8px}.irow .x{flex:0 0 40px;padding-inline:0}.irow .ck{flex:0 0 40px;height:40px;padding:0;background:var(--g);color:#fff;border-color:var(--g);font-size:18px}.irow.off .ck{background:#fff;border-color:var(--ln)}.irow.off input{text-decoration:line-through;color:var(--mut);background:var(--card)}';document.head.appendChild(s);const f=document.getElementById('file');if(f){f.multiple=true;f.setAttribute('onchange','handleFiles(this.files)')}})();

/* ---------- build 29: receipt pages, redact / highlight, PDF ---------- */
var PM='s',FW=true,PH={s:'',r:'Drag down over an item to black it out. Tap a box to adjust it. Use Scroll to move around.',h:'Drag over text to highlight it. Tap a highlight to adjust it. Use Scroll to move around.'},
 HLRE=/^\W*(order\s*(id|no\.?|number|#|time|date|total)|sub\s?-?total|sales\s*tax|tax\b|(grand\s*)?total|amount\s*(due|paid)|date\b|invoice\s*(no|#|number|date)|receipt\s*(no|#|number))/i;
function wLines(ws){const a=(ws||[]).filter(w=>w.bbox).map(w=>({t:w.text,x0:w.bbox.x0,x1:w.bbox.x1,y0:w.bbox.y0,y1:w.bbox.y1,cy:(w.bbox.y0+w.bbox.y1)/2,hh:w.bbox.y1-w.bbox.y0})).sort((p,q)=>p.cy-q.cy),L=[];
 a.forEach(w=>{const g=L.find(l=>Math.abs(l.cy-w.cy)<Math.max(l.hh,w.hh)*.5);if(g){g.w.push(w);g.cy=(g.cy*(g.w.length-1)+w.cy)/g.w.length;g.hh=Math.max(g.hh,w.hh)}else L.push({cy:w.cy,hh:w.hh,w:[w]})});
 return L.map(l=>{l.w.sort((p,q)=>p.x0-q.x0);return{t:l.w.map(w=>w.t).join(' '),x0:Math.min(...l.w.map(w=>w.x0)),x1:Math.max(...l.w.map(w=>w.x1)),y0:Math.min(...l.w.map(w=>w.y0)),y1:Math.max(...l.w.map(w=>w.y1))}})}
function autoHL(ws,W,H){try{return wLines(ws).filter(l=>HLRE.test(l.t)&&/\d/.test(l.t)&&!/item|discount|bonus|saved|savings/i.test(l.t)).map(l=>{const x0=Math.max(0,l.x0-4),y0=Math.max(0,l.y0-3),x1=Math.min(W,l.x1+4),y1=Math.min(H,l.y1+3);return{t:'h',x:x0/W,y:y0/H,w:(x1-x0)/W,h:(y1-y0)/H}})}catch(e){return[]}}
function renderPages(){const el=$('#pages');if(!el)return;S.selM=null;
 if(S.mode!='purchase'||!S.pages.length){el.style.display='none';el.innerHTML='';refreshActs();return}
 $('#docwrap').style.display='none';el.style.display='block';
 el.innerHTML='<div class="ptool"><div class="seg">'+[['s','Scroll'],['r','Redact'],['h','Highlight']].map(([m,l])=>`<button class="pmb" data-m="${m}" onclick="setPM('${m}')">${l}</button>`).join('')+'</div><div class="prow"><button id="pun" onclick="undoMark()">↶ Undo</button><button id="pre" onclick="redoMark()">↷ Redo</button><button id="pslot" onclick="slotClick()"></button><button class="pri psave" onclick="savePdf()">Save PDF</button></div></div><div class="pinfo"><div id="phint" class="hint"></div><button class="lnk" onclick="clearMarks()">Clear all marks</button></div>'
 +S.pages.map((p,i)=>`<div class="pg"><div class="pgh"><span>Page ${i+1} of ${S.pages.length}</span><button onclick="rmPage(${i})">Remove</button></div><div class="pgi"><img src="${p.url}" alt="" draggable="false"><div class="ov" data-i="${i}"></div></div></div>`).join('')
 ;
 S.pages.forEach((_,i)=>drawMarks(i));bindOv();setPM(PM);refreshActs()}
function togFW(){FW=!FW;updTb()}
function slotClick(){S.selM?delSel():togFW()}
function updTb(){const u=$('#pun'),r=$('#pre'),sl=$('#pslot'),h=$('#phint');if(!u)return;u.disabled=!S.undo.length;r.disabled=!S.redo.length;const sel=!!S.selM;
 sl.style.display=(sel||PM=='r')?'':'none';sl.textContent=sel?'Delete':'Full width';sl.className=sel?'dng':(FW?'on':'');
 h.textContent=sel?'Box selected: drag a white dot to resize, drag inside to move, or tap Delete.':PH[PM]}
function setPM(m){PM=m;const p=$('#pages');if(!p)return;if(S.selM){const i=S.selM.i;S.selM=null;drawMarks(i)}p.className='m-'+m;p.querySelectorAll('.pmb').forEach(b=>b.classList.toggle('on',b.dataset.m==m));updTb()}
function selectMark(i,m){const o=S.selM;S.selM=m?{i,m}:null;if(o&&o.i!==i)drawMarks(o.i);drawMarks(i);updTb()}
function delSel(){const o=S.selM;if(!o)return;pushU();const pg=S.pages[o.i],k=pg.marks.indexOf(o.m);if(k>=0)pg.marks.splice(k,1);S.selM=null;drawMarks(o.i);updTb()}
function drawMarks(i){const o=document.querySelector('.ov[data-i="'+i+'"]');if(!o||!S.pages[i])return;const sm=S.selM;
 o.innerHTML=S.pages[i].marks.map((m,j)=>{const sel=sm&&sm.m===m;return `<div class="mk ${m.t}${sel?' sel':''}" data-j="${j}" style="left:${m.x*100}%;top:${m.y*100}%;width:${m.w*100}%;height:${m.h*100}%">${sel?'<i class="hd" data-k="t"></i><i class="hd" data-k="b"></i><i class="hd" data-k="l"></i><i class="hd" data-k="r"></i>':''}</div>`}).join('')}
function bindOv(){document.querySelectorAll('.ov').forEach(ov=>{const i=+ov.dataset.i,cl=v=>Math.min(1,Math.max(0,v)),pt=(e,b)=>[cl((e.clientX-b.left)/b.width),cl((e.clientY-b.top)/b.height)];
 ov.onpointerdown=e=>{if(PM=='s')return;ov.setPointerCapture(e.pointerId);const b=ov.getBoundingClientRect(),[x,y]=pt(e,b),hd=e.target.closest&&e.target.closest('.hd'),mk=e.target.closest&&e.target.closest('.mk'),pg=S.pages[i],d={x,y,b,mv:0,mode:'new'};
  if(hd&&S.selM&&S.selM.i==i){d.mode='rs';d.k=hd.dataset.k;d.m=S.selM.m;d.o={...d.m}}
  else if(mk){const m=pg.marks[+mk.dataset.j];if(!S.selM||S.selM.m!==m)selectMark(i,m);d.mode='mv';d.m=m;d.o={...m}}
  else if(S.selM)selectMark(i,null);
  ov._d=d};
 ov.onpointermove=e=>{const d=ov._d;if(!d)return;const[x,y]=pt(e,d.b),dx=x-d.x,dy=y-d.y;if(Math.hypot(dx*d.b.width,dy*d.b.height)>6)d.mv=1;if(!d.mv)return;
  if(d.mode=='new'){if(!d.el){d.el=document.createElement('div');d.el.className='mk tmp '+(PM=='r'?'r':'h');ov.appendChild(d.el)}
   const fw=PM=='r'&&FW;d.el.style.cssText=`left:${fw?0:Math.min(x,d.x)*100}%;top:${Math.min(y,d.y)*100}%;width:${fw?100:Math.abs(dx)*100}%;height:${Math.abs(dy)*100}%`}
  else if(d.mode=='mv'){if(!d.u){pushU();d.u=1}const o=d.o,m=d.m;m.x=Math.min(1-o.w,Math.max(0,o.x+dx));m.y=Math.min(1-o.h,Math.max(0,o.y+dy));drawMarks(i)}
  else{if(!d.u){pushU();d.u=1}const o=d.o,m=d.m,mw=12/d.b.width,mh=12/d.b.height;let l=o.x,t=o.y,r=o.x+o.w,b=o.y+o.h;
   if(d.k=='l')l=Math.min(r-mw,Math.max(0,o.x+dx));if(d.k=='r')r=Math.max(l+mw,Math.min(1,r+dx));if(d.k=='t')t=Math.min(b-mh,Math.max(0,o.y+dy));if(d.k=='b')b=Math.max(t+mh,Math.min(1,b+dy));
   m.x=l;m.y=t;m.w=r-l;m.h=b-t;drawMarks(i)}};
 ov.onpointerup=e=>{const d=ov._d;ov._d=null;if(!d)return;
  if(d.mode=='new'&&d.mv){const[x,y]=pt(e,d.b),fw=PM=='r'&&FW,m={t:PM=='r'?'r':'h',x:fw?0:Math.min(x,d.x),y:Math.min(y,d.y),w:fw?1:Math.abs(x-d.x),h:Math.abs(y-d.y)};
   if(m.w*d.b.width>10&&m.h*d.b.height>10){pushU();S.pages[i].marks.push(m);selectMark(i,m);return}}
  drawMarks(i)};
 ov.onpointercancel=()=>{ov._d=null;drawMarks(i)}})}
function snap(){const a=S.pages.map(p=>({p,m:JSON.parse(JSON.stringify(p.marks))}));a.off=(S.rec&&S.rec.items?S.rec.items:[]).map(i=>!!i.off);return a}
function pushU(){snackHide();S.undo.push(snap());if(S.undo.length>100)S.undo.shift();S.redo=[];updTb()}
function applySnap(sn){const its=S.rec&&S.rec.items||[];if(sn.off&&sn.off.length==its.length){const ch=its.some((it,k)=>!!it.off!==sn.off[k]);its.forEach((it,k)=>it.off=sn.off[k]);if(ch)render()}
 const same=sn.length==S.pages.length&&sn.every((x,k)=>x.p===S.pages[k]);S.pages=sn.map(x=>{x.p.marks=JSON.parse(JSON.stringify(x.m));return x.p});S.selM=null;
 if(same){S.pages.forEach((_,i)=>drawMarks(i));updTb()}else{const y=window.scrollY;renderPages();window.scrollTo(0,y)}}
function undoMark(){snackHide();if(!S.undo.length)return;S.redo.push(snap());applySnap(S.undo.pop());updTb()}
function redoMark(){if(!S.redo.length)return;S.undo.push(snap());applySnap(S.redo.pop());updTb()}
function clearMarks(){if(!S.pages.some(p=>p.marks.length))return;pushU();S.pages.forEach(p=>p.marks=[]);S.selM=null;S.pages.forEach((_,i)=>drawMarks(i));updTb();snack('Marks cleared',undoMark)}
function rmPage(i){if(!confirm('Remove page '+(i+1)+' from the PDF?'))return;pushU();S.pages.splice(i,1);renderPages()}
/* marks are burned into the pixels, so redacted areas cannot be recovered from the PDF or image */
function baked(p){const c=document.createElement('canvas');c.width=p.w;c.height=p.h;const x=c.getContext('2d');x.drawImage(p.c,0,0,p.w,p.h);
 x.globalCompositeOperation='multiply';x.fillStyle='#ffe600';p.marks.filter(m=>m.t=='h').forEach(m=>x.fillRect(m.x*p.w,m.y*p.h,m.w*p.w,m.h*p.h));
 x.globalCompositeOperation='source-over';x.fillStyle='#000';p.marks.filter(m=>m.t=='r').forEach(m=>x.fillRect(Math.floor(m.x*p.w),Math.floor(m.y*p.h),Math.ceil(m.w*p.w)+1,Math.ceil(m.h*p.h)+1));return c}
function rname(){const d=Parser.pd(S.rec&&S.rec.date),p=n=>String(n).padStart(2,'0');return(d?d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+' ':'')+'Receipt'}
function refreshActs(){const on=S.mode=='purchase'&&S.pages&&S.pages.length>0;document.querySelectorAll('.pdfx').forEach(b=>b.style.display=on?'':'none');const c=$('#cpbtn');if(c)c.classList.toggle('pri',!on)}
async function savePdf(){const J=window.jspdf&&window.jspdf.jsPDF;if(!J)return st('The PDF tool did not load. Check your connection and reload.');if(!S.pages.length)return;
 let d=null;S.pages.forEach(p=>{const W=595,H=+(W*p.h/p.w).toFixed(2),o=H>W?'p':'l',u=baked(p).toDataURL('image/jpeg',.92);if(!d)d=new J({unit:'pt',format:[W,H],orientation:o,compress:true});else d.addPage([W,H],o);d.addImage(u,'JPEG',0,0,W,H)});
 const n=rname()+'.pdf',f=new File([d.output('blob')],n,{type:'application/pdf'});
 if(IOS&&navigator.canShare&&navigator.canShare({files:[f]})){try{await navigator.share({files:[f],title:n});return}catch(e){if(e&&e.name=='AbortError')return}}
 const a=document.createElement('a');a.href=URL.createObjectURL(f);a.download=n;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);toast('Saved '+n)}
(function(){const s=document.createElement('style');s.textContent=[
 'html,body{overflow-x:clip!important}.src{position:static!important}',
 '.ptool{position:sticky;top:max(8px,env(safe-area-inset-top));z-index:6;background:var(--bg);padding:6px 0 8px}',
 '.seg{display:flex;gap:4px;background:#eeece5;border-radius:12px;padding:4px}.seg button{flex:1;border-color:transparent;background:transparent;padding:9px 6px;font-size:14px}.seg button.on{background:var(--g);color:#fff}.seg .pundo{flex:0 0 64px;color:var(--mut)}',
 '#phint{margin-top:6px}',
 '.pg{margin-bottom:16px}.pgh{display:flex;justify-content:space-between;align-items:center;font:600 11px var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--mut);margin-bottom:6px}.pgh button{background:transparent;border:0;color:var(--mut);text-decoration:underline;padding:4px 8px;font-weight:500;font-size:12px}',
 '.pgi{position:relative;border:1px solid var(--ln);border-radius:12px;overflow:hidden;background:#fff;line-height:0}.pgi img{width:100%;display:block;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}',
 '.ov{position:absolute;inset:0;pointer-events:none}.m-r .ov,.m-h .ov{pointer-events:auto;touch-action:none;cursor:crosshair}',
 '.mk{position:absolute}.mk.r{background:#000}.mk.h{background:rgba(255,230,0,.45);outline:1px solid rgba(200,160,0,.55)}.mk.tmp.r{background:rgba(0,0,0,.7)}',
 '.ih{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px}.ih h3{margin:0}.chip{font:600 11px var(--mono);color:var(--gd);background:var(--ext);border:1px solid #c9ddd1;border-radius:999px;padding:5px 10px;white-space:nowrap}',
 '.ic{display:flex;gap:10px;align-items:flex-start;padding:12px;border:1px solid var(--ln);border-radius:14px;background:#fff;margin-bottom:10px}.ic.off{background:var(--card);border-style:dashed}',
 '.ic .ck{flex:0 0 30px;width:30px;height:30px;padding:0;border-radius:50%;background:var(--g);color:#fff;border-color:var(--g);font-size:16px;line-height:1;margin-top:2px}.ic.off .ck{background:#fff;border-color:#c9c7bd}',
 '.ic .ib{flex:1;min-width:0}.ic .in{resize:none;border:0;padding:0;background:transparent;font-weight:600;line-height:1.35;border-radius:0}.ic .in:focus{outline:0;box-shadow:0 1px 0 var(--g)}',
 '.ic.off .in,.ic.off .tt b{text-decoration:line-through;color:var(--mut)}',
 '.il{display:flex;align-items:flex-end;gap:8px;margin-top:10px}.il .mf{flex:0 0 auto}.il .mf label,.il .tt label{margin-bottom:4px}.il .q{width:62px;padding-inline:6px;text-align:center}.il .p{width:92px;padding-inline:10px}.il .mx{padding-bottom:12px;color:var(--mut)}.il .tt{margin-left:auto;text-align:right}.il .tt b{display:block;font-size:17px;padding-bottom:9px}',
 '.ic .x{flex:0 0 30px;width:30px;height:30px;padding:0;background:transparent;border:0;color:var(--mut);font-size:15px}',
 '.addi{width:100%;background:transparent;border:1.5px dashed #cfcdc3;color:var(--gd);padding:12px}'
].join('');document.head.appendChild(s)})();

(function(){const s=document.createElement('style');s.textContent=[
 '.pg{margin-bottom:16px}.pgi{overflow:visible;margin:0 26px;-webkit-user-select:none;user-select:none}.pgi img{border-radius:11px}.pgh{padding:0 26px}',
 '.mk.r.sel{background:rgba(0,0,0,.5);outline:2px dashed #e5484d}.mk.h.sel{outline:2px dashed #b08900}',
 '.hd{position:absolute;width:48px;height:48px;margin:-24px 0 0 -24px;display:grid;place-items:center}.hd::before{content:"";width:22px;height:22px;border-radius:50%;background:#fff;border:3px solid #e5484d;box-shadow:0 1px 4px rgba(0,0,0,.35)}',
 '.hd[data-k=t]{left:50%;top:0}.hd[data-k=b]{left:50%;top:100%}.hd[data-k=l]{left:0;top:50%}.hd[data-k=r]{left:100%;top:50%}',
 '.prow{display:flex;gap:6px;margin-top:6px;align-items:center}.prow button{padding:8px 12px;font-size:13px;background:#fff}.prow button.on{background:var(--ext);color:var(--gd);border-color:#b9d2c4}.prow button:disabled{opacity:.4}.prow .psave{margin-left:auto;background:var(--g);color:#fff;border-color:var(--g)}',
 '.pdone{display:flex;flex-direction:column;gap:8px;margin:4px 0 8px}.pdone .pdfn{text-align:center}'
].join('');document.head.appendChild(s)})();

(function(){const s=document.createElement('style');s.textContent=[
 '.pinfo{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:12px}.pinfo .hint{flex:1}.lnk{background:transparent;border:0;color:var(--mut);text-decoration:underline;font-size:12px;padding:2px 4px;white-space:nowrap;font-weight:500}',
 '.prow{flex-wrap:wrap}.prow button{padding:8px 10px}.prow button.dng{color:#c0392b;border-color:#e0a59b}',
 '#restore{display:none;align-items:center;gap:8px;background:var(--usr);border:1px solid #ecd3a8;border-radius:12px;padding:10px 12px}#restore span{flex:1;font-weight:600;font-size:14px}#restore button{padding:8px 12px}#restore button:last-child{background:transparent;border:0;color:var(--mut);padding:8px}'
].join('');document.head.appendChild(s)})();

/* build 32: compact layout */
(function(){const s=document.createElement('style');s.textContent=[
 '.main{padding-top:10px}.head{margin-bottom:8px}.head h1{font-size:20px}',
 '.grp,.panel,.cal2{padding:12px;border-radius:12px}.grp h3,.cal2 h3{margin:0 0 8px}',
 '.out,#form{gap:10px}.fg{gap:8px}label{font-size:9.5px;margin-bottom:3px}',
 'input,select,textarea,button{padding:7px 10px;border-radius:8px}',
 '#form.purchase .fg{grid-template-columns:repeat(2,minmax(0,1fr))}#form.purchase .amt .fg{grid-template-columns:repeat(3,minmax(0,1fr))}#form.purchase .f.w{grid-column:1/-1}',
 '.drop{padding:12px}.drop small{font-size:12px;margin-bottom:8px}.drop button{margin-top:8px}',
 '.cal2 .hero{padding:10px 12px;border-radius:10px}.cal2 .hero b{font-size:24px;margin:2px 0}.cal2 .hero small{font-size:11px}',
 '.cal2 .crow{padding:7px 0;gap:10px}.cal2 .cl{font-size:10px;padding-top:2px}.cal2 .cv{font-size:15px}.cal2 .cv small{font-size:11px;margin-top:1px}.cal2 .msg{font-size:12px;padding:6px 8px;margin-top:6px}.cal2 .note{font-size:11px}',
 '.ih{margin-bottom:6px}.chip{font-size:10px;padding:3px 8px}',
 '.irh{display:flex;gap:6px;font:600 9px var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--mut);padding-bottom:4px}.irh .a{flex:0 0 26px}.irh .b{flex:1;min-width:0;text-transform:none;letter-spacing:0;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.irh .c{flex:0 0 30px;text-align:center}.irh .d{flex:0 0 52px;text-align:center}.irh .e{flex:0 0 20px}',
 '.ir{display:flex;align-items:center;gap:6px;padding:6px 0;border-top:1px solid var(--ln)}',
 '.ir .ck{flex:0 0 26px;width:26px;height:26px;padding:0;border-radius:50%;background:var(--g);color:#fff;border-color:var(--g);font-size:13px;line-height:1}.ir.off .ck{background:#fff;border-color:#c9c7bd}',
 '.ir .in{flex:1;min-width:0;resize:none;border:0;background:transparent;padding:2px;font-size:16px!important;font-weight:500!important;color:var(--fg);line-height:1.25;border-radius:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ir .in:focus{outline:0;box-shadow:0 1px 0 var(--g)}',
 '.ir .q{flex:0 0 34px;width:34px;padding:6px 2px;text-align:center;font-size:16px!important;font-weight:500!important}.ir .p{flex:0 0 70px;width:70px;padding:6px 4px;text-align:right;font-size:16px!important;font-weight:500!important}',
 '.ir .x{flex:0 0 20px;width:20px;height:26px;padding:0;background:transparent;border:0;color:var(--mut);font-size:13px}',
 '.ir.off{opacity:.55}.ir.off .in{text-decoration:line-through}',
 '.addi{padding:8px;margin-top:6px;font-size:13px}'
].join('');document.head.appendChild(s)})();

/* build 33: quieter buttons, Save PDF primary */
(function(){const s=document.createElement('style');s.textContent=[
 '.head h1:empty{display:none}.head:has(h1:empty):not(:has(#status:not(:empty))){display:none}',
 '#snack{display:none;position:fixed;left:50%;transform:translateX(-50%);top:calc(12px + env(safe-area-inset-top,0px));z-index:60;align-items:center;gap:14px;background:#232f3a;color:#fff;border-radius:999px;padding:8px 8px 8px 16px;font-size:14px;box-shadow:0 4px 16px rgba(0,0,0,.25);white-space:nowrap}#snack button{background:#fff;color:#232f3a;border:0;border-radius:999px;padding:6px 14px;font-weight:700}',
 '.seg button.on{background:#fff;color:var(--fg);box-shadow:0 1px 2px rgba(0,0,0,.18)}',
 '.nav button.on{background:#fff;color:var(--fg);box-shadow:0 1px 2px rgba(0,0,0,.18);border-color:var(--ln)}',
 '.prow button{background:transparent;border-color:var(--ln);color:var(--mut);font-weight:500;font-size:13px}.prow button.on{background:#fff;color:var(--fg);border-color:#bdbbb0}.prow button.dng{color:#c0392b}.prow .psave{background:var(--g);border-color:var(--g);color:#fff;font-weight:700}',
 '#pick{background:#fff!important;color:var(--fg)!important;border-color:var(--ln)!important;font-weight:600}',
 '.ir .ck{background:var(--ext);border-color:#b9d2c4;color:var(--gd)}.ir.off .ck{background:#fff;border-color:#c9c7bd}',
 '#cpbtn:not(.pri){background:#fff;color:var(--fg);border-color:var(--ln);font-weight:600}'
].join('');document.head.appendChild(s)})();

/* ---------- build 35: unchecking an item redacts it on the receipt ---------- */
var UID=0,PGID=0;
function nz(t){return String(t||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
/* find each item's title line on a page (normalized 0-1 position) */
function locate(pg,items){try{const L=wLines(pg.words).map(l=>({...l,n:nz(l.t),u:0}));
 (items||[]).forEach(it=>{const tk=nz(it.n0||it.n).split(' ').filter(t=>t.length>=3);if(!tk.length)return;const pr=((it.q||1)*(it.p||0)).toFixed(2);let best=null,bs=0;
  L.forEach(l=>{if(l.u)return;const f=tk.filter(t=>l.n.includes(t)).length/tk.length,sc=f+(l.t.replace(/[,\s]/g,'').includes(pr)?.15:0);if(f>=.6&&sc>bs){bs=sc;best=l}});
  if(best){best.u=1;it.id=it.id||++UID;it.pos={pid:pg.id,y0:best.y0/pg.h,y1:best.y1/pg.h}}})}catch(e){}}
function totalsTop(pg,y1){const l=wLines(pg.words).filter(l=>l.y0/pg.h>y1+.01&&/^\W*(sub\s?-?total|item\(s\)|items?\s*total|shipping|sales\s*tax|order\s*total|total|payment|amount)/i.test(l.t)).sort((a,b)=>a.y0-b.y0)[0];return l?l.y0/pg.h-.004:1}
/* returns [{pid,y,h}] row bands (full width) for every place this item appears */
function bandsFor(it){const O=[];S.rec.items.forEach(x=>[x.pos,...(x.alts||[])].filter(Boolean).forEach(p=>O.push({x,p})));const out=[],pad=.011;
 O.filter(o=>o.x===it).forEach(o=>{const pi=S.pages.findIndex(p=>p.id==o.p.pid),pg=S.pages[pi];if(!pg)return;
  const same=O.filter(q=>q.p.pid==o.p.pid).sort((a,b)=>a.p.y0-b.p.y0),k=same.indexOf(o),top=Math.max(0,o.p.y0-pad),last=k==same.length-1;let bot;
  if(!last)bot=same[k+1].p.y0-pad-.004;
  else{const hs=same.slice(1).map((q,j)=>q.p.y0-same[j].p.y0).sort((a,b)=>a-b),med=hs.length?hs[hs.length>>1]:null,lim=totalsTop(pg,o.p.y1);bot=Math.min(lim,med?o.p.y0+med-pad-.004:o.p.y1+.06,1)}
  if(bot-top>.01)out.push({pid:pg.id,y:top,h:bot-top});
  if(last){/* same item continues at the top of the next screenshot (overlapping scroll) */
   const np=S.pages[pi+1];if(np){const L=wLines(pg.words),sl=L.find(l=>l.y0/pg.h>=o.p.y1&&l.y0/pg.h<bot&&/^by\s+\S+/i.test(l.t)),sn=sl?nz(sl.t).replace(/^by\s+/,''):'';
    const nit=O.filter(q=>q.p.pid==np.id).map(q=>q.p.y0).sort((a,b)=>a-b)[0];
    if(sn.length>=3&&nit!=null){const NL=wLines(np.words),seller=NL.find(l=>l.y0/np.h<nit&&nz(l.t).includes(sn));
     if(seller){const hb=Math.max(0,...NL.filter(l=>l.y1<seller.y0&&(/safeguard|^\W*receipt\W*$|item details/i.test(l.t)||l.y1/np.h<.1)).map(l=>l.y1/np.h)),t2=hb+.003,b2=nit-pad-.004;if(b2-t2>.01)out.push({pid:np.id,y:t2,h:b2-t2})}}}}});
 return out}
/* unchecked -> black bars on the receipt; checked again -> bars removed. Returns 'on' | 'off' | 'none' */
function autoRedact(it){it.id=it.id||++UID;S.pages.forEach(p=>p.marks=p.marks.filter(m=>m.iid!==it.id));let res='on';
 if(it.off){const bs=bandsFor(it);bs.forEach(b=>S.pages.find(p=>p.id==b.pid).marks.push({t:'r',x:0,y:b.y,w:1,h:b.h,iid:it.id}));res=bs.length?'off':'none'}
 if(!S.pages.length)return null;S.selM=null;S.pages.forEach((_,i)=>drawMarks(i));updTb();return res}

/* ---------- build 38: name unclear items from the product photo (runs on this phone) ---------- */
const PHOTO_NOUNS=['wire cutters','pliers','screwdriver set','electric screwdriver','wrench set','socket set','hammer','tape measure','utility knife','scissors','flashlight','headlamp','work gloves','tool belt','tool bag','tool box','drill bit set','spirit level','multitool','zip ties','duct tape','electrical tape','extension cord','power strip','batteries','battery charger','phone charger','usb cable','phone holder','car phone mount','phone case','screen protector','earbuds','headphones','power bank','memory card','usb flash drive','webcam','mouse pad','keyboard cover','laptop stand','car door lock protector','door edge guard','door sill protector','car seat cover','steering wheel cover','car floor mat','license plate frame','car air freshener','dash cam','car sun shade','cleaning brush','windshield wiper','car vacuum','seat belt cover','trunk organizer','carbon fiber sticker','car trim strip','rearview mirror','cooling arm sleeves','knee brace','knee band','elbow brace','wrist brace','back brace','compression sleeve','safety glasses','ear plugs','face mask','hand warmer','neck gaiter','baseball cap','shoe insoles','shoe laces','combination lock','padlock','cable lock','bike lock','luggage lock','key chain','key ring','carabiner','notebook','pens','binder clips','sticky notes','label maker','stickers','adhesive hooks','double-sided tape','foam tape','furniture pads','felt pads','door bumpers','door stopper','drawer organizer','storage box','storage bag','trash bags','cleaning cloth','sponge','spray bottle','water bottle','lunch box','umbrella','desk organizer','cable organizer','velcro straps','rubber bands','magnets','wall hooks','rope','bungee cord','led lights','light bulb','lanyard','badge holder','sunscreen','lip balm','protective film','weather stripping','sealing strip','anti-slip pads','corner guards','cable clips','sandpaper','glue','super glue','paint brush','measuring cup','lighter','first aid kit','sunglasses','phone stand','tripod','selfie stick','pouch','backpack','wallet'];
const PH_KNOWN=new Set(['set','kit','cutters','pliers','belt','band','cover','lock','protector','guard','stickers','sticker','brace','sleeves','gloves','glasses']);
PHOTO_NOUNS.forEach(l=>{const w=l.split(' ');PH_KNOWN.add(w[w.length-1]);PH_KNOWN.add(w[w.length-1].replace(/s$/,''))});
const phTitle=l=>l.replace(/\b[a-z]/g,c=>c.toUpperCase());
function phVague(it){const w=String(it.n||'').toLowerCase().match(/[a-z]{3,}/g)||[];return !w.some(x=>PH_KNOWN.has(x)||PH_KNOWN.has(x.replace(/s$/,'')))}
let CLIPP=null;
function loadClip(){if(!CLIPP)CLIPP=import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2').then(m=>{m.env.allowLocalModels=false;return m.pipeline('zero-shot-image-classification','Xenova/clip-vit-base-patch32',{progress_callback:p=>{const e=$('#idst');if(e&&p&&p.status=='progress'&&/onnx/.test(p.file||''))e.textContent='Downloading the on-device model (one time, stays on this phone) '+Math.round(p.progress||0)+'%'}})}).catch(e=>{CLIPP=null;throw e});return CLIPP}
function itemThumb(it){const b=bandsFor(it)[0];if(!b)return null;const pg=S.pages.find(p=>p.id==b.pid);if(!pg||!pg.c)return null;
 const sy=Math.max(0,Math.round(b.y*pg.h)),side=Math.max(16,Math.min(Math.round(b.h*pg.h),Math.round(pg.w*.5),pg.h-sy)),c=document.createElement('canvas');c.width=c.height=224;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,224,224);x.drawImage(pg.c,0,sy,side,side,0,0,224,224);return c}
function phApply(it,label){const m=String(it.n||'').match(/^(\d+pc\s+)/i),pre=m?m[1]:'',rest=String(it.n||'').replace(/^\d+pc\s*/i,'').replace(/^Set of\s+/i,'').trim(),ws=rest.split(/\s+/).filter(Boolean);return pre+(ws.length&&ws.length<=2?rest+' ':'')+phTitle(label)}
async function idPhotos(){const its=S.rec.items.filter(phVague),e=()=>$('#idst');
 if(!its.length){if(e())e().textContent='Every item name already looks clear.';return}
 if(e())e().textContent='Loading the on-device model (first time downloads about 100 MB)…';
 let clf;try{clf=await loadClip()}catch(x){if(e())e().textContent='Could not load the on-device model. Check your connection and try again.';return}
 S.idRes=S.idRes||[];let n=0;
 for(const it of its){if(S.idRes.some(r=>r.it===it))continue;const th=itemThumb(it);if(!th)continue;
  if(e())e().textContent='Looking at item '+(++n)+' of '+its.length+'…';
  try{const hint=(String(it.n||'').toLowerCase().match(/[a-z]{4,}/g)||[]).map(w=>w.replace(/s$/,'')),out=await clf(th.toDataURL('image/jpeg',.9),PHOTO_NOUNS,{hypothesis_template:'a product photo of a {}'}),
   sc=out.map(r=>({l:r.label,s:r.score*(hint.some(h=>r.label.includes(h))?1.6:1)})).sort((a,b)=>b.s-a.s).slice(0,3);
   S.idRes.push({it,th:th.toDataURL('image/jpeg',.8),opts:sc.map(r=>r.l)})}catch(x){}}
 render();const e2=e();if(e2)e2.textContent=S.idRes.some(r=>S.rec.items.includes(r.it))?'':'Could not tell from the photos. Type the name in yourself.'}
function idHtml(){const L=(S.idRes||[]).filter(r=>S.rec.items.includes(r.it));if(!L.length)return'';
 return '<div class="idp"><div class="hint">Photo guesses. Tap the right one, or type the name yourself.</div>'+L.map(r=>{const a=S.idRes.indexOf(r);return `<div class="idr"><img src="${r.th}" alt=""><div class="idm"><div class="idn">${esc(r.it.n)}</div><div class="idc">${r.opts.map((o,b)=>`<button onclick="idPick(${a},${b})">${esc(phTitle(o))}</button>`).join('')}<button class="skp" onclick="idSkip(${a})">Skip</button></div></div></div>`}).join('')+'</div>'}
function idPick(a,b){const r=S.idRes[a];if(!r)return;pushU();r.it.n=phApply(r.it,r.opts[b]);S.idRes.splice(a,1);render()}
function idSkip(a){S.idRes.splice(a,1);render()}
(function(){const s=document.createElement('style');s.textContent='.idb{display:block;margin:10px auto 0}.idr{display:flex;gap:10px;align-items:center;padding:8px 0;border-top:1px solid var(--ln)}.idr img{width:56px;height:56px;border-radius:8px;object-fit:cover;border:1px solid var(--ln);flex:0 0 56px}.idm{flex:1;min-width:0}.idn{font-size:12.5px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--mut);margin-bottom:6px}.idc{display:flex;flex-wrap:wrap;gap:6px}.idc button{font-size:12.5px;padding:5px 10px;border-radius:999px}.idc .skp{background:transparent;border:0;color:var(--mut);text-decoration:underline}';document.head.appendChild(s)})();
