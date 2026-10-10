'use strict';
/* Scan helpers: pure functions on pixel arrays (no DOM), so they can be tested in Node.
   clean()   - turns a photographed receipt (shadows, crumples, uneven light) into crisp black text on white
   barcode() - finds a 1-D barcode and reads the number printed under it, straightening the arc a curled receipt gives it */
(function(root){
const gray=(rgba,w,h)=>{const g=new Uint8ClampedArray(w*h);for(let i=0,j=0;i<g.length;i++,j+=4)g[i]=.299*rgba[j]+.587*rgba[j+1]+.114*rgba[j+2];return g};
/* local mean over a (2r+1) square, via an integral image */
function localMean(g,w,h,r){const W1=w+1,I=new Uint32Array(W1*(h+1));
 for(let y=0;y<h;y++){let row=0;for(let x=0;x<w;x++){row+=g[y*w+x];I[(y+1)*W1+x+1]=I[y*W1+x+1]+row}}
 const m=new Float32Array(w*h);
 for(let y=0;y<h;y++){const y0=Math.max(0,y-r),y1=Math.min(h-1,y+r);for(let x=0;x<w;x++){const x0=Math.max(0,x-r),x1=Math.min(w-1,x+r),
  s=I[(y1+1)*W1+x1+1]-I[y0*W1+x1+1]-I[(y1+1)*W1+x0]+I[y0*W1+x0];m[y*w+x]=s/((y1-y0+1)*(x1-x0+1))}}
 return m}
/* dark mask: 1 where a pixel is clearly darker than its surroundings */
function darkMask(g,w,h,k,rd){k=k||.87;const r=Math.max(10,Math.round(w/(rd||28))),m=localMean(g,w,h,r),d=new Uint8Array(w*h);
 for(let i=0;i<d.length;i++)d[i]=g[i]<m[i]*k?1:0;return d}
/* v89: soft version of darkMask. Subtracts the local brightness (shadows, curl, uneven light) but keeps the gray edges of letters,
   which the OCR needs: a hard black/white cut thins small print until 3s, 8s and 0s look alike. Returns a gray array. */
function flatten(g,w,h,r,gain){r=r||Math.max(10,Math.round(w/24));gain=gain||2.4;const m=localMean(g,w,h,r),o=new Uint8ClampedArray(w*h);
 for(let i=0;i<o.length;i++){const bg=Math.max(m[i],1),rel=g[i]/bg;/* 1 = same as surroundings, <1 = darker (ink) */o[i]=255-Math.max(0,Math.min(255,(1-rel)*255*gain))}
 return o}
/* RGBA in -> RGBA out (black on white) */
function clean(rgba,w,h){const g=gray(rgba,w,h),d=darkMask(g,w,h),o=new Uint8ClampedArray(rgba.length);
 for(let i=0,j=0;i<d.length;i++,j+=4){const v=d[i]?0:255;o[j]=o[j+1]=o[j+2]=v;o[j+3]=255}return o}

/* ---- barcode ---- */
function vruns(d,w,h,K){const v=new Uint8Array(w*h);
 for(let x=0;x<w;x++){let s=-1;for(let y=0;y<=h;y++){const on=y<h&&d[y*w+x];if(on&&s<0)s=y;else if(!on&&s>=0){if(y-s>=K)for(let t=s;t<y;t++)v[t*w+x]=1;s=-1}}}
 return v}
function findBarcode(d,w,h){const s=w/768,K=Math.max(14,Math.round(40*s)),v=vruns(d,w,h,K),cnt=new Uint32Array(h);let mx=0;
 for(let y=0;y<h;y++){let c=0;for(let x=0;x<w;x++)c+=v[y*w+x];cnt[y]=c;if(c>mx)mx=c}
 /* the barcode rows hold far more vertical ink than anything else (folds, edges, letters): keep rows near the peak */
 const thr=Math.max(w*.03,mx*.45),rows=[];for(let y=0;y<h;y++)if(cnt[y]>thr)rows.push(y)
 if(!rows.length)return null;
 const groups=[];let a=rows[0],p=rows[0];for(let i=1;i<rows.length;i++){if(rows[i]-p>20*s){groups.push([a,p]);a=rows[i]}p=rows[i]}groups.push([a,p]);
 let best=null;
 for(const[y0,y1]of groups){let tr=0,prev=0,x0=w,x1=-1;
  for(let x=0;x<w;x++){let on=0;for(let y=y0;y<=y1;y++)if(v[y*w+x]){on=1;break}if(on&&!prev)tr++;prev=on;if(on){if(x<x0)x0=x;x1=x}}
  if(tr>=20&&x1-x0>w*.35&&y1-y0>=K*.8&&(!best||tr>best.tr))best={y0,y1,x0,x1,tr}}
 return best?{...best,v,s}:null}
const medfilt=(a,k)=>{const o=new Float32Array(a.length),r=k>>1;for(let i=0;i<a.length;i++){const q=[];for(let j=Math.max(0,i-r);j<=Math.min(a.length-1,i+r);j++)q.push(a[j]);q.sort((x,y)=>x-y);o[i]=q[q.length>>1]}return o};
/* Straighten the printed digits under the bars (they follow the same arc as the bars' lower edge), erase the bars, drop specks,
   and close up the wide gaps so a text reader sees one normal-spaced string. Returns gray images (0 black / 255 white). */
function digitLine(d,w,h,B){const s=B.s,v=B.v,x0=B.x0,x1=B.x1,ya=Math.max(0,Math.round(B.y0-25*s)),yb=Math.min(h-1,Math.round(B.y1+40*s)),n=x1-x0+1,bb=new Float32Array(n).fill(NaN);
 for(let i=0;i<n;i++){const x=x0+i;for(let y=yb;y>=ya;y--)if(v[y*w+x]){bb[i]=y;break}}
 let lo=-1;const xs=[];for(let i=0;i<n;i++)if(!isNaN(bb[i]))xs.push(i);if(xs.length<10)return null;
 for(let i=0;i<n;i++){if(!isNaN(bb[i]))continue;let l=-1,r=-1;for(let j=i;j>=0;j--)if(!isNaN(bb[j])){l=j;break}for(let j=i;j<n;j++)if(!isNaN(bb[j])){r=j;break}
  bb[i]=l<0?bb[r]:r<0?bb[l]:bb[l]+(bb[r]-bb[l])*(i-l)/(r-l)}
 const bm=medfilt(bb,(Math.round(31*s)|1)),off=Math.round((B.off==null?4:B.off)*s),hh=Math.round((B.hh||55)*s),
  /* bars widened by 1px each side so their anti-aliased edges are gone too */
  vv=(x,y)=>v[y*w+x]||(x>0&&v[y*w+x-1])||(x<w-1&&v[y*w+x+1]);
 const strip=new Uint8Array(n*hh).fill(0);let tmin=1e9,tmax=-1;
 for(let i=0;i<n;i++){const top=Math.round(bm[i])+off;tmin=Math.min(tmin,top);tmax=Math.max(tmax,top+hh);for(let y=0;y<hh;y++){const yy=top+y;if(yy<0||yy>=h)continue;const x=x0+i;strip[y*n+i]=d[yy*w+x]&&!vv(x,yy)?1:0}}
 /* glyph runs = columns that hold ink */
 const col=new Uint8Array(n),runs=[];for(let i=0;i<n;i++){let c=0;for(let y=0;y<hh;y++)c+=strip[y*n+i];col[i]=c>0?1:0}
 let st=-1;for(let i=0;i<=n;i++){if(i<n&&col[i]){if(st<0)st=i}else if(st>=0){let r0=hh,r1=-1;for(let y=0;y<hh;y++)for(let x=st;x<i;x++)if(strip[y*n+x]){if(y<r0)r0=y;if(y>r1)r1=y}
  const gh=r1-r0+1;if(gh>=10*s||(i-st>=6*s&&gh>=1))runs.push([st,i]);st=-1}}
 if(runs.length<6)return null;
 const gap=Math.max(3,Math.round(6*s)),compose=rs=>{const wd=rs.reduce((t,[a,b])=>t+(b-a+2)+gap,0),o=new Uint8ClampedArray(wd*hh).fill(255);let cx=0;
  for(const[a,b]of rs){const a0=Math.max(0,a-1),b0=Math.min(n,b+1);for(let y=0;y<hh;y++)for(let x=a0;x<b0;x++)if(strip[y*n+x])o[y*wd+cx+(x-a0)]=0;cx+=(b0-a0)+gap}return{data:o,w:wd,h:hh}};
 return{full:compose(runs),head:compose(runs.slice(0,4)),glyphs:runs.length,box:{x0:Math.max(0,x0-4),x1:Math.min(w,x1+4),y0:Math.max(0,B.y0-4),y1:Math.min(h,tmax)},s}}
/* Combine the whole-line read with a read of the first four glyphs: a text reader often drops a leading 0 on a long line. */
function reconcile(full,head,glyphs){let f=String(full||'').replace(/[^0-9\-]/g,''),p=String(head||'').replace(/[^0-9\-]/g,''),hn=Math.min(4,glyphs);if(!f)return{text:'',ok:false};
 /* the short first-glyphs read is the steadier one for the start of the line */
 if(p.length===hn&&f.length===glyphs)f=p+f.slice(hn);
 else if(p.length>=3&&!f.startsWith(p)&&f.startsWith(p.slice(1))&&f.length<glyphs)f=p[0]+f;
 return{text:f,ok:f.length===glyphs}}
root.Scan={gray,darkMask,flatten,clean,findBarcode,digitLine,reconcile,localMean};if(typeof module!=='undefined')module.exports=root.Scan})(typeof globalThis!=='undefined'?globalThis:this);
