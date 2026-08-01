---
'@ait-co/devtools': patch
---

EOL 준비 — 사라질 `aitc.dev` 링크를 GitHub 소스로 옮기고 README ko/en에 EOL 안내를 추가합니다.

`aitc.dev` 도메인과 그 위의 사이트가 종료되므로, 이 패키지가 밖으로 내보내는 링크를 GitHub로 교체했습니다: npm 페이지가 쓰는 `homepage`(`devtools.aitc.dev` → repo URL), README ko/en의 라이브 데모·sdk-example 데모 링크, fixture `llms.txt`의 sdk-example·org 링크. README ko/en 상단에는 유지보수 중단·repo archive·npm 패키지 유지·도메인 종료를 알리는 평문 단락을 추가했습니다.

환경 2 launcher PWA 호스트(`https://devtools.aitc.dev/launcher/`)는 대체 호스트가 없어 `src/unplugin/tunnel.ts`의 상수를 **그대로 뒀습니다** — 동작 변화 없음. 대신 그 값 옆 주석과 README·`docs/scenarios/env-2.md`에 이 호스트가 도메인 정리와 함께 사라진다는 사실을 남겼습니다.
