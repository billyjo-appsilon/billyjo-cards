/*!
 * billyjo-detailcard v0.3.9 — 상세페이지 카드 클라이언트 패치
 * https://github.com/billyjo-appsilon/billyjo-detailcard
 *
 * 적용 페이지: /html/dh_prod/prod_view/*  (제품 상세 페이지)
 * 의존성: 기존 billyjo-inject 스크립트 (헤더 재구성·이벤트 배너 분리 처리)가 먼저 로드된 상태를 전제로 함.
 *
 * 포함 패치 (v0.3.9 기준):
 *   - 절대 규칙 #14: 6-8칸 스펙요약 + ⓘ 도움말 (모바일 sheet 전환, v0.3.5)
 *   - 절대 규칙 #21: 좁은화면 헤더 (inject.js 결과 DOM 안정 클래스 부여 + 모바일 1행 정렬 + .new-gnb 숨김 + 햄버거 5px)
 *   - 절대 규칙 #22-23: Hero 재배치/Step 폰트/페르소나 폰트 (AI 카드 마크업 존재 시에만 활성)
 *   - 절대 규칙 #24: 카테고리 선택형 스펙 2단계 토글 + flexbox overflow 안전 (v0.3.3)
 *   - 절대 규칙 #25: 하단 fixed 위젯 (sticky→fixed, ▾/▴ 폴딩, 렌탈+사은품·상담신청 버튼)
 *   - v0.3.4: .wide-inner max-width 1480px 확장, SLOT 7 모바일 column 레이아웃
 *   - v0.3.5: .help-pop 모바일 viewport sheet 전환, 외부 탭 자동 닫힘 JS
 *   - v0.3.6: 모바일 로고 max-width 제한 + 아이콘 리스트 shrink 허용 (로고-이벤트 겹침 해결)
 *   - v0.3.7: 모바일 검색바 명시 숨김 + 카테고리 1행 가로스크롤(룰북 #20 갱신) + 빨강→파랑 통일 + .g-d 높이 통일
 *   - v0.3.8: 카테고리 spacing 축소 + 자동 스크롤 정렬 + 약정/의무사용 기간 ⓘ 툴팁 동적 주입
 *   - v0.3.9: 카테고리 텍스트 전용 스와이프 (pill 폐기) + 좌측 정렬 + 활성 굵게/파랑+밑줄
 *   - 공통: 햄버거 중복 제거, 제품 썸네일 1px 회색 테두리
 *
 * AI 카드 콘텐츠 자체는 별도 backend 파이프라인에서 사전 생성되어 제품별 HTML에 주입되어야 함.
 * 본 스크립트는 카드가 있으면 격상시키고, 없으면 패치만 적용 (안전).
 */
(function(){
  'use strict';

  // 페이지 가드 — 제품 상세에서만 실행
  if (!/\/html\/dh_prod\/prod_view\//.test(location.pathname)) return;

  // 중복 로드 방지
  if (window.__bjDetailcardLoaded) return;
  window.__bjDetailcardLoaded = true;

  // ─────────────────────────────────────────────────────────────────────────
  // 1) CSS 주입
  // ─────────────────────────────────────────────────────────────────────────
  var CSS = [
    /* === 공통: 모바일 헤더 가림 방지 (header:not(.bj-ready) opacity:0 보호 룰 무력화) === */
    'header.new-header.new-header{ opacity:1 !important; visibility:visible !important }',
    '@media (max-width:768px){',
    '  header.new-header.new-header,',
    '  header.new-header.new-header:not(.bj-ready){ opacity:1 !important; visibility:visible !important }',
    '}',

    /* === 공통: 햄버거 중복 제거 (.gnb__hamburger만 유지) === */
    '.new-gnb .gnb__all .hamburger__btn,',
    '.new-gnb__wrap .show-768.hide-default{ display:none !important }',

    /* === 공통: 제품 다중 이미지 썸네일 60×60 1px 회색 테두리 === */
    '.prod_img_small .prod_thumbs li a{',
    '  display:inline-block; border:1px solid #dfdfdf; box-sizing:border-box; line-height:0;',
    '}',
    '.prod_img_small .prod_thumbs li a img{ display:block }',

    /* === PC 좁은 폭 헤더 (1280px↓): inject.js rightGroup 자연 줄바꿈 === */
    '@media (max-width:1280px){',
    '  header.new-header > .bj-inj-row{',
    '    flex-wrap:wrap !important; padding:16px 20px !important;',
    '    row-gap:10px !important; column-gap:16px !important;',
    '  }',
    '  header.new-header > .bj-inj-row > .bj-inj-left{',
    '    flex:1 1 auto !important; min-width:0 !important;',
    '    flex-wrap:wrap !important; row-gap:10px !important;',
    '  }',
    '  header.new-header > .bj-inj-row > .bj-inj-right{',
    '    flex-shrink:1 !important; white-space:normal !important;',
    '    flex-wrap:wrap !important; margin-left:auto !important;',
    '    gap:12px !important; justify-content:flex-end !important;',
    '    align-items:center !important;',
    '  }',
    '  header.new-header .bj-inj-right .gnb__right{',
    '    position:static !important; top:0 !important; gap:10px !important;',
    '  }',
    '  header.new-header .bj-inj-right .search__wrap{ max-width:280px }',
    '  header.new-header .bj-inj-left{ overflow:visible }',
    '}',

    /* === ≤1024px: rightGroup 별도 행 분리 === */
    '@media (max-width:1024px){',
    '  header.new-header > .bj-inj-row{',
    '    flex-direction:column !important; align-items:stretch !important;',
    '  }',
    '  header.new-header > .bj-inj-row > .bj-inj-left{',
    '    width:100% !important; flex-wrap:wrap !important;',
    '  }',
    '  header.new-header > .bj-inj-row > .bj-inj-right{',
    '    width:100% !important; margin-left:0 !important;',
    '    justify-content:flex-end !important;',
    '    border-top:0.5px solid #eee; padding-top:10px;',
    '  }',
    '  header.new-header .bj-inj-right .search__wrap{',
    '    max-width:100%; flex:1 1 auto;',
    '  }',
    '  header.new-header .bj-inj-right .search__wrap input{',
    '    width:100%; box-sizing:border-box;',
    '  }',
    '}',

    /* === ≤768px 모바일 헤더: [햄버거] 5px [로고] auto [이벤트·검색·장바구니] === */
    '@media (max-width:768px){',
    '  header.new-header > #bj-top-banner,',
    '  body > #bj-top-banner{ display:none !important }',

    /* PC GNB 카테고리 메뉴는 모바일에서 명시 숨김 — inject.js가 .mobile__gnb로 별도 노출 */
    '  header.new-header .new-gnb__wrap,',
    '  header.new-header .new-gnb,',
    '  header.new-header li.bj-internet-li{ display:none !important }',

    '  header.new-header .wide-inner{',
    '    display:block !important; padding:0 !important; margin:0 !important;',
    '  }',
    '  header.new-header .header__top{',
    '    display:flex !important; align-items:center !important;',
    '    gap:0 !important; padding:8px 12px !important;',
    '    flex-wrap:nowrap !important; background:#fff !important;',
    '    border-bottom:1px solid #eee !important; position:relative !important;',
    '    min-width:0 !important; overflow:hidden;',
    '  }',
    '  header.new-header .header__top .gnb__hamburger{',
    '    flex:0 0 auto !important; margin:0 5px 0 0 !important;',
    '    cursor:pointer; padding:4px;',
    '  }',
    /* v0.3.6: 로고 max-width 제한 — intrinsic width 큰 경우 아이콘과 겹치는 문제 해결 */
    '  header.new-header .header__top .logo{',
    '    flex:0 1 auto !important; margin:0 !important;',
    '    min-width:0 !important; max-width:38vw !important;',
    '    overflow:hidden !important;',
    '  }',
    '  header.new-header .header__top .logo img{',
    '    height:26px !important; width:auto !important; max-width:100% !important;',
    '    display:block !important; object-fit:contain;',
    '  }',
    '  header.new-header .header__top .top__right{ display:none !important }',
    /* v0.3.7: 검색바(.search__wrap) 모바일에서 명시 숨김 — 검색 아이콘 클릭 시 .m_search_popup으로 노출 */
    '  header.new-header .search__wrap,',
    '  header.new-header form .search__wrap,',
    '  header.new-header .bj-inj-right .search__wrap{ display:none !important }',

    /* v0.3.9: 모바일 카테고리 메뉴 (.category__wrap) — 텍스트 전용 스와이프 (이전 pill 버튼 폐기) */
    '  .mobile__gnb .gnb__cateogry,',
    '  .mobile__gnb .gnb__cateogry nav{ background:#fff; border-bottom:1px solid #eee }',
    '  .mobile__gnb .gnb__cateogry{ position:relative }',
    /* 우측 fade */
    '  .mobile__gnb .gnb__cateogry::after{',
    '    content:""; position:absolute; right:0; top:0; bottom:1px;',
    '    width:32px; pointer-events:none; z-index:1;',
    '    background:linear-gradient(to right, rgba(255,255,255,0), #fff 70%);',
    '  }',
    /* 좌측 fade */
    '  .mobile__gnb .gnb__cateogry::before{',
    '    content:""; position:absolute; left:0; top:0; bottom:1px;',
    '    width:14px; pointer-events:none; z-index:1;',
    '    background:linear-gradient(to left, rgba(255,255,255,0), #fff 80%);',
    '  }',
    '  .mobile__gnb .gnb__cateogry .category__wrap{',
    '    display:flex !important; flex-wrap:nowrap !important;',
    '    overflow-x:auto !important; overflow-y:hidden !important;',
    '    -webkit-overflow-scrolling:touch;',
    '    scrollbar-width:none; -ms-overflow-style:none;',
    '    justify-content:flex-start !important; align-items:center !important;',
    '    padding:10px 16px 12px !important; gap:18px !important;',
    '    white-space:nowrap !important; line-height:normal !important;',
    '    height:auto !important; max-height:none !important;',
    '    text-align:left !important;',
    '  }',
    '  .mobile__gnb .gnb__cateogry .category__wrap::-webkit-scrollbar{ display:none }',
    /* 텍스트 전용 항목 — 배경·테두리·라운드 모두 제거 */
    '  .mobile__gnb .gnb__cateogry .category__wrap > a{',
    '    flex:0 0 auto !important;',
    '    display:inline-block !important;',
    '    padding:2px 0 !important; margin:0 !important;',
    '    font-size:13px !important; font-weight:500;',
    '    color:#555 !important;',
    '    background:transparent !important;',
    '    border:0 !important; border-radius:0 !important;',
    '    text-decoration:none !important; white-space:nowrap;',
    '    line-height:1.4 !important; position:relative;',
    '    transition:color 0.15s;',
    '  }',
    '  .mobile__gnb .gnb__cateogry .category__wrap > a:hover{',
    '    color:#0838F8 !important;',
    '  }',
    /* 활성 — 굵게 + 파랑 + 하단 짧은 바 */
    '  .mobile__gnb .gnb__cateogry .category__wrap > a.on{',
    '    color:#0838F8 !important; font-weight:800 !important;',
    '  }',
    '  .mobile__gnb .gnb__cateogry .category__wrap > a.on::after{',
    '    content:""; display:block !important;',
    '    position:absolute; left:0; right:0; bottom:-3px;',
    '    height:2px; background:#0838F8; border-radius:1px;',
    '  }',
    '  .mobile__gnb .gnb__cateogry .category__wrap > a:not(.on)::after{ display:none !important }',
    '  .mobile__gnb .gnb__cateogry .category__wrap > a.bj-internet-cat{ color:#555 !important }',
    /* v0.3.7: 인라인 빨강(#ff1818) 강조 링크 → 브랜드 파랑(#0838F8)로 통일 */
    '  a[style*="ff1818"],',
    '  a[style*="FF1818"],',
    '  a[style*="#ff1818"],',
    '  a[style*="#FF1818"]{ color:#0838F8 !important }',
    /* v0.3.8: rental-terms 라벨에 ⓘ 툴팁 인라인 배치 + .g-d 평가없음 배지 높이 통일 */
    '#ai-card-root .rt-r{ align-items:center !important }',
    '#ai-card-root .rt-l{',
    '  display:inline-flex !important; align-items:center !important; gap:3px !important;',
    '}',
    '#ai-card-root .rt-l .help{ margin-left:1px }',
    '#ai-card-root .rt-l .help summary{ font-size:11px; color:#999; padding:0 2px; cursor:pointer }',
    '#ai-card-root .g-d{',
    '  display:inline-flex !important; align-items:center !important; gap:6px !important;',
    '  line-height:1.2 !important; vertical-align:middle;',
    '  font-size:12px !important;',
    '}',
    /* v0.3.6: 아이콘 리스트 flex:0 1 auto로 shrink 허용 + min-width:0 */
    '  header.new-header .header__top > ul.inline_wrap.header_m_icon,',
    '  header.new-header .header__top > ul#bj-header-icons,',
    '  header.new-header ul#bj-header-icons{',
    '    display:flex !important; align-items:center !important;',
    '    gap:6px !important; margin:0 0 0 auto !important; padding:0 0 0 6px !important;',
    '    list-style:none !important;',
    '    flex:0 1 auto !important; flex-wrap:nowrap !important;',
    '    min-width:0 !important;',
    '  }',
    '  header.new-header ul#bj-header-icons li,',
    '  header.new-header .header__top ul.inline_wrap.header_m_icon li{',
    '    margin:0 !important; padding:0 !important; list-style:none !important;',
    '    display:inline-flex; align-items:center; flex:0 0 auto;',
    '  }',
    '  header.new-header ul#bj-header-icons li a{',
    '    display:inline-flex; align-items:center; line-height:1;',
    '  }',
    '  header.new-header ul#bj-header-icons li img{',
    '    height:20px !important; width:auto !important; display:block;',
    '  }',
    /* v0.3.6: 이벤트 링크 컴팩트화 + max-width로 잘림 */
    '  header.new-header ul#bj-header-icons li a[style*="ff3700"]{',
    '    white-space:nowrap; font-size:10px !important;',
    '    padding:3px 6px !important; line-height:1.2;',
    '    border-radius:4px !important;',
    '    max-width:38vw; overflow:hidden; text-overflow:ellipsis;',
    '  }',
    '}',
    /* v0.3.6: 협소 폭 단계적 축소 */
    '@media (max-width:400px){',
    '  header.new-header ul#bj-header-icons li a[style*="ff3700"]{',
    '    font-size:9.5px !important; padding:3px 5px !important;',
    '    max-width:28vw;',
    '  }',
    '  header.new-header .header__top .logo{ max-width:32vw !important }',
    '  header.new-header .header__top .logo img{ height:24px !important }',
    '}',
    '@media (max-width:360px){',
    '  header.new-header .header__top{ padding:8px 10px !important }',
    '  header.new-header ul#bj-header-icons{ gap:5px !important }',
    '  header.new-header ul#bj-header-icons li a[style*="ff3700"]{ max-width:90px }',
    '  header.new-header ul#bj-header-icons li img{ height:18px !important }',
    '}',

    /* === 하단 fixed 위젯 (.bb-inner 격상) === */
    /* specificity (0,1,4,0) 동급 + cascade 후순 */
    'body #container .wide-inner > .prod_view_bot.card.mt40,',
    '.prod_view_bot.card.mt40{',
    '  position:fixed !important;',
    '  bottom:0 !important;',
    '  left:0 !important; right:0 !important;',
    '  z-index:99999 !important;',
    '  background:#fff !important;',
    '  border:1px solid #dfdfdf !important;',
    '  border-bottom:0 !important;',
    '  border-radius:14px 14px 0 0 !important;',
    '  box-shadow:0 -8px 24px rgba(0,0,0,0.08) !important;',
    '  padding:0 !important;',
    '  margin:0 !important;',
    '  overflow:hidden !important;',
    '  max-height:520px !important;',
    '  transition:max-height 0.32s cubic-bezier(0.4, 0, 0.2, 1) !important;',
    '}',
    '@media (min-width:1500px){',
    '  body #container .wide-inner > .prod_view_bot.card.mt40,',
    '  .prod_view_bot.card.mt40{',
    '    left:50% !important; right:auto !important;',
    '    transform:translateX(-50%) !important;',
    '    width:100% !important; max-width:1500px !important;',
    '  }',
    '}',
    'body #container .wide-inner > .prod_view_bot.card.mt40.bj-bar-expanded,',
    '.prod_view_bot.card.mt40.bj-bar-expanded{ max-height:520px !important }',
    'body #container .wide-inner > .prod_view_bot.card.mt40.bj-bar-collapsed,',
    '.prod_view_bot.card.mt40.bj-bar-collapsed{ max-height:64px !important }',
    '.prod_view_bot.card.mt40.bj-bar-collapsed .card__top,',
    '.prod_view_bot.card.mt40.bj-bar-collapsed .card__tit,',
    '.prod_view_bot.card.mt40.bj-bar-collapsed .rantal_wrap,',
    '.prod_view_bot.card.mt40.bj-bar-collapsed .bb-left,',
    '.prod_view_bot.card.mt40.bj-bar-collapsed .bb-right-bottom{',
    '  display:none !important;',
    '}',
    '.prod_view_bot.card.mt40.bj-bar-expanded .bb-inner,',
    '.prod_view_bot.card.mt40 .bb-inner{',
    '  overflow-y:auto; max-height:calc(520px - 64px);',
    '}',

    /* 핸들 */
    '.bj-bar-handle{',
    '  display:flex; align-items:center; justify-content:space-between;',
    '  padding:16px 18px 10px; cursor:pointer; user-select:none;',
    '  background:linear-gradient(180deg, #fafafa 0%, #ffffff 100%);',
    '  border-bottom:0.5px solid #dfdfdf; gap:12px; position:relative;',
    '}',
    '.bj-bar-handle:hover{ background:#f5f5f5 }',
    '.bj-bar-handle::before{',
    '  content:""; position:absolute; top:6px; left:50%;',
    '  transform:translateX(-50%);',
    '  width:36px; height:4px; border-radius:2px;',
    '  background:#e0e0e0; pointer-events:none;',
    '}',
    '.bj-bar-handle-text{',
    '  font-family:"Pretendard","Apple SD Gothic Neo",sans-serif;',
    '  font-size:13px; font-weight:700; color:#2a2a2a;',
    '  flex:1 1 auto; min-width:0;',
    '  overflow:hidden; text-overflow:ellipsis; white-space:nowrap;',
    '  display:flex; align-items:center; gap:8px;',
    '}',
    '.bj-bar-handle-price{ color:#0838F8; font-weight:800; font-size:14px }',
    '.bj-bar-handle-toggle{',
    '  width:36px; height:24px; border-radius:6px;',
    '  background:transparent; border:1px solid #dfdfdf;',
    '  display:inline-flex; align-items:center; justify-content:center;',
    '  font-size:13px; color:#6a6a6a; cursor:pointer;',
    '  transition:all 0.2s; font-family:Arial, sans-serif; line-height:1;',
    '}',
    '.bj-bar-handle:hover .bj-bar-handle-toggle{',
    '  background:#e8edff; border-color:#0838F8; color:#0838F8;',
    '}',
    '.bj-bar-handle-toggle .bj-bar-chevron{',
    '  display:inline-block; transition:transform 0.25s;',
    '}',
    '.prod_view_bot.card.mt40.bj-bar-collapsed .bj-bar-chevron{',
    '  transform:rotate(180deg);',
    '}',

    /* bb-inner padding 조정 */
    '.prod_view_bot.card.mt40 .bb-inner{ padding:14px 18px 16px !important }',

    /* 렌탈+사은품 신청 버튼 */
    '.bb-btn-rent.bj-btn-rent-gift{',
    '  background:#0838F8 !important; color:#fff !important;',
    '  border:none !important;',
    '  display:inline-flex !important; align-items:center !important; gap:6px !important;',
    '  font-weight:700 !important;',
    '}',
    '.bb-btn-rent.bj-btn-rent-gift svg{ width:18px; height:18px; fill:currentColor }',

    /* 상담신청 버튼 */
    '.bj-btn-consult{',
    '  background:#fff !important; color:#0838F8 !important;',
    '  border:1px solid #0838F8 !important;',
    '  border-radius:8px !important; padding:10px 14px !important;',
    '  font-weight:700 !important; font-size:13.5px !important;',
    '  cursor:pointer !important;',
    '  display:inline-flex !important; align-items:center !important; gap:6px !important;',
    '  font-family:"Pretendard",sans-serif !important;',
    '  transition:background 0.15s;',
    '}',
    '.bj-btn-consult:hover{ background:#e8edff !important }',
    '.bj-btn-consult svg{ width:18px; height:18px; fill:currentColor }',

    /* body 하단 패딩 — fixed 위젯이 마지막 콘텐츠 가리지 않게 */
    'body{ padding-bottom:88px !important }',

    /* 모바일 컴팩트 */
    '@media (max-width:600px){',
    '  body{ padding-bottom:80px !important }',
    '  .bj-bar-handle{ padding:14px 14px 8px }',
    '  .bj-bar-handle-text{ font-size:12px }',
    '  .bj-bar-handle-price{ font-size:13px }',
    '  .bj-bar-handle-toggle{ width:34px; height:22px; font-size:12px }',
    '  .prod_view_bot.card.mt40 .bb-inner{ padding:12px 14px !important }',
    '  .bj-btn-consult{ padding:9px 11px; font-size:12.5px }',
    '  .bb-btn-rent.bj-btn-rent-gift{ font-size:13px }',
    '  .prod_view_bot.card.mt40.bj-bar-collapsed{ max-height:58px !important }',
    '}',

    /* === v0.3.4: 카드 너비 확장 (.wide-inner 1480px) === */
    '#container .wide-inner{',
    '  max-width:1480px !important; width:100% !important;',
    '  margin:0 auto !important;',
    '  padding-left:24px !important; padding-right:24px !important;',
    '  box-sizing:border-box !important;',
    '}',
    '@media (max-width:1023px){',
    '  #container .wide-inner{ padding-left:16px !important; padding-right:16px !important }',
    '}',
    '@media (max-width:600px){',
    '  #container .wide-inner{ padding-left:10px !important; padding-right:10px !important }',
    '}',

    /* === v0.3.3: 비교표 flexbox overflow 안전 (AI 카드 존재 시) === */
    '#ai-card-root .spec-compare .spec-row{',
    '  min-width:0; max-width:100%; box-sizing:border-box;',
    '}',
    '#ai-card-root .spec-compare .spec-detail-toggle[open]{',
    '  min-width:0; max-width:100%; box-sizing:border-box;',
    '}',
    '#ai-card-root .filter-table-wrap{',
    '  min-width:0; max-width:100%; width:100%; box-sizing:border-box;',
    '  -webkit-overflow-scrolling:touch;',
    '}',
    '@media (max-width:600px){',
    '  #ai-card-root .step-details{ padding-left:14px !important; padding-right:0 !important }',
    '  #ai-card-root .spec-compare .spec-detail-toggle[open]{',
    '    margin-left:-6px; margin-right:-6px;',
    '  }',
    '  #ai-card-root .filter-table{',
    '    font-size:11px !important; min-width:280px !important;',
    '  }',
    '  #ai-card-root .filter-table th, #ai-card-root .filter-table td{ padding:6px 3px !important }',
    '  #ai-card-root .filter-table thead th{',
    '    font-size:10.5px !important; white-space:normal; line-height:1.3;',
    '  }',
    '  #ai-card-root .filter-table tbody th{ font-size:10.5px !important }',
    '  #ai-card-root .filter-table thead th.ft-on small,',
    '  #ai-card-root .filter-table thead th.ft-na small{ font-size:8.5px !important }',
    '}',
    '@media (max-width:360px){',
    '  #ai-card-root .filter-table{ min-width:260px !important; font-size:10.5px !important }',
    '  #ai-card-root .filter-table th, #ai-card-root .filter-table td{ padding:5px 2px !important }',
    '}',

    /* === v0.3.4: SLOT 7 (.gift-r) 모바일 column 레이아웃 + 한글 자연 줄바꿈 === */
    '#ai-card-root .gift-r{ align-items:flex-start; flex-wrap:wrap }',
    '#ai-card-root .gift-v{ word-break:keep-all }',
    '#ai-card-root .gift-v strong{ word-break:keep-all }',
    '@media (max-width:600px){',
    '  #ai-card-root .gift{ padding:10px 12px !important }',
    '  #ai-card-root .gift-r{',
    '    flex-direction:column !important; align-items:flex-start !important;',
    '    gap:6px !important; padding:10px 0 !important;',
    '  }',
    '  #ai-card-root .gift-r + .gift-r{',
    '    border-top:0.5px dashed #dfdfdf; margin-top:2px;',
    '  }',
    '  #ai-card-root .gift-v{',
    '    text-align:left !important; width:100%; font-size:13px !important; line-height:1.65 !important;',
    '  }',
    '  #ai-card-root .gift-tag{ font-size:11.5px !important }',
    '}',

    /* === v0.3.5: .help-pop ⓘ 툴팁 모바일 sheet 전환 + 외부 탭 자동 닫힘 === */
    '#ai-card-root .help-pop{',
    '  max-width:calc(100vw - 32px) !important;',
    '  word-break:keep-all;',
    '}',
    '@media (max-width:600px){',
    '  #ai-card-root .help-pop{',
    '    position:fixed !important;',
    '    left:12px !important; right:12px !important;',
    '    top:auto !important; bottom:96px !important;',
    '    transform:none !important;',
    '    width:auto !important; max-width:none !important;',
    '    padding:14px 16px !important;',
    '    font-size:13px !important; line-height:1.65 !important;',
    '    border-radius:10px !important;',
    '    box-shadow:0 -8px 24px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05) !important;',
    '    z-index:100000 !important;',
    '    animation:bjHelpPopIn 0.2s ease-out;',
    '  }',
    '  #ai-card-root .help[open] .help-pop::after{',
    '    content:"ⓘ 아이콘을 다시 누르면 닫힙니다";',
    '    display:block;',
    '    margin-top:10px; padding-top:10px;',
    '    border-top:0.5px dashed #dfdfdf;',
    '    font-size:11px; color:#999;',
    '    text-align:center;',
    '  }',
    '}',
    '@keyframes bjHelpPopIn{',
    '  from{ opacity:0; transform:translateY(20px) }',
    '  to{ opacity:1; transform:translateY(0) }',
    '}'
  ].join('\n');

  function injectCSS(){
    if (document.getElementById('bj-detailcard-patch')) return;
    var style = document.createElement('style');
    style.id = 'bj-detailcard-patch';
    style.textContent = CSS;
    (document.head || document.documentElement).appendChild(style);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2) JS 시밍 — inject.js 결과 DOM 후처리
  // ─────────────────────────────────────────────────────────────────────────

  /* (a) 헤더 — bj-ready 강제 + leftGroup/rightGroup 안정 클래스 + 이벤트 링크 원복 */
  function tagHeaderDom(){
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
    restoreMobileEventLink();
  }

  function restoreMobileEventLink(){
    var banner = document.getElementById('bj-top-banner');
    if (!banner) return;
    var iconList = document.getElementById('bj-header-icons')
      || document.querySelector('ul.inline_wrap.header_m_icon');
    if (!iconList) { banner.remove(); return; }
    var bannerA = banner.querySelector('a');
    if (!bannerA) { banner.remove(); return; }
    var href = bannerA.getAttribute('href') || '';
    if (iconList.querySelector('a[href="' + href.replace(/"/g,'') + '"]')) {
      banner.remove(); return;
    }
    var li = document.createElement('li');
    var a = document.createElement('a');
    a.href = href;
    a.setAttribute('style', 'background-color:#ff3700;color:#fff;font-size:11px;font-weight:bold;padding:5px;border-radius:5px;');
    a.textContent = bannerA.textContent.trim();
    li.appendChild(a);
    iconList.insertBefore(li, iconList.firstChild);
    banner.remove();
  }

  /* (b) 하단 위젯 — CSS specificity 안전망 + 핸들 + 버튼 격상 */
  function forceFixedStyle(wrapper){
    wrapper.style.cssText = (wrapper.style.cssText || '') +
      ';position:fixed!important;bottom:0!important;left:0!important;right:0!important;' +
      'z-index:99999!important;margin:0!important;';
  }

  function enhanceBottomBar(){
    var wrapper = document.querySelector('.prod_view_bot.card.mt40');
    if (!wrapper || wrapper.dataset.bjBarEnhanced) return;

    forceFixedStyle(wrapper);
    wrapper.classList.add('bj-bar-expanded');

    var bbInner = wrapper.querySelector('.bb-inner');
    var prodName, priceEl;
    if (bbInner) {
      prodName = bbInner.querySelector('.bb-product-name');
      priceEl  = bbInner.querySelector('.bb-price') || bbInner.querySelector('.bb-month-pill .bb-month-price');
    }
    var nameText  = (prodName && prodName.textContent.trim()) ||
                    (document.querySelector('.prod_name b') && document.querySelector('.prod_name b').textContent.trim()) ||
                    '렌탈 신청';
    var priceText = (priceEl && priceEl.textContent.trim()) ||
                    (document.querySelector('.top_min_price b') && '월 ' + document.querySelector('.top_min_price b').textContent.trim() + '원') ||
                    '';

    // 핸들 삽입
    var handle = document.createElement('div');
    handle.className = 'bj-bar-handle';
    handle.setAttribute('role', 'button');
    handle.setAttribute('aria-label', '렌탈 신청 영역 펼치기/접기');
    handle.setAttribute('tabindex', '0');
    handle.innerHTML =
      '<div class="bj-bar-handle-text">' +
        '<span>' + nameText + '</span>' +
        (priceText ? '<span class="bj-bar-handle-price">' + priceText + '</span>' : '') +
      '</div>' +
      '<button type="button" class="bj-bar-handle-toggle" aria-label="펼치기/접기">' +
        '<span class="bj-bar-chevron">▾</span>' +
      '</button>';

    function toggle(){
      var collapsed = wrapper.classList.toggle('bj-bar-collapsed');
      wrapper.classList.toggle('bj-bar-expanded', !collapsed);
    }
    handle.addEventListener('click', toggle);
    handle.addEventListener('keydown', function(e){
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
    wrapper.insertBefore(handle, wrapper.firstChild);

    // 버튼 격상 (.bb-inner 존재 시만)
    if (bbInner) {
      var rentBtn = bbInner.querySelector('.bb-btn-rent');
      if (rentBtn) {
        rentBtn.classList.add('bj-btn-rent-gift');
        rentBtn.innerHTML =
          '<svg viewBox="0 0 24 24" aria-hidden="true">' +
            '<path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"/>' +
          '</svg>렌탈+사은품 신청';
      }
      var rightTop = bbInner.querySelector('.bb-right-top');
      if (rightTop && !rightTop.querySelector('.bj-btn-consult')) {
        var consult = document.createElement('button');
        consult.type = 'button';
        consult.className = 'bb-btn bj-btn-consult';
        consult.innerHTML =
          '<svg viewBox="0 0 24 24" aria-hidden="true">' +
            '<path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>' +
          '</svg>상담신청';
        consult.addEventListener('click', function(){
          // TODO: 실서비스 상담 폼 URL로 교체
          window.location.href = '/html/dh/counsel';
        });
        rightTop.appendChild(consult);
      }
    }

    wrapper.dataset.bjBarEnhanced = '1';
  }

  function preEnhance(){
    var wrapper = document.querySelector('.prod_view_bot.card.mt40');
    if (wrapper) forceFixedStyle(wrapper);
  }

  /* (c) v0.3.5: .help (ⓘ 툴팁) 외부 탭 자동 닫힘 + 1개만 열림 보장 */
  function setupHelpClose(){
    if (window.__bjHelpCloseSetup) return;
    window.__bjHelpCloseSetup = true;
    document.addEventListener('click', function(e){
      var opened = document.querySelectorAll('#ai-card-root details.help[open]');
      opened.forEach(function(d){
        if (!d.contains(e.target)) d.removeAttribute('open');
      });
    }, true);
    document.addEventListener('toggle', function(e){
      var t = e.target;
      if (t && t.tagName === 'DETAILS' && t.classList.contains('help') && t.open) {
        document.querySelectorAll('#ai-card-root details.help[open]').forEach(function(d){
          if (d !== t) d.removeAttribute('open');
        });
      }
    }, true);
  }

  /* (d) v0.3.9: .category__wrap 자동 스크롤 정렬 — 활성(.on)이 보이는 영역 안에 오게,
       없으면 좌측(scrollLeft:0) 고정. 좌측 정렬 유지 (가운데 정렬 금지). */
  function alignCategoryScroll(){
    var wrap = document.querySelector('.mobile__gnb .gnb__cateogry .category__wrap');
    if (!wrap || wrap.dataset.bjCatAligned) return;
    var active = wrap.querySelector('a.on');
    if (active) {
      var wrapRect = wrap.getBoundingClientRect();
      var aRect = active.getBoundingClientRect();
      var leftEdge = 20;
      var rightEdge = wrap.clientWidth - 32;
      if (aRect.right - wrapRect.left > rightEdge) {
        wrap.scrollLeft = (aRect.left - wrapRect.left) - leftEdge;
      } else if (aRect.left - wrapRect.left < leftEdge) {
        wrap.scrollLeft = 0;
      }
    } else {
      wrap.scrollLeft = 0;
    }
    wrap.dataset.bjCatAligned = '1';
  }

  /* (e) v0.3.8: 약정 기간·의무 사용 기간 라벨에 ⓘ 툴팁 동적 주입 (실서버에서 AI 카드 HTML에
       해당 마크업 없을 수 있어 fallback 처리) */
  var TERM_HELP = {
    '약정 기간': '<strong>약정 기간</strong>은 렌탈 계약의 전체 기간입니다. 이 기간 동안 매월 렌탈료를 납부하며, 종료 시점에 제품 소유권이 이전(또는 반환)됩니다. 약정을 채워야 광고된 월 렌탈료가 유지됩니다.',
    '의무 사용 기간': '<strong>의무 사용 기간</strong>은 위약금이 부과되는 최소 기간입니다. 이 기간이 지난 뒤 해지하면 별도 위약금 없이 자유로운 해지가 가능합니다. 약정 기간보다 짧은 게 일반적이며, 짧을수록 사용자에게 유리합니다.'
  };
  function addRentalTermsHelp(){
    var rows = document.querySelectorAll('#ai-card-root .rental-terms .rt-r .rt-l');
    rows.forEach(function(label){
      if (label.dataset.bjHelpAdded) return;
      var key = label.textContent.trim();
      if (!TERM_HELP[key]) return;
      var details = document.createElement('details');
      details.className = 'help';
      details.innerHTML =
        '<summary aria-label="' + key + ' 설명"></summary>' +
        '<div class="help-pop">' + TERM_HELP[key] + '</div>';
      label.appendChild(document.createTextNode(' '));
      label.appendChild(details);
      label.dataset.bjHelpAdded = '1';
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3) 오케스트레이션
  // ─────────────────────────────────────────────────────────────────────────
  function runAll(){
    injectCSS();
    tagHeaderDom();
    enhanceBottomBar();
    setupHelpClose();
    alignCategoryScroll();
    addRentalTermsHelp();
  }

  injectCSS();      // CSS 즉시 — head 있으면
  preEnhance();     // 위젯 인라인 강제

  if (document.readyState !== 'loading') runAll();
  document.addEventListener('DOMContentLoaded', runAll);
  [50, 100, 200, 400, 600, 1200, 1500, 3000, 5000].forEach(function(d){
    setTimeout(runAll, d);
  });

  if (window.MutationObserver) {
    var obs = new MutationObserver(function(){ runAll(); });
    try { obs.observe(document.documentElement, { childList:true, subtree:true }); } catch(e){}
    setTimeout(function(){ obs.disconnect(); }, 8000);
  }
})();
