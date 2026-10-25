'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const M=require('../assets/trip-quotes-model.js');let checks=0;
const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};const fail=(f)=>{assert.throws(f);checks++;};
const s={party:4,budget:4000,contingency:10},a={nights:6,airfare:1400,lodging:200,daily:40,extras:200},b={...a,nights:7,airfare:1100};
const r=M.compare(s,a,b);
// Independent ledger: A: 1,400 + 6*200 + 4*7*40 + 200 = 3,920; buffer392.
eq(r.A.total,431200);eq(r.A.headroom,-31200);eq(r.A.lodging,120000);eq(r.A.daily,112000);eq(r.A.contingency,39200);
// B: 1,100 + 7*200 + 4*8*40 +200 =3,980; buffer398; cheaper airfare but total +66.
eq(r.B.total,437800);eq(r.difference,6600);eq(r.airfareSaving,30000);eq(r.otherBaseChange,36000);eq(r.contingencyChange,600);eq(r.A.extraNightBase,36000);eq(r.A.extraNightTotal,39600);
const shorter=M.calculate(s,{...a,nights:5});eq(shorter.total,391600);eq(shorter.headroom,8400);eq(shorter.days,6);eq(r.A.nights,6);eq(s.budget,4000);eq(shorter.airfareCeiling,147636);
eq(r.A.airfareCeiling,111636);
// Day trip: 0 rooms,1 allowance day, party*allowance + one-time transport/extras.
eq(M.calculate({party:2,budget:100,contingency:0},{nights:0,airfare:20,lodging:999,daily:10,extras:5}).total,4500);
eq(M.calculate({party:1,budget:0,contingency:0},{nights:0,airfare:0,lodging:0,daily:0,extras:0}).airfareCeiling,0);
eq(M.calculate({party:1,budget:0,contingency:0},{nights:0,airfare:0,lodging:0,daily:.01,extras:0}).airfareCeiling,null);
// Independent half-cent round up: 0.05 base at 10%=0.005 ->0.01, total0.06.
eq(M.calculate({party:1,budget:.06,contingency:10},{nights:0,airfare:.05,lodging:0,daily:0,extras:0}).total,6);
// Find a cent-level ceiling and verify maximality independently with integer ledger.
for(const party of [1,2,4,100])for(const nights of [0,1,6,365])for(const contingency of [0,7.25,10,100])for(const budget of [0,1,4000,100000000]){
 const q={nights,airfare:19.37,lodging:23.19,daily:8.01,extras:.03},z=M.calculate({party,budget,contingency},q);
 const fixed=2319*nights+801*party*(nights+1)+3,base=fixed+1937,expected=base+Math.round(base*(contingency*100)/10000);
 eq(z.total,expected);eq(z.headroom,budget*100-expected);
 if(z.airfareCeiling===null){eq(fixed+Math.round(fixed*contingency/100)>budget*100,true);}else{let c=z.airfareCeiling;eq(fixed+c+Math.round((fixed+c)*contingency/100)<=budget*100,true);eq(fixed+c+1+Math.round((fixed+c+1)*contingency/100)>budget*100,true);}
}
for(const key of Object.keys(M.limits))for(const value of ['', ' ', '-1', Infinity,NaN,null,undefined,{},'1e3','1,000','0x10','abc'])fail(()=>M.parse(value,key));
for(const key of ['party','nights']){
 fail(()=>M.parse(1.5,key));fail(()=>M.parse(M.limits[key][1]+1,key));
 // Validate the entered decimal text before Number can round away a fraction.
 for(const value of ['1.00000000000000001','99.99999999999999999','100.00000000000000001','365.00000000000000001'])fail(()=>M.parse(value,key));
 eq(M.parse('1.00000000000000000',key),1);
 eq(M.parse(String(M.limits[key][1])+'.00000000000000000',key),M.limits[key][1]);
}

for(const key of ['budget','contingency','airfare','lodging','daily','extras']){fail(()=>M.parse('0.001',key));fail(()=>M.parse(M.limits[key][1]+1,key));}
const max=M.calculate({party:100,budget:100000000,contingency:100},{nights:365,airfare:1000000,lodging:1000000,daily:1000000,extras:1000000});eq(Number.isSafeInteger(max.total),true);eq(max.total,7393400000000);
// Independent BigInt reference exercises large values and basis-point rounding.
for(const bp of [1,123,725,9999,10000])for(const price of [999999.99,123456.78,.01]){
 const z=M.calculate({party:100,budget:100000000,contingency:bp/100},{nights:365,airfare:price,lodging:price,daily:price,extras:price});
 const c=BigInt(Math.round(price*100)),base=c*(1n+365n+100n*366n+1n),buffer=(base*BigInt(bp)+5000n)/10000n;
 eq(z.total,Number(base+buffer));eq(z.contingency,Number(buffer));
}
const html=fs.readFileSync(path.join(__dirname,'../travel-quote-tradeoffs.html'),'utf8');eq((html.match(/https:\/\/expedia.com\/affiliate\/3DafBAM/g)||[]).length,1);eq(html.includes('noindex,follow'),true);eq(html.includes('not transferred'),true);
// Integrated journey contracts: one catalog source, current navigation, private sharing,
// draft noindex, unchanged generic affiliate handoff, and no tracking/backend added.
const {catalog,search}=require('../assets/tool-search.js');
const tool=catalog.filter(t=>t.id==='trip-quote-tradeoffs');eq(tool.length,1);eq(tool[0].href,'travel-quote-tradeoffs.html');eq(tool[0].category,'Travel');
for(const query of ['trip quotes','hard budget alternatives','airfare ceiling'])eq(search(query)[0].id,tool[0].id);
eq(html.includes('Draft calculator.'),true);eq(html.includes("sets B to one fewer night and allowance day than A"),true);eq(html.includes("reduces A's duration"),false);
eq(html.includes('rel="sponsored nofollow noopener noreferrer"'),true);
eq((html.match(/data-share-tool/g)||[]).length,1);eq(html.includes('assets/share-tools.js'),true);eq(html.includes('Only the page link is shared—not your inputs or results.'),true);
const share=require('../assets/share-tools.js');eq(share.canonicalURL({querySelector:()=>({href:'https://compoundyourfuture.com/travel-quote-tradeoffs.html?budget=4000#private'})}),'https://compoundyourfuture.com/travel-quote-tradeoffs.html');
eq(fs.readFileSync(path.join(__dirname,'../sitemap.xml'),'utf8').includes('travel-quote-tradeoffs.html'),false);
const hub=fs.readFileSync(path.join(__dirname,'../travel.html'),'utf8');eq((hub.match(/class="tile" href="travel-quote-tradeoffs.html"/g)||[]).length,1);
eq(hub.includes('Draft tool. See all-in costs'),true);eq(hub.includes('class="tile" href="travel-budget.html"'),true);eq(hub.includes('class="tile" href="travel-savings.html"'),true);
for(const file of ['assets/trip-quotes-model.js','assets/trip-quotes-ui.js'])eq(/\b(?:fetch|XMLHttpRequest|localStorage|sessionStorage|sendBeacon)\b/.test(fs.readFileSync(path.join(__dirname,'..',file),'utf8')),false);
console.log(checks+' arithmetic, validation, content and integration checks passed');
