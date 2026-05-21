# billyjo-detailcard

빌리조(billyjo.co.kr) 렌탈 가전 **제품 상세페이지** AI 카드 시스템 — v0.3.2.

이 저장소는 두 가지를 담는다:
1. **클라이언트 패치 스크립트** (`inject.js`) — 실서버에 즉시 적용 가능
2. **AI 카드 디자인 사양 + 룰북** — backend 파이프라인 구축용 참조 (별도 작업)

---

## 1. 실서버 적용 — 클라이언트 패치 (즉시 가능)

### 무엇이 적용되는가

`/html/dh_prod/prod_view/*` 제품 상세 페이지에서 다음 자동 적용:

| 패치 | 효과 |
|---|---|
| **좁은화면 헤더** (≤1280px) | inject.js의 leftGroup/rightGroup이 좁은 폭에서 카테고리 위로 흘러넘치는 문제 해결 |
| **모바일 헤더 정리** (≤768px) | `.new-gnb` 숨김 + 햄버거 5px gap + 로고 정렬 + 이벤트·검색·장바구니 1행 |
| **햄버거 중복 제거** | `.gnb__hamburger`만 유지, `.hamburger__btn` 숨김 |
| **제품 썸네일 테두리** | `.prod_thumbs li` 60×60 이미지에 1px 회색 테두리 |
| **하단 fixed 위젯** | `.prod_view_bot.card.mt40`을 viewport 하단 고정 + ▾▴ 폴딩 토글 |
| **버튼 격상** | "렌탈 신청" → "🎁 렌탈+사은품 신청" + "💬 상담신청" 추가 |

(AI 카드 콘텐츠 자체는 별도 backend 작업 필요 — 본 스크립트는 카드가 있으면 격상시키고, 없으면 위 패치만 적용한다)

### 설치 — 사이트 템플릿에 스크립트 태그 추가

빌리조 사이트의 **공통 헤더 또는 푸터 템플릿**에 아래 한 줄 추가. 기존 `billyjo-inject` 스크립트 태그 **바로 뒤**가 권장 위치.

```html
<!-- 기존 -->
<script src="https://cdn.jsdelivr.net/gh/billyjo-appsilon/billyjo-inject@68ac513/inject.js"></script>

<!-- 추가 -->
<script src="https://cdn.jsdelivr.net/gh/billyjo-appsilon/billyjo-detailcard@main/inject.js"></script>
```

`defer` 또는 `async`는 사용하지 말 것 — 본 스크립트가 자체 트리거 시간을 관리한다 (DOMContentLoaded + setTimeout + MutationObserver 다중 폴백).

### CDN 캐시 주의

jsDelivr는 `@main` 브랜치를 일정 시간 캐싱한다 (~12시간). 즉시 반영이 필요하면 커밋 해시를 직접 지정:

```html
<script src="https://cdn.jsdelivr.net/gh/billyjo-appsilon/billyjo-detailcard@{커밋해시}/inject.js"></script>
```

또는 `purge` 엔드포인트 호출: `curl https://purge.jsdelivr.net/gh/billyjo-appsilon/billyjo-detailcard@main/inject.js`

### 점검 체크리스트

스크립트 적용 후 임의의 제품 상세 페이지(예: https://www.billyjo.co.kr/html/dh_prod/prod_view/10914)에서 확인:

- [ ] **PC** 폭 1400 → 1280 → 1024px로 줄여보며 검색·장바구니가 카테고리 위로 올라타지 않음
- [ ] **모바일** 폭(≤768px)에서 헤더가 `[≡ 햄버거] [로고] [#이벤트][검색][장바구니]`로 1행 정렬
- [ ] 모바일에서 PC 카테고리 메뉴(`.new-gnb`)가 숨겨짐
- [ ] 햄버거 버튼이 하나만 노출
- [ ] 화면 하단에 fixed 위젯이 항상 떠 있음
- [ ] 위젯 핸들(grip + 제품명 + 가격) 탭 또는 ▾ 토글로 펼침/접힘 동작
- [ ] 위젯에 [장바구니] [🎁 렌탈+사은품 신청] [💬 상담신청] 3버튼 노출
- [ ] 제품 다중 이미지 썸네일에 1px 회색 테두리
- [ ] 상담신청 클릭 시 `/html/dh/counsel`로 이동 (TODO: 실제 상담 폼 URL 필요)

### 제거 / 롤백

스크립트 태그 한 줄을 사이트 템플릿에서 제거하면 즉시 원복. DOM 변경은 모두 reversible (캐시된 inject.js만 1회 더 정리 필요할 수 있음).

---

## 2. AI 카드 디자인 사양 (별도 backend 작업 참조용)

이 저장소의 `.md` 문서는 backend 파이프라인 (제품별 AI 카드 사전 생성 + DB 저장 + GTM 캐시 조회) 구축 시 참조 사양:

- `CLAUDE.md` — 25개 절대 규칙 (카드 구조 / 점수 / 등급 / 페르소나 / 데이터 출처 등) + 변경 이력 v0.1 → v0.3.2
- `billyjo_ai_detailpage_rulebook.md` — 14개 패밀리(F01~F14) 평가 룰북 + 4지표·스펙·페르소나 정의
- `billyjo_ai_detailpage_context_memo.md` — 아키텍처·검증·디자인 토큰·CSS 사양
- `billyjo_project_merge_guide.md` — 통일 기준·충돌 체크리스트 27개

검증 케이스 HTML:
- `billyjo_10914_actual_v023.html` — **세스코 EWBD351 정수기** (F01, A등급) — canonical 운영 상태
- `billyjo_coway_chp7211n_integrated_v023.html` — 코웨이 CHP-7211N (F01, S등급)
- `sample_lg_dios_obje_M874GBB041_v023.html` — LG 디오스 오브제 냉장고 (F05)
- `sample_lg_gram_pro_16_16Z90SP_v023.html` — LG 그램 프로 (F08)

---

## 3. 외부 비교 데모 페이지

3-Layout 비교본·Step 폰트 변형·필터 비교표 갤러리·canonical 정식본:

**https://billyjo-header-layouts.vercel.app**

(`noindex,nofollow` — 검색엔진 미노출, 링크 직접 공유로만 접근)

---

## 버전

- **v0.3.7** (2026-05-22) — 모바일 검색바 명시 숨김 + 카테고리 1행 가로스크롤(룰북 #20 갱신) + 빨강→파랑 통일 + `.g-d` 평가없음 배지 높이 통일
- **v0.3.6** (2026-05-21) — 모바일 헤더 로고-이벤트 버튼 겹침 픽스 (로고 max-width:38vw + 아이콘 shrink 허용)
- **v0.3.5** — `.help-pop` ⓘ 툴팁 모바일 하단 sheet 전환 + 외부 탭 자동 닫힘
- **v0.3.4** — 카드 너비 `.wide-inner` 1480px 확장 + SLOT 7 모바일 column 레이아웃 + 한글 word-break:keep-all
- **v0.3.3** — 모바일 비교표 overflow 픽스 (3-layer min-width:0)
- **v0.3.2** — 모바일 헤더 3개 이슈 픽스 + 위젯 specificity 강화 + JS inline fallback
- **v0.3.1** — sticky → fixed 정정 + 페르소나 폰트 +35%
- **v0.3.0** — 하단 위젯 정식화
- **v0.2.9** — 2단계 토글 비교표
- **v0.2.7** — Hero 재배치 (Option C) + Step 폰트 +35%
- **v0.2.6** — `.rec` 산문 폐지 + `.specs` 6→8칸
- **v0.2.5** — 좁은화면 헤더 패치 (inject.js 대응)
- **v0.2.4** — 카드 100% 풀폭
- **v0.2** — letter 등급 시스템, 카드 디자인 대폭 확장
- **v0.1** — 초안

전체 변경 이력은 `CLAUDE.md` 끝 참조.
