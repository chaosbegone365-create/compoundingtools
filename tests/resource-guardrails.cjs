const fs=require('fs'),path=require('path'),assert=require('assert/strict'),cp=require('child_process');
const root=path.resolve(process.argv[2]||process.cwd());let n=0;const check=(v,m)=>{assert.ok(v,m);n++;};const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const privacy=read('privacy.html'),travel=read('travel-budget.html'),workout=read('health-workout.html');
check(privacy.includes('This release retains Google AdSense ownership metadata but does not load the AdSense advertising script'),'Metadata-only disclosure');
check(!privacy.includes('No advertising or payment processing is currently integrated'),'No false no-ad integration claim');
for(const file of ['index.html','about.html','methodology.html','privacy.html','terms.html']){
 const metas=read(file).match(/<meta\b[^>]*name=["']google-adsense-account["'][^>]*>/gi)||[];
 check(metas.length===1 && metas[0]==='<meta name="google-adsense-account" content="ca-pub-4845302312330527">','Exact publisher metadata '+file);
}
for(const file of fs.readdirSync(root).filter(x=>x.endsWith('.html')))check(!/adsbygoogle/i.test(read(file)),'No ad runtime '+file);
check(privacy.includes('map tiles, external fonts') && privacy.includes('does not establish account approval'),'Third-party limits and no approval claim');
check(privacy.includes('page address only—not calculator inputs or results'),'Share/download distinction');
check(privacy.includes('mailto:compoundyourfuture@yahoo.com') && privacy.includes('processed by your email provider and Yahoo'),'Email feedback processing disclosed');
check(!privacy.includes('suggestion link currently opens GitHub Issues'),'No obsolete primary feedback channel');
check(!workout.includes('Personalized training'),'No personalized prescription claim');
check(workout.indexOf('data-resource-notice="workout"')<workout.indexOf('id="goal"'),'Notice precedes workout inputs');
check(travel.includes("card.append(tag,title,why,price,note,details,disclosure,link)"),'Disclosure immediately before each CTA');
check(travel.includes('https://expedia.com/affiliate/3DafBAM'),'Approved URL unchanged');
check(travel.includes("link.rel='noopener noreferrer sponsored'"),'Relationship/no-referrer attributes preserved');
check(!travel.includes('at no additional cost'),'No unverified cost representation');
check(read('about.html').includes('not a finding that a provider or product is suitable'),'Optional non-advisory handoff');
check(read('methodology.html').includes('School-cost comparisons do not predict admissions'),'Methodology scope');
const cash=path.join(root,'money-cash-goals.html');if(fs.existsSync(cash))check(read('money-cash-goals.html').includes('Model assumption—not advice'),'Reserve priority explicitly a model');
const before=fs.readdirSync(root).filter(x=>x.endsWith('.html')).map(f=>[f,read(f)]);cp.execFileSync(process.execPath,[path.join(__dirname,'integrate-resource-guardrails.cjs'),root]);for(const[f,s]of before)check(read(f)===s,'Idempotence '+f);
console.log(n+' resource guardrail assertions passed; static content/integrator only, not browser or legal review.');
