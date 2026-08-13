/* ══════════════════════════════════════════════════════════════════════════
   위젯 속성 패널 (2026-08-07)

   - 순서·표시 제어: 운영 빌더 「레이어(페이지 구성)」 행 액션 4개를 그대로 옮겼다
     — 위로 이동 / 아래로 이동 / 영역 숨기기 / 섹션 삭제. 이 시안엔 레이어 패널이
     없으므로 선택한 위젯의 속성 패널 맨 위에 붙인다.
   - 필드: 운영 templates API 의 configSchema(_wschema.js)로 렌더한다. 그룹·라벨·
     컨트롤 종류·선택지·기본값·repeater 항목 스키마까지 전부 스키마에서 온다.
   - **모든 필드가 캔버스에 반영된다.** 값은 w.cfg 에 저장되고, 렌더러(_wrender.js)가
     그 값을 직접 읽어 그린다.
   - 이미 시안대로 만든 리치 패널(콘텐츠 배너·콘텐츠+상품 그리드·카테고리별 상품 탭·
     포토리뷰·영상 배너·스크롤 배너)은 그대로 두고 순서 바만 얹는다.
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var TYPE2TPL = {
    videohero: 'video-hero-banner', shorts: 'shorts-carousel', magazine: 'magazine-board',
    mainproduct: 'main-product-info', code: 'custom-html', contentgrid: 'contents-product-grid',
    brandbanner: 'parallax-banner', image: 'image', text: 'text-block', optsel: 'option-selector',
    maxbenefit: 'max-benefit', installment: 'card-installment', todayship: 'today-shipping',
    ctabtn: 'cta-button', category: 'category-shortcut', imagetext: 'split-banner',
    video: 'video-banner', sale: 'category-tabs', quickmenu: 'quick-menu', photoreview: 'photo-review',
    product: 'product-grid', strip: 'strip-banner', countdown: 'top-countdown-banner',
    contentbanner: 'content-banner', review: 'photo-review', ytlinks: 'video-banner', banner: 'content-banner'
  };
  var RICH = { contentbanner: 1, contentgrid: 1, sale: 1, photoreview: 1, video: 1, ytlinks: 1, brandbanner: 1 };

  function tplOf(w) { return TYPE2TPL[w && w.type] || null; }
  function schemaOf(w) { var id = tplOf(w); return (id && window.WSCHEMA && WSCHEMA[id]) || null; }
  function imgPool() { return [IMG.radiance, IMG.balance, IMG.nightcream, IMG.focus, IMG.rv1, IMG.rv2, IMG.rv3, IMG.rv4]; }

  /* ── 위젯이 원래 들고 있던 값 → 스키마 키로 옮겨 seed (패널 열 때 화면이 안 바뀌게) ── */
  var SEED = {
    'product-grid': function (w, c) {
      c.title = w.title; c.subtitle = w.subtitle; c.headerAlign = w.align || 'center';
      c.columns = String(w.cols || 4); if (w.gap != null) c.gap = w.gap;
      c.ctaTextVisible = !!w.more; if (w.moreText) c.ctaText = w.moreText;
    },
    'text-block': function (w, c) { c.heading = w.title; c.body = w.desc; if (w.align) c.textAlign = w.align; if (w.bg) c.bgColor = w.bg; },
    'shorts-carousel': function (w, c) {
      c.title = w.title; c.subtitle = w.subtitle;
      if (!c.items || !c.items.length) c.items = (w.slides || []).map(function (s) {
        return { thumbUrl: s.img, productName: (s.prod || {}).name || '', productPrice: (s.prod || {}).price || '', productLink: '', videoUrl: '' };
      });
    },
    'magazine-board': function (w, c) { c.title = w.title; c.description = w.subtitle; if (w.radius != null) c.radius = w.radius; },
    'main-product-info': function (w, c) { c.title = w.title; c.subtitle = w.subtitle; },
    'cta-button': function (w, c) { if (w.text) c.text = w.text; if (w.bg) c.bgColor = w.bg; },
    'split-banner': function (w, c) {
      c.eyebrow = w.eyebrow || c.eyebrow; c.title = w.title || c.title; c.description = w.desc || c.description;
      c.ctaText = w.btn || c.ctaText; if (w.btnStyle) c.ctaStyle = w.btnStyle; if (w.img) c.image = w.img;
    },
    'category-shortcut': function (w, c) {
      if (!c.items || !c.items.length) c.items = (w.items || []).map(function (it) { return { name: it.name, image: it.img, link: '' }; });
    },
    'strip-banner': function (w, c) { if (!c.items || !c.items.length) c.items = [{ text: w.text || '메시지를 입력하세요', link: '' }]; },
    'image': function (w, c) { if (w.img) c.image = w.img; if (c.height == null) c.height = 340; },
    'custom-html': function (w, c) { if (w.html) c.html = w.html; },
    'video-hero-banner': function (w, c) {
      /* 첫 슬라이드에는 이 몰의 히어로 문구·버튼을 얹어 둔다 — 텍스트 간격·버튼 스타일 필드가 바로 먹히도록 */
      if (!c.slides || !c.slides.length) c.slides = (w.slides || []).map(function (s, i) {
        var h = (PAGE.hero && PAGE.hero.slides && PAGE.hero.slides[i]) || {};
        return { type: 'image', image: s.img, eyebrow: h.eyebrow || '', title: h.title || '', desc: h.desc || '',
                 ctaText: h.btn || '자세히 보기', ctaLink: '/product/list.html' };
      });
    },
    'card-installment': function (w, c) { if (w.min) c.minAmount = String(w.min).replace(/[^\d]/g, ''); if (w.months) c.maxMonths = w.months; },
    'option-selector': function (w, c) { if (w.preset) c.presetType = w.preset; }
  };
  function cfgOf(w) {
    var c = w.cfg || (w.cfg = {});
    if (c.__seeded) return c;
    var s = schemaOf(w);
    /* 위젯이 들고 있던 값을 **먼저** 옮기고, 비어 있는 키만 스키마 기본값으로 채운다.
       (순서가 반대면 슬라이드·항목처럼 기본값이 1개짜리인 필드가 위젯 값을 덮는다) */
    var sd = SEED[tplOf(w)]; if (sd) try { sd(w, c); } catch (e) { }
    Object.keys(c).forEach(function (k) { if (c[k] === undefined) delete c[k]; });
    if (s) s.f.forEach(function (f) { if (f.d !== undefined && c[f.k] === undefined) c[f.k] = f.d; });
    c.__seeded = 1; return c;
  }
  /* 새 위젯은 만들 때 바로 시드 — 추가 직후 렌더도 스키마 값으로 그려진다 */
  var _newWidget = window.newWidget;
  window.newWidget = function () { var w = _newWidget.apply(this, arguments); try { cfgOf(w); } catch (e) { } return w; };

  /* ── 컨트롤 ──────────────────────────────────────────────────────────── */
  function at(idx, k, extra) { return ' data-wf="' + k + '" data-widx="' + idx + '"' + (extra || ''); }
  var DISPLAY_GROUPS = [
    { v: 'product_listmain_1', l: '메인진열 (신상품)' }, { v: 'product_listmain_2', l: '추천 상품' },
    { v: 'product_listmain_3', l: '인기 상품' }, { v: 'product_listmain_4', l: '할인 상품' }, { v: 'product_listmain_5', l: '기획전' }
  ];
  var BOARDS = [{ v: 1, l: '1 · 공지사항' }, { v: 2, l: '2 · 매거진' }, { v: 3, l: '3 · 이벤트' }, { v: 4, l: '4 · 후기' }];

  function imgField(idx, key, val, extra) {
    var picks = imgPool().map(function (u) {
      return '<span class="t' + (val === u ? ' on' : '') + '" data-wimg="' + escAttr(u) + '"' + at(idx, key, extra) + ' style="background-image:url(\'' + u + '\')"></span>';
    }).join('');
    return '<div class="wf-img">'
      + '<div class="wf-img__pv" style="background:' + (val ? "center/cover url('" + val + "')" : '#f1f1f4') + '">' + (val ? '' : '이미지 없음') + '</div>'
      + '<div class="sfpick">' + picks + '</div></div>';
  }
  function selectCtl(idx, key, val, opts, extra) {
    if (opts.length && opts.length <= 3) {
      return '<div class="seg3"' + at(idx, key, extra) + '>' + opts.map(function (o) {
        return '<button type="button" class="' + (String(val) === String(o.v) ? 'on' : '') + '" data-wval="' + escAttr(String(o.v)) + '">' + esc(String(o.l)) + '</button>';
      }).join('') + '</div>';
    }
    return '<select class="inp"' + at(idx, key, extra) + '>' + opts.map(function (o) {
      return '<option value="' + escAttr(String(o.v)) + '"' + (String(val) === String(o.v) ? ' selected' : '') + '>' + esc(String(o.l)) + '</option>';
    }).join('') + '</select>';
  }
  function baseCtl(idx, f, val, extra) {
    var t = f.t;
    if (t === 'select') return selectCtl(idx, f.k, val, f.o || [], extra);
    if (t === 'number' || t === 'range') {
      var mn = (f.min !== undefined ? f.min : 0), mx = (f.max !== undefined ? f.max : 100);
      var stp = f.step || ((mx - mn) <= 3 ? 0.1 : 1);
      return '<div class="wf-range"><input type="range" min="' + mn + '" max="' + mx + '" step="' + stp + '" value="' + (val != null && val !== '' ? val : mn) + '"' + at(idx, f.k, extra) + '/>'
        + '<span class="val">' + (val != null && val !== '' ? val : mn) + '</span></div>';
    }
    if (t === 'color') return '<div class="wf-color"><input type="color" value="' + escAttr(String(val || '#ffffff')) + '"' + at(idx, f.k, extra) + '/><span>' + esc(String(val || '')) + '</span></div>';
    if (t === 'textarea' || t === 'html') return '<textarea class="inp"' + at(idx, f.k, extra) + '>' + esc(val == null ? '' : String(val)) + '</textarea>';
    if (t === 'image') return imgField(idx, f.k, val, extra);
    if (t === 'boolean') return '<span class="tgl' + (val ? ' on' : '') + '" data-toggle' + at(idx, f.k, extra) + '></span>';
    if (t === 'displayPicker') return selectCtl(idx, f.k, val, DISPLAY_GROUPS, extra);
    if (t === 'dynamicSelect') return selectCtl(idx, f.k, val, BOARDS, extra);
    if (t === 'productPicker') {
      var ps = productsForCat(0, 8).map(function (p, i) { return { v: i, l: p.name }; });
      return selectCtl(idx, f.k, val, ps, extra);
    }
    if (t === 'action') return '<button type="button" class="addbtn" data-waction="' + escAttr(f.l) + '"' + at(idx, f.k, extra) + '>' + esc(f.l) + '</button>';
    if (t === 'datetime') return '<input type="datetime-local" class="inp" value="' + escAttr(val || '') + '"' + at(idx, f.k, extra) + '/>';
    return '<input class="inp" type="text" value="' + escAttr(val == null ? '' : String(val)) + '"' + (f.placeholder ? ' placeholder="' + escAttr(f.placeholder) + '"' : '') + at(idx, f.k, extra) + '/>';
  }
  /* repeater — 항목마다 하위 필드를 실제로 편집한다 */
  function repeaterCtl(idx, f, val) {
    var arr = Array.isArray(val) ? val : [];
    var sub = f.sub || [];
    var items = arr.map(function (it, ri) {
      var rows = sub.map(function (sf) {
        var sval = it[sf.k];
        var ctl = baseCtl(idx, { k: f.k, t: sf.t === 'productPicker' ? 'text' : (sf.t || 'text'), o: sf.o, min: 0, max: 100 }, sval, ' data-ri="' + ri + '" data-wsub="' + sf.k + '"');
        return field(sf.l, ctl);
      }).join('');
      return '<div class="wf-rep__it"><div class="wf-rep__hd"><b>항목 ' + (ri + 1) + '</b>'
        + '<button type="button" class="wf-rep__x" data-wrep="del" data-ri="' + ri + '"' + at(idx, f.k) + '>삭제</button></div>' + rows + '</div>';
    }).join('');
    var max = f.maxItems || 12;
    return '<div class="wf-rep">' + (items || '<div class="wf-rep__hd">항목이 없어요</div>')
      + (arr.length < max ? '<button type="button" class="addbtn" data-wrep="add"' + at(idx, f.k) + '>＋ 항목 추가</button>' : '')
      + '</div>';
  }
  function control(idx, f, val) {
    if (f.t === 'repeater') return field(f.l, repeaterCtl(idx, f, val), f.h || '');
    if (f.t === 'boolean') return '<div class="tgl-row"><span class="lab">' + f.l + '</span>' + baseCtl(idx, f, val) + '</div>';
    return field(f.l, baseCtl(idx, f, val), f.h || '');
  }

  /* ── 순서 · 표시 바 (운영 「레이어」 행 액션과 동일 4종) ───────────────── */
  var ICO = {
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 13C6.6 5 17.4 5 21 13"/><circle cx="12" cy="13" r="3"/></svg>',
    eyeoff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 13C4.4 9.9 6.6 8 9 7.2M15.5 8.3C17.7 9.3 19.8 11 21 13"/><path d="m4 5 16 16"/></svg>',
    del: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>'
  };
  function orderBar(idx) {
    var n = PAGE.widgets.length, w = PAGE.widgets[idx];
    function b(act, ico, title, off) {
      return '<button type="button" class="wob__b' + (off ? ' is-off' : '') + '" data-word="' + act + '" data-widx="' + idx + '" title="' + title + '"' + (off ? ' disabled' : '') + '>' + ico + '</button>';
    }
    return '<div class="wob"><span class="wob__pos">순서 <b>' + (idx + 1) + '</b> / ' + n + '</span><div class="wob__bs">'
      + b('up', ICO.up, '위로 이동', idx === 0)
      + b('down', ICO.down, '아래로 이동', idx === n - 1)
      + b('hide', w.hidden ? ICO.eyeoff : ICO.eye, w.hidden ? '영역 다시 보이기' : '영역 숨기기', false)
      + b('del', ICO.del, '섹션 삭제', false)
      + '</div></div>'
      + (w.hidden ? '<div class="wob__hint">지금 이 영역은 <b>숨김</b> 상태예요 — 실제 몰에서는 안 보입니다.</div>' : '');
  }

  function schemaBody(idx, w) {
    var s = schemaOf(w); if (!s) return '';
    var cfg = cfgOf(w), groups = [], byG = {};
    s.f.forEach(function (f) { var g = f.g || '설정'; if (!byG[g]) { byG[g] = []; groups.push(g); } byG[g].push(f); });
    if (!groups.length) return '<div class="help">이 위젯은 설정 없이 그대로 쓰는 위젯이에요 — 운영에서도 속성 항목이 없습니다.</div>';
    return groups.map(function (g, i) {
      return accSection(g, i < 2, byG[g].map(function (f) { return control(idx, f, cfg[f.k]); }).join(''));
    }).join('');
  }

  var _openLive = window.openLiveInspector;
  window.openLiveInspector = function (kind) {
    if (typeof kind !== 'string' || kind.indexOf('widget:') !== 0) return _openLive.apply(this, arguments);
    var idx = +kind.split(':')[1], w = PAGE.widgets[idx];
    if (!w) return _openLive.apply(this, arguments);
    if (RICH[w.type]) {
      _openLive.apply(this, arguments);
      var body = document.getElementById('panelBody');
      if (body) body.insertAdjacentHTML('afterbegin', orderBar(idx));
      return;
    }
    var s = schemaOf(w);
    renderPanel({
      title: widgetLabel(w),
      body: orderBar(idx) + (s ? schemaBody(idx, w) : '<div class="help">이 위젯은 운영 스키마에 없어 기본 편집만 제공해요.</div>')
    });
    document.getElementById('panel').classList.add('open');
  };

  /* ── 값 쓰기 ─────────────────────────────────────────────────────────── */
  function setVal(idx, key, val, ri, subKey) {
    var w = PAGE.widgets[idx]; if (!w) return;
    var c = cfgOf(w);
    if (ri != null && subKey) {
      if (!Array.isArray(c[key])) c[key] = [];
      c[key][ri] = c[key][ri] || {};
      c[key][ri][subKey] = val;
    } else c[key] = val;
    refreshWidget(idx);
  }
  function reopen(idx) { selectWidget('widget:' + idx); }
  function scrollTo_(i) {
    var el = document.querySelector('#sfcanvas .sfw[data-kind="widget:' + i + '"]');
    if (el) { try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) { } }
  }
  function num(el, v) { return (el.type === 'range' || el.type === 'number') ? +v : v; }

  document.addEventListener('click', function (e) {
    if (!e.target.closest || !e.target.closest('#panel')) return;
    var t;
    if ((t = e.target.closest('[data-word]'))) {
      var i = +t.dataset.widx, act = t.dataset.word, W = PAGE.widgets;
      if (act === 'up' && i > 0) { W.splice(i - 1, 0, W.splice(i, 1)[0]); renderCanvas(); reopen(i - 1); scrollTo_(i - 1); toast('한 칸 위로 옮겼어요'); }
      else if (act === 'down' && i < W.length - 1) { W.splice(i + 1, 0, W.splice(i, 1)[0]); renderCanvas(); reopen(i + 1); scrollTo_(i + 1); toast('한 칸 아래로 옮겼어요'); }
      else if (act === 'hide') { W[i].hidden = !W[i].hidden; renderCanvas(); reopen(i); toast(W[i].hidden ? '이 영역을 숨겼어요' : '이 영역을 다시 표시했어요'); }
      else if (act === 'del') { W.splice(i, 1); renderCanvas(); closePanel(); toast('위젯을 삭제했어요'); }
      return;
    }
    if ((t = e.target.closest('[data-wrep]'))) {
      var wi = +t.dataset.widx, key = t.dataset.wf, w = PAGE.widgets[wi], c = cfgOf(w);
      var s = schemaOf(w), fdef = s && s.f.filter(function (f) { return f.k === key; })[0];
      if (!Array.isArray(c[key])) c[key] = [];
      if (t.dataset.wrep === 'add') {
        var it = {}; (fdef && fdef.sub || []).forEach(function (sf) { it[sf.k] = sf.d != null ? sf.d : ''; });
        if (fdef && /image|thumb/i.test(JSON.stringify(fdef.sub || ''))) {
          (fdef.sub || []).forEach(function (sf) { if (/image|thumb/i.test(sf.k)) it[sf.k] = imgPool()[c[key].length % 8]; });
        }
        c[key].push(it); toast('항목을 추가했어요');
      } else { c[key].splice(+t.dataset.ri, 1); toast('항목을 삭제했어요'); }
      refreshWidget(wi); reopen(wi); return;
    }
    if ((t = e.target.closest('[data-waction]'))) { toast('‘' + t.dataset.waction + '’ — 운영에서는 카페24 관리 화면이 열립니다'); return; }
    if ((t = e.target.closest('[data-wimg]'))) {
      var host = t; setVal(+host.dataset.widx, host.dataset.wf, host.dataset.wimg,
        host.dataset.ri != null ? +host.dataset.ri : null, host.dataset.wsub || null);
      reopen(+host.dataset.widx); return;
    }
    if ((t = e.target.closest('.seg3[data-wf] button'))) {
      var seg = t.closest('.seg3[data-wf]');
      Array.prototype.forEach.call(seg.querySelectorAll('button'), function (b) { b.classList.remove('on'); });
      t.classList.add('on');
      var v = t.dataset.wval; if (v === 'true') v = true; else if (v === 'false') v = false;
      setVal(+seg.dataset.widx, seg.dataset.wf, v, seg.dataset.ri != null ? +seg.dataset.ri : null, seg.dataset.wsub || null);
      return;
    }
    if ((t = e.target.closest('.tgl[data-toggle][data-wf]'))) {
      setVal(+t.dataset.widx, t.dataset.wf, t.classList.contains('on'),
        t.dataset.ri != null ? +t.dataset.ri : null, t.dataset.wsub || null);
      return;
    }
  });

  document.addEventListener('input', function (e) {
    var el = e.target;
    if (!el.dataset || el.dataset.wf === undefined || !el.closest('#panel')) return;
    if (el.tagName === 'SELECT') return;                       /* select 은 change 로 */
    var v = num(el, el.value);
    if (el.type === 'range') { var chip = el.parentElement.querySelector('.val'); if (chip) chip.textContent = el.value; }
    if (el.type === 'color') { var hx = el.parentElement.querySelector('span'); if (hx) hx.textContent = el.value; }
    setVal(+el.dataset.widx, el.dataset.wf, v, el.dataset.ri != null ? +el.dataset.ri : null, el.dataset.wsub || null);
  });
  document.addEventListener('change', function (e) {
    var el = e.target;
    if (!el.dataset || el.dataset.wf === undefined || !el.closest('#panel')) return;
    if (el.tagName !== 'SELECT') return;
    setVal(+el.dataset.widx, el.dataset.wf, el.value, el.dataset.ri != null ? +el.dataset.ri : null, el.dataset.wsub || null);
  });

  /* ── 숨김 위젯 표시 ───────────────────────────────────────────────────── */
  var _renderCanvas = window.renderCanvas;
  window.renderCanvas = function () {
    var r = _renderCanvas.apply(this, arguments);
    PAGE.widgets.forEach(function (w, i) {
      if (!w.hidden) return;
      var el = document.querySelector('#sfcanvas .sfw[data-kind="widget:' + i + '"]');
      if (el) el.classList.add('sfw--hidden');
    });
    return r;
  };

  /* ── 스타일 ──────────────────────────────────────────────────────────── */
  var css = document.createElement('style');
  css.textContent = [
    '.wob{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:-2px 0 14px;padding:8px 10px;',
    '  border:1px solid var(--sds-border-default,#E3E4E7);border-radius:var(--sds-radius-xl,12px);background:var(--sds-bg-secondary,#FAFAFA)}',
    '.wob__pos{font-size:12px;color:var(--sds-text-tertiary,#5D6374)} .wob__pos b{color:var(--sds-text-primary,#2A2D38)}',
    '.wob__bs{display:flex;gap:4px}',
    '.wob__b{width:30px;height:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;',
    '  border:1px solid var(--sds-border-default,#E3E4E7);border-radius:var(--sds-radius-md,6px);background:#fff;color:var(--sds-text-secondary,#424756)}',
    '.wob__b svg{width:16px;height:16px} .wob__b:hover{border-color:var(--sds-border-brand,#6D58F2);color:var(--sds-text-brand,#5B3AE0)}',
    '.wob__b.is-off{opacity:.35;cursor:default} .wob__b.is-off:hover{border-color:var(--sds-border-default,#E3E4E7);color:var(--sds-text-secondary,#424756)}',
    '.wob__b[data-word="del"]:hover{border-color:#E0322F;color:#E0322F}',
    '.wob__hint{margin:-8px 0 12px;font-size:12px;color:var(--sds-text-tertiary,#5D6374)}',
    '.wf-range{display:flex;align-items:center;gap:10px} .wf-range input{flex:1} .wf-range .val{min-width:34px;text-align:right;font-size:12px;font-weight:700;color:var(--sds-text-secondary,#424756)}',
    '.wf-color{display:flex;align-items:center;gap:8px} .wf-color input{width:36px;height:28px;padding:0;border:1px solid var(--sds-border-default,#E3E4E7);border-radius:6px;background:#fff}',
    '.wf-color span{font-size:12px;color:var(--sds-text-tertiary,#5D6374)}',
    '.wf-img__pv{height:76px;border-radius:8px;margin-bottom:8px;display:flex;align-items:center;justify-content:center;font-size:12px;color:#8E929E}',
    '.wf-rep{border:1px dashed var(--sds-border-strong,#D6D7DB);border-radius:10px;padding:10px}',
    '.wf-rep__it{border-bottom:1px solid #EEF0F3;padding-bottom:8px;margin-bottom:10px}',
    '.wf-rep__it:last-of-type{border-bottom:0;margin-bottom:6px}',
    '.wf-rep__hd{display:flex;align-items:center;justify-content:space-between;font-size:12px;color:var(--sds-text-tertiary,#5D6374);margin-bottom:8px}',
    '.wf-rep__x{font-family:inherit;font-size:11px;color:#E0322F;background:none;border:0;cursor:pointer}',
    '.sfw--hidden{opacity:.32;filter:grayscale(.4)}',
    '.sfw--hidden::after{content:"숨김";position:absolute;top:10px;left:10px;z-index:3;padding:3px 8px;border-radius:99px;',
    '  background:rgba(42,45,56,.85);color:#fff;font-size:11px;font-weight:700}'
  ].join('\n');
  document.head.appendChild(css);
})();
