(function(){
'use strict';
const $=id=>document.getElementById(id), model=window.TripQuotes, form=$('trip-form'), status=$('trip-status'), results=$('trip-results');
const keys=['nights','airfare','lodging','daily','extras'],sharedKeys=['party','budget','contingency'];
const dollars=cents=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(cents/100);
let current=null,alternative=false;
function values(){const shared=Object.fromEntries(sharedKeys.map(k=>[k,$(k).value]));const scenario=p=>Object.fromEntries(keys.map(k=>[k,$(p+'-'+k).value]));return {shared,a:scenario('a'),b:scenario('b')};}
function validate(){let first=null;for(const input of form.querySelectorAll('input')){const key=input.id.replace(/^[ab]-/,'');try{model.parse(input.value,key);input.removeAttribute('aria-invalid');input.removeAttribute('aria-describedby');}catch(e){input.setAttribute('aria-invalid','true');input.setAttribute('aria-describedby','trip-status');if(!first)first={input,message:input.parentElement.firstChild.textContent+': '+e.message};}}return first;}
function update(focusError=false){
 const error=validate();current=null;
 if(error){results.hidden=true;$('trip-rows').replaceChildren();status.className='error';status.textContent=error.message+' Results are hidden until all fields are valid.';if(focusError)error.input.focus();return;}
 const input=values(),r=model.compare(input.shared,input.a,input.b);current={input,r};status.className='';results.hidden=false;
 const fit=x=>x.headroom>=0?'Within the entered cap by '+dollars(x.headroom)+'. Quote availability not checked.':'Over the hard cap by '+dollars(-x.headroom)+'.';
 status.textContent='Comparison updated. A: '+fit(r.A)+' B: '+fit(r.B);
 $('original-constraints').textContent='Unchanged across both scenarios: '+r.A.party+' travelers · hard cap '+dollars(r.A.budget)+' · '+input.shared.contingency+'% contingency. A remains '+r.A.nights+' nights / '+r.A.days+' allowance days; B is '+r.B.nights+' nights / '+r.B.days+' allowance days.';
 for(const p of ['a','b']){$(p+'-total').textContent=dollars(r[p.toUpperCase()].total);$(p+'-fit').textContent=fit(r[p.toUpperCase()]);}
 const rows=[['Nights / allowance days',x=>x.nights+' / '+x.days],['Party transport, once',x=>dollars(x.airfare)],['All-room accommodation × nights',x=>dollars(x.lodging)],['Per-person allowance × people × days',x=>dollars(x.daily)],['One-time extras',x=>dollars(x.extras)],['Base subtotal',x=>dollars(x.subtotal)],['Chosen contingency',x=>dollars(x.contingency)],['All-in total',x=>dollars(x.total)],['Headroom (negative = shortfall)',x=>dollars(x.headroom)]];
 $('trip-rows').replaceChildren(...rows.map(([label,format])=>{const tr=document.createElement('tr'),th=document.createElement('th');th.scope='row';th.textContent=label;tr.append(th);for(const x of [r.A,r.B]){const td=document.createElement('td');td.textContent=format(x);tr.append(td);}return tr;}));
 $('trip-difference').textContent=r.difference===0?'Both scenarios have the same modeled total.':'B is '+dollars(Math.abs(r.difference))+(r.difference>0?' more':' less')+' than A in total.';
 $('flight-tradeoff').textContent='B versus A: party transport '+(r.airfareSaving>=0?'saves ':'costs an extra ')+dollars(Math.abs(r.airfareSaving))+'; other base costs '+(r.otherBaseChange>=0?'increase by ':'decrease by ')+dollars(Math.abs(r.otherBaseChange))+'; contingency '+(r.contingencyChange>=0?'increases by ':'decreases by ')+dollars(Math.abs(r.contingencyChange))+'. Compare the whole trip, not only the fare.';
 $('extra-night').textContent='At A’s unchanged unit prices, one extra night and one extra allowance day add '+dollars(r.A.extraNightBase)+' before contingency ('+dollars(r.A.extraNightTotal)+' with the rounded buffer). To offset that extra time with transport savings alone, the party transport price would need to fall by '+dollars(r.A.extraNightBase)+' before contingency. This is hypothetical; replacement quotes may change other costs.';
 const ceiling=x=>x.airfareCeiling===null?'No nonnegative transport price fits: non-transport costs plus contingency already exceed the cap.':dollars(x.airfareCeiling)+' for the entire party, round trip (not an available fare).';
 $('airfare-ceilings').textContent='Maximum transport price within your cap — A: '+ceiling(r.A)+' B: '+ceiling(r.B);
 $('shorter-trip').disabled=r.A.nights===0;
 $('alternative-note').textContent=alternative?'You chose a hypothetical shorter alternative in B: '+r.B.nights+' nights / '+r.B.days+' allowance days, copied from A’s unit costs. A and the hard cap were not changed. Verify a real quote before relying on it.':(r.A.nights===0?'A already has zero nights; it cannot be shortened by another night.':'The button changes B only after you choose it. Any manual edit clears the shorter-alternative label.');
}
form.addEventListener('input',()=>{alternative=false;update();});
form.addEventListener('submit',e=>{e.preventDefault();update(true);});
form.addEventListener('reset',()=>{alternative=false;setTimeout(()=>update(),0);});
$('shorter-trip').addEventListener('click',()=>{if(!current||current.r.A.nights===0)return;for(const k of keys)$('b-'+k).value=$('a-'+k).value;$('b-nights').value=String(current.r.A.nights-1);alternative=true;update();});
$('trip-export').addEventListener('click',()=>{
 if(!current)return;
 const {input,r}=current,rows=[['Trip quote comparison - user-entered USD, not available offers'],['Field','A original','B comparison'],...sharedKeys.map(k=>[k,input.shared[k],input.shared[k]]),...keys.map(k=>[k,input.a[k],input.b[k]]),['allowance days',r.A.days,r.B.days],...['lodging','daily','subtotal','contingency','total','headroom'].map(k=>[k+' USD',(r.A[k]/100).toFixed(2),(r.B[k]/100).toFixed(2)]),['party transport ceiling USD',...['A','B'].map(k=>r[k].airfareCeiling===null?'No nonnegative fare fits':(r[k].airfareCeiling/100).toFixed(2))],['Limitations','No availability check; verify quotes; not personalized advice'],['Duration alternative explicitly selected',alternative?'Yes':'No']];
 const csv=rows.map(row=>row.map(cell=>'"'+String(cell).replace(/"/g,'""')+'"').join(',')).join('\r\n');
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='trip-quote-comparison.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
update();
})();
