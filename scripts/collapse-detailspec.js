#!/usr/bin/env node
/**
 * collapse-detailspec.js — 기존 cards/ 일괄 업그레이드 (일회성).
 *
 * 목적 (사용자 요구):
 *   1. SLOT 6 "상세 스펙" 섹션을 기본 접힘(<details class="spec-collapse">)으로 — 공간 절약
 *   2. 모든 step에 동일하게 나오던 generic filler step-sum
 *      ("표준 {title} — 카테고리 기본 기능 만족 ...")를 제품 고유 요약으로 교체
 *      (해당 step의 실제 활성 pill 값에서 추출)
 *
 * 안전장치:
 *   - 이미 spec-collapse 적용된 카드는 wrapping skip (idempotent)
 *   - step-sum은 generic filler 패턴일 때만 교체 → 수기로 다듬은 카드(10914 등) 보존
 *   - <!-- step-N-start/end --> 앵커 보존 (규칙 #27)
 *
 * 사용: node scripts/collapse-detailspec.js [--dry] [파일...]
 */
const fs = require('fs');
const path = require('path');

const CARDS_DIR = path.join(path.resolve(__dirname, '..'), 'cards');
const DRY = process.argv.includes('--dry');
const fileArgs = process.argv.slice(2).filter(a => !a.startsWith('--'));

const CSS_ANCHOR = "#ai-card-root .field-l{font-size:11.5px;color:var(--color-text-secondary);margin-bottom:6px}";
const CSS_BLOCK = `
        /* SLOT 6 상세 스펙 — 섹션 전체 접기 (기본 collapsed, 공간 절약) */
        #ai-card-root details.spec-collapse{padding-top:14px;margin-top:14px;border-top:0.5px solid var(--color-border-tertiary)}
        #ai-card-root details.spec-collapse > summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:8px}
        #ai-card-root details.spec-collapse > summary::-webkit-details-marker{display:none}
        #ai-card-root details.spec-collapse > summary .sec-t{margin-bottom:0}
        #ai-card-root .spec-collapse-hint{margin-left:auto;font-size:11px;font-weight:700;color:var(--color-text-info);background:var(--color-background-info);padding:3px 10px;border-radius:999px;display:inline-flex;align-items:center;gap:4px;flex-shrink:0}
        #ai-card-root .spec-collapse-hint::after{content:"▾";font-size:10px;transition:transform 0.15s}
        #ai-card-root details.spec-collapse[open] > summary .spec-collapse-hint::after{transform:rotate(180deg)}
        #ai-card-root .spec-collapse-hint .hint-close{display:none}
        #ai-card-root details.spec-collapse[open] > summary .hint-open{display:none}
        #ai-card-root details.spec-collapse[open] > summary .hint-close{display:inline}
        #ai-card-root .spec-collapse-body{margin-top:8px}
        #ai-card-root .spec-line{display:flex;justify-content:space-between;gap:10px;font-size:11.5px;padding:5px 0;border-bottom:0.5px dashed var(--color-border-tertiary);min-width:0}
        #ai-card-root .spec-line:last-child{border-bottom:0}
        #ai-card-root .spec-line .sll{color:var(--color-text-secondary);flex-shrink:0}
        #ai-card-root .spec-line .slv{color:var(--color-text-primary);font-weight:700;text-align:right;word-break:keep-all;min-width:0;line-height:1.45}
        #ai-card-root .spec-line .slv strong{color:var(--color-text-info);font-weight:700}`;

const SUMMARY_OPEN =
  '<details class="sec spec-collapse">\n' +
  '            <summary><span class="sec-t">상세 스펙</span><span class="spec-collapse-hint"><span class="hint-open">펼쳐보기</span><span class="hint-close">접기</span></span></summary>\n' +
  '            <div class="spec-collapse-body">';

// generic filler 판별 — 이 패턴일 때만 step-sum 교체 (수기 카드 보존)
// 3가지 filler 변형: "표준 X — 카테고리 기본 기능 만족", "X — 표준 수준 (...)", 빈 문자열
const GENERIC_SUM_RE = /카테고리 기본 기능 만족|—\s*표준 수준|^\s*$/;

function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// step 블록에서 활성 pill(제목과 동일한 placeholder pill 제외) → 제품 고유 요약
function buildSum(block, title){
  const onPills = [];
  const re = /<span class="pill on">([^<]+)<\/span>/g;
  let m;
  while ((m = re.exec(block))) {
    const v = m[1].trim();
    if (v && v !== title) onPills.push(v);
  }
  const uniq = onPills.filter((v,i)=>onPills.indexOf(v)===i);
  if (uniq.length) {
    return uniq.slice(0,3).map(v=>'<strong>'+esc(v)+'</strong>').join(' · ') + ' 적용.';
  }
  // 활성 데이터 없음 — 동일 filler보다 간결한 중립 라인 (collapse로 가려짐)
  return esc(title) + ' 표준 사양.';
}

function migrate(html){
  const report = { wrapped:false, cssInjected:false, sumsUpdated:0 };
  let out = html;

  // 1) CSS 주입 (없을 때만)
  if (out.indexOf('details.spec-collapse') === -1) {
    if (out.indexOf(CSS_ANCHOR) !== -1) {
      out = out.replace(CSS_ANCHOR, CSS_ANCHOR + CSS_BLOCK);
      report.cssInjected = true;
    } else if (out.indexOf('</style>') !== -1) {
      out = out.replace('</style>', CSS_BLOCK + '\n      </style>');
      report.cssInjected = true;
    }
  }

  // 2) step-sum 교체 (generic filler 한정) — wrapping 전에 수행
  out = out.replace(
    /(<!-- step-([123])-start -->[\s\S]*?<!-- step-\2-end -->)/g,
    (block) => {
      const tm = block.match(/<span class="step-title">([^<]+)<\/span>/);
      const title = tm ? tm[1].trim() : '';
      return block.replace(
        /(<div class="step-sum"[^>]*>)([\s\S]*?)(<\/div>)/,
        (full, open, inner, close) => {
          if (!GENERIC_SUM_RE.test(inner)) return full; // 수기 요약 보존
          report.sumsUpdated++;
          return open + buildSum(block, title) + close;
        }
      );
    }
  );

  // 3) 섹션 collapse wrapping (없을 때만)
  if (out.indexOf('spec-collapse') === -1 || !/<details class="sec spec-collapse">/.test(out)) {
    const before = out;
    out = out.replace(/<div class="sec">\s*<div class="sec-t">상세 스펙<\/div>/, SUMMARY_OPEN);
    if (out !== before) {
      // 닫는 태그: step-3-end 다음의 sec 닫기 </div> → body 닫기 + </details>
      out = out.replace(/(<!-- step-3-end -->\s*)<\/div>/, '$1</div>\n          </details>');
      report.wrapped = true;
    }
  }
  return { out, report };
}

const files = (fileArgs.length ? fileArgs : fs.readdirSync(CARDS_DIR).filter(f=>f.endsWith('.html')).map(f=>path.join(CARDS_DIR,f)));
let stats = { total:0, wrapped:0, css:0, sums:0, alreadyDone:0, noSection:0, wrapFail:0 };
const failSamples = [];

for (const fp of files) {
  stats.total++;
  const html = fs.readFileSync(fp, 'utf-8');
  if (/<details class="sec spec-collapse">/.test(html)) { stats.alreadyDone++; continue; }
  if (html.indexOf('상세 스펙') === -1) { stats.noSection++; continue; }
  const { out, report } = migrate(html);
  if (report.wrapped) stats.wrapped++;
  else { stats.wrapFail++; if (failSamples.length < 8) failSamples.push(path.basename(fp)); }
  if (report.cssInjected) stats.css++;
  stats.sums += report.sumsUpdated;
  if (!DRY && out !== html) fs.writeFileSync(fp, out);
}

console.log(JSON.stringify(stats, null, 2));
if (failSamples.length) console.log('wrap-fail samples:', failSamples.join(', '));
console.log(DRY ? '(dry run — no writes)' : 'written.');
