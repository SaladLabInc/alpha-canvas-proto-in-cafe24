/* ═══════════════════════════════════════════════════════════════════════
   R8 — 온보딩 게이트 → 실제 빌더(canvas-intro)에 PAGE 주입
   CANV-2332 (related: CANV-2289)

   R7 대비 바뀐 것은 **왼쪽 게이트의 구조뿐**이다. 주입 경로·업종 데이터·위젯 렌더는
   R7 그대로다. 세 시안(V01 풀스텝 · V02 컨트롤 보드 · V03 항목 레일)이 이 파일 하나를
   공유하고 HTML 이 `window.R9_LAY` 로 자기 레이아웃을 고른다 — 셋의 차이가 「고르는
   방식」에만 남게 하려는 것이다(내용이 다르면 무엇 때문에 나은지 알 수 없다).

   업종 데이터는 이 파일에 없다 — `../_inds.js` 가 시리즈 공용 정본이고 R6 도 같은 걸 읽는다.

   주입 경로 (빌더 로직은 손대지 않는다):
     IMG        전역 이미지 맵      → 업종 사진으로 교체
     CATALOG    탭 상품 풀          → 업종 상품으로 교체 (renderSale 이 여기서 읽는다)
     PAGE       헤더·히어로·위젯    → 게이트 답변으로 재조립
     renderCanvas()                 → 다시 그린다

   ── 섹션을 만드는 두 경로 ──────────────────────────────────────────────
   (1) 시안 실측이 있는 업종 + "시안 그대로" → `ind.figma` 섹션 목록을 그대로 쓴다.
       위젯 키가 아니라 **섹션 스펙**이라 같은 위젯이 두 번 나와도 되고(상품 그리드 2회),
       각 섹션의 시안 문구·상품 인덱스를 함께 들고 있다.
   (2) 그 외(컨셉 프리셋 · 실측 없는 업종) → 위젯 키 목록을 스펙으로 승격해 쓴다.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var AS = 'assets/';                    /* 시리즈 공용 업종 이미지 */
  var INDS = window.ONB_INDS;               /* ← ../_inds.js */
  var CONCEPTS = window.ONB_CONCEPTS;
  var CATS = window.ONB_CATS || [{ k: 'all', n: '전체' }];

  /* R8 은 같은 엔진 위에 세 레이아웃(a 순차 · b 병렬 · c 계층)을 얹어 비교했고,
     그 비교는 **a(한 문항 풀스텝)로 끝났다**. R9 는 확정 단벌이라 분기를 걷어냈다 —
     `htmlB`/`htmlC` 와 `[data-lay="b"|"c"]` CSS 도 같이 지웠다. 세 안을 다시 대 보려면
     R8 폴더가 그대로 남아 있다(round-8/). 여기서 되살리지 않는다. */
  var LAY = 'a';

  /* 상품 수 카드 — canvas-intro 는 데스크톱 빌더라 열 수 문구를 웹 기준으로 쓴다
     (R6 는 모바일 프리뷰라 '2그리드'로 표기한다. 같은 규칙, 다른 표기) */
  var CNTS = [
    { v: 1,  n: '1개',      d: '대표 상품 하나만 크게' },
    { v: 6,  n: '5~10개',   d: '3열 그리드' },
    { v: 24, n: '10개 이상', d: '탭 내비 + 4열' }
  ];

  /* R6 위젯 키 → canvas-intro PAGE.widgets[].type — 13종이 그대로 맞물린다 */
  var MAP = {
    'content-banner':        'contentbanner',
    'content-banner-3':      'contentbanner',   /* 같은 위젯, 「세 칸 배너」 프리셋 */
    'video-banner':          'video',
    'category-shortcut':     'category',
    'split-banner':          'imagetext',
    'product-grid':          'product',
    'contents-product-grid': 'contentgrid',
    'category-tabs':         'sale',
    'shorts-carousel':       'shorts',
    'photo-review':          'photoreview',
    'image':                 'image',
    'text-block':            'text',
    'strip-banner':          'strip',
    'top-countdown-banner':  'countdown',
    /* 대표 상품 — canvas-intro 에 `mainproduct` 렌더러가 있고(2026-08-06 신설),
       R8 에서 Figma 6224:11071 스펙으로 다시 그렸다(_wrender.js). 그래서 MISSING 에서 뺐다. */
    'featured-product':      'mainproduct',
    /* 스크롤 배너(패럴랙스) — 렌더러·CSS·설정 패널·패럴랙스 계산이 **전부 이미 있었는데**
       MAP 에 배선이 없어 몰 구성에서는 한 번도 나오지 않았다(갤러리에서 직접 넣어야만 보였다).
       `.sbn__img` 를 스크롤 진행도에 맞춰 ±80% 옮기는 계산이 `#previewScroll` 에 걸려 있어
       빌더 안에서 그대로 동작한다. PC 전용 효과다 — 모바일에선 배너로만 선다. */
    'scroll-banner':         'brandbanner',
    /* 매거진 게시판 — **렌더러가 이미 있다.** 빌더에 `case 'magazine'`(v01-step.html:2805)이
       있고 `_wrender.js` 가 window.renderMagazine 을 덮어써서 커버 1장 + 썸네일 3장 구조로 그린다.
       MISSING 에 남아 있던 건 오래된 기록이었다(대표 상품이 그랬던 것과 같다). */
    'magazine-board':        'magazine'
  };

  /* canvas-intro 가 렌더러를 갖고 있지 않은 위젯 — 근사치로 그리지 않고 빼고 보고한다.
     (에디터에는 실재하는 위젯이다. 이 빌더 클론에만 없다.) */
  var MISSING = {
    'cta-button':       '버튼',
    'quick-menu':       '플로팅 퀵메뉴'
  };

  /* 실측 리뷰가 없는 업종용 데모 문구 — 상품별 효능을 주장하지 않는 일반 문장만 쓴다 */
  var RV = [
    { t: '사진이랑 똑같이 왔어요', x: '설명에 적힌 그대로여서 만족합니다. 포장도 꼼꼼했어요.' },
    { t: '배송이 빨랐습니다',     x: '주문한 다음 날 받았어요. 다음에도 여기서 살 것 같아요.' },
    { t: '재구매입니다',          x: '지난번에 써보고 좋아서 또 담았어요. 늘 쓰던 거라 안심됩니다.' },
    { t: '선물용으로 좋아요',     x: '포장이 깔끔해서 그대로 드렸는데 반응이 좋았습니다.' }
  ];

  /* ── 몰의 색과 글꼴 ────────────────────────────────────────────────────
     ①②③ 이 "무엇을 어떤 순서로 보여주나"라면 이 둘은 "어떤 톤으로 보이나"다.
     범위는 스토어프론트(#sfcanvas)뿐 — 빌더 UI 는 SDS 기준을 그대로 둔다.
     `#stage` 에 CSS 변수만 꽂으므로 캔버스를 다시 그리지 않아도 즉시 반영된다.
     기본값은 빌더가 이미 쓰는 몰 색(#607afb) — 고르기 전에는 아무것도 안 바뀐다. */
  var BRANDS = [
    { n: '기본',   c: '#607afb' },   /* 빌더가 이미 쓰는 몰 기본색 — 고르기 전 상태와 같다 */
    { n: '먹색',   c: '#1a1a1a' },
    { n: '코랄',   c: '#e2483d' },
    { n: '포레스트', c: '#1f5d4c' },
    { n: '네이비', c: '#1b3a6b' },
    { n: '카멜',   c: '#a8714a' }
  ];
  var PRETENDARD = "'Pretendard Variable',Pretendard,-apple-system,sans-serif";
  var FONTS = [
    { k: 'sans',     n: '기본',     d: 'Pretendard',    body: PRETENDARD,                 head: PRETENDARD,                 ls: '-.02em', w: 800 },
    { k: 'serif',    n: '모던 세리프', d: 'Noto Serif KR', body: PRETENDARD,                 head: "'Noto Serif KR',serif",    ls: '-.01em', w: 700 },
    { k: 'round',    n: '소프트',    d: 'Gowun Dodum',   body: "'Gowun Dodum',sans-serif", head: "'Gowun Dodum',sans-serif", ls: '0',      w: 400 },
    { k: 'impact',   n: '임팩트',    d: 'Black Han Sans', body: PRETENDARD,                head: "'Black Han Sans',sans-serif", ls: '-.01em', w: 400 },
    { k: 'myeongjo', n: '명조',      d: '나눔명조',      body: "'Nanum Myeongjo',serif",   head: "'Nanum Myeongjo',serif",   ls: '0',      w: 800 }
  ];
  function font() { for (var i = 0; i < FONTS.length; i++) if (FONTS[i].k === S.font) return FONTS[i]; return FONTS[0]; }

  /* 캔버스 리렌더 없이 변수만 갱신한다 — 그래서 "고르는 즉시" 가 성립한다 */
  function applyStyle() {
    var st = document.getElementById('stage'); if (!st) return;
    var f = font();
    st.style.setProperty('--sf-brand', S.brand);
    /* 빌더에 이미 있는 브랜드색 세터를 그대로 쓴다 — #sfcanvas 의 --brand 를 인라인으로
       꽂고 속성 패널의 '주요 색상' 필드까지 맞춰 준다. 우리가 따로 칠하면 그 필드와 어긋난다. */
    try { if (typeof applyBrand === 'function') applyBrand(S.brand); } catch (e) { }
    st.style.setProperty('--sf-font', f.body);
    st.style.setProperty('--sf-font-head', f.head);
    st.style.setProperty('--sf-head-ls', f.ls);
    st.style.setProperty('--sf-head-w', String(f.w));
  }

  /* step = 지금 펼친 항목, max = 여기까지 와 봤다(=값이 정해졌다)는 표시.
     max 가 없으면 3번에서 1번으로 되돌아간 순간 2·3번 요약이 사라진다 — 값은 그대로인데. */
  var S = { step: 0, max: 0, touched: {}, pick: {}, cats: ['all'], ind: 'food', cnt: 24, concept: 'origin', brand: BRANDS[0].c, font: 'sans', skipped: [], approx: [], myImgs: [] };

  /* ② 구성의 기본값은 업종마다 다르게 깐다.
     예전엔 어느 업종을 눌러도 「10개 이상 · 기본색 · 기본 글꼴」이 그대로여서, 업종을 갈아도
     오른쪽은 사진만 바뀌고 몰의 인상은 똑같았다 — 업종을 훑는 재미가 사진 구경에서 멈춘다.
     업종 순번에 서로소 간격을 줘 값을 돌려 뽑는다. 열 업종이 서로 겹치지 않게 퍼진다.
     매번 다른 값이 나오는 진짜 난수는 쓰지 않는다 — 되돌아와 같은 업종을 다시 누르면
     아까 본 화면이 그대로 나와야 업종끼리 비교가 된다(난수면 비교가 불가능해진다). */
  var IKEYS = Object.keys(INDS);
  /* 프리셋이 셋으로 줄었다(재구매 중심을 뺐다). 예전 뽑기식 `(i*3) % 4` 를 그대로 두면
     길이가 3 이라 `(i*3)%3 === 0` — **모든 업종이 첫 프리셋(전환율)로 몰린다.**
     길이와 서로소인 걸음을 따로 잡을 방법이 없으므로(길이 3 에선 어떤 걸음도 주기 3) 순차로 돌린다.
     ⚠ 상품 수도 주기 3(`(i*2)%3`)이라 두 값의 조합 주기가 12 → 3 으로 줄었다 —
       열 업종에서 나오는 「상품 수 × 구성」 짝이 3종뿐이라는 뜻이다(색은 주기 6 이라 계속 갈린다). */
  var CON_POOL = ['cv', 'brand', 'trust'];
  function mallDefaults(k) {
    var i = IKEYS.indexOf(k); if (i < 0) i = 0;
    return {
      /* 업종이 직접 `cnt` 를 적어 두면 그 값이 이긴다 — 뽑기는 어디까지나 「업종마다
         달라 보이게」 하는 장치지, 그 업종에 맞는 값을 고르는 장치가 아니다.
         (패션의류는 뽑기로 1개가 나와 메뉴 9개짜리 몰이 상품 하나로 섰다.) */
      cnt:     (INDS[k] && INDS[k].cnt) || CNTS[(i * 2) % CNTS.length].v,
      /* 시안 실측이 있는 업종만 구성을 'origin'(그 시안의 섹션 순서)으로 남긴다 —
         그 업종을 여는 이유가 시안 대조라서, 프리셋으로 갈아 끼우면 대조가 사라진다. */
      concept: (INDS[k] && INDS[k].figma) ? 'origin' : CON_POOL[i % CON_POOL.length],
      brand:   BRANDS[(i * 5) % BRANDS.length].c,
      /* 글꼴은 업종별로 돌리지 않는다 — 전부 기본(프리텐다드)으로 깐다.
         상품 수·구성·색은 업종마다 달라도 「이 업종은 이렇게 짜인다」로 읽히는데,
         글꼴은 업종을 넘길 때마다 본문 모양까지 바뀌어 다른 변화가 안 보였다.
         고르고 싶으면 ② 화면의 글꼴 칸에서 직접 바꾼다(그 선택은 S.pick 이 지킨다). */
      font:    'sans'
    };
  }
  /* 사용자가 직접 고른 값은 업종을 바꿔도 지킨다(S.pick) —
     상품 수를 1개로 맞춰 두고 업종만 훑는 사람에게서 그 값을 뺏지 않는다. */
  function applyMallDefaults() {
    var d = mallDefaults(S.ind);
    if (!S.pick.cnt)     S.cnt     = d.cnt;
    if (!S.pick.concept) S.concept = d.concept;
    if (!S.pick.brand)   S.brand   = d.brand;
    if (!S.pick.font)    S.font    = d.font;
  }
  function goStep(n) {
    S.step = Math.max(0, Math.min(LAST, n));
    if (S.step > S.max) S.max = S.step;
  }

  function ind()  { return INDS[S.ind]; }
  function band() { return S.cnt <= 1 ? 'one' : S.cnt <= 10 ? 'two' : 'tabs'; }
  function bandName() { return { one: '대표 1종 강조', two: '3열 그리드', tabs: '탭 내비 + 4열' }[band()]; }
  /* ③ 구성의 요약은 **무엇으로 짜였는지**로 말한다.
     예전엔 「LOTS 시안 그대로」라고 적었는데, 「시안」은 우리끼리 쓰는 말이고 몰을 만드는
     사람에게는 아무 정보가 아니다(그 몰에 뭐가 먼저 오는지를 알고 싶어 한다).
     그래서 실제로 깔리는 섹션에서 앞 세 덩어리를 뽑아 「배너 · 카테고리 · 상품」처럼 적는다. */
  /* 띠배너·카운트다운·이미지·문구는 뺀다 — 어느 구성에나 얹히는 부속이라 앞에 세워 봐야
     「이 구성이 무엇을 먼저 보여 주나」를 말해 주지 않는다(패션의류가 「띠배너 · 카운트다운 ·
     배너」로 읽히던 게 그 증상이다). 남는 건 그 자리를 실제로 차지하는 덩어리들이다. */
  var BLOCK_N = {
    'content-banner': '배너', 'content-banner-3': '배너', 'video-banner': '영상',
    'split-banner': '이미지+글', 'category-shortcut': '카테고리',
    'contents-product-grid': '카테고리별 상품', 'featured-product': '대표 상품',
    'product-grid': '상품', 'category-tabs': '카테고리 탭',
    'shorts-carousel': '쇼츠', 'photo-review': '후기', 'magazine-board': '매거진',
    'scroll-banner': '스크롤 배너'
  };
  function conceptName() {
    var seen = {}, out = [];
    sections().forEach(function (sp) {
      var n = BLOCK_N[sp.w];
      if (!n || seen[n]) return;
      seen[n] = 1; if (out.length < 3) out.push(n);
    });
    return out.length ? out.join(' · ') : (CONCEPTS[S.concept] ? CONCEPTS[S.concept].n : '기본 구성');
  }
  function won(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '원'; }
  function A(f) { return AS + ind().img + '/' + f; }
  /* 업종의 상단 히어로 이미지 — 시안 실측이 있으면 그 첫 섹션 이미지가 히어로다.
     업종 칩 썸네일도 반드시 이걸 읽어야 한다. 칩이 hero.jpg 로 고정돼 있어서
     시안 있는 업종(LOTS·LIEN)은 칩 사진과 상단 배너가 서로 다른 사진이었다. */
  function heroOf(x) {
    var base = AS + x.img + '/';
    /* x.hero — 시안 로고를 구워 넣은 대표컷이 따로 있으면 그걸 쓴다(LIEN·MORU 방식).
       시안 실측이 있으면 그 첫 섹션 이미지가 곧 히어로다. 둘 다 없으면 기본 hero.jpg. */
    if (x.hero) return base + x.hero;
    /* figma[0] 이 아니라 **사진을 가진 첫 섹션**을 찾는다 — MODUM 은 첫 섹션이 타임세일
       카운트다운 띠(사진 없음)라서 figma[0].img 만 보면 조용히 hero.jpg 로 떨어졌다. */
    var f = x.figma || [];
    for (var n = 0; n < f.length; n++) if (f[n] && f[n].img) return base + f[n].img;
    return base + 'hero.jpg';
  }
  /* 업종 카드 썸네일은 히어로와 갈라질 수 있다. 패션의류처럼 히어로가 **카피가 구워진
     가로 배너**(2.76:1)면 4:3 카드에 cover 로 깔릴 때 가운데만 남아 글자가 잘려 보인다.
     그런 업종은 `thumb` 로 카드용 컷을 따로 지정한다. 없으면 지금까지처럼 히어로를 쓴다. */
  function thumbOf(x) { return x.thumb ? (AS + x.img + '/' + x.thumb) : heroOf(x); }
  /* 범용 컷(hero.jpg·split.jpg) 참조는 **전부 이 함수를 거친다**. health 처럼 시안
     실측만으로 채운 업종은 폴더에 그 두 파일이 없다 — 리터럴로 두면 시안 그대로가
     아닌 구성(cv 등)으로 넘어오거나 갤러리에서 위젯을 새로 넣는 순간 영상 포스터·
     2분할·이미지 위젯이 404 로 빈 칸이 된다(첫 화면에서는 안 보여서 오래 숨어 있었다).
     그런 업종만 _inds.js 의 `cuts` 로 대체컷을 지정한다 — 나머지 업종은 그대로다. */
  function cutOf(x, name) { return AS + x.img + '/' + ((x.cuts && x.cuts[name]) || name); }
  function figmaMode() { return S.concept === 'origin' && !!ind().figma; }
  /* p1..p10.jpg — 업종 폴더의 공용 상품컷. 시안만으로 채운 업종(health)엔 이 파일이 아예 없어서,
     없는 경로를 부르면 사진 자리가 빈 회색 원·박스로 남았다(건강기능식품 카테고리 바로가기).
     그런 업종은 `noPset: 1` 로 표시하고 카탈로그(시안 실측 fig-c*)에서 뽑는다. */
  function pimg(n) {
    var i = ind(), b = AS + i.img + '/';
    if (i.noPset) {
      var pool = cat();
      if (pool.length) return pool[((n % pool.length) + pool.length) % pool.length].img;
      return heroOf(i);
    }
    return b + 'p' + (((n % 10) + 10) % 10 + 1) + '.jpg';
  }


  /* ── 섹션 목록 ──────────────────────────────────────────────────────── */
  /* 카테고리 상품 탭을 끼울 자리 — 「첫 배너(들) 뒤」. 고정 index 1 로 넣으면
     배너로 시작하지 않는 프리셋에서 배너보다 탭이 먼저 올라온다. 바로 뒤가
     카테고리 바로가기면 그것까지 넘긴다(같은 성격 위젯이 배너를 밀어내지 않게). */
  /* 「세 칸 배너」도 맨 앞 배너 자리다 — AIRUS 시안은 3분할 히어로로 시작하는데, 이게 빠져
     있으면 splitLead 가 lead 를 빈 배열로 보고 ② 규칙이 **상품 그리드를 히어로보다 앞으로**
     끌어온다. 다른 업종·프리셋에서는 이 키가 목록 맨 앞에 오지 않아 영향이 없다. */
  var LEAD_BANNER = { 'strip-banner': 1, 'top-countdown-banner': 1, 'content-banner': 1,
                      'content-banner-3': 1, 'video-banner': 1, 'split-banner': 1 };
  function tabAt(main) {
    var at = 0;
    while (at < main.length && LEAD_BANNER[main[at]]) at++;
    if (!at) return 1;
    if (main[at] === 'category-shortcut') at++;
    return at;
  }


  /* 칩 필터 — 여러 개 고를 수 있다. '전체'가 켜져 있으면 전부 보여준다.
     한 업종이 두 카테고리에 걸쳐 있어도(예: 스포츠 = 라이프+패션) 합집합이라 한 번만 나온다. */
  function catsOn(x) {
    if (!S.cats.length || S.cats.indexOf('all') >= 0) return true;
    var t = x.cats || [];
    for (var n = 0; n < S.cats.length; n++) if (t.indexOf(S.cats[n]) >= 0) return true;
    return false;
  }

  /* ② 상품 수는 「추천 상품 그리드」에만 걸려 있었다. 그래서 1개를 골라도 카테고리 탭·
     콘텐츠+상품 그리드·쇼츠가 자기 기본 개수(8·3·5)로 계속 깔려서 상품이 수십 개로 보였다.
     상품을 진열하는 위젯 **전부**가 같은 상한을 쓰게 한다. */
  function cap(kind) {
    var b = band();
    var T = {
      card:  { one: 1, two: 2, tabs: 4 },   /* 콘텐츠+상품 그리드 카드 하나에 붙는 상품 */
      tab:   { one: 1, two: 6, tabs: 8 },   /* 카테고리 상품 탭이 한 탭에 깔 상품 */
      short: { one: 1, two: 3, tabs: 5 }    /* 쇼츠 슬라이드 */
    }[kind];
    return T[b];
  }

  /* ── 항목표 ────────────────────────────────────────────────────────────
     세 레이아웃(A 풀스텝 · B 보드 · C 레일)이 **같은 다섯 항목**을 공유한다.
     달라지는 건 이 다섯을 화면에 어떻게 늘어놓느냐뿐이고, 항목의 내용(옵션 카드
     마크업)은 아래 frag*() 한 벌을 셋이 그대로 쓴다 — 그래야 비교되는 게
     "무엇을 고르나"가 아니라 "어떻게 고르나"가 된다. */
  function brandName() {
    for (var i = 0; i < BRANDS.length; i++) if (BRANDS[i].c === S.brand) return BRANDS[i].n;
    return '기본';
  }
  /* 상품 수 · 구성 · 색·글꼴을 **한 화면(mall)** 으로 묶었다.
     셋은 «업종을 고른 뒤 그 몰을 어떻게 짜나» 라는 한 가지 결정의 세 축이고, 카드가
     3개·4개·색6+글꼴5 라 한 화면에 다 들어간다. 쪼개 놓으면 상품 수를 고르고 다음을 눌러
     구성을 고르는 동안 앞에서 뭘 골랐는지가 화면에서 사라져, 셋을 함께 보며 조정할 수 없었다.
     스텝이 5→3으로 줄어 「몇 개 남았나」도 짧아진다. 각 축은 소제목으로 여전히 구분된다.
     touched 키도 'mall' 하나 — 셋 중 아무거나 고르면 이 스텝을 만진 것으로 본다. */
  var STEPS = [
    { k: 'ind',  n: '업종', t: '어떤 몰을 만드시나요', s: '메뉴 · 상품 · 사진이 이 업종으로 맞춰집니다' },
    { k: 'mall', n: '구성', t: '이 몰을 어떻게 짜 드릴까요',
      s: '파는 종 수 · 무엇을 먼저 보이게 할지 · 색과 글꼴 — 한 화면에서 고릅니다' },
    { k: 'wg',   n: '위젯', t: '위젯 더 보기', s: '셋팅이 끝난 뒤에도 언제든 추가할 수 있습니다' }
  ];
  var LAST = STEPS.length - 1;

  /* ③ 은 **항상 「위젯」**이다 — 보고 있는 페이지에 따라 이름·제목이 갈리지 않는다.
     R8 은 상세페이지에서 ③ 을 슬롯 5칸(구매영역·스크롤 중 구매·옵션 방식·하단 탭·추가 위젯)
     으로 폈고, R9 는 그걸 걷어내고 「지금 상세페이지에 있다」는 안내문으로 바꿨다. 둘 다
     ③ 을 **다른 페이지의 칸으로 변형**하는 것이라, 셋팅 흐름(업종 → 구성 → 위젯) 한가운데서
     ② 의 다음 버튼이 「다음 · 상세페이지 →」로 바뀌고 상세로 들어가면 스텝이 저절로 ③ 으로
     끌려갔다. 지금은 이름을 그대로 두고 **목록의 내용만** 그 페이지에 넣을 수 있는 위젯으로
     바꾼다(fragDp) — 자리 설정은 오른쪽 속성 패널이 계속 전담한다. */
  function meta(n) { return STEPS[n]; }

  function stepSum(n) {
    var k = STEPS[n] && STEPS[n].k;
    if (k === 'ind')  return ind().n;
    /* 묶인 스텝의 요약은 세 축을 그대로 잇는다 — 접혀 있어도 뭘 골랐는지 다 읽혀야 한다 */
    if (k === 'mall') return bandName() + ' · ' + conceptName() + ' · ' + brandName() + '/' + font().n;
    /* 상세페이지에서는 ③ 에 고를 게 없으므로 요약도 없다(슬롯을 걷어낸 뒤로) */
    return '';
  }
  /* ② 안내문은 이제 업종·구성과 무관하게 한 문장이다.
     예전엔 「시안 그대로에서는 진열 밀도만 바뀝니다」로 갈라져 있었는데 두 가지가 틀렸다 —
     「시안」은 우리끼리 쓰는 말이고, 지금은 밀도만이 아니라 **파는 종 수와 구성이 함께** 바뀐다
     (1종이면 카테고리 자리가 대표 상품으로 갈린다). 모든 업종에 같은 규칙, 같은 문장이다. */
  function stepSub(n) { return meta(n).s; }
  /* ── 1종 몰의 섹션 손질 ────────────────────────────────────────────────
     파는 게 한 종뿐이면 **카테고리로 고르게 하는 자리**가 전부 의미를 잃는다.
     카테고리 상품 탭·카테고리 바로가기는 빼고, 맨 앞의 「콘텐츠+상품 그리드」
     (= 화면 위쪽의 Category 영역)는 **대표 상품 위젯으로 갈아끼운다** — 고를 게
     하나면 그 하나를 크게 보여 주는 게 맞다. 시안 구성을 건드리지 않는다는 원칙을
     여기서만 깬다(1개일 때만). */
  var CAT_DROP = { 'category-tabs': 1, 'category-shortcut': 1 };

  /* 맨 앞에 붙는 배너(들)과 그 뒤를 가른다 — 세 구간 모두 「배너 다음」을 기준으로 짠다. */
  function splitLead(list) {
    var L = [], R = [], still = true;
    list.forEach(function (sp) {
      if (still && LEAD_BANNER[sp.w]) { L.push(sp); return; }
      still = false; R.push(sp);
    });
    return { lead: L, rest: R };
  }

  /* ── ② 상품 수 = 첫 화면의 뼈대 ────────────────────────────────────────
     세 구간이 **눈에 보이게** 갈라져야 고른 보람이 있다. 전에는 5~10개와 10개 이상이
     섹션 순서가 같아서(시안 목록을 그대로 썼다) 열 수와 상품 종 수만 조용히 달라졌다 —
     골라도 화면이 그대로인 것처럼 보였다.

       1개        배너 → 대표 상품              (고를 게 하나면 그 하나를 크게)
       5~10개     배너 → 상품 3열               (분류할 만큼이 아니다 — 상품을 바로 편다)
       10개 이상  배너 → 카테고리 → 상품 4열    (분류가 먼저 필요한 규모다)

     ⚠ 이 규칙은 시안 실측이 있는 업종의 **순서도 덮어쓴다**. 「시안 그대로」를 깨는 자리다 —
       두 구간이 구별되지 않는 게 더 큰 문제라고 판단했다(순서 외의 문구·상품·사진은 그대로다). */
  function onlyOne(list) {
    var sp = splitLead(list), src = null;
    /* 카테고리로 고르게 하는 자리는 전부 빼고, 상품 그리드도 뺀다 —
       파는 게 한 종이면 그리드에 깔릴 게 그 하나뿐이라 대표 상품과 같은 상품이
       두 번·세 번 반복될 뿐이다. */
    var rest = sp.rest.filter(function (x) {
      if (CAT_DROP[x.w]) return false;
      if (x.w === 'contents-product-grid' || x.w === 'product-grid') { if (!src) src = x; return false; }
      return true;
    });
    var feat = { w: 'featured-product', nth: 0 };
    if (src) { feat.title = src.title; feat.desc = src.desc; }
    var pr = splitPre(rest);
    return sp.lead.concat(pr.pre, [feat], pr.tail);
  }

  /* 프리셋이 `pre` 로 선언한 위젯은 ② 상품 블록보다 **앞에** 남는다.
     목록 순서만으로는 안 되는 이유 — ② 규칙(아래 arrange)이 상품·카테고리를 배너 바로
     뒤로 끌어오기 때문에, 「후기를 상품보다 먼저」로 적어 둔 신뢰 프리셋이 실제로는
     상품 뒤로 밀려 있었다. 선언한 위젯이 없으면 지금까지와 완전히 같다. */
  function splitPre(list) {
    var pre = [], tail = [];
    list.forEach(function (x) { (x.pre ? pre : tail).push(x); });
    return { pre: pre, tail: tail };
  }

  function arrange(list) {
    var b = band();
    if (b === 'one') return onlyOne(list);

    var sp = splitLead(list), grid = null, cat = null, tabs = null;
    var rest = sp.rest.filter(function (x) {
      if (x.w === 'category-shortcut') { if (!cat) cat = x; return false; }
      if (x.w === 'category-tabs') {
        /* 5~10개에서는 카테고리 상품 탭을 아예 뺀다 — 10종 미만을 탭으로 갈라 놓으면
           탭 하나에 한두 개씩만 남는다(구간을 가르는 축과도 어긋난다). */
        if (b === 'two') return false;
        if (!tabs) { tabs = x; return false; }              /* 10개 이상은 앞으로 끌어온다 */
        return false;
      }
      /* 5~10개에서만 첫 상품 그리드를 앞으로 끌어온다. 10개 이상에서는 앞자리를
         카테고리 바로가기 + 카테고리별 상품 탭이 가지므로 그리드는 제자리에 둔다. */
      if (b === 'two' && x.w === 'product-grid' && !grid) { grid = x; return false; }
      return true;
    });
    var head;
    if (b === 'tabs') {
      /* 분류가 먼저 필요한 규모 — 카테고리 바로가기로 갈래를 보여 주고,
         바로 이어서 카테고리별 상품 탭으로 그 갈래의 상품을 4열로 편다. */
      head = [cat || { w: 'category-shortcut', nth: 0 }, tabs || { w: 'category-tabs', nth: 0 }];
    } else {
      head = [grid || { w: 'product-grid', nth: 0 }];       /* 상품 바로 → 3열 */
    }
    var pr = splitPre(rest);
    return sp.lead.concat(pr.pre, head, pr.tail);
  }

  /* 업종별 섹션 문구(`_inds.js` 의 copy) — 위젯 키 목록만으로 만든 스펙에 그 업종 글을 얹는다.
     이게 없으면 시안 실측이 없는 업종은 위젯 기본 문구(「추천 상품」·「카테고리별 상품」·
     「Photo review」)만 남아 열 업종이 같은 글을 쓴다. 같은 위젯이 두 번 나오면 배열로 적고
     nth 순서대로 쓴다 — 모자라면 그 자리는 기본값 그대로 둔다(억지로 돌려 쓰지 않는다).
     시안 실측 모드는 이 길을 지나지 않는다(그 스펙이 이미 자기 문구를 들고 있다). */
  var COPY_SKIP = { w: 1, nth: 1, pre: 1, approx: 1 };
  /* 우리가 쓴 문구(copy)가 먼저, 시안(figma)이 남은 칸을 채운다 — 그래서 제목 하나만 갈아 두고
     사진·카드 같은 나머지는 시안 것을 그대로 쓸 수 있다(둘 중 하나를 통째로 고르지 않는다). */
  function copyApply(sp, one, skip) {
    Object.keys(one).forEach(function (f) { if (!skip[f] && sp[f] == null) sp[f] = one[f]; });
  }
  function copyInto(sp, i, k, nth) {
    var one = null, skip = COPY_SKIP;
    var c = (i.copy || {})[k];
    if (c) one = (c instanceof Array) ? c[nth] : (nth ? null : c);
    if (one) { copyApply(sp, one, COPY_SKIP); one = null; }
    /* 실측이 있는 업종은 프리셋 모드에서도 **그 업종 시안 문구**를 쓴다 — 프리셋이 바꾸는 것은
       섹션 순서다. 문구까지 위젯 기본값으로 돌아가면 「추천 상품 · 카테고리별 상품 · Photo
       review」로 열 업종이 같아지고, 방금 만든 시안 판보다 오히려 빈약해 보인다.
       ⚠ items(진열할 상품 번호)는 가져오지 않는다 — 시안 그리드는 4칸이라 그대로 쓰면
       ② 상품 수를 24로 골라도 4칸으로 줄어든다. 진열 밀도는 ② 규칙이 정한다. */
    if (i.figma) {
      for (var j = 0, hit = 0; j < i.figma.length; j++) {
        if (i.figma[j].w !== k) continue;
        if (hit++ === nth) { one = i.figma[j]; skip = { w: 1, nth: 1, pre: 1, approx: 1, items: 1 }; break; }
      }
    }
    if (one) copyApply(sp, one, skip);
  }

  function sections() {
    var i = ind();
    if (figmaMode()) return arrange(i.figma);   /* (1) 시안 실측 — 순서만 ② 규칙으로 다시 세운다 */

    /* (2) 위젯 키 목록 → 스펙 승격. ② 상품 수 규칙이 탭 위젯을 넣고 뺀다. */
    var main = (S.concept === 'origin' ? (i.layout || []) : CONCEPTS[S.concept].main).slice();
    if (band() !== 'tabs') main = main.filter(function (k) { return k !== 'category-tabs'; });
    else if (main.indexOf('category-tabs') < 0) main.splice(tabAt(main), 0, 'category-tabs');
    /* common 이 이미 부른 위젯만 main 에서 뺀다 — 띠배너가 두 줄로 겹치는 걸 막는 게 목적이다.
       main 안에서의 반복(상품 그리드 2회 등)은 시안도 하는 구성이라 그대로 살린다.
       예전엔 전체를 dedupe 해서 반복이 조용히 한 개로 줄었다. */
    /* 카운트다운 띠(마감 압박)는 「지금 사게 만드는」 프리셋의 도구다. 브랜딩·신뢰 중심에서는
       맨 위 타이머가 프리셋과 정면으로 어긋난다 — 브랜드를 먼저 보여준다면서 카운트다운부터
       띄우는 꼴이다. 그 둘에서는 뺀다. ③ 을 고른 차이가 **스크롤 없이 첫 화면에서** 보이려면
       맨 앞 한 칸을 갈라 주는 수밖에 없다(그 아래는 ② 상품 수 규칙이 이미 차지하고 있다). */
    var NO_RUSH = { brand: 1, trust: 1 };
    var common = (i.common || []).filter(function (k) {
      return !(NO_RUSH[S.concept] && k === 'top-countdown-banner');
    });

    var inCommon = {};
    common.forEach(function (k) { inCommon[k] = 1; });

    /* 같은 위젯이 두 번 이상 나오면 nth 를 달아 둔다 — mk() 가 제목·상품을 다르게 뽑아
       같은 그리드가 두 번 붙은 것처럼 보이지 않게 한다. */
    var nth = {};
    /* 프리셋의 `pre` 선언을 스펙에 표시해 둔다 — arrange() 가 이 표시를 보고 상품 앞에 남긴다 */
    var preOf = {};
    ((CONCEPTS[S.concept] || {}).pre || []).forEach(function (k) { preOf[k] = 1; });
    var out = common.concat(main.filter(function (k) { return !inCommon[k]; }))
      .map(function (k) {
        nth[k] = (nth[k] == null ? 0 : nth[k] + 1);
        var sp = { w: k, nth: nth[k] };
        if (preOf[k]) sp.pre = 1;
        copyInto(sp, i, k, nth[k]);
        return sp;
      });
    return arrange(out);
  }

  /* ② 상품 수 → 그리드 밀도. 시안 그대로 모드에서는 섹션 구성을 바꾸지 않고
     진열 밀도만 바꾼다 — 시안에 없는 위젯을 끼워 넣으면 "그대로"가 아니게 된다. */
  function grid(want) {
    var b = band();
    if (b === 'one') return { n: 1, cols: 1 };
    if (b === 'two') return { n: Math.min(want, 6), cols: 3 };
    return { n: want, cols: 4 };
  }

  /* ── 상품 풀 ──────────────────────────────────────────────────────────
     ② 상품 수는 「한 섹션에 몇 개를 진열하나」가 아니라 **「이 몰이 몇 개를 파나」**다.
     전에는 풀 8종을 그대로 두고 위젯마다 slice 만 했다 — 그래서 1개를 골라도
     섹션마다 서로 다른 상품이 하나씩 떠서, 결국 여러 종을 파는 몰로 보였다
     (「1개인데 왜 상품이 이렇게 많이 나오나」의 진짜 원인이 이것이다).
     풀 자체를 자르면 어느 섹션에 가도 그 하나만 나온다 — 진짜 1종 몰이 된다. */
  function poolCap() { return { one: 1, two: 6, tabs: 99 }[band()]; }
  /* 올린 사진은 긴 변 900px 로 줄여 담는다. 원본 그대로면 수 MB data URL 이 그릴 때마다
     인라인으로 다시 박혀 캔버스가 눈에 보이게 느려진다(진열·탭·상세까지 같은 문자열이
     여러 번 들어간다). 실패하면 원본을 그대로 쓴다 — 사진이 안 올라가는 쪽이 더 나쁘다. */
  function shrink(dataUrl, cb) {
    var im = new Image();
    im.onload = function () {
      var m = 900, w = im.width, h = im.height;
      if (w > m || h > m) { var k = m / Math.max(w, h); w = Math.round(w * k); h = Math.round(h * k); }
      try {
        var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        cv.getContext('2d').drawImage(im, 0, 0, w, h);
        cb(cv.toDataURL('image/jpeg', .85));
      } catch (err) { cb(dataUrl); }
    };
    im.onerror = function () { cb(dataUrl); };
    im.src = dataUrl;
  }

  function cat() {
    var i = ind(), list;
    if (i.catalog) {
      list = i.catalog.map(function (c) {
        return { name: c.n, desc: c.d || '', img: A(c.img),
          sale: c.sale || '', price: won(c.price), orig: c.orig ? won(c.orig) : '' };
      });
    } else {
      /* 실측 catalog 가 없는 업종 — 이름·가격만. 할인율·정가는 지어내지 않는다 */
      list = (i.prods || []).map(function (p, j) {
        return { name: p[0], desc: '', img: A('p' + (j % 10 + 1) + '.jpg'), price: won(p[1]) };
      });
    }
    /* 내가 올린 사진 — **앞에서부터 한 장씩 한 상품에** 얹는다. 한 장을 전 상품에 뿌리지
       않는다: 열 종이 같은 사진이면 몰이 아니라 목록으로 읽히고, 어느 게 내 상품인지도
       사라진다. 그래서 1장이면 1번 상품만 바뀌고 나머지는 기본 사진 그대로다.
       여기 한 곳만 갈면 진열·탭·콘텐츠 그리드·대표 상품·상세페이지 대표컷이 전부 따라온다
       (그 전부가 이 풀에서 상품을 가져간다). */
    list = list.map(function (c, j) {
      if (!S.myImgs[j]) return c;
      return { name: c.name, desc: c.desc, img: S.myImgs[j],
        sale: c.sale, price: c.price, orig: c.orig, mine: 1 };
    });
    return list.slice(0, poolCap());
  }

  function applyIndustry() {
    var i = ind(), b = AS + i.img + '/';
    var p = pimg;


    /* 상세페이지 배치 — 업종마다 다르게 준다(_inds.js 의 `dp`).
       디자인 설정 4개 항목(레이아웃·상품 이미지 위치·구매하기 버튼·스크롤 시 고정)의 시작값이며,
       빌더에서 바꾼 값은 업종을 다시 고를 때 그 업종 기본값으로 되돌아온다.
       `dp` 가 없는 업종은 DETAIL.design 원래 값을 그대로 쓴다(빈칸으로 만들지 않는다). */
    if (typeof DETAIL !== 'undefined' && DETAIL.design && i.dp) {
      ['layout', 'imgPos', 'buyStyle', 'sticky'].forEach(function (k) {
        if (i.dp[k]) DETAIL.design[k] = i.dp[k];
      });
    }

    /* 전역 IMG — newWidget()·기본 위젯이 전부 여기서 읽는다 */
    IMG.hero = heroOf(i);
    IMG.banner = cutOf(i, 'split.jpg'); IMG.video = cutOf(i, 'hero.jpg');
    IMG.nightcream = p(0); IMG.focus = p(1); IMG.balance = p(2); IMG.radiance = p(3);
    IMG.rv1 = p(4); IMG.rv2 = p(5); IMG.rv3 = p(6); IMG.rv4 = p(7);
    ['lamp', 'tablelamp', 'sidetable', 'chair', 'armchair', 'bookshelf',
     'drawer', 'shelf', 'nightstand', 'table', 'dining'].forEach(function (k, n) { IMG[k] = p(n); });

    /* renderSale() 은 w.items 를 무시하고 CATALOG 에서 다시 읽는다 → 여기를 바꿔야 탭이 갈린다 */
    var pool = cat();
    if (pool.length) {
      Object.keys(CATALOG).forEach(function (t) {
        var off = (+t || 0) % pool.length;
        CATALOG[t] = pool.slice(off).concat(pool.slice(0, off));
      });
    }

    /* ── IMG 를 '값으로 복사해 둔' 최상위 선언들 ──────────────────────────
       canvas-intro 는 로드 시점에 IMG.focus 같은 값을 꺼내 배열·객체에 박아 둔다.
       그래서 위에서 IMG 를 갈아끼워도 그것들은 예전 뷰티 경로를 그대로 들고 있다
       — 상세페이지가 업종을 안 따라가던 원인이 정확히 이것이다(참조가 아니라 값 캡처).
       배열은 새 배열로 바꾸지 않고 제자리에서 비우고 채운다(다른 곳이 참조 중일 수 있다). */
    function refill(arr, vals) { if (!arr) return; arr.length = 0; vals.forEach(function (v) { arr.push(v); }); }

    if (typeof HERO_IMAGES !== 'undefined')                      /* 히어로 이미지 픽커 */
      refill(HERO_IMAGES, [IMG.hero, IMG.banner, p(0), p(1), p(2), p(3)]);

    if (typeof PROD_IMGS !== 'undefined')                        /* 상품 이미지 픽커 */
      refill(PROD_IMGS, [p(0), p(1), p(2), p(3), p(4), p(5), p(6), p(7), IMG.banner, IMG.hero]);

    /* 상세페이지 — 대표컷·썸네일 4장 + 상품명·가격까지 업종을 따라간다.
       이미지만 바꾸면 '식료품' 인데 상품명이 '포커스 플러스'로 남아 더 어색해진다. */
    if (typeof DETAIL !== 'undefined' && DETAIL.product) {
      var d0 = pool[0];
      if (d0) {
        DETAIL.product.img = d0.img;
        DETAIL.product.thumbs = pool.slice(0, 4).map(function (c) { return c.img; });
        DETAIL.product.name = d0.name;
        DETAIL.product.eng = i.ref + ' SIGNATURE';
        DETAIL.product.price = d0.price;
        /* 할인율·정가는 **실측 catalog 에 있을 때만** 쓴다.
           없는 업종에서 계산으로 만들어 내면 지어낸 값이 된다(정가 = 판매가/0.8 같은 식). */
        DETAIL.product.sale = d0.sale || '';
        DETAIL.product.orig = d0.orig || '';
      }
      if (i.bullets) DETAIL.product.bullets = i.bullets.slice();
    }
  }

  /* ── 섹션 하나 → canvas-intro 위젯 하나 ─────────────────────────────── */
  /* pos — 넓은 배너에서 글이 사진 위 어디에 얹히나(빌더 CB_POS9 인덱스).
     6=하단 좌측(기본) · 7=하단 중앙 · 4=정중앙. 시안이 가운데 정렬이면 스펙이 지정한다. */
  /* img2 — 좌우 나눔 배너에서 **텍스트 칸에 깔 두 번째 사진**.
     넣으면 우측 칸이 단색 패널이 아니라 사진이 되고 문구가 그 위에 얹힌다(OTHER 시안 히어로 형태).
     안 넣으면 기존 단색 패널 그대로 — 다른 업종·다른 프리셋은 이 값을 보지 않는다. */
  function cbi(img, sub, title, desc, btn, pos, img2) {
    return { bg: '', img: img, img2: img2 || '', pos: (pos == null ? 6 : pos), link: '',
      sub:   { show: !!sub,   text: sub || '' },
      title: { show: !!title, text: title || '' },
      desc:  { show: !!desc,  text: desc || '' },
      btn:   { show: !!btn,   text: btn || '' } };
  }

  /* 위젯 키가 콘텐츠 배너의 어느 프리셋을 뜻하는지 — 키 목록만으로 스타일까지 지정한다.
     (시안 실측 스펙은 sp.style 을 직접 들고 있어서 그쪽이 우선한다) */
  var KEY_STYLE = { 'content-banner-3': 'threecell' };

  function mk(sp) {
    var t = MAP[sp.w]; if (!t) return null;
    var i = ind(), b = AS + i.img + '/', m = i.menu || [], pool = cat();
    var p = pimg;
    var img = sp.img ? A(sp.img) : null;
    var pick = function (idxs) { return idxs.map(function (x) { return pool[x % pool.length]; }); };

    switch (t) {
      case 'contentbanner': {
        var cbs = sp.style || KEY_STYLE[sp.w];
        /* 「세 칸 배너」 — 배너 3개를 나란히. 같은 페이지에 넓은 배너가 이미 서 있으므로
           내용은 겹치지 않게 카테고리 프로모로 채운다(같은 카피가 두 번 나오면 붙여넣기로 읽힌다).
           할인율·기간 같은 숫자는 넣지 않는다 — 시안이 근거를 갖고 있지 않다. */
        if (cbs === 'threecell') {
          var tc = { type: 'contentbanner', style: 'threecell', sel: 0,
            title: sp.title || '', subtitle: sp.desc || '',
            text: { color: '', btnShow: true, btnStyle: 'fill', btnColor: '', contentGap: 16, textGap: 12 },
            items: null };
          /* sp.cards — 시안이 칸마다 다른 사진·문구를 갖는 경우(2단 배너·에디토리얼 3컷).
             없으면 아래 기본 3칸(카테고리 프로모)으로 떨어진다. */
          if (sp.cards) {
            tc.items = sp.cards.map(function (c) {
              var it = cbi(A(c.img), c.kicker, c.title, c.desc, c.btn);
              /* 시안이 칸 비율을 적어 두면 그대로 쓴다(sp.ratio). 이걸 버리면 CSS 기본값이
                 먹는데, 2분할 기본은 4:3 이라 **가로로 긴 시안 컷이 통째로 잘린다** —
                 건기식 혜택 배너(1250×400, 3.13:1)가 4:3 안에서 가운데 32% 만 남아
                 피사체가 사라지고 빈 판만 보였다(모바일에서 특히 크게 보인다).
                 인라인이라 `.cb-grid--2 .is-cell` 의 aspect-ratio 를 이긴다. */
              if (sp.ratio) it.ar = sp.ratio;
              /* 도판이 오른쪽에 있는 시안 칸은 글을 왼쪽 페이드 영역 안에 묶는다 —
                 안 그러면 긴 설명 줄이 도판 위로 넘어가 겹친다(시안도 좌측 텍스트다). */
              if (sp.textWidth) it.txw = sp.textWidth;
              return it;
            });
            return tc;
          }
          tc.items = [ cbi(p(2), m[2] || '신상품',  (m[2] || '신상품') + ' 새로 입고', '이번 주 들어온 것부터', '보러 가기'),
                       cbi(p(5), '이번 주',        '시즌 오프',                      '지금이 가장 좋은 가격',  '기획전 보기'),
                       cbi(p(8), m[1] || '베스트',  i.ref + ' 베스트',               '가장 많이 담은 상품',    '전체 보기') ];
          return tc;
        }
        if (cbs === 'split') {
          return { type: 'contentbanner', style: 'split', sel: 0,
            text: { color: '', btnShow: true, btnStyle: 'fill', btnColor: '', contentGap: 24, textGap: 14 },
            items: [ cbi(img || cutOf(i, 'hero.jpg'), sp.kicker, sp.title, sp.desc, sp.btn, sp.pos,
                         sp.img2 ? A(sp.img2) : '') ] };
        }
        /* 시안이 「사진 한 장 위에 글이 얹힌 배너」인 경우 — 슬라이드를 만들지 않고 한 장만 쓴다.
           스펙이 자기 문구·사진·정렬을 들고 있으므로 아래 3슬라이드 기본값으로 떨어뜨리면 안 된다. */
        if (cbs === 'wide' && (sp.title || sp.img)) {
          return { type: 'contentbanner', style: 'wide', sel: 0,
            text: { color: '', btnShow: true, btnStyle: 'fill', btnColor: '', contentGap: 24, textGap: 14 },
            items: [ cbi(img || cutOf(i, 'hero.jpg'), sp.kicker, sp.title, sp.desc, sp.btn, sp.pos) ] };
        }
        /* 시안 실측이 없는 업종도 「로고 구워 넣은 대표컷 + 하단 중앙 문구」 히어로를 가질 수 있다
           (LIEN 이 시안으로 하는 걸 heroBanner 필드로 선언한다). 첫 콘텐츠 배너에만 적용한다.
           제목은 두지 않는다 — 로고가 이미 사진에 박혀 있어서 브랜드가 두 번 나온다. */
        if ((sp.nth || 0) === 0 && i.heroBanner) {
          var hb = i.heroBanner;
          return { type: 'contentbanner', style: 'wide', sel: 0,
            text: { color: '', btnShow: true, btnStyle: 'fill', btnColor: '', contentGap: 24, textGap: 14 },
            items: [ cbi(heroOf(i), hb.kicker, hb.title, hb.desc || i.slogan,
                         hb.btn || '브랜드 스토리', hb.pos == null ? 7 : hb.pos) ] };
        }
        return { type: 'contentbanner', style: 'wide', sel: 0,
          text: { color: '', btnShow: true, btnStyle: 'fill', btnColor: '', contentGap: 24, textGap: 14 },
          items: [ cbi(cutOf(i, 'hero.jpg'),  i.ref + ' · 이번 주 기획전', i.slogan, '', '지금 보기'),
                   cbi(cutOf(i, 'split.jpg'), m[1] || '베스트', i.n + ' 베스트', '', '전체 보기'),
                   cbi(p(4),            m[0] || '신상품', '새로 들어온 상품', '', '새 상품 보기') ] };
      }

      case 'product': {
        var want = sp.items ? sp.items.length : 8;
        var g = grid(want);
        /* 두 번째·세 번째 상품 그리드는 제목과 진열 상품을 밀어 다르게 보이게 한다 —
           같은 그리드가 반복되면 풍성한 게 아니라 붙여넣기로 읽힌다. */
        var PT = ['추천 상품', '이번 주 신상품', '다시 담는 상품'];
        var off = (sp.nth || 0) * 4;
        var rolled = pool.slice(off % (pool.length || 1)).concat(pool.slice(0, off % (pool.length || 1)));
        var items = (sp.items ? pick(sp.items) : rolled).slice(0, g.n);
        /* sp.desc 가 있으면 시안의 섹션 부제를 그대로 쓴다(없으면 기존대로 전체보기/밀도 표기) */
        return { type: 'product', title: sp.title || PT[(sp.nth || 0) % PT.length],
          subtitle: sp.desc || (sp.more ? '전체보기 ›' : bandName()), cols: g.cols, items: items };
      }

      /* sp.tabs — 시안의 탭 이름이 헤더 메뉴와 다를 때(LOTS 는 채소·고기·파스타) */
      /* 대표 상품 — 파는 게 하나일 때 그 하나를 크게 세운다(Figma 6224:11071).
         상품값(이름·설명·판매가·정가·할인율)은 전부 풀의 첫 상품에서 온다 — 지어내지 않는다. */
      case 'mainproduct': {
        var m0 = pool[0] || {};
        return { type: 'mainproduct', prod: {
          name: m0.name || i.n, desc: m0.desc || i.slogan, img: m0.img,
          price: m0.price, orig: m0.orig || '', sale: m0.sale || '' }, qty: 1 };
      }

      case 'sale': return { type: 'sale', title: sp.title || '카테고리별 상품',
        subtitle: sp.desc || '탭을 눌러 카테고리를 바꿔보세요', tabs: sp.tabs || m.slice(0, 5),
        active: 0, more: true, catCount: cap('tab'), align: 'center' };

      case 'video': return { type: 'video', img: img || cutOf(i, 'hero.jpg'), align: 'left',
        titleShow: true, descShow: true,
        title: sp.title || (i.ref + ' 브랜드 스토리'),
        desc: sp.kicker || '영상으로 먼저 만나보세요',
        /* 「영상 보기」 버튼은 뺐다 — 우리가 지어낸 기본 문구였고, 영상 배너 자체가 이미
           누르면 재생되는 자리라 그 위에 버튼을 또 얹을 이유가 없다. 시안이 실제로
           버튼을 그려 둔 업종에서만(sp.btn) 그 문구 그대로 남긴다. */
        url: '', btnShow: !!sp.btn, btnStyle: 'accent', btnText: sp.btn || '', btnLink: '' };

      /* 시안(FEATURED ITEM)은 **좌 텍스트 / 우 이미지** 에 외곽선 버튼이다. 위젯 기본값은
         좌 이미지 / 우 텍스트 + 채움 버튼이라 8업종 전부 시안과 좌우가 뒤집혀 있었다.
         layout 은 위젯이 이미 갖고 있는 값(image-right)이라 없는 기능을 만든 게 아니다. */
      /* sp.btn === null → 시안에 버튼이 없는 섹션. 빈 문자열은 기본값으로 떨어지므로
         cfg.ctaTextVisible 로 꺼야 한다(렌더러가 cfg 를 먼저 읽는다). 안 그러면 시안에
         없는 「컬렉션 보기」 버튼이 붙는다 — MODUM 마무리 에디토리얼에서 실제로 그랬다. */
      case 'imagetext': {
        var noBtn = (sp.btn === null);
        var itLay = sp.layout || 'image-right';
        /* layout 은 **cfg 로** 넘겨야 한다 — 캔버스를 그리는 _wrender 는 스키마 값(w.cfg)만
           읽으므로 top-level `layout` 은 무시되고 항상 기본값 'image-left' 가 먹었다.
           그래서 「좌 텍스트 / 우 이미지」로 잡아 둔 섹션이 전부 반대로 나왔다. */
        var itCfg = { layout: itLay };
        if (noBtn) itCfg.ctaTextVisible = false;
        return { type: 'imagetext', img: img || cutOf(i, 'split.jpg'),
          layout: itLay, btnStyle: sp.btnStyle || 'outline',
          eyebrow: sp.kicker || 'FEATURED ITEM',
          title: sp.title || i.slogan,
          desc: sp.desc || (i.n + ' — ' + i.ref + ' 컬렉션'),
          btn: noBtn ? '' : (sp.btn || '컬렉션 보기'),
          cfg: itCfg };
      }

      case 'category': {
        /* 열 수를 **항목 수에 맞춘다**. 8열 고정이라 메뉴가 4개뿐인 업종(LOTS)에서는
           동그라미 4개가 왼쪽 절반에 몰리고 오른쪽이 비었다. 열을 항목 수로 잡고
           렌더러에서 가운데로 모아(justify-content:center) 어느 업종이든 가운데 정렬된다. */
        /* 모바일은 **4열**. 위젯 기본값은 2열인데, 402px 폭 안에서 동그라미 하나가
           화면의 3분의 1을 먹어 카테고리 네 개가 두 화면에 걸쳐 놓였다. 4열은 스키마가
           허용하는 최대값(min2·max4)이라 없는 값을 만든 게 아니다. */
        var cs = m.slice(0, 8);
        return { type: 'category', title: sp.title || '카테고리',
          subtitle: sp.desc || '찾는 것부터 바로', columns: cs.length || 1,
          cfg: { columnsMobile: 4 },
          items: cs.map(function (n, j) { return { name: n, img: p(j) }; }) };
      }

      case 'photoreview': return { type: 'photoreview',
        headTitle: sp.title || 'Photo review',
        items: (i.reviews || RV).map(function (r, j) {
          return { img: r.img ? A(r.img) : p(j + 4), thumbs: [],
            title: r.t, text: r.x,
            prod: r.by || (pool[j % pool.length] || {}).name || '',
            pimg: r.by ? '' : p(j) };
        }) };

      case 'contentgrid': {
        /* 속성 패널 「표시할 상품 수」는 2·3·4 를 준다. 시안이 카드에 1~2개만 깔아 뒀어도
           고를 수 있는 최대치(4)까지는 상품을 들고 있어야 골랐을 때 캔버스가 바뀐다.
           모자란 만큼만 상품 풀에서 이어 붙인다 — 이미 있는 시안 상품은 앞자리를 지킨다. */
        var cgFill = function (idxs, j) {
          var out = idxs.slice(), n = pool.length || 1, k = 0;
          while (out.length < 4) {
            var cand = (j * 3 + k) % n;
            if (out.indexOf(cand) < 0) out.push(cand);
            k++;
            if (k > n) break;                 /* 풀 자체가 4개 미만이면 있는 만큼만 */
          }
          return out;
        };
        /* 칸(카테고리 프로모)마다 서로 다른 상품으로 들어가는 게 이 위젯의 목적이다 —
           파는 게 1종이면 칸 셋이 전부 같은 상품을 가리키므로 한 칸으로 줄인다. */
        var cells = (band() === 'one') ? 1 : 99;
        var w = newContentGrid();
        w.head.title = sp.title || (i.n + ' 추천');
        w.head.sub = sp.desc || i.slogan;
        /* sp.cards — 시안이 카드마다 다른 대표컷·영문 카테고리명·딸린 상품을 갖는 경우.
           없으면 기존 파생 로직(메뉴 이름 + p(j*3))을 그대로 쓴다. */
        if (sp.cards) {
          w.items = sp.cards.slice(0, cells).map(function (c, j) {
            var idxs = cgFill(c.items || [0], j);
            return { img: A(c.img), title: c.title,
              descShow: true, desc: c.desc || '', link: '', displayNo: 1,
              /* count 는 시안이 실제로 깔아 둔 개수 — 첫 렌더는 시안 그대로다.
                 products 는 4개까지 채워 둔다(아래 cgFill). 속성 패널의
                 「표시할 상품 수」가 2~4 를 주는데 풀이 그보다 짧으면 골라도 화면이 안 바뀐다. */
              count: Math.min((c.items || []).length || 1, cap('card')),
              products: pick(idxs).map(function (x) {
                x = x || {};
                return { name: x.name, img: x.img, sale: x.sale || '', price: x.price };
              }) };
          });
          return w;
        }
        w.items = [0, 1, 2].slice(0, cells).map(function (j) {
          return { img: p(j * 3), title: (m[j + 1] || '추천') + ' 모아보기',
            descShow: true, desc: i.slogan, link: '', displayNo: 1, count: cap('card'),
            products: [0, 1, 2, 3].map(function (q) {
              var c = pool[(j * 3 + q) % pool.length] || {};
              return { name: c.name, img: c.img, sale: c.sale || '', price: c.price };
            }) };
        });
        return w;
      }

      /* 쇼츠 섬네일은 상품 사진이 아니라 **세로로 세운 영상 한 장**이다. 카탈로그 컷은 흰 배경
         상품컷이라 9:16 으로 늘리면 영상으로 읽히지 않고, 상품 수를 1개로 고르면 풀이 한 장뿐이라
         렌더러가 네 칸(보이는 개수 기본값)을 같은 사진으로 채워 버린다.
         시안에 세로 라이프스타일 컷이 있는 업종(`sp.imgs`)은 그걸 섬네일로 삼고,
         이름·가격 태그만 카탈로그에서 돌려 붙인다 — 1종 몰이면 「같은 상품의 영상 여러 개」가 된다.
         visibleCount 도 슬라이드 수로 맞춰 빈 칸이나 복제 칸을 만들지 않는다. */
      case 'shorts': {
        var shImgs = sp.imgs || [];
        var shN = shImgs.length ? Math.min(shImgs.length, 5) : cap('short');
        var shList = [];
        for (var shJ = 0; shJ < shN; shJ++) {
          var shC = pool[shJ % pool.length] || {};
          var shImg = shImgs.length ? A(shImgs[shJ]) : (shC.img || p(shJ));
          shList.push({ img: shImg, count: 1,
            prod: { name: shC.name, price: shC.price, img: shC.img || shImg } });
        }
        return { type: 'shorts', title: sp.title || ('쇼츠로 보는 ' + i.n),
          subtitle: '영상 속 상품, 바로 담으세요', cur: 2,
          cfg: { visibleCount: Math.max(1, shList.length) }, slides: shList };
      }

      /* 매거진 게시판 — 커버 1장 + 썸네일 3장. 사진은 넘기지 않는다: 렌더러가 IMG 풀
         (`pool()` = IMG.radiance·balance…)에서 뽑고, 그 IMG 를 applyIndustry() 가 이미
         업종 사진으로 갈아 뒀으므로 저절로 업종을 따라간다. 제목·글 제목도 넘기지 않아
         위젯 기본 문구가 나온다 — 매거진 글 제목은 시안 근거가 없어 지어내지 않는다. */
      case 'magazine': {
        var mg = { type: 'magazine' };
        if (sp.title) mg.title = sp.title;
        if (sp.desc)  mg.subtitle = sp.desc;
        return mg;
      }

      /* 스크롤 배너 — 문구는 업종 데이터에서 가져온다. 렌더러 기본값이 뷰티(ZIGT) 카피라
         그대로 두면 어느 업종에서나 「ZIGT 는 이너 웰니스와…」가 나온다(지어낸 문구가 아니라
         **남의 업종 문구**라 더 나쁘다). 버튼은 시안 근거가 없으면 켜지 않는다. */
      case 'brandbanner': return { type: 'brandbanner',
        img: img || cutOf(i, 'split.jpg'),
        title: sp.title || i.slogan,
        sub: sp.desc || (i.bullets || [])[0] || (i.n + ' · ' + i.ref),
        textPos: 'center', btnShow: !!sp.btn, btnText: sp.btn || '' };

      /* 이미지 위젯의 높이는 위젯 실제 필드(height·padX)다 — 시안 렌더를 그대로 얹는 자리에서는
         박스 비율을 그림 비율에 맞춰야 한다. 렌더러가 center/cover 로 깔기 때문에, 340px 기본값에
         3.3:1 짜리 띠 그림을 넣으면 좌우가 잘려 그림 안의 글이 날아간다. */
      case 'image': {
        var imCfg = {};
        if (sp.height != null) imCfg.height = sp.height;
        if (sp.padX != null) imCfg.padX = sp.padX;
        return { type: 'image', img: img || cutOf(i, 'split.jpg'),
          cfg: Object.keys(imCfg).length ? imCfg : undefined };
      }
      case 'text': {
        /* 업종별 3줄(bullets)을 본문으로 — 예전엔 slogan 을 다시 써서 이미지+텍스트와 겹쳤다 */
        var tdesc = [sp.kicker, sp.desc].filter(Boolean).join(' · ')
              || (i.bullets || []).join(' · ') || (i.ref + ' — ' + i.n);
        var ttitle = sp.title || (i.n + ', 이렇게 고릅니다');
        /* 컨셉 프리셋의 텍스트 섹션은 **이미지 텍스트 위젯**(좌 텍스트 / 우 이미지)으로 낸다.
           리뷰 요청이 "좌측 텍스트 우측 이미지"였고, 텍스트 위젯(text-block) 스키마엔 이미지·
           레이아웃 필드가 아예 없다(제목·본문·정렬·색·배경색뿐) — 거기에 사진을 넣는 건 위젯에
           없는 기능을 만드는 것이다. 그 배치는 이미지 텍스트 위젯의 layout:'image-right' 가
           실제로 갖고 있는 값이므로 그쪽으로 보낸다.
           eyebrow·CTA 는 끈다 — 원래 텍스트 섹션엔 없던 줄이다(문구를 지어내지 않는다).
           사진은 p(8): 상품 그리드가 쓰는 p(0)~p(7) 과 이미지 텍스트가 쓰는 split.jpg 를 피한 자리다.
           **시안 실측 섹션(figmaMode)은 그대로 텍스트 위젯**이다 — 시안이 사진 없는 문구 블록
           (리앙 브랜드 미션·혜택 2블록)이라, 사진을 붙이면 시안에 없는 것을 만들게 된다. */
        if (figmaMode()) return { type: 'text', title: ttitle, desc: tdesc };
        return { type: 'imagetext', layout: 'image-right', img: p(8),
          title: ttitle, desc: tdesc, btn: '',
          cfg: { eyebrowVisible: false, ctaTextVisible: false } };
      }
      /* i.notice 는 헤더 announcement 로 이미 나간다 — 여기서 다시 쓰면 같은 문구가 두 줄이 된다 */
      case 'strip':     return { type: 'strip', text: sp.text || i.strip || (i.slogan + ' · ' + i.ref) };
      /* endAt 을 심는다 — 렌더러는 endAt 이 있을 때만 초침을 돌리고, 없으면 정적
         「02:14:37」에 멈춰 있다. 카운트다운이 안 움직이면 3초만 봐도 죽은 배너로
         읽힌다(갤러리 설명도 「실시간」이라고 말한다). 시각은 그 정적 기본값과 같은
         2시간 14분 37초 뒤 — 첫인상은 그대로 두고 살아만 있게 한다. */
      case 'countdown': return { type: 'countdown',
        cfg: { endAt: new Date(Date.now() + ((2 * 60 + 14) * 60 + 37) * 1000).toISOString() } };
    }
    return null;
  }

  /* ── PAGE 재조립 → 빌더 재렌더 ──────────────────────────────────────── */
  function seed() {
    applyIndustry();
    var i = ind(), b = AS + i.img + '/';

    PAGE.header.logo   = i.ref;
    /* 업종 메뉴 = 상품분류 대분류. 여기에 게시판 대분류(고객센터)를 하나 얹는다 —
       카페24 몰이면 거의 다 갖고 있고, 메뉴 구조에서 '게시판은 주소를 갖는다'가 드러난다. */
    PAGE.header.menu   = i.menu.map(function (n) { return { name: n, subs: [] }; });
    /* 게시판 대분류(고객센터)를 하나 보장한다 — 이미 있으면 얹지 않고 하위만 채운다.
       (LOTS 시안 메뉴처럼 고객센터가 이미 있는 업종에서 둘이 되는 걸 막는다) */
    var BOARDS = ['공지사항', '1:1 문의'];
    var cs = PAGE.header.menu.filter(function (m) { return /고객센터|게시판|커뮤니티/.test(m.name); })[0];
    if (cs) { if (!cs.subs || !cs.subs.length) cs.subs = BOARDS.slice(); }
    else PAGE.header.menu.push({ name: '고객센터', subs: BOARDS.slice() });
    PAGE.header.tree   = null;   /* 메뉴가 갈렸으니 4단 트리도 다시 만든다 (_hmenu.js) */
    PAGE.header.active = 0;
    /* 시안의 announcement 띠는 헤더 소속이다 — 별도 띠배너 위젯으로 만들지 않는다 */
    PAGE.header.coupon = i.notice || i.slogan;

    PAGE.hero.slides = [
      { img: IMG.hero, eyebrow: '', title: i.slogan, desc: i.n + ' · ' + i.ref, btn: '지금 보기' },
      { img: cutOf(i, 'split.jpg'), eyebrow: '', title: i.n + ' 베스트', desc: '가장 많이 담은 상품', btn: '전체 보기' }
    ];
    PAGE.hero.cur = 0;

    S.skipped = []; S.approx = [];
    var list = sections();
    if (figmaMode() && i.notice) S.approx.push('상단 공지 띠는 헤더에 넣었다(시안도 헤더 소속이다)');

    PAGE.widgets = list.map(function (sp) {
      var w = mk(sp);
      if (!w) {
        if (MISSING[sp.w] && S.skipped.indexOf(MISSING[sp.w]) < 0) S.skipped.push(MISSING[sp.w]);
        return null;
      }
      if (sp.approx && S.approx.indexOf(sp.approx) < 0) S.approx.push(sp.approx);
      return w;
    }).filter(Boolean);

    /* 보던 페이지를 그대로 둔다 — 메인으로 튕기면 업종을 바꿔가며 상세페이지를 비교할 수가 없다.
       renderCanvas() 가 curPage 기준으로 다시 그리므로 상세에 있으면 상세가 갱신된다. */
    renderCanvas();
    /* 패럴랙스는 스크롤 이벤트로만 갱신된다 — 새로 그린 직후 한 번 재 두지 않으면
       스크롤을 건드리기 전까지 안쪽 이미지가 시작 위치에 멈춰 있다. */
    try { updateParallax(); } catch (e) {}
    try { clearSelection(); } catch (e) {}
  }

  /* ── 게이트 UI ──────────────────────────────────────────────────────── */
  function summary() {
    var i = ind();
    var mis = (i.catalog || []).filter(function (c) { return c.mismatch; });
    var h = '<div class="onb__sum"><b>' + i.n + '</b> · ' + bandName() + ' · ' + conceptName() +
      ' → 빌더에 <b>위젯 ' + PAGE.widgets.length + '개</b> · 메뉴 ' + i.menu.length +
      '개 · 상품 ' + cat().length + '종을 넣었습니다.';

    if (figmaMode()) {
      h += '<u>✓ Figma <b>' + i.src + '</b> 실측 — 섹션 순서 · 문구 · 상품명 · 할인율 · 정가 · 이미지를 시안 그대로 옮겼습니다.</u>';
      if (mis.length) h += '<u>⚠ <b>시안 자체가 상품명과 사진이 어긋납니다</b>(' + mis.length +
        '장). 고치지 않고 시안 그대로 뒀습니다 — ' + mis.map(function (c) { return c.n; }).join(' · ') + '</u>';
    } else {
      h += '<u>이 업종은 <b>섹션 순서만</b> 시안이고 상품명·가격은 근사치입니다 — 실측 전.</u>';
    }
    if (S.skipped.length) h += '<u>이 빌더 클론에 렌더러가 없어 뺀 위젯: ' + S.skipped.join(' · ') + ' — 근사치로 그리지 않았습니다.</u>';
    if (S.approx.length) h += '<u>근사 처리: ' + S.approx.join(' / ') + '</u>';
    return h + '</div>';
  }

  /* ── 항목 내용(프래그먼트) ────────────────────────────────────────────
     다섯 항목의 **옵션 마크업은 셋이 공유한다**. A/B/C 는 이걸 어디에 담느냐만
     다르고, 카드가 그리드로 보일지 목록으로 보일지는 CSS 가 `[data-lay]` 로 정한다.
     (마크업까지 갈라 놓으면 세 시안의 차이에 「내용 차이」가 섞여 비교가 흐려진다.) */
  function fragInd() {
    var h = '<div class="catg">' + CATS.map(function (c) {
      return '<button class="chip" aria-pressed="' + (S.cats.indexOf(c.k) >= 0) + '" data-cat="' + c.k + '">' + c.n + '</button>';
    }).join('') + '</div><div class="ig">';
    var shown = Object.keys(INDS).filter(function (k) { return catsOn(INDS[k]); });
    shown.forEach(function (k) {
      var x = INDS[k];
      /* 슬로건(서브텍스트)은 뺐다 — 업종을 고르는 데 필요한 건 사진과 이름이고,
         10개 카드에 한 줄씩 붙은 카피는 읽히지 않으면서 카드 높이만 늘렸다. */
      h += '<button class="ic" aria-pressed="' + (S.ind === k) + '" data-ind="' + k + '">' +
        '<span class="ic__th" style="background-image:url(' + thumbOf(x) + ')"></span>' +
        '<b>' + x.n + '</b></button>';
    });
    if (!shown.length) h += '<div class="cat0">고른 분류에 해당하는 업종이 없습니다.</div>';
    return h + '</div>';
  }
  function fragCnt() {
    var h = '<div class="cg">';
    CNTS.forEach(function (c) {
      var on = (c.v <= 1 && band() === 'one') || (c.v === 6 && band() === 'two') || (c.v === 24 && band() === 'tabs');
      h += '<button class="cc" aria-pressed="' + on + '" data-cnt="' + c.v + '"><b>' + c.n + '</b><span>' + c.d + '</span></button>';
    });
    return h + '</div>';
  }
  /* 「전환율 중심 / 브랜딩 중심 …」 은 이름만으로는 무엇이 달라지는지 알 수 없다. 넷을 가르는
     것은 딱 하나 — **섹션 순서**다. 그래서 카드에 그 몰의 앞 네 구역을 그대로 적고, 상품 진열이
     몇 번째로 오는지를 배지로 붙인다. `main` 배열에서 뽑으므로 순서를 고치면 카드 글도 따라
     바뀐다(손으로 쓴 설명은 배열이 바뀌는 순간 거짓말이 된다). */
  var SEC_KO = { 'content-banner': '배너', 'category-shortcut': '카테고리', 'product-grid': '상품 진열',
    'content-banner-3': '혜택 배너', 'category-tabs': '상품 탭', 'contents-product-grid': '기획전',
    'split-banner': '이미지+글', 'photo-review': '포토리뷰', 'image': '이미지',
    'shorts-carousel': '쇼츠', 'video-banner': '영상', 'text-block': '글',
    'magazine-board': '매거진', 'scroll-banner': '스크롤 배너' };
  /* 굵게 칠할 한 칸 = **그 자리에 그것을 놓은 프리셋이 여기뿐인 첫 자리**.
     셋이 다 배너로 시작하므로 1번 칸은 아무 정보가 없고, 「배너 다음 칸」으로 고정해도
     배너 뒤 한 칸으로 고정해도 정체가 안 드러난다. 남과 겹치지 않는 첫 자리를
     찾으면 전환율=상품 진열 · 브랜딩=카테고리 · 정보신뢰=후기 가 잡힌다 —
     그게 각 프리셋의 정체다. 비교 대상이 없으면(시안 그대로) 두 번째 칸을 쓴다. */
  function conLead(keys, others) {
    /* 비교 대상이 없으면(시안 그대로 카드) 아래 루프가 첫 칸을 「남과 안 겹친다」로 잡는다 —
       셋이 다 배너로 시작하므로 배너에 밑줄이 가면 아무 정보가 없다. 두 번째 칸으로 고정한다. */
    if (!others.length) return keys.length > 1 ? 1 : 0;
    for (var j = 0; j < Math.min(4, keys.length); j++) {
      var mine = keys[j], alone = true;
      for (var o = 0; o < others.length; o++) if (others[o][j] === mine) { alone = false; break; }
      if (alone) return j;
    }
    return keys.length > 1 ? 1 : 0;
  }
  function conSeq(keys, others) {
    var lead = conLead(keys, others || []);
    return keys.slice(0, 4).map(function (x, j) {
      var nm = SEC_KO[x] || x;
      return (j === lead) ? '<i>' + nm + '</i>' : nm;
    }).join(' · ') + ' …';
  }
  /* 프리셋끼리 비교할 순서 배열들 — 자기 자신은 뺀다 */
  function conOthers(skip) {
    return Object.keys(CONCEPTS).filter(function (k) { return k !== skip; })
      .map(function (k) { return CONCEPTS[k].main || []; });
  }
  /* 「시안 그대로」라는 **말**은 여전히 쓰지 않는다 — 「시안」·「LOTS 실측」은 우리끼리 쓰는
     말이고, 몰을 만드는 사람에게는 고를 근거가 되지 않는다(③ 요약에서도 걷어낸 표현).
     다만 카드 자체는 「기본 구성」으로 되살린다 — 카드를 아예 빼 두면 시작 상태(origin)로
     **돌아올 길이 없어서**, 프리셋을 한 번 눌러 보는 순간 원래 구성을 잃는다(비가역).
     이 화면의 존재 이유가 「아무거나 눌러 보고 오른쪽을 본다」인데, 눌러 본 대가로
     처음 화면을 잃으면 안 된다. 원래 구성이 있는(시안 실측) 업종에만 낸다 —
     없는 업종은 돌아갈 '원래'가 없다. */
  function fragCon() {
    var h = '<div class="pset">';
    if (ind().figma) {
      var om = ind().layout || [], opi = om.indexOf('product-grid') + 1;
      h += '<button class="pcard" aria-pressed="' + (S.concept === 'origin') + '" data-con="origin">'
        + '<b>기본 구성' + (opi ? '<em>상품 ' + opi + '번째</em>' : '') + '</b>'
        + '<span>' + conSeq(om, conOthers('origin')) + '</span></button>';
    }
    Object.keys(CONCEPTS).forEach(function (k) {
      var c = CONCEPTS[k], m = c.main || [], pi = m.indexOf('product-grid') + 1;
      h += '<button class="pcard" aria-pressed="' + (S.concept === k) + '" data-con="' + k + '">'
        + '<b>' + c.n + (pi ? '<em>상품 ' + pi + '번째</em>' : '') + '</b>'
        + '<span>' + conSeq(m, conOthers(k)) + '</span></button>';
    });
    return h + '</div>';
  }
  function fragStyle() {
    var h = '<div class="sw">';
    BRANDS.forEach(function (b) {
      h += '<button class="sw__b" aria-pressed="' + (S.brand === b.c) + '" data-brand="' + b.c + '" title="' + b.n + '" style="background:' + b.c + '"></button>';
    });
    h += '<label class="sw__c"><input type="color" data-brandc value="' + S.brand + '" /><span>직접</span></label></div>';
    h += '<div class="fg">';
    FONTS.forEach(function (f) {
      h += '<button class="fc" aria-pressed="' + (S.font === f.k) + '" data-font="' + f.k + '">' +
        '<b style="font-family:' + f.head.replace(/"/g, '&quot;') + '">' + f.n + '</b><span>' + f.d + '</span></button>';
    });
    return h + '</div>';
  }
  /* 세 축을 한 화면에 — 소제목으로만 나눈다(각각을 카드 박스로 감싸면 세 덩이로 다시 쪼개진다).
     ⚠ 소제목 아래 설명 한 줄(`.mgrp__s`)은 넷 다 걷었다 — 옵션 카드가 이미 자기 설명을
     들고 있고(「1개 / 대표 상품 하나만 크게」), 오른쪽 몰이 고르는 즉시 답을 보여 준다.
     화면이 하는 일을 글로 다시 설명하지 않는다(「즉시 바뀝니다」 배지를 뺀 것과 같은 이유다). */
  function mgrp(t, body, opt) {
    return '<div class="mgrp"><div class="mgrp__h"><b>' + t + '</b>' +
      (opt ? '<em>선택</em>' : '') + '</div>' + body + '</div>';
  }
  /* 내 상품 사진 — 몰이 「내 몰」로 보이기 시작하는 지점이다. 업종 사진은 어디까지나
     예시라, 한 장이라도 내 사진이 올라가면 오른쪽이 남의 몰에서 내 몰로 바뀐다.
     ⚠ 「몇 장을 몇 번 상품에 얹었나」 상태 문구(`.mup__s`)는 걷었다 — 그 정보는 썸네일
     아래 번호 라벨(1번·2번…)이 이미 들고 있고, 오른쪽 몰에 내 사진이 뜨는 게 최종 답이다.
     남는 건 자리(박스)와 결과(썸네일)와 취소(× · 전부 빼기)뿐이다. */
  function fragMy() {
    var n = S.myImgs.length;
    var thumbs = S.myImgs.map(function (u, j) {
      return '<span class="myth"><i style="background-image:url(\'' + u + '\')"></i>'
        + '<b>' + (j + 1) + '번</b>'
        + '<button class="myth__x" data-myrm="' + j + '" title="이 사진 빼기">×</button></span>';
    }).join('');
    /* ＋ 타일은 사진이 있든 없든 **늘 마지막 칸에** 선다 — 「여기 더 넣을 수 있다」를 빈 상태에서만
       알려 주면 한 장 올린 뒤 두 번째를 어디서 올리는지가 사라진다(이 항목에서 가장 자주 하는 일이 그것이다).
       label 이라 누르면 브라우저가 직접 파일 창을 연다 — JS 로 또 열면 창이 두 번 뜬다. */
    var add = '<label class="myadd" title="사진 추가"><span>＋</span><b>추가</b>'
      + '<input type="file" accept="image/*" multiple data-myup hidden></label>';
    return '<div class="mdz" data-mydz>'
      + '<div class="myths">' + thumbs + add + '</div>'
      /* 안내문은 빈 박스에만 — 사진이 한 장이라도 들어오면 그 박스가 이미 「사진이 놓이는 자리」로 읽힌다 */
      /* 서브 텍스트(「눌러서 골라도 됩니다 · 여러 장 한 번에」)는 뺐다 — 바로 옆 ＋ 타일이
         누르는 자리를 이미 보여 주고, `multiple` 이라 여러 장은 파일 창이 알려 준다.
         한 줄로 되는 안내에 두 줄을 쓰면 빈 박스가 설명서처럼 읽힌다. */
      + (n ? '' : '<div class="mdz__hint"><b>사진을 이 안으로 끌어다 놓으세요</b></div>')
      + '</div>'
      + (n ? '<div class="mup"><button class="mup__clr" data-myclr="1">전부 빼기</button></div>' : '');
  }
  function fragMall() {
    return mgrp('판매 상품은 몇 개인가요', fragCnt())
         + mgrp('내 상품 사진', fragMy(), 1)
         + mgrp('어디에 무게를 두시겠어요', fragCon())
         + mgrp('색과 글꼴', fragStyle(), 1);
  }
  /* 위젯 — 「갤러리 열기」 버튼 하나였다. 그러면 지금 이 몰에 무엇이 몇 개 쌓여 있는지
     왼쪽에서는 알 수가 없고(오른쪽을 끝까지 굴려야 안다) 순서도 못 바꾼다.
     그래서 **레이어 목록**을 깐다 — 위가 페이지 위쪽, 끌어서 옮기거나 ▲▼ 로 한 칸씩,
     이름을 누르면 오른쪽이 그 위젯으로 간다.
     ⚠ 업종·상품 수·구성을 다시 고르면 페이지를 새로 쌓으므로(seed) 손으로 바꾼 순서는
       풀린다 — 그 사실을 목록 아래에 적어 둔다. 모르면 「내가 옮긴 게 왜 풀렸나」가 된다. */
  function wlabel(w) {
    try { return widgetLabel(w); } catch (err) { return (w && w.type) || '위젯'; }
  }
  function fragWg() {
    /* 상세페이지를 보고 있으면 **다른 질문**을 낸다 — 이 목록(PAGE.widgets)은 메인 화면의
       위젯 스택이고, 상세페이지 캔버스에는 `widget:N` 노드가 하나도 없다. 그대로 두면
       줄을 눌러도 갈 곳이 없어 아무 일이 안 일어난다(= 이 작업의 출발점이 된 그 증상). */
    if (onDetail()) return fragDp();
    var ws = (window.PAGE && PAGE.widgets) || [];
    var rows = ws.map(function (w, j) {
      /* 맨 앞 손잡이(⣿) — 「끌어서 순서를 바꾸세요」 같은 안내문 대신 **잡는 자리**를 보여 준다.
         상세페이지 디자인 설정의 탭 목록이 이미 같은 글리프를 쓰므로 같은 뜻으로 읽힌다.
         드래그는 줄 전체가 받는다(draggable 은 li) — 손잡이는 신호이고 잡는 데 필수는 아니다. */
      return '<li class="lyr" draggable="true" data-lyr="' + j + '">' +
        '<span class="lyr__g" aria-hidden="true">⣿</span>' +
        '<span class="lyr__n">' + (j + 1) + '</span>' +
        '<button class="lyr__t" data-lyrgo="' + j + '">' + wlabel(w) + '</button>' +
        '<span class="lyr__mv">' +
          '<button data-lyrup="' + j + '"' + (j === 0 ? ' disabled' : '') + ' title="위로">▲</button>' +
          '<button data-lyrdn="' + j + '"' + (j === ws.length - 1 ? ' disabled' : '') + ' title="아래로">▼</button>' +
        '</span></li>';
    }).join('');
    /* 설명 두 줄(목록 위 「지금 N개가 이 순서로…」 · 목록 아래 「다시 고르면 순서가 풀립니다」)은
       뺐다. 목록 자체가 개수·순서를 이미 말하고, ▲▼ 는 눌러 보면 안다 — 읽어야 알 수 있는
       건 「다시 고르면 풀린다」 하나뿐인데 그건 실제로 풀리는 순간에 알려 주는 게 맞다. */
    /* 추가 버튼은 목록 **맨 아래**에 한 줄로 길게 둔다. 목록이 위→아래로 페이지 순서라
       「끝에 하나 더 붙인다」가 곧 그 자리이고, 위에 두면 순서 읽기를 끊는다.
       위쪽에 있던 짧은 「＋ 위젯 갤러리」 버튼은 걷었다 — 같은 갤러리를 두 번 열 이유가 없다. */
    return (ws.length ? '<ol class="lyrs">' + rows + '</ol>'
                      : '<div class="lyr0">아직 위젯이 없습니다.</div>') +
      '<button class="onb__wg lyradd" data-widget="1">＋ 위젯 추가하기</button>';
  }

  /* ── ③-상세 · 상세페이지에 넣을 수 있는 위젯 ─────────────────────────────
     메인 위젯 스택(`PAGE.widgets`)을 그대로 내면 안 된다 — 상세페이지 캔버스에는 그
     `widget:N` 노드가 하나도 없어 줄을 눌러도 아무 일이 없다. 그래서 목록의 **내용만** 이
     페이지에 넣을 수 있는 위젯으로 바꾼다(스텝 이름은 「위젯」 그대로다).

     세 개뿐인 이유 — 갤러리의 「상세페이지」 묶음에는 다섯 개가 있지만, 최대 혜택가·무이자
     할부 안내는 이 프로토타입의 상세페이지에 **자리가 없다**(고르면 메인에 얹힌다). 넣을 수
     있다고 적어 두면 눌렀을 때 다른 페이지로 가는 셈이라 넣지 않았다.
     자리 설정(구매영역·스크롤 중 구매·옵션 방식·하단 탭)은 오른쪽 속성 패널이 계속 전담한다. */
  var DP_ADD = [
    { k: 'opt',   n: '옵션 선택',     d: '묶음 · 드롭다운 · 스와치' },
    { k: 'cta',   n: '버튼',          d: '채널 추가 · 링크 유도' },
    { k: 'today', n: '오늘 배송 안내', d: '오늘 출발 여부 안내' }
  ];
  /* 지금 상세페이지에 서 있는지 — 옵션 선택은 골격이라 항상 있고, 나머지 둘은 끌 수 있다 */
  function dpOn(k) {
    if (typeof DETAIL === 'undefined') return false;
    if (k === 'opt')   return true;
    if (k === 'cta')   return !DETAIL.cta.off;
    if (k === 'today') return !DETAIL.today.off;
    return false;
  }
  function fragDp() {
    var rows = DP_ADD.map(function (x) {
      var on = dpOn(x.k);
      return '<li class="lyr" data-dpadd="' + x.k + '">' +
        '<span class="lyr__n">' + (on ? '✓' : '＋') + '</span>' +
        '<button class="lyr__t" data-dpadd="' + x.k + '">' + x.n +
          '<em>' + x.d + '</em></button>' +
        '<span class="lyr__st">' + (on ? '있음' : '꺼짐') + '</span></li>';
    }).join('');
    /* 돌아가는 길은 왼쪽에도 하나 둔다 — 상단 pill·스토어프론트 로고만으로는 길을 잃는다 */
    return '<ol class="lyrs">' + rows + '</ol>' +
      '<button class="onb__wg lyradd" data-gomain="1">메인 화면으로 ›</button>';
  }

  /* 인스펙터 네 개 — 갤러리에서 상세페이지 위젯을 추가했을 때 그 자리를 열어 주는 데만 쓴다
     (`DP_HOME` 라우팅). 왼쪽 슬롯이 없어졌으므로 「열린 인스펙터를 추적해 다시 그리기」
     (`dpIns` · `dpApply` · `closePanel` 감싸기)는 함께 지웠다 — 조작면이 오른쪽 하나뿐이면
     오른쪽이 스스로 자기 상태를 안다. */
  var DP_INS = { design: 'openDesignInspector', opt: 'openOptionInspector',
                 cta: 'openCtaInspector', today: 'openTodayInspector' };
  function dpOpenIns(k) {
    var f = window[DP_INS[k]];
    if (typeof f === 'function') { try { f(); } catch (err) {} }
  }

  /* 오른쪽에서 고른 위젯을 왼쪽 목록에서도 켠다. 선택의 진실원본은 캔버스의 `.sfw.sel`
     하나다 — 게이트가 자기 상태를 따로 들면 두 개가 어긋나는 순간(캔버스에서 직접 클릭 ·
     패널 닫기 · 위젯 삭제)이 생긴다. 그래서 매번 DOM 을 읽어 맞춘다. */
  function lyrSync() {
    if (!el) return;
    var sel = document.querySelector('#sfcanvas .sfw.sel');
    var m = sel && /^widget:(\d+)$/.exec(sel.dataset.kind || '');
    var at = m ? m[1] : null;
    Array.prototype.forEach.call(el.querySelectorAll('.lyr'), function (r) {
      var on = (r.dataset.lyr === at);
      r.classList.toggle('on', on);
      if (on) r.setAttribute('aria-current', 'true'); else r.removeAttribute('aria-current');
      /* 목록이 자기 안에서 구르는 시안(B)에서 켜진 줄이 화면 밖일 수 있다 */
      if (on) { try { r.scrollIntoView({ block: 'nearest' }); } catch (err) {} }
    });
  }
  /* 캔버스에서 위젯을 직접 누르거나 패널을 닫는 등 게이트를 거치지 않는 경로가 여럿이라,
     selectWidget 을 감싸고 문서 클릭도 한 번 더 훑는다(querySelector 한 번이라 부담 없다). */
  if (typeof window.selectWidget === 'function') {
    var _selectWidget = window.selectWidget;
    window.selectWidget = function () {
      var r = _selectWidget.apply(this, arguments);
      try { lyrSync(); } catch (err) {}
      return r;
    };
  }
  document.addEventListener('click', function () { setTimeout(function () {
    try { lyrSync(); } catch (err) {}
  }, 0); });

  /* ▲▼ 와 끌어서 옮기기가 공유하는 실제 이동 */
  function lyrMove(from, to) {
    var ws = (window.PAGE && PAGE.widgets) || [];
    if (from === to || from < 0 || to < 0 || from >= ws.length || to >= ws.length) return false;
    /* 옮기기 전에 고른 위젯을 **객체로** 붙잡아 둔다. renderCanvas 가 캔버스를 새로 그리면서
       `.sfw.sel` 을 지우므로 옮긴 뒤 선택이 통째로 풀렸고(왼쪽 하이라이트도 같이 사라졌다),
       번호로 기억하면 옮기면서 인덱스가 밀려 엉뚱한 위젯이 켜진다. */
    var selNode = document.querySelector('#sfcanvas .sfw.sel');
    var sm = selNode && /^widget:(\d+)$/.exec(selNode.dataset.kind || '');
    var selW = sm ? ws[+sm[1]] : null;
    ws.splice(to, 0, ws.splice(from, 1)[0]);
    try { renderCanvas(); } catch (err) {}
    if (selW) {
      var ni = ws.indexOf(selW);
      if (ni >= 0) { try { selectWidget('widget:' + ni); } catch (err) {} }
    }
    return true;
  }

  function frag(n) {
    var k = STEPS[n].k;
    return k === 'ind' ? fragInd() : k === 'mall' ? fragMall() : fragWg();
  }
  /* 세 시안이 공유하는 머리 한 줄 — 이 패널이 무엇인지(약속)와 오른쪽이 살아 있다는
     사실(즉시 반영)은 레이아웃과 무관하게 늘 필요하다. 높이도 셋이 똑같이 먹으므로
     비교에 유리·불리가 생기지 않는다. */
  function top() {
    /* 「고르는 즉시 오른쪽이 바뀝니다」 배지는 뺐다 — 오른쪽이 실제로 즉시 갈리므로
       말로 알릴 필요가 없다(화면이 하는 일을 글로 다시 설명하지 않는다). */
    return '<div class="onb__top"><b>몇 가지만 고르면 첫 화면이 완성됩니다</b></div>';
  }
  /* ✓ 는 **지나온 항목**과 **실제로 고친 항목**에 붙는다.
     전에는 「실제로 고른 것」만 ✓ 였다. 기본값을 그대로 두고 다음으로 넘어가는 게 정상 경로인데
     (② 는 업종에 맞춰 이미 채워져 있다) 그러면 ③ 에 서 있는 동안 ② 만 번호로 남아, 지나온
     칸이 안 지나온 칸처럼 보였다. 앞 칸은 위치로 ✓, 뒤 칸은 손댔을 때만 ✓ 한다
     (③ 을 고친 뒤 ① 로 돌아가도 ③ 의 ✓ 는 남는다). */
  function done(n) { return n !== S.step && (n < S.step || !!S.touched[STEPS[n].k]); }

  /* ── A안 · 한 문항 풀스텝 ──────────────────────────────────────────────
     한 번에 한 질문만 띄우고 패널 전체를 그 질문에 쓴다. 대신 위에 진행 레일을
     붙박이로 둬서 「전체가 몇 개이고 지금 어디이며 앞에서 뭘 골랐는지」가 항상
     보이게 한다 — 한 문항씩 보여 주는 방식이 얻는 건 몰입이고 잃는 건 맥락이다.
     레일이 그 맥락을 되돌려 받는 장치다.
     레일 항목은 **지나온 것이든 아직 안 온 것이든 아무거나** 눌러 갈 수 있고,
     앞으로 가는 건 항상 사용자가 직접 한다(고른다고 넘어가지 않는다). */
  function htmlA() {
    var h = '<div class="onb__sc">' + top() + '<div class="prg">';
    STEPS.forEach(function (st, n) {
      var cur = (S.step === n), fin = done(n);
      h += '<button class="prg__i" data-steph="' + n + '"' + (cur ? ' aria-current="step"' : '') +
        (fin ? ' data-done="1"' : '') + '>' +
        '<i>' + (fin ? '✓' : (n + 1)) + '</i><b>' + meta(n).n + '</b>' +
        /* 지금 펼친 항목이라고 값을 숨기지 않는다 — 「내가 뭘 골라 놨더라」는
           그 항목을 보고 있을 때 가장 자주 확인하는 정보다(고치려고 연 것이므로). */
        '<span>' + stepSum(n) + '</span></button>';
    });
    h += '</div>';

    var st = meta(S.step) || STEPS[0];
    h += '<div class="stp"><div class="stp__t">' + st.t + '</div>' +
      '<div class="stp__s">' + stepSub(S.step) + '</div>' +
      '<div class="stp__b">' + frag(S.step) + '</div></div>';

    var lastStep = (S.step >= LAST);
    return h + '</div><div class="onb__ft">' +
      (S.step > 0 ? '<button class="onb__prev" data-nav="-1">← 이전</button>' : '') +
      (lastStep
        ? '<button class="onb__go" data-go="1">이 셋팅으로 시작하기 →</button>'
        : '<button class="onb__go" data-nav="1">다음 · ' + meta(S.step + 1).n + ' →</button>' +
          '<button class="onb__skip" data-go="1">바로 시작</button>') +
      '</div>';
  }

  function html() { return htmlA(); }

  /* ── 빌더 보강 — 상세페이지에서 빠져나올 길을 만든다 ──────────────────
     원본 canvas-intro 의 문제 2건 (빌더 로직은 고치지 않고 바깥에서 감싼다):
     (1) 상세페이지로 들어가도 상단 페이지 pill 라벨이 「메인 페이지」로 남는다.
         드롭다운에는 이미 메인/상세 항목이 있고 ✓ 도 옮겨 붙지만, 닫힌 pill 이
         계속 「메인 페이지」라 지금 어디인지도, 돌아갈 수 있다는 것도 안 보인다.
     (2) 스토어프론트 로고가 죽어 있다 — 실제 몰이라면 로고 = 홈이다.
     ------------------------------------------------------------------
     pill 은 `<svg> 텍스트 <svg class=chev>` 구조라 **텍스트 노드만** 갈아끼운다.
     gotoPage 를 감싸 두면 어느 경로로 페이지가 바뀌든(상품 클릭 · 드롭다운 ·
     시드 재주입) 라벨이 따라온다. */
  function onDetail() { return typeof curPage !== 'undefined' && curPage === 'detail'; }

  function syncPage() {
    var pill = document.getElementById('btnPage');
    var label = onDetail() ? '상세페이지' : '메인 페이지';
    if (pill) {
      for (var i = 0; i < pill.childNodes.length; i++) {
        var n = pill.childNodes[i];
        if (n.nodeType === 3 && n.textContent.trim()) { n.textContent = label; break; }
      }
      pill.title = label;
    }
    /* 로고에는 커서·밑줄·툴팁 같은 어포던스를 주지 않는다 — 스토어프론트 로고의
       기본 표현 그대로 두고 클릭만 받는다. 이 클래스는 상태 표시용으로만 남긴다. */
    document.body.classList.toggle('sf-detail', onDetail());
  }

  /* 페이지를 갈아도 **게이트는 지금 항목에 그대로 머문다.** 전에는 상세페이지로 들어가면 ③ 으로
     끌고 갔는데, 셋팅 흐름 한가운데서 스텝이 저절로 움직이는 게 된다. ③ 의 목록만 그 페이지에
     넣을 수 있는 위젯으로 갈리므로(fragDp) 「눌렀는데 아무 일도 안 난다」는 남지 않는다. */
  function onbPage() {
    if (!el) return;
    paint(0);
  }

  function enhanceNav() {
    if (typeof window.gotoPage === 'function' && !window.gotoPage.__onb) {
      var orig = window.gotoPage;
      window.gotoPage = function () { orig.apply(this, arguments); syncPage(); onbPage(); };
      window.gotoPage.__onb = true;
    }

    /* 로고 → 메인. 캡처 단계에서 받아 빌더의 헤더 선택 핸들러보다 먼저 처리한다 */
    document.addEventListener('click', function (e) {
      if (!onDetail()) return;
      var lg = e.target.closest('#sfcanvas .sfhdr__logo');
      if (!lg) return;
      e.stopPropagation(); e.preventDefault();
      try { gotoPage('main'); } catch (err) {}
      try { toast('메인 페이지로 돌아왔어요'); } catch (err) {}
    }, true);

    syncPage();
  }

  /* 위젯 갤러리 — 원본 모달을 그대로 쓰되 **화면 전환 없이** 지금 화면 위에 띄운다.
     모달(#scrim)은 scale 된 #stage 안에 있어 그대로 열면 오른쪽 절반에 작게 갇힌다.
     → 열 때만 body 로 옮기고(포털 · position:fixed) 닫을 때 원위치시킨다.
     게이트는 닫지 않는다 — 고른 답과 갤러리를 같은 화면에서 오간다. */
  var scrimHome = null;
  function portalModal(on) {
    var sc = document.getElementById('scrim'); if (!sc) return;
    if (on) {
      if (scrimHome) return;
      scrimHome = { parent: sc.parentNode, next: sc.nextSibling };
      document.body.appendChild(sc); sc.classList.add('onb-portal');
    } else {
      if (!scrimHome) return;
      scrimHome.parent.insertBefore(sc, scrimHome.next);
      sc.classList.remove('onb-portal'); scrimHome = null;
    }
  }
  function openWidgets() {
    portalModal(true);
    try { openModal(); } catch (err) {}
  }
  /* 어느 경로로 닫히든(X · 스크림 클릭 · 위젯 추가) 원위치 */
  if (typeof window.closeModal === 'function') {
    var _closeModal = window.closeModal;
    window.closeModal = function () {
      _closeModal.apply(this, arguments); portalModal(false);
      /* 갤러리에서 위젯을 넣고 나오면 레이어 목록이 한 줄 늘어야 한다 —
         목록은 PAGE.widgets 를 그릴 때 읽으므로 다시 그려 준다(el 이 서기 전이면 건너뛴다). */
      if (el) { try { paint(scrollTop()); } catch (err) {} }
    };
  }

  /* ── 갤러리에서 고른 위젯이 **보이는 페이지**로 들어가게 한다 ──────────────
     갤러리는 메인 화면의 위젯 스택에 넣는다. 상세페이지를 보는 중에 넣으면 스택은 늘어나는데
     지금 화면에는 아무 변화가 없다 — 왼쪽 목록 줄을 눌러도 갈 곳이 없던 것과 같은 무반응이다.
     그래서 넣기 전에 메인으로 데려간다(넣은 게 보이는 페이지에서 넣는다).

     상세페이지에 **실제 자리가 있는 둘**(옵션 선택 · 오늘 배송 안내)은 메인에 쌓지 않고
     상세페이지의 그 자리로 보낸다 — 거기가 이 위젯이 사는 곳이고, 종전에는 메인에 얹은 뒤
     「실제로는 상세페이지에 노출돼요」라고 말로만 알렸다.
     최대 혜택가 · 무이자 할부 안내는 상세 렌더가 아직 없어 종전 동작 그대로 둔다(지어내지 않는다). */
  var DP_HOME = { '옵션 선택': 'opt', '오늘 배송 안내': 'today' };
  if (typeof window.addCanvasWidget === 'function' && !window.addCanvasWidget.__onb) {
    var _addWg = window.addCanvasWidget;
    window.addCanvasWidget = function (name) {
      var home = DP_HOME[name];
      if (home) {
        if (!onDetail()) { try { gotoPage('detail'); } catch (err) {} }
        /* 오늘 배송 안내는 「위젯 삭제」로 걷어낼 수 있다 — 갤러리에서 다시 고르는 건
           그걸 되돌리는 뜻이다. 옵션 선택은 걷어낼 수 없어 되돌릴 것이 없다. */
        if (home === 'today' && DETAIL.today.off) { DETAIL.today.off = false; try { renderCanvas(); } catch (err) {} }
        dpOpenIns(home);
        if (el) { try { paint(0); } catch (err) {} }
        try { toast('‘' + name + '’ 은 상세페이지 위젯이에요 — 그 자리를 열었습니다'); } catch (err) {}
        return;
      }
      /* 상세페이지를 보는 중이면 메인으로 데려간 뒤 넣는다 — 넣은 게 보이는 자리에서 넣는다.
         스텝은 건드리지 않는다(게이트는 지금 항목에 머문다). */
      if (onDetail()) { try { gotoPage('main'); } catch (err) {} }
      return _addWg.apply(this, arguments);
    };
    window.addCanvasWidget.__onb = true;
  }

  var el, dock, reopen;
  /* 게이트는 답을 고칠 때마다 통째로 다시 그린다(innerHTML) — 그러면 스크롤러가
     새 노드로 갈리면서 맨 위로 튄다. 아래쪽 항목을 고르는 순간 화면이 위로
     올라가 버리는 게 이것 때문이다. 그리기 전 위치를 재서 그대로 되돌린다. */
  /* B안(컨트롤 보드)은 패널이 통째로 스크롤되지 않는다 — 업종 목록(.ig)만 자기 안에서
     구른다. 그래서 스크롤러가 하나가 아니고, 둘 다 재서 되돌려야 한다.
     (.onb__sc 만 챙기면 B 에서 업종을 고를 때마다 목록이 맨 위로 튄다.) */
  var SCROLLERS = ['.onb__sc', '.ig', '.lyrs'];
  function scrollTop() {
    return SCROLLERS.map(function (q) { var s = el.querySelector(q); return s ? s.scrollTop : 0; });
  }
  function paint(keep) {
    /* 위치는 **클릭 순간** 재서 넘겨받는다. seed() 가 먼저 돌면서 스크롤이 이미
       0 으로 밀린 뒤라 여기서 재면 늦는다(그래서 업종만 위로 튀었다). */
    var top = (keep === undefined) ? scrollTop() : keep;
    el.innerHTML = html();
    lyrSync();                 /* 다시 그린 목록에도 지금 선택을 다시 얹는다 */
    if (!top) return;
    SCROLLERS.forEach(function (q, n) {
      var now = el.querySelector(q), v = top[n] || 0;
      if (!now || !v) return;
      /* scrollHeight 를 먼저 읽어 레이아웃을 확정시킨다 — 안 읽으면 아직 높이가 0 이라
         scrollTop 이 그대로 잘려 맨 위로 간다. rAF 는 이미지 로드로 높이가 늦게
         잡히는 경우(업종을 바꿔 사진이 통째로 갈릴 때)의 보정. */
      void now.scrollHeight;
      now.scrollTop = v;
      requestAnimationFrame(function () { if (now.scrollTop !== v) now.scrollTop = v; });
    });
  }
  function open(v) {
    el.hidden = !v; dock.hidden = v;
    document.body.classList.toggle('onb-open', v);
    /* 닫힘도 **명시적으로** 표시한다 — 「둘 다 없음」이 곧 「게이트가 아직 안 붙었다」라는
       뜻이 되고, 그 동안 CSS 가 게이트 자리를 비워 둬 첫 페인트 깜빡임을 막는다(_r9.css). */
    document.body.classList.toggle('onb-closed', !v);
    window.dispatchEvent(new Event('resize'));   /* 빌더 fit() 재계산 */
  }

  /* 파일 → 내 상품 사진. 「눌러서 고르기」와 「끌어다 놓기」가 **같은 경로**를 쓴다 —
     두 벌로 두면 한쪽만 고쳐지는 자리가 생긴다(줄이기·순서 보존·재시드가 전부 여기 걸려 있다).
     이미지가 아닌 파일은 조용히 버린다. */
  function addFiles(fileList) {
    var fs = Array.prototype.slice.call(fileList || []).filter(function (x) { return /^image\//.test(x.type); });
    if (!fs.length) return;
    var kq = scrollTop(), done = 0, buf = new Array(fs.length);
    fs.forEach(function (file, j) {
      var rd = new FileReader();
      rd.onload = function () {
        shrink(rd.result, function (u) {
          buf[j] = u;
          if (++done < fs.length) return;
          /* 고른 순서를 지킨다 — 읽기가 끝나는 순서는 파일 크기에 따라 뒤섞인다 */
          buf.forEach(function (x) { if (x) S.myImgs.push(x); });
          S.touched.mall = 1;
          seed(); paint(kq);
        });
      };
      rd.readAsDataURL(file);
    });
  }

  function boot() {
    el = document.createElement('div'); el.id = 'onb';
    el.dataset.lay = LAY;                 /* CSS 가 이 값으로 세 레이아웃을 가른다 */
    dock = document.createElement('div'); dock.id = 'onbDock'; dock.hidden = true;
    reopen = document.createElement('button');
    reopen.textContent = '← 온보딩 다시 열기';
    /* 손잡이에 있던 「＋ 위젯 추가」는 뺐다 — 빌더 오른쪽 레일의 [위젯] 버튼이 이미 같은
       갤러리를 여는 정식 입구다(실제 빌더와 같은 자리). 게이트 안 「＋ 위젯 갤러리 열기」도
       그대로 있으므로 진입점이 사라지지 않는다. */
    dock.appendChild(reopen);
    document.body.appendChild(el); document.body.appendChild(dock);

    el.addEventListener('click', function (e) {
      var t = e.target.closest('[data-steph],[data-nav],[data-cat],[data-ind],[data-cnt],[data-con],[data-go],[data-widget],[data-brand],[data-font],[data-myrm],[data-myclr],[data-mydz],[data-lyrup],[data-lyrdn],[data-lyrgo],[data-gomain],[data-dpadd]');
      if (!t) return;
      if (t.dataset.widget) { openWidgets(); return; }
      /* 드롭 박스 — 빈 자리를 눌러도 파일 창이 열린다. 끌어다 놓기만 아는 장치로 두면
         드래그가 어려운 환경(트랙패드·터치)에서 길이 없다.
         ＋ 타일은 label 이라 브라우저가 직접 열고(여기서 또 열면 창이 두 번 뜬다),
         이미 올린 썸네일은 누르는 자리가 아니다(× 는 자기 data-myrm 으로 위에서 잡힌다). */
      if (t.dataset.mydz != null) {
        if (e.target.closest('.myadd') || e.target.closest('.myth')) return;
        var inp = t.querySelector('[data-myup]'); if (inp) inp.click();
        return;
      }
      /* 진행 레일(A)·항목 레일(C) — 아무 항목으로나 되돌아가 고쳐 쓴다.
         A·C 는 항상 하나가 펼쳐져 있어야 하므로 같은 항목을 다시 눌러도 접지 않는다. */
      if (t.dataset.steph != null) { goStep(+t.dataset.steph); paint(0); return; }
      /* A안 하단의 이전/다음 */
      if (t.dataset.nav) { goStep(S.step + (+t.dataset.nav)); paint(0); return; }
      /* 분류 칩 — 여러 개 토글. '전체'는 나머지를 끄고, 다른 걸 고르면 '전체'가 꺼진다.
         전부 끄면 아무것도 안 보이므로 '전체'로 되돌린다. 몰 구성은 건드리지 않는다(목록만 거른다). */
      if (t.dataset.cat) {
        var c = t.dataset.cat, at = S.cats.indexOf(c);
        if (c === 'all') S.cats = ['all'];
        else {
          S.cats = S.cats.filter(function (x) { return x !== 'all'; });
          if (at >= 0) S.cats.splice(S.cats.indexOf(c), 1); else S.cats.push(c);
          if (!S.cats.length) S.cats = ['all'];
        }
        var kp = scrollTop(); paint(kp); return;
      }
      /* 올린 사진 빼기 — 한 장을 빼면 뒤 사진이 한 칸씩 앞으로 당겨진다(2번을 빼면
         3번이 2번 상품에 얹힌다). 상품에 얹는 순서가 곧 올린 순서라 그래야 말이 맞는다. */
      if (t.dataset.myrm != null || t.dataset.myclr) {
        var kq = scrollTop();
        if (t.dataset.myclr) S.myImgs = []; else S.myImgs.splice(+t.dataset.myrm, 1);
        S.touched.mall = 1;
        seed(); paint(kq); return;
      }
      /* 레이어 — 한 칸씩 옮기기 / 그 위젯으로 오른쪽 이동 */
      if (t.dataset.lyrup != null || t.dataset.lyrdn != null) {
        var kl = scrollTop(), fr = +(t.dataset.lyrup != null ? t.dataset.lyrup : t.dataset.lyrdn);
        if (lyrMove(fr, fr + (t.dataset.lyrup != null ? -1 : 1))) paint(kl);
        return;
      }
      /* ── 상세페이지 ──────────────────────────────────────────────────────
         왼쪽에는 「메인으로 돌아가는 길」 하나만 남았다. 값 조작(dpv·dpt·dpw)과
         인스펙터 열기(dpins) 분기는 슬롯과 함께 지웠다 — round-8/ 에 남아 있다. */
      if (t.dataset.gomain) {
        /* 게이트 다시 그리기는 gotoPage 훅(onbPage)이 한다 — 여기서 paint 하면 두 번 그린다 */
        try { gotoPage('main'); } catch (err) {}
        return;
      }
      /* ③-상세 목록의 줄 — 꺼져 있으면 켜고, 그 자리의 속성 패널을 연다.
         켜고 끄기는 오른쪽 패널의 「위젯 삭제」와 같은 값(`DETAIL.*.off`)을 쓴다 —
         갤러리에서 다시 고르는 것도 같은 뜻이라 이미 그렇게 동작한다(addCanvasWidget 훅). */
      if (t.dataset.dpadd) {
        var dk = t.dataset.dpadd;
        if (typeof DETAIL !== 'undefined') {
          if (dk === 'cta'   && DETAIL.cta.off)   { DETAIL.cta.off   = false; try { renderCanvas(); } catch (err) {} }
          if (dk === 'today' && DETAIL.today.off) { DETAIL.today.off = false; try { renderCanvas(); } catch (err) {} }
        }
        S.touched.wg = 1;
        dpOpenIns(dk);
        paint(0);
        return;
      }
      if (t.dataset.lyrgo != null) {
        var kd = 'widget:' + t.dataset.lyrgo;
        try { selectWidget(kd); } catch (err) {}
        var node = document.querySelector('#sfcanvas .sfw[data-kind="' + kd + '"]');
        if (node) { try { node.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (err) {} }
        return;
      }
      /* 색·글꼴은 시드(캔버스 재생성)를 건드리지 않는다 — 변수만 갈아끼우고 칩만 다시 그린다 */
      if (t.dataset.brand || t.dataset.font) {
        if (t.dataset.brand) { S.brand = t.dataset.brand; S.pick.brand = 1; }
        else                 { S.font  = t.dataset.font;  S.pick.font  = 1; }
        S.touched.mall = 1;
        applyStyle(); paint(); return;
      }
      if (t.dataset.go) {
        open(false);
        window.__ONB_PENDING = false;
        try { toast('셋팅을 빌더에 넣었습니다 — 이제 위젯을 눌러 바꿔보세요'); } catch (err) {}
        setTimeout(function () { try { coachStart(); } catch (err) {} }, 500);
        return;
      }
      var keep = scrollTop();          /* seed() 전에 재 둔다 */
      /* ⚠ 고른다고 다음 항목으로 넘기지 않는다(셋 다).
         여기서 자동으로 넘기면 「이것도 눌러 보고 저것도 눌러 봐야지」를 막는다 —
         이 화면의 값은 아무거나 눌러 보고 오른쪽이 어떻게 갈리는지 보는 데 있고,
         한 번 누른 걸 곧 결정으로 받아 화면을 걷어 가면 그 값이 사라진다.
         앞으로 가는 건 언제나 사용자가 직접 한다(A=[다음] 버튼 · C=레일). */
      if (t.dataset.ind) {
        /* 업종을 바꾸면 ② 의 기본값도 그 업종 몫으로 다시 깐다(mallDefaults).
           사용자가 직접 고른 항목은 건드리지 않는다 — S.pick 이 그걸 기억한다. */
        S.ind = t.dataset.ind; S.touched.ind = 1;
        applyMallDefaults(); applyStyle();
        /* 업종을 바꾸면 몰이 통째로 갈린다 — 중간을 보고 있으면 뭐가 바뀌었는지 안 보인다.
           오른쪽 프리뷰만 맨 위로 올린다(왼쪽 게이트 스크롤은 그대로 둔다). */
        var pv = document.getElementById('previewScroll'); if (pv) pv.scrollTop = 0;
      }
      else if (t.dataset.cnt) { S.cnt = +t.dataset.cnt; S.pick.cnt = 1; S.touched.mall = 1; }
      else if (t.dataset.con) { S.concept = t.dataset.con; S.pick.concept = 1; S.touched.mall = 1; }
      seed(); paint(keep);   /* 자리를 지킨다 — 방금 고른 카드가 눈앞에 그대로 남게 */
    });
    /* 직접 고르기 — 드래그하는 동안 계속 들어온다. 캔버스를 다시 그리지 않으니
       매 입력마다 바로 반영해도 부담이 없다(paint 는 놓을 때 한 번). */
    el.addEventListener('input', function (e) {
      var c = e.target.closest('[data-brandc]'); if (!c) return;
      S.brand = c.value; S.pick.brand = 1; applyStyle();
    });
    el.addEventListener('change', function (e) {
      if (e.target.closest('[data-brandc]')) { paint(); return; }
      var up = e.target.closest('[data-myup]'); if (!up) return;
      /* up.value = '' 이 files 까지 비운다 — 먼저 배열로 떠 두고 나서 비운다.
         (비우는 이유: 같은 파일을 다시 골라도 change 가 오게 하려고) */
      var files = Array.prototype.slice.call(up.files || []);
      up.value = '';
      addFiles(files);
    });

    /* ── 끌어다 놓기 ────────────────────────────────────────────────────────
       파일을 브라우저에 놓으면 기본 동작은 **그 파일을 그대로 열어 버리는 것**이다 —
       그러면 지금까지 고른 업종·구성·올린 사진이 통째로 사라진다(새로고침보다 나쁘다).
       그래서 박스 밖에 떨어뜨려도 게이트 전체에서 기본 동작을 막고, 받아 넣는 건
       박스 안에 놓았을 때만 한다. */
    el.addEventListener('dragover', function (e) {
      e.preventDefault();
      var dz = e.target.closest ? e.target.closest('[data-mydz]') : null;
      if (!dz) return;
      try { e.dataTransfer.dropEffect = 'copy'; } catch (err) {}
      dz.classList.add('is-over');   /* 놓을 때까지 아무 표시가 없으면 받는 자리인지 모른다 */
    });
    el.addEventListener('dragleave', function (e) {
      var dz = e.target.closest ? e.target.closest('[data-mydz]') : null;
      if (!dz) return;
      /* 박스 안의 썸네일 사이를 지나가도 dragleave 가 뜬다 — 박스 안으로 옮겨간
         것이면 강조를 유지한다(안 그러면 테두리가 깜빡인다). */
      if (e.relatedTarget && dz.contains(e.relatedTarget)) return;
      dz.classList.remove('is-over');
    });
    el.addEventListener('drop', function (e) {
      e.preventDefault();
      var dz = e.target.closest ? e.target.closest('[data-mydz]') : null;
      if (!dz) return;
      dz.classList.remove('is-over');
      addFiles(e.dataTransfer && e.dataTransfer.files);
    });

    /* 끌어서 옮기기 — 놓는 줄의 위/아래 절반으로 앞·뒤를 가른다(레이어 패널의 관례).
       dragover 에서 preventDefault 를 해야 drop 이 온다. */
    var lyrFrom = null;
    el.addEventListener('dragstart', function (e) {
      var r = e.target.closest && e.target.closest('[data-lyr]'); if (!r) return;
      lyrFrom = +r.dataset.lyr; r.classList.add('drag');
      try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(lyrFrom)); } catch (err) {}
    });
    el.addEventListener('dragover', function (e) {
      var r = e.target.closest && e.target.closest('[data-lyr]'); if (!r || lyrFrom === null) return;
      e.preventDefault();
      var b = r.getBoundingClientRect(), after = (e.clientY - b.top) > b.height / 2;
      Array.prototype.forEach.call(el.querySelectorAll('.lyr.over-a,.lyr.over-b'), function (x) {
        x.classList.remove('over-a', 'over-b');
      });
      r.classList.add(after ? 'over-b' : 'over-a');
    });
    el.addEventListener('drop', function (e) {
      var r = e.target.closest && e.target.closest('[data-lyr]'); if (!r || lyrFrom === null) return;
      e.preventDefault();
      var to = +r.dataset.lyr, bx = r.getBoundingClientRect();
      if ((e.clientY - bx.top) > bx.height / 2) to += 1;
      if (to > lyrFrom) to -= 1;      /* 자기를 뽑아낸 만큼 목표 자리가 한 칸 당겨진다 */
      var kk = scrollTop(), from = lyrFrom;
      lyrFrom = null;
      lyrMove(from, to); paint(kk);
    });
    el.addEventListener('dragend', function () {
      lyrFrom = null;
      Array.prototype.forEach.call(el.querySelectorAll('.lyr.drag,.lyr.over-a,.lyr.over-b'), function (x) {
        x.classList.remove('drag', 'over-a', 'over-b');
      });
    });

    reopen.addEventListener('click', function () { seed(); paint(); open(true); });

    window.__ONB_PENDING = true;
    applyMallDefaults();   /* 첫 업종(식료품)도 제 몫의 기본값으로 연다 */
    seed(); paint(); applyStyle(); open(true);
    enhanceNav();
  }

  /* ── 푸터 ────────────────────────────────────────────────────────────────
     시안 푸터는 「브랜드 로고 + 한글명 / 사업자 정보 / COMPANY·SUPPORT·LEGAL 3열 /
     저작권 + SNS」 구조에 짙은 배경이다. 빌더 기본 푸터는 링크 한 줄 + 회사 정보 3줄뿐이라
     8업종 전부 시안과 달랐다. renderFooter 를 감싸 업종이 footer 스펙을 들고 있으면 그 구조로 그린다.

     ⚠ 사업자등록번호·주소·대표자는 **시안에서 읽은 업종만** 넣는다. 없는 업종은 그 줄을 비운다 —
        번호를 지어내면 진짜처럼 보이는 가짜 사업자 정보가 된다. */
  var FOOT_COLS = [
    { h: 'COMPANY', items: ['브랜드 소개', '디자인 철학', '제작 공정', '인재 채용'] },
    { h: 'SUPPORT', items: ['고객 상담 센터', '1:1 온라인 문의', 'A/S 및 품질 보증', '쇼룸 안내'] },
    { h: 'LEGAL',   items: ['이용 약관', '개인정보 처리방침', '소비자 피해보상', '대량 구매 안내'] }
  ];
  var SNS = ['<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="5" width="20" height="14" rx="4"/><path d="M10 9l5 3-5 3z" fill="currentColor" stroke="none"/></svg>',
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M13.5 21v-8h2.7l.4-3h-3.1V8.2c0-.9.3-1.5 1.5-1.5h1.7V4.1c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.1V10H7.6v3h2.7v8z"/></svg>'];

  var _renderFooter = window.renderFooter;
  window.renderFooter = function () {
    var i = ind(), f = i.footer;
    if (!f) return _renderFooter.apply(this, arguments);
    var cols = (f.cols || FOOT_COLS).map(function (c) {
      return '<div class="sff2__col"><div class="sff2__h">' + c.h + '</div>' +
        c.items.map(function (x) { return '<span>' + x + '</span>'; }).join('') + '</div>';
    }).join('');
    var biz = (f.lines || []).map(function (l) { return '<div class="sff2__biz">' + l + '</div>'; }).join('');
    return '<div class="sffoot sff2" style="background:' + (f.bg || '#1f2a26') + '">' +
      '<div class="sff2__top">' +
        '<div class="sff2__brand"><b>' + i.ref + '</b>' + (f.kr ? '<i>' + f.kr + '</i>' : '') + '</div>' +
        biz +
      '</div>' +
      '<div class="sff2__cols">' + cols + '</div>' +
      '<div class="sff2__bar"><span>© 2026 ' + i.ref + '. All Rights Reserved.</span>' +
        '<span class="sff2__sns">' + SNS.join('') + '</span></div>' +
    '</div>';
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
