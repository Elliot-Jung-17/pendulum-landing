# Pendulum Landing 세계 수준 개선 감사 대장

- 감사·개선일: 2026-07-15
- 범위: `index.html`, `ko.html`, `assets/main.js`, `assets/scene.js`, `assets/orbit-console.js`, `assets/reactbits.js`, `assets/landing.css`, `assets/i18n-core.js`, 생성 번들, 정적 검사, 브라우저 계약, 배포 워크플로
- 상태 기준: **완료**는 실제 소스 또는 계약이 반영된 항목이다. **공동 완료**는 병렬 담당자가 워크플로·테스트 계층에 반영한 항목이다.
- 원칙: 측정하지 않은 성능·외부 배포 성공을 성공으로 쓰지 않는다. 기능 assertion과 테스트 러너 teardown 경합도 구분한다.

## 1–13. 증거·콘텐츠 무결성

| # | 발견된 위험 / 개선점 | 조치와 상태 | 검증 근거 |
|---:|---|---|---|
| 1 | 손상된 evidence JSON이 부분 수치나 `undefined`를 노출할 수 있음 | 스키마·필수 필드 검증 후 fail-closed 처리 — **완료** | `assets/main.js:evidenceIsUsable` |
| 2 | 만료된 evidence가 최신 주장처럼 보일 수 있음 | 만료일 검사, stale 배지, 동적 주장 갱신 중단 — **완료** | `markEvidenceState`, Playwright stale fixture |
| 3 | EN/KO에서 evidence 상태 설명이 달라질 수 있음 | current/stale/invalid 문구를 두 언어로 동기화 — **완료** | `assets/main.js` |
| 4 | changelog shape 변경 시 빈 카드가 노출될 수 있음 | 커밋·URL·3개 highlight를 모두 검증하고 정적 사본 유지 — **완료** | `applyChangelog` |
| 5 | changelog의 mojibake가 런타임에 정상 사본을 덮을 수 있음 | UTF-8 정적 자산과 의심 인코딩 게이트 유지 — **완료** | `assets/changelog-highlights.json`, 정적 검사 |
| 6 | 테스트 수와 meta/hero 숫자가 서로 어긋날 수 있음 | evidence 기반 count hydrate 및 comma-aware meta 교체 — **완료** | `applyEvidence`, `npm run check` |
| 7 | 최적 적분기·에너지 드리프트 주장이 오래될 수 있음 | method/count/drift를 evidence에서 함께 갱신 — **완료** | `energy.*` hydration |
| 8 | SciPy 일치도가 모든 궤도에 대한 값처럼 읽힐 수 있음 | regular reference cases 범위를 명시 — **완료** | evidence 표·카피 |
| 9 | period-doubling 계산값이 문헌값과 구분되지 않음 | computed vs literature 쌍과 scope를 표시 — **완료** | validation 표 |
| 10 | WebGPU가 3개 vendor 모두 검증된 것처럼 보일 수 있음 | `1 / 3`, NVIDIA+AMD pending, partial을 명시 — **완료** | GPU evidence 행 |
| 11 | npm·Zenodo까지 공개 완료된 것처럼 보일 수 있음 | GitHub/Pages와 pending 채널을 분리 표기 — **완료** | publication evidence 행 |
| 12 | OG·구조화 데이터가 근거 커밋과 분리될 수 있음 | OG provenance 검사와 author/dateModified 구조화 데이터 유지 — **완료** | `og-card-meta.json`, `index.html` |
| 13 | 본체 커밋 뒤 evidence/OG/KO 동기화가 수동이면 truth drift 재발 | dispatch+주간 보정, 커밋 검증, 전체 gate 후 제한 파일만 push — **공동 완료** | `.github/workflows/evidence-sync.yml` |

## 14–51. 이번 소스 심층 감사에서 직접 수정한 항목

| # | 발견된 위험 / 개선점 | 조치와 상태 | 검증 근거 |
|---:|---|---|---|
| 14 | 언어 전환이 UTM·상태 query 또는 현재 section hash를 잃음 | query와 hash를 보존하고 `lang`만 대상 언어로 교체 — **완료** | `refreshLanguageHref`, lang boot |
| 15 | `?captureHero=false`도 capture로 해석될 수 있음 | `1/true/yes`만 참인 값 파서로 4개 런타임 통일 — **완료** | main/scene/orbit-console/reactbits |
| 16 | OS 감소 모션·data saver·포인터 변화가 로드 후 반영되지 않음 | MediaQueryList/connection change에서 상태 재계산 — **완료** | `syncHeroPreferences`, `syncMediaPreferences` |
| 17 | hero intent 리스너와 idle/timer가 결정 뒤 남음 | AbortController와 idle/timer cancel 경로 추가 — **완료** | `clearHeroIntent` |
| 18 | drag 중 pointer가 취소·캡처 상실·창 blur되면 고착될 수 있음 | pointerup/cancel/lostpointercapture/blur 공통 종료 — **완료** | `scene.js:finishDrag` |
| 19 | 화면 이동·DPR 변화 뒤 canvas가 흐리거나 과도하게 큼 | resize마다 compact와 DPR cap을 다시 계산 — **완료** | `scene.js:resize` |
| 20 | scroll kick과 감쇠가 프레임률에 따라 달라짐 | 초당 viewport 속도와 지수 시간 감쇠 사용 — **완료** | main/scene scroll velocity |
| 21 | JS 실패 시 live 3D 설명만 남아 사실과 어긋남 | `html:not(.js-ready)`에서 정적 설명으로 전환 — **완료** | descent live/static copy, CSS |
| 22 | reduced-motion/data/WebGL fallback이 여전히 “live camera”라고 주장 | fallback별 motion-free 문구·signal을 제공 — **완료** | `descent-static-copy`, i18n |
| 23 | 미니랩이 UI에 없는 숨은 중력을 적용할 수 있음 | 물리와 전송 URL 모두 `g=9.81`로 통일 — **완료** | `orbit-console.js` |
| 24 | Open This State URL이 실제 미니랩 상태와 다를 수 있음 | θ₁, damping, g를 매 변경 시 URL에 반영 — **완료** | `updateControlSurface` |
| 25 | range input마다 전체 reset/warmup이 중첩됨 | 한 animation frame에 한 번만 reset — **완료** | `scheduleReset` |
| 26 | 미니랩 물리가 디스플레이 FPS에 묶임 | elapsed accumulator와 150 Hz fixed step 적용 — **완료** | `tick`, `fixedStep` |
| 27 | ±π 경계에서 각도 차이가 2π로 튈 수 있음 | atan2(sin Δ, cos Δ) wrapped separation — **완료** | `updateReadouts` |
| 28 | 초기 궤적 warmup이 main thread long task를 만듦 | idle callback/timeout 청크로 분할 — **완료** | `scheduleWarmChunk` |
| 29 | 연속 reset 뒤 오래된 warmup이 새 상태를 덮을 수 있음 | generation token과 cancel handle 추가 — **완료** | `resetGeneration`, `cancelWarmChunk` |
| 30 | 3D 물리 step마다 Vector3 객체가 생성됨 | current/nearby scratch vectors 재사용 — **완료** | `pointsFromState` |
| 31 | trail 업로드마다 O(n) bounding sphere 계산 | 보수적인 고정 bounding sphere 지정 — **완료** | `createTrail` |
| 32 | dust 업로드마다 O(n) bounding sphere 계산 | dust도 고정 bounding sphere 사용 — **완료** | `createDust` |
| 33 | 3D prewarm 1,500–2,800 step이 시작을 점유 | 일반 모드는 7 ms idle slice, capture는 결정적 동기 경로 — **완료** | `scene.js:prewarm` |
| 34 | 동일 trail tick에서 buffer sync가 반복될 수 있음 | dirty flag와 시간 기반 업로드 cadence 적용 — **완료** | `trailsDirty`, `trailSyncElapsed` |
| 35 | 화면 밖에서도 좌표 DOM text를 계속 갱신 | descent 활성 구간에서만 telemetry 갱신 — **완료** | `orbit-descent-active` guard |
| 36 | compact 장치도 60 fps WebGL loop를 요구 | compact 30 fps 상한과 direct render 적용 — **완료** | `scene.js:loop` |
| 37 | hero가 멀리 떨어져도 넓은 rootMargin 때문에 GPU가 동작 | 관찰 margin 축소, hidden/offscreen에서 pause — **완료** | `regionObserver`, `syncPlayback` |
| 38 | 카드 pointermove마다 layout rect를 측정 | scroll/resize generation 기반 rect cache — **완료** | `reactbits.js:layoutVersion` |
| 39 | 카드 pointermove마다 새 GSAP tween이 누적 | `gsap.quickTo` setter 4개를 재사용 — **완료** | `enhanceCard` |
| 40 | 두 카드 grid가 문서 pointer/scroll/resize listener를 중복 등록 | 단일 spotlight controller로 통합 — **완료** | `initGlobalSpotlight(configs)` |
| 41 | particle 삭제 뒤 무한 tween이 남을 수 있음 | 제거 전 `killTweensOf`, 즉시 cleanup 경로 추가 — **완료** | `clearParticles` |
| 42 | 비상호작용 카드 click ripple이 클릭 가능성으로 오해됨 | ripple listener와 CSS 제거 — **완료** | reactbits/CSS 검색 결과 없음 |
| 43 | 사용되지 않는 TextType·tilt·drift 코드가 타이머/유지보수 비용을 만듦 | dead code와 대응 CSS 삭제 — **완료** | main/reactbits/landing.css |
| 44 | mode card 효과가 경계를 넘어 인접 카드와 겹침 | `overflow:hidden`, `isolation:isolate` 적용 — **완료** | `.mode-card` |
| 45 | console scan이 고정 520 px라 반응형 높이에서 이탈 | `calc(100% - 12px)` 기반 keyframe — **완료** | `@keyframes console-scan` |
| 46 | `font-display:optional`이 첫 방문에서 브랜드 폰트를 영구 건너뜀 | 두 Pretendard face를 `swap`으로 변경 — **완료** | `@font-face` |
| 47 | 작은 KO 화면만 system font로 바뀌어 폭·질감이 달라짐 | 모바일 KO override 제거, subset font 일관 사용 — **완료** | responsive CSS |
| 48 | `overflow-x:hidden`이 focus/anchor 문제를 숨기고 진단을 어렵게 함 | root overflow를 `clip`으로 전환하고 실제 폭을 수정 — **완료** | html/body CSS |
| 49 | evidence 표 마지막 row의 `<th>` border가 남음 | 마지막 행 `th,td` 모두 제거 — **완료** | `.val-table tr:last-child :is(th,td)` |
| 50 | orbit reset/button row가 존재하지 않는 grid 좌표를 사용 | 전용 `.orbit-button-row` 배치와 모바일 flex 전환 — **완료** | landing CSS |
| 51 | preference 전환 후 ReactBits listener/particle가 남음 | AbortController cleanup 후 조건부 재초기화 — **완료** | `activateEffects` |

## 52–94. UX·접근성·복원력·성능 보완

| # | 발견된 위험 / 개선점 | 조치와 상태 | 검증 근거 |
|---:|---|---|---|
| 52 | desktop poster가 CSS discovery 뒤 늦게 요청됨 | desktop WebP preload+high priority — **완료** | `index.html` preload |
| 53 | 모바일이 불필요하게 큰 poster를 받음 | 960 px fallback 별도 preload/source — **완료** | `hero-fallback-960.webp` |
| 54 | live canvas 전환이 flash처럼 보임 | `hero-live` fade와 poster 연속성 유지 — **완료** | hero CSS |
| 55 | WebGL context loss 뒤 검은 canvas가 남음 | loop 정지, `no-webgl`, poster 복귀 — **완료** | contextlost handler |
| 56 | context restore 뒤 fallback 상태에 고정됨 | 상태 제거, frozen frame 재렌더, playback 동기화 — **완료** | contextrestored handler |
| 57 | hero와 미니랩이 서로 다른 가짜 물리를 쓸 수 있음 | 공유 RK4 kernel import — **완료** | `pendulum-demo-kernel.js` |
| 58 | 장치별 frame 차이가 trajectory를 바꿈 | scene 240 Hz fixed-step accumulator — **완료** | `scene.js:advance` |
| 59 | screenshot이 RNG/시간에 따라 흔들림 | seed RNG, capture prewarm, frozen frame — **완료** | `captureHero=1` 계약 |
| 60 | 저메모리 탭이 WebGL 할당으로 종료될 수 있음 | deviceMemory≤2 poster 경로 — **완료** | main/scene lowMemory |
| 61 | reduced-data 사용자가 대형 번들을 받을 수 있음 | media query와 saveData poster 경로 — **완료** | `syncHeroPreferences` |
| 62 | 모바일이 desktop particle/trail budget을 사용 | compact capacity·geometry·DPR ladder — **완료** | `scene.js` compact branches |
| 63 | bloom이 모바일 fill-rate를 소진 | composer는 non-compact에서만 생성·사용 — **완료** | `buildScene` |
| 64 | compact antialias 비용이 불필요 | compact renderer에서 antialias 비활성 — **완료** | WebGLRenderer options |
| 65 | poster 경로에서 로딩 감지기가 영원히 기다림 | `__heroPainted=true`를 명시 — **완료** | main/scene fallback |
| 66 | 미니랩 canvas에 대체 설명이 없음 | `role=img`, label, fallback text — **완료** | `index.html#orbit-console` |
| 67 | 애니메이션을 사용자가 멈출 수 없음 | Pause/Resume control과 실제 rAF 정지 — **완료** | orbit controls |
| 68 | pause 상태가 보조기술에 전달되지 않음 | `aria-pressed`, 동적 label, mode readout — **완료** | `setPaused` |
| 69 | range 현재값과 단위가 읽히지 않음 | 연결된 output/status에 rad·damping 표시 — **완료** | orbit control markup |
| 70 | 궤적의 의미가 canvas만 보고 결정됨 | figure/figcaption에 두 초기조건의 의미 설명 — **완료** | console figure |
| 71 | evidence table의 목적·출처가 불명확 | 명시적 caption 추가 — **완료** | validation table |
| 72 | table header 관계가 불완전 | 모든 column/row에 `scope` 지정 — **완료** | validation table markup |
| 73 | 색만으로 measured/partial/pass를 구분 | 각 행에 텍스트 상태 badge 제공 — **완료** | evidence status cells |
| 74 | 긴 changelog hydration이 통째로 재낭독될 수 있음 | 큰 `aria-live` 제거, 정적 콘텐츠 우선 — **완료** | changelog markup |
| 75 | 키보드 사용자가 반복 nav를 건너뛸 수 없음 | main 대상 skip link와 focus style — **완료** | `.skip-link` |
| 76 | 모바일 menu가 이동·외부 click·Escape 뒤 남음 | 세 경로 모두 details를 닫음 — **완료** | `assets/main.js` nav menu |
| 77 | 현재 section을 보조기술이 알 수 없음 | IntersectionObserver scrollspy와 `aria-current` — **완료** | nav state |
| 78 | 좁은 화면 CTA/menu hit area와 폭이 깨짐 | 280/320/390 responsive 규칙과 안전 폭 — **완료** | CSS, Playwright viewport cases |
| 79 | 검색엔진의 언어·대표 URL 연결이 약함 | canonical, en/ko/x-default hreflang 유지 — **완료** | head metadata |
| 80 | 존재하지 않는 demo/preview 링크가 CTA 신뢰를 훼손 | 실제 Lab/reviewer/paper URL로 교체 — **완료** | 정적 link 검사 |
| 81 | 마케팅 추적 스크립트 없이 유입 구분이 어려움 | first-party UTM만 링크에 부착 — **완료** | `data-app-link` attribution |
| 82 | 잘못된 URL 하나가 전체 초기화를 중단할 수 있음 | URL 조작을 국소 try/catch로 보호 — **완료** | main/orbit-console |
| 83 | 외부 font 요청이 privacy/CSP/LCP를 흔듦 | local Pretendard subset과 라이선스 포함 — **완료** | `assets/fonts` |
| 84 | 긴 하단 section이 초기 layout 비용에 참여 | `content-visibility:auto`와 intrinsic size — **완료** | `.band` |
| 85 | scroll event마다 DOM write가 반복 | 한 frame 한 번 rAF throttle — **완료** | `scheduleScroll` |
| 86 | 포인터가 멈춰도 parallax loop가 계속됨 | 수렴 임계값에서 rAF 종료, preference guard — **완료** | main pointer engine |
| 87 | main magnetic/glow가 매 이동마다 rect 측정 | WeakMap+generation rect cache — **완료** | `rectOf` |
| 88 | 포인터 event burst가 style write를 중첩 | 요소별 최신 write만 rAF batch — **완료** | `queueWrite` |
| 89 | IntersectionObserver 미전달 시 count가 0에 고정 | 2.6초 wall-clock fallback — **완료** | counter fallback |
| 90 | scramble 중 원문이 screen reader에 깨진 glyph로 노출 | 숨김 원문과 `aria-hidden` 시각 사본 분리 — **완료** | `startScramble` |
| 91 | shader compile로 rAF가 멈추면 scramble이 복구되지 않음 | wall-clock deadline으로 정확한 원문 restore — **완료** | `job.deadline` |
| 92 | Windows high contrast에서 focus와 장식 의미가 사라짐 | forced-colors 규칙과 3 px Highlight outline — **완료** | landing CSS |
| 93 | readout/recipe/control 집합의 관계가 불명확 | `role=group`와 locale label 분리 — **완료** | EN/KO markup |
| 94 | 중복 SVG class 속성이 브라우저별로 다르게 해석될 수 있음 | 단일 class로 정규화 — **완료** | 정적 검사 |

## 95–102. 빌드·테스트·배포 계약

| # | 발견된 위험 / 개선점 | 조치와 상태 | 검증 근거 |
|---:|---|---|---|
| 95 | inline boot 변경 뒤 CSP가 언어 redirect를 차단 | 실제 UTF-8 본문의 SHA-256을 재계산·고정 — **완료** | `npm run check` |
| 96 | source와 committed bundle이 어긋날 수 있음 | hero/vendor 재빌드와 byte freshness gate — **완료** | `npm run build:hero`, bundle `--check` |
| 97 | EN 변경이 KO 정적 페이지에 누락될 수 있음 | dictionary 갱신 후 결정적 `build:ko` 재생성 — **완료** | `ko.html`, static check |
| 98 | 캡처·fallback·axe·언어·미니랩 회귀가 수동 확인에 의존 | Playwright 계약을 Chromium/mobile/Firefox/WebKit에 유지 — **공동 완료** | `tests/landing-smoke.spec.ts`, config |
| 99 | Pages가 검사 전 바로 배포될 수 있음 | audit→build freshness→check→4-browser smoke→Lighthouse 후 deploy — **공동 완료** | `.github/workflows/pages.yml` |
| 100 | 저장소 내부 파일까지 Pages artifact에 섞일 수 있음 | `_site` public allowlist와 pinned Actions, 최소 deploy 권한 — **공동 완료** | Pages workflow |
| 101 | 취약 dependency·JS 보안·지원 밖 Node가 조용히 들어올 수 있음 | dependency review, CodeQL, Node 22–26 compatibility 계약 — **공동 완료** | `security.yml`, compatibility workflow |
| 102 | 실제 Lab 온보딩은 5단계인데 랜딩이 4단계라고 주장 | EN `five-step`, KO `5단계`로 동기화 — **완료** | index/i18n/ko 생성물 |

## 실행 검증 기록

| 검증 | 결과 | 비고 |
|---|---|---|
| `node --check` (main/orbit-console/reactbits/scene) | **PASS** | 네 런타임 소스 문법 확인 |
| `git diff --check` | **PASS** | whitespace 오류 없음 |
| `npm run build:hero` | **PASS** | `scene.bundle.js` 579,430 bytes, vendor 115,224 bytes |
| `npm run build:ko` | **PASS** | `ko.html` 결정적 재생성 |
| `npm run check` | **PASS** | 정적 자산·CSP·i18n·bundle freshness 통과 |
| `npm run audit` | **PASS** | high 이상 포함 취약점 0건 |
| Chromium 대표 자산/link smoke | **PASS** | 단독 재실행 1/1, 5.0 s |
| Chromium 전체 기능 assertion | **기능 17/17 확인** | 16개 연속 통과 후 1개가 assertion이 아닌 context teardown 30 s 초과; 해당 1개 단독 재실행 통과. 프로세스 경합 때문에 최종 전체 순차 gate는 루트 담당이 실행 |

## 변경 소유권

이 대장에서 직접 수정한 랜딩 소스는 `index.html`, `assets/main.js`, `assets/scene.js`, `assets/orbit-console.js`, `assets/reactbits.js`, `assets/landing.css`, `assets/i18n-core.js`와 그 결정적 생성물 `scene.bundle.js`, `animation-vendor.bundle.js`, `ko.html`이다. 워크플로·Playwright 확장은 병렬 CI 담당 변경을 보존하고 결과만 함께 기록했다.
