/*!
 * 신혼부부 패키지 — 모달 빌더 v3
 * window.bjOpenNewlywedModal() 호출 시 풀스크린 오버레이 모달 열기.
 * billyjo-inject inject.js의 카테고리바 항목 onclick에서 호출됨.
 *
 * v3.7 (2026-06-07): 가격 라벨 칩 통일 — [일반]/[제휴💳] 동일 스타일·고정폭 좌측 정렬.
 * v3.6 (2026-06-07): 카드가 라벨 압축 — '제휴카드 시 월' → '제휴💳 월'.
 * v3.5 (2026-06-07): 히어로 간결화 — 3줄 장문·가운데 정렬 → 좌측 정렬 한 줄 + 혜택 칩 3개.
 * v3.4 (2026-06-07): 모바일 2열 그리드 blowout fix — minmax(0,1fr)+min-width:0, 가격 줄 wrap.
 * v3.3 (2026-06-07): 카드 정렬 정리(칩 1줄·이름 2줄 클램프·가격 줄바꿈 방지) + 스마트홈 장문 카피 제거.
 * v3.2 (2026-06-07): 일반가 병기 — 취소선 폐기, 일반/제휴카드 2줄 동등 표기 (카드 미사용 고객 대응).
 * v3.1 (2026-06-07): 제품 실사 이미지 (prod_view og:image) 카드 상단 표시.
 * v3 (2026-06-07):
 * - 제휴카드 특별 할인 전면 노출: 정가 취소선 + 카드할인가 강조 + 할인율 pill.
 *   (cardFee = 라이브 prod_view month_box data-dcprice 실측, 최장 약정 기준)
 * - 🔥 특별 할인 BEST 섹션 (전 카테고리 할인율 상위) + 💰 가성비 badge.
 * - 묶음 구독 유도: 담은 개수별 pickbar 넛지 + 묶음 혜택 카피.
 * - 동일 브랜드 앱 통합 어필은 화면 텍스트 대신 상담사 토킹포인트로만 전달 (v3.3).
 * v2: 브랜드별 다중 제품(등급 A+수익성+신혼 적합 — 수치 비노출, 룰북 #18/#25),
 *     담기 토글, data-bj-consult로 inject.js 즉시 배정 모달 연동.
 */
(function(){
  var ORIGIN = '신혼부부 패키지';

  /* 제품 대표 이미지 (prod_view og:image 실측, 2026-06-07) — 파일명만 보관 */
  var IMG_BASE = 'https://rentalshop.site/_data/file/goodsImages/';
  var NW_IMG = {
    '265': '7253090e09a74bfb71d039c6cad76fc4.jpg',
    '364': '306231e4c5818f42f73f475a8f6d51c4.jpg',
    '1792': 'ddbbf270230acfb8866af7f2b67ae052.jpg',
    '6784': '9bbeb4e5560aefa08277e869d4bd50a9.jpg',
    '10042': '1ad9611d14b3e50521d5d9c53a5fe42a.png',
    '12956': '221a9ac9aeeb506c2021f7752344917c_1.jpg',
    '13462': '09a70b2b9d2f77ae6fc7334645250c63.jpg',
    '13579': '770df5b51839775da7a1ada30fac914d.png',
    '14471': 'a4388366d990dd61ba7e7573de98ed8c.jpg',
    '16116': '8471f6f3fdfea882377c0f22535d65b5.png',
    '16307': 'c6c434e82b9f7a72210d9a67974cf428.jpg',
    '18520': 'c6cfcdb9ed57e59a5550c71a9efd7160_1_1.png',
    '18550': '69976d2e645e4f43a5f7ce2887ab5fe4.png',
    '18554': 'a508d421a7fbb25e8bff5e6d0414fbb0.png',
    '19483': 'fcf439a8ac85d6b3b7d371daf38038ac.png',
    '19987': 'e623be556f0bf7ab0342f5f89cff184a.png',
    '20058': '6f6c208703e3d66025279e06df06ec61.png',
    '22078': '42f717ee83112c763809b416fa2fc8bc_1_1.png',
    '22079': '34b57d1cda1ed3edac42aa9e9b31ba7f.png',
    '22677': '88fcf3c1d2f9ebbc7291a96835d5c07d.png',
    '24218': '4d5c9ce0888fcf21e762d9c7e78dce7c.png',
    '24220': '791edb9311dbacbd7e793ed5a1703972.png',
    '24225': 'a7d4288408ee2450e6b1dd11a72a8837.png',
    '24918': 'b161b55443da0a8115f6a833434ecfee.png',
    '25867': 'ea6a93b09c703f1058c82091b969d332.png',
    '26012': '962868ec226633829abc82012e84635a.png',
    '26379': '75bde5b762ab3378785283a39d5c4317.jpg',
    '26409': 'f3f1efc2df03a61c47fe448927ccd036.jpg',
    '26797': '341cf2cd4235b23878cad97b594b38da.png',
    '27014': '611cb7bb55c9acb927e5c2f324c7fcfb.png',
    '27095': '354028023ab8510f8800b83968769412.png',
    '29508': '2f212d87776e051a4b613b4719f30b70.png',
    '30906': '1383e03d6b864b80633f740821b6e1ee.png',
    '30959': 'cbcef8e71d6fc789fac105badcbede90_1.png',
    '31522': '8e623f8309db6d0ae12fb9260c16fa99.png',
    '31526': '11c0e80d1ad0c970bce1ed62150b1600.png',
    '31613': '3faa0322cb172a9ce65b2cb6d4b0a653.jpg',
    '31620': 'fef258d149b77a0810241db7b5b2e6f3.jpg',
    '32406': '51e157aa0717c9e205ce9423a03f1b98.jpg',
    '32581': '08b36536ce7854f164a3dffdaaf8cc18.jpg',
    '32957': '551f109b0c19eaa3ea1046b76bc1fea8.jpg',
  };

  /* 카테고리별 제품 — fee=정가(월), card=제휴카드 적용가(월, null=카드할인 없음),
     v=가성비 badge. 정렬: 할인·수익성·신혼 적합. */
  var NW_DATA = [
    { tier: 1, icon: '🧊', cat: '냉장고', desc: '신혼 주방의 중심. 2인 기준 400~600L가 표준.', items: [
      { pid: '30906', brand: 'LG', name: 'LG 디오스 오브제컬렉션 냉장고 (키친핏)', model: 'Z495GBB271', fee: 72900, card: 32900 },
      { pid: '25867', brand: 'LG', name: 'LG 디오스 오브제컬렉션 상냉장 빌트인타입', model: 'M626GBB352', fee: 85900, card: 45900 },
      { pid: '26409', brand: '삼성', name: '삼성 비스포크 4도어 냉장고', model: 'RM70F63R2Z', fee: 66500, card: 41500 },
      { pid: '20058', brand: '하이얼', name: '하이얼 4도어 냉장고 433L', model: 'HRS445MNWP', fee: 30900, card: 5900, v: 1 },
      { pid: '16307', brand: '루컴즈', name: '루컴즈 일반 냉장고 (세컨드·원룸)', model: 'RTW180H1', fee: 9900, card: null, v: 1 },
    ]},
    { tier: 1, icon: '🌀', cat: '세탁기', desc: '세탁+건조 일체형이면 신혼 공간 절약 끝판왕.', items: [
      { pid: '18554', brand: '삼성', name: '삼성 비스포크 AI그랑데 세탁기 21kg', model: 'WF21CB6650BW', fee: 28600, card: 3600 },
      { pid: '364',   brand: 'LG', name: 'LG 트롬 드럼세탁기 12kg', model: 'F12WVA', fee: 25700, card: 700, v: 1 },
      { pid: '6784',  brand: '삼성', name: '삼성 그랑데 드럼세탁기 21kg', model: 'WF21T6000KV', fee: 27500, card: 2500 },
      { pid: '19987', brand: 'LG', name: 'LG 트롬 워시콤보 세탁 25kg+건조 15kg 일체형', model: 'FH25VAX', fee: 132000, card: 107000 },
      { pid: '265',   brand: '삼성', name: '삼성 그랑데 통버블 세탁기 21kg', model: 'WA21A8376KV', fee: 22300, card: null, v: 1 },
    ]},
    { tier: 1, icon: '🌬️', cat: '건조기', desc: '장마철·미세먼지 계절 필수. 빨래 널 공간이 사라져요.', items: [
      { pid: '18550', brand: '삼성', name: '삼성 비스포크 건조기 17kg', model: 'DV17CB6600BW', fee: 31900, card: 6900 },
      { pid: '14471', brand: '삼성', name: '삼성 비스포크 그랑데 건조기 20kg', model: 'DV20CB8600BW', fee: 35300, card: 10300 },
      { pid: '19483', brand: 'LG', name: 'LG 트롬 건조기 10kg', model: 'RH10WTW', fee: 28800, card: 8800 },
      { pid: '22677', brand: '미닉스', name: '미닉스 미니 건조기 (원룸·소형)', model: 'MNMD-120G', fee: 11500, card: null, v: 1 },
    ]},
    { tier: 1, icon: '❄️', cat: '에어컨', desc: '거실+침실 멀티형이 신혼 국룰. 평수 맞춤 추천.', items: [
      { pid: '26797', brand: '삼성', name: '삼성 벽걸이 에어컨 7평 (침실)', model: 'AR60F07D12WS', fee: 25500, card: 500, v: 1 },
      { pid: '26012', brand: '삼성', name: '삼성 멀티 에어컨 19+6평 (거실+방)', model: 'AF70F19D11WRS', fee: 64100, card: 24100 },
      { pid: '26379', brand: '삼성', name: '삼성 스탠드 에어컨 15평', model: 'AR60F15D12WS', fee: 39800, card: 14800 },
      { pid: '18520', brand: 'LG', name: 'LG 휘센 벽걸이 냉난방 11평', model: 'SW11EK1WAS', fee: 41600, card: 16600 },
      { pid: '32581', brand: 'LG', name: 'LG 휘센 뷰Ⅱ 스탠드 18평', model: 'FQ18FU1EA1', fee: 67000, card: 42000 },
    ]},
    { tier: 1, icon: '💧', cat: '정수기', desc: '둘이 마시는 물, 위생관리까지. 컴팩트 직수형 인기.', items: [
      { pid: '16116', brand: '코웨이', name: '코웨이 엘리트 냉온정수기', model: 'CHP-6340L', fee: 30900, card: 900 },
      { pid: '1792',  brand: '코웨이', name: '코웨이 아이스 얼음 냉온정수기', model: 'CHPI-620L', fee: 48900, card: 18900 },
      { pid: '12956', brand: '코웨이', name: '코웨이 나노직수 미니 정수기 (130mm 슬림)', model: 'P-350N', fee: 16900, card: null, v: 1 },
      { pid: '10042', brand: '쿠쿠', name: '쿠쿠 인스퓨어 냉온정수기 데스크형', model: 'CP-W602HW', fee: 17900, card: null, v: 1 },
    ]},
    { tier: 1, icon: '🧹', cat: '청소기', desc: '로봇+스틱 조합이면 맞벌이 신혼 청소 자동화.', items: [
      { pid: '32406', brand: '삼성', name: '삼성 AI 스팀 울트라 직배수 로봇청소기', model: 'VR90F01SAG', fee: 46900, card: 6900 },
      { pid: '27014', brand: '삼성', name: '삼성 비스포크 AI제트 스틱청소기 400W', model: 'VS90F40CNG', fee: 39500, card: 14500 },
      { pid: '32957', brand: '로보락', name: '로보락 S10 MaxV Ultra 직배수 로봇청소기', model: 'S10 MaxV Ultra', fee: 49900, card: 24900 },
      { pid: '30959', brand: 'LG', name: 'LG 로보킹 AI 올인원 (자동 급배수)', model: 'B95AWBH', fee: 53300, card: 28300 },
      { pid: '29508', brand: '로보락', name: '로보락 H60 Hub Ultra 무선청소기', model: 'H60 Hub Ultra', fee: 12900, card: null, v: 1 },
    ]},
    { tier: 2, icon: '🍽️', cat: '식기세척기', desc: '설거지 당번 다툼 예방템 1순위.', items: [
      { pid: '27095', brand: '삼성', name: '삼성 비스포크 식기세척기 14인용', model: 'DW90F79F1U01T', fee: 48000, card: 23000 },
      { pid: '24918', brand: 'LG', name: 'LG 디오스 식기세척기 14인용', model: 'DUE6BGE', fee: 48900, card: 23900 },
      { pid: '24225', brand: '모데나', name: '모데나 컴팩트 식기세척기 (신혼·원룸)', model: 'WS1041WCG', fee: 9900, card: null, v: 1 },
    ]},
    { tier: 2, icon: '👔', cat: '의류관리기', desc: '출근룩 관리·새옷 냄새 제거. 맞벌이 만족도 최상.', items: [
      { pid: '13579', brand: '삼성', name: '삼성 에어드레서 3벌', model: 'DF18CG3100HR', fee: 30500, card: 5500, v: 1 },
      { pid: '13462', brand: '삼성', name: '삼성 에어드레서 5벌', model: 'DF18CB8700CR', fee: 38500, card: 13500 },
      { pid: '31522', brand: 'LG', name: 'LG 스타일러 오브제컬렉션 (기본형)', model: 'SC3GNE50', fee: 50400, card: 25400 },
      { pid: '31526', brand: 'LG', name: 'LG 스타일러 오브제컬렉션', model: 'SC5GMR80S', fee: 72800, card: 47800 },
    ]},
    { tier: 2, icon: '📺', cat: 'TV', desc: '신혼 거실 완성. 55~65인치가 표준.', items: [
      { pid: '24218', brand: '인켈', name: '인켈 UHD TV 65인치 (가성비)', model: 'SQG650SW', fee: 33900, card: 13900, v: 1 },
      { pid: '22078', brand: '삼성', name: '삼성 UHD TV 55인치', model: 'KQ55LSD01AFXKR', fee: 54600, card: 29600 },
      { pid: '22079', brand: '삼성', name: '삼성 UHD TV 65인치', model: 'KQ65LSD01AFXKR', fee: 76900, card: 51900 },
      { pid: '24220', brand: '인켈', name: '인켈 UHD TV 86인치 (대화면)', model: 'SQG860SW', fee: 47900, card: 27900 },
    ]},
    { tier: 3, icon: '📡', cat: '인터넷', desc: '신혼집 개통, 가전과 묶으면 사은품 추가.', items: [
      { pid: '31620', brand: 'KT', name: 'KT 인터넷 100M 단독 회선', model: '단독 회선 · 안정 속도', fee: 22000, card: null },
      { pid: '31613', brand: 'LG U+', name: 'LG U+ 광랜 100M + WiFi 일체', model: '광랜 + WiFi', fee: 22000, card: null },
    ]},
  ];

  var picked = {}; // pid -> item

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

    setConsultContext();
    bindEvents(content);
  };

  function pickedList(){ return Object.keys(picked).map(function(p){ return picked[p]; }); }

  function setConsultContext(){
    var items = pickedList();
    var label = items.length
      ? ORIGIN + ' 상담 (' + items.length + '개 제품 담음)'
      : ORIGIN + ' 상담';
    window.__bjConsultContext = {
      productId: items.length === 1 ? items[0].pid : null,
      productName: label,
      selection: {
        origin: ORIGIN,
        requestedProducts: items.map(function(it){
          return { pid: it.pid, name: it.name, brand: it.brand, model: it.model,
                   monthlyFee: it.fee, cardFee: it.card || undefined, category: it.cat };
        })
      }
    };
  }

  /* 담은 개수별 짧은 넛지 (장황한 설명 금지 — 상세 설명은 상담사 몫) */
  function nudgeText(){
    var n = pickedList().length;
    if (n >= 3) return '🎁 묶음 혜택 최대';
    if (n === 2) return '🎁 묶음 사은품 충족';
    if (n === 1) return '1개 더 담으면 사은품 ↑';
    return '';
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
      var on = !picked[pid];
      if (on) picked[pid] = found; else delete picked[pid];
      // BEST 섹션과 카테고리 섹션에 같은 제품이 양쪽 노출 — 버튼 상태 동기화
      root.querySelectorAll('.bj-nw-pick[data-pid="' + pid + '"]').forEach(function(b){
        b.classList.toggle('on', on);
        b.textContent = on ? '✓ 담음' : '➕ 담기';
      });
      setConsultContext();
      var n = Object.keys(picked).length;
      var bar = root.querySelector('.bj-nw-pickbar');
      if (bar) {
        bar.classList.toggle('show', n > 0);
        var cnt = bar.querySelector('.cnt'); if (cnt) cnt.textContent = n;
        var ng = bar.querySelector('.bj-nw-nudge'); if (ng) ng.textContent = nudgeText();
      }
    });
  }

  function won(n){ return (n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function discPct(it){ return it.card ? Math.round((it.fee - it.card) / it.fee * 100) : 0; }

  function productCard(it, cat){
    var d = discPct(it);
    var chips = '<span class="bj-nw-brand">' + it.brand + '</span>'
      + (it.v ? '<span class="bj-nw-value">💰 가성비</span>' : '');
    var price;
    if (it.card) {
      /* 제휴카드 미사용 고객도 많음 — 일반가를 취소선 없이 동등한 정보로 병기
         (룰북 v0.5.56 동일 원칙: 일반 결제 사용자에게도 유효 가격) */
      price = '<div class="bj-nw-feeline"><small>일반</small>월 <b>' + won(it.fee) + '원</b>~</div>'
        + '<div class="bj-nw-pprice"><small>제휴💳</small>월 ' + won(it.card) + '원~'
        + '<span class="bj-nw-disc">-' + d + '%</span></div>';
    } else {
      price = '<div class="bj-nw-feeline">&nbsp;</div>'
        + '<div class="bj-nw-pprice"><small>일반</small>월 ' + won(it.fee) + '원~</div>';
    }
    var img = NW_IMG[it.pid]
      ? '<div class="bj-nw-pimg"><img src="' + IMG_BASE + NW_IMG[it.pid] + '" alt="' + it.name + '" loading="lazy"></div>'
      : '<div class="bj-nw-pimg bj-nw-pimg-empty">' + (it.brand || '') + '</div>';
    return '<div class="bj-nw-pcard">'
      + img
      + '<div class="bj-nw-pchips">' + chips + '</div>'
      + '<h4 class="bj-nw-pname">' + it.name + '</h4>'
      + '<div class="bj-nw-pmodel">' + it.model + '</div>'
      + price
      + '<div class="bj-nw-pbtns">'
      +   '<a class="bj-nw-btn bj-nw-btn-view" href="https://www.billyjo.co.kr/html/dh_prod/prod_view/' + it.pid + '" target="_blank">자세히</a>'
      +   '<button type="button" class="bj-nw-pick' + (picked[it.pid] ? ' on' : '') + '" data-pid="' + it.pid + '">' + (picked[it.pid] ? '✓ 담음' : '➕ 담기') + '</button>'
      + '</div></div>';
  }

  function section(sec){
    return '<section class="bj-nw-section">'
      + '<h2 class="bj-nw-section-h">' + sec.icon + ' ' + sec.cat
      + ' <span class="bj-nw-tier">' + (sec.tier === 1 ? '★★★★★ 필수' : sec.tier === 2 ? '★★★★ 선택' : '★★★ 추가') + '</span></h2>'
      + '<p class="bj-nw-desc">' + sec.desc + '</p>'
      + '<div class="bj-nw-pgrid">' + sec.items.map(function(it){ return productCard(it, sec.cat); }).join('') + '</div>'
      + '</section>';
  }

  /* 전 카테고리 카드할인율 상위 → 특별 할인 BEST */
  function bestSection(){
    var all = [];
    NW_DATA.forEach(function(sec){
      sec.items.forEach(function(it){ it.cat = sec.cat; if (it.card) all.push(it); });
    });
    all.sort(function(a, b){ return discPct(b) - discPct(a); });
    var top = all.slice(0, 6);
    return '<section class="bj-nw-section bj-nw-best">'
      + '<h2 class="bj-nw-section-h">🔥 신혼 특별 할인 BEST <span class="bj-nw-tier bj-nw-tier-hot">제휴카드 청구할인</span></h2>'
      + '<p class="bj-nw-desc">일반가·제휴카드가 함께 표기 — 카드 없이도 구독 가능</p>'
      + '<div class="bj-nw-pgrid">' + top.map(function(it){ return productCard(it, it.cat); }).join('') + '</div>'
      + '</section>';
  }

  function consultBtn(label){
    // data-bj-consult → inject.js가 클릭 가로채 즉시 상담사 배정 모달 오픈.
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
    + '  <p>담아서 한 번에 상담받으세요</p>'
    + '  <div class="bj-nw-hero-chips">'
    + '    <span>💳 제휴카드 특별 할인</span><span>🎁 묶음 사은품</span><span>⭐ 평가 A 이상</span>'
    + '  </div>'
    + '</div>'
    + '<div class="bj-nw-container">'
    + bestSection()
    + t1
    + '<div class="bj-nw-bundle">'
    + '  <h3>🎁 묶음 구독 혜택 안내</h3>'
    + '  <p>2개 이상 동시 가입 시 사은품 추가, 3개 이상이면 혜택 최대 — 상담 시 안내</p>'
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
    + '  <div class="bj-nw-pickbar-left">'
    + '    <div class="bj-nw-pickbar-txt">🛒 담은 제품 <b class="cnt">0</b>개 — 상담사가 신혼 패키지로 한 번에 안내</div>'
    + '    <div class="bj-nw-nudge"></div>'
    + '  </div>'
    +    consultBtn('💬 선택 제품 상담 신청')
    + '</div>';
  }

  var MODAL_CSS = [
    '.bj-nw-modal-content *{box-sizing:border-box}',
    ".bj-nw-modal-content{font-family:'Pretendard','Apple SD Gothic Neo','맑은 고딕',sans-serif;color:#2a2a2a;line-height:1.5;-webkit-font-smoothing:antialiased}",
    '.bj-nw-hero{background:linear-gradient(135deg,#0838F8 0%,#1a87ac 100%);color:#fff;padding:28px 24px;text-align:left}',
    '.bj-nw-hero h1{font-size:26px;font-weight:800;margin:0 0 6px;letter-spacing:-0.5px}',
    '.bj-nw-hero p{font-size:14px;opacity:0.9;margin:0 0 14px}',
    '.bj-nw-hero-chips{display:flex;gap:6px;flex-wrap:wrap}',
    '.bj-nw-hero-chips span{font-size:12px;font-weight:700;background:rgba(255,255,255,0.16);border:1px solid rgba(255,255,255,0.28);border-radius:999px;padding:5px 12px;white-space:nowrap}',
    '.bj-nw-container{padding:0 24px 32px}',
    '.bj-nw-section{padding:28px 0 6px}',
    '.bj-nw-best{padding-top:24px}',
    '.bj-nw-section-h{font-size:21px;font-weight:700;margin:0 0 6px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}',
    '.bj-nw-tier{display:inline-flex;font-size:12px;font-weight:700;padding:4px 10px;border-radius:20px;color:#0838F8;background:#e8edff}',
    '.bj-nw-tier-hot{color:#d6336c;background:#ffe3ec}',
    '.bj-nw-desc{font-size:13.5px;color:#6a6a6a;margin:2px 0 14px}',
    '.bj-nw-pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(225px,1fr));gap:12px}',
    '.bj-nw-pcard{background:#fff;border:0.5px solid #e6e8eb;border-radius:12px;padding:15px;display:flex;flex-direction:column;transition:transform 0.2s,box-shadow 0.2s;min-width:0;max-width:100%}',
    '.bj-nw-pcard:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(8,56,248,0.10)}',
    '.bj-nw-pimg{height:130px;margin:-3px -3px 10px;background:#fff;border-radius:8px;display:flex;align-items:center;justify-content:center;overflow:hidden}',
    '.bj-nw-pimg img{max-width:100%;max-height:100%;object-fit:contain}',
    '.bj-nw-pimg-empty{color:#c2c8d0;font-size:18px;font-weight:800;background:#f4f6f9}',
    '.bj-nw-pchips{display:flex;gap:5px;margin-bottom:8px;flex-wrap:nowrap;overflow:hidden}',
    '.bj-nw-brand{font-size:11px;font-weight:800;color:#0838F8;background:#e8edff;border-radius:6px;padding:3px 8px}',
    '.bj-nw-value{font-size:10.5px;font-weight:700;color:#b45309;background:#fff4dd;border-radius:6px;padding:3px 7px}',
    '.bj-nw-pname{font-size:13.5px;font-weight:600;line-height:1.45;margin:0 0 3px;height:39px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}',
    '.bj-nw-pmodel{font-size:11px;color:#999;margin:0 0 8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.bj-nw-feeline{font-size:12px;color:#555;margin-top:auto;min-height:18px;white-space:nowrap;overflow:hidden;display:flex;align-items:center}',
    '.bj-nw-feeline small,.bj-nw-pprice small{display:inline-flex;align-items:center;justify-content:center;min-width:44px;font-size:10px;font-weight:700;border-radius:4px;padding:2px 6px;margin-right:5px;flex-shrink:0}',
    '.bj-nw-feeline small{color:#777;background:#f1f3f5}',
    '.bj-nw-pprice small{color:#1c47d6;background:#e8edff}',
    '.bj-nw-feeline b{font-weight:700;color:#333}',
    '.bj-nw-pprice{font-size:16px;font-weight:800;color:#0838F8;margin:0 0 10px;display:flex;align-items:center;gap:5px;white-space:nowrap;overflow:hidden}',
    '.bj-nw-disc{font-size:11px;font-weight:800;color:#fff;background:#d6336c;border-radius:6px;padding:2px 6px}',
    '.bj-nw-pbtns{display:flex;gap:6px}',
    '.bj-nw-btn,.bj-nw-pick{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:4px;font-size:12.5px;font-weight:700;padding:9px 8px;border-radius:8px;text-decoration:none;cursor:pointer}',
    '.bj-nw-btn-view{background:#0838F8;color:#fff}',
    '.bj-nw-btn-view:hover{background:#052bcc}',
    '.bj-nw-pick{background:#fff;color:#0838F8;border:1.5px solid #0838F8}',
    '.bj-nw-pick:hover{background:#eef2ff}',
    '.bj-nw-pick.on{background:#16a34a;border-color:#16a34a;color:#fff}',
    '.bj-nw-bundle{background:linear-gradient(135deg,#f7f9ff 0%,#eef2ff 100%);border:1px solid #e8edff;border-radius:14px;padding:26px;text-align:center;margin:22px 0}',
    '.bj-nw-bundle h3{font-size:20px;font-weight:700;color:#0838F8;margin:0 0 10px}',
    '.bj-nw-bundle p{margin:0 0 16px;color:#6a6a6a;font-size:14px;line-height:1.7}',
    '.bj-nw-bundle a{display:inline-flex;align-items:center;gap:8px;background:#0838F8;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:10px;font-size:14.5px;cursor:pointer}',
    '.bj-nw-pickbar{position:fixed;left:0;right:0;bottom:0;z-index:100001;background:#fff;border-top:1px solid #e0e6ff;box-shadow:0 -6px 24px rgba(8,56,248,0.12);padding:11px 18px;display:none;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap}',
    '.bj-nw-pickbar.show{display:flex}',
    '.bj-nw-pickbar-left{display:flex;flex-direction:column;gap:2px}',
    '.bj-nw-pickbar-txt{font-size:14px;font-weight:600;color:#2a2a2a}',
    '.bj-nw-pickbar-txt b{color:#0838F8;font-size:16px}',
    '.bj-nw-nudge{font-size:12px;font-weight:700;color:#d6336c}',
    '.bj-nw-pickbar a{display:inline-flex;align-items:center;gap:6px;background:#0838F8;color:#fff;text-decoration:none;font-weight:800;padding:12px 24px;border-radius:10px;font-size:15px;cursor:pointer}',
    '@media (max-width:600px){',
    '  .bj-nw-hero{padding:20px 16px}',
    '  .bj-nw-hero h1{font-size:20px}',
    '  .bj-nw-hero p{font-size:12.5px;margin-bottom:10px}',
    '  .bj-nw-hero-chips span{font-size:11px;padding:4px 10px}',
    '  .bj-nw-container{padding:0 14px 24px}',
    '  .bj-nw-section{padding:22px 0 4px}',
    '  .bj-nw-section-h{font-size:18px}',
    '  .bj-nw-pgrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}',
    '  .bj-nw-pcard{padding:11px}',
    '  .bj-nw-pimg{height:96px;margin:-2px -2px 8px}',
    '  .bj-nw-pname{font-size:12.5px;min-height:36px}',
    '  .bj-nw-pprice{font-size:13px;white-space:normal;flex-wrap:wrap;gap:3px;row-gap:1px;min-height:34px;align-content:center}',
    '  .bj-nw-feeline{font-size:11px}',
    '  .bj-nw-feeline small,.bj-nw-pprice small{font-size:9px;min-width:38px;padding:1px 4px;margin-right:4px}',
    '  .bj-nw-disc{font-size:10px;padding:1px 5px}',
    '  .bj-nw-pmodel{font-size:10px}',
    '  .bj-nw-brand,.bj-nw-value{font-size:10px;padding:2px 6px}',
    '  .bj-nw-btn,.bj-nw-pick{font-size:11.5px;padding:8px 4px}',
    '  .bj-nw-bundle{padding:20px}',
    '  .bj-nw-bundle h3{font-size:17px}',
    '  .bj-nw-pickbar{padding:9px 12px;gap:10px}',
    '  .bj-nw-pickbar-txt{font-size:12.5px}',
    '  .bj-nw-nudge{font-size:11px}',
    '  .bj-nw-pickbar a{font-size:13.5px;padding:10px 16px}',
    '}'
  ].join('\n');
})();
