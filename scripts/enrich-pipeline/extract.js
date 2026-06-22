#!/usr/bin/env node
/**
 * extract.js — 제조사 데이터 추출기 (파이프라인의 자동화 절반).
 *
 * 모델: claude-opus-4-8 + web_search 서버 툴 + structured outputs.
 * 입력: prodNo + (brand, model, productName, family)  — cards-index.json 에서 자동 로드 가능.
 * 출력: scripts/enrich-pipeline/data/<prodNo>.json  (render-slot6.js 가 소비)
 *
 * 인증 (둘 중 하나):
 *   export ANTHROPIC_API_KEY=sk-ant-...                # API 키
 *   # 또는 ant 프로필: set -a; eval "$(ant auth print-credentials --env)"; set +a
 *
 * 사용:
 *   node scripts/enrich-pipeline/extract.js 12572               # cards-index.json 에서 메타 로드
 *   node scripts/enrich-pipeline/extract.js 12572 --render      # 추출 후 render-slot6 까지
 *
 * Node 18+ (내장 fetch). SDK 미설치 환경이라 raw HTTP 사용 (claude-api skill 기준).
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const DATA_DIR = path.join(__dirname, 'data');
const INDEX_PATH = path.join(ROOT, 'cards-index.json');

// daily-sync.js 와 동일한 패밀리별 지표 (3개 step 제목)
const FAMILIES = {
  F01: ['정수성능', '위생관리', '편의기능'], F02: ['세정성능', '위생관리', '편의기능'],
  F03: ['냉방·정화 성능', '위생관리', 'AI·편의'], F04: ['청소성능', '배터리·내구', '편의기능'],
  F05: ['보관성능', '냉각·에너지', '편의기능'], F06: ['세탁·건조성능', '위생관리', '편의기능'],
  F07: ['세척·조리성능', '위생관리', '편의기능'], F08: ['화질·음향', '연결성', '편의기능'],
  F09: ['마사지·운동성능', '안전·내구', '편의·디자인'], F10: ['케어성능', '위생관리', '편의기능'],
  F11: ['편안함·내구', '소재·위생', '디자인·기능'], F12: ['주행성능', '배터리·안전', '편의기능'],
  F13: ['보안성능', '연결·내구', '편의기능'], F14: ['업무성능', '내구·보안', '관리·편의'],
};
function detectFamily(name) {
  const n = name || '';
  if (/정수기|연수기|샤워기/.test(n)) return 'F01';
  if (/비데/.test(n)) return 'F02';
  if (/공기청정|에어컨|냉난방|제습기|환기|보일러/.test(n)) return 'F03';
  if (/청소기|로봇청소/.test(n)) return 'F04';
  if (/냉장|김치|냉동|와인셀러|얼음/.test(n)) return 'F05';
  if (/세탁|건조|스타일러/.test(n)) return 'F06';
  if (/식기세척|커피|인덕션|에어프라이|레인지|밥솥/.test(n)) return 'F07';
  if (/TV|노트북|모니터|빔프로젝터/.test(n)) return 'F08';
  if (/안마|런닝|헬스|운동/.test(n)) return 'F09';
  if (/드라이기|이미용|의류케어/.test(n)) return 'F10';
  if (/소파|침대|매트리스|모션베드|가구/.test(n)) return 'F11';
  if (/자전거|스쿠터|자동차|캐스퍼/.test(n)) return 'F12';
  if (/CCTV|도어락|로봇/.test(n)) return 'F13';
  if (/POS|키오스크|자판기|서빙로봇/.test(n)) return 'F14';
  return 'F01';
}

// structured outputs 스키마 (제약: additionalProperties:false, minLength 등 미지원)
function schemaFor(titles) {
  const step = {
    type: 'object', additionalProperties: false,
    properties: {
      n: { type: 'integer', enum: [1, 2, 3] },
      summary: { type: 'string', description: '제품 고유 1줄 요약. 핵심 사실은 <strong>키워드</strong> 로 감쌈. 30~70자.' },
      lines: {
        type: 'array', description: '실제 스펙 3~4행',
        items: {
          type: 'object', additionalProperties: false,
          properties: { label: { type: 'string' }, value: { type: 'string', description: '핵심 수치는 <strong> 강조' } },
          required: ['label', 'value'],
        },
      },
      pills: {
        type: 'object', additionalProperties: false, description: '1-of-N 옵션 (선택). 없으면 생략.',
        properties: {
          label: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object', additionalProperties: false,
              properties: { v: { type: 'string' }, on: { type: 'boolean' } },
              required: ['v', 'on'],
            },
          },
        },
        required: ['label', 'items'],
      },
    },
    required: ['n', 'summary', 'lines'],
  };
  return {
    type: 'object', additionalProperties: false,
    properties: {
      indicatorRename: {
        type: 'object', additionalProperties: false,
        description: '제품 특성상 지표명이 부정확하면 교체 (예: 공기청정기 전용은 "냉방·정화 성능"→"공기청정 성능"). 아니면 빈 문자열.',
        properties: { stepN: { type: 'integer', enum: [0, 1, 2, 3] }, to: { type: 'string' } },
        required: ['stepN', 'to'],
      },
      steps: { type: 'array', items: step },
    },
    required: ['steps', 'indicatorRename'],
  };
}

function loadMeta(prodNo) {
  if (!fs.existsSync(INDEX_PATH)) return {};
  const j = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
  const e = j.products && j.products[prodNo];
  if (!e) return {};
  return { brand: e.brand, model: e.modelCode, productName: e.productName, family: detectFamily(e.productName) };
}

function authHeaders() {
  const h = { 'content-type': 'application/json', 'anthropic-version': '2023-06-01' };
  if (process.env.ANTHROPIC_API_KEY) h['x-api-key'] = process.env.ANTHROPIC_API_KEY;
  else if (process.env.ANTHROPIC_AUTH_TOKEN) {
    h['authorization'] = 'Bearer ' + process.env.ANTHROPIC_AUTH_TOKEN;
    h['anthropic-beta'] = 'oauth-2025-04-20';
  } else throw new Error('ANTHROPIC_API_KEY 또는 ANTHROPIC_AUTH_TOKEN 필요');
  return h;
}

async function extract(prodNo, meta) {
  const family = meta.family || 'F01';
  const titles = FAMILIES[family];
  const prompt =
    `다음 렌탈 가전의 제조사 공식/보도자료에서 실제 사양을 web_search 로 조사해, 상세페이지 카드 SLOT 6(상세 스펙 3단계)용 JSON 을 작성해줘.\n\n` +
    `제품: ${meta.productName}\n브랜드: ${meta.brand}\n모델: ${meta.model}\n패밀리: ${family}\n` +
    `3단계 지표(순서 고정): 1=${titles[0]}, 2=${titles[1]}, 3=${titles[2]}\n\n` +
    `규칙:\n- 출처는 제조사 공식 사이트/보도자료 우선. 블로그·카페 금지.\n` +
    `- 각 step.summary 는 제품 고유 사실 1줄, 핵심 키워드는 <strong>…</strong>.\n` +
    `- lines 는 실제 스펙 3~4행 (label/value), 수치는 <strong> 강조.\n` +
    `- 1-of-N 옵션(필터 종류·살균 방식 등)이 있으면 해당 step.pills 에 on/off 로.\n` +
    `- 지표명이 제품과 안 맞으면(예: 공기청정 전용인데 "냉방·정화 성능") indicatorRename 으로 교체, 아니면 to="".\n` +
    `- 확인 안 되는 사실은 지어내지 말 것.`;

  const body = {
    model: 'claude-opus-4-8',
    max_tokens: 8000,
    thinking: { type: 'adaptive' },
    tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 6 }],
    output_config: { format: { type: 'json_schema', schema: schemaFor(titles) } },
    messages: [{ role: 'user', content: prompt }],
  };

  // 서버 툴(web_search) 루프: pause_turn 이면 재전송하여 이어가기
  let messages = body.messages;
  for (let i = 0; i < 8; i++) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', headers: authHeaders(), body: JSON.stringify({ ...body, messages }),
    });
    if (!res.ok) throw new Error('API ' + res.status + ': ' + (await res.text()).slice(0, 300));
    const data = await res.json();
    if (data.stop_reason === 'refusal') throw new Error('refusal: ' + JSON.stringify(data.stop_details));
    if (data.stop_reason === 'pause_turn') {
      messages = messages.concat([{ role: 'assistant', content: data.content }]);
      continue;
    }
    const textBlock = (data.content || []).find(b => b.type === 'text');
    if (!textBlock) throw new Error('text 블록 없음 (stop=' + data.stop_reason + ')');
    return JSON.parse(textBlock.text);
  }
  throw new Error('pause_turn 루프 한도 초과');
}

// 모델 출력 → render-slot6 가 쓰는 data 스키마로 정규화
function toDataFile(prodNo, meta, parsed) {
  const out = {
    prodNo, family: meta.family, brand: meta.brand, model: meta.model, productName: meta.productName,
    steps: (parsed.steps || []).map(s => ({
      n: s.n, summary: s.summary,
      lines: (s.lines || []).map(l => [l.label, l.value]),
      ...(s.pills && s.pills.items && s.pills.items.length ? { pills: s.pills } : {}),
    })),
  };
  const r = parsed.indicatorRename;
  if (r && r.to && r.stepN >= 1) {
    out.indicatorOverride = { [r.stepN]: { from: FAMILIES[meta.family][r.stepN - 1], to: r.to } };
  }
  return out;
}

(async () => {
  const args = process.argv.slice(2);
  const prodNo = args.find(a => !a.startsWith('--'));
  if (!prodNo) { console.error('사용: extract.js <prodNo> [--render]'); process.exit(1); }
  const meta = loadMeta(prodNo);
  if (!meta.productName) { console.error('cards-index.json 에 ' + prodNo + ' 메타 없음'); process.exit(1); }
  meta.family = meta.family || detectFamily(meta.productName);
  console.log('추출: ' + prodNo + ' / ' + meta.productName + ' (' + meta.family + ')');
  const parsed = await extract(prodNo, meta);
  const dataObj = toDataFile(prodNo, meta, parsed);
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(DATA_DIR, prodNo + '.json'), JSON.stringify(dataObj, null, 2));
  console.log('✓ data/' + prodNo + '.json (' + dataObj.steps.length + ' steps)');
  if (args.includes('--render')) {
    execFileSync('node', [path.join(__dirname, 'render-slot6.js'), prodNo], { stdio: 'inherit' });
  }
})().catch(e => { console.error('FATAL: ' + e.message); process.exit(1); });
