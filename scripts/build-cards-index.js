#!/usr/bin/env node
/**
 * cards/*.html에서 메타 추출 → cards-index.json 생성.
 *
 * 이 인덱스는 admin2 백엔드의 /v1/products/recommendations에서 fetch하여
 * 빌리조 카탈로그 기반 3원칙 매칭 추천에 사용됨 (룰북: billyjo-recommendation-rules).
 *
 * 출력 스키마:
 *   { generated_at, count, products: { "<prod_no>": { ... } } }
 *
 * 사용:
 *   node scripts/build-cards-index.js
 *   → cards-index.json 생성 (repo root)
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const CARDS_DIR = path.join(REPO_ROOT, 'cards');
const OUT_PATH = path.join(REPO_ROOT, 'cards-index.json');

function readSafe(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return ''; }
}

function decodeEntities(s) {
  return String(s || '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function stripTags(s) { return decodeEntities(String(s || '').replace(/<[^>]*>/g, '').trim()); }

function extractMeta(html, prodNo) {
  if (!html) return null;
  const out = {
    prodNo: prodNo,
    modelCode: null,
    brand: null,
    productName: null,
    sizeType: null,
    formFactor: null,
    mgmtType: null,
    category: null,
    functions: [],
    monthlyFee: null,
    monthlyFeeRangeLabel: null,
    gradeLetter: null,
    personas: [],
  };

  // 모델명: <span class="model-num">CHPI-7400N</span>
  const m1 = html.match(/class="model-num">([^<]+)</);
  if (m1) out.modelCode = stripTags(m1[1]);

  // .name — 카드 표시 이름. 결합상품은 "(보람피플 올인원598 1구좌) 쿠쿠 에코웨일 …" 처럼
  // 앞에 판매 패키지 표기가 붙는다. 실제 제품은 괄호 뒤쪽이므로 분리해 둔다.
  const nm = html.match(/class="name">([^<]*)</);
  if (nm) {
    out.displayName = stripTags(nm[1]);
    const bm = out.displayName.match(/^\s*\(([^)]*)\)\s*(.+)$/);
    if (bm) { out.bundleLabel = bm[1].trim(); out.innerName = bm[2].trim(); }
    else { out.innerName = out.displayName; }
  }

  // .head .meta — "모델명: CHPI-7400N · 컴팩트형 · 240 x 473 x 465 mm"
  // ⚠ 탐욕적 캡처 금지: 예전 패턴([^<]+(?:<[^>]+>[^<]*)*)은 </div> 를 넘어 카드 평가표까지
  // 삼켰다. 거기 "정수성능" 문구가 있어 차량·캠핑용품까지 category='정수기' 로 찍혔다
  // (2026-07-29 실측: 정수기 229 → 1,209). 첫 </div> 에서 끊는다.
  const m2 = html.match(/class="meta">([\s\S]*?)<\/div>/);
  if (m2) {
    const meta = stripTags(m2[1]);
    out.productNameMeta = meta;
  }

  // .sc .sl/.sv 쌍 추출 (스펙 그리드)
  const specRe = /<div class="sc"><div class="sl">([^<]+)<\/div><div class="sv">([^<]+)<\/div>/g;
  let sm;
  const specs = {};
  while ((sm = specRe.exec(html))) {
    const label = stripTags(sm[1]);
    const value = stripTags(sm[2]);
    specs[label] = value;
  }
  out.specs = specs;
  if (specs['브랜드']) out.brand = specs['브랜드'];
  if (specs['타입']) out.formFactor = specs['타입'];
  if (specs['방식']) out.sizeType = specs['방식'];
  if (specs['관리']) out.mgmtType = specs['관리'];
  if (specs['기능']) {
    const fnText = specs['기능'];
    if (/얼음/.test(fnText)) out.functions.push('ice');
    if (/냉수|냉온|냉정/.test(fnText)) out.functions.push('cold');
    if (/온수|냉온|온정/.test(fnText)) out.functions.push('hot');
    if (/살균|UV/i.test(fnText)) out.functions.push('uv');
    if (/RO/i.test(fnText)) out.functions.push('ro');
    if (out.functions.length === 0 && /정수/.test(fnText)) out.functions.push('cold');
  }
  if (specs['월렌탈료'] || specs['렌탈료']) {
    const rt = specs['렌탈료'] || specs['월렌탈료'];
    // "월 45,400원" → 45400
    const numM = rt.match(/(\d[\d,]+)/);
    if (numM) out.monthlyFee = parseInt(numM[1].replace(/,/g, ''), 10);
    out.monthlyFeeRangeLabel = rt;
  }

  // 종합 등급 letter — SVG 텍스트 안 letter (y=62 size 26 Bold)
  const gradeRe = /<text[^>]*y="62"[^>]*>([SABCD]\+?|평가 없음)<\/text>/;
  const gm = html.match(gradeRe);
  if (gm) out.gradeLetter = gm[1];

  // 페르소나 3개: .rec-p-title + .p-d + level
  const personaRe = /<span class="rec-p-level-(\d)">([^<]+)<\/span>[\s\S]*?<div class="rec-p-title">([^<]+)<\/div><div class="p-d">([^<]+)</g;
  let pm;
  while ((pm = personaRe.exec(html))) {
    out.personas.push({
      level: parseInt(pm[1], 10),  // 1=매우 추천, 2=추천, 3=권장
      levelLabel: stripTags(pm[2]),
      title: stripTags(pm[3]),
      desc: stripTags(pm[4]),
    });
    if (out.personas.length >= 3) break;
  }

  // 카테고리 키워드 추정 (확장 — admin2 CATEGORY_HINTS와 정렬).
  // ※ 이름이 모델코드뿐이면 여기서 null → build 후 `node scripts/enrich-categories.js`가
  //   prod_view cate_no(사이트 자체 카테고리 ID)로 권위 있게 보강한다 (룰북 #20).
  // 분류 근거는 '구조화된 필드'만 쓴다. 카드 본문을 통째로 넣으면 평가표·설명문의
  // 단어에 걸려 엉뚱하게 분류된다(예전 탐욕 캡처가 정확히 그 사고였다).
  // 실제 제품명(innerName)이 1순위 — 결합상품도 여기서 '음식물처리기' 같은 품목이 잡힌다.
  const productName = [
    out.innerName, out.displayName, out.productNameMeta,
    specs['종류'], specs['타입'], specs['방식'], specs['제품정보'],
  ].filter(Boolean).join(' ');
  const fnText = specs['기능'] || '';
  if (/냉온정수기|얼음정수기|직수정수기|정수전용|정수기|정수/.test(productName) || /정수/.test(fnText)) out.category = '정수기';
  else if (/공기청정기|공기청정|청정기|에어워셔/.test(productName)) out.category = '공기청정기';
  else if (/비데/.test(productName)) out.category = '비데';
  else if (/매트리스|토퍼|모션베드/.test(productName)) out.category = '매트리스';
  else if (/안마의자|안마/.test(productName)) out.category = '안마의자';
  else if (/세탁기|드럼세탁|통돌이/.test(productName)) out.category = '세탁기';
  else if (/건조기/.test(productName)) out.category = '건조기';
  else if (/김치냉장고|와인냉장고|냉동고|냉장고/.test(productName)) out.category = '냉장고';
  else if (/식기세척기|식세기/.test(productName)) out.category = '식기세척기';
  else if (/스타일러|에어드레서|의류관리기/.test(productName)) out.category = '의류관리기';
  else if (/에어컨|냉난방기/.test(productName)) out.category = '에어컨';
  else if (/제습기/.test(productName)) out.category = '제습기';
  else if (/연수기|이온수기/.test(productName)) out.category = '연수기';

  // productName — 브랜드 + 형태 + 모델
  if (out.brand && out.modelCode) {
    const flavor = specs['기능'] || '';
    out.productName = `${out.brand} ${flavor} ${out.modelCode}`.trim();
  } else if (out.productNameMeta) {
    out.productName = out.productNameMeta;
  }

  return out;
}


// ─────────────────────────────────────────────────────────────────────────────
// 브랜드 폴백 (2026-07-29)
//   상세페이지 스펙표에 '브랜드' 행이 없는 상품이 1,054건이라 인덱스에서 통째로 빠졌고,
//   그만큼 추천 후보로도 못 올라갔다. 상품명에서 브랜드를 유추해 되살린다.
//
//   정확도 실측(정답 있는 60건 역검증): 이름 어휘매칭 65% · 첫 토큰 60% ·
//   공급사(supname) 52% · 어휘매칭에 표기 정규화를 더한 결합 규칙 95%.
//   오답은 대부분 표기 흔들림(청호↔청호나이스, SI PAY↔에스아이페이)이라 별칭으로 잡는다.
//   LG↔LG구독은 원본 자체가 갈려(동일 신호에 14:2) 유추하지 않고 이름값을 쓴다.
//
//   결합상품("(보람피플 올인원598 1구좌) 쿠쿠 에코웨일 …")은 제외하지 않는다 —
//   실제 제품(괄호 뒤)을 기준으로 브랜드·품목을 잡아 그 제품으로 보이게 한다.
// ─────────────────────────────────────────────────────────────────────────────
const BRAND_ALIAS = {
  '청호': '청호나이스', '교원': '웰스', '교원웰스': '웰스', 'SK매직': 'SK',
  '현대큐밍': '현대렌탈케어', '쿠쿠홈시스': '쿠쿠', 'SI PAY': '에스아이페이', 'SI': '에스아이페이',
};

function canonBrand(b) {
  if (!b) return null;
  const t = String(b).trim();
  return BRAND_ALIAS[t] || t;
}

/** 스펙표 '브랜드'가 있는 카드들에서 브랜드 어휘를 모은다(긴 이름 우선 매칭용). */
function buildBrandVocab(metas) {
  const set = new Set();
  metas.forEach(m => { if (m && m.brand) set.add(m.brand); });
  return Array.from(set).sort((a, b) => b.length - a.length);
}

/** 상품명 → 브랜드. 어휘 매칭 우선, 없으면 첫 토큰. */
function inferBrand(meta, vocab) {
  const name = (meta.innerName || meta.displayName || '').trim();
  if (!name) return null;
  for (const b of vocab) {
    if (b && name.includes(b)) return canonBrand(b);
  }
  const first = name.split(/\s+/)[0];
  if (!first || first.length < 2 || /^[0-9(]/.test(first)) return null;
  return canonBrand(first);
}

function isBusinessGrade(meta) {
  // 업소용/대용량 표기 감지 — formFactor/sizeType/specs만 (productNameMeta는
  // 본문 누출 위험 있어 제외). '스탠드'는 정수기 가정용 분류에도 사용되어 키워드에서 제거.
  const flags = [
    meta.formFactor, meta.sizeType,
    meta.specs && meta.specs['규격'],
    meta.specs && meta.specs['타입'],
  ].filter(Boolean).join(' ');
  return /업소|사무용|오피스|대용량/.test(flags);
}

function main() {
  if (!fs.existsSync(CARDS_DIR)) {
    console.error('[err] cards/ dir not found');
    process.exit(1);
  }
  const files = fs.readdirSync(CARDS_DIR).filter(f => /^\d+\.html$/.test(f));
  console.log(`[info] processing ${files.length} cards...`);

  const products = {};
  let failed = 0;
  // 1패스: 메타 추출
  const metas = [];
  files.forEach((f, i) => {
    const prodNo = f.replace('.html', '');
    const html = readSafe(path.join(CARDS_DIR, f));
    try {
      const meta = extractMeta(html, prodNo);
      if (!meta) { failed++; return; }
      metas.push(meta);
    } catch (e) { failed++; }
    if ((i + 1) % 500 === 0) console.log(`  processed ${i + 1}/${files.length}`);
  });

  // 2패스: 스펙표에 브랜드가 없던 카드를 상품명으로 되살린다
  const vocab = buildBrandVocab(metas);
  let recovered = 0, stillNone = 0;
  metas.forEach(meta => {
    if (meta.brand) {
      meta.brand = canonBrand(meta.brand);
    } else {
      const guess = inferBrand(meta, vocab);
      if (!guess) { stillNone++; failed++; return; }
      meta.brand = guess;
      meta.brandInferred = true;          // 유추값 표시 — 운영/디버깅용
      recovered++;
    }
    // 표시 이름: 되살린 카드는 productName 이 "모델명: 75QNED85A1P · " 같은 메타 문자열로
    // 잡혀 있다(브랜드가 없어 이름 조립을 못 했다). 카드에 있는 실제 상품명으로 바꾼다.
    // 결합상품도 같은 규칙 — 괄호 뒤 실제 제품명(innerName)이 곧 표시 이름이다.
    if ((meta.brandInferred || meta.bundleLabel) && meta.innerName) meta.productName = meta.innerName;
    meta.isBusinessGrade = isBusinessGrade(meta);
    // productNameMeta 는 카테고리 판정용 내부 값이고 소비처가 없는데 파일의 대부분을 차지한다
    // (admin2 는 추천 때마다 이 파일을 받는다). 출력에서 뺀다 — 22MB → 6MB.
    delete meta.productNameMeta;
    products[meta.prodNo] = meta;
  });
  console.log(`[brand] 유추로 되살림 ${recovered}건 · 유추 실패 ${stillNone}건`);

  const out = {
    generated_at: new Date().toISOString(),
    count: Object.keys(products).length,
    failed: failed,
    products: products,
  };
  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 0), 'utf8');
  const sizeKb = Math.round(fs.statSync(OUT_PATH).size / 1024);
  console.log(`[done] wrote ${out.count} products to ${OUT_PATH} (failed: ${failed}, size: ${sizeKb} KB)`);
}

main();
