#!/usr/bin/env node
/**
 * render-slot6.js — 결정론적 렌더러 (파이프라인의 재사용 핵심, API 불필요).
 *
 * 입력: scripts/enrich-pipeline/data/<prodNo>.json  (제조사 사양 추출 결과)
 * 동작: cards/<prodNo>.html 의 SLOT 6 step 1-3 (sum + spec-line + pills)을 JSON 내용으로 교체.
 *       선택적으로 지표명(SLOT 2 mgrid 라벨 + step-title)도 override.
 * 보존: spec-collapse 래퍼 · <!-- step-N-start/end --> 앵커 · 등급 배지 · 나머지 카드 전부.
 *
 * 사용:
 *   node scripts/enrich-pipeline/render-slot6.js 26801          # data/26801.json → cards/26801.html
 *   node scripts/enrich-pipeline/render-slot6.js --all          # data/ 전체
 *   node scripts/enrich-pipeline/render-slot6.js 26801 --dry    # 결과를 stdout 미리보기
 *
 * 보안: summary/line 값에는 <strong> 만 허용, 나머지 태그는 escape (주입 카드 무결성).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const CARDS_DIR = path.join(ROOT, 'cards');
const DATA_DIR = path.join(__dirname, 'data');

// <strong>만 허용하고 나머지는 escape — 신뢰 경계 (규칙 #3 카드 무결성)
function safe(s) {
  const STRONG_OPEN = '', STRONG_CLOSE = '';
  let t = String(s == null ? '' : s)
    .replace(/<strong>/g, STRONG_OPEN).replace(/<\/strong>/g, STRONG_CLOSE);
  t = t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  return t.split(STRONG_OPEN).join('<strong>').split(STRONG_CLOSE).join('</strong>');
}

function pillsHtml(pills) {
  if (!pills || !pills.items || !pills.items.length) return '';
  const items = pills.items.map(p =>
    '<span class="pill' + (p.on ? ' on' : '') + '">' + safe(p.v) + '</span>').join('');
  return '\n              <div class="field"><div class="field-l">' + safe(pills.label || '주요 특징') +
         '</div><div class="pills">' + items + '</div></div>';
}

function linesHtml(lines) {
  if (!lines || !lines.length) return '';
  const rows = lines.map(([k, v]) =>
    '\n                <div class="spec-line"><span class="sll">' + safe(k) +
    '</span><span class="slv">' + safe(v) + '</span></div>').join('');
  return '\n              <div class="field">' + rows + '\n              </div>';
}

// step 1개의 step-sum + <details> 내부를 새 내용으로 교체 (step-h/등급 배지는 보존)
function renderStepBody(step) {
  const sum = '<div class="step-sum">' + safe(step.summary) + '</div>';
  const details =
    '\n            <details class="step-details">\n' +
    '              <summary>자세히 보기</summary>' +
    linesHtml(step.lines) + pillsHtml(step.pills) +
    '\n            </details>';
  return sum + details;
}

function render(html, data) {
  let out = html;
  const report = { steps: 0, renamed: 0 };

  (data.steps || []).forEach(step => {
    const n = step.n;
    const startRe = new RegExp('<!-- step-' + n + '-start -->[\\s\\S]*?<!-- step-' + n + '-end -->');
    const m = out.match(startRe);
    if (!m) { console.warn('  ⚠ step-' + n + ' 앵커 없음 — skip'); return; }
    let block = m[0];
    // step-sum 부터 첫 </details> 까지 교체 (이 step에는 중첩 details 없음 — 규칙 #27)
    const bodyRe = /<div class="step-sum">[\s\S]*?<\/details>/;
    if (!bodyRe.test(block)) { console.warn('  ⚠ step-' + n + ' body 패턴 불일치 — skip'); return; }
    block = block.replace(bodyRe, renderStepBody(step));
    out = out.replace(startRe, block);
    report.steps++;
  });

  // 지표명 override (예: 공조 공기청정기 — '냉방·정화 성능' → '공기청정 성능')
  const ov = data.indicatorOverride || {};
  Object.keys(ov).forEach(n => {
    const from = ov[n].from, to = ov[n].to;
    if (!from || !to) return;
    // SLOT 2 mgrid 라벨
    const mlRe = new RegExp('(<span class="ml">)' + from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(</span>)');
    if (mlRe.test(out)) { out = out.replace(mlRe, '$1' + to + '$2'); report.renamed++; }
    // step-title
    const stRe = new RegExp('(<span class="step-title">)' + from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(</span>)');
    if (stRe.test(out)) out = out.replace(stRe, '$1' + to + '$2');
  });

  return { out, report };
}

function processOne(prodNo, dry) {
  const dataPath = path.join(DATA_DIR, prodNo + '.json');
  const cardPath = path.join(CARDS_DIR, prodNo + '.html');
  if (!fs.existsSync(dataPath)) { console.error('데이터 없음: ' + dataPath); return false; }
  if (!fs.existsSync(cardPath)) { console.error('카드 없음: ' + cardPath); return false; }
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const html = fs.readFileSync(cardPath, 'utf8');
  if (!/<details class="sec spec-collapse">/.test(html))
    console.warn('  ⚠ ' + prodNo + ': spec-collapse 래퍼 없음 (collapse-detailspec.js 먼저 실행 권장)');
  const { out, report } = render(html, data);
  if (dry) { process.stdout.write(out); return true; }
  fs.writeFileSync(cardPath, out);
  console.log('✓ ' + prodNo + '  steps=' + report.steps + ' renamed=' + report.renamed);
  return report.steps === (data.steps || []).length;
}

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const all = args.includes('--all');
const ids = all
  ? fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''))
  : args.filter(a => !a.startsWith('--'));
if (!ids.length) { console.error('사용: render-slot6.js <prodNo> [--dry] | --all'); process.exit(1); }
let ok = 0;
ids.forEach(id => { if (processOne(id, dry)) ok++; });
if (!dry) console.log('완료: ' + ok + '/' + ids.length);
