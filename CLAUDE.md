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

1. **카드 슬롯**: 7개 슬롯 구조 (헤더 / 게이지+4지표 / 6스펙 / 기본정보+핵심 강점 / **이런 분에게 추천해요 Top 3** / 상세스펙 Step 1-3 [자세히 보기 접기] / **예상 최대 지원금ㆍ빌리조 혜택**). 추가·삭제·순서 변경 금지.
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
- v0.4.0 (2026-05-22): **하단 위젯 fallback 콘텐츠 자체 생성 (안 보이는 문제 해결)**. 사용자 피드백: "하단 상담신청 및 견적 위젯은 왜 안나오는거야?". 진단: `.prod_view_bot.card.mt40` 컨테이너는 있으나 `.bb-inner`(빌리조 inject.js가 생성하는 위젯 내용)이 정적 페이지에 없어서 enhanceBottomBar()가 핸들만 만들고 버튼은 생성 안 함 → 위젯이 거의 비어 보이는 현상. Fix: `enhanceBottomBar()`에 fallback 분기 추가 — `bbInner`가 null이면 `.bj-bar-fallback` 박스를 직접 생성 (`[월 렌탈료 라벨 + 가격] [장바구니][🎁 렌탈+사은품 신청][💬 상담신청]` 3버튼). 클릭 시 `window.shoporder()` 함수 있으면 호출, 없으면 `/html/dh_order/shop_cart` 또는 `/html/dh/counsel` URL로 이동. SVG 아이콘 상수화(SVG_GIFT/SVG_CHAT/SVG_CART). 모바일 ≤600px column stack + 버튼 flex:1로 풀폭, ≤400px 추가 압축. 절대 규칙 #25 갱신.
- v0.3.9 (2026-05-22): **카테고리 메뉴 텍스트 전용 스와이프로 단순화 + 좌측 정렬 명시**. 사용자 피드백: "카테고리 버튼을 빼고 텍스트만 옆으로 스와이프할 수 있게 + 잘리는 글씨 없도록 좌측 정렬". v0.3.8까지 pill 버튼 패턴이었으나 (1) 시각적으로 무겁고 (2) spacing 잡기 어렵고 (3) JS 자동 스크롤이 가운데 정렬해서 좌측 항목이 잘림. **텍스트 전용 + flex-start 좌측 정렬**로 단순화: `background:transparent; border:0; border-radius:0; padding:2px 0; font:500 13px; color:#555`. 활성(`.on`)은 `color:#0838F8; font-weight:800` + `::after` 하단 2px 파란 바(탭 형태). 자동 스크롤 JS 변경: 가운데 정렬 → minimal scroll (활성이 화면 밖일 때만 좌측 20px로 이동, 이미 보이면 scrollLeft 변경 안 함). 좌측 fade(14px) + 우측 fade(32px) 그라데이션으로 스크롤 가능 신호. 절대 규칙 #20 갱신.
- v0.3.8 (2026-05-22): **카테고리 spacing 축소 + 자동 스크롤 + rental-terms ⓘ 툴팁**. (1) `.category__wrap` spacing 축소: padding 8/12→6/10px, gap 6→4px, 항목 padding 6/12→5/10px, font 12.5→11.5px, border-radius 999→14px — 한 화면에 더 많은 카테고리 노출. (2) **자동 스크롤 정렬 JS**: `alignCategoryScroll()` — `.on` 활성 카테고리가 있으면 가운데로 스크롤, 없으면 `scrollLeft:0` 고정 (모바일 기본 스크롤 위치 표류 방지). DOMContentLoaded + setTimeout [200, 600, 1500] 트리거. (3) **약정 기간·의무 사용 기간 ⓘ 툴팁 추가**: rental-terms 라벨 옆에 help 툴팁 인라인 배치. 약정 기간 = 전체 계약 기간, 의무 사용 기간 = 위약금 부과 최소 기간 설명. `.rt-r { align-items:center }`, `.rt-l { display:inline-flex; gap:3px }`. inject.js에는 `addRentalTermsHelp()` 동적 주입 함수로 실서버 카드 HTML에 마크업 없어도 자동 추가. 사용자 피드백 3건 ("주방가전 왼쪽 화면 밖으로 넘어감 + spacing 너무 넓음 + 약정/의무사용 기간에 ⓘ 추가") 일괄 대응.
- v0.3.7 (2026-05-22): **모바일 4종 일괄 정리**. (1) **검색바 명시 숨김**: `.search__wrap`이 `.top__right` 외 다른 위치에 렌더되는 경우 대비, `header.new-header .search__wrap, header.new-header form .search__wrap, header.new-header .bj-inj-right .search__wrap { display:none !important }` 안전망. 검색은 .m_search_popup으로 노출. (2) **`.category__wrap` 2줄 토글 → 1행 가로 스크롤 (절대 규칙 #20 갱신)**: `display:flex; flex-wrap:nowrap; overflow-x:auto; scrollbar-width:none; gap:6px`. 각 항목 pill 형태(원형 border-radius:999px, padding 6px 12px, font 12.5px 600), 활성 시 브랜드 파랑 채움. 우측 fade 그라데이션으로 스크롤 가능 신호. 이전 v0.2.3의 ▼ 토글 JS 폐기 — 1행 스크롤이 더 직관적. (3) **`#ff1818` 빨강 강조 → `#0838F8` 브랜드 파랑 통일**: `a[style*="ff1818"] { color:#0838F8 !important }` — 이벤트/고객센터 등 산발적 빨강 강조를 브랜드 톤으로 정리. (4) **`.g-d` 평가없음 배지 높이 통일**: `display:inline-flex; align-items:center; line-height:1.2; font-size:12px` 추가 — 이전 default `display:inline` + line-height 미지정으로 다른 `.grade-badge`보다 키가 컸음. 사용자 피드백 4건 일괄 대응.
- v0.3.6 (2026-05-21): **모바일 헤더 로고-이벤트 버튼 겹침 픽스**. 사용자 피드백: "렌탈 빌리조 로고에 이벤트/기획전 바로가기 버튼이 겹쳐 보여". 원인: 로고 이미지가 `width:auto`라 intrinsic 폭이 클 경우 [햄버거]+[로고]+[아이콘리스트] 합계가 viewport를 초과, `flex-wrap:nowrap`이라 줄바꿈 안 되고 겹침 발생. Fix: (1) `.logo { flex:0 1 auto; max-width:38vw; overflow:hidden }` + `.logo img { max-width:100%; height:26px; object-fit:contain }` — 로고 폭을 viewport의 38% 이하로 제한. (2) `ul#bj-header-icons { flex:0 1 auto; min-width:0; gap:6px }` — 아이콘 리스트 shrink 허용 (이전 `flex:0 0 auto`). (3) 이벤트 링크 폰트 10.5→10px, padding 4/7→3/6px, `max-width:38vw; text-overflow:ellipsis`로 잘림. (4) `.header__top { overflow:hidden; padding:10/14→8/12px }` 안전망. (5) 협소 폭 단계적 축소: ≤400px 이벤트 28vw·로고 32vw·아이콘 24px / ≤360px iPhone SE 이벤트 max-width:90px·아이콘 18px. 절대 규칙 #21 모바일 사양 갱신. 검증 페이지: https://billyjo-header-layouts.vercel.app/final.html
- v0.3.5 (2026-05-21): **`.help-pop` ⓘ 툴팁 모바일 sheet 전환 + 외부 탭 자동 닫힘**. 사용자 피드백: "필터종류 (?) 클릭해도 글씨가 화면 영역 밖으로 넘어가". 원인: `.help-pop`이 `.sc` 셀(모바일 2-col 그리드, ~140px 폭) 안에서 `position:absolute; width:220px; left:50%; transform:translateX(-50%)`로 떠 있어 셀 폭보다 넓은 팝업이 viewport 밖으로 넘침. Fix: PC는 absolute 유지하되 `max-width:calc(100vw - 32px)` 안전 가드 + 폰트 11→12px·width 220→240px·padding 8/10→10/12px·`word-break:keep-all`로 한글 정리. 모바일(≤600px)은 `position:fixed; left:12px; right:12px; bottom:96px; transform:none; width:auto; max-width:none`로 viewport 하단 sheet — sticky 위젯 위에 위치, slide-up 애니메이션. 닫기 안내("ⓘ 아이콘을 다시 누르면 닫힙니다") 자동 추가. JS로 외부 탭 시 자동 닫힘 + 새 help 열릴 때 다른 help 자동 닫힘 (1개만 열림 보장). 절대 규칙 #14 도움말 사양에 모바일 sheet 패턴 추가 필요.
- v0.3.4 (2026-05-21): **카드 너비 확장 + SLOT 7 모바일 정리**. (1) `.wide-inner { max-width:1480px }` (기본 1200px → 1480px) — 빌리조 사이트가 좁게 잡혀 있어 카드가 좁아 보이는 문제. 좌우 패딩 PC 24px / 태블릿 16px / 모바일 10px. `.card { padding:24px 26px 20px }` (기본 22px → 26px 좌우 확장). (2) **SLOT 7 (.gift-r) 모바일 column 레이아웃**: 기존 `flex + justify-content:space-between + align-items:center + text-align:right`이 모바일에서 긴 한글 값 ("6개월 무상 A/S + 패키지 추가 시 월 2,000원 할인") 줄바꿈을 우측 정렬한 채 처리하여 어색. ≤600px에서 `flex-direction:column; align-items:flex-start; gap:6px` + `.gift-v { text-align:left; width:100% }`로 라벨 위·값 아래 좌측 정렬. (3) **`.gift-v` `word-break:keep-all`** 한글 어절 단위 줄바꿈 강제 (음절 분해 방지). (4) `.gift-r` 사이 dashed border-top 추가 — 3행 구분 명확화. 사용자 피드백: "상세페이지 모든 카드 너비 좀 더 넓게 + 예상 최대 지원금·빌리조 혜택·제조사 프로모션 영역 모바일 줄바꿈 이상" → 위 패치로 일괄 대응.
- v0.3.3 (2026-05-21): **모바일 비교표 overflow 픽스 (절대 규칙 #24 보강)**. 사용자 피드백: "필터 종류 자세히 보기 누르면 모바일 화면에서 화면 옆으로 삐져나가서 테이블이 보이지 않아". 원인: flex 자식의 default `min-width:auto`가 자식(table)의 min-content 폭을 부모로 전이 → `.spec-row`·`.spec-detail-toggle[open]`·`.filter-table-wrap` 모두 부모 폭 초과 확장. Fix: 세 layer 모두 `min-width:0; max-width:100%; box-sizing:border-box` 명시. 모바일 표 `min-width:380→280px` 축소 (iPhone SE 320px 호환), 극협소(≤360px) `min-width:260px`. `.step-details` 모바일 padding-left 14px + `.spec-detail-toggle[open]` 좌우 -6px margin으로 표 가용 폭 추가 확보. 표 헤더 폰트 10.5px·"이 제품" 소라벨 8.5px·`white-space:normal; line-height:1.3`로 좁은 헤더에서 자연 줄바꿈. `-webkit-overflow-scrolling:touch`로 iOS 모멘텀 스크롤. 절대 규칙 #24 모바일·flexbox overflow 섹션 신설.
- v0.3.2 (2026-05-21): **모바일 헤더 3개 이슈 일괄 픽스**. (1) PC GNB 카테고리 메뉴(`.new-gnb__wrap`·`.new-gnb`)가 모바일에서 노출되던 문제 → `@media (max-width:768px)` 명시 `display:none`. inject.js의 `.mobile__gnb`로 대체 노출되므로 PC GNB는 불필요. (2) 이벤트/기획전 주황 버튼이 빌리조 로고와 겹치던 문제 → `.header__top { gap:0 }` + 햄버거 `margin-right:5px` + 로고 `flex:0 0 auto` + 우측 아이콘 그룹 `margin-left:auto`로 [햄버거-5px-로고-자유공간-아이콘들] 정렬 명시화. (3) 하단 fixed 위젯이 여전히 안 보이던 문제 → CSS specificity (0,0,3,0)이 v0.2.4의 (0,1,4,0) 룰에 밀려 일부 속성 override 실패 가능성 발견. `body #container .wide-inner > .prod_view_bot.card.mt40` 더블 selector로 동급 specificity + cascade 후순 + JS에서 `wrapper.style.cssText`로 inline `position:fixed; bottom:0; left:0; right:0; z-index:99999 !important` 강제 fallback. JS도 `.bb-inner` 부재 시에도 동작 (제품명·가격 페이지 내 다른 위치에서 fallback 추출). 절대 규칙 #21·#25 갱신. 사용자 피드백: "1. 모바일에서 .new-gnb 영역 제거, 2. 이벤트 버튼이 로고와 겹치지 않게 햄버거 우측 5px, 3. 하단 sticky widget 여전히 노출 안 됨" → 위 세 패치로 일괄 대응.
- v0.3.1 (2026-05-21): **하단 위젯 sticky → fixed 정정 + SLOT 5 페르소나 폰트 +35% 확대**. (1) v0.3.0의 `position:sticky; bottom:0`이 `.wide-inner` 컨테이닝 블록 안에서만 동작해서 페이지 끝쪽 위젯이 실제로 sticky 효과를 못 보이는 문제 발견 → `position:fixed; left:50%; transform:translateX(-50%); width:100%; max-width:1500px; z-index:9999`로 정정. 펼침 max-height 1000px → 520px + 내부 `overflow-y:auto`로 콘텐츠 길면 위젯 내 스크롤. (2) 사용자 피드백 "이런 분에게 추천해요 폰트도 1up" → SLOT 5 페르소나 카드 일괄 +35% 확대 (Step 폰트와 동일 스케일): `.rec-p-title` 12→15.5px Bold · `.p-d` 11→13.5px · `.feat-btn` 10.5→12px · `.rec-p-level` 10.5→12.5px · `.p-top i` 18→22px · `.p` padding 11/12→14/15px. 절대 규칙 #23·#25 갱신. 검증: https://billyjo-header-layouts.vercel.app/final.html.
- v0.3.0 (2026-05-21): **하단 sticky 위젯(`.bb-inner`) 정식화**. 빌리조 inject.js가 `.prod_view_bot.card.mt40`에 렌더하는 렌탈사 비교/구매 위젯을 (1) `position:sticky; bottom:0`로 viewport 하단 고정, (2) `▾▴` 폴딩 토글 + 핸들 탭으로 펼침/접힘, (3) "렌탈 신청"을 **"렌탈+사은품 신청"**(선물박스 아이콘, 전화기 아이콘 폐기)으로 변경, (4) **"상담신청"** 보조 액션 버튼 신설. 핸들에 grip indicator + 제품명 + 대표 가격 노출. 접힘 시 `max-height:64px`만 남아 본문 가독성 보존. JS는 inject.js 결과 DOM에 MutationObserver + setTimeout 다중 트리거로 후처리. 절대 규칙 #25 신설. 사용자 피드백: "이 영역이 스크롤을 위로할 때 유저에게 출력되는데 부자연스럽다 + 화면 탭으로 열고 닫기 + 렌탈 신청을 사은품 강조로 + 상담신청 버튼 추가" → 위 패턴으로 일괄 대응. 검증: https://billyjo-header-layouts.vercel.app/final.html.
- v0.2.9 (2026-05-21): **카테고리 선택형 스펙 비교표 (2단계 토글) 신설**. SLOT 6 Step 1-3 내부의 1-of-N 카테고리 스펙(필터 종류·살균 방식·컴프레서·매트리스 구조 등)을 단순 pill 그룹에서 2단계 progressive disclosure 패턴으로 격상: (1) Step "자세히 보기"로 라벨 노출 (예: "필터 종류: UF 중공사막"), (2) "다른 필터와 비교" pill 클릭으로 3-4 컬럼 비교표 전개. 선택 컬럼 브랜드 파랑 강조, 비선택 회색, 평가없음(`.ft-na`) 회색 채움. 다중 선택·수치형 스펙은 pill 유지. 절대 규칙 #24 신설. 검증: F01 정수기(필터 종류·살균 방식 평가없음 케이스) + F02 비데·F03 공조·F05 냉장·F11 매트리스 5개 패밀리 갤러리 검토 → 패턴 범용성 확인. 사용자 피드백: "표로 보여주면 좋겠다 + 자세히 보기 눌러야 비교표 나오게" → 1단계 토글(filter_table.html)과 2단계 토글(filter_nested.html) 비교 후 후자 채택. 검증 페이지: https://billyjo-header-layouts.vercel.app/filter_nested.html · 5패밀리 갤러리 .../filter_table_examples.html.
- v0.2.7 (2026-05-21): **Hero 재배치 (Option C) + Step 폰트 +35% 정식 채택**. (1) **SLOT 1·2 이전**: 제품명/모델 메타와 270° SVG 게이지+4지표를 `.prod_view_top.right`(이미지+가격 영역)로 이동해 hero 1권 종합. 첫 화면에 평가 결과까지 노출 → 의사결정 가속. AI 카드 본체는 SLOT 3-7만 표시. `.head/.summary/.ai-card-tag` 모두 숨김. 비교 단계에서 Option A(50%폭 삽입)와 Option B(시각 융합)도 검토했으나, A는 v0.2.4 풀폭 결정과 충돌하고 B는 시각 효과만 살리는 데 그쳐 정보 밀도가 부족 → C 채택. (2) **레이아웃 안전화**: 빌리조 `.prod_view_top` float→flex 변환 필수 (`.right` 컬럼이 hero summary 추가로 길어지면 float 컨테이너가 enclose 못해 AI 카드와 겹침/잘림 발생). (3) **CSS 변수 스코프 복원**: SVG 게이지가 `#ai-card-root` 스코프 안 변수를 사용하므로 hero 위치(`.prod_view_top .right`)에 동일 변수 재정의 필수 — 누락 시 게이지 stroke·letter 색 사라짐. (4) **SLOT 6 Step 폰트 +35% 확대**: `.step-n` 26px / `.step-title` 16px / `.step-sum` 14px 표준. 소폭(+20%)·강조(+55%) 변형 검토 후 중폭이 가독성·컴팩트 균형점. (5) **`.prod_view_bot.card.mt40` 렌탈사 비교 위젯 노출 유지**: inject.js가 내부에 `.bb-inner` 동적 렌더 — 위치·DOM 그대로. 절대 규칙 #1 유지(7슬롯) + #22·#23 신설. 검증 페이지: `billyjo_10914_actual_v023.html` (canonical = final.html과 동일 상태) · 외부 공개 https://billyjo-header-layouts.vercel.app/final.html.
