/* Progressive enhancement only. Links and category disclosures work without JS. */
(function () {
 'use strict';
 const doc=document, body=doc.body, shell=doc.getElementById('cyf-navigation-shell');
 if (!shell) return;
 const panel=doc.getElementById('cyf-sidebar'), toggle=doc.getElementById('cyf-menu-toggle'), closeButton=shell.querySelector('.cyf-menu-close'), backdrop=shell.querySelector('.cyf-nav-backdrop'), mobile=matchMedia('(max-width:1199px)');
 let open=false, previousFocus=null, savedOverflow='', inertState=[];
 body.classList.add('cyf-nav-ready');
 function close(restore=true) {
  if (!open) return;
  open=false; body.classList.remove('cyf-nav-open'); toggle.setAttribute('aria-expanded','false'); backdrop.hidden=true;
  panel.removeAttribute('role'); panel.removeAttribute('aria-modal');
  body.style.overflow=savedOverflow;
  inertState.forEach(([el,value])=>{el.inert=value;}); inertState=[];
  if (restore && previousFocus && previousFocus.isConnected) previousFocus.focus({preventScroll:true});
 }
 function show() {
  if (!mobile.matches || open) return;
  previousFocus=doc.activeElement; savedOverflow=body.style.overflow; open=true;
  body.classList.add('cyf-nav-open'); body.style.overflow='hidden'; toggle.setAttribute('aria-expanded','true'); backdrop.hidden=false;
  panel.setAttribute('role','dialog'); panel.setAttribute('aria-modal','true');
  inertState=Array.from(body.children).filter(el=>el!==shell).map(el=>[el,el.inert]); inertState.forEach(([el])=>{el.inert=true;});
  closeButton.focus({preventScroll:true});
 }
 toggle.addEventListener('click',()=>open?close():show()); closeButton.addEventListener('click',()=>close()); backdrop.addEventListener('click',()=>close());
 doc.addEventListener('keydown',event=>{
  if (!open) return;
  if (event.key==='Escape'){event.preventDefault();close();return;}
  if (event.key!=='Tab') return;
  const nodes=Array.from(panel.querySelectorAll('button, a[href], summary, [tabindex="0"]')).filter(el=>el.getClientRects().length && getComputedStyle(el).visibility!=='hidden');
  const first=nodes[0], last=nodes[nodes.length-1];
  if (event.shiftKey && (doc.activeElement===first || !panel.contains(doc.activeElement))){event.preventDefault();last.focus();}
  else if (!event.shiftKey && (doc.activeElement===last || !panel.contains(doc.activeElement))){event.preventDefault();first.focus();}
 });
 panel.addEventListener('click',event=>{if(event.target.closest('a[href]')) close();});
 mobile.addEventListener('change',()=>{close(false);if (!mobile.matches && doc.activeElement===toggle) panel.querySelector('a').focus();});
 window.addEventListener('pagehide',()=>close(false));
 window.addEventListener('pageshow',()=>close(false));
})();
