# 빌리조 AI 상세페이지 자동생성 시스템

이 프로젝트는 빌리조(billyjo.co.kr) 렌탈 가전의 제품 상세페이지를 AI가 자동 생성하는 시스템입니다. Claude Code는 본 파일의 규칙과 `docs/` 폴더의 룰북을 기준으로 작업합니다.

## 파일 구조

```
.
├── CLAUDE.md                       ← 본 파일 (Claude Code가 자동 로드)
├── docs/
│   ├── rulebook.md                 ← 14개 카테고리 패밀리별 평가 룰북
│   ├── context_memo.md             ← 아키텍처·검증 메커니즘·카드 디자인 사양
│   └── merge_guide.md              ← 디자인 통일 기준·충돌 점검 체크리스트
└── templates/
    └── product_card.html           ← 카드 HTML 레퍼런스 구현 (CSS·SVG 포함)
```

새 채팅을 시작하면 항상 위 파일들을 컨텍스트로 사용한다. 자세한 내용이 필요하면 해당 파일을 직접 읽는다.

## 절대 규칙 (변경 금지)

1. **카드 슬롯 (v0.5.2 8슬롯 표준)**: 정확히 8개 슬롯 구조, 순서·구성 변경 금지. 모든 제품(F01~F14) 동일 적용:
    1. **SLOT 1 헤더** — 제품명, 모델번호, 형태 한 줄 메타 (Hero 영역으로 이전 가능)
    2. **SLOT 2 게이지 + 4지표** — 종합 letter + 4개 평가축 (Hero 영역으로 이전 가능)
    3. **SLOT 3 스펙요약 6-8칸** — 기술 스펙 6 + (선택) 운영/계약 2
    4. **SLOT 4 기본정보 + 강점 칩 + rental-terms** — 약정·의무·위약금 + 강점 chip
    5. **SLOT 5 이런 분에게 추천해요 Top 3** — 페르소나 3장 (정확히 3개)
    6. **SLOT 6 상세 스펙 Step 1-3** — `<!-- step-N-start --> ... <!-- step-N-end -->` 앵커 주석 필수. 각 Step은 .step-h / .step-sum / `<details class="step-details">`. 절대 규칙 #27 카드 내부 의무화 준수.
    7. **SLOT 7 예상 최대 지원금ㆍ빌리조 혜택** — 3행 (예상 지원금 / 빌리조 혜택 / 제조사 프로모션)
    8. **SLOT 8 약정·카드 할인가 (v0.5.2 표준화)** — `#ai-card-lpt-section`. inject.js `mountLptIntoCard()`가 LPT 데이터 발견 시 자동 mount. 카드 할인 있으면 3컬럼(약정/월렌탈료/카드할인가), 없으면 2컬럼(약정/월렌탈료). 본문 `#livePriceTable`은 mount 성공 시 hide.

    7→8 슬롯 변경 사유 (v0.5.2): 사용자 명시 요구 "ai 자동 생성카드는 지금의 형태가 좋으니 룰북에 추가해서 모든 제품에 동일하게 적용". 모든 신규·기존 카드는 이 8슬롯 구조 + scripts/template-base.html 골격을 사용한다.
2. **페이지 배치**: 카드는 제품 상세페이지의 **상품정보(상세설명 이미지) 섹션 바로 위**에 위치한다. **가로 너비는 위쪽의 이미지+가격 박스 섹션(`.prod_view_top`)과 동일한 풀폭**으로 정렬:
    - `width: 100%`, `margin: 0`, `padding: 0` (외부 마진·패딩 모두 0 — 내부 콘텐츠는 `.card`의 자체 패딩 22px로 처리)
    - 카드의 좌·우 끝이 위쪽 이미지 섹션의 좌·우 끝과 정확히 같은 위치에 정렬되어야 함 (시각적 가로 정렬 일치)
    - 모든 breakpoint(PC·태블릿·모바일)에서 동일한 풀폭 — 별도 width 분기 불필요
    - `clear: both` 필수 (빌리조 `.prod_view_top` 컬럼이 float 기반인 경우 카드가 이미지 옆으로 떠오르는 것 방지)
    - 카드 위쪽 여백(`margin-top`)은 별도 `.ai-card-wrapper`로 처리하거나 카드 그림자·테두리로 시각 분리

    카드 위에는 기존 영역(이미지·가격박스·렌탈사 비교)이 유지되고, 카드 아래에는 상품정보·고객센터·렌탈 주문혜택이 이어진다. 카드를 페이지 최상단으로 올리지 말 것 — 구매 결정 직전 단계에서 노출되어야 효과가 크다. 폐기된 50% 우측 정렬 규칙(v0.2.1)은 사용자 피드백으로 풀폭으로 변경됨 (v0.2.4) — 이미지 섹션과 가로 너비가 시각적으로 일치해야 PC에서 카드가 "좁아 보이는" 인상이 해소됨.
3. **컬러 시스템**: 빌리조 디자인 토큰 변수만 사용 (`var(--color-text-info)`, `var(--color-background-secondary)` 등 9종). 빌리조 브랜드 메인 컬러는 **`#0838F8`** (`--color-text-info`). hex(#FFFFFF) / RGB / Tailwind 임의 색상 금지 (등급 컬러 팔레트 9종은 예외 — 절대 규칙 #13).
4. **점수 산정**: `(지표1 + 지표2 + 지표3 + 지표4) ÷ 4`. 가중평균 금지. **단, `평가 없음` 처리된 지표는 평균에서 제외**하고 분모도 줄임 (예: 3지표 평균).
5. **등급 표시 (점수 → letter + 한글 라벨)**: 점수는 사용자에게 직접 노출하지 않고 letter 등급으로 변환. 종합은 letter만, 개별 지표는 한글 라벨 + letter 보조. 매핑은 절대 규칙 #13 참조.
6. **SVG 게이지**: 270° 호, `viewBox="0 0 100 100"`, 크기 100×100px, `stroke-dasharray="{score × 1.65} 165"` 공식 변경 금지. **중앙 텍스트는 정확히 2줄만 표시**:
    - 위: "종합 평가" (`y=40`, font-size 9, var(--color-text-secondary))
    - 가운데: letter 만 (`y=62`, font-size 26, Pretendard Bold 700, 등급 컬러)

    "≈ 2.0" / "3지표 기준 · 2.0" 같은 **소수점·보조 텍스트는 게이지에 표시 금지** — letter 한 글자로 시각 단순화. 부분 평균 산출(평가 없음 지표 제외)도 letter 산출 로직에만 사용, 게이지엔 letter만 노출. 두 텍스트 사이는 약 2px 간격.
7. **pill 옵션**: 활성/비활성만 (`.pill` / `.pill.on`). ✓ 아이콘이나 별도 표식 추가 금지 — 색상으로만 구분. 단, 본사관리·방문관리·코디 케어 같은 신뢰성 차별 항목은 `.hq-btn` 별도 클래스(파란 채움 + 🏢 아이콘)로 구분 표기.
8. **"이런 분에게 추천해요" Top 3**: 정확히 Top 3 (1개도 5개도 안 됨). 각 페르소나는 5요소 — 이름 · Tabler 아이콘 · **추천 강도 라벨**(매우 추천 / 추천 / 권장) · 한 줄 추천 멘트 · **기능 버튼 3개**(강점 키워드). 구성비 %는 DB에만 저장, 카드 표면 노출 금지.
9. **"예상 최대 지원금ㆍ빌리조 혜택" 박스**: 3행 분리 유지 (예상 최대 지원금 / 빌리조 단독 / 제조사 프로모션). 라벨은 버튼형 (`.gift-tag`), 핵심 수치는 `<strong>` Pretendard Bold + `var(--color-text-info)` 강조. 1개 박스로 통합 금지.
10. **데이터 출처**: 모든 추출값에 `source_url` + `quoted_text` + `confidence (0-1)`을 함께 저장. 노출은 선택, DB 저장은 필수.
11. **AI 호출 시점**: 제품 등록 시 1회만. 사용자 페이지 진입 시 GTM은 캐시된 JSON만 가져온다. 실시간 AI 호출 금지.
12. **폰트**: 카드 전체 본문은 **Pretendard** (`font-family:'Pretendard', sans-serif`)로 통일. 빌리조 사이트 글로벌 폰트(Open Sans·NanumSquare)와 별개로 카드 영역만 Pretendard 단일 패밀리 사용. Bold 강조 텍스트는 반드시 **Pretendard Bold** (`font-weight:700`)로 처리한다. `font-weight:bold` 선언만으로 끝내지 말고 명시적으로 `font-family:'Pretendard'; font-weight:700` 또는 본문 상속 + weight 700 보장. **Pretendard Bold 적용 대상**:
    - 강조 어휘: `<strong>` (제품 주요 강점·차별화 기술, **가격 경쟁력**[렌탈료·할인·환급], 핵심 사은품·보증)
    - **모델명**: "모델명: " 라벨 뒤 모델번호 (`.model-num`은 `var(--color-text-info)` 파란색)
    - 등급 배지(`.grade-badge`), 평가 없음 배지(`.g-d`), 본사관리 버튼(`.hq-btn`), 핵심 강점 칩(`.strength-chip`)
    - 추천 강도 라벨(`.rec-p-level-1/2/3`), 사은품 라벨(`.gift-tag`), 기능 버튼(`.feat-btn`)
    - **구조 앵커 라벨** (시각 hierarchy 키 단어): 4지표 라벨(`.ml`), 6스펙 라벨·값(`.sl`·`.sv`), 섹션 제목(`.sec-t`), Step 제목(`.step-title`), 페르소나 이름(`.rec-p-title`)
13. **등급 letter + 한글 라벨 매핑**:

    | 점수 | letter | 한글 라벨 (개별 지표) | 컬러 변수 |
    |------|--------|----------------------|-----------|
    | 90-100 | **S** | 최고 | `--g-1` `#0838F8` 파랑 |
    | 85-89 | **A+** | 적극추천 | `--g-1-5` `#1a87ac` |
    | 80-84 | **A** | 추천 | `--g-2` `#16a34a` 초록 |
    | 70-79 | **B+** | 우수 | `--g-2-5` `#4ec727` |
    | 60-69 | **B** | 좋음 | `--g-3` `#84cc16` 연두 |
    | 50-59 | **C+** | 적합 | `--g-3-5` `#c2ce15` |
    | 40-49 | **C** | 보통 | `--g-4` `#facc15` 노랑 |
    | <40 또는 confidence<0.7 | **평가 없음** | (별도 표기, letter 사용 금지) | `--g-d` `#999` 회색 |

    - **종합 평가는 letter만 표시** (한글 라벨 없음). 예: SVG 게이지 가운데 "A".
    - **개별 평가(렌탈료·정수성능·위생관리·편의기능 + Step 등급)는 한글 라벨이 메인**, letter는 보조 (`<small>` 78% 크기 + 세로 구분선). 예: `[최고 | S]`.
    - **`평가 없음`은 D 글자 사용 금지** — 회색 배지 안에 "평가 없음" 텍스트만. 등급 부정성 회피 + 데이터 부족과 미흡 제품 구분.
    - Phase 1 (운영 시작): 절대 매핑 사용. Phase 2~3 (카테고리별 누적 30개+): median 보정 → percentile 기반 상대 매핑. 상세는 `docs/rulebook.md` 부록 A.
14. **스펙요약 그리드 (`.specs`) 6-8칸 + 도움말 (`<details>` 툴팁)**: 기본 6개 기술 스펙(렌탈료·필터종류·필터개수·출수기능·살균방식·제품유형)에 더해, **운영/계약 정보 (방문관리·소유권 이전·자동 이전 등)** 2개까지 추가 허용 — 총 6-8칸 그리드. PC 3-col, 모바일 2-col 자동 wrap. 방문관리 셀의 `.sv`에는 `.hq-btn` pill을 중첩 가능 (시각 강조). 일반 소비자가 모를 만한 전문 용어(필터 종류·살균 방식 등)는 라벨 옆에 ⓘ ? 아이콘(`<details class="help">`)을 부착하고 클릭 시 popup으로 용어 설명 제공. JS 불필요 — 네이티브 details 사용. **흡수 원칙**: `.rec`/.strengths/.rental-terms 등 다른 슬롯과 중복되는 정보는 `.specs`로 단일화하고 원본 영역에서는 제거 ([[billyjo-dedup-rule]] 참조).
15. **핵심 강점 칩 (`.strengths`)**: 기본정보 영역 하단에 4-6개 chip 표시. 가격 경쟁력, 슬림/대용량 등 물리적 강점, 본사/방문관리 같은 운영 강점, 사은품/혜택 강점을 골고루 배치. 각 chip은 Tabler 아이콘 + Pretendard Bold 텍스트.
16. **상세 스펙 [자세히 보기] 접기**: 각 Step (1-3)은 평상시에는 Step 번호 · 제목 · **등급 배지** · 핵심 요약 1줄(중요 키워드 `<strong>`)만 노출. pill 옵션 전체는 `<details class="step-details">` 안에 숨기고 "자세히 보기" 클릭 시 펼침. JS 불필요.
17. **검수 큐 트리거 (자동 노출 차단)**: 다음 중 하나라도 해당되면 카드를 사용자에게 노출하지 않고 검수 큐로 이동:
    - 4지표 중 **`평가 없음` 3개 이상** (데이터 너무 부족)
    - 임의 지표 점수 < 40 (측정 오류 가능성)
    - 임의 지표 confidence < 0.7 (해당 지표는 `평가 없음` 처리 + 카드 전체는 노출 가능, 단 위의 3개 이상 조건과 결합 시 차단)
    - 카테고리 라우팅 모호 (예: "에어 워셔" → F03 공기청정기 vs 가습기)
    - 핵심 항목(살균 방식·필터 종류·에너지 등급)이 단일 출처에서만 확인됨
18. **카드 라벨 (.ai-card-tag)**: 카드 상단 좌측에 부착되는 식별 배지. 텍스트는 정확히 **`📊 빌리조 제품분석`** (이모지 + 공백 + 텍스트). "AI 자동생성 카드" 같은 내부 용어 노출 금지 — 사용자에게는 빌리조 브랜드 제품 분석으로 인식되어야 함. 스타일 명세:
    ```css
    #ai-card-root .ai-card-tag {
      position: absolute; top: -1px; left: 34px;
      background: var(--color-text-info); color: #fff;
      font-size: 11px; padding: 3px 9px; border-radius: 5px;
      font-family: 'Pretendard', sans-serif; font-weight: 700;
      letter-spacing: 0.2px; z-index: 1; line-height: 1.3;
    }
    #ai-card-root .ai-card-tag::before { content: "📊 "; font-size: 12px }
    ```
    📊 이모지는 `::before`로 분리 (텍스트 변경 시 영향 없도록). 배지는 카드 상단에 거의 붙도록 `top: -1px` (이전 -10px → 떠 있던 인상 제거).
19. **모바일 4지표 카드 (`.m`) 단일 행 레이아웃**: 데스크톱은 column(라벨 위·등급 배지 아래)이지만, **모바일 (≤600px)은 row 1줄** — 라벨 좌측, 등급 배지 우측. 카드 1개당 2줄을 차지하지 않도록 강제:
    ```css
    @media (max-width: 600px) {
      #ai-card-root .m {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        padding: 7px 10px; gap: 6px;
      }
      #ai-card-root .m .ml { white-space: nowrap; flex-shrink: 0 }
      #ai-card-root .m .grade-badge { flex-shrink: 0; margin-left: auto }
    }
    ```
    추가 모바일 박스 컴팩트 규칙:
    - `.summary` gap: 14px → 10px / padding: 14px 0 → 10px 0
    - `.mgrid` row-gap·column-gap: 8px → 6px
    - `.grade-badge` font: 12px → 11.5px / padding: 4px 10px → 3px 9px
    - `.ml` font: 11.5px → 11px
    - `.specs` padding: 10px 4px → 6px 4px
    - `.sc` padding: 8px 2px → 5px 4px
    - `.sv` font: 13.5px → 13px / margin-top: 5px → 3px

20. **빌리조 카테고리 메뉴 (`.category__wrap`) 텍스트 전용 스와이프 (v0.3.9 갱신)**: 빌리조 본 사이트 `.mobile__gnb .gnb__cateogry .category__wrap`. v0.2.3에서 "2줄 토글", v0.3.7-v0.3.8에서 "pill 버튼 + 가로 스크롤"이었으나 pill이 시각적으로 무겁고 spacing 잡기 어려워 **텍스트 전용 스와이프 + 좌측 정렬 + 탭 형태 활성 표시**로 변경:
    - 컨테이너: `display:flex; flex-wrap:nowrap; overflow-x:auto; overflow-y:hidden; justify-content:flex-start; align-items:center; padding:10px 16px 12px; gap:18px; white-space:nowrap; scrollbar-width:none; text-align:left` — **좌측 정렬 명시** (`justify-content:flex-start`), 잘림 방지 padding
    - 각 항목: `flex:0 0 auto; display:inline-block; padding:2px 0; margin:0; font-size:13px; font-weight:500; color:#555; background:transparent; border:0; border-radius:0; white-space:nowrap; line-height:1.4` — **배경·테두리·라운드 모두 제거**, 순수 텍스트 링크
    - 호버: `color:#0838F8` (텍스트 색만 변경)
    - 활성(`.on`): `color:#0838F8; font-weight:800` + `::after { position:absolute; left:0; right:0; bottom:-3px; height:2px; background:#0838F8 }` — 텍스트 굵게 + 파랑 + 하단 짧은 파란 바 (탭 형태)
    - 비활성 `::after { display:none }` — 원본 빌리조 주황 밑줄 잔재 제거
    - `.gnb__cateogry::after` 우측 fade (32px) + `::before` 좌측 fade (14px) — 스크롤 가능 신호
    - **자동 스크롤 정렬 JS** (`alignCategoryScroll`): 활성이 있으면 viewport 안에 보이는지 확인, 잘리면 좌측에서 20px 위치로 minimal scroll. 활성이 없으면 `scrollLeft:0` 고정. **가운데 정렬 금지** (좌측 정렬 우선).
    - **이전 패턴 폐기**: v0.2.3의 ▼ 토글 JS, v0.3.7-3.8의 pill 버튼 배경/테두리 — 모두 제거

21. **좁은화면 헤더 패치 (inject.js 대응)**: 빌리조 본 사이트의 `cdn.jsdelivr.net/gh/billyjo-appsilon/billyjo-inject@.../inject.js`는 PC>768px에서 `header.new-header` 첫 자식으로 새 row를 만들고 `leftGroup`(로고 + `.new-gnb__wrap`)과 `rightGroup`(`.gnb__right` + `.search__wrap`) 2그룹으로 재배치한다. 이 때 rightGroup에 `display:flex; align-items:flex-end; gap:24px; flex-shrink:0; white-space:nowrap; margin-left:auto`를 **인라인으로** 박기 때문에 좁은 폭(≈1024-1280px)에서 leftGroup의 카테고리가 rightGroup 위로 흘러넘쳐 paint된다(=올라타는 현상). 모바일(≤768px)에서는 `<style>@media(max-width:768px){header:not(.bj-ready){opacity:0!important}}</style>` 보호 룰이 `.bj-ready` 부여를 inject.js 실행 시점에 의존시켜, 스크립트 지연/실패 시 헤더가 통째로 안 보인다. **다음 처리를 데모 페이지 `<style>` 블록 + 인라인 `<script>`로 강제한다**:

    **(a) JS 시밍 — inject.js 결과 DOM에 안정 클래스 부여 + 모바일 이벤트 링크 원복**:
    ```javascript
    function tagInject(){
      var header = document.querySelector('header.new-header');
      if (!header) return;
      if (!header.classList.contains('bj-ready')) header.classList.add('bj-ready');
      var firstRow = header.firstElementChild;
      if (firstRow && firstRow.tagName === 'DIV' && !firstRow.classList.contains('bj-inj-row')) {
        var inlineCss = (firstRow.getAttribute('style') || '').replace(/\s+/g,'');
        if (inlineCss.indexOf('display:flex') >= 0 && inlineCss.indexOf('padding:28px') >= 0) {
          firstRow.classList.add('bj-inj-row');
          Array.prototype.forEach.call(firstRow.children, function(c){
            var s = (c.getAttribute('style') || '').replace(/\s+/g,'');
            if (s.indexOf('margin-left:auto') >= 0) c.classList.add('bj-inj-right');
            else c.classList.add('bj-inj-left');
          });
        }
      }
      restoreMobileIcons();
    }
    // restoreMobileIcons: #bj-top-banner의 이벤트 링크를 #bj-header-icons 첫 <li>로 복원 후 banner 제거
    // 실행 트리거: DOMContentLoaded + setTimeout [50, 200, 600, 1500, 3000] + MutationObserver(5초 후 disconnect)
    ```

    **(b) CSS — inject.js 인라인 강제 무력화 (3-stage breakpoint)**:
    - `≤1280px`: `.bj-inj-row{flex-wrap:wrap!important}` + `.bj-inj-right{flex-shrink:1!important; white-space:normal!important; flex-wrap:wrap!important}` + `.bj-inj-right .gnb__right{position:static!important; top:0!important}` → rightGroup이 leftGroup 옆에서 줄어들거나 다음 줄로 떨어지게
    - `≤1024px`: `.bj-inj-row{flex-direction:column!important}` + rightGroup `width:100%; border-top:0.5px solid #eee` → rightGroup 별도 행
    - `≤768px (모바일)`: `.header__top`을 `display:flex; align-items:center; gap:0`로 재구성, `[햄버거 (margin-right:5px) · 로고 · margin-left:auto · 이벤트·검색·장바구니 아이콘]` 1행 정렬. **`.new-gnb__wrap`·`.new-gnb`·`.bj-internet-li`는 모바일에서 명시 `display:none`** (inject.js가 `.mobile__gnb`로 별도 노출하므로 PC GNB 카테고리 메뉴는 불필요. v0.3.2 신설). **`.search__wrap`(검색바)도 모바일에서 명시 `display:none`** (v0.3.7 신설) — 부모 `.top__right`가 가려도 다른 위치에 .search__wrap이 렌더될 수 있어 안전망. 검색은 아이콘 클릭 시 `.m_search_popup` 사용. `#bj-top-banner{display:none}` (이벤트 링크는 JS로 `#bj-header-icons` 첫 li로 복원). 로고 height 28px (협소 24px) + `max-width:38vw; overflow:hidden`로 광폭 로고 압축 (v0.3.6). 검색폼(`.top__right`) 숨김. **햄버거-로고 사이는 정확히 5px 여백** (gap 사용 금지 — 다른 항목과 균등 분포되므로). 우측 아이콘 그룹은 `flex:0 1 auto; margin-left:auto; gap:6px` (v0.3.6 shrink 허용). 이벤트 링크 `max-width:38vw; text-overflow:ellipsis`로 잘림.

    **(c) 모바일 헤더 가림 방지 (선택 룰의 specificity 동률 → 위치 후순 + 동일 클래스 중첩으로 역전)**:
    ```css
    header.new-header.new-header{ opacity:1 !important; visibility:visible !important }
    @media (max-width:768px){
      header.new-header.new-header,
      header.new-header.new-header:not(.bj-ready){ opacity:1 !important; visibility:visible !important }
    }
    ```

    **(d) 공통**: `.hamburger__btn` 숨김 (좌측 상단 햄버거는 `.gnb__hamburger`만 유지 — `.mobile__aside` 사이드 메뉴 JS와 연동). 제품 다중 이미지 썸네일(`.prod_thumbs li a`)에 `border:1px solid #dfdfdf` 추가.

    **(e) 헤더 패치는 반드시 모듈 A(전역)에 둔다 (v0.7.x 신설)**: PC/모바일 헤더 리디자인 자체는 모듈 A의 `DOMContentLoaded` 핸들러에서 전 페이지 실행되는데, 이를 보호하는 CSS·DOM 태깅이 모듈 B(`prod_view` 전용)에만 있으면 **비-상세 페이지(홈·목록)에서 보호가 빠져 회귀**한다. 두 가지 전역화 필수:
    - **PC `.bj-inj-*` 클래스 태깅 + 좁은 폭 보호 CSS를 모듈 A에서 직접 부여**: dRow/leftGroup/rightGroup 생성 시 `bj-inj-row`/`bj-inj-left`/`bj-inj-right` 클래스를 바로 붙이고, `≤1500px` flex-wrap(실제 넘칠 때만 동작 → 넓은 화면 무영향) + `≤1024px` rightGroup 별도 행 분리 CSS를 모듈 A에 둔다. 안 그러면 비-상세 PC에서 rightGroup(고객센터·장바구니)이 카테고리 위로 침범. (모듈 B tagInject의 `if(!...contains('bj-inj-row'))` 가드 덕분에 prod_view에서 중복 부여 무해.)
    - **모바일 헤더는 `[햄버거][로고]` 좌측 그룹**: 로고를 absolute 중앙정렬하지 말고 **`.header__top` 안 햄버거 바로 오른쪽에 in-flow 좌측정렬**. 일부 페이지는 `.header__top`의 로고 슬롯이 비어 있으므로(`<!-- 로고 -->` 주석만), JS로 `header` 내 `a.logo`를 찾아 햄버거 다음으로 이동(없으면 no-op). **로고는 반드시 `position:relative`(static 금지)** — 절대 규칙 #30 cross-fade 오버레이 anchor 보존 위해. 우측 아이콘(`#bj-header-icons`)은 `margin-left:auto`로 우측 유지.

22. **Hero 재배치 (Option C, v0.2.7)**: 절대 규칙 #1의 "7개 슬롯 구조"는 유지하되, **SLOT 1 메타 + SLOT 2 게이지+4지표는 `.prod_view_top.right`(이미지+가격 hero 영역)로 이전 가능**. 페이지에서 제품명·모델명이 `.prod_view_top.right`에 이미 있어 SLOT 1과 중복되고, 평가 결과(게이지)를 첫 화면에 노출해 의사결정을 가속하기 위함.

    **이전 대상**:
    - `.head .meta` (모델명: EWBD351 · 데스크형 · 냉·온·정수 3종 · 230×517×510mm 같은 한 줄 메타) → `.prod_view_top.right .prod_name` 안에 `.bj-hero-meta` div로 추가
    - `.summary` (270° SVG 게이지 + 4지표 .mgrid) → `.prod_view_top.right`에 `.bj-hero-summary` 래퍼로 이동

    **AI 카드 본체에서 처리**:
    - `#ai-card-root .head { display:none }` (제품명 중복 방지)
    - `#ai-card-root > .card > .summary { display:none }` (이동된 원본 숨김)
    - `#ai-card-root .ai-card-tag { display:none }` (hero에 이미 제품 정체성이 표시되므로 분석 배지 중복)
    - SLOT 3 `.specs`가 첫 보이는 요소가 됨 → `.card { padding-top:18px }` + `.specs:first-child { border-top:1px solid #f0f0f0; padding-top:14px }` 연결

    **레이아웃 안전화** — 빌리조 본 사이트 `.prod_view_top`은 float 기반 2-컬럼. `.right`에 hero summary 추가로 컬럼 높이 증가 → float 컨테이너가 enclose 못해 AI 카드와 겹침. **`.prod_view_top { display:flex; flex-wrap:wrap; align-items:flex-start; gap:24px }` + `.left/.right { flex:1 1 360px; float:none; min-width:280px }`** 로 변환 필수. 1023px↓는 `flex-direction:column` 으로 stack.

    **CSS 변수 스코프 복원** — SVG 게이지가 `var(--g-2)`, `var(--color-border-tertiary)` 등 `#ai-card-root` 스코프 안에서 정의된 변수를 사용하므로, hero로 이동 시 **`.prod_view_top .right`에 동일 변수 세트(`--color-text-info`, `--g-1`~`--g-4`, `--g-d`, `--color-border-tertiary` 등) 재정의 필수**. 변수 누락 시 게이지 stroke·등급 letter 색이 사라져 "텍스트만" 렌더되는 버그.

    **시각 융합** — `.prod_view_top`은 `border-bottom:0; border-bottom-radius:0`, `#ai-card-root .card`는 `border-top:0; border-top-radius:0; margin-top:0`. 두 박스 사이 dashed border 사용 금지 — 절단선 인상 부작용. `.specs:first-child` 위 1px solid #f0f0f0 연한 실선으로 자연 분할.

    **`.prod_view_bot.card.mt40` (렌탈사 비교/렌탈 신청 위젯)** — 데모 명확화용 임시 숨김은 **본 운영 페이지에서 제거**. inject.js가 그 안에 `.bb-inner` 위젯(공급자 탭·개월 pill·장바구니/렌탈신청 버튼)을 동적 렌더하므로 위치·DOM 유지 필수.

23. **SLOT 5·6 폰트 스케일 +35% (v0.2.7 Step, v0.3.1 페르소나)**: SLOT 6 Step 1-3 영역과 SLOT 5 페르소나 카드 모두 기존 폰트가 제품 정보 가독성이 부족 → 본문 폰트 14px 기준으로 일관 확대.

    **SLOT 6 Step 1-3 (v0.2.7)** — `.step-n` 18px 원/10.5px → 26px/14.5px · `.step-title` 12.5px → 16px · `.step-sum` 11.5px → 14px · `.step-details summary` 13px · `.grade-badge` 13px · `.pills .pill` 12.5px · `.field-l` 13px.

    **SLOT 5 페르소나 (v0.3.1)** — `.p` padding 11px 12px → 14px 15px · `.p-top i` 18px → 22px · `.rec-p-level-1/2/3` 10.5px → 12.5px (padding 4px 10px) · `.rec-p-title` 12px → 15.5px Bold · `.p-d` 11px → 13.5px · `.feat-btn` 10.5px → 12px (padding 4px 9px) · `.sec-t` 15px Bold.

    **공통 CSS 패턴**:
    ```css
    #ai-card-root .step-h { font-size:16px; gap:12px; margin:18px 0 8px }
    #ai-card-root .step-n { width:26px; height:26px; font-size:14.5px; font-weight:700 }
    #ai-card-root .step-title { font-size:16px; font-weight:700 }
    #ai-card-root .step-sum { font-size:14px; line-height:1.65; padding-left:34px; margin:6px 0 10px }
    #ai-card-root .step-details { padding-left:34px }
    #ai-card-root .step-details summary { font-size:13px; margin:4px 0 10px }
    #ai-card-root .grade-badge { font-size:13px; padding:5px 11px }
    #ai-card-root .pills .pill { font-size:12.5px; padding:4px 11px }
    #ai-card-root .field-l { font-size:13px; font-weight:600; margin-bottom:4px }

    @media (max-width:600px) {
      #ai-card-root .step-h { font-size:15px }
      #ai-card-root .step-n { width:24px; height:24px; font-size:13.5px }
      #ai-card-root .step-title { font-size:15px }
      #ai-card-root .step-sum { padding-left:28px; font-size:13.5px }
      #ai-card-root .step-details { padding-left:28px }
    }
    ```

    **선정 근거**: 소폭(+20%)은 변화 미미해서 가독성 개선 부족, 강조(+55%)는 카드 높이 +18%로 SLOT 6이 화면을 너무 점유. 중폭(+35%)이 본문 폰트(14px) 수준의 자연스러운 읽기 크기와 시각 위계(번호 원 26px) 균형점.

24. **카테고리 선택형 스펙 비교표 (2단계 토글, v0.2.9)**: SLOT 6 Step 1-3의 `.step-details` 내부 스펙 중 **1-of-N 카테고리 선택형**(예: 필터 종류, 살균 방식, 컴프레서, 매트리스 구조)은 단순 pill 그룹 대신 **2단계 progressive disclosure 비교표 패턴** 적용:

    **마크업 구조**:
    ```html
    <div class="field spec-compare">
      <div class="spec-row">
        <span class="spec-label">필터 종류</span>
        <span class="spec-value">UF 중공사막</span>
        <details class="spec-detail-toggle">
          <summary>다른 필터와 비교</summary>
          <p class="spec-desc">정수 성능은 필터 방식에 따라 차이가 큽니다. RO·중공사막·나노필터 3가지 비교.</p>
          <div class="filter-table-wrap">
            <table class="filter-table">
              <thead>
                <tr>
                  <th class="ft-empty"></th>
                  <th class="ft-off">역삼투압(RO)</th>
                  <th class="ft-on">중공사막<small>이 제품</small></th>
                  <th class="ft-off">나노필터</th>
                </tr>
              </thead>
              <tbody>
                <tr><th>정수 속도</th><td class="ft-off">느림</td><td class="ft-on">빠름</td><td class="ft-off">빠름</td></tr>
                <tr><th>미네랄</th><td class="ft-off">미통과</td><td class="ft-on">통과</td><td class="ft-off">통과</td></tr>
                <tr><th>제거 효율</th><td class="ft-off">가장 좋음</td><td class="ft-on">좋음</td><td class="ft-off">매우 좋음</td></tr>
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </div>
    ```

    **표시 흐름 (2단계)**:
    1. 사용자가 Step "자세히 보기"(`<details class="step-details">`) 클릭 → 카테고리 스펙은 **라벨 형태로 노출** (`필터 종류: UF 중공사막` + `[다른 필터와 비교 ▾]` pill 버튼)
    2. "다른 필터와 비교" pill 클릭 → 비교표 풀폭 전개 + 정수속도·미네랄·제거효율 3개 비교축 + 선택된 컬럼 브랜드 파랑 강조

    **컬럼 규칙**:
    - **3-4 컬럼** 표준 (1-of-N 옵션 모두 노출), 4 컬럼은 "평가없음" 케이스 등 특수 상황에 한해 허용
    - **선택 컬럼 강조**: 헤더 `--color-text-info` 파랑 채움 + 흰 글씨 + `<small>이 제품</small>` 보조 라벨, 셀은 `--color-background-info` 연한 파란 배경 + 파란 Bold
    - **비선택 컬럼**: 회색 배경(`--color-background-secondary`) + 회색 텍스트(`--color-text-tertiary`) — 정보는 노출하되 시각적 후순위
    - **평가없음 (`.ft-na`)**: 회색 채움(#999) 헤더, 회색 텍스트 + 이탤릭 셀. 절대 파란 강조 사용 금지(부정적 연관)

    **행 규칙**:
    - **3개 비교축** 표준 (카테고리별 가장 중요한 3가지 차이). 4개 이상 시 모바일 가독성 떨어짐.
    - 행 라벨(`tbody th`)은 회색 배경 + 회색 텍스트 600 weight
    - 비교 데이터는 **수치 직접 비교 회피** — "빠름/느림", "강함/보통/약함" 같은 정성 비교가 카드 단순화에 유리. 정확한 수치가 필요하면 `.spec-desc` 본문에 명시.

    **sub-toggle 스타일**:
    - 작고 둥근 pill(`border-radius:999px`) + 1px 파란 테두리 + 흰 배경
    - 호버·열림 시 `--color-background-info` 연한 파란 배경
    - `▾`/`▴` 아이콘으로 상태 표시 (회전 0.15s transition)
    - 모바일에서도 충분히 누를 만한 hit area (padding 5px 12px / 모바일 4px 10px)

    **적용 후보 (패밀리별)**:
    - **F01 정수**: 필터 종류 ✅, 살균 방식 (평가없음 케이스 포함) ✅, 출수 방식 (직수/저수조)
    - **F02 비데**: 세정 방식 (단일/이중/3중 노즐), 노즐 위생 방식
    - **F03 공조**: HEPA 등급 (E12/H13/H14), 인버터 방식 (정속/인버터/하이브리드)
    - **F05 냉장**: 컴프레서 방식 (정속/인버터/리니어 인버터), 도어 형태
    - **F06 세탁**: 모터 방식 (벨트/DD/BLDC), 건조 방식 (콘덴서/히트펌프)
    - **F11 가구**: 매트리스 구조 (포켓스프링/메모리폼/하이브리드)

    **비적용 (pill 유지)**:
    - **다중 선택**: 출수 기능(냉수/온수/정수/얼음 3종 이상 선택), 위생 기능(분리세척 코크/무빙코크 등 다중 보유)
    - **수치형**: 필터 개수(1개/2개/3개/4개+), 단계 수
    - **단일 옵션 제품유형**: 데스크형/스탠드형 같은 형태 분류는 pill 유지 (SLOT 4 기본정보의 pill과 일관성)

    **모바일 (≤600px)**: 비교표 `min-width:280px` + `overflow-x:auto` + `-webkit-overflow-scrolling:touch`로 가로 스크롤 허용. spec-label 12.5px · spec-value 13.5px · sub-toggle 11px · 표 셀 11px · 헤더 10.5px · "이 제품" 소라벨 8.5px. `.step-details` 모바일 padding-left 14px로 축소 + `.spec-detail-toggle[open]` 좌우 -6px margin으로 표 가용 폭 확보. 극협소(≤360px iPhone SE)에선 `min-width:260px; font-size:10.5px`로 더 축소.

    **flexbox overflow 안전 (v0.3.3 신설)** — `.spec-row`(flex container) + `.spec-detail-toggle[open]`(flex item) + `.filter-table-wrap` 3단 모두 **`min-width:0; max-width:100%; box-sizing:border-box`** 명시 필수. flex item의 default `min-width:auto`가 자식(table)의 min-content를 부모 폭 위로 강제 확장시켜 모바일에서 표가 viewport 밖으로 삐져나가는 버그 방지. `.filter-table { min-width:380px }`는 표 자체 최소 폭이고, `.filter-table-wrap`의 `overflow-x:auto`가 부모 폭 초과분을 가로 스크롤로 처리.

    **선정 근거**: 1단계 토글(Step → 즉시 비교표)은 일반 사용자에게 정보 과잉. 2단계는 라벨로 빠른 스캔 + 비교 의도자만 명시적 클릭 후 표 노출 → 모든 사용자 만족 + 카드 길이 부풀림 방지. 사용자 피드백: "이렇게 표로 보여주면 좋겠다" + "자세히 보기 버튼을 눌러야 다른 필터와 비교하는 테이블이 나오게" → 2단계 패턴 채택.

25. **하단 fixed 위젯 (`.bb-inner` 개선, v0.3.1)**: 빌리조 본 사이트 `inject.js`가 `.prod_view_bot.card.mt40` 컨테이너 안에 렌더하는 `.bb-inner` 위젯(공급자 탭 · 개월 pill · 가격 · 장바구니/렌탈신청 버튼)을 **fixed bottom 폴딩 위젯**으로 격상. 기본 동작(스크롤 방향에 따라 불쑥 나타나는 인-플로우 노출)이 부자연스럽다는 피드백에 대응.

    **트리거·게스처 (v0.5.2 표준화 — 모든 제품)**:
    - **노출 트리거**: `#ai-card-root.getBoundingClientRect().bottom < 0` — AI 카드가 viewport 위로 완전히 빠져나간 시점. "사용자가 카드를 끝까지 다 봄"의 명확한 신호. "스크롤 업 시 나타남" 패턴 폐기.
    - **Sticky 유지**: 한 번 노출되면 스크롤 백업해도 자동 hide 안 함. 사용자가 명시적으로 닫을 때만 사라짐.
    - **드래그 게스처** (`.bj-bar-handle` 영역):
      - 위로 드래그 ≥30px → 펼침(`bj-bar-expanded`)
      - 아래로 드래그 ≥30px → 접기(`bj-bar-collapsed`)
      - 아래로 ≥120px → 완전 dismiss (`bj-bar-slide-hidden` + sessionStorage 기록)
      - 작은 movement <10px → 탭 토글 (펼침/접힘)
      - 드래그 중 시각 피드백: `transform:translateY(dy)`로 손가락 따라옴, transition 일시 비활성화
    - **핸들 grip 강화**: 48×5px 회색 막대, 접힘 상태 펄스 애니메이션(2.5s loop), hover/active 시 브랜드 파랑
    - **X 닫기 버튼**: 우측 상단, 영구 dismiss (sessionStorage)
    - 폐기: 10914 한정 게이트(`IS_TEST_PROD`), 외부 탭 토글 (드래그 게스처로 대체)

    **레이아웃 (v0.3.2 — specificity 강화 + JS inline fallback)**:
    - `position:fixed; bottom:0; left:0; right:0; z-index:99999` — viewport 하단에 진짜 고정. `position:sticky`는 `.wide-inner` 컨테이닝 블록 안에서만 동작해 페이지 끝쪽 위젯은 sticky 효과가 거의 안 나타나는 문제 발견 (v0.3.0→v0.3.1에서 fixed로 정정)
    - **CSS specificity 강화 (v0.3.2)**: `body #container .wide-inner > .prod_view_bot.card.mt40, .prod_view_bot.card.mt40` 더블 selector로 v0.2.4의 (0,1,4,0) 룰을 cascade 후순 + 동급 specificity로 override
    - **JS inline 강제 (v0.3.2)**: `wrapper.style.cssText += ';position:fixed!important;bottom:0!important;left:0!important;right:0!important;z-index:99999!important;margin:0!important'` — CSS 충돌·로드 지연·외부 룰 override 모두 안전망. DOMContentLoaded 이전에도 `preEnhance()` 즉시 실행
    - 와이드 PC(≥1500px)에서 `left:50%; transform:translateX(-50%); max-width:1500px`로 중앙 정렬, 그 외엔 풀폭
    - border-radius:14px 14px 0 0 + box-shadow:0 -8px 24px rgba(0,0,0,0.08) — 위쪽 그림자로 떠 있는 인상
    - `max-height` transition (0.32s cubic-bezier) 으로 펼침↔접힘 부드럽게
    - 펼침: `max-height:520px` + 내부 `.bb-inner { overflow-y:auto; max-height:calc(520px - 64px) }` 로 콘텐츠 길면 위젯 내부 스크롤. 접힘: `max-height:64px` (모바일 58px) — 핸들만 노출, `.bb-left`·`.bb-right-bottom` 등은 `display:none`
    - body에 `padding-bottom:88px` (모바일 80px)로 fixed 위젯이 마지막 콘텐츠 가리지 않게
    - **JS는 `.bb-inner` 부재 시에도 동작** (v0.3.2): 핸들 fallback으로 `.prod_name b` (제품명) + `.top_min_price b` (가격) 페이지 내 다른 위치에서 텍스트 추출. 렌탈+사은품/상담신청 버튼은 `.bb-inner` 존재 시만 추가
    - **v0.4.0 fallback 콘텐츠 박스**: `.bb-inner`가 아예 없는 경우 (inject.js 미실행/지연 또는 정적 페이지) 위젯이 비어 보이지 않게 `.bj-bar-fallback` 박스를 직접 생성. 구조: `[월 렌탈료 라벨 + 가격] [장바구니][🎁 렌탈+사은품 신청][💬 상담신청]`. 클릭 시 `window.shoporder('cart'|'rent')` 함수 있으면 호출, 없으면 `/html/dh_order/shop_cart` · `/html/dh/counsel`로 fallback. 사용자가 위젯이 비어 보이는 일 절대 없게 보장.

    **핸들 (탭 영역)** — 컨테이너 최상단에 JS로 삽입:
    ```html
    <div class="bj-bar-handle" role="button" tabindex="0" aria-label="렌탈 신청 영역 펼치기/접기">
      <div class="bj-bar-handle-text">
        <span>{제품명}</span>
        <span class="bj-bar-handle-price">{대표 가격}</span>
      </div>
      <button class="bj-bar-handle-toggle" aria-label="펼치기/접기">
        <span class="bj-bar-chevron">▾</span>
      </button>
    </div>
    ```
    - 상단에 grip indicator (회색 가로 막대, `::before` 가상 요소) — 모바일 시트 위젯 패턴
    - 핸들 전체가 클릭/탭 영역 (role="button", tabindex=0, Enter/Space 키보드 지원)
    - 우측 토글 버튼은 별도 클릭도 가능 (사이즈 36×24)
    - `▾` chevron: 펼침 시 0deg, 접힘 시 180deg 회전 (transition 0.25s)

    **버튼 3종 (`.bb-right-top` 안)** — JS로 후처리:
    | 버튼 | 클래스 | 아이콘 | 스타일 |
    |---|---|---|---|
    | 장바구니 | `.bb-btn-cart` (기존) | (없음) | 기본 |
    | **렌탈+사은품 신청** | `.bb-btn-rent.bj-btn-rent-gift` | 🎁 선물박스 SVG (Material `card_giftcard`) | 브랜드 파랑 채움, 흰 텍스트, 주 액션 |
    | **상담신청** (신규) | `.bb-btn.bj-btn-consult` | 💬 메시지 말풍선 SVG | 흰 배경 + 파란 1px 테두리 아웃라인, 보조 액션 |

    **금지 사항**:
    - "렌탈 신청" 단독 텍스트 사용 금지 → **"렌탈+사은품 신청"** 으로 고정 (사은품 노출 강조)
    - 전화기 아이콘 사용 금지 → 선물박스 아이콘 사용 (실제 액션은 폼/모달이지 전화가 아님)
    - 위젯 자동 슬라이드 인/아웃 애니메이션 금지 — sticky 정적 노출 + 사용자 토글로 제어

    **JS 시밍** — inject.js가 `.bb-inner`를 늦게 렌더하므로 후처리:
    ```javascript
    function enhanceBottomBar(){
      var wrapper = document.querySelector('.prod_view_bot.card.mt40');
      var bbInner = wrapper ? wrapper.querySelector('.bb-inner') : null;
      if (!wrapper || !bbInner || wrapper.dataset.bjBarEnhanced) return;
      wrapper.classList.add('bj-bar-expanded');
      // ① 핸들 삽입 (제품명·가격·토글) ② 렌탈 버튼 라벨/아이콘 교체 ③ 상담신청 버튼 추가
      // ...
      wrapper.dataset.bjBarEnhanced = '1';
    }
    // 트리거: DOMContentLoaded + setTimeout [100, 400, 1200, 3000] + MutationObserver (6초 후 disconnect)
    ```

    **모바일 (≤600px)**:
    - 핸들 padding 14px 14px 8px (그립 막대 영역 확보)
    - 제품명 12px / 가격 13px / 토글 버튼 34×22
    - `.bb-inner` 내부 padding 12px 14px
    - 접힘 max-height 58px
    - 버튼 폰트 12.5~13px

    **접근성**: `role="button"` + `tabindex="0"` + Enter/Space 키보드 지원 + aria-label. chevron은 `aria-hidden`. 본문 가림 방지를 위한 body padding은 위젯 펼침 max-height와 무관하게 80px 고정 (펼침 시에도 본문 끝이 위젯 위로 잘 보이도록 사용자가 스크롤).

27. **SLOT 6·8 카드 내부 의무화 (v0.5.1 신설)**: 모든 SLOT(특히 SLOT 6 Step 1·2·3 + SLOT 8 LPT)은 **반드시 `#ai-card-root` 내부**에 렌더링되어야 한다. 카드 외부 누출 금지 사항:

    **(A) SLOT 6 누출 방지** — daily-sync.js 생성 카드 + 수동 작성 모두 적용:
    - 각 Step은 `<!-- step-N-start --> ... <!-- step-N-end -->` 앵커 주석으로 감싸기 (N=1,2,3)
    - 정규식 교체 시 `[\\s\\S]*?</details>` 비-탐욕 anchor 금지 (내부 `<details class="help">`·`<details class="spec-detail-toggle">`에서 끊김). 반드시 `<!-- step-N-end -->` 앵커로 종료
    - `<details class="step-details">` 안에 `<summary>` 다음으로 `<div class="field">`만 둘 것. 추가 `<details>` 중첩 시 anchor 주석 반드시 사용
    - 신규 카드 작성·기존 카드 fix 모두 `scripts/template-base.html`을 표준 골격으로 사용

    **(B) SLOT 8 약정·카드 할인가 — 카드 내부 항상 노출 (v0.5.39~v0.5.41 갱신)**:
    - 카드 할인 유무에 **관계없이** 항상 SLOT 8 (`#ai-card-lpt-section`) 노출
    - 카드 할인 있음(`monthly !== finalPrice`): 3컬럼 표 (약정기간 / 월 렌탈료 / 카드 할인가 + 절감액 -원 마크)
    - 카드 할인 없음: 2컬럼 표 (약정기간 / 월 렌탈료)
    - **표 위 제품 정보 헤더 `#lptTitle` 항상 노출** (v0.5.39): 1행 제품명(15px Bold 흰 글씨, 'LG구독 -' 같은 brand prefix 제거), 2행 모델명·관리주기(12px opacity:0.85). 파란 #0838f8 배경.
    - **lptTitle과 표 단일 outer wrapper로 통합** (v0.5.41): 별도 div 2개 두면 border 차이로 1-2px width 어긋남 → outer가 border + radius + overflow:hidden 단일 관리, title/표는 같은 가로 폭 보장.
    - **본문 LPT 광범위 hide** (v0.5.40): `hideDuplicateBodyLpt()` 3단계 selector — (1) `#livePriceTable` + 부모 wrapper (2) thead text 매칭 `약정 + (월 렌탈료|카드 할인가|할인가)` (3) h2/h3/h4/.sec-t에 '약정·카드 할인가' 헤더 갖는 section. **AI 카드(`#ai-card-root`)·하단 위젯(`.prod_view_bot.card.mt40`)·hero(`.prod_view_top`) 외부에 한정** (protected 영역). `mountLptIntoCard` + `runAll` 매 cycle 호출 — 빌리조 본문 재렌더에도 안정.
    - inject.js `mountLptIntoCard()`가 `populateLptFromMonthBoxes` 마지막에 자동 호출

    **(C) 일괄 fix 도구**: 기존 카드의 누출 구조는 `scripts/fix-cards.js` 일회성 실행으로 anchor-comment 구조 + SLOT 8 placeholder 일괄 주입. v0.5.0 이전 카드는 모두 이 도구로 갱신 완료(2026-05-26 fix-cards 3,222개).

29. **빌리조 floating 버튼 위치 자동 조정 (v0.5.42 신설)**: 빌리조 본 페이지의 fixed-position floating 버튼들(`.new-qb` quick-call + `.goTop` 맨 위로)이 우리 하단 위젯(`.prod_view_bot.card.mt40`)과 시각적으로 겹치지 않도록 **CSS `:has()` 선택자만으로 wrapper 상태에 따라 bottom 자동 조정** (JS·MutationObserver 불필요):

    ```css
    /* 기본 (위젯 collapsed) — 핸들 위로 */
    .new-qb, .goTop {
      bottom: 60px !important;  /* collapsed 48px + 12px 여백 */
      transition: bottom 0.32s cubic-bezier(0.4, 0, 0.2, 1) !important;
    }
    /* 위젯 펼침 — 펼친 위젯 위로 */
    body:has(.prod_view_bot.card.mt40.bj-bar-expanded) .new-qb,
    body:has(.prod_view_bot.card.mt40.bj-bar-expanded) .goTop {
      bottom: calc(min(440px, 75vh) + 12px) !important;
    }
    /* 위젯 dismiss (사용자 드래그 ≥120px) — 원래 위치 복귀 */
    body:has(.prod_view_bot.card.mt40.bj-bar-slide-hidden) .new-qb,
    body:has(.prod_view_bot.card.mt40.bj-bar-slide-hidden) .goTop {
      bottom: 12px !important;
    }
    @media (max-width:600px) {
      .new-qb, .goTop { bottom: 56px !important }  /* 모바일 44px + 12px */
    }
    ```

    `transition: bottom 0.32s`는 위젯 max-height transition과 같은 timing으로 동기 부드러운 이동. 토글 시점에 두 요소가 함께 움직여 자연스러운 UX. 신규 빌리조 floating 요소 추가 시 이 selector 리스트에 동일 패턴으로 등록 (절대 규칙 #25 하단 위젯과 짝).

30. **빌리조 로고 표기 — 한글·영문 cross-fade 패턴 (2026-05-30 신설)**: 빌리조 브랜드 로고는 **한글 로고(`빌리조`)** + **영문 로고(`billyjo`)** 두 가지가 공식 자산. UI에 노출할 때 **둘 중 하나만 정적 표시하지 말고, 2초마다 cross-fade로 번갈아 표시**한다 (브랜드 아이덴티티 양쪽 자연 강조).

    **자산 파일** (admin2_frontend public 기준 / inject.js에서도 동일 패턴):
    - `빌리조로고_투명.png` (ko) / `빌리조영문로고_투명.png` (en)

    **CSS 패턴 (admin2 적용 그대로 — inject.js 신규 brand 영역 추가 시 재사용)**:
    ```css
    .bj-logo-swap-stack { position:relative; display:inline-block; width:max-content }
    .bj-logo-img { display:block; width:auto; object-fit:contain }
    .bj-logo-ko { position:relative; animation:bjLogoKo 4s infinite ease-in-out }
    .bj-logo-en { position:absolute; inset:0; animation:bjLogoEn 4s infinite ease-in-out }
    @keyframes bjLogoKo { 0%,45%{opacity:1} 55%,95%{opacity:0} 100%{opacity:1} }
    @keyframes bjLogoEn { 0%,45%{opacity:0} 55%,95%{opacity:1} 100%{opacity:0} }
    @media (prefers-reduced-motion: reduce) {
      .bj-logo-ko { animation:none; opacity:1 } .bj-logo-en { animation:none; opacity:0 }
    }
    ```
    - 4초 cycle = ko 1.5s 표시 + 0.5s fade + en 1.5s 표시 + 0.5s fade
    - **prefers-reduced-motion 사용자**는 한글 정적 표시 (접근성 필수)
    - 두 이미지 절대 위치로 겹쳐 stacking (CLS 방지)
    - 박스 너비는 `width: max-content`로 두 이미지 중 넓은 쪽 자동 fit

    **inject.js 적용 surface (v0.6.9 갱신 — 빌리조 본 사이트)**: 본 사이트 로고는 원본 rentalshop 자산(`rentalshop.site/_data/.../8237a1...png`)을 쓰지만, 우리는 그 위에 **admin2 호스팅 자산(`admin2.billyjo.co.kr/logo/billyjo-ko.png`·`billyjo-en.png`)으로 교체 + 2초 cross-fade**를 입힌다. CSS keyframes(admin2) 대신 inject.js는 **JS setInterval(2000ms) + opacity 토글** 방식 — 원본 img를 ko로 교체하고 en clone을 `position:absolute; width/height:100%; object-fit:contain`으로 같은 자리에 겹쳐 idempotent하게 토글:
    - **헤더 로고(`.logo > img`, `header .logo img`)** — 모듈 B(`alternateBillyjoLogo`, prod_view 전용)에서 적용. dataset `bjLogoAlt`·class `bj-logo-alt-ko/en`·`window.__bjLogoAltInterval` 가드.
    - **모바일 사이드(aside) 슬라이드 메뉴 로고(`.aside__top .top__logo img`)** — 모듈 A(전역, `billyjoAsideLogo`)에서 적용. aside 메뉴는 전 페이지 공통이라 prod_view 전용 모듈 B에 둘 수 없음 → 별도 IIFE. dataset `bjAsideLogoAlt`·class `bj-aside-logo-ko/en`·`window.__bjAsideLogoInterval` 가드. 스킨 지연 렌더 대비 `setupAsideLogo()` 400ms×15 재시도. **모바일 크기 축소 필수** — `@media(max-width:768px){ .aside__top .top__logo{ display:inline-block; position:relative } .aside__top .top__logo img{ width:92px } }` (기존 풀폭 대비 대폭 축소, en overlay가 ko 크기에 정확히 겹치도록 부모 inline-block+relative).
    - **이전 금지 규칙 폐기 사유**: v0.5.43 시점 "본 사이트 헤더 로고는 본사 자산이라 swap 금지"였으나, 한글/영문 공식 자산을 우리가 admin2에 호스팅·교체하므로 본사 자산 훼손 아님 → 헤더·aside 양쪽 적용으로 확대. 신규 brand 영역(`.bj-bar-handle` 등) 추가 시 동일 패턴 재사용.

    **⚠️ positioning context 보존 (v0.7.x 신설 — 회귀 1건 발생)**: JS setInterval 방식 cross-fade는 EN clone을 `position:absolute`로 겹치고, anchor 기준이 되도록 `parent.style.position='relative'`를 **인라인(비-important)** 으로 박는다. 그러므로 cross-fade가 적용된 요소(`a.logo` 등)를 CSS로 재스타일할 때 **절대 `position:static !important`를 주지 말 것** — 인라인 relative를 override해 anchor가 풀리면 EN 오버레이가 상위 positioned 조상(`.header__top` 등) 기준 `top:0;left:0;100%×100%`로 퍼져 **엉뚱한 위치(예: 햄버거 위)에 영문 로고가 뜬다**. 좌측정렬 등 레이아웃이 필요하면 `position:relative`(in-flow 유지 + anchor 보존)를 쓴다.

28. **상단 카테고리바 + 신혼부부 패키지 (v0.5.1)**: 사이트 전역 promotion 항목(예: 신혼부부 패키지)은 **플로팅 fab 금지**, **`.category__wrap` 상단 카테고리바 첫 항목으로 삽입**.
    - 클래스: `.bj-newlywed-cat` (다른 promotion도 `.bj-{name}-cat` 패턴)
    - 스타일: 다른 카테고리 항목과 동일 폰트/높이, 단 브랜드 파랑(`#0838F8`) + Bold(700)로 강조
    - 클릭 시 modal open (`window.bjOpenNewlywedModal()` 또는 동적 로드)
    - 카테고리바 위 여백 `padding-top` 압축 (10px → 4px)으로 빈 공간 최소화
    - 햄버거 아이콘 `.gnb__hamburger`는 3줄 보장 (CSS `::before` + `box-shadow` 3줄 stack으로 빌리조 기본 2줄 아이콘 덮어쓰기)

26. **ⓘ 도움말 툴팁 (`.help-pop`) 전역 사양 (v0.5.0 신설)**: 카드 어디든 — 룰 #14 스펙 그리드, rental-terms, hero, 본문 그 어디서든 — `<details class="help">` + `.help-pop` 패턴으로 만든 추가 설명문은 다음 두 가지를 **반드시** 보장한다:

    **(A) 어떤 viewport에서도 화면 밖으로 나가지 않을 것**
    - 데스크탑(≥901px): `position:absolute`이라도 `max-width:min(280px, calc(100vw - 24px)) !important` + `box-sizing:border-box` 필수
    - **좁은 화면(≤900px, 모바일+태블릿+landscape 포함)**: 무조건 `position:fixed; left:12px; right:12px; bottom:96px; transform:none; width:auto; max-width:none` viewport bottom-sheet로 전환 (이전 v0.3.5의 `≤600px` 한정 → v0.5.0에서 ≤900px로 확대 — 601~900px 좁은 태블릿/landscape에서 새던 버그 해결)
    - selector는 `#ai-card-root` 스코프에 한정하지 말 것 — **`.help-pop` 글로벌 selector 필수** (다른 위치/스코프 외부 인스턴스도 동일 룰 적용)

    **(B) 닫힘 트리거 4종 모두 지원**
    1. ⓘ summary 다시 클릭 (네이티브 details 토글)
    2. **화면의 아무 영역 클릭/탭** — `document.addEventListener('click', ..., true)` + `'touchstart'` capture phase 동시 등록, `details.help[open]` 글로벌 selector로 외부 클릭 시 모두 닫힘
    3. 다른 `.help`가 열릴 때 — 기존 열린 것 자동 닫힘 (1개만 열림 보장)
    4. **ESC 키** — 접근성, 키보드 사용자 대응

    setupHelpClose()는 `#ai-card-root` 스코프 한정 금지. 모든 `details.help`를 글로벌로 다뤄야 rental-terms·hero 등 어디서든 동작한다. inject.js v0.5.0+ 이후 표준 패턴이며 신규 ⓘ 추가 시 별도 JS 작업 불필요(이벤트 위임 구조).

    **모바일 sheet에는 닫기 안내 ::after 필수**: `content:"화면 아무 곳을 눌러도 닫혀요"` — 사용자가 닫는 방법을 모르는 일 방지.

    **(C) rental-terms 약정·의무 사용 기간은 한 박스로 통합 (v0.5.38 신설)**: 동일 행에 인접한 두 개념은 각각 ⓘ를 만들지 말고 **개념적으로 상위인 라벨(이 경우 "약정 기간")에 통합 박스 하나만** 부착. 통합 박스는 두 개념을 `<br><br>`로 분리해 같이 노출 (`<strong>약정 기간</strong>...<br><br><strong>의무 사용 기간</strong>...`). 분리된 두 ⓘ는 (1) 정보 단편화 (2) 두 박스가 거의 같은 위치에 떠 사용자가 어느 것을 봤는지 혼동 (3) 화면 가림 중복 → 통합이 일관 UX. `addRentalTermsHelp()`는 '약정 기간' 라벨에만 details.help 주입, '의무 사용 기간' 라벨은 dataset만 마킹 후 skip.

31. **주입 오버레이(모달·팝업) box-sizing 의무 (v0.7.x 신설)**: inject.js가 만드는 모든 모달·팝업(상담신청 `#bj-consult-modal`, 향후 신규 오버레이 포함)은 **자식 전체 + 컨테이너에 `box-sizing: border-box`** 를 스코프로 강제하고, 스크롤 컨테이너에는 **`overflow-x: hidden`** 을 둔다.
    ```css
    #bj-consult-modal *, #bj-consult-modal *::before, #bj-consult-modal *::after { box-sizing: border-box }
    #bj-consult-modal .bj-card { overflow-y: auto; overflow-x: hidden; box-sizing: border-box }
    ```
    - **이유**: `width:100%`(버튼) 또는 `flex:1`(stat 칸) 자식에 `padding`·`border`가 box-sizing 없이 더해지면 카드 폭을 초과 → 카드의 `overflow-y:auto`가 CSS 규칙상 `overflow-x`도 `auto`로 계산해 **가로 스크롤**이 생기고, 넘침 때문에 `justify-content:center`인 CTA의 중앙정렬도 시각적으로 틀어진다. box-sizing 하나로 두 증상(가로 스크롤 + CTA 중앙정렬) 동시 해소 — 근본 원인 단일.
    - 모달은 viewport 기준 `position:fixed; inset:0; padding:16px`로 띄우고, 카드는 `max-width:420px; width:100%; max-height:92vh`. CTA(`.bj-cta`)는 `display:flex; align-items:center; justify-content:center`로 아이콘+라벨을 한 단위로 중앙정렬.

32. **모바일 가로 넘침 0 의무 (2026-06-07 신설, 전역)**: 어떤 UI 작업이든 (카드·모달·위젯·섹션·테이블 — 신규/수정 불문) **모바일에서 화면 가로 넘침이 절대 발생하면 안 된다**. 모든 viewport(최소 320px)에서 `요소.right ≤ viewport폭` + `scrollWidth == viewport폭`을 보장한다.

    **(A) CSS 작성 규칙 (원인 차단)**:
    - **Grid**: 고정 N열은 `repeat(N, 1fr)` 금지 → **`repeat(N, minmax(0, 1fr))`** 필수. `1fr`의 암묵 최소폭은 `auto`(=콘텐츠 min-content)라 nowrap 텍스트·긴 단어가 칼럼을 화면 밖으로 키운다 (grid blowout — 신혼부부 패키지 v3.4 사고).
    - **Grid/Flex 아이템**: 수축이 필요한 모든 아이템에 **`min-width: 0`** (+ 필요 시 `max-width: 100%`) 명시. flex의 기본 `min-width:auto`도 같은 blowout을 일으킨다 (절대 규칙 #24 v0.3.3 비교표 사고와 동일 원인).
    - **`white-space: nowrap` 사용 조건**: 같은 요소에 `overflow:hidden`(또는 `text-overflow:ellipsis`)을 짝으로 + 조상 체인이 수축 가능(min-width:0)할 때만. **≤600px에서는 nowrap 대신 wrap을 기본**으로 하고 폰트 축소로 대응.
    - **고정 px 폭 금지**: viewport보다 클 수 있는 `width: NNNpx`는 `max-width:100%`와 병기. 테이블 등 최소폭이 필요한 경우만 wrapper에 `overflow-x:auto` 가로 스크롤로 격리 (#24 패턴).
    - **이미지/미디어**: `max-width:100%` (또는 컨테이너 `overflow:hidden` + `object-fit`).
    - **음수 마진·absolute 요소**: viewport 밖으로 나갈 수 있는 좌표·transform 금지, 컨테이너에 `overflow:hidden` 안전망.
    - 컨테이너 공통: `box-sizing:border-box` (#31), 오버레이 스크롤 컨테이너 `overflow-x:hidden`.

    **(B) 검증 의무 (배포 전 필수)**: 모바일에 노출되는 UI를 만들거나 수정하면 **320 / 360 / 390 / 430px** 4개 폭에서 가로 넘침 검사를 통과해야 배포한다. 판정 스크립트 (Playwright evaluate):
    ```javascript
    // 0이어야 통과. scrollWidth도 viewport 폭과 같아야 함.
    (vw => Array.from(document.querySelectorAll('*'))
      .filter(el => el.getBoundingClientRect().right > vw + 1).length)(window.innerWidth)
    ```
    - 검사 대상은 변경한 컴포넌트가 포함된 실제 페이지/모달 (정적 미리보기 아님).
    - 통과 기록(폭별 0)을 커밋 메시지나 WORKLOG에 남긴다.

    **사고 이력 (재발 방지 근거)**: v0.3.3 스펙 비교표 flex blowout → #24 신설 / v0.3.5·#26 help-pop viewport 탈출 / v0.3.6 모바일 헤더 로고 겹침 / v0.7.x #31 상담 모달 가로 스크롤 / **2026-06-07 신혼부부 패키지 2열 카드 화면 밖 넘침 (nowrap 가격 줄 × grid 1fr)** — 전부 같은 뿌리(수축 불가능한 콘텐츠 폭). 이 규칙은 그 일반화다.

## 카테고리 라우팅

신규 제품은 14개 패밀리 중 하나로 분류한 뒤 `docs/rulebook.md`의 해당 섹션을 따른다.

| ID | 패밀리 | 주요 카테고리 |
|----|--------|--------------|
| F01 | 정수·물처리 | 정수기, 연수기, 샤워기필터 |
| F02 | 위생·욕실 | 비데 |
| F03 | 공조·환기 | 에어컨, 공기청정기, 제습기, 환기, 보일러 |
| F04 | 청소 | 청소기, 로봇청소기 |
| F05 | 냉장보관 | 냉장고, 김치냉장고, 냉동고, 와인셀러 |
| F06 | 세탁·의류케어 | 세탁기, 건조기, 스타일러 |
| F07 | 조리·주방 | 식기세척기, 커피머신, 인덕션, 에어프라이기 등 |
| F08 | 영상·디지털 | TV, 노트북, 모니터, 빔프로젝터 |
| F09 | 건강·운동 | 안마의자, 런닝머신, 헬스기구 |
| F10 | 뷰티·이미용 | 이미용기, 드라이기 |
| F11 | 가구·침구 | 소파, 침대, 매트리스, 모션베드 |
| F12 | 이동수단 | 전기자전거, 전기스쿠터, 자동차렌탈 |
| F13 | 보안·스마트홈 | CCTV, 도어락, AI로봇 |
| F14 | 업소·창업 특화 | POS, 자판기, 서빙로봇 등 |

## 검증 완료 기준점

새 카드를 만들 때 다음 세 케이스를 비교 기준으로 사용한다.

| 패밀리 | 모델 | 종합 등급 | 4지표 등급 |
|--------|------|----------|------------|
| F01 정수 | 코웨이 CHP-7211N | **S** (93점) | 렌탈료 A+ · 정수성능 S · 위생관리 S · 편의기능 S |
| F03 공조 | 삼성 AF80F25D29WRS | **A** (90점) | 가격대 B+ · 냉방·제습 S · 공기청정·위생 S · AI·편의 S |
| F01 정수 | **세스코 EWBD351 (가성비 검증)** | **A** (3지표 평균 78.3) | 렌탈료 S · 정수성능 A · 위생관리 평가 없음 · 편의기능 B |

세 번째 케이스(세스코 EWBD351)는 "평가 없음 1개 + 나머지 3개로 종합 산출"의 정식 패턴이며, 데이터 일부 미흡 제품의 노출 표준 사례. 새 제품의 등급이 같은 카테고리 기준 케이스 ±2 letter 이상 벗어나면 룰북 점수 규칙을 재확인한다.

## 자주 쓰는 작업 패턴

- **"F0X 룰북으로 [제품명] 카드 데이터 생성"**: `docs/rulebook.md`의 해당 패밀리 섹션 → 출처 화이트리스트 사이트에서 크롤(WebFetch) → 스펙·점수·페르소나 JSON 출력
- **"이 데이터로 카드 렌더링"**: `templates/product_card.html`에 데이터 바인딩 → 새 HTML 파일로 저장
- **"통합 충돌 점검"**: `docs/merge_guide.md` 2장 체크리스트 15개 항목 비교

## 출처 우선순위 (v0.2)

| 우선순위 | 출처 | confidence 기준 | 검수 큐 |
|---------|------|----------------|---------|
| 1순위 (최상) | **빌리조 상세페이지 + 제조사 공식** 양쪽 일치 | 0.95+ | 통과 |
| 1순위 (단독) | **빌리조 상세페이지 단독** (본사 직접 제공) | 0.85+ | 단일 출처여도 통과 |
| 2순위 | 제조사 공식 단독 (coway.com, cuckoo.co.kr, cescomall.co.kr, sk-magic.co.kr, samsung.com/sec, lge.co.kr, winix.com, bodyfriend.co.kr 등) | 0.85 | 통과 |
| 3순위 | 가격비교 단독 (prod.danawa.com 등) | 0.6 | 검수 후보 |
| — | 어디에도 없음 | 0 | 해당 지표 `평가 없음` |

**중요**: **빌리조(billyjo.co.kr) 상세페이지에 명시된 정보는 본사가 직접 제공한 자료**이므로 공식 사이트에서 확인이 안 되더라도 신뢰한다. 빌리조 정보 vs 공식 정보가 다르면 빌리조 우선 (본사가 빌리조에 최신 정보 제공했을 가능성). 자세한 검증 흐름은 `docs/context_memo.md` 2.1장.

**스펙 표 우선 참조**: 제조사 공식 페이지에서 정보를 가져올 때는 **상세페이지 전체가 아니라 페이지 하단의 "제품 스펙 표"만 참조한다**. 스펙 표는 본사가 구조화한 데이터로 가장 신뢰성·효율 높음. 본문 마케팅 텍스트·이미지는 보조 참조만. 자세한 절차는 `docs/context_memo.md` 2.2장.

**제외**: 블로그, 카페, 유튜브, 일반 커뮤니티 — 출처로 사용 금지

## 검수 큐 트리거 조건

절대 규칙 #17 참조. 카드 미노출 + 검수 큐 자동 이동:
- 4지표 중 **`평가 없음` 3개 이상**
- 임의 지표 점수 < 40 (`평가 없음` 처리 + 측정 오류 의심)
- AI 추출 신뢰도 < 0.7 → 해당 지표 `평가 없음` 표기
- 핵심 항목(살균 방식·필터 종류·에너지 등급)이 단일 출처에서만 확인됨
- 카테고리 라우팅이 모호함 (예: "에어 워셔" → F03 공기청정기 vs 가습기)
- 4지표 등급이 같은 카테고리 기준 케이스에서 ±2 letter 이상 벗어남

## 변경 이력

- v0.1 (2026-05): 초안. F01·F03 룰북 검증 완료. F02·F04~F14는 스키마만 정의 (검증 미완료).
- v0.2 (2026-05): 등급 시스템(S/A+/A/B+/B/C+/C + 평가 없음) 도입, 한글 라벨 매핑, 카드 디자인 대폭 확장 (핵심 강점·자세히 보기·추천해요·본사관리 등). 절대 규칙 #5·#7·#8·#13·#14·#15·#16·#17 신설/갱신. 세스코 EWBD351 검증 케이스 추가.
- v0.2.1 (2026-05): 카드 외부 정렬 정밀화 — width 50% + `margin: 0 0 0 auto` + padding `0 15px 20px` (제거 대상 박스 `.prod_table_wrap`과 정확히 동일 가로). 1024-1279px 구간 padding-left 25px 보정 추가. 절대 규칙 #2 갱신.
- v0.2.2 (2026-05): 카드 라벨 정식화 — "AI 자동생성 카드" → **"📊 빌리조 제품분석"**. 배지 스타일 정밀화 (top: -1px, padding 3px 9px, border-radius 5px). SVG 게이지 중앙 텍스트 2줄 단순화 (보조 "≈ 2.0" 라벨 제거, letter 만 노출), y 좌표 명세 (종합 평가 y=40 / letter y=62, 2px 간격). 절대 규칙 #6 갱신 · #18 신설.
- v0.2.3 (2026-05): 모바일 컴팩트화 — 4지표 카드 `.m`을 모바일에서 row 1줄 레이아웃 (라벨 좌·배지 우). 6스펙·4지표 박스 패딩 일괄 축소. 빌리조 `.category__wrap` 보조 변경 (버튼형 + 2줄 제한 + ▼ 토글). 절대 규칙 #19·#20 신설.
- v0.2.4 (2026-05): 카드 가로 너비 **50% 우측 정렬 → 100% 풀폭** 변경. 이미지 섹션(`.prod_view_top`)과 가로 너비 정렬 일치. v0.2.1의 `.prod_table_wrap` 가로 매칭 규칙(`width:50%; margin:0 0 0 auto; padding:0 15px 20px`)·1024-1279px padding-left 보정·≤1023px 풀폭 분기 모두 폐기. `clear:both` 필수 명시 (`.prod_view_top` float 기반일 때 카드 떠오름 방지). 절대 규칙 #2 갱신. 사용자 피드백: "PC에서 카드가 좁아 보임 / 모바일 최적화 형태로 보임" → 풀폭이면 이 인상 해소.
- v0.2.5 (2026-05-21): **좁은화면 헤더 패치 신설**. 빌리조 본 사이트 `inject.js`가 PC>768px에서 헤더 DOM을 leftGroup/rightGroup 2그룹으로 재구성하면서 인라인 `flex-shrink:0; white-space:nowrap`을 박는 게 좁은 폭(≈1024-1280px)에서 카테고리가 검색 영역 위로 흘러넘치는 원인이었음. 인라인 JS 시밍으로 결과 DOM에 `.bj-inj-row/.bj-inj-left/.bj-inj-right` 안정 클래스 부여하고 CSS로 강제 무력화 + 줄바꿈 허용 (1024px↓는 별도 행 분리). 모바일(≤768px)에서는 `header:not(.bj-ready){opacity:0}` 보호 룰을 `.bj-ready` 강제 부여 + specificity 역전으로 해소. `inject.js`가 떼어낸 이벤트 링크(`#bj-top-banner`)를 `#bj-header-icons` 첫 `<li>`로 JS 복원해, 모바일 헤더는 `[햄버거 · 로고 · 이벤트·검색·장바구니]` 1행으로 정렬. 햄버거 중복(`.gnb__hamburger` + `.hamburger__btn`)은 후자 숨김으로 정리. 제품 다중 이미지 썸네일 60×60에 1px 회색 테두리 추가. 절대 규칙 #21 신설. 사용자 피드백: "PC 좁은 화면에서 검색 영역이 GNB 카테고리 위로 올라타는 문제 + 모바일에서 헤더가 안 보임" → inject.js 결과 DOM 인지로 해소. 검증 페이지: `billyjo_10914_actual_v023.html` (canonical) + 3-layout 비교본 (Layout 1 채택).
- v0.2.6 (2026-05-21): **`.rec` 산문 블록 폐지 → `.specs` 그리드로 흡수**. SLOT 4(기본정보) 내부의 `.rec` 한 줄 산문이 다른 슬롯과 중복(필터·제품유형·페르소나)되어 정보 과잉. 고유 정보(방문관리 4개월 코디 / 60개월 후 자동 소유권 이전)만 `.specs` 그리드의 7-8번째 칸으로 편입. 제품유형 셀은 "데스크형 230mm"로 230mm 폭 흡수. 방문관리 셀의 `.sv`는 `.hq-btn` pill로 시각 강조 (브랜드 파랑 + 🏢 이모지). 절대 규칙 #14 갱신 — "6스펙" → "6-8 스펙 (기술+운영 혼합 허용)" + 중복 흡수 원칙 명시. 사용자 피드백: "텍스트로 나열된 .rec이 너무 산만하다 → 위 specs로 편입하고 중복 제거" → 단일 그리드로 정보 밀도 압축.
- v0.2.7 (2026-05-21): **Hero 재배치 (Option C) + Step 폰트 +35% 정식 채택**. (1) **SLOT 1·2 이전**: 제품명/모델 메타와 270° SVG 게이지+4지표를 `.prod_view_top.right`(이미지+가격 영역)로 이동해 hero 1권 종합. 첫 화면에 평가 결과까지 노출 → 의사결정 가속. AI 카드 본체는 SLOT 3-7만 표시. `.head/.summary/.ai-card-tag` 모두 숨김. 비교 단계에서 Option A(50%폭 삽입)와 Option B(시각 융합)도 검토했으나, A는 v0.2.4 풀폭 결정과 충돌하고 B는 시각 효과만 살리는 데 그쳐 정보 밀도가 부족 → C 채택. (2) **레이아웃 안전화**: 빌리조 `.prod_view_top` float→flex 변환 필수 (`.right` 컬럼이 hero summary 추가로 길어지면 float 컨테이너가 enclose 못해 AI 카드와 겹침/잘림 발생). (3) **CSS 변수 스코프 복원**: SVG 게이지가 `#ai-card-root` 스코프 안 변수를 사용하므로 hero 위치(`.prod_view_top .right`)에 동일 변수 재정의 필수 — 누락 시 게이지 stroke·letter 색 사라짐. (4) **SLOT 6 Step 폰트 +35% 확대**: `.step-n` 26px / `.step-title` 16px / `.step-sum` 14px 표준. 소폭(+20%)·강조(+55%) 변형 검토 후 중폭이 가독성·컴팩트 균형점. (5) **`.prod_view_bot.card.mt40` 렌탈사 비교 위젯 노출 유지**: inject.js가 내부에 `.bb-inner` 동적 렌더 — 위치·DOM 그대로. 절대 규칙 #1 유지(7슬롯) + #22·#23 신설. 검증 페이지: `billyjo_10914_actual_v023.html` (canonical = final.html과 동일 상태) · 외부 공개 https://billyjo-header-layouts.vercel.app/final.html.
- v0.2.9 (2026-05-21): **카테고리 선택형 스펙 비교표 (2단계 토글) 신설**. SLOT 6 Step 1-3 내부의 1-of-N 카테고리 스펙(필터 종류·살균 방식·컴프레서·매트리스 구조 등)을 단순 pill 그룹에서 2단계 progressive disclosure 패턴으로 격상: (1) Step "자세히 보기"로 라벨 노출 (예: "필터 종류: UF 중공사막"), (2) "다른 필터와 비교" pill 클릭으로 3-4 컬럼 비교표 전개. 선택 컬럼 브랜드 파랑 강조, 비선택 회색, 평가없음(`.ft-na`) 회색 채움. 다중 선택·수치형 스펙은 pill 유지. 절대 규칙 #24 신설. 검증: F01 정수기(필터 종류·살균 방식 평가없음 케이스) + F02 비데·F03 공조·F05 냉장·F11 매트리스 5개 패밀리 갤러리 검토 → 패턴 범용성 확인. 사용자 피드백: "표로 보여주면 좋겠다 + 자세히 보기 눌러야 비교표 나오게" → 1단계 토글(filter_table.html, v0.2.8 시안)과 2단계 토글(filter_nested.html) 비교 후 후자 채택. 검증 페이지: https://billyjo-header-layouts.vercel.app/filter_nested.html · 5패밀리 갤러리 .../filter_table_examples.html.
- v0.3.0 (2026-05-21): **하단 sticky 위젯(`.bb-inner`) 정식화**. 빌리조 inject.js가 `.prod_view_bot.card.mt40`에 렌더하는 렌탈사 비교/구매 위젯을 (1) `position:sticky; bottom:0`로 viewport 하단 고정, (2) `▾▴` 폴딩 토글 + 핸들 탭으로 펼침/접힘, (3) "렌탈 신청"을 **"렌탈+사은품 신청"**(선물박스 아이콘, 전화기 아이콘 폐기)으로 변경, (4) **"상담신청"** 보조 액션 버튼 신설. 핸들에 grip indicator + 제품명 + 대표 가격 노출. 접힘 시 `max-height:64px`만 남아 본문 가독성 보존. JS는 inject.js 결과 DOM에 MutationObserver + setTimeout 다중 트리거로 후처리. 절대 규칙 #25 신설. 사용자 피드백: "이 영역이 스크롤을 위로할 때 유저에게 출력되는데 부자연스럽다 + 화면 탭으로 열고 닫기 + 렌탈 신청을 사은품 강조로 + 상담신청 버튼 추가" → 위 패턴으로 일괄 대응. 검증: https://billyjo-header-layouts.vercel.app/final.html.
- v0.3.1 (2026-05-21): **하단 위젯 sticky → fixed 정정 + SLOT 5 페르소나 폰트 +35% 확대**. (1) v0.3.0의 `position:sticky; bottom:0`이 `.wide-inner` 컨테이닝 블록 안에서만 동작해서 페이지 끝쪽 위젯이 실제로 sticky 효과를 못 보이는 문제 발견 → `position:fixed; left:50%; transform:translateX(-50%); width:100%; max-width:1500px; z-index:9999`로 정정. 펼침 max-height 1000px → 520px + 내부 `overflow-y:auto`로 콘텐츠 길면 위젯 내 스크롤. (2) 사용자 피드백 "이런 분에게 추천해요 폰트도 1up" → SLOT 5 페르소나 카드 일괄 +35% 확대 (Step 폰트와 동일 스케일): `.rec-p-title` 12→15.5px Bold · `.p-d` 11→13.5px · `.feat-btn` 10.5→12px · `.rec-p-level` 10.5→12.5px · `.p-top i` 18→22px · `.p` padding 11/12→14/15px. 절대 규칙 #23·#25 갱신. 검증: https://billyjo-header-layouts.vercel.app/final.html.
- v0.3.2 (2026-05-21): **모바일 헤더 3개 이슈 일괄 픽스**. (1) PC GNB 카테고리 메뉴(`.new-gnb__wrap`·`.new-gnb`)가 모바일에서 노출되던 문제 → `@media (max-width:768px)` 명시 `display:none`. inject.js의 `.mobile__gnb`로 대체 노출되므로 PC GNB는 불필요. (2) 이벤트/기획전 주황 버튼이 빌리조 로고와 겹치던 문제 → `.header__top { gap:0 }` + 햄버거 `margin-right:5px` + 로고 `flex:0 0 auto` + 우측 아이콘 그룹 `margin-left:auto`로 [햄버거-5px-로고-자유공간-아이콘들] 정렬 명시화. (3) 하단 fixed 위젯이 여전히 안 보이던 문제 → CSS specificity (0,0,3,0)이 v0.2.4의 (0,1,4,0) 룰에 밀려 일부 속성 override 실패 가능성 발견. `body #container .wide-inner > .prod_view_bot.card.mt40` 더블 selector로 동급 specificity + cascade 후순 + JS에서 `wrapper.style.cssText`로 inline `position:fixed; bottom:0; left:0; right:0; z-index:99999 !important` 강제 fallback. JS도 `.bb-inner` 부재 시에도 동작 (제품명·가격 페이지 내 다른 위치에서 fallback 추출). 절대 규칙 #21·#25 갱신. 사용자 피드백: "1. 모바일에서 .new-gnb 영역 제거, 2. 이벤트 버튼이 로고와 겹치지 않게 햄버거 우측 5px, 3. 하단 sticky widget 여전히 노출 안 됨" → 위 세 패치로 일괄 대응.
- v0.3.3 (2026-05-21): **모바일 비교표 overflow 픽스 (절대 규칙 #24 보강)**. 사용자 피드백: "필터 종류 자세히 보기 누르면 모바일 화면에서 화면 옆으로 삐져나가서 테이블이 보이지 않아". 원인: flex 자식의 default `min-width:auto`가 자식(table)의 min-content 폭을 부모로 전이 → `.spec-row`·`.spec-detail-toggle[open]`·`.filter-table-wrap` 모두 부모 폭 초과 확장. Fix: 세 layer 모두 `min-width:0; max-width:100%; box-sizing:border-box` 명시. 모바일 표 `min-width:380→280px` 축소 (iPhone SE 320px 호환), 극협소(≤360px) `min-width:260px`. `.step-details` 모바일 padding-left 14px + `.spec-detail-toggle[open]` 좌우 -6px margin으로 표 가용 폭 추가 확보. 표 헤더 폰트 10.5px·"이 제품" 소라벨 8.5px·`white-space:normal; line-height:1.3`로 좁은 헤더에서 자연 줄바꿈. `-webkit-overflow-scrolling:touch`로 iOS 모멘텀 스크롤. 절대 규칙 #24 모바일·flexbox overflow 섹션 신설.
- v0.3.4 (2026-05-21): **카드 너비 확장 + SLOT 7 모바일 정리**. (1) `.wide-inner { max-width:1480px }` (기본 1200px → 1480px) — 빌리조 사이트가 좁게 잡혀 있어 카드가 좁아 보이는 문제. 좌우 패딩 PC 24px / 태블릿 16px / 모바일 10px. `.card { padding:24px 26px 20px }` (기본 22px → 26px 좌우 확장). (2) **SLOT 7 (.gift-r) 모바일 column 레이아웃**: 기존 `flex + justify-content:space-between + align-items:center + text-align:right`이 모바일에서 긴 한글 값 ("6개월 무상 A/S + 패키지 추가 시 월 2,000원 할인") 줄바꿈을 우측 정렬한 채 처리하여 어색. ≤600px에서 `flex-direction:column; align-items:flex-start; gap:6px` + `.gift-v { text-align:left; width:100% }`로 라벨 위·값 아래 좌측 정렬. (3) **`.gift-v` `word-break:keep-all`** 한글 어절 단위 줄바꿈 강제 (음절 분해 방지). (4) `.gift-r` 사이 dashed border-top 추가 — 3행 구분 명확화. 사용자 피드백: "상세페이지 모든 카드 너비 좀 더 넓게 + 예상 최대 지원금·빌리조 혜택·제조사 프로모션 영역 모바일 줄바꿈 이상" → 위 패치로 일괄 대응.
- v0.3.5 (2026-05-21): **`.help-pop` ⓘ 툴팁 모바일 sheet 전환 + 외부 탭 자동 닫힘**. 사용자 피드백: "필터종류 (?) 클릭해도 글씨가 화면 영역 밖으로 넘어가". 원인: `.help-pop`이 `.sc` 셀(모바일 2-col 그리드, ~140px 폭) 안에서 `position:absolute; width:220px; left:50%; transform:translateX(-50%)`로 떠 있어 셀 폭보다 넓은 팝업이 viewport 밖으로 넘침. Fix: PC는 absolute 유지하되 `max-width:calc(100vw - 32px)` 안전 가드 + 폰트 11→12px·width 220→240px·padding 8/10→10/12px·`word-break:keep-all`로 한글 정리. 모바일(≤600px)은 `position:fixed; left:12px; right:12px; bottom:96px; transform:none; width:auto; max-width:none`로 viewport 하단 sheet — sticky 위젯 위에 위치, slide-up 애니메이션. 닫기 안내("ⓘ 아이콘을 다시 누르면 닫힙니다") 자동 추가. JS로 외부 탭 시 자동 닫힘 + 새 help 열릴 때 다른 help 자동 닫힘 (1개만 열림 보장). 절대 규칙 #14 도움말 사양에 모바일 sheet 패턴 추가 필요.
- v0.3.6 (2026-05-21): **모바일 헤더 로고-이벤트 버튼 겹침 픽스**. 사용자 피드백: "렌탈 빌리조 로고에 이벤트/기획전 바로가기 버튼이 겹쳐 보여". 원인: 로고 이미지가 `width:auto`라 intrinsic 폭이 클 경우 [햄버거]+[로고]+[아이콘리스트] 합계가 viewport를 초과, `flex-wrap:nowrap`이라 줄바꿈 안 되고 겹침 발생. Fix: (1) `.logo { flex:0 1 auto; max-width:38vw; overflow:hidden }` + `.logo img { max-width:100%; height:26px; object-fit:contain }` — 로고 폭을 viewport의 38% 이하로 제한. (2) `ul#bj-header-icons { flex:0 1 auto; min-width:0; gap:6px }` — 아이콘 리스트 shrink 허용 (이전 `flex:0 0 auto`). (3) 이벤트 링크 폰트 10.5→10px, padding 4/7→3/6px, `max-width:38vw; text-overflow:ellipsis`로 잘림. (4) `.header__top { overflow:hidden; padding:10/14→8/12px }` 안전망. (5) 협소 폭 단계적 축소: ≤400px 이벤트 28vw·로고 32vw·아이콘 24px / ≤360px iPhone SE 이벤트 max-width:90px·아이콘 18px. 절대 규칙 #21 모바일 사양 갱신. 검증 페이지: https://billyjo-header-layouts.vercel.app/final.html
- v0.3.7 (2026-05-22): **모바일 4종 일괄 정리**. (1) **검색바 명시 숨김**: `.search__wrap`이 `.top__right` 외 다른 위치에 렌더되는 경우 대비, `header.new-header .search__wrap, header.new-header form .search__wrap, header.new-header .bj-inj-right .search__wrap { display:none !important }` 안전망. 검색은 .m_search_popup으로 노출. (2) **`.category__wrap` 2줄 토글 → 1행 가로 스크롤 (절대 규칙 #20 갱신)**: `display:flex; flex-wrap:nowrap; overflow-x:auto; scrollbar-width:none; gap:6px`. 각 항목 pill 형태(원형 border-radius:999px, padding 6px 12px, font 12.5px 600), 활성 시 브랜드 파랑 채움. 우측 fade 그라데이션으로 스크롤 가능 신호. 이전 v0.2.3의 ▼ 토글 JS 폐기 — 1행 스크롤이 더 직관적. (3) **`#ff1818` 빨강 강조 → `#0838F8` 브랜드 파랑 통일**: `a[style*="ff1818"] { color:#0838F8 !important }` — 이벤트/고객센터 등 산발적 빨강 강조를 브랜드 톤으로 정리. (4) **`.g-d` 평가없음 배지 높이 통일**: `display:inline-flex; align-items:center; line-height:1.2; font-size:12px` 추가 — 이전 default `display:inline` + line-height 미지정으로 다른 `.grade-badge`보다 키가 컸음. 사용자 피드백 4건 일괄 대응.
- v0.3.8 (2026-05-22): **카테고리 spacing 축소 + 자동 스크롤 + rental-terms ⓘ 툴팁**. (1) `.category__wrap` spacing 축소: padding 8/12→6/10px, gap 6→4px, 항목 padding 6/12→5/10px, font 12.5→11.5px, border-radius 999→14px — 한 화면에 더 많은 카테고리 노출. (2) **자동 스크롤 정렬 JS**: `alignCategoryScroll()` — `.on` 활성 카테고리가 있으면 가운데로 스크롤, 없으면 `scrollLeft:0` 고정 (모바일 기본 스크롤 위치 표류 방지). DOMContentLoaded + setTimeout [200, 600, 1500] 트리거. (3) **약정 기간·의무 사용 기간 ⓘ 툴팁 추가**: rental-terms 라벨 옆에 help 툴팁 인라인 배치. 약정 기간 = 전체 계약 기간, 의무 사용 기간 = 위약금 부과 최소 기간 설명. `.rt-r { align-items:center }`, `.rt-l { display:inline-flex; gap:3px }`. inject.js에는 `addRentalTermsHelp()` 동적 주입 함수로 실서버 카드 HTML에 마크업 없어도 자동 추가. 사용자 피드백 3건 ("주방가전 왼쪽 화면 밖으로 넘어감 + spacing 너무 넓음 + 약정/의무사용 기간에 ⓘ 추가") 일괄 대응.
- v0.3.9 (2026-05-22): **카테고리 메뉴 텍스트 전용 스와이프로 단순화 + 좌측 정렬 명시**. 사용자 피드백: "카테고리 버튼을 빼고 텍스트만 옆으로 스와이프할 수 있게 + 잘리는 글씨 없도록 좌측 정렬". v0.3.8까지 pill 버튼 패턴이었으나 (1) 시각적으로 무겁고 (2) spacing 잡기 어렵고 (3) JS 자동 스크롤이 가운데 정렬해서 좌측 항목이 잘림. **텍스트 전용 + flex-start 좌측 정렬**로 단순화: `background:transparent; border:0; border-radius:0; padding:2px 0; font:500 13px; color:#555`. 활성(`.on`)은 `color:#0838F8; font-weight:800` + `::after` 하단 2px 파란 바(탭 형태). 자동 스크롤 JS 변경: 가운데 정렬 → minimal scroll (활성이 화면 밖일 때만 좌측 20px로 이동, 이미 보이면 scrollLeft 변경 안 함). 좌측 fade(14px) + 우측 fade(32px) 그라데이션으로 스크롤 가능 신호. 절대 규칙 #20 갱신.
- v0.4.0 (2026-05-22): **하단 위젯 fallback 콘텐츠 자체 생성 (안 보이는 문제 해결)**. 사용자 피드백: "하단 상담신청 및 견적 위젯은 왜 안나오는거야?". 진단: `.prod_view_bot.card.mt40` 컨테이너는 있으나 `.bb-inner`(빌리조 inject.js가 생성하는 위젯 내용)이 정적 페이지에 없어서 enhanceBottomBar()가 핸들만 만들고 버튼은 생성 안 함 → 위젯이 거의 비어 보이는 현상. Fix: `enhanceBottomBar()`에 fallback 분기 추가 — `bbInner`가 null이면 `.bj-bar-fallback` 박스를 직접 생성 (`[월 렌탈료 라벨 + 가격] [장바구니][🎁 렌탈+사은품 신청][💬 상담신청]` 3버튼). 클릭 시 `window.shoporder()` 함수 있으면 호출, 없으면 `/html/dh_order/shop_cart` 또는 `/html/dh/counsel` URL로 이동. SVG 아이콘 상수화(SVG_GIFT/SVG_CHAT/SVG_CART). 모바일 ≤600px column stack + 버튼 flex:1로 풀폭, ≤400px 추가 압축. 절대 규칙 #25 갱신.
- v0.4.1 (2026-05-22): **PC 가격박스(.fix_price) 평가표 하단 이동 + 카드 시각 강화**. 사용자 피드백: "PC 버전에서 (최저 월 렌탈료)(카드할인가) 버튼이 제품 성능 평가표 위가 아닌 하단에 나오면 좋겠어". 이전 순서: `[가격박스] → [제품명] → [게이지+4지표]`. 변경 순서: `[제품명·모델] → [게이지+4지표] → [가격박스]` — 사용자가 평가 결과를 본 뒤 가격을 확인하는 자연 시선 흐름. `buildHero()`에 `.fix_price.hide-767`을 `.bj-hero-summary.after()`로 이동시키는 분기 추가, `.bj-fix-price-moved` 마커 클래스 부여. PC 가격박스 시각 강화: linear-gradient 연한 파랑 배경 + 좌(파랑 #0838F8) 우(녹색 #16a34a) 컬럼 분리(점선 구분선), 폰트 22px Bold. 1023px↓는 column stack. 모바일 가격박스(.fix_price.hide-default.show-767)는 별도 영역이라 영향 없음.
- v0.4.2 (2026-05-22): **PC 가격박스 세로 중앙 정렬 픽스**. 사용자 피드백: "최저 월 렌탈료, 카드할인가 박스 중앙보다 좀 더 아래에 위치해있어서 중앙 가운데 정렬이 안맞아". 원인: `.fix_price.bj-fix-price-moved .box`가 `flex-direction:column`이라 라벨+가격이 박스 위쪽에 붙어 있고, 컨테이너 `align-items:stretch`로 박스 자체에 vertical center 없음. Fix: 컨테이너 `align-items:center; justify-content:center`로 가로/세로 중앙 정렬. `.box` 내부도 `flex-direction:row; align-items:center; justify-content:space-between`으로 변경 — 라벨(좌)과 가격(우)이 한 줄로 세로 정렬됨. `min-height:36px`로 박스 높이 일관성 보장. 모바일 1023px↓는 column stack 유지(`align-items:stretch`).
- v0.5.27~v0.5.28 (2026-05-27): **하단 위젯 X 버튼 제거 + 옵션 select 보장**. (v0.5.27) ✕(영구 dismiss) 버튼과 ▾(접기) 토글 기능 중복으로 사용자 혼란 → ✕ 제거, dismiss는 핸들 ≥120px 드래그 게스처로만. 옵션 select가 빌리조 .bb-inner의 hidden select 때문에 가드에 걸려 미노출되던 버그 → 가드를 `.bj-option-clone` 한정으로 좁힘. (v0.5.28) `handle.addEventListener('click')`가 setupHandleDragGesture의 mouseup 탭 분기와 동시 등록되어 탭 1회 = 토글 2회 → 펼침 안 됨. click 핸들러 제거, drag gesture에 위임.
- v0.5.29~v0.5.30 (2026-05-27): **18055 옵션 박스 위치 + 약정 pill 가로 스크롤**. (v0.5.29) wrapper끝 append 시 .bb-inner의 overflow:auto에 가려 잘리던 옵션 박스를 .bb-inner 앞 삽입으로 가시 영역에 배치. (v0.5.30) flex column 부모(.bj-widget-selector·.bj-ws-sup-section) default min-width:auto가 .bj-ws-term-pills를 콘텐츠 너비로 확장 → overflow-x:auto 무력화 → 약정 pill 가로 스크롤 안 됨. 3-layer 모두 min-width:0 + max-width:100% + width:100%로 강제. native .bb-months도 flex-wrap:wrap → nowrap + overflow-x:auto 통일.
- v0.5.31 (2026-05-27): **위젯 항상 접힘 상태 노출 + hysteresis**. 페이지 진입 시 slide-hidden 폐기, visible+collapsed로 항상 노출. 기존 트리거(카드 viewport 사라짐) 의미 전환: show/hide → expand/collapse. lastTriggerState 추적으로 천이 시점에만 자동 적용 → 사용자 수동 토글이 다음 trigger 천이까지 유지. 명시적 dismiss는 드래그 ≥120px sessionStorage 그대로. 옵션 박스 삽입 위치 일원화: handle.nextSibling (어떤 페이지 변종이든 wrapper 최상단 visible 영역).
- v0.5.32~v0.5.33 (2026-05-27): **카드/정가 라벨 명시 + 색상 옵션 항상 버튼 그룹**. (v0.5.32) 약정 pill에 카드할인가 + 정가 strike-through 함께 노출, 색상만으로 구분 어렵던 문제 해소. (v0.5.33) pill 2행 마크업 — 1행 [BEST + 약정기간], 2행 [카드 라벨+가격 / 정가 라벨+가격]. 카드 라벨 핑크 #ffe1ee + 정가 라벨 회색. **색상 옵션 항상 버튼 그룹으로** — buildOptionButtonGroup 옵션 개수·길이 제한 폐기, shortenOptionLabel로 접두어(솔리드/메탈릭) + 후미 모델코드(WB/AS 등) 제거 → "솔리드크림화이트 WB" → "크림화이트". select.style.display:none 폐기 (iOS Safari의 fixed wrapper 안 select picker 알려진 버그 원천 차단). 전체 라벨은 button.title hover 노출.
- v0.5.34~v0.5.35 (2026-05-27): **펼침 토글 회귀 fix + native select 가드**. (v0.5.34) enhanceBottomBar 매 호출 시 `wrapper.classList.add('bj-bar-expanded')`가 가드 *전*에 있어 사용자가 collapsed로 토글한 직후 runAll 재실행되면 expanded 강제 추가 → 두 class 공존 → CSS cascade로 collapsed 이김 → "펼침 버튼 눌러도 안 펼쳐짐" 증상. 가드 안으로 이동 + forceFixedStyle도 1회 가드. toggleExpanded 명시적 분기로 두 class 동시/부재 비정상 상태 안전. max-height 380→min(440px, 75vh). drag onMove의 transform:translateY(0) 부작용 제거. (v0.5.35) syncOptionSelectToHandle의 `wrapper.contains(s)` 가드 폐기 — 18055 page는 native .option_select가 wrapper 내부 .rantal_wrap > .option__wrap 위치라 가드에 걸려 skip되던 버그. 우리 자체 .bj-option-clone만 skip하도록 좁힘. Playwright 검증으로 7/7 통과.
- v0.5.36~v0.5.38 (2026-05-27): **시각 정리 + grip hit area + help 통합**. (v0.5.36) .bj-ws-term-pill border-radius 999px(캡슐) → 8px(코너 네모). (v0.5.37) 하단 위젯 위아래 여백 11곳 일괄 축소 — 핸들 padding 20/10 → 14/6, collapsed max-height 56→48px, body padding-bottom 88→72px, fallback padding 14/16 → 8/10, 버튼 padding 11→8px, pill padding 5→3px 등. 화면 점유 ~15% 감소. (v0.5.38) **grip 바 hit area 확장** — `.bj-bar-handle::before`는 visible bar 그대로 두고(pointer-events:none) `.bj-bar-handle::after`로 120×18px transparent hit zone 추가. grip 바 자체 + 주변 영역 어디 눌러도 핸들 mousedown 위임 → 토글 작동. **rental-terms help 통합** — '약정 기간'·'의무 사용 기간' 두 ⓘ를 분리 노출하면 정보 단편화 + 화면 가림 중복 → '약정 기간' 라벨에만 통합 박스 하나로 두 개념을 `<br><br>` 분리해 함께 노출. '의무 사용 기간' 라벨은 ⓘ 추가하지 않음. 절대 규칙 #26 (C) 신설.
- v0.5.39~v0.5.41 (2026-05-27): **LPT(약정·카드 할인가) 표 정비 + 본문 중복 hide**. (v0.5.39) `mountLptIntoCard`에 표 위 제품 정보 헤더(`#lptTitle`) 추가 — 1행 제품명(15px Bold 흰 글씨, 'LG구독 -' 같은 brand prefix 제거), 2행 모델명·관리주기(12px opacity:0.85). 파란 #0838f8 배경. (v0.5.40) **본문 LPT 중복 hide** — `hideDuplicateBodyLpt()` 3단계: (1) `#livePriceTable` + 부모 wrapper (2) thead에 '약정' + ('월 렌탈료'|'카드 할인가'|'할인가') 패턴 갖는 모든 table — text 기반 매칭으로 다양한 페이지 구조 robust (3) h2/h3/h4/.sec-t에 '약정·카드 할인가' 등 헤더 갖는 section. 모두 protected 영역(`#ai-card-root`·`.prod_view_bot.card.mt40`·`.prod_view_top`) 외부 한정. `mountLptIntoCard` + `runAll` 매 cycle 호출 — 빌리조 본문 재렌더에도 안정. (v0.5.41) lptTitle과 표 width 불일치 fix — 이전 별도 div 2개 (title full width + 표 wrapper with border) → outer wrapper 하나로 통합 (border + radius + overflow:hidden 단일 관리). 절대 규칙 #27 갱신 — SLOT 8 mount 시 lptTitle 표 위 항상 노출 + 본문 LPT 광범위 hide 의무.
- v0.5.42 (2026-05-27): **빌리조 floating 버튼 자동 위치 조정 (절대 규칙 #29 신설)**. 빌리조 페이지 floating 버튼 `.new-qb`(quick-call: q_call_red·q_call) + `.goTop`(맨 위로: q_top·m_top)이 fixed positioning이라 하단 위젯과 시각적으로 겹침. JS 없이 CSS `:has()` 선택자로 wrapper 상태 추적 → 3-state bottom 자동 조정: (a) 기본 collapsed `bottom:60px` (48 + 12) — 위젯 핸들 위로 (b) `body:has(.bj-bar-expanded)` 시 `bottom:calc(min(440px, 75vh) + 12px)` — 펼친 위젯 위로 (c) `body:has(.bj-bar-slide-hidden)` 시 `bottom:12px` — dismiss 시 원래 위치 복귀. `transition:bottom 0.32s cubic-bezier(0.4, 0, 0.2, 1)`로 위젯 max-height transition과 동기 부드러운 이동. 모바일(≤600px) collapsed 44px 기준 `bottom:56px`. JS·MutationObserver 불필요 — 순수 CSS.
- v0.5.43~v0.5.50 (2026-05-27): **상담신청 아이콘 + 옵션 chip 골드 톤 + 약정 pill 시각 정리**. (v0.5.43) 상담신청 SVG_CHAT → SVG_PHONE (Material 전화 수화기 path). (v0.5.44) `.bj-bar-handle-option.is-empty` 색상 빨강(위험) → 빌리조 테마 금색(`#fff8e1`·`#b45309`·`#fcd34d`). (v0.5.45) 옵션 chip에 `#ffd000` glow 효과 — 다층 box-shadow 4·8·16·24px blur. (v0.5.46) 옵션 chip을 핸들 BEST/가격 우측으로 재배치(`handleText.appendChild`) + margin-left. (v0.5.47) **'만기 후 소유권 이전' chip 자동 추가** — 반납 조건 아닌 제품의 `.rental-terms` 끝에 `.bj-ownership-row` (라벨 '소유권' + `#ffd000` chip). 검출: 페이지 어디든 '반납제품·반납조건·반납형·반납이·반납후' 키워드 매치 시 skip. (v0.5.48) 소유권 라벨 옆 ⓘ — 약정 만기 후 소유권 이전 안내문 통합 박스. (v0.5.49) `.help-pop` 모바일 텍스트 한 줄 펼침 fix — 빌리조 `white-space:nowrap` 상속 차단 (`normal !important` + `overflow-wrap:anywhere`). (v0.5.50) 모바일 ownership row 높이 다른 row와 동일 정렬 — padding/margin/border-top 제거 + chip 컴팩트화(font 12px + box-shadow:none).
- v0.5.51~v0.5.58 (2026-05-27): **rental-terms dashed 분리선 진화 → 최종 폐기**. 사용자 피드백 따라 4번 반복 시각 디자인 조정 후 점선 자체 제거로 단순화. (v0.5.51) 모바일 row 사이 dashed #e5e7eb 추가. (v0.5.52) #c8cdd6 더 진한 회색으로 가시성 강화. (v0.5.53) PC도 동일 적용 (모바일·PC 통일). (v0.5.54) 모바일 의무 사용 기간(2번째 row) 위 dashed 제거 — 약정 카테고리 그룹화. (v0.5.55) 그 룰 PC도 적용. (v0.5.56) 약정 pill 정가 strike-through 제거 + 진회색(#555) — 카드 할인 없이 일반 결제하는 사용자에게도 유효 가격이라 misleading 차단. (v0.5.57) 약정/의무 사이 dashed PC만 복원, 모바일은 제거 (분기 일시). (v0.5.58) **모든 dashed 분리선 전체 폐기** — PC·모바일 모두 row 사이 깔끔. Playwright 3 케이스 검증으로 모든 row borderTop:none 확인.
- v0.5.59~v0.5.61 (2026-05-27): **페르소나 카드 아이콘 + 모바일 추천강도 위치**. (v0.5.59) `personalizePersonaIcons()` — 페르소나 제목 텍스트 매칭으로 Tabler 아이콘 자동 교체. 샘플 단계: `1인|신혼|커플` → `ti-user-heart`만 활성. 후보 주석(가족·맘·시니어·오피스)은 사용자 확인 후 확장 가능. (v0.5.61) `arrangePersonaLevelMobile()` — 모바일(≤600px)에서 `.rec-p-level-N`(매우 추천 등)을 `.rec-p-title` 옆으로 DOM 이동, PC는 원위치(`.p-top`) 유지. resize debounced 100ms로 viewport 변화 즉시 반영. CSS `.rec-p-title { flex; gap; flex-wrap:wrap }`로 긴 페르소나명도 wrap 안전.
- v0.5.62~v0.5.64 (2026-05-27): **핸들 단순화 + 카드 안내 별도 chip 분리**. (v0.5.62) 핸들의 BEST 배지 제거 — 약정 pill의 `.bj-ws-best-badge`와 중복. (v0.5.63) 옵션 라벨 색상 자동 인식 — `.bj-fb-option-label`이 nearTh '타입'으로 표시되더라도 실제 옵션 값(`솔리드크림화이트`·`베이지` 등)에 색상 키워드(화이트/블랙/그레이/실버/금색/베이지/브라운/핑크 등 + 영문) 절반 이상 매칭 시 강제 '색상'으로 교체. (v0.5.64) **핸들 가격 정가만 표시** + 카드 안내 별도 chip — 이전: `BEST 카드 월 X원 ⓘ (정가 월 Y원)` → 정가만 (`월 Y원`), 카드할인 정보는 펼친 위젯 약정 pill에 노출. 카드 안내 ⓘ도 폐기, 약정 pill 아래 가로 chip(`💳 [렌탈사] 제휴카드 안내 보기 →`)으로 분리. drag gesture 충돌 잠재 위험도 함께 제거.
- v0.5.65~v0.5.68 (2026-05-28): **제휴카드 안내 페이지 해당 렌탈사 상단 강조**. (v0.5.65) chip href에 `?bj=<렌탈사명>` query param 추가 + `bjHighlightPartnership()` 신설 — `/html/dh/partnership_card` 페이지 진입 시 param 받아 `.tit__param01` 텍스트 매칭으로 해당 렌탈사 `<li>` 찾아 clone → main content 최상단에 노란 강조 박스로 prepend + smooth scrollIntoView. 헤더: '📌 지금 보신 제품의 렌탈사 **[렌탈사명]** 제휴카드입니다'. (v0.5.67) **runAll 의존 폐기** — IIFE 진입 즉시 + DOMContentLoaded + setTimeout 4단계로 독립 실행. runAll의 다른 함수 throw 영향 차단. (v0.5.68) production용 cleanup — debug marker 제거. Playwright 3개 렌탈사(교원웰스·청호나이스·코웨이) 검증 모두 통과.
- v0.5.69 (2026-05-28): **🏁 frontend 완료 1차 마일스톤 — 상담신청 modal (4자리 코드 + 상담사 직통번호 안내)**. 상담신청 버튼 클릭 → backdrop modal + spinner '상담사 배정 중' (900ms) → 응답 화면: '✓ 상담사 배정 완료' + 담당 상담사명 + 4자리 코드(`#ffd000` border 디지트 박스) + '전화 연결 후 위 코드를 알려주세요' + `[📞 1577-9469 통화 연결]` 파란 grad CTA (tel: link) + '유효시간 30분' + mock 알림. 닫기 트리거 3종 (× / backdrop / ESC). admin2 연동 — `window.__bjConsultApiUrl` 설정 시 자동 fetch POST `/api/consult/assign`, 실패 시 mock fallback. **endpoint·도메인 정해지면 1줄 설정으로 즉시 실 동작.** GitHub `f23da19` commit에 git note `🏁 frontend 완료 1차` 첨부.
- v0.6.9 (2026-06-01): **모바일 aside 메뉴 로고 축소 + 헤더/aside 로고 KO/EN cross-fade 정식화 + 카테고리바 간격 축소** (billyjo-inject `f9d1ffe`). (1) 모바일 사이드 슬라이드 메뉴 로고(`.aside__top .top__logo img`)가 너무 커서 `@media(max-width:768px)`에서 `width:92px`로 축소. (2) 로고 cross-fade를 헤더(모듈 B `alternateBillyjoLogo`)에 더해 **전 페이지 공통 aside 메뉴 로고에도 적용**(모듈 A 신규 IIFE `billyjoAsideLogo`) — admin2 호스팅 `billyjo-ko.png`·`billyjo-en.png`를 JS setInterval(2초) opacity 토글로 번갈아 노출, 스킨 지연 대비 400ms×15 재시도. 절대 규칙 #30 inject.js 적용 surface 섹션 신설. (3) 모바일 상단 카테고리바(모듈 A 헤더 리디자인의 `.category__wrap`, 규칙 #20의 `.mobile__gnb` 스와이프 바와는 별개) gap `16px→9px`, padding `12px→10px` 축소(스크롤 헤더 클론 `.bj-sh-cat`도 동일) — 사용자 피드백 "메뉴 간 간격 조금 줄일 것".
- v0.7.x (2026-06-02): **헤더/모달 회귀·침범 일괄 fix + 절대 규칙 #21(e)·#30 positioning·#31 신설** (billyjo-inject `52e8e76`→`6d4c117`). (1) **상담 모달 가로 스크롤 + CTA 중앙정렬** (`52e8e76`): `.bj-card` 자식들에 box-sizing 없어 `width:100%`/`flex:1` + padding/border가 카드 폭 초과 → `overflow-y:auto`가 `overflow-x`도 auto로 계산해 가로 스크롤 + CTA 중앙정렬 틀어짐. 모달 전역 `box-sizing:border-box` + `.bj-card overflow-x:hidden`로 단일 원인 해소. 절대 규칙 #31 신설. (2) **PC 헤더 rightGroup이 카테고리 침범** (`f05f6e5`): PC 헤더 리디자인은 모듈 A(전 페이지) 실행인데 보호 CSS·`.bj-inj-*` 태깅이 모듈 B(prod_view 전용)에만 있어 비-상세 페이지에서 무방비. 모듈 A에서 클래스 직접 부여 + `≤1500/≤1024` 보호 CSS 전역화. (3) **모바일 헤더 로고 좌측정렬** (`96fa901`): 로고 absolute 중앙정렬이라 햄버거만 한 줄을 여백으로 낭비 → in-flow 좌측정렬 `[햄버거][로고]` + `.header__top` 로고 슬롯 비면 JS로 `a.logo` 이동. (4) **모바일 영문 로고가 햄버거 위에 뜨는 회귀** (`6d4c117`): (3)에서 준 `a.logo{position:static !important}`가 cross-fade의 인라인 `position:relative`를 override → EN 오버레이가 `.header__top` 기준으로 퍼짐. `position:relative`로 정정. 절대 규칙 #21(e)·#30 positioning context 섹션 신설. 사용자 확인 "잘 되었음".
- v0.7.0 (2026-06-01): **이벤트/고객센터 인라인 빨강(`#ff1818`) → 브랜드 파랑(`#0838F8`) 전역 통일** (billyjo-inject `80588ea`). v0.3.7에서 `a[style*="ff1818"]` 규칙을 만들었으나 모듈 B(prod_view 전용) CSS에만 있어 다른 페이지에선 여전히 빨강이었음. 모듈 A 전역 CSS의 인라인 컬러 오버라이드 그룹(`[style*="ff7a4c"]`...)에 `[style*="ff1818"]`/`[style*="FF1818"]` 추가 → '이벤트 / 고객센터' 등 전 페이지 공통 빨강 강조 링크를 브랜드 파랑으로 통일. 사용자 피드백 "끌씨 색상이 #ff1818인데 빌리조 블루로 변경".
- v0.8.0 (2026-06-07): **절대 규칙 #32 신설 — 모바일 가로 넘침 0 의무 (전역)**. 신혼부부 패키지 모달 2열 카드가 화면 밖으로 넘친 사고(nowrap 가격 줄 × grid `1fr` blowout, newlywed.js v3.4에서 수정) 계기. CSS 작성 규칙(grid `minmax(0,1fr)`·아이템 `min-width:0`·≤600px nowrap 금지·고정 px 폭 금지·이미지 max-width:100%) + 배포 전 320/360/390/430px 가로 넘침 검사 의무화. 사용자 지시: "앞으로 어떤 작업을 해도 모바일 화면에서 화면 가로 넘침 현상이 일어나지 않게 룰을 저장".
