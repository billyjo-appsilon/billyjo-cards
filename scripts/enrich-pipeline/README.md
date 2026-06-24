# 제조사 데이터 파이프라인 (SLOT 6 상세 스펙 자동 보강) — PoC

기존 카드의 상세 스펙(SLOT 6)이 제너릭 fallback("{지표} 표준 사양.")에 머무는 근본 원인은 **빌리조 스크랩 데이터가 얇기** 때문이다(브랜드·규격·색상 수준, `cards-index.json` 확인). 깊은 기술 사양(필터 종류·헤파 등급·모터·살균 방식 등)은 **제조사 사이트**에만 있다. 이 파이프라인은 그 제조사 데이터를 모델로 추출 → 구조화 JSON → 결정론적으로 카드에 주입한다.

## 구조 (추출 ≠ 렌더 분리)

```
cards-index.json(메타)
        │  brand·model·family
        ▼
  extract.js  ── Claude Opus 4.8 + web_search + structured outputs ──▶  data/<prodNo>.json
        │                                                                     │ (제조사 사양, 검증된 구조)
        ▼                                                                     ▼
  (모델/네트워크 의존)                                          render-slot6.js  (순수 함수, API 불필요)
                                                                              │ JSON → SLOT 6 주입
                                                                              ▼
                                                                    cards/<prodNo>.html
```

- **extract.js** — 비결정론적·네트워크 의존 절반. 제조사 공식/보도자료를 `web_search` 로 조사하고 `output_config.format`(structured outputs)로 스키마에 맞는 JSON 을 강제 생성. 결과는 `data/<prodNo>.json` 으로 캐시되어 재실행/감사 가능.
- **render-slot6.js** — 결정론적 절반. `data/<prodNo>.json` 을 읽어 step 1-3 의 `step-sum` + `.spec-line` + (선택)pills 를 교체. **spec-collapse 래퍼·`<!-- step-N-start/end -->` 앵커·등급 배지·나머지 카드는 보존**. API 불필요 → 언제든 재현·재렌더 가능.
- **pipeline.js** — 오케스트레이터. fallback 남은 카드 나열(`--list`), 배치 구동(`--run`), 현황(`--status`).

이 분리가 핵심: 추출은 비싸고 흔들리지만 한 번 하면 JSON 으로 고정되고, 렌더는 공짜·결정론·검증가능. 카드 구조가 바뀌면 렌더만 고치면 되고 재추출은 불필요.

## data/<prodNo>.json 스키마

```jsonc
{
  "prodNo": "26801", "family": "F03", "brand": "삼성", "model": "AP70F03102RTD",
  "productName": "...", "sources": ["https://www.samsung.com/..."],   // 감사용
  "indicatorOverride": { "1": { "from": "냉방·정화 성능", "to": "공기청정 성능" } },  // 선택: 지표명 교체
  "steps": [
    {
      "n": 1,
      "summary": "<strong>0.01㎛ ... 99.999% 제거</strong> ... ",   // <strong> 만 허용, 나머지 escape
      "lines": [ ["사용 면적", "<strong>33.1㎡</strong> (약 10평)"], ... ],  // 실제 스펙 3~4행
      "pills": { "label": "필터 구성", "items": [ {"v":"집진+탈취 일체형","on":true}, ... ] }  // 선택: 1-of-N 옵션
    }
    // 정확히 3 step (지표 순서 고정)
  ]
}
```

값에는 `<strong>` 만 허용되며 그 외 태그는 escape 된다(`render-slot6.js`의 `safe()` — 주입 카드 무결성, 규칙 #3).

## 사용

```bash
# 0) 인증 (둘 중 하나)
export ANTHROPIC_API_KEY=sk-ant-...
#   또는 ant 프로필:  set -a; eval "$(ant auth print-credentials --env)"; set +a

# 1) 후보 확인
node scripts/enrich-pipeline/pipeline.js --status
node scripts/enrich-pipeline/pipeline.js --list 30

# 2) 추출 → 렌더 (한 제품)
node scripts/enrich-pipeline/extract.js 12572 --render

# 3) 배치
node scripts/enrich-pipeline/pipeline.js --run 12572 24918 15630 ...

# 렌더만 (이미 data/*.json 있을 때, API 불필요)
node scripts/enrich-pipeline/render-slot6.js 26801
node scripts/enrich-pipeline/render-slot6.js --all

# 변종 전파 (1 research → N 카드): base data 를 색상·사이즈·관리주기 변종 카드에 적용
#   - 같은 base 모델의 모든 fallback 변종에 동일 사양 주입 (대량 보강의 핵심 레버)
#   - fallback 카드만 덮어씀(가드). base JSON 의 "variants" 배열에 영구 기록 → --all 재전파
#   - 전파 대상 카드의 관리주기가 제각각이면 base data 의 step-2 관리 line 을 generic 으로 작성할 것
node scripts/enrich-pipeline/render-slot6.js --apply 26555 25902 25905 25906 26556
# 또는 data/<base>.json 에 "variants":["...","..."] 를 넣고 base 만 렌더하면 자동 전파
```

## PoC 검증 (완료)

`data/26801.json`(삼성 블루스카이3100) 을 골든 픽스처로 두고, 카드를 제너릭 fallback 으로 되돌린 뒤 `render-slot6.js 26801` 만으로 리치 카드를 **완전 재구성**함을 확인:
- step-sum/스펙라인 복원(99.999%·스마트싱스·일체형 등), 지표명 `냉방·정화 성능 → 공기청정 성능` 교체(SLOT 2 + step-title 동기)
- details/anchor 균형 OK, **가로 넘침 0 @360px**(규칙 #32)

`extract.js` 는 키 미설정 시 깨끗이 실패하고(메타는 `cards-index.json` 에서 정상 로드), 키 설정 시 즉시 실 추출 가능.

## 운영 메모 / 한계

- **모델**: `claude-opus-4-8` 고정. `web_search_20260209`(동적 필터링) + structured outputs. `thinking: adaptive`.
- **사실성**: 프롬프트에서 제조사 공식/보도자료 우선·블로그 금지·미확인 사실 생성 금지를 지시. 그래도 **사람 스팟체크 권장**(특히 수치). `sources` 필드로 감사.
- **비용/속도**: 제품당 web_search 수 회 + Opus 호출 1건. 수천 개는 비용이 크므로 우선순위(조회 많은 모델·플래그십)부터. `pipeline.js --list` 로 후보 관리.
- **레퍼런스 품질 기준**: 손으로 채운 6개 카드(24578·26801·15080·24918·18952·10983)가 품질 바. 추출 결과가 이에 못 미치면 프롬프트/스키마를 조정.
- **idempotent**: 같은 JSON → 같은 카드. 카드를 다시 fallback 으로 돌려도 재렌더로 복원.
