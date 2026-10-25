// Synthetic inputs; mocked DOM. No browser, live price or nutrition claims.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');let count=0;
class E{constructor(value=''){this.value=value;this.listeners={};this.children=[];this.textContent='';this.disabled=false;this.attrs={};}addEventListener(n,f){this.listeners[n]=f}append(...xs){this.children.push(...xs)}prepend(...xs){this.children.unshift(...xs)}replaceChildren(...xs){this.children=xs;this.textContent=''}setAttribute(k,v){this.attrs[k]=v}click(){if(!this.disabled)return this.listeners.click?.()}}
const ids=Object.fromEntries(Object.entries({diet:'any',people:'2',budget:'120','extra-unit':'each'}).map(([k,v])=>[k,new E(v)]));const get=id=>ids[id]??=new E();let copied='',download='';
const ctx={document:{getElementById:get,createElement:()=>new E()},Intl,Map,Set,Number,Array,Math,Blob,URL:{createObjectURL(b){download=b;return 'blob:test'},revokeObjectURL(){}},navigator:{clipboard:{writeText:async(t)=>{copied=t}}},setTimeout(){},alert(){}};
vm.createContext(ctx);const html=fs.readFileSync(path.join(root,'health-meal-planner.html'),'utf8');const script=html.split('<script>')[1].split('</script>')[0];new vm.Script(script);vm.runInContext(script,ctx);const run=s=>vm.runInContext(s,ctx);
function check(name,fn){fn();count++;console.log('PASS '+name)}
const row=id=>get('shopping').children.find(e=>e.children?.[1]?.textContent.startsWith(run(`grocery.get(${JSON.stringify(id)}).name`)+' · '));
const change=(id,value)=>{get(id).value=value;get(id).listeners.change()};

for (const diet of ['any','vegan','vegetarian','dairy-free','gluten-free']) {
 for (let people=1;people<=12;people++) check(`${diet} / ${people} people independent ingredient aggregation`,()=>{
  get('diet').value=diet;get('people').value=String(people);get('budget').value='120';run('overrides.clear();removed.clear();extras.clear();ownedItems.clear();build()');
  const selected=JSON.parse(run('JSON.stringify(meals)')),catalog=JSON.parse(run('JSON.stringify(ingredientCatalog)'));
  const expected={};for(const meal of selected)for(const item of meal.ingredients)expected[item.id]=(expected[item.id]||0)+item.qty*people/meal.servings;
  const actual=JSON.parse(run('JSON.stringify([...grocery.entries()])'));
  assert.equal(actual.length,Object.keys(expected).length);
  for(const [id,data]of actual){assert.equal(data.qty,Math.round(expected[id]*1000)/1000);assert.equal(data.unit,catalog[id].unit);assert.equal(data.name,catalog[id].name);if(data.unit==='each')assert.equal(Number.isInteger(data.qty),true);}
 });
}
for(const [id,value] of [['budget','Infinity'],['budget','NaN'],['people',''],['people','Infinity']])check(`additional invalid ${id} ${JSON.stringify(value)}`,()=>{
 get('diet').value='any';get('people').value='2';get('budget').value='120';run('build()');change(id,value);assert.equal(run('meals.length'),0);assert.equal(run('grocery.size'),0);assert.equal(get('copy-list').disabled,true);assert.equal(run('listText()'),'');
});
check('all raw meat/fish recipes specify thermometer target',()=>{
 const all=JSON.parse(run('JSON.stringify(recipes)'));
 for(const r of all){const ids=r.ingredients.map(i=>i.id),instructions=r.steps.join(' ');if(ids.includes('chicken')||ids.includes('ground-turkey'))assert.ok(instructions.includes('165°F'));if(ids.includes('salmon'))assert.ok(instructions.includes('145°F'));if(ids.includes('eggs'))assert.ok(instructions.includes('160°F'));}
});

check('recipe override and removal survive diet disappearance and return',()=>{
 get('diet').value='any';get('people').value='2';get('budget').value='120';run('overrides.clear();removed.clear();extras.clear();ownedItems.clear();build()');
 row('chicken').children[2].value='500';row('chicken').children[2].listeners.change();row('chicken').children[0].checked=true;row('chicken').children[0].listeners.change();row('salmon').children[3].click();
 change('diet','vegan');assert.equal(run("grocery.has('chicken')"),false);assert.equal(run("grocery.has('salmon')"),false);
 change('diet','any');assert.equal(run("grocery.get('chicken').qty"),500);assert.equal(run("grocery.get('chicken').owned"),true);assert.equal(run("grocery.has('salmon')"),false);
});
check('reset restores recomputed quantities after household change, keeping owned flags',()=>{
 change('people','5');assert.equal(run("grocery.get('chicken').qty"),500);get('reset-list').click();assert.equal(run("grocery.get('chicken').qty"),750);assert.equal(run("grocery.get('chicken').owned"),true);assert.equal(run("grocery.get('salmon').qty"),750);
});
check('custom amount, units and owned flag survive diet and reset',()=>{
 get('extra-item').value='Personal pantry item';get('extra-unit').value='ml';get('add-item').click();const r=row('custom:personal pantry item');r.children[2].value='12.25';r.children[2].listeners.change();row('custom:personal pantry item').children[0].checked=true;row('custom:personal pantry item').children[0].listeners.change();
 change('diet','vegan');get('reset-list').click();assert.equal(run("grocery.get('custom:personal pantry item').qty"),12.25);assert.equal(run("grocery.get('custom:personal pantry item').unit"),'ml');assert.equal(run("grocery.get('custom:personal pantry item').owned"),true);
 row('custom:personal pantry item').children[3].click();change('budget','121');get('reset-list').click();assert.equal(run("grocery.has('custom:personal pantry item')"),false);
});
check('accessible quantity labels describe unit and actual ingredient',()=>{
 const actual=JSON.parse(run('JSON.stringify([...grocery.entries()])'));
 for(const [id,data]of actual)assert.equal(row(id).children[2].attrs['aria-label'],`Quantity in ${data.unit} for ${data.name}`);
});

console.log(`${count} independent review probes passed. Mocked DOM, not browser rendering.`);
