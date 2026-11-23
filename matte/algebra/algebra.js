// ── algebra.js v1.0 ──
// Leser algebraiske uttrykk som elevene skriver (5x + 2y − 3, x^2, x², 3(x+2), (x−4)(x+1)),
// regner dem om til polynomer, og sjekker både verdi og form (forenklet, ganget ut, faktorisert).
// Polynom: Map fra monom-nøkkel ("x^2y", "" for konstantledd) til koeffisient.
(function(){
const A={};
window.ALG=A;
const EPS=1e-9;

// ── TOKENISERING ──
function tokenize(src){
  let s=String(src||'').trim()
    .replace(/[−–—]/g,'-').replace(/[·×⋅∙]/g,'*').replace(/:/g,'/').replace(/÷/g,'/')
    .replace(/²/g,'^2').replace(/³/g,'^3').replace(/\*\*/g,'^')
    .replace(/(\d),(\d)/g,'$1.$2').replace(/\s+/g,'');
  s=s.replace(/^[a-z]?(\([a-z]\))?=/i,''); // tillat «A =» eller «f(x) =» foran
  const out=[]; let i=0;
  while(i<s.length){
    const c=s[i];
    if(/\d|\./.test(c)){ let j=i; while(j<s.length&&/[\d.]/.test(s[j])) j++; const num=s.slice(i,j); if((num.match(/\./g)||[]).length>1) throw new Error('tall'); out.push({t:'num',v:parseFloat(num)}); i=j; continue; }
    if(/[a-zæøå]/i.test(c)){ out.push({t:'var',v:c.toLowerCase()}); i++; continue; }
    if('+-*/^()'.includes(c)){ out.push({t:c}); i++; continue; }
    throw new Error('tegn:'+c);
  }
  return out;
}
// ── PARSER → syntakstre ──
// Grammatikk: sum := term (('+'|'-') term)* ; term := faktor ((‘*’|‘/’|implisitt) faktor)* ; faktor := ('-'|'+') faktor | atom ('^' heltall)?
function parse(src){
  const tk=tokenize(src); let p=0;
  const peek=()=>tk[p], eat=t=>{ if(tk[p]&&tk[p].t===t){ p++; return true; } return false; };
  function sum(){
    const terms=[]; let sign=1;
    if(eat('-')) sign=-1; else eat('+');
    terms.push({sign,node:term()});
    while(peek()&&(peek().t==='+'||peek().t==='-')){ const s=tk[p++].t==='-'?-1:1; terms.push({sign:s,node:term()}); }
    return terms.length===1&&terms[0].sign===1?terms[0].node:{k:'sum',terms};
  }
  function term(){
    const fs=[{op:'*',node:factor()}];
    while(peek()&&(peek().t==='*'||peek().t==='/'||peek().t==='num'||peek().t==='var'||peek().t==='(')){
      let op='*'; if(peek().t==='*'||peek().t==='/'){ op=tk[p++].t; }
      fs.push({op,node:factor()});
    }
    return fs.length===1?fs[0].node:{k:'mul',fs};
  }
  function factor(){
    if(eat('-')) return {k:'neg',a:factor()};
    if(eat('+')) return factor();
    let a=atom();
    while(eat('^')){ const e=peek(); if(!e||e.t!=='num'||!Number.isInteger(e.v)) throw new Error('eksponent'); p++; a={k:'pow',a,e:e.v}; }
    return a;
  }
  function atom(){
    const t=tk[p];
    if(!t) throw new Error('slutt');
    if(t.t==='num'){ p++; return {k:'num',v:t.v}; }
    if(t.t==='var'){ p++; return {k:'var',v:t.v}; }
    if(eat('(')){ const s=sum(); if(!eat(')')) throw new Error('parentes'); return {k:'par',a:s}; }
    throw new Error('uventet');
  }
  const tree=sum();
  if(p<tk.length) throw new Error('rest');
  return tree;
}
A.parse=parse;

// ── POLYNOMER ──
const key=m=>Object.keys(m).filter(v=>m[v]).sort().map(v=>v+(m[v]>1?'^'+m[v]:'')).join('');
const unkey=k=>{ const m={}; (k.match(/[a-zæøå](\^\d+)?/g)||[]).forEach(t=>{ m[t[0]]=t.length>1?+t.slice(2):1; }); return m; };
const P={
  num:c=>new Map(Math.abs(c)<EPS?[]:[['',c]]),
  add(a,b,s=1){ const r=new Map(a); b.forEach((c,k)=>{ const v=(r.get(k)||0)+s*c; if(Math.abs(v)<EPS) r.delete(k); else r.set(k,v); }); return r; },
  mul(a,b){ let r=new Map(); a.forEach((c1,k1)=>b.forEach((c2,k2)=>{ const m=unkey(k1), n=unkey(k2); Object.keys(n).forEach(v=>m[v]=(m[v]||0)+n[v]); r=P.add(r,new Map([[key(m),c1*c2]])); })); return r; },
  pow(a,e){ let r=P.num(1); for(let i=0;i<e;i++) r=P.mul(r,a); return r; },
};
A.P=P;
function toPoly(n){
  switch(n.k){
    case 'num': return P.num(n.v);
    case 'var': return new Map([[n.v,1]]);
    case 'neg': return P.mul(P.num(-1),toPoly(n.a));
    case 'par': return toPoly(n.a);
    case 'pow': if(n.e<0||n.e>8) throw new Error('eksponent'); return P.pow(toPoly(n.a),n.e);
    case 'sum': return n.terms.reduce((acc,t)=>P.add(acc,toPoly(t.node),t.sign),new Map());
    case 'mul': return n.fs.reduce((acc,f)=>{ const q=toPoly(f.node); if(f.op==='*') return P.mul(acc,q);
      if(q.size!==1||!q.has('')) throw new Error('deling'); return P.mul(acc,P.num(1/q.get(''))); },P.num(1));
  }
}
A.poly=src=>toPoly(typeof src==='string'?parse(src):src);
A.equal=(a,b)=>{ if(a.size!==b.size) return false; for(const [k,c] of a){ if(!b.has(k)||Math.abs(b.get(k)-c)>1e-7) return false; } return true; };

// ── FORMATERING ──
const deg=k=>{ const m=unkey(k); return Object.values(m).reduce((a,b)=>a+b,0); };
const sup=e=>String(e).replace(/\d/g,d=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);
const fmtNum=v=>{ v=Math.round(v*1e6)/1e6; return String(v).replace('.',','); };
function monoStr(k,c,first){
  const m=unkey(k), vars=Object.keys(m).sort().map(v=>v+(m[v]>1?sup(m[v]):'')).join('');
  const a=Math.abs(c), sign=c<0?(first?'−':' − '):(first?'':' + ');
  return sign+(vars?(Math.abs(a-1)<EPS?'':fmtNum(a))+vars:fmtNum(a));
}
// Sortering: høyest grad først, så alfabetisk på variabler
A.order=(a,b)=>deg(b)-deg(a)||(a<b?-1:a>b?1:0);
A.fmt=poly=>{ if(!poly.size) return '0'; return [...poly.keys()].sort((x,y)=>A.order(x,y)).map((k,i)=>monoStr(k,poly.get(k),i===0)).join(''); };
// Polynom fra liste av [koeffisient, monom], f.eks. [[2,'x^2'],[-3,'x'],[5,'']]
A.mk=list=>list.reduce((acc,[c,k])=>P.add(acc,new Map([[key(unkey(k)),c]])),new Map());
A.evalAt=(poly,vals)=>{ let s=0; poly.forEach((c,k)=>{ const m=unkey(k); let t=c; Object.keys(m).forEach(v=>t*=Math.pow(vals[v],m[v])); s+=t; }); return s; };

// ── FORM ──
// Er treet en sum av monomer der hvert monom forekommer én gang (ferdig forenklet, ingen parenteser)?
function isMonomial(n){
  const isVarPow=x=>x.k==='var'||(x.k==='pow'&&x.a.k==='var');
  if(n.k==='num'||isVarPow(n)) return true;
  if(n.k==='neg') return n.a.k!=='neg'&&isMonomial(n.a);
  if(n.k!=='mul') return false;
  if(!n.fs.every(f=>f.node.k==='num'||(f.op==='*'&&isVarPow(f.node)))) return false;
  // Tallfaktor: høyst ett tall som ganges (og det først), men gjerne deling med tall: 1/2x, x/2
  const mulNums=n.fs.filter((f,i)=>f.node.k==='num'&&f.op==='*');
  if(mulNums.length>1||(mulNums.length===1&&n.fs[0].node.k!=='num')) return false;
  const vars=n.fs.filter(f=>f.node.k!=='num').map(f=>f.node.k==='var'?f.node.v:f.node.a.v);
  return new Set(vars).size===vars.length;
}
function simplifiedInfo(tree){
  const terms=tree.k==='sum'?tree.terms.map(t=>t.node):[tree];
  const hasPar=n=>n.k==='par'||(n.a&&hasPar(n.a))||(n.fs&&n.fs.some(f=>hasPar(f.node)))||(n.terms&&n.terms.some(t=>hasPar(t.node)));
  if(!terms.every(isMonomial)) return {ok:false,why:terms.some(hasPar)?'parentes':'gange'};
  const keys=terms.map(t=>{ const p=toPoly(t); return p.size?[...p.keys()][0]:'0'; });
  if(keys.includes('0')) return {ok:false,why:'null'};
  if(new Set(keys).size!==keys.length) return {ok:false,why:'like'};
  // samme variabel to ganger i ett ledd (x·x)
  return {ok:true};
}
// Faktorer i et produkt (toppnivå), med fortegn trukket ut
function factorsOf(tree){
  let sign=1, n=tree;
  if(n.k==='sum'&&n.terms.length===1){ sign=n.terms[0].sign; n=n.terms[0].node; }
  while(n.k==='neg'){ sign=-sign; n=n.a; }
  if(n.k==='mul'&&n.fs.every(f=>f.op==='*')) return {sign,fs:n.fs.map(f=>f.node)};
  return {sign,fs:[n]};
}
const isSumFactor=n=>(n.k==='par'&&n.a.k==='sum')||(n.k==='pow'&&n.a.k==='par'&&n.a.a.k==='sum');
// Innholdet i en sum: største felles tallfaktor og felles variabler
function content(poly){
  const cs=[...poly.values()].map(c=>Math.round(Math.abs(c)*1e6)/1e6);
  const ints=cs.every(c=>Number.isInteger(c));
  const g=ints?cs.reduce((a,b)=>{ while(b){ [a,b]=[b,a%b]; } return a; }):1;
  const ms=[...poly.keys()].map(unkey);
  const common=Object.keys(ms[0]||{}).filter(v=>ms.every(m=>m[v]));
  return {g,common};
}
A.content=content;

// ── SJEKK ──
// mode: 'value' (bare verdi), 'simplified' (ferdig trukket sammen / ganget ut), 'factored' (felles faktor helt ut), 'linear' (produkt av to førstegradsfaktorer)
A.check=function(input,target,mode){
  const raw=String(input||'').trim();
  if(!raw) return {ok:false,empty:true,msg:'Skriv et uttrykk.'};
  if(/[a-zæøå]\d/i.test(raw.replace(/\s/g,''))) return {ok:false,msg:'Skriv potenser med ^ eller ², for eksempel x^2 eller x². Tall skrives foran bokstaven: 3x, ikke x3.'};
  let tree, poly;
  try{ tree=parse(raw); poly=toPoly(tree); }
  catch(e){ return {ok:false,msg:'Jeg forstår ikke uttrykket. Sjekk parenteser og tegn. Eksempel: 3x + 2y − 4, x^2 + 5x, 3(x + 2).'}; }
  const same=A.equal(poly,target);
  if(!same) return {ok:false,wrongValue:true,poly};
  if(mode==='value') return {ok:true};
  if(mode==='simplified'){
    const s=simplifiedInfo(tree);
    if(s.ok) return {ok:true};
    return {ok:false,formOnly:true,msg:s.why==='gange'?'Riktig verdi, men regn ut gangingen i leddene: x · x = x², 2 · 3x = 6x.':s.why==='parentes'?'Riktig verdi, men du har ikke regnet ferdig. Løs opp parentesene og trekk sammen.':s.why==='like'?'Riktig verdi, men trekk sammen de like leddene.':'Riktig verdi, men fjern ledd som er null.'};
  }
  const {sign,fs}=factorsOf(tree);
  const sums=fs.filter(isSumFactor);
  if(!sums.length) return {ok:false,formOnly:true,msg:mode==='linear'?'Riktig verdi, men svaret skal skrives som to parenteser ganget sammen, for eksempel (x + 2)(x + 3).':'Riktig verdi, men svaret skal skrives som et produkt, med parentes. Eksempel: 3(2x + 3).'};
  if(mode==='factored'){
    // Hver parentes skal være «primitiv»: ingen felles tallfaktor og ingen felles variabel igjen
    const intT=[...target.values()].every(c=>Math.abs(c-Math.round(c))<1e-9);
    if(intT&&sums.some(f=>[...toPoly(f).values()].some(c=>Math.abs(c-Math.round(c))>1e-9))) return {ok:false,formOnly:true,msg:'Riktig verdi, men bruk hele tall inne i parentesen. Velg en faktor som går opp i alle tallene.'};
    for(const f of sums){ const c=content(toPoly(f)); if(c.g>1||c.common.length) return {ok:false,formOnly:true,msg:'Riktig verdi, men det er mer å sette utenfor parentesen'+(c.g>1?' (tallene i parentesen har felles faktor '+c.g+')':'')+(c.common.length?' (alle leddene i parentesen inneholder '+c.common.join(', ')+')':'')+'.'}; }
    return {ok:true};
  }
  if(mode==='linear'){
    const lin=fs.filter(f=>isSumFactor(f)&&f.k==='par'&&deg([...toPoly(f).keys()].sort((a,b)=>A.order(a,b))[0])===1).length+fs.filter(f=>f.k==='pow'&&isSumFactor(f)).length*2;
    if(lin<2) return {ok:false,formOnly:true,msg:'Riktig verdi, men skriv svaret som to parenteser ganget sammen, for eksempel (x + 2)(x + 3).'};
    return {ok:true};
  }
  return {ok:true};
};
})();
