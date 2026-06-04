/**
 * touch-dnd.js — Touch drag-and-drop emulation for all spill
 * Translates touchstart/touchmove/touchend into dragstart/dragover/drop events.
 * Include once in each page that uses HTML5 drag-and-drop.
 */
(function(){
  'use strict';

  let dragging=null;       // the element being dragged
  let clone=null;          // visual ghost clone
  let startX=0, startY=0;
  let transferData={};     // simulated dataTransfer storage
  let lastDropTarget=null;

  // Polyfill dataTransfer on synthetic events
  function makeDataTransfer(){
    return {
      _data:{},
      setData(type,val){ this._data[type]=val; },
      getData(type){ return this._data[type]||''; },
      clearData(){ this._data={}; },
      effectAllowed:'all',
      dropEffect:'move',
    };
  }

  // Dispatch a synthetic drag/drop event on an element
  function fire(el,type,dt){
    const ev=new Event(type,{bubbles:true,cancelable:true});
    ev.dataTransfer=dt;
    ev.preventDefault=()=>{};
    el.dispatchEvent(ev);
    return ev;
  }

  // Find topmost element at point, skipping the clone
  function elementAt(x,y){
    if(clone) clone.style.display='none';
    const el=document.elementFromPoint(x,y);
    if(clone) clone.style.display='';
    return el;
  }

  // Find closest ancestor that has ondrop or drop listener
  function findDropTarget(el){
    while(el&&el!==document.body){
      if(el.ondrop||el.dataset.dropzone||
         el.getAttribute('ondrop')||
         el.hasAttribute('data-dropzone')) return el;
      el=el.parentElement;
    }
    return null;
  }

  // Start drag
  function onTouchStart(e){
    const touch=e.touches[0];
    const target=e.target;

    // Only handle draggable elements
    if(!target.draggable&&!target.closest('[draggable="true"]')) return;
    const draggable=target.draggable?target:target.closest('[draggable="true"]');
    if(!draggable) return;

    dragging=draggable;
    startX=touch.clientX;
    startY=touch.clientY;
    transferData=makeDataTransfer();

    // Fire dragstart
    const ev=fire(dragging,'dragstart',transferData);

    // Create ghost clone
    const rect=dragging.getBoundingClientRect();
    clone=dragging.cloneNode(true);
    clone.style.cssText=`
      position:fixed;
      left:${rect.left}px;
      top:${rect.top}px;
      width:${rect.width}px;
      height:${rect.height}px;
      opacity:0.75;
      pointer-events:none;
      z-index:9999;
      transform:scale(1.08);
      transition:transform 0.1s;
      box-shadow:0 8px 24px rgba(0,0,0,0.25);
    `;
    document.body.appendChild(clone);
    dragging.style.opacity='0.3';

    e.preventDefault();
  }

  // Move drag
  function onTouchMove(e){
    if(!dragging) return;
    e.preventDefault();
    const touch=e.touches[0];
    const x=touch.clientX, y=touch.clientY;

    // Move clone
    const rect=dragging.getBoundingClientRect();
    const dx=x-startX, dy=y-startY;
    clone.style.left=(rect.left+dx)+'px';
    clone.style.top=(rect.top+dy)+'px';

    // Find drop target
    const el=elementAt(x,y);
    const dropTarget=el?findDropTarget(el):null;

    if(dropTarget!==lastDropTarget){
      if(lastDropTarget) fire(lastDropTarget,'dragleave',transferData);
      if(dropTarget){
        const ev=new Event('dragover',{bubbles:true,cancelable:true});
        ev.dataTransfer=transferData;
        ev.clientX=x; ev.clientY=y;
        ev.preventDefault=()=>{};
        dropTarget.dispatchEvent(ev);
      }
      lastDropTarget=dropTarget;
    } else if(dropTarget){
      const ev=new Event('dragover',{bubbles:true,cancelable:true});
      ev.dataTransfer=transferData;
      ev.clientX=x; ev.clientY=y;
      ev.preventDefault=()=>{};
      dropTarget.dispatchEvent(ev);
    }
  }

  // End drag
  function onTouchEnd(e){
    if(!dragging) return;
    const touch=e.changedTouches[0];
    const x=touch.clientX, y=touch.clientY;

    // Clean up clone
    if(clone){ clone.remove(); clone=null; }
    dragging.style.opacity='';

    // Fire drop
    const el=elementAt(x,y);
    const dropTarget=el?findDropTarget(el):null;
    if(dropTarget){
      const ev=new Event('drop',{bubbles:true,cancelable:true});
      ev.dataTransfer=transferData;
      ev.clientX=x; ev.clientY=y;
      ev.preventDefault=()=>{};
      dropTarget.dispatchEvent(ev);
    }

    if(lastDropTarget) fire(lastDropTarget,'dragleave',transferData);
    fire(dragging,'dragend',transferData);

    dragging=null;
    lastDropTarget=null;
    transferData={};

    e.preventDefault();
  }

  // Attach listeners
  document.addEventListener('touchstart', onTouchStart, {passive:false});
  document.addEventListener('touchmove',  onTouchMove,  {passive:false});
  document.addEventListener('touchend',   onTouchEnd,   {passive:false});

})();
