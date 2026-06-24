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
  window.__HLT_PLAYER_VERSION='v6.19-playful';
  window.__HLT_CANARY=CANARY;
  window.__HLT_COURSE_OK=true;

  /* ---------- account-sync (n8n -> Supabase) ----------
     Supabase edge function (stap 1, live + end-to-end getest). Contract:
     POST {action,email,local:{xp,streak,count,day,lastPractice}} -> {ok,state:{xp,streak,count,day,last_practice,days}}.
     action 'sync' = server-side mergen (xp/count = hoogste, streak = hoogste met voortzetting,
     days = unie, nooit naar beneden). De player gebruikt altijd 'sync' (push + pull samen).
     Leeg laten = sync uit; alles blijft lokaal werken. */
  var SYNC_URL='https://upsrxurbwaxismjyddqx.supabase.co/functions/v1/hlt-gamify-sync';

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
  /* sidebar-topbar / inklap-knop (>>) staat als #topBarWrapper.custom-clr1-bg = effen paars -> merk-gradient */
  + "body.slug-path-player #topBarWrapper.custom-clr1-bg{background:var(--hlt-grad)!important;}"
  + "body.slug-path-player #topBarWrapper .-hamburger-menu,body.slug-path-player #topBarWrapper .-hamburger-menu *{color:#fff!important;}"
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
  + "body.slug-path-player .lrn-path-chapter-name-num{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:28px!important;min-width:28px!important;height:28px!important;padding:0!important;border-radius:10px!important;background:var(--hlt-grad)!important;color:#fff!important;font-weight:900!important;font-size:13px!important;line-height:1!important;text-align:center!important;margin-right:9px!important;}"
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
  + "body.slug-path-player #playerFrame{margin-top:0!important;}"
  + "body.slug-path-player .default-course-player-nav-btn{font-family:'Inter',-apple-system,sans-serif!important;font-weight:700!important;}"
  + "body.slug-path-player .default-course-player-nav-btn:hover{color:var(--hlt-accent)!important;}"
  /* banner: absoluut gepind in het STABIELE .-second-col (laadt 1x, blijft staan tussen
     vragen). .-second-col-content krijgt boven-ruimte via een variabele die op het
     stabiele .-second-col staat (overleeft de herbouw van het content-deel). */
  + ".hlt-g-bar{position:absolute;left:0;right:0;top:0;z-index:6;padding:10px 0 8px;box-sizing:border-box;background:var(--hlt-bg);border-bottom:1px solid var(--hlt-line);font-family:'Inter',-apple-system,sans-serif;}"
  + "body.slug-path-player .-second-col-content{padding-top:var(--hlt-gbar-space,0px)!important;}"
  + ".hlt-g-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 auto 10px;max-width:760px;padding:0 18px;box-sizing:border-box;}"
  + ".hlt-g-chips{display:flex;gap:10px;}"
  + ".hlt-g-chip{display:flex;align-items:center;gap:6px;font-weight:800;font-size:14px;padding:7px 13px;border-radius:99px;}"
  + ".hlt-g-chip.streak{background:#FFF1E3;color:#C8730E;}.hlt-g-chip.xp{background:#F1ECFD;color:#5B36C4;}"
  + ".hlt-g-goal{display:flex;align-items:center;gap:8px;font-weight:700;font-size:13px;color:#9A7E8C;}"
  + ".hlt-g-ring{width:34px;height:34px;transform:rotate(-90deg);}.hlt-g-ring circle{fill:none;stroke-width:5;}.hlt-g-ring .bgc{stroke:#F0E3E8;}.hlt-g-ring .fg{stroke:#E43777;stroke-linecap:round;transition:stroke-dashoffset .5s cubic-bezier(.22,1,.36,1);}"
  + ".hlt-g-stories{display:flex;gap:5px;max-width:760px;margin:0 auto;padding:0 18px;box-sizing:border-box;}.hlt-g-seg{flex:1;height:7px;border-radius:99px;background:#F0E3E8;overflow:hidden;}.hlt-g-seg span{display:block;height:100%;width:0;border-radius:99px;background:linear-gradient(135deg,#5937B0,#E43777,#FB7171);transition:width .4s ease;}.hlt-g-seg.done span{width:100%;}"
  + ".hlt-xp-pop{position:fixed;font-weight:900;font-size:22px;color:#E43777;pointer-events:none;z-index:99999;animation:hltxp 1s ease-out forwards;font-family:'Inter',-apple-system,sans-serif;}"
  + "@keyframes hltxp{0%{opacity:0;transform:translateY(0) scale(.6);}20%{opacity:1;transform:translateY(-10px) scale(1.1);}100%{opacity:0;transform:translateY(-60px) scale(1);}}"
  + "@media(max-width:600px){.hlt-g-chip .t{display:none;}.hlt-g-goal{font-size:12px;gap:6px;}.hlt-g-goal span.lbl{display:inline;}}"
  /* vaste indien-balk in de BUITENSTE laag (de speler is wel schermhoogte): pint
     onderaan .-second-col, altijd zichtbaar; klik stuurt een klik naar de echte knop
     in het iframe. .-second-col-content krijgt onder-padding zodat je tot onder de
     laatste optie kunt scrollen zonder dat de balk inhoud afdekt. */
  + ".hlt-submit-bar{position:absolute;left:0;right:0;bottom:0;z-index:30;display:none;align-items:center;justify-content:space-between;gap:12px;padding:10px 18px;background:var(--hlt-bg);border-top:1px solid var(--hlt-line);box-shadow:0 -3px 14px rgba(42,27,51,.07);box-sizing:border-box;font-family:'Inter',-apple-system,sans-serif;}"
  + ".hlt-sb-prog{font-weight:700;color:#9A7E8C;font-size:14px;white-space:nowrap;}"
  + ".hlt-sb-btn{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#FB7171,#E43777);color:#fff;border:none;border-radius:14px;padding:12px 24px;font-weight:800;font-size:16px;cursor:pointer;box-shadow:0 4px 0 #B7245C;font-family:'Inter',-apple-system,sans-serif;transition:transform .06s,box-shadow .06s;}"
  + ".hlt-sb-btn:active{transform:translateY(3px);box-shadow:0 1px 0 #B7245C;}"
  + "body.slug-path-player .-second-col-content{padding-bottom:80px!important;}"
  + ".hlt-ovl{position:fixed;inset:0;background:rgba(42,27,51,.55);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);display:none;align-items:center;justify-content:center;z-index:100000;padding:20px;font-family:'Inter',-apple-system,sans-serif;}.hlt-ovl.show{display:flex;}"
  + ".hlt-res{width:100%;max-width:380px;background:#fff;border-radius:26px;padding:28px 24px;text-align:center;box-shadow:0 30px 80px rgba(42,27,51,.4);animation:hltrise .4s cubic-bezier(.22,1,.36,1);}"
  + "@keyframes hltrise{from{transform:translateY(30px) scale(.96);opacity:0;}to{transform:none;opacity:1;}}"
  + ".hlt-res .flame{font-size:52px;}.hlt-res h2{font-size:23px;font-weight:900;margin:6px 0;}.hlt-res p{color:#9A7E8C;font-weight:600;font-size:14px;margin-bottom:18px;}"
  + ".hlt-res .card{background:linear-gradient(135deg,#5937B0,#9B2F8F 40%,#E43777 72%,#FB7171);color:#fff;border-radius:18px;padding:20px;text-align:left;margin-bottom:16px;}"
  + ".hlt-res .card .row{display:flex;justify-content:space-between;align-items:flex-end;}.hlt-res .card .big{font-size:28px;font-weight:900;line-height:1;}.hlt-res .card .sm{font-size:12px;font-weight:700;opacity:.92;}.hlt-res .card .brand{font-size:11px;font-weight:800;opacity:.85;margin-top:12px;letter-spacing:.5px;}"
  + ".hlt-res .cta{width:100%;background:linear-gradient(135deg,#FB7171,#E43777);color:#fff;border:none;border-radius:16px;padding:14px;font-weight:800;font-size:14px;letter-spacing:.6px;text-transform:uppercase;cursor:pointer;box-shadow:0 4px 0 #B7245C;margin-bottom:9px;}.hlt-res .cta:active{transform:translateY(4px);box-shadow:0 0 0 #B7245C;}"
  + ".hlt-res .ghost{width:100%;background:#fff;color:#E43777;border:2px solid #F0E3E8;border-radius:16px;padding:12px;font-weight:800;cursor:pointer;text-transform:uppercase;letter-spacing:.5px;font-size:13px;}"
  /* ---- eigen deel-menu (story-afbeelding + WhatsApp + kopieer-link) ---- */
  + ".hlt-share-menu{display:none;flex-direction:column;gap:9px;margin-bottom:9px;}.hlt-share-menu.show{display:flex;animation:hltrise .25s ease both;}"
  + ".hlt-sh-btn{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;border:2px solid #F0E3E8;background:#fff;color:#2A1B33;border-radius:14px;padding:13px;font-weight:800;font-size:14px;font-family:'Inter',-apple-system,sans-serif;cursor:pointer;transition:filter .15s,background .15s,transform .06s;}.hlt-sh-btn span{font-size:18px;}.hlt-sh-btn:active{transform:translateY(2px);}"
  + ".hlt-sh-btn.img{background:linear-gradient(135deg,#5937B0,#E43777);color:#fff;border-color:transparent;}.hlt-sh-btn.wa{background:#25D366;color:#fff;border-color:transparent;}.hlt-sh-btn.img:hover,.hlt-sh-btn.wa:hover{filter:brightness(1.05);}"
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
  + ".lw-qn-mc-options.oneOption-per-row{counter-reset:hltopt!important;display:flex!important;flex-direction:column!important;gap:10px!important;width:100%!important;height:auto!important;min-height:0!important;justify-content:flex-start!important;align-content:flex-start!important;}"
  /* fix: container verdeelde z'n hoogte over de opties (enorme witruimte tussen
     optie 1 en 2). height:auto + flex-start zet ze strak onder elkaar. Bare
     selector als vangnet voor vragen zonder .oneOption-per-row. */
  + ".lw-qn-mc-options{height:auto!important;min-height:0!important;justify-content:flex-start!important;}"
  /* leesbaarheid in de beantwoorde staat: LearnWorlds zet 'disabled' op de opties
     en vervaagt ze via een ouder (opacity). Forceer de hele keten zichtbaar +
     donkere tekst, zodat Ja/Nee leesbaar blijven na het antwoorden. */
  + ".lw-qn-mc-options .lw-qn-radio-option-wrapper,.lw-qn-mc-options .relative,.lw-qn-mc-options .lw-qn-radio-option,.lw-qn-mc-options .disabled,.lw-qn-mc-options [class*=disabled]{opacity:1!important;}"
  + ".lw-qn-mc-options .lw-qn-radio-option-wrapper,.lw-qn-mc-options .relative{height:auto!important;min-height:0!important;}"
  + ".lw-qn-mc-options .lw-qn-radio-option,.lw-qn-mc-options .lw-qn-radio-option-lbl,.lw-qn-mc-options .lw-qn-radio-option-lbl *{color:#2A1B33!important;}"
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
  /* (v6.13's position:fixed op de iframe-footer werkte niet: het iframe is hoger dan
     het scherm, dus fixed pinde aan de iframe-onderkant = onder de vouw. Vervangen door
     een vaste indien-balk in de BUITENSTE laag, zie hlt-submit-bar in SHELL_CSS.)
     De originele LearnWorlds-footer verbergen we (hij flitste kort op en viel dan weg);
     onze buiten-balk stuurt de klik door naar de verborgen echte knop - een
     programmatische .click() werkt ook op een onzichtbaar element. visibility:hidden
     i.p.v. display:none zodat de knop-GEOMETRIE intact blijft (v4-bewaking geldig). */
  + ".lw-nav-prog-wrapper{visibility:hidden!important;}"
  /* invulvraag-veld duidelijk als TEKSTVELD (was massief paars -> leek een knop).
     ALLEEN uiterlijk: witte achtergrond, donkere tekst, rand via inset box-shadow
     (verandert GEEN afmeting), leesbare placeholder, roze focus-rand. Bewust GEEN
     width/padding/border/height -> de afmeting blijft gelijk, v4-bug uitgesloten. */
  + ".learnworlds-input{background:#fff!important;color:#2A1B33!important;box-shadow:inset 0 0 0 2px #E0CCE8!important;}"
  + ".learnworlds-input::placeholder{color:#9A7E8C!important;opacity:1!important;}"
  + ".learnworlds-input:focus{box-shadow:inset 0 0 0 2px #E43777!important;outline:none!important;}"
  /* feedback na beantwoorden: soepel in-faden i.p.v. harde sprong + nette kaders
     (.correct-answers-wrapper = 'Juist antwoord', .author-feedback-wrapper = 'Uitleg') */
  + ".correct-answers-wrapper,.author-feedback-wrapper{border-radius:16px!important;padding:14px 16px!important;margin-top:12px!important;animation:hltfb .3s cubic-bezier(.22,1,.36,1) both!important;}"
  + ".correct-answers-wrapper{background:#E1F5EE!important;border:2px solid #9FE1CB!important;}"
  + ".author-feedback-wrapper{background:#FFF8EE!important;border:2px solid #FAD9A0!important;}"
  + "@keyframes hltfb{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:none;}}"
  /* gekozen/juist antwoord als HEEL BLOK kleuren i.p.v. een losse vinkje-badge.
     LearnWorlds zet geen correct/wrong-class op de optie, dus colorAnswers() (JS)
     zet hlt-correct/hlt-wrong op de wrapper o.b.v. de 'Juist antwoord'-tekst.
     Deze regels staan bewust NA .hlt-selected zodat ze qua bron-volgorde winnen. */
  + ".correctness-badge{display:none!important;}"
  + ".lw-qn-mc-options .hlt-correct .lw-qn-radio-option{background:#E1F5EE!important;border-color:#3FB98C!important;border-bottom-color:#2FA877!important;color:#0F6E56!important;}"
  + ".lw-qn-mc-options .hlt-correct .lw-qn-radio-option-lbl{color:#0F6E56!important;}"
  + ".lw-qn-mc-options .hlt-correct .lw-qn-radio-option:before{background:#2FA877!important;border-color:#2FA877!important;color:#fff!important;}"
  + ".lw-qn-mc-options .hlt-wrong .lw-qn-radio-option{background:#FCE8EC!important;border-color:#E4607A!important;border-bottom-color:#D23A5A!important;color:#B0203C!important;}"
  + ".lw-qn-mc-options .hlt-wrong .lw-qn-radio-option-lbl{color:#B0203C!important;}"
  + ".lw-qn-mc-options .hlt-wrong .lw-qn-radio-option:before{background:#D23A5A!important;border-color:#D23A5A!important;color:#fff!important;}"
  /* resultaatscherm (geslaagd/gezakt): merk-kaart + branded rond icoon (rood bij
     gezakt, groen bij geslaagd) i.p.v. de harde zwarte X, Inter-typografie. Alleen
     uiterlijk; de Nederlandse titel zet localizeResult() (JS). */
  + ".lw-ass-end-2{max-width:460px!important;margin:24px auto!important;background:#fff!important;border:1px solid #F0E3E8!important;border-radius:24px!important;box-shadow:0 18px 50px rgba(42,27,51,.12)!important;font-family:'Inter',-apple-system,sans-serif!important;}"
  + ".lw-ass-end-2 .lw-ass-end-icon-text .learnworlds-icon{display:flex!important;align-items:center!important;justify-content:center!important;width:84px!important;height:84px!important;border-radius:50%!important;font-size:40px!important;line-height:1!important;margin:6px auto 16px!important;}"
  + ".lw-ass-end-2 .learnworlds-icon.fa-times,.lw-ass-end-2 .learnworlds-icon.fa-times-circle{color:#D23A5A!important;background:#FCE8EC!important;}"
  + ".lw-ass-end-2 .learnworlds-icon.fa-check,.lw-ass-end-2 .learnworlds-icon.fa-check-circle,.lw-ass-end-2 .learnworlds-icon.fa-trophy,.lw-ass-end-2 .learnworlds-icon.fa-thumbs-up{color:#2FA877!important;background:#E1F5EE!important;}"
  + ".lw-ass-end-2 h3.learnworlds-heading3{font-family:'Inter',sans-serif!important;font-weight:900!important;color:#2A1B33!important;font-size:25px!important;letter-spacing:-.01em!important;}"
  + ".lw-ass-end-2 .learnworlds-main-text,.lw-ass-end-2 strong,.lw-ass-end-2 p{font-family:'Inter',-apple-system,sans-serif!important;color:#2A1B33!important;}"
  /* desktop (>=760px): foto + vraag + opties als brede, uitgelijnde kolom (max
     880px), foto vult de volle kolombreedte zodat 'ie gelijk loopt met de opties,
     en de loze ruimte erboven weg zodat alles in 1 scherm past. Bewust min-width:
     760 (ver van de mobiele 600px-grens) en GEEN regels op knop/footer/invulveld,
     dus de v4-bug blijft uitgesloten. */
  + "@media(min-width:760px){"
  +   ".lw-qr-block,.lw-qr-qn,.lw-qn-cnt{max-width:880px!important;width:auto!important;margin-left:auto!important;margin-right:auto!important;}"
  +   ".lw-qn-descr,.lw-qn-decr--inner-container,.lw-ass-widget-wrapper,.lw-ass-widget-wrapper .relative,.lw-qn-cnt{padding-left:0!important;padding-right:0!important;}"
  +   ".lw-qn-descr,.lw-qn-decr--inner-container,.lw-ass-widget-wrapper,.lw-ass-widget-wrapper .relative{max-width:100%!important;width:100%!important;}"
  +   ".learnworlds-image{max-width:100%!important;width:100%!important;}"
  +   ".lw-qr-block,.lw-qr-qn,.lw-qn-cnt,.form-wrapper__inputs,.lw-qr-section-part,.lw-qn-descr,.lw-qn-decr--inner-container,.lw-qr-block>*:first-child{padding-top:0!important;margin-top:0!important;}"
  /* desktop: vraag + opties groter/leesbaarder (de tekst was klein t.o.v. de foto) */
  +   ".lw-qn-descr,.lw-qn-decr--inner-container,.lw-qn-descr *{font-size:26px!important;line-height:1.3!important;font-weight:800!important;}"
  +   ".lw-qn-mc-options .lw-qn-radio-option{min-height:68px!important;font-size:20px!important;padding:16px 20px 16px 70px!important;}"
  +   ".lw-qn-mc-options .lw-qn-radio-option-lbl,.lw-qn-mc-options .lw-qn-radio-option-lbl *{font-size:20px!important;line-height:1.35!important;}"
  +   ".lw-qn-mc-options .lw-qn-radio-option:before{width:42px!important;height:42px!important;left:15px!important;font-size:17px!important;}"
  + "}"
  /* mobiel: alle nieuwe elementen compacter en op telefoonbreedte. UITSLUITEND
     uiterlijk/spacing op opties, afbeelding en feedback. GEEN regels op de
     indien-knop/footer/invulveld -> de v4-bug blijft uitgesloten. */
  + "@media(max-width:600px){"
  +   ".lw-qn-descr,.lw-qn-decr--inner-container,.lw-qn-descr *{font-size:22px!important;line-height:1.3!important;}"
  +   ".lw-qn-mc-options.oneOption-per-row{gap:12px!important;}"
  +   ".lw-qn-mc-options .lw-qn-radio-option{min-height:60px!important;font-size:19px!important;padding:14px 16px 14px 62px!important;border-bottom-width:4px!important;}"
  +   ".lw-qn-mc-options .lw-qn-radio-option-lbl,.lw-qn-mc-options .lw-qn-radio-option-lbl *{font-size:19px!important;line-height:1.35!important;}"
  +   ".lw-qn-mc-options .lw-qn-radio-option:before{width:36px!important;height:36px!important;left:13px!important;font-size:15px!important;}"
  +   ".learnworlds-image{max-width:100%!important;border-radius:16px!important;box-shadow:0 8px 20px rgba(42,27,51,.14)!important;}"
  +   ".correct-answers-wrapper,.author-feedback-wrapper{padding:13px 15px!important;border-radius:14px!important;margin-top:10px!important;font-size:16px!important;line-height:1.45!important;}"
  /* loze ruimte bovenaan weg (zelfde als desktop-regel 226) zodat de foto direct
     onder de balk staat EN de indienknop binnen beeld valt. GEEN regel op de
     indien-knop/footer/invulveld -> de v4-bug blijft uitgesloten. */
  +   ".lw-qr-block,.lw-qr-qn,.lw-qn-cnt,.form-wrapper__inputs,.lw-qr-section-part,.lw-qn-descr,.lw-qn-decr--inner-container,.lw-qr-block>*:first-child{padding-top:0!important;margin-top:0!important;}"
  + "}";

  /* ---------- ebook content-pagina's (bv. Leerdoelen) ----------
     Eigen type, los van de assessment: body.lw-ebook met #pageContent. Puur
     cosmetisch, geen knoppen/geometrie, dus de v4-bug speelt hier niet. Alles
     gescoped op body.lw-ebook zodat de vraag-documenten onaangeroerd blijven. */
  var EBOOK_CSS = ""
  + "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');"
  + "body.lw-ebook #pageContent{font-family:'Inter',-apple-system,sans-serif!important;color:#2A1B33!important;max-width:740px!important;margin:0 auto!important;font-size:15.5px!important;line-height:1.6!important;}"
  + "body.lw-ebook #pageContent .lw-ebook-heading2,body.lw-ebook #pageContent h2{font-family:'Inter',sans-serif!important;font-weight:900!important;color:#2A1B33!important;font-size:26px!important;line-height:1.2!important;position:relative!important;padding-left:16px!important;margin:8px 0 10px!important;}"
  + "body.lw-ebook #pageContent .lw-ebook-heading2:before,body.lw-ebook #pageContent h2:before{content:''!important;position:absolute!important;left:0;top:5px;bottom:5px;width:6px;border-radius:99px;background:linear-gradient(180deg,#5937B0,#E43777,#FB7171)!important;}"
  + "body.lw-ebook #pageContent .hlt-intro{font-weight:700!important;font-size:15px!important;color:#9A7E8C!important;margin:2px 0 14px!important;}"
  + "body.lw-ebook #pageContent .hlt-ld-list{list-style:none!important;padding:0!important;margin:0!important;display:flex!important;flex-direction:column!important;gap:10px!important;}"
  + "body.lw-ebook #pageContent .hlt-ld-row{display:flex!important;align-items:flex-start!important;gap:12px!important;background:#fff!important;border:1px solid #F0E3E8!important;border-radius:14px!important;box-shadow:0 5px 14px rgba(42,27,51,.06)!important;padding:13px 15px!important;font-size:16px!important;font-weight:600!important;line-height:1.4!important;color:#2A1B33!important;}"
  + "body.lw-ebook #pageContent .hlt-ld-row .hlt-ck{flex:0 0 auto!important;width:24px!important;height:24px!important;border-radius:99px!important;background:linear-gradient(135deg,#34C28E,#2FA877)!important;display:flex!important;align-items:center!important;justify-content:center!important;margin-top:1px!important;box-shadow:0 2px 6px rgba(47,168,119,.35)!important;}"
  + "body.lw-ebook #pageContent .hlt-ld-row .hlt-ck svg{width:14px!important;height:14px!important;display:block!important;}"
  /* Samenvatting: tussenkopjes (div met alleen 1 vetgedrukt stukje) als duidelijk
     gekleurd kopje met gradient-streepje. Inline-vet in de lopende tekst blijft. */
  + "body.lw-ebook #pageContent .hlt-sv-h{display:block!important;position:relative!important;font-weight:800!important;font-size:17px!important;line-height:1.25!important;margin:22px 0 7px!important;padding:2px 0 2px 14px!important;}"
  + "body.lw-ebook #pageContent .hlt-sv-h,body.lw-ebook #pageContent .hlt-sv-h strong,body.lw-ebook #pageContent .hlt-sv-h b{color:#9B2F8F!important;}"
  + "body.lw-ebook #pageContent .hlt-sv-h:before{content:''!important;position:absolute!important;left:0;top:3px;bottom:3px;width:5px;border-radius:99px;background:linear-gradient(180deg,#5937B0,#E43777,#FB7171)!important;}"
  /* hoofdstuk-cover (dark-bg section met effen kleur) -> merk-gradient als afgeronde balk.
     Alleen data-bg-media=color, zodat covers met een achtergrondfoto ongemoeid blijven. */
  + "body.lw-ebook .learnworlds-section.lw-dark-bg[data-bg-media=color]{background:linear-gradient(135deg,#5937B0 0%,#9B2F8F 38%,#E43777 70%,#FB7171 100%)!important;border-radius:20px!important;box-shadow:0 14px 30px rgba(137,40,127,.28)!important;border:0!important;margin:6px 0 18px!important;overflow:hidden!important;}"
  + "body.lw-ebook .learnworlds-section.lw-dark-bg[data-bg-media=color] *{background-color:transparent!important;background-image:none!important;border-color:transparent!important;box-shadow:none!important;}"
  /* mobiel: zijmarge zodat tekst/kaartjes niet tegen de schermrand plakken + iets
     compactere koppen. Puur uiterlijk, geen knop/geometrie. */
  + "@media(max-width:600px){"
  +   "body.lw-ebook #pageContent{padding-left:14px!important;padding-right:14px!important;font-size:15px!important;}"
  +   "body.lw-ebook #pageContent .lw-ebook-heading2,body.lw-ebook #pageContent h2{font-size:23px!important;}"
  +   "body.lw-ebook #pageContent .hlt-ld-row{font-size:15px!important;padding:12px 13px!important;}"
  +   "body.lw-ebook #pageContent .hlt-sv-h{font-size:16px!important;margin-top:18px!important;}"
  + "}";

  function injectShell(){
    if(document.getElementById('hlt-player-shell')) return;
    var s=document.createElement('style'); s.id='hlt-player-shell'; s.textContent=SHELL_CSS;
    (document.head||document.documentElement).appendChild(s);
  }

  /* ---------- state ---------- */
  var GOAL=50, SEGMENTS=10, XP_PER=5, KEY='hlt_gamify_v1';
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
    var now=Date.now(); if(action==='answer'&&now-lastSync<4000) return; lastSync=now;  // throttle alleen op antwoorden
    var s=norm(load());
    try{
      /* player gebruikt ALTIJD 'sync' (server mergt naar boven, dus nooit verlies van
         lokale voortgang; 'get' is read-only en voor de account-widget). */
      fetch(SYNC_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'sync',email:email,local:{xp:s.xp||0,streak:s.streak||0,count:s.count||0,day:s.day||'',lastPractice:s.lastPractice||''}})})
      .then(function(r){return r.json();})
      .then(function(st){applyServer(st);})
      .catch(function(){});
    }catch(e){}
  }
  function applyServer(st){
    var state=(st&&st.state)?st.state:st;                 // contract: {ok,state}; tolereer ook kale state
    if(!state||typeof state.xp!=='number') return;
    var s=norm(load());
    s.xp=state.xp; s.streak=state.streak;                 // server is canoniek (al naar boven gemerged)
    var lp=state.last_practice||state.lastPractice; if(lp) s.lastPractice=lp;
    s.count=(state.day===today())?(state.count||0):0;     // count alleen overnemen als het van vandaag is
    if(state.days) s.days=state.days;                     // dag-historie (voor de streak-kalender)
    save(s);
    renderBar(); renderAccountWidget();
  }
  window.addEventListener('pagehide',function(){
    if(!SYNC_URL) return; var email=getEmail(); if(!email) return;
    var s=load();
    try{navigator.sendBeacon(SYNC_URL,new Blob([JSON.stringify({action:'sync',email:email,local:{xp:s.xp||0,streak:s.streak||0,count:s.count||0,day:s.day||'',lastPractice:s.lastPractice||''}})],{type:'application/json'}));}catch(e){}
  });

  /* ---------- gamification-balk ---------- */
  var BAR_HTML=''
   +'<div class="hlt-g-top"><div class="hlt-g-chips">'
   +'<div class="hlt-g-chip streak">&#128293; <span id="hlt-streak">0</span><span class="t" id="hlt-streak-lbl">&nbsp;dagen</span></div>'
   +'<div class="hlt-g-chip xp">&#9889; <span id="hlt-xp">0</span><span class="t">&nbsp;XP</span></div></div>'
   +'<div class="hlt-g-goal"><svg class="hlt-g-ring" viewBox="0 0 36 36"><circle class="bgc" cx="18" cy="18" r="15"></circle><circle class="fg" id="hlt-ring" cx="18" cy="18" r="15" stroke-dasharray="94.2" stroke-dashoffset="94.2"></circle></svg>'
   +'<span class="lbl">dagdoel&nbsp;<b id="hlt-goaltxt">0/10</b></span>'
   +'</div></div>'
   +'<div class="hlt-g-stories" id="hlt-stories"></div>';

  /* De LearnWorlds-topbar is position:absolute (top:0) en overlapt de bovenkant
     van het scroll-gebied. De gamification-balk staat in de flow daaronder en
     verdween daardoor achter de topbar / bij scrollen. Oplossing: balk sticky
     net onder de topbar (hoogte dynamisch gemeten), eigen achtergrond + z-index,
     zodat hij altijd zichtbaar blijft. Eigen element, raakt geen LW-geometrie. */
  /* Zelfcorrigerend: meet of de balk-bovenkant op de onderkant van de topbar zit
     en past de margin incrementeel aan tot dat klopt. Elke tick aangeroepen, dus
     past zich aan bij navigeren (intro -> vragen) en bij desktop/mobiel. Alleen
     meten als we bovenaan staan (scrollTop<=2) -> geen jank bij scrollen. Niet
     sticky (sticky gaf overlap met de foto). */
  /* De banner is absoluut gepind in .-second-col. Zet 'm net onder de topbar en
     reserveer eronder ruimte (zelfcorrigerend) zodat de content-inhoud net onder de
     banner valt - ongeacht de exacte topbar/offset van LearnWorlds. De ruimte staat
     als CSS-variabele op het STABIELE .-second-col, zodat hij de herbouw van het
     content-deel overleeft (geen sprong, geen herlaad). */
  function positionBar(bar){
    try{
      if(!bar) return;
      var col=document.querySelector('.-second-col'); if(!col) return;
      var colR=col.getBoundingClientRect();
      var tb=document.querySelector('.-second-col .-default-course-player-topbar,.-default-course-player-topbar');
      var tbBottom=tb?tb.getBoundingClientRect().bottom:colR.top+50;
      bar.style.top=Math.max(0,Math.round(tbBottom-colR.top))+'px';   // net onder de topbar
      var sc=document.querySelector('.-second-col-content'); if(!sc) return;
      if(sc.scrollTop>2) return;                                       // alleen bovenaan meten -> geen jank
      var ref=document.querySelector('.-content-wrapper')||document.getElementById('playerFrame'); if(!ref) return;
      var err=Math.round(bar.getBoundingClientRect().bottom-ref.getBoundingClientRect().top); // >0=overlap, <0=gat
      if(Math.abs(err)>3){
        var cur=parseFloat(getComputedStyle(sc).paddingTop)||0;
        col.style.setProperty('--hlt-gbar-space',Math.max(0,Math.round(cur+err))+'px');
      }
    }catch(e){}
  }
  function buildBar(){
    if(document.getElementById('hlt-g-bar')) return true;
    /* De banner in het STABIELE .-second-col plaatsen (absoluut gepind). Zowel
       .-content-wrapper als .-second-col-content worden per vraag herbouwd, maar
       .-second-col niet (daar zit ook de indien-balk, die blijft ook staan). Zo laadt
       de banner 1x en blijft staan tussen vragen door -> geen herbouw, geen sprong.
       Valt terug op de oude in-flow plek als .-second-col ontbreekt. */
    var col=document.querySelector('.-second-col');
    var frame=document.getElementById('playerFrame');
    var bar=document.createElement('div'); bar.id='hlt-g-bar'; bar.className='hlt-g-bar'; bar.innerHTML=BAR_HTML;
    if(col){ col.appendChild(bar); }                                  // STABIEL: laadt 1x, blijft staan
    else if(frame&&frame.parentElement){ frame.parentElement.insertBefore(bar,frame); }
    else return false;
    var st=bar.querySelector('#hlt-stories'),h='',i;
    for(i=0;i<SEGMENTS;i++)h+='<div class="hlt-g-seg"><span></span></div>';
    st.innerHTML=h;
    positionBar(bar); renderBar(); return true;
  }
  function renderBar(){
    var bar=document.getElementById('hlt-g-bar'); if(!bar)return; var s=norm(load());
    var a=bar.querySelector('#hlt-streak'); if(a)a.textContent=s.streak||0;
    var al=bar.querySelector('#hlt-streak-lbl'); if(al)al.innerHTML='&nbsp;'+dagWord(s.streak||0);
    var b=bar.querySelector('#hlt-xp'); if(b)b.textContent=s.xp||0;
    var cnt=Math.min(s.count||0,GOAL),c=2*Math.PI*15;
    var r=bar.querySelector('#hlt-ring'); if(r)r.style.strokeDashoffset=c*(1-cnt/GOAL);
    var g=bar.querySelector('#hlt-goaltxt'); if(g)g.textContent=cnt+'/'+GOAL;
    var segs=bar.querySelectorAll('.hlt-g-seg'),i,fill=Math.floor(cnt/GOAL*segs.length);
    for(i=0;i<segs.length;i++)segs[i].className='hlt-g-seg'+(i<fill?' done':'');
    positionBar(bar);
  }
  function haptic(){if(navigator.vibrate){try{navigator.vibrate(25);}catch(e){}}}
  function xpPop(a){var bar=document.getElementById('hlt-g-bar');if(!bar)return;var an=bar.querySelector('#hlt-xp')||bar,r=an.getBoundingClientRect();var p=document.createElement('div');p.className='hlt-xp-pop';p.textContent='+'+a+' XP';p.style.left=r.left+'px';p.style.top=(r.top-6)+'px';document.body.appendChild(p);setTimeout(function(){p.remove();},1000);}

  var lastCount=0;
  function countQuestion(){
    var now=Date.now(); if(now-lastCount<1200)return; lastCount=now;
    var s=norm(load()),t=today();
    if(s.lastPractice!==t){s.streak=(s.lastPractice===yesterday()?(s.streak||0)+1:1);s.lastPractice=t;}
    s.count=(s.count||0)+1; s.xp=(s.xp||0)+XP_PER; save(s);
    renderBar(); xpPop(XP_PER); haptic(); syncServer('answer');
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
  /* kleur het gekozen/juiste antwoord als heel blok (LearnWorlds biedt geen
     correct/wrong-class). Juiste optie = label-tekst komt voor in .correct-answers-
     wrapper; fout gekozen = optie met .correctness-badge die niet juist is. */
  function colorAnswers(doc){
    try{
      var mc=doc.querySelector('.lw-qn-mc-options'); if(!mc) return;
      var caw=doc.querySelector('.correct-answers-wrapper'); if(!caw) return;
      var ct=(caw.textContent||'').replace(/juist antwoord/i,'').trim().toLowerCase();
      if(!ct) return;
      var ws=mc.querySelectorAll('.lw-qn-radio-option-wrapper'),i;
      for(i=0;i<ws.length;i++){
        var w=ws[i];
        var l=w.querySelector('.lw-qn-radio-option-lbl')||w.querySelector('.lw-qn-radio-option');
        var t=(l?l.textContent:'').trim().toLowerCase();
        var chosen=!!w.querySelector('.correctness-badge');
        w.classList.remove('hlt-correct','hlt-wrong');
        if(t&&ct.indexOf(t)>-1) w.classList.add('hlt-correct');
        else if(chosen) w.classList.add('hlt-wrong');
      }
    }catch(e){}
  }
  /* resultaatscherm: Engelse titel -> Nederlands. Idempotent: na vertaling matcht
     de Engelse tekst niet meer. Pass/fail o.b.v. de titeltekst of het fa-icoon. */
  function localizeResult(doc){
    try{
      var h=doc.querySelector('.lw-ass-end-2 h3.learnworlds-heading3,.lw-ass-end-icon-text h3');
      if(!h) return;
      var t=(h.textContent||'').trim();
      var fail=/failed|sorry|jammer|helaas/i.test(t)||!!doc.querySelector('.lw-ass-end-2 .learnworlds-icon.fa-times,.lw-ass-end-2 .learnworlds-icon.fa-times-circle');
      var pass=/passed|congrat|well done|success|geslaagd|gefeliciteerd/i.test(t)||!!doc.querySelector('.lw-ass-end-2 .learnworlds-icon.fa-check,.lw-ass-end-2 .learnworlds-icon.fa-check-circle,.lw-ass-end-2 .learnworlds-icon.fa-trophy');
      if(pass && t.indexOf('Gefeliciteerd')<0){ h.textContent='Gefeliciteerd, geslaagd!'; }
      else if(fail && t.indexOf('Helaas')<0){ h.textContent='Helaas, net niet gehaald'; }
    }catch(e){}
  }
  function bindFrame(frame){
    try{
      var doc=frame.contentDocument;
      if(!isAssessmentDoc(doc)) return;
      if(doc.__hltGObs) return; doc.__hltGObs=true;
      var seen=false;
      var hideNativeFooter=function(){try{var nf=doc.querySelectorAll('.lw-nav-prog-wrapper');for(var i=0;i<nf.length;i++){if(nf[i].style.visibility!=='hidden')nf[i].style.visibility='hidden';}}catch(e){}};
      var obs=new MutationObserver(function(){
        hideNativeFooter();                                   // zo vroeg mogelijk verbergen -> geen opflits
        var fb=doc.querySelector('.correctness-badge, .correct-answers-wrapper');
        if(fb) colorAnswers(doc);
        if(fb&&!seen){seen=true;countQuestion();} else if(!fb&&seen){seen=false;}
        localizeResult(doc);
      });
      obs.observe(doc.body,{childList:true,subtree:true});
      hideNativeFooter();
      localizeResult(doc);
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

  /* ---------- ebook content-pagina's ---------- */
  function isEbookDoc(doc){
    try{
      if(!doc||!doc.body) return false;
      if(doc.body.classList&&doc.body.classList.contains('lw-ebook')) return true;
      return !!doc.querySelector('#pageContent.page-content');
    }catch(e){return false;}
  }
  function hltEsc(s){return (s==null?'':String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  /* Bouwt een vinkjes-tekstblok (Leerdoelen) om tot kaartjes. LearnWorlds zet de
     leerdoelen NIET in een lijst, maar als losse regels in 1 <p>: elk doel start
     met <cite class="fa-check-circle"> en is gescheiden door <br>; de intro staat
     in <strong>. We splitsen op <br>, lezen intro + items en vervangen de
     tekst-container door <p class=hlt-intro> + <ul class=hlt-ld-list>. Idempotent:
     na ombouw bestaan de cites niet meer, dus herhaald draaien is een no-op. */
  function enhanceEbook(doc){
    try{
      var root=doc.getElementById('pageContent')||doc.body;
      if(!root.querySelector('cite[class*=check],[class*=fa-check]')) return;
      var CK='<svg viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.3 4.3L19 7.4" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      var ps=root.querySelectorAll('p');
      Array.prototype.forEach.call(ps,function(p){
        if(!p.isConnected) return;
        if(!p.querySelector('cite[class*=check],[class*=fa-check]')) return;
        var segs=[[]];
        Array.prototype.forEach.call(p.childNodes,function(n){ if(n.nodeName==='BR')segs.push([]); else segs[segs.length-1].push(n); });
        var intro='',items=[];
        segs.forEach(function(seg){
          var hasCheck=seg.some(function(n){return n.nodeType===1&&/check/.test(n.className||'');});
          var txt='';
          seg.forEach(function(n){ if(n.nodeType===1&&/learnworlds-icon|fa-/.test(n.className||'')) return; txt+=(n.textContent||''); });
          txt=txt.replace(/ /g,' ').trim();
          if(hasCheck){ if(txt) items.push(txt.replace(/[;.]\s*$/,'')); }
          else if(txt&&seg.some(function(n){return n.nodeType===1&&n.tagName==='STRONG';})&&!intro){ intro=txt.replace(/\s*:\s*$/,''); }
        });
        if(!items.length) return;
        var html=(intro?'<p class="hlt-intro">'+hltEsc(intro)+':</p>':'')
          +'<ul class="hlt-ld-list">'
          +items.map(function(t){return '<li class="hlt-ld-row"><span class="hlt-ck">'+CK+'</span><span>'+hltEsc(t)+'</span></li>';}).join('')
          +'</ul>';
        var host=p.closest('.lw-ebook-mainTextNormal')||p.closest('.learnworlds-element')||p.parentElement;
        host.innerHTML=html; host.setAttribute('data-hlt','1');
      });
    }catch(e){}
  }
  /* Samenvatting-pagina's: markeer tussenkopjes. Een kopje is een element binnen
     .lw-ebook-mainTextNormal waarvan de hele inhoud precies 1 vetgedrukt stukje is
     (div><strong>..</strong>). Inline-vet in de lopende tekst zit in elementen met
     ook gewone tekst eromheen, dus die worden niet geraakt. Idempotent. */
  function styleSummary(doc){
    try{
      var root=doc.getElementById('pageContent')||doc.body;
      var els=root.querySelectorAll('.lw-ebook-mainTextNormal div, .lw-ebook-mainTextNormal p');
      Array.prototype.forEach.call(els,function(el){
        if(el.classList.contains('hlt-sv-h')) return;
        if(el.children.length!==1) return;
        var c=el.children[0];
        if(c.tagName!=='STRONG'&&c.tagName!=='B') return;
        var full=(el.textContent||'').replace(/ /g,' ').trim();
        var stt=(c.textContent||'').replace(/ /g,' ').trim();
        if(full&&full===stt&&stt.length<=60) el.classList.add('hlt-sv-h');
      });
    }catch(e){}
  }
  function ebookFrame(frame){
    try{
      var doc=frame.contentDocument;
      if(!isEbookDoc(doc)||!doc.head) return;
      if(!doc.getElementById('hlt-ebook-style')){var st=doc.createElement('style');st.id='hlt-ebook-style';st.textContent=EBOOK_CSS;doc.head.appendChild(st);}
      enhanceEbook(doc); styleSummary(doc);
      if(!doc.__hltEbObs){
        doc.__hltEbObs=true;
        var obs=new MutationObserver(function(){ enhanceEbook(doc); styleSummary(doc); });
        obs.observe(doc.body,{childList:true,subtree:true});
      }
    }catch(e){}
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
    o.querySelector('#hlt-r-share').addEventListener('click',function(){ var m=ensureShareMenu(); m.classList.toggle('show'); });
  }

  /* ---------- eigen deel-menu i.p.v. de systeem-sheet ----------
     Story-afbeelding (canvas) + WhatsApp + kopieer-link. De afbeelding wordt
     SYNCHROON gemaakt (toDataURL) zodat navigator.share binnen de klik-gesture
     valt -> werkt ook op iOS. Op desktop valt 'ie netjes terug op downloaden. */
  function shareText(s){ return '\uD83D\uDD25 '+(s.streak||0)+' '+dagWord(s.streak||0)+' streak op HaalTheorie, '+(s.xp||0)+' XP! Oefen mee op haaltheorie.nl'; }
  function rrect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
  function renderStreakCanvas(s){
    var W=1080,H=1920,cv=document.createElement('canvas');cv.width=W;cv.height=H;var ctx=cv.getContext('2d');
    var g=ctx.createLinearGradient(0,0,W,H);g.addColorStop(0,'#5937B0');g.addColorStop(.4,'#9B2F8F');g.addColorStop(.72,'#E43777');g.addColorStop(1,'#FB7171');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.globalAlpha=.10;ctx.font='820px serif';ctx.fillStyle='#fff';ctx.fillText('\uD83D\uDD25',W/2,H/2+40);ctx.globalAlpha=1;
    var cardX=110,cardY=540,cardW=W-220,cardH=860;
    ctx.save();ctx.shadowColor='rgba(0,0,0,.25)';ctx.shadowBlur=60;ctx.shadowOffsetY=24;
    rrect(ctx,cardX,cardY,cardW,cardH,64);ctx.fillStyle='rgba(255,255,255,.98)';ctx.fill();ctx.restore();
    ctx.fillStyle='#2A1B33';ctx.font='150px serif';ctx.fillText('\uD83D\uDD25',W/2,cardY+150);
    ctx.fillStyle='#E43777';ctx.font='900 300px Inter,Arial,sans-serif';ctx.fillText(String(s.streak||0),W/2,cardY+400);
    ctx.fillStyle='#2A1B33';ctx.font='800 72px Inter,Arial,sans-serif';ctx.fillText(dagWord(s.streak||0)+' streak',W/2,cardY+560);
    ctx.fillStyle='#5B36C4';ctx.font='800 60px Inter,Arial,sans-serif';ctx.fillText('\u26A1 '+(s.xp||0)+' XP totaal',W/2,cardY+680);
    ctx.fillStyle='#9A7E8C';ctx.font='700 46px Inter,Arial,sans-serif';ctx.fillText(GOAL+' vragen vandaag geoefend',W/2,cardY+770);
    ctx.fillStyle='#fff';ctx.font='900 64px Inter,Arial,sans-serif';ctx.fillText('HAALTHEORIE.NL',W/2,cardY+cardH+120);
    ctx.globalAlpha=.92;ctx.font='700 42px Inter,Arial,sans-serif';ctx.fillText('Haal je theorie in \u00E9\u00E9n keer',W/2,cardY+cardH+190);ctx.globalAlpha=1;
    return cv;
  }
  function dataURLtoBlob(d){var a=d.split(','),m=a[0].match(/:(.*?);/)[1],b=atob(a[1]),n=b.length,u=new Uint8Array(n);while(n--)u[n]=b.charCodeAt(n);return new Blob([u],{type:m});}
  function shareStoryImage(){
    var s=norm(load()),btn=document.getElementById('hlt-sh-img');
    try{
      var cv=renderStreakCanvas(s),blob=dataURLtoBlob(cv.toDataURL('image/png'));
      var file=new File([blob],'haaltheorie-streak.png',{type:'image/png'});
      if(navigator.canShare&&navigator.canShare({files:[file]})&&navigator.share){
        navigator.share({files:[file],title:'Mijn HaalTheorie streak',text:shareText(s)}).catch(function(){});
      }else{
        var url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='haaltheorie-streak.png';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},3000);
        if(btn){var o=btn.innerHTML;btn.innerHTML='<span>\u2705</span> Opgeslagen';setTimeout(function(){btn.innerHTML=o;},1600);}
      }
    }catch(e){}
  }
  function shareWhatsApp(){var s=norm(load());try{window.open('https://wa.me/?text='+encodeURIComponent(shareText(s)+' https://haaltheorie.nl'),'_blank');}catch(e){}}
  function shareCopy(){var s=norm(load()),txt=shareText(s)+' https://haaltheorie.nl';try{if(navigator.clipboard)navigator.clipboard.writeText(txt);}catch(e){}var b=document.getElementById('hlt-sh-cp');if(b){var o=b.innerHTML;b.innerHTML='<span>\u2705</span> Gekopieerd!';setTimeout(function(){b.innerHTML=o;},1500);}}
  function ensureShareMenu(){
    var m=document.getElementById('hlt-share-menu');if(m)return m;
    var res=document.querySelector('#hlt-ovl .hlt-res'),closeBtn=document.getElementById('hlt-r-close');
    m=document.createElement('div');m.id='hlt-share-menu';m.className='hlt-share-menu';
    m.innerHTML='<button class="hlt-sh-btn img" id="hlt-sh-img"><span>\uD83D\uDCF8</span> Deel je story</button>'
      +'<button class="hlt-sh-btn wa" id="hlt-sh-wa"><span>\uD83D\uDCAC</span> WhatsApp</button>'
      +'<button class="hlt-sh-btn cp" id="hlt-sh-cp"><span>\uD83D\uDD17</span> Kopieer link</button>';
    res.insertBefore(m,closeBtn);
    m.querySelector('#hlt-sh-img').addEventListener('click',shareStoryImage);
    m.querySelector('#hlt-sh-wa').addEventListener('click',shareWhatsApp);
    m.querySelector('#hlt-sh-cp').addEventListener('click',shareCopy);
    return m;
  }
  function celebrate(s){
    ensureOverlay();
    document.getElementById('hlt-r-streak').textContent=s.streak||0;
    var rl=document.getElementById('hlt-r-streak-lbl'); if(rl)rl.textContent=dagWord(s.streak||0)+' streak';
    document.getElementById('hlt-r-xp').textContent=s.xp||0;
    document.getElementById('hlt-r-count').textContent=GOAL+' vragen geoefend vandaag';
    document.getElementById('hlt-r-msg').textContent='Je streak staat op '+(s.streak||0)+' '+dagWord(s.streak||0)+'. Kom morgen terug om \u2019m te verlengen.';
    var _sm=document.getElementById('hlt-share-menu'); if(_sm) _sm.classList.remove('show');
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
  /* hoofdstuk-menu: LearnWorlds zet het nummer als "1." (met punt) in de gradient-
     badge. Strip de punt zodat alleen het cijfer overblijft (gecentreerd, clean).
     Idempotent + geguard: alleen aanpassen als er echt een punt op het eind staat. */
  function cleanChapterNums(){
    try{
      var ns=document.querySelectorAll('.lrn-path-chapter-name-num');
      for(var i=0;i<ns.length;i++){
        var el=ns[i],t=(el.textContent||'');
        if(/[.·\s]+$/.test(t)){
          var clean=t.replace(/[.·\s]+$/,'');
          if(clean&&clean!==el.textContent) el.textContent=clean;
        }
      }
    }catch(e){}
  }
  /* vaste indien-balk in de buitenste laag. De echte footer/knop zit in het iframe en
     dat iframe is hoger dan het scherm, dus die knop valt onder de vouw. Deze balk staat
     in de speler zelf (schermhoogte) en stuurt op klik een klik naar de echte knop in het
     iframe. Alleen tonen op vraag-schermen (waar een submit-knop bestaat). */
  function buildSubmitBar(){
    try{
      var col=document.querySelector('.-second-col'); if(!col) return;
      var f=document.getElementById('playerFrame'); var doc=f&&f.contentDocument;
      var realBtn=null,isQ=false;
      try{
        if(doc){
          realBtn=doc.querySelector('.lw-nav-prog-wrapper .learnworlds-button-solid-brand')||doc.querySelector('.learnworlds-button-solid-brand');
          isQ=!!doc.querySelector('.lw-qn-cnt,.lw-qn-mc-options,.lw-qn-descr,.learnworlds-input');
        }
      }catch(e){}
      var bar=document.getElementById('hlt-submit-bar');
      if(!(realBtn&&isQ&&isAssessmentDoc(doc))){ if(bar) bar.style.display='none'; return; }
      if(!bar){
        bar=document.createElement('div'); bar.id='hlt-submit-bar'; bar.className='hlt-submit-bar';
        bar.innerHTML='<span class="hlt-sb-prog" id="hlt-sb-prog"></span><button class="hlt-sb-btn" id="hlt-sb-btn" type="button">Indienen <span aria-hidden="true">→</span></button>';
        col.appendChild(bar);
        bar.querySelector('#hlt-sb-btn').addEventListener('click',function(){
          try{
            var d=document.getElementById('playerFrame').contentDocument;
            var rb=d&&(d.querySelector('.lw-nav-prog-wrapper .learnworlds-button-solid-brand')||d.querySelector('.learnworlds-button-solid-brand'));
            if(rb) rb.click();
          }catch(e){}
          haptic();
        });
      }
      bar.style.display='flex';
      var pt=bar.querySelector('#hlt-sb-prog');
      try{ var prog=doc.querySelector('.lw-qr-nav-wrapper'); if(prog&&pt){ var tx=(prog.textContent||'').trim(); if(tx) pt.textContent=tx; } }catch(e){}
    }catch(e){}
  }
  function tick(){
    injectShell();
    renderAccountWidget();
    cleanChapterNums();
    if(!document.body||!document.body.classList.contains('slug-path-player')) return;
    var f=document.getElementById('playerFrame'); if(!f)return;
    injectStyle(f); bindFrame(f); ebookFrame(f); buildBar(); buildSubmitBar();
    var _gb=document.getElementById('hlt-g-bar'); if(_gb) positionBar(_gb);   // elke tick herpositioneren (intro -> vragen)
    /* Anti-sprong: LearnWorlds bouwt bij elke nieuwe vraag het content-gebied opnieuw op,
       waardoor onze banner verdwijnt; de tick zette 'm pas ~1s later terug (zichtbare sprong).
       Deze waarnemer herplaatst de banner DIRECT (in dezelfde microtask, vóór de browser
       opnieuw tekent) zodra het content-gebied wijzigt, zodat er niets verspringt. */
    if(!window.__hltReinsObs){
      var stable=document.querySelector('.-second-col');
      if(stable&&window.MutationObserver){
        window.__hltReinsObs=new MutationObserver(function(){
          if(!document.getElementById('hlt-g-bar')&&document.getElementById('playerFrame')){ buildBar(); }
          if(!document.getElementById('hlt-submit-bar')){ buildSubmitBar(); }
        });
        window.__hltReinsObs.observe(stable,{childList:true,subtree:true});
      }
    }
    if(!f.__hltLoadBound){f.__hltLoadBound=true;f.addEventListener('load',function(){setTimeout(function(){injectStyle(f);try{if(f.contentDocument){f.contentDocument.__hltGObs=false;f.contentDocument.__hltEbObs=false;}}catch(e){}bindFrame(f);ebookFrame(f);buildBar();buildSubmitBar();renderBar();},60);});}
  }
  /* test-hook: toont de dagdoel-modal direct, zodat het deel-menu te previewen is
     zonder eerst 10 vragen te beantwoorden. Bv: __HLT_DEMO_CELEBRATE({streak:7,xp:140}) */
  window.__HLT_DEMO_CELEBRATE=function(st){ try{ celebrate(norm(st||load())); }catch(e){ console.warn('demo',e); } };
  setInterval(tick,1200);
  function init(){ tick(); if(!window.__hltSynced&&getEmail()){window.__hltSynced=true;syncServer('init');} }  // init = eenmalige merge+pull bij openen (nieuw toestel haalt de account-streak op)
  if(document.readyState!=='loading'){init();}else{document.addEventListener('DOMContentLoaded',init);}
})();
