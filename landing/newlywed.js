/*!
 * 신혼부부 패키지 — 모달 빌더 v2
 * window.bjOpenNewlywedModal() 호출 시 풀스크린 오버레이 모달 열기.
 * billyjo-inject inject.js의 카테고리바 항목 onclick에서 호출됨.
 *
 * v2 (2026-06-07):
 * - 카테고리당 1개 이모지 카드 → 브랜드별(삼성/LG/코웨이 등) 다중 제품 리스트.
 *   선정 기준: 종합 등급 A 이상 + 본사 수익성 + 신혼 페르소나 적합 (정렬에만 반영,
 *   수치는 코드·화면 어디에도 노출하지 않음 — 룰북 #18/#25).
 * - 제품 [담기] 토글 + 하단 고정 요약바.
 * - 상담신청: data-bj-consult로 inject.js 모듈A 상담모달(즉시 배정 + 4자리 코드)
 *   트리거. window.__bjConsultContext에 신혼부부 패키지 출처 + 담은 제품을 실어
 *   상담사 대기열 카드에서 바로 인지·추천 가능. inject.js 부재 시 counsel 페이지 폴백.
 */
(function(){
  var ORIGIN = '신혼부부 패키지';

  /* 카테고리별 제품 데이터 — 등급 A 이상, 브랜드 다양화, 신혼 적합 우선 정렬.
     fee = 최저 월 렌탈료(원). pid = 빌리조 prod_no. */
  var NW_DATA = [
    { tier: 1, icon: '🧊', cat: '냉장고', desc: '신혼 주방의 중심. 2인 기준 400~600L가 표준.', items: [
      { pid: '25867', brand: 'LG', name: 'LG 디오스 오브제컬렉션 상냉장 빌트인타입', model: 'M626GBB352', fee: 85900 },
      { pid: '26409', brand: '삼성', name: '삼성 비스포크 4도어 냉장고', model: 'RM70F63R2Z', fee: 66500 },
      { pid: '20058', brand: '하이얼', name: '하이얼 4도어 냉장고 433L', model: 'HRS445MNWP', fee: 30900 },
    ]},
    { tier: 1, icon: '🌀', cat: '세탁기', desc: '세탁+건조 일체형이면 신혼 공간 절약 끝판왕.', items: [
      { pid: '19958', brand: 'LG', name: 'LG 트롬 워시콤보 세탁 25kg+건조 15kg 일체형', model: 'FH25WA', fee: 108400 },
      { pid: '265',   brand: '삼성', name: '삼성 그랑데 통버블 세탁기 21kg', model: 'WA21A8376KV', fee: 22300 },
      { pid: '18554', brand: '삼성', name: '삼성 비스포크 AI그랑데 세탁기 21kg', model: 'WF21CB6650BW', fee: 28600 },
      { pid: '29111', brand: 'LG', name: 'LG 통돌이 세탁기 17kg', model: 'F17HTP', fee: 33600 },
    ]},
    { tier: 1, icon: '🌬️', cat: '건조기', desc: '장마철·미세먼지 계절 필수. 빨래 널 공간이 사라져요.', items: [
      { pid: '19483', brand: 'LG', name: 'LG 트롬 건조기 10kg', model: 'RH10WTW', fee: 28800 },
      { pid: '14471', brand: '삼성', name: '삼성 비스포크 그랑데 건조기 20kg', model: 'DV20CB8600BW', fee: 35300 },
      { pid: '22677', brand: '미닉스', name: '미닉스 미니 건조기 (원룸·소형)', model: 'MNMD-120G', fee: 11500 },
    ]},
    { tier: 1, icon: '❄️', cat: '에어컨', desc: '거실+침실 멀티형이 신혼 국룰. 평수 맞춤 추천.', items: [
      { pid: '26012', brand: '삼성', name: '삼성 멀티 에어컨 19+6평 (거실+방)', model: 'AF70F19D11WRS', fee: 64100 },
      { pid: '32581', brand: 'LG', name: 'LG 휘센 뷰Ⅱ 스탠드 18평', model: 'FQ18FU1EA1', fee: 69400 },
      { pid: '26379', brand: '삼성', name: '삼성 스탠드 에어컨 15평', model: 'AR60F15D12WS', fee: 39800 },
      { pid: '18520', brand: 'LG', name: 'LG 휘센 벽걸이 냉난방 11평', model: 'SW11EK1WAS', fee: 41600 },
    ]},
    { tier: 1, icon: '💧', cat: '정수기', desc: '둘이 마시는 물, 위생관리까지. 컴팩트 직수형 인기.', items: [
      { pid: '27062', brand: '코웨이', name: '코웨이 아이콘 프로 냉온정수기', model: 'CHP-7212N', fee: 29900 },
      { pid: '12956', brand: '코웨이', name: '코웨이 나노직수 미니 정수기 (130mm 슬림)', model: 'P-350N', fee: 16900 },
      { pid: '10042', brand: '쿠쿠', name: '쿠쿠 인스퓨어 냉온정수기 데스크형', model: 'CP-W602HW', fee: 17900 },
      { pid: '2880',  brand: '루헨스', name: '루헨스 냉온정수기', model: 'WHP-2200', fee: 23900 },
    ]},
    { tier: 1, icon: '🧹', cat: '청소기', desc: '로봇+스틱 조합이면 맞벌이 신혼 청소 자동화.', items: [
      { pid: '32957', brand: '로보락', name: '로보락 S10 MaxV Ultra 직배수 로봇청소기', model: 'S10 MaxV Ultra', fee: 49900 },
      { pid: '30959', brand: 'LG', name: 'LG 로보킹 AI 올인원 (자동 급배수)', model: 'B95AWBH', fee: 53300 },
      { pid: '32406', brand: '삼성', name: '삼성 AI 스팀 울트라 직배수 로봇청소기', model: 'VR90F01SAG', fee: 46900 },
      { pid: '27014', brand: '삼성', name: '삼성 비스포크 AI제트 스틱청소기 400W', model: 'VS90F40CNG', fee: 39500 },
    ]},
    { tier: 2, icon: '🍽️', cat: '식기세척기', desc: '설거지 당번 다툼 예방템 1순위.', items: [
      { pid: '24918', brand: 'LG', name: 'LG 디오스 식기세척기 14인용', model: 'DUE6BGE', fee: 48900 },
      { pid: '27095', brand: '삼성', name: '삼성 비스포크 식기세척기 14인용', model: 'DW90F79F1U01T', fee: 48000 },
      { pid: '22678', brand: '미닉스', name: '미닉스 컴팩트 식기세척기 (신혼·원룸)', model: 'MNDW-110G', fee: 13500 },
    ]},
    { tier: 2, icon: '👔', cat: '의류관리기', desc: '출근룩 관리·새옷 냄새 제거. 맞벌이 만족도 최상.', items: [
      { pid: '31526', brand: 'LG', name: 'LG 스타일러 오브제컬렉션', model: 'SC5GMR80S', fee: 72800 },
      { pid: '31522', brand: 'LG', name: 'LG 스타일러 오브제컬렉션 (기본형)', model: 'SC3GNE50', fee: 50400 },
      { pid: '13462', brand: '삼성', name: '삼성 에어드레서 5벌', model: 'DF18CB8700CR', fee: 38500 },
    ]},
    { tier: 2, icon: '📺', cat: 'TV', desc: '신혼 거실 완성. 55~65인치가 표준.', items: [
      { pid: '22079', brand: '삼성', name: '삼성 UHD TV 65인치', model: 'KQ65LSD01AFXKR', fee: 76900 },
      { pid: '22078', brand: '삼성', name: '삼성 UHD TV 55인치', model: 'KQ55LSD01AFXKR', fee: 54600 },
      { pid: '24218', brand: '인켈', name: '인켈 UHD TV 65인치 (가성비)', model: 'SQG650SW', fee: 33900 },
    ]},
    { tier: 3, icon: '📡', cat: '인터넷', desc: '신혼집 개통, 가전과 묶으면 사은품 추가.', items: [
      { pid: '31620', brand: 'KT', name: 'KT 인터넷 100M 단독 회선', model: '단독 회선 · 안정 속도', fee: 22000 },
      { pid: '31613', brand: 'LG U+', name: 'LG U+ 광랜 100M + WiFi 일체', model: '광랜 + WiFi', fee: 22000 },
    ]},
  ];

  var picked = {}; // pid -> item (담기 상태)

  window.bjOpenNewlywedModal = function(){
    if (document.querySelector('.bj-nw-modal')) return;

    var modal = document.createElement('div');
    modal.className = 'bj-nw-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(20,25,40,0.55);backdrop-filter:blur(4px);overflow-y:auto;animation:bjNwFadeIn 0.2s';

    var content = document.createElement('div');
    content.className = 'bj-nw-modal-content';
    content.style.cssText = 'max-width:1200px;margin:24px auto 90px;background:#fafbfc;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.3);position:relative';
    content.innerHTML = buildHtml();

    var closeBtn = document.createElement('button');
    closeBtn.style.cssText = 'position:fixed;top:24px;right:24px;width:44px;height:44px;border-radius:50%;background:#fff;border:0;font-size:22px;cursor:pointer;z-index:100000;box-shadow:0 4px 16px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center';
    closeBtn.innerHTML = '✕';
    function closeModal(){
      modal.remove(); document.body.style.overflow = '';
      window.__bjConsultContext = null; // 패키지 컨텍스트는 모달 열려있는 동안만
    }
    closeBtn.onclick = closeModal;

    modal.appendChild(content);
    modal.appendChild(closeBtn);
    modal.onclick = function(e){ if (e.target === modal) closeModal(); };

    document.body.style.overflow = 'hidden';
    document.body.appendChild(modal);

    if (!document.querySelector('#bj-nw-modal-style')) {
      var st = document.createElement('style');
      st.id = 'bj-nw-modal-style';
      st.textContent = MODAL_CSS + '@keyframes bjNwFadeIn{from{opacity:0}to{opacity:1}}';
      document.head.appendChild(st);
    }

    setConsultContext(); // 모달 열린 순간부터 출처=신혼부부 패키지
    bindEvents(content);
  };

  function setConsultContext(){
    var items = Object.keys(picked).map(function(pid){ return picked[pid]; });
    var label = items.length
      ? ORIGIN + ' 상담 (' + items.length + '개 제품 담음)'
      : ORIGIN + ' 상담';
    window.__bjConsultContext = {
      productId: items.length === 1 ? items[0].pid : null,
      productName: label,
      selection: {
        origin: ORIGIN,
        requestedProducts: items.map(function(it){
          return { pid: it.pid, name: it.name, brand: it.brand, model: it.model, monthlyFee: it.fee, category: it.cat };
        })
      }
    };
  }

  function bindEvents(root){
    root.addEventListener('click', function(e){
      var btn = e.target.closest ? e.target.closest('.bj-nw-pick') : null;
      if (!btn) return;
      e.preventDefault();
      var pid = btn.getAttribute('data-pid');
      var found = null;
      NW_DATA.forEach(function(sec){
        sec.items.forEach(function(it){ if (it.pid === pid) { found = it; found.cat = sec.cat; } });
      });
      if (!found) return;
      if (picked[pid]) { delete picked[pid]; btn.classList.remove('on'); btn.textContent = '➕ 담기'; }
      else { picked[pid] = found; btn.classList.add('on'); btn.textContent = '✓ 담음'; }
      setConsultContext();
      var n = Object.keys(picked).length;
      var bar = root.querySelector('.bj-nw-pickbar');
      var cnt = root.querySelector('.bj-nw-pickbar .cnt');
      if (bar) bar.classList.toggle('show', n > 0);
      if (cnt) cnt.textContent = n;
    });
  }

  function won(n){ return (n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  function productCard(it){
    return '<div class="bj-nw-pcard">'
      + '<div class="bj-nw-pchips"><span class="bj-nw-brand">' + it.brand + '</span><span class="bj-nw-grade">평가 A</span></div>'
      + '<h4 class="bj-nw-pname">' + it.name + '</h4>'
      + '<div class="bj-nw-pmodel">' + it.model + '</div>'
      + '<div class="bj-nw-pprice"><small>월</small>' + won(it.fee) + '원~</div>'
      + '<div class="bj-nw-pbtns">'
      +   '<a class="bj-nw-btn bj-nw-btn-view" href="https://www.billyjo.co.kr/html/dh_prod/prod_view/' + it.pid + '" target="_blank">자세히</a>'
      +   '<button type="button" class="bj-nw-btn bj-nw-pick" data-pid="' + it.pid + '">➕ 담기</button>'
      + '</div></div>';
  }

  function section(sec){
    return '<section class="bj-nw-section">'
      + '<h2 class="bj-nw-section-h">' + sec.icon + ' ' + sec.cat
      + ' <span class="bj-nw-tier">' + (sec.tier === 1 ? '★★★★★ 필수' : sec.tier === 2 ? '★★★★ 선택' : '★★★ 추가') + '</span></h2>'
      + '<p class="bj-nw-desc">' + sec.desc + '</p>'
      + '<div class="bj-nw-pgrid">' + sec.items.map(productCard).join('') + '</div>'
      + '</section>';
  }

  function consultBtn(label){
    // data-bj-consult → inject.js 모듈A가 클릭 가로채 즉시 상담사 배정 모달 오픈.
    // inject.js 미로드 환경에선 기본 동작(counsel 페이지 이동) 폴백.
    return '<a href="https://www.billyjo.co.kr/html/dh/counsel" data-bj-consult="1">' + label + '</a>';
  }

  function buildHtml(){
    var t1 = NW_DATA.filter(function(s){ return s.tier === 1; }).map(section).join('');
    var t2 = NW_DATA.filter(function(s){ return s.tier === 2; }).map(section).join('');
    var t3 = NW_DATA.filter(function(s){ return s.tier === 3; }).map(section).join('');
    return ''
    + '<div class="bj-nw-hero">'
    + '  <h1>💍 신혼 가전, 한 번에 시작하기</h1>'
    + '  <p>삼성·LG·코웨이 — 브랜드별 신혼 추천 제품을 한눈에 비교하세요</p>'
    + '  <p>마음에 드는 제품을 <b>담기</b>로 모아 한 번에 상담받으면 패키지 사은품까지</p>'
    + '  <div class="source">빌리조 제품분석 평가 A 이상 · 신혼 적합 기준 선정</div>'
    + '</div>'
    + '<div class="bj-nw-container">'
    + t1
    + '<div class="bj-nw-bundle">'
    + '  <h3>🎁 패키지 묶음 신청 안내</h3>'
    + '  <p>2개 이상 동시 가입 시 사은품 추가 + 첫 달 무료 등 상담 시 안내</p>'
    + consultBtn('💬 바로 상담 신청')
    + '</div>'
    + t2 + t3
    + '<div class="bj-nw-bundle">'
    + '  <h3>맞춤 추천이 필요하세요?</h3>'
    + '  <p>가구 구성·예산·생활 패턴에 맞춰 빌리조 전문가가 패키지를 제안합니다.</p>'
    + consultBtn('💬 무료 상담 신청')
    + '</div>'
    + '</div>'
    + '<div class="bj-nw-pickbar">'
    + '  <div class="bj-nw-pickbar-txt">🛒 담은 제품 <b class="cnt">0</b>개 — 상담사가 신혼 패키지로 한 번에 안내</div>'
    +    consultBtn('💬 선택 제품 상담 신청')
    + '</div>';
  }

  var MODAL_CSS = [
    '.bj-nw-modal-content *{box-sizing:border-box}',
    ".bj-nw-modal-content{font-family:'Pretendard','Apple SD Gothic Neo','맑은 고딕',sans-serif;color:#2a2a2a;line-height:1.5;-webkit-font-smoothing:antialiased}",
    '.bj-nw-hero{background:linear-gradient(135deg,#0838F8 0%,#1a87ac 100%);color:#fff;padding:44px 24px;text-align:center}',
    '.bj-nw-hero h1{font-size:32px;font-weight:800;margin:0 0 14px;letter-spacing:-0.5px}',
    '.bj-nw-hero p{font-size:15.5px;opacity:0.95;margin:0 0 6px}',
    '.bj-nw-hero .source{font-size:12px;opacity:0.75;margin-top:14px}',
    '.bj-nw-container{padding:0 24px 32px}',
    '.bj-nw-section{padding:28px 0 6px}',
    '.bj-nw-section-h{font-size:21px;font-weight:700;margin:0 0 6px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}',
    '.bj-nw-tier{display:inline-flex;font-size:12px;font-weight:700;padding:4px 10px;border-radius:20px;color:#0838F8;background:#e8edff}',
    '.bj-nw-desc{font-size:13.5px;color:#6a6a6a;margin:2px 0 14px}',
    '.bj-nw-pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(225px,1fr));gap:12px}',
    '.bj-nw-pcard{background:#fff;border:0.5px solid #e6e8eb;border-radius:12px;padding:15px;display:flex;flex-direction:column;transition:transform 0.2s,box-shadow 0.2s}',
    '.bj-nw-pcard:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(8,56,248,0.10)}',
    '.bj-nw-pchips{display:flex;gap:6px;margin-bottom:9px}',
    '.bj-nw-brand{font-size:11px;font-weight:800;color:#0838F8;background:#e8edff;border-radius:6px;padding:3px 8px}',
    '.bj-nw-grade{font-size:11px;font-weight:700;color:#16a34a;background:#e9f9ef;border-radius:6px;padding:3px 8px}',
    '.bj-nw-pname{font-size:13.5px;font-weight:600;line-height:1.45;margin:0 0 3px;min-height:39px}',
    '.bj-nw-pmodel{font-size:11px;color:#999;margin:0 0 10px}',
    '.bj-nw-pprice{font-size:16.5px;font-weight:800;color:#0838F8;margin:auto 0 10px}',
    '.bj-nw-pprice small{font-size:11px;color:#6a6a6a;font-weight:500;margin-right:4px}',
    '.bj-nw-pbtns{display:flex;gap:6px}',
    '.bj-nw-btn{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:4px;font-size:12.5px;font-weight:700;padding:9px 8px;border-radius:8px;text-decoration:none;cursor:pointer}',
    '.bj-nw-btn-view{background:#0838F8;color:#fff}',
    '.bj-nw-btn-view:hover{background:#052bcc}',
    '.bj-nw-pick{background:#fff;color:#0838F8;border:1.5px solid #0838F8}',
    '.bj-nw-pick:hover{background:#eef2ff}',
    '.bj-nw-pick.on{background:#16a34a;border-color:#16a34a;color:#fff}',
    '.bj-nw-bundle{background:linear-gradient(135deg,#f7f9ff 0%,#eef2ff 100%);border:1px solid #e8edff;border-radius:14px;padding:26px;text-align:center;margin:22px 0}',
    '.bj-nw-bundle h3{font-size:20px;font-weight:700;color:#0838F8;margin:0 0 10px}',
    '.bj-nw-bundle p{margin:0 0 16px;color:#6a6a6a;font-size:14px}',
    '.bj-nw-bundle a{display:inline-flex;align-items:center;gap:8px;background:#0838F8;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:10px;font-size:14.5px;cursor:pointer}',
    '.bj-nw-pickbar{position:fixed;left:0;right:0;bottom:0;z-index:100001;background:#fff;border-top:1px solid #e0e6ff;box-shadow:0 -6px 24px rgba(8,56,248,0.12);padding:12px 18px;display:none;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap}',
    '.bj-nw-pickbar.show{display:flex}',
    '.bj-nw-pickbar-txt{font-size:14px;font-weight:600;color:#2a2a2a}',
    '.bj-nw-pickbar-txt b{color:#0838F8;font-size:16px}',
    '.bj-nw-pickbar a{display:inline-flex;align-items:center;gap:6px;background:#0838F8;color:#fff;text-decoration:none;font-weight:800;padding:12px 24px;border-radius:10px;font-size:15px;cursor:pointer}',
    '@media (max-width:600px){',
    '  .bj-nw-hero{padding:32px 18px}',
    '  .bj-nw-hero h1{font-size:23px}',
    '  .bj-nw-hero p{font-size:13.5px}',
    '  .bj-nw-container{padding:0 14px 24px}',
    '  .bj-nw-section{padding:22px 0 4px}',
    '  .bj-nw-section-h{font-size:18px}',
    '  .bj-nw-pgrid{grid-template-columns:repeat(2,1fr);gap:9px}',
    '  .bj-nw-pcard{padding:11px}',
    '  .bj-nw-pname{font-size:12.5px;min-height:36px}',
    '  .bj-nw-pprice{font-size:15px}',
    '  .bj-nw-btn{font-size:11.5px;padding:8px 4px}',
    '  .bj-nw-bundle{padding:20px}',
    '  .bj-nw-bundle h3{font-size:17px}',
    '  .bj-nw-pickbar{padding:10px 12px;gap:10px}',
    '  .bj-nw-pickbar-txt{font-size:12.5px}',
    '  .bj-nw-pickbar a{font-size:13.5px;padding:10px 16px}',
    '}'
  ].join('\n');
})();
