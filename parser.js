'use strict';
/* v89 self-update: the iPhone Home Screen app keeps its own cached copy of the page and ignores no-cache hints. On launch, ask the server (bypassing the cache) which version is current;
   if it is newer than this file, re-download every file once and reload. Runs from parser.js so even an old cached index.html picks it up. Once per session, so it can never loop. */
(function(){var V=89;try{if(typeof window==='undefined'||!window.fetch||!navigator.onLine||sessionStorage.getItem('pt_upd'))return;
 fetch('index.html',{cache:'reload'}).then(function(r){return r.text()}).then(function(h){var m=h.match(/parser\.js\?v=(\d+)/);if(!m||+m[1]<=V)return;
  try{sessionStorage.setItem('pt_upd','1')}catch(e){}
  return Promise.all(['parser.js','scan.js','app.js'].map(function(f){return fetch(f+'?v='+m[1],{cache:'reload'})})).then(function(){location.reload()})}).catch(function(){})}catch(e){}})();
/* Deterministic receipt/invoice parser. Pure function: parse(text, mode) -> {fields, items, found}. Never invents values. */
(function(root){
const fix=s=>s.replace(/(?<=\d)[Oo](?=\d|\b)/g,'0').replace(/(?<=\d)[lI](?=\d)/g,'1');
const PRICE=/(-?\$?\s?\d{1,3}(?:,\d{3})*[.,]\d{2}|-?\$?\s?\d+[.,]\d{2})\s*-?\s*[A-Z]{0,2}\d?\s*$/;
const num=s=>{let n=parseFloat(s.replace(/[$\s]/g,'').replace(/,(?=\d{3})/g,'').replace(',','.'));return isNaN(n)?null:n};
const MON='(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\\.?';
const DATE=new RegExp('\\b(\\d{4}-\\d{2}-\\d{2}|\\d{1,2}[\\/.\\-]\\d{1,2}[\\/.\\-]\\d{2,4}|'+MON+'\\s+\\d{1,2},?\\s+\\d{4}|\\d{1,2}\\s+'+MON+'\\s+\\d{4})\\b','i');
/* v89: a date must be a real date. "1/1.00" (Items/Quantity) used to pass as one, which also stopped the photo re-read. */
const MONS=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
function okDate(s){s=String(s).trim();let m=s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
 if(m)return +m[2]>=1&&+m[2]<=12&&+m[3]>=1&&+m[3]<=31&&+m[1]>=1990&&+m[1]<=2100;
 m=s.match(/^(\d{1,2})([\/.\-])(\d{1,2})\2(\d{2}|\d{4})$/);
 if(m){const y=+m[4];return +m[1]>=1&&+m[1]<=12&&+m[3]>=1&&+m[3]<=31&&(m[4].length==4?y>=1990&&y<=2100:y>=1)}
 m=s.match(/(\d{1,2}),?\s+\w+\.?\s+(\d{4})$/)||s.match(/\w+\.?\s+(\d{1,2}),?\s+(\d{4})$/);
 return m?(+m[1]>=1&&+m[1]<=31&&+m[2]>=1990&&+m[2]<=2100):true}
/* "dct 9, 2026" / "0ct 9 2026": month word damaged by one letter, but day and year are clear */
function fuzzyDate(l){const m=String(l).match(/(?:^|[^A-Za-z0-9])([A-Za-z0]{3,4})\.?\s*(\d{1,2})\s*[,.)]?\s*[,.]?\s*(20\d\d)\b/),Y=new Date().getFullYear();if(!m||+m[2]<1||+m[2]>31||+m[3]>Y||+m[3]<Y-5)return null;/* a damaged read must still land on a recent year */
 const t=m[1].toLowerCase().replace(/0/g,'o').slice(0,3);let best=-1,bd=9,tie=false;
 MONS.forEach((x,i)=>{let d=0;for(let k=0;k<3;k++)if(x[k]!==t[k])d++;if(d<bd){bd=d;best=i;tie=false}else if(d===bd)tie=true});
 if(bd>1||tie||t.length<3)return null;return MONS[best][0].toUpperCase()+MONS[best].slice(1)+' '+(+m[2])+', '+m[3]}
/* a purchase date is recent and not in the future: OCR turns 2026 into 2006 or 2028, and a wrong date is worse than an empty field */
const recentDate=s=>{const d=pd(s);if(!d)return false;const n=new Date();return d.getFullYear()>=n.getFullYear()-7&&d<=new Date(n.getFullYear(),n.getMonth(),n.getDate()+2)};
const findDate=(l,fz)=>{const g=new RegExp(DATE.source,'gi');for(const m of String(l).matchAll(g))if(okDate(m[1])&&recentDate(m[1]))return m[1];return fz===false?null:fuzzyDate(l)};
const PAY=/\b(visa|mastercard|master card|amex|american express|discover|debit|credit|cash|check|cheque|paypal|venmo|zelle|ach|apple pay|direct deposit)\b/i;
const SKIP=/\bchange\b|cash tender|tendered|\b(?:credit|debit)\s*card\b|\bcard\s*(?:#|no\b|number|ending|\*|x{2,}|\d{4})|visa|mastercard|amex|debit|balance due|thank|\bauth|\bref\b|approval|points|savings total|you saved/i;
const LBL=/^(?:bill(?:ed)?\s*to|client|employer|customer|company|job|event|service|work|invoice|payment|pay|location|venue|address|site|hours|total|amount|mileage|miles|distance|fuel|gas|date|paid|one[\s-]*way|round[\s-]*trip|wear|vehicle|net|gross)\b/i;
const PK=/^\d+(?:\/\d+)+\s*pcs?$/i;
/* payment methods printed with an amount (Apple Pay $19.92, Google Pay, PayPal...) are how the order was paid, never products */
const WALLET=/\b(?:apple|google|samsung|shop|amazon|click\s*to)\s*pay\b|\bg\s?pay\b|pay\s?pal|\bvenmo\b|\bzelle\b|\bklarna\b|\bafterpay\b|\baffirm\b|\bcash\s?app\b|\bpay\W*$|\bpaid\s+on\b|one-?click\s+pay/i;
/* Turn a raw OCR'd marketplace title into a readable product name. v = variant line (e.g. "Blue 2") */
/* ALL-CAPS brand words (4+ letters) become Title case: DURATECH -> Duratech. Short ones (LED, USB) stay. */
const uncap=s=>String(s).replace(/\b[A-Z]{4,}\b/g,w=>w[0]+w.slice(1).toLowerCase());
const cleanName=(n,v,keep)=>{let t=n.replace(/\s{2,}/g,' ').trim().split(' ');
 /* truncated by the app ("Wire Cutters Se..."): drop the ellipsis and any cut-off fragment glued to it */
 let last=t[t.length-1]||'';if(/(\.{2,}|\u2026)$/.test(last)){const b=last.replace(/(\.{2,}|\u2026)$/,'');if(b)t[t.length-1]=b;else t.pop();}
 /* product-photo text read in front of the title: stray 1-2 letter bits, "OPCS", etc. */
 while(!keep&&t.length>2&&(/^[^\w]*$/.test(t[0])||(t[0].length<=2&&!/\d/.test(t[0])&&!/^[AI]$/.test(t[0]))||/^[O0]pcs$/i.test(t[0])))t.shift();
 if(/^A(?=p(?:cs?|es)$)/.test(t[0]||''))t[0]='4'+t[0].slice(1);
 /* "2pcs 2/5/10pcs ...": the photo's count echoed in front of the pack options */
 if(t.length>2&&/^\d+p(?:cs|es)$/i.test(t[0])&&PK.test(t[1])){t[0]=t[0].replace(/pes$/i,'pcs');t.splice(1,1)}
 /* "2/5/10pcs ..." with variant "Blue 2": the number in the variant is the pack actually bought */
 else if(t.length&&PK.test(t[0])&&v){const opts=t[0].match(/\d+/g),m=(v.match(/\b\d+\b/g)||[]).find(x=>opts.includes(x));if(m)t[0]=m+'pcs'}
 let s=t.join(' ').replace(/\s+\S{0,3}\s+(?:sold|shipped)\s*by\b.*$/i,'').replace(/\s*(?:sold|shipped)\s*by\b.*$/i,'');
 const seen=new Set();s=s.split(' ').filter(w=>{const k=w.toLowerCase().replace(/[^a-z0-9]/g,'');if(k.length<4)return true;if(seen.has(k))return false;seen.add(k);return true}).join(' ');
 return uncap(s.replace(/[\s|\\\/_~.]+$/,'').replace(/\s*[-\u2013\u2014,:;]+\s*$/,'').trim())};

/* Short, readable product name from a cleaned marketplace title + variant line. Rules only; never invents a product. */
const WORDS=['Set','Kit','Protector','Protectors','Protective','Combination','Mirror','Stickers','Sticker','Holder','Band','Brace','Bag','Case','Cover','Cutters','Screwdriver','Organizer','Charger','Cable','Adapter','Lights','Light','Clips','Clip','Pads','Pad','Storage','Handle','Strap','Gloves','Wrench','Pliers','Tape','Brush','Cleaner','Insoles','Lock'];
const comp=f=>{const l=f.toLowerCase();if(l.length<2)return null;if(WORDS.some(w=>w.toLowerCase()==l))return f;return WORDS.find(w=>w.toLowerCase().startsWith(l))||null};
function shortName(title,v,cut){let t=title.split(' ').filter(Boolean),q=null,set=false;
 const di=t.findIndex((x,i)=>i>0&&/^[-\u2013\u2014]$/.test(x));if(di>0){t=t.slice(0,di);cut=false}
 if(cut&&t.length>1){const f=t[t.length-1],c=/^[A-Za-z]+$/.test(f)?comp(f):null;if(c)t[t.length-1]=c;else t.pop()}
 const vm=v&&v.match(/\b(\d+)\s*(?:pcs?|pieces?)\b/i);if(vm)q=+vm[1];
 const out=[];for(let i=0;i<t.length;i++){const x=t[i];
  let m=x.match(/^(\d+)\s?(?:pcs?|pes|pieces?)$/i);if(m){if(q==null)q=+m[1];continue}
  if(PK.test(x)){continue}
  if(/^\d+$/.test(x)&&/^set$/i.test(t[i+1]||'')){if(q==null)q=+x;continue}
  if(/^set$/i.test(x)){set=true;continue}
  if(/^\d+(?:\.\d+)?-?(?:inch|in|cm|mm)$/i.test(x))continue;
  if(/^(a|an|the)$/i.test(x))continue;
  out.push(x)}
 let n=out.join(' ').replace(/\bCombination\b/gi,'Combo').replace(/\bProfessional\b/gi,'Pro').replace(/\bMultifunctional\b/gi,'Multi');if(/^[a-z]/.test(n))n=n.replace(/\b[a-z](?=[a-z]{2})/g,c=>c.toUpperCase());
 if(!n)return title;
 const qs=q>1?q+'pc ':'';
 if(set)return q>1?qs+'Set of '+n:n+' Set';
 return qs+n}
const readable=n=>((n.match(/[A-Za-z]/g)||[]).length>=3)&&!/^\W*(items?|qty|quantity|price)\W*$/i.test(n);
/* price typed with a space instead of a point: '10 00', '4. 99', '$4 99' */
const np=l=>PRICE.test(l)?l.replace(/(\d)\s?[.,]\s+(\d{2})(?=\s*-?\s*[A-Z]{0,2}\d?\s*$)/,'$1.$2'):l.replace(/^(.*[A-Za-z]{3}.*?)\s\$?(\d{1,3})\s(\d{2})(\s*-?\s*[A-Z]{0,2})\s*$/,(m,a,d,c,f)=>+c<=99&&!/\d\s*$/.test(a)?a+' '+d+'.'+c+f:m);
/* words that mean a line is part of the totals/payment block, never a product name */
const NOTNAME=/\b(?:subt?\s?-?tota[l1jy|\]]|total|tax|balance|change|cash|tender(?:ed)?|amount|due|visa|master\s?card|amex|debit|credit|payment|savings|discount|coupon|shipping|thank|receipt|survey|cashier|store|tel|phone|www|order|invoice|date|time|register)\b|^\W*\d+(?:[\s\-.,]|$)/i;
function lines(t){const L=t.replace(/\r/g,'').replace(/\t/g,'   ').replace(/\u00a0/g,' ').split('\n').map(s=>s.trim()).filter(Boolean),out=[];
 for(let i=0;i<L.length;i++){if(/^[A-Za-z][A-Za-z &\/#.\-]{1,30}$/.test(L[i])&&LBL.test(L[i])&&i+1<L.length&&!LBL.test(L[i+1])&&L[i+1].split(/\s{3,}/).length===1){out.push(L[i]+': '+L[i+1]);i++;continue}
  const seg=L[i].split(/\s{3,}/);
  if(seg.length>1&&seg.filter(x=>LBL.test(x)).length>=2){const nx=i+1<L.length?L[i+1].split(/\s{3,}/):[];
   if(seg.every(x=>LBL.test(x)&&!/[:\d]/.test(x))&&nx.length===seg.length){seg.forEach((x,k)=>out.push(x+': '+nx[k]));i++;continue}
   seg.forEach(x=>out.push(x));continue}
  out.push(L[i])}
 return out}
const ONLYP=/^-?\$?\s?\d{1,6}[.,]\d{2}$/,QTY=/\d+\s*[x@]\s*\$?\d+[.,]\d{2}$/;
/* OCR sometimes emits a price column after all the labels: pair loose prices with price-less labels, in order, only when counts match. */

/* Summary labels with their prices split onto separate lines (right-aligned price column): pair them in order. */
const SUMLBL=/^\W*(?:item\(s\)\s*subtotal|items?\s*subtotal|subt?\s?-?tota[l1jy|\]]|shipping(?:\s*&\s*handling)?|total before tax|estimated tax(?:\s*to be collected)?|(?:sales\s*)?tax|rewards?\s*points?|promotion(?:\s*applied)?|discount|gift card|grand total|order total|total)\s*:?\s*$/i;
function pairSummary(L){const li=[];L.forEach((l,i)=>{if(SUMLBL.test(l))li.push(i)});if(li.length<2)return L;
 const last=li[li.length-1],pr=[];for(let i=last+1;i<L.length&&pr.length<li.length;i++){if(ONLYP.test(fix(L[i])))pr.push(i);else if(pr.length)break}
 if(pr.length!==li.length)return L;const out=L.slice();li.forEach((i,k)=>{out[i]=L[i].replace(/\s*:?\s*$/,': ')+L[pr[k]]});pr.forEach(i=>out[i]=null);return out.filter(x=>x!=null)}
function pairColumns(L){
 const isLab=(l,i)=>i>0&&!ONLYP.test(l)&&/[A-Za-z]{3}/.test(l)&&(!PRICE.test(l)||QTY.test(l))&&!DATE.test(l)&&!/paid|thank|invoice|receipt|card|tel|phone|www|total|tax|balance|change|cash/i.test(l)&&!/[:@]/.test(l);
 let f=-1;for(let i=0;i<L.length;i++){if(ONLYP.test(L[i])&&i+1<L.length&&ONLYP.test(L[i+1])){f=i;break}}
 if(f<0)return L;let e=f;while(e<L.length&&ONLYP.test(L[e]))e++;const k=e-f;
 const lab=[];for(let i=f-1;i>0&&lab.length<k;i--){if(isLab(L[i],i))lab.unshift(i);else if(lab.length&&!ONLYP.test(L[i]))break}
 if(lab.length!==k)return L;
 const out=L.slice();lab.forEach((i,n)=>{out[i]=L[i]+' '+L[f+n]});for(let i=f;i<e;i++)out[i]=null;return out.filter(x=>x!=null)}
function label(L,re){for(let i=0;i<L.length;i++){const m=L[i].match(re);if(m){const v=(m[1]||'').trim();if(v)return v;if(L[i+1])return L[i+1]}}return null}
function dateNear(L,re){for(const fz of [false,true])for(const l of L)if(re.test(l)){const m=findDate(l,fz);if(m)return m}return null}
const firstDate=L=>{for(const fz of [false,true])for(const l of L){const m=findDate(l,fz);if(m)return m}return null};
/* Unlabeled document numbers. Register receipts print a bare number under the barcode (store + register + transaction + date, e.g. "0214 03 40317 0928 26"): it is the receipt number even though no label says so. Only the last lines are searched; phones, dates, prices, card/auth lines and item UPCs are skipped. */
function bareNo(L){const z=y=>y.replace(/[Oo]/g,'0').replace(/[Il]/g,'1'),BADL=/\b(?:auth(?:orization)?|appr(?:oval)?|aid|acct|account|rrn|terminal|batch|visa|mastercard|amex|card|tel|phone|fax|zip)\b/i,
 RX=/^\W*((?:[\dOoIl]+[ \-]){2,}[\dOoIl]+|[\dOoIl]{12,}|\d{2,4}-\d{6,})\W*$/;
 for(let i=L.length-1;i>=Math.max(0,L.length-10);i--){const l=L[i];if(BADL.test(l)||DATE.test(l)||PRICE.test(l))continue;const m=l.match(RX);if(!m)continue;
  const raw=m[1].trim().replace(/\s+/g,' '),g=raw.split(/[ \-]/),dg=z(raw).replace(/\D/g,'');
  if(dg.length<10||dg.length>24||!/\d{3}/.test(z(raw)))continue;
  if(g.length==4&&g[0].length==1&&g[1].length==5&&g[2].length==5&&g[3].length==1)continue;/* item UPC-A (0 47821 30956 3) */
  if(/^\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/.test(z(raw)))continue;/* phone */
  return z(raw)}
 return null}
/* Invoice-style number with no label word: a line that is just "#1042" / "No. 1042", or a prefixed token such as INV-2026-0042. */
function looseNo(L){for(const l of L){const m=l.match(/^\s*(?:no\.?|n[o\u00ba\u00b0]|#)\s*[:.]?\s*([A-Z]{0,4}-?\d{3,}[A-Z0-9\-]*)\W*$/i)||l.match(/\b(?:invoice|receipt)\s*:\s*#?\s*([A-Z]{0,4}-?\d{3,}[A-Z0-9\-]*)\s*$/i)||l.match(/\b((?:INV|RCPT|REC|ORD|PO)[-\s]?\d{3,}[A-Z0-9\-]*)\b/);if(!m)continue;const d=m[1].match(DATE);if(d&&d.index===0)continue;return m[1].replace(/\s+/g,'-')}return null}
function invNo(L,tr){const re=new RegExp('\\b(?:invoice|inv|receipt|order|ticket'+(tr?'|trans(?:action)?':'')+')\\s*(?:no\\.?|number|num|#|id)\\s*[:#.]?\\s*([A-Z0-9][A-Z0-9\\-]*\\d[A-Z0-9\\-]*)','i'),re2=/\b(?:invoice|receipt)\s+#?\s*([A-Z]{0,4}-?\d{3,}[A-Z0-9\-]*)/i;
 for(const l of L)for(const r of [re,re2]){const m=l.match(r);if(!m)continue;const d=l.slice(m.index+m[0].length-m[1].length).match(DATE);if(d&&d.index===0)continue;return [0,m[1]]}
 if(tr){/* register receipts: TRN 40317, TXN: 0092, TR# 03294, TC# 4827 3092 1184, CHECK 1042, REF 55102 (card lines are skipped) */
  const T2=/\b(?:(?:trn|trm|trh|irn|txn|tran|trans(?:action)?|chk|check|sale|sls|rcpt)\s*(?:no\.?|num(?:ber)?|id|#)?|(?:tr|tc)\s*#)\s*[:#.]?\s*([\dOoIl][\dOoIl\-]{2,}(?:\s[\dOoIl]{2,}){0,4})(?![\d:\/])/i,FIXN=x=>{x=x.trim();if(!/\d/.test(x))return null;const g=x.split(/\s+/),z=y=>y.replace(/[Oo]/g,'0').replace(/[Il]/g,'1');return g.every(y=>y.length==4)?g.map(z).join(' '):g.map(z).join('')},T3=/\b(?:ref(?:erence)?)\s*(?:no\.?|num(?:ber)?|id|#)?\s*[:#.]?\s*(\d[\d\-]{3,})(?![\d:\/])/i,BAD=/\b(?:auth(?:orization)?|appr(?:oval)?|aid|acct|account|rrn|terminal|batch|visa|mastercard|amex)\b/i;
  const bn=bareNo(L);if(bn)return [0,bn];
  for(const r of [T2,T3])for(const l of L){if(BAD.test(l))continue;const m=l.match(r);if(!m)continue;const d=l.slice(m.index+m[0].length-m[1].length).match(DATE);if(d&&d.index===0)continue;const fx=FIXN(m[1]);if(fx)return [0,fx]}}
 const ln=looseNo(L);if(ln)return [0,ln];
 return null}
/* tax flag letters printed after prices (T taxable, F or N non-taxable). A legend such as "T = TAXABLE  F = NON-TAXABLE" overrides the defaults. */
function taxFlags(text){const nt=new Set(['N','F','E']),tx=new Set(['T','X','A','B','Y']);
 for(const m of String(text).matchAll(/\b([A-Z])\s*=\s*(non[\s-]?tax\w*|tax[\s-]?(?:free|exempt)|exempt|food|grocer\w*|tax\w*)/gi)){const c=m[1].toUpperCase(),w=m[2].toLowerCase();if(/^(non|tax[\s-]?(free|exempt)|exempt|food|grocer)/.test(w)){nt.add(c);tx.delete(c)}else{tx.add(c);nt.delete(c)}}
 return l=>l?(nt.has(l)?0:tx.has(l)?1:undefined):undefined}


/* ---------- city & state ---------- */
const ST='AL|AK|AZ|AR|CA|CO|CT|DE|DC|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY';
const HASST=new RegExp(',\\s*(?:'+ST+')\\b');
const STREETW=/^(?:st|street|ave|avenue|blvd|boulevard|rd|road|dr|drive|ln|lane|way|hwy|highway|pkwy|parkway|ct|court|pl|place|sq|suite|ste|unit|fl|floor|plaza|center|centre|mall|bldg|building)\.?$/i;
/* First "City, ST 12345" (or "City ST 12345", or "City, ST") found in the given lines; a zip code is preferred. Returns "City, ST" or null. Never guesses a city. */
const NOTCITY=/^(?:thanks?|thank|hello|hi|dear|sorry|please|yes|no|sir|welcome|regards|cheers|total|paid|subtotal|balance)$/i;
function cityState(L){const rx=[new RegExp(',\\s*('+ST+')\\b\\s+\\d{5}(?:-\\d{4})?','g'),new RegExp('\\s('+ST+')\\s+\\d{5}(?:-\\d{4})?\\b','g'),new RegExp(',\\s*('+ST+')\\b','g')];
 for(const re of rx)for(const line of L){re.lastIndex=0;let m;while((m=re.exec(line))){
  const toks=line.slice(0,m.index).trim().split(/\s+/),city=[];
  for(let i=toks.length-1;i>=0&&city.length<3;i--){if(/[:|,]$/.test(toks[i]))break;const w=toks[i].replace(/^[^A-Za-z]+|[^A-Za-z.'\-]+$/g,'');if(!/^[A-Z][A-Za-z.'\-]*$/.test(w)||STREETW.test(w)||NOTCITY.test(w)||/\d/.test(toks[i]))break;city.unshift(w)}
  if(city.length){const c=city.join(' ');return (c===c.toUpperCase()&&c.length>3?tcase(c.toLowerCase()):c)+', '+m[1]}}}
 return null}


/* \"City\" on one line and \"California, 92110\" (state spelled out) on the next. OCR often damages a letter or two, so the state name is matched loosely. */
const STN={alabama:'AL',alaska:'AK',arizona:'AZ',arkansas:'AR',california:'CA',colorado:'CO',connecticut:'CT',delaware:'DE',florida:'FL',georgia:'GA',hawaii:'HI',idaho:'ID',illinois:'IL',indiana:'IN',iowa:'IA',kansas:'KS',kentucky:'KY',louisiana:'LA',maine:'ME',maryland:'MD',massachusetts:'MA',michigan:'MI',minnesota:'MN',mississippi:'MS',missouri:'MO',montana:'MT',nebraska:'NE',nevada:'NV','new hampshire':'NH','new jersey':'NJ','new mexico':'NM','new york':'NY','north carolina':'NC','north dakota':'ND',ohio:'OH',oklahoma:'OK',oregon:'OR',pennsylvania:'PA','rhode island':'RI','south carolina':'SC','south dakota':'SD',tennessee:'TN',texas:'TX',utah:'UT',vermont:'VT',virginia:'VA',washington:'WA','west virginia':'WV',wisconsin:'WI',wyoming:'WY'};
const lev=(a,b)=>{const d=[...Array(b.length+1).keys()];for(let i=1;i<=a.length;i++){let p=d[0];d[0]=i;for(let j=1;j<=b.length;j++){const t=d[j];d[j]=Math.min(d[j]+1,d[j-1]+1,p+(a[i-1]===b[j-1]?0:1));p=t}}return d[b.length]};
/* first three zip digits -> state (USPS ranges); only a fallback when the state's name is too damaged to read */
const ZR=[[5,5,'NY'],[10,27,'MA'],[28,29,'RI'],[30,38,'NH'],[39,49,'ME'],[50,59,'VT'],[60,69,'CT'],[70,89,'NJ'],[100,149,'NY'],[150,196,'PA'],[197,199,'DE'],[200,205,'DC'],[206,219,'MD'],[220,246,'VA'],[247,268,'WV'],[270,289,'NC'],[290,299,'SC'],[300,319,'GA'],[320,349,'FL'],[350,369,'AL'],[370,385,'TN'],[386,397,'MS'],[398,399,'GA'],[400,427,'KY'],[430,459,'OH'],[460,479,'IN'],[480,499,'MI'],[500,528,'IA'],[530,549,'WI'],[550,567,'MN'],[570,577,'SD'],[580,588,'ND'],[590,599,'MT'],[600,629,'IL'],[630,658,'MO'],[660,679,'KS'],[680,693,'NE'],[700,714,'LA'],[716,729,'AR'],[730,749,'OK'],[750,799,'TX'],[800,816,'CO'],[820,831,'WY'],[832,838,'ID'],[840,847,'UT'],[850,865,'AZ'],[870,884,'NM'],[889,898,'NV'],[900,961,'CA'],[967,968,'HI'],[970,979,'OR'],[980,994,'WA'],[995,999,'AK']];
function zipState(z){const p=+String(z).slice(0,3),r=ZR.find(([a,b])=>p>=a&&p<=b);return r?r[2]:null}
function stateOf(tok){const t=tok.toLowerCase().replace(/[^a-z ]/g,'').trim();if(t.length<5)return null;if(STN[t])return STN[t];let best=null,bd=9;for(const n in STN){if(Math.abs(n.length-t.length)>2)continue;const d=lev(t,n);if(d<bd){bd=d;best=n}}return best&&bd<=(best.length>=8?2:1)?STN[best]:null}
function cityStateName(L){for(let i=1;i<L.length;i++){const m=L[i].match(/^\W{0,2}([A-Za-z]{3,14}(?:\s[A-Za-z]{3,10})?)\s*(,)?\s*(\d{5}(?:-\d{4})?)?/);if(!m||!(m[2]||m[3]))continue;
  let st=null;for(const tk of [m[1],m[1].split(' ')[0]]){st=stateOf(tk);if(st)break}
  if(!st&&m[3])st=zipState(m[3]);/* state word unreadable but the zip is clear */
  if(!st)continue;
  const prev=L[i-1].replace(/^(?:\W*[A-Za-z0-9]\b\W*)+/,'').replace(/^[^A-Za-z]+/,'').replace(/[^A-Za-z]+$/,'').replace(/(?:\s+[A-Za-z])+$/,'').trim();
  if(!/^[A-Za-z][A-Za-z .'\-]{2,24}$/.test(prev)||STREETW.test(prev.split(' ').pop())||NOTCITY.test(prev))continue;
  const c=prev.replace(/\s+/g,' ');return (c===c.toUpperCase()?tcase(c.toLowerCase()):c)+', '+st}return null}
/* ---------- merchant + item-block helpers (layout-agnostic: Amazon app/web, Temu, receipts without a logo line) ---------- */
const KNOWN=/\b(temu|amazon|walmart|target|costco|home depot|lowe's|lowes|best buy|harbor freight|staples|aliexpress|shein|ebay|etsy|walgreens|cvs|ikea|wayfair|newegg|adorama|sweetwater|guitar center|autozone|o'reilly|michaels|ace hardware|office depot|trader joe's|whole foods|safeway|kroger|7-eleven|starbucks|uber|lyft|doordash|apple|b&h)\b/i;
const tcase=s=>s.replace(/(^|[\s'-])[a-z]/g,c=>c.toUpperCase());
/* a word printed in the text, allowing one damaged letter: "sdgoodwill.ong", "G00dwill" */
function fuzzyHas(text,w){const n=w.length;for(const tk of String(text).toLowerCase().split(/\s+/)){const t=tk.replace(/[^a-z0-9]/g,'');if(t.length<n-1)continue;
 for(const len of [n-1,n,n+1])for(let i=0;i+len<=t.length;i++)if(lev(t.slice(i,i+len),w)<=1)return true}return false}
const UIJUNK=/item details|order id|order time|payment|search|ask a question|\?|order details|order summary|ordered on|order placed|order\s*#|items? ordered|buy it again|your orders|sign in|hello,|deliver(?:ing)? to|returns|\bcart\b|\bmenu\b|view order|invoice|receipt|^\W*orders?\W*$|^\W*(?:back|done|share|help|close|edit)\W*$|status|delivered|arriving|tracking|\bqty\b|total|subtotal|\btax\b|shipping|payment|\bprime\b|\bsold by\b/i;
function guessMerchant(text,L){
 if(/\b\d{3}-\d{7}-\d{7}\b/.test(text)||/item\(s\)\s*subtotal|estimated tax to be collected|\bamazon\b/i.test(text))return{n:'Amazon',sure:1};
 if(/\bgood\s?wi[l1i|]{1,3}\b|\b(?:sd|shop)goodwi/i.test(text)||fuzzyHas(text,'goodwill')||(L.slice(0,5).some(x=>/^\W*go[oa0]d\W*$/i.test(x))&&/donation|goodwi|vip\s*shopp|outlet\s*cent|no\s*refunds/i.test(text)))return{n:'Goodwill',sure:1};
 const km=text.match(KNOWN);if(km)return{n:tcase(km[1]),sure:1};
 const ty=text.match(/(?:thank you for (?:shopping|visiting)(?:\s+(?:at|with))?|order(?:ed)? from|purchased from)\s*:?\s*([A-Z][A-Za-z0-9&'.\- ]{2,28})/);if(ty)return{n:ty[1].trim(),sure:0};
 const d=text.match(/\b(?:www\.)?([a-z0-9][a-z0-9-]{2,})\.(?:com|net|org|co|shop|store|us)\b/i);if(d&&!/^(google|gmail|apple|icloud|yahoo|outlook|hotmail|facebook|paypal|gstatic)$/i.test(d[1]))return{n:tcase(d[1]),sure:0};
 const l=L.slice(0,12).map(x=>x.replace(/^[^A-Za-z0-9]*[Qq]\s+(?=[A-Z])/,'').trim()).find(l=>/[A-Za-z]{3}/.test(l)&&l.length<=40&&!DATE.test(l)&&!PRICE.test(l)&&!UIJUNK.test(l)&&!/\d{3}[-. ]\d{4}|^\W*(tel|phone|www|http)/i.test(l)&&l.split(/\s+/).length<=7&&/^[A-Z0-9]/.test(l));
 /* stray marks after the name ("Good | 3") are logo/background noise, not part of it */
 return l?{n:l.replace(/\s+[|\\\/_~¦]+.*$/,'').replace(/[\s|\\\/_~¦.,;:]+$/,'').trim()||l,sure:0}:null}
/* Item block for marketplace-style pages: a (wrapped) product title above a price that sits alone on its own line. */
const ONLINE=/\b\d{3}-\d{7}-\d{7}\b|item\(s\)\s*subtotal|\b(?:amazon|temu|aliexpress|shein|ebay|etsy|wayfair|newegg)\b/i;
const SELLER=/\b(?:sold|shipped|fulfilled|ships)\s*(?:by|from)\b|\bsold\s*by\s*:/i;
const NOTTITLE=/^\W*(?:sold\b|shipped\b|fulfilled\b|return|replace|buy it|track|get product|write a|view\b|leave\b|deliver|arriv|order|qty|quantity|package|invoice|ship(?:ping)?\b|payment|billing|subtotal|item\(s\)|total|tax\b|grand|promotion|search|ask a|see\b|show\b|download|print|share|help|back\b|menu|cart|account|prime\b|your\b|more\b|archive|details|summary|status|q\s+search)/i;
/* Marketplace titles are keyword-stuffed: keep the part before the first comma / dash / pipe when that is still a real name. */
const crisp=n=>{const m=n.match(/^(.{18,}?)\s*(?:,|\s[-\u2013\u2014|]\s)/);return m?m[1]:n};
/* Marketplace apps cut long titles mid-phrase ("1 Pair Safety Work..."). When the cut leaves a clear product cue, finish the noun.
   Only fires on a cut title, only for strong cues, and the caller flags the result so the person can check it. */
const GLOVEMOD=/\b(?:work|mechanics?|gardening|garden|utility|touch\s?screen|impact|welding|driving|nitrile|anti[- ]?vibration|cut[- ]resistant)$/i,HASNOUN=/\b(?:gloves?|glasses|goggles|boots?|shoes?|socks?|vest|helmet|hat|cap|mask|apron|sleeves?)\b/i;
function complete(cn,cut){if(!cut||HASNOUN.test(cn))return null;
 const t=cn.replace(/[\s,.\u2026-]+$/,'');if(!/\bpair\b/i.test(t))return null;
 if(GLOVEMOD.test(t)||/\bsafety\s+work$/i.test(t))return t.replace(/\b1\s+pair\b\s*/i,'')+' Gloves';return null}
function blockItems(L){
 const si=L.findIndex(l=>/order summary|item\(s\)\s*subtotal|subt?\s?-?tota[l1jy|\]]|total before tax/i.test(l)),out=[];
 for(const end of [si>0?si:L.length,L.length]){if(out.length)break;
 for(let i=0;i<end;i++){const l=fix(L[i]);if(!ONLYP.test(l))continue;const v=num(l);if(v==null||v<=0)continue;
  const t=[];let seen=false;
  for(let j=i-1;j>=0&&i-j<=7;j--){const x=L[j];if(ONLYP.test(fix(x))||PRICE.test(fix(x)))break;const ok=readable(x)&&x.length>3&&!NOTTITLE.test(x)&&!SELLER.test(x)&&!DATE.test(x);if(ok){t.unshift(x);seen=true}else if(seen)break}
  if(!t.length)continue;
  let q=1;for(let j=Math.max(0,i-7);j<Math.min(L.length,i+3);j++){const m=L[j].match(/^\W*(?:qty|quantity)\s*:?\s*(\d{1,3})\b/i);if(m){q=+m[1];break}}
  const title=t.join(' '),cut=/\S(\.{2,}|\u2026)\s*$/.test(title),cn=cleanName(title);if(!readable(cn))continue;
  {const cp=complete(cn,cut);out.push({n:cp||shortName(crisp(cn),null,false),full:cp||cn,cut,n0:title,q,p:v,ext:1,inf:cp?1:0})}}}
 return out}
/* Best guess at a product title when the page shows no per-item price (used only as a name for a single-item fallback). */
function titleGuess(L){const si=L.findIndex(l=>/order summary|item\(s\)\s*subtotal|subt?\s?-?tota[l1jy|\]]|total before tax/i.test(l)),end=si>0?si:L.length;
 const c=L.slice(0,end).filter(x=>x.length>=12&&readable(x)&&!NOTTITLE.test(x)&&!SELLER.test(x)&&!DATE.test(x)&&!UIJUNK.test(x)&&!ONLYP.test(x));
 return c.length?crisp(cleanName(c.sort((a,b)=>b.length-a.length)[0])):null}
/* OCR leaves stray marks after prices ('$4,00 fe', '4.00. 0,00'): drop them so the price still ends the line */
const tidyL=l=>l.replace(/\u00a7/g,'S').replace(/(\d[.,]\d{2})\s+[a-z]{1,2}(?=[A-Z]\s*$)/,'$1 ').replace(/(\d[.,]\d{2})[.,]\s+(?=\$?\d)/g,'$1 ').replace(/(\d[.,]\d{2})\s+(?!ea\b|each\b)[^\dA-Z\s]{0,2}[a-z]{0,2}\s*$/,'$1');
/* summary labels the OCR misspelled ("Distount", "Mount Due") are put back, so they are read as totals and not as products */
const CANON=[['discount','Discount'],['subtotal','Subtotal'],['amountdue','Amount Due'],['tenderamount','Tender Amount'],['changedue','Change Due'],['balancedue','Balance Due'],['grandtotal','Grand Total']];
function fzl(l){const m=l.match(PRICE);if(!m)return l;const head=l.slice(0,m.index).trim();if(/\d/.test(head))return l;const t=head.toLowerCase().replace(/[^a-z]/g,'');if(t.length<5||t.length>14)return l;
 for(const[k,c]of CANON)if(lev(t,k)<=(k.length>=8?2:1)&&Math.abs(t.length-k.length)<=2)return c+' '+l.slice(m.index);return l}
const COLROW=/^\W*(\d+(?:[.,]\d+)?)\s+\$?(\d+[.,]\d{2})\s+\$?(\d+[.,]\d{2})\s+\$?(\d+[.,]\d{2})\s*$/;
/* one flagged line at the receipt's subtotal, named from the row under "Sales Items" when that row is readable */
function fallbackItem(L,F){if(!(F.extSub>0))return null;
 const si=L.map(l=>/sales\s*it[eo]ms/i.test(l)).lastIndexOf(true),plain=l=>(l.match(/[A-Za-z0-9 ()#\-\/]/g)||[]).length>=l.length*.8,
  cand=si>=0?L.slice(si+1,si+4).find(l=>/[A-Za-z]{3}/.test(l)&&plain(l)&&!PRICE.test(fix(l))&&!NOTNAME.test(l)&&!SUMLBL.test(l)&&!/uant|antit|price|iscount|otal|^\W*sales/i.test(l)&&l.length<=40):null,
  nm=cand?cleanName(cand.replace(/^[^A-Za-z0-9(]+/,''),null,true):'',ok=readable(nm);
 return{n:ok?nm:'Item',full:ok?nm:'Item',cut:0,n0:ok?nm:'',q:1,p:F.extSub,ext:1,chk:1}}
function parse1(text,mode){let guess=null;const L=pairColumns(pairSummary(lines(text))),F={},items=[],found={};const set=(k,v)=>{if(v!=null&&v!==''){F[k]=v;found[k]=1}};
 const inv=invNo(L,mode==='purchase'),txf=taxFlags(text);
 if(mode==='purchase'){
  {const gm=guessMerchant(text,L);if(gm){set('merchant',gm.n);if(gm.sure)found.mk=1}}
  if(!ONLINE.test(text)){const cs=cityState(L.slice(0,25))||cityStateName(L.slice(0,25));if(cs)set('location',cs)}
  set('date',dateNear(L,/ordered on|order placed|order date|order time|purchase date|date of purchase|date placed|invoice date|\bdate?\b|transaction|print date/i)||firstDate(L));{const ic=text.match(/item details\s*\(\s*(\d+)\s*\)/i);if(ic)set('expected',+ic[1])}set('number',(text.match(/\b(\d{3}-\d{7}-\d{7})\b/)||[])[1]||(inv&&inv[1]));
  const mk=ONLINE.test(text)||/item details|\ba[fl]ter\s+(?:promos?|credit)/i.test(text),dp=x=>mk&&!PRICE.test(x)?x.replace(/\$\s?(\d{1,2})(\d{2})\s*$/,'$$$1.$2'):x;
  let pend=null,tnd=null,chg=null;const skipped=[];
  for(const raw of L){const l0=np(dp(fix(raw))),l=fzl(tidyL(l0)),cm=l.match(COLROW);if(cm&&pend&&!mk){/* register row: qty  price  discount  total, with the name on the line above */const q=+num(cm[1])||1,tv=num(cm[4]),dv=num(cm[3]);if(tv!=null&&tv>0){let cn=cleanName(pend.replace(/^[^A-Za-z0-9(]+/,''),null,true);if(readable(cn)){if(dv)set('discount',(F.discount||0)+dv);items.push({n:shortName(cn,null,false),full:cn,cut:false,n0:pend,q:q>0?q:1,p:+(tv/(q>0?q:1)).toFixed(2),tx:undefined,ext:1});pend=null;continue}}}
   const pm=l.match(PRICE),fm=l.match(/\d[.,]\d{2}\s*-?\s*([A-Z])(?:[A-Z]|\d)?\s*$/),neg=/\d[.,]\d{2}\s*-\s*[A-Z]{0,2}\d?\s*$/.test(l);if(!pm){if(!mk&&!NOTNAME.test(l)&&!SUMLBL.test(l)&&readable(l)&&l.length>=3&&l.length<=60&&!DATE.test(l)&&!/[:@]/.test(l))pend=l;else if(!/^\W*(?:qty|quantity|ea|each)\b/i.test(l))pend=null;const qm=l.match(/(?:^|\s)[x×]\s?(\d+)\s*$/i),li=items[items.length-1];if(qm&&li&&+qm[1]>1&&li.q==1&&!li.qs){li.q=+qm[1];li.qs=1}if(qm&&li&&!li.v){li.v=l.replace(/\s*[x×]\s?\d+\s*$/i,'').trim();li.n=shortName(li.full||li.n,li.v,li.cut)}continue}const v=num(pm[1]);if(v==null)continue;const head=l.slice(0,pm.index).trim();
   if(/[il1]tems?\s*\)?\s*\(?s?\)?\s*(total|discount)|extra bonus|tota.?\s+it[eo]ms|items?\s*\/\s*qu/i.test(head))continue;
   if(/(?:items?|ttams?|tens?|ttens?)\s*\/|\buant|antit|ntit[yv]|\/\s*qu/i.test(head))continue;/* Total Items/Quantity, however misspelled */
   if(/^\W*(items?|qty|quantity|price|amount|each|unit)\W*$/i.test(head))continue;
   if(/\ba[fl]ter\s+(?:promos?|credits?|discounts?|coupons?)\b|^\W*a[fl]ter\b/i.test(head)&&items.length){const it=items[items.length-1],nv=+(v/(it.q||1)).toFixed(2);if(it.lp==null)it.lp=it.p;if(nv<=Math.max(it.lp*2,it.lp+1))it.p=nv;continue}
   if(/\b(shipping|delivery|handling)\b/i.test(head)&&!/item/i.test(head)){set('shipping',v);continue}
   if(/total before tax|before tax|pre-?tax/i.test(head)){if(F.extSub==null)set('extSub',v)}
   else if(/subt?\s?-?tota[l1jy|\]]/i.test(head))set('extSub',v);
   else if(/\b(grand total|order total|total for this order|total payment)\b/i.test(head)&&!/savings|saved/i.test(head)){set('extTotal',v);found.gt=1}
   else if((/\b(total|amount due)\b/i.test(head)||/\b\w{0,3}[mn]ount\s+due\b/i.test(head))&&!/savings|saved/i.test(head)){if(!found.gt)set('extTotal',v)}
   else if(/\b(sales\s)?tax\b|\bvat\b|\bgst\b/i.test(head))set('tax',(F.tax||0)+v);
   else if(WALLET.test(head)||/\b(?:visa|master\s?card|amex|american express|discover|debit|cash|tender(?:ed)?|change)\b|^\W*credit(?:\s+card)?\W*$/i.test(head)){if(/\bchange\b/i.test(head)&&/due|given|back|\$/i.test(head+'$'))chg=v;else if(/\btender(?:ed)?\s*(?:amount|amt)\b|\bamount\s*tender/i.test(head)&&tnd==null)tnd=v}
   else if(neg||/discount|\bdisc\b|coupon|\bcpn\b|\bmfr\b|\bbogo\b|\bsave\b|promo|savings|rewards?|points|store credit|credit applied|\bcredit\b/i.test(head)||(/gift\s*card/i.test(head)&&/appl|redeem|balance|tender/i.test(head)))set('discount',(F.discount||0)+Math.abs(v));
   else if(/\b(?:tip|gratuity)\b/i.test(head)){}
   else if(/gift\s*card/i.test(head)&&F.extTotal!=null){}
   else if(!SKIP.test(head)){
    let q=1,p=v,n=head,m;
    const QL=/^(\d+)\s*[x@]\s*\$?(\d+[.,]\d{2})(?:\s*(?:ea|each))?$/i,WL=/^\d+(?:\.\d+)?\s*(?:lbs?|kg|oz|ea|each)\b/i;
    if(m=head.match(QL)){q=+m[1]||1;p=v/q;n=''}
    else if(WL.test(head)||/^\W*(?:qty|quantity)\b/i.test(head)){n=''}
    else if(m=n.match(/^(\d+)\s*[x@]\s*(.+)/i)){q=+m[1];n=m[2];p=v/q}
    else if(m=n.match(/^(.+?)\s+(\d+)\s*[x@]\s*\$?(\d+[.,]\d{2})$/i)){n=m[1];q=+m[2];p=num(m[3])}
    else if(m=n.match(/^(.+?)\s+[x@]\s*(\d+)$/i)){n=m[1];q=+m[2];p=v/q}
    if(v<0||neg){set('discount',(F.discount||0)+Math.abs(v));pend=null;continue}
    /* a $0.00 line is a summary row ("Discount $0.00", "Change Due $0.00") the OCR misspelled, never a purchase */
    if(!(v>0))continue;
    /* product code printed in front of / behind the name (UPC, SKU, dept number) is not part of the name */
    const nocode=x=>x.replace(/^\s*\d{5,14}\s+(?=[A-Za-z])/,'').replace(/\s+\d{8,14}\s*$/,'').trim();
    n=nocode(n);let cn=cleanName(n,null,!mk);
    /* the name sits on the line above (price or '2 @ 3.99' / '1.2 lb @ 0.59/lb' on its own line), or the name wrapped and this line only holds its tail ('5OZ') */
    if((!n||!readable(cn))&&pend&&!mk){n=nocode(pend)+(n&&n.length<=10?' '+n:'');cn=cleanName(n,null,!mk)}
    if(!readable(cn)){if(v>0)skipped.push({n:nocode(head),p:+v.toFixed(2)});continue}
    {const pv=items[items.length-1],nz=x=>x.toLowerCase().replace(/[^a-z0-9]/g,'');
     /* an identical consecutive line is a second unit on a register receipt, but a repeated line on a marketplace page */
     if(mk&&pv&&pv.p==+p.toFixed(2)&&pv.q==q&&(nz(pv.n).includes(nz(cn))||nz(cn).includes(nz(pv.n))))continue;
     const cut=/\S(\.{2,}|\u2026)$/.test(n.trim());
     items.push({n:shortName(cn,null,cut),full:cn,cut,n0:n,q,p:+p.toFixed(2),tx:txf(fm&&fm[1]),ext:1});pend=null}}}
  if(!items.length)blockItems(L).forEach(x=>items.push(x));
  /* Nothing readable but the receipt's own subtotal: the purchase is one line at that price. Flag it so the name gets checked. */
  if(!items.length&&!mk){const fi=fallbackItem(L,F);if(fi)items.push(fi)}
  /* no printed total: the amount tendered less change given back is what was paid; else subtotal - discount + tax + shipping */
  if(F.extTotal==null){if(tnd!=null&&tnd>0)set('extTotal',+(tnd-(chg||0)).toFixed(2));else if(F.extSub!=null)set('extTotal',+(F.extSub-(F.discount||0)+(F.tax||0)+(F.shipping||0)).toFixed(2))}
  if(F.extSub==null&&items.length&&F.extTotal!=null&&F.tax!=null&&F.discount==null&&!F.shipping)set('extSub',+(F.extTotal-F.tax).toFixed(2));
  /* Missing-item recovery: when the items do not add up to the receipt's own subtotal (or to total - tax - shipping), and a line that was set aside
     (unreadable name, gift card, etc.) accounts for exactly the gap (one line, or two), put it back and mark it for checking. */
  {const sumI=()=>+items.reduce((a,i)=>a+i.q*i.p,0).toFixed(2),d=F.discount||0;
   let t=F.extSub;if(t==null&&F.extTotal!=null)t=+(F.extTotal-(F.tax||0)-(F.shipping||0)+d).toFixed(2);
   if(t!=null&&skipped.length&&items.length){const sum=sumI(),ok=x=>Math.abs(x-t)<=0.02;
    if(!ok(sum)&&!ok(sum-d)){let hit=null;
     for(const need of [+(t-sum).toFixed(2),+(t+d-sum).toFixed(2)]){if(need<=0.004||hit)continue;
      const one=skipped.find(c=>Math.abs(c.p-need)<=0.005);if(one){hit=[one];break}
      for(let i=0;i<skipped.length&&!hit;i++)for(let j=i+1;j<skipped.length;j++)if(Math.abs(skipped[i].p+skipped[j].p-need)<=0.005){hit=[skipped[i],skipped[j]];break}}
     if(hit)hit.forEach(c=>items.push({n:c.n&&readable(c.n)?shortName(cleanName(c.n),null,false):'Item',full:c.n||'Item',cut:0,n0:c.n||'',q:1,p:c.p,ext:1,chk:1}))}}
   var recon=(()=>{let t2=F.extSub;if(t2==null&&F.extTotal!=null)t2=+(F.extTotal-(F.tax||0)-(F.shipping||0)+d).toFixed(2);const sum=sumI();return {sum,target:t2==null?null:t2,ok:t2!=null&&items.length>0&&(Math.abs(sum-t2)<=0.02||Math.abs(sum-d-t2)<=0.02)}})()}
  if(F.discount!=null)F.discount=+F.discount.toFixed(2);if(F.tax!=null)F.tax=+F.tax.toFixed(2);guess=titleGuess(L)}
 else{
  var D=new RegExp(DATE.source,'gi'),dts=l=>[...l.matchAll(D)].map(m=>m[1]);
  var ev=w=>{for(let i=0;i<L.length;i++)if(new RegExp('event\\s*'+w+'\\s*date','i').test(L[i])){for(let j=i;j<Math.min(L.length,i+4);j++){const d=dts(L[j]);if(d.length)return w=='start'?d[0]:d[d.length>1?1:0]}}return null};
  var tri=/(\d+(?:\.\d+)?)\s+\$\s?([\d,]+\.\d{2})\s+\$\s?([\d,]+\.\d{2})\s*$/,drow=L.filter(l=>/^\d{1,2}\/\d{1,2}\/\d{2,4}\b/.test(l)&&tri.test(l));
  {const c=label(L,/^(?:bill(?:ed)?\s*to|client(?:\s*name)?|customer|company)\s*[:\-]?\s*(.*)$/i);if(c&&!DATE.test(c)&&!/^\$?[\d,.]+$/.test(c))set('client',c.split(/\s{3,}/)[0])}
  set('invoice',inv&&inv[1]);
  set('jobDate',dateNear(L,/(job|service|work|shift|event|date of service)\s*date|date of service|worked/i));
  if(!F.jobDate){const l=L.find(l=>DATE.test(l)&&!/invoice|payment|paid|due|issued|deposit/i.test(l));if(l)F.jobDate=l.match(DATE)[1]}
  set('location',label(L,/^(?:site|job\s*site|location|venue|address|job location)\s*[:\-]\s*(.*)$/i));
  const hrs=[...text.matchAll(/(\d+(?:\.\d+)?)\s*(?:hrs?|hours)\b/gi)].map(m=>+m[1]);
  const tot=label(L,/^(?:total\s*hours|hours\s*worked|hours)\s*[:\-]?\s*(\d+(?:\.\d+)?)\b(?!\s*[x×@])/i);
  set('hours',tot!=null&&!isNaN(+tot)?tot:hrs.length?String(hrs.reduce((a,b)=>a+b,0)):null);
  const ot=text.match(/\b(?:overtime|OT)\b\D{0,12}(\d+(?:\.\d+)?)/i);if(ot){F.notes='Overtime hours mentioned: '+ot[1]+' (verify).';found.notes=1}
  let amt=null;for(const re of [/amount paid|total paid|total pay|net pay|gross pay/i,/amount due|total due/i,/(?<!sub)\btotal\b/i]){for(const raw of L){const l=fix(raw);if(!re.test(l)||/\btax\b|\brate\b|hours|hrs|subt?\s?-?tota[l1jy|\]]/i.test(l.replace(re,'')))continue;const a=[...l.matchAll(/\$?\s?(\d[\d,]*\.\d{2})\b/g)];if(a.length)amt=a[a.length-1][1].replace(/,/g,'')}if(amt)break}
  set('amount',amt)}
  if(mode!=='purchase'){
   const sd=ev('start'),ed=ev('end');if(sd)set('jobDate',sd);if(ed)set('endDate',ed);
   if(!sd||!ed){const l=L.find(l=>/\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}\s+\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}\s*$/.test(l));if(l){const d=l.match(/(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4})\s+(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4})\s*$/);if(!sd)set('jobDate',d[1]);if(!ed)set('endDate',d[2])}}
   for(const l of L){const m=l.match(/(?<!\w\s)\bDate\s+(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4})/);if(m){set('closeDate',m[1]);break}}if(!F.closeDate){const d=dateNear(L,/invoice\s*date|date\s*issued|issued/i);if(d)set('closeDate',d)}
   const loc=label(L,/^(?:event\s*location|job\s*location|service\s*location|work\s*location|job\s*site|site|venue|location|address)\s*[:\-]?\s*(.*)$/i);if(loc&&!/^\$?[\d,.]+$/.test(loc))set('location',loc.split(/\s{3,}/)[0]);
   if(F.location&&!HASST.test(F.location)){const k=L.findIndex(l=>/^(?:event\s*location|job\s*location|service\s*location|work\s*location|job\s*site|site|venue|location|address)\b/i.test(l)),cs=k>=0?cityState(L.slice(k,k+4)):null;if(cs)F.location=F.location+', '+cs}
   const nv=re=>{for(const raw of L){const m=fix(raw).match(re);if(m)return m}return null};
   {const m=nv(/^(?:(round[\s-]*trip|one[\s-]*way)(?:\s*(?:miles?|mileage|distance))?|mileage|miles|distance)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(?:mi\b|miles?\b)?(.*)$/i);if(m){let v=+m[2];if(/one/i.test(m[1]||'')||/one[\s-]*way/i.test(m[3]||''))v=v*2;set('roundTrip',String(+v.toFixed(2)))}}
   if(drow.length){const r=drow.map(l=>l.match(tri)),h=r.reduce((a,m)=>a+ +m[1],0),amt=r.reduce((a,m)=>a+ +m[3].replace(/,/g,''),0),low=Math.min(...r.map(m=>+m[2].replace(/,/g,'')));
    set('hours',String(h));if(!found.amount)set('amount',amt.toFixed(2));
    const ot=L.filter(l=>!/^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(l)&&tri.test(l)).map(l=>l.match(tri)).filter(m=>+m[2].replace(/,/g,'')>low+.01).reduce((a,m)=>a+ +m[1],0);
    const sub=L.filter(l=>!/^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(l)&&tri.test(l)).map(l=>l.match(tri)),money=v=>'$'+(+v.replace(/,/g,'')).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
    if(ot){set('overtime',String(ot));set('hours',String(+(h-ot).toFixed(2)));delete F.notes;delete found.notes;
     if(sub.length>1){const pr=sub.map(m=>m[1]+' hrs × '+money(m[2])+' = '+money(m[3]));const lo=Math.min(...sub.map(m=>+m[2].replace(/,/g,''))),hi=Math.max(...sub.map(m=>+m[2].replace(/,/g,'')));
      set('notes','Regular: '+pr[0]+'. Overtime: '+pr[pr.length-1]+(Math.abs(hi/lo-1.5)<.01?' (1.5× regular rate)':'')+'.')}}}}
 var shifts=[];
 if(mode!=='purchase'){
  const T=/(\d{1,2})(?::(\d{2}))?\s*([ap])\.?m?\.?\s*(?:-|–|—|to)\s*(\d{1,2})(?::(\d{2}))?\s*([ap])\.?m?\.?|(\d{1,2}):(\d{2})\s*(?:-|–|—|to)\s*(\d{1,2}):(\d{2})|(\d{1,2})(?::(\d{2}))?\s*([ap])\.?m?\.?\s*(?:-|–|—|to)\s*(\d{1,2})(?::(\d{2}))?(?!\s*[:\d]|\s*[ap]\.?m)/gi;
  const to24=(h,m,ap)=>{h=+h;m=+(m||0);if(m>59||h>23)return null;if(ap){if(h<1||h>12)return null;h=h%12+(ap=='p'?12:0)}return h*60+m};
  const pad=n=>String(n).padStart(2,'0'),hm=v=>pad(Math.floor(v/60))+':'+pad(v%60);
  let cur='';
  for(const raw of L){
   let l=fix(raw);const dm=l.match(DATE);if(dm){cur=dm[1];l=l.replace(DATE,' ')}
   if(/\b(?:invoice|due|issued|paid|deposit)\b/i.test(l)&&!/\d\s*[ap]\.?m/i.test(l))continue;
   for(const m of l.matchAll(T)){
    let s,e;
    if(m[1]!==undefined){ // both sides have am/pm letters
     s=to24(m[1],m[2],m[3].toLowerCase());e=to24(m[4],m[5],m[6].toLowerCase())}
    else if(m[7]!==undefined){ // 24-hour style hh:mm - hh:mm (needs a 24h hint)
     if(!(+m[7]>=13||+m[9]>=13||/^0\d$/.test(m[7])))continue;s=to24(m[7],m[8]);e=to24(m[9],m[10])}
    else{ // am/pm on the start side only, e.g. 7am - 3
     const ap=m[13].toLowerCase();s=to24(m[11],m[12],ap);e=to24(m[14],m[15],ap);
     if(s!=null&&e!=null&&e<=s)e=to24(m[14],m[15],ap=='a'?'p':'a')}
    if(s==null||e==null)continue;
    let d=e-s;if(d<0)d+=1440;if(d<=0||d>16*60)continue;
    shifts.push({date:cur,start:hm(s),end:hm(e),hours:+(d/60).toFixed(2)})}
  }
  if(!shifts.length&&typeof drow!=='undefined'&&drow.length)drow.forEach(l=>{const m=l.match(/^(\d{1,2}\/\d{1,2}\/\d{2,4})\b/),t=l.match(tri);if(m&&t)shifts.push({date:m[1],start:'',end:'',hours:+t[1]})});
 }
 return {fields:F,items,found,guess,shifts,L,recon:(typeof recon!=='undefined'?recon:null)}}
/* Other reads of the same photo (different cleanup / layout) fill what the best read missed. Items and amounts stay with the best read. */
function parse(text,mode,alts){const R=parse1(text,mode);if(mode!=='purchase'||!alts||!alts.length)return R;
 for(const a of alts){if(!a||a===text)continue;let Q;try{Q=parse1(a,mode)}catch(e){continue}
  for(const k of ['merchant','location','date','number','extSub','extTotal','tax']){if(R.fields[k]!=null&&R.fields[k]!=='')continue;const v=Q.fields[k];if(v==null||v==='')continue;
   if(k==='merchant'&&!Q.found.mk)continue;if(k==='tax'&&Q.fields.tax===0&&R.fields.extTotal!=null&&R.fields.extSub!=null&&R.fields.extTotal-R.fields.extSub>.005)continue;R.fields[k]=v;R.found[k]=1;if(k==='merchant')R.found.mk=1}}
 /* another read supplied the subtotal this one lacked */
 if(!R.items.length&&!ONLINE.test(text)){const fi=fallbackItem(R.L,R.fields);if(fi)R.items.push(fi)}
 return R}
function pd(s){s=String(s||'').trim();let m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);if(m)return new Date(+m[1],m[2]-1,+m[3]);
 m=s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2}|\d{4})$/);if(m&&+m[1]>=1&&+m[1]<=12&&+m[2]>=1&&+m[2]<=31){let y=+m[3];if(y<100)y+=2000;return new Date(y,m[1]-1,+m[2])}
 const d=new Date(s);return isNaN(d)?null:new Date(d.getFullYear(),d.getMonth(),d.getDate())}
function net30(s,days){const d=pd(s);if(!d)return null;d.setDate(d.getDate()+(days||30));const p=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())}
function irs(s){const d=pd(s);if(!d)return null;const y=d.getFullYear();if(y==2025)return 0.70;if(y==2026)return d>=new Date(2026,6,1)?0.76:0.725;return null}
const dateIn=s=>findDate(s||'');
const api={parse,pd,net30,irs,dateIn,cityState};if(typeof module!=='undefined')module.exports=api;root.Parser=api})(typeof globalThis!=='undefined'?globalThis:this);
