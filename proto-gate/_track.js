/* ─────────────────────────────────────────────────────────────────────────────
   _track.js — 온보딩 게이트 이벤트 로그

   질문: 「프로토타입에 이벤트 로그를 심고 유저가 클릭하는 데이터를 볼 수 있나」
   답: 볼 수 있다. 단 **화면에는 아무것도 안 띄운다** — R9 는 남에게 열어 줄 후보라
   화면 위의 계측 UI 를 전부 걷어냈다(코멘트 바와 같은 이유). 수집만 조용히 돈다.

     수집(항상 동작 · 준비물 없음) — 클릭을 이 파일이 capture 단계에서 직접 기록하고
        localStorage 에 최근 500건을 남긴다(새로고침해도 이어진다).
     보기 ①  콘솔에서 `trackLog()` — 이번 세션의 전체 배열을 그대로 돌려준다.
     보기 ②  Datadog — `window.DD_RUM` 이 있으면 같은 이벤트를 `addAction(key, props)`
        로 넘긴다. RUM 애플리케이션(applicationId + clientToken)을 만들어 `_ddrum.js` 를
        채우면 그 순간부터 보인다. 없으면 조용히 수집만 한다(아무것도 깨지지 않는다).
        ← 실사용 로그를 볼 거면 이 경로가 정본이다.

   이벤트 키는 볼트의 「이벤트 텍소노미」 규칙을 따른다: `{action}_{target}_{Screen}`,
   camelCase, Screen 만 PascalCase. 이 화면의 Screen 은 `SkinOnboarding` 이다.

   R8 에 있던 「◉ 이벤트 N」 알약(누르면 최근 80건 + JSON 복사)과 `?track=0`·`?live=1`
   숨김 장치는 R9 에서 지웠다 — 되살릴 일이 있으면 round-8/_track.js 를 가져온다.
   ───────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var SCREEN = 'SkinOnboarding';
  var LS = 'studio.track.' + SCREEN;
  var VARIANT = (window.R9_LAY === 'b' || window.R9_LAY === 'c') ? window.R9_LAY : 'a';
  var VNAME = { a: 'A 순차', b: 'B 병렬', c: 'C 계층' }[VARIANT];

  var t0 = Date.now();
  var log = [];
  try { log = JSON.parse(localStorage.getItem(LS) || '[]'); } catch (e) { log = []; }

  /* 지금까지 고른 값 — 적용 시점에 한 줄로 묶어 보내기 위해 들고 있는다.
     DOM(aria-pressed)에서 긁지 않는 이유: A 시안은 한 번에 한 문항만 그리므로
     다른 문항의 선택이 화면에 없다(긁으면 null 이 된다). */
  var pick = { industry: null, count: null, band: null, concept: null, brand: null, font: null };
  var steps = {};

  function K(action, target) { return action + '_' + target + '_' + SCREEN; }

  /* ── 2층 전송(데이터독 RUM) — 에이전트가 붙기 전 이벤트를 버리지 않는다 ──────
     `_ddrum.js` 는 RUM 에이전트를 async 스크립트로 얹으므로, DOMContentLoaded 시점에는
     `window.DD_RUM` 이 아직 없다. 종전엔 그 사이에 난 이벤트(첫 `pageview_gate` 와 초반
     클릭)가 그대로 사라져 로컬 로그에만 남았다 — 방문 수는 RUM 자체 view 이벤트로 세지만
     「열자마자 무엇을 눌렀나」가 빠지면 첫 화면 이탈을 못 읽는다.
     그래서 붙기 전 이벤트는 큐에 담아 두고 붙는 순간 순서대로 넘긴다.
     10초 안에 안 붙으면 «꺼져 있는 것»(값 미기입)이므로 큐를 비운다 — 이 상태가 정상이고,
     무한히 들고 있으면 메모리만 먹는다. */
  var pending = [];
  function ddSend(key, props) {
    try {
      if (window.DD_RUM && typeof window.DD_RUM.addAction === 'function') {
        window.DD_RUM.addAction(key, props || {});
        return true;
      }
    } catch (e) {}
    return false;
  }
  (function waitForRum() {
    var tries = 0;
    var iv = setInterval(function () {
      tries++;
      if (window.DD_RUM) {
        var q = pending; pending = [];
        q.forEach(function (r) { ddSend(r.key, r.props); });
        clearInterval(iv);
      } else if (tries > 20) { pending.length = 0; clearInterval(iv); }
    }, 500);
  })();

  function send(key, props) {
    var row = { t: Date.now() - t0, key: key, props: props || {} };
    log.push(row);
    try { localStorage.setItem(LS, JSON.stringify(log.slice(-500))); } catch (e) {}
    /* 붙어 있으면 바로, 아직이면 큐에 (큐는 50건까지 — 그 이상 쌓이는 건 꺼진 상태다) */
    if (!ddSend(key, props) && pending.length < 50) pending.push({ key: key, props: props || {} });
    return row;
  }

  /* ── 클릭 수집 ────────────────────────────────────────────────────────────
     capture 단계에서 문서에 한 번만 건다. 게이트 핸들러가 중간에
     stopPropagation 하는 자리가 있어서(캔버스 위젯 등) bubble 로는 놓친다. */
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;

    var el;
    if ((el = t.closest('#onb [data-ind]'))) {
      pick.industry = el.dataset.ind;
      send(K('click', 'industry'), { industry: pick.industry, variant: VARIANT });
    }
    else if ((el = t.closest('#onb [data-cnt]'))) {
      pick.count = +el.dataset.cnt;
      pick.band = pick.count <= 1 ? 'one' : pick.count <= 10 ? 'two' : 'tabs';
      send(K('click', 'productCount'), { count: pick.count, band: pick.band, variant: VARIANT });
    }
    else if ((el = t.closest('#onb [data-con]'))) {
      pick.concept = el.dataset.con;
      send(K('click', 'concept'), { concept: pick.concept, variant: VARIANT });
    }
    else if ((el = t.closest('#onb [data-brand]'))) {
      pick.brand = el.dataset.brand;
      send(K('click', 'brandColor'), { color: pick.brand, variant: VARIANT });
    }
    else if ((el = t.closest('#onb [data-font]'))) {
      pick.font = el.dataset.font;
      send(K('click', 'font'), { font: pick.font, variant: VARIANT });
    }
    else if ((el = t.closest('#onb [data-cat]'))) {
      send(K('click', 'categoryChip'), { category: el.dataset.cat, variant: VARIANT });
    }
    else if ((el = t.closest('#onb [data-steph]'))) {
      steps[el.dataset.steph] = 1;
      send(K('click', 'stepNav'), { to: +el.dataset.steph, via: 'rail', variant: VARIANT });
    }
    else if ((el = t.closest('#onb [data-nav]'))) {
      send(K('click', 'stepNav'), { delta: +el.dataset.nav, via: 'button', variant: VARIANT });
    }
    else if ((el = t.closest('#onb [data-go]'))) {
      /* 이 화면의 성공 지표 — 3시안 중 어느 쪽이 완주되는지가 여기서 갈린다 */
      send(K('complete', 'gateApply'), {
        variant: VARIANT, industry: pick.industry, count: pick.count, band: pick.band,
        concept: pick.concept, brand: pick.brand, font: pick.font,
        steps_touched: Object.keys(steps).length,
        seconds_spent: Math.round((Date.now() - t0) / 1000)
      });
    }
    else if ((el = t.closest('.seg [data-device]'))) {
      send(K('click', 'deviceToggle'), { device: el.dataset.device, variant: VARIANT });
    }
    else if ((el = t.closest('#sfcanvas [data-kind]'))) {
      send(K('click', 'canvasWidget'), { widget: el.dataset.kind, variant: VARIANT });
    }
    /* 전환 CTA — 이 프로토의 최종 목적지다. 종전엔 RUM 자동 수집의 「click on 스킨 구매하러
       가기 →」 라벨로만 남았는데, 그건 버튼 글자가 바뀌면 지표가 끊긴다. 키로 못박는다. */
    else if ((el = t.closest('.fin-buy, .fin-trial, .trial-fab__main, .trial-fab__sub'))) {
      var buy = el.classList.contains('fin-buy') || el.classList.contains('trial-fab__main');
      var fin = el.classList.contains('fin-buy') || el.classList.contains('fin-trial');
      send(K('click', 'cta'), {
        target: buy ? 'buy' : 'trial',      /* 스킨 구매 / 7일 무료 체험 */
        where: fin ? 'finishDialog' : 'fab',
        variant: VARIANT
      });
    }
  }, true);

  /* ── 화면 출력 없음 ───────────────────────────────────────────────────────
     R8 에는 오른쪽 아래에 「◉ 이벤트 N」 알약이 있었다(누르면 최근 80건 + JSON 복사).
     R9 에서 걷어냈다 — 코멘트 바와 같은 이유로 내부 도구이고, 이 파일은 남에게 열어 줄
     후보다. `?track=0`·`?live=1` 로 감추는 장치도 함께 지웠다(감출 게 없다).
     **수집은 그대로 돈다** — `send()` 가 localStorage 에 쌓고(최근 500건), `window.DD_RUM`
     이 있으면 `addAction` 으로 넘긴다. 볼 방법은 두 가지:
       · 콘솔에서 `trackLog()` — 이번 세션의 전체 배열
       · `_ddrum.js` 에 RUM 값 두 개를 채우면 Datadog 에서 바로 보인다(권장 경로)
     알약을 되살릴 일이 있으면 round-8/_track.js 의 `build()`/`paint()` 를 그대로 가져온다. */

  /* ── 퍼널 뼈대: 단계 «도달» 노출 ────────────────────────────────────────────
     클릭만 모으면 「②까지 갔는데 아무것도 안 누르고 나갔다」가 안 잡혀 이탈 지점을 못 짚는다.
     그래서 각 단계에 도달한 사실 자체를 남긴다 — 퍼널은 도달 이벤트로 짜고, 클릭은 그 안에서
     무엇을 골랐는지 설명한다.

     게이트 상태(S.step)는 _r9.js 클로저 안이라 밖에서 못 읽는다. 대신 게이트가 그려 놓는
     진행 레일의 aria-current="step" 을 읽는다 — 화면에 실제로 서 있는 단계가 진실원본이고,
     엔진에 손을 대지 않아도 된다. 같은 단계를 다시 그리는 리렌더가 잦으므로 값이 바뀔 때만
     보낸다(스텝을 왕복하면 그때마다 한 번씩 남는 게 맞다 — 되돌아온 것도 행동이다). */
  var STEP_NAME = ['업종', '구성', '위젯'];
  var lastStep = null;
  function curStep() {
    var e = document.querySelector('#onb .prg__i[aria-current="step"]');
    return e && e.dataset.steph !== undefined ? +e.dataset.steph : null;
  }
  function stepPing() {
    var n = curStep();
    if (n === null || n === lastStep) return;
    lastStep = n; steps[n] = 1;
    send(K('imp', 'step'), { step: n, name: STEP_NAME[n] || String(n), variant: VARIANT });
  }

  /* 완료 다이얼로그 노출 · 상세페이지 진입 — 둘 다 클래스 토글로 드러나므로 그것만 본다
     (#finDlg.show / body.sf-detail 은 _r9.js syncPage 가 붙인다). */
  var finSeen = false, detailSeen = false;
  function overlayPing() {
    var fin = document.getElementById('finDlg');
    if (fin && fin.classList.contains('show') && !finSeen) {
      finSeen = true;
      send(K('imp', 'finishDialog'), { seconds_spent: Math.round((Date.now() - t0) / 1000), variant: VARIANT });
    }
    var onDetail = document.body.classList.contains('sf-detail');
    if (onDetail && !detailSeen) { detailSeen = true; send(K('pageview', 'detail'), { variant: VARIANT }); }
    if (!onDetail) detailSeen = false;   /* 메인으로 돌아갔다 다시 들어오면 다시 센다 */
  }

  function watch() {
    stepPing(); overlayPing();
    new MutationObserver(function () { stepPing(); overlayPing(); })
      .observe(document.body, { childList: true, subtree: true, attributes: true,
                                attributeFilter: ['class', 'aria-current'] });
  }

  function boot() {
    send(K('pageview', 'gate'), { variant: VARIANT, variant_name: VNAME });
    /* 게이트(#onb)는 _r9.js 가 DOMContentLoaded 뒤에 그린다 — 한 틱 뒤에 붙는다 */
    setTimeout(watch, 600);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* 밖에서도 쓸 수 있게 — 다른 위젯에서 이벤트를 더 심고 싶으면 track('click','x',{}) */
  window.track = function (action, target, props) { return send(K(action, target), props); };
  window.trackLog = function () { return log.slice(); };
})();
