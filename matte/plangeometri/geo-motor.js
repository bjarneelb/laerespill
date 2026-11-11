// ── geo-motor.js v1.0 ──
// Felles motor for geometrispillene i plangeometri (vinkler, vinkelsum, mangekanter, sirkel, figurer).
// Bygger startskjerm, topplinje, oppgavekort, sjekk av svar, hint, løsning, poeng, nivå, rapport og rom.
// Krever /js/spill-utils.js (syncToTimecode, levelTracker, initRoom, syncRoomScore, showToast, SU.recordResult).
//
// Bruk: GEO.init({ id, title, icon, intro, version, color, levels:{1:{name,desc}}, make(level)->task, explore? })
// task = { type, q, draw?(el), ask:[...], hint, sol:[...], mistakes?(vals)->tekst, after?(el) }
// ask: {kind:'num', lab, unit, val, tol?} | {kind:'choice', lab?, options:[...], val} | {kind:'multi', lab?, options:[...], val:[...]}

(function(){
const G={};
window.GEO=G;

// ── HJELP ──
G.rint=(lo,hi)=>lo+Math.floor(Math.random()*(hi-lo+1));
G.pick=a=>a[Math.floor(Math.random()*a.length)];
G.shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
G.r2=v=>Math.round(v*100)/100;
G.fmt=v=>{ v=Math.round(v*1e6)/1e6; const neg=v<0; v=Math.abs(v); let [i,d]=String(v).split('.'); i=i.replace(/\B(?=(\d{3})+(?!\d))/g,' '); return (neg?'−':'')+i+(d?','+d:''); };
G.parseNum=s=>{ s=String(s||'').trim().replace(/\s/g,'').replace(/−/g,'-').replace(',','.').replace(/°$/,''); if(!/^-?\d*\.?\d+$/.test(s)) return NaN; return parseFloat(s); };
G.esc=t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const rad=d=>d*Math.PI/180;
G.rad=rad;

// ── SVG ──
// Koordinater i piksler, y nedover. Vinkler i grader, mot klokka fra positiv x-akse (som i matte).
G.pt=(cx,cy,r,deg)=>[cx+r*Math.cos(rad(deg)),cy-r*Math.sin(rad(deg))];
G.arc=(cx,cy,r,a0,a1)=>{ // bue fra a0 til a1 mot klokka
  let d=((a1-a0)%360+360)%360; if(d===0) d=360;
  const [x0,y0]=G.pt(cx,cy,r,a0), [x1,y1]=G.pt(cx,cy,r,a0+d);
  return `M${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 ${d>180?1:0} 0 ${x1.toFixed(1)},${y1.toFixed(1)}`;
};
G.wedge=(cx,cy,r,a0,a1)=>`M${cx.toFixed(1)},${cy.toFixed(1)} L`+G.arc(cx,cy,r,a0,a1).slice(1)+' Z';
G.text=(x,y,str,o={})=>`<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${o.anchor||'middle'}" dominant-baseline="middle" font-size="${o.size||15}" font-weight="${o.weight||800}" fill="${o.col||'#0f172a'}" stroke="${o.halo===false?'none':'#fffdfa'}" stroke-width="4" paint-order="stroke">${str}</text>`;
G.line=(a,b,o={})=>`<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="${o.col||'#334155'}" stroke-width="${o.w||3}" ${o.dash?'stroke-dasharray="'+o.dash+'"':''} stroke-linecap="round"/>`;
// Vinkelmerke med etikett. Rett vinkel tegnes som en firkant.
G.angleMark=(cx,cy,a0,a1,label,o={})=>{
  let d=((a1-a0)%360+360)%360;
  const r=o.r||(d<40?44:32), col=o.col||'#c2410c';
  let s='';
  if(Math.abs(d-90)<0.01&&!o.noSquare){
    const q=16, p1=G.pt(cx,cy,q,a0), p2=G.pt(cx,cy,q*Math.SQRT2,a0+45), p3=G.pt(cx,cy,q,a1);
    s+=`<path d="M${p1[0]},${p1[1]} L${p2[0]},${p2[1]} L${p3[0]},${p3[1]}" fill="none" stroke="${col}" stroke-width="2.2"/>`;
  } else {
    if(o.fill) s+=`<path d="${G.wedge(cx,cy,r,a0,a1)}" fill="${o.fill}" opacity="0.35"/>`;
    s+=`<path d="${G.arc(cx,cy,r,a0,a1)}" fill="none" stroke="${col}" stroke-width="2.4"/>`;
  }
  if(label!=null&&label!==''){
    const lr=(o.lr||r+(d<40?20:16)), [lx,ly]=G.pt(cx,cy,lr,a0+d/2);
    s+=G.text(lx,ly,label,{col:o.lcol||col,size:o.size||15});
  }
  return s;
};
G.svg=(w,h,inner,cls='')=>`<svg class="${cls}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img">${inner}</svg>`;
// Tilpass bredden til skjermen
G.W=()=>Math.min(window.innerWidth-48,560);

// ── CSS ──
function css(color){
  const st=document.createElement('style');
  st.textContent=`
:root{--bg:#fff7ed;--panel:#fff;--border:#f1dccb;--accent:${color};--green:#16a34a;--red:#dc2626;--yellow:#f59e0b;--muted:#6b7280;--text:#1e293b;--r:14px;--shadow:0 2px 14px rgba(0,0,0,0.08);}
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Nunito',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;display:flex;flex-direction:column;}
.header{background:var(--accent);color:white;padding:10px 20px;display:flex;align-items:center;justify-content:space-between;gap:10px;box-shadow:0 2px 12px rgba(0,0,0,0.15);}
.header-left h1{font-size:1rem;font-weight:900;}
.header-left p{font-size:0.7rem;opacity:0.85;font-weight:700;}
.header-right{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end;}
.badge{padding:3px 12px;border-radius:20px;font-size:0.8rem;font-weight:800;}
.level-badge{background:rgba(255,255,255,0.2);color:white;}
.score-badge{background:var(--yellow);color:#78350f;}
.btn-menu,.btn-explore{padding:4px 12px;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.4);border-radius:6px;color:white;font-size:0.75rem;font-weight:700;text-decoration:none;cursor:pointer;font-family:inherit;}
.overlay{position:fixed;inset:0;background:rgba(255,247,237,0.97);display:flex;align-items:center;justify-content:center;z-index:200;padding:16px;overflow:auto;}
.start-card{background:white;border:2px solid var(--border);border-radius:16px;padding:26px 28px;width:520px;max-width:100%;text-align:center;box-shadow:var(--shadow);margin:auto;}
.start-card h1{font-size:1.4rem;color:var(--accent);margin-bottom:4px;}
.start-card p{font-size:0.88rem;color:var(--muted);font-weight:700;margin-bottom:12px;line-height:1.5;}
.version{font-size:0.65rem;color:var(--muted);font-family:monospace;margin-bottom:12px;}
.lbl{font-size:0.72rem;color:var(--muted);margin-bottom:6px;font-weight:800;}
.levels{display:flex;flex-direction:column;gap:5px;margin-bottom:12px;max-height:40vh;overflow:auto;}
.lv{display:flex;gap:10px;align-items:center;padding:7px 12px;border:2px solid var(--border);border-radius:10px;background:white;font-family:inherit;cursor:pointer;text-align:left;}
.lv b{font-size:1rem;color:var(--accent);min-width:1.2em;}
.lv span{font-size:0.8rem;font-weight:800;color:var(--muted);}
.lv.active{border-color:var(--accent);background:#fffaf5;}
.lv.active span{color:var(--text);}
.mode-row{display:flex;gap:8px;margin-bottom:10px;}
.mode-btn{flex:1;padding:8px;background:white;border:2px solid var(--border);border-radius:8px;color:var(--muted);font-family:inherit;font-size:0.8rem;font-weight:800;cursor:pointer;}
.mode-btn.active{background:var(--accent);border-color:var(--accent);color:white;}
.name-input{width:100%;padding:9px 12px;border:2px solid var(--border);border-radius:8px;font-family:inherit;font-size:0.95rem;font-weight:800;outline:none;margin-bottom:10px;text-align:center;text-transform:uppercase;letter-spacing:2px;}
.start-btn{width:100%;padding:12px;background:var(--accent);color:white;border:none;border-radius:8px;font-family:inherit;font-size:1rem;font-weight:800;cursor:pointer;}
.explore-btn{width:100%;padding:10px;background:white;color:var(--accent);border:2px solid var(--accent);border-radius:8px;font-family:inherit;font-size:0.92rem;font-weight:800;cursor:pointer;margin-bottom:8px;}
.main{flex:1;display:flex;flex-direction:column;align-items:center;padding:14px;gap:12px;max-width:820px;margin:0 auto;width:100%;}
.card{width:100%;background:var(--panel);border:2px solid var(--border);border-radius:var(--r);padding:16px 18px;box-shadow:var(--shadow);}
.task-head{display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin-bottom:6px;flex-wrap:wrap;}
.task-nr{font-size:1.05rem;font-weight:900;color:var(--accent);}
.task-type{font-size:0.75rem;font-weight:800;color:var(--muted);}
.task-q{font-size:1.05rem;font-weight:800;line-height:1.55;margin-bottom:10px;}
.stage{display:flex;justify-content:center;margin-bottom:12px;max-width:100%;overflow-x:auto;}
.stage svg{display:block;background:#fffdfa;border:2px solid var(--border);border-radius:12px;touch-action:none;max-width:100%;}
.stage:empty{display:none;}
.ask{display:flex;flex-direction:column;align-items:center;gap:10px;}
.row{display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;font-weight:800;font-size:1.05rem;}
.num-in{padding:8px 10px;border:2px solid var(--border);border-radius:8px;font-family:inherit;font-size:1.05rem;font-weight:800;outline:none;text-align:center;width:110px;}
.num-in:focus{border-color:var(--accent);}
.u{color:var(--muted);min-width:1.5em;text-align:left;}
.chips{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;}
.chip{padding:8px 14px;border-radius:10px;border:2px solid var(--border);background:white;font-family:inherit;font-weight:800;font-size:0.92rem;cursor:pointer;color:var(--text);}
.chip.on{border-color:var(--accent);background:var(--accent);color:white;}
.chips.multi .chip.on{background:#fff7ed;color:var(--text);}
.chips.multi .chip.on::before{content:'✓ ';color:var(--accent);}
.ok{border-color:var(--green)!important;background:#f0fdf4!important;color:var(--text)!important;}
.bad{border-color:var(--red)!important;background:#fef2f2!important;color:var(--text)!important;}
.fb{margin-top:12px;border-radius:12px;padding:12px 14px;font-weight:800;line-height:1.65;display:none;}
.fb.err{display:block;background:#fef2f2;border:2px solid #fecaca;color:#991b1b;}
.fb.win{display:block;background:#f0fdf4;border:2px solid #86efac;color:#14532d;}
.fb.info{display:block;background:#eef2ff;border:2px solid #c7d2fe;color:#312e81;}
.fb .big{font-size:1.12rem;display:block;margin-bottom:4px;}
.controls{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;}
.btn{padding:10px 22px;border:none;border-radius:8px;font-family:inherit;font-size:0.92rem;font-weight:800;cursor:pointer;}
.btn-check{background:var(--accent);color:white;}
.btn-next{background:var(--green);color:white;}
.btn-soft{background:#f3f4f6;color:var(--muted);}
button:focus-visible,input:focus-visible{outline:3px solid var(--yellow);outline-offset:2px;}
.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);padding:10px 22px;border-radius:10px;font-weight:800;font-size:0.9rem;opacity:0;transition:all .3s;z-index:1100;pointer-events:none;max-width:90vw;text-align:center;}
.toast.show{opacity:1;transform:translateX(-50%) translateY(0);}
.toast.success{background:var(--green);color:white;} .toast.error{background:var(--red);color:white;} .toast.info{background:var(--accent);color:white;}
.explore{position:fixed;inset:0;z-index:300;background:rgba(15,23,42,0.55);display:flex;align-items:flex-start;justify-content:center;padding:14px;overflow:auto;}
.explore-card{background:white;border-radius:16px;width:760px;max-width:100%;padding:16px 18px;box-shadow:0 20px 60px rgba(0,0,0,0.3);margin:auto;}
.explore-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:8px;}
.explore-head h2{font-size:1.15rem;color:var(--accent);}
.explore-body{display:flex;flex-direction:column;gap:10px;align-items:center;}
.explore-body svg{background:#fffdfa;border:2px solid var(--border);border-radius:12px;touch-action:none;max-width:100%;}
.ex-info{font-weight:800;line-height:1.6;text-align:center;}
.ex-row{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;align-items:center;font-weight:800;}
.ex-tip{font-size:0.82rem;color:var(--muted);font-weight:700;text-align:center;}
table.ex{border-collapse:collapse;font-weight:800;font-size:0.9rem;}
table.ex td,table.ex th{border:1.5px solid var(--border);padding:5px 10px;text-align:center;}
table.ex th{background:#fff7ed;}
@media (max-width:600px){ .header{padding:8px 12px;} .header-left p{display:none;} .task-q{font-size:0.98rem;} .card{padding:12px;} .num-in{width:96px;} }
`;
  document.head.appendChild(st);
}

// ── DOM ──
function build(cfg){
  document.body.insertAdjacentHTML('afterbegin',`
<div class="toast" id="toast"></div>
<div class="overlay" id="startScreen">
  <div class="start-card">
    <div style="font-size:2.6rem">${cfg.icon}</div>
    <h1>${cfg.title}</h1>
    <p>${cfg.intro}</p>
    <div class="version">v${cfg.version||'1.0'}</div>
    ${cfg.explore?'<button class="explore-btn" onclick="GEO.openExplore()">🔍 Utforsk først</button>':''}
    <div class="lbl">Start på nivå</div>
    <div class="levels" id="levels"></div>
    <div class="mode-row">
      <button class="mode-btn active" data-mode="practice" onclick="selectMode('practice')">🧘 Øving</button>
      <button class="mode-btn" data-mode="multi" onclick="selectMode('multi')">🏎️ Bane (romkode)</button>
    </div>
    <div id="multiOpts" style="display:none"><input class="name-input" id="roomInput" placeholder="ROMKODE" maxlength="8" autocomplete="off"></div>
    <button class="start-btn" onclick="GEO.startGame()">🚀 Start</button>
  </div>
</div>
<div class="header">
  <div class="header-left"><h1>${cfg.icon} ${cfg.title}</h1><p>${cfg.subtitle||''}</p></div>
  <div class="header-right">
    <span class="badge" id="roomBadge" style="display:none;background:rgba(255,255,255,0.25);color:white;letter-spacing:1px">🏎️ <span id="roomBadgeCode"></span></span>
    ${cfg.explore?'<button class="btn-explore" onclick="GEO.openExplore()">🔍 Utforsk</button>':''}
    <span class="badge level-badge" id="levelBadge">Nivå 1</span>
    <span class="badge score-badge" id="scoreBadge">0 p</span>
    <a class="btn-menu" href="./">← Meny</a>
  </div>
</div>
<div class="main" id="mainArea" style="display:none">
  <div class="card">
    <div class="task-head"><span class="task-nr" id="taskNr"></span><span class="task-type" id="taskType"></span></div>
    <div class="task-q" id="taskQ"></div>
    <div class="stage" id="stage"></div>
    <div class="ask" id="ask"></div>
    <div class="fb" id="fb"></div>
  </div>
  <div class="controls">
    <button class="btn btn-check" id="checkBtn" onclick="GEO.check()">✅ Sjekk svar</button>
    <button class="btn btn-soft" id="showBtn" onclick="GEO.showSolution()" style="display:none">💡 Vis løsningen</button>
    <button class="btn btn-next" id="nextBtn" onclick="GEO.next()" style="display:none">Neste oppgave ➡️</button>
    <button class="btn btn-soft" id="skipBtn" onclick="GEO.skip()">⏭️ Ny oppgave</button>
  </div>
</div>
<div class="explore" id="explore" style="display:none">
  <div class="explore-card">
    <div class="explore-head"><h2>🔍 ${cfg.explore?cfg.explore.title:''}</h2><button class="btn btn-soft" onclick="GEO.closeExplore()">Lukk ✕</button></div>
    <div class="explore-body" id="exploreBody"></div>
  </div>
</div>`);
}

// ── SPILLTILSTAND (globale navn kreves av SU.recordResult/changeLevel) ──
let cfg=null, task=null, tries=0, done=false, taskNo=0, firstWrong=false, sel={};
const $=id=>document.getElementById(id);
let tcLv=null, tcStart=Date.now(), tcCorrect=0, tcWrong=0;

G.init=function(c){
  cfg=c;
  window.__make=c.make; // brukes av tester
  window.LEVELS=c.levels;
  window.MIN_LEVEL=1; window.MAX_LEVEL=Object.keys(c.levels).length;
  window.currentLevel=1; window.currentScore=0; window.gameMode='practice';
  window.streak=0; window.errorStreak=0;
  css(c.color||'#c2410c'); build(c);
  tcLv=levelTracker();
  buildLevels();
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&$('explore').style.display!=='none'){ G.closeExplore(); return; }
    if(e.key!=='Enter'||$('mainArea').style.display==='none'||$('explore').style.display!=='none') return;
    if(e.target&&e.target.tagName==='BUTTON') return;
    if(done){ G.next(); return; }
    const ins=[...document.querySelectorAll('.num-in')];
    const nxt=ins.find(i=>i!==e.target&&!i.value.trim());
    if(nxt&&e.target.classList&&e.target.classList.contains('num-in')) nxt.focus(); else G.check();
  });
};
function buildLevels(){
  $('levels').innerHTML=Object.keys(cfg.levels).map(l=>`<button class="lv${+l===currentLevel?' active':''}" data-l="${l}"><b>${l}</b><span>${cfg.levels[l].desc}</span></button>`).join('');
  $('levels').querySelectorAll('.lv').forEach(b=>b.onclick=()=>{ window.currentLevel=+b.dataset.l; buildLevels(); });
}
function sync(){
  tcLv.note(currentLevel);
  syncToTimecode(cfg.id,{level:currentLevel,startLevel:tcLv.start,maxLevel:tcLv.max,score:currentScore,correct:tcCorrect,wrong:tcWrong,sessionStart:tcStart});
}
G.startGame=function(){
  if(gameMode==='multi'){
    const rc=$('roomInput').value.trim().toUpperCase();
    if(!rc){ showToast('Skriv inn romkoden','error'); return; }
    initRoom(rc);
  }
  $('levelBadge').textContent=cfg.levels[currentLevel].name;
  $('startScreen').style.display='none';
  $('mainArea').style.display='flex';
  G.next(); sync();
};

// ── OPPGAVE ──
let lastKey=null;
G.next=function(){
  let t, n=0;
  do{ t=cfg.make(currentLevel); n++; }while(n<6&&t.key&&t.key===lastKey);
  lastKey=t.key||null;
  task=t; tries=0; done=false; firstWrong=false; sel={}; taskNo++;
  $('taskNr').textContent='Oppgave '+taskNo;
  $('taskType').textContent=(t.type||'')+' · '+cfg.levels[currentLevel].name;
  $('taskQ').innerHTML=t.q;
  $('stage').innerHTML='';
  if(t.draw) t.draw($('stage'));
  $('ask').innerHTML=t.ask.map((a,i)=>{
    if(a.kind==='num') return `<div class="row">${a.lab?`<span>${a.lab}</span>`:''}<input class="num-in" data-i="${i}" type="text" inputmode="decimal" autocomplete="off"><span class="u">${a.unit??''}</span></div>`;
    return `<div class="row" style="flex-direction:column;gap:6px">${a.lab?`<span>${a.lab}</span>`:''}<div class="chips${a.kind==='multi'?' multi':''}" data-i="${i}">${a.options.map((o,k)=>`<button class="chip" data-k="${k}" type="button">${o}</button>`).join('')}</div></div>`;
  }).join('');
  $('ask').querySelectorAll('.chips').forEach(c=>{
    const i=+c.dataset.i, multi=task.ask[i].kind==='multi';
    c.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{
      if(done) return;
      const k=+b.dataset.k;
      c.querySelectorAll('.chip').forEach(x=>x.classList.remove('ok','bad'));
      if(multi){ sel[i]=sel[i]||new Set(); sel[i].has(k)?sel[i].delete(k):sel[i].add(k); b.classList.toggle('on'); }
      else { sel[i]=k; c.querySelectorAll('.chip').forEach(x=>x.classList.toggle('on',x===b)); }
    });
  });
  $('fb').className='fb'; $('fb').innerHTML='';
  $('checkBtn').style.display=''; $('showBtn').style.display='none'; $('nextBtn').style.display='none'; $('skipBtn').style.display='';
  const first=document.querySelector('.num-in'); if(first&&window.innerWidth>600) first.focus();
};
G.skip=function(){ window.streak=0; G.next(); };
G.__fill=function(){ // kun for automatiske tester
  task.ask.forEach((a,i)=>{
    if(a.kind==='num') document.querySelector(`.num-in[data-i="${i}"]`).value=G.fmt(a.val);
    else document.querySelectorAll(`.chips[data-i="${i}"] .chip`).forEach(b=>{ const o=a.options[+b.dataset.k]; if(a.kind==='choice'?o===a.val:a.val.includes(o)) b.click(); });
  });
};
function optVal(a,k){ return a.options[k]; }
G.check=function(){
  if(done||!task) return;
  const vals=[]; let missing=false;
  task.ask.forEach((a,i)=>{
    if(a.kind==='num'){ const inp=document.querySelector(`.num-in[data-i="${i}"]`); const v=G.parseNum(inp.value); if(!Number.isFinite(v)) missing=true; vals.push(v); }
    else if(a.kind==='choice'){ if(sel[i]===undefined) missing=true; vals.push(sel[i]===undefined?null:optVal(a,sel[i])); }
    else { vals.push(sel[i]?[...sel[i]].map(k=>optVal(a,k)):[]); }
  });
  if(missing){ $('fb').className='fb err'; $('fb').innerHTML='Svar på alt før du sjekker. Skriv tall med komma for desimaler, og trykk på et valg der det er knapper.'; return; }
  let allOk=true;
  task.ask.forEach((a,i)=>{
    let ok;
    if(a.kind==='num'){ ok=Math.abs(vals[i]-a.val)<=(a.tol!=null?a.tol:0.0051); const inp=document.querySelector(`.num-in[data-i="${i}"]`); inp.classList.remove('ok','bad'); inp.classList.add(ok?'ok':'bad'); }
    else if(a.kind==='choice'){ ok=vals[i]===a.val; const b=document.querySelector(`.chips[data-i="${i}"] .chip[data-k="${sel[i]}"]`); if(b){ b.classList.add(ok?'ok':'bad'); } }
    else { const want=new Set(a.val), got=new Set(vals[i]); ok=want.size===got.size&&[...want].every(x=>got.has(x));
      document.querySelectorAll(`.chips[data-i="${i}"] .chip`).forEach(b=>{ const o=a.options[+b.dataset.k]; b.classList.remove('ok','bad'); if(got.has(o)) b.classList.add(want.has(o)?'ok':'bad'); }); }
    a._ok=ok; if(!ok) allOk=false;
  });
  if(allOk){ right(); return; }
  wrong(task.mistakes?task.mistakes(vals):null);
};
function wrong(msg){
  tries++; tcWrong++;
  if(!firstWrong){ firstWrong=true; SU.recordResult(false); }
  sync();
  const n=task.ask.length, bad=task.ask.filter(a=>!a._ok).length;
  $('fb').className='fb err';
  $('fb').innerHTML='✗ '+(n>1?(bad===n?'Ingen av svarene stemmer ennå.':bad+' av '+n+' svar stemmer ikke (rød ramme).'):'Ikke helt.')+' '+(msg||('💡 '+task.hint));
  if(tries>=2) $('showBtn').style.display='';
}
function right(){
  const base=cfg.points?cfg.points(currentLevel):10+5*currentLevel;
  const pts=tries===0?base:tries===1?Math.round(base/2):3;
  window.currentScore+=pts; $('scoreBadge').textContent=currentScore+' p';
  tcCorrect++;
  if(tries===0) SU.recordResult(true);
  sync();
  if(gameMode==='multi') syncRoomScore(currentScore);
  finish(true,'+'+pts+' poeng');
}
function finish(won,extra){
  done=true;
  // Vis riktige svar i feltene
  task.ask.forEach((a,i)=>{
    if(a.kind==='num'){ const inp=document.querySelector(`.num-in[data-i="${i}"]`); if(!won){ inp.value=G.fmt(a.val); } inp.readOnly=true; }
    else if(a.kind==='choice'){ document.querySelectorAll(`.chips[data-i="${i}"] .chip`).forEach(b=>{ b.classList.remove('on','bad'); if(a.options[+b.dataset.k]===a.val) b.classList.add('ok'); }); }
    else { const want=new Set(a.val); document.querySelectorAll(`.chips[data-i="${i}"] .chip`).forEach(b=>{ b.classList.remove('on','bad','ok'); if(want.has(a.options[+b.dataset.k])) b.classList.add('ok'); }); }
  });
  if(task.after) task.after($('stage'));
  $('fb').className='fb '+(won?'win':'info');
  $('fb').innerHTML=`<span class="big">${won?'⭐ Riktig! '+extra:'💡 Løsningen'}</span>${(task.sol||[]).map(l=>'<div>'+l+'</div>').join('')}`;
  $('checkBtn').style.display='none'; $('showBtn').style.display='none'; $('skipBtn').style.display='none';
  $('nextBtn').style.display=''; $('nextBtn').focus();
}
G.showSolution=function(){ if(!done) finish(false); };

// ── UTFORSK ──
G.openExplore=function(){
  if(!cfg.explore) return;
  $('explore').style.display='flex';
  $('exploreBody').innerHTML='';
  cfg.explore.render($('exploreBody'));
};
G.closeExplore=function(){ $('explore').style.display='none'; $('exploreBody').innerHTML=''; };

// Dra et punkt i en SVG. onMove(x,y) får koordinater i SVG-enheter.
G.drag=function(svg,handle,onMove,onEnd){
  const toSvg=e=>{ const r=svg.getBoundingClientRect(), vb=svg.viewBox.baseVal; const p=e.touches?e.touches[0]:e;
    return [(p.clientX-r.left)*vb.width/r.width,(p.clientY-r.top)*vb.height/r.height]; };
  let on=false;
  const down=e=>{ on=true; e.preventDefault(); };
  const move=e=>{ if(!on) return; e.preventDefault(); const [x,y]=toSvg(e); onMove(x,y); };
  const up=()=>{ if(on&&onEnd) onEnd(); on=false; };
  handle.addEventListener('pointerdown',down);
  svg.addEventListener('pointermove',move);
  window.addEventListener('pointerup',up);
};
})();
