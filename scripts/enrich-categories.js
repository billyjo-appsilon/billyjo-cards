#!/usr/bin/env node
/**
 * cards-index.json 카테고리 보강 — 상품명 키워드로 분류 안 되는 상품에 한해
 * 빌리조 prod_view 의 cate_no(사이트 자체 카테고리 ID)를 스크랩해 카테고리를 채운다.
 *
 * 배경: cards-index 다수가 category=null(이름이 모델코드뿐). 추천 "동일 카테고리 ≥2"
 *       (룰북 #20) 보장을 전 상품으로 확대하려면 권위 있는 카테고리 소스가 필요.
 *       cate_no→카테고리명 매핑은 사이트 카테고리 메뉴(prod_list 링크)에서 추출.
 *
 * 사용: node scripts/enrich-categories.js [--limit N] [--concurrency 12]
 *       → cards-index.json 의 각 product에 category(canonical) + cateNo(raw) 기록
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const REPO_ROOT = path.resolve(__dirname, '..');
const INDEX_PATH = path.join(REPO_ROOT, 'cards-index.json');
const PROD_VIEW = 'https://www.billyjo.co.kr/html/dh_prod/prod_view/';
const SAMPLE_PAGE_ID = '16587'; // 카테고리 메뉴 추출용 아무 prod_view
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36';

const args = process.argv.slice(2);
const LIMIT = (() => { const i = args.indexOf('--limit'); return i >= 0 ? parseInt(args[i + 1], 10) : Infinity; })();
const CONCURRENCY = (() => { const i = args.indexOf('--concurrency'); return i >= 0 ? parseInt(args[i + 1], 10) : 12; })();

// canonical 카테고리 키워드 (admin2 backend CATEGORY_HINTS와 정렬 — 동일 라벨 보장)
const HINTS = {
  '정수기': ['냉온정수기', '얼음정수기', '직수정수기', '정수전용', '정수기', '정수'],
  '공기청정기': ['공기청정기', '공기청정', '청정기', '에어워셔'],
  '비데': ['비데'],
  '안마의자': ['안마의자', '샴푸대', '안마'],
  '매트리스': ['매트리스', '토퍼', '프레임&파운데이션', '모션베드', '침대'],
  '세탁기': ['워시타워', '드럼세탁', '통돌이', '세탁기'],
  '건조기': ['건조기'],
  '냉장고': ['김치냉장고', '와인냉장고', '와인셀러', '냉동고', '냉장고'],
  '식기세척기': ['식기세척기', '식세기'],
  '의류관리기': ['의류관리기', '스타일러', '에어드레서', '슈드레서'],
  '인덕션': ['인덕션', '전기레인지', '그리들'],
  '제습기': ['제습기'], '가습기': ['가습기'], '연수기': ['연수기', '이온수기'],
  'TV': ['올레드', 'QLED', 'OLED', 'UHDTV'],
  '에어컨': ['에어컨', '냉난방기'],
  '청소기': ['로봇청소기', '청소기'],
};
const GROUP_NAMES = new Set([
  '생활가전', '가구·침구', '정수기·환경', '건강·뷰티', '헬스케어', '업소용·창업', '상조+가전', '환경가전',
]);

function canonicalize(text) {
  const t = String(text || '');
  for (const [cat, kws] of Object.entries(HINTS)) {
    if (kws.some((k) => t.includes(k))) return cat;
  }
  return null;
}

function get(url) {
  return new Promise((res) => {
    const req = https.get(url, { headers: { 'User-Agent': UA } }, (r) => {
      let b = '';
      r.on('data', (c) => (b += c));
      r.on('end', () => res(b));
    });
    req.on('error', () => res(''));
    req.setTimeout(20000, () => { req.destroy(); res(''); });
  });
}

function extractCateNo(html) {
  const m = html.match(/name="cate_no"\s+value="([^"]*)"/);
  return m ? m[1] : null;
}

// 카테고리 메뉴(prod_list/{cate_no} → 이름)에서 cate_no → canonical 맵 구성
function buildCateMap(html) {
  const re = /prod_list\/(\d+-\d+)"[^>]*>([^<]+)/g;
  const names = {};
  let m;
  while ((m = re.exec(html))) {
    const c = m[1];
    const n = m[2].trim();
    if (!n) continue;
    (names[c] = names[c] || []).push(n);
  }
  const map = {};
  for (const [c, ns] of Object.entries(names)) {
    let cat = canonicalize(ns.join(' '));
    if (!cat) cat = ns.find((n) => !GROUP_NAMES.has(n)) || ns[0];
    map[c] = cat;
  }
  return map;
}

async function pool(items, n, fn) {
  let i = 0;
  let done = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) {
      const k = i++;
      await fn(items[k], k);
      done++;
      if (done % 200 === 0) console.log(`  ...${done}/${items.length}`);
    }
  }));
}

async function main() {
  const index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
  const products = index.products || {};

  console.log('[info] 카테고리 메뉴 추출...');
  const cateMap = buildCateMap(await get(PROD_VIEW + SAMPLE_PAGE_ID));
  console.log(`[info] cate_no→category 맵 ${Object.keys(cateMap).length}개`);
  if (Object.keys(cateMap).length < 50) {
    console.error('[err] 카테고리 메뉴 추출 실패 — 중단');
    process.exit(1);
  }

  // 1) 상품명 키워드로 먼저 분류 (스크랩 불필요)
  let byName = 0;
  const needScrape = [];
  for (const [pid, p] of Object.entries(products)) {
    const c = canonicalize(p.productName || '');
    if (c) { p.category = c; byName++; }
    else needScrape.push(pid);
  }
  console.log(`[info] 상품명 키워드 분류: ${byName}, cate_no 스크랩 필요: ${needScrape.length}`);

  // 2) 나머지는 cate_no 스크랩 → 맵 적용
  const targets = needScrape.slice(0, LIMIT);
  let scraped = 0; let assigned = 0; let stillNull = 0;
  await pool(targets, CONCURRENCY, async (pid) => {
    const html = await get(PROD_VIEW + pid);
    const cateNo = extractCateNo(html);
    if (cateNo) {
      scraped++;
      products[pid].cateNo = cateNo;
      const cat = cateMap[cateNo] || canonicalize(cateNo) || null;
      if (cat) { products[pid].category = cat; assigned++; }
      else stillNull++;
    } else {
      stillNull++;
    }
  });

  console.log(`[info] 스크랩 성공: ${scraped}/${targets.length}, 카테고리 부여: ${assigned}, 여전히 null: ${stillNull}`);

  // 분포 요약
  const dist = {};
  for (const p of Object.values(products)) dist[p.category || 'null'] = (dist[p.category || 'null'] || 0) + 1;
  const top = Object.entries(dist).sort((a, b) => b[1] - a[1]).slice(0, 20);
  console.log('[info] 카테고리 분포(top20):');
  top.forEach(([k, v]) => console.log(`    ${k}: ${v}`));

  index.generated_at = index.generated_at; // 유지 (build 시점)
  index.category_enriched_at_note = 'enriched by scripts/enrich-categories.js';
  fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 0), 'utf8');
  const kb = Math.round(fs.statSync(INDEX_PATH).size / 1024);
  console.log(`[done] cards-index.json 갱신 (${kb} KB)`);
}

main();
