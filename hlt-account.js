/* =====================================================================
   HaalTheorie - account-pagina gamification widget (Duolingo-stijl)
   ---------------------------------------------------------------------
   Toont op de LearnWorlds Account system-page (/start) de streak, XP,
   het dagdoel, een streak-kalender en mijlpalen. Cross-device: haalt de
   stand op bij de Supabase edge function (action:"get") met de e-mail uit
   de lw-identity div. Puur additief, laadt los na de pagina.

   Plaatsen: LearnWorlds /start -> Page custom code -> Before </body>:
     <script src="https://mjhtimmerman.github.io/HaalTheorie/hlt-account.js?v=1" defer></script>

   Merkstijl: gradient #5937B0 #9B2F8F #E43777 #FB7171, accent #E43777,
   achtergrond #FFF8F4, Inter.
   ===================================================================== */
(function(){
  'use strict';
  if(window.__hltAcct) return; window.__hltAcct = true;

  var ENDPOINT = 'https://upsrxurbwaxismjyddqx.supabase.co/functions/v1/hlt-gamify-sync';
  var GOAL = 50;
  var DAYL = ['ma','di','wo','do','vr','za','zo'];   // weekdag-labels (ma-zo)

  /* ---------- helpers ---------- */
  function getEmail(){
    var el = document.getElementById('lw-identity');
    var e = el ? String(el.getAttribute('data-email')||'').trim().toLowerCase() : '';
    if(!e || e.indexOf('{{')>-1 || e.indexOf('@')===-1) return null;
    return e;
  }
  function dstr(d){ return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); }
  function esc(n){ n = parseInt(n,10); return isNaN(n)?0:n; }

  /* ---------- styles ---------- */
  var CSS =
    "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');"
  + ".hlt-acct{--g:linear-gradient(135deg,#5937B0 0%,#9B2F8F 40%,#E43777 72%,#FB7171 100%);--ac:#E43777;--ink:#2A1B33;--line:#F0E3E8;--soft:#FCEAF1;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:var(--ink);max-width:760px;margin:22px auto;padding:0 16px;box-sizing:border-box;}"
  + ".hlt-acct *{box-sizing:border-box;}"
  + ".hlt-acct .hero{position:relative;overflow:hidden;background:var(--g);border-radius:26px;padding:26px 22px 24px;color:#fff;text-align:center;box-shadow:0 18px 44px rgba(228,55,119,.28);}"
  + ".hlt-acct .hero:after{content:'';position:absolute;right:-40px;top:-40px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,.12);}"
  + ".hlt-acct .flame{font-size:54px;line-height:1;filter:drop-shadow(0 4px 10px rgba(0,0,0,.18));}"
  + ".hlt-acct .snum{font-size:64px;font-weight:900;line-height:1;margin-top:4px;letter-spacing:-.02em;}"
  + ".hlt-acct .slbl{font-size:15px;font-weight:700;opacity:.95;margin-top:2px;}"
  + ".hlt-acct .stats{display:flex;gap:12px;margin-top:14px;}"
  + ".hlt-acct .cell{flex:1;background:#fff;border:2px solid var(--line);border-bottom-width:4px;border-radius:18px;padding:14px 10px;text-align:center;}"
  + ".hlt-acct .cell .ic{font-size:24px;line-height:1;}"
  + ".hlt-acct .cell .num{font-size:26px;font-weight:900;line-height:1.1;margin-top:4px;}"
  + ".hlt-acct .cell .lbl{font-size:12px;font-weight:700;color:#9A7E8C;margin-top:3px;}"
  + ".hlt-acct .ring{width:54px;height:54px;transform:rotate(-90deg);display:block;margin:0 auto;}"
  + ".hlt-acct .ring .bgc{fill:none;stroke:var(--line);stroke-width:5;}"
  + ".hlt-acct .ring .fg{fill:none;stroke:url(#hltgrad);stroke-width:5;stroke-linecap:round;transition:stroke-dashoffset .6s cubic-bezier(.22,1,.36,1);}"
  + ".hlt-acct .ringwrap{position:relative;}"
  + ".hlt-acct .ringtxt{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;color:var(--ink);}"
  + ".hlt-acct .card{background:#fff;border:2px solid var(--line);border-radius:20px;padding:16px 18px;margin-top:14px;}"
  + ".hlt-acct .ct{font-size:15px;font-weight:900;margin:0 0 12px;display:flex;align-items:center;gap:8px;}"
  + ".hlt-acct .ct .bar{width:5px;height:18px;border-radius:99px;background:var(--g);}"
  + ".hlt-acct .week{display:flex;gap:6px;justify-content:space-between;}"
  + ".hlt-acct .day{flex:1;text-align:center;}"
  + ".hlt-acct .day .dot{width:38px;height:38px;border-radius:50%;margin:0 auto;display:flex;align-items:center;justify-content:center;font-size:18px;border:2px solid var(--line);background:#fff;}"
  + ".hlt-acct .day.on .dot{background:var(--g);border-color:transparent;box-shadow:0 4px 10px rgba(228,55,119,.30);}"
  + ".hlt-acct .day.today .dot{outline:2px solid var(--ac);outline-offset:2px;}"
  + ".hlt-acct .day .dl{font-size:11px;font-weight:700;color:#9A7E8C;margin-top:5px;}"
  + ".hlt-acct .badges{display:flex;gap:10px;flex-wrap:wrap;}"
  + ".hlt-acct .bd{flex:1;min-width:90px;text-align:center;border:2px solid var(--line);border-radius:16px;padding:12px 8px;background:#fff;}"
  + ".hlt-acct .bd .be{font-size:26px;line-height:1;filter:grayscale(1);opacity:.4;}"
  + ".hlt-acct .bd.earned{border-color:#F0B9CE;background:var(--soft);}"
  + ".hlt-acct .bd.earned .be{filter:none;opacity:1;}"
  + ".hlt-acct .bd .bl{font-size:11px;font-weight:800;margin-top:6px;}"
  + ".hlt-acct .bd .bs{font-size:10px;font-weight:700;color:#9A7E8C;}"
  + "@media(max-width:560px){.hlt-acct .snum{font-size:54px;}.hlt-acct .day .dot{width:34px;height:34px;font-size:16px;}.hlt-acct .cell .num{font-size:22px;}}";

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
  function weekRow(daysSet){
    // huidige week ma-zo
    var now = new Date(); var dow = (now.getDay()+6)%7; // 0=ma .. 6=zo
    var monday = new Date(now); monday.setDate(now.getDate()-dow);
    var today = dstr(now), html = '';
    for(var i=0;i<7;i++){
      var d = new Date(monday); d.setDate(monday.getDate()+i);
      var key = dstr(d), on = daysSet[key], isToday = key===today;
      html += '<div class="day'+(on?' on':'')+(isToday?' today':'')+'">'
        + '<div class="dot">'+(on?'🔥':'')+'</div>'
        + '<div class="dl">'+DAYL[i]+'</div></div>';
    }
    return html;
  }
  function badges(streak, xp){
    var defs = [
      {e:'🔥', l:'3 dagen',  s:'streak', need:3,   has:streak>=3},
      {e:'⚡',       l:'7 dagen',  s:'streak', need:7,   has:streak>=7},
      {e:'🏆', l:'14 dagen', s:'streak', need:14,  has:streak>=14},
      {e:'💎', l:'500 XP',   s:'xp',     need:500, has:xp>=500},
      {e:'👑', l:'1000 XP',  s:'xp',     need:1000,has:xp>=1000}
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
    var dayIsToday = state.day === dstr(new Date());
    var count = dayIsToday ? esc(state.count) : 0;
    var daysArr = Array.isArray(state.days) ? state.days : [];
    var daysSet = {}; for(var i=0;i<daysArr.length;i++) daysSet[String(daysArr[i])] = true;

    var wrap = document.getElementById('hlt-acct-wrap');
    if(!wrap){ wrap = document.createElement('div'); wrap.id = 'hlt-acct-wrap'; wrap.className = 'hlt-acct'; mount(wrap); }
    wrap.innerHTML =
      '<div class="hero"><div class="flame">🔥</div>'
        + '<div class="snum">'+streak+'</div>'
        + '<div class="slbl">'+(streak===1?'dag':'dagen')+' op rij</div></div>'
      + '<div class="stats">'
        + '<div class="cell"><div class="ic">⚡</div><div class="num">'+xp+'</div><div class="lbl">totaal XP</div></div>'
        + '<div class="cell">'+ringSvg(count)+'<div class="lbl">dagdoel vandaag</div></div>'
        + '<div class="cell"><div class="ic">✅</div><div class="num">'+count+'</div><div class="lbl">vandaag gedaan</div></div>'
      + '</div>'
      + '<div class="card"><h3 class="ct"><span class="bar"></span>Deze week</h3><div class="week">'+weekRow(daysSet)+'</div></div>'
      + '<div class="card"><h3 class="ct"><span class="bar"></span>Mijlpalen</h3><div class="badges">'+badges(streak,xp)+'</div></div>';
  }

  /* plaats de widget bovenaan de hoofd-content; val terug op body */
  function mount(node){
    var host = document.querySelector('.lw-main-content, #lw-main, main, [role=main], .main-content, .lw-page-content, #content');
    if(host && host.firstChild){ host.insertBefore(node, host.firstChild); }
    else if(host){ host.appendChild(node); }
    else { document.body.insertBefore(node, document.body.firstChild); }
  }

  /* ---------- laden ---------- */
  function load(){
    var email = getEmail(); if(!email) return false;
    try{
      fetch(ENDPOINT, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'get', email:email})})
        .then(function(r){ return r.json(); })
        .then(function(d){ render((d && d.state) || {}); })
        .catch(function(){ render({}); });   // bij netwerkfout toch een (lege) widget tonen
    }catch(e){ render({}); }
    return true;
  }
  function start(){
    injectCSS();
    var n = 0;
    (function tryLoad(){
      if(load()) return;                       // e-mail beschikbaar -> ophalen
      if(n++ < 25) setTimeout(tryLoad, 300);   // lw-identity kan iets later vullen
    })();
  }
  if(document.readyState === 'complete' || document.readyState === 'interactive'){ setTimeout(start, 0); }
  else { window.addEventListener('DOMContentLoaded', start); }
})();
