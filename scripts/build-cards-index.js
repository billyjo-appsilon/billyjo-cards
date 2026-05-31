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

  // .head .meta — "모델명: CHPI-7400N · 컴팩트형 · 240 x 473 x 465 mm"
  const m2 = html.match(/class="meta">([^<]+(?:<[^>]+>[^<]*)*)<\/div>/);
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

  // 카테고리 키워드 추정
  const productName = out.productNameMeta || '';
  if (/정수기/.test(productName) || /정수/.test(specs['기능'] || '')) out.category = '정수기';
  else if (/비데/.test(productName)) out.category = '비데';
  else if (/공기청정기/.test(productName)) out.category = '공기청정기';
  else if (/매트리스/.test(productName)) out.category = '매트리스';
  else if (/안마/.test(productName)) out.category = '안마의자';

  // productName — 브랜드 + 형태 + 모델
  if (out.brand && out.modelCode) {
    const flavor = specs['기능'] || '';
    out.productName = `${out.brand} ${flavor} ${out.modelCode}`.trim();
  } else if (out.productNameMeta) {
    out.productName = out.productNameMeta;
  }

  return out;
}

function isBusinessGrade(meta) {
  // 형태/유형에서 업소·대용량 표기 감지
  const flags = [
    meta.formFactor, meta.sizeType, meta.specs && meta.specs['규격'],
    meta.specs && meta.specs['타입'], meta.productNameMeta,
  ].filter(Boolean).join(' ');
  return /업소|사무용|오피스|대용량|스탠드/.test(flags);
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
  files.forEach((f, i) => {
    const prodNo = f.replace('.html', '');
    const html = readSafe(path.join(CARDS_DIR, f));
    try {
      const meta = extractMeta(html, prodNo);
      if (!meta || !meta.brand) { failed++; return; }
      meta.isBusinessGrade = isBusinessGrade(meta);
      products[prodNo] = meta;
    } catch (e) { failed++; }
    if ((i + 1) % 500 === 0) console.log(`  processed ${i + 1}/${files.length}`);
  });

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
