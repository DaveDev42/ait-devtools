# 앱인토스 미니앱 데모 (Vite + React)

`ait-devtools` Mock SDK를 활용한 미니앱 예제입니다.

## 실행 방법

```bash
cd examples/vite-react
npm install
npm run dev
```

## 데모 기능

| 기능 | SDK API |
|------|---------|
| 로그인 | `appLogin()` |
| 스토리지 | `Storage.setItem()` / `Storage.getItem()` |
| 환경 정보 | `getPlatformOS()` / `getOperationalEnvironment()` / `getNetworkStatus()` |
| 위치 | `getCurrentLocation()` |
| 햅틱 | `generateHapticFeedback()` |
| 인앱결제 | `IAP.getProductItemList()` |
| 애널리틱스 | `Analytics.click()` |
| 이벤트 | `graniteEvent.addEventListener('backEvent')` |

브라우저에서 실행하면 화면 우측 하단에 **ait-devtools 패널**이 자동으로 표시됩니다. 패널에서 OS, 네트워크, 권한 등 mock 상태를 변경하며 테스트할 수 있습니다.
