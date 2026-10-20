(function(){
var $ = function(s,r){return (r||document).querySelector(s)}, 
    $$ = function(s,r){return Array.from((r||document).querySelectorAll(s))};

// ==============================================
// YOUR LOGIN CREDENTIALS
// ==============================================
const VALID_EMAIL = "lianjuner826@gmail.com";
const VALID_PASSWORD = "Juner12345";
const USER_NAME = "Juner";
const USER_COACH = "JUNER001";

var mem = {};
function get(k){try{var v=localStorage.getItem(k);return v===null?(mem[k]||null):v}catch(e){return mem[k]||null}}
function set(k,v){mem[k]=v;try{localStorage.setItem(k,v)}catch(e){}}
function del(k){delete mem[k];try{localStorage.removeItem(k)}catch(e){}}

var current = null, view = 'dash';

function me(){var s=get('xteam_session');return s?JSON.parse(s):null}
function toast(t){var d=document.createElement('div');d.style.cssText='position:fixed;top:16px;right:16px;background:#2563eb;color:#fff;padding:12px 20px;border-radius:8px;z-index:9999;box-shadow:0 8px 32px rgba(0,0,0,0.28);font:600 14px/1.4 system-ui,sans-serif';d.textContent=t;document.body.appendChild(d);setTimeout(function(){d.remove()},1800)}

// ==============================================
// NAVIGATION & LAYOUT
// ==============================================
function render(){
  current = me();
  document.body.classList.toggle('authed', !!current);
  document.body.classList.remove('open'); 
  if($('#menu')) $('#menu').hidden = true;
  
  if(!current) return;
  
  $$('[data-view]').forEach(function(x){x.hidden = x.dataset.view !== view});
  $$('aside [data-go]').forEach(function(b){
    b.setAttribute('aria-current', String(b.dataset.go === view))
  });
  
  if($('#menuEmail')) $('#menuEmail').textContent = current.name + ' · ' + current.email + (current.coach?' · Coach ID '+current.coach:'');
  if($('#setName')) $('#setName').value = current.name; 
  if($('#setEmail')) $('#setEmail').value = current.email; 
  if($('#setCoach')) $('#setCoach').value = current.coach || '—';
  
  renderDash();
}

function go(v){view = v; render(); window.scrollTo(0,0)}
document.addEventListener('click',function(e){
  var g = e.target.closest('[data-go]'); if(g){e.preventDefault(); go(g.dataset.go)}
  if(!e.target.closest('#userBox') && $('#menu')) $('#menu').hidden = true;
});
if($('#menuBtn')) $('#menuBtn').onclick = function(){document.body.classList.add('open')};
if($('#scrim')) $('#scrim').onclick = function(){document.body.classList.remove('open')};
if($('#avatar')) $('#avatar').onclick = function(){var m=$('#menu');m.hidden=!m.hidden;this.setAttribute('aria-expanded',String(!m.hidden))};
if($('#logoutBtn')) $('#logoutBtn').onclick = function(){del('xteam_session');render();toast('Signed out')};

// Hide signup elements
document.addEventListener('DOMContentLoaded',function(){
  if($('#tabUp')) $('#tabUp').hidden = true;
  if($('#nameWrap')) $('#nameWrap').hidden = true;
  if($('#submit')) $('#submit').textContent = 'Sign in';
  if($('#fPass')) $('#fPass').autocomplete = 'current-password';
});

// ==============================================
// LOGIN SYSTEM
// ==============================================
if($('#submit')) $('#submit').onclick = async function(){
  var email = $('#fEmail').value.trim().toLowerCase(), 
      pass = $('#fPass').value, 
      err = $('#err');

  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){
    err.textContent = 'Enter a valid email address.';
    return;
  }
  if(!pass){
    err.textContent = 'Enter your password.';
    return;
  }

  $('#submit').disabled = true; 
  $('#submit').textContent = 'Checking…';

  if(email === VALID_EMAIL && pass === VALID_PASSWORD){
    set('xteam_session', JSON.stringify({
      email: VALID_EMAIL,
      name: USER_NAME,
      coach: USER_COACH
    }));
    $('#fPass').value = '';
    render();
    toast('Welcome back, ' + USER_NAME + '!');
  } else if(email === VALID_EMAIL){
    err.textContent = 'Invalid password';
  } else {
    err.textContent = 'Email not found';
  }

  $('#submit').disabled = false; 
  $('#submit').textContent = 'Sign in';
};

if($('#auth')) $('#auth').addEventListener('keydown',function(e){
  if(e.key === 'Enter' && e.target.tagName === 'INPUT') $('#submit').click()
});

// ==============================================
// DASHBOARD & DATA FUNCTIONS
// ==============================================
var MET = [['weight','Weight','kg'],['waist','Waist','cm'],['chest','Chest','cm'],['hips','Hips','cm']];

function dkey(){return 'xteam_dash_' + (current?current.email:'guest')}
function dload(){try{return JSON.parse(get(dkey())||'{}')}catch(e){return {}}}
function dsave(d){set(dkey(),JSON.stringify(d))}
function pad2(n){return (n<10?'0':'')+n}
function iso(d){return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate())}
function fmt(n){return Math.round(n).toLocaleString()}

function parseCSV(t){
  var L = t.replace(/^\uFEFF/,'').split(/\r?\n/).filter(function(l){return l.trim()});
  if(L.length < 2) return null;
  var H = L[0].split(',').map(function(h){return h.trim().toLowerCase()});
  function idx(k){for(var i=0;i<H.length;i++)if(H[i].indexOf(k)>-1)return i;return -1}
  var ix = {date:idx('date'),weight:idx('weight'),waist:idx('waist'),chest:idx('chest'),hips:idx('hip'),calories:idx('cal')};
  if(ix.date < 0) return null;
  var rows = [];
  L.slice(1).forEach(function(l){
    var c = l.split(','), r = {date:(c[ix.date]||'').trim()};
    if(!r.date) return;
    ['weight','waist','chest','hips','calories'].forEach(function(k){
      if(ix[k]>-1){var v=parseFloat(c[ix[k]]);if(!isNaN(v))r[k]=v}
    });
    rows.push(r);
  });
  rows.sort(function(a,b){return a.date < b.date ? -1 : a.date > b.date ? 1 : 0});
  return rows.length ? rows : null;
}

function sample(){
  var rows = [], now = new Date();
  for(var i=0;i<12;i++){
    var d = new Date(now.getFullYear(), now.getMonth(), now.getDate()-(11-i)*7);
    rows.push({
      date: iso(d), 
      weight: +(82-i*0.22+(i%3)*0.15).toFixed(1),
      waist: +(94-i*0.32).toFixed(1),
      chest: +(103-i*0.1).toFixed(1),
      hips: +(101-i*0.14).toFixed(1),
      calories: 2250-((i*37)%260)
    });
  }
  return rows;
}

function ring(pct,txt,id){
  var C = 2*Math.PI*48, o = C*(1-Math.max(0,Math.min(pct,1)));
  return '<svg class="ring" viewBox="0 0 120 120" role="img" aria-label="'+txt+'"><defs><linearGradient id="'+id+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="s1"/><stop offset="1" class="s2"/></linearGradient></defs><circle class="trk" cx="60" cy="60" r="48"/><circle class="prog" cx="60" cy="60" r="48" stroke="url(#'+id+')" stroke-dasharray="'+C+'" stroke-dashoffset="'+o+'" transform="rotate(-90 60 60)"/><text x="60" y="68" class="num" text-anchor="middle">'+txt+'</text></svg>';
}

function delta(v,base){var d=v-base,pc=base?Math.abs(d/base*100):0;return '<b>'+(d>=0?'+':'−')+fmt(Math.abs(d))+' ('+pc.toFixed(1)+' %)</b> <em>'+(d>=0?'↑':'↓')+'</em> vs maintenance'}

function dcard(r,dl,label){return '<div class="card dc">'+r+'<hr><div class="dl">'+dl+'</div><div class="dn">'+label+'</div></div>'}

function sbar(name,unit,a,b){
  var mx = Math.max(a,b) || 1;
  return '<div class="card sm"><div class="smh"><span>'+name+' change</span><span>'+unit+'</span></div><div class="hb o"><i style="width:'+(a/mx*100)+'%"></i></div><div class="hb"><i style="width:'+(b/mx*100)+'%"></i></div><div class="smf"><span>Start</span><span>Latest</span></div></div>';
}

function spark(vals,id){
  if(vals.length < 2) return '';
  var W=160,H=64,mn=Math.min.apply(null,vals),mx=Math.max.apply(null,vals); 
  if(mn===mx){mn-=1;mx+=1}
  var line=vals.map(function(v,i){return (i?'L':'M')+(i*W/(vals.length-1)).toFixed(1)+' '+(4+(mx-v)/(mx-mn)*(H-8)).toFixed(1)}).join(' ');
  return '<svg class="spark" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none"><defs><linearGradient id="'+id+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="s1"/><stop offset="1" class="s2"/></linearGradient></defs><path class="sl" d="'+line+'" stroke="url(#'+id+')" fill="none"/></svg>';
}

function bars(pts,tdee){
  var W=640,H=300,pl=48,pr=12,pt=14,pb=30;
  var top=Math.max.apply(null,pts.map(function(r){return r.calories}).concat([tdee||0])), mx=Math.ceil(top*1.08/500)*500;
  function Y(v){return pt+(mx-v)/mx*(H-pt-pb)}
  var step=(W-pl-pr)/pts.length, bw=Math.min(step*0.55,34), g='';
  for(var i=0;i<=5;i++){var v=mx/5*i,y=Y(v);g+='<line class="gl" x1="'+pl+'" x2="'+(W-pr)+'" y1="'+y+'" y2="'+y+'"/><text x="'+(pl-8)+'" y="'+(y+4)+'" text-anchor="end">'+fmt(v)+'</text>'}
  var b=pts.map(function(r,i){var x=pl+i*step+(step-bw)/2,y=Y(r.calories);return '<rect x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+(H-pb-y).toFixed(1)+'"><title>'+r.date+': '+fmt(r.calories)+' kcal</title></rect>'}).join('');
  var m=tdee?'<line class="md" x1="'+pl+'" x2="'+(W-pr)+'" y1="'+Y(tdee)+'" y2="'+Y(tdee)+'"/>':'';
  return '<svg class="bsvg" viewBox="0 0 '+W+' '+H+'" width="100%"><defs><linearGradient id="bg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="s1"/><stop offset="1" class="s2"/></linearGradient></defs>'+g+b+m+'</svg>';
}

function renderDash(){
  if(!current) return;
  var d=dload(), p=d.profile||{}, rows=(d.file&&d.file.rows)||[];
  
  if($('#hello')) $('#hello').textContent='Hi, '+current.name.split(' ')[0]+'. Here are your numbers for '+new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})+'.';
  if($('#pSex')) $('#pSex').value=p.sex||'male'; 
  if($('#pAge')) $('#pAge').value=p.age||''; 
  if($('#pHeight')) $('#pHeight').value=p.height||''; 
  if($('#pWeight')) $('#pWeight').value=p.weight||''; 
  if($('#pAct')) $('#pAct').value=p.act||'1.375';
  
  var w=null; rows.forEach(function(r){if(r.weight!=null)w=r.weight}); 
  if(w==null&&p.weight)w=+p.weight;
  var bmr=(w&&p.age&&p.height)?10*w+6.25*p.height-5*p.age+(p.sex==='female'?-161:5):null;
  var tdee=bmr?bmr*parseFloat(p.act||1.375):null;
  var cals=rows.filter(function(r){return r.calories!=null});
  var t=iso(new Date()), cr=null, today=false;
  cals.forEach(function(r){if(r.date===t){cr=r;today=true}else if(!today)cr=r});
  var last7=cals.slice(-7), avg=last7.length?last7.reduce(function(a,r){return a+r.calories},0)/last7.length:null;
  
  if($('#note')) $('#note').hidden=!!(bmr&&cals.length);
  var c1=dcard(ring(cr&&tdee?cr.calories/tdee:0,cr?fmt(cr.calories):'—','rg1'),cr&&tdee?delta(cr.calories,tdee):'No data yet',today||!cr?'Calories today':'Calories '+cr.date.slice(5));
  var c2=dcard(ring(bmr&&tdee?bmr/tdee:0,bmr?fmt(bmr):'—','rg2'),tdee?'Maintenance <b>'+fmt(tdee)+'</b> kcal':'Add your details',"Magic number (BMR)");
  var c3=dcard(ring(avg&&tdee?avg/tdee:0,avg?fmt(avg):'—','rg3'),avg&&tdee?delta(avg,tdee):'No data yet','Last '+Math.max(last7.length,0)+' entries avg');
  
  var avail=MET.filter(function(m){return rows.some(function(r){return r[m[0]]!=null})});
  var sm=avail.slice(0,2).map(function(m){var v=rows.filter(function(r){return r[m[0]]!=null}).map(function(r){return r[m[0]]});return sbar(m[1],m[2],v[0],v[v.length-1])}).join('');
  if(!sm)sm='<div class="card sm"><div class="smh"><span>Measurement change</span></div><p class="meta" style="display:block">Link a data file to see start vs latest.</p></div>';
  
  if($('#top')) $('#top').innerHTML=c1+c2+c3+'<div class="stack">'+sm+'</div>';
  if($('#sstack')) $('#sstack').innerHTML=avail.length?avail.map(function(m,i){
    var v=rows.filter(function(r){return r[m[0]]!=null}).map(function(r){return r[m[0]]});
    return '<div class="card sc"><div class="av">'+m[2]+'</div><div class="sv"><b>'+v[v.length-1]+'</b><span>'+m[1]+'</span></div>'+spark(v,'sp'+i)+'</div>';
  }).join(''):'<div class="card sc"><div class="sv"><span>Your measurements will appear here once you link a data file.</span></div></div>';
  if($('#barBox')) $('#barBox').innerHTML=cals.length?bars(cals.slice(-14),tdee):'<p class="lead" style="margin:8px 0 0">No calorie entries yet. Link a data file to see this chart.</p>';
  if($('#barNote')) $('#barNote').textContent=cals.length&&tdee?'Dashed line = your maintenance calories ('+fmt(tdee)+' kcal).':'';
  if($('#fileStat')) $('#fileStat').textContent=d.file?d.file.name+' · '+rows.length+' entries':'No file linked yet';
  if($('#linkBtn')) $('#linkBtn').textContent=d.file?'Replace file':'Link data file';
  if($('#unlinkBtn')) $('#unlinkBtn').hidden=!d.file;
}

// Profile Save
if($('#saveProf')) $('#saveProf').onclick=function(){
  var age=+$('#pAge').value,h=+$('#pHeight').value,w=$('#pWeight').value,er=$('#profErr');
  if(!(age>=10&&age<=100)){er.textContent='Enter an age between 10 and 100.';return}
  if(!(h>=100&&h<=250)){er.textContent='Enter a height between 100 and 250 cm.';return}
  if(w&&!(+w>=30&&+w<=300)){er.textContent='Enter a weight between 30 and 300 kg.';return}
  if(er) er.textContent='';
  var d=dload();d.profile={sex:$('#pSex').value,age:age,height:h,weight:w,act:$('#pAct').value};dsave(d);renderDash();toast('Details saved');
};

// File Upload
if($('#linkBtn')) $('#linkBtn').onclick=function(){$('#fileIn').click()};
if($('#fileIn')) $('#fileIn').addEventListener('change',function(){
  var f=this.files[0],inp=this;if(!f)return;
  var rd=new FileReader();
  rd.onload=function(){
    var rows=parseCSV(String(rd.result));
    if(!rows){if($('#fileErr'))$('#fileErr').textContent='This file could not be read. First row needs "date" column.';return}
    if($('#fileErr')) $('#fileErr').textContent='';
    var d=dload();d.file={name:f.name,rows:rows};dsave(d);renderDash();toast('File linked — '+rows.length+' entries loaded');
  };
  rd.readAsText(f);inp.value='';
});

// Sample Data
function useSample(){
  var d=dload();d.file={name:'sample-data.csv',rows:sample()};
  if(!d.profile)d.profile={sex:'male',age:30,height:175,weight:'70',act:'1.375'};
  dsave(d);if($('#fileErr'))$('#fileErr').textContent='';renderDash();toast('Sample data loaded');
}
if($('#sampleBtn')) $('#sampleBtn').onclick=useSample;
if($('#sampleBtn2')) $('#sampleBtn2').onclick=useSample;
if($('#unlinkBtn')) $('#unlinkBtn').onclick=function(){var d=dload();delete d.file;dsave(d);renderDash();toast('File unlinked')};

// Display Name Update
if($('#saveName')) $('#saveName').onclick=function(){
  var n=$('#setName').value.trim();if(!n){toast('Enter a display name');return}
  current.name=n; set('xteam_session',JSON.stringify(current)); render(); toast('Name updated');
};

render();
})();
