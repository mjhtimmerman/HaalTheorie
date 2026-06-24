/* =====================================================================
   HaalTheorie - account-pagina gamification widget (Duolingo-stijl)
   ---------------------------------------------------------------------
   Bedoeld als HTML custom code block op de LearnWorlds Account-pagina
   (/start). Het blok levert e-mail en naam via merge-tags:

     <div id="hlt-acct-wrap" data-email="{{user.email}}" data-name="{{user.username}}"></div>
     <script src="https://mjhtimmerman.github.io/HaalTheorie/hlt-account.js?v=3" defer></script>

   De widget rendert IN dat blok: begroeting (avatar + naam), tegels
   (streak, XP, dagdoel, uren), week-kalender en mijlpalen. streak/XP/dagdoel
   komen cross-device van de Supabase edge function (action:"get"); de uren
   worden overgenomen uit het standaard LearnWorlds User-Stats-element, dat
   daarna visueel verborgen wordt. Puur additief, laadt los.

   Merkstijl: gradient #5937B0 #9B2F8F #E43777 #FB7171, accent #E43777,
   achtergrond #FFF8F4, Inter.
   ===================================================================== */
(function(){
  'use strict';
  if(window.__hltAcct) return; window.__hltAcct = true;

  var ENDPOINT = 'https://upsrxurbwaxismjyddqx.supabase.co/functions/v1/hlt-gamify-sync';
  var GOAL = 50;
  var DAYL = ['ma','di','wo','do','vr','za','zo'];

  var wrap = document.getElementById('hlt-acct-wrap');   // het HTML-blok met de merge-tags

  /* ---------- gegevens (merge-tags uit het blok, val terug op lw-identity) ---------- */
  function clean(v){ v = (v==null?'':String(v)).trim(); return (v.indexOf('{{')>-1) ? '' : v; }
  function getEmail(){
    var e = wrap ? clean(wrap.getAttribute('data-email')).toLowerCase() : '';
    if(!e || e.indexOf('@')===-1){
      var el = document.getElementById('lw-identity');
      e = el ? clean(el.getAttribute('data-email')).toLowerCase() : '';
    }
    return (e && e.indexOf('@')>-1) ? e : null;
  }
  function getName(){
    var n = wrap ? clean(wrap.getAttribute('data-name')) : '';
    return n || null;
  }

  /* ---------- helpers ---------- */
  function dstr(d){ return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); }
  function esc(n){ n = parseInt(n,10); return isNaN(n)?0:n; }

  /* ---------- uren overnemen uit LearnWorlds User-Stats + dat blok verbergen ---------- */
  function numNear(el){
    var p = el;
    for(var k=0;k<4&&p;k++){
      var cand = p.querySelectorAll('*');
      for(var j=0;j<cand.length;j++){
        var t = (cand[j].textContent||'').trim().replace(/[.\s]/g,'');
        if(/^\d{1,7}$/.test(t)) return t;
      }
      p = p.parentElement;
    }
    return null;
  }
  function blockedCard(el){
    return !el || el===document.body || el===document.documentElement
      || el.id==='hlt-acct-wrap'
      || (el.querySelector && el.querySelector('#hlt-acct-wrap'))    // NOOIT iets verbergen dat onze widget bevat
      || (el.matches && el.matches('main,[role=main],.lw-main-content,#lw-main,.lw-page-content,#content,#wrapper'));
  }
  function pickCard(label){
    var p = label.parentElement;
    if(!p || blockedCard(p)) return null;
    for(var k=0;k<5 && p.parentElement && !blockedCard(p.parentElement); k++) p = p.parentElement; // klim tot net onder de grens
    return blockedCard(p) ? null : p;
  }
  function readLw(){
    var lblUren = null;
    var els = document.body.querySelectorAll('*');
    for(var i=0;i<els.length;i++){
      var el = els[i];
      if(el.children.length || (el.closest && el.closest('#hlt-acct-wrap'))) continue;
      var t = (el.textContent||'').trim().toLowerCase();
      if(t==='uren'||t==='uur'){ lblUren = el; break; }
    }
    if(!lblUren) return {uren:null, card:null};
    return {uren:numNear(lblUren), card:pickCard(lblUren)};
  }

  /* ---------- styles ---------- */
  var CSS =
    "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');"
  + "#hlt-acct-wrap.hlt-acct{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#2A1B33;max-width:680px;margin:8px auto;padding:0;box-sizing:border-box;}"
  + ".hlt-acct *{box-sizing:border-box;}"
  + ".hlt-acct .greet{display:flex;align-items:center;gap:14px;margin-bottom:16px;}"
  + ".hlt-acct .avatar{width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#5937B0 0%,#9B2F8F 40%,#E43777 72%,#FB7171 100%);display:flex;align-items:center;justify-content:center;color:#fff;font-size:24px;font-weight:900;box-shadow:0 8px 20px rgba(228,55,119,.25);flex:0 0 auto;}"
  + ".hlt-acct .gtxt .hi{font-size:12px;font-weight:800;color:#9A7E8C;text-transform:uppercase;letter-spacing:.05em;}"
  + ".hlt-acct .gtxt .name{font-size:25px;font-weight:900;line-height:1.1;}"
  + ".hlt-acct .row{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;}"
  + ".hlt-acct .tile{background:#fff;border:2px solid #F0E3E8;border-bottom-width:4px;border-radius:18px;padding:16px 8px 14px;text-align:center;min-height:112px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;}"
  + ".hlt-acct .tile.streak{background:linear-gradient(135deg,#5937B0 0%,#9B2F8F 40%,#E43777 72%,#FB7171 100%);border-color:transparent;color:#fff;box-shadow:0 10px 26px rgba(228,55,119,.28);}"
  + ".hlt-acct .tile .ic{font-size:26px;line-height:1;}"
  + ".hlt-acct .tile .num{font-size:28px;font-weight:900;line-height:1.05;}"
  + ".hlt-acct .tile .lbl{font-size:12px;font-weight:700;color:#9A7E8C;line-height:1.2;}"
  + ".hlt-acct .tile.streak .lbl{color:rgba(255,255,255,.94);}"
  + ".hlt-acct .ringwrap{position:relative;width:58px;height:58px;}"
  + ".hlt-acct .ring{width:58px;height:58px;transform:rotate(-90deg);display:block;}"
  + ".hlt-acct .ring .bgc{fill:none;stroke:#F0E3E8;stroke-width:4;}"
  + ".hlt-acct .ring .fg{fill:none;stroke:url(#hltgrad);stroke-width:4;stroke-linecap:round;transition:stroke-dashoffset .6s cubic-bezier(.22,1,.36,1);}"
  + ".hlt-acct .ringtxt{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;color:#2A1B33;white-space:nowrap;letter-spacing:-.02em;}"
  + ".hlt-acct .card{background:#fff;border:2px solid #F0E3E8;border-radius:20px;padding:16px 18px;margin-top:14px;}"
  + ".hlt-acct .ct{font-size:15px;font-weight:900;margin:0 0 12px;display:flex;align-items:center;gap:8px;}"
  + ".hlt-acct .ct .bar{width:5px;height:18px;border-radius:99px;background:linear-gradient(135deg,#5937B0,#E43777,#FB7171);}"
  + ".hlt-acct .week{display:flex;gap:6px;justify-content:space-between;}"
  + ".hlt-acct .day{flex:1;text-align:center;}"
  + ".hlt-acct .day .dot{width:38px;height:38px;border-radius:50%;margin:0 auto;display:flex;align-items:center;justify-content:center;font-size:18px;border:2px solid #F0E3E8;background:#fff;}"
  + ".hlt-acct .day.on .dot{background:linear-gradient(135deg,#5937B0,#9B2F8F,#E43777,#FB7171);border-color:transparent;}"
  + ".hlt-acct .day.today .dot{outline:2px solid #E43777;outline-offset:2px;}"
  + ".hlt-acct .day .dl{font-size:11px;font-weight:700;color:#9A7E8C;margin-top:5px;}"
  + ".hlt-acct .badges{display:flex;gap:10px;flex-wrap:wrap;}"
  + ".hlt-acct .bd{flex:1;min-width:92px;text-align:center;border:2px solid #F0E3E8;border-radius:16px;padding:12px 8px;background:#fff;}"
  + ".hlt-acct .bd .be{font-size:26px;line-height:1;filter:grayscale(1);opacity:.4;}"
  + ".hlt-acct .bd.earned{border-color:#F0B9CE;background:#FCEAF1;}"
  + ".hlt-acct .bd.earned .be{filter:none;opacity:1;}"
  + ".hlt-acct .bd .bl{font-size:11px;font-weight:800;margin-top:6px;}"
  + ".hlt-acct .bd .bs{font-size:10px;font-weight:700;color:#9A7E8C;}"
  + "@media(max-width:560px){.hlt-acct .day .dot{width:34px;height:34px;font-size:16px;}}";

  function injectCSS(){
    if(document.getElementById('hlt-acct-css')) return;
    var s = document.createElement('style'); s.id = 'hlt-acct-css'; s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ---------- render ---------- */
  function ringSvg(count){
    var c = 2*Math.PI*15, off = c*(1 - Math.min(count,GOAL)/GOAL);
    return '<div class="ringwrap"><svg class="ring" viewBox="0 0 36 36">'
      + '<defs><linearGradient id="hltgrad" x1="0" y1="0" x2="1" y2="1">'
      + '<stop offset="0" stop-color="#9B2F8F"/><stop offset="1" stop-color="#FB7171"/></linearGradient></defs>'
      + '<circle class="bgc" cx="18" cy="18" r="15"></circle>'
      + '<circle class="fg" cx="18" cy="18" r="15" stroke-dasharray="'+c.toFixed(1)+'" stroke-dashoffset="'+off.toFixed(1)+'"></circle>'
      + '</svg><div class="ringtxt">'+Math.min(count,GOAL)+'/'+GOAL+'</div></div>';
  }
  function greetHtml(){
    var name = getName();
    var av = name ? name.charAt(0).toUpperCase() : '👋';
    return '<div class="greet"><div class="avatar">'+av+'</div><div class="gtxt">'
      + '<div class="hi">Hoi,</div><div class="name">'+(name?name:'welkom terug')+'</div></div></div>';
  }
  function weekRow(daysSet){
    var now = new Date(), dow = (now.getDay()+6)%7;
    var monday = new Date(now); monday.setDate(now.getDate()-dow);
    var today = dstr(now), html = '';
    for(var i=0;i<7;i++){
      var d = new Date(monday); d.setDate(monday.getDate()+i);
      var key = dstr(d), on = !!daysSet[key], isToday = key===today;
      html += '<div class="day'+(on?' on':'')+(isToday?' today':'')+'">'
        + '<div class="dot">'+(on?'🔥':'')+'</div><div class="dl">'+DAYL[i]+'</div></div>';
    }
    return html;
  }
  function badges(streak, xp){
    var defs = [
      {e:'🔥', l:'3 dagen',  has:streak>=3},
      {e:'⚡',       l:'7 dagen',  has:streak>=7},
      {e:'🏆', l:'14 dagen', has:streak>=14},
      {e:'💎', l:'500 XP',   has:xp>=500},
      {e:'👑', l:'1000 XP',  has:xp>=1000}
    ];
    var html = '';
    for(var i=0;i<defs.length;i++){
      var b = defs[i];
      html += '<div class="bd'+(b.has?' earned':'')+'"><div class="be">'+b.e+'</div>'
        + '<div class="bl">'+b.l+'</div><div class="bs">'+(b.has?'behaald':'nog niet')+'</div></div>';
    }
    return html;
  }

  function render(state){
    state = state || {};
    var streak = esc(state.streak), xp = esc(state.xp);
    var count = (state.day===dstr(new Date())) ? esc(state.count) : 0;
    var daysArr = Array.isArray(state.days) ? state.days : [];
    var daysSet = {}; for(var i=0;i<daysArr.length;i++) daysSet[String(daysArr[i])] = true;

    var lw = readLw();
    if(lw.card){ try{ lw.card.style.display = 'none'; }catch(e){} }

    var tiles =
        '<div class="tile streak"><div class="ic">🔥</div><div class="num">'+streak+'</div><div class="lbl">'+(streak===1?'dag':'dagen')+' op rij</div></div>'
      + '<div class="tile"><div class="ic">⚡</div><div class="num">'+xp+'</div><div class="lbl">totaal XP</div></div>'
      + '<div class="tile">'+ringSvg(count)+'<div class="lbl">dagdoel</div></div>';
    if(lw.uren!=null) tiles += '<div class="tile"><div class="ic">⏱️</div><div class="num">'+lw.uren+'</div><div class="lbl">uren geleerd</div></div>';

    if(!wrap){ wrap = document.createElement('div'); wrap.id = 'hlt-acct-wrap'; mount(wrap); }
    wrap.className = 'hlt-acct';
    wrap.innerHTML =
        greetHtml()
      + '<div class="row">'+tiles+'</div>'
      + '<div class="card"><h3 class="ct"><span class="bar"></span>Deze week</h3><div class="week">'+weekRow(daysSet)+'</div></div>'
      + '<div class="card"><h3 class="ct"><span class="bar"></span>Mijlpalen</h3><div class="badges">'+badges(streak,xp)+'</div></div>';
  }

  function mount(node){
    var host = document.querySelector('.lw-main-content, #lw-main, main, [role=main], .main-content, .lw-page-content, #content');
    if(host && host.firstChild){ host.insertBefore(node, host.firstChild); }
    else if(host){ host.appendChild(node); }
    else { document.body.insertBefore(node, document.body.firstChild); }
  }

  /* ---------- laden ---------- */
  function load(){
    injectCSS();
    var email = getEmail();
    if(!email){ render({}); return; }                    // geen e-mail: toch widget tonen (lege stand + uren)
    try{
      fetch(ENDPOINT, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'get', email:email})})
        .then(function(r){ return r.json(); })
        .then(function(d){ render((d && d.state) || {}); })
        .catch(function(){ render({}); });
    }catch(e){ render({}); }
  }
  if(document.readyState === 'complete' || document.readyState === 'interactive'){ setTimeout(load, 0); }
  else { window.addEventListener('DOMContentLoaded', load); }
})();
