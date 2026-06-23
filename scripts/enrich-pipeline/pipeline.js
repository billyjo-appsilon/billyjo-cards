#!/usr/bin/env node
/**
 * pipeline.js — 오케스트레이터: 후보 나열·우선순위·배치 구동.
 *
 *   node pipeline.js --status                       # data/ 보유 vs fallback 현황
 *   node pipeline.js --list [N]                     # fallback 카드 N개 나열 (기본 30)
 *   node pipeline.js --rank [N]                     # 보강 가치 높은 순(브랜드·모델·이름 풍부도) 상위 N (기본 30)
 *   node pipeline.js --run 7 581 ...                # 배치 extract→render (ANTHROPIC_API_KEY 필요)
 *
 * 비용 레버 (--run 에 함께):
 *   --model claude-sonnet-4-6|claude-opus-4-8|claude-haiku-4-5   (기본 sonnet, 저렴)
 *   --searches 3        web_search 최대 횟수 (기본 4)
 *   --min-lines 2       실제 스펙행 < N 인 얇은 결과는 렌더 skip(카드 fallback 유지)
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const CARDS_DIR = path.join(ROOT, 'cards');
const DATA_DIR = path.join(__dirname, 'data');
const INDEX_PATH = path.join(ROOT, 'cards-index.json');
const args = process.argv.slice(2);

const FALLBACK_RE = /step-sum">[^<]*표준 사양\./;
function isFallback(id) {
  try { return FALLBACK_RE.test(fs.readFileSync(path.join(CARDS_DIR, id + '.html'), 'utf8')); }
  catch (e) { return false; }
}
function allCardIds() {
  return fs.readdirSync(CARDS_DIR).filter(f => f.endsWith('.html')).map(f => f.replace('.html', ''));
}
function numAfter(flag, def) {
  const i = args.indexOf(flag);
  return (i >= 0 && args[i + 1] && /^\d+$/.test(args[i + 1])) ? parseInt(args[i + 1], 10) : def;
}

function dataPoorCards(limit) {
  const out = [];
  for (const id of allCardIds()) { if (isFallback(id)) out.push(id); if (out.length >= limit) break; }
  return out;
}

// 보강 가치 랭킹: 주요 브랜드 + 구체 모델코드 + 이름 풍부도 ↑, 사업자/전용/반납 경향 ↓
function rankCandidates(limit) {
  let idx = {};
  try { idx = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8')).products || {}; } catch (e) {}
  const major = /코웨이|삼성|LG|쿠쿠|청호|SK ?매직|위닉스|바디프랜드|웰스|교원|위니아|쿠첸|캐리어/;
  const out = [];
  for (const id of allCardIds()) {
    const e = idx[id]; if (!e) continue;
    if (!isFallback(id)) continue;
    const name = e.productName || '';
    let score = 0;
    if (major.test(e.brand || name)) score += 3;
    if (e.modelCode && e.modelCode.length >= 6) score += 2;
    score += Math.min(name.length, 40) / 20;
    if (/사업자|업소|전용|반납|렌탈정보|2개월관리|4개월관리/.test(name)) score -= 1.5;
    // 변종(사이즈·색상) 묶음 키 — 같은 제품군 중복 추출 방지
    const base = (e.brand || '') + '|' + name
      .replace(/(슈퍼싱글|싱글|더블|퀸|라지킹|킹|SS|Q|K)\b/g, '')
      .replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim().slice(0, 16);
    out.push({ id, score: +score.toFixed(2), brand: e.brand || '', model: e.modelCode || '', name: name.slice(0, 36), base });
  }
  out.sort((a, b) => b.score - a.score);
  const seen = new Set(), dedup = [];
  for (const r of out) { if (seen.has(r.base)) continue; seen.add(r.base); dedup.push(r); if (dedup.length >= limit) break; }
  return dedup;
}

function runEnv() {
  const env = { ...process.env };
  const pass = { '--model': 'EXTRACT_MODEL', '--searches': 'EXTRACT_SEARCHES', '--min-lines': 'EXTRACT_MIN_LINES' };
  for (const f in pass) { const i = args.indexOf(f); if (i >= 0 && args[i + 1]) env[pass[f]] = args[i + 1]; }
  return env;
}
const VALUE_FLAGS = ['--model', '--searches', '--min-lines'];
function positionals() {
  const out = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) { if (VALUE_FLAGS.includes(args[i])) i++; continue; }
    out.push(args[i]);
  }
  return out;
}

if (args.includes('--rank')) {
  const n = numAfter('--rank', 30);
  const ranked = rankCandidates(n);
  console.log('보강 가치 상위 ' + n + ' (브랜드·모델·이름 기준):');
  ranked.forEach(r => console.log('  ' + String(r.score).padStart(5) + '  ' + r.id.padEnd(7) + ' ' + (r.brand || '').padEnd(7) + ' ' + r.model.padEnd(16) + ' ' + r.name));
  console.log('\n다음: node pipeline.js --run ' + ranked.slice(0, 8).map(r => r.id).join(' ') + ' --model claude-sonnet-4-6 --min-lines 1');
} else if (args.includes('--list')) {
  const n = numAfter('--list', 30);
  console.log('fallback 카드 상위 ' + n + ':');
  console.log(dataPoorCards(n).join(' '));
} else if (args.includes('--run')) {
  const ids = positionals();
  if (!ids.length) { console.error('--run 뒤에 prodNo 나열'); process.exit(1); }
  const env = runEnv();
  console.log('배치: ' + ids.length + '개 [model=' + (env.EXTRACT_MODEL || 'claude-sonnet-4-6(기본)') +
    ', searches=' + (env.EXTRACT_SEARCHES || '4') + ', min-lines=' + (env.EXTRACT_MIN_LINES || '0') + ']');
  let ok = 0;
  for (const id of ids) {
    try { execFileSync('node', [path.join(__dirname, 'extract.js'), id, '--render'], { stdio: 'inherit', env }); ok++; }
    catch (e) { console.error('✗ ' + id + ' 실패 — 건너뜀'); }
  }
  console.log('배치 완료: ' + ok + '/' + ids.length);
} else if (args.includes('--status')) {
  const have = fs.existsSync(DATA_DIR) ? fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json')).length : 0;
  let poor = 0; for (const id of allCardIds()) if (isFallback(id)) poor++;
  console.log('data/ 추출 보유: ' + have + ' 제품');
  console.log('아직 fallback("표준 사양") 카드: ' + poor + ' 개');
} else {
  console.log('사용: pipeline.js --status | --list [N] | --rank [N] | --run <prodNo...> [--model M] [--searches N] [--min-lines N]');
}
