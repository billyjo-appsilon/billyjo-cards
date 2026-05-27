/*!
 * billyjo-detailcard v0.5.57 — 상세페이지 카드 클라이언트 패치
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
      // (1) v0.5.9: 카테고리 바 — .category__wrap + 신규 .bj-sh-cat 모두 1행 가로 스와이프 강제
      //     모바일에서 어떤 경우에도 전체 펼침/멀티라인 금지
      '  .mobile__gnb .gnb__cateogry .category__wrap, .category__wrap,',
      '  .bj-sh-cat, body .bj-sh-cat, header .bj-sh-cat{',
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
      '  .bj-sh-cat::-webkit-scrollbar{ display:none !important }',
      '  .bj-sh-cat > a{',
      '    flex:0 0 auto !important; display:inline-block !important;',
      '    white-space:nowrap !important;',
      '    padding:2px 0 !important; margin:0 !important;',
      '    font-size:13px !important; font-weight:500 !important;',
      '    color:#555 !important; text-decoration:none !important;',
      '    background:transparent !important; border:0 !important; border-radius:0 !important;',
      '    line-height:1.4 !important;',
      '  }',
      '  .bj-sh-cat > a:hover{ color:#0838F8 !important }',
      '  .bj-sh-cat > a.on{',
      '    color:#0838F8 !important; font-weight:800 !important; position:relative !important;',
      '  }',
      '  .bj-sh-cat > a:first-child{ color:#0838F8 !important; font-weight:700 !important }',  /* 신혼부부 패키지 강조 */
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
  /* v0.5.16: 데모 도메인(.vercel.app)에서도 작동하도록 가드 완화 + window.__bjForceLoad flag */
  if (!/\/html\/dh_prod\/prod_view\//.test(location.pathname) &&
      !/\.vercel\.app$/.test(location.hostname) &&
      !window.__bjForceLoad) return;

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
    '  display:block !important;',  /* v0.5.3: 빌리조 underlying이 display:none으로 숨김 → 명시 override */
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
    '  max-height:min(440px, 75vh) !important;',
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
    '.prod_view_bot.card.mt40.bj-bar-expanded{ max-height:min(440px, 75vh) !important }',
    /* v0.5.13: collapsed max-height 64→56px (핸들 1행만 보이므로 더 콤팩트) */
    /* v0.5.37: collapsed max-height 56→48px (핸들 padding 축소 동기) */
    'body #container .wide-inner > .prod_view_bot.card.mt40.bj-bar-collapsed,',
    '.prod_view_bot.card.mt40.bj-bar-collapsed{ max-height:48px !important; overflow:hidden !important }',
    /* v0.5.13: collapsed 시 핸들만 노출 — 모든 fallback 콘텐츠 숨김 (렌탈사 selector·약정 pill·3버튼 영역 포함) */
    '.prod_view_bot.card.mt40.bj-bar-collapsed .card__top,',
    '.prod_view_bot.card.mt40.bj-bar-collapsed .card__tit,',
    '.prod_view_bot.card.mt40.bj-bar-collapsed .rantal_wrap,',
    '.prod_view_bot.card.mt40.bj-bar-collapsed .bb-left,',
    '.prod_view_bot.card.mt40.bj-bar-collapsed .bb-right-bottom,',
    /* v0.5.13: fallback 콘텐츠 (.bj-bar-fallback 자체 + 내부 selector·버튼) 숨김 */
    '.prod_view_bot.card.mt40.bj-bar-collapsed .bj-bar-fallback,',
    '.prod_view_bot.card.mt40.bj-bar-collapsed .bj-fb-selector,',
    '.prod_view_bot.card.mt40.bj-bar-collapsed .bj-widget-selector,',
    '.prod_view_bot.card.mt40.bj-bar-collapsed .bj-ws-sup-section,',
    '.prod_view_bot.card.mt40.bj-bar-collapsed .bj-ws-term-pills,',
    '.prod_view_bot.card.mt40.bj-bar-collapsed .bj-fb-info,',
    '.prod_view_bot.card.mt40.bj-bar-collapsed .bj-fb-btns,',
    /* v0.5.31: 옵션 박스도 collapsed 시 hide (wrapper max-height:56px 잘림 방지) */
    '.prod_view_bot.card.mt40.bj-bar-collapsed .bj-fb-option-box,',
    /* .bb-inner 자체도 숨김 (안에 .bb-product-name·.bb-months 등이 보일 수 있음) */
    '.prod_view_bot.card.mt40.bj-bar-collapsed .bb-inner,',
    '.prod_view_bot.card.mt40.bj-bar-collapsed .bb-right{',
    '  display:none !important;',
    '}',
    '.prod_view_bot.card.mt40.bj-bar-expanded .bb-inner,',
    '.prod_view_bot.card.mt40 .bb-inner{',
    '  overflow-y:auto; max-height:calc(min(440px, 75vh) - 48px);',
    '}',
    /* v0.5.34: 펼친 위젯 전체에 세로 스크롤 보장 — 콘텐츠가 max-height 초과 시 본 컨테이너에서 스크롤 */
    '.prod_view_bot.card.mt40.bj-bar-expanded{ overflow-y:auto !important }',

    /* 핸들 (v0.5.0: grip 강화 — 더 크고 진하게, 호버 시 브랜드 파랑) */
    '.bj-bar-handle{',
    '  display:flex; align-items:center; justify-content:space-between;',
    /* v0.5.37: 위아래 padding 축소 — grip 영역만 확보(상단 16px), 하단 6px */
    '  padding:14px 18px 6px; cursor:pointer; user-select:none;',
    '  background:linear-gradient(180deg, #fafafa 0%, #ffffff 100%);',
    '  border-bottom:0.5px solid #dfdfdf; gap:12px; position:relative;',
    '  -webkit-tap-highlight-color:transparent;',
    '}',
    '.bj-bar-handle:hover{ background:#f5f5f5 }',
    '.bj-bar-handle:hover::before{ background:#0838F8; opacity:1; width:56px }',
    '.bj-bar-handle:active::before{ background:#0838F8; width:60px; opacity:1 }',
    /* visible grip bar — 기존 그대로 (pointer-events:none) */
    '.bj-bar-handle::before{',
    '  content:""; position:absolute; top:7px; left:50%;',
    '  transform:translateX(-50%);',
    '  width:48px; height:5px; border-radius:3px;',
    '  background:#b8b8b8; pointer-events:none;',
    '  transition:background 0.15s, width 0.2s ease-out, opacity 0.15s;',
    '  opacity:0.9;',
    '}',
    /* v0.5.38: grip bar 위 큰 invisible hit zone — 사용자가 바 근처(±50px)만 눌러도
       클릭이 핸들로 위임되어 토글 작동. ::before는 시각, ::after는 hit area 분리. */
    '.bj-bar-handle::after{',
    '  content:""; position:absolute; top:0; left:50%;',
    '  transform:translateX(-50%);',
    '  width:120px; height:18px;',
    '  background:transparent;',
    '  pointer-events:auto; cursor:pointer;',
    '  z-index:1;',
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

    /* v0.5.6 / v0.5.8: 위젯 내 렌탈사·약정 selector */
    '.bj-widget-selector{',
    '  display:flex !important; flex-direction:column !important;',
    '  gap:10px !important;',
    /* v0.5.30: flex column 자식의 default min-width:auto가 .bj-ws-term-pills를
       콘텐츠 너비로 확장시켜 overflow-x:auto가 무력화됨 → 약정 pill 가로 스크롤 안 됨.
       부모/자식 모두 min-width:0 + max-width:100%로 viewport 폭 강제. */
    '  min-width:0 !important; max-width:100% !important; width:100% !important;',
    '}',
    /* v0.5.8: 다중 렌탈사 섹션 — "렌탈사 선택" 라벨 + 탭 + "{이름}의 약정 조건" 라벨 */
    '.bj-ws-sup-section{',
    '  display:flex !important; flex-direction:column !important; gap:6px !important;',
    '  padding-bottom:10px !important;',
    '  border-bottom:0.5px dashed #e5e5e5 !important;',
    '  min-width:0 !important; max-width:100% !important; width:100% !important;',
    '}',
    '.bj-ws-sup-label{',
    '  font-size:11px; color:#888; font-weight:600;',
    '  font-family:Pretendard,sans-serif;',
    '}',
    '.bj-ws-term-label{',
    '  font-size:12px; color:#444; font-weight:500;',
    '  margin-top:4px; font-family:Pretendard,sans-serif;',
    '}',
    '.bj-ws-term-label strong{ color:#0838F8; font-weight:700 }',
    '.bj-ws-sup-tabs{',
    '  display:flex !important; gap:6px !important;',
    '  overflow-x:auto !important; padding-bottom:2px;',
    '  -webkit-overflow-scrolling:touch;',
    '  scrollbar-width:none;',
    '}',
    '.bj-ws-sup-tabs::-webkit-scrollbar{ display:none }',
    '.bj-ws-sup-tab{',
    '  flex:0 0 auto !important; padding:7px 14px !important;',
    '  background:#f4f4f4 !important; color:#555 !important;',
    '  border:1px solid #e5e5e5 !important; border-radius:16px !important;',
    '  font:600 12.5px Pretendard,sans-serif !important; cursor:pointer !important;',
    '  white-space:nowrap !important;',
    '  transition:all 0.15s !important;',
    '}',
    '.bj-ws-sup-tab:hover{ border-color:#0838F8 !important; color:#0838F8 !important }',
    '.bj-ws-sup-tab.active{',
    '  background:#0838F8 !important; color:#fff !important;',
    '  border-color:#0838F8 !important;',
    '}',
    /* v0.5.18: 약정 pill 1행 가로 스와이프 + 컴팩트화 (이전 2행 wrap → 1행 nowrap)
       v0.5.30: min-width:0 + max-width:100% — flex column 부모 안에서 overflow-x:auto
       동작 보장 (콘텐츠 너비로 늘어나면 스크롤 영역 인지 안 됨). */
    '.bj-ws-term-pills{',
    '  display:flex !important; gap:6px !important;',
    '  flex-wrap:nowrap !important;',
    '  overflow-x:auto !important; overflow-y:hidden !important;',
    '  -webkit-overflow-scrolling:touch;',
    '  scrollbar-width:none; -ms-overflow-style:none;',
    '  padding:2px 2px 4px !important;',
    '  margin:0 -2px !important;',
    '  min-width:0 !important; max-width:100% !important; width:100% !important;',
    '  box-sizing:border-box !important;',
    '}',
    '.bj-ws-term-pills::-webkit-scrollbar{ display:none }',
    /* v0.5.19: pill을 완전 1행 — period · price 가로 배치 + 구분점
       v0.5.31: padding/gap 축소로 가로 길이 컴팩트화
       v0.5.36: border-radius 999px(캡슐) → 8px(코너만 둥근 네모) */
    '.bj-ws-term-pill{',
    '  flex:0 0 auto !important; min-width:auto !important;',
    '  padding:4px 8px !important;',
    '  background:#fafafa !important;',
    '  border:1px solid #dfdfdf !important; border-radius:8px !important;',
    '  display:inline-flex !important; flex-direction:row !important;',
    '  align-items:center !important; gap:5px !important; cursor:pointer !important;',
    '  font-family:Pretendard,sans-serif !important;',
    '  transition:border-color 0.15s, background 0.15s !important;',
    '  white-space:nowrap;',
    '  line-height:1.3;',
    '  height:auto;',
    '}',
    '.bj-ws-term-pill:hover{ border-color:#0838F8 !important }',
    '.bj-ws-term-pill.active{',
    '  border-color:#0838F8 !important; background:#eff3ff !important;',
    '}',
    /* 각 span 사이에 분리점 */
    '.bj-ws-term-pill > span + span::before{',
    '  content:"·"; color:#bbb; margin-right:7px; font-weight:400;',
    '}',
    '.bj-ws-term-period{ font-size:11.5px !important; color:#666 !important; font-weight:500 !important }',
    '.bj-ws-term-price{ font-size:12.5px !important; font-weight:700 !important; color:#0838F8 !important }',
    '.bj-ws-term-pill.active .bj-ws-term-price{ color:#0838F8 }',
    /* v0.5.32+v0.5.56: 정가 보조 라벨 — 카드 할인 없이 일반 결제하는 사용자에게도
       유효한 가격이므로 strike-through 제거 + 진회색으로 명확 표기. */
    '.bj-ws-term-orig{',
    '  font-size:11px !important; color:#555 !important; font-weight:600 !important;',
    '  margin-left:2px !important;',
    '  text-decoration:none !important;',
    '}',
    '.bj-ws-term-pill.has-card-dc .bj-ws-term-price{ color:#ee0979 !important }',
    '.bj-ws-term-pill.has-card-dc.active .bj-ws-term-price{ color:#ee0979 !important }',
    /* v0.5.33: pill 2행 마크업 + "카드/정가" 라벨
       v0.5.37: padding/gap 축소 — 위아래 더 컴팩트 */
    '.bj-ws-term-pill-2row{',
    '  flex-direction:column !important; gap:1px !important;',
    '  padding:3px 9px !important; align-items:center !important;',
    '}',
    '.bj-ws-term-row1, .bj-ws-term-row2{',
    '  display:inline-flex !important; align-items:center !important;',
    '  gap:4px !important; line-height:1.15 !important;',
    '}',
    '.bj-ws-term-price-lbl{',
    '  font-size:9px !important; font-weight:700 !important;',
    '  padding:1px 4px !important; border-radius:3px !important;',
    '  letter-spacing:0.2px !important; line-height:1.2 !important;',
    '}',
    '.bj-ws-lbl-card{ background:#ffe1ee !important; color:#ee0979 !important }',
    '.bj-ws-lbl-orig{ background:#eef0f2 !important; color:#777 !important }',
    /* row2 안의 분리점 제거 (2행 마크업에선 라벨이 명시되어 불필요) */
    '.bj-ws-term-pill-2row .bj-ws-term-row2 > span + span::before{ content:none !important }',
    '.bj-ws-term-pill-2row .bj-ws-term-row1 > span + span::before{ content:none !important }',
    /* v0.5.7+v0.5.26: BEST 배지 — absolute → inline 변경 (pill 안에 자연스럽게 배치) */
    '.bj-ws-term-pill{ position:relative !important }',
    '.bj-ws-best-badge{',
    '  display:inline-flex !important; align-items:center !important;',
    '  position:static !important;',
    '  background:linear-gradient(135deg,#ff6a00 0%,#ee0979 100%) !important;',
    '  color:#fff !important; font-size:9.5px !important; font-weight:800 !important;',
    '  padding:2px 6px !important; border-radius:8px !important; letter-spacing:0.4px !important;',
    '  box-shadow:0 1px 3px rgba(238,9,121,0.25) !important; line-height:1 !important;',
    '  font-family:Pretendard,sans-serif !important;',
    '  margin-right:5px !important; flex:0 0 auto !important;',
    '  vertical-align:middle !important;',
    '  height:auto !important;',
    '}',
    '.bj-ws-term-pill.is-best{',
    '  border-color:#ee0979 !important; background:linear-gradient(180deg,#fff5fa 0%,#fff 100%) !important;',
    '}',
    '.bj-ws-term-pill.is-best .bj-ws-term-price{ color:#ee0979 !important }',
    '.bj-ws-term-pill.is-best.active{',
    '  border-color:#ee0979 !important; background:#fff0f6 !important;',
    '  box-shadow:0 0 0 2px rgba(238,9,121,0.15) !important;',
    '}',
    /* v0.5.19: eff 카드할인 — 1행 인라인, 콤팩트 + 색만 강조 */
    '.bj-ws-term-eff{',
    '  font-size:11px !important; color:#ee0979 !important; font-weight:600 !important;',
    '  margin:0 !important; line-height:1.3 !important;',
    '  display:inline !important;',
    '}',
    /* v0.5.26: inline 변환에 따라 top/right 제거 (override 안 함) */
    '.bj-ws-best-badge{',
    '  font-size:9px !important; padding:2px 5px !important;',
    '}',
    '.bj-ws-best-dot{',
    '  display:inline-block !important; width:6px !important; height:6px !important;',
    '  margin-left:5px !important; border-radius:50% !important;',
    '  background:#ee0979 !important; vertical-align:middle !important;',
    '}',
    /* 핸들 BEST 라벨 */
    '.bj-bar-handle-best{',
    '  display:inline-block !important;',
    '  background:linear-gradient(135deg,#ff6a00 0%,#ee0979 100%) !important;',
    '  color:#fff !important; font-size:9.5px !important; font-weight:800 !important;',
    '  padding:2px 6px !important; border-radius:8px !important; letter-spacing:0.4px !important;',
    '  margin-right:6px !important; vertical-align:middle !important;',
    '  line-height:1.2 !important; font-family:Pretendard,sans-serif !important;',
    '}',
    /* v0.5.15: 핸들 옵션 칩 — 선택 옵션 표시 + 미선택 시 빨간 강조로 액션 유도 */
    '.bj-bar-handle-option{',
    '  display:inline-flex !important; align-items:center !important;',
    '  padding:3px 9px 3px 9px !important;',
    '  border-radius:999px !important;',
    '  background:#e8edff !important; color:#0838F8 !important;',
    '  font-size:11.5px !important; font-weight:700 !important;',
    /* v0.5.46: chip이 price 우측에 배치되므로 margin-right → margin-left + flex:0 0 auto */
    '  margin-left:8px !important; flex:0 0 auto !important;',
    '  vertical-align:middle !important;',
    '  line-height:1.2 !important; cursor:pointer !important;',
    '  border:1px solid #c8d4f0 !important;',
    '  font-family:Pretendard,sans-serif !important;',
    '  max-width:120px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;',
    '  transition:background 0.15s, border-color 0.15s;',
    '}',
    '.bj-bar-handle-option::before{',
    '  content:"⚙ "; font-size:11px; margin-right:2px; opacity:0.85;',
    '}',
    '.bj-bar-handle-option:hover{',
    '  background:#dde6ff !important; border-color:#0838F8 !important;',
    '}',
    /* v0.5.44: is-empty 색상 빨강(경고) → 빌리조 테마 금색.
       v0.5.45: #ffd000 glow 효과 — blur 변화로 빛이 새어나오는 발광 느낌. */
    '.bj-bar-handle-option.is-empty{',
    '  background:#fff8e1 !important; color:#b45309 !important;',
    '  border-color:#ffd000 !important;',
    '  animation:bjOptionGlow 1.8s ease-in-out infinite;',
    '}',
    '.bj-bar-handle-option.is-empty::before{ content:"✦ "; opacity:1 }',
    '@keyframes bjOptionGlow{',
    '  0%,100%{',
    '    transform:scale(1);',
    '    box-shadow:0 0 4px #ffd000, 0 0 8px rgba(255,208,0,0.5);',
    '  }',
    '  50%{',
    '    transform:scale(1.03);',
    '    box-shadow:0 0 8px #ffd000, 0 0 16px rgba(255,208,0,0.7), 0 0 24px rgba(255,208,0,0.35);',
    '  }',
    '}',
    /* v0.5.15: 위젯 펼친 영역의 .bb-option-select 스타일 — 가독성·터치 영역 확보 */
    '.bj-bb-inner-merged .bb-option-select,',
    '.bj-bb-inner-merged .option_select,',
    '.bj-bar-fallback .bb-option-select,',
    '.bj-bar-fallback .option_select{',
    '  width:100% !important; padding:11px 36px 11px 12px !important;',
    '  border:1px solid #dfdfdf !important; border-radius:8px !important;',
    '  font-size:13.5px !important; font-weight:600 !important;',
    '  font-family:Pretendard,sans-serif !important;',
    '  background:#fff !important; color:#2a2a2a !important;',
    '  -webkit-appearance:none !important; appearance:none !important;',
    '  background-image:url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'><path d=\'M2 4l4 4 4-4\' stroke=\'%230838F8\' stroke-width=\'1.5\' fill=\'none\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/></svg>") !important;',
    '  background-repeat:no-repeat !important; background-position:right 12px center !important;',
    '  background-size:12px !important;',
    '  margin:6px 0 8px !important;',
    '  cursor:pointer !important;',
    '  box-shadow:0 0 0 0 rgba(8,56,248,0) !important;',
    '  transition:border-color 0.15s, box-shadow 0.15s;',
    '}',
    /* v0.5.18: 버튼 그룹으로 대체된 select는 숨김 (value sync 위해 DOM은 유지) */
    '.bj-option-select-replaced{ display:none !important }',
    /* v0.5.18: 옵션 버튼 그룹 — 가로 1행 스와이프 */
    '.bj-option-buttons{',
    '  display:flex !important; gap:6px !important;',
    '  flex-wrap:nowrap !important;',
    '  overflow-x:auto !important; overflow-y:hidden !important;',
    '  -webkit-overflow-scrolling:touch;',
    '  scrollbar-width:none; -ms-overflow-style:none;',
    '  margin:6px 0 8px !important; padding:2px 2px 4px !important;',
    /* v0.5.33: flex row 부모(.bj-fb-option-box) 안에서 가로 스크롤 보장 */
    '  flex:1 1 0 !important; min-width:0 !important; max-width:100% !important;',
    '  box-sizing:border-box !important;',
    '}',
    '.bj-option-buttons::-webkit-scrollbar{ display:none }',
    '.bj-option-btn{',
    '  flex:0 0 auto !important;',
    '  padding:8px 14px !important;',
    '  background:#fff !important;',
    '  border:1px solid #dfdfdf !important; border-radius:999px !important;',
    '  font-family:Pretendard,sans-serif !important;',
    '  font-size:12.5px !important; font-weight:600 !important; color:#555 !important;',
    '  cursor:pointer !important; white-space:nowrap;',
    '  transition:all 0.15s !important;',
    '  line-height:1.2 !important;',
    '}',
    '.bj-option-btn:hover{',
    '  border-color:#0838F8 !important; color:#0838F8 !important;',
    '  background:#f5f8ff !important;',
    '}',
    '.bj-option-btn.active{',
    '  background:#0838F8 !important; color:#fff !important;',
    '  border-color:#0838F8 !important; font-weight:700 !important;',
    '  box-shadow:0 2px 6px rgba(8,56,248,0.2) !important;',
    '}',
    '@media (max-width:600px){',
    '  .bj-option-btn{ padding:7px 12px !important; font-size:11.5px !important }',
    '}',
    '.bj-bb-inner-merged .bb-option-select:focus,',
    '.bj-bb-inner-merged .option_select:focus,',
    '.bj-bar-fallback .bb-option-select:focus,',
    '.bj-bar-fallback .option_select:focus{',
    '  outline:none !important; border-color:#0838F8 !important;',
    '  box-shadow:0 0 0 3px rgba(8,56,248,0.15) !important;',
    '}',
    '@media (max-width:600px){',
    '  .bj-ws-sup-tab{ padding:5px 10px !important; font-size:11.5px !important }',
    '  .bj-ws-term-pill{ padding:4px 10px !important; min-width:auto !important; gap:5px !important }',
    '  .bj-ws-term-period{ font-size:11px !important }',
    '  .bj-ws-term-price{ font-size:12px !important }',
    '  .bj-ws-term-eff{ font-size:10.5px !important }',
    '  .bj-ws-term-pill > span + span::before{ margin-right:5px }',
    '  .bj-ws-term-period{ font-size:10.5px }',
    '  .bj-ws-term-price{ font-size:13px }',
    '}',

    /* v0.5.5: 위젯 안 중복 콘텐츠 제거 (AI 카드 SLOT 3·5·7·8과 중복) */
    /* (1) "렌탈사 비교·선택" 헤더 → AI 카드 SLOT 5(페르소나) / SLOT 8(LPT)이 대체 */
    '.prod_view_bot.card.mt40 .card__top,',
    '.prod_view_bot.card.mt40 .card__tit{',
    '  display:none !important;',
    '}',
    /* (2) 렌탈사 li 카드 (icon·name·sub·month·card_sale 일체) → SLOT 8 LPT가 대체 */
    '.prod_view_bot.card.mt40 .rantal_wrap,',
    '.prod_view_bot.card.mt40 ul.rantal_wrap,',
    '.prod_view_bot.card.mt40 .rantal_wrap > li{',
    '  display:none !important;',
    '}',
    /* (3) 제휴카드 안내 .card_sale (위젯 안 인스턴스만) → SLOT 8 LPT가 대체 */
    '.prod_view_bot.card.mt40 .card_sale{',
    '  display:none !important;',
    '}',
    /* (4) .over 영역 (수량 +/- · 옵션 wrap · 제휴카드 등) — AI 카드에 정보 다 있음, 버튼은 핸들 우측에 별도 노출 */
    '.prod_view_bot.card.mt40 .over,',
    '.prod_view_bot.card.mt40 .month_click,',
    '.prod_view_bot.card.mt40 .select__wrap,',
    '.prod_view_bot.card.mt40 .amount__wrap{',
    '  display:none !important;',
    '}',

    /* v0.5.4: 핸들+bb-inner 병합 — bb-inner를 단일 column 레이아웃으로 재구성 */
    '.prod_view_bot.card.mt40 .bb-inner.bj-bb-inner-merged{',
    '  display:flex !important; flex-direction:column !important;',
    '  gap:12px !important; padding:14px 18px 18px !important;',
    '}',
    /* bb-left·bb-right column 폐기 — 단일 column flex로 통합 */
    '.bj-bb-inner-merged .bb-left, .bj-bb-inner-merged .bb-right{',
    '  display:contents !important;',
    '}',
    /* 약정 pill 행 — 가로 배치, 클릭형 카드.
       v0.5.30: flex-wrap:wrap → nowrap + overflow-x:auto. 약정 많은 케이스(LG·코웨이)
       에서 2-3행 wrap이 화면 점거 + 가로 스크롤 못해 일부 약정 선택 불가능 → 1행 스크롤 통일. */
    '.bj-bb-inner-merged .bb-months{',
    '  display:flex !important; gap:8px !important; flex-wrap:nowrap !important;',
    '  overflow-x:auto !important; overflow-y:hidden !important;',
    '  -webkit-overflow-scrolling:touch;',
    '  scrollbar-width:none; -ms-overflow-style:none;',
    '  margin:0 !important; padding:2px 0 4px !important;',
    '  min-width:0 !important; max-width:100% !important; width:100% !important;',
    '  box-sizing:border-box !important;',
    '}',
    '.bj-bb-inner-merged .bb-months::-webkit-scrollbar{ display:none }',
    '.bj-bb-inner-merged .bb-month-pill{',
    '  flex:0 0 auto !important; min-width:120px !important;',
    '  padding:10px 12px !important;',
    '  border:1px solid #dfdfdf !important; border-radius:10px !important;',
    '  background:#fafafa !important;',
    '  display:flex !important; flex-direction:column !important;',
    '  align-items:center !important; gap:2px !important; cursor:pointer !important;',
    '  transition:border-color 0.15s, background 0.15s !important;',
    '}',
    '.bj-bb-inner-merged .bb-month-pill:hover,',
    '.bj-bb-inner-merged .bb-month-pill.active{',
    '  border-color:#0838F8 !important; background:#eff3ff !important;',
    '}',
    '.bj-bb-inner-merged .bb-month-period{ font-size:11px; color:#666; font-weight:500 }',
    '.bj-bb-inner-merged .bb-month-price{ font-size:14px; font-weight:700; color:#0838F8 }',
    /* 버튼 행 — 3버튼 가로 균등 분배 */
    '.bj-bb-inner-merged .bb-right-top{',
    '  display:flex !important; gap:8px !important; margin:0 !important;',
    '  width:100% !important;',
    '}',
    '.bj-bb-inner-merged .bb-right-top .bb-btn{',
    '  flex:1 1 0 !important; min-width:0 !important;',
    '  justify-content:center !important;',
    '}',
    /* 장바구니는 비교적 좁게 */
    '.bj-bb-inner-merged .bb-right-top .bb-btn-cart{ flex:0 0 auto !important; min-width:84px !important }',
    /* 모바일 ≤600px — 약정 pill·버튼 폰트 축소 */
    '@media (max-width:600px){',
    '  .bj-bb-inner-merged{ padding:12px 14px 14px !important; gap:10px !important }',
    '  .bj-bb-inner-merged .bb-month-pill{ padding:8px 10px !important; min-width:100px !important }',
    '  .bj-bb-inner-merged .bb-month-period{ font-size:10.5px }',
    '  .bj-bb-inner-merged .bb-month-price{ font-size:13px }',
    '  .bj-bb-inner-merged .bb-right-top{ gap:6px !important }',
    '  .bj-bb-inner-merged .bb-right-top .bb-btn{ font-size:12px !important; padding:9px 8px !important }',
    '  .bj-bb-inner-merged .bb-right-top .bb-btn-cart{ min-width:68px !important }',
    '}',

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

    /* v0.4.0: fallback 박스 — .bb-inner 없을 때 위젯 자체 콘텐츠
       v0.5.37: 위아래 padding + gap 축소 */
    '.bj-bar-fallback{',
    '  padding:8px 18px 10px !important;',
    '  display:flex !important; align-items:center !important;',
    '  justify-content:space-between !important; gap:8px !important;',
    '  flex-wrap:wrap !important;',
    '  font-family:"Pretendard","Apple SD Gothic Neo",sans-serif !important;',
    '}',
    '.bj-fb-info{ display:flex; flex-direction:column; gap:2px; flex:0 1 auto; min-width:0 }',
    /* v0.5.25: 옵션 select wrapper 박스 — fallback 위젯 안에 라벨+드롭다운 명확 노출 */
    '.bj-fb-option-box{',
    '  display:flex !important; flex-direction:row !important;',
    '  align-items:center !important; gap:8px !important;',
    /* v0.5.37: 위아래 padding 축소 + margin 축소 */
    '  margin:0 0 4px !important; padding:5px 10px !important;',
    '  background:#f7f9ff !important;',
    '  border:1px solid #d6e0fb !important; border-radius:8px !important;',
    '  width:100% !important; flex:1 1 100% !important;',
    '  font-family:Pretendard,sans-serif !important;',
    '}',
    '.bj-fb-option-label{',
    '  font-size:12.5px !important; font-weight:700 !important; color:#0838F8 !important;',
    '  flex:0 0 auto !important; white-space:nowrap !important;',
    '}',
    '.bj-fb-option-box .bb-option-select,',
    '.bj-fb-option-box .option_select{',
    '  flex:1 1 auto !important; margin:0 !important;',
    '  width:auto !important; min-width:120px !important;',
    '}',
    '@media (max-width:600px){',
    '  .bj-fb-option-box{ padding:7px 10px !important; gap:8px !important }',
    '  .bj-fb-option-label{ font-size:12px !important }',
    '  .bj-fb-option-box .bb-option-select,',
    '  .bj-fb-option-box .option_select{ font-size:12px !important; min-width:100px !important; padding:7px 28px 7px 10px !important }',
    '}',
    '.bj-fb-label{ font-size:11.5px; color:#6a6a6a; font-weight:600 }',
    '.bj-fb-price{ font-size:17px; font-weight:800; color:#0838F8; line-height:1.2 }',
    /* v0.5.26: 3버튼 풀폭 stretch — 위젯 가로 폭을 균등 분배
       v0.5.37: 위 margin + 버튼 위아래 padding 축소 */
    '.bj-fb-btns{',
    '  display:flex !important; align-items:stretch !important; gap:8px !important;',
    '  flex:1 1 100% !important; flex-wrap:nowrap !important;',
    '  width:100% !important; justify-content:stretch !important;',
    '  margin-top:4px !important;',
    '}',
    '.bj-fb-btns .bb-btn{',
    '  flex:1 1 0 !important;',
    '  display:inline-flex !important; align-items:center !important; justify-content:center !important; gap:6px !important;',
    '  padding:8px 8px !important; font-size:13px !important; font-weight:700 !important;',
    '  border-radius:8px !important; cursor:pointer !important;',
    '  font-family:"Pretendard",sans-serif !important;',
    '  border:1px solid #dfdfdf; background:#fff; color:#2a2a2a;',
    '  transition:background 0.15s; white-space:nowrap;',
    '}',
    /* 렌탈+사은품(주 액션)을 살짝 더 넓게 */
    '.bj-fb-btns .bb-btn-rent,',
    '.bj-fb-btns .bj-btn-rent-gift{ flex:1.5 1 0 !important }',
    '.bj-fb-btns .bb-btn svg{ width:16px; height:16px; fill:currentColor }',
    '.bj-fb-btns .bb-btn-cart{ background:#fff; color:#444; border:1px solid #dfdfdf }',
    '.bj-fb-btns .bb-btn-cart:hover{ background:#f4f4f4 }',
    '@media (max-width:600px){',
    /* v0.5.37: 모바일도 위아래 padding 축소 */
    '  .bj-bar-fallback{ padding:6px 12px 8px !important; gap:6px !important }',
    '  .bj-fb-label{ font-size:11px }',
    '  .bj-fb-price{ font-size:15.5px }',
    '  .bj-fb-btns{ gap:6px; width:100%; justify-content:stretch }',
    '  .bj-fb-btns .bb-btn{ padding:7px 11px; font-size:12.5px; flex:1 1 auto; justify-content:center }',
    '  .bj-fb-btns .bb-btn-cart{ flex:0 0 auto; min-width:60px }',
    '}',
    '@media (max-width:400px){',
    '  .bj-fb-btns .bb-btn{ padding:6px 8px; font-size:11.5px }',
    '  .bj-fb-btns .bb-btn svg{ width:14px; height:14px }',
    '}',

    /* v0.5.47: 만기 후 소유권 이전 chip — 반납 조건 아닌 제품에 자동 추가
       v0.5.53: 모든 .rt-r 사이 통일 dashed (PC도 모바일과 동일). ownership row만의
       노란 #f0e5b8 차별화 폐기 → 회색 #c8cdd6으로 통일감 우선. */
    '#ai-card-root .rental-terms .rt-r + .rt-r{',
    '  border-top:1px dashed #c8cdd6 !important;',
    '  padding-top:8px !important; margin-top:8px !important;',
    '}',
    '#ai-card-root .rental-terms .bj-ownership-row{',
    '  display:flex !important; align-items:center !important;',
    '  justify-content:space-between !important;',
    '  border-top:1px dashed #c8cdd6 !important;',
    '  padding-top:8px !important; margin-top:8px !important;',
    '}',
    '#ai-card-root .rental-terms .bj-ownership-row .rt-l{',
    '  color:#555 !important; font-weight:600 !important;',
    '}',
    '#ai-card-root .rental-terms .bj-ownership-chip{',
    '  display:inline-block !important;',
    '  background:#ffd000 !important; color:#3a2a00 !important;',
    '  padding:5px 12px !important; border-radius:6px !important;',
    '  font-weight:800 !important; font-size:12.5px !important;',
    '  font-family:Pretendard,sans-serif !important;',
    '  letter-spacing:0.2px !important; line-height:1.3 !important;',
    '  box-shadow:0 1px 3px rgba(255,208,0,0.35) !important;',
    '}',
    '#ai-card-root .rental-terms .bj-ownership-chip::before{',
    '  content:"✓ "; font-weight:700;',
    '}',
    '@media (max-width:600px){',
    /* v0.5.53: dashed 패턴은 기본 룰로 이동 (PC도 동일 적용). 모바일은 chip 컴팩트만 유지. */
    '  #ai-card-root .rental-terms .bj-ownership-chip{',
    '    font-size:12px !important; padding:2px 8px !important;',
    '    box-shadow:none !important;',
    '  }',
    /* v0.5.57: 모바일만 의무 사용 기간(2번째 row) 위 dashed 제거 — 약정 카테고리 그룹화.
       PC는 모든 row 사이 dashed 유지 (좁은 모바일에선 시각 빽빽함 완화). */
    '  #ai-card-root .rental-terms .rt-r:nth-of-type(2){',
    '    border-top:0 !important;',
    '    padding-top:0 !important; margin-top:0 !important;',
    '  }',
    '}',

    /* body 하단 패딩 — fixed 위젯이 마지막 콘텐츠 가리지 않게
       v0.5.37: collapsed 높이 축소에 맞춰 padding-bottom 동기 축소 */
    'body{ padding-bottom:72px !important }',

    /* v0.5.42: 빌리조 quick-call/top floating 버튼(.new-qb, .goTop)을 위젯과 겹치지 않게
       위로 올림. :has()로 wrapper 상태 추적해서 collapsed/expanded/dismiss 자동 조정. */
    '.new-qb, .goTop{',
    '  bottom:60px !important;',  /* collapsed 48px + 12px 여백 */
    '  transition:bottom 0.32s cubic-bezier(0.4, 0, 0.2, 1) !important;',
    '}',
    'body:has(.prod_view_bot.card.mt40.bj-bar-expanded) .new-qb,',
    'body:has(.prod_view_bot.card.mt40.bj-bar-expanded) .goTop{',
    '  bottom:calc(min(440px, 75vh) + 12px) !important;',  /* expanded max-height + 여백 */
    '}',
    'body:has(.prod_view_bot.card.mt40.bj-bar-slide-hidden) .new-qb,',
    'body:has(.prod_view_bot.card.mt40.bj-bar-slide-hidden) .goTop{',
    '  bottom:12px !important;',  /* dismiss 시 원래 위치 */
    '}',

    /* 모바일 컴팩트 */
    '@media (max-width:600px){',
    '  body{ padding-bottom:64px !important }',
    /* v0.5.42: 모바일 collapsed 44px + 12px 여백 */
    '  .new-qb, .goTop{ bottom:56px !important }',
    /* v0.5.37: 모바일 핸들도 위아래 padding 축소 */
    '  .bj-bar-handle{ padding:11px 14px 5px }',
    '  .bj-bar-handle-text{ font-size:12px }',
    '  .bj-bar-handle-price{ font-size:13px }',
    '  .bj-bar-handle-option{ font-size:11px !important; padding:2px 8px !important; max-width:90px; margin-left:6px !important }',
    '  .bj-bar-handle-toggle{ width:34px; height:22px; font-size:12px }',
    '  .prod_view_bot.card.mt40 .bb-inner{ padding:8px 14px !important }',
    '  .bj-btn-consult{ padding:7px 11px; font-size:12.5px }',
    '  .bb-btn-rent.bj-btn-rent-gift{ font-size:13px }',
    '  .prod_view_bot.card.mt40.bj-bar-collapsed{ max-height:44px !important }',
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
    /* 데스크탑(≥901px) — absolute 위치 유지하되 viewport 폭에 안전하게 clamp
       v0.5.10: JS 위치 보정 (setupHelpClose에서 transform 조정) 시 부드럽게 슬라이드되도록 transition */
    '.help-pop, #ai-card-root .help-pop{',
    '  max-width:min(280px, calc(100vw - 24px)) !important;',
    /* v0.5.49: 빌리조 페이지에서 .help-pop이 white-space:nowrap을 상속받아 텍스트가
       한 줄로 펼쳐지는 문제. normal로 강제 + overflow-wrap:anywhere로 긴 단어도 wrap 보장. */
    '  white-space:normal !important;',
    '  word-break:keep-all !important;',
    '  overflow-wrap:anywhere !important;',
    '  box-sizing:border-box !important;',
    '  transition:transform 0.12s ease-out;',
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
    /* v0.5.49: 모바일에서도 white-space:normal 명시 (specificity 안전) */
    '    white-space:normal !important;',
    '    overflow-wrap:anywhere !important;',
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
    '}',

    /* v0.5.14: fallback과 격상 안 된 .bb-inner가 공존 시 .bb-inner 안전망 숨김 */
    '.prod_view_bot.card.mt40 .bj-bar-fallback ~ .bb-inner,',
    '.prod_view_bot.card.mt40 .bj-bar-fallback + .bb-inner{',
    '  display:none !important;',
    '}',

    /* === v0.5.11: 빌리조 원본 2버튼 sticky 위젯(.prod_fix_wrap) 제거 ===
       우리 v0.5.x 위젯(.prod_view_bot.card.mt40 → fixed bottom)과 중복으로 떠 있어
       사용자 혼란 발생. 빌리조 원본 [장바구니][렌탈신청] 2버튼 sticky bar를 완전 숨김.
       PC: .prod_fix_wrap.prod_fix
       모바일: .prod_fix_wrap.prod_fix_m */
    '.prod_fix_wrap,',
    '.prod_fix_wrap.prod_fix,',
    '.prod_fix_wrap.prod_fix_m{',
    '  display:none !important;',
    '  visibility:hidden !important;',
    '  pointer-events:none !important;',
    '  height:0 !important;',
    '  overflow:hidden !important;',
    '}',

    /* === v0.5.24: 빌리조 main inject.js의 #billyjo-bottom-bar 위젯 자체 즉시 hide ===
       DOM 삭제 직전 paint frame 차단. JS에서 removeChild로 완전 제거. */
    'body > #billyjo-bottom-bar,',
    '#billyjo-bottom-bar:not(.bj-ours-keep){',
    '  display:none !important;',
    '  visibility:hidden !important;',
    '  pointer-events:none !important;',
    '  height:0 !important; overflow:hidden !important;',
    '  transform:translateY(200px) !important;',
    '}',

    /* === v0.5.22: 격상 안 된 .bb-inner는 어디에 있든 무조건 숨김 ===
       빌리조 main inject.js가 .bb-inner를 wrapper(.prod_view_bot.card.mt40) 안/밖 어디든
       동적 mount. 우리 enhanceBottomBar가 격상하면 .bj-bb-inner-merged 클래스 부착 → 보임.
       격상 안 된 .bb-inner는 무조건 hide → wrapper 위치·timing 무관하게 안전. */
    'body .bb-inner:not(.bj-bb-inner-merged){',
    '  display:none !important;',
    '  visibility:hidden !important;',
    '  pointer-events:none !important;',
    '  height:0 !important; overflow:hidden !important;',
    '}',

    /* === v0.5.20: 업소용 카테고리(prod_list/10-1153) 노출 복원 ===
       빌리조 main inject.js가 prod_list/10-* 일괄 숨김 처리 중. 우리가 메인 1153만 다시 노출.
       cascade 후순(detailcard가 inject보다 늦게 로드) + 같은 specificity로 override. */
    '.category__wrap a[href*="prod_list/10-1153"],',
    '.gnb__menu a[href*="prod_list/10-1153"],',
    'ul.all__depth1 a[id="10"],',
    'li.gnb__menu:has(> a[href*="prod_list/10-1153"]),',
    '.menu__gsnb a[href*="prod_list/10-1153"],',
    '.aside_sub a[href*="prod_list/10-1153"]{',
    '  display:revert !important; visibility:visible !important;',
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
    /* v0.5.3: display:block 강제 — billyjo underlying의 display:none override */
    wrapper.style.cssText = (wrapper.style.cssText || '') +
      ';display:block!important;position:fixed!important;bottom:0!important;left:0!important;right:0!important;' +
      'z-index:99999!important;margin:0!important;';
  }

  function enhanceBottomBar(){
    var wrapper = document.querySelector('.prod_view_bot.card.mt40');
    if (!wrapper) return;

    /* v0.5.34: forceFixedStyle은 1회만 호출 — 매 runAll 호출 시 cssText에 누적되는 문제 차단 */
    if (!wrapper.dataset.bjFixedStyled) {
      forceFixedStyle(wrapper);
      wrapper.dataset.bjFixedStyled = '1';
    }

    /* v0.5.14: bb-inner가 늦게 들어왔는데 우리 fallback이 이미 있으면 fallback 제거 후 격상 시도 */
    var currBbInner = wrapper.querySelector('.bb-inner');
    if (wrapper.dataset.bjBarEnhanced) {
      if (currBbInner && !currBbInner.classList.contains('bj-bb-inner-merged')) {
        var oldFallback = wrapper.querySelector('.bj-bar-fallback');
        if (oldFallback) oldFallback.remove();
        wrapper.dataset.bjBarEnhanced = '';  /* 재실행 허용 */
      } else {
        return;  /* 이미 격상 완료 */
      }
    }
    /* v0.5.34: 무조건 'bj-bar-expanded' add는 가드 안으로 — 매 runAll 호출 시
       사용자가 collapsed로 토글한 직후 expanded class를 강제 추가하면 두 class 공존 →
       CSS cascade로 collapsed(뒤에 정의)가 이김 → "펼침 안 됨" 증상. 첫 실행 시만 default. */

    /* v0.5.5: 위젯 안 .rantal_wrap·.card__tit·.card_sale 등 중복 콘텐츠는 CSS로 숨김 처리됨.
       남는 표시 요소: 핸들(제품명+가격) + bb-inner(약정 pill + 3버튼) */
    var bbInner = wrapper.querySelector('.bb-inner');
    var prodName, priceEl, firstMonthPill;
    if (bbInner) {
      prodName = bbInner.querySelector('.bb-product-name');
      firstMonthPill = bbInner.querySelector('.bb-month-pill .bb-month-price');
      priceEl  = bbInner.querySelector('.bb-price') || firstMonthPill;
    }
    /* fallback — .rantal_wrap 안 .month_box (네이티브 렌탈사 카드)에서 첫 가격 추출 */
    if (!priceEl) {
      var nativeMonth = wrapper.querySelector('.rantal_wrap .month_box .fz16');
      if (nativeMonth) priceEl = nativeMonth;
    }
    /* fallback — .rantal_wrap 안 첫 .name (렌탈사명) → 핸들에는 사용 안 함, 제품명은 상단 .prod_name */
    /* v0.5.4: 핸들 텍스트는 brand prefix("세스코 - ", "쿠쿠 - ", "세스코 " 등) 제거하여 모델명만 노출 */
    var rawName = (prodName && prodName.textContent.trim()) ||
                  (document.querySelector('.prod_name b') && document.querySelector('.prod_name b').textContent.trim()) ||
                  '렌탈 신청';
    var KNOWN_BRANDS = /^(세스코|코웨이|쿠쿠|SK매직|sk매직|LG|LG전자|삼성|삼성전자|위닉스|루헨스|쿠첸|바디프랜드|보람피플|BS렌탈|BS ON|현대렌탈서비스|위덱|위더스렌탈|자이글|렌타나|스마트렌탈|지니원|코지마|드롱기|유라|일렉트로룩스|인켈|로보락|파나소닉|기아|현대|KT)\s*[-·]?\s*/;
    var nameText = rawName.replace(KNOWN_BRANDS, '').trim() || rawName;
    var priceText = (priceEl && priceEl.textContent.trim()) ||
                    (document.querySelector('.top_min_price b') && '월 ' + document.querySelector('.top_min_price b').textContent.trim() + '원') ||
                    '';

    /* v0.5.8: 핸들 = 가격만 (제품명 제거 — 사용자가 어떤 제품인지 이미 알고 있음).
       BEST 라벨 + 가격 + 토글 chevron만. */
    var handle = document.createElement('div');
    handle.className = 'bj-bar-handle';
    handle.setAttribute('role', 'button');
    handle.setAttribute('aria-label', '렌탈 신청 영역 펼치기/접기');
    handle.setAttribute('tabindex', '0');
    handle.innerHTML =
      '<div class="bj-bar-handle-text">' +
        (priceText ? '<span class="bj-bar-handle-price">' + priceText + '</span>' : '<span class="bj-bar-handle-price">렌탈 신청</span>') +
      '</div>' +
      '<button type="button" class="bj-bar-handle-toggle" aria-label="펼치기/접기">' +
        '<span class="bj-bar-chevron">▾</span>' +
      '</button>';

    /* v0.5.4: bb-inner 내부 중복 요소 숨김 — 핸들이 이미 표시.
       - .bb-product-name: 핸들의 name과 중복
       - .bb-right-bottom: "월 렌탈료 -" 라벨, 핸들의 price와 중복 (가격은 펼침 시 .bb-months에서 약정별 표시)
       남는 요소: .bb-months (약정별 pill — 펼침 시 메인 콘텐츠) + .bb-right-top (버튼 3개) */
    if (bbInner) {
      var pn = bbInner.querySelector('.bb-product-name');
      if (pn) pn.style.setProperty('display', 'none', 'important');
      var rb = bbInner.querySelector('.bb-right-bottom');
      if (rb) rb.style.setProperty('display', 'none', 'important');
      /* bb-inner 자체를 단일 column flex로 — 약정 pill 윗줄, 버튼 행 아랫줄 */
      bbInner.classList.add('bj-bb-inner-merged');
    }

    function toggle(){
      var collapsed = wrapper.classList.toggle('bj-bar-collapsed');
      wrapper.classList.toggle('bj-bar-expanded', !collapsed);
    }
    /* v0.5.28: click 핸들러 제거 — setupHandleDragGesture의 mouseup/touchend 탭 분기가
       이미 toggle을 호출함. 두 핸들러 동시 등록 시 사용자 클릭마다 두 번 토글되어
       원래 상태로 되돌아옴 → "펼침 버튼이 안 보임" 버그. keydown만 유지. */
    handle.addEventListener('keydown', function(e){
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
    /* v0.5.14: 핸들 중복 방지 — 이미 있으면 새것으로 교체 (재실행 케이스) */
    var existingHandle = wrapper.querySelector(':scope > .bj-bar-handle');
    if (existingHandle) existingHandle.remove();
    wrapper.insertBefore(handle, wrapper.firstChild);

    /* v0.4.0: SVG 아이콘 */
    var SVG_GIFT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"/></svg>';
    /* v0.5.43: 상담신청 아이콘 — 채팅 말풍선 → 전화 수화기 (Material 'phone' icon).
       사용자 요청: 상담은 전화 통화로 진행되므로 직관적 phone 아이콘이 적절. */
    var SVG_PHONE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>';
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
          consult.innerHTML = SVG_PHONE + '상담신청';
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
        '<div class="bj-fb-selector"></div>' +  /* v0.5.6: 렌탈사·약정 selector mount */
        '<div class="bj-fb-btns">' +
          '<button type="button" class="bb-btn bb-btn-cart bj-fb-cart">' + SVG_CART + '장바구니</button>' +
          '<button type="button" class="bb-btn bb-btn-rent bj-btn-rent-gift bj-fb-rent">' + SVG_GIFT + '렌탈+사은품 신청</button>' +
          '<button type="button" class="bb-btn bj-btn-consult bj-fb-consult">' + SVG_PHONE + '상담신청</button>' +
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

    /* v0.5.6: 렌탈사·약정 selector — 위젯에 컴팩트 UI 빌드.
       underlying .rantal_wrap > li 데이터를 스캔하여 [렌탈사 탭] + [약정 pill] 렌더.
       클릭 시: (1) underlying .month_box.layer_price 실제 클릭 트리거 (가격/주문 데이터 동기화)
                (2) 핸들 가격 + 위젯 가격 표시 갱신 */
    buildWidgetSelector(wrapper, handle);

    /* v0.5.15: 옵션 select (.bb-option-select) 처리 — 핸들에 미러링 + 펼친 영역 스타일 */
    syncOptionSelectToHandle(wrapper, handle);

    /* v0.5.15: wrapper 외부에 떠 있는 .bb-inner는 강제 숨김 (이중 노출 방지) */
    document.querySelectorAll('.bb-inner').forEach(function(inner){
      if (!wrapper.contains(inner)) {
        inner.style.setProperty('display', 'none', 'important');
        inner.setAttribute('data-bj-extra-hidden', '1');
      }
    });

    wrapper.dataset.bjBarEnhanced = '1';
  }

  /* v0.5.15+v0.5.17: 옵션 select 처리 — 핸들 옆 chip 미러링 + 위젯에 select 노출.
     selector: .bb-option-select (빌리조 동적 생성) + .option_select (페이지 원본)
     wrapper 안에 없으면 페이지 내 visible select를 위젯에 클론 후 양방향 sync. */
  function syncOptionSelectToHandle(wrapper, handle){
    /* v0.5.28: 가드를 .bj-option-clone 한정으로 좁힘 — 빌리조의 .bb-option-select가
       .bb-inner 안에 hidden/압축 상태로 있을 수 있어, 그것을 "이미 있다"고 판단하면
       사용자 가시 박스가 만들어지지 않음. 우리 자체 clone(.bj-option-clone)만 신뢰. */
    var select = wrapper.querySelector('.bj-option-clone');
    if (!select) {
      /* v0.5.35: wrapper.contains() 가드 폐기 — 18055 등 페이지에서 native select가
         wrapper(.prod_view_bot.card.mt40) 안의 .rantal_wrap > .option__wrap에 위치.
         이전 가드는 그 native select도 skip해서 orig=null → 옵션 박스 안 만들어짐.
         우리가 만든 .bj-option-clone만 skip하도록 좁힘. */
      var allSelects = document.querySelectorAll('.option_select, .bb-option-select');
      var orig = null;
      for (var i = 0; i < allSelects.length; i++) {
        var s = allSelects[i];
        if (s.classList && s.classList.contains('bj-option-clone')) continue;
        /* 빌리조 원본 sticky 위젯 안 (.prod_fix_wrap) select는 v0.5.11에서 숨겼지만 값/이벤트는 정상 — skip */
        if (s.closest && s.closest('.prod_fix_wrap')) continue;
        if (s.options && s.options.length > 1) { orig = s; break; }
      }
      if (!orig) return;
      /* 클론 + 위젯 안 위치에 삽입 */
      var cloneSelect = orig.cloneNode(true);
      cloneSelect.classList.add('bb-option-select', 'bj-option-clone');
      cloneSelect.removeAttribute('onchange');
      cloneSelect.value = orig.value;
      /* v0.5.32: 클릭 동작 강화 — wrapper z-index:99999 환경에서도 native select dropdown
         정상 동작 보장. disabled 속성·인라인 pointer-events:none 등 클론에 따라온 잠재 차단 해제. */
      cloneSelect.removeAttribute('disabled');
      cloneSelect.disabled = false;
      cloneSelect.style.cssText = 'pointer-events:auto !important; cursor:pointer !important; ' +
        'position:relative !important; z-index:2 !important; ' +
        'opacity:1 !important; visibility:visible !important; display:block !important;';
      /* 양방향 sync */
      cloneSelect.addEventListener('change', function(){
        orig.value = cloneSelect.value;
        try { orig.dispatchEvent(new Event('change', { bubbles: true })); } catch(_){}
        /* 빌리조 onchange="option_selec(this.value)" 직접 호출 fallback */
        if (typeof window.option_selec === 'function') {
          try { window.option_selec(cloneSelect.value); } catch(_){}
        }
      });
      orig.addEventListener('change', function(){
        if (cloneSelect.value !== orig.value) {
          cloneSelect.value = orig.value;
          try { cloneSelect.dispatchEvent(new Event('change', { bubbles: true })); } catch(_){}
        }
      });
      /* v0.5.25: 삽입 위치 — 라벨 + select wrapper 박스로 감싸 명확히 노출 */
      var optBox = document.createElement('div');
      optBox.className = 'bj-fb-option-box';
      /* select의 첫 option ("옵션을 선택해주세요.") 텍스트로 라벨 추론 */
      var labelText = '옵션 선택';
      /* 빌리조 페이지에서 select 가까이 "색상" 등 th 라벨 찾기 */
      var nearTh = orig.closest('tr') && orig.closest('tr').querySelector('th');
      if (nearTh && nearTh.textContent.trim()) {
        labelText = nearTh.textContent.trim();
      } else {
        /* 페이지 .prod_table_wrap에서 색상 td 옆 th 찾기 시도 */
        var ths = document.querySelectorAll('.prod_table th');
        for (var ti = 0; ti < ths.length; ti++) {
          if (/색상|컬러|옵션|타입|용량|사이즈/.test(ths[ti].textContent)) {
            labelText = ths[ti].textContent.trim(); break;
          }
        }
      }
      var label = document.createElement('div');
      label.className = 'bj-fb-option-label';
      label.textContent = labelText + ' 선택';
      optBox.appendChild(label);
      optBox.appendChild(cloneSelect);

      /* v0.5.31: 삽입 위치 일원화 — 항상 handle 바로 다음 (wrapper 최상단의 visible 영역).
         이전 .bb-inner 앞 분기는 .bb-inner가 wrapper 외부에 있는 케이스에서 동작 안 함.
         handle 다음으로 통일하면 어떤 페이지 변종이든 가시 영역에 위치.
         + inline style로 display/visibility 강제 — CSS 충돌 안전망. */
      optBox.style.cssText = 'visibility:visible !important; opacity:1 !important;';
      var handleEl = wrapper.querySelector(':scope > .bj-bar-handle');
      if (handleEl) {
        wrapper.insertBefore(optBox, handleEl.nextSibling);
      } else {
        /* 핸들이 아직 없는 극단 케이스 — fallback 처리 */
        var fb = wrapper.querySelector('.bj-bar-fallback');
        var btns = fb && fb.querySelector('.bj-fb-btns');
        if (btns) fb.insertBefore(optBox, btns);
        else wrapper.insertBefore(optBox, wrapper.firstChild);
      }
      select = cloneSelect;
    }
    var handleText = handle.querySelector('.bj-bar-handle-text');
    if (!handleText) return;
    /* 핸들 안 옵션 칩 ensure */
    var chip = handleText.querySelector('.bj-bar-handle-option');
    if (!chip) {
      chip = document.createElement('span');
      chip.className = 'bj-bar-handle-option';
      chip.setAttribute('role', 'button');
      chip.setAttribute('tabindex', '0');
      chip.setAttribute('aria-label', '옵션 선택');
      /* v0.5.46: chip 위치 — handleText의 마지막 자식 (price 우측). 이전엔 firstChild. */
      handleText.appendChild(chip);
      /* 칩 클릭 시 위젯 펼침 + select 포커스 */
      chip.addEventListener('click', function(e){
        e.stopPropagation();
        wrapper.classList.remove('bj-bar-collapsed');
        wrapper.classList.add('bj-bar-expanded');
        setTimeout(function(){ select.focus(); }, 220);
      });
      chip.addEventListener('keydown', function(e){
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          chip.click();
        }
      });
    } else if (chip !== handleText.lastElementChild) {
      /* v0.5.46: 이전 버전에서 firstChild로 삽입된 chip이 남아있으면 우측으로 재배치 */
      handleText.appendChild(chip);
    }
    function refreshChip(){
      var v = select.value;
      var label = v || (select.options[0] ? select.options[0].textContent : '옵션 선택');
      chip.textContent = v ? v : '옵션 선택';
      chip.classList.toggle('is-empty', !v);
    }
    refreshChip();
    /* 중복 등록 방지 */
    if (!select.dataset.bjOptionBound) {
      select.addEventListener('change', refreshChip);
      select.dataset.bjOptionBound = '1';
    }
    /* v0.5.18: 옵션 ≤4개면 select를 가로 버튼 그룹으로 대체. 5개+ 또는 옵션 길이가 길면 select 유지 */
    buildOptionButtonGroup(wrapper, select, refreshChip);
  }

  /* v0.5.33: 옵션을 항상 버튼 그룹으로 렌더 — 옵션 개수·라벨 길이 제한 폐기.
     native select가 fixed wrapper + z-index 환경에서 클릭이 안 되는 케이스(특히 iOS Safari)를
     원천 해결. 라벨은 짧게 표시(접두어/모델코드 제거), 가로 1행 스크롤로 무제한 옵션 수용.
     select는 hide하되 DOM에 유지(빌리조 onchange 동기화용 ground-truth). */
  function shortenOptionLabel(text){
    text = String(text || '').trim();
    /* 후미 모델코드 제거: " WB", " AS", " CB" 등 (공백 + 영문 2-4자) */
    text = text.replace(/\s+[A-Z]{2,4}\s*$/, '');
    /* 흔한 접두어 제거 — 색상명/사이즈 핵심만 노출 */
    text = text.replace(/^(솔리드|메탈릭|메탈|매트|글로시|펄|유광|무광|하이드로|프리미엄|디럭스|스탠다드|일반|기본|컬러)\s*/, '');
    return text || '옵션';
  }
  function buildOptionButtonGroup(wrapper, select, refreshChip){
    if (!select || select.dataset.bjOptionGroupBuilt) return;
    var realOpts = Array.from(select.options).filter(function(o){ return o.value !== ''; });
    if (realOpts.length === 0) return;
    var group = document.createElement('div');
    group.className = 'bj-option-buttons';
    group.setAttribute('role', 'radiogroup');
    group.setAttribute('aria-label', '옵션 선택');
    realOpts.forEach(function(opt){
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'bj-option-btn';
      btn.dataset.value = opt.value;
      btn.setAttribute('role', 'radio');
      var fullLabel = opt.textContent.trim();
      btn.textContent = shortenOptionLabel(fullLabel);
      btn.title = fullLabel; /* hover tooltip — 전체 옵션명 */
      if (select.value === opt.value) btn.classList.add('active');
      btn.addEventListener('click', function(e){
        e.preventDefault();
        e.stopPropagation();
        select.value = opt.value;
        /* cloneSelect의 change 핸들러가 orig.value + window.option_selec 자동 호출 */
        try { select.dispatchEvent(new Event('change', { bubbles: true })); } catch(_){}
        refreshGroup();
      });
      group.appendChild(btn);
    });
    function refreshGroup(){
      Array.from(group.children).forEach(function(b){
        b.classList.toggle('active', b.dataset.value === select.value);
      });
    }
    select.parentNode.insertBefore(group, select);
    select.classList.add('bj-option-select-replaced');
    /* v0.5.33: select 자체는 hide (버튼이 ground-truth UI). 빌리조 sync용으로 DOM 유지 */
    select.style.setProperty('display', 'none', 'important');
    select.addEventListener('change', refreshGroup);
    select.dataset.bjOptionGroupBuilt = '1';
  }

  /* v0.5.6: 위젯 내 렌탈사·약정 selector 빌드 */
  function buildWidgetSelector(wrapper, handle){
    var lis = Array.from(wrapper.querySelectorAll('.rantal_wrap > li'));
    if (lis.length === 0) return;

    /* 데이터 수집 */
    function digits(s){ return parseInt(String(s||'').replace(/[^\d]/g,''),10) || 0; }
    var suppliers = lis.map(function(li){
      var nameEl = li.querySelector('.m_ver_txt .name, .txt .name');
      var boxes = Array.from(li.querySelectorAll('.month_box'));
      var terms = boxes.map(function(b){
        var price = b.dataset.price || ((b.querySelector('.fz16')||{}).textContent || '').replace(/[^\d,]/g,'');
        var dcprice = b.dataset.dcprice || '0';  /* 카드할인 적용 후 금액 (있으면) */
        var cardDis = b.dataset.card_dis || '0';  /* 카드할인 액수 */
        var priceNum = digits(price);
        var dcNum = digits(dcprice);
        var cardDisNum = digits(cardDis);
        /* 최종 월 부담액: dcprice가 있고 0보다 크면 그것, 아니면 price - cardDis 추정, 아니면 price */
        var effective = dcNum > 0 ? dcNum :
                        (cardDisNum > 0 && cardDisNum < priceNum) ? (priceNum - cardDisNum) :
                        priceNum;
        return {
          el: b,
          month: b.dataset.month || (b.querySelector('.fz14')||{}).textContent || '',
          monthKey: b.dataset.month_key,
          price: price,
          priceNum: priceNum,
          dcprice: dcprice,
          dcNum: dcNum,
          cardDis: cardDis,
          cardDisNum: cardDisNum,
          effective: effective,    /* 가성비 비교의 기준 — 카드할인 적용 후 월 부담액 */
          supname: b.dataset.supname,
          supcode: b.dataset.supcode,
        };
      });
      return {
        li: li,
        name: nameEl ? nameEl.textContent.trim() : (terms[0] && terms[0].supname) || '렌탈사',
        terms: terms,
      };
    }).filter(function(s){ return s.terms.length > 0; });
    if (suppliers.length === 0) return;

    /* v0.5.7: BEST 자동 선택 — 모든 (렌탈사 × 약정) 조합에서 effective(카드할인 후 월 부담액) 최저.
       동률이면 약정 길이 짧은 쪽 우선(약속 부담 적은 게 유리). */
    var bestSupIdx = 0, bestTermIdx = 0, bestEff = Infinity, bestMonths = Infinity;
    suppliers.forEach(function(s, si){
      s.terms.forEach(function(t, ti){
        if (t.effective <= 0) return;
        var months = digits(t.month);
        if (t.effective < bestEff || (t.effective === bestEff && months < bestMonths)) {
          bestEff = t.effective;
          bestMonths = months;
          bestSupIdx = si;
          bestTermIdx = ti;
        }
      });
    });
    suppliers[bestSupIdx].terms[bestTermIdx].isBest = true;

    /* selector mount 위치 — bb-inner 있으면 .bb-months 교체, 없으면 fallback .bj-fb-selector */
    var bbInner = wrapper.querySelector('.bb-inner');
    var mount;
    if (bbInner) {
      var bbMonths = bbInner.querySelector('.bb-months');
      if (bbMonths) bbMonths.style.setProperty('display', 'none', 'important');
      mount = document.createElement('div');
      mount.className = 'bj-widget-selector';
      bbInner.insertBefore(mount, bbInner.firstChild);
    } else {
      mount = wrapper.querySelector('.bj-fb-selector');
      if (!mount) return;
      mount.classList.add('bj-widget-selector');
    }

    /* v0.5.7: 초기 선택을 BEST로 — 사용자가 보자마자 가성비 최고 옵션을 보게 됨 */
    var state = { supIdx: bestSupIdx, termIdx: bestTermIdx };

    function render(){
      var sup = suppliers[state.supIdx];
      var term = sup.terms[state.termIdx];
      var multiSupplier = suppliers.length > 1;
      /* 다중 렌탈사면 supplier 탭에 BEST 표시 (해당 supplier 안에 best term 있으면) */
      var supHasBest = function(si){
        return suppliers[si].terms.some(function(t){ return t.isBest; });
      };

      /* 다중 렌탈사 — 상단에 [렌탈사 선택] 라벨 + 탭, 그 아래 "{선택 렌탈사}의 약정 조건" 라벨 */
      var supTabs = multiSupplier
        ? '<div class="bj-ws-sup-section">' +
            '<div class="bj-ws-sup-label">렌탈사 선택</div>' +
            '<div class="bj-ws-sup-tabs">' +
              suppliers.map(function(s, i){
                var bestMark = supHasBest(i) ? '<span class="bj-ws-best-dot" aria-label="BEST"></span>' : '';
                return '<button type="button" class="bj-ws-sup-tab' + (i === state.supIdx ? ' active' : '') + '" data-i="' + i + '">' +
                  escapeWidgetHtml(s.name) + bestMark +
                '</button>';
              }).join('') +
            '</div>' +
            '<div class="bj-ws-term-label"><strong>' + escapeWidgetHtml(sup.name) + '</strong>의 약정 조건</div>' +
          '</div>'
        : '';

      var termPills =
        '<div class="bj-ws-term-pills">' +
          sup.terms.map(function(t, i){
            /* v0.5.33: pill 2행 마크업 — "카드/정가" 라벨로 명확 구분.
               1행: BEST 배지 + 약정 기간
               2행: 카드할인 있으면 [카드 N · 정가 M(strike)], 없으면 [정가 N]
               기존 색상만으로 구분이 어려웠던 문제 해소. */
            var hasCardDc = t.effective > 0 && t.effective < t.priceNum;
            var bestBadge = t.isBest ? '<span class="bj-ws-best-badge">BEST</span>' : '';
            var priceRow;
            if (hasCardDc) {
              priceRow =
                '<span class="bj-ws-term-price-lbl bj-ws-lbl-card">카드</span>' +
                '<span class="bj-ws-term-price">' + escapeWidgetHtml(t.effective.toLocaleString()) + '</span>' +
                '<span class="bj-ws-term-price-lbl bj-ws-lbl-orig">정가</span>' +
                '<span class="bj-ws-term-orig">' + escapeWidgetHtml(t.price) + '</span>';
            } else {
              priceRow =
                '<span class="bj-ws-term-price-lbl bj-ws-lbl-orig">정가</span>' +
                '<span class="bj-ws-term-price">' + escapeWidgetHtml(t.price || '문의') + '</span>';
            }
            return '<button type="button" class="bj-ws-term-pill bj-ws-term-pill-2row' + (i === state.termIdx ? ' active' : '') + (t.isBest ? ' is-best' : '') + (hasCardDc ? ' has-card-dc' : '') + '" data-i="' + i + '">' +
              '<div class="bj-ws-term-row1">' + bestBadge +
                '<span class="bj-ws-term-period">' + escapeWidgetHtml(t.month) + '</span>' +
              '</div>' +
              '<div class="bj-ws-term-row2">' + priceRow + '</div>' +
            '</button>';
          }).join('') +
        '</div>';

      mount.innerHTML = supTabs + termPills;

      /* v0.5.7: 핸들 가격 — 카드할인 있으면 "월 N원 (카드 M원)" 형식, BEST면 라벨 추가 */
      var hp = handle.querySelector('.bj-bar-handle-price');
      if (hp) {
        var hasCardDc = term.effective > 0 && term.effective < term.priceNum;
        var bestTag = term.isBest ? '<span class="bj-bar-handle-best">BEST</span>' : '';
        if (hasCardDc) {
          hp.innerHTML = bestTag + '카드 월 ' + term.effective.toLocaleString() + '원 <small style="color:#888;font-weight:400;font-size:11px">(정가 월 ' + term.price + '원)</small>';
        } else if (term.price) {
          hp.innerHTML = bestTag + '월 ' + term.price + '원';
        } else {
          hp.innerHTML = bestTag + '문의';
        }
      }
    }

    function selectSupplier(i){
      if (i === state.supIdx) return;
      state.supIdx = i;
      state.termIdx = 0;
      render();
      triggerUnderlying();
    }
    function selectTerm(i){
      if (i === state.termIdx) return;
      state.termIdx = i;
      render();
      triggerUnderlying();
    }
    function triggerUnderlying(){
      /* underlying의 .month_box.layer_price 클릭 — 가격 데이터 동기화 + 주문 시 올바른 supplier/term 사용 */
      var t = suppliers[state.supIdx].terms[state.termIdx];
      if (t && t.el) {
        try { t.el.click(); } catch(_){}
      }
    }

    mount.addEventListener('click', function(e){
      var sup = e.target.closest('.bj-ws-sup-tab');
      if (sup) { selectSupplier(parseInt(sup.dataset.i, 10)); return; }
      var pill = e.target.closest('.bj-ws-term-pill');
      if (pill) { selectTerm(parseInt(pill.dataset.i, 10)); return; }
    });

    render();
    triggerUnderlying();  // 초기 선택 동기화
  }

  function escapeWidgetHtml(s){
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
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
      if (!(t && t.tagName === 'DETAILS' && t.classList.contains('help') && t.open)) return;
      /* 다른 help 닫기 */
      document.querySelectorAll('details.help[open]').forEach(function(d){
        if (d !== t) d.removeAttribute('open');
      });
      /* v0.5.12: PC popup을 position:fixed로 강제 전환 + trigger 위치 기반 좌표 직접 계산
         이전 v0.5.10의 transform 보정만으로는 부모 .help가 깊은 컨테이너에 있을 때
         viewport 경계 밖으로 잘리는 케이스 발생 → 좌표를 직접 set해서 100% 보장.
         (모바일 ≤900px은 이미 fixed bottom sheet라 viewport 안 보장됨) */
      if (window.innerWidth <= 900) return;
      var pop = t.querySelector('.help-pop');
      var sum = t.querySelector('summary');
      if (!pop || !sum) return;
      var sRect = sum.getBoundingClientRect();
      var vw = window.innerWidth, vh = window.innerHeight;
      var margin = 12;
      /* popup 크기 측정용 임시 노출 (visibility:hidden, 측정 후 원복) */
      pop.style.position = 'fixed';
      pop.style.top = '-9999px';
      pop.style.left = '-9999px';
      pop.style.transform = 'none';
      pop.style.visibility = 'hidden';
      pop.style.display = 'block';
      requestAnimationFrame(function(){
        var pw = pop.offsetWidth || 280;
        var ph = pop.offsetHeight || 100;
        /* 기본 위치: trigger 가운데 정렬, trigger 아래 8px */
        var left = sRect.left + sRect.width / 2 - pw / 2;
        var top = sRect.bottom + 8;
        /* 우측 경계 clamp */
        if (left + pw > vw - margin) left = vw - pw - margin;
        /* 좌측 경계 clamp */
        if (left < margin) left = margin;
        /* 하단 경계: popup이 viewport 아래로 벗어나면 trigger 위로 띄움 */
        if (top + ph > vh - margin) {
          var topAbove = sRect.top - ph - 8;
          top = topAbove >= margin ? topAbove : Math.max(margin, vh - ph - margin);
        }
        if (top < margin) top = margin;
        pop.style.left = left + 'px';
        pop.style.top = top + 'px';
        pop.style.visibility = '';
        pop.style.display = '';
      });
    }, true);
    /* v0.5.12: close 시 inline style cleanup (다음 open 시 위치 재계산 보장) */
    document.addEventListener('toggle', function(e){
      var t = e.target;
      if (!(t && t.tagName === 'DETAILS' && t.classList.contains('help')) || t.open) return;
      var pop = t.querySelector('.help-pop');
      if (!pop) return;
      pop.style.position = '';
      pop.style.left = '';
      pop.style.top = '';
      pop.style.transform = '';
      pop.style.visibility = '';
      pop.style.display = '';
    }, true);
    /* viewport resize 시 열린 popup 위치 재계산 */
    window.addEventListener('resize', function(){
      var opened = document.querySelector('details.help[open]');
      if (!opened) return;
      /* toggle 이벤트를 다시 발생시켜 위치 재계산 트리거 */
      opened.removeAttribute('open');
      requestAnimationFrame(function(){ opened.setAttribute('open', ''); });
    });
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
    /* v0.5.9: .category__wrap + 신규 .bj-sh-cat 두 컨테이너 모두 처리 */
    var wraps = document.querySelectorAll('.mobile__gnb .gnb__cateogry .category__wrap, .bj-sh-cat');
    wraps.forEach(function(wrap){
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
    });
  }

  /* (e) v0.3.8: 약정 기간·의무 사용 기간 라벨에 ⓘ 툴팁 동적 주입
       v0.5.38: 두 설명을 약정 기간 박스 하나로 통합. 의무 사용 기간 ⓘ는 추가하지 않음.
       사용자가 한 번 펼치면 두 개념을 함께 비교 가능 — 분리 노출 시 정보 단편화. */
  var COMBINED_TERM_HELP =
    '<strong>약정 기간</strong>은 렌탈 계약의 전체 기간입니다. 이 기간 동안 매월 렌탈료를 납부하며, 종료 시점에 제품 소유권이 이전(또는 반환)됩니다. 약정을 채워야 광고된 월 렌탈료가 유지됩니다.' +
    '<br><br>' +
    '<strong>의무 사용 기간</strong>은 위약금이 부과되는 최소 기간입니다. 이 기간이 지난 뒤 해지하면 별도 위약금 없이 자유로운 해지가 가능합니다. 약정 기간보다 짧은 게 일반적이며, 짧을수록 사용자에게 유리합니다.';
  function addRentalTermsHelp(){
    var rows = document.querySelectorAll('#ai-card-root .rental-terms .rt-r .rt-l');
    rows.forEach(function(label){
      if (label.dataset.bjHelpAdded) return;
      var key = label.textContent.trim();
      /* v0.5.38: '약정 기간' 라벨에만 통합 설명 박스 추가. '의무 사용 기간' 라벨은 skip */
      if (key !== '약정 기간') {
        label.dataset.bjHelpAdded = '1';
        return;
      }
      var details = document.createElement('details');
      details.className = 'help';
      details.innerHTML =
        '<summary aria-label="약정 기간·의무 사용 기간 설명"></summary>' +
        '<div class="help-pop">' + COMBINED_TERM_HELP + '</div>';
      label.appendChild(document.createTextNode(' '));
      label.appendChild(details);
      label.dataset.bjHelpAdded = '1';
    });
  }

  /* v0.5.47: 만기 후 소유권 이전 안내 chip — 반납 조건 제품 외에는 자동 추가.
     본사 정책: 렌탈 상품은 보통 약정 만기 후 소유권 이전 가능. "반납" 조건만 예외.
     판정: 페이지 어디든 "반납" 키워드(반납제품/반납조건/반납형/반납 후 등) 있으면 skip. */
  function addOwnershipNotice(){
    var rt = document.querySelector('#ai-card-root .rental-terms');
    if (!rt) return;
    if (rt.querySelector('.bj-ownership-row')) return;  /* idempotent */

    /* 반납 조건 검출 — 제품명 + 상세 영역 텍스트에 "반납" 키워드 검사 */
    var checkAreas = [
      document.querySelector('.prod_name'),
      document.querySelector('#ai-card-root'),
      document.querySelector('.prod_view_top'),
    ].filter(Boolean);
    var combinedText = checkAreas.map(function(el){ return el.textContent || ''; }).join(' ');
    /* "반납제품", "반납 제품", "반납조건", "반납형", "반납이 원칙", "반납 후 환불 불가" 등 */
    if (/반납\s*(제품|조건|형|이|후|만|상품)/.test(combinedText) || /반납\s*[\(\[]/.test(combinedText)) {
      rt.dataset.bjOwnershipChecked = 'returnable';
      return;
    }
    /* row 추가 — 다른 .rt-r와 동일 구조, .rt-v에 chip 강조.
       v0.5.48: .rt-l '소유권' 옆 ⓘ details.help 자동 부착. setupHelpClose가 글로벌
       selector라 외부 클릭/ESC 닫힘 + 1개만 열림 자동 처리. */
    var helpHtml =
      '<details class="help"><summary aria-label="소유권 이전 설명"></summary>' +
      '<div class="help-pop"><strong>약정 기간 만료 시 제품 소유권이 고객에게 이전됩니다.</strong>' +
      ' 별도 비용 없이 자동 전환되며, 만기 이후에는 자유롭게 사용·양도 가능합니다.' +
      ' 빌리조 렌탈 상품은 본사 정책상 대부분 소유권 이전형이며,' +
      ' 반납 조건 제품은 상품명·상세에 명시되어 있습니다.</div></details>';
    var row = document.createElement('div');
    row.className = 'rt-r bj-ownership-row';
    row.innerHTML =
      '<span class="rt-l" data-bj-help-added="1">소유권 ' + helpHtml + '</span>' +
      '<span class="rt-v bj-ownership-chip">만기 후 소유권 이전</span>';
    rt.appendChild(row);
    rt.dataset.bjOwnershipChecked = 'ownership';
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2.y) 하단 위젯 가시성 — AI 카드 완전 통과 후 노출 + 드래그 게스처 (v0.5.2)
  //
  //   * 페이지에 #ai-card-root 있을 때만 활성. 모든 제품에 동일 적용 (10914 한정 게이트 폐기)
  //   * 트리거: AI 카드 bottom이 viewport top 위로 완전히 올라간 시점 (r.bottom < 0)
  //     → "사용자가 카드를 끝까지 다 봤다"는 명확한 신호
  //   * 한 번 노출되면 sticky — 스크롤 백업해도 자동으로 사라지지 않음
  //     (사용자가 드래그·X 버튼·외부 탭으로만 명시적으로 닫음)
  //   * 드래그 게스처 (.bj-bar-handle에 등록):
  //     - 위로 드래그 ≥30px → 펼침 (.bj-bar-expanded)
  //     - 아래로 드래그 ≥30px → 접기 (.bj-bar-collapsed)
  //     - 더 아래로 드래그 ≥120px → 위젯 dismiss (slide-hidden)
  //     - 작은 movement (<10px) → 탭으로 간주, 펼침/접힘 토글
  //   * push (탭) — 접힘 상태에서 핸들 탭 시 펼침으로 복귀
  // ─────────────────────────────────────────────────────────────────────────
  function setupBottomBarVisibility(){
    if (window.__bjBarVisibilitySetup) return;

    /* v0.5.24: #billyjo-bottom-bar는 우리가 DOM 삭제하므로 .prod_view_bot.card.mt40만 사용 */
    var wrapper = document.querySelector('.prod_view_bot.card.mt40');
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
    /* v0.5.31: 위젯이 페이지 진입 시부터 접힌 상태(collapsed)로 항상 노출.
       이전 slide-hidden 초기값 폐기 — 사용자 핸들이 항상 보여야 다시 펼침 가능. */
    wrapper.classList.remove('bj-bar-slide-hidden');
    wrapper.classList.add('bj-bar-collapsed');
    wrapper.classList.remove('bj-bar-expanded');

    var SESSION_KEY = 'bjBarDismissed_' + (location.pathname.match(/prod_view\/(\d+)/) || [,'unknown'])[1];
    var manualHide = (function(){ try { return sessionStorage.getItem(SESSION_KEY) === '1'; } catch(e){ return false; } })();
    /* v0.5.31: 트리거 의미 변경 — show/hide 결정 → expand/collapse 결정.
       페이지 진입 시 항상 visible+collapsed. trigger 천이(oov ↔ inview) 시점에만
       자동으로 expand/collapse 적용 (hysteresis). 사용자가 수동 토글한 후에는 다음
       trigger 천이까지 사용자 결정이 유지됨. 사용자 명시적 dismiss는 핸들 ≥120px 드래그. */
    var lastTriggerState = null; /* 'oov' | 'inview' | null */
    function evalScroll(){
      var r = aiCard.getBoundingClientRect();
      var cardOutOfView = r.bottom < 80;
      var cardInView = r.bottom > 200;
      var newTrigger = null;
      if (cardOutOfView) newTrigger = 'oov';
      else if (cardInView) newTrigger = 'inview';
      /* 천이가 일어났을 때만 자동 적용 — 그 사이엔 사용자 수동 토글 유지 */
      if (newTrigger && newTrigger !== lastTriggerState) {
        lastTriggerState = newTrigger;
        if (newTrigger === 'oov') {
          wrapper.classList.remove('bj-bar-collapsed');
          wrapper.classList.add('bj-bar-expanded');
        } else {
          wrapper.classList.remove('bj-bar-expanded');
          wrapper.classList.add('bj-bar-collapsed');
        }
      }
      apply();
    }
    function apply(){
      wrapper.style.setProperty('display', 'block', 'important');
      if (manualHide) {
        wrapper.classList.add('bj-bar-slide-hidden');
        wrapper.style.setProperty('bottom', '-320px', 'important');
        wrapper.style.setProperty('pointer-events', 'none', 'important');
        return;
      }
      wrapper.classList.remove('bj-bar-slide-hidden');
      wrapper.classList.add('show');
      wrapper.style.setProperty('bottom', '0', 'important');
      wrapper.style.setProperty('pointer-events', 'auto', 'important');
      wrapper.style.setProperty('visibility', 'visible', 'important');
      wrapper.style.setProperty('opacity', '1', 'important');
    }

    /* v0.5.27: 우측 상단 X 버튼 제거 — ▾ 토글과 기능 중복으로 사용자 혼란.
       기존 인스턴스가 DOM에 남아있으면 제거 (CDN 캐시 stale 시점 데이터 정리) */
    var prevX = wrapper.querySelector('.bj-bar-dismiss-x');
    if (prevX) try { prevX.remove(); } catch(_){}

    // v0.5.2: 핸들 드래그 게스처
    setupHandleDragGesture(wrapper);

    // throttled scroll — 트리거 진입만 감지, 빠져나가도 hide 안 함 (sticky)
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

    evalScroll();  // 초기 평가
  }

  // v0.5.2: 핸들 드래그 — 위로/아래로 swipe로 펼침·접기·dismiss
  function setupHandleDragGesture(wrapper){
    var handle = wrapper.querySelector('.bj-bar-handle');
    if (!handle || handle.dataset.bjDragSetup) return;
    handle.dataset.bjDragSetup = '1';

    var startY = null, startX = null, moved = false, dragOffset = 0;
    var DRAG_TAP_THRESHOLD = 10;   // 이하면 탭으로 간주
    var DRAG_TOGGLE_THRESHOLD = 30; // 이상이면 펼침/접기 전환
    var DRAG_DISMISS_THRESHOLD = 120; // 아래로 이상이면 완전 dismiss

    function isExpanded(){ return wrapper.classList.contains('bj-bar-expanded'); }

    function onStart(e){
      var t = e.touches ? e.touches[0] : e;
      startY = t.clientY;
      startX = t.clientX;
      moved = false;
      dragOffset = 0;
      wrapper.style.setProperty('transition', 'none', 'important');
    }
    function onMove(e){
      if (startY === null) return;
      var t = e.touches ? e.touches[0] : e;
      var dy = t.clientY - startY;
      var dx = t.clientX - startX;
      if (Math.abs(dy) > DRAG_TAP_THRESHOLD || Math.abs(dx) > DRAG_TAP_THRESHOLD) moved = true;
      /* v0.5.34: dy>10일 때만 transform 적용 — 탭 시점(dy≈0)에 transform:translateY(0)을
         박으면 1500px 이상 PC의 CSS transform:translateX(-50%) 위치 보정이 깨져
         위젯이 오프셋되는 잠재 버그 차단 */
      if (dy > DRAG_TAP_THRESHOLD) {
        dragOffset = Math.min(dy, 200);
        wrapper.style.setProperty('transform', 'translateY(' + dragOffset + 'px)', 'important');
      }
      if (e.cancelable && Math.abs(dy) > DRAG_TAP_THRESHOLD) e.preventDefault();
    }
    function onEnd(e){
      if (startY === null) return;
      var t = e.changedTouches ? e.changedTouches[0] : e;
      var dy = t.clientY - startY;
      wrapper.style.removeProperty('transform');
      wrapper.style.setProperty('transition',
        'max-height 0.32s cubic-bezier(0.2,0.9,0.3,1), bottom 0.38s cubic-bezier(0.2,0.9,0.3,1)',
        'important');

      if (!moved || Math.abs(dy) < DRAG_TAP_THRESHOLD) {
        // 탭으로 간주 — 펼침/접힘 토글
        toggleExpanded();
      } else if (dy <= -DRAG_TOGGLE_THRESHOLD) {
        // 위로 드래그 → 펼침
        wrapper.classList.remove('bj-bar-collapsed');
        wrapper.classList.add('bj-bar-expanded');
      } else if (dy >= DRAG_DISMISS_THRESHOLD) {
        // 아래로 크게 드래그 → 완전 dismiss (다음 노출까지)
        wrapper.classList.add('bj-bar-slide-hidden');
        wrapper.style.setProperty('bottom', '-320px', 'important');
        wrapper.style.setProperty('pointer-events', 'none', 'important');
        try { sessionStorage.setItem(
          'bjBarDismissed_' + (location.pathname.match(/prod_view\/(\d+)/) || [,'x'])[1], '1'); } catch(_){}
      } else if (dy >= DRAG_TOGGLE_THRESHOLD) {
        // 아래로 드래그 → 접기
        wrapper.classList.add('bj-bar-collapsed');
        wrapper.classList.remove('bj-bar-expanded');
      }
      startY = null; startX = null; moved = false;
    }
    function toggleExpanded(){
      /* v0.5.34: 명시적 토글 — 현재 expanded면 collapsed로, 그 외(collapsed/none)는 expanded로.
         이전 단순 toggle은 class가 둘 다 없거나 둘 다 있는 비정상 상태에서 의도와 다르게 동작. */
      var isExpandedNow = wrapper.classList.contains('bj-bar-expanded') &&
                           !wrapper.classList.contains('bj-bar-collapsed');
      if (isExpandedNow) {
        wrapper.classList.remove('bj-bar-expanded');
        wrapper.classList.add('bj-bar-collapsed');
      } else {
        wrapper.classList.remove('bj-bar-collapsed');
        wrapper.classList.add('bj-bar-expanded');
      }
    }

    handle.addEventListener('mousedown', onStart);
    handle.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchend', onEnd, { passive: true });
    document.addEventListener('touchcancel', onEnd, { passive: true });
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

    /* v0.5.39: 표 위 제품 정보 헤더 — 제품명(굵게) + 모델명·관리주기(작고 흐리게) 2줄 */
    var prodNameEl = document.querySelector('.prod_name b') || document.querySelector('.prod_name') ||
                     document.querySelector('.bj-hero-meta-title');
    var prodName = prodNameEl ? prodNameEl.textContent.trim() : '';
    /* 모델명·관리 — .model_name small 우선, 그 다음 .model_name 전체 */
    var modelSmall = document.querySelector('.model_name small');
    var modelEl = modelSmall || document.querySelector('.model_name');
    var modelText = modelEl ? modelEl.textContent.trim() : '';
    /* 제품명에 prefix 브랜드 prefix 너무 길면 자르기: 'LG구독 - LG전자 정수기 ...' → 'LG전자 정수기 ...' */
    prodName = prodName.replace(/^[A-Z가-힣]+\s*구독\s*[-·]\s*/, '').trim();
    /* v0.5.41: title + 표를 단일 outer wrapper 안에 배치해 width 통일.
       이전: title은 mount 직접 자식 (full width), 표 wrapper는 별도 div with border →
       border 1px 차이로 두 박스 가로 폭 안 맞음 (사용자 시각 어긋남 신고). */
    var titleHtml = '';
    if (prodName) {
      titleHtml =
        '<div id="lptTitle" style="background:#0838f8;color:#fff;text-align:center;padding:14px 20px;font-size:15px;font-weight:700;border-bottom:1px solid rgba(255,255,255,0.2);font-family:Pretendard,sans-serif;line-height:1.4">' +
          escapeHtml(prodName) +
          (modelText ? '<br><span style="font-size:12px;opacity:0.85;font-weight:400">' + escapeHtml(modelText) + '</span>' : '') +
        '</div>';
    }

    mount.innerHTML =
      '<div style="border:1px solid #e5e8ee;border-radius:8px;overflow:hidden;background:#fff">' +
        titleHtml +
        '<div style="overflow-x:auto;-webkit-overflow-scrolling:touch">' +
          '<table style="width:100%;min-width:240px;border-collapse:collapse;font-family:Pretendard,sans-serif;background:#fff">' +
            '<thead><tr style="background:#0838f8;color:#fff;font-size:12px">' + headerCols + '</tr></thead>' +
            '<tbody>' + rows + '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>';
    section.hidden = false;
    section.dataset.bjLptMounted = '1';

    /* v0.5.1+v0.5.39+v0.5.40: 본문 LPT 중복 광범위 hide — AI 카드에 단일 출처 보장.
       3단계:
       (1) #livePriceTable + 그 부모 wrapper
       (2) thead에 "약정+(월렌탈료|카드할인가)" 패턴 갖는 모든 table (text 기반 매칭)
       (3) 텍스트에 "약정·카드 할인가" 라벨 갖는 본문 section
       모두 카드 내부(#ai-card-root)·하단 위젯(.prod_view_bot.card.mt40)·hero
       (.prod_view_top) 외부에 한정. */
    hideDuplicateBodyLpt();
  }

  function hideDuplicateBodyLpt(){
    function isInProtected(el){
      return !!(el && (
        el.closest('#ai-card-root') ||
        el.closest('.prod_view_bot.card.mt40') ||
        el.closest('.prod_view_top')
      ));
    }
    function hideWithWrapper(el){
      if (!el || isInProtected(el)) return;
      el.style.setProperty('display', 'none', 'important');
      el.dataset.bjLptDupHidden = '1';
      /* 가장 가까운 의미있는 wrapper(section/article/div with significant class)도 hide */
      var anc = el.parentElement, depth = 0;
      while (anc && depth < 4) {
        if (isInProtected(anc)) break;
        var cls = String(anc.className || '');
        if (/price|rental|약정|table_wrap|sec|lpt/i.test(cls)) {
          anc.style.setProperty('display', 'none', 'important');
          anc.dataset.bjLptDupHidden = '1';
          break;
        }
        anc = anc.parentElement;
        depth++;
      }
    }

    /* (1) #livePriceTable */
    var lpt = document.getElementById('livePriceTable');
    if (lpt) hideWithWrapper(lpt);

    /* (2) thead text pattern */
    document.querySelectorAll('table').forEach(function(table){
      if (isInProtected(table)) return;
      if (table.dataset.bjLptDupHidden) return;
      var thead = table.querySelector('thead') || table.querySelector('tr:first-child');
      if (!thead) return;
      var headText = (thead.textContent || '').replace(/\s+/g, ' ');
      /* "약정" + ("월 렌탈료" | "카드 할인가" | "할인가") — LPT 표 시그니처 */
      if (/약정/.test(headText) && /(월\s*렌탈료|카드.*할인가|^.*할인가.*$)/.test(headText)) {
        hideWithWrapper(table);
      }
    });

    /* (3) 본문 section with "약정·카드 할인가" 또는 유사 헤더 */
    document.querySelectorAll('h2, h3, h4, .sec-t, .section-title, [class*="title"]').forEach(function(h){
      if (isInProtected(h)) return;
      var t = (h.textContent || '').replace(/\s+/g, '');
      if (/약정[·.]?카드할인가|약정카드할인가|월렌탈료표|카드할인가표/.test(t)) {
        /* 헤더 자신 + 다음 sibling (보통 표 wrapper)도 hide */
        var section = h.closest('section, article, .sec, .section') || h.parentElement;
        if (section && !isInProtected(section)) {
          section.style.setProperty('display', 'none', 'important');
          section.dataset.bjLptDupHidden = '1';
        }
      }
    });
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

  /* v0.5.11: 빌리조 원본 2버튼 sticky 위젯 제거 안전망 (CSS 외 JS도 마크업 제거) */
  function removeOriginalStickyWidget(){
    document.querySelectorAll('.prod_fix_wrap').forEach(function(el){
      el.style.display = 'none';
      el.setAttribute('data-bj-removed', '1');
    });
  }

  /* v0.5.23 + v0.5.24: 빌리조 main inject.js가 body에 직접 mount하는 #billyjo-bottom-bar
     위젯 자체를 DOM 완전 삭제. 그 안의 .bb-inner도 함께 사라짐.
     별도로 우리 .prod_view_bot.card.mt40 wrapper 밖에 mount된 격상 안 된 .bb-inner도 삭제. */
  function removeStrayBbInner(){
    var wrapper = document.querySelector('.prod_view_bot.card.mt40');
    /* 1) wrapper 안 격상 안 된 .bb-inner — enhanceBottomBar 격상 trigger 먼저 */
    if (wrapper && wrapper.querySelector('.bb-inner:not(.bj-bb-inner-merged)')) {
      try { enhanceBottomBar(); } catch(e){}
    }
    /* 2) v0.5.24: #billyjo-bottom-bar 위젯 자체 DOM 삭제 (빌리조 본 inject.js 생성) */
    var bjBar = document.getElementById('billyjo-bottom-bar');
    if (bjBar && !bjBar.classList.contains('bj-ours-keep')) {
      try { bjBar.parentNode.removeChild(bjBar); } catch(e){}
    }
    /* 3) 격상 안 된 .bb-inner 모두 DOM 삭제 (혹시 #billyjo-bottom-bar 밖에도 mount된 경우) */
    document.querySelectorAll('.bb-inner:not(.bj-bb-inner-merged)').forEach(function(inner){
      try {
        if (inner.parentElement) inner.parentElement.removeChild(inner);
      } catch(e){}
    });
  }
  function watchForBbInner(){
    if (window.__bjBbInnerWatched) return;
    window.__bjBbInnerWatched = true;
    removeStrayBbInner();
    if (!window.MutationObserver) return;
    /* 영구 옵저버 — disconnect 안 함. 새 .bb-inner mount 감지 시 즉시 처리.
       콜백 lightweight (.bb-inner만 체크 + 필요시 격상/삭제). */
    var obs = new MutationObserver(function(mutations){
      var hasTarget = false;
      for (var i = 0; i < mutations.length; i++) {
        var m = mutations[i];
        if (m.type !== 'childList') continue;
        for (var j = 0; j < m.addedNodes.length; j++) {
          var n = m.addedNodes[j];
          if (n.nodeType !== 1) continue;
          /* v0.5.24: #billyjo-bottom-bar 또는 .bb-inner mount 감지 */
          if (n.id === 'billyjo-bottom-bar') { hasTarget = true; break; }
          if (n.classList && n.classList.contains('bb-inner')) { hasTarget = true; break; }
          if (n.querySelector && (n.querySelector('#billyjo-bottom-bar') || n.querySelector('.bb-inner'))) {
            hasTarget = true; break;
          }
        }
        if (hasTarget) break;
      }
      if (hasTarget) removeStrayBbInner();
    });
    try { obs.observe(document.body, { childList: true, subtree: true }); } catch(e){}
  }
  /* v0.5.23: 하위 호환 alias — runAll의 기존 hideExternalBbInner 호출 유지 */
  function hideExternalBbInner(){ removeStrayBbInner(); }

  /* v0.5.20: 업소용 카테고리 노출 — main inject.js가 hide한 prod_list/10-1153을 복원 +
     라벨 "업소용·창업" → "업소용"으로 단축. */
  function showBusinessCategory(){
    /* 전체 페이지 + 헤더 + .category__wrap + .menu__gsnb + .aside_sub + .all__depth1 */
    document.querySelectorAll('a[href*="prod_list/10-1153"]').forEach(function(a){
      a.style.setProperty('display', '', 'important');  /* 인라인 display 복원 */
      a.style.setProperty('visibility', 'visible', 'important');
      var li = a.closest('li');
      if (li) {
        li.style.setProperty('display', '', 'important');
        li.style.setProperty('visibility', 'visible', 'important');
      }
      /* 텍스트 단축 "업소용·창업" → "업소용" */
      if (a.textContent && a.textContent.trim() === '업소용·창업') {
        /* 자식 노드가 단순 텍스트면 변경, 아니면 첫 텍스트 노드만 변경 (이미지·svg 보존) */
        if (a.children.length === 0) {
          a.textContent = '업소용';
        } else {
          for (var i = 0; i < a.childNodes.length; i++) {
            var n = a.childNodes[i];
            if (n.nodeType === 3 && n.textContent.trim() === '업소용·창업') {
              n.textContent = '업소용';
              break;
            }
          }
        }
      }
    });
    /* all__depth1 같이 id 기반 항목도 처리 */
    document.querySelectorAll('ul.all__depth1 a[id="10"]').forEach(function(a){
      a.style.setProperty('display', '', 'important');
      a.style.setProperty('visibility', 'visible', 'important');
      var li = a.closest('li');
      if (li) li.style.setProperty('display', '', 'important');
      if (a.textContent && a.textContent.trim() === '업소용·창업') a.textContent = '업소용';
    });
  }

  /* v0.5.28: 옵션 select 강제 보장 (v0.5.27 가드 강화) — 우리가 만든 .bj-option-clone이
     wrapper 안에 있는 경우만 skip. 빌리조가 .bb-inner 안에 만든 .bb-option-select는
     hidden/압축 케이스가 있으므로 무시하고 별도 라벨 박스로 명시 노출. */
  function ensureOptionSelect(){
    var wrapper = document.querySelector('.prod_view_bot.card.mt40');
    if (!wrapper) return;
    /* 우리가 이미 만든 옵션 박스가 있으면 skip (idempotent) */
    if (wrapper.querySelector('.bj-fb-option-box, .bj-option-clone')) return;
    /* 페이지에 사용 가능한 .option_select 있는지 체크 */
    var pageSelects = document.querySelectorAll('.option_select, .bb-option-select');
    var hasOption = false;
    for (var i = 0; i < pageSelects.length; i++) {
      var s = pageSelects[i];
      if (s.closest && s.closest('.prod_fix_wrap')) continue;
      if (s.options && s.options.length > 1) { hasOption = true; break; }
    }
    if (!hasOption) return;
    /* 핸들 찾기 */
    var handle = wrapper.querySelector(':scope > .bj-bar-handle');
    if (!handle) return;
    /* syncOptionSelectToHandle 재실행 — wrapper 내부 select가 .bj-option-clone이 아닌 한 새로 만듦.
       기존 syncOptionSelectToHandle 1350 라인 가드(`wrapper.querySelector(SEL)`)도
       .bj-option-clone 한정으로 좁혀야 동일 효과. 함수 자체에 보강 위임. */
    try { syncOptionSelectToHandle(wrapper, handle); } catch(e){}
  }

  function runAll(){
    injectCSS();
    tagHeaderDom();
    enhanceBottomBar();
    setupHelpClose();
    alignCategoryScroll();
    addRentalTermsHelp();
    addOwnershipNotice();    /* v0.5.47: 반납 조건 아닌 제품에 '만기 후 소유권 이전' chip */
    fetchAndInjectAICard();
    hideOriginalSpecsAndSimplifyLpt();
    setupBottomBarVisibility();
    injectNewlywedGnb();
    removeOriginalStickyWidget();
    showBusinessCategory();
    hideExternalBbInner();    /* v0.5.21: 매 호출마다 외부 .bb-inner 즉시 숨김 */
    watchForBbInner();        /* v0.5.21: 영구 옵저버 설치 (한 번만) */
    ensureOptionSelect();     /* v0.5.27: 옵션 select 위젯에 노출 보장 */
    hideDuplicateBodyLpt();   /* v0.5.40: 본문 LPT 중복 hide (빌리조 재렌더 대응) */
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
