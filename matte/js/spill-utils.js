// ── spill-utils.js ──
// Felles hjelpefunksjoner for alle spill
// Inkluder med: <script src="../js/spill-utils.js"></script> (fra spill i undermappe)
//           eller <script src="./js/spill-utils.js"></script> (fra rot)

// ── SESSION ──
function getActiveSession(){
  try{
    const s=JSON.parse(sessionStorage.getItem('matte_session')||'null');
    if(!s||s.skipped||s.noCode||s.expired) return null;
    if(s.expires&&Date.now()>s.expires) return null;
    return s;
  }catch(e){return null;}
}

// ── TIMECODE SYNC ──
// Hvert spill kaller denne med sitt spillnavn og relevante data
// spillnavn: streng som identifiserer spillet i Firebase
// data: objekt med level, score, correct, wrong osv.
function syncToTimecodeGeneric(spillnavn, data){
  const s=getActiveSession(); if(!s) return;
  const name=s.name||window.playerName; if(!name) return;
  const waitFb=()=>{
    if(window._fbReady){
      window._update(window._ref(window._db,'timecodes/'+s.code+'/players/'+name+'/games/'+spillnavn),
        {lastUpdated:Date.now(),...data});
      window._update(window._ref(window._db,'timecodes/'+s.code+'/players/'+name),
        {lastSeen:Date.now(),name});
    } else setTimeout(waitFb,200);
  };
  waitFb();
}

// ── ROOM SYNC (for baner) ──
function initRoom(code){
  // Show room badge in header
  const rb=document.getElementById('roomBadge');
  const rc=document.getElementById('roomBadgeCode');
  if(rb) rb.style.display='';
  if(rc) rc.textContent=code;
  if(!code) return;
  window._roomCode=code;
  const waitFb=()=>{
    if(!window._fbReady){setTimeout(waitFb,200);return;}
    const name=window.playerName||'Spiller';
    window._set(window._ref(window._db,'rooms/'+code+'/players/'+name),{score:0,lastUpdated:Date.now()});
    // Listen for match over
    window._onValue(window._ref(window._db,'rooms/'+code+'/matchOver'),snap=>{
      if(snap.val()===true){
        window._get(window._ref(window._db,'rooms/'+code)).then(s=>{
          const d=s.val()||{};
          showMatchOverToast(d.result||'Kampen er over!');
        }).catch(()=>showMatchOverToast('Kampen er over!'));
      }
    });
  };
  waitFb();
}

function syncRoomScore(score){
  const code=window._roomCode;
  if(!code||!window._fbReady) return;
  const name=window.playerName||'Spiller';
  window._update(window._ref(window._db,'rooms/'+code+'/players/'+name),{score,lastUpdated:Date.now()});
}

// ── MATCH OVER OVERLAY ──
function showMatchOverToast(result){
  if(document.getElementById('matchOverOverlay')) return;
  const overlay=document.createElement('div');
  overlay.id='matchOverOverlay';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;font-family:Nunito,sans-serif;';
  // Detect if in subdir
  const isSubdir=window.location.pathname.split('/').length>3;
  const menuHref=isSubdir?'../':'./';
  overlay.innerHTML=`
    <div style="font-size:3rem">🏆</div>
    <div style="color:white;font-size:1.6rem;font-weight:900;text-align:center;padding:0 20px">${result}</div>
    <div style="color:rgba(255,255,255,0.7);font-size:0.88rem;text-align:center;padding:0 20px">Kampen er over! Start et nytt spill med kampkoden for en ny kamp.</div>
    <a href="${menuHref}" style="padding:12px 28px;background:#5b4fcf;color:white;border-radius:12px;font-weight:800;font-size:1rem;text-decoration:none;margin-top:8px">🏠 Tilbake til meny</a>`;
  document.body.appendChild(overlay);
}

// ── TOAST ──
function showToast(msg,type){
  const t=document.getElementById('toast');
  if(!t) return;
  t.textContent=msg;
  t.className='toast '+type;
  void t.offsetWidth;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),3000);
}

// ── ROOM BADGE HTML (legg til i header) ──
// Brukes for å generere badge-markup konsistent
function getRoomBadgeHTML(){
  return '<span class="badge" id="roomBadge" style="display:none;background:rgba(255,255,255,0.25);color:white;letter-spacing:1px">🏎️ <span id="roomBadgeCode"></span></span>';
}
