/* ═══════════════════════════════════════════════════════════════════════
   업종 데이터 — 이 시리즈의 단일 정본 (SSoT)

   R6(`round-6/_shared.js`)과 R7(`round-7/_r7.js`)이 같은 파일을 읽는다.
   전에는 양쪽이 각자 사본을 들고 있어서 한쪽을 고치면 다른 쪽이 어긋났다.

   ── 필드 두 층 ─────────────────────────────────────────────────────────
   [기본]  n · img · ref · menu · slogan · concept · look · layout · common · prods
           R6·R7 공용. 8업종 전부 갖는다.

   [시안 실측]  src · notice · hero · catalog · reviews · figma
           Figma 시안을 실제로 열어 **텍스트·가격·이미지를 그대로 옮긴** 업종만 갖는다.
           R7 의 "○○ 시안 그대로" 프리셋이 이걸 쓴다. 없으면 layout(순서만) 으로 떨어진다.

   ── 지금 상태 ──────────────────────────────────────────────────────────
   실측 완료 : food(LOTS) · baby(LIEN) · beauty(OTHER) · sports(VELOS) · living(MODUM)
               · appliance(AIRUS, `6224:11483`)
   순서만    : apparel · fashion · pet
               ↳ 이 3종의 상품명·가격은 **시안 값이 아니라 근사치**다. VERRE(fashion)·
                 AURE(apparel)만 상품명이 시안에서 왔고 나머지 필드는 아직 근사다.

   ── 패션이 둘인 이유 ────────────────────────────────────────────────────
   apparel(AURE, 의류) 과 fashion(VERRE, 안경) 은 같은 '패션'이지만 몰의 생김새가
   다르다 — 의류는 상품 그리드가 앞에 오는 대량 진열, 아이웨어는 브랜드 먼저인
   소량 진열. 하나로 합치면 어느 쪽 사장님이 골라도 어긋난 화면이 나온다.
   그래서 라벨을 '패션의류' / '패션잡화 · 아이웨어' 로 갈라 둔다.
   (fashion 키는 R6·R7 양쪽이 참조하므로 이름은 그대로 두고 라벨만 바꿨다.)
   ═══════════════════════════════════════════════════════════════════════ */
/* dp — 그 업종 **상세페이지 기본 배치**(디자인 설정 4개 항목의 시작값).
   layout  기본형 basic / 구매영역 고정형 fixed
   imgPos  갤러리 위치 bottom · left · right
   buyStyle 구매 버튼 basic · icon(아이콘+버튼형) · vertical(세로형)
   sticky  스크롤 시 고정 none · right(우측) · bottom(하단)
   업종마다 다르게 두는 게 요점이다 — 열 업종이 모두 같은 배치면 설정이 있다는 걸 알 수 없다.
   빌더의 디자인 설정에서 언제든 바꿀 수 있고, 업종을 다시 고르면 그 업종 기본값으로 돌아온다. */
window.ONB_INDS = {
    /* footer — 이 업종 시안 푸터는 아직 안 훑었다. 구조(브랜드·3열 링크·저작권·SNS)만 시안식으로
       맞추고 **사업자 정보 줄은 비워 둔다** — 등록번호·주소를 지어내지 않는다. */
    apparel:  { dp: { layout: 'basic', imgPos: 'left', buyStyle: 'basic', sticky: 'bottom' },  /* 패션의류 — 코디컷을 세로 썸네일로 훑고, 구매는 하단 바로 따라온다 */
      cats: ['fashion'], footer: { bg: '#1c1c1c', lines: [] }, n: '패션의류', img: 'apparel', ref: 'AURE', menu: ['신상품', '베스트', '원피스', '상의', '아우터', '하의', '스커트', '액세서리', 'SALE'],
      /* 업종 카드도 히어로 배너 그림(시안 Banner_01)을 그대로 쓴다 — `thumb` 로 코디컷을
         따로 줄 수 있지만, 카드와 배너가 같은 그림이어야 고른 업종이 바로 이어져 읽힌다. */
      slogan: '햇살엔 오늘의 스타일', concept: 'cv', look: 'aure',
      /* 상품 수 기본값 고정. 게이트는 업종 순번으로 `CNTS[(i*2)%3]` 를 돌려 뽑는데
         패션의류는 0번이라 「1개(대표 상품 하나만 크게)」로 열렸다 — 시즌 신상·베스트·
         원피스·상의…로 메뉴가 9개인 몰이 상품 1개로 서는 건 업종 자체가 안 읽힌다.
         이 값이 있으면 뽑기를 건너뛴다(다른 업종은 종전대로 뽑기). */
      cnt: 24,
      /* 상세페이지 3줄 — 업종별로 갈린다. 없으면 뷰티 카피가 8업종에 그대로 나간다 */
      bullets: ['모델 착용컷과 실측 사이즈를 함께 올렸습니다', '비침·두께·신축까지 소재 그대로 적었습니다', '사이즈 교환은 첫 1회 무료'],
      /* AURE 시안 섹션 순서: 히어로(SUN'S OUT, STYLE ON) → 4분할 배너 → 상품 4x4 →
         New Arrivals 4x2 → 포토리뷰 → 추천 상품 4x1 → 브랜드 스토리 → 인스타 4컷 */
      layout: ['content-banner', 'category-shortcut', 'product-grid', 'image', 'split-banner',
        'category-tabs', 'contents-product-grid', 'product-grid', 'shorts-carousel', 'photo-review',
        'video-banner'],
      common: ['strip-banner', 'top-countdown-banner'],
      /* 상품명은 AURE 시안에 적힌 실물명(사진과 맞게 일부 손봄). 가격은 근사치 —
         시안은 전 상품이 같은 더미가(38% 23,400원)라 그대로 쓰면 10개가 전부 같은 값이 된다 */
      prods: [['여성 루즈 일본스타일 반팔', 23400], ['펀칭 오픈카라 반팔', 27900], ['체크 뷔스티에 원피스', 39000], ['스카이 시스루 가디건', 32000], ['여성용 레드 레터 프린트 반팔', 22900], ['펀칭 블라우스', 29800], ['라인스톤 스타 장식 민소매', 19900], ['여성 키치 일본스타일 반팔', 21900], ['코튼 와이드 팬츠', 42000], ['민트 발토시 1세트', 15900]] },
    /* footer — 이 업종 시안 푸터는 아직 안 훑었다. 구조(브랜드·3열 링크·저작권·SNS)만 시안식으로
       맞추고 **사업자 정보 줄은 비워 둔다** — 등록번호·주소를 지어내지 않는다. */
    fashion:  { dp: { layout: 'fixed', imgPos: 'right', buyStyle: 'vertical', sticky: 'none' },  /* 아이웨어 — 스펙을 길게 읽는 상품이라 구매영역을 상세정보 옆에 붙인다 */
      cats: ['fashion'], footer: { bg: '#14161a', lines: [] }, n: '패션잡화 · 아이웨어', img: 'fashion', ref: 'VERRE', menu: ['신상품', '베스트', '선글라스', '안경테', '티타늄', '아세테이트', '컬렉션', '액세서리', 'SALE'],
      slogan: '시선을 완성하는 프레임', concept: 'brand', look: 'verre',
      /* 상세페이지 3줄 — 업종별로 갈린다. 없으면 뷰티 카피가 8업종에 그대로 나간다 */
      bullets: ['얼굴형에 맞춘 브릿지·템플 설계', '한나절 써도 눌리지 않는 경량 티타늄', '렌즈 교체와 프레임 조정은 매장에서 무료'],
      /* VERRE 시안 섹션 순서: 히어로 → Category 3컷 → FEATURED ITEM → 브랜드 스토리 배너 → 상품 4x2 → 시즌 컬렉션 3컷 → 브랜드 영상 */
      /* 이미지 위젯은 뺐다 — 문구도 링크도 없이 흑백 얼굴 클로즈업 한 장만 전면으로 깔려서,
         위아래 섹션 사이에서 아무 역할도 하지 않았다(시안의 「시즌 컬렉션」 자리 채우기용이었다). */
      layout: ['content-banner', 'category-shortcut', 'category-tabs', 'split-banner',
        'product-grid', 'contents-product-grid', 'shorts-carousel', 'photo-review',
        'product-grid', 'video-banner'],
      common: ['strip-banner', 'top-countdown-banner'],
      /* 상품명·가격은 VERRE 시안에 적힌 실물 8종 + 2종 추가 */
      prods: [['티타늄 라운드 (실버)', 320000], ['아비에이터 (건메탈)', 380000], ['캣아이 (토르투아즈)', 350000], ['스퀘어 (블랙)', 290000], ['쉴드 (매트블랙)', 420000], ['보스턴 (골드)', 340000], ['웰링턴 (하바나)', 310000], ['오버사이즈 (블랙)', 360000], ['레드 아세테이트 (스칼렛)', 330000], ['리브드 터틀넥', 189000]] },
    /* ref 가 RUBIS → OTHER 로 바뀌었다 — 뷰티 시안을 `6223:6897`(OTHER) 로 갈았기 때문이다.
       `look: 'rubis'` 는 그대로 둔다: 그건 시안 브랜드가 아니라 **렌더 개성** 키(주얼 쇼케이스)이고
       OTHER 도 정방 컷·촘촘한 간격이라 같은 개성에 맞는다. p1~p10 은 여전히 RUBIS 목업 상품컷이다
       (시안 섹션은 fig-*.jpg 를 쓰고, 컨셉 프리셋만 p*.jpg 로 떨어진다 — food 와 같은 구조). */
    /* footer — 이 업종 시안 푸터는 아직 안 훑었다. 구조(브랜드·3열 링크·저작권·SNS)만 시안식으로
       맞추고 **사업자 정보 줄은 비워 둔다** — 등록번호·주소를 지어내지 않는다. */
    beauty:   { dp: { layout: 'basic', imgPos: 'bottom', buyStyle: 'icon', sticky: 'bottom' },  /* 화장품 — 제품컷 하나를 크게 보고 장바구니에 여러 개 담는 흐름 */
      cats: ['fashion','life'], footer: { bg: '#2a2024', lines: [] }, n: '뷰티 · 화장품', img: 'beauty', ref: 'OTHER', menu: ['신상품', '베스트', '스킨케어', '클렌징', '선케어', '메이크업', '헤어', '바디', '기획세트'],
      slogan: '피부가 먼저 아는 변화', concept: 'brand', look: 'rubis',
      /* 상세페이지 3줄 — 업종별로 갈린다. 없으면 뷰티 카피가 8업종에 그대로 나간다 */
      bullets: ['피부 결을 정돈하는 고농축 포뮬러', '끈적임 없이 스며드는 부드러운 사용감', '성분·흡수·감각까지, 모든 단계의 프리미엄'],
      /* OTHER 시안 섹션 순서(위젯 키만) — R6 은 F.figma 를 모르고 이 배열만 읽으므로,
         시안을 갈 때 여기도 같이 갈아야 R6·R7 이 같은 순서를 보여준다.
         8개뿐인 건 시안에 띠배너·카운트다운·영상·탭·카테고리 바로가기가 없기 때문이다.
         히어로 → BEST ITEMS → THE ESSENTIAL EDIT → CATEGORY → NEw Arrivals
         → NEW COLLECTION 에디토리얼 → Shorts pick → @Other.OFFICIAL */
      layout: ['content-banner', 'product-grid', 'split-banner', 'contents-product-grid',
        'product-grid', 'image', 'shorts-carousel', 'photo-review'],
      common: ['top-countdown-banner', 'strip-banner'],
      prods: [['오로라 글로우 세럼', 41000], ['레티놀 바운스 세럼', 38000], ['실크 벨벳 블러셔', 27000], ['딥 하이드라 앰플', 34000], ['톤업 글로우 스틱', 29000], ['롱래시 볼륨 마스카라', 24000], ['쿠션 베이스 세트', 52000], ['벨벳 매트 립스틱', 26000], ['시그니처 퍼퓸 50ml', 89000], ['리페어 나이트 크림', 46000]] },
    /* footer — 이 업종 시안 푸터는 아직 안 훑었다. 구조(브랜드·3열 링크·저작권·SNS)만 시안식으로
       맞추고 **사업자 정보 줄은 비워 둔다** — 등록번호·주소를 지어내지 않는다. */
    food:     { dp: { layout: 'basic', imgPos: 'bottom', buyStyle: 'vertical', sticky: 'bottom' },  /* 식료품 — 재구매가 많아 「지금 구매하기」를 세로로 크게, 하단 고정 */
      cats: ['food'], footer: { bg: '#2b1614', lines: [] }, n: '식료품', img: 'food', ref: 'LOTS', menu: ['신상품', '베스트', '저탄고지', '간편식', '베이커리', '음료', '스낵', '디저트', '기획전'],
      slogan: '건강한 식단의 시작', concept: 'repeat', look: 'lots',
      /* 상세페이지 3줄 — 업종별로 갈린다. 없으면 뷰티 카피가 8업종에 그대로 나간다 */
      bullets: ['원산지와 유통기한을 그대로 표기합니다', '저온 유통으로 받는 날까지 신선하게', '정기배송으로 두면 매번 더 저렴합니다'],
      /* LOTS 시안 섹션 순서: 히어로 → 잘 팔리는 제품 → 프로모 배너 → 새로 나온 상품 → REVIEW STORY → BRAND STORY 영상 → 브랜드 스토리 */
      layout: ['content-banner', 'category-shortcut', 'product-grid', 'category-tabs',
        'contents-product-grid', 'image', 'product-grid', 'photo-review', 'shorts-carousel',
        'video-banner', 'split-banner'],
      common: ['strip-banner', 'top-countdown-banner'],
      prods: [['그린 부스트 드링크', 6900], ['로우카브 브라우니 믹스', 12900], ['퓨얼맥스 초코바', 3500], ['키토 크런치 넛츠', 14900], ['키토블렌드 산양유', 9800], ['저탄수 통곡물 베이글', 4500], ['저당 스트로베리 케이크', 24000], ['드라이에이징 토마호크', 68000], ['하스 아보카도 4입', 12900], ['허브 램랙 스테이크', 54000]] },
    /* footer — MODUM 시안 푸터 실측(딥그린 배경 · 로고+한글명 · 사업자 3줄 · 3열 링크 · 저작권+SNS).
       사업자 정보는 시안에 적힌 값 그대로다. 시안을 안 훑은 업종은 이 lines 를 비워 둔다 —
       등록번호를 지어내면 진짜처럼 보이는 가짜 사업자 정보가 된다. */
    living:   { dp: { layout: 'fixed', imgPos: 'left', buyStyle: 'basic', sticky: 'none' },  /* 홈인테리어 — 실측·소재를 확인하며 고르므로 구매영역 고정형 */
      cats: ['living'], n: '생활용품 · 홈인테리어', img: 'living', ref: 'MODUM',
      footer: { bg: '#1E332C', kr: '모둠',
        lines: ['(주)모둠 | 대표자: 김도현',
                '본사: 서울특별시 성동구 성수이로 모둠 디자인센터',
                '사업자등록번호: 120-87-56789 | 통신판매업신고: 제 2026-서울성동-0301호'],
        cols: [
          { h: 'COMPANY', items: ['브랜드 소개', '디자인 철학', '가구 제작 공정', '인재 채용'] },
          { h: 'SUPPORT', items: ['고객 상담 센터', '1:1 온라인 문의', 'A/S 및 품질 보증', '쇼룸 안내'] },
          { h: 'LEGAL',   items: ['이용 약관', '개인정보 처리방침', '소비자 피해보상', '대량 구매 안내'] }
        ] }, menu: ['신상품', '베스트', '침실', '거실', '수납', '조명', '테이블', '키즈', '패브릭'],
      slogan: '자연을 품은 공간의 조화', concept: 'repeat', look: 'modum',
      /* 상세페이지 3줄 — 업종별로 갈린다. 없으면 뷰티 카피가 8업종에 그대로 나간다 */
      bullets: ['실측 사이즈와 소재를 그대로 적었습니다', '조립·설치까지 한 번에 끝냅니다', '공간에 놓인 사진으로 미리 확인하세요'],
      /* MODUM 시안(`6224:10858`) 섹션 순서 — R6 은 F.figma 를 모르고 이 배열만 읽으므로 함께 갈아 둔다.
         히어로 → Category(3컷) → FEATURED ITEM → SHOWROOM → MODUM Best Sellers(4x2)
         → 시즌 컬렉션 3컷 → MODUM Picks → NEW LIFESTYLE 에디토리얼
         타임세일 카운트다운은 common 이 담당한다. 시안엔 후기·영상 섹션이 아예 없다. */
      layout: ['content-banner', 'contents-product-grid', 'split-banner', 'image',
        'product-grid', 'contents-product-grid', 'shorts-carousel', 'split-banner'],
      common: ['top-countdown-banner', 'strip-banner'],
      prods: [['커브 패브릭 3인 소파', 890000], ['원목 프레임 침대', 1290000], ['라운지 체어 · 플로어 램프', 640000], ['라운드 우드 테이블', 420000], ['A형 원목 데스크', 320000], ['슬라이딩 도어 옷장', 780000], ['워크인 드레스룸 세트', 1890000], ['원목 2층 침대', 980000], ['아기 원목 침대 · 서랍장', 690000], ['사이드 테이블 · 무드 램프', 240000]] },
    /* footer — 시안(6224:11483) 푸터 실측. 사업자 정보 세 줄은 **시안에 적혀 있는 값**이라
       그대로 옮겼다(우리가 지어낸 등록번호가 아니다). 링크 3열은 시안이 한 줄로 늘어놓은
       것을 열로 나눠 담았다 — 위젯이 3열 구조라 한 줄 배치를 그대로 받지 못한다. */
    appliance: { dp: { layout: 'fixed', imgPos: 'bottom', buyStyle: 'basic', sticky: 'none' },  /* 가전 — 정보량이 가장 많은 고관여 상품, 구매영역 고정형 */
      cats: ['living'], n: '가전', img: 'appliance', ref: 'AIRUS',
      footer: { bg: '#16232e',
        lines: ['(주)에이러스 | 대표이사: 김도현 | 서울사무소: 서울시 강남구 테헤란로 215 에이러스타워',
                '본사: 경기도 화성시 동탄첨단산업1로 88 | 사업자등록번호: 123-45-67890',
                '통신판매업신고번호: 제 2026-경기화성-0301호 | 개인정보보호책임자: 이순형 | 이메일: info@airus.co.kr'],
        cols: [
          { h: 'COMPANY', items: ['브랜드 Story', '제품', '렌탈/구매', '매장'] },
          { h: 'SUPPORT', items: ['고객만족센터 1577-2580', '케어서비스', '소통존', '회사소개'] },
          { h: 'LEGAL',   items: ['개인정보처리방침', '이용약관', '이메일무단수집거부'] }
        ] },
      menu: ['제품', '렌탈/구매', '케어서비스', '공기청정기', '매장', '브랜드 Story', '소통존'],
      slogan: '매일의 물과 공기부터 다시', concept: 'trust', look: 'airus',
      /* 상세페이지 3줄 — 업종별로 갈린다. 없으면 뷰티 카피가 8업종에 그대로 나간다 */
      bullets: ['필터 등급과 소비전력까지 공개합니다', '렌탈로 시작하면 초기 부담이 없습니다', '방문 설치와 정기 점검이 포함됩니다'],
      /* AIRUS 시안(`6224:11483`) 섹션 순서 — R6·R7 은 F.figma 를 모르고 이 배열만 읽으므로 함께 갈아 둔다.
         시안 실제 순서: 3분할 히어로 → BEST 제품 → 듀얼 배너 → 에디토리얼(SIGNATURE ITEM)
                       → 카테고리별 추천(탭) → 브랜드 콘텐츠 3컷 → 영상 → 브랜드 약속.
         전에 여기 있던 카테고리 바로가기·포토리뷰·쇼츠·이미지는 **시안에 없는 섹션**이었다. */
      layout: ['content-banner-3', 'product-grid', 'content-banner-3', 'split-banner',
        'category-tabs', 'contents-product-grid', 'video-banner', 'content-banner'],
      /* 시안 상단 띠는 헤더 공지(F.notice)라 띠배너 위젯이 아니다. 카운트다운도 시안에 없다 */
      common: [],
      prods: [['실버 미러 정수기', 1290000], ['화이트 슬림 정수기', 990000], ['냉온 스탠드 정수기', 1490000], ['언더싱크 직수 필터', 390000], ['대용량 공기청정기', 890000], ['무선 에어 스타일러', 490000], ['히트펌프 건조기', 1590000], ['초음파 가습기', 290000], ['컴팩트 데스크 정수기', 690000], ['프리미엄 미러 정수기', 1890000]] },
    /* footer — 이 업종 시안 푸터는 아직 안 훑었다. 구조(브랜드·3열 링크·저작권·SNS)만 시안식으로
       맞추고 **사업자 정보 줄은 비워 둔다** — 등록번호·주소를 지어내지 않는다. */
    baby:     { dp: { layout: 'basic', imgPos: 'left', buyStyle: 'vertical', sticky: 'bottom' },  /* 육아 — 성분·후기를 확인하며 내려가므로 하단 고정 바 */
      cats: ['life'], footer: { bg: '#3a2b2f', lines: [] }, n: '육아', img: 'baby', ref: 'LIEN', menu: ['신상품', '베스트', '외출복', '아기띠', '슬립웨어', '악세서리', '목욕용품', '식기', '시즌오프'],
      slogan: '까다롭게 골라 담았습니다', concept: 'trust', look: 'lien',
      /* 상세페이지 3줄 — 업종별로 갈린다. 없으면 뷰티 카피가 8업종에 그대로 나간다 */
      bullets: ['유해물질 시험 성적서를 공개합니다', '아이 피부에 닿는 면은 순면 100%', '여러 번 세탁해도 형태가 남습니다'],
      /* LIEN 시안 섹션 순서: 히어로 → 카테고리 스트립 → 시즌오프 → 브랜드 스토리 → 상품 → 100가지 아이템 → 웰컴 혜택 → 인스타 피드 */
      layout: ['content-banner', 'category-shortcut', 'category-tabs', 'split-banner', 'product-grid',
        'contents-product-grid', 'image', 'photo-review', 'shorts-carousel',
        'product-grid', 'video-banner'],
      common: ['strip-banner', 'top-countdown-banner'],
      prods: [['깅엄 체크 반팔 세트', 32000], ['방수 스카프 빕', 9900], ['애플 그래픽 티셔츠', 18000], ['코튼 이지 반바지', 21000], ['어드벤처 베어 티셔츠', 19000], ['체리 버킷햇', 16000], ['실리콘 이유식 식기', 27000], ['실리콘 스푼·포크 세트', 12000], ['출산 선물 기프트박스', 68000], ['리본 기프트 랩', 8000]] },
    /* hero — MORU 시안의 로고타입(벡터 6223:8434)을 대표컷에 구워 넣은 판. LIEN 과 같은 방식이다.
       시안에서 실제 로고타입(벡터)인 브랜드는 LIEN·MORU 둘뿐이고 나머지는 텍스트 노드다. */
    /* footer — 이 업종 시안 푸터는 아직 안 훑었다. 구조(브랜드·3열 링크·저작권·SNS)만 시안식으로
       맞추고 **사업자 정보 줄은 비워 둔다** — 등록번호·주소를 지어내지 않는다. */
    pet:      { dp: { layout: 'basic', imgPos: 'bottom', buyStyle: 'icon', sticky: 'none' },  /* 반려동물 — 단순한 기본형, 고정 없이 */
      cats: ['life'], footer: { bg: '#241f1b', lines: [] }, n: '반려동물', add: 1, img: 'pet', ref: 'MORU', hero: 'hero-logo.jpg',
      /* heroBanner — 육아(LIEN)와 같은 히어로 구성: 로고 구워 넣은 사진 + 하단 중앙 문구·버튼.
         문구는 MORU 시안 실측이 아니라 이 업종의 slogan 이다(시안 텍스트는 아직 안 훑었다). */
      heroBanner: { desc: '부드러운 온기, 함께하는 매일', btn: '브랜드 스토리' },
      menu: ['신상품', '베스트', '가구', '식기', '간식', '산책', '침구', '미용', '브랜드'],
      slogan: '부드러운 온기, 함께하는 매일', concept: 'trust', look: 'moru',
      /* 상세페이지 3줄 — 업종별로 갈린다. 없으면 뷰티 카피가 8업종에 그대로 나간다 */
      bullets: ['삼키거나 긁어도 괜찮은 무해 마감', '체중·크기별로 맞는 것을 고르세요', '커버는 분리해서 세탁할 수 있습니다'],
      /* MORU 시안 섹션 순서: 히어로 → 사은품 배지 → 상품 → Our Philosophy → 라인업 → 이미지 → 섹션 → 후기 */
      layout: ['content-banner', 'category-shortcut', 'product-grid', 'split-banner',
        'category-tabs', 'image', 'contents-product-grid', 'photo-review', 'shorts-carousel',
        'product-grid', 'video-banner'],
      common: ['strip-banner', 'top-countdown-banner'],
      prods: [['수제 오트 비스킷', 12000], ['높이조절 원목 식기 스탠드', 68000], ['데일리 트릿 믹스', 15000], ['우드 캣 해먹', 89000], ['원목 캣타워', 189000], ['코튼 넥밴드', 24000], ['캣콘솔 소파', 690000], ['월 마운트 캣 선반', 128000], ['패브릭 펫 스툴', 96000], ['트레이닝 트릿 스틱', 9000]] },
    /* footer — 이 업종 시안 푸터는 아직 안 훑었다. 구조(브랜드·3열 링크·저작권·SNS)만 시안식으로
       맞추고 **사업자 정보 줄은 비워 둔다** — 등록번호·주소를 지어내지 않는다. */
    /* 건강기능식품 — DAILYPRO 시안(`6223:8962`). 식료품(LOTS)과 카드를 나눈 이유:
       LOTS 는 장보기(원산지·신선도·정기배송), DAILYPRO 는 건기식(맛 고르기·구독·리뷰)이라
       진열 성격이 다르다. 한 카드에 시안 두 개를 넣을 수도 없다. */
    /* noPset — 이 업종 폴더엔 공용 상품컷 p1..p10.jpg 가 없다(시안 원본만으로 채웠다).
       표시해 두면 렌더러가 없는 경로를 부르지 않고 카탈로그(fig-c*)에서 뽑는다 — _r7.js pimg(). */
    health:   { dp: { layout: 'fixed', imgPos: 'right', buyStyle: 'vertical', sticky: 'none' },  /* 건기식 — 맛·용량을 고르며 상세를 읽는다, 구매영역 고정형 */
      cats: ['food','life'], footer: { bg: '#1d2620', lines: [] }, n: '건강기능식품', add: 1, img: 'health', ref: 'DAILYPRO', noPset: 1,
      /* 이 폴더엔 시안 실측 컷(fig-*)만 있고 범용 hero.jpg/split.jpg 가 없다 — 엔진이
         그 두 이름을 참조할 때(cutOf) 여기 대체컷으로 간다. 없으면 404 로 빈 칸이 된다.
         ⚠ 다른 위젯이 이미 쓰는 컷으로 보내면 안 된다 — 같은 사진이 연달아 두 번 깔린다.
         이 업종이 이미 쓰는 컷: fig-hero(콘텐츠 배너)·fig-brand(이미지+글)·fig-recipe1(이미지)·
         fig-benefit1·fig-c1·fig-c5·fig-rv1·fig-promo2(스크롤 배너). 남은 컷으로 보낸다. */
      cuts: { 'hero.jpg': 'fig-promo1.jpg', 'split.jpg': 'fig-promo2.jpg' },
      menu: ['BEST', '이벤트', '카테고리'],
      slogan: '오늘도, 내일도 나의 건강레시피', concept: 'repeat', look: 'lots',
      bullets: ['1회분 단백질 25g · 저당 포뮬러', '끈적임 없이 빠르게 녹는 분말', '맛별·용량별로 골라 담습니다'],
      /* DAILYPRO 시안 섹션 순서 — R6 은 F.figma 를 모르고 이 배열만 읽으므로 함께 갈아 둔다.
         히어로 → 혜택 2분할 → 베스트 상품 → 신제품 → 프로모 띠 → 콘텐츠+상품 3열
         → 카테고리(맛) 탭 → 러닝 이미지 → 포토리뷰 → 건강정보 레시피 → 브랜드 배너 */
      layout: ['content-banner', 'content-banner-3', 'product-grid', 'product-grid',
        'contents-product-grid', 'category-tabs', 'image', 'photo-review', 'split-banner'],
      common: ['strip-banner'],
      prods: [['파워쉐이크 프로틴 (초코)', 23400], ['파워쉐이크 프로틴 (초코 파우치)', 23400],
        ['파워쉐이크 프로틴 (딸기)', 23400], ['파워쉐이크 프로틴 (바닐라)', 23400],
        ['파워쉐이크 프로틴 (바닐라 파우치)', 23400], ['파워쉐이크 프로틴 (말차)', 23400],
        ['파워쉐이크 프로틴 (바나나)', 23400], ['파워쉐이크 프로틴 (그레인)', 23400]] },
    sports:   { dp: { layout: 'basic', imgPos: 'right', buyStyle: 'icon', sticky: 'bottom' },  /* 스포츠 — 사이즈를 고르는 상품, 아이콘+버튼형에 하단 고정 */
      cats: ['life','fashion'], footer: { bg: '#101418', lines: [] }, n: '스포츠 · 레저', add: 1, img: 'sports', ref: 'VELOS', menu: ['신상품', '베스트', '러닝', '트레이닝', '테니스', '아웃도어', '슈즈', '액세서리', 'SALE'],
      slogan: '매일의 러닝을 지속하는 가벼움', concept: 'cv', look: 'velos',
      /* 상세페이지 3줄 — 업종별로 갈린다. 없으면 뷰티 카피가 8업종에 그대로 나간다 */
      bullets: ['실착 무게와 드롭까지 표기합니다', '땀을 빠르게 밀어내는 기능성 원단', '사이즈 교환 1회는 무료입니다'],
      /* VELOS 시안(`6224:9813`) 섹션 순서 — R6 은 F.figma 를 모르고 이 배열만 읽으므로 함께 갈아 둔다.
         히어로 → V-STREET → Active Wear → SHOP BY SPORTS(탭) → RunningSplit
         → VELOS STYLE → SINCE 2026 배너 → OUR STORIES → SOMA Picks → BRAND STORY 영상
         티커 문구(RUN FAST…)는 common 의 띠배너가 담당한다. R6 에는 「세 칸 배너」 키가 없어
         2단·3컷 섹션을 split-banner/contents-product-grid 로 근사한다(R7 은 세 칸 배너로 정확히 그린다). */
      layout: ['content-banner', 'product-grid', 'contents-product-grid', 'category-tabs',
        'split-banner', 'photo-review', 'image', 'contents-product-grid',
        'shorts-carousel', 'video-banner'],
      common: ['strip-banner', 'top-countdown-banner'],
      prods: [['벨로시티 러닝화', 129000], ['윈드브레이커 재킷', 98000], ['플리츠 테니스 스커트', 64000], ['트레이닝 우븐 쇼츠', 39000], ['스트리트 러닝화 실버', 149000], ['카고 조거 팬츠', 79000], ['하프집 트랙 재킷', 89000], ['러닝 바이저', 32000], ['코트 스니커즈 버건디', 119000], ['라이트 집업 자켓', 72000]] }
  };

/* ── LOTS(식료품) — Figma `6223:6335`(carbx-food-brand-webpage) 실측 ─────
   ⚠ 시안 자체가 상품명과 사진이 어긋나 있다(카드 4장). 아래는 **시안에 붙어 있는 그대로**
     옮긴 것이고, 고치지 않았다 — 어긋난 짝은 각 항목의 `mismatch` 에 적어 뒀다.        */
(function (F) {
  F.src = '6223:6335';

  /* 상단 공지 띠 — 시안 announcement */
  F.notice = '신규 가입 시 5,000원 할인 혜택! 첫 구매 20% 쿠폰 증정';

  /* nav-bar 메뉴 — 시안은 4개다(전에 쓰던 9개는 지어낸 값이었다) */
  F.menu = ['전체상품', '이벤트', '리뷰', '고객센터'];
  /* 시안 상단 announcement 띠 실측 — 헤더 소속이라 별도 띠배너 위젯으로 만들지 않는다 */
  F.notice = '신규 가입 시 5,000원 할인 혜택! 첫 구매 20% 쿠폰 증정';

  /* 상품 카드 8종 — 이름 · 설명 · 할인율 · 판매가 · 정가 전부 시안 실측 */
  F.catalog = [
    { n: '키토제닉 프리미엄 산양유 블렌드', d: '풍부한 영양과 부드러운 목넘김',      sale: '52%', price: 9500,  orig: 22500, img: 'fig-c1.jpg', mismatch: '사진은 그린 주스(FUEL UP) 병' },
    { n: '아보카도 (2구)',                d: '숲속의 버터, 신선한 완숙 아보카도',    sale: '25%', price: 3800,  orig: 5100,  img: 'fig-c2.jpg' },
    { n: '저탄수 무가당 플레인 베이글',    d: '담백하고 쫄깃한 식감의 건강 베이글',   sale: '58%', price: 4200,  orig: 9900,  img: 'fig-c3.jpg' },
    { n: '키토 저당 무화과 모찌',          d: '쫀득한 식감과 달콤한 무화과의 만남',   sale: '15%', price: 8900,  orig: null,  img: 'fig-c4.jpg', mismatch: '사진은 저탄수 브라우니 믹스 파우치' },
    { n: '뉴욕 스타일 치즈케이크',         d: '깊고 진한 치즈의 풍미를 그대로',       sale: '20%', price: 7500,  orig: null,  img: 'fig-c5.jpg', mismatch: '사진은 프로틴 초코바 더미' },
    { n: '허니 갈릭 윙 (반건조)',          d: '맥주 안주로 최고, 중독적인 맛',        sale: '10%', price: 14900, orig: null,  img: 'fig-c6.jpg', mismatch: '사진은 구운 아몬드 파우치' },
    { n: '리얼 다크 초코 바',              d: '당류 0g, 무설탕 프리미엄 초콜릿',      sale: '25%', price: 3200,  orig: null,  img: 'fig-c7.jpg' },
    { n: '최고급 양갈비 숄더랙',           d: '풍부한 육즙과 연한 육질의 최상급 부위', sale: '25%', price: 39000, orig: 82000, img: 'fig-c8.jpg' }
  ];

  /* REVIEW STORY — 시안에 적힌 후기 4개 그대로 */
  F.reviews = [
    { t: '처음인데도 정말 좋네요',    x: '냄새도 안 나고 고기가 너무 부드러워서 아이들도 정말 잘 먹네요. 재구매 의사 200%입니다.',      by: '— 김*현 고객님', img: 'fig-rv1.jpg' },
    { t: '생각보다 훨씬 고소해요',    x: '저탄고지 식단 하면서 우유 대용으로 샀는데 너무 만족스러워요. 포장도 꼼꼼하게 와서 안심했습니다.', by: '— 이*미 고객님', img: 'fig-rv2.jpg' },
    { t: '간식 대신 먹기 딱 좋아요',  x: '입이 심심할 때 한 봉지씩 꺼내 먹는데 죄책감도 안 들고 맛도 훌륭합니다. 세일할 때 쟁여두려구요.', by: '— 박*준 고객님', img: 'fig-rv3.jpg' },
    { t: '인생 치즈케이크를 만났네요', x: '설탕 없이 어떻게 이런 맛이 나는지 신기해요. 냉동실에 넣어두고 야금야금 먹고 있어요.',        by: '— 최*서 고객님', img: 'fig-rv4.jpg' }
  ];

  /* 섹션 순서 — 위젯 키 나열이 아니라 **시안 섹션 그대로**의 목록이다.
     같은 위젯이 두 번 나와도 되고(상품 그리드 2회), 각 섹션의 문구를 함께 들고 있다.
     `items` 는 catalog 인덱스 — 시안이 같은 상품을 여러 카드에 재사용하는 것까지 그대로. */
  /* ── 섹션 순서 = Figma node 6223:6335(carbx-food-brand-webpage) 실측 ─────────
     시안 실제 순서: 히어로 → Category TOP3 → 프로모 배너 → 잘 팔리는 제품
                   → EAT'S / A LOTS 대형 타이포 → 새로 나온 상품(탭)
                   → REVIEW STORY → BRAND STORY 영상 → Our Story
     `items` 는 catalog 인덱스 — 시안이 같은 상품을 여러 카드에 재사용하는 것까지 그대로. */
  F.figma = [
    { w: 'content-banner', style: 'wide', img: 'fig-hero.jpg',
      title: '건강한 식단의 시작 좋은 지방으로 채우세요',
      desc: '불필요한 당류는 줄이고, 몸에 좋은 건강한 지방과 영양을 가득 채운 저탄고지 전문 브랜드 LOTS입니다.',
      btn: '쇼핑 시작하기',
      /* 대표 이미지는 같은 파일의 다른 배너 `6223:6832`(스파게티 · 1440x640 · 문구 없음)로 교체했다.
         문구는 원 시안 `6223:6335` 히어로 텍스트를 그대로 둔다 — 사진만 갈았다.
         이 이미지가 업종 칩 썸네일도 겸한다(heroOf() 가 figma[0].img 를 읽는다).
         넓은 배너 · 텍스트 위치는 디폴트(하단 좌측) — 사진 왼쪽이 비어 있어 글이 그 위에 얹힌다.
         전에는 split(좌 사진 / 우 글)이라 사진이 반쪽 칸에만 들어갔다. */
      approx: '히어로 — 사진은 시안 `6223:6832` 배너로 갈았고 문구는 `6223:6335` 원 히어로 그대로다. 제목 2줄(44px)이 배너 위젯에서는 한 줄로 합쳐진다' },

    /* Category — 시안은 3열, 열마다 480x300 대표컷(영문 카테고리명) + 그 아래 TOP1 상품 하나 */
    { w: 'contents-product-grid', title: 'Category', desc: '카테고리별 TOP3 제품을 만나보세요.',
      cards: [
        { img: 'fig-cat1.jpg', title: 'Vegetables', desc: 'Precious foods from nature', items: [1] },
        { img: 'fig-cat2.jpg', title: 'Meat',       desc: 'Precious foods from nature', items: [7] },
        { img: 'fig-cat3.jpg', title: 'Pasta',      desc: 'Precious foods from nature', items: [2] }
      ],
      approx: 'Category — 시안은 카드마다 상품 1개(TOP1)인데 콘텐츠+상품 그리드는 카드 안에 상품 행을 여러 개 깐다' },

    /* 텍스트 위젯이던 자리 → **이미지+글**(좌 텍스트 / 우 이미지)로 바꿨다.
       시안이 바로 그 구조다(좌측에 20%·체크 2줄, 우측에 스테이크 사진). 텍스트 위젯은
       사진 칸이 없어 회색 바탕에 글만 남아 미완성으로 보였고, 그동안 fig-promo.jpg(시안의
       그 스테이크컷)는 파일만 있고 아무 데도 안 붙어 있었다. */
    /* 첫 구매 20% 할인 — 시안 섹션을 **렌더 그대로** 받아 얹었다(2026-08-12, Frame.png).
       그래서 이미지+글 위젯이 아니라 이미지 위젯이다: 큰 「20%」·세로 구분선·체크 아이콘까지
       그림에 들어 있으므로 위젯이 글을 또 얹으면 같은 문구가 두 번 나온다.
       높이 405 = 그림 비율(3.31:1) × 캔버스 실측 폭(1342) — 위젯 기본 높이면 좌우가 잘린다. */
    { w: 'image', img: 'fig-welcome.png', height: 405, padX: 0,
      approx: '프로모 배너 — 시안 렌더를 이미지로 얹었다. 글이 그림에 포함돼 있어 위젯의 문구·버튼 칸은 쓰지 않는다(대신 문구를 캔버스에서 고칠 수는 없다)' },

    { w: 'product-grid', title: '지금 가장 잘 팔리고 있어요 🔥', more: true, items: [0, 1, 2, 0] },

    /* EAT'S / A LOTS — 시안 렌더 한 장으로 갈았다(2026-08-12, Container.jpg). 전엔 정사각 2장을
       이미지 위젯 둘로 세로로 쌓고 타이포는 아예 없었다(위젯이 텍스트를 못 얹는다).
       이제 두 칸과 타이포가 한 그림에 들어 있어 시안과 같은 한 블록이 된다.
       높이 664 = 그림 비율(2.02:1) × 캔버스 실측 폭(1342). */
    { w: 'image', img: 'fig-eats.jpg', height: 664, padX: 0,
      approx: "EAT'S / A LOTS — 시안 렌더를 그대로 얹었다. 두 칸을 가르는 선·대형 타이포가 그림에 포함돼 있다" },

    { w: 'category-tabs', title: '새롭게 나온 상품들이에요 🌿',
      desc: '맛별로, 용량별로 나에게 맞는 제품을 선택해보세요.',
      tabs: ['채소', '고기', '파스타'] },

    { w: 'photo-review', kicker: 'REVIEW STORY', title: '솔직한 후기로 검증된 고객님들의 이유있는 선택' },

    { w: 'video-banner', kicker: 'BRAND STORY', title: '직접 보고 확인하세요', img: 'fig-video.jpg' },

    { w: 'split-banner', kicker: 'Our Story', img: 'fig-story.jpg',
      title: '가장 신선한 재료가 최고의 식단이 됩니다',
      desc: 'LOTS는 원재료의 가치를 믿습니다. 전 세계에서 찾아낸 건강한 지방과 엄선된 고단백 재료로, 당신이 꿈꾸던 지속 가능한 키토 라이프스타일을 완성합니다. 불필요한 당은 덜어내고 본연의 맛과 영양은 가득 채웠습니다.',
      btn: '브랜드 철학 보기' }
  ];
})(window.ONB_INDS.food);
/* ── LIEN(육아) — Figma `6223:7696`(리앙) 실측 ──────────────────────────
   ⚠ 시안 자체가 미완성인 자리가 있다. 고치지 않고 **시안 그대로** 옮기고 아래에 적어 둔다:
     · 브랜드 표기가 LIEN / 리앙 / LIKO 세 가지로 섞여 있다(로고는 LIEN, 상품 배지는 LIKO)
     · '리앙 베이비' 섹션의 상품 카드 문구가 뷰티 자리표시자로 남아 있다
       (「Strong → 레티놀 바운스 세럼」) — 그 섹션은 카탈로그 상품으로 채웠다
     · 인스타 섹션 헤드라인이 다른 브랜드 계정(@konny.kr)이다
   상품 이미지는 기존 p1~p10 이 같은 목업에서 추출한 것이라 그대로 쓴다(p1 = 깅엄체크 세트). */
(function (F) {
  F.src = '6223:7696';

  /* 상단 공지 띠 — 시안 announcement */
  F.notice = '신규 가입 시 5,000원 할인 혜택! 첫 구매 20% 쿠폰 증정';

  /* nav-bar 메뉴 — 시안은 5개다 */
  F.menu = ['전체상품', '이벤트', '리뷰', '고객센터', '브랜드'];

  /* 상품 8종 — 이름 · 설명 · 할인율 · 판매가 · 정가 전부 시안 실측
     (시즌오프 4종 + 데일리 아이템 3종 + 선물세트 1종) */
  F.catalog = [
    { n: '블루 깅엄체크 파자마 상하복 세트', d: '시원한 코튼 소재의 깅엄체크 상하복. 편안한 핏으로 잠옷은 물론 홈웨어로도 활용 가능', sale: '51%', price: 18900, orig: 39000, img: 'p1.jpg' },
    { n: '애플 그래픽 반팔 티셔츠 세트',     d: '귀여운 사과 프린트 그래픽 티셔츠와 민트 쇼츠 세트. 통기성 좋은 여름 코디',            sale: '49%', price: 22900, orig: 45000, img: 'p3.jpg' },
    { n: '베어 프렌즈 그래픽 코튼 티셔츠',   d: '캐주얼한 곰돌이 그래픽의 순면 반팔티. 넉넉한 핏으로 활동량 많은 아이에게 딱',          sale: '47%', price: 19800, orig: 38000, img: 'p5.jpg' },
    { n: '핑크 스트라이프 플레어 원피스',    d: '상큼한 핑크 스트라이프의 플레어 원피스. 여름 나들이에 어울리는 화사한 디자인',          sale: '47%', price: 16900, orig: 32000, img: 'p4.jpg' },
    { n: '체리 프린트 오가닉 원피스 (3컬러)', d: '귀여운 체리 패턴의 코튼 원피스. 세 가지 컬러로 기분에 따라 골라 입는 재미',            sale: '32%', price: 14900, orig: 22000, img: 'p2.jpg' },
    { n: 'UV차단 아동 래쉬가드 올인원',      d: 'UPF50+ 자외선 차단 올인원 래쉬가드. 물놀이 시 피부 보호에 최적',                      sale: '40%', price: 34900, orig: 59000, img: 'p6.jpg' },
    { n: 'LIKO 퀵드라이 후드 비치 판초',     d: '물놀이 후 빠르게 건조되는 극세사 후드 판초. 자외선 차단 기능 포함',                    sale: '33%', price: 29900, orig: 45000, img: 'p7.jpg' },
    { n: '[선물세트] 리앙 에센셜 아기띠 프리미엄 세트', d: '아기띠 본품과 수면후드, 침받이를 함께 구성한 프리미엄 올인원 패키지',        sale: '',    price: 64900, orig: null, img: 'p8.jpg' }
  ];

  /* 인스타 후기 4개 — 시안에 적힌 그대로 */
  F.reviews = [
    { t: '여행갈 때 입히기 딱이에요',     x: '딸이 너무 좋아해요! 소재가 부드럽고 활동하기 편해서 여행 내내 이것만 입었어요. 다음엔 색상 다르게 하나 더 살게요.', by: '— 김*현 고객님', img: 'p2.jpg' },
    { t: '아이가 직접 골랐어요',         x: '딸이 거울 보면서 너무 좋아했어요. 핑크 가디건이 얼마나 예쁜지 학교에도 입고 갔답니다. 세탁해도 색 안 빠져요.',   by: '— 이*미 고객님', img: 'p4.jpg' },
    { t: '코디하기 너무 좋아요',         x: '스트라이프 티에 데님 쇼츠 조합 완벽해요. 운동화까지 세트로 맞추니 아이가 패션모델 같아졌어요. 가성비도 최고!',   by: '— 박*준 고객님', img: 'p5.jpg' },
    { t: '선물로 보냈더니 대만족이에요', x: '조카 생일선물로 보냈는데 포장이 너무 예뻐서 받자마자 감동했대요. 옷 퀄리티도 좋고 사이즈도 딱 맞았어요.',       by: '— 최*서 고객님', img: 'p8.jpg' }
  ];

  /* 섹션 순서 = 시안 실측. 위젯 키 나열이 아니라 섹션 스펙이라 같은 위젯이 두 번 나와도 된다. */
  F.figma = [
    /* 히어로(Banner_PC_1 6223:7719, 1440x640) — 사진 한 장을 꽉 채우고 그 위 **하단 중앙**에
       로고·2줄 문구·알약 버튼이 얹힌다. 전에는 split(좌 글 / 우 사진)으로 잡아 놨는데,
       시안은 좌우 분할이 아니라 풀블리드 오버레이다. 문구도 브랜드 스토리 섹션 카피를
       잘못 끌어다 썼었다 — 여기 문구는 6223:7734 그대로다. */
    /* 「LIEN」은 몰 글꼴로 칠 수 없는 둥근 로고타입(벡터 6223:7729)이라 **배경 이미지에 구워 넣었다**
       — 시안 좌표(1440x640 배너 안 x=621.46 y=386 w=197.08 h=74.6) 그대로 얹은 fig-hero-logo.jpg.
       실제 몰 사장님도 같은 방식을 쓴다(로고가 박힌 배너를 「PC 이미지」로 올린다).
       그래서 제목은 비워 둔다 — 위젯 텍스트로 한 번 더 쓰면 로고가 두 번 나온다. */
    { w: 'content-banner', style: 'wide', img: 'fig-hero-logo.jpg', pos: 7,
      desc: 'LIEN은 아이의 민감한 피부를 위해 GOTS 인증 유기농 순면과 천연 소재만을 사용합니다. 엄마의 마음으로 만든 프리미엄 키즈의류.',
      btn: '브랜드 스토리',
      approx: '히어로 — 로고는 배너 이미지에 구워 넣었다(위젯에 로고 필드가 없다). 사진에 박혀 있으므로 「텍스트 위치」를 바꿔도 로고는 따라가지 않는다. 버튼도 시안은 더스티핑크 알약인데 위젯은 몰 주요 색상을 쓴다' },

    { w: 'category-shortcut', title: '카테고리',
      desc: '시즌오프 · 베스트셀러 · 외출복 · 아기띠 · 슬립웨어 · 악세서리 · 목욕용품',
      approx: '카테고리 스트립 — 시안은 7개인데 카테고리 바로가기 위젯은 4개까지만 그린다' },

    { w: 'category-tabs', title: '최대 60% 역대급 할인 찬스',
      desc: '컬러/사이즈가 있다면 놓칠 수 없는 시즌오프',
      tabs: ['전체', '상의', '하의', '원피스', '아우터'] },

    { w: 'split-banner', kicker: 'BRAND STORY', img: 'split.jpg',
      title: 'Our Beginning 리앙이 시작된 이유',
      desc: '아이를 처음 안았던 순간, 세상에서 가장 부드러운 것으로 감싸주고 싶었습니다. 리앙는 그 마음에서 시작되었습니다. 엄마의 품처럼 편안하고, 자연에 가까운 소재로 아이의 하루를 감쌉니다.',
      btn: '브랜드 스토리 보기' },

    { w: 'product-grid', title: '아이의 개성을 살려주는 데일리 아이템',
      desc: '고르는 재미가 있는 100가지의 LIKO 아이템', items: [4, 1, 2, 3, 5, 6, 0, 7] },

    { w: 'contents-product-grid', title: '아이의 피부에 닿는 모든 순간을 생각한',
      desc: '고르는 재미가 있는 100가지의 리앙 베이비',
      cards: [
        { img: 'p2.jpg', title: '외출복',   desc: '나들이용 데일리 코디', items: [4, 3] },
        { img: 'p6.jpg', title: '물놀이',   desc: '자외선 차단 아이템',   items: [5, 6] },
        { img: 'p8.jpg', title: '선물세트', desc: '출산·생일 선물',       items: [7, 0] }
      ],
      approx: '리앙 베이비 섹션 — 시안의 상품 카드 문구가 뷰티 자리표시자(레티놀 세럼)로 남아 있어, 지어내지 않고 카탈로그 상품으로 채웠다' },

    /* 텍스트 위젯 → 이미지+글(좌 텍스트 / 우 이미지). 시안 이 자리엔 사진이 없어서
       사진은 카탈로그의 선물 상자컷(p9)을 골랐다 — 지어낸 이미지가 아니라 이 몰의 상품컷이고,
       「가입 혜택·선물」 맥락과 맞는다. 시안 근거가 없는 선택이므로 아래 approx 에 적어 둔다. */
    { w: 'split-banner', kicker: '5,000원 웰컴 쿠폰 · 전제품 무료 교환·반품',
      title: '첫 가입 시 바로 사용 가능한 육아맘 혜택',
      desc: '아이 피부에 닿는 제품, 리앙의 약속', img: 'p9.jpg', btn: null,
      approx: '혜택 2블록 — 시안은 쿠폰·교환반품을 아이콘과 함께 2단으로 놓는다. 여기서는 좌 텍스트/우 이미지 한 덩어리로 그리고, 시안에 없는 우측 사진은 카탈로그 선물상자컷(p9)으로 채웠다' },

    { w: 'product-grid', title: '마음을 전할 때, 리앙 선물하기',
      desc: '소중한 분께 따뜻한 리앙를 선물해보세요', items: [7, 0, 4, 3] },

    /* 텍스트 위젯 → **사진 위에 글**(넓은 배너). 인용문은 좌우로 쪼개는 것보다 사진 한 장을
       꽉 채우고 그 위에 얹는 쪽이 맞다. pos 4 = 중앙 정렬. 사진은 이 업종의 유일한 라이프스타일
       컷(fig-hero)이라 마지막 영상 배너와 같은 파일을 쓴다 — 둘 사이가 멀어 붙여넣기로는 안 읽힌다. */
    { w: 'content-banner', style: 'wide', img: 'fig-hero.jpg', pos: 4,
      title: '"좋은 제품이 주는 작은 여유가 육아의 마음을 바꿀 수 있다고 믿어요."',
      desc: '— 리앙 브랜드 미션',
      approx: '브랜드 미션 — 시안은 글만 있는 블록이다. 회색 바탕에 글만 남으면 미완성으로 보여 사진 위 오버레이로 바꿨고, 그 사진은 시안 근거가 아니라 같은 업종 히어로컷을 다시 쓴 것이다' },

    { w: 'photo-review', kicker: '리앙와 함께하기',
      title: '@konny.kr — 인스타그램 속 생생한 리앙 라이프',
      approx: '인스타 섹션 — 시안 헤드라인이 다른 브랜드 계정(@konny.kr)이다. 시안 그대로 뒀다' },

    { w: 'image', img: 'split.jpg',
      approx: '시즌 컬렉션 에디토리얼 — 시안은 이미지 위에 「리앙 시즌 컬렉션」 문구가 얹히는데 이미지 위젯은 텍스트를 못 얹는다' },

    { w: 'video-banner', kicker: 'BRAND STORY', title: '리앙 시즌 컬렉션', img: 'fig-hero.jpg' }
  ];
})(window.ONB_INDS.baby);

/* ── OTHER(뷰티 · 화장품) — Figma `6223:6897` 실측 ───────────────────────
   ⚠ 시안 자체가 어긋난 자리가 있다. 고치지 않고 **시안 그대로** 옮기고 아래에 적어 둔다:
     · 브랜드 표기가 네 가지로 섞여 있다 — 로고 `OTHER` / 푸터 저작권 `OTEP BEAUTY` /
       인스타 `@Other.OFFICIAL` / Category 상품 패키지 `MOOD`. BEST ITEMS 상품 사진의
       패키지는 또 `CIB` · `CLOUD CANDY` · `LASH POP` 이다
     · BEST ITEMS 4·5번 카드는 **이름과 사진이 서로 바뀌어 있다**
       (「Clean Lash Gloss」에 콤팩트 사진, 「Soft Glow Highlighter」에 마스카라 사진)
     · Category 두 번째 카드(BASE MAKE UP)의 할인율·판매가·정가·리뷰수가 첫 카드와 똑같다
     · 상품명이 BEST ITEMS/NEW ARRIVALS 는 영문, Category TOP3 는 국문으로 갈린다
   섹션은 8개다(식료품 10 · 육아 12보다 적다) — 시안에 띠배너·카운트다운·영상·탭·
   카테고리 바로가기 섹션이 아예 없기 때문이다. 없는 섹션을 지어 넣지 않았다.       */
(function (F) {
  F.src = '6223:6897';

  /* nav-bar 메뉴 — 시안은 영문 5개다(전에 쓰던 국문 9개는 지어낸 값이었다) */
  F.menu = ['SHOP', 'ABOUT', 'ARCHIVE', 'STORE', 'COMMUNITY'];

  /* 상품 8종 — 0~4 는 BEST ITEMS/NEW ARRIVALS 영문 카드(시안엔 설명이 없다),
     5~7 은 Category TOP3 의 국문 카드. 이름·할인율·판매가·정가 전부 시안 실측. */
  F.catalog = [
    { n: 'Tone-Up Skin Balm',      d: '', sale: '20%', price: 28000, orig: null, img: 'fig-c1.jpg' },
    { n: 'Solar Tint Dual Duo',    d: '', sale: '15%', price: 32000, orig: null, img: 'fig-c2.jpg' },
    { n: 'Meme-Me Matte Lipstick', d: '', sale: '10%', price: 24000, orig: null, img: 'fig-c3.jpg' },
    { n: 'Clean Lash Gloss',       d: '', sale: '',    price: 18000, orig: null, img: 'fig-c4.jpg', mismatch: '사진은 「CLOUD CANDY」 파우더 콤팩트 — 5번 카드와 이름이 서로 바뀌어 있다' },
    { n: 'Soft Glow Highlighter',  d: '', sale: '',    price: 34000, orig: null, img: 'fig-c5.jpg', mismatch: '사진은 「LASH POP」 마스카라 3종 — 4번 카드와 이름이 서로 바뀌어 있다' },
    { n: '글로우업 립스틱',        d: '가볍고 산뜻한컬러의 립스틱',        sale: '38%', price: 27500, orig: 50000, img: 'fig-c6.jpg' },
    { n: '글로우업 파운데이션',    d: '가볍고 산뜻한 글로우업 파운데이션', sale: '38%', price: 27500, orig: 50000, img: 'fig-c7.jpg', mismatch: '할인율·판매가·정가·리뷰수가 립스틱 카드와 똑같다(시안 복사 자리)' },
    { n: '루미너스 아이 마스카라', d: '눈가를 환하게 밝혀주는 마스카라',   sale: '52%', price: 22500, orig: 43500, img: 'fig-c8.jpg' }
  ];

  /* 후기는 정의하지 않는다 — 시안 인스타 섹션에 사진 6장만 있고 후기 문구가 없다.
     지어내지 않고 위젯 기본 문구로 떨어뜨린다(아래 photo-review 의 approx 참조). */

  /* 섹션 순서 = 시안 실측. 위젯 키 나열이 아니라 섹션 스펙이라 같은 위젯이 두 번 나와도 된다. */
  F.figma = [
    /* 좌우 나눔 배너 — 좌 인물컷(img) / 우 버블컷(img2) + 문구. 시안 2단 구성 그대로다.
       img2 는 이 시안 때문에 새로 만든 필드다(전에는 우측 칸이 단색 패널뿐이었다).
       모바일 프리뷰에서는 두 칸이 한 칸으로 겹쳐 좌측 인물컷 위에 문구가 얹힌다. */
    { w: 'content-banner', style: 'split', img: 'fig-hero.jpg', img2: 'fig-hero2.jpg',
      title: 'Meet Your Other.', desc: 'Every mood reveals another version of you.',
      btn: 'Shop The Edit',
      approx: '히어로 — 좌 인물컷 / 우 버블컷+문구까지 시안 2단 그대로다. 다만 80px 세리프 타이틀은 배너 기본 크기(30px)로 줄고, 사진 위 글이 읽히게 옅은 스크림을 깔았다(시안엔 없다)' },

    { w: 'product-grid', title: 'BEST ITEMS', items: [0, 1, 2, 3, 4] },

    { w: 'split-banner', kicker: 'THE ESSENTIAL EDIT', img: 'fig-story.jpg',
      title: 'THE ESSENTIAL EDIT',
      desc: 'A curated palette of fundamental shades designed for everyday elegance. Highly pigmented, skin-neutral, and formulated to last.',
      btn: 'Shop The Edit',
      approx: '에센셜 에딧 — 시안은 좌측에 인물컷 2장을 겹쳐 놓고 우측 흰 패널에 제품 튜브 사진까지 함께 넣는다. 이미지+텍스트 위젯은 사진 1장만 받는다' },

    { w: 'contents-product-grid', title: 'CATEGORY', desc: '카테고리별 TOP3 제품을 만나보세요.',
      cards: [
        { img: 'fig-cat1.jpg', title: 'LIP',          desc: 'Healthy Skin Begins with Nature', items: [5] },
        { img: 'fig-cat2.jpg', title: 'BASE MAKE UP', desc: 'Healthy Skin Begins with Nature', items: [6] },
        { img: 'fig-cat3.jpg', title: 'EYE',          desc: 'Care Beyond Skin',                items: [7] }
      ],
      approx: 'Category — 시안은 열마다 TOP1 상품 하나만 얹는다. 콘텐츠+상품 그리드는 카드 안에 상품 행을 여러 개 깐다' },

    /* 「NEw Arrivals」 — 대소문자까지 시안 표기 그대로다(오타로 보이지만 고치지 않았다).
       진열 상품도 시안처럼 BEST ITEMS 와 같은 5종을 순서만 바꿔 재사용한다. */
    { w: 'product-grid', title: 'NEw Arrivals', items: [3, 0, 1, 2, 4] },

    { w: 'image', img: 'fig-edit.jpg',
      approx: 'NEW COLLECTION 에디토리얼 — 시안은 옐로 배너 위에 「NEW COLLECTION / Exploration of Summer」 문구가 얹힌다. 이미지 위젯은 텍스트를 못 얹어 시안 렌더(문구 포함)를 그대로 이미지로 넣었다' },

    { w: 'shorts-carousel', title: 'Shorts pick',
      approx: '쇼츠 픽 — 시안은 사진 6컷을 옆으로 늘어놓고 가운데 카드에 상품 「수분가득 콜라겐 마스크」를 얹는데, 그 상품이 카탈로그에 없다. 슬라이드는 카탈로그 상품으로 채웠다' },

    { w: 'photo-review', kicker: 'Follow us', title: '@Other.OFFICIAL',
      approx: '인스타 섹션 — 시안은 사진 6장만 있고 후기 제목·본문이 없다. 후기 문구는 위젯 기본값이고 사진도 기존 뷰티 상품컷을 쓴다(지어내지 않았다)' }
  ];
})(window.ONB_INDS.beauty);

/* ── VELOS(스포츠 · 레저) — Figma `6224:9813` 실측 ───────────────────────
   ⚠ 시안 자체가 어긋난 자리가 많다. 고치지 않고 **시안 그대로** 옮기고 아래에 적어 둔다:
     · SHOP BY SPORTS 상품 8장이 **전부 이름과 사진이 다른 품목**이다
       (러닝화 자리에 트랙 재킷, 러닝 캡 자리에 테니스 스커트, 더플백 자리에 양말 …)
     · SOMA Picks 쇼츠 섹션이 **뷰티 자리표시자**다 — 브랜드명이 SOMA, 상품이
       「루비 글로우 세럼 마스크 · 5색」, 사진도 세럼·립스틱·틴트 등 뷰티컷이다
     · V-STREET 4장 + SHOP BY SPORTS 8장의 가격이 전부 같은 더미가(₩49,800 → 30% → ₩34,900),
       평점도 전부 4.9 (3,102) 이고 Active Wear 3장은 전부 「리뷰 (12)」다
     · 히어로·풀폭 배너·에디토리얼 카드의 **아래 레이어에 생활용품 사진**(주방 인테리어·
       빨래 건조대·냄비·원목 선반·쿠션)이 남아 있다. 위 레이어에 스포츠 사진이 덮여 있어
       화면에는 안 보인다 — 그 위 레이어(=실제로 보이는 사진)만 뽑아 썼다.
   스니커 2단 스크롤(EQUIPE URBAN TECH · VORTEX RACER)은 대응 위젯이 없어 뺐다
   — 짙은 단색 칸에 상품 1개씩 얹는 형태다. 두 상품은 카탈로그에 넣어 다른 그리드에서 보인다. */
(function (F) {
  F.src = '6224:9813';

  /* 상단 공지 띠 — 시안 announcement */
  F.notice = '신규 가입 시 10,000원 할인 혜택! 첫 구매 15% 쿠폰 증정';

  /* nav-bar 메뉴 — 시안은 영문 3개다(전에 쓰던 국문 9개는 지어낸 값이었다) */
  F.menu = ['MEN', 'WOMEN', 'KIDS'];

  /* 상품 17종 — 이름 · 설명 · 할인율 · 판매가 · 정가 전부 시안 실측.
     0 번이 시안의 상품 상세 섹션(main-product-layout) 상품이라 맨 앞에 뒀다
     — 상세페이지 대표컷·가격이 pool[0] 에서 오기 때문이다. */
  F.catalog = [
    { n: '벨로스 에퀴페 어반 테크 러너', d: '경량 메쉬 어퍼와 리액티브 쿠셔닝 솔로 완성한 올라운드 퍼포먼스', sale: '15%', price: 169000, orig: 199000, img: 'fig-c1.jpg' },
    { n: 'V-STREET RETRO',           d: '', sale: '30%', price: 34900, orig: 49800, img: 'fig-c2.jpg' },
    { n: '벨로스 클래식 러너 로우',    d: '', sale: '30%', price: 34900, orig: 49800, img: 'fig-c3.jpg' },
    { n: '벨로스 에어스텝 슬립온',     d: '', sale: '30%', price: 34900, orig: 49800, img: 'fig-c4.jpg' },
    { n: '벨로스 트레일 부스트 미드',  d: '', sale: '30%', price: 34900, orig: 49800, img: 'fig-c5.jpg' },
    { n: '코트 포레스트 쇼츠',   d: '가볍고 통기성 뛰어난 우븐 러닝 쇼츠',        sale: '20%', price: 59900, orig: 74900, img: 'fig-c6.jpg' },
    { n: '썬 바이저 캡 화이트',  d: '자외선 차단과 통기성을 갖춘 퍼포먼스 바이저', sale: '15%', price: 32500, orig: 38000, img: 'fig-c7.jpg' },
    { n: '크루 퍼포먼스 삭스',   d: '아치 서포트와 쿠셔닝의 프리미엄 스포츠 양말', sale: '10%', price: 24900, orig: 27500, img: 'fig-c8.jpg' },
    { n: '벨로스 보텍스 레이서', d: 'Volt Green / Grey', sale: '', price: 189000, orig: null, img: 'fig-c9.jpg' },
    /* 아래 8종 = SHOP BY SPORTS. 시안이 이름과 사진을 전부 어긋나게 붙여 뒀다 */
    { n: '벨로스 에어플로우 러닝화',    d: '', sale: '30%', price: 34900, orig: 49800, img: 'fig-c10.jpg', mismatch: '사진은 회색 트랙 재킷' },
    { n: '벨로스 트랙 재킷 블랙',       d: '', sale: '30%', price: 34900, orig: 49800, img: 'fig-c11.jpg', mismatch: '사진은 회색 우븐 쇼츠' },
    { n: '벨로스 드라이핏 반팔 티',     d: '', sale: '30%', price: 34900, orig: 49800, img: 'fig-c12.jpg', mismatch: '사진은 블루 카고 팬츠' },
    { n: '벨로스 윈드러너 경량 자켓',   d: '', sale: '30%', price: 34900, orig: 49800, img: 'fig-c13.jpg', mismatch: '사진은 회색 스웨트 쇼츠' },
    { n: '벨로스 플렉스 트레이닝 팬츠', d: '', sale: '30%', price: 34900, orig: 49800, img: 'fig-c14.jpg', mismatch: '사진은 흰 셔츠' },
    { n: '벨로스 메쉬 러닝 캡',         d: '', sale: '30%', price: 34900, orig: 49800, img: 'fig-c15.jpg', mismatch: '사진은 그린 플리츠 테니스 스커트' },
    { n: '벨로스 스포츠 더플백 40L',    d: '', sale: '30%', price: 34900, orig: 49800, img: 'fig-c16.jpg', mismatch: '사진은 흰 크루 양말' },
    { n: '벨로스 컴프레션 레깅스',      d: '', sale: '30%', price: 34900, orig: 49800, img: 'fig-c17.jpg', mismatch: '사진은 그린 카고 쇼츠' }
  ];

  /* VELOS STYLE 후기 4개 — 시안에 적힌 그대로(별 5개, 인플루언서 계정) */
  F.reviews = [
    { t: '러닝화 쿠셔닝이 최고예요',      x: '처음 신었을 때부터 발이 편하고, 10km 러닝에도 무릎에 전혀 무리가 없었어요. 재구매 확정입니다!', by: '정수민 @su_m',        img: 'fig-rv1.jpg' },
    { t: '트레이닝 팬츠 핏 대박',         x: '스판 소재라 운동할 때 편하고, 일상복으로도 깔끔해서 매일 입고 있어요. 색감도 너무 예쁩니다.',   by: '박태형 @tae_hyung',   img: 'fig-rv2.jpg' },
    { t: '윈드러너 자켓 가볍고 좋아요',   x: '비 오는 날 러닝할 때 딱이에요. 방수 기능에 통기성까지 완벽하고 접으면 주머니에 들어갑니다.',   by: '이지원 @ji_won',      img: 'fig-rv3.jpg' },
    { t: '더플백 수납력 미쳤어요',        x: '헬스장 갈 때 운동화, 수건, 옷 다 넣어도 여유 있고 디자인도 세련돼서 출퇴근용으로도 씁니다.',   by: '최준영 @jun_young_99', img: 'fig-rv4.jpg' }
  ];

  /* 섹션 순서 = 시안 실측. 위젯 키 나열이 아니라 섹션 스펙이라 같은 위젯이 두 번 나와도 된다. */
  F.figma = [
    { w: 'content-banner', style: 'wide', img: 'fig-hero.jpg', pos: 3,
      kicker: '2026 S/S COLLECTION', title: 'VELOCITY IN MOTION',
      desc: '속도와 스타일이 하나 되는 순간, 벨로스와 함께 한계를 넘어서세요.',
      btn: '자세히 보기',
      approx: '히어로 — 문구 위치(중앙 좌측)·흰 버튼까지 시안대로다. 48px 블랙 타이틀은 배너 기본 크기(30px)로 줄어든다' },

    { w: 'product-grid', title: 'V-STREET',
      desc: '스트리트 감성으로 재해석된 벨로스 시그니처 스니커즈 라인업', items: [1, 2, 3, 4] },

    { w: 'contents-product-grid', title: 'Active Wear', desc: 'MOVE FAST. LOOK FASTER.',
      cards: [
        { img: 'fig-cat1.jpg', title: 'RUNNING',   desc: 'Built For Speed & Endurance',  items: [5] },
        { img: 'fig-cat2.jpg', title: 'TRAINING',  desc: 'Push Your Limits Every Day',   items: [6] },
        { img: 'fig-cat3.jpg', title: 'LIFESTYLE', desc: 'From The Track To The Street', items: [7] }
      ],
      approx: 'Active Wear — 시안은 열마다 상품 1개(90px 썸네일 + 이름·설명·가격 한 줄)인데 콘텐츠+상품 그리드는 카드 안에 상품 행을 여러 개 깐다' },

    { w: 'strip-banner', text: 'RUN FAST · OWN THE CITY · STAY SHARP · LIMITLESS ENERGY' },

    { w: 'category-tabs', title: 'SHOP BY SPORTS',
      desc: '당신의 움직임을 완성하는 벨로스 스포츠 기어',
      tabs: ['전체', '러닝', '트레이닝', '라이프스타일'] },

    /* RunningSplit — 좌우 2단 배너. 「세 칸 배너」를 2칸으로 써서 시안 구성을 그대로 담는다 */
    { w: 'content-banner-3', cards: [
        { img: 'fig-split1.jpg', title: 'FEEL BETTER',  desc: '매일의 러닝을 지속하는 가벼운 쿠셔닝 솔루션' },
        { img: 'fig-split2.jpg', title: 'BEYOND FAST', desc: '당신의 한계를 뛰어넘는 극한의 스피드웨어' }
      ] },

    { w: 'photo-review', kicker: 'VELOS STYLE',
      title: '스타일리시한 인플루언서들이 연출한 벨로스 스트릿 룩' },

    { w: 'content-banner', style: 'wide', img: 'fig-brand.jpg', pos: 4,
      kicker: 'SINCE 2026 · VELOS', title: '속도의 본능, 벨로스와 함께하세요',
      desc: '단순한 스포츠 브랜드를 넘어, 움직임의 본질을 탐구합니다. 최첨단 소재와 인체공학적 디자인으로 모든 순간의 퍼포먼스를 극대화합니다.',
      approx: '풀폭 브랜드 배너 — 시안엔 버튼이 없어 넣지 않았다. 600px 폭 중앙 정렬 본문이 배너 폭 전체로 퍼진다' },

    { w: 'content-banner-3', title: 'NEWS & LATEST', desc: 'OUR STORIES',
      cards: [
        { img: 'fig-ed1.jpg', title: '러닝의 새로운 기준',   desc: '리액티브 쿠셔닝과 경량 메쉬 어퍼로, 한 걸음 한 걸음이 가벼워지는 경험을 선사합니다.' },
        { img: 'fig-ed2.jpg', title: '트레이닝의 완성',       desc: '4-way 스트레치 원단과 인체공학적 패턴으로 자유로운 움직임을 보장합니다.' },
        { img: 'fig-ed3.jpg', title: '스타일의 경계를 넘다',  desc: '트랙에서 스트릿까지, 벨로스만의 감성으로 일상과 퍼포먼스를 연결합니다.' }
      ],
      approx: 'OUR STORIES — 시안은 사진 아래에 제목·설명이 오는데 세 칸 배너는 사진 위에 글을 얹는다' },

    /* imgs — 쇼츠는 **세로 영상 섬네일**이다. 카탈로그 사진은 흰 배경 상품컷이라
       9:16 으로 늘리면 영상으로 읽히지 않고, 상품 수를 1개로 고르면 풀이 한 장뿐이라
       네 칸이 같은 사진으로 채워졌다. 시안의 세로 라이프스타일 컷을 슬라이드 사진으로 쓴다
       (러닝 스트라이드 · 코트 스텝 · 시티 스트릿 · 테니스 · 자전거 — 주제와 색이 다 다르다).
       바로 위·아래 섹션(OUR STORIES = fig-ed*, BRAND STORY = fig-video)과는 겹치지 않게 골랐다. */
    { w: 'shorts-carousel', title: 'SOMA Picks',
      imgs: ['fig-split1.jpg', 'fig-cat3.jpg', 'fig-rv1.jpg', 'fig-cat2.jpg', 'fig-rv2.jpg'],
      approx: 'SOMA Picks — 시안 섹션 전체가 뷰티 자리표시자다(브랜드 SOMA · 상품 「루비 글로우 세럼 마스크 · 5색」 · 세럼·립스틱 사진). 지어내지 않고 슬라이드 사진은 같은 시안의 세로 라이프스타일 컷, 상품 태그는 카탈로그에서 가져왔다' },

    { w: 'video-banner', kicker: 'BRAND STORY', title: '직접 보고 확인하세요', img: 'fig-video.jpg' }
  ];
})(window.ONB_INDS.sports);

/* ── MODUM(생활용품 · 홈인테리어) — Figma `6224:10858` 실측 ──────────────
   ⚠ 시안 자체가 어긋난 자리가 있다. 고치지 않고 **시안 그대로** 옮기고 아래에 적어 둔다:
     · Category TOP3 와 베스트셀러 앞 3장의 **상품명과 사진이 다른 품목**이다
       (소파 자리에 침실 침대 사진, 다이닝 테이블 자리에 크림 소파, 월 셸프 자리에 워크 데스크)
     · 같은 상품(에쉬 오픈 북셸프)이 **베스트셀러에서는 520,000원(할인 없음)**,
       **상세페이지에서는 15% 442,000원**으로 서로 다르게 적혀 있다
     · 시즌 컬렉션 2·3번 카드는 **제목과 부제가 글자 그대로 같다**
       (「미니멀 리빙 라인 / 미니멀 리빙 라인」 · 「프리미엄 마스터 컬렉션 / 프리미엄 마스터 컬렉션」)
     · FEATURED ITEM · MODUM Picks 의 **아래 레이어에 뷰티 사진**(세럼 병·아이 메이크업·
       흑백 인물)이 남아 있다. 위 레이어에 인테리어 사진이 덮여 있어 화면에는 안 보인다
       — 그 위 레이어(=실제로 보이는 사진)만 뽑아 썼다. 다만 MODUM Picks 상품 카드의
       90px 썸네일은 위 레이어가 없어 **세럼 병 그대로**다(지어내지 않고 그 자리를 비웠다).
   시안엔 후기 섹션과 영상 섹션이 없다 — 없는 섹션을 지어 넣지 않았다.                    */
(function (F) {
  F.src = '6224:10858';

  /* 상단 공지 띠 — 시안 announcement 2번째 줄(1번째 줄은 타임세일 카운트다운이라 위젯으로 넣었다) */
  F.notice = '신규 가입 시 15,000원 할인 혜택! 첫 구매 20% 쿠폰 증정';

  /* nav 메뉴 — 시안은 영문 4개다(전에 쓰던 국문 9개는 지어낸 값이었다) */
  F.menu = ['New', 'Shop', 'Bestsellers', 'About'];

  /* 상품 11종 — 이름 · 설명 · 할인율 · 판매가 · 정가 전부 시안 실측.
     0 번이 시안의 상품 상세 섹션 상품(에쉬 오픈 북셸프)이라 맨 앞에 뒀다 — DETAIL 이 pool[0] 을 읽는다.
     베스트셀러 카드는 정가(취소선)가 없고 판매가만 적혀 있어 orig 를 비워 뒀다. */
  F.catalog = [
    { n: '모둠 내추럴 에쉬 오픈 북셸프',      d: '깊은 결이 살아있는 에쉬 원목의 오픈형 수납 책장',                       sale: '15%', price: 442000,  orig: 520000,  img: 'fig-c1.jpg', mismatch: '같은 상품이 베스트셀러 그리드에서는 할인 없이 520,000원으로 적혀 있다' },
    { n: '모둠 클라우드 패브릭 소파',         d: '포근한 착석감의 모듈형 3인 소파',                                       sale: '38%', price: 1890000, orig: 2490000, img: 'fig-c2.jpg', mismatch: '사진은 침실 침대' },
    { n: '모둠 오크 다이닝 테이블',           d: '내추럴 오크 원목의 6인 다이닝 테이블',                                  sale: '38%', price: 890000,  orig: 1290000, img: 'fig-c3.jpg', mismatch: '사진은 크림 패브릭 소파' },
    { n: '모둠 모듈러 월 셸프',               d: '자유로운 조합의 벽면 수납 셸프',                                        sale: '25%', price: 320000,  orig: 430000,  img: 'fig-c4.jpg', mismatch: '사진은 화이트 워크 데스크' },
    { n: '모둠 클라우드 모듈형 코너 소파',    d: '부드러운 쿠션감과 자유로운 모듈 배치로 넓은 거실에 최적화된 코너형 소파', sale: '15%', price: 2890000, orig: null,    img: 'fig-c2.jpg', mismatch: '사진은 침실 침대(패브릭 소파와 같은 컷을 돌려 쓴다)' },
    { n: '모둠 내추럴 월넛 퀸 프레임 침대',   d: '천연 월넛 원목의 따뜻한 질감과 견고한 프레임으로 편안한 수면 환경 제공',  sale: '10%', price: 1690000, orig: null,    img: 'fig-c3.jpg', mismatch: '사진은 크림 패브릭 소파' },
    { n: '모둠 슬라이딩 시스템 빌트인 옷장',  d: '공간 효율을 극대화한 슬라이딩 도어와 체계적인 내부 수납 시스템',          sale: '',    price: 2150000, orig: null,    img: 'fig-c5.jpg' },
    { n: '모둠 오크 라운드 6인 다이닝 세트',  d: '유럽산 오크 원목의 자연스러운 결과 넉넉한 6인 사이즈로 가족 식탁에 적합', sale: '20%', price: 1280000, orig: null,    img: 'fig-c6.jpg' },
    { n: '모둠 미니멀 그레이 파우더룸 세트',  d: '세면대와 수납장이 일체형으로 구성된 컴팩트한 파우더룸 솔루션',            sale: '12%', price: 1080000, orig: null,    img: 'fig-c7.jpg' },
    { n: '모둠 플리츠 아르데코 플로어 스탠드', d: '아르데코 감성의 플리츠 셰이드로 공간에 따뜻한 무드 조명 연출',           sale: '5%',  price: 280000,  orig: null,    img: 'fig-c8.jpg' },
    { n: '모둠 스틸 모듈러 워크 데스크',      d: '견고한 스틸 프레임과 모듈 확장이 가능한 실용적 워크 데스크',              sale: '',    price: 390000,  orig: null,    img: 'fig-c4.jpg' }
  ];

  /* 후기는 정의하지 않는다 — 시안에 후기 섹션이 아예 없다(지어내지 않는다). */

  /* 섹션 순서 = 시안 실측. 위젯 키 나열이 아니라 섹션 스펙이라 같은 위젯이 두 번 나와도 된다. */
  F.figma = [
    /* 시안 첫 줄이 「타임세일 00:00:00」 카운트다운 띠다 — 이 업종만 시안이 실제로 갖고 있다 */
    { w: 'top-countdown-banner' },

    { w: 'content-banner', style: 'wide', img: 'fig-hero.jpg', pos: 4,
      title: 'MODUM', desc: '다양한 조화 속에 완성되는, 당신만의 공간 이야기', btn: '브랜드 스토리',
      approx: '히어로 — 문구 중앙 정렬까지 시안대로다. 시안 버튼은 주황(#e35e38) 알약인데 배너 버튼은 몰 브랜드색을 따른다' },

    { w: 'contents-product-grid', title: 'Category', desc: '카테고리별 BEST 제품을 만나보세요.',
      cards: [
        { img: 'fig-cat1.jpg', title: 'SOFA',  desc: 'Everyday Comfort For Your Space',    items: [1] },
        { img: 'fig-cat2.jpg', title: 'TABLE', desc: 'Natural Touch For Daily Living',     items: [2] },
        { img: 'fig-cat3.jpg', title: 'SHELF', desc: 'Balanced Form For Your Collection',  items: [3] }
      ],
      approx: 'Category — 시안은 열마다 상품 1개(썸네일 + 이름·설명·가격 한 줄)인데 콘텐츠+상품 그리드는 카드 안에 상품 행을 여러 개 깐다' },

    { w: 'split-banner', kicker: 'FEATURED ITEM', img: 'fig-feat.jpg',
      title: 'Modular Cloud Sofa',
      desc: '공간에 맞춰 자유롭게 조합하는 모둠의 모듈형 소파. 부드러운 패브릭과 고밀도 폼이 최상의 안락함을 선사합니다.',
      btn: 'Add to Cart',
      approx: 'FEATURED ITEM — 시안은 「FEATURED ITEM」 라벨이 48px 제목 위에 붙는데 이미지+텍스트 위젯에는 라벨 자리가 없다' },

    { w: 'content-banner', style: 'wide', img: 'fig-store.jpg', pos: 4,
      title: 'SHOWROOM',
      desc: '전국 12개 직영 쇼룸에서 모둠 가구의 섬세한 마감과 자연스러운 소재의 질감을 직접 경험해 보세요.',
      btn: '가까운 쇼룸 찾기' },

    { w: 'product-grid', title: 'MODUM Best Sellers',
      desc: '가장 많은 선택을 받은 시그니처 가구 컬렉션', items: [4, 5, 6, 7, 0, 8, 9, 10],
      approx: '베스트셀러 — 시안 카드에는 상품명 위에 분류 라벨(거실가구·침실가구·수납가구·식탁/의자·서재가구·조명/데코)이 붙는데 상품 카드에 그 자리가 없다' },

    { w: 'content-banner-3', title: 'MODUM 시즌 컬렉션',
      desc: '자연의 결을 담은 소재와 모던한 디자인이 만나는 뉴 시즌 라인업.',
      cards: [
        { img: 'fig-ed1.jpg', title: '내추럴 우드 컬렉션',    desc: '자연을 담은 컬러',        btn: 'Shop now' },
        { img: 'fig-ed2.jpg', title: '미니멀 리빙 라인',      desc: '미니멀 리빙 라인',        btn: 'Shop now' },
        { img: 'fig-ed3.jpg', title: '프리미엄 마스터 컬렉션', desc: '프리미엄 마스터 컬렉션', btn: 'Shop now' }
      ],
      approx: '시즌 컬렉션 — 2·3번 카드의 제목과 부제가 시안에 똑같이 적혀 있다(자리표시자로 보이지만 고치지 않았다)' },

    { w: 'shorts-carousel', title: 'MODUM Picks',
      approx: 'MODUM Picks — 시안 부제(「에디터가 선택한 이달의 인테리어 아이템」)와 상품(「모둠 세라믹 테이블 오브제 · 3색」)을 쇼츠 위젯이 받지 못한다. 부제는 위젯 고정 문구, 슬라이드는 카탈로그 상품으로 채웠다' },

    /* btn: null = 시안에 버튼이 없다는 뜻. 빼면 기본 「컬렉션 보기」가 붙는다 */
    { w: 'split-banner', kicker: 'NEW LIFESTYLE', img: 'fig-large.jpg', btn: null,
      title: '자연을 품은 공간의 조화',
      desc: '시간이 흘러도 변치 않는 원목의 결과 정제된 디자인이 만나, 균형 잡힌 공간을 완성합니다.' }
  ];
})(window.ONB_INDS.living);


/* ══ 시안 실측이 없는 업종의 살(내용) ══════════════════════════════════════
   apparel · fashion · pet 은 시안에서 **섹션 순서만** 훑었다(위 layout 주석).
   (appliance 는 2026-08-12 에 시안 실측으로 올라갔다 — F.figma 를 갖는다. 아래 AIRUS 블록의
    copy 는 실측 전 값이지만 프리셋(cv·brand·trust)에서 여전히 쓰이므로 그대로 둔다.)
   그래서 상품 카드는 이름·가격만, 섹션 제목은 위젯 기본값(「추천 상품」·「카테고리별 상품」·
   「Photo review」)이었다 — 열 업종이 같은 글을 쓰고, 카드에 설명·정가·할인율이 없었다.

   아래 세 필드로 그 자리를 채운다. **`figma` 가 아니다** — 시안 실측이 아니라 우리가 쓴 값이다:
     catalog  상품 카드(설명·할인율·판매가·정가·사진). 사진은 기존 p1..p10 짝을 그대로 지킨다.
     reviews  포토리뷰 4건. 없으면 업종 무관 기본 후기(「사진이랑 똑같이 왔어요」)가 나간다.
     copy     섹션 문구. 위젯 키로 찾고, 같은 위젯이 두 번 나오면 배열 순서대로 쓴다(_r8/_r7 sections()).

   가격 원칙: 판매가는 기존 prods 값 그대로. 정가는 그 판매가에서 역산해 1,000원 단위로 맞추고
   할인율 라벨은 실제 비율을 반올림한 값이다 — 서로 어긋나는 숫자를 만들지 않았다.
   영문 섹션명 중 「SUN'S OUT / STYLE ON」·「New Arrivals」·「FEATURED ITEM」·「BEST 제품」·
   「Our Philosophy」·「시즌 컬렉션」은 위 layout 주석에 적어 둔 **시안 섹션명**이고,
   그 아래 본문·부제는 우리가 쓴 것이다.                                                 */

(function (F) {          /* AURE — 패션의류 */
  F.catalog = [
    { n: '여성 루즈 일본스타일 반팔',  d: '넉넉한 어깨선에 속이 비치지 않는 두께', sale: '35%', price: 23400, orig: 36000, img: 'p1.jpg' },
    { n: '펀칭 오픈카라 반팔',        d: '펀칭 원단으로 바람이 통하는 여름 셔츠',                price: 27900,               img: 'p2.jpg' },
    { n: '체크 뷔스티에 원피스',      d: '허리 절개로 라인을 잡은 체크 원피스',   sale: '22%', price: 39000, orig: 50000, img: 'p3.jpg' },
    { n: '스카이 시스루 가디건',      d: '냉방 있는 실내에서 한 겹 걸치는 시스루',              price: 32000,               img: 'p4.jpg' },
    { n: '여성용 레드 레터 프린트 반팔', d: '여러 번 빨아도 프린트가 갈라지지 않아요', sale: '31%', price: 22900, orig: 33000, img: 'p5.jpg' },
    { n: '펀칭 블라우스',            d: '구김이 잘 지지 않는 폴리 혼방',                       price: 29800,               img: 'p6.jpg' },
    { n: '라인스톤 스타 장식 민소매',  d: '장식이 붙어 있어 뒤집어 손세탁하세요',   sale: '38%', price: 19900, orig: 32000, img: 'p7.jpg' },
    { n: '여성 키치 일본스타일 반팔',  d: '짧은 기장, 하이웨스트 하의와 맞춰 입기',              price: 21900,               img: 'p8.jpg' },
    { n: '코튼 와이드 팬츠',         d: '165cm 기준 수선 없이 떨어지는 기장',    sale: '25%', price: 42000, orig: 56000, img: 'p9.jpg' },
    { n: '민트 발토시 1세트',        d: '자외선 차단 UPF 50+ · 2개 한 세트',                  price: 15900,               img: 'p10.jpg' }
  ];
  F.reviews = [
    { t: '비침 걱정 없어요',      x: '얇아서 걱정했는데 안에 입은 게 하나도 안 비쳐요. 어깨가 넉넉해서 팔 움직임도 편합니다.', by: '— 김*현 고객님', img: 'p1.jpg' },
    { t: '체크 원피스 핏 예뻐요',  x: '허리 절개가 있어서 실제로 입으면 훨씬 날씬해 보여요. 결혼식 하객룩으로 입고 갔습니다.', by: '— 이*미 고객님', img: 'p3.jpg' },
    { t: '프린트가 튼튼합니다',    x: '세 번 세탁했는데 프린트가 갈라지지도, 색이 빠지지도 않았어요. 색 다르게 하나 더 살게요.', by: '— 박*준 고객님', img: 'p5.jpg' },
    { t: '기장 수선 안 했어요',    x: '164cm인데 밑단이 바닥에 안 끌려서 그냥 입고 있어요. 여름에도 안 덥고 시원합니다.',   by: '— 최*서 고객님', img: 'p9.jpg' }
  ];
  F.copy = {
    'product-grid': [
      { title: 'WEEKLY BEST', desc: '이번 주 가장 많이 담은 옷' },
      { title: 'New Arrivals', desc: '이번 주 새로 들어온 옷' },
      { title: 'MD PICK',     desc: '오래 두고 입기 좋은 것들' }
    ],
    'category-shortcut': { title: '카테고리', desc: '원피스부터 아우터까지' },
    'category-tabs': { title: '지금 뭐 입을까', desc: '갈래별로 나눠 담았어요',
      tabs: ['원피스', '상의', '아우터', '하의', '스커트'] },
    'contents-product-grid': { title: '이번 주 코디', desc: '옷장에서 바로 꺼내 입는 조합',
      cards: [
        { img: 'p3.jpg', title: '하객룩', desc: '한 벌로 끝나는 자리',       items: [2, 0, 5] },
        { img: 'p1.jpg', title: '데일리', desc: '자주 손이 가는 조합',       items: [0, 7, 8] },
        { img: 'p4.jpg', title: '실내 냉방', desc: '한 겹 걸치는 것들',      items: [3, 5, 9] }
      ] },
    'split-banner': { kicker: 'AURE ATELIER', title: '하루를 함께 보내는 옷',
      desc: '봉제선과 안감까지 직접 확인해 만듭니다. 여러 번 빨아도 형태가 남는 옷을 만드는 이유입니다.',
      btn: '브랜드 스토리' },
    'video-banner': { title: 'AURE 룩북 필름', kicker: '이번 시즌 코디를 영상으로' },
    'photo-review': { title: '착용 후기' },
    /* 쇼츠 3칸 — 세로 착용컷 3장을 섬네일로 세운다. 사진을 주지 않으면 슬라이드 수가 ② 상품 수를
       따라가서 1종 몰에서 한 칸만 섰다. 순서는 카탈로그 순서(p1·p2·p3)와 맞춰 뒀다 —
       렌더러가 슬라이드 j 에 풀의 j 번째 상품을 태그로 붙이므로, 상품이 3종 이상이면
       사진과 상품 이름이 서로 맞는다(1종 몰이면 같은 상품의 다른 영상 3개가 된다). */
    'shorts-carousel': { title: 'AURE 스타일 쇼츠', imgs: ['p1.jpg', 'p2.jpg', 'p3.jpg'] }
  };
})(window.ONB_INDS.apparel);

(function (F) {          /* VERRE — 패션잡화 · 아이웨어 */
  F.catalog = [
    { n: '티타늄 라운드 (실버)',   d: '18g 경량 티타늄 · 코받침 조절 가능',    sale: '20%', price: 320000, orig: 400000, img: 'p1.jpg' },
    { n: '아비에이터 (건메탈)',    d: '얼굴을 덮는 큰 렌즈에 이중 브릿지',                    price: 380000,                img: 'p2.jpg' },
    { n: '캣아이 (토르투아즈)',    d: '눈꼬리를 올려 주는 각도로 깎은 프레임',                 price: 350000,                img: 'p3.jpg' },
    { n: '스퀘어 (블랙)',        d: '광대에 닿지 않는 템플 각도',            sale: '15%', price: 290000, orig: 340000, img: 'p4.jpg' },
    { n: '쉴드 (매트블랙)',       d: '한 장 렌즈로 시야가 끊기지 않아요',                     price: 420000,                img: 'p5.jpg' },
    { n: '보스턴 (골드)',        d: '둥근 얼굴형과 어울리는 세로 폭',                        price: 340000,                img: 'p6.jpg' },
    { n: '웰링턴 (하바나)',       d: '어떤 얼굴형에도 무난한 기본 프레임',                    price: 310000,                img: 'p7.jpg' },
    { n: '오버사이즈 (블랙)',     d: '가벼운 아세테이트로 눌림이 적어요',      sale: '25%', price: 360000, orig: 480000, img: 'p8.jpg' },
    { n: '레드 아세테이트 (스칼렛)', d: '한 개만 써도 옷차림이 달라지는 색',                    price: 330000,                img: 'p9.jpg' },
    { n: '리브드 터틀넥',        d: '프레임과 함께 쓰는 니트 · 목선이 낮아요',                price: 189000,                img: 'p10.jpg' }
  ];
  F.reviews = [
    { t: '하루 써도 안 눌려요',   x: '18g이라더니 정말 가벼워요. 8시간 근무 내내 써도 코와 귀에 자국이 안 남습니다.',       by: '— 김*현 고객님', img: 'p1.jpg' },
    { t: '얼굴이 작아 보여요',    x: '광대에 닿지 않게 템플이 벌어져 있어서 눌림도 없고, 사진 찍으면 얼굴선이 정리돼 보여요.', by: '— 이*미 고객님', img: 'p4.jpg' },
    { t: '렌즈 교체도 해주셨어요', x: '도수 렌즈로 바꿔 끼웠는데 프레임 조정까지 무료로 해주셨습니다. 다음 안경도 여기서.',   by: '— 박*준 고객님', img: 'p8.jpg' },
    { t: '색이 튀지 않아요',     x: '스칼렛인데 생각보다 차분해서 정장에도 어울립니다. 포장 케이스도 단단해서 좋았어요.',    by: '— 최*서 고객님', img: 'p9.jpg' }
  ];
  F.copy = {
    'product-grid': [
      { title: 'FEATURED ITEM', desc: '가장 많이 써 본 프레임' },
      { title: 'NEW FRAME',     desc: '이번 시즌 새로 들어온 프레임' },
      { title: 'MD PICK',       desc: '얼굴형별로 골라 둔 것들' }
    ],
    'category-shortcut': { title: 'CATEGORY', desc: '선글라스부터 티타늄까지' },
    'category-tabs': { title: '프레임 골라보기', desc: '소재와 모양으로 나눠 담았어요',
      tabs: ['선글라스', '안경테', '티타늄', '아세테이트', '컬렉션'] },
    'contents-product-grid': { title: '시즌 컬렉션', desc: '얼굴형으로 고른 세 가지 제안',
      cards: [
        { img: 'p3.jpg', title: '둥근 얼굴',  desc: '세로 폭이 있는 프레임',   items: [2, 5, 6] },
        { img: 'p4.jpg', title: '각진 얼굴',  desc: '곡선을 살린 프레임',      items: [0, 3, 8] },
        { img: 'p5.jpg', title: '야외 활동',  desc: '시야가 끊기지 않는 것',   items: [4, 1, 7] }
      ] },
    'split-banner': { kicker: 'SINCE 1998', title: '0.1mm 를 다루는 공정',
      desc: '브릿지 각도와 템플 길이를 얼굴형별로 나눠 만듭니다. 하루 종일 써도 자국이 남지 않게.',
      btn: '브랜드 스토리' },
    'video-banner': { title: 'VERRE 브랜드 필름', kicker: '프레임이 만들어지는 과정' },
    'photo-review': { title: '착용 후기' },
    'shorts-carousel': { title: 'VERRE 프레임 쇼츠' }
  };
})(window.ONB_INDS.fashion);

(function (F) {          /* AIRUS — 가전 */
  F.src = '6224:11483';

  /* 상단 공지 띠 — 시안 header > announcement 한 줄 */
  F.notice = '신규 가입 시 10,000원 할인 혜택! 첫 구매 15% 쿠폰 증정';

  /* nav 메뉴 — 시안 navbar 7개. 전에 쓰던 「신상품·베스트·정수기…」 9개는 지어낸 값이었다 */
  F.menu = ['제품', '렌탈/구매', '케어서비스', '공기청정기', '매장', '브랜드 Story', '소통존'];

  /* 상품 8종 — 이름 · 부제 · 정가(취소선) · 판매가 · 사진 전부 시안 실측.
     0~3 = BEST 제품 4칸, 4~7 = 카테고리별 추천 4칸.
     ⚠ 시안 가격은 **월 렌탈 요금**이다(「27,900원 / 월」). 상품 카드에 「/ 월」 자리가 없어
       숫자만 남는다 — 지어낸 값이 아니라 단위가 빠진 것이다(아래 figma 의 approx 참조).
     ⚠ 시안 카드엔 할인율 라벨이 없다(정가 취소선 + 판매가뿐) — sale 을 만들지 않았다. */
  F.catalog = [
    { n: '에이러스 데코 직수 정수기',    d: 'ARS-3400 | 프리미엄 4단계 필터',        price: 27900, orig: 32900, img: 'fig-c1.jpg' },
    { n: '에이러스 얼음 직수 정수기',    d: 'ARS-4000 | 풍부한 얼음 용량',           price: 41900, orig: 45900, img: 'fig-c2.jpg' },
    /* ⚠ fig-c3.jpg 은 쓰지 않는다 — 생수통을 얹는 구형 냉온수기 컷이라 AIRUS 직수 라인과
       결이 완전히 다르고 제품 자체가 낡아 보인다(리뷰에서 「절대 쓰지 말라」고 지정됨).
       이 업종에서 안 쓰이던 정수기 스튜디오 컷(p10 미러 크롬 카운터탑)으로 갈았고,
       이름도 사진에 맞춰 같은 업종 prods 에 이미 있는 「실버 미러」로 맞췄다.
       (탱크형 카운터탑이라 「대용량 탱크 탑재」는 그대로 맞는다.) */
    { n: '에이러스 실버 미러 정수기',     d: 'ARS-310 | 대용량 탱크 탑재',            price: 17900, orig: 19900, img: 'p10.jpg' },
    { n: '에이러스 언더싱크 정수기',     d: 'ARS-200 | 빌트인 깔끔한 공간',          price: 21900, orig: 24900, img: 'fig-c4.jpg' },
    { n: '에이러스 스마트 가습기 3세대', d: '정밀 습도 센서로 최적의 실내 습도 유지',  price: 27900, orig: 32900, img: 'fig-c5.jpg' },
    { n: '에이러스 무선 서큘레이터',     d: '조용한 DC모터와 360도 회전 기능',        price: 27900, orig: 32900, img: 'fig-c6.jpg' },
    { n: '에이러스 스마트 공기질 모니터', d: '블루투스 연동 및 초미세먼지 실시간 측정', price: 27900, orig: 32900, img: 'fig-c7.jpg' },
    { n: '에이러스 UV 살균 건조기',      d: '3단계 건조 모드와 UV-C LED 살균 시스템',  price: 27900, orig: 32900, img: 'fig-c8.jpg' }
  ];
  F.reviews = [
    { t: '설치까지 한 번에 끝났어요', x: '주문하고 이틀 뒤에 방문해서 30분 만에 설치까지 마쳤어요. 물 맛이 확실히 달라졌습니다.',   by: '— 김*현 고객님', img: 'p1.jpg' },
    { t: '좁은 주방에 딱이에요',     x: '폭이 18cm라 싱크대 옆 빈자리에 그대로 들어갔어요. 냉수 나오는 속도도 빠릅니다.',        by: '— 이*미 고객님', img: 'p2.jpg' },
    { t: '밤에 소리가 안 들려요',    x: '취침 모드로 두면 정말 조용해서 아이 방에 놓고 씁니다. 필터 교체 알림도 편하네요.',       by: '— 박*준 고객님', img: 'p5.jpg' },
    { t: '세척이 쉬워요',          x: '물통을 통째로 분리해서 씻을 수 있어서 관리가 편합니다. 습도 자동 조절도 잘 맞습니다.',    by: '— 최*서 고객님', img: 'p8.jpg' }
  ];
  F.copy = {
    'product-grid': [
      { title: 'BEST 제품', desc: '가장 많이 설치한 제품' },
      { title: '신제품',    desc: '올해 새로 나온 라인업' },
      { title: '렌탈 추천',  desc: '설치비와 첫 필터가 포함돼요' }
    ],
    'category-shortcut': { title: '제품 카테고리', desc: '정수기 · 청정기 · 가습기' },
    'category-tabs': { title: '카테고리별 추천', desc: '용량과 필터 등급으로 나눠 담았어요',
      tabs: ['정수기', '공기청정기', '가습기', '생활가전', '필터'] },
    'contents-product-grid': { title: '공간별 추천', desc: '집 크기와 쓰는 사람 수에 맞춰',
      cards: [
        { img: 'p3.jpg', title: '4인 가족', desc: '대용량 · 온수 잠금',      items: [2, 0, 6] },
        { img: 'p9.jpg', title: '1인 가구', desc: '좁은 자리에 두는 것',     items: [8, 1, 3] },
        { img: 'p5.jpg', title: '아이 방',  desc: '소음을 낮춘 것',         items: [4, 7, 5] }
      ] },
    'split-banner': { kicker: 'AIRUS CARE', title: '4개월마다 방문하는 점검',
      desc: '필터 교체와 위생 점검을 방문으로 해결합니다. 렌탈은 설치비와 첫 필터가 포함됩니다.',
      btn: '렌탈 안내' },
    'video-banner': { title: 'AIRUS 필터 구조', kicker: '무엇을 걸러내는지 영상으로' },
    'photo-review': { title: '설치 후기' },
    'shorts-carousel': { title: 'AIRUS 사용법 쇼츠' }
  };

  /* 섹션 순서 = 시안 실측. 위젯 키 나열이 아니라 섹션 스펙이라 같은 위젯이 두 번 나와도 된다.
     시안에 **없어서 뺀 것**: 카테고리 바로가기(원형) · 포토리뷰 · 쇼츠 · 이미지 위젯.
     넷 다 전에 layout 배열에 들어 있었는데 시안 어디에도 없는 섹션이었다. */
  F.figma = [
    /* 히어로 — 시안은 480×480 세 칸(hero-col-1~3)이고 글이 칸 **왼쪽 아래**에 붙는다(버튼 없음).
       img 는 mk 가 쓰지 않는다(칸 사진은 cards 가 들고 있다) — 업종 칩 썸네일용이다(heroOf). */
    { w: 'content-banner-3', img: 'fig-hero1.jpg', ratio: '1/1',
      cards: [
        { img: 'fig-hero1.jpg', title: '미세먼지 걱정 없이',      desc: '에이러스 공기청정기로 언제나 쾌적하게' },
        { img: 'fig-hero2.jpg', title: '순수한 물, 건강한 일상',   desc: '초정밀 필터 시스템의 에이러스 직수 정수기' },
        { img: 'fig-hero3.jpg', title: '극초미세먼지 99.99% 케어', desc: '공간의 품격을 더하는 맞춤 청정 솔루션' }
      ],
      approx: '히어로 — 세 칸 배너 기본 비율(324:401)이 아니라 시안대로 1:1 로 잡았다. 시안 칸마다 다른 어둡기의 오버레이(30%·35%·40%)는 위젯이 한 값만 갖는다' },

    { w: 'product-grid', title: 'BEST 제품',
      desc: '에이러스에서 가장 사랑받는 대표 라이프케어 제품을 소개합니다', items: [0, 1, 2, 3],
      approx: 'BEST 제품 — 시안 가격은 「27,900원 / 월」 월 렌탈 요금이고 상품명 위에 파란 BEST SELLER 라벨이 붙는데, 상품 카드에 「/ 월」 단위와 라벨 자리가 없다. 시안은 4열 1행인데 진열 밀도는 ② 상품 수 규칙이 정한다' },

    /* 듀얼 배너 — 시안은 연한 파랑 패널 안에 좌 문구·버튼 / 우 도판(제휴카드·상담사)이다.
       콘텐츠 배너 칸은 **사진 위에 글을 얹는** 구조라 이 배치를 못 만든다. 그래서 칸 자체를
       시안 렌더(628×220)로 넣고 위젯 문구는 껐다 — 그 대신 이 두 칸의 글은 편집되지 않는다.
       (MORU 히어로에서 시안 로고를 구운 대표컷을 쓰는 것과 같은 처리다.) */
    { w: 'content-banner-3', ratio: '628/220',
      cards: [{ img: 'fig-bn1.jpg' }, { img: 'fig-bn2.jpg' }],
      approx: '듀얼 배너 — 「렌탈요금 알뜰하게 할인받는 방법?」·「제품 고르기가 힘드신가요?」 두 칸. 패널·도판·버튼이 한 장으로 구워져 있어 문구를 위젯 텍스트로 못 뽑았다' },

    { w: 'split-banner', kicker: 'SIGNATURE ITEM', img: 'fig-signature.jpg', btnStyle: 'fill',
      title: '공기의 본질에 충실한 아름다움, 에이러스 시그니처 에어타워',
      desc: '360도 입체 청정 기술로 공간 구석구석 깨끗한 공기를 순환시킵니다. 불필요한 장식을 걷어내고 가장 아름답고 조용한 청정 경험을 전달합니다.',
      btn: '자세히 알아보기' },

    { w: 'category-tabs', title: '카테고리별 추천',
      tabs: ['전체', '정수기', '공기청정기', '제습기', '건조기'],
      approx: '카테고리별 추천 — 시안엔 제목 아래 부제가 없는데 위젯이 부제를 항상 그려서 기본 문구가 나간다. 시안 탭은 알약형이고 「전체」가 선택 상태다' },

    { w: 'contents-product-grid', title: '콘텐츠', desc: '에이러스만의 다양한 콘텐츠',
      cards: [
        { img: 'fig-ct1.jpg', title: '에이러스 공기청정기 필터 관리 Q&A', desc: '자주 묻는 필터 교체 및 관리 꿀팁을 한 번에 확인하세요', items: [0] },
        { img: 'fig-ct2.jpg', title: '에이러스가 제안하는 건강한 공기 공식', desc: '우리가 매일 마시는 공기를 더 안전하게 관리하는 법', items: [4] },
        { img: 'fig-ct3.jpg', title: '에이러스가 제안하는 건강한 물 습관', desc: '우리 가족이 매일 마시는 물을 더 깨끗하게 관리하는 법', items: [1] }
      ],
      approx: '콘텐츠 — 시안 카드는 영상 썸네일 + 제목 + 설명뿐이고 딸린 상품이 없는데, 콘텐츠+상품 그리드는 카드마다 상품 행을 최소 하나 깐다. 제목도 시안은 좌측 정렬에 위쪽 「콘텐츠」 라벨이 따로 붙는다' },

    /* 시안 영상 섹션엔 문구가 없다(1280×722 목업 + 재생 버튼뿐). 위젯은 제목·부제를 항상
       그리므로 여기서는 위젯 기본 문구가 나간다 — 시안에 없는 글을 지어 넣지 않았다. */
    { w: 'video-banner', img: 'fig-video.jpg',
      approx: '영상 — 시안엔 제목·부제가 없다. 영상 배너 위젯이 문구를 못 끄는 자리라 기본 문구(「AIRUS 브랜드 스토리」)가 붙는다' },

    { w: 'content-banner', style: 'wide', img: 'fig-promise.jpg', pos: 4,
      kicker: 'AIRUS SERVICE', title: '순수한 공기와 물을 위한 최고의 약속',
      desc: '에이러스는 안심 필터 서비스와 직수관 무료 교체 주기로 언제나 건강하고 깨끗한 위생상태를 약속드립니다. 우리 가족의 맑은 공기와 순수한 물, 한결같이 지켜드립니다.',
      btn: '서비스 안심 보장 안내',
      approx: '브랜드 약속 — 시안 버튼은 흰 바탕에 파란 글씨인데 배너 버튼은 몰 브랜드색을 따른다' }
  ];
})(window.ONB_INDS.appliance);

(function (F) {          /* MORU — 반려동물 */
  F.catalog = [
    { n: '수제 오트 비스킷',       d: '곡물 알러지 없는 오트 반죽 · 소분 포장',  sale: '25%', price: 12000,  orig: 16000,  img: 'p1.jpg' },
    { n: '높이조절 원목 식기 스탠드', d: '체중별 3단 높이 · 목 부담을 줄여요',                    price: 68000,                img: 'p2.jpg' },
    { n: '데일리 트릿 믹스',       d: '하루 한 봉 · 첨가물 없이 건조',        sale: '29%', price: 15000,  orig: 21000,  img: 'p3.jpg' },
    { n: '우드 캣 해먹',         d: '원목 프레임 + 분리 세탁 커버',                          price: 89000,                img: 'p4.jpg' },
    { n: '원목 캣타워',          d: '3단 · 모서리 라운드 마감 · 흔들림 방지',                 price: 189000,               img: 'p5.jpg' },
    { n: '코튼 넥밴드',          d: '삼켜도 괜찮은 무해 염색 · 순면',        sale: '20%', price: 24000,  orig: 30000,  img: 'p6.jpg' },
    { n: '캣콘솔 소파',          d: '사람과 같이 쓰는 소파 · 커버 교체형',                    price: 690000,               img: 'p7.jpg' },
    { n: '월 마운트 캣 선반',      d: '벽 고정형 2단 · 하중 12kg',                           price: 128000,               img: 'p8.jpg' },
    { n: '패브릭 펫 스툴',        d: '올라서기 편한 낮은 높이 · 커버 세탁',                    price: 96000,                img: 'p9.jpg' },
    { n: '트레이닝 트릿 스틱',     d: '한 알씩 떼어 주는 훈련용 간식',        sale: '40%', price: 9000,   orig: 15000,  img: 'p10.jpg' }
  ];
  F.reviews = [
    { t: '긁어도 멀쩡해요',      x: '원목 마감이 매끈해서 발톱으로 긁어도 결이 일어나지 않아요. 아이가 하루 종일 올라가 있습니다.', by: '— 김*현 고객님', img: 'p5.jpg' },
    { t: '목 부담이 줄었어요',    x: '식기 높이를 올려 주니 밥 먹고 나서 켁켁거리는 게 없어졌어요. 높이 조절이 정말 편합니다.',     by: '— 이*미 고객님', img: 'p2.jpg' },
    { t: '커버만 빨면 돼요',     x: '커버를 분리해서 세탁기에 돌릴 수 있어서 관리가 쉬워요. 털도 잘 안 붙는 원단입니다.',        by: '— 박*준 고객님', img: 'p4.jpg' },
    { t: '훈련용으로 최고',      x: '한 알씩 떼어 줄 수 있어서 산책 훈련할 때 딱이에요. 냄새가 강하지 않아 손에도 안 남습니다.',   by: '— 최*서 고객님', img: 'p10.jpg' }
  ];
  F.copy = {
    'product-grid': [
      { title: 'BEST',        desc: '집사님들이 가장 많이 담은 것' },
      { title: '새로 들어온 것', desc: '이번 주 입고' },
      { title: '다시 담는 것',  desc: '재구매가 많은 간식' }
    ],
    'category-shortcut': { title: '어떤 걸 찾으세요', desc: '가구 · 식기 · 간식 · 산책' },
    'category-tabs': { title: '우리 아이에 맞게', desc: '체중과 크기로 나눠 담았어요',
      tabs: ['가구', '식기', '간식', '산책', '침구'] },
    'contents-product-grid': { title: '라인업', desc: '공간과 크기에 맞춘 조합',
      cards: [
        { img: 'p5.jpg', title: '고양이', desc: '오르내리는 자리',   items: [4, 3, 7] },
        { img: 'p2.jpg', title: '강아지', desc: '먹고 쉬는 자리',    items: [1, 8, 5] },
        { img: 'p1.jpg', title: '간식',   desc: '하루 한 봉씩',      items: [0, 2, 9] }
      ] },
    'split-banner': { kicker: 'OUR PHILOSOPHY', title: '삼켜도 괜찮은 것만 씁니다',
      desc: '원목 마감재와 커버 원단은 무해 인증을 받은 것만 씁니다. 커버는 분리해 세탁할 수 있게 만듭니다.',
      btn: '브랜드 스토리' },
    'video-banner': { title: 'MORU 제작 과정', kicker: '가구가 만들어지는 과정' },
    'photo-review': { title: '집사님 후기' },
    'shorts-carousel': { title: 'MORU 하루 쇼츠' }
  };
})(window.ONB_INDS.pet);

/* 후기만 채우는 둘 — 시안에 후기 섹션이 없어 reviews 가 비어 있었다(시안을 고치는 게 아니라,
   프리셋에서 포토리뷰가 붙을 때 업종 무관 기본 후기 4건이 나가는 걸 막는다).
   시안 실측 섹션(figma)은 손대지 않았다. */
(function (F) {          /* OTHER — 뷰티 */
  F.reviews = [
    { t: '결이 정돈돼요',      x: '아침에 바르면 화장이 밀리지 않고 하루 종일 매끈합니다. 향도 거의 없어서 좋아요.',        by: '— 김*현 고객님', img: 'fig-c1.jpg' },
    { t: '끈적임이 없어요',    x: '유분 많은 피부인데 바르고 바로 흡수돼서 번들거리지 않아요. 두 번째 구매입니다.',        by: '— 이*미 고객님', img: 'fig-c3.jpg' },
    { t: '색이 딱 원하던 톤',  x: '사진과 같은 색이에요. 한 번만 발라도 발색이 되고 입술이 마르지 않습니다.',            by: '— 박*준 고객님', img: 'fig-c5.jpg' },
    { t: '선물로 보냈어요',    x: '박스 포장이 단정해서 그대로 선물했는데 반응이 좋았어요. 구성도 알차네요.',             by: '— 최*서 고객님', img: 'fig-c7.jpg' }
  ];
})(window.ONB_INDS.beauty);

(function (F) {          /* MODUM — 생활용품 · 홈인테리어 */
  F.reviews = [
    { t: '실측 그대로예요',     x: '적어 주신 치수 그대로여서 자리에 딱 맞게 들어갔어요. 원목 결도 사진과 같습니다.',       by: '— 김*현 고객님', img: 'fig-c1.jpg' },
    { t: '조립까지 해주셨어요',  x: '배송 오신 분이 자리까지 옮겨 조립해 주셨어요. 흔들림 없이 단단하게 잡힙니다.',        by: '— 이*미 고객님', img: 'fig-c3.jpg' },
    { t: '커버를 빨 수 있어요',  x: '아이가 있어서 커버 분리되는 걸 골랐는데, 세탁 후에도 형태가 그대로예요.',            by: '— 박*준 고객님', img: 'fig-c5.jpg' },
    { t: '조명과 잘 어울려요',   x: '따뜻한 색 조명 아래 두니 결이 더 살아나요. 방 분위기가 완전히 달라졌습니다.',        by: '— 최*서 고객님', img: 'fig-c7.jpg' }
  ];
})(window.ONB_INDS.living);


/* ══ 실측 업종의 「시안에 없는 자리」 문구 ═════════════════════════════════
   프리셋(전환율·브랜딩·정보신뢰)은 그 업종 시안에 없는 위젯도 끌어온다 — 카테고리 바로가기,
   상품 탭, 쇼츠, 영상 배너처럼. 그 자리는 시안에서 가져올 문구가 없어 위젯 기본값
   (「카테고리」·「카테고리별 상품」·「쇼츠로 보는 ○○」·「Photo review」)으로 떨어졌다.
   시안이 가진 자리는 건드리지 않는다 — copyInto 가 그쪽은 figma 에서 그대로 가져온다.
   아래 문구는 우리가 쓴 것이고, 각 업종의 menu·slogan·ref 안에서만 쓴다(새 사실을 만들지 않는다). */

(function (F) {          /* LOTS — 식료품 */
  F.copy = {
    'category-shortcut': { title: '무엇을 찾고 계신가요', desc: '한 끼부터 간식까지' },
    'shorts-carousel':   { title: 'LOTS 레시피 쇼츠' }
  };
})(window.ONB_INDS.food);

(function (F) {          /* LIEN — 육아 */
  F.copy = { 'shorts-carousel': { title: 'LIEN 데일리 쇼츠' } };
})(window.ONB_INDS.baby);

(function (F) {          /* OTHER — 뷰티 */
  F.copy = {
    'category-shortcut': { title: 'CATEGORY', desc: '스킨케어부터 메이크업까지' },
    'category-tabs': { title: '단계별로 골라보기', desc: '쓰는 순서대로 나눠 담았어요',
      tabs: ['스킨케어', '클렌징', '선케어', '메이크업', '바디'] },
    'video-banner': { title: 'OTHER 브랜드 필름', kicker: '성분과 공정을 영상으로' }
  };
})(window.ONB_INDS.beauty);

(function (F) {          /* MODUM — 생활용품 · 홈인테리어 */
  F.copy = {
    /* 「Category」로 두면 시안의 Category 3컷 섹션(contents-product-grid)과 제목이 같아
       한 페이지에 같은 이름이 두 번 선다 — 바로가기는 방 기준이라 SHOP BY ROOM 으로 갈랐다 */
    'category-shortcut': { title: 'SHOP BY ROOM', desc: '침실 · 거실 · 수납 · 조명' },
    'category-tabs': { title: '공간별로 골라보기', desc: '놓을 자리부터 정하고 고르세요',
      tabs: ['침실', '거실', '수납', '조명', '테이블'] },
    /* [null, …] — 첫 상품 그리드는 시안 것(MODUM Best Sellers)을 그대로 쓰고, 프리셋이 하나 더
       붙일 때만 이 제목을 쓴다. null 자리는 copyInto 가 시안으로 떨어뜨린다 */
    'product-grid': [null, { title: 'NEW ARRIVALS', desc: '이번 주 새로 들어온 것' }],
    'photo-review': { title: '배송 · 설치 후기' },
    'video-banner': { title: 'MODUM 제작 과정', kicker: '원목이 가구가 되기까지' }
  };
})(window.ONB_INDS.living);

(function (F) {          /* DAILYPRO — 건강기능식품 */
  F.copy = {
    'category-shortcut': { title: '카테고리', desc: '맛별로, 용량별로' },
    'shorts-carousel':   { title: 'DAILYPRO 루틴 쇼츠' },
    /* 시안이 이 섹션 제목을 비워 둬서 「건강기능식품 추천」으로 떨어졌다. 제목만 갈고
       카드(데일리 세트·선물 세트·맛 골라 담기)는 시안 것을 그대로 쓴다 */
    'contents-product-grid': { title: '골라 담는 세트', desc: '맛과 용량을 조합해 담으세요' },
    'video-banner':      { title: 'DAILYPRO 브랜드 필름', kicker: '무엇으로 만드는지 영상으로' },
    /* 시안 브랜드 배너(split-banner) 제목이 슬로건이라 스크롤 배너까지 슬로건이면 같은 줄이 두 번 선다 */
    'scroll-banner':     { title: '오늘의 한 잔이 내일을 만듭니다' }
  };
})(window.ONB_INDS.health);

(function (F) {          /* VELOS — 스포츠 · 레저 */
  F.copy = {
    'category-shortcut': { title: 'SHOP BY CATEGORY', desc: '러닝 · 트레이닝 · 테니스 · 아웃도어' },
    /* 시안의 「SINCE 2026 배너」 자리 — 위 layout 주석에 적힌 섹션명이고 본문은 우리가 썼다 */
    'split-banner': { kicker: 'SINCE 2026', title: '가벼움을 유지하는 방법',
      desc: '실착 무게와 드롭까지 표기하고, 땀을 빠르게 밀어내는 원단만 씁니다.',
      btn: '브랜드 스토리' }
  };
})(window.ONB_INDS.sports);


/* ── 파생: catalog 가 있으면 prods 를 여기서 만든다 ──────────────────────
   R6 는 prods([이름, 가격])만 읽는다. 두 곳에 같은 값을 적어 두지 않기 위해
   실측 catalog 를 가진 업종은 prods 를 손으로 쓰지 않고 파생시킨다.          */
Object.keys(window.ONB_INDS).forEach(function (k) {
  var i = window.ONB_INDS[k];
  if (i.catalog) i.prods = i.catalog.map(function (c) { return [c.n, c.price]; });
});

/* ── 컨셉 4종 — R6·R7 공용 ────────────────────────────────────────────── */
/* ── DAILYPRO(건강기능식품) 시안 실측 — `6223:8962` ────────────────────────
   문구·가격·할인율은 시안에 적힌 값 그대로다. 이미지도 시안 원본 파일을 받아 넣었다.

   ⚠ 시안 자체가 미완성인 자리 (고치지 않고 그대로 옮기고 여기 적어 둔다):
     · 상품 8종이 전부 같은 더미값이다 — 이름 「파워쉐이크 프로틴」 · 38% · 23,400원(정가 38,000원).
       그대로 쓰면 8칸이 전부 같은 카드가 되어, 사진에 찍힌 맛만 이름 뒤에 괄호로 덧붙였다.
       가격·할인율은 시안 값을 손대지 않았다.
     · 콘텐츠+상품 그리드와 카테고리 탭의 상품 설명이 **뷰티 자리표시자**로 남아 있다
       (「비타민 C 브라이트닝 앰플」 「끈적임없이 촉촉한 기능성 세럼」) — 프로틴 몰인데.
       지어내지 않고 카탈로그 상품으로 채웠다. */
(function (F) {
  F.src = '6223:8962';
  F.notice = '4개 사면 하나 더! 4+1 · 오후 4시까지 주문 시 오늘 출발';

  F.catalog = [
    { n: '파워쉐이크 프로틴 (초코)',        d: '빠르게 에너지를 채워주는 프로틴 쉐이크', sale: '38%', price: 23400, orig: 38000, img: 'fig-c1.jpg' },
    { n: '파워쉐이크 프로틴 (초코 파우치)',  d: '빠르게 에너지를 채워주는 프로틴 쉐이크', sale: '38%', price: 23400, orig: 38000, img: 'fig-c2.jpg' },
    { n: '파워쉐이크 프로틴 (딸기)',        d: '빠르게 에너지를 채워주는 프로틴 쉐이크', sale: '38%', price: 23400, orig: 38000, img: 'fig-c3.jpg' },
    { n: '파워쉐이크 프로틴 (바닐라)',      d: '빠르게 에너지를 채워주는 프로틴 쉐이크', sale: '38%', price: 23400, orig: 38000, img: 'fig-c4.jpg' },
    { n: '파워쉐이크 프로틴 (바닐라 파우치)', d: '빠르게 에너지를 채워주는 프로틴 쉐이크', sale: '38%', price: 23400, orig: 38000, img: 'fig-c5.jpg' },
    { n: '파워쉐이크 프로틴 (말차)',        d: '빠르게 에너지를 채워주는 프로틴 쉐이크', sale: '38%', price: 23400, orig: 38000, img: 'fig-c6.jpg' },
    { n: '파워쉐이크 프로틴 (바나나)',      d: '빠르게 에너지를 채워주는 프로틴 쉐이크', sale: '38%', price: 23400, orig: 38000, img: 'fig-c7.jpg' },
    { n: '파워쉐이크 프로틴 (그레인)',      d: '빠르게 에너지를 채워주는 프로틴 쉐이크', sale: '38%', price: 23400, orig: 38000, img: 'fig-c8.jpg' }
  ];

  /* 포토리뷰 5개 — 시안이 5칸 모두 같은 문구를 쓴다(그대로 옮긴다) */
  F.reviews = [
    { t: '', x: '단백질 쉐이크 정말 만족해요! 어제 주문했는데 오늘 바로 받았어요.',                 by: '단백질쉐이크', img: 'fig-rv1.jpg' },
    { t: '', x: '단백질 쉐이크 정말 만족해요! 어제 주문했는데 오늘 바로 받아서 신선하게 마셨...',   by: '단백질쉐이크', img: 'fig-c1.jpg' },
    { t: '', x: '단백질 쉐이크 정말 만족해요! 어제 주문했는데 오늘 바로 받아서 신선하게 마실..',   by: '단백질쉐이크', img: 'fig-promo2.jpg' },
    { t: '', x: '단백질 쉐이크 정말 만족해요! 어제 주문했는데 오늘 바로 받았어요.',                 by: '단백질쉐이크', img: 'fig-c2.jpg' },
    { t: '', x: '단백질 쉐이크 정말 만족해요! 어제 주문했는데 오늘 바로 받았어요.',                 by: '단백질쉐이크', img: 'fig-c3.jpg' }
  ];

  F.figma = [
    { w: 'content-banner', style: 'wide', img: 'fig-hero.jpg', kicker: 'NEW',
      title: '고단백 에너지 부스터 파워쉐이크 프로틴',
      desc: '신제품 출시 기념 특별 할인 혜택을 놓치지 마세요.', btn: 'View More',
      approx: '히어로 — 시안은 좌측 텍스트 / 우측 인물+제품컷이 한 장에 합쳐진 이미지다. 넓은 배너 하단 좌측(디폴트)에 문구를 얹었다' },

    /* 혜택 배너 — 시안(`6223:8991`)은 625×200 패널 2장이다. 세 칸 배너는 칸 수를 items 길이로
       잡으므로 2칸으로 그대로 담긴다(전엔 cards 를 안 줘서 기본 3칸으로 떨어지고, 그 기본값이
       없는 파일 p3/p6/p9.jpg 를 불러 이미지가 안 나왔다).
       칸 배경 이미지 = 시안 패널 도판을 좌표 그대로 옮긴 것: 옅은 패널색(#EDECF7 / #FBF3EA) 위에
       시안 좌표대로 그림을 얹었다(4분할 맛 카드 383,31 211²  ·  택배 트럭 168,-96 460×306 +
       왼쪽 26.9% 페이드). 글은 위젯이 얹는다 — 시안도 같은 구조(패널 도판 + 좌측 텍스트)다. */
    /* ratio 는 시안 칸 비율(3.13:1) — 원본 컷이 1250×400 이라 이 비율이라야 도판이 안 잘린다.
       textWidth 는 글이 도판(칸 오른쪽)을 덮지 않게 묶는 폭. 시안도 좌측 텍스트 구성이다. */
    { w: 'content-banner-3', ratio: '625/200', textWidth: '58%', textColor: '#2E2E2E', descColor: '#818181',
      cards: [
        { img: 'fig-benefit1.jpg', pos: 3, title: '4개사면 하나더! 4+1', desc: '4개 구매시 랜덤으로 1가지 맛을 증정해드려요!' },
        { img: 'fig-benefit2.jpg', pos: 3, title: '오늘 사면 오늘 출발!',  desc: '오후 4시까지 주문 시' }
      ],
      approx: '혜택 배너 — 시안 문구 위치(좌측 세로 중앙)·색(#2E2E2E/#818181)까지 맞췄다. 다른 점은 글 왼쪽 여백(시안 40px / 칸 기본 22px)과 제목 크기(시안 24px / 칸 기본 20px)뿐이다' },

    { w: 'product-grid', title: '베스트 상품', desc: '최근 가장 많이 구매했어요', items: [3, 0, 2, 5] },
    { w: 'product-grid', title: '신제품',     desc: '지금 가장 빛나는 시즌 베스트 아이템을 만나보세요', items: [1, 2, 5, 4] },

    { w: 'strip-banner', text: '신제품받고, 할인 받으세요 · 5% 할인 쿠폰 즉시 사용 가능' },

    { w: 'contents-product-grid', title: '', desc: '',
      cards: [
        { img: 'fig-recipe1.jpg', title: '데일리 세트',  desc: '매일 한 잔씩 꾸준히',   items: [3, 0, 2] },
        { img: 'fig-promo2.jpg',  title: '선물 세트',    desc: '박스로 챙겨 보내기',   items: [1, 4, 6] },
        /* fig-recipe3 은 투명 배경 체크무늬가 **사진에 구워진** 컷이었다(1400×1400 JPEG).
           카드에 깔리면 격자무늬가 그대로 보여 깨진 이미지로 읽힌다. 같은 4가지 맛 아트웍의
           깨끗한 시안 원본으로 갈았다. */
        { img: 'fig-flavorset.jpg', title: '맛 골라 담기', desc: '4가지 맛 조합 구성',   items: [5, 6, 7] }
      ],
      approx: '시안의 이 섹션 상품 문구가 뷰티 자리표시자(비타민 C 앰플·수분 크림·토너)로 남아 있어 지어내지 않고 카탈로그 상품으로 채웠다' },

    { w: 'category-tabs', title: '카테고리', desc: '맛별로, 용량별로 나에게 맞는 제품을 선택해보세요.',
      tabs: ['초코', '딸기', '바닐라', '바나나', '말차'] },

    /* 이미지 위젯은 폭 전체 × 높이 340(=3.5:1)로 잘라 깐다. 전에 쓰던 fig-recipe1 은
       ① 바로 위 「데일리 세트」 카드와 같은 컷이라 한 화면에 두 번 나왔고
       ② 1400×727 세로컷이라 3.5:1 띠로 자르면 인물이 잘리고 확대돼 뭉개졌다.
       시안 원본 중 가장 넓고 큰 컷(3460×2176 · 맛 통 4개 나란히)으로 갈았다. */
    { w: 'image', img: 'fig-lineup.jpg',
      approx: '시안은 러닝하는 여성 풀블리드 컷인데 그 원본이 내려받은 20장(시안 원본 이미지 상한)에 없어 다른 시안 컷으로 대체했다' },

    { w: 'photo-review', kicker: '베스트 리뷰', title: '포토리뷰로 확인하는 실사용 후기' },

    { w: 'contents-product-grid', title: '건강정보 레시피', desc: '레시피',
      cards: [
        { img: 'fig-c8.jpg',      title: '파워 프로틴 쉐이크로 에너지 충전하기', desc: '끈적임 없이 빠르게 흡수되는 고단백 단백질 쉐이크로 운동 후 회복을 돕습니다.', items: [7, 0] },
        { img: 'fig-promo1.jpg',  title: '단백질 쉐이크로 에너지 충전하는 방법',  desc: '끈적임 없이 빠르게 흡수되는 고단백 단백질 쉐이크로 운동 후 회복을 돕습니다.', items: [1, 3] },
        { img: 'fig-recipe2.jpg', title: '단백질 쉐이크: 건강한 바디 만들기 비결', desc: '끈적임 없이 빠르게 흡수되는 고단백 단백질 쉐이크, 맛있게 건강을 챙기세요.',   items: [6, 5] }
      ] },

    { w: 'split-banner', img: 'fig-brand.jpg', kicker: 'DAILYPRO',
      title: '오늘도, 내일도 나의 건강레시피', btn: '브랜드 스토리' }
  ];
})(window.ONB_INDS.health);


/* 업종 분류 칩 — 여러 개 고를 수 있고, 한 업종이 둘 이상에 들어간다(겹치기).
   예: 스포츠·레저는 라이프스타일이면서 패션이고, 건강기능식품은 식품이면서 라이프스타일이다.
   그래서 두 칩을 같이 고르면 그 업종은 한 번만 나온다(합집합). */
window.ONB_CATS = [
  { k: 'all',     n: '전체' },
  { k: 'fashion', n: '패션 · 뷰티' },
  { k: 'food',    n: '식품 · 건강' },
  { k: 'living',  n: '리빙 · 가전' },
  { k: 'life',    n: '라이프스타일' }
];

window.ONB_CONCEPTS = {
  /* 각 컨셉은 "무엇을 먼저 보여주나"만 다르다. 위젯 수는 업종 레이아웃과 같은 수준으로 채운다 —
     프리셋을 고르면 페이지가 갑자기 5개로 줄어 빈약해 보이던 문제를 없앤다.
     렌더러가 없는 위젯(버튼·매거진 게시판)은 넣지 않는다 — 넣으면 조용히 빠지고 안내만 늘어난다.
     띠배너·카운트다운은 업종의 common 이 붙이므로 여기서는 다루지 않는다.

     `text-block` 은 어느 레이아웃에도 남기지 않았다. 컨셉 프리셋·업종 layout 에서는
     시안 근거가 없는 자리라 문구를 이쪽에서 지어내야 했고(「○○, 이렇게 고릅니다」 + 업종
     3줄) 몰의 다른 섹션과 이어지지 않았다. 시안에 실제 텍스트 섹션이 있던 세 자리
     (LOTS 웰컴이벤트 · LIEN 웰컴쿠폰 · LIEN 브랜드문구)도 회색 바탕에 글만 남아 미완성으로
     보였으므로, 사진을 가진 위젯으로 옮겼다 — 앞 둘은 이미지+글(좌 텍스트/우 이미지),
     인용문은 넓은 배너(사진 위 오버레이). 각 자리의 approx 에 시안과 다른 점을 적어 뒀다.
     갤러리에서 직접 넣는 「텍스트 위젯」은 운영 스펙 그대로다(그 위젯엔 이미지 필드가 없다). */
    /* ⚠ 프리셋이 손댈 수 있는 자리는 **배너 다음 한 칸이 아니라 그 다음부터**다.
       ② 상품 수 규칙이 「배너 → 상품 3열」/「배너 → 카테고리 → 탭」을 강제로 앞에 꽂기
       때문이다(arrange()). 그래서 프리셋의 차이는 세 군데로 만든다:
         (1) **앞에 세우는 배너 수** — content/video/split 배너는 맨 앞에 있으면 상품보다
             위로 올라간다(LEAD_BANNER). 브랜딩·신뢰가 3장, 전환율이 1장이다.
         (2) **`pre`** — 여기 적은 위젯은 ② 상품 블록보다 **앞에** 남는다(arrange()).
             선언 순서만으로는 안 된다 — ② 규칙이 상품을 배너 바로 뒤로 끌어오기 때문에,
             신뢰 프리셋이 「후기를 상품보다 먼저」로 적어 둬도 실제로는 상품이 먼저 나왔다.
         (3) **상품 블록 바로 다음 칸** — 여기에 그 프리셋의 성격을 건다.
       ⚠ 브랜딩과 신뢰는 지금 **앞 배너 3칸이 같다**(콘텐츠·영상·이미지+글). 넷이던 프리셋에서
         재구매를 뺐고, 신뢰의 앞 구역을 「배너 → 브랜드 스토리 → 이미지+글」로 지정받았기
         때문이다. 둘은 4번째 칸부터 갈린다(신뢰=후기, 브랜딩=카테고리·상품). */
    cv:     { n: '전환율 중심', d: '상품이 가장 먼저. 혜택과 그리드로 바로 고르게 한다',
      /* 상품 다음 칸 = 혜택 3분할 → 상품 한 번 더. 고르는 데 필요한 것만 연달아 준다 */
      main: ['content-banner', 'category-shortcut', 'product-grid', 'content-banner-3', 'category-tabs',
             'contents-product-grid', 'product-grid', 'photo-review',
             'image', 'shorts-carousel', 'split-banner', 'video-banner'] },
    brand:  { n: '브랜딩 중심', d: '브랜드를 먼저 소개하고 영상·이미지 뒤에 상품을 둔다',
      /* 배너 3장(콘텐츠·영상·스플릿)이 상품 위로 올라간다 — 상품까지 스크롤이 필요하다.
         상품 바로 다음 칸이 **스크롤 배너**(패럴랙스)다 — 이 프리셋의 성격을 가장 잘 드러내는
         자리이고, 앞 배너 무리에 끼우면 상품까지가 네 화면이 된다.
         ⚠ 앞으로 당기지 않는다: LEAD_BANNER 에 넣으면 ② 상품 수 규칙이 상품을 그 뒤로 밀어낸다.
         round-7 은 MAP 에 이 키가 없어 조용히 건너뛴다 — 그 라운드 화면은 종전 그대로다.
         ⚠ 이미지 위젯은 뺐다 — 스크롤 배너 바로 뒤 자리였는데 **둘 다 split.jpg** 라서 같은 사진이
         연달아 두 번 깔렸다(위는 문구가 얹힌 배너, 아래는 같은 사진 원본 그대로). 문구도 링크도
         없이 사진 한 장만 전면으로 서서 위아래 사이에서 아무 역할도 하지 않았다 — 패션잡화
         layout 에서 같은 이유로 이미 뺀 위젯이고, 프리셋 쪽에도 같은 판단을 적용한다. */
      main: ['content-banner', 'video-banner', 'split-banner', 'category-shortcut', 'product-grid',
             'scroll-banner', 'shorts-carousel', 'contents-product-grid', 'category-tabs',
             'content-banner-3', 'photo-review', 'product-grid'] },
    trust:  { n: '정보 · 신뢰 중심', d: '고관여 상품용 — 브랜드 스토리와 후기를 상품보다 앞에 둔다',
      /* 지정받은 앞 구역: 배너 → **브랜드 스토리**(영상 배너 — 위젯 기본 제목이 「{브랜드} 브랜드
         스토리」다) → **이미지+글** → **후기** → 상품 → **매거진**.
         후기는 `pre` 로 못 박는다 — 목록 순서만으로는 ② 규칙이 상품을 앞으로 끌어와 밀려난다.
         매거진은 상품 바로 다음 칸이라 목록 순서로 충분하다(② 블록 뒤가 곧 그 자리다). */
      pre: ['photo-review'],
      main: ['content-banner', 'video-banner', 'split-banner', 'photo-review', 'product-grid',
             'magazine-board', 'category-shortcut', 'category-tabs', 'contents-product-grid',
             'image', 'shorts-carousel', 'content-banner-3'] }
  };
