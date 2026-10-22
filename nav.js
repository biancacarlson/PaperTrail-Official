/* PaperTrail v38: website-style navigation.
   Loads AFTER app.js. It does three things and leaves every feature in app.js as it was:
   1. Top bar with the three record tabs plus Account / Data / Help dropdown menus (replaces the Settings / Disclaimer / Log out stack).
   2. Saved tab: Copy and Export CSV move into one quiet "Export" menu instead of two big buttons under the list.
   3. Sign-in screen: one primary button, Show/Hide inside the password field, and the three help links grouped in one menu. */
(function(){
'use strict';
const $=s=>document.querySelector(s);
const shell=$('.shell'),side=$('.side');
if(!shell||!side||$('#topbar'))return;

/* ---------- styles ---------- */
const css=`
/* layout: one column under a sticky top bar (the old sidebar is hidden; its buttons are still used by the menus) */
#app .shell{display:flex;flex-direction:column;min-height:100vh;min-height:100dvh;padding:0}
#app .main{flex:1 0 auto;width:100%}
#app{padding-bottom:0!important}
#topbar{order:-1}
#ptfoot{order:10;margin-top:auto;width:100%}
#app .side{display:none!important}
#app .main{max-width:1180px;margin:0 auto;padding:22px 20px 64px}
#topbar{position:sticky;top:0;z-index:40;background:rgba(11,13,15,.9);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border-bottom:1px solid var(--hair,var(--ln));padding:10px 20px;padding-top:max(10px,env(safe-area-inset-top))}
#topbar .tb{max-width:1180px;margin:0 auto;display:flex;align-items:center;gap:10px}
#topbar .brand{margin:0;order:0;flex:0 0 auto;gap:9px}
#topbar .brand b{font-size:18px}
#topbar .logo{width:30px;height:30px;border-radius:9px;font-size:15px}
#topbar .brand .pill{display:none!important}
#topbar .nav{order:1;display:flex;flex-direction:row;gap:2px;margin:0 0 0 14px;padding:0;background:transparent;border:0;border-radius:0}
#topbar .nav .gt{display:none}
#topbar .nav button{flex:0 0 auto;text-align:center;padding:8px 14px;border-radius:9px;font-size:14.5px;font-weight:500;color:var(--mut);background:transparent;border:1px solid transparent;box-shadow:none}
#topbar .nav button:hover{color:var(--fg);background:#15181c}
#topbar .nav button.on{color:var(--gd);background:#171b1f;border-color:#2a4955;box-shadow:none;font-weight:600}
#topbar .mts{order:2;margin-left:auto;display:flex;gap:2px}
.mt,.xpb{display:inline-flex;align-items:center;gap:7px;cursor:pointer}
.mt{width:auto;background:transparent;border:1px solid transparent;color:var(--mut);padding:8px 11px;border-radius:9px;font-size:14px;font-weight:500}
.mt:hover,.mt[aria-expanded=true]{color:var(--fg);background:#15181c}
.mt i,.xpb i{width:6px;height:6px;border:solid currentColor;border-width:0 1.6px 1.6px 0;transform:rotate(45deg) translate(-1px,-1px);opacity:.7}
.mt:focus-visible,.xpb:focus-visible,#ptmenu .mi:focus-visible{outline:2px solid #3d6a7a;outline-offset:1px}

/* search: icon in the top bar that expands */
#topbar .tbsw{order:2;margin-left:auto;display:flex;align-items:center;gap:4px}
#topbar .mts{margin-left:0}
#topbar .tbi{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;padding:0;background:transparent;border:1px solid transparent;border-radius:9px;color:var(--mut)}
#topbar .tbi:hover{color:var(--fg);background:#15181c}
#topbar .tbf{display:flex;align-items:center;width:0;opacity:0;overflow:hidden;transition:width .2s ease,opacity .15s ease}
#topbar .tbsw.open .tbf{width:260px;opacity:1}
#topbar .tbsw.open .tbi{color:var(--gd)}
#topbar .tbf input{margin:0;height:36px;padding:0 12px;border-radius:9px;font-size:16px;-webkit-appearance:none;appearance:none}
#topbar .tbf input::-webkit-search-cancel-button,#topbar .tbf input::-webkit-search-decoration{-webkit-appearance:none;display:none}
#topbar .tbx{flex:0 0 auto;width:32px;height:32px;padding:0;margin-left:2px;background:transparent;border:0;color:var(--mut);display:none}
#topbar .tbsw.open .tbx{display:inline-block}
#savedview .svs{display:none}
#savedview .svq{justify-content:flex-end}
/* v52: calmer Saved header: flat underline tabs, filters + sort share one row */
#savedview .seg{background:transparent!important;border:0!important;border-radius:0!important;padding:0!important;gap:0;border-bottom:1px solid var(--hair,var(--ln))!important;margin:0 0 2px!important}
#savedview .seg button{background:transparent!important;border:0!important;border-bottom:2px solid transparent!important;border-radius:0!important;box-shadow:none!important;color:var(--mut);font-weight:500;padding:10px 4px!important;margin-bottom:-1px}
#savedview .seg button.on{color:var(--gd);border-bottom-color:var(--gd)!important;font-weight:600}
#savedview .svrow{display:flex;align-items:center;gap:10px}
#savedview .svrow .chips{flex:1 1 auto;min-width:0}
#savedview .svrow .svsb{padding:5px 12px;border-radius:999px;background:transparent;font-weight:500;color:var(--mut)}
#savedview .svrow .svsb span{color:var(--fg)}
#savedview .chips button{border-color:transparent!important;background:rgba(255,255,255,.05)!important;color:var(--mut)}
#savedview .chips button.on{background:#1b1d20!important;color:var(--fg)!important;border-color:var(--hair,#2a2d31)!important}
#savedview .chips button[data-k=open].on{color:#e0544f!important;border-color:rgba(224,84,79,.45)!important;background:rgba(214,69,69,.12)!important}
#savedview .chips button[data-k=closed].on{color:#35a56f!important;border-color:rgba(53,165,111,.45)!important;background:rgba(46,125,90,.14)!important}
@media(max-width:900px){
 #topbar .tbsw{margin-left:auto}
 #topbar .tbsw.open{position:absolute;left:14px;right:14px;top:max(8px,env(safe-area-inset-top));margin:0;z-index:2;background:#0b0d0f;height:36px}
 #topbar .tbsw.open .tbf{flex:1;width:auto}
 #topbar .tbsw.open .tbi{display:none}
 #topbar .tb{position:relative}
 #topbar.searching .brand,#topbar.searching .mts{visibility:hidden}
 #topbar .mt{padding:7px 6px}
}
@media(prefers-reduced-motion:reduce){#topbar .tbf{transition:none}}

/* mobile-first declutter */
@media(max-width:900px){
 #topbar .brand b{display:none}
 #topbar .tb{row-gap:6px}
 #app .main{padding-top:10px}
 #bkbar,#rcbar{display:flex;flex-wrap:nowrap!important;align-items:center;background:transparent!important;border:1px solid var(--hair,var(--ln))!important;padding:6px 6px 6px 12px!important;margin-bottom:10px!important}
 #bkbar>div,#rcbar>span{min-width:0!important;flex:1;font-size:13px}
 #bkbar .bk2{display:none}
 #bkbar .bk1,#rcbar>span{font-weight:500;color:var(--mut)}
 #bkbar button.pri,#rcbar button.pri{border:0!important;padding:6px 8px;font-size:13px;white-space:nowrap}
 #bkbar button:not(.pri){padding:6px 8px;font-size:13px;white-space:nowrap}
 #savedview .invm{display:none}
 #savedview .sv{gap:8px}
 #savedview .seg button{white-space:nowrap;font-size:13px;padding-inline:2px}
}

/* footer disclaimer */
#ptfoot{max-width:1180px;margin:0 auto;padding:8px 20px calc(28px + env(safe-area-inset-bottom,0px));text-align:center;color:var(--mut)}
#ptfoot .fb{width:auto;background:transparent;border:0;padding:8px 10px;font-size:12.5px;font-weight:400;color:var(--mut);display:inline-flex;align-items:center;gap:6px}
#ptfoot .fb:hover{color:var(--fg)}
#ptfoot .fb i{width:5px;height:5px;border:solid currentColor;border-width:0 1.5px 1.5px 0;transform:rotate(45deg) translate(-1px,-1px);transition:transform .15s}
#ptfoot .fb[aria-expanded=true] i{transform:rotate(-135deg) translate(-1px,-1px)}
#ptfoot .fv{font-size:12px;opacity:.7;margin-left:6px}
#ptfoot .fd{text-align:left;max-width:640px;margin:6px auto 0}
#ptfoot .dt{max-height:none;overflow:visible}
@media(max-width:900px){#ptfoot{padding-inline:14px}}
/* work screen: keep sticky helpers clear of the bar */
#app .src{top:76px}
#addbar{top:64px}
@media(max-width:900px){
 #app .main{padding:14px 14px 56px}
 #topbar{padding:8px 14px;padding-top:max(8px,env(safe-area-inset-top))}
 #topbar .tb{flex-wrap:wrap;row-gap:8px}
 #topbar .nav{order:3;flex:1 1 100%;margin:0;padding:3px;background:#0f1011;border:1px solid var(--hair,var(--ln));border-radius:13px}
 #topbar .nav button{flex:1;padding:8px 4px}
 #topbar .mt{padding:7px 8px;font-size:13.5px}
 #actions{margin:0 -14px;padding-inline:14px}
}
/* dropdown panel (shared by every menu) */
#ptmenu{position:fixed;z-index:200;min-width:236px;max-width:calc(100vw - 24px);max-height:calc(100vh - 80px);overflow-y:auto;background:#14171a;border:1px solid #2a2e33;border-radius:14px;padding:6px;box-shadow:0 14px 40px rgba(0,0,0,.55)}
#ptmenu .mh{padding:8px 10px 6px;font-size:12.5px;color:var(--mut);overflow-wrap:anywhere}
#ptmenu .mi{display:block;width:100%;text-align:left;background:transparent;border:0;border-radius:9px;padding:10px;min-height:40px;font-size:14.5px;font-weight:500;color:var(--fg);box-shadow:none}
#ptmenu .mi small{display:block;font-size:12px;font-weight:400;color:var(--mut);margin-top:2px}
#ptmenu .mi:hover{background:#1b1f23}
#ptmenu .mi.danger{color:#ff8f86}
#ptmenu hr{border:0;border-top:1px solid var(--hair,var(--ln));margin:6px 4px}
#ptmenu .mr{display:flex;align-items:center;gap:10px;padding:8px 10px;font-size:14px}
#ptmenu .mr span{flex:1}
#ptmenu .mr input{flex:0 0 62px;width:62px;margin:0;padding:6px;text-align:center}
#ptmenu .mf{padding:6px 10px 4px;font-size:12px;color:var(--mut)}
/* info sheets (Disclaimer, Home Screen guide) */
#ptinfo .rmh h3{font:600 17px -apple-system,system-ui,sans-serif;letter-spacing:-.01em;text-transform:none;color:var(--fg)}
#ptinfo .dt{max-height:none;overflow:visible}
#ptinfo.rmo{z-index:150}
@media(min-width:700px){#ptinfo.rmo{align-items:center}#ptinfo .rm{border-radius:18px}}
/* Saved: quiet export control, quieter banners */
#savedview .svsum{display:flex;align-items:center;gap:12px}
#savedview .svsum span{flex:1;min-width:0}
.xpb{flex:0 0 auto;width:auto;background:transparent;border:1px solid var(--hair,var(--ln));color:var(--mut);padding:6px 10px;border-radius:9px;font-size:13px;font-weight:500}
.xpb:hover,.xpb[aria-expanded=true]{color:var(--fg);background:#15181c}
#bkbar,#rcbar{padding:8px 12px!important;gap:6px 10px!important;border-radius:12px!important;margin-bottom:12px!important;border-color:#3a3020!important}
#bkbar .bk1{font-size:14px}
#bkbar button.pri,#rcbar button.pri{background:transparent!important;color:var(--gd)!important;border:1px solid #2a4955!important;box-shadow:none!important;padding:6px 12px;font-size:13px}
#bkbar button:not(.pri){padding:6px 8px;font-size:13px}
/* sign-in screen */
#lock{padding:24px 20px!important}
#lock>.lkcard{max-width:400px;margin:9vh auto 0;padding:0}
@media(min-width:600px){#lock>.lkcard{margin-top:13vh;background:var(--card);border:1px solid var(--hair,var(--ln));border-radius:18px;padding:28px}}
.lkbrand{display:flex;align-items:center;gap:10px;margin:0 0 22px}
.lkbrand b{font-size:22px;letter-spacing:-.03em;font-weight:600}
.lkbrand .logo{width:34px;height:34px;border-radius:10px;font-size:17px}
#lock .lktabs{display:flex;gap:0;margin:0 0 16px!important;background:#0f1011;border:1px solid var(--hair,var(--ln));border-radius:13px;padding:3px}
#lock .lktabs button{flex:1;width:auto;padding:9px 6px;border-radius:10px;font-weight:500;color:var(--mut);background:transparent!important;border:1px solid transparent!important;box-shadow:none!important}
#lock .lktabs button.pri{background:#1b1d20!important;color:var(--gd);border-color:#2a4955!important}
#lock input{margin:0 0 10px}
#lock .pwwrap{position:relative;margin:0 0 10px}
#lock .pwwrap input{margin:0;padding-right:66px}
#lock .pwshow{position:absolute;right:5px;top:50%;margin-top:-17px;height:34px;width:auto;padding:0 10px;background:transparent;border:0;color:var(--gd);font-size:13px;font-weight:600}
#lock .lkmore{display:flex;justify-content:center;margin-top:8px}
#lock .lkmore .mt{width:auto;color:var(--gd)}
#lock>.lkcard>.hint{text-align:center;white-space:normal!important}
`;
const st=document.createElement('style');st.id='ptnav';st.textContent=css;document.head.appendChild(st);

/* ---------- top bar ---------- */
const bar=document.createElement('header');bar.id='topbar';
const inner=document.createElement('div');inner.className='tb';
const brand=side.querySelector('.brand'),nav=side.querySelector('.nav');
if(brand)inner.appendChild(brand);
if(nav)inner.appendChild(nav);
const mts=document.createElement('div');mts.className='mts';
[['data','Data'],['acct','Settings']].forEach(([k,l])=>{
 const b=document.createElement('button');b.type='button';b.className='mt';b.setAttribute('aria-haspopup','menu');b.setAttribute('aria-expanded','false');
 b.innerHTML=l+'<i aria-hidden="true"></i>';b.onclick=e=>window.ptMenu(e,k);mts.appendChild(b)});
inner.appendChild(mts);bar.appendChild(inner);shell.insertBefore(bar,shell.firstChild);


/* ---------- search: magnifier in the top bar, expands into a field; drives the Saved search ---------- */
const sw=document.createElement('div');sw.className='tbsw';
sw.innerHTML='<div class="tbf"><input id="tbq" type="search" enterkeyhint="search" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Search merchant, client or receipt #" aria-label="Search saved records"><button type="button" class="tbx" aria-label="Clear search and close">\u2715</button></div>'
 +'<button type="button" class="tbi" aria-label="Search saved records" aria-expanded="false"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></button>';
inner.insertBefore(sw,mts);
const tbq=sw.querySelector('#tbq'),tbi=sw.querySelector('.tbi'),tbx=sw.querySelector('.tbx');
function sOpen(){sw.classList.add('open');bar.classList.add('searching');tbi.setAttribute('aria-expanded','true');setTimeout(()=>{try{tbq.focus()}catch(e){}},30)}
function sClose(){sw.classList.remove('open');bar.classList.remove('searching');tbi.setAttribute('aria-expanded','false');tbq.blur()}
tbi.onclick=()=>sw.classList.contains('open')?sClose():sOpen();
tbx.onclick=()=>{tbq.value='';if(S.sv.q)runFind('');sClose()};
tbq.addEventListener('blur',()=>{if(!tbq.value)setTimeout(()=>{if(document.activeElement!==tbq)sClose()},150)});
tbq.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();tbq.blur()}if(e.key==='Escape'){e.stopPropagation();tbx.onclick()}});
function runFind(v){
 const fresh=S.tab!='saved';
 if(fresh)showSaved();
 if(fresh||S.sv.sec=='t')svSec(S.mode=='purchase'?'x':'w');
 svFind(v);
}
tbq.addEventListener('input',()=>runFind(tbq.value));
/* keep the field in step when the app changes the query itself (Clear, "Show N in ...") */
function syncQ(){if(tbq.value!==S.sv.q){tbq.value=S.sv.q;if(S.sv.q)sOpen()}}
if(typeof renderRecs==='function'){const _rr=renderRecs;renderRecs=function(){const r=_rr.apply(this,arguments);try{syncQ()}catch(e){}return r}}
if(typeof svFind==='function'){const _sf=svFind;svFind=function(){const r=_sf.apply(this,arguments);try{syncQ()}catch(e){}return r}}
if(typeof svClear==='function'){const _sc=svClear;svClear=function(){const r=_sc.apply(this,arguments);try{syncQ()}catch(e){}return r}}

/* ---------- dropdown menus ---------- */
const bkText=()=>{const e=$('#bkinfo');return e?e.textContent:''};
const verText=()=>{const e=$('#ver');return e?e.textContent:''};
function sheet(title,html){
 closeInfo();
 const o=document.createElement('div');o.id='ptinfo';o.className='rmo';o.onclick=e=>{if(e.target===o)closeInfo()};
 o.innerHTML='<div class="rm" role="dialog" aria-modal="true" aria-label="'+title+'"><div class="rmh"><h3>'+title+'</h3><button class="x" type="button" aria-label="Close">\u2715</button></div><div class="rmb">'+html+'</div></div>';
 o.querySelector('.x').onclick=closeInfo;
 document.body.appendChild(o);document.body.style.overflow='hidden';
}
function closeInfo(){const o=$('#ptinfo');if(o){o.remove();document.body.style.overflow=''}}
window.ptCloseInfo=closeInfo;
function homeScreen(){const h=window.installGuide?window.installGuide(true):'';sheet('Add to Home Screen',h||'<p>PaperTrail is already running from your Home Screen.</p>')}
const installable=()=>{try{return !!(window.installGuide&&window.installGuide(false))}catch(e){return false}};
const MENUS={
 acct:()=>[
  {head:S.email||''},
  {t:'Password & hint',f:()=>window.authPwHint()},
  {t:'Create a new recovery code',f:()=>window.authMakeCode()},
  {idle:true},
  ...(installable()?[{t:'Add to Home Screen',f:homeScreen}]:[]),
  {hr:1},
  {t:'Log out',f:()=>lockNow()}],
 data:()=>[
  ...(S.records&&S.records.length?[
   {t:'Copy records',f:()=>{if(S.tab!='saved')showSaved();svCopy()}},
   {t:'Export CSV\u2026',f:()=>{if(S.tab!='saved')showSaved();csvOpen()}},
   {hr:1}]:[]),
  {t:'Download backup',sub:bkText(),f:()=>window.authBackup()},
  {t:'Remembered fixes',f:()=>fixOpen()},
  {hr:1},
  {t:'Delete all saved records',danger:1,f:()=>nuke()}],
 exp:()=>{const n=svList().length;return[
  {t:n==1?'Copy record':'Copy '+n+' records',f:()=>svCopy()},
  {t:'Export CSV\u2026',f:()=>csvOpen()}]},
 lk:()=>[
  {t:'Forgot password?',f:()=>window.authForgot()},
  {t:'Show my password hint',f:()=>window.authHint()},
  {t:'Restore from a backup file',f:()=>window.authRestore()}]
};
const escH=v=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
let menu=null,trig=null,items=[];
function closeMenu(refocus){
 if(menu){menu.remove();menu=null}
 if(trig){trig.setAttribute('aria-expanded','false');if(refocus)try{trig.focus()}catch(e){}trig=null}
}
window.ptMenu=function(ev,key){
 ev.stopPropagation();
 const btn=ev.currentTarget;
 if(trig===btn){closeMenu();return}
 closeMenu();
 items=MENUS[key]();
 menu=document.createElement('div');menu.id='ptmenu';menu.setAttribute('role','menu');
 menu.innerHTML=items.map((it,i)=>
  it.hr?'<hr>':
  it.head!==undefined?(it.head?'<div class="mh">'+escH(it.head)+'</div>':''):
  it.foot!==undefined?'<div class="mf">'+escH(it.foot)+'</div>':
  it.idle?'<div class="mr"><span>Auto-logout after idle</span><input id="ptidle" type="number" min="1" inputmode="numeric" aria-label="Minutes before auto-logout" value="'+escH(($('#idle')||{}).value||15)+'"><span style="flex:0 0 auto">min</span></div>':
  '<button type="button" role="menuitem" class="mi'+(it.danger?' danger':'')+'" data-i="'+i+'">'+escH(it.t)+(it.sub?'<small>'+escH(it.sub)+'</small>':'')+'</button>').join('');
 menu.onclick=e=>{const b=e.target.closest('.mi[data-i]');if(!b)return;const it=items[+b.dataset.i];closeMenu();it.f()};
 const idle=menu.querySelector('#ptidle');
 if(idle)idle.onchange=()=>{const o=$('#idle');if(o){o.value=idle.value;setIdle()}};
 document.body.appendChild(menu);
 trig=btn;btn.setAttribute('aria-expanded','true');
 const r=btn.getBoundingClientRect(),w=menu.offsetWidth,vw=document.documentElement.clientWidth;
 let left=btn.classList.contains('lkhelp')?r.left+(r.width-w)/2:r.right-w;
 left=Math.max(12,Math.min(left,vw-w-12));
 menu.style.left=left+'px';menu.style.top=(r.bottom+6)+'px';
 
};
document.addEventListener('pointerdown',e=>{if(menu&&!menu.contains(e.target)&&!(trig&&trig.contains(e.target)))closeMenu()},true);
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'){if($('#ptinfo')){closeInfo();return}if(menu){closeMenu(true)}return}
 if(menu&&(e.key==='ArrowDown'||e.key==='ArrowUp')){
  const l=[...menu.querySelectorAll('.mi')],i=l.indexOf(document.activeElement);
  if(!l.length)return;e.preventDefault();
  l[(i+(e.key==='ArrowDown'?1:-1)+l.length)%l.length].focus()}
});
/* phones fire scroll/resize when the keyboard moves (the sign-in screen focuses the email box), so keep the menu open and just re-place it */
function place(){
 if(!menu||!trig)return;
 const r=trig.getBoundingClientRect(),w=menu.offsetWidth,vw=document.documentElement.clientWidth;
 let left=trig.classList.contains('lkhelp')?r.left+(r.width-w)/2:r.right-w;
 menu.style.left=Math.max(12,Math.min(left,vw-w-12))+'px';menu.style.top=(r.bottom+6)+'px';
}
addEventListener('resize',place);
addEventListener('scroll',place,true);

/* ---------- Saved tab: Copy + Export CSV become one quiet menu ---------- */
if(typeof svBody==='function'){
 const _sb=svBody;
 svBody=function(){
  let h=_sb.apply(this,arguments);
  h=h.replace(/<div class="svact">[\s\S]*?<\/div>/,'');
  return h};
}


/* ---------- footer: grey Disclaimer link that expands in place ---------- */
{
 const f=document.createElement('footer');f.id='ptfoot';
 f.innerHTML='<button type="button" class="fb" aria-expanded="false" aria-controls="ptdisc">Disclaimer<i aria-hidden="true"></i></button><span class="fv"></span><div id="ptdisc" class="fd" hidden></div>';
 shell.appendChild(f);
 const fb=f.querySelector('.fb'),fd=f.querySelector('.fd');
 fb.onclick=()=>{
  const open=fb.getAttribute('aria-expanded')!=='true';
  if(open&&!fd.innerHTML){const d=side.querySelector('.disc .dt');fd.innerHTML='<div class="dt">'+(d?d.innerHTML:'')+'</div>'}
  fb.setAttribute('aria-expanded',open?'true':'false');fd.hidden=!open;
  if(open)setTimeout(()=>fd.scrollIntoView({block:'nearest',behavior:'smooth'}),50)};
 const v=$('#ver');if(v)f.querySelector('.fv').textContent=v.textContent;
}

/* ---------- sign-in screen ---------- */
function tidyLock(){
 const L=$('#lock');if(!L||L.querySelector('.lkcard'))return;
 const first=L.querySelector('button[onclick^="authTab("]');if(!first)return;
 const tabs=first.parentNode;tabs.className='lktabs';tabs.removeAttribute('style');
 const h=L.querySelector('h2');
 if(h){const b=document.createElement('div');b.className='lkbrand';b.innerHTML='<span class="logo">$</span><b>PaperTrail</b>';h.replaceWith(b)}
 const pw=$('#pw');
 if(pw){
  const cb=L.querySelector('input[type=checkbox]'),lab=cb&&cb.closest('label');
  const w=document.createElement('div');w.className='pwwrap';pw.parentNode.insertBefore(w,pw);w.appendChild(pw);
  const t=document.createElement('button');t.type='button';t.className='pwshow';t.textContent='Show';t.setAttribute('aria-label','Show password');
  t.onclick=()=>{const show=pw.type==='password';['pw','pw2'].forEach(id=>{const e=document.getElementById(id);if(e)e.type=show?'text':'password'});t.textContent=show?'Hide':'Show';t.setAttribute('aria-label',show?'Hide password':'Show password')};
  w.appendChild(t);if(lab)lab.remove();
 }
 const forgot=[...L.querySelectorAll('button')].find(b=>/authForgot/.test(b.getAttribute('onclick')||''));
 if(forgot){
  const row=forgot.parentNode;row.removeAttribute('style');row.className='lkmore';
  row.innerHTML='<button type="button" class="mt lkhelp" aria-haspopup="menu" aria-expanded="false" onclick="ptMenu(event,\'lk\')">Trouble signing in?<i aria-hidden="true"></i></button>';
 }
 const card=document.createElement('div');card.className='lkcard';
 while(L.firstChild)card.appendChild(L.firstChild);L.appendChild(card);
}
if(typeof lockUI==='function'){
 const _lu=lockUI;
 lockUI=function(h){_lu.apply(this,arguments);try{tidyLock()}catch(e){}};
}
try{tidyLock()}catch(e){}
})();
