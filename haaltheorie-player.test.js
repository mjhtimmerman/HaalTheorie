/* =====================================================================
   HaalTheorie - Course player: restyle + gamification (v5, hardened)
   Host extern (GitHub Pages) en laad met:
   <script src="https://mjhtimmerman.github.io/HaalTheorie/haaltheorie-player.js?v=DATUM" defer></script>
   in <body> logged in.

   Veiligheidsgaranties t.o.v. v4:
   1. De indien-knop wordt ALLEEN qua uiterlijk gestyled (kleur/gradient/ronding/
      3D-schaduw) — NOOIT qua geometrie (geen width/padding/afmeting/min-width).
      Footer en navigatie blijven onaangeraakt. Zo is de width:100%-bug uit v4
      uitgesloten. LET OP: knop-styling vereist een test op een echt toestel.
   2. Injecteert NIETS in video-units: iframe-CSS alleen in assessment-docs
   3. Geen globale font-override (geen body * meer, ook niet in de shell)
   4. Optie-styling werkt alleen binnen multiple-choice containers
      (.lw-qn-mc-options); typ-, sleep- en animatievragen blijven 100% origineel
   5. Geen width/padding-overrides op LearnWorlds-elementen
   6. Twee-dimensionale scope:
      WIE  - Canary (CANARY=true): standaard UIT; alleen aan voor een ALLOWLIST-
             account of een toestel met ?hlton=1. ?hltoff=1 = harde noodrem.
      WAAR - COURSE_ALLOW: laag draait alleen op opgegeven cursussen (leeg = alle).
             Zet dit op Examenklaar Deluxe vóór je CANARY=false zet.
   7. Diagnose-globals: window.__HLT_PLAYER_VERSION, __HLT_CANARY, __HLT_COURSE
      (het cursus-fragment dat tegen COURSE_ALLOW wordt gematcht), __HLT_COURSE_OK
   ===================================================================== */
(function(){
  "use strict";

  /* ---------- canary + kill-switch ----------
     CANARY=true: de laag staat standaard UIT voor IEDEREEN. Alleen aan voor:
       - een toestel dat ooit met ?hlton=1 is geopend (localStorage 'hlt_on'), of
       - een ingelogd account waarvan het e-mailadres in ALLOWLIST staat.
     ?hltoff=1 is altijd de harde noodrem en overschrijft alles.
     Klaar om iedereen aan te zetten? Zet CANARY=false: de laag staat dan
     standaard AAN en ?hltoff=1 blijft de noodrem.
     (getEmail() is een function-declaration verderop en dus hier al bruikbaar.) */
  var CANARY=true;
  var ALLOWLIST=['administratie@haaltheorie.nl']; // WIE: LearnWorlds-login e-mails, lowercase
  /* WAAR: alleen draaien op deze cursussen (cursus-id / URL-fragment, lowercase).
     LEEG = ALLE cursussen. Vul dit VÓÓR je CANARY=false zet, anders gaat de laag
     op alle producten live i.p.v. alleen Examenklaar Deluxe.
     Live geverifieerde cursus-id's (uit de player-URL courseid=...):
       - go-live (echte product, 83 learners): 'examenklaar-deluxe'
       - testen (verborgen clone):              'test-deluxe'
     Testfase:  COURSE_ALLOW = ['test-deluxe']        (canary houdt klanten sowieso inert)
     Go-live:   COURSE_ALLOW = ['examenklaar-deluxe']
     (window.__HLT_COURSE in de console toont waartegen gematcht wordt.) */
  var COURSE_ALLOW=['test-deluxe'];
  function courseKey(){ try{ return (location.pathname+location.search).toLowerCase(); }catch(e){ return ''; } }
  function courseAllowed(){
    if(!COURSE_ALLOW.length) return true;                      // leeg = overal
    var k=courseKey(),i;
    for(i=0;i<COURSE_ALLOW.length;i++){ if(k.indexOf(String(COURSE_ALLOW[i]).toLowerCase())>-1) return true; }
    return false;
  }
  try{
    if(/[?&]hltoff=1/.test(location.search)){ localStorage.setItem('hlt_off','1'); }
    if(/[?&]hlton=1/.test(location.search)){ localStorage.setItem('hlt_on','1'); localStorage.removeItem('hlt_off'); }
    window.__HLT_COURSE=courseKey();                            // diagnose: altijd leesbaar in console
    if(localStorage.getItem('hlt_off')==='1') return;          // noodrem: altijd voorrang
    if(CANARY){
      var _opt=localStorage.getItem('hlt_on')==='1';
      var _em=getEmail()||'';                                  // '' als niet ingelogd of {{..}} niet gerenderd
      if(!_opt && ALLOWLIST.indexOf(_em)===-1) return;        // WIE: inert voor klanten
    }
    if(!courseAllowed()) return;                               // WAAR: alleen toegestane cursussen
  }catch(e){ if(CANARY) return; }                              // bij twijfel in canary: niet draaien
  window.__HLT_PLAYER_VERSION='v6.1-playful';
  window.__HLT_CANARY=CANARY;
  window.__HLT_COURSE_OK=true;

  /* ---------- account-sync (n8n -> Supabase) ----------
     Vul je n8n productie-webhook in, bv: https://JOUW-N8N/webhook/hlt-xp
     Leeg laten = sync uit; alles blijft lokaal werken. */
  var SYNC_URL='';

  var FONT="'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif";

  /* ---------- shell-CSS (parent document) ----------
     Alleen kleur/typografie op specifieke player-chrome-klassen.
     Geen breedte-wijzigingen: de kolommen sluiten exact op 100%,
     daarom inset box-shadow i.p.v. border (neemt 0px ruimte in). */
  var SHELL_CSS = ""
  + "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');"
  + "body.slug-path-player{--hlt-grad:linear-gradient(135deg,#5937B0 0%,#9B2F8F 40%,#E43777 72%,#FB7171 100%);--hlt-accent:#E43777;--hlt-bg:#FFF8F4;--hlt-card:#FFFFFF;--hlt-line:#F0E3E8;--hlt-soft:#FCEAF1;--hlt-ink:#2A1B33;}"
  + "body.slug-path-player #wrapper.path-player-init,body.slug-path-player .-second-col{background:var(--hlt-bg)!important;}"
  + "body.slug-path-player .-first-col{background:var(--hlt-card)!important;box-shadow:inset -1px 0 0 var(--hlt-line)!important;}"
  + "body.slug-path-player .-first-col-topbar,body.slug-path-player .-default-course-player-name-progress{background:var(--hlt-grad)!important;}"
  + "body.slug-path-player .-default-course-player-name-wrapper,body.slug-path-player .-default-course-player-back,body.slug-path-player .-default-course-player-back-lbl{color:#fff!important;font-family:'Inter',-apple-system,sans-serif!important;}"
  + "body.slug-path-player .-default-course-player-progress-bar{height:12px!important;border-radius:99px!important;background:rgba(255,255,255,.28)!important;overflow:hidden!important;}"
  + "body.slug-path-player .-default-course-player-progress-bar-interior{border-radius:99px!important;background:linear-gradient(90deg,#FDC0A1,#FFFFFF)!important;box-shadow:0 0 12px rgba(255,255,255,.7);transition:width .5s cubic-bezier(.22,1,.36,1)!important;}"
  + "body.slug-path-player .-default-course-player-progress-perc-num,body.slug-path-player .-default-course-player-progress-perc-lbl{color:#fff!important;font-weight:700!important;font-family:'Inter',-apple-system,sans-serif!important;}"
  + "body.slug-path-player .lrn-path-cont-link{border-radius:12px!important;color:var(--hlt-ink)!important;font-weight:500!important;font-family:'Inter',-apple-system,sans-serif!important;transition:background .15s,color .15s!important;}"
  + "body.slug-path-player .lrn-path-cont-link:hover{background:var(--hlt-soft)!important;color:var(--hlt-accent)!important;}"
  + "body.slug-path-player .lrn-path-cont-link.active,body.slug-path-player .lrn-path-cont-link.selected,body.slug-path-player li.active>.lrn-path-cont-link{background:var(--hlt-soft)!important;color:var(--hlt-accent)!important;font-weight:700!important;}"
  /* ---- menu: sectie-koppen, actieve sectie/onderdeel, voortgang (geverifieerde classes) ---- */
  + "body.slug-path-player .lrn-path-con-selected>.lrn-path-cont-link{background:var(--hlt-soft)!important;color:var(--hlt-accent)!important;font-weight:800!important;box-shadow:inset 3px 0 0 var(--hlt-accent)!important;}"
  + "body.slug-path-player .lrn-path-chapter-name{border-radius:14px!important;padding:10px 12px!important;transition:background .15s!important;}"
  + "body.slug-path-player .lrn-path-chapter-name:hover{background:var(--hlt-soft)!important;}"
  + "body.slug-path-player .lrn-path-chapter-selected>.lrn-path-chapter-name,body.slug-path-player .lrn-path-chapter-open>.lrn-path-chapter-name{background:var(--hlt-soft)!important;}"
  + "body.slug-path-player .lrn-path-chapter-name-num{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-width:28px!important;height:28px!important;padding:0 7px!important;border-radius:10px!important;background:var(--hlt-grad)!important;color:#fff!important;font-weight:900!important;font-size:13px!important;margin-right:9px!important;}"
  + "body.slug-path-player .lrn-path-chapter-name-txt{font-weight:800!important;color:var(--hlt-ink)!important;}"
  + "body.slug-path-player .lrn-path-completion-circle.completed{color:#0F6E56!important;}"
  + "body.slug-path-player .lrn-path-completion-circle.failed{color:#C0344E!important;}"
  /* ---- 'Pagina verlaten?'-melding (iziToast): merkstijl, alleen uiterlijk ---- */
  + "body.slug-path-player .iziToast{border-radius:20px!important;box-shadow:0 22px 60px rgba(42,27,51,.30)!important;font-family:'Inter',-apple-system,sans-serif!important;}"
  + "body.slug-path-player .iziToast .iziToast-title{font-weight:900!important;color:var(--hlt-ink)!important;}"
  + "body.slug-path-player .iziToast .iziToast-message{color:#7A6C73!important;}"
  + "body.slug-path-player .iziToast .iziToast-buttons button,body.slug-path-player .iziToast .iziToast-buttons a{border-radius:12px!important;font-weight:800!important;font-family:'Inter',-apple-system,sans-serif!important;padding:9px 18px!important;border:2px solid #F0E3E8!important;background:#fff!important;color:var(--hlt-accent)!important;cursor:pointer!important;transition:filter .15s,background .15s!important;}"
  + "body.slug-path-player .iziToast .iziToast-buttons button:first-child,body.slug-path-player .iziToast .iziToast-buttons a:first-child{background:linear-gradient(135deg,#FB7171,#E43777)!important;color:#fff!important;border-color:transparent!important;}"
  + "body.slug-path-player .iziToast .iziToast-buttons button:first-child:hover,body.slug-path-player .iziToast .iziToast-buttons a:first-child:hover{filter:brightness(1.05)!important;}"
  + "body.slug-path-player .-second-col .-default-course-player-topbar{background:var(--hlt-card)!important;box-shadow:inset 0 -1px 0 var(--hlt-line),0 2px 14px rgba(137,40,127,.05)!important;}"
  + "body.slug-path-player .default-course-player-nav-btn{font-family:'Inter',-apple-system,sans-serif!important;font-weight:700!important;}"
  + "body.slug-path-player .default-course-player-nav-btn:hover{color:var(--hlt-accent)!important;}"
  + ".hlt-g-bar{max-width:720px;margin:18px auto 0;padding:0 20px;width:100%;box-sizing:border-box;font-family:'Inter',-apple-system,sans-serif;}"
  + ".hlt-g-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;}"
  + ".hlt-g-chips{display:flex;gap:10px;}"
  + ".hlt-g-chip{display:flex;align-items:center;gap:6px;font-weight:800;font-size:14px;padding:7px 13px;border-radius:99px;}"
  + ".hlt-g-chip.streak{background:#FFF1E3;color:#C8730E;}.hlt-g-chip.xp{background:#F1ECFD;color:#5B36C4;}"
  + ".hlt-g-goal{display:flex;align-items:center;gap:8px;font-weight:700;font-size:13px;color:#9A7E8C;}"
  + ".hlt-g-ring{width:34px;height:34px;transform:rotate(-90deg);}.hlt-g-ring circle{fill:none;stroke-width:5;}.hlt-g-ring .bgc{stroke:#F0E3E8;}.hlt-g-ring .fg{stroke:#E43777;stroke-linecap:round;transition:stroke-dashoffset .5s cubic-bezier(.22,1,.36,1);}"
  + ".hlt-g-sound{width:36px;height:36px;border-radius:50%;border:2px solid #F0E3E8;background:#fff;cursor:pointer;font-size:15px;}"
  + ".hlt-g-stories{display:flex;gap:5px;}.hlt-g-seg{flex:1;height:7px;border-radius:99px;background:#F0E3E8;overflow:hidden;}.hlt-g-seg span{display:block;height:100%;width:0;border-radius:99px;background:linear-gradient(135deg,#5937B0,#E43777,#FB7171);transition:width .4s ease;}.hlt-g-seg.done span{width:100%;}"
  + ".hlt-xp-pop{position:fixed;font-weight:900;font-size:22px;color:#E43777;pointer-events:none;z-index:99999;animation:hltxp 1s ease-out forwards;font-family:'Inter',-apple-system,sans-serif;}"
  + "@keyframes hltxp{0%{opacity:0;transform:translateY(0) scale(.6);}20%{opacity:1;transform:translateY(-10px) scale(1.1);}100%{opacity:0;transform:translateY(-60px) scale(1);}}"
  + "@media(max-width:600px){.hlt-g-chip .t,.hlt-g-goal span.lbl{display:none;}}"
  + ".hlt-ovl{position:fixed;inset:0;background:rgba(42,27,51,.55);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);display:none;align-items:center;justify-content:center;z-index:100000;padding:20px;font-family:'Inter',-apple-system,sans-serif;}.hlt-ovl.show{display:flex;}"
  + ".hlt-res{width:100%;max-width:380px;background:#fff;border-radius:26px;padding:28px 24px;text-align:center;box-shadow:0 30px 80px rgba(42,27,51,.4);animation:hltrise .4s cubic-bezier(.22,1,.36,1);}"
  + "@keyframes hltrise{from{transform:translateY(30px) scale(.96);opacity:0;}to{transform:none;opacity:1;}}"
  + ".hlt-res .flame{font-size:52px;}.hlt-res h2{font-size:23px;font-weight:900;margin:6px 0;}.hlt-res p{color:#9A7E8C;font-weight:600;font-size:14px;margin-bottom:18px;}"
  + ".hlt-res .card{background:linear-gradient(135deg,#5937B0,#9B2F8F 40%,#E43777 72%,#FB7171);color:#fff;border-radius:18px;padding:20px;text-align:left;margin-bottom:16px;}"
  + ".hlt-res .card .row{display:flex;justify-content:space-between;align-items:flex-end;}.hlt-res .card .big{font-size:28px;font-weight:900;line-height:1;}.hlt-res .card .sm{font-size:12px;font-weight:700;opacity:.92;}.hlt-res .card .brand{font-size:11px;font-weight:800;opacity:.85;margin-top:12px;letter-spacing:.5px;}"
  + ".hlt-res .cta{width:100%;background:linear-gradient(135deg,#FB7171,#E43777);color:#fff;border:none;border-radius:16px;padding:14px;font-weight:800;font-size:14px;letter-spacing:.6px;text-transform:uppercase;cursor:pointer;box-shadow:0 4px 0 #B7245C;margin-bottom:9px;}.hlt-res .cta:active{transform:translateY(4px);box-shadow:0 0 0 #B7245C;}"
  + ".hlt-res .ghost{width:100%;background:#fff;color:#E43777;border:2px solid #F0E3E8;border-radius:16px;padding:12px;font-weight:800;cursor:pointer;text-transform:uppercase;letter-spacing:.5px;font-size:13px;}"
  + ".hlt-conf{position:fixed;inset:0;pointer-events:none;z-index:100001;display:none;}.hlt-conf.show{display:block;}"
  + ".hlt-acc{background:linear-gradient(135deg,#5937B0,#9B2F8F 40%,#E43777 72%,#FB7171);color:#fff;border-radius:18px;padding:20px 22px;display:flex;align-items:center;justify-content:space-between;gap:14px;font-family:'Inter',-apple-system,sans-serif;box-shadow:0 12px 30px rgba(42,27,51,.22);}"
  + ".hlt-acc .num{font-size:26px;font-weight:900;line-height:1;}.hlt-acc .lbl{font-size:12px;font-weight:700;opacity:.92;margin-top:4px;}.hlt-acc .cell{text-align:center;}";

  /* ---------- vraag-CSS (alleen in assessment-iframes) ----------
     HARD AFGEBAKEND:
     - Geen regels op knoppen, footer, navigatie of dividers
     - Alle optie-regels vereisen .lw-qn-mc-options als container,
       dus typ-, sleep- en animatievragen blijven onaangeraakt
     - Afbeeldings-restyle alleen via :has() met MC-container
       (browsers zonder :has laten die ene regel gewoon vallen) */
  var QN_CSS = ""
  + "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');"
  + ".lw-qn-descr,.lw-qn-decr--inner-container{font-family:'Inter',-apple-system,sans-serif!important;font-size:22px!important;line-height:1.35!important;font-weight:800!important;color:#2A1B33!important;}"
  + ".learnworlds-image{display:block!important;margin:0 auto 8px!important;max-width:460px!important;border-radius:20px!important;border:1px solid #F0E3E8!important;box-shadow:0 12px 30px rgba(42,27,51,.16)!important;}"
  + ".lw-qn-mc-options.oneOption-per-row{counter-reset:hltopt!important;display:flex!important;flex-direction:column!important;gap:14px!important;width:100%!important;height:auto!important;min-height:0!important;justify-content:flex-start!important;align-content:flex-start!important;}"
  /* fix: container verdeelde z'n hoogte over de opties (enorme witruimte tussen
     optie 1 en 2). height:auto + flex-start zet ze strak onder elkaar. Bare
     selector als vangnet voor vragen zonder .oneOption-per-row. */
  + ".lw-qn-mc-options{height:auto!important;min-height:0!important;justify-content:flex-start!important;}"
  + ".lw-qn-mc-options .lw-qn-radio-option-wrapper{counter-increment:hltopt!important;width:100%!important;margin:0!important;}"
  + ".lw-qn-mc-options .lw-qn-radio-option-radio{position:absolute!important;opacity:0!important;width:0!important;height:0!important;pointer-events:none!important;}"
  + ".lw-qn-mc-options .lw-qn-radio-option-circle{display:none!important;}"
  + ".lw-qn-mc-options .lw-qn-radio-option{position:relative!important;display:flex!important;align-items:center!important;width:100%!important;min-height:62px!important;padding:14px 18px 14px 66px!important;background:#fff!important;border:2px solid #F0E3E8!important;border-bottom-width:5px!important;border-radius:18px!important;cursor:pointer!important;font-size:17px!important;font-weight:800!important;color:#2A1B33!important;font-family:'Inter',-apple-system,sans-serif!important;transition:transform .08s,border-color .12s,background .12s!important;}"
  + ".lw-qn-mc-options .lw-qn-radio-option:hover{background:#FFF1F6!important;border-color:#F0B9CE!important;}"
  + ".lw-qn-mc-options .lw-qn-radio-option:active{transform:translateY(2px)!important;border-bottom-width:2px!important;}"
  + ".lw-qn-mc-options .lw-qn-radio-option:before{content:counter(hltopt)!important;position:absolute!important;left:14px!important;top:50%!important;transform:translateY(-50%)!important;width:38px!important;height:38px!important;border:2px solid #EAD4DD!important;border-radius:12px!important;display:flex!important;align-items:center!important;justify-content:center!important;font-weight:800!important;font-size:15px!important;color:#B79AAA!important;background:#fff!important;transition:all .12s!important;}"
  + ".lw-qn-mc-options .lw-qn-radio-option-lbl{flex:1 1 auto!important;font-weight:700!important;}"
  + ".lw-qn-mc-options .lw-qn-radio-option.hlt-selected{border-color:#E43777!important;background:#FCEAF1!important;}"
  + ".lw-qn-mc-options .lw-qn-radio-option.hlt-selected:before{background:linear-gradient(135deg,#B22E91,#E43777)!important;border-color:#E43777!important;color:#fff!important;transform:translateY(-50%) scale(1.06)!important;}"
  /* indien-knop: ALLEEN uiterlijk (kleur/gradient/ronding/3D-schaduw).
     BEWUST geen width/padding/border/min-width -> de afmeting blijft exact gelijk,
     dus de width:100%-bug uit v4 is uitgesloten. Vereist wel een echte-toestel-test. */
  + ".learnworlds-button-solid-brand{background:linear-gradient(135deg,#FB7171,#E43777)!important;color:#fff!important;border-radius:16px!important;box-shadow:0 4px 0 #B7245C!important;transition:transform .06s,box-shadow .06s,filter .15s!important;}"
  + ".learnworlds-button-solid-brand:hover{filter:brightness(1.05)!important;}"
  + ".learnworlds-button-solid-brand:active{transform:translateY(4px)!important;box-shadow:0 0 0 #B7245C!important;}"
  /* feedback na beantwoorden: soepel in-faden i.p.v. harde sprong + nette kaders
     (.correct-answers-wrapper = 'Juist antwoord', .author-feedback-wrapper = 'Uitleg') */
  + ".correct-answers-wrapper,.author-feedback-wrapper{border-radius:16px!important;padding:14px 16px!important;margin-top:12px!important;animation:hltfb .3s cubic-bezier(.22,1,.36,1) both!important;}"
  + ".correct-answers-wrapper{background:#E1F5EE!important;border:2px solid #9FE1CB!important;}"
  + ".author-feedback-wrapper{background:#FFF8EE!important;border:2px solid #FAD9A0!important;}"
  + "@keyframes hltfb{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:none;}}"
  /* mobiel: alle nieuwe elementen compacter en op telefoonbreedte. UITSLUITEND
     uiterlijk/spacing op opties, afbeelding en feedback. GEEN regels op de
     indien-knop/footer/invulveld -> de v4-bug blijft uitgesloten. */
  + "@media(max-width:600px){"
  +   ".lw-qn-descr,.lw-qn-decr--inner-container{font-size:19px!important;}"
  +   ".lw-qn-mc-options.oneOption-per-row{gap:12px!important;}"
  +   ".lw-qn-mc-options .lw-qn-radio-option{min-height:58px!important;font-size:16px!important;padding:12px 14px 12px 58px!important;border-bottom-width:4px!important;}"
  +   ".lw-qn-mc-options .lw-qn-radio-option:before{width:34px!important;height:34px!important;left:12px!important;font-size:14px!important;}"
  +   ".learnworlds-image{max-width:100%!important;border-radius:16px!important;box-shadow:0 8px 20px rgba(42,27,51,.14)!important;}"
  +   ".correct-answers-wrapper,.author-feedback-wrapper{padding:12px 14px!important;border-radius:14px!important;margin-top:10px!important;}"
  + "}";

  function injectShell(){
    if(document.getElementById('hlt-player-shell')) return;
    var s=document.createElement('style'); s.id='hlt-player-shell'; s.textContent=SHELL_CSS;
    (document.head||document.documentElement).appendChild(s);
  }

  /* ---------- state ---------- */
  var GOAL=10, XP_PER=5, KEY='hlt_gamify_v1';
  function dstr(d){return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();}
  function today(){return dstr(new Date());}
  function yesterday(){var d=new Date();d.setDate(d.getDate()-1);return dstr(d);}
  function load(){try{return JSON.parse(localStorage.getItem(KEY))||{};}catch(e){return window.__hltMem||{};}}
  function save(s){try{localStorage.setItem(KEY,JSON.stringify(s));}catch(e){window.__hltMem=s;}}
  function dagWord(n){return n===1?'dag':'dagen';}
  function norm(s){if(s.day!==today()){s.day=today();s.count=0;s.celebrated=null;}if(s.sound===undefined)s.sound=true;if(s.streak===undefined)s.streak=0;if(s.xp===undefined)s.xp=0;return s;}

  /* ---------- account-sync ---------- */
  function getEmail(){
    var el=document.getElementById('lw-identity');
    var e=el?String(el.getAttribute('data-email')||'').trim().toLowerCase():'';
    if(!e||e.indexOf('{{')>-1||e.indexOf('@')===-1) return null;
    return e;
  }
  var lastSync=0;
  function syncServer(action){
    if(!SYNC_URL) return; var email=getEmail(); if(!email) return;
    var now=Date.now(); if(action==='answer'&&now-lastSync<4000) return; lastSync=now;
    var s=norm(load());
    try{
      fetch(SYNC_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:action,email:email,local:{xp:s.xp||0,streak:s.streak||0,count:s.count||0,day:s.day||'',lastPractice:s.lastPractice||''}})})
      .then(function(r){return r.json();})
      .then(function(st){applyServer(st);})
      .catch(function(){});
    }catch(e){}
  }
  function applyServer(st){
    if(!st||typeof st.xp!=='number') return;
    var s=norm(load());
    s.xp=st.xp; s.streak=st.streak;
    if(st.lastPractice) s.lastPractice=st.lastPractice;
    s.count=(st.day===today())?(st.count||0):0;
    save(s);
    renderBar(); renderAccountWidget();
  }
  window.addEventListener('pagehide',function(){
    if(!SYNC_URL) return; var email=getEmail(); if(!email) return;
    var s=load();
    try{navigator.sendBeacon(SYNC_URL,JSON.stringify({action:'sync',email:email,local:{xp:s.xp||0,streak:s.streak||0,count:s.count||0,day:s.day||'',lastPractice:s.lastPractice||''}}));}catch(e){}
  });

  /* ---------- gamification-balk ---------- */
  var BAR_HTML=''
   +'<div class="hlt-g-top"><div class="hlt-g-chips">'
   +'<div class="hlt-g-chip streak">&#128293; <span id="hlt-streak">0</span><span class="t" id="hlt-streak-lbl">&nbsp;dagen</span></div>'
   +'<div class="hlt-g-chip xp">&#9889; <span id="hlt-xp">0</span><span class="t">&nbsp;XP</span></div></div>'
   +'<div class="hlt-g-goal"><svg class="hlt-g-ring" viewBox="0 0 36 36"><circle class="bgc" cx="18" cy="18" r="15"></circle><circle class="fg" id="hlt-ring" cx="18" cy="18" r="15" stroke-dasharray="94.2" stroke-dashoffset="94.2"></circle></svg>'
   +'<span class="lbl">dagdoel&nbsp;<b id="hlt-goaltxt">0/10</b></span>'
   +'<button class="hlt-g-sound" id="hlt-sound" title="geluid aan/uit">&#128266;</button></div></div>'
   +'<div class="hlt-g-stories" id="hlt-stories"></div>';

  function buildBar(){
    if(document.getElementById('hlt-g-bar')) return true;
    var frame=document.getElementById('playerFrame'); if(!frame||!frame.parentElement) return false;
    var bar=document.createElement('div'); bar.id='hlt-g-bar'; bar.className='hlt-g-bar'; bar.innerHTML=BAR_HTML;
    frame.parentElement.insertBefore(bar,frame);
    var st=bar.querySelector('#hlt-stories'),h='',i;
    for(i=0;i<GOAL;i++)h+='<div class="hlt-g-seg"><span></span></div>';
    st.innerHTML=h;
    bar.querySelector('#hlt-sound').addEventListener('click',function(){var s=norm(load());s.sound=!s.sound;save(s);this.innerHTML=s.sound?'\uD83D\uDD0A':'\uD83D\uDD07';});
    renderBar(); return true;
  }
  function renderBar(){
    var bar=document.getElementById('hlt-g-bar'); if(!bar)return; var s=norm(load());
    var a=bar.querySelector('#hlt-streak'); if(a)a.textContent=s.streak||0;
    var al=bar.querySelector('#hlt-streak-lbl'); if(al)al.innerHTML='&nbsp;'+dagWord(s.streak||0);
    var b=bar.querySelector('#hlt-xp'); if(b)b.textContent=s.xp||0;
    var cnt=Math.min(s.count||0,GOAL),c=2*Math.PI*15;
    var r=bar.querySelector('#hlt-ring'); if(r)r.style.strokeDashoffset=c*(1-cnt/GOAL);
    var g=bar.querySelector('#hlt-goaltxt'); if(g)g.textContent=cnt+'/'+GOAL;
    var segs=bar.querySelectorAll('.hlt-g-seg'),i;
    for(i=0;i<segs.length;i++)segs[i].className='hlt-g-seg'+(i<cnt?' done':'');
    var sn=bar.querySelector('#hlt-sound'); if(sn)sn.innerHTML=(s.sound!==false)?'\uD83D\uDD0A':'\uD83D\uDD07';
  }
  function beep(){var s=load();if(s.sound===false)return;try{var c=new (window.AudioContext||window.webkitAudioContext)();[620,820].forEach(function(f,i){var o=c.createOscillator(),g=c.createGain();o.frequency.value=f;o.type='sine';o.connect(g);g.connect(c.destination);var t=c.currentTime+i*0.1;g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.15,t+0.02);g.gain.exponentialRampToValueAtTime(0.0001,t+0.16);o.start(t);o.stop(t+0.18);});}catch(e){}}
  function haptic(){if(navigator.vibrate){try{navigator.vibrate(25);}catch(e){}}}
  function xpPop(a){var bar=document.getElementById('hlt-g-bar');if(!bar)return;var an=bar.querySelector('#hlt-xp')||bar,r=an.getBoundingClientRect();var p=document.createElement('div');p.className='hlt-xp-pop';p.textContent='+'+a+' XP';p.style.left=r.left+'px';p.style.top=(r.top-6)+'px';document.body.appendChild(p);setTimeout(function(){p.remove();},1000);}

  var lastCount=0;
  function countQuestion(){
    var now=Date.now(); if(now-lastCount<1200)return; lastCount=now;
    var s=norm(load()),t=today();
    if(s.lastPractice!==t){s.streak=(s.lastPractice===yesterday()?(s.streak||0)+1:1);s.lastPractice=t;}
    s.count=(s.count||0)+1; s.xp=(s.xp||0)+XP_PER; save(s);
    renderBar(); xpPop(XP_PER); beep(); haptic(); syncServer('answer');
    if(s.count===GOAL&&s.celebrated!==t){s.celebrated=t;save(s);celebrate(s);}
  }

  /* ---------- iframe-gating: alleen assessment-documenten ---------- */
  function isAssessmentDoc(doc){
    try{
      if(!doc||!doc.body) return false;
      var p=(doc.defaultView&&doc.defaultView.location&&doc.defaultView.location.pathname)||'';
      if(p.indexOf('assessment')>-1) return true;
      return !!doc.querySelector('.lw-qn-cnt,.lw-qn-descr,.lw-qn-mc-options');
    }catch(e){return false;}
  }
  function bindFrame(frame){
    try{
      var doc=frame.contentDocument;
      if(!isAssessmentDoc(doc)) return;
      if(doc.__hltGObs) return; doc.__hltGObs=true;
      var seen=false;
      var obs=new MutationObserver(function(){
        var fb=doc.querySelector('.correctness-badge, .correct-answers-wrapper');
        if(fb&&!seen){seen=true;countQuestion();} else if(!fb&&seen){seen=false;}
      });
      obs.observe(doc.body,{childList:true,subtree:true});
    }catch(e){}
  }
  function injectStyle(frame){
    try{
      var doc=frame.contentDocument;
      if(!isAssessmentDoc(doc)||!doc.head) return;
      if(!doc.getElementById('hlt-qn-style')){var st=doc.createElement('style');st.id='hlt-qn-style';st.textContent=QN_CSS;doc.head.appendChild(st);}
      if(!doc.__hltBound){doc.__hltBound=true;doc.addEventListener('change',function(e){
        if(e.target&&e.target.classList&&e.target.classList.contains('lw-qn-radio-option-radio')){
          var opts=doc.querySelectorAll('.lw-qn-mc-options .lw-qn-radio-option'),i;
          for(i=0;i<opts.length;i++){var inp=opts[i].querySelector('input');opts[i].classList.toggle('hlt-selected',!!(inp&&inp.checked));}
        }
      },true);}
    }catch(err){}
  }

  /* ---------- dagdoel-celebration ---------- */
  function ensureOverlay(){
    if(document.getElementById('hlt-ovl'))return;
    var o=document.createElement('div'); o.id='hlt-ovl'; o.className='hlt-ovl';
    o.innerHTML='<div class="hlt-res"><div class="flame">&#128293;</div><h2 id="hlt-r-title">Dagdoel gehaald!</h2><p id="hlt-r-msg"></p>'
     +'<div class="card"><div class="row"><div><div class="big" id="hlt-r-streak">0</div><div class="sm" id="hlt-r-streak-lbl">dagen streak</div></div>'
     +'<div style="text-align:right"><div class="big" id="hlt-r-xp">0</div><div class="sm">XP totaal</div></div></div>'
     +'<div class="sm" id="hlt-r-count" style="margin-top:6px"></div><div class="brand">HAALTHEORIE.NL</div></div>'
     +'<button class="cta" id="hlt-r-share">Deel je streak</button><button class="ghost" id="hlt-r-close">Doorgaan</button></div>';
    document.body.appendChild(o);
    var cv=document.createElement('canvas'); cv.id='hlt-conf'; cv.className='hlt-conf'; document.body.appendChild(cv);
    o.querySelector('#hlt-r-close').addEventListener('click',function(){o.classList.remove('show');});
    o.querySelector('#hlt-r-share').addEventListener('click',function(){
      var s=norm(load()); var txt='\uD83D\uDD25 '+(s.streak||0)+' '+dagWord(s.streak||0)+' streak op HaalTheorie, '+(s.xp||0)+' XP! Oefen mee: haaltheorie.nl';
      if(navigator.share){navigator.share({text:txt,url:'https://haaltheorie.nl'}).catch(function(){});}
      else if(navigator.clipboard){navigator.clipboard.writeText(txt);var b=this,old=b.textContent;b.textContent='Gekopieerd!';setTimeout(function(){b.textContent=old;},1500);}
    });
  }
  function celebrate(s){
    ensureOverlay();
    document.getElementById('hlt-r-streak').textContent=s.streak||0;
    var rl=document.getElementById('hlt-r-streak-lbl'); if(rl)rl.textContent=dagWord(s.streak||0)+' streak';
    document.getElementById('hlt-r-xp').textContent=s.xp||0;
    document.getElementById('hlt-r-count').textContent=GOAL+' vragen geoefend vandaag';
    document.getElementById('hlt-r-msg').textContent='Je streak staat op '+(s.streak||0)+' '+dagWord(s.streak||0)+'. Kom morgen terug om \u2019m te verlengen.';
    document.getElementById('hlt-ovl').classList.add('show'); confetti();
  }
  function confetti(){
    var cv=document.getElementById('hlt-conf'); if(!cv)return; cv.classList.add('show');
    var ctx=cv.getContext('2d'),W=cv.width=window.innerWidth,H=cv.height=window.innerHeight;
    var cols=['#5937B0','#B22E91','#E43777','#FB7171','#FDC0A1','#FFB23E'],P=[],i;
    for(i=0;i<150;i++)P.push({x:Math.random()*W,y:-20-Math.random()*H*0.4,r:4+Math.random()*6,c:cols[i%cols.length],vy:2+Math.random()*4,vx:-2+Math.random()*4,rot:Math.random()*6,vr:-.2+Math.random()*.4});
    var t0=Date.now();
    (function loop(){ctx.clearRect(0,0,W,H);var done=true;P.forEach(function(p){p.y+=p.vy;p.x+=p.vx;p.rot+=p.vr;if(p.y<H+20)done=false;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillStyle=p.c;ctx.fillRect(-p.r/2,-p.r/2,p.r,p.r*1.6);ctx.restore();});if(Date.now()-t0<3000&&!done){requestAnimationFrame(loop);}else{ctx.clearRect(0,0,W,H);cv.classList.remove('show');}})();
  }

  /* ---------- XP-kaart op accountpagina ----------
     Plaats zelf via de Site Builder een element met:
     <div id="hlt-account-xp"></div>
     Geen div aanwezig = doet niets. */
  function renderAccountWidget(){
    var host=document.getElementById('hlt-account-xp'); if(!host) return;
    var s=norm(load());
    host.innerHTML=''
      +'<div class="hlt-acc">'
      +'<div class="cell"><div class="num">\uD83D\uDD25 '+(s.streak||0)+'</div><div class="lbl">'+dagWord(s.streak||0)+' streak</div></div>'
      +'<div class="cell"><div class="num">\u26A1 '+(s.xp||0)+'</div><div class="lbl">XP totaal</div></div>'
      +'<div class="cell"><div class="num">'+Math.min(s.count||0,GOAL)+'/'+GOAL+'</div><div class="lbl">dagdoel vandaag</div></div>'
      +'</div>';
  }

  /* ---------- main loop ---------- */
  function tick(){
    injectShell();
    renderAccountWidget();
    if(!document.body||!document.body.classList.contains('slug-path-player')) return;
    var f=document.getElementById('playerFrame'); if(!f)return;
    injectStyle(f); bindFrame(f); buildBar();
    if(!f.__hltLoadBound){f.__hltLoadBound=true;f.addEventListener('load',function(){setTimeout(function(){injectStyle(f);try{if(f.contentDocument){f.contentDocument.__hltGObs=false;}}catch(e){}bindFrame(f);renderBar();},300);});}
  }
  setInterval(tick,1200);
  function init(){ tick(); if(!window.__hltSynced&&getEmail()){window.__hltSynced=true;syncServer('get');} }
  if(document.readyState!=='loading'){init();}else{document.addEventListener('DOMContentLoaded',init);}
})();
