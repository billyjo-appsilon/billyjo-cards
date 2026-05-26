#!/usr/bin/env node
/**
 * fix-cards.js — 기존 cards/*.html의 SLOT 6 누출 구조 일괄 fix + SLOT 8 mount placeholder 추가.
 *
 * 진단된 문제 (cards/10042.html 등 ~3000개):
 *   - Step 1 <details>가 inner pill 1개 만에 닫힘
 *   - 그 뒤 orphan </div>·</div>·<div class="field">·</details> 가 떠 있어
 *     SLOT 6 .sec 컨테이너를 조기 종료 → Step 2·3이 카드 바깥으로 흘러나옴
 *
 * 처리:
 *   1. SLOT 6 영역(상세 스펙 .sec)을 통째로 깨끗한 구조로 재작성
 *      - <!-- step-N-start --> ~ <!-- step-N-end --> 앵커 주석 보존 (v0.5.0 daily-sync 규약)
 *   2. 기존 Step 1·2·3의 title + grade만 추출하여 새 구조에 주입 (data 보존)
 *   3. SLOT 7 직후에 SLOT 8 (#ai-card-lpt-section, hidden) 추가 (없는 경우만)
 *   4. v0.4.x → v0.5.1 헤더 댓글 갱신
 *
 * 사용:
 *   node scripts/fix-cards.js          → cards/*.html 전부 처리
 *   node scripts/fix-cards.js 10042    → 특정 PID만
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const CARDS_DIR = path.join(REPO_ROOT, 'cards');

const argPids = process.argv.slice(2).filter(a => /^\d+$/.test(a));
const files = argPids.length
  ? argPids.map(p => path.join(CARDS_DIR, p + '.html')).filter(f => fs.existsSync(f))
  : fs.readdirSync(CARDS_DIR).filter(f => f.endsWith('.html')).map(f => path.join(CARDS_DIR, f));

function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

/* SLOT 6 .sec 블록 전체를 매칭. <!-- SLOT 6 --> 부터 <!-- SLOT 7 --> 직전까지. */
const SLOT6_RE = /(<!-- SLOT 6:[^>]*-->\s*<div class="sec">[\s\S]*?<\/div>)\s*\n\s*(<!-- SLOT 7)/;

/* 각 Step의 step-h 헤더에서 title + grade-badge HTML 추출. */
function extractStepMeta(slot6Html, stepN) {
  const re = new RegExp(
    '<div class="step-h"><span class="step-n">' + stepN + '<\\/span>' +
    '<span class="step-title">([^<]+)<\\/span>' +
    '(<span class="grade-badge [^"]+" style="margin-left:auto">[^<]+<small>[^<]+<\\/small><\\/span>|<span class="g-d"[^>]*>평가 없음<\\/span>)'
  );
  const m = slot6Html.match(re);
  if (m) return { title: m[1], gradeHtml: m[2] };
  return null;
}

function extractStepSum(slot6Html, stepN) {
  /* step-N 헤더 다음의 <div class="step-sum"> 내용 추출 */
  const re = new RegExp(
    '<div class="step-h"><span class="step-n">' + stepN + '[^<]*<\\/span>[\\s\\S]*?<\\/div>\\s*' +
    '<div class="step-sum">([\\s\\S]*?)<\\/div>'
  );
  const m = slot6Html.match(re);
  return m ? m[1].trim() : null;
}

function buildCleanSlot6(steps) {
  const out = ['          <!-- SLOT 6: Step 1-3 (자세히 보기 접기) -->',
               '          <div class="sec">',
               '            <div class="sec-t">상세 스펙</div>',
               ''];
  steps.forEach((s, i) => {
    const n = i + 1;
    out.push('            <!-- step-' + n + '-start -->');
    out.push('            <div class="step-h"><span class="step-n">' + n + '</span><span class="step-title">' + escapeHtml(s.title) + '</span>' + s.gradeHtml + '</div>');
    out.push('            <div class="step-sum">' + (s.sum || '표준 ' + escapeHtml(s.title) + ' — 카테고리 기본 기능 만족') + '</div>');
    out.push('            <details class="step-details">');
    out.push('              <summary>자세히 보기</summary>');
    out.push('              <div class="field"><div class="field-l">주요 특징</div><div class="pills"><span class="pill on">' + escapeHtml(s.title) + '</span></div></div>');
    out.push('            </details>');
    out.push('            <!-- step-' + n + '-end -->');
    if (i < steps.length - 1) out.push('');
  });
  out.push('          </div>');
  return out.join('\n');
}

const SLOT8_BLOCK = [
  '',
  '          <!-- SLOT 8: 약정·카드 할인가 (inject.js v0.5.1+: 항상 #livePriceTable 데이터 mount, 본문 LPT 숨김) -->',
  '          <div class="sec bj-lpt-section" id="ai-card-lpt-section" hidden>',
  '            <div class="sec-t">약정·카드 할인가</div>',
  '            <div class="bj-lpt-mount" id="ai-card-lpt-mount"></div>',
  '            <div class="bj-lpt-note" style="margin-top:8px;font-size:11.5px;color:#888">제휴카드(롯데·삼성 등) 청구할인 적용 시 약정별 최종 렌탈료. 카드 할인 없는 약정은 월 렌탈료와 동일하게 표시.</div>',
  '          </div>',
].join('\n');

const stats = { processed: 0, fixed: 0, skipped: 0, errors: 0 };

for (const file of files) {
  try {
    let html = fs.readFileSync(file, 'utf-8');
    const pid = path.basename(file, '.html');
    stats.processed++;

    /* 이미 anchor-comment 구조면 skip */
    if (/<!-- step-1-end -->/.test(html) && /id="ai-card-lpt-section"/.test(html)) {
      stats.skipped++;
      continue;
    }

    /* SLOT 6 추출 + 재작성 */
    const slot6Match = html.match(SLOT6_RE);
    if (!slot6Match) {
      stats.errors++;
      console.error('No SLOT 6 match: ' + pid);
      continue;
    }
    const oldSlot6 = slot6Match[1];
    const slot7Marker = slot6Match[2];

    const steps = [];
    for (let n = 1; n <= 3; n++) {
      const meta = extractStepMeta(oldSlot6, n);
      if (!meta) {
        stats.errors++;
        console.error('Step ' + n + ' meta missing: ' + pid);
        steps.push({ title: 'Step ' + n, gradeHtml: '<span class="g-d" style="margin-left:auto">평가 없음</span>' });
        continue;
      }
      const sum = extractStepSum(oldSlot6, n);
      steps.push({ title: meta.title, gradeHtml: meta.gradeHtml, sum: sum });
    }

    const newSlot6 = buildCleanSlot6(steps);
    html = html.replace(SLOT6_RE, newSlot6 + '\n\n          ' + slot7Marker);

    /* SLOT 8 추가 — 폐기 코멘트 자리에 또는 SLOT 7 다음 위치 */
    if (!/id="ai-card-lpt-section"/.test(html)) {
      /* SLOT 8 폐기 주석 블록 교체 */
      const dropped = /<!-- SLOT 8 폐기:[\s\S]*?-->/;
      if (dropped.test(html)) {
        html = html.replace(dropped, SLOT8_BLOCK.trim());
      } else {
        /* SLOT 7 .sec 직후 삽입 */
        html = html.replace(
          /(<!-- SLOT 7:[^>]*-->[\s\S]*?<\/div>\s*<\/div>)/,
          '$1' + SLOT8_BLOCK
        );
      }
    }

    /* 헤더 버전 갱신 */
    html = html.replace(/<!-- AI 카드 v0\.4\.[\d]+[^>]*-->/,
      '<!-- AI 카드 v0.5.1 (' + pid + ') — fix-cards.js (SLOT 6 누출 픽스 + SLOT 8 LPT mount) -->');

    fs.writeFileSync(file, html, 'utf-8');
    stats.fixed++;
    if (stats.fixed % 250 === 0) console.log('  fixed: ' + stats.fixed);
  } catch (e) {
    stats.errors++;
    console.error('error ' + file + ': ' + e.message);
  }
}

console.log('=== fix-cards.js summary ===');
console.log('processed: ' + stats.processed);
console.log('fixed:     ' + stats.fixed);
console.log('skipped:   ' + stats.skipped + ' (already clean)');
console.log('errors:    ' + stats.errors);
