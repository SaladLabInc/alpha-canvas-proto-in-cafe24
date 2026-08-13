/* ─────────────────────────────────────────────────────────────────────────────
   _ddrum.js — Datadog RUM 연결 (지금은 꺼져 있다)

   `APP` 두 값만 채우면 켜진다. 그 순간부터 `_track.js` 가 보내는 이벤트가
   Datadog RUM 의 Action 으로 그대로 들어가고, Session Replay 로 클릭 흐름을
   되감아 볼 수 있다. 비어 있으면 아무것도 로드하지 않는다(콘솔 경고도 없다).

   ⚠ **기존 `core-dashboard` 앱을 쓰면 안 된다.** 프로토타입 세션이 실서비스
     대시보드·알럿·에러율에 섞여 들어간다. Datadog 콘솔에서 프로토타입 전용
     RUM 애플리케이션을 새로 만들고(예: `canvas-proto`) 그 값을 넣는다.

   두 값의 성격: `clientToken` 은 브라우저에 노출되는 **공개** 토큰이라 레포에
   들어가도 된다(조회 권한이 없다 — 쓰기만 한다). 조회용 API key/Application key
   와 혼동하면 안 된다. 그건 절대 프론트에 넣지 않는다.

   file:// 로 열면 데이터가 올라가지 않는다(origin 이 null). 포털·Pages 로
   서빙할 때만 유효하다 — 로컬에서는 `_track.js` 의 1층 패널로 확인한다.
   ───────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  /* canvas-proto — 프로토타입 전용 RUM 앱(2026-08-13 생성). core-dashboard 와 분리돼 있어
     실서비스 대시보드·알럿에 섞이지 않는다. 두 값 모두 브라우저에 노출되는 공개 값이다.

     ⚠ 이 사본은 **카페24 상세페이지 배포본**이다(원본: 사내 포털 round-9).
     env 를 `cafe24` 로 갈라 둔다 — 같은 앱에 들어오되 사내에서 우리끼리 눌러 본 세션과
     실제 구매자 세션이 섞이면 완주율이 통째로 못 믿을 숫자가 된다. Datadog 에서
     `env:cafe24` 로 거르면 구매자만 본다. */
  var APP = {
    applicationId: '1f093e21-cab1-4952-9c31-f778dd87ab85',
    clientToken:   'pub37fcdc076c3a84af1a5575162b0685ae',
    site:          'datadoghq.com',
    service:       'canvas-proto',
    env:           'cafe24'
  };

  if (!APP.applicationId || !APP.clientToken) return;   /* 꺼진 상태 — 정상 */

  var s = document.createElement('script');
  s.src = 'https://www.datadoghq-browser-agent.com/us1/v6/datadog-rum.js';
  s.async = true;
  s.onload = function () {
    if (!window.DD_RUM) return;
    window.DD_RUM.init({
      applicationId: APP.applicationId,
      clientToken: APP.clientToken,
      site: APP.site,
      service: APP.service,
      env: APP.env,
      /* 세션 수는 전량 — 「몇 명이 열어서 몇 명이 끝까지 갔나」는 표본을 깎으면 못 센다.
         리플레이만 10% 로 낮춘다: 사내 포털은 트래픽이 적어 100% 가 맞았지만 여기는
         상품 상세에 걸리는 공개 페이지라 유입이 몇 자리인지 아직 모른다. 리플레이는
         세션당 따로 과금되는 항목이라, 흐름을 눈으로 볼 표본(10%)만 남기고 청구를 막는다.
         유입 규모가 확인되면 그때 올린다. */
      sessionSampleRate: 100,
      sessionReplaySampleRate: 10,
      trackUserInteractions: true,
      trackResources: false,      /* 목업이라 리소스 타이밍은 의미가 없다 */
      trackLongTasks: false,
      defaultPrivacyLevel: 'allow' /* 실고객 데이터가 아니라 목업 화면이다 */
    });
    /* 어느 시안을 본 세션인지 — RUM 에서 A/B/C 완주율을 가르는 축이 된다 */
    try {
      window.DD_RUM.setGlobalContextProperty('variant',
        (window.R9_LAY === 'b' || window.R9_LAY === 'c') ? window.R9_LAY : 'a');
    } catch (e) {}

    /* 어디서 들어온 세션인지 — 샘플몰 인트로 모달(skin25-zigt sample-mall-intro-modal.js)이
       CTA 에 `?tc_src=sample-intro&tc_sid=…` 를 붙여 보낸다. 그쪽은 Datadog Logs 로
       imp_introDialog / click_tryBuilder 를 쏘는데, 이 값을 받아 두지 않으면 「모달을 본 사람 →
       CTA 를 누른 사람 → 실제로 만져 본 사람」이 sid 로 이어지지 않아 마지막 칸이 빈다.
       파라미터가 없으면(카페24 상세페이지·포털에서 직접 들어온 경우) 아무것도 넣지 않는다 —
       빈 문자열을 넣으면 Datadog 에서 «값이 있는데 비어 있음» 으로 잡혀 필터가 지저분해진다. */
    try {
      var qs = new URLSearchParams(location.search);
      ['tc_src', 'tc_sid'].forEach(function (k) {
        var v = qs.get(k);
        if (v) window.DD_RUM.setGlobalContextProperty(k, v.slice(0, 120));
      });
    } catch (e) {}
  };
  document.head.appendChild(s);
})();
