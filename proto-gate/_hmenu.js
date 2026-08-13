/* ═══════════════════════════════════════════════════════════════════════
   헤더 · 메뉴 구조 (4단 트리)  — R7 V01 에 이식

   출처: series `2026-07-27-header-menu-layout` **R10 확정본**
         (4단 트리 + 메뉴별 상품 담기 + 데스크톱 드롭다운 + 게시판 하위 URL 필수)
   이 빌더 클론의 헤더 설정에는 2단(메뉴 + 하위분류)짜리 «업데이트 예정» 자리만
   있었다 — 그 자리를 확정본 트리로 갈아끼운다.

   ── 이식하면서 바꾼 것 ─────────────────────────────────────────────────
   · 다이얼로그 → **패널 안 인라인 폼**. R10 은 별도 모달을 띄웠지만 여기서는
     속성 패널(320px) 안에서 끝내는 게 맞고, `#scrim`(위젯 갤러리)과 모달이
     겹치는 것도 피한다. 필드 구성·필수 검증·문구는 그대로다.
   · 상품 담기는 이 프로토타입의 카탈로그(CATALOG/업종 상품)를 쓴다.
   · 트리를 고치면 `PAGE.header.menu`(구 평면 배열)도 같이 맞춰 둔다 —
     아직 그걸 읽는 코드(레이아웃 노출 수 계산 등)가 남아 있다.

   ── 데이터 ─────────────────────────────────────────────────────────────
   PAGE.header.tree = [{ n, kids[], p[](담은 상품번호), open, main(승격),
                         board(게시판 대분류), vis(false=노출끔),
                         url·target(링크·게시판 주소) }]
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var MAXD = 4;                                        /* 카페24 상품분류와 같은 4단 */
  var DEPTH = ['대분류', '중분류', '소분류', '상세분류'];

  var IC = {
    grip: '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>',
    car: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
    plus: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    x: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    eye: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 12S5 5.5 12 5.5 22.5 12 22.5 12 19 18.5 12 18.5 1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    eyeoff: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18"/><path d="M10.6 6.1A9.9 9.9 0 0112 6c7 0 10.5 6 10.5 6a17 17 0 01-3.4 4M6.2 8.3A17 17 0 001.5 12S5 18 12 18c1.4 0 2.6-.2 3.7-.6"/></svg>',
    warn: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4l9 16H3l9-16z"/><path d="M12 10v4"/><circle cx="12" cy="17.2" r=".9" fill="currentColor" stroke="none"/></svg>',
    bag: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V6a3 3 0 016 0v2"/></svg>'
  };

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function ea(s) { return esc(s).replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }

  /* ── 트리 조작 ───────────────────────────────────────────────────────── */
  function pathKey(p) { return p.join('-'); }
  function keyPath(k) { return k.split('-').map(Number); }
  function T() { var h = PAGE.header; if (!h.tree) h.tree = fromMenu(h.menu); return h.tree; }
  function nodeAt(t, p) { var n = { kids: t }; for (var i = 0; i < p.length; i++) n = (n.kids || [])[p[i]]; return n; }
  function listOf(t, p) { return p.length === 1 ? t : (nodeAt(t, p.slice(0, -1)).kids || []); }
  /* pre-order 평탄화 — 헤더 노출 순서와 같은 순서로 훑는다 */
  function flat(t) {
    var out = [];
    (function walk(list, path) {
      list.forEach(function (nd, i) { var p = path.concat(i); out.push({ node: nd, path: p, depth: p.length - 1 }); walk(nd.kids || [], p); });
    })(t, []);
    return out;
  }
  function inBoard(t, p) { return p.length > 0 && !!(t[p[0]] || {}).board; }
  function isBoardChild(t, p) { return inBoard(t, p) && p.length >= 2; }
  function hasUrl(nd) { return !!(nd && (nd.url || '').trim()); }
  function isHidden(nd) { return nd.vis === false; }
  function canHide(nd, d) { return d === 0 && !!nd.board; }
  function canAdd(t, p) {
    if (p.length >= MAXD) return false;                 /* 상세분류가 마지막 */
    if (inBoard(t, p) && p.length >= 2) return false;   /* 게시판 하나 아래로는 못 쪼갠다 */
    return true;
  }
  function validUrl(u) {
    u = (u || '').trim();
    return u.indexOf('https://') === 0 || u.indexOf('http://') === 0 || u.charAt(0) === '/';
  }
  /* 「URL 필요」 기능은 뺐다 — 주소가 비었다고 트리를 붉게 칠하고 게시를 막던 규칙이다.
     온보딩에서 처음 몰을 세우는 사람에게 게시판 주소는 나중 일이고, 경고·차단이 앞에 서면
     지금 할 일(메뉴 짜기)을 가린다. 주소를 **넣을 수 있는 길(링크 칩)은 그대로 남긴다** —
     없앤 건 요구와 차단뿐이다. (missingUrls·warnHTML·게시 차단·needurl 표시를 함께 제거.) */

  /* 카페24 기본 게시판 주소 — 아는 것만 채우고 나머지는 비워 둔다. */
  var BOARD_URL = {
    '공지사항': '/board/notice/list.html', '뉴스/이벤트': '/board/news/list.html',
    '이용안내 FAQ': '/board/faq/list.html', '상품 사용후기': '/board/review/list.html',
    '상품 Q&A': '/board/qna/list.html', '자유게시판': '/board/free/list.html',
    '자료실': '/board/data/list.html', '갤러리': '/board/gallery/list.html'
  };

  /* 구 평면 메뉴(name·subs) → 트리. 게시판 성격의 대분류는 board 로 승격한다 */
  function fromMenu(menu) {
    return (menu || []).map(function (m) {
      var board = /고객센터|게시판|커뮤니티/.test(m.name);
      return {
        n: m.name, board: board || undefined, open: false, p: [],
        kids: (m.subs || []).map(function (s) {
          return { n: s, kids: [], p: [], url: board ? (BOARD_URL[s] || '') : undefined };
        })
      };
    });
  }
  /* 트리 → 구 평면 메뉴. 아직 menu 를 읽는 코드(노출 수 계산 등)를 위해 맞춰 둔다 */
  function syncMenu() {
    PAGE.header.menu = T().map(function (nd) {
      return { name: nd.n, subs: (nd.kids || []).map(function (k) { return k.n; }) };
    });
  }

  /* 헤더 최상위에 나오는 항목 = 대분류 + '메인' 켠 하위. 노출 끈 가지는 빼고 */
  function navItems() {
    var t = T(), out = [];
    flat(t).forEach(function (r) {
      if (isHidden(t[r.path[0]])) return;
      if (r.depth === 0 || r.node.main) out.push({ node: r.node, path: r.path, promoted: r.depth > 0 });
    });
    return out;
  }

  /* ── 상품 ────────────────────────────────────────────────────────────── */
  function pool() {
    try { return productsForCat(0, 10); } catch (e) { return []; }
  }
  /* 하위 포함 합계 — 상위 분류 목록은 그 아래 전체를 보여주므로 칩도 합계로 읽힌다 */
  function rollup(nd) {
    var seen = {}, out = [];
    (function walk(n) {
      (n.p || []).forEach(function (i) { if (!seen[i]) { seen[i] = 1; out.push(i); } });
      (n.kids || []).forEach(walk);
    })(nd);
    return out;
  }

  /* ── 패널: 트리 한 줄 ────────────────────────────────────────────────── */
  function urlChip(nd, key) {
    /* 주소가 비어 있어도 경고하지 않는다 — 흐린 링크 칩으로 «넣을 수 있다»만 알린다 */
    if (!hasUrl(nd)) {
      return '<button class="hmc hmc--ghost" data-hm-url="' + key + '" title="이동할 주소 — 눌러서 입력">링크</button>';
    }
    return '<button class="hmc" data-hm-url="' + key + '" title="' + ea(nd.url) + ' · ' + (nd.target === 'blank' ? '새 창' : '현재 창') + ' — 눌러서 수정">링크</button>';
  }
  function prodChip(nd, key) {
    var n = rollup(nd).length;
    if (!n) return '<button class="hmc hmc--ghost" data-hm-pick="' + key + '" title="상품 담기">' + IC.bag + '담기</button>';
    var kids = (nd.kids || []).length > 0;
    return '<button class="hmc hmc--on" data-hm-pick="' + key + '" title="' + (kids ? '하위 포함 ' + n + '개 · 이 메뉴에 직접 ' + (nd.p || []).length + '개' : '담긴 상품 편집') + '">' + IC.bag + n + '</button>';
  }

  function rowHTML(nd, p, t) {
    var d = p.length - 1, key = pathKey(p);
    var kids = (nd.kids || []).length > 0;
    var board = inBoard(t, p);
    var linked = !!nd.url && !board;
    var last = linked || !canAdd(t, p);
    var hideable = canHide(nd, d), off = hideable && isHidden(nd);
    var chip = board ? (d === 0 ? '<span class="hmc hmc--flat">게시판</span>' : urlChip(nd, key))
      : linked ? '<button class="hmc" data-hm-url="' + key + '" title="' + ea(nd.url) + ' — 눌러서 수정">링크</button>'
      : prodChip(nd, key);
    return '<div class="hmn hmn--d' + d + '">'
      + '<div class="hmrow' + (off ? ' off' : '') + '">'
      + '<span class="hmg" draggable="true" data-hm-drag="' + key + '" title="드래그해 순서 변경">' + IC.grip + '</span>'
      + (kids ? '<button class="hmcar' + (nd.open ? ' open' : '') + '" data-hm-open="' + key + '" aria-label="펼치기">' + IC.car + '</button>'
              : '<span class="hmcar ghost">' + IC.car + '</span>')
      + '<input class="hmnm" value="' + ea(nd.n) + '" title="' + ea(nd.n) + '" data-hm-nm="' + key + '" />'
      + (d > 0 ? '<button class="hmmain' + (nd.main ? ' on' : '') + '" data-hm-main="' + key + '" title="헤더 최상위에 함께 노출">메인</button>' : '')
      + (hideable ? '<button class="hmeye' + (off ? ' off' : '') + '" data-hm-vis="' + key + '" aria-pressed="' + (!off) + '" title="' + (off ? '노출하기' : '노출 끄기') + '">' + (off ? IC.eyeoff : IC.eye) + '</button>' : '')
      + chip
      + (last ? '' : '<button class="hmi" data-hm-add="' + key + '" title="' + (board ? '게시판 추가' : '하위 ' + DEPTH[d + 1] + ' 추가') + '">' + IC.plus + '</button>')
      + '<button class="hmi" data-hm-del="' + key + '" title="삭제">' + IC.x + '</button>'
      + '</div>'
      + (FORM.key === key ? formHTML(nd, p, t) : '')
      + (kids && nd.open ? '<div class="hmkids">' + nd.kids.map(function (k, i) { return rowHTML(k, p.concat(i), t); }).join('') + '</div>' : '')
      + '</div>';
  }

  /* 승격 별칭 — 하위분류를 헤더 최상위로 올린 것은 대분류 목록에도 보여준다.
     구조 변경(추가·삭제·순서)은 원본 행에서만 한다 */
  function aliasHTML(root, ri, t) {
    var out = [];
    (function walk(list, path) {
      (list || []).forEach(function (nd, i) { var p = path.concat(i); if (nd.main) out.push({ node: nd, path: p }); walk(nd.kids, p); });
    })(root.kids || [], [ri]);
    return out.map(function (it) {
      var key = pathKey(it.path);
      var trail = it.path.slice(0, -1).map(function (_, i) { return nodeAt(t, it.path.slice(0, i + 1)).n; }).join(' › ');
      return '<div class="hmn hmn--d0"><div class="hmrow hmrow--alias' + (isHidden(root) ? ' off' : '') + '">'
        + '<span class="hmg ghost" title="순서는 원본 메뉴 행에서 변경">' + IC.grip + '</span>'
        + '<span class="hmcar ghost">' + IC.car + '</span>'
        + '<span class="hmnm hmnm--alias" title="' + ea(trail + ' › ' + it.node.n) + '"><em>' + esc(trail) + ' ›</em> ' + esc(it.node.n) + '</span>'
        + '<button class="hmmain on" data-hm-main="' + key + '" title="헤더 최상위 노출 해제">메인</button>'
        + (isBoardChild(t, it.path) ? urlChip(it.node, key) : inBoard(t, it.path) ? '' : prodChip(it.node, key))
        + '</div></div>';
    }).join('');
  }

  /* ── 인라인 폼 (R10 다이얼로그의 필드를 패널 안에서) ──────────────────── */
  var FORM = { key: null, mode: null, n: '', url: '', t: 'self', kind: 'cat' };
  function closeForm() { FORM = { key: null, mode: null, n: '', url: '', t: 'self', kind: 'cat' }; }

  function formHTML(nd, p, t) {
    var m = FORM.mode;
    if (m === 'pick') return pickHTML(nd, p);
    var board = m === 'addboard' || (m === 'url' && isBoardChild(t, p));
    var link = board || m === 'url' || FORM.kind === 'link';
    var urlOk = !link || validUrl(FORM.url);
    var ok = !!FORM.n.trim() && (!link || (!!FORM.url.trim() && urlOk));
    var titles = { add: '하위 메뉴 추가', addboard: '게시판 추가', addroot: '메뉴 추가', url: board ? '게시판 링크 수정' : '링크 수정' };
    var h = '<div class="hmform"><div class="hmform__t">' + titles[m] + '</div>';
    if (m === 'addroot') {
      h += '<div class="hmradio">'
        + [['cat', '상품 분류', '하위 분류를 만들고 상품을 담을 수 있어요'], ['link', '커스텀 링크', '원하는 주소로 바로 보내요']].map(function (o) {
            return '<button class="hmradio__i" aria-checked="' + (FORM.kind === o[0]) + '" data-hm-kind="' + o[0] + '"><span class="hmradio__m"></span>'
              + '<span><b>' + o[1] + '</b><i>' + o[2] + '</i></span></button>';
          }).join('') + '</div>';
    }
    if (m !== 'url') {
      h += '<label class="hmf"><span>' + (board ? '게시판 이름' : '메뉴 이름') + '<i>*</i></span>'
        + '<input class="hmf__i" data-hm-f="n" value="' + ea(FORM.n) + '" placeholder="' + (board ? '예: 공지사항' : link ? '예: 이벤트' : '예: 아우터') + '" /></label>';
    }
    if (link) {
      h += '<label class="hmf"><span>' + (board ? '이동할 URL' : 'URL') + '<i>*</i></span>'
        + '<input class="hmf__i' + (FORM.url.trim() && !urlOk ? ' err' : '') + '" data-hm-f="url" value="' + ea(FORM.url) + '" placeholder="예: /board/notice/list.html" /></label>'
        + '<div class="hmf__h' + (FORM.url.trim() && !urlOk ? ' err' : '') + '">'
        + (FORM.url.trim() && !urlOk ? '올바른 URL 형식이 아니에요 (https:// 또는 / 로 시작)'
          : board ? '<b>필수</b> — 게시판은 상품 목록이 아니라 이 주소로 이동해요.' : '필수. https:// 또는 / 로 시작해요.') + '</div>'
        + '<label class="hmf"><span>열기 방식</span><select class="hmf__i" data-hm-f="t">'
        + '<option value="self"' + (FORM.t === 'self' ? ' selected' : '') + '>현재 창</option>'
        + '<option value="blank"' + (FORM.t === 'blank' ? ' selected' : '') + '>새 창</option></select></label>';
    }
    return h + '<div class="hmform__ft"><button class="hmbtn" data-hm-cancel>취소</button>'
      + '<button class="hmbtn hmbtn--go" data-hm-save' + (ok ? '' : ' disabled') + '>' + (m === 'url' ? '저장' : '추가') + '</button></div></div>';
  }

  /* 상품 담기 — 이 몰의 카탈로그에서 고른다(R10 의 검색·필터 picker 는 이식하지 않았다) */
  function pickHTML(nd) {
    var ps = pool(), cur = nd.p || [];
    return '<div class="hmform"><div class="hmform__t">상품 담기<em>' + cur.length + '개 선택</em></div>'
      + '<div class="hmpick">' + ps.map(function (pr, i) {
          var on = cur.indexOf(i) >= 0;
          return '<button class="hmpick__i' + (on ? ' on' : '') + '" data-hm-p="' + i + '">'
            + '<span class="hmpick__th" style="background:center/cover url(\'' + (pr.img || '') + '\')"></span>'
            + '<span class="hmpick__n">' + esc(pr.name) + '</span>'
            + '<span class="hmpick__c">' + (on ? '✓' : '') + '</span></button>';
        }).join('') + '</div>'
      + '<div class="hmform__ft"><button class="hmbtn hmbtn--go" data-hm-cancel>완료</button></div></div>';
  }

  /* 트리 위아래의 설명 줄을 다 걷었다 — 4단계 안내(.hmdepth) · URL 경고(.hmwarn) ·
     집계 메타(.hmmeta). 셋 다 화면이 이미 보여 주는 것을 글로 다시 말하고 있었다
     (깊이는 들여쓰기로, 개수는 줄 수로, 노출 여부는 「메인」 토글로 읽힌다).
     남는 건 트리와 「+ 메뉴 추가」뿐이다. */
  window.hmTreeHTML = function () {
    var t = T();
    return '<div class="hmtree">' + t.map(function (nd, i) { return rowHTML(nd, [i], t) + aliasHTML(nd, i, t); }).join('') + '</div>'
      + (FORM.mode === 'addroot' && FORM.key === '@root' ? formHTML({}, [], t) : '<button class="addbtn" data-hm-addroot>+ 메뉴 추가</button>');
  };

  /* ── 스토어프론트 헤더 ───────────────────────────────────────────────── */
  /* 펼침 패널 — 컬럼 = 중분류 / 굵은 줄 = 소분류 / 들여쓴 줄 = 상세분류 (R3 확정 렌더) */
  function panelInner(nd) {
    var kids = nd.kids || [];
    if (!kids.length) return '';
    var cols, n;
    if (!kids.some(function (k) { return (k.kids || []).length; })) {
      cols = '<div class="hp-mid"><div class="hp-mid__t">' + esc(nd.n) + '</div>'
        + kids.map(function (k) { return '<a class="hp-sub"' + (k.url ? ' title="' + ea(k.url) + '"' : '') + '>' + esc(k.n) + '</a>'; }).join('') + '</div>';
      n = 1;
    } else {
      n = kids.length;
      cols = kids.map(function (mid) {
        var l2 = mid.kids || [];
        return '<div class="hp-mid"><div class="hp-mid__t">' + esc(mid.n) + '</div>'
          + l2.map(function (small) {
              var l3 = small.kids || [];
              return '<div class="hp-l2grp"><a class="hp-l2">' + esc(small.n) + '</a>'
                + (l3.length ? '<div class="hp-l3">' + l3.map(function (d) { return '<a class="hp-l3i">' + esc(d.n) + '</a>'; }).join('') + '</div>' : '') + '</div>';
            }).join('') + '</div>';
      }).join('');
    }
    return '<div class="sfhdr__drop"><div class="hp-cols" style="--mc:' + Math.max(n, 1) + '">' + cols + '</div></div>';
  }

  var _hdrNav = window.hdrNav;
  window.hdrNav = function (h) {
    if (!h.tree) { try { _hdrNav(h); } catch (e) {} }
    var t = T(), items = navItems();
    var mega = '<span class="navitem navitem--all"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>전체'
      + '<div class="sfhdr__mega"><div class="mega-list">'
      + t.filter(function (nd) { return !isHidden(nd); }).map(function (nd, i) {
          var has = (nd.kids || []).length;
          return '<div class="mega-cat' + (has ? ' has' : '') + '" data-mi="' + i + '"><span>' + esc(nd.n) + '</span>'
            + (has ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>' : '') + '</div>';
        }).join('')
      + '</div><div class="mega-detail"></div></div></span>';
    var nav = items.map(function (it) {
      /* 「호버 시 하위분류 표시」를 끄면 펼침 패널을 아예 만들지 않는다 —
         그 토글이 이제 이 드롭다운을 켜고 끄는 스위치다 */
      var nd = it.node, expand = h.hoverSub !== false && (nd.kids || []).length > 0;
      return '<span class="navitem' + (expand ? ' has-drop' : '') + '" data-navkey="' + pathKey(it.path) + '">'
        + esc(nd.n) + (expand ? panelInner(nd) : '') + '</span>';
    }).join('');
    return '<nav class="sfhdr__nav hmnav">' + mega + nav + '</nav>';
  };

  /* ── 패널 교체 ──────────────────────────────────────────────────────── */
  var _headerPanel = window.headerPanel;
  window.headerPanel = function () {
    var pan = _headerPanel();
    /* 「메뉴 관리 · 업데이트 예정」 아코디언 본문만 트리로 갈아끼운다 —
       레이아웃 프리셋·로고·스타일·스크롤 섹션은 그대로 둔다 */
    pan.body = pan.body.replace(
      /(<span class="acc__title">메뉴 관리)<span class="soon-badge">업데이트 예정<\/span>/, '$1');
    var s = pan.body.indexOf('<div class="help"');
    var e = pan.body.indexOf('data-hdr-madd>+ 메뉴 추가</button>');
    if (s > -1 && e > -1) {
      /* 원래 여기 있던 .help 안내문(「대분류부터 상세분류까지 4단으로…」)은 뺐다 —
         트리를 보면 알 수 있는 규칙을 문단으로 다시 설명하던 줄이다. */
      pan.body = pan.body.slice(0, s)
        + window.hmTreeHTML()
        + '<div class="tgl-row"><span class="lab">호버 시 하위분류 표시</span><span class="tgl'
        + (PAGE.header.hoverSub ? ' on' : '') + '" data-hdr-hoversub></span></div>'
        + pan.body.slice(e + 'data-hdr-madd>+ 메뉴 추가</button>'.length);
    }
    return pan;
  };

  function sync() { syncMenu(); renderCanvas(); renderPanel(headerPanel()); }
  function repanel() { renderPanel(headerPanel()); }

  /* ── 이벤트 ─────────────────────────────────────────────────────────── */
  document.addEventListener('click', function (e) {
    if (!e.target.closest) return;
    var t = T(), el, k, p, nd;

    if ((el = e.target.closest('[data-hm-open]'))) { nd = nodeAt(t, keyPath(el.dataset.hmOpen)); nd.open = !nd.open; repanel(); return; }
    if ((el = e.target.closest('[data-hm-main]'))) { nd = nodeAt(t, keyPath(el.dataset.hmMain)); nd.main = !nd.main; sync(); return; }
    if ((el = e.target.closest('[data-hm-vis]'))) { nd = nodeAt(t, keyPath(el.dataset.hmVis)); nd.vis = (nd.vis === false) ? true : false; sync(); return; }

    if ((el = e.target.closest('[data-hm-del]'))) {
      p = keyPath(el.dataset.hmDel);
      if (p.length === 1 && t.length <= 1) { try { toast('최소 1개 메뉴가 필요해요'); } catch (x) {} return; }
      listOf(t, p).splice(p[p.length - 1], 1); closeForm(); sync(); return;
    }
    if ((el = e.target.closest('[data-hm-add]'))) {
      k = el.dataset.hmAdd; p = keyPath(k); nd = nodeAt(t, p);
      /* 게시판 아래는 URL 을 함께 받는다 — 주소 없는 게시판이 애초에 생기지 않게 */
      FORM = { key: k, mode: inBoard(t, p) ? 'addboard' : 'add', n: '', url: '', t: 'self', kind: 'cat' };
      nd.open = true; repanel(); return;
    }
    if ((el = e.target.closest('[data-hm-addroot]'))) { FORM = { key: '@root', mode: 'addroot', n: '', url: '', t: 'self', kind: 'cat' }; repanel(); return; }
    if ((el = e.target.closest('[data-hm-url]'))) {
      k = el.dataset.hmUrl; nd = nodeAt(t, keyPath(k));
      FORM = { key: k, mode: 'url', n: nd.n, url: nd.url || '', t: nd.target || 'self', kind: 'link' };
      openAncestors(keyPath(k)); repanel();
      var f = document.querySelector('#panel [data-hm-f="url"]'); if (f) f.focus();
      return;
    }
    if ((el = e.target.closest('[data-hm-pick]'))) {
      k = el.dataset.hmPick; FORM = { key: k, mode: 'pick', n: '', url: '', t: 'self', kind: 'cat' }; repanel(); return;
    }
    if ((el = e.target.closest('[data-hm-p]'))) {
      nd = nodeAt(t, keyPath(FORM.key)); nd.p = nd.p || [];
      var i = +el.dataset.hmP, at = nd.p.indexOf(i);
      if (at >= 0) nd.p.splice(at, 1); else nd.p.push(i);
      sync(); return;
    }
    if ((el = e.target.closest('[data-hm-kind]'))) { FORM.kind = el.dataset.hmKind; repanel(); return; }
    if (e.target.closest('[data-hm-cancel]')) { closeForm(); repanel(); return; }
    if ((el = e.target.closest('[data-hm-save]'))) {
      if (el.hasAttribute('disabled')) return;
      var m = FORM.mode;
      if (m === 'url') {
        nd = nodeAt(t, keyPath(FORM.key)); nd.url = FORM.url.trim(); nd.target = FORM.t;
      } else {
        var kid = { n: FORM.n.trim(), kids: [], p: [] };
        if (m === 'addboard' || FORM.kind === 'link') { kid.url = FORM.url.trim(); kid.target = FORM.t; }
        if (m === 'addroot') t.push(kid);
        else { nd = nodeAt(t, keyPath(FORM.key)); (nd.kids = nd.kids || []).push(kid); nd.open = true; }
      }
      closeForm(); sync(); return;
    }
  }, true);

  function openAncestors(p) { for (var i = 1; i < p.length; i++) nodeAt(T(), p.slice(0, i)).open = true; }

  document.addEventListener('input', function (e) {
    var el = e.target; if (!el || !el.dataset) return;
    if (el.dataset.hmNm !== undefined) { nodeAt(T(), keyPath(el.dataset.hmNm)).n = el.value; syncMenu(); renderCanvas(); return; }
    if (el.dataset.hmF !== undefined) {
      FORM[el.dataset.hmF === 't' ? 't' : el.dataset.hmF] = el.value;
      /* 저장 버튼 활성/비활성과 형식 경고만 갱신 — 입력 중 포커스를 잃지 않게 다시 그리지 않는다 */
      var save = document.querySelector('#panel [data-hm-save]');
      if (save) {
        var link = FORM.mode === 'url' || FORM.mode === 'addboard' || FORM.kind === 'link';
        var ok = (FORM.mode === 'url' || !!FORM.n.trim()) && (!link || (!!FORM.url.trim() && validUrl(FORM.url)));
        if (ok) save.removeAttribute('disabled'); else save.setAttribute('disabled', '');
      }
    }
  });
  document.addEventListener('change', function (e) {
    if (e.target && e.target.dataset && e.target.dataset.hmF === 't') FORM.t = e.target.value;
  });

  /* 같은 단계 안에서 순서 바꾸기 — 헤더 노출 순서도 함께 바뀐다 */
  var dragKey = null;
  document.addEventListener('dragstart', function (e) {
    var g = e.target.closest && e.target.closest('[data-hm-drag]'); if (!g) return;
    dragKey = g.dataset.hmDrag; try { e.dataTransfer.effectAllowed = 'move'; } catch (x) {}
  });
  document.addEventListener('dragover', function (e) {
    if (!dragKey) return; var r = e.target.closest && e.target.closest('.hmrow'); if (r) e.preventDefault();
  });
  document.addEventListener('drop', function (e) {
    if (!dragKey) return;
    var g = e.target.closest && e.target.closest('.hmn'); if (!g) { dragKey = null; return; }
    var tgt = g.querySelector('[data-hm-drag]'); if (!tgt) { dragKey = null; return; }
    e.preventDefault();
    var from = keyPath(dragKey), to = keyPath(tgt.dataset.hmDrag); dragKey = null;
    if (from.slice(0, -1).join() !== to.slice(0, -1).join()) return;   /* 같은 부모 안에서만 */
    var list = listOf(T(), from), it = list.splice(from[from.length - 1], 1)[0];
    list.splice(to[to.length - 1], 0, it); closeForm(); sync();
  });

  /* 「URL 이 빈 게시판이 있으면 게시 차단」 핸들러도 제거했다 — 요구를 없앴으니 차단도 없다.
     경고 없이 조용히 막히는 게 가장 나쁜 조합이므로 둘은 함께 사라져야 한다. */
})();
