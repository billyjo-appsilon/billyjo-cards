/*!
 * billyjo-detailcard v0.4.0 — 상세페이지 카드 클라이언트 패치
 * https://github.com/billyjo-appsilon/billyjo-detailcard
 *
 * 적용 페이지: /html/dh_prod/prod_view/*  (제품 상세 페이지)
 * 의존성: 기존 billyjo-inject 스크립트 (헤더 재구성·이벤트 배너 분리 처리)가 먼저 로드된 상태를 전제로 함.
 *
 * 포함 패치 (v0.4.0 기준):
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
 *   - v0.4.0: 하단 위젯 fallback 콘텐츠 자체 생성 (.bb-inner 없어도 가격+장바구니+렌탈+사은품+상담신청 3버튼 노출)
 *   - 공통: 햄버거 중복 제거, 제품 썸네일 1px 회색 테두리
 *
 * AI 카드 콘텐츠 자체는 별도 backend 파이프라인에서 사전 생성되어 제품별 HTML에 주입되어야 함.
 * 본 스크립트는 카드가 있으면 격상시키고, 없으면 패치만 적용 (안전).
 */
(function(){
  'use strict';

  // v0.5.1: 신혼부부 패키지 — 플로팅 fab 폐기, 상단 카테고리바(.category__wrap)에 항목 추가.
  (function injectNewlywedInCategoryBar(){
    function getCommit(){
      try {
        var src = (document.currentScript && document.currentScript.src) || '';
        if (!src) {
          var scripts = document.getElementsByTagName('script');
          for (var i = scripts.length - 1; i >= 0; i--) {
            if (/billyjo-detailcard@/.test(scripts[i].src)) { src = scripts[i].src; break; }
          }
        }
        var m = src.match(/billyjo-detailcard@([0-9a-f]{7,40}|main)\//);
        return m ? m[1] : 'main';
      } catch(e) { return 'main'; }
    }
    function tryInject(){
      /* 기존 floating fab이 있으면 제거 (v0.5.0 잔재 정리) */
      var old = document.querySelector('.bj-newlywed-floating');
      if (old) old.remove();
      /* 이미 카테고리바에 삽입됐으면 skip */
      if (document.querySelector('.bj-newlywed-cat')) return;
      var wrap = document.querySelector('.mobile__gnb .gnb__cateogry .category__wrap, .category__wrap');
      if (!wrap) return;

      var commit = getCommit();
      var modalJsUrl = 'https://cdn.jsdelivr.net/gh/billyjo-appsilon/billyjo-detailcard@' + commit + '/landing/newlywed.js';

      var link = document.createElement('a');
      link.className = 'bj-newlywed-cat';
      link.href = '#';
      link.innerHTML = '<span style="margin-right:3px">💍</span>신혼부부 패키지';
      /* 다른 카테고리 항목과 동일 시각, 단 브랜드 파랑 강조 */
      link.style.cssText = 'flex:0 0 auto;display:inline-flex;align-items:center;padding:2px 0;font:700 13px Pretendard,sans-serif;color:#0838F8;text-decoration:none;background:transparent;border:0;white-space:nowrap;cursor:pointer;line-height:1.4';
      link.onclick = function(e){
        e.preventDefault();
        if (typeof window.bjOpenNewlywedModal === 'function') {
          window.bjOpenNewlywedModal();
        } else if (!window.__bjNwLoading) {
          window.__bjNwLoading = true;
          var s = document.createElement('script');
          s.src = modalJsUrl;
          s.onload = function(){ if (window.bjOpenNewlywedModal) window.bjOpenNewlywedModal(); };
          document.head.appendChild(s);
        }
      };
      /* 첫 번째 위치에 삽입 (좌측 정렬, 가장 먼저 보이도록) */
      wrap.insertBefore(link, wrap.firstChild);
    }
    if (document.readyState !== 'loading') tryInject();
    document.addEventListener('DOMContentLoaded', tryInject);
    [200, 600, 1500, 3000].forEach(function(d){ setTimeout(tryInject, d); });
  })();

  // 모바일 universal CSS — 카테고리 바 + 헤더 햄버거 (룰북 #20·#21)
  (function injectMobileUniversalCSS(){
    if (document.querySelector('#bj-mobile-cat-style')) return;
    var st = document.createElement('style');
    st.id = 'bj-mobile-cat-style';
    st.textContent = [
      '@media (max-width:768px){',
      // (0) v0.5.1: 카테고리바 위 여백 제거 — .mobile__gnb·.gnb__cateogry 자체 margin/padding 0
      '  .mobile__gnb, .mobile__gnb .gnb__cateogry{',
      '    margin-top:0 !important; padding-top:0 !important;',
      '  }',
      '  .mobile__gnb .gnb__cateogry nav{',
      '    margin-top:0 !important; padding-top:0 !important;',
      '  }',
      // (1) 카테고리 바 — 1열 좌측 스와이프 (위 여백 6→2px 압축)
      '  .mobile__gnb .gnb__cateogry .category__wrap, .category__wrap{',
      '    display:flex !important; flex-wrap:nowrap !important;',
      '    overflow-x:auto !important; overflow-y:hidden !important;',
      '    -webkit-overflow-scrolling:touch;',
      '    scrollbar-width:none; -ms-overflow-style:none;',
      '    justify-content:flex-start !important; align-items:center !important;',
      '    padding:4px 16px 8px !important; gap:18px !important;',
      '    white-space:nowrap !important; line-height:normal !important;',
      '    height:auto !important; max-height:none !important;',
      '    text-align:left !important;',
      '    margin-top:0 !important;',
      '  }',
      '  .category__wrap::-webkit-scrollbar{display:none}',
      '  .category__wrap > a, .category__wrap > *{',
      '    flex:0 0 auto !important; white-space:nowrap !important;',
      '  }',
      // (2) 헤더 햄버거 + 로고 정렬 (룰북 #21) — specificity 강화
      '  header.new-header .header__top, header .header__top.header__top, body .header__top{',
      '    display:flex !important; align-items:center !important;',
      '    padding:8px 12px !important; gap:0 !important;',
      '    overflow:hidden !important;',
      '  }',
      '  header .gnb__hamburger.gnb__hamburger, body .gnb__hamburger{',
      '    margin-right:5px !important; flex:0 0 auto !important;',
      '    width:26px !important; height:22px !important;',
      '    position:relative !important; cursor:pointer; padding:0 !important;',
      '    background:none !important; border:0 !important;',
      '  }',
      // v0.5.1: 햄버거 3줄 강제 — billyjo 기본 아이콘이 2줄로 잘려보이는 문제 해결.
      // 기존 ::before/::after/배경 모두 무력화 후 3개 line을 box-shadow stack으로 그림.
      '  header .gnb__hamburger.gnb__hamburger > *, body .gnb__hamburger > *{ display:none !important }',
      '  header .gnb__hamburger.gnb__hamburger::before, body .gnb__hamburger::before{',
      '    content:""; display:block !important;',
      '    position:absolute !important; left:3px !important; top:4px !important;',
      '    width:20px !important; height:2.5px !important;',
      '    background:#222 !important; border-radius:2px !important;',
      '    box-shadow:0 7px 0 #222, 0 14px 0 #222 !important;',
      '  }',
      '  header .gnb__hamburger.gnb__hamburger::after, body .gnb__hamburger::after{',
      '    content:none !important; display:none !important;',
      '  }',
      '  .hamburger__btn{display:none !important}',
      '  header .logo.logo, body .logo{ flex:0 1 auto !important; max-width:38vw !important; overflow:hidden !important; }',
      '  header .logo img{ max-width:100% !important; height:26px !important; object-fit:contain !important; }',
      // (3) PC GNB 우측(.bj-inj-right) 모바일·태블릿 hide — 이벤트·고객센터·장바구니·search
      //     이미 위 헤더에 #bj-header-icons로 동일 기능 제공됨. 고객센터는 하단 상담버튼.
      '  .bj-inj-right, header .bj-inj-right, header.new-header .bj-inj-right{',
      '    display:none !important;',
      '  }',
      '  /* 우측 아이콘 그룹 shrink 허용 */',
      '  ul#bj-header-icons{ flex:0 1 auto !important; min-width:0 !important; gap:6px !important; margin-left:auto !important; }',
      // 협소(≤400px)
      '  @media (max-width:400px){',
      '    .logo{ max-width:32vw !important }',
      '    .logo img{ height:24px !important }',
      '  }',
      '}',
    ].join('\n');
    (document.head || document.documentElement).appendChild(st);
  })();
  // head 없을 수도 있어서 DOMContentLoaded에서 재시도
  document.addEventListener('DOMContentLoaded', function(){
    if (document.querySelector('#bj-mobile-cat-style')) return;
    var s2 = document.createElement('style');
    s2.id = 'bj-mobile-cat-style';
    s2.textContent = '@media (max-width:768px){.mobile__gnb .gnb__cateogry .category__wrap,.category__wrap{display:flex !important;flex-wrap:nowrap !important;overflow-x:auto !important;justify-content:flex-start !important;align-items:center !important;padding:10px 16px 12px !important;gap:18px !important;white-space:nowrap !important;height:auto !important}.category__wrap > *{flex:0 0 auto !important}}';
    document.head.appendChild(s2);
  });

  // 페이지 가드 — 제품 상세에서만 실행 (이하 prod_view 전용)
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
    '  transition:max-height 0.32s cubic-bezier(0.4, 0, 0.2, 1), bottom 0.38s cubic-bezier(0.2, 0.9, 0.3, 1) !important;',
    '}',
    /* AI 카드 미통과 / 사용자 수동 숨김 — 화면 밖으로 slide */
    'body #container .wide-inner > .prod_view_bot.card.mt40.bj-bar-slide-hidden,',
    '.prod_view_bot.card.mt40.bj-bar-slide-hidden,',
    '#billyjo-bottom-bar.bj-bar-slide-hidden{',
    '  bottom:-280px !important;',
    '  pointer-events:none !important;',
    '  transition:bottom 0.38s cubic-bezier(0.2,0.9,0.3,1) !important;',
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

    /* 핸들 (v0.5.0: grip 강화 — 더 크고 진하게, 호버 시 브랜드 파랑) */
    '.bj-bar-handle{',
    '  display:flex; align-items:center; justify-content:space-between;',
    '  padding:20px 18px 10px; cursor:pointer; user-select:none;',
    '  background:linear-gradient(180deg, #fafafa 0%, #ffffff 100%);',
    '  border-bottom:0.5px solid #dfdfdf; gap:12px; position:relative;',
    '  -webkit-tap-highlight-color:transparent;',
    '}',
    '.bj-bar-handle:hover{ background:#f5f5f5 }',
    '.bj-bar-handle:hover::before{ background:#0838F8; opacity:1; width:56px }',
    '.bj-bar-handle:active::before{ background:#0838F8; width:60px; opacity:1 }',
    '.bj-bar-handle::before{',
    '  content:""; position:absolute; top:7px; left:50%;',
    '  transform:translateX(-50%);',
    '  width:48px; height:5px; border-radius:3px;',
    '  background:#b8b8b8; pointer-events:none;',
    '  transition:background 0.15s, width 0.2s ease-out, opacity 0.15s;',
    '  opacity:0.9;',
    '}',
    /* 접힘 상태: grip 살짝 펄스 (열기 유도) */
    '.prod_view_bot.card.mt40.bj-bar-collapsed .bj-bar-handle::before{',
    '  animation:bjGripBreathe 2.5s ease-in-out infinite;',
    '}',
    '@keyframes bjGripBreathe{',
    '  0%,100%{ background:#b8b8b8; opacity:0.85; width:48px }',
    '  50%{ background:#0838F8; opacity:1; width:56px }',
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

    /* v0.4.0: fallback 박스 — .bb-inner 없을 때 위젯 자체 콘텐츠 */
    '.bj-bar-fallback{',
    '  padding:14px 18px 16px !important;',
    '  display:flex !important; align-items:center !important;',
    '  justify-content:space-between !important; gap:14px !important;',
    '  flex-wrap:wrap !important;',
    '  font-family:"Pretendard","Apple SD Gothic Neo",sans-serif !important;',
    '}',
    '.bj-fb-info{ display:flex; flex-direction:column; gap:2px; flex:0 1 auto; min-width:0 }',
    '.bj-fb-label{ font-size:11.5px; color:#6a6a6a; font-weight:600 }',
    '.bj-fb-price{ font-size:17px; font-weight:800; color:#0838F8; line-height:1.2 }',
    '.bj-fb-btns{',
    '  display:flex; align-items:center; gap:8px;',
    '  flex:0 1 auto; flex-wrap:wrap; justify-content:flex-end;',
    '}',
    '.bj-fb-btns .bb-btn{',
    '  display:inline-flex; align-items:center; gap:6px;',
    '  padding:10px 14px; font-size:13.5px; font-weight:700;',
    '  border-radius:8px; cursor:pointer;',
    '  font-family:"Pretendard",sans-serif;',
    '  border:1px solid #dfdfdf; background:#fff; color:#2a2a2a;',
    '  transition:background 0.15s; white-space:nowrap;',
    '}',
    '.bj-fb-btns .bb-btn svg{ width:16px; height:16px; fill:currentColor }',
    '.bj-fb-btns .bb-btn-cart{ background:#fff; color:#444; border:1px solid #dfdfdf }',
    '.bj-fb-btns .bb-btn-cart:hover{ background:#f4f4f4 }',
    '@media (max-width:600px){',
    '  .bj-bar-fallback{ padding:12px 14px 14px !important; gap:10px !important }',
    '  .bj-fb-label{ font-size:11px }',
    '  .bj-fb-price{ font-size:15.5px }',
    '  .bj-fb-btns{ gap:6px; width:100%; justify-content:stretch }',
    '  .bj-fb-btns .bb-btn{ padding:9px 11px; font-size:12.5px; flex:1 1 auto; justify-content:center }',
    '  .bj-fb-btns .bb-btn-cart{ flex:0 0 auto; min-width:60px }',
    '}',
    '@media (max-width:400px){',
    '  .bj-fb-btns .bb-btn{ padding:8px 8px; font-size:11.5px }',
    '  .bj-fb-btns .bb-btn svg{ width:14px; height:14px }',
    '}',

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

    /* === v0.5.0: .help-pop ⓘ 툴팁 — 전 페이지 어디서든 viewport 안에 들어오게 강제 ===
       (이전 v0.3.5는 #ai-card-root 스코프 한정 + max-width:600px만 sheet 전환 → 601~900px에서 새는 문제 해결) */
    /* 데스크탑(≥901px) — absolute 위치 유지하되 viewport 폭에 안전하게 clamp */
    '.help-pop, #ai-card-root .help-pop{',
    '  max-width:min(280px, calc(100vw - 24px)) !important;',
    '  word-break:keep-all;',
    '  box-sizing:border-box !important;',
    '}',
    /* 좁은 화면(≤900px) — 항상 viewport bottom-sheet로 전환 (이전 600px → 900px 확대) */
    '@media (max-width:900px){',
    '  .help-pop, #ai-card-root .help-pop{',
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
    '  .help[open] .help-pop::after, #ai-card-root .help[open] .help-pop::after{',
    '    content:"화면 아무 곳을 눌러도 닫혀요";',
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

    /* v0.4.0: SVG 아이콘 */
    var SVG_GIFT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"/></svg>';
    var SVG_CHAT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/></svg>';
    var SVG_CART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>';

    // 버튼 격상 또는 fallback 생성
    if (bbInner) {
      var rentBtn = bbInner.querySelector('.bb-btn-rent');
      if (rentBtn) {
        rentBtn.classList.add('bj-btn-rent-gift');
        rentBtn.innerHTML = SVG_GIFT + '렌탈+사은품 신청';
      }
      var rightTop = bbInner.querySelector('.bb-right-top');
      if (rightTop) {
        /* v0.5.0: 3버튼 보장 — 장바구니가 .bb-left에 따로 있거나 누락된 경우 rightTop으로 이동/생성 */
        var existingCart = bbInner.querySelector('.bb-btn-cart');
        var cartInRightTop = rightTop.querySelector('.bb-btn-cart');
        if (!cartInRightTop) {
          var cartBtn;
          if (existingCart) {
            /* .bb-left 등 다른 위치의 cart 버튼을 rightTop 맨 앞으로 이동 (단일 버튼 영역으로 통합) */
            cartBtn = existingCart;
          } else {
            /* 어디에도 없으면 생성 */
            cartBtn = document.createElement('button');
            cartBtn.type = 'button';
            cartBtn.className = 'bb-btn bb-btn-cart';
            cartBtn.addEventListener('click', function(){
              if (typeof window.shoporder === 'function') window.shoporder('cart');
              else window.location.href = '/html/dh_order/shop_cart';
            });
          }
          cartBtn.innerHTML = SVG_CART + '장바구니';
          rightTop.insertBefore(cartBtn, rightTop.firstChild);
        }
        /* 상담신청 — 중복 방지 */
        if (!rightTop.querySelector('.bj-btn-consult')) {
          var consult = document.createElement('button');
          consult.type = 'button';
          consult.className = 'bb-btn bj-btn-consult';
          consult.innerHTML = SVG_CHAT + '상담신청';
          consult.addEventListener('click', function(){
            window.location.href = '/html/dh/counsel';
          });
          rightTop.appendChild(consult);
        }
      }
    } else {
      /* v0.4.0: .bb-inner 없을 때 fallback 박스 생성 */
      var fb = document.createElement('div');
      fb.className = 'bj-bar-fallback';
      fb.innerHTML =
        '<div class="bj-fb-info">' +
          '<span class="bj-fb-label">월 렌탈료</span>' +
          '<span class="bj-fb-price">' + (priceText || '문의') + '</span>' +
        '</div>' +
        '<div class="bj-fb-btns">' +
          '<button type="button" class="bb-btn bb-btn-cart bj-fb-cart">' + SVG_CART + '장바구니</button>' +
          '<button type="button" class="bb-btn bb-btn-rent bj-btn-rent-gift bj-fb-rent">' + SVG_GIFT + '렌탈+사은품 신청</button>' +
          '<button type="button" class="bb-btn bj-btn-consult bj-fb-consult">' + SVG_CHAT + '상담신청</button>' +
        '</div>';
      wrapper.appendChild(fb);

      fb.querySelector('.bj-fb-cart').addEventListener('click', function(){
        if (typeof window.shoporder === 'function') window.shoporder('cart');
        else window.location.href = '/html/dh_order/shop_cart';
      });
      fb.querySelector('.bj-fb-rent').addEventListener('click', function(){
        if (typeof window.shoporder === 'function') window.shoporder('rent');
        else window.location.href = '/html/dh/counsel';
      });
      fb.querySelector('.bj-fb-consult').addEventListener('click', function(){
        window.location.href = '/html/dh/counsel';
      });
    }

    wrapper.dataset.bjBarEnhanced = '1';
  }

  function preEnhance(){
    var wrapper = document.querySelector('.prod_view_bot.card.mt40');
    if (wrapper) forceFixedStyle(wrapper);
  }

  /* (c) v0.5.0: .help (ⓘ 툴팁) 외부 탭 자동 닫힘 — 전 페이지 어디든 details.help 모두 적용
       이전 v0.3.5는 #ai-card-root 스코프만 잡아서 rental-terms·기타 영역에서 안 닫히는 버그 해결.
       click(capture)·touchstart(capture) 동시 등록 — 모바일 탭 즉시 반응. */
  function setupHelpClose(){
    if (window.__bjHelpCloseSetup) return;
    window.__bjHelpCloseSetup = true;
    function closeOutside(e){
      var opened = document.querySelectorAll('details.help[open]');
      opened.forEach(function(d){
        if (!d.contains(e.target)) d.removeAttribute('open');
      });
    }
    document.addEventListener('click', closeOutside, true);
    document.addEventListener('touchstart', closeOutside, { capture: true, passive: true });
    document.addEventListener('toggle', function(e){
      var t = e.target;
      if (t && t.tagName === 'DETAILS' && t.classList.contains('help') && t.open) {
        document.querySelectorAll('details.help[open]').forEach(function(d){
          if (d !== t) d.removeAttribute('open');
        });
      }
    }, true);
    /* ESC 키로도 닫기 (접근성) */
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape') {
        document.querySelectorAll('details.help[open]').forEach(function(d){
          d.removeAttribute('open');
        });
      }
    });
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
  // 2.y) 하단 위젯 가시성 — AI 카드 통과 후 노출 + 탭 토글 (v0.4.3)
  //
  //   * 페이지에 #ai-card-root 있을 때만 활성. (없으면 기존대로 항상 노출)
  //   * 초기 상태: 위젯 숨김 (.bj-bar-slide-hidden)
  //   * 카드의 70% 이상이 viewport 위로 스크롤되면 자동 노출
  //   * 위젯 영역 밖 화면 탭/클릭 → 가시성 토글 (사용자 명시적 숨김 의도)
  //   * 사용자가 수동 숨겼다면, 다시 카드 영역으로 스크롤 올라가도 자동 노출 안 함
  //     (의도 우선) — 위젯 영역 다시 탭하거나 카드 통과 후 외부 탭으로만 복귀
  //   * 기존 chevron 펼침/접힘 동작은 보존 (max-height 토글)
  // ─────────────────────────────────────────────────────────────────────────
  function setupBottomBarVisibility(){
    if (window.__bjBarVisibilitySetup) return;
    // 10914 한정 게이트: 새 트리거(lpt 통과) + 명시적 토글 — 승인 후 전제품 확대 예정.
    var IS_TEST_PROD = /\/prod_view\/10914/.test(location.pathname);

    var wrapper = document.querySelector('#billyjo-bottom-bar') ||
                  document.querySelector('.prod_view_bot.card.mt40');
    if (!wrapper) return;
    var aiCard = document.querySelector('#ai-card-root');
    if (!aiCard) return;

    window.__bjBarVisibilitySetup = true;
    if (!wrapper.dataset.bjBarTransition) {
      wrapper.style.setProperty('transition',
        (wrapper.style.transition || '') + ', bottom 0.38s cubic-bezier(0.2,0.9,0.3,1)',
        'important');
      wrapper.dataset.bjBarTransition = '1';
    }
    wrapper.classList.add('bj-bar-slide-hidden');

    // 사용자 dismiss 영구 기록 (sessionStorage — 세션 동안만)
    var SESSION_KEY = 'bjBarDismissed_' + (location.pathname.match(/prod_view\/(\d+)/) || [,'unknown'])[1];
    var manualHide = (function(){ try { return sessionStorage.getItem(SESSION_KEY) === '1'; } catch(e){ return false; } })();
    var pastTrigger = false;

    function evalScroll(){
      // 새 트리거 (10914): #livePriceTable 통과
      // 기존 트리거: #ai-card-root 통과
      var target = IS_TEST_PROD ? (document.querySelector('#livePriceTable') || aiCard) : aiCard;
      var r = target.getBoundingClientRect();
      var threshold = window.innerHeight * 0.3;
      pastTrigger = r.bottom < threshold;
      apply();
    }
    function apply(){
      var show = pastTrigger && !manualHide;
      if (show) {
        wrapper.classList.remove('bj-bar-slide-hidden');
        wrapper.classList.add('show');
        wrapper.style.setProperty('bottom', '0', 'important');
        wrapper.style.setProperty('pointer-events', 'auto', 'important');
        wrapper.style.setProperty('visibility', 'visible', 'important');
        wrapper.style.setProperty('opacity', '1', 'important');
      } else {
        wrapper.classList.add('bj-bar-slide-hidden');
        wrapper.style.setProperty('bottom', '-280px', 'important');
        wrapper.style.setProperty('pointer-events', 'none', 'important');
      }
    }

    // 10914 한정: 명시적 X 버튼 (위젯 우측 상단 모서리에 dismiss)
    if (IS_TEST_PROD && !wrapper.querySelector('.bj-bar-dismiss-x')) {
      var x = document.createElement('button');
      x.className = 'bj-bar-dismiss-x';
      x.type = 'button';
      x.setAttribute('aria-label', '하단 위젯 닫기 (세션 동안)');
      x.style.cssText = [
        'position:absolute','top:6px','right:8px','width:28px','height:28px',
        'border-radius:50%','background:rgba(255,255,255,0.85)','color:#333','border:0',
        'font-size:16px','font-weight:700','cursor:pointer','z-index:100000',
        'display:flex','align-items:center','justify-content:center',
        'box-shadow:0 2px 6px rgba(0,0,0,0.15)',
      ].join(';');
      x.textContent = '✕';
      x.onclick = function(e){
        e.stopPropagation(); e.preventDefault();
        manualHide = true;
        try { sessionStorage.setItem(SESSION_KEY, '1'); } catch(_){}
        apply();
      };
      wrapper.appendChild(x);
    }

    // throttled scroll
    var scrollPending = false;
    function onScroll(){
      if (scrollPending) return;
      scrollPending = true;
      window.requestAnimationFrame(function(){
        scrollPending = false;
        evalScroll();
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    // body tap/click — 외부 탭 토글 (10914에서는 비활성 — X 버튼으로만 dismiss)
    if (!IS_TEST_PROD) {
      function onBodyTap(e){
        if (!pastTrigger) return;
        if (wrapper.contains(e.target)) return;
        if (e.target.closest && e.target.closest('details, .help-pop, button, a, input, select, textarea, [role="button"]')) return;
        manualHide = !manualHide;
        apply();
      }
      document.addEventListener('click', onBodyTap);
      document.addEventListener('touchend', onBodyTap, { passive: true });
      wrapper.addEventListener('click', function(){ if (manualHide) { manualHide = false; apply(); }});
    }

    evalScroll();  // 초기 평가
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2.x) 제품별 AI 카드 HTML 주입 (룰북 v0.4.2)
  //
  //   billyjo-detailcard 레포 cards/{prodNo}.html이 존재하면 페이지에 주입한다.
  //   - 자기 inject.js의 commit hash를 추출해 같은 commit의 카드 fetch (캐시 일관성)
  //   - 404면 silent skip — 패치(헤더·하단위젯)만 적용
  //   - 1회만 주입 (window.__bjAiCardFetched 가드)
  // ─────────────────────────────────────────────────────────────────────────
  function getOwnCommitHash(){
    try {
      var src = (document.currentScript && document.currentScript.src) || '';
      if (!src) {
        var scripts = document.getElementsByTagName('script');
        for (var i = scripts.length - 1; i >= 0; i--) {
          if (/billyjo-detailcard@/.test(scripts[i].src)) { src = scripts[i].src; break; }
        }
      }
      var m = src.match(/billyjo-detailcard@([0-9a-f]{7,40}|main)\//);
      return m ? m[1] : 'main';
    } catch(e) { return 'main'; }
  }

  function fetchAndInjectAICard(){
    if (window.__bjAiCardFetched) return;
    var path = location.pathname || '';
    var m = path.match(/\/prod_view\/(\d+)/);
    if (!m) return;
    var prodNo = m[1];
    window.__bjAiCardFetched = true;

    var commit = getOwnCommitHash();
    var url = 'https://cdn.jsdelivr.net/gh/billyjo-appsilon/billyjo-detailcard@' + commit + '/cards/' + prodNo + '.html';
    fetch(url, { cache: 'force-cache' })
      .then(function(r){ return r.ok ? r.text() : null; })
      .then(function(html){
        if (!html) return;
        if (document.querySelector('#ai-card-root')) return;  // 이미 주입됨
        // 삽입 위치: .prod_view_bot.mt10 (상품정보) 바로 앞.
        // 없으면 .prod_view_detail 앞에, 그것도 없으면 .prod_view_top 뒤에.
        var anchor =
          document.querySelector('.prod_view_bot.mt10') ||
          document.querySelector('.prod_view_detail') ||
          (function(){
            var top = document.querySelector('.prod_view_top');
            return top && top.nextElementSibling;
          })();
        if (!anchor) return;
        var holder = document.createElement('div');
        holder.innerHTML = html;
        // holder 안의 자식들을 순서대로 anchor 앞에 삽입
        while (holder.firstChild) {
          anchor.parentNode.insertBefore(holder.firstChild, anchor);
        }
      })
      .catch(function(){ /* silent */ });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2.z) 페이지 본문 정리 — AI 카드와 중복되는 .prod_table_wrap hide +
  //      #livePriceTable 컬럼 축소 (약정기간 + 최종 할인가만)
  //
  //   AI 카드 SLOT 3가 이미 .prod_table_wrap의 스펙 정보를 흡수했으므로 원본 hide.
  //   #livePriceTable은 본문에 그대로 두되, 사용자 룰에 따라 6개 컬럼 중
  //   2개(약정기간·최종 할인가)만 노출 — 나머지 컬럼(관리유형·관리주기·프로모션·이달 할인가) hide.
  //   "카드사 할인" 자체는 카드 안에 표시하지 않음 (.card_sale 페이지 본문 그대로).
  //   AI 카드가 페이지에 있을 때만 적용.
  // ─────────────────────────────────────────────────────────────────────────
  function hideOriginalSpecsAndSimplifyLpt(){
    // prod_view 페이지에서만 동작
    if (!/\/prod_view\/\d+/.test(location.pathname || '')) return;

    // (1) .prod_table_wrap hide — AI 카드가 있을 때만 (SLOT 3와 중복이라 카드 있으면 정보 손실 없음;
    //     카드 없으면 본문 spec 표가 유일한 정보원이므로 보존)
    if (document.querySelector('#ai-card-root')) {
      var ptw = document.querySelector('.prod_table_wrap');
      if (ptw) ptw.style.setProperty('display', 'none', 'important');
    }

    // (2) #livePriceTable 컬럼 축소 — nth-child 기반 hide
    //     col 0 관리유형(nth=1)·col 2 관리주기(nth=3)·col 3 프로모션(nth=4)·col 4 이달 할인가(nth=5) hide
    //     col 1 약정기간(nth=2)·col 5 최종 할인가(nth=6) 유지
    var lpt = document.querySelector('#livePriceTable');
    if (lpt && !lpt.dataset.bjLptSimplified) {
      var hideNth = [1, 3, 4, 5];
      hideNth.forEach(function(n){
        lpt.querySelectorAll(
          'thead tr > *:nth-child(' + n + '), tbody tr > *:nth-child(' + n + ')'
        ).forEach(function(c){
          c.style.setProperty('display', 'none', 'important');
        });
      });
      lpt.dataset.bjLptSimplified = '1';
    }

    // (3) lptTable 데이터 채우기
    populateLptFromMonthBoxes();

    // (3b) .card_sale (제휴카드 안내) 강제 펼침 — 카드별 할인 정보 가시화
    var cs = document.querySelector('.card_sale');
    if (cs && !cs.dataset.bjOpened) {
      var ul = cs.querySelector('ul');
      if (ul) ul.style.setProperty('display', 'block', 'important');
      var closeBtn = cs.querySelector('.close_btn');
      if (closeBtn) closeBtn.style.setProperty('display', 'none', 'important');
      // 카드별 .li 항상 노출 + .on 자동 부여 (첫 번째)
      var lis = cs.querySelectorAll('ul > li');
      lis.forEach((li, i) => {
        li.style.setProperty('display', 'block', 'important');
        if (i === 0) li.classList.add('on');
      });
      cs.dataset.bjOpened = '1';
    }

    // (4) PC 가격박스 .fix_price.hide-767 → .prod_name 다음으로 이동
    reorderFixPriceAfterProdName();
  }

  // lpt entries 캐시 — underlying이 덮어쓴 후 우리 thead/tbody 구조 바뀌어도
  // extractor가 못 찾는 경우 대비 (캐시된 데이터로 재렌더)
  var __bjLptCache = null;

  function populateLptFromMonthBoxes(){
    var lpt = document.querySelector('#livePriceTable');
    if (!lpt) return;
    lpt.classList.remove('lpt-empty');
    lpt.style.setProperty('display', 'block', 'important');

    var table = lpt.querySelector('#lptTable');
    var tbody = table && table.querySelector('tbody');
    if (!tbody) return;

    // 우선 underlying이 제공한 rich tbody (rowspan 가능)에서 약정+최종할인가 추출
    var entries = extractLptEntriesFromUnderlying(table);
    // 비어있거나 추출 실패 → 캐시 → month_box fallback 순
    if (entries.length === 0 && __bjLptCache && __bjLptCache.length) {
      entries = __bjLptCache;
    }
    if (entries.length === 0) entries = extractLptEntriesFromMonthBoxes();
    if (entries.length === 0) return;
    // 풍부한 데이터(underlying mgmt 포함) 캐싱 — 다음 재호출 때 thead 라벨 바뀌어도 활용
    if (entries.some(function(e){ return e.mgmt; })) __bjLptCache = entries;

    // tbody 첫 행에 bj-simple-row 마커 있으면 우리가 이미 렌더한 상태 → skip.
    // underlying이 덮어쓰면 마커가 사라지므로 다시 rerender.
    var firstRow = tbody.querySelector('tr');
    if (firstRow && firstRow.hasAttribute('data-bj-simple-row')) {
      var sig = entries.map(function(e){ return (e.mgmt||'') + '|' + e.term + '|' + (e.monthly||'') + '|' + e.finalPrice; }).join(';');
      if (lpt.dataset.bjLptSignature === sig) return;
    }

    // 여러 관리유형이 섞여있으면 약정기간 셀에 prefix로 표기 (예: "[방문관리] 3년의무")
    var mgmtSet = {};
    entries.forEach(function(e){ if (e.mgmt) mgmtSet[e.mgmt] = true; });
    var needMgmtPrefix = Object.keys(mgmtSet).length > 1;

    // simple 2-col 구조로 재렌더 (다른 컬럼은 빈 셀 + display:none).
    // 관리유형 그룹별 row 배경: 방문관리 → 옅은 회색, 자가관리 → 흰색 (시각적 구분)
    var rows = '';
    entries.forEach(function(e){
      var termText = needMgmtPrefix && e.mgmt ? '[' + e.mgmt + '] ' + e.term : e.term;
      var bg = '';
      if (needMgmtPrefix && e.mgmt === '방문관리') bg = 'background:#f5f6f8;';
      else if (needMgmtPrefix && e.mgmt === '자가관리') bg = 'background:#ffffff;';
      // 월 렌탈료 항상 표시 — monthly=finalPrice면 finalPrice 값으로 동일 표시
      // (10914처럼 카드할인 없는 경우 두 컬럼 같은 값 표시되어 직관적)
      var monthlyDisplay = e.monthly || e.finalPrice || '—';
      rows +=
        '<tr data-bj-simple-row="1" style="border-bottom:0.5px solid #eee;' + bg + '">' +
          '<td style="display:none"></td>' +
          '<td style="padding:12px 8px;text-align:center;font-weight:600">' + escapeHtml(termText) + '</td>' +
          '<td style="display:none"></td>' +
          '<td style="display:none"></td>' +
          '<td style="padding:12px 8px;text-align:center;color:#444;font-size:14px">' + escapeHtml(monthlyDisplay) + '</td>' +
          '<td style="padding:12px 8px;text-align:center;color:#0838f8;font-size:15px;font-weight:700">' + escapeHtml(e.finalPrice) + '</td>' +
        '</tr>';
    });
    tbody.innerHTML = rows;

    // thead 라벨도 업데이트 — 약정기간 / 월 렌탈료 / 카드 적용가
    // (underlying의 이달의 할인가 → 월 렌탈료, 최종 할인가 → 카드 적용가로 재명명)
    var thead2 = table.querySelector('thead tr');
    if (thead2) {
      thead2.innerHTML =
        '<th style="display:none"></th>' +
        '<th style="background:#0838f8;color:#fff;padding:10px 8px;text-align:center;font-weight:600">약정기간</th>' +
        '<th style="display:none"></th>' +
        '<th style="display:none"></th>' +
        '<th style="background:#0838f8;color:#fff;padding:10px 8px;text-align:center;font-weight:600">월 렌탈료</th>' +
        '<th style="background:#0838f8;color:#fff;padding:10px 8px;text-align:center;font-weight:600">카드 할인가</th>';
    }

    lpt.dataset.bjLptSignature = entries.map(function(e){ return (e.mgmt||'') + '|' + e.term + '|' + (e.monthly||'') + '|' + e.finalPrice; }).join(';');
    lpt.dataset.bjLptPopulated = '1';

    // underlying이 tbody를 다시 덮어쓰면 MutationObserver가 재렌더 트리거
    if (!lpt.dataset.bjLptObserved && window.MutationObserver) {
      lpt.dataset.bjLptObserved = '1';
      var obs = new MutationObserver(function(){
        // 다음 tick에서 populateLpt 재호출 (synchronous mutation 루프 방지)
        setTimeout(populateLptFromMonthBoxes, 0);
      });
      try { obs.observe(tbody, { childList: true, subtree: false }); } catch(e){}
      // 5초 후 disconnect (성능 + 무한루프 방지)
      setTimeout(function(){ try { obs.disconnect(); } catch(e){} }, 8000);
    }

    // lptTitle 갱신
    var title = document.getElementById('lptTitle');
    if (title) {
      var nameEl = document.querySelector('.prod_name > b');
      var modelEl = document.querySelector('.prod_name .model_name small');
      if (nameEl) {
        var inner = escapeHtml(nameEl.textContent.trim());
        if (modelEl) inner += '<br><span style="font-size:12px;opacity:0.85;font-weight:400">' + escapeHtml(modelEl.textContent.trim()) + '</span>';
        title.innerHTML = inner;
      }
    }

    /* v0.5.0: 카드 할인이 있는 경우 #livePriceTable을 AI 카드 SLOT 8로 mount */
    mountLptIntoCard(entries);
  }

  /* v0.5.1: LPT를 AI 카드 SLOT 8에 **항상** mount. 카드할인 유무에 관계없이 노출.
     본문 #livePriceTable은 mount 성공 시 hide → 카드 내부만 단일 출처.
     사용자 룰북 v0.5.1: "위생관리·카드 할인가 모두 자동생성 카드 내부에 포함되어야 함". */
  function mountLptIntoCard(entries){
    var section = document.getElementById('ai-card-lpt-section');
    var mount = document.getElementById('ai-card-lpt-mount');
    if (!section || !mount) return;
    if (!entries || !entries.length) { section.hidden = true; return; }

    function digits(s){ return parseInt(String(s||'').replace(/[^\d]/g,''),10) || 0; }
    var hasDiscount = entries.some(function(e){
      return e.monthly && e.finalPrice && digits(e.monthly) !== digits(e.finalPrice);
    });

    /* mount 안에 컴팩트 표 직접 생성 (#livePriceTable DOM 이동 대신 복제) — 본문 LPT는 그대로 두고
       카드 내부에 독립 인스턴스. underlying 재렌더와 충돌 없음. */
    var mgmtSet = {};
    entries.forEach(function(e){ if (e.mgmt) mgmtSet[e.mgmt] = true; });
    var needMgmtPrefix = Object.keys(mgmtSet).length > 1;

    var rows = entries.map(function(e){
      var termText = needMgmtPrefix && e.mgmt ? '[' + e.mgmt + '] ' + e.term : e.term;
      var monthly = e.monthly || e.finalPrice || '—';
      var final = e.finalPrice || '—';
      var saved = '';
      if (e.monthly && e.finalPrice) {
        var d = digits(e.monthly) - digits(e.finalPrice);
        if (d > 0) saved = '<span style="color:#e84a4a;font-size:11px;margin-left:4px">−' + d.toLocaleString() + '원</span>';
      }
      return '<tr style="border-bottom:0.5px solid #eee">' +
        '<td style="padding:10px 8px;text-align:center;font-weight:600;font-size:13px">' + escapeHtml(termText) + '</td>' +
        '<td style="padding:10px 8px;text-align:center;color:#444;font-size:13px">' + escapeHtml(monthly) + '</td>' +
        '<td style="padding:10px 8px;text-align:center;color:#0838f8;font-weight:700;font-size:14px">' + escapeHtml(final) + saved + '</td>' +
        '</tr>';
    }).join('');

    /* 카드할인이 있는 경우 3컬럼 (약정/월렌탈료/카드할인가),
       없는 경우 2컬럼 (약정/월렌탈료) — 컬럼 헤더도 동적 */
    var headerCols = hasDiscount
      ? '<th style="padding:9px 8px;text-align:center;font-weight:600">약정기간</th>' +
        '<th style="padding:9px 8px;text-align:center;font-weight:600">월 렌탈료</th>' +
        '<th style="padding:9px 8px;text-align:center;font-weight:600">카드 할인가</th>'
      : '<th style="padding:9px 8px;text-align:center;font-weight:600">약정기간</th>' +
        '<th style="padding:9px 8px;text-align:center;font-weight:600">월 렌탈료</th>';
    if (!hasDiscount) {
      /* 2컬럼 모드 — final 컬럼 제거하고 monthly만 강조 */
      rows = entries.map(function(e){
        var termText = needMgmtPrefix && e.mgmt ? '[' + e.mgmt + '] ' + e.term : e.term;
        var monthly = e.monthly || e.finalPrice || '—';
        return '<tr style="border-bottom:0.5px solid #eee">' +
          '<td style="padding:10px 8px;text-align:center;font-weight:600;font-size:13px">' + escapeHtml(termText) + '</td>' +
          '<td style="padding:10px 8px;text-align:center;color:#0838f8;font-weight:700;font-size:14px">' + escapeHtml(monthly) + '</td>' +
          '</tr>';
      }).join('');
    }

    mount.innerHTML =
      '<div style="overflow-x:auto;-webkit-overflow-scrolling:touch">' +
        '<table style="width:100%;min-width:240px;border-collapse:collapse;font-family:Pretendard,sans-serif;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e8ee">' +
          '<thead><tr style="background:#0838f8;color:#fff;font-size:12px">' + headerCols + '</tr></thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table>' +
      '</div>';
    section.hidden = false;
    section.dataset.bjLptMounted = '1';

    /* v0.5.1: 본문 #livePriceTable 숨김 — 카드 내부 SLOT 8이 단일 출처가 되도록 */
    var bodyLpt = document.getElementById('livePriceTable');
    if (bodyLpt && bodyLpt.id !== mount.id) {
      bodyLpt.style.setProperty('display', 'none', 'important');
    }
  }

  function escapeHtml(s){
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // underlying lptTable의 rich tbody → 약정기간 + 이달의 할인가 + 최종 할인가 추출.
  // 컬럼 순서는 모든 제품 공통(관리유형/약정기간/관리주기/프로모션/이달의 할인가/최종 할인가)
  // 이므로 인덱스 하드코딩. (우리가 thead를 재명명한 후에도 호출되므로 thead text에
  // 의존하지 않음.)
  function extractLptEntriesFromUnderlying(table){
    var tbody = table.querySelector('tbody');
    if (!tbody) return [];
    var mgmtIdx = 0, termIdx = 1, monthlyIdx = 4, finalIdx = 5;

    var rows = Array.from(tbody.querySelectorAll('tr'));
    if (rows.length === 0) return [];
    if (rows.length === 1 && /실시간 가격|확인중/.test(rows[0].textContent || '')) return [];
    // 우리가 렌더한 simple 행이면 underlying 데이터 아님 → skip (캐시로 fallback)
    if (rows[0].hasAttribute('data-bj-simple-row')) return [];

    var entries = [];
    var pending = {};  // {colIdx: {text, remaining}}
    rows.forEach(function(tr){
      var cells = Array.from(tr.children);
      var rowMap = {};
      var c = 0;
      var ci = 0;
      while (c < 6) {
        if (pending[c] && pending[c].remaining > 0) {
          rowMap[c] = pending[c].text;
          pending[c].remaining--;
          c++;
          continue;
        }
        if (ci >= cells.length) break;
        var cell = cells[ci];
        var rs = parseInt(cell.getAttribute('rowspan'), 10) || 1;
        var cs = parseInt(cell.getAttribute('colspan'), 10) || 1;
        var text = (cell.textContent || '').replace(/\s+/g, ' ').trim();
        for (var k = 0; k < cs; k++) {
          rowMap[c + k] = text;
          if (rs > 1) pending[c + k] = { text: text, remaining: rs - 1 };
        }
        c += cs;
        ci++;
      }
      var term = rowMap[termIdx];
      var fin = rowMap[finalIdx];
      var mgmt = mgmtIdx >= 0 ? (rowMap[mgmtIdx] || '') : '';
      var monthly = monthlyIdx >= 0 ? (rowMap[monthlyIdx] || '') : '';
      if (term && fin) entries.push({ term: term, finalPrice: fin, mgmt: mgmt, monthly: monthly });
    });
    return entries;
  }

  function extractLptEntriesFromMonthBoxes(){
    var sources = document.querySelectorAll('a[id*="_price_of_"][data-month][data-price]');
    var out = [];
    sources.forEach(function(src){
      var month = src.dataset.month || '';
      var priceStr = src.dataset.price || '';
      var dc = src.dataset.dcprice || '0';
      var card_dis = src.dataset.card_dis;
      var finalDisplay = '월 ' + priceStr + '원';
      var pNum = parseInt(priceStr.replace(/,/g, ''), 10);
      var dNum = parseInt(dc, 10);
      if (card_dis && card_dis !== 'N' && card_dis !== '0' && !isNaN(pNum) && !isNaN(dNum) && dNum > 0) {
        finalDisplay = '월 ' + (pNum - dNum).toLocaleString() + '원';
      }
      out.push({ term: month, finalPrice: finalDisplay, monthly: finalDisplay, mgmt: '' });
    });
    return out;
  }

  function reorderFixPriceAfterProdName(){
    var fixPrice = document.querySelector('.fix_price.hide-767');
    var prodName = document.querySelector('.prod_name');
    if (!fixPrice || !prodName) return;
    // 이미 prodName 직후에 있으면 skip
    if (prodName.nextElementSibling === fixPrice) return;
    // .prod_name과 .fix_price.hide-767 부모가 같아야 안전
    if (fixPrice.parentElement !== prodName.parentElement) return;
    prodName.parentElement.insertBefore(fixPrice, prodName.nextElementSibling);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3) 오케스트레이션
  // ─────────────────────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────
  // 2.w) (DEPRECATED — universal fab는 IIFE 최상단에서 모든 페이지에 주입됨.
  //       이 함수는 prod_view에서 fab 존재 보장 차원의 fallback)
  // ─────────────────────────────────────────────────────────────────────────
  function injectNewlywedGnb(){
    // v0.5.1: 플로팅 fab 폐기 — 카테고리바(.category__wrap)에 직접 link 추가.
    // 기존 .bj-newlywed-floating 잔재 있으면 제거.
    var stale = document.querySelector('.bj-newlywed-floating');
    if (stale) stale.remove();
    /* 카테고리바 항목은 위쪽 injectNewlywedInCategoryBar IIFE가 처리 — 재호출 트리거만 */
    var wrap = document.querySelector('.mobile__gnb .gnb__cateogry .category__wrap, .category__wrap');
    if (!wrap || wrap.querySelector('.bj-newlywed-cat')) return;
    var commit = getOwnCommitHash();
    var modalJsUrl = 'https://cdn.jsdelivr.net/gh/billyjo-appsilon/billyjo-detailcard@' + commit + '/landing/newlywed.js';
    var link = document.createElement('a');
    link.className = 'bj-newlywed-cat';
    link.href = '#';
    link.innerHTML = '<span style="margin-right:3px">💍</span>신혼부부 패키지';
    link.style.cssText = 'flex:0 0 auto;display:inline-flex;align-items:center;padding:2px 0;font:700 13px Pretendard,sans-serif;color:#0838F8;text-decoration:none;background:transparent;border:0;white-space:nowrap;cursor:pointer;line-height:1.4';
    link.onclick = function(e){
      e.preventDefault();
      if (typeof window.bjOpenNewlywedModal === 'function') {
        window.bjOpenNewlywedModal();
      } else if (!window.__bjNwLoading) {
        window.__bjNwLoading = true;
        var s = document.createElement('script');
        s.src = modalJsUrl;
        s.onload = function(){ if (window.bjOpenNewlywedModal) window.bjOpenNewlywedModal(); };
        document.head.appendChild(s);
      }
    };
    wrap.insertBefore(link, wrap.firstChild);
  }

  function runAll(){
    injectCSS();
    tagHeaderDom();
    enhanceBottomBar();
    setupHelpClose();
    alignCategoryScroll();
    addRentalTermsHelp();
    fetchAndInjectAICard();
    hideOriginalSpecsAndSimplifyLpt();
    setupBottomBarVisibility();
    injectNewlywedGnb();
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
