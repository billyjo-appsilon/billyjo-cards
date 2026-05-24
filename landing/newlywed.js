/*!
 * 신혼부부 패키지 — 모달 빌더
 * window.bjOpenNewlywedModal() 호출 시 풀스크린 오버레이 모달 열기.
 * billyjo-detailcard inject.js의 fab onclick에서 호출됨.
 */
(function(){
  window.bjOpenNewlywedModal = function(){
    if (document.querySelector('.bj-nw-modal')) return;

    var modal = document.createElement('div');
    modal.className = 'bj-nw-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(20,25,40,0.55);backdrop-filter:blur(4px);overflow-y:auto;animation:bjNwFadeIn 0.2s';

    var content = document.createElement('div');
    content.className = 'bj-nw-modal-content';
    content.style.cssText = 'max-width:1200px;margin:24px auto;background:#fafbfc;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.3);position:relative';
    content.innerHTML = MODAL_HTML;

    var closeBtn = document.createElement('button');
    closeBtn.style.cssText = 'position:fixed;top:24px;right:24px;width:44px;height:44px;border-radius:50%;background:#fff;border:0;font-size:22px;cursor:pointer;z-index:100000;box-shadow:0 4px 16px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center';
    closeBtn.innerHTML = '✕';
    closeBtn.onclick = function(){ modal.remove(); document.body.style.overflow = ''; };

    modal.appendChild(content);
    modal.appendChild(closeBtn);
    modal.onclick = function(e){ if (e.target === modal) { modal.remove(); document.body.style.overflow = ''; } };

    document.body.style.overflow = 'hidden';
    document.body.appendChild(modal);

    // Style 주입
    if (!document.querySelector('#bj-nw-modal-style')) {
      var st = document.createElement('style');
      st.id = 'bj-nw-modal-style';
      st.textContent = MODAL_CSS + '@keyframes bjNwFadeIn{from{opacity:0}to{opacity:1}}';
      document.head.appendChild(st);
    }
  };

  var MODAL_CSS = `
    .bj-nw-modal-content *{box-sizing:border-box}
    .bj-nw-modal-content{font-family:'Pretendard','Apple SD Gothic Neo','맑은 고딕',sans-serif;color:#2a2a2a;line-height:1.5;-webkit-font-smoothing:antialiased}
    .bj-nw-hero{background:linear-gradient(135deg,#0838F8 0%,#1a87ac 100%);color:#fff;padding:48px 24px;text-align:center}
    .bj-nw-hero h1{font-size:32px;font-weight:800;margin:0 0 14px;letter-spacing:-0.5px}
    .bj-nw-hero p{font-size:16px;opacity:0.95;margin:0 0 6px}
    .bj-nw-hero .source{font-size:12px;opacity:0.75;margin-top:14px}
    .bj-nw-container{padding:0 24px 32px}
    .bj-nw-section{padding:32px 0}
    .bj-nw-section-h{font-size:22px;font-weight:700;margin:0 0 8px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
    .bj-nw-tier{display:inline-flex;font-size:12px;font-weight:700;padding:4px 10px;border-radius:20px;color:#0838F8;background:#e8edff}
    .bj-nw-desc{font-size:13.5px;color:#6a6a6a;margin:4px 0 20px}
    .bj-nw-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px}
    .bj-nw-card{background:#fff;border:0.5px solid #e6e8eb;border-radius:12px;padding:18px;display:flex;flex-direction:column;transition:transform 0.2s,box-shadow 0.2s}
    .bj-nw-card:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(8,56,248,0.10)}
    .bj-nw-icon{width:44px;height:44px;background:#e8edff;color:#0838F8;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:12px}
    .bj-nw-cat{font-size:11px;font-weight:700;color:#0838F8;letter-spacing:0.3px;text-transform:uppercase;margin-bottom:6px}
    .bj-nw-name{font-size:14px;font-weight:600;line-height:1.45;margin:0 0 4px;min-height:42px}
    .bj-nw-model{font-size:11.5px;color:#999;margin:0 0 14px}
    .bj-nw-price{font-size:17px;font-weight:800;color:#0838F8;margin:auto 0 12px}
    .bj-nw-price small{font-size:11px;color:#6a6a6a;font-weight:500;margin-right:4px}
    .bj-nw-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:#0838F8;color:#fff;text-decoration:none;font-size:13px;font-weight:700;padding:10px 14px;border-radius:8px}
    .bj-nw-btn:hover{background:#052bcc}
    .bj-nw-bundle{background:linear-gradient(135deg,#f7f9ff 0%,#eef2ff 100%);border:1px solid #e8edff;border-radius:14px;padding:28px;text-align:center;margin:20px 0}
    .bj-nw-bundle h3{font-size:20px;font-weight:700;color:#0838F8;margin:0 0 10px}
    .bj-nw-bundle p{margin:0 0 16px;color:#6a6a6a;font-size:14px}
    .bj-nw-bundle a{display:inline-flex;align-items:center;gap:8px;background:#0838F8;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:10px;font-size:14.5px}
    @media (max-width:600px){
      .bj-nw-hero{padding:36px 18px}
      .bj-nw-hero h1{font-size:24px}
      .bj-nw-container{padding:0 16px 24px}
      .bj-nw-section{padding:24px 0}
      .bj-nw-section-h{font-size:18px}
      .bj-nw-bundle{padding:20px}
      .bj-nw-bundle h3{font-size:17px}
    }
  `;

  var MODAL_HTML = `
    <div class="bj-nw-hero">
      <h1>💍 신혼 가전, 한 번에 시작하기</h1>
      <p>꼭 필요한 핵심 가전부터 여유로운 라이프 가전까지</p>
      <p>합리적 월 렌탈로 부담 없이 새 살림 시작하세요</p>
      <div class="source">추천 기준: 신혼가전 렌탈 추천 가이드 (AJD)</div>
    </div>
    <div class="bj-nw-container">

      <section class="bj-nw-section">
        <h2 class="bj-nw-section-h">꼭 필요한 핵심 가전 <span class="bj-nw-tier">★★★★★ 필수</span></h2>
        <p class="bj-nw-desc">신혼 입주 첫날부터 매일 쓰는 6종. 없으면 일상 멈추는 카테고리.</p>
        <div class="bj-nw-grid">
          ${card('🧊', '냉장고', 'LG전자 일반 냉장고 189L', 'B182W13 · 신혼 사이즈', '13,500원~', '8009')}
          ${card('🌀', '세탁기', '삼성전자 그랑데 통버블 21KG', 'WA21A8376KV · 대용량', '22,300원~', '265')}
          ${card('🌬️', '건조기', '삼성전자 건조기 9KG', 'DV90TA040KE · 저온제습형', '22,200원~', '3139')}
          ${card('❄️', '에어컨', 'LG 1way 천장형 18평', 'TQ0721T2S · 천장 매립', '68,500원~', '945')}
          ${card('💧', '정수기', '코웨이 나노직수 미니 정수전용', 'P-350N · 130mm 슬림', '15,900원~', '12955')}
          ${card('🧹', '청소기', '삼성 무선청소기 150W', '스틱형', '9,000원~', '22687')}
        </div>
      </section>

      <div class="bj-nw-bundle">
        <h3>🎁 패키지 묶음 신청 안내</h3>
        <p>2개 이상 동시 가입 시 사은품 추가 + 첫 달 무료 등 상담 시 안내</p>
        <a href="https://www.billyjo.co.kr/html/dh/counsel" target="_blank">상담 신청하기</a>
      </div>

      <section class="bj-nw-section">
        <h2 class="bj-nw-section-h">여유 있게 추가하면 좋은 4종 <span class="bj-nw-tier">★★★★ 선택</span></h2>
        <p class="bj-nw-desc">시간·노력 줄여주는 인기 옵션. 최근 신혼은 TV보다 이쪽 선호 추세.</p>
        <div class="bj-nw-grid">
          ${card('🍽️', '식기세척기', '일렉트로룩스 13인용', 'ESF5512LOX · 메탈실버', '26,900원~', '202')}
          ${card('👔', '의류관리기', '코웨이 의류청정기 더블케어', 'FAD-01S · 미러실버', '45,900원~', '5316')}
          ${card('🤖', '로봇청소기', '로보락 Q8', '자동 청소 + 흡입', '11,900원~', '32657')}
          ${card('📺', '대형 TV', '인켈 UHD TV 55인치', '대화면 프리미엄', '18,900원~', '24720')}
        </div>
      </section>

      <section class="bj-nw-section">
        <h2 class="bj-nw-section-h">신혼 시작 추가 항목 <span class="bj-nw-tier">★★★ 추가</span></h2>
        <p class="bj-nw-desc">신혼 출발에 자동차·인터넷도 함께 합리적으로.</p>
        <div class="bj-nw-grid">
          ${card('📡', '인터넷', 'KT 인터넷 100M 단독', '단독 회선 · 안정 속도', '22,000원~', '31620')}
          ${card('📶', '인터넷+WiFi', 'LG U+ 광랜 100M + WiFi', '광랜 + WiFi 일체', '22,000원~', '31613')}
          ${cardGray('🚗', '자동차 렌탈', '신차 장기렌탈 추천', '자동차 카테고리 큐레이션 준비중', '상담 문의', 'https://www.billyjo.co.kr/')}
        </div>
      </section>

      <div class="bj-nw-bundle">
        <h3>맞춤 추천이 필요하세요?</h3>
        <p>가구 구성·예산·생활 패턴에 맞춰 빌리조 전문가가 패키지를 제안합니다.</p>
        <a href="https://www.billyjo.co.kr/html/dh/counsel" target="_blank">💬 무료 상담 신청</a>
      </div>

    </div>
  `;

  function card(icon, cat, name, model, price, pid) {
    return `<div class="bj-nw-card">
      <div class="bj-nw-icon">${icon}</div>
      <div class="bj-nw-cat">${cat}</div>
      <h3 class="bj-nw-name">${name}</h3>
      <div class="bj-nw-model">${model}</div>
      <div class="bj-nw-price"><small>월</small>${price}</div>
      <a class="bj-nw-btn" href="https://www.billyjo.co.kr/html/dh_prod/prod_view/${pid}" target="_blank">자세히 보기 →</a>
    </div>`;
  }
  function cardGray(icon, cat, name, desc, price, url) {
    return `<div class="bj-nw-card" style="background:#f5f6f8;opacity:0.75">
      <div class="bj-nw-icon" style="background:#e6e8eb;color:#6a6a6a">${icon}</div>
      <div class="bj-nw-cat" style="color:#6a6a6a">${cat}</div>
      <h3 class="bj-nw-name">${name}</h3>
      <div class="bj-nw-model">${desc}</div>
      <div class="bj-nw-price" style="color:#6a6a6a">${price}</div>
      <a class="bj-nw-btn" href="${url}" target="_blank" style="background:#6a6a6a">카테고리로 →</a>
    </div>`;
  }
})();
