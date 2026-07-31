# AlphaCanvas 상세페이지 (정적 호스팅)

카페24 상품 상세에 iframe으로 임베드되는 알파캔버스 상세페이지 배포본.

- `index.html` — 자체완결 상세페이지 (SDS 토큰, 이미지/영상 인라인)
- `proto/` — 빌더 체험 프로토타입

호스팅: Cloudflare Pages (무료·상업용 허용·대역폭 무제한)
라이브: https://alpha-canvas-proto-in-cafe24.pages.dev

## 배포

**`main`에 머지/푸시하면 자동 배포됩니다.** (GitHub Actions → Cloudflare Pages)
별도 Cloudflare 계정이나 wrangler 설치 없이, 이 레포에 쓰기 권한이 있으면 누구나 배포됩니다.

- 워크플로: `.github/workflows/deploy.yml`
- 진행 상황: Actions 탭 → "Deploy to Cloudflare Pages" (1~2분 소요)
- 코드 변경 없이 재배포만 하려면: Actions 탭 → 해당 워크플로 → **Run workflow**
- 인증: 레포 시크릿 `CLOUDFLARE_API_TOKEN` + 변수 `CLOUDFLARE_ACCOUNT_ID`
