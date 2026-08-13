/* ══════════════════════════════════════════════════════════════════════════
   스키마 값(w.cfg)을 그대로 읽어 그리는 위젯 렌더러 (2026-08-07)

   속성 패널의 **모든 필드가 캔버스에 반영**되도록, 운영 configSchema 의 키를
   렌더러가 직접 읽는다. 값이 없으면 위젯이 원래 들고 있던 속성으로 떨어진다
   (게이트가 시드한 위젯은 cfg 없이 들어오기 때문).

   여기서 재정의하는 렌더러는 v01-inject.html 의 동명 함수를 덮어쓴다
   (전역 함수 재할당 — 호출부는 실행 시점에 이 버전을 잡는다).
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── 값 읽기 ─────────────────────────────────────────────────────────── */
  function C(w) { return w.cfg || (w.cfg = {}); }
  function g(w, k, d) { var v = C(w)[k]; return (v === undefined || v === null || v === '') ? d : v; }
  function bo(w, k, d) { var v = C(w)[k]; return (v === undefined || v === null || v === '') ? !!d : (v === true || v === 'true'); }
  function nu(w, k, d) { var v = parseFloat(C(w)[k]); return isNaN(v) ? d : v; }
  function ar(w, k, d) { var v = C(w)[k]; return (Array.isArray(v) && v.length) ? v : (d || []); }
  function isMob() { var f = document.getElementById('frame'); return !!(f && f.classList.contains('mobile')); }
  function ph(u, fb) { return (u && String(u).trim()) ? u : fb; }
  function ln(href, tgt) { return href ? ' data-wlink="' + escAttr(href) + '" data-wtgt="' + escAttr(tgt || '_self') + '"' : ''; }
  function px(v) { return (v == null ? 0 : v) + 'px'; }

  /* 스크롤 등장 효과 */
  function enter(w, html) {
    var e = g(w, 'enterEffect', 'none');
    if (!e || e === 'none') return html;
    return '<div class="wenter wenter--' + e + '" style="animation-duration:' + nu(w, 'enterDuration', .6) + 's;animation-delay:' + nu(w, 'enterDelay', 0) + 's">' + html + '</div>';
  }

  /* 위젯별 타이머 (자동재생·카운트다운) — 다시 그릴 때 정리한다 */
  var TM = {};
  function clearTM(i) { (TM[i] || []).forEach(clearInterval); TM[i] = []; }
  function clearAllTM() { Object.keys(TM).forEach(clearTM); TM = {}; }
  function tmr(w, sec, fn) {
    var i = PAGE.widgets.indexOf(w); if (i < 0 || !(sec > 0)) return;
    (TM[i] = TM[i] || []).push(setInterval(function () {
      if (PAGE.widgets[i] !== w || !document.querySelector('#sfcanvas .sfw[data-kind="widget:' + i + '"]')) { clearTM(i); return; }
      fn(i);
    }, sec * 1000));
  }
  /* 구매영역 고정(.dp-buybox)이 멈출 위치 — 스토어프론트 헤더가 sticky 면 그 아래여야 한다.
     top:16px 고정이라 헤더(z-index 30)가 구매박스 상단의 상품명·가격을 덮고 있었다.
     헤더 높이는 레이아웃·쿠폰띠 유무에 따라 달라지므로 그릴 때마다 재서 변수로 꽂는다. */
  function syncStickyTop() {
    var dp = document.querySelector('.dp'); if (!dp) return;
    var hd = dp.querySelector('.sfhdr--sticky');
    var top = (hd ? hd.offsetHeight : 0) + 16;
    dp.style.setProperty('--dp-sticky-top', top + 'px');
    /* 구매박스가 화면보다 커지면 sticky 로 붙여 놔도 아래쪽(구매 버튼)이 화면 밖에 남는다.
       기본형과 같은 항목을 다 넣으면 업종에 따라 800px 를 넘으므로 높이 상한을 재서 꽂고,
       넘치는 만큼은 박스 안에서 스크롤되게 한다 — 버튼은 항상 손에 닿아야 한다. */
    var sc = document.getElementById('previewScroll');
    dp.style.setProperty('--dp-sticky-max', (sc ? Math.max(320, sc.clientHeight - top - 16) : 640) + 'px');
  }

  var _renderCanvas = window.renderCanvas;
  window.renderCanvas = function () {
    clearAllTM();
    var r = _renderCanvas.apply(this, arguments);
    try { syncStickyTop(); } catch (e) {}
    return r;
  };
  var _refreshWidget = window.refreshWidget;
  window.refreshWidget = function (i) { clearTM(i); return _refreshWidget.apply(this, arguments); };

  /* 목업 이미지 풀 — 스키마 기본 이미지는 data:URI 라 비워 두고 이걸 쓴다 */
  function pool() { return [IMG.radiance, IMG.balance, IMG.nightcream, IMG.focus, IMG.rv1, IMG.rv2, IMG.rv3, IMG.rv4]; }
  function poolAt(i) { var p = pool(); return p[i % p.length]; }

  /* ── 영상 히어로배너 ─────────────────────────────────────────────────── */
  window.renderVideoHero = function (w) {
    var sl = ar(w, 'slides', (w.slides || []).map(function (s, i) { return { type: 'image', image: s.img || poolAt(i) }; }));
    if (!sl.length) sl = [{ type: 'image', image: poolAt(0) }];
    var cur = Math.min(w.cur || 0, sl.length - 1);
    var mob = isMob();
    var hk = mob ? g(w, 'heightMobile', '16/9') : g(w, 'height', '16/9');
    var box;
    if (hk === 'vh') box = 'height:70vh;';
    else if (hk === 'ratio') box = 'aspect-ratio:' + (mob ? nu(w, 'customRatioMobileW', 4) + '/' + nu(w, 'customRatioMobileH', 5) : nu(w, 'customRatioW', 16) + '/' + nu(w, 'customRatioH', 5)) + ';';
    else box = 'aspect-ratio:' + hk + ';';
    var eff = g(w, 'effect', 'fade'), tr = nu(w, 'transition', .6), gapT = nu(w, 'textSpacing', 12), bs = g(w, 'buttonStyle', 'fill');

    var layers = sl.map(function (s, i) {
      var on = (i === cur);
      var pos = (eff === 'slide') ? 'transform:translateX(' + ((i - cur) * 100) + '%);opacity:1;' : 'opacity:' + (on ? 1 : 0) + ';';
      var im = ph(mob ? (s.mobileImage || s.image) : s.image, poolAt(i));
      var tx = '';
      if (s.eyebrowVisible !== false && s.eyebrow) tx += '<div style="font-size:14px;opacity:.9">' + esc(s.eyebrow) + '</div>';
      if (s.titleVisible !== false && s.title) tx += '<div style="font-size:34px;font-weight:800;letter-spacing:-.02em">' + esc(s.title) + '</div>';
      if (s.descVisible !== false && s.desc) tx += '<div style="font-size:15px;opacity:.92">' + esc(s.desc) + '</div>';
      if (s.ctaText) tx += '<div style="' + (bs === 'outline' ? 'border:1.5px solid #fff;color:#fff' : 'background:#fff;color:#1c2330') + ';padding:11px 22px;border-radius:8px;font-weight:700;font-size:14px"' + ln(s.ctaLink) + '>' + esc(s.ctaText) + '</div>';
      return '<div style="position:absolute;inset:0;transition:opacity ' + tr + 's,transform ' + tr + 's;' + pos + 'background:' + (s.bgColor || '#12141a') + ' center/cover url(\'' + im + '\')">'
        + (tx ? '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:' + px(gapT) + ';color:#fff;text-align:center;text-shadow:0 2px 10px rgba(0,0,0,.4)">' + tx + '</div>' : '')
        + (s.type === 'video' ? '<div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:78px;height:54px;border-radius:14px;background:#FF0033;display:flex;align-items:center;justify-content:center;color:#fff;font-size:24px;padding-left:3px">▶</div>' : '')
        + '</div>';
    }).join('');

    var ap = g(w, 'arrows', 'side'), arrows = '';
    if (ap !== 'none') {
      var st = { 'side': ['left:22px;top:50%;transform:translateY(-50%)', 'right:22px;top:50%;transform:translateY(-50%)'],
        'bottom-right': ['right:74px;bottom:20px', 'right:22px;bottom:20px'],
        'bottom-left': ['left:22px;bottom:20px', 'left:74px;bottom:20px'] }[ap] || [];
      arrows = ['‹', '›'].map(function (c, i) {
        return '<div data-vh="' + (i ? 1 : -1) + '" style="position:absolute;' + st[i] + ';width:44px;height:44px;border-radius:999px;background:rgba(255,255,255,.94);display:flex;align-items:center;justify-content:center;font-size:20px;color:#2a3040;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.18);z-index:2">' + c + '</div>';
      }).join('');
    }
    var ind = g(w, 'indicator', 'dots'), dots = '';
    if (ind === 'dots' || ind === 'line') {
      dots = sl.map(function (_, i) {
        return '<i style="display:block;' + (ind === 'line' ? 'width:26px;height:3px;border-radius:2px' : 'width:7px;height:7px;border-radius:999px') + ';background:' + (i === cur ? '#fff' : 'rgba(255,255,255,.5)') + '"></i>';
      }).join('');
    } else if (ind === 'fraction') dots = '<span style="color:#fff;font-size:12px;font-weight:700">' + (cur + 1) + ' / ' + sl.length + '</span>';
    else if (ind === 'number') dots = sl.map(function (_, i) { return '<span style="color:' + (i === cur ? '#fff' : 'rgba(255,255,255,.55)') + ';font-size:12px;font-weight:700">' + (i + 1) + '</span>'; }).join('');
    var indHtml = (ind === 'none' || !dots) ? '' : '<div style="position:absolute;left:50%;bottom:18px;transform:translateX(-50%);display:flex;gap:7px;align-items:center;z-index:2">' + dots + '</div>';

    tmr(w, nu(w, 'autoplay', 5), function (i) {
      var last = sl.length - 1;
      if (w.cur >= last && !bo(w, 'loop', true)) return;
      w.cur = (w.cur >= last) ? 0 : (w.cur || 0) + 1; refreshWidget(i);
    });

    var inner = '<div style="position:relative;overflow:hidden;background:#12141a;border-radius:' + px(nu(w, 'borderRadius', 0)) + ';' + box + '">' + layers + arrows + indHtml + '</div>';
    return enter(w, g(w, 'width', 'hero') === 'content'
      ? '<div class="bsec" style="padding-top:0;padding-bottom:0"><div class="bsec__in">' + inner + '</div></div>' : inner);
  };

  /* ── 쇼츠 슬라이드 ───────────────────────────────────────────────────── */
  window.renderShorts = function (w) {
    var items = ar(w, 'items', (w.slides || []).map(function (s) {
      return { thumbUrl: s.img, productName: (s.prod || {}).name, productPrice: (s.prod || {}).price, productLink: '' };
    }));
    if (!items.length) items = pool().slice(0, 4).map(function (u, i) { return { thumbUrl: u, productName: '상품 ' + (i + 1), productPrice: '24,900원' }; });
    /* 9:16 세로 카드를 402px 프레임에 5장 깔면 한 장이 64px 다 — 영상이 아니라 띠로 보인다.
       모바일은 2장까지만 깐다(장당 ~180px). 슬라이드 수 자체는 그대로다. */
    var vc = Math.max(1, Math.min(6, nu(w, 'visibleCount', 4))), r = nu(w, 'cornerRadius', 16);
    if (isMob()) vc = Math.min(vc, 2);
    var al = g(w, 'titleAlign', 'center'), lock = bo(w, 'lockInteraction', true);
    var head = '<div style="text-align:' + al + ';margin-bottom:18px">'
      + (bo(w, 'titleVisible', true) ? '<div style="font-size:24px;font-weight:800;color:#2a3040;letter-spacing:-.02em">' + esc(g(w, 'title', w.title || 'Youtube Shorts')) + '</div>' : '')
      + (bo(w, 'subtitleVisible', true) ? '<div style="margin-top:8px;font-size:16px;color:#525c6a">' + esc(g(w, 'subtitle', w.subtitle || '')) + '</div>' : '') + '</div>';
    var cur = w.cur || 0;
    var fill = []; for (var q = 0; q < vc; q++) fill.push(items[q % items.length]);
    var cards = fill.map(function (it, i) {
      var on = (i === (cur % vc));
      return '<div style="min-width:0"' + ln(it.productLink) + '>'
        + '<div style="position:relative;aspect-ratio:9/16;border-radius:' + px(r) + ';overflow:hidden;background:center/cover url(\'' + ph(it.thumbUrl, poolAt(i)) + '\')">'
        + '<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 55%,rgba(0,0,0,.45))"></div>'
        + '<div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:' + (on ? 44 : 34) + 'px;height:' + (on ? 44 : 34) + 'px;border-radius:999px;background:rgba(255,255,255,.94);display:flex;align-items:center;justify-content:center;color:#1c2330;font-size:' + (on ? 16 : 13) + 'px">▶</div>'
        + '<div style="position:absolute;right:8px;top:8px;background:rgba(0,0,0,.62);color:#fff;font-size:11px;font-weight:700;padding:2px 7px;border-radius:6px">0:' + (12 + i * 3) + '</div></div>'
        + (it.productName ? '<div style="margin-top:8px;font-size:13px;font-weight:600;color:#2a3040;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(it.productName) + '</div>' : '')
        + (it.productPrice ? '<div style="margin-top:2px;font-size:13px;font-weight:700;color:#1c2330">' + esc(it.productPrice) + '</div>' : '')
        + '</div>';
    }).join('');
    tmr(w, nu(w, 'autoSlideSeconds', 0), function (i) { w.cur = ((w.cur || 0) + 1); refreshWidget(i); });
    /* 「전체보기 ›」는 space-between 안에 혼자 있었다 — 형제가 없으니 왼쪽 끝에 붙어,
       가운데 정렬된 제목 아래에 홀로 떨어진 부스러기처럼 보였다. 오른쪽으로 보낸다. */
    var cap = '<div style="display:flex;justify-content:flex-end;align-items:baseline;margin-bottom:10px">'
      /* 「쇼츠 N개 · M개씩 노출」은 설정값 설명이지 몰 문구가 아니다 — 스토어프론트에서 뺀다 */
      + '<span style="font-size:12.5px;color:#8d97a5">전체보기 ›</span></div>';
    /* 카드는 flex:1 1 0 으로 남는 폭을 **전부** 나눠 갖고 있었다. 상품 1종 몰(쇼츠 1개)에서는
       한 장이 폭 800px 를 혼자 먹고 9:16 이라 높이가 1400px 을 넘어, 세로 영상 한 장이
       화면을 통째로 덮었다. 쇼츠 카드에는 제 폭(200px)이 있다 — 개수가 적으면 남는 폭을
       늘려 쓰는 게 아니라 가운데로 모인다. 많아지면 트랙이 줄어 그대로 한 줄에 들어간다. */
    return enter(w, '<div class="bsec"><div class="bsec__in">' + head + cap
      + '<div style="display:grid;grid-template-columns:repeat(' + vc + ',minmax(0,200px));justify-content:center;gap:12px;' + (lock ? 'pointer-events:none;' : '') + '">' + cards + '</div>'
      /* 「🔒 스와이프 잠금」 안내도 마찬가지 — 잠금은 pointer-events 로 이미 걸려 있고,
         구매자에게 보여줄 문구가 아니다(속성 패널에서 켜고 끄는 설정의 설명이다) */
      + '</div></div>');
  };

  /* ── 매거진 게시판 ───────────────────────────────────────────────────── */
  window.renderMagazine = function (w) {
    var R = nu(w, 'radius', 12), al = g(w, 'headerAlign', 'center'), cols = parseInt(g(w, 'columns', '3'), 10) || 3;
    var head = '<div style="text-align:' + al + ';margin-bottom:24px">'
      + (bo(w, 'showTitle', true) ? '<div style="font-size:24px;font-weight:800;color:#2a3040;letter-spacing:-.02em">' + esc(g(w, 'title', w.title || '매거진')) + '</div>' : '')
      + (bo(w, 'showHeaderDescription', true) ? '<div style="margin-top:8px;font-size:16px;color:#525c6a">' + esc(g(w, 'description', w.subtitle || '새로 올라온 이야기를 만나보세요')) + '</div>' : '')
      + (C(w).boardNo ? '<div style="margin-top:8px;font-size:12px;color:#8d97a5">게시판 #' + esc(String(C(w).boardNo)) + ' 연동</div>' : '') + '</div>';
    var overlay = g(w, 'preset', 'overlay') === 'overlay';
    var cover = ph(w.cover, poolAt(0));
    /* 모바일은 PC 구성을 그대로 줄이지 않는다.
       ① 표지 1000:300 — 402px 폭에서 높이 111px 짜리 띠가 되어, 세로로 긴 물건(정수기·
          공기청정기)은 몸통 한가운데만 잘려 무엇인지 알 수 없다. 넓은 콘텐츠 배너가
          모바일에서 4/3 으로 바뀌는 것(.cb-banner.is-wide)과 같은 처리를 한다.
       ② 썸네일 3열 — 칸이 110px 라 16:9 상자가 62px 로 눌리고, 제목·발췌가 두 줄로
          꺾여 「이번 시즌 추천 아이 / 템을 소개합니다」가 됐다. 게시판 최신글은 모바일에서
          **가로 리스트**(썸네일 좌 + 글 우)가 기본이다 — 이 프로토타입의 콘텐츠+상품
          그리드 모바일 규칙(.cg-cards .cg-pc: 64px 썸네일 + 한 줄 말줄임)과 같은 꼴. */
    var mob = isMob();
    var coverAR = mob ? '4/3' : '1000/300';
    /* 흰 배경 상품컷은 흰 카드 위에서 상자 경계가 안 보인다 — 옅은 판을 깔고 곱하기로
       얹어 어떤 사진이든 상자가 보이게 한다(카테고리 바로가기와 같은 방식). */
    var PLATE = 'background:#F2F3F5 center/cover url(\'';
    var coverBlock = overlay
      ? '<div style="position:relative;aspect-ratio:' + coverAR + ';border-radius:' + px(R) + ';overflow:hidden;background:center/cover url(\'' + cover + '\')">'
        + '<div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.55),rgba(0,0,0,.05))"></div>'
        + '<div style="position:absolute;left:' + (mob ? 20 : 32) + 'px;top:50%;transform:translateY(-50%);color:#fff">'
        + (bo(w, 'showCardTitle', true) ? '<div style="font-size:' + (mob ? 20 : 26) + 'px;font-weight:800">' + esc(w.postTitle || '매거진') + '</div>' : '')
        + (bo(w, 'showExcerpt', true) ? '<div style="margin-top:6px;font-size:' + (mob ? 13 : 14) + 'px;opacity:.9">' + esc(w.postDesc || '시즌 추천템') + '</div>' : '') + '</div></div>'
      : '<div><div style="aspect-ratio:' + coverAR + ';border-radius:' + px(R) + ';background:center/cover url(\'' + cover + '\')"></div>'
        + (bo(w, 'showCardTitle', true) ? '<div style="margin-top:12px;font-size:' + (mob ? 17 : 20) + 'px;font-weight:800;color:#1c2330">' + esc(w.postTitle || '매거진') + '</div>' : '')
        + (bo(w, 'showExcerpt', true) ? '<div style="margin-top:4px;font-size:' + (mob ? 13 : 14) + 'px;color:#6c7684">' + esc(w.postDesc || '시즌 추천템') + '</div>' : '') + '</div>';
    var one = 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
    var thumbs = (w.thumbs || pool().slice(1, 4)).slice(0, cols).map(function (u, i) {
      if (mob) {
        return '<div style="display:flex;gap:12px;align-items:center">'
          + '<div style="flex:0 0 96px;aspect-ratio:4/3;border-radius:' + px(Math.max(0, R - 2)) + ';'
            + PLATE + u + '\');background-blend-mode:multiply"></div>'
          + '<div style="min-width:0;flex:1">'
          + (bo(w, 'showCardTitle', true) ? '<div style="font-size:15px;font-weight:700;color:#1c2330;' + one + '">매거진 글 ' + (i + 1) + '</div>' : '')
          + (bo(w, 'showExcerpt', true) ? '<div style="margin-top:3px;font-size:13px;color:#8d97a5;' + one + '">이번 시즌 추천 아이템을 소개합니다</div>' : '')
          + '</div></div>';
      }
      return '<div><div style="aspect-ratio:16/9;border-radius:' + px(Math.max(0, R - 2)) + ';background:center/cover url(\'' + u + '\')"></div>'
        + (bo(w, 'showCardTitle', true) ? '<div style="margin-top:8px;font-size:14px;font-weight:700;color:#1c2330">매거진 글 ' + (i + 1) + '</div>' : '')
        + (bo(w, 'showExcerpt', true) ? '<div style="margin-top:2px;font-size:12.5px;color:#8d97a5">이번 시즌 추천 아이템을 소개합니다</div>' : '') + '</div>';
    }).join('');
    return enter(w, '<div class="bsec"><div class="bsec__in">' + head
      + '<div style="background:#fff;border-radius:16px;padding:' + (mob ? 12 : 14) + 'px;box-shadow:0 6px 22px rgba(16,24,40,.08)">' + coverBlock
      + '<div style="display:grid;grid-template-columns:' + (mob ? '1fr' : 'repeat(' + cols + ',1fr)') + ';gap:' + (mob ? 14 : 12) + 'px;margin-top:' + (mob ? 14 : 12) + 'px">' + thumbs + '</div></div>'
      + (bo(w, 'showMore', true) ? '<div style="text-align:center"><button class="bmore">더보기</button></div>' : '')
      + '</div></div>');
  };

  /* ── 대표 상품 ─────────────────────────────────────────────────────────
     Figma 6224:11071 (main-product-layout, 1440×760) 실측 그대로.
       좌 600×600 사진(테두리 #EAE6E1 · r8) / 우 620 정보열(블록 간 24)
       제목 28/700 #111 · 부제 15/400 #666 · 정가 14/400 #888 취소선
       할인율 24/700 #FF3F3F + 판매가 24/700 #111
       배송비 줄: 위아래 테두리 아닌 **사방 테두리** #E5E8EB · 세로 패딩 12 · 가로 패딩 0
                  (라벨이 테두리에 딱 붙는다 — 렌더 픽셀로 확인한 값이다)
       혜택 카드: 테두리 #E5E8EB · r8 · 패딩 20 · 「혜택 받기」 버튼 테두리·글자 #002496
       총 구매금액 28/700 + (N개) 12/400 #888

     ⚠ 쿠폰 금액은 **판매가에서 만들어 낸 데모값**이다(신규회원 1% · VIP 2% · 시즌 1%,
       1,000원 단위 반올림 · 최소 100원). 시안의 520,000원 상품에 넣으면 시안과 똑같이
       5,000 / 10,000 / 5,000 이 나온다. 고정값을 그대로 박으면 9,500원짜리 식료품에서
       혜택가가 음수가 된다 — 업종마다 가격대가 다르기 때문이다. 실제 쿠폰 정책이 아니다.
     ⚠ 시안의 「판매가」 줄은 정가(520,000)를 적어 두는데 그러면 표의 합이 안 맞는다
       (442,000 − 20,000 = 422,000 인데 520,000 − 20,000 = 500,000). 여기서는 판매가를
       적어 합이 맞게 했다 — 화면에서 계산이 틀린 표를 보여 주지 않으려는 것이다. */
  function wonNum(v) { return parseInt(String(v == null ? '' : v).replace(/[^\d]/g, ''), 10) || 0; }
  function wonStr(n) { return String(Math.max(0, Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '원'; }
  function coupon(price, pct) { return Math.max(100, Math.round(price * pct / 100 / 1000) * 1000); }

  window.renderMainProduct = function (w) {
    var no = C(w).productNo, list = productsForCat(0, 8);
    var src = (no != null && list[(+no) % list.length]) || null;
    var p = w.prod || {};
    if (src) p = { name: src.name, desc: src.desc || '', price: src.price, orig: src.orig, sale: src.sale, img: src.img };

    var price = wonNum(p.price), orig = wonNum(p.orig);
    var qty = Math.max(1, nu(w, 'qty', w.qty || 1));
    var CPN = w.coupons || [
      { n: '신규회원 쿠폰', pct: 1 }, { n: 'VIP 쿠폰', pct: 2 }, { n: '시즌 쿠폰', pct: 1 }
    ];
    /* 쿠폰 기준가는 **정가**다 — 시안이 그렇게 잡았다(520,000 기준 1%/2%/1% = 5,000/10,000/5,000).
       판매가로 잡으면 442,000 기준이 돼 4,000/9,000/4,000 이 나와 시안과 어긋난다. */
    var base = orig || price;
    var cps = CPN.map(function (c) { return { n: c.n, v: c.v != null ? c.v : coupon(base, c.pct) }; });
    var off = cps.reduce(function (a, c) { return a + c.v; }, 0);
    var best = Math.max(0, price - off);

    var mob = isMob();
    var PAD = mob ? 20 : 80, GAP = mob ? 24 : 60;
    var LINE = '#E5E8EB', SUB = '#666666', INK = '#111111', RED = '#FF3F3F', NAVY = '#002496';

    function circ(svg) {
      return '<span style="width:36px;height:36px;border:1px solid ' + LINE + ';border-radius:999px;'
        + 'display:inline-grid;place-items:center;color:' + SUB + '">' + svg + '</span>';
    }
    var icoShare = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>';
    var icoHeart = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1L12 21l8.8-8.3a5 5 0 0 0 0-7.1z"/><path d="M3 3l18 18"/></svg>';
    var icoDown = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 11l5 5 5-5M4 20h16"/></svg>';

    var rows = cps.map(function (c) {
      return '<div style="display:flex;justify-content:space-between;font-size:13px;line-height:1.19">'
        + '<span style="color:' + SUB + '">' + esc(c.n) + '</span>'
        + '<span style="color:' + RED + '">-' + wonStr(c.v) + '</span></div>';
    }).join('');

    var benefit = bo(w, 'showBenefit', true) ? ''
      + '<div style="border:1px solid ' + LINE + ';border-radius:8px;padding:20px">'
        + '<div style="display:flex;justify-content:space-between;align-items:center">'
          + '<div>'
            + '<div style="font-size:12px;font-weight:700;color:' + SUB + ';line-height:1.19">혜택 적용 시</div>'
            + '<div style="margin-top:4px;font-size:22px;font-weight:700;color:' + RED + ';line-height:1.19">' + wonStr(best) + '</div>'
          + '</div>'
          + '<span style="display:inline-flex;align-items:center;gap:6px;border:1px solid ' + NAVY + ';border-radius:4px;'
            + 'padding:8px 12px;font-size:12px;font-weight:700;color:' + NAVY + ';background:#fff">혜택 받기' + icoDown + '</span>'
        + '</div>'
        + '<div style="margin-top:16px;display:flex;flex-direction:column;gap:10px">'
          + '<div style="display:flex;justify-content:space-between;font-size:13px;line-height:1.19">'
            + '<span style="color:' + SUB + '">판매가</span><span style="color:' + INK + '">' + wonStr(price) + '</span></div>'
          + rows
          + '<div style="height:1px;background:' + LINE + '"></div>'
          + '<div style="display:flex;justify-content:space-between;align-items:baseline">'
            + '<span style="font-size:14px;font-weight:700;color:' + INK + '">최대 혜택가</span>'
            + '<span style="font-size:16px;font-weight:700;color:' + INK + '">' + wonStr(best) + '</span></div>'
        + '</div>'
      + '</div>' : '';

    /* 캔버스가 좁아질 때(위젯을 눌러 우측 편집 패널이 열릴 때) **줄어드는 쪽은 사진**이다.
       전엔 사진이 600px 고정(flex:none)이라 좁아진 폭을 글 칸이 전부 뒤집어썼고,
       1350px 캔버스에서 글 칸이 203px 까지 눌려 상품명·금액이 세로로 쪼개졌다.
       flex-shrink 를 사진에 10, 글에 1 로 줘 부족분의 9할 이상을 사진이 흡수하게 하고,
       글 칸엔 기본 폭에 가까운 basis(460)와 하한(340)을 준다.
       넉넉할 때는 basis 합(1060)이 남으므로 grow 를 가진 글 칸만 늘어난다 —
       기본 상태(사진 600 · 글 522)는 그대로다. */
    var info = '<div style="' + (mob ? 'flex:1;min-width:0;max-width:none;' : 'flex:1 1 460px;min-width:340px;max-width:620px;')
      + 'display:flex;flex-direction:column;gap:24px">'
      /* 헤더 */
      + '<div style="display:flex;flex-direction:column;gap:8px">'
        + '<div style="display:flex;align-items:center;justify-content:space-between;gap:16px">'
          + '<div style="font-size:' + (mob ? 22 : 28) + 'px;font-weight:700;color:' + INK + ';letter-spacing:-.02em;line-height:1.19">' + esc(p.name || '대표 상품') + '</div>'
          + '<span style="display:inline-flex;gap:10px;flex:none">' + circ(icoShare) + circ(icoHeart) + '</span>'
        + '</div>'
        + (p.desc ? '<div style="font-size:15px;color:' + SUB + ';line-height:1.19">' + esc(p.desc) + '</div>' : '')
      + '</div>'
      /* 가격 */
      + '<div style="display:flex;flex-direction:column;gap:4px">'
        + (orig ? '<div style="font-size:14px;color:#888888;text-decoration:line-through;line-height:1.19">' + wonStr(orig) + '</div>' : '')
        + '<div style="display:flex;align-items:baseline;gap:8px">'
          + (p.sale ? '<span style="font-size:24px;font-weight:700;color:' + RED + ';line-height:1.19">' + esc(p.sale) + '</span>' : '')
          + '<span style="font-size:24px;font-weight:700;color:' + INK + ';line-height:1.19">' + wonStr(price) + '</span>'
        + '</div>'
      + '</div>'
      /* 배송비 */
      + (bo(w, 'showShipping', true)
        ? '<div style="border:1px solid ' + LINE + ';padding:12px 0;display:flex;align-items:center;gap:20px">'
          + '<span style="font-size:13px;font-weight:700;color:' + SUB + '">배송비</span>'
          + '<span style="font-size:13px;color:' + INK + '">' + esc(g(w, 'shipping', w.ship || '3,000원 (100,000원 이상 구매 시 무료)')) + '</span></div>'
        : '')
      + benefit
      /* 총 구매금액 */
      + '<div style="padding:16px 0;display:flex;align-items:baseline;justify-content:space-between;gap:16px">'
        + '<span style="font-size:14px;font-weight:700;color:' + INK + '">총 구매금액</span>'
        + '<span style="display:inline-flex;align-items:baseline;gap:4px">'
          + '<b style="font-size:' + (mob ? 24 : 28) + 'px;font-weight:700;color:' + INK + ';line-height:1.19">' + wonStr(price * qty) + '</b>'
          + '<span style="font-size:12px;color:#888888">(' + qty + '개)</span></span>'
      + '</div>'
    + '</div>';

    var photo = '<div style="' + (mob ? 'flex:none;width:100%;' : 'flex:0 10 600px;width:auto;min-width:200px;')
      + 'aspect-ratio:1/1;border:1px solid #EAE6E1;border-radius:8px;'
      + 'background:center/cover url(\'' + ph(p.img, poolAt(0)) + '\')"></div>';

    return enter(w, '<div style="background:#fff;padding:' + PAD + 'px;display:flex;'
      + (mob ? 'flex-direction:column;' : 'align-items:center;justify-content:center;')
      + 'gap:' + GAP + 'px">' + photo + info + '</div>');
  };

  /* ── 커스텀 HTML ─────────────────────────────────────────────────────── */
  window.renderCode = function (w) {
    var html = g(w, 'html', w.html || '');
    if (!html) return '<div class="bsec"><div class="bsec__in"><div class="help">HTML 코드를 입력하면 여기에 그대로 렌더돼요.</div></div></div>';
    var safe = String(html).replace(/<\s*script[\s\S]*?<\s*\/\s*script\s*>/gi, '').replace(/\son\w+\s*=/gi, ' data-blocked=');
    return enter(w, '<div class="bsec"><div class="bsec__in">' + safe + '</div></div>');
  };

  /* ── 이미지 ──────────────────────────────────────────────────────────── */
  window.renderImageW = function (w) {
    var u = ph(isMob() ? (C(w).mobileImage || C(w).image) : C(w).image, w.img || poolAt(0));
    /* 모바일 높이 — 위젯 스키마에는 모바일 **이미지**만 있고 모바일 높이는 없다(image·mobileImage·
       padX·height). 그래서 모바일 전용 컷이 없으면 우리가 박스를 정해야 한다.
       데스크톱 높이를 그대로 쓰면 402×h 가 되어 가로로 긴 그림이 정사각처럼 잘리고, 전에 쓰던
       240px 고정은 3.3:1 짜리 띠 배너에서 좌우 절반을 날려 그림 속 글이 사라졌다.
       그래서 **PC 박스 비율을 그대로 지킨다**(0.30 = 모바일 프레임 402 ÷ PC 캔버스 1342) —
       PC 에서 보이는 만큼 모바일에서도 보인다. 너무 얇거나 두꺼워지지 않게 120~240 으로 묶는다. */
    var ih = nu(w, 'height', 340);
    if (isMob()) ih = (C(w).height != null)
      ? Math.max(120, Math.min(240, Math.round(ih * 0.30)))   /* 높이를 지정한 그림 = 비율 유지 */
      : Math.min(ih, 240);                                     /* 지정 안 한 사진 = 종전 240 상한 */
    return enter(w, '<div style="padding:0 ' + px(nu(w, 'padX', 0)) + '"><div style="height:' + px(ih) + ';background:center/cover url(\'' + u + '\')"></div></div>');
  };

  /* ── 텍스트 ──────────────────────────────────────────────────────────── */
  window.renderText = function (w) {
    var al = g(w, 'textAlign', w.align || 'center');
    return enter(w, '<div class="sftext" style="text-align:' + al + ';background:' + g(w, 'bgColor', w.bg || '#f6f5f3') + '">'
      + (bo(w, 'headingVisible', true) ? '<div class="t" contenteditable="true" spellcheck="false" data-edit="wtitle" style="color:' + g(w, 'textColor', '#2d2d2d') + '">' + esc(g(w, 'heading', w.title || '')) + '</div>' : '')
      + (bo(w, 'bodyVisible', true) ? '<div class="d" contenteditable="true" spellcheck="false" data-edit="wdesc" style="color:' + (C(w).textColor ? C(w).textColor : '#86868b') + '">' + esc(g(w, 'body', w.desc || '')) + '</div>' : '')
      + '</div>');
  };

  /* ── 옵션 선택 (상세페이지 위젯) ─────────────────────────────────────── */
  window.renderOptSel = function (w) {
    var rows = w.rows || [{ name: '단품', price: '19,000원' }, { name: '2개 묶음', price: '36,000원' }, { name: '3개 묶음', price: '51,000원' }];
    var preset = g(w, 'presetType', w.preset || 'bundle'), sel = w.sel || 0;
    var enrich = ar(w, 'enrichment', []), groups = ar(w, 'groupRenderTypes', []);
    function chips(i) {
      var e = enrich[i]; if (!e) return '';
      return '<div style="display:flex;gap:6px;align-items:center;margin-top:6px">'
        + (e.image ? '<span style="width:22px;height:22px;border-radius:6px;background:center/cover url(\'' + e.image + '\')"></span>' : '')
        + (e.color ? '<span style="width:14px;height:14px;border-radius:999px;background:' + e.color + '"></span>' : '')
        + (e.title ? '<span style="font-size:12px;font-weight:700;color:#5b3df5">' + esc(e.title) + '</span>' : '')
        + (e.desc ? '<span style="font-size:12px;color:#8d97a5">' + esc(e.desc) + '</span>' : '') + '</div>';
    }
    var body;
    if (preset === 'dropdown') {
      body = rows.map(function (r, i) { return '<div style="border:1px solid #e5e8ee;border-radius:12px;padding:14px 16px;margin-bottom:10px;display:flex;justify-content:space-between;background:#fff"><span>' + esc(r.name) + '</span><span style="color:#8d97a5">▾ ' + esc(r.price) + '</span></div>' + chips(i); }).join('');
    } else if (preset === 'swatch') {
      body = '<div style="display:flex;gap:10px">' + rows.map(function (r, i) {
        var on = (i === sel);
        return '<div style="flex:1;text-align:center;padding:14px 10px;border:1.5px solid ' + (on ? '#7c5cfa' : '#e5e8ee') + ';border-radius:12px;background:' + (on ? '#f5f3ff' : '#fff') + '"><div style="font-size:14px;font-weight:700;color:#1c2330">' + esc(r.name) + '</div><div style="margin-top:4px;font-size:13px;color:#6c7684">' + esc(r.price) + '</div>' + chips(i) + '</div>';
      }).join('') + '</div>';
    } else if (preset === 'button-list') {
      body = '<div style="display:flex;flex-direction:column;gap:8px">' + rows.map(function (r, i) {
        var on = (i === sel);
        return '<button style="all:unset;cursor:pointer;display:flex;justify-content:space-between;padding:14px 18px;border-radius:10px;border:1.5px solid ' + (on ? '#7c5cfa' : '#e5e8ee') + ';background:' + (on ? '#f5f3ff' : '#fff') + ';font-size:15px;color:#1c2330"><span>' + esc(r.name) + '</span><b>' + esc(r.price) + '</b></button>';
      }).join('') + '</div>';
    } else {
      body = rows.map(function (r, i) {
        var on = (i === sel);
        return '<div style="display:flex;align-items:center;gap:12px;background:' + (on ? '#f5f3ff' : '#fff') + ';border:1.5px solid ' + (on ? '#7c5cfa' : '#e5e8ee') + ';border-radius:12px;padding:16px 18px;margin-bottom:10px">'
          + '<span style="flex:none;width:20px;height:20px;border-radius:999px;border:1.5px solid ' + (on ? '#7c5cfa' : '#c8cdd6') + ';display:flex;align-items:center;justify-content:center">' + (on ? '<i style="display:block;width:10px;height:10px;border-radius:999px;background:#7c5cfa"></i>' : '') + '</span>'
          + '<span style="flex:1;font-size:16px;font-weight:' + (on ? 700 : 500) + ';color:#1c2330">' + esc(r.name) + chips(i) + '</span>'
          + '<span style="font-size:16px;font-weight:700;color:#1c2330">' + esc(r.price) + '</span></div>';
      }).join('');
    }
    var gh = groups.length ? '<div style="margin-top:14px">' + groups.map(function (gr) {
      return '<div style="display:flex;justify-content:space-between;font-size:13px;color:#6c7684;padding:8px 2px;border-top:1px dashed #e5e8ee"><span>' + esc(gr.optionName || '옵션 그룹') + '</span><b style="color:#1c2330">' + esc(gr.renderType || 'default') + '</b></div>';
    }).join('') + '</div>' : '';
    return enter(w, '<div class="bsec"><div class="bsec__in" style="max-width:620px">' + body + gh + '</div></div>');
  };

  /* ── 무이자 할부 안내 ────────────────────────────────────────────────── */
  window.renderInstallment = function (w) {
    var emph = g(w, 'buttonStyle', 'emphasis') === 'emphasis';
    var min = String(g(w, 'minAmount', '50000')).replace(/[^\d]/g, '');
    return enter(w, '<div class="bsec"><div class="bsec__in" style="max-width:620px">'
      + '<div style="background:' + (emph ? 'var(--sf-brand,#6d58f2)' : '#f1f1f4') + ';color:' + (emph ? '#fff' : '#2a2d38') + ';border-radius:12px;padding:14px 18px;display:flex;align-items:center;gap:12px">'
      + '<span style="flex:none;width:28px;height:28px;border-radius:999px;background:' + (emph ? 'rgba(255,255,255,.22)' : '#fff') + ';display:flex;align-items:center;justify-content:center;font-size:14px">▣</span>'
      + '<span style="flex:1;font-size:15px;font-weight:700">' + esc((+min || 0).toLocaleString('ko-KR')) + '원 이상 <span style="font-weight:600;opacity:.95">최대 ' + nu(w, 'maxMonths', 5) + '개월 무이자</span></span>'
      + '<span style="font-size:13px;opacity:.9">상세 보기 ⌃</span></div>'
      + '<div style="margin-top:10px;background:#fff;border:1px solid #e5e8ee;border-radius:10px;padding:13px 16px;font-size:14px;color:#525c6a;white-space:pre-wrap">'
      + esc(g(w, 'detailPolicy', w.cards || '국민/삼성/신한/하나/현대/롯데/NH카드 무이자 24개월')) + '</div></div></div>');
  };

  /* ── 오늘 배송 안내 ──────────────────────────────────────────────────── */
  window.renderTodayShip = function (w) {
    var h = nu(w, 'cutoffHour', 16), emph = g(w, 'buttonStyle', 'emphasis') === 'emphasis';
    function left() {
      var now = new Date(), end = new Date(); end.setHours(h, 0, 0, 0);
      var s = Math.max(0, Math.floor((end - now) / 1000));
      function p2(x) { return (x < 10 ? '0' : '') + x; }
      return p2(Math.floor(s / 3600)) + ':' + p2(Math.floor(s % 3600 / 60)) + ':' + p2(s % 60);
    }
    tmr(w, 1, function (i) {
      var el = document.querySelector('#sfcanvas .sfw[data-kind="widget:' + i + '"] .ts-left');
      if (el) el.textContent = left();
    });
    return enter(w, '<div class="bsec"><div class="bsec__in" style="max-width:620px">'
      + '<div style="background:#fff;border-radius:16px;padding:20px 24px;display:flex;align-items:center;gap:18px;box-shadow:0 6px 20px rgba(16,24,40,.07)">'
      + '<span style="flex:none;width:52px;height:52px;border-radius:999px;background:' + (emph ? 'var(--sf-brand,#6d58f2)' : '#f1f1f4') + ';color:' + (emph ? '#fff' : '#2a2d38') + ';display:flex;align-items:center;justify-content:center;font-size:22px">🚚</span>'
      + '<div style="flex:1"><div style="font-size:18px;font-weight:700;color:#1c2330">오늘 ' + h + '시 마감까지</div>'
      + '<div style="margin-top:4px;font-size:26px;font-weight:800;color:' + (emph ? '#5b3df5' : '#1c2330') + '"><span class="ts-left">' + left() + '</span> <span style="font-size:17px;font-weight:700;color:#1c2330">남음</span></div></div>'
      + '<span style="flex:none;color:#c8cdd6;font-size:18px">ⓘ</span></div></div></div>');
  };

  /* ── 버튼 ────────────────────────────────────────────────────────────── */
  var CH = { kakao: { bg: '#FEE500', fg: '#191600', ico: '<span style="font-weight:800;font-size:12px">TALK</span>' }, naver: { bg: '#03C75A', fg: '#fff', ico: '<span style="font-weight:800;font-size:14px">N</span>' } };
  window.renderCtaBtn = function (w) {
    var ch = CH[g(w, 'channel', 'kakao')] || CH.kakao;
    var bg = g(w, 'bgColor', '#0a0a0a'), useCh = (bg === '#0a0a0a');
    var back = useCh ? ch.bg : bg, fore = C(w).textColor || (useCh ? ch.fg : '#fff');
    var out = g(w, 'buttonStyle', 'fill') === 'outline';
    var al = g(w, 'textAlign', 'left'), full = g(w, 'width', 'full') === 'full';
    var opt = g(w, 'optionGroupType', 'direct') === 'signup'
      ? '<select class="inp" style="width:100%;margin-bottom:10px;padding:12px 14px;border:1px solid #e5e8ee;border-radius:10px;background:#fff"><option>가입 옵션을 선택하세요</option><option>일반 회원</option><option>기업 회원</option></select>' : '';
    var btn = '<div' + ln(g(w, 'link', ''), g(w, 'linkTarget', '_self')) + ' style="'
      + (out ? 'background:#fff;border:1.5px solid ' + back + ';color:' + (C(w).textColor || (useCh ? '#1c2330' : back)) : 'background:' + back + ';color:' + fore)
      + ';border-radius:12px;padding:16px 22px;display:flex;align-items:center;gap:10px;justify-content:' + (al === 'center' ? 'center' : 'space-between') + ';' + (full ? '' : 'max-width:320px;') + '">'
      + '<span style="display:flex;align-items:center;gap:8px;font-size:17px;font-weight:700">' + ch.ico + esc(g(w, 'text', w.text || '자세히 보기')) + '</span>'
      + (bo(w, 'showChevron', true) ? '<span style="font-size:18px;opacity:.85">›</span>' : '') + '</div>';
    return enter(w, '<div class="bsec"><div class="bsec__in"' + (full ? '' : ' style="display:flex;flex-direction:column;align-items:' + (al === 'center' ? 'center' : 'flex-start') + '"') + '>' + opt + btn + '</div></div>');
  };

  /* ── 카테고리 바로가기 ───────────────────────────────────────────────── */
  window.renderCat = function (w) {
    var items = ar(w, 'items', (w.items || []).map(function (it) { return { name: it.name, image: it.img, link: '' }; }));
    if (!items.length) items = ['전체보기', '세일', '신상품', '기획전'].map(function (n, i) { return { name: n, image: poolAt(i) }; });
    /* 열 수는 **항목 수를 넘지 않는다**. 스키마 기본값이 8인데 메뉴가 4개뿐인 업종(LOTS)에서
       8열을 그대로 잡으면 동그라미 4개가 앞 4칸에 몰리고 오른쪽 4칸이 빈 채로 남는다
       — justify-content:center 를 걸어도 트랙 자체가 폭을 다 먹고 있어 가운데로 오지 않는다. */
    var mob = isMob();
    var cols = Math.min(items.length, mob ? nu(w, 'columnsMobile', 2) : nu(w, 'columns', 8)) || 1;
    var shape = g(w, 'imageShape', 'circle');
    var rad = shape === 'circle' ? '999px' : (shape === 'rounded' ? '16px' : '4px');
    var cells = items.map(function (it, i) {
      return '<div style="text-align:center"' + ln(it.link) + '>'
        /* 옅은 그레이 판을 깔고 사진을 곱하기로 얹는다 — 상품컷은 배경이 흰색으로
           구워져 있어 그냥 깔면 그레이가 안 보이고(불투명 JPEG), 어떤 칸은 원형이
           보이고 어떤 칸은 안 보이는 상태가 된다. multiply 면 흰 배경만 그레이로
           내려앉고 사진 칸은 4% 만 어두워져 눈에 띄지 않는다. */
        + '<div style="aspect-ratio:1/1;border-radius:' + rad + ';background:#F2F3F5 center/cover url(\'' + ph(it.image, poolAt(i)) + '\');background-blend-mode:multiply"></div>'
        + '<div style="margin-top:8px;font-size:13px;color:' + (i === 0 ? 'var(--sf-brand,#6d58f2);font-weight:700' : '#4a4a4a') + '">' + esc(it.name || ('카테고리' + (i + 1))) + '</div></div>';
    }).join('');
    /* 가운데 정렬 — 칸을 1fr 로 늘리면 항목이 열 수보다 적을 때 왼쪽으로 몰린다.
       칸 폭에 상한(144px = 1200 안에서 8열일 때의 칸 폭)을 두고 그룹을 가운데로 모은다.
       8개를 다 채운 경우는 지금까지와 사실상 같고, 적을 때만 가운데로 온다. */
    /* 칸 폭 상한·간격은 화면별로 다르다. 모바일에 PC 값(144px·24px)을 그대로 쓰면
       402px 폭 안에서 동그라미 하나가 화면의 3분의 1을 먹는다. 간격 필드도 라벨이
       「(PC)」이므로 모바일엔 적용하지 않는다 — 모바일은 12px 고정. */
    var cap = mob ? 96 : 144;
    /* 간격 기본 24px — 48 은 동그라미보다 사이가 더 눈에 띄어 한 줄이 여덟 덩이로 흩어졌다.
       스키마 기본값도 24 로 맞춰 둔다(패널 값과 실제 렌더가 갈리지 않게). */
    var gapPx = mob ? 12 : nu(w, 'gap', 24);
    var grid = '<div style="display:grid;grid-template-columns:repeat(' + cols + ',minmax(0,' + cap + 'px));'
      + 'justify-content:center;gap:' + px(gapPx) + '">' + cells + '</div>';
    return enter(w, bo(w, 'fullWidth', false)
      ? '<div style="padding:44px 24px">' + grid + '</div>'
      : '<div class="bsec"><div class="bsec__in">' + grid + '</div></div>');
  };

  /* ── 이미지 텍스트 위젯 ──────────────────────────────────────────────── */
  window.renderImageText = function (w) {
    var mob = isMob();
    var imgU = ph(mob ? (C(w).mobileImage || C(w).image) : C(w).image, w.img || poolAt(0));
    var dirCol = mob, imgFirst = mob ? (g(w, 'mobileOrder', 'image-first') === 'image-first') : (g(w, 'layout', 'image-left') === 'image-left');
    var al = g(w, 'textAlign', 'left'), cs = g(w, 'ctaStyle', w.btnStyle || 'outline');
    var btnCss = cs === 'fill' ? 'background:var(--sf-brand,#6d58f2);color:#fff' : (cs === 'text' ? 'color:var(--sf-brand,#6d58f2);text-decoration:underline' : 'border:1.5px solid #1c2330;color:#1c2330');
    /* wit* 클래스 — 모바일 대응을 **CSS 로도** 걸어 둔다(아래 주입 스타일).
       인라인 스타일만 쓰면 이 위젯이 데스크톱으로 그려진 뒤에는 모바일로 바꿔도
       좌우 2단·44/48px 여백·30px 제목이 그대로 남아, 402px 프레임에서 글 칸이
       184px 로 눌려 본문이 22줄로 쪼개졌다(가로 넘침 100px). */
    var tx = '<div class="wit__tx" style="flex:1 1 50%;background:#fff;display:flex;flex-direction:column;justify-content:center;align-items:' + (al === 'center' ? 'center' : 'flex-start') + ';text-align:' + al + ';padding:44px 48px">'
      + (bo(w, 'eyebrowVisible', true) ? '<div style="font-size:14px;font-weight:600;margin-bottom:10px;color:' + g(w, 'eyebrowColor', '#64748b') + '">' + esc(g(w, 'eyebrow', w.eyebrow || '')) + '</div>' : '')
      + (bo(w, 'titleVisible', true) ? '<div class="wit__t" style="font-size:30px;font-weight:800;color:#1c2330;letter-spacing:-.02em" contenteditable="true" spellcheck="false" data-edit="wtitle">' + esc(g(w, 'title', w.title || '')) + '</div>' : '')
      + (bo(w, 'descriptionVisible', true) ? '<div class="wit__d" style="margin:14px 0 28px;font-size:16px;line-height:1.6;color:#6c7684">' + esc(g(w, 'description', w.desc || '')) + '</div>' : '')
      + (bo(w, 'ctaTextVisible', true) ? '<span' + ln(g(w, 'ctaLink', '')) + ' style="' + btnCss + ';font-weight:700;font-size:16px;padding:14px 30px;border-radius:10px">' + esc(g(w, 'ctaText', w.btn || '')) + '</span>' : '')
      + '</div>';
    var im = '<div class="wit__im" style="flex:1 1 50%;min-height:' + (mob ? '220px' : '360px') + ';background:center/cover url(\'' + imgU + '\')"></div>';
    return enter(w, '<div class="bsec"><div class="bsec__in">'
      + '<div class="wit" style="display:flex;' + (dirCol ? 'flex-direction:column;' : '') + 'border-radius:16px;overflow:hidden;box-shadow:0 8px 26px rgba(16,24,40,.08);min-height:' + (mob ? 'auto' : '360px') + '">'
      + (imgFirst ? im + tx : tx + im) + '</div></div></div>');
  };

  /* ── 플로팅 퀵메뉴 ───────────────────────────────────────────────────── */
  window.renderQuickMenu = function (w) {
    var sz = { small: 36, medium: 44, large: 52 }[g(w, 'size', 'medium')] || 44;
    var rd = g(w, 'shape', 'circle') === 'square' ? '12px' : '999px';
    var labels = bo(w, 'showLabels', false), bg = g(w, 'bgColor', '#ffffff'), ic = g(w, 'iconColor', '#0f172a');
    function cell(sym, label, link, top) {
      return '<div style="display:flex;flex-direction:column;align-items:center;gap:3px"' + ln(link) + '>'
        + '<div style="width:' + sz + 'px;height:' + sz + 'px;border-radius:' + rd + ';background:' + (top ? g(w, 'topBtnBgColor', '#0f172a') : bg) + ';color:' + (top ? g(w, 'topBtnIconColor', '#ffffff') : ic) + ';display:flex;align-items:center;justify-content:center;font-size:' + Math.round(sz * .39) + 'px;box-shadow:0 4px 14px rgba(16,24,40,.16)">' + sym + '</div>'
        + (labels ? '<span style="font-size:10px;color:#6c7684">' + esc(label) + '</span>' : '') + '</div>';
    }
    var stack = '';
    if (bo(w, 'showBasket', true)) stack += cell('🛒', g(w, 'basketLabel', '장바구니'), g(w, 'basketLink', ''));
    if (bo(w, 'showWishlist', true)) stack += cell('♡', g(w, 'wishlistLabel', '관심상품'), g(w, 'wishlistLink', ''));
    if (bo(w, 'showInquiry', true)) stack += cell('💬', g(w, 'inquiryLabel', '문의'), g(w, 'inquiryLink', ''));
    ar(w, 'customItems', []).forEach(function (it) { stack += cell(it.icon || '★', it.label || '메뉴', it.link || ''); });
    if (bo(w, 'showTopButton', true)) stack += cell('↑', g(w, 'topLabel', '맨위로'), '', true);
    var left = g(w, 'position', 'right') === 'left';
    return enter(w, '<div style="position:relative;padding:26px 24px;background:#f4f5f7">'
      + '<div style="max-width:1200px;margin:0 auto;display:flex;align-items:center;gap:20px;justify-content:space-between;' + (left ? 'flex-direction:row-reverse;' : '') + '">'
      + '<div style="font-size:13px;color:#8d97a5">플로팅 퀵메뉴 — 모든 페이지 ' + (left ? '좌측' : '우측') + '에 고정 노출됩니다</div>'
      + '<div style="display:flex;flex-direction:column;gap:10px">' + stack + '</div></div></div>');
  };

  /* ── 추천 상품 그리드 ────────────────────────────────────────────────── */
  var MODULE_SET = { product_listmain_1: 0, product_listmain_2: 1, product_listmain_3: 2, product_listmain_4: 3, product_listmain_5: 4 };
  window.renderProd = function (w) {
    var setIx = MODULE_SET[g(w, 'moduleSeq', 'product_listmain_1')] || 0;
    var refId = String(g(w, 'displayReferenceId', '') || '');
    if (refId) { var hs = 0; for (var q = 0; q < refId.length; q++) hs = (hs * 31 + refId.charCodeAt(q)) % 997; setIx = (setIx + 1 + hs) % 5; }
    var cols = isMob() ? parseInt(g(w, 'mobileColumns', '2'), 10) : parseInt(g(w, 'columns', String(w.cols || 4)), 10);
    var rows = parseInt(g(w, 'rows', '2'), 10) || 2;
    /* w.items — 주입된 스펙이 진열 상품을 직접 지정한 경우(시안 실측의 items 인덱스).
       이 오버라이드가 w.items 를 무시하고 늘 CATALOG 에서 8개를 뽑아 쓰고 있어서,
       시안이 4개만 깔아 둔 그리드도 8개로 늘고 두 그리드가 같은 상품으로 나왔다. */
    var spec = (w.items && w.items.length) ? w.items : null;
    var total = nu(w, 'totalProductCount', spec ? spec.length : 8);
    var perPage = Math.max(1, cols * rows);
    var shown = Math.min(perPage, Math.max(1, total));   /* 행×열은 상한 · 표시 상품 수는 실제 개수 */
    var items = spec ? spec.slice(0, shown) : productsForCat(setIx, shown);
    var al = g(w, 'headerAlign', w.align || 'center');
    var head = '<div style="text-align:' + al + '">'
      + (bo(w, 'titleVisible', w.titleShow !== false) ? '<div class="bh-t" contenteditable="true" spellcheck="false" data-wedit="title" style="font-size:24px;font-weight:800;color:#2a3040;letter-spacing:-.02em">' + esc(g(w, 'title', w.title || '')) + '</div>' : '')
      + (bo(w, 'subtitleVisible', w.subShow !== false) ? '<div class="bh-s" contenteditable="true" spellcheck="false" data-wedit="subtitle" style="margin-top:8px;font-size:16px;color:#525c6a">' + esc(g(w, 'subtitle', w.subtitle || '')) + '</div>' : '') + '</div>';
    var pages = Math.max(1, Math.ceil(total / perPage));
    var pag = bo(w, 'showPagination', false)
      ? '<div style="margin-top:24px;display:flex;gap:8px;justify-content:center">' + Array.apply(null, { length: pages }).map(function (_, i) {
        return '<span style="width:26px;height:26px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;' + (i === 0 ? 'background:#2a2d38;color:#fff' : 'color:#8d97a5;border:1px solid #e3e7ec') + '">' + (i + 1) + '</span>';
      }).join('') + '</div>' : '';
    var cta = bo(w, 'ctaTextVisible', !!w.more)
      ? '<div style="text-align:center"><button class="bmore"' + ln(g(w, 'ctaLink', '')) + '>' + esc(g(w, 'ctaText', w.moreText || '더보기')) + '</button></div>' : '';
    /* 1열(「대표 1종 강조」)은 칸이 본문 폭 전체 1200px 가 되고 카드 이미지가 정사각이라
       1200x1200 짜리 사진 자리가 된다. 원본이 1024px 라도 늘어나서 뭉개진다 —
       그래서 1열일 때만 폭 상한을 두고 가운데 정렬한다(.bgrid--n1, _r7.css). */
    return enter(w, '<div class="bsec"><div class="bsec__in">' + head
      + '<div class="bgrid' + (cols === 1 ? ' bgrid--n1' : '') + '" style="margin-top:24px;gap:' + px(nu(w, 'gap', 16)) + ';grid-template-columns:repeat(' + cols + ',minmax(0,1fr))">' + items.map(prodCard).join('') + '</div>'
      + pag + cta + '</div></div>');
  };

  /* ── 띠배너 ──────────────────────────────────────────────────────────── */
  window.renderStrip = function (w) {
    var items = ar(w, 'items', [{ text: w.text || '메시지를 입력하세요', link: '' }]);
    var sep = { dot: ' · ', pipe: ' | ', none: '　' }[g(w, 'separator', 'dot')] || ' · ';
    var fs = isMob() ? nu(w, 'fontSizeMobile', nu(w, 'fontSize', 14)) : nu(w, 'fontSize', 14);
    var st = 'background:' + g(w, 'bgColor', '#1a1a2e') + ';color:' + g(w, 'textColor', '#f0f0f0')
      + ';height:' + px(nu(w, 'height', 44)) + ';font-size:' + px(fs) + ';font-weight:' + g(w, 'fontWeight', '400')
      + ';letter-spacing:' + nu(w, 'letterSpacing', .04) + 'em;display:flex;align-items:center;overflow:hidden;position:relative';
    var mode = g(w, 'mode', 'flowing');
    var body;
    if (mode === 'flowing') {
      var line = items.map(function (it) { return esc(it.text || ''); }).join(sep);
      var dur = Math.max(4, 1200 / Math.max(10, nu(w, 'flowSpeed', 50)) * 10);
      var sepSpan = '<span style="opacity:.55">' + sep.trim() + '</span>';
      body = '<div class="wmq" style="animation-duration:' + dur + 's;gap:' + px(nu(w, 'itemGap', 60)) + '">'
        + '<span>' + line + '</span>' + (sep.trim() ? sepSpan : '') + '<span>' + line + '</span></div>';
    } else if (mode === 'carousel') {
      var cur = (w.cur || 0) % items.length;
      tmr(w, nu(w, 'speed', 5), function (i) { w.cur = ((w.cur || 0) + 1); refreshWidget(i); });
      body = '<div style="width:100%;text-align:center"' + ln((items[cur] || {}).link) + '>' + esc((items[cur] || {}).text || '') + '</div>';
    } else {
      body = '<div style="width:100%;text-align:center;display:flex;gap:' + px(nu(w, 'itemGap', 60)) + ';justify-content:center">'
        + items.map(function (it) { return '<span' + ln(it.link) + '>' + esc(it.text || '') + '</span>'; }).join('') + '</div>';
    }
    return '<div style="' + st + '">' + body
      + (bo(w, 'sticky', false) ? '<span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:10px;font-weight:700;opacity:.6">고정</span>' : '')
      + '<span style="position:absolute;right:16px;top:50%;transform:translateY(-50%);font-size:14px;opacity:.6">✕</span></div>';
  };

  /* ── 상단 카운트다운 띠배너 ──────────────────────────────────────────── */
  window.renderCountdown = function (w) {
    var acc = g(w, 'accentColor', '#fbbf24');
    function parts() {
      var end = C(w).endAt ? new Date(C(w).endAt) : null;
      if (!end || isNaN(+end)) return ['02', '14', '37'];
      var s = Math.max(0, Math.floor((end - new Date()) / 1000));
      function p2(x) { return (x < 10 ? '0' : '') + x; }
      return [p2(Math.floor(s / 3600)), p2(Math.floor(s % 3600 / 60)), p2(s % 60)];
    }
    if (C(w).endAt) tmr(w, 1, function (i) {
      var box = document.querySelector('#sfcanvas .sfw[data-kind="widget:' + i + '"] .cd-nums');
      if (box) { var p = parts(); box.querySelectorAll('b').forEach(function (b, k) { b.textContent = p[k]; }); }
    });
    var nums = parts().map(function (n) { return '<b style="background:' + acc + ';color:#111;padding:4px 10px;border-radius:6px">' + n + '</b>'; }).join('<span>:</span>');
    return '<div style="background:' + g(w, 'bgColor', '#111111') + ';color:' + g(w, 'textColor', '#f8fafc') + ';text-align:center;padding:18px;position:relative">'
      + '<div style="font-size:13px;margin-bottom:8px">' + esc(g(w, 'messagePrefix', '이벤트 종료까지')) + '</div>'
      + '<div class="cd-nums" style="display:flex;gap:6px;justify-content:center;align-items:center;font-size:20px;font-weight:800">' + nums + '</div>'
      + (bo(w, 'ctaTextVisible', true) ? '<span' + ln(g(w, 'ctaLink', ''), '_self') + ' style="display:inline-block;margin-top:10px;font-size:13px;font-weight:700;color:' + acc + ';text-decoration:underline">' + esc(g(w, 'ctaText', '혜택 보기')) + '</span>' : '')
      + (bo(w, 'closable', true) ? '<span data-cdclose="' + esc(g(w, 'dismissDuration', 'session')) + '" style="position:absolute;right:16px;top:16px;font-size:14px;opacity:.6;cursor:pointer">✕</span>' : '')
      + '</div>';
  };

  /* ── 캔버스 인터랙션: 링크 · 히어로 화살표 · 띠배너 닫기 ───────────────── */
  document.addEventListener('click', function (e) {
    if (!e.target.closest) return;
    var vh = e.target.closest('[data-vh]');
    if (vh) {
      e.stopPropagation();
      var box = vh.closest('.sfw'); if (!box) return;
      var i = +box.dataset.kind.split(':')[1], ww = PAGE.widgets[i];
      var len = (ar(ww, 'slides', ww.slides || [])).length || 1;
      ww.cur = ((ww.cur || 0) + (+vh.dataset.vh) + len) % len;
      refreshWidget(i); return;
    }
    var cd = e.target.closest('[data-cdclose]');
    if (cd) { e.stopPropagation(); toast('띠배너를 닫았어요 — 다시 노출 기준: ' + cd.dataset.cdclose); return; }
    var lk = e.target.closest('[data-wlink]');
    if (lk && lk.closest('#sfcanvas')) {
      e.stopPropagation();
      toast('‘' + lk.dataset.wlink + '’ 로 이동합니다' + (lk.dataset.wtgt === '_blank' ? ' (새 창)' : ''));
    }
  }, true);

  /* ── 스타일: 등장 효과 · 흐르는 띠배너 · 링크 커서 ─────────────────────── */
  var s = document.createElement('style');
  s.textContent = [
    '#sfcanvas [data-wlink]{cursor:pointer}',
    '.wenter{animation-name:wfade;animation-fill-mode:both;animation-timing-function:cubic-bezier(.2,.7,.3,1)}',
    '.wenter--fade-up{animation-name:wfup}.wenter--fade-down{animation-name:wfdown}',
    '.wenter--fade-left{animation-name:wfleft}.wenter--fade-right{animation-name:wfright}',
    '.wenter--zoom-in{animation-name:wzoom}.wenter--fade{animation-name:wfade}',
    '@keyframes wfade{from{opacity:0}to{opacity:1}}',
    '@keyframes wfup{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}',
    '@keyframes wfdown{from{opacity:0;transform:translateY(-28px)}to{opacity:1;transform:none}}',
    '@keyframes wfleft{from{opacity:0;transform:translateX(28px)}to{opacity:1;transform:none}}',
    '@keyframes wfright{from{opacity:0;transform:translateX(-28px)}to{opacity:1;transform:none}}',
    '@keyframes wzoom{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:none}}',
    '.wmq{display:flex;white-space:nowrap;animation-name:wmqroll;animation-timing-function:linear;animation-iteration-count:infinite}',
    '@keyframes wmqroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}',
    /* ══ 모바일 대응 ══════════════════════════════════════════════════════
       빌더 CSS 에는 이미 **모바일 텍스트 토큰**(Figma 2228-713)이 잡혀 있다 —
       1xl 24 · lg 20 · md 16 · sm 14 · 1xs 13 · 2xs 12. 구 위젯(.bh-t/.bof-t/.bbn-t…)은
       그 토큰을 따르는데, 이 파일이 그리는 위젯들은 인라인 font-size 라서 데스크톱 값이
       모바일에도 그대로 나갔다(섹션 제목 24px → 토큰은 lg 20px). 그래서 «한 단계 크다».
       인라인 값을 토큰 위로 끌어내린다 — 14px 이하는 그대로 둔다(이미 sm 이하다). */
    '.mobile [style*="font-size:30px"]{font-size:24px!important}',
    '.mobile [style*="font-size:28px"]{font-size:24px!important}',
    '.mobile [style*="font-size:26px"]{font-size:20px!important}',
    '.mobile [style*="font-size:24px"]{font-size:20px!important}',
    '.mobile [style*="font-size:22px"]{font-size:20px!important}',
    '.mobile [style*="font-size:20px"]{font-size:16px!important}',
    '.mobile [style*="font-size:18px"]{font-size:16px!important}',
    '.mobile [style*="font-size:17px"]{font-size:16px!important}',
    '.mobile [style*="font-size:16px"]{font-size:14px!important}',
    '.mobile [style*="font-size:15px"]{font-size:14px!important}',
    /* 클래스로 잡힌 값 중 토큰과 어긋난 것 — 넓은 배너 본문 15px → sm 14 */
    '.preview__frame.mobile .cb-b-desc{font-size:14px!important}',
    '.preview__frame.mobile .sff2__brand b{font-size:24px!important}',
    /* 콘텐츠+상품 그리드 카드 안 상품 행 썸네일 — 데스크톱 44px 를 모바일에도 쓰면
       상품이 무엇인지 안 보인다. 바로 옆 규칙(.cg-pc__img 모바일 64px)과 같은 값으로 올린다. */
    '.preview__frame.mobile .cg-pr__img{width:64px;height:64px;flex:0 0 64px}',
    /* 넓은 배너 높이 — 데스크톱 min-height 560px 이 모바일에도 그대로 걸려 402x560(0.72)
       세로 상자가 됐다. 시안 히어로는 1200x525~1440x640(가로 2.2~2.3)이라 그 상자에
       cover 로 넣으면 가로를 62% 잘라내고 피사체가 사라진다. 4:3(402x302)으로 낮추면
       잘리는 폭이 24% 로 줄고, 모바일 히어로 높이로도 과하지 않다. */
    '.preview__frame.mobile .cb-banner.is-wide{min-height:0!important;aspect-ratio:4/3}',
    /* 이미지+글(split-banner) 모바일 — 402px 프레임에서 좌우 2단은 성립하지 않는다.
       위아래로 쌓고, 데스크톱용 여백(44/48px)과 제목(30px)을 모바일 값으로 내린다.
       인라인 스타일을 이겨야 해서 !important 를 쓴다(위젯 마크업이 style 속성이다). */
    '.preview__frame.mobile .wit{flex-direction:column!important;min-height:auto!important}',
    '.preview__frame.mobile .wit__im{flex:none!important;min-height:200px!important}',
    '.preview__frame.mobile .wit__tx{flex:none!important;padding:24px 20px!important}',
    '.preview__frame.mobile .wit__t{font-size:20px!important;line-height:1.3}',
    '.preview__frame.mobile .wit__d{margin:10px 0 20px!important;font-size:14px!important}'
  ].join('\n');
  document.head.appendChild(s);

  /* 데스크톱⇄모바일 토글이 캔버스를 다시 그리지 않았다 — 토글 핸들러가 부르는 renderLive()
     는 우측 라이브 패널만 갱신한다. 그래서 isMob() 로 갈라지는 렌더러 7개(콘텐츠 배너 ·
     대표 상품 · 이미지 · 카테고리 · 이미지+글 · 그리드 열수 · 띠배너 글자크기)가 전부
     처음 그려진 기기 값에 멈춰 있었다. 클래스가 바뀐 뒤(버블링 단계) 캔버스를 다시 그린다. */
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.seg [data-device]')) return;
    setTimeout(function () { try { renderCanvas(); } catch (err) {} }, 0);
  });
})();
