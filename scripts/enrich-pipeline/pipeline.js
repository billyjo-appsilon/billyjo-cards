#!/usr/bin/env node
/**
 * pipeline.js — 오케스트레이터: 보강 후보 나열 + 배치 구동.
 *
 *   node scripts/enrich-pipeline/pipeline.js --list [N]     # "표준 사양" fallback 남은 카드 N개 나열 (기본 30)
 *   node scripts/enrich-pipeline/pipeline.js --run 1 2 3    # 주어진 prodNo 들에 extract→render (ANTHROPIC_API_KEY 필요)
 *   node scripts/enrich-pipeline/pipeline.js --status       # data/ 보유 vs 카드 보강 현황 요약
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const CARDS_DIR = path.join(ROOT, 'cards');
const DATA_DIR = path.join(__dirname, 'data');
const args = process.argv.slice(2);

function dataPoorCards(limit) {
  const out = [];
  for (const f of fs.readdirSync(CARDS_DIR)) {
    if (!f.endsWith('.html')) continue;
    const h = fs.readFileSync(path.join(CARDS_DIR, f), 'utf8');
    if (/step-sum">[^<]*표준 사양\./.test(h)) out.push(f.replace('.html', ''));
    if (out.length >= limit) break;
  }
  return out;
}

if (args.includes('--list')) {
  const n = parseInt(args[args.indexOf('--list') + 1], 10) || 30;
  const ids = dataPoorCards(n);
  console.log('보강 후보 (제너릭 fallback "표준 사양" 남은 카드, 상위 ' + n + '):');
  console.log(ids.join(' '));
  console.log('\n다음: ANTHROPIC_API_KEY 설정 후  node scripts/enrich-pipeline/pipeline.js --run ' + ids.slice(0, 5).join(' '));
} else if (args.includes('--run')) {
  const ids = args.slice(args.indexOf('--run') + 1).filter(a => !a.startsWith('--'));
  if (!ids.length) { console.error('--run 뒤에 prodNo 나열'); process.exit(1); }
  let ok = 0;
  for (const id of ids) {
    try {
      execFileSync('node', [path.join(__dirname, 'extract.js'), id, '--render'], { stdio: 'inherit' });
      ok++;
    } catch (e) { console.error('✗ ' + id + ' 실패 — 건너뜀'); }
  }
  console.log('배치 완료: ' + ok + '/' + ids.length);
} else if (args.includes('--status')) {
  const have = fs.existsSync(DATA_DIR) ? fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json')).length : 0;
  const poor = dataPoorCards(1e9).length;
  console.log('data/ 추출 보유: ' + have + ' 제품');
  console.log('아직 fallback("표준 사양") 카드: ' + poor + ' 개');
} else {
  console.log('사용: pipeline.js --list [N] | --run <prodNo...> | --status');
}
