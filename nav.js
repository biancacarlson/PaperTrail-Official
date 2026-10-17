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
#app .shell{display:block;min-height:100vh;padding:0}
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
[['data','Data'],['help','Help'],['acct','Account']].forEach(([k,l])=>{
 const b=document.createElement('button');b.type='button';b.className='mt';b.setAttribute('aria-haspopup','menu');b.setAttribute('aria-expanded','false');
 b.innerHTML=l+'<i aria-hidden="true"></i>';b.onclick=e=>window.ptMenu(e,k);mts.appendChild(b)});
inner.appendChild(mts);bar.appendChild(inner);shell.insertBefore(bar,shell.firstChild);

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
function disclaimer(){const d=side.querySelector('.disc .dt');sheet('Disclaimer','<div class="dt">'+(d?d.innerHTML:'')+'</div>')}
function homeScreen(){const h=window.installGuide?window.installGuide(true):'';sheet('Add to Home Screen',h||'<p>PaperTrail is already running from your Home Screen.</p>')}
const installable=()=>{try{return !!(window.installGuide&&window.installGuide(false))}catch(e){return false}};
const MENUS={
 acct:()=>[
  {head:S.email||''},
  {t:'Change password',f:()=>window.authChangePw()},
  {t:'Change password hint',f:()=>window.authChangeHint()},
  {t:'Create a new recovery code',f:()=>window.authMakeCode()},
  {idle:true},
  {hr:1},
  {t:'Log out',f:()=>lockNow()}],
 data:()=>[
  {t:'Download backup',sub:bkText(),f:()=>window.authBackup()},
  {t:'Remembered fixes',f:()=>fixOpen()},
  {hr:1},
  {t:'Delete all saved records',danger:1,f:()=>nuke()}],
 help:()=>[
  ...(installable()?[{t:'Add to Home Screen',f:homeScreen}]:[]),
  {t:'Disclaimer',f:disclaimer},
  {hr:1},
  {foot:'PaperTrail '+verText()}],
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
 const first=menu.querySelector('.mi');if(first&&ev.detail===0)first.focus();
};
document.addEventListener('pointerdown',e=>{if(menu&&!menu.contains(e.target)&&!(trig&&trig.contains(e.target)))closeMenu()},true);
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'){if($('#ptinfo')){closeInfo();return}if(menu){closeMenu(true)}return}
 if(menu&&(e.key==='ArrowDown'||e.key==='ArrowUp')){
  const l=[...menu.querySelectorAll('.mi')],i=l.indexOf(document.activeElement);
  if(!l.length)return;e.preventDefault();
  l[(i+(e.key==='ArrowDown'?1:-1)+l.length)%l.length].focus()}
});
addEventListener('resize',()=>closeMenu());
addEventListener('scroll',()=>closeMenu(),true);

/* ---------- Saved tab: Copy + Export CSV become one quiet menu ---------- */
if(typeof svBody==='function'){
 const _sb=svBody;
 svBody=function(){
  let h=_sb.apply(this,arguments);
  h=h.replace(/<div class="svact">[\s\S]*?<\/div>/,'');
  h=h.replace(/(<div class="svsum">[\s\S]*?<\/b>)(<\/div>)/,(m,a,b)=>a+'<button type="button" class="xpb" aria-haspopup="menu" aria-expanded="false" onclick="ptMenu(event,\'exp\')">Export<i aria-hidden="true"></i></button>'+b);
  return h};
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
