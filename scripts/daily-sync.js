#!/usr/bin/env node
/**
 * Daily Card Sync — 매일 새벽 2시 KST (17:00 UTC) GitHub Actions에서 실행.
 *
 * 흐름:
 *   1. 빌리조 카탈로그(homepage + 메인 카테고리 prod_list)에서 prod_view ID 수집
 *   2. cards/ 폴더에 없는 ID = 신규 제품
 *   3. 신규 제품 detail 페이지 스크랩 → name·specs·prices 추출
 *   4. cards/10914.html 템플릿 기반으로 cards/{prodNo}.html 생성
 *   5. 변경분 있으면 git commit + push (workflow가 자동 처리)
 *
 * 사용:
 *   - GitHub Actions: .github/workflows/daily-card-sync.yml에서 호출
 *   - 로컬 테스트: `node scripts/daily-sync.js` (cards/ 변경, git push 안 함)
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const CARDS_DIR = path.join(REPO_ROOT, 'cards');
const TEMPLATE_PATH = path.join(CARDS_DIR, '10914.html');

// 카테고리 prod_list URLs (메인 1depth, 2depth는 site map에서 동적 발견)
const CATEGORY_SEED = [
  'https://www.billyjo.co.kr/',
  'https://www.billyjo.co.kr/html/dh_prod/prod_list/1-8',
  'https://www.billyjo.co.kr/html/dh_prod/prod_list/1-6',
  'https://www.billyjo.co.kr/html/dh_prod/prod_list/1-7',
  'https://www.billyjo.co.kr/html/dh_prod/prod_list/1-9',
  'https://www.billyjo.co.kr/html/dh_prod/prod_list/1-87',
  'https://www.billyjo.co.kr/html/dh_prod/prod_list/1-203',
  'https://www.billyjo.co.kr/html/dh_prod/prod_list/1-374',
  'https://www.billyjo.co.kr/html/dh_prod/prod_list/1-532',
  'https://www.billyjo.co.kr/html/dh_prod/prod_list/1-1232',
  'https://www.billyjo.co.kr/html/dh_prod/prod_list/1-1296',
];

function log(msg) {
  console.log('[' + new Date().toISOString() + '] ' + msg);
}

async function collectAllIds(browser) {
  // homepage + main category URL에서 prod_view 링크 + 카테고리 링크 수집 후 2-depth crawl
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  const allIds = new Set();
  const categoryUrls = new Set(CATEGORY_SEED);

  // 1차: seed → 추가 카테고리 URL 발견
  for (const url of CATEGORY_SEED) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(800);
      const result = await page.evaluate(() => {
        const out = { ids: [], cats: [] };
        document.querySelectorAll('a').forEach(a => {
          const h = a.getAttribute('href') || '';
          const m = h.match(/prod_view\/(\d+)/);
          if (m) out.ids.push(m[1]);
          if (/prod_list\/\d+-\d+/.test(h)) out.cats.push(h.startsWith('http') ? h : 'https://www.billyjo.co.kr' + h);
        });
        return out;
      });
      result.ids.forEach(id => allIds.add(id));
      result.cats.forEach(c => categoryUrls.add(c));
    } catch (e) { log('seed err: ' + url); }
  }

  // 2차: 발견된 모든 카테고리 visit
  for (const url of categoryUrls) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(500);
      const ids = await page.evaluate(() => Array.from(new Set(
        Array.from(document.querySelectorAll('a')).map(a => {
          const m = (a.getAttribute('href') || '').match(/prod_view\/(\d+)/);
          return m ? m[1] : null;
        }).filter(Boolean)
      )));
      ids.forEach(id => allIds.add(id));
    } catch (e) {}
  }
  await ctx.close();
  log('catalog: ' + allIds.size + ' unique IDs found');
  return Array.from(allIds);
}

async function scrapeOne(page, pid) {
  try {
    await page.goto('https://www.billyjo.co.kr/html/dh_prod/prod_view/' + pid, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1200);
    return await page.evaluate(() => {
      const name = (document.querySelector('.prod_name > b') || {}).textContent || '';
      const model = (document.querySelector('.prod_name .model_name small') || {}).textContent || '';
      const specs = {};
      Array.from(document.querySelectorAll('.prod_table_wrap tr')).forEach(tr => {
        const th = tr.querySelector('th'), td = tr.querySelector('td');
        if (th && td) specs[th.textContent.trim()] = td.textContent.trim();
      });
      const prices = Array.from(document.querySelectorAll('a[id*="_price_of_"][data-month][data-price]')).map(el => ({
        month: el.dataset.month, price: el.dataset.price,
        dcprice: el.dataset.dcprice, card_dis: el.dataset.card_dis,
        supname: el.dataset.supname,
      }));
      const topMin = (document.querySelector('.top_min_price') || {}).innerText || '';
      const cardMinus = (document.querySelector('.top_min_price_minus_card') || {}).innerText || '';
      return { name, model, specs, prices, topMin, cardMinus };
    });
  } catch (e) {
    return { error: e.message.slice(0, 100) };
  }
}

async function scrapeNew(browser, missingIds) {
  if (missingIds.length === 0) return {};
  const results = {};
  const CONCURRENCY = 4;
  let idx = 0;
  async function worker() {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await ctx.newPage();
    while (idx < missingIds.length) {
      const i = idx++;
      const pid = missingIds[i];
      const d = await scrapeOne(page, pid);
      results[pid] = d;
      if ((i + 1) % 25 === 0) log('scraped ' + (i + 1) + '/' + missingIds.length);
    }
    await ctx.close();
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  return results;
}

// === Generator (generate-cards.js 로직 인라인) ===
const FAMILIES = {
  F01: ['정수성능','위생관리','편의기능'], F02: ['세정성능','위생관리','편의기능'],
  F03: ['냉방·정화 성능','위생관리','AI·편의'], F04: ['청소성능','배터리·내구','편의기능'],
  F05: ['보관성능','냉각·에너지','편의기능'], F06: ['세탁·건조성능','위생관리','편의기능'],
  F07: ['세척·조리성능','위생관리','편의기능'], F08: ['화질·음향','연결성','편의기능'],
  F09: ['마사지·운동성능','안전·내구','편의·디자인'], F10: ['케어성능','위생관리','편의기능'],
  F11: ['편안함·내구','소재·위생','디자인·기능'], F12: ['주행성능','배터리·안전','편의기능'],
  F13: ['보안성능','연결·내구','편의기능'], F14: ['업무성능','내구·보안','관리·편의'],
};
function detectFamily(name) {
  const n = name || '';
  if (/정수기|연수기|샤워기/.test(n)) return 'F01';
  if (/비데/.test(n)) return 'F02';
  if (/공기청정|에어컨|냉난방|제습기|환기|보일러|공청기/.test(n)) return 'F03';
  if (/청소기|로봇청소/.test(n)) return 'F04';
  if (/냉장|김치|냉동|와인셀러|얼음/.test(n)) return 'F05';
  if (/세탁|건조|스타일러/.test(n)) return 'F06';
  if (/식기세척|커피머신|인덕션|에어프라이|레인지|밥솥/.test(n)) return 'F07';
  if (/TV|노트북|모니터|빔프로젝터/.test(n)) return 'F08';
  if (/안마|런닝|헬스기|운동/.test(n)) return 'F09';
  if (/드라이기|이미용|의류청정|의류케어/.test(n)) return 'F10';
  if (/소파|침대|매트리스|모션베드|가구/.test(n)) return 'F11';
  if (/자전거|스쿠터|자동차|캐스퍼/.test(n)) return 'F12';
  if (/CCTV|도어락|AI로봇/.test(n)) return 'F13';
  if (/POS|키오스크|자판기|서빙로봇/.test(n)) return 'F14';
  return 'F01';
}
function letterOf(s) {
  if (s == null) return null;
  if (s >= 90) return 'S'; if (s >= 85) return 'A+'; if (s >= 80) return 'A';
  if (s >= 70) return 'B+'; if (s >= 60) return 'B'; if (s >= 50) return 'C+';
  if (s >= 40) return 'C'; return null;
}
function classOf(letter) {
  return ({ S:'g-S','A+':'g-Aplus',A:'g-A','B+':'g-Bplus',B:'g-B','C+':'g-Cplus',C:'g-C' })[letter] || 'g-d';
}
function colorVarOf(letter) {
  return ({ S:'--g-1','A+':'--g-1-5',A:'--g-2','B+':'--g-2-5',B:'--g-3','C+':'--g-3-5',C:'--g-4' })[letter] || '--g-d';
}
function labelOf(letter) {
  return ({ S:'최고','A+':'적극추천',A:'추천','B+':'우수',B:'좋음','C+':'적합',C:'보통' })[letter] || '평가 없음';
}
function scorePriceFromTopMin(topMinStr) {
  const m = (topMinStr || '').match(/(\d+(?:,\d+)*)/);
  if (!m) return 75;
  const n = parseInt(m[1].replace(/,/g, ''), 10);
  if (n < 20000) return 92;
  if (n < 30000) return 85;
  if (n < 50000) return 78;
  if (n < 80000) return 68;
  return 58;
}
function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderCard(pid, d, template) {
  const family = detectFamily(d.name);
  const titles = FAMILIES[family];

  const priceScore = scorePriceFromTopMin(d.topMin);
  const perfScore = 80, hygieneScore = 70, convScore = 72;
  const overallNum = ((priceScore + perfScore + hygieneScore + convScore) / 4).toFixed(1);
  const overallLetter = letterOf(parseFloat(overallNum));
  const priceLetter = letterOf(priceScore);
  const perfLetter = letterOf(perfScore);
  const hygieneLetter = letterOf(hygieneScore);
  const convLetter = letterOf(convScore);
  const dasharray = Math.round(parseFloat(overallNum) * 1.65);

  // 8칸 specs
  const specRows = [{ label: '렌탈료', value: d.topMin || '—' }];
  Object.keys(d.specs).slice(0, 7).forEach(k => specRows.push({ label: k, value: d.specs[k] }));
  while (specRows.length < 6) specRows.push({ label: '', value: '' });
  const specsHtml = specRows.slice(0, 8).filter(s => s.label).map(s =>
    '<div class="sc"><div class="sl">' + escapeHtml(s.label) + '</div><div class="sv">' + escapeHtml(s.value) + '</div></div>'
  ).join('\n            ');

  // Generic personas (family-aware)
  const personasHtml =
    '<div class="p">' +
      '<div class="p-top"><i class="ti ti-home"></i><span class="rec-p-level-1">매우 추천</span></div>' +
      '<div class="rec-p-title">합리적 가격 선호 1인·신혼</div>' +
      '<div class="p-d">' + escapeHtml(d.topMin || '월 합리적 가격') + ' 부담 없는 진입, 핵심 기능 충분</div>' +
      '<div class="feat-btns"><span class="feat-btn">가성비</span><span class="feat-btn">컴팩트</span><span class="feat-btn">기본 기능</span></div>' +
    '</div>' +
    '<div class="p">' +
      '<div class="p-top"><i class="ti ti-users"></i><span class="rec-p-level-1">매우 추천</span></div>' +
      '<div class="rec-p-title">3-4인 가족 표준 사용</div>' +
      '<div class="p-d">' + escapeHtml(family === 'F05' ? '용량 충분' : family === 'F06' ? '대용량 세탁' : '가족 단위 일상 사용') + '에 적합</div>' +
      '<div class="feat-btns"><span class="feat-btn">표준 용량</span><span class="feat-btn">검증된 브랜드</span><span class="feat-btn">A/S 안심</span></div>' +
    '</div>' +
    '<div class="p">' +
      '<div class="p-top"><i class="ti ti-shield-check"></i><span class="rec-p-level-2">추천</span></div>' +
      '<div class="rec-p-title">신뢰성 우선 사용자</div>' +
      '<div class="p-d">대기업 브랜드 + 검증된 모델 선호 — A/S·내구성 우선</div>' +
      '<div class="feat-btns"><span class="feat-btn">브랜드</span><span class="feat-btn">A/S</span><span class="feat-btn">내구성</span></div>' +
    '</div>';

  function stepBlock(n, title, letter) {
    return '<div class="step-h"><span class="step-n">' + n + '</span><span class="step-title">' + title + '</span><span class="grade-badge ' + classOf(letter) + '" style="margin-left:auto">' + labelOf(letter) + '<small>' + letter + '</small></span></div>' +
           '<div class="step-sum">표준 ' + title + ' — 카테고리 기본 기능 만족 (상세는 본문 참조)</div>' +
           '<details class="step-details"><summary>자세히 보기</summary><div class="field"><div class="field-l">기본 특징</div><div class="pills"><span class="pill on">기본 기능</span></div></div></details>';
  }

  const chips =
    '<span class="strength-chip"><i class="ti ti-currency-won"></i>' + escapeHtml(d.topMin || '가성비') + '</span>' +
    (d.specs['관리방식'] || d.specs['관리'] ? '<span class="strength-chip"><i class="ti ti-tool"></i>' + escapeHtml(d.specs['관리방식'] || d.specs['관리']) + '</span>' : '') +
    (d.specs['용량'] ? '<span class="strength-chip"><i class="ti ti-box"></i>' + escapeHtml(d.specs['용량']) + '</span>' : '') +
    (d.specs['규격'] ? '<span class="strength-chip"><i class="ti ti-ruler-measure"></i>' + escapeHtml((d.specs['규격'] || '').slice(0, 25)) + '</span>' : '') +
    '<span class="strength-chip"><i class="ti ti-shield-check"></i>' + (d.specs['브랜드'] || '검증 브랜드') + '</span>';

  const metaParts = [];
  if (d.specs['타입'] || d.specs['형태']) metaParts.push(d.specs['타입'] || d.specs['형태']);
  if (d.specs['용량']) metaParts.push(d.specs['용량']);
  if (d.specs['규격']) metaParts.push(d.specs['규격'].slice(0, 25));
  const meta = '모델명: <span class="model-num">' + escapeHtml((d.model || '').split('_')[0] || d.model) + '</span> · ' + metaParts.join(' · ');

  let html = template;
  html = html.replace(/<!-- AI 카드 v0\.4\.[\d]+ \([\s\S]*?-->/,
    '<!-- AI 카드 v0.4.5 (' + pid + ' / ' + ((d.model || d.name).slice(0, 30)) + ') — daily-sync auto (' + family + ') -->\n<!-- 라이브: https://www.billyjo.co.kr/html/dh_prod/prod_view/' + pid + ' -->');
  html = html.replace(/<div class="name">[\s\S]*?<\/div>\s*<div class="meta">[\s\S]*?<\/div>/,
    '<div class="name">' + escapeHtml(d.name) + '</div>\n              <div class="meta">' + meta + '</div>');
  html = html.replace(/stroke="var\(--g-[\d-]+\)" stroke-width="6" stroke-linecap="round" stroke-dasharray="\d+ 165"/,
    'stroke="var(' + colorVarOf(overallLetter) + ')" stroke-width="6" stroke-linecap="round" stroke-dasharray="' + dasharray + ' 165"');
  html = html.replace(/fill="var\(--g-[\d-]+\)" style="font-family:'Pretendard',sans-serif;font-weight:700">[\w+]+/,
    'fill="var(' + colorVarOf(overallLetter) + ')" style="font-family:\'Pretendard\',sans-serif;font-weight:700">' + overallLetter);
  html = html.replace(/<div class="mgrid">[\s\S]*?<\/div>\s*<\/div>\s*\n\s*<!-- SLOT 3/,
    '<div class="mgrid">' +
      '<div class="m"><span class="ml">렌탈료</span><span class="grade-badge ' + classOf(priceLetter) + '">' + labelOf(priceLetter) + '<small>' + priceLetter + '</small></span></div>' +
      '<div class="m"><span class="ml">' + titles[0] + '</span><span class="grade-badge ' + classOf(perfLetter) + '">' + labelOf(perfLetter) + '<small>' + perfLetter + '</small></span></div>' +
      '<div class="m"><span class="ml">' + titles[1] + '</span><span class="grade-badge ' + classOf(hygieneLetter) + '">' + labelOf(hygieneLetter) + '<small>' + hygieneLetter + '</small></span></div>' +
      '<div class="m"><span class="ml">' + titles[2] + '</span><span class="grade-badge ' + classOf(convLetter) + '">' + labelOf(convLetter) + '<small>' + convLetter + '</small></span></div>' +
    '</div>\n          </div>\n\n          <!-- SLOT 3');
  html = html.replace(/<div class="specs">[\s\S]*?<\/div>\s*\n\s*<!-- SLOT 4/,
    '<div class="specs">\n            ' + specsHtml + '\n          </div>\n\n          <!-- SLOT 4');
  html = html.replace(/<div class="strengths">[\s\S]*?<\/div>/,
    '<div class="strengths">' + chips + '</div>');
  html = html.replace(/<div class="persona">[\s\S]*?<\/div>\s*\n\s*<\/div>\s*\n\s*<!-- SLOT 6/,
    '<div class="persona">\n              ' + personasHtml + '\n            </div>\n          </div>\n\n          <!-- SLOT 6');
  [1, 2, 3].forEach((n, i) => {
    const block = stepBlock(n, titles[i], i === 0 ? perfLetter : i === 1 ? hygieneLetter : convLetter);
    html = html.replace(new RegExp('<div class="step-h"><span class="step-n">' + n + '[\\s\\S]*?</details>'), block);
  });

  return html;
}

(async () => {
  log('=== Daily Card Sync Start ===');
  log('CARDS_DIR: ' + CARDS_DIR);

  const browser = await chromium.launch({ headless: true });
  try {
    const allIds = await collectAllIds(browser);
    const existing = new Set(fs.readdirSync(CARDS_DIR).filter(f => f.endsWith('.html')).map(f => f.replace('.html', '')));
    const missing = allIds.filter(id => !existing.has(id));
    log('existing: ' + existing.size + ' / new: ' + missing.length);

    if (missing.length === 0) {
      log('No new products — nothing to do.');
      return;
    }

    log('Scraping ' + missing.length + ' new products...');
    const scraped = await scrapeNew(browser, missing);

    log('Loading template...');
    const template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');

    // 안전 가드: 기존 cards/{pid}.html이 hero refined 마커("hero refined")를 포함하면
    // 절대 overwrite 안 함 (missing pid만 처리하므로 사실 발생 안 함 — 이중 안전망)
    let saved = 0, skipped = 0, protectedFiles = 0;
    for (const pid of Object.keys(scraped)) {
      const d = scraped[pid];
      if (d.error || !d.name) { skipped++; log('skip ' + pid + ': ' + (d.error || 'no name')); continue; }
      const outPath = path.join(CARDS_DIR, pid + '.html');
      if (fs.existsSync(outPath)) {
        const head = fs.readFileSync(outPath, 'utf-8').slice(0, 500);
        if (/hero refined/.test(head)) {
          protectedFiles++;
          log('protect refined: ' + pid);
          continue;
        }
      }
      const html = renderCard(pid, d, template);
      fs.writeFileSync(outPath, html);
      saved++;
    }
    log('protected: ' + protectedFiles);
    log('Saved: ' + saved + ' / Skipped: ' + skipped);
    log('=== Done ===');
  } finally {
    await browser.close();
  }
})().catch(e => { log('FATAL: ' + e.message); process.exit(1); });
