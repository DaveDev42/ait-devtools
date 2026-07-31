// Korean string catalog (source of truth — keys are typed from this file).
// Keys follow `<area>.<purpose>` convention. Variable interpolation uses
// `{name}` placeholders resolved by `t(key, { name: value })`.
//
// Some chrome (button labels like "Load", "Show", "Clear", "Apply") is left as
// English in both locales because the panel is an internal devtools surface
// and these terms are universally recognised by developers in both locales.

export const ko = {
  // Panel chrome
  'panel.title': 'AIT DevTools',
  'panel.toggle.title': 'AIT DevTools',
  'panel.close': 'Close',
  'panel.editMode.on': 'EDIT',
  'panel.editMode.off': 'READ-ONLY',
  'panel.editMode.toggleTitle': '패널 편집 모드 전환',
  'panel.tabError': '"{tab}" 탭 렌더링 중 오류가 발생했습니다.',

  // Tab names
  'panel.tab.env': 'Environment',
  'panel.tab.presets': 'Presets',
  'panel.tab.viewport': 'Viewport',
  'panel.tab.permissions': 'Permissions',
  'panel.tab.notifications': 'Notifications',
  'panel.tab.location': 'Location',
  'panel.tab.device': 'Device',
  'panel.tab.iap': 'IAP',
  'panel.tab.ads': 'Ads',
  'panel.tab.events': 'Events',
  'panel.tab.analytics': 'Analytics',
  'panel.tab.storage': 'Storage',

  // Common
  'common.readOnly': '읽기 전용 — mock 응답은 빌드 타임에 고정됩니다.',

  // Environment tab
  'env.section.platform': 'Platform',
  'env.row.os': 'OS',
  'env.row.appVersion': 'App Version',
  'env.row.environment': 'Environment',
  'env.row.locale': 'Locale',
  'env.section.network': 'Network',
  'env.row.networkStatus': 'Status',
  'env.section.safeArea': 'Safe Area Insets',
  'env.row.safeArea.top': 'Top',
  'env.row.safeArea.bottom': 'Bottom',
  'env.section.navigation': 'Navigation',
  'env.row.iosSwipeGesture': 'iOS swipe-back',
  'env.value.iosSwipeGesture.unset': '미호출',
  'env.value.iosSwipeGesture.enabled': 'enabled',
  'env.value.iosSwipeGesture.disabled': 'disabled',
  'env.hint.iosSwipeGesture':
    'setIosSwipeGestureEnabled의 마지막 호출값. Environment를 toss로 바꾸면 toss-gated 가드가 이 값을 토글합니다.',

  // Environment > Language toggle
  'env.section.language': 'Language',
  'env.language.row': 'Language',
  'env.language.ko': '한국어',
  'env.language.en': 'English',

  // Permissions tab
  'permissions.section.device': 'Device Permissions',

  // Location tab
  'location.section.current': 'Current Location',
  'location.row.latitude': 'Latitude',
  'location.row.longitude': 'Longitude',
  'location.row.accuracy': 'Accuracy',

  // Device tab
  'device.section.modes': 'Device API Modes',
  'device.row.camera': 'Camera',
  'device.row.photos': 'Photos',
  'device.row.location': 'Location',
  'device.row.network': 'Network',
  'device.row.clipboard': 'Clipboard',
  'device.section.mockImages': 'Mock Images ({count})',
  'device.btn.add': '+ Add',
  'device.btn.useDefaults': 'Use defaults',
  'device.btn.clear': 'Clear',
  'device.prompt.camera.title': 'Camera Prompt — 이미지를 선택하세요',
  'device.prompt.photos.title': 'Photos Prompt — 이미지를 선택하세요',
  'device.prompt.location.title': 'Location Prompt — 좌표 입력',
  'device.prompt.locationUpdate.title': 'Location Update — 좌표 전송',
  'device.prompt.fallbackTitle': 'Prompt: {type}',
  'device.prompt.label.lat': 'Lat',
  'device.prompt.label.lng': 'Lng',
  'device.prompt.send': 'Send',
  'device.prompt.cancel': 'Cancel',

  // Device tab — Haptic section
  'device.section.haptic': 'Haptic',
  'device.haptic.lastCall': '마지막 haptic',
  'device.haptic.noneYet': '(아직 없음)',
  'device.haptic.trigger': 'Haptic 트리거',

  // Viewport tab
  'viewport.section.device': 'Device',
  'viewport.row.preset': 'Preset',
  'viewport.row.orientation': 'Orientation',
  'viewport.row.notchSide': 'Notch side',
  'viewport.section.custom': 'Custom size',
  'viewport.row.width': 'Width (px)',
  'viewport.row.height': 'Height (px)',
  'viewport.section.appearance': 'Appearance',
  'viewport.row.showFrame': 'Show frame',
  'viewport.row.showAitNavBar': 'Apps in Toss 내비게이션 바 표시',
  'viewport.row.navBarType': 'Nav bar type',
  'viewport.status.noConstraint': '뷰포트 제약 없음 — body가 창을 가득 채웁니다.',
  'viewport.status.cssPhysical': 'CSS / physical',
  'viewport.status.safeArea': 'Safe area',
  'viewport.status.aitNavBar': 'AIT nav bar',
  'viewport.status.aitNavBarValue': '{height}px → SafeArea top · {type}',
  'viewport.orientation.autoSuffix': '{orient} (auto)',

  // IAP tab
  'iap.section.simulator': 'IAP Simulator',
  'iap.row.nextResult': 'Next Purchase Result',
  'iap.section.tossPay': 'TossPay',
  'iap.row.tossPayResult': 'Next Payment Result',
  'iap.section.pending': 'Pending Orders ({count})',
  'iap.empty.pending': '(대기 중인 주문 없음)',
  'iap.section.completed': 'Completed Orders ({count})',
  'iap.empty.completed': '(완료된 주문 없음)',
  'iap.btn.complete': 'Complete',
  'iap.label.pending': 'PENDING',

  // Events tab
  'events.section.navigation': 'Navigation Events',
  'events.btn.triggerBack': 'Back 이벤트 발생',
  'events.btn.triggerHome': 'Home 이벤트 발생',
  'events.section.login': 'Login',
  'events.row.loggedIn': 'Logged In',
  'events.row.tossLoginIntegrated': 'Toss Login Integrated',

  // Analytics tab
  'analytics.section.log': 'Analytics Log ({count})',
  'analytics.btn.clear': 'Clear',
  'analytics.calls.section': 'SDK Calls ({count})',
  'analytics.calls.btn.clear': 'Clear',
  'analytics.calls.empty': '(아직 SDK 호출 없음)',

  // Storage tab
  'storage.section.title': 'Storage ({count} items)',
  'storage.btn.clearAll': 'Clear All',
  'storage.empty': '저장된 항목이 없습니다',

  // Presets tab
  'presets.section.builtIn': 'Built-in scenarios',
  'presets.section.saved': 'Saved presets ({count})',
  'presets.section.save': 'Save',
  'presets.save.description':
    'network / permissions / auth / IAP / ads / payment 슬라이스를 캡처합니다.',
  'presets.btn.saveCurrent': '현재 상태를 프리셋으로 저장',
  'presets.btn.apply': 'Apply',
  'presets.btn.reApply': 'Re-apply',
  'presets.btn.delete': 'Delete',
  'presets.empty.saved': '저장된 프리셋이 아직 없습니다.',
  'presets.empty.builtIn': '내장 프리셋이 없습니다.',
  'presets.prompt.label': '프리셋 라벨을 입력하세요',
  'presets.confirm.delete': '"{label}" 프리셋을 삭제할까요?',

  // Ads tab
  'ads.section.state': 'Ads State',
  'ads.row.isLoaded': 'isLoaded',
  'ads.row.forceNoFill': '강제 "no fill"',
  'ads.empty.events': '아직 이벤트가 없습니다',
  'ads.section.googleAdMob': 'GoogleAdMob',
  'ads.section.tossAds': 'TossAds',
  'ads.section.fullScreenAd': 'FullScreenAd',
  'ads.btn.load': 'Load',
  'ads.btn.show': 'Show',
  'ads.section.tossAdsBanner': 'TossAds 배너',
  'ads.row.rewardUnitType': '리워드 단위 타입',
  'ads.row.rewardAmount': '리워드 수량',
  'ads.btn.render': 'Render',
  'ads.btn.noFill': 'No-fill',
  'ads.btn.click': 'Click',
  'ads.btn.destroy': 'Destroy',

  // Notifications tab
  'notifications.section.title': 'requestNotificationAgreement',
  'notifications.option.newAgreement': 'newAgreement (최초 동의)',
  'notifications.option.alreadyAgreed': 'alreadyAgreed (이미 동의됨)',
  'notifications.option.agreementRejected': 'agreementRejected (사용자 거절)',

  // Launcher PWA
  'launcher.title': 'AITC DevTools Launcher',
  'launcher.description': '터미널 QR을 스캔하거나 URL을 입력하세요.',
  'launcher.installCta': '폰에 런처 설치하기',
  'launcher.urlPlaceholder': 'https://example.trycloudflare.com',
  'launcher.openBtn': 'Open',
  'launcher.scanBtn': 'QR 카메라로 스캔',
  'launcher.noCamera': '카메라를 사용할 수 없습니다 — URL을 직접 붙여넣으세요.',
  'launcher.cameraError': '카메라에 접근할 수 없습니다 — URL을 직접 붙여넣으세요.',
  'launcher.invalidUrlHttps': '올바른 https:// URL을 입력하세요 (터미널의 터널 URL).',
  'launcher.invalidUrl': '올바른 http(s):// URL을 입력하세요.',
  'launcher.debugAuthFailed': '디버그 연결 인증 실패',
  'launcher.debugAuthFailedHint': 'QR 코드가 만료되었을 수 있어요. 새 QR을 다시 스캔하세요.',
  'launcher.debugAuthExpiredHint':
    '디버그 세션이 만료됐어요. Mac의 attach 페이지에서 새 QR을 스캔하세요.',
  'launcher.debugAuthRescanCta': '새 QR 스캔하기',
  'launcher.diagTitle': '뷰포트 진단',
  'launcher.diagYes': '예',
  'launcher.diagNo': '아니요',
  'launcher.letterboxDetected':
    'iOS 뷰포트 제약으로 화면 아래 {pt}pt가 잘릴 수 있습니다 — 기기를 가로로 돌렸다 세로로 복귀하면 해소될 수 있어요.',
  'launcher.letterboxClipped':
    'iOS 뷰포트 버그로 화면 아래 {pt}pt를 쓸 수 없습니다 — 기기를 가로로 돌렸다 세로로 돌리면 복구될 수 있어요.',
  // #536: verdict reason labels for diag panel
  'launcher.diagVerdictLabel': '판정 사유',
  'launcher.diagSafeAreaTrace': 'top 재측정 추이',
  'launcher.diagVerdict.detected': '✓ letterbox 보정',
  'launcher.diagVerdict.notStandalone': '홈 화면 앱 아님',
  'launcher.diagVerdict.landscape': '가로 모드',
  'launcher.diagVerdict.shortfallTooSmall': '높이 차이 미달',
  'launcher.diagVerdict.safeAreaTopZero': 'top=0 (env() stale?)',
  // Nav-bar emulation (#495/#510)
  'launcher.navbar.defaultTitle': '미니앱',
  'launcher.navbar.back': '뒤로가기',
  'launcher.navbar.menu': '메뉴',
  'launcher.navbar.close': '닫기',
  'launcher.navbar.menuRescan': '다시 스캔',
  'launcher.navbar.menuDiag': '뷰포트 진단',
  'launcher.navbar.menuLanguage': '언어',
} as const;

export type StringKey = keyof typeof ko;
