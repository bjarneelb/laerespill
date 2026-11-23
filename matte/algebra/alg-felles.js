// ── alg-felles.js v1.0 ──
// Felles hjelpere for algebraspillene: lage svarfelt, skrive uttrykk uforenklet, tegne algebrabrikker.
(function(){
const A=window.ALG, F={};
window.AF=F;
const {rint,pick}=GEO;
F.nz=(lo,hi)=>{ let v; do{ v=rint(lo,hi); }while(v===0); return v; };
// Svarfelt for et uttrykk. mode: 'simplified' | 'factored' | 'linear' | 'value'. show: tekst som vises som fasit
F.ask=(target,mode,o={})=>({kind:'expr',lab:o.lab||'',vars:o.vars||['x'],ph:o.ph,show:o.show||A.fmt(target),check:s=>A.check(s,target,mode)});
// Skriv ledd i gitt rekkefølge uten å forenkle: [[3,'a'],[5,'a'],[-2,'a']] → «3a + 5a − 2a»
const sup=e=>String(e).replace(/\d/g,d=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);
F.mono=(c,k)=>{ const v=String(k).replace(/\^(\d+)/g,(_,e)=>sup(e)); const a=Math.abs(c); return v?(a===1?'':String(a).replace('.',','))+v:String(a).replace('.',','); };
F.terms=list=>list.map(([c,k],i)=>(c<0?(i?' − ':'−'):(i?' + ':''))+F.mono(c,k)).join('');
F.poly=list=>A.mk(list);
// Fortsettelse av et uttrykk: alle ledd med fortegn foran (« + 3x − 2»)
F.more=list=>list.map(([c,k])=>(c<0?' − ':' + ')+F.mono(c,k)).join('');
// Var studentens svar lik et bestemt (feil) polynom?
F.is=(str,poly)=>{ try{ return A.equal(A.poly(str),poly); }catch(e){ return false; } };

// ── ALGEBRABRIKKER ──
// tiles: liste av {k:'x2'|'x'|'y'|'1', n:antall (negativ = røde brikker)}
F.TILE={x2:{w:46,h:46,col:'#60a5fa',neg:'#f87171',lab:'x²'},x:{w:18,h:46,col:'#34d399',neg:'#f87171',lab:'x'},y:{w:18,h:34,col:'#a78bfa',neg:'#f87171',lab:'y'},'1':{w:18,h:18,col:'#fcd34d',neg:'#f87171',lab:'1'}};
F.tiles=(groups,o={})=>{
  const W=o.W||GEO.W(), gap=6;
  let x=12, y=14, rowH=0, s='';
  groups.forEach(g=>{
    const T=F.TILE[g.k], neg=g.n<0;
    for(let i=0;i<Math.abs(g.n);i++){
      if(x+T.w>W-12){ x=12; y+=rowH+gap; rowH=0; }
      s+=`<rect x="${x}" y="${y}" width="${T.w}" height="${T.h}" rx="4" fill="${neg?T.neg:T.col}" stroke="#334155" stroke-width="1.5"/>`;
      if(T.w>=18) s+=`<text x="${x+T.w/2}" y="${y+T.h/2+1}" text-anchor="middle" dominant-baseline="middle" font-size="${T.w>30?14:11}" font-weight="900" fill="#0f172a">${neg?'−':''}${T.lab}</text>`;
      x+=T.w+gap; rowH=Math.max(rowH,T.h);
    }
    x+=14;
  });
  const H=y+rowH+14;
  return GEO.svg(W,Math.max(H,60),s);
};
})();
