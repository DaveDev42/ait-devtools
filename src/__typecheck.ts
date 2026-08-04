/**
 * 타입 호환성 검증 파일
 *
 * 빌드에는 포함되지 않는다. tsc --noEmit으로만 실행.
 * @apps-in-toss/web-framework의 export와 mock의 export가 호환되는지 컴파일 타임에 검증한다.
 * SDK가 업데이트되어 시그니처가 바뀌면 여기서 에러가 발생한다.
 */

import type * as Original from '@apps-in-toss/web-framework';
import type { AssertCompat, AssertIfPresent, Expect } from './__typecheck-shared.js';
import type * as Mock from './mock/index-3x.js';

// --- Storage ---
type _StorageGetItem = Expect<
  AssertCompat<typeof Mock.Storage.getItem, typeof Original.Storage.getItem>
>;
type _StorageSetItem = Expect<
  AssertCompat<typeof Mock.Storage.setItem, typeof Original.Storage.setItem>
>;
type _StorageRemoveItem = Expect<
  AssertCompat<typeof Mock.Storage.removeItem, typeof Original.Storage.removeItem>
>;
type _StorageClearItems = Expect<
  AssertCompat<typeof Mock.Storage.clearItems, typeof Original.Storage.clearItems>
>;

// --- 인증/로그인 ---
type _AppLogin = Expect<AssertCompat<typeof Mock.appLogin, typeof Original.appLogin>>;
type _GetIsTossLoginIntegratedService = Expect<
  AssertCompat<
    typeof Mock.getIsTossLoginIntegratedService,
    typeof Original.getIsTossLoginIntegratedService
  >
>;
type _GetUserKeyForGame = Expect<
  AssertCompat<typeof Mock.getUserKeyForGame, typeof Original.getUserKeyForGame>
>;
type _AppsInTossSignTossCert = Expect<
  AssertCompat<typeof Mock.appsInTossSignTossCert, typeof Original.appsInTossSignTossCert>
>;

// 3.0 GA에서 다시 노출된 v2 호환 API. 두 facade 모두 엄격 검증한다.
type _GetConsentedUserData = Expect<
  AssertIfPresent<typeof Mock, typeof Original, 'getConsentedUserData'>
>;
type _GetAnonymousKey = Expect<
  AssertCompat<typeof Mock.getAnonymousKey, typeof Original.getAnonymousKey>
>;
type _GetDeclaredAgeRange = Expect<
  AssertCompat<typeof Mock.getDeclaredAgeRange, typeof Original.getDeclaredAgeRange>
>;

// --- 화면/네비게이션 ---
type _CloseView = Expect<AssertCompat<typeof Mock.closeView, typeof Original.closeView>>;
type _OpenURL = Expect<AssertCompat<typeof Mock.openURL, typeof Original.openURL>>;
type _Share = Expect<AssertCompat<typeof Mock.share, typeof Original.share>>;
type _GetTossShareLink = Expect<
  AssertCompat<typeof Mock.getTossShareLink, typeof Original.getTossShareLink>
>;
type _SetSecureScreen = Expect<
  AssertCompat<typeof Mock.setSecureScreen, typeof Original.setSecureScreen>
>;
type _SetScreenAwakeMode = Expect<
  AssertCompat<typeof Mock.setScreenAwakeMode, typeof Original.setScreenAwakeMode>
>;
type _SetIosSwipeGestureEnabled = Expect<
  AssertCompat<typeof Mock.setIosSwipeGestureEnabled, typeof Original.setIosSwipeGestureEnabled>
>;
type _SetDeviceOrientation = Expect<
  AssertCompat<typeof Mock.setDeviceOrientation, typeof Original.setDeviceOrientation>
>;

// --- 환경 정보 ---
type _GetPlatformOS = Expect<
  AssertCompat<typeof Mock.getPlatformOS, typeof Original.getPlatformOS>
>;
type _GetOperationalEnvironment = Expect<
  AssertCompat<typeof Mock.getOperationalEnvironment, typeof Original.getOperationalEnvironment>
>;
type _GetTossAppVersion = Expect<
  AssertCompat<typeof Mock.getTossAppVersion, typeof Original.getTossAppVersion>
>;
type _IsMinVersionSupported = Expect<
  AssertCompat<typeof Mock.isMinVersionSupported, typeof Original.isMinVersionSupported>
>;
type _GetSchemeUri = Expect<AssertCompat<typeof Mock.getSchemeUri, typeof Original.getSchemeUri>>;
type _GetLocale = Expect<AssertCompat<typeof Mock.getLocale, typeof Original.getLocale>>;
type _GetNetworkStatus = Expect<
  AssertCompat<typeof Mock.getNetworkStatus, typeof Original.getNetworkStatus>
>;
type _GetDeviceId = Expect<AssertCompat<typeof Mock.getDeviceId, typeof Original.getDeviceId>>;
type _GetServerTime = Expect<
  AssertCompat<typeof Mock.getServerTime, typeof Original.getServerTime>
>;
type _RequestReview = Expect<
  AssertCompat<typeof Mock.requestReview, typeof Original.requestReview>
>;
type _GetGroupId = Expect<AssertCompat<typeof Mock.getGroupId, typeof Original.getGroupId>>;
type _GetAppsInTossGlobals = Expect<
  AssertCompat<typeof Mock.getAppsInTossGlobals, typeof Original.getAppsInTossGlobals>
>;

// --- 디바이스: 카메라/앨범/연락처 ---
type _FetchAlbumItems = Expect<
  AssertCompat<typeof Mock.fetchAlbumItems, typeof Original.fetchAlbumItems>
>;
type _FetchAlbumPhotos = Expect<
  AssertCompat<typeof Mock.fetchAlbumPhotos, typeof Original.fetchAlbumPhotos>
>;
type _FetchContacts = Expect<
  AssertCompat<typeof Mock.fetchContacts, typeof Original.fetchContacts>
>;
type _OpenCamera = Expect<AssertCompat<typeof Mock.openCamera, typeof Original.openCamera>>;

// --- 디바이스: PDF ---
type _OpenPDFViewer = Expect<
  AssertCompat<typeof Mock.openPDFViewer, typeof Original.openPDFViewer>
>;

// --- 디바이스: 위치 ---
type _Accuracy = Expect<AssertCompat<typeof Mock.Accuracy, typeof Original.Accuracy>>;
type _GetCurrentLocation = Expect<
  AssertCompat<typeof Mock.getCurrentLocation, typeof Original.getCurrentLocation>
>;
type _StartUpdateLocation = Expect<
  AssertCompat<typeof Mock.startUpdateLocation, typeof Original.startUpdateLocation>
>;

// --- 디바이스: 클립보드 ---
type _GetClipboardText = Expect<
  AssertCompat<typeof Mock.getClipboardText, typeof Original.getClipboardText>
>;
type _SetClipboardText = Expect<
  AssertCompat<typeof Mock.setClipboardText, typeof Original.setClipboardText>
>;

// --- 디바이스: 기타 ---
type _GenerateHapticFeedback = Expect<
  AssertCompat<typeof Mock.generateHapticFeedback, typeof Original.generateHapticFeedback>
>;
type _SaveBase64Data = Expect<
  AssertCompat<typeof Mock.saveBase64Data, typeof Original.saveBase64Data>
>;

// --- IAP ---
type _IAPCreateOneTime = Expect<
  AssertCompat<
    typeof Mock.IAP.createOneTimePurchaseOrder,
    typeof Original.IAP.createOneTimePurchaseOrder
  >
>;
type _IAPCreateSubscription = Expect<
  AssertCompat<
    typeof Mock.IAP.createSubscriptionPurchaseOrder,
    typeof Original.IAP.createSubscriptionPurchaseOrder
  >
>;
type _IAPGetProducts = Expect<
  AssertCompat<typeof Mock.IAP.getProductItemList, typeof Original.IAP.getProductItemList>
>;
type _IAPGetPending = Expect<
  AssertCompat<typeof Mock.IAP.getPendingOrders, typeof Original.IAP.getPendingOrders>
>;
type _IAPGetCompletedOrRefunded = Expect<
  AssertCompat<
    typeof Mock.IAP.getCompletedOrRefundedOrders,
    typeof Original.IAP.getCompletedOrRefundedOrders
  >
>;
type _IAPCompleteGrant = Expect<
  AssertCompat<typeof Mock.IAP.completeProductGrant, typeof Original.IAP.completeProductGrant>
>;
type _IAPGetSubscriptionInfo = Expect<
  AssertCompat<typeof Mock.IAP.getSubscriptionInfo, typeof Original.IAP.getSubscriptionInfo>
>;

// --- 결제 ---
type _CheckoutPayment = Expect<
  AssertCompat<typeof Mock.checkoutPayment, typeof Original.checkoutPayment>
>;

// --- 광고: GoogleAdMob ---
type _GoogleAdMobLoad = Expect<
  AssertCompat<
    typeof Mock.GoogleAdMob.loadAppsInTossAdMob,
    typeof Original.GoogleAdMob.loadAppsInTossAdMob
  >
>;
type _GoogleAdMobShow = Expect<
  AssertCompat<
    typeof Mock.GoogleAdMob.showAppsInTossAdMob,
    typeof Original.GoogleAdMob.showAppsInTossAdMob
  >
>;
type _GoogleAdMobIsLoaded = Expect<
  AssertCompat<
    typeof Mock.GoogleAdMob.isAppsInTossAdMobLoaded,
    typeof Original.GoogleAdMob.isAppsInTossAdMobLoaded
  >
>;

// --- 광고: TossAds ---
type _TossAdsInit = Expect<
  AssertCompat<typeof Mock.TossAds.initialize, typeof Original.TossAds.initialize>
>;
type _TossAdsAttach = Expect<
  AssertCompat<typeof Mock.TossAds.attach, typeof Original.TossAds.attach>
>;
type _TossAdsAttachBanner = Expect<
  AssertCompat<typeof Mock.TossAds.attachBanner, typeof Original.TossAds.attachBanner>
>;
type _TossAdsDestroy = Expect<
  AssertCompat<typeof Mock.TossAds.destroy, typeof Original.TossAds.destroy>
>;
type _TossAdsDestroyAll = Expect<
  AssertCompat<typeof Mock.TossAds.destroyAll, typeof Original.TossAds.destroyAll>
>;

// --- 광고: FullScreenAd ---
type _LoadFullScreenAd = Expect<
  AssertCompat<typeof Mock.loadFullScreenAd, typeof Original.loadFullScreenAd>
>;
type _ShowFullScreenAd = Expect<
  AssertCompat<typeof Mock.showFullScreenAd, typeof Original.showFullScreenAd>
>;

// --- 이벤트 ---
type _GraniteEvent = Expect<AssertCompat<typeof Mock.graniteEvent, typeof Original.graniteEvent>>;
type _TdsEvent = Expect<AssertCompat<typeof Mock.tdsEvent, typeof Original.tdsEvent>>;
type _AppsInTossEvent = Expect<
  AssertCompat<typeof Mock.appsInTossEvent, typeof Original.appsInTossEvent>
>;
type _OnVisibilityChanged = Expect<
  AssertCompat<
    typeof Mock.onVisibilityChangedByTransparentServiceWeb,
    typeof Original.onVisibilityChangedByTransparentServiceWeb
  >
>;

// --- 게임/프로모션 ---
type _GrantPromotionReward = Expect<
  AssertCompat<typeof Mock.grantPromotionReward, typeof Original.grantPromotionReward>
>;
type _GrantPromotionRewardForGame = Expect<
  AssertCompat<typeof Mock.grantPromotionRewardForGame, typeof Original.grantPromotionRewardForGame>
>;
type _SubmitGameCenterLeaderBoardScore = Expect<
  AssertCompat<
    typeof Mock.submitGameCenterLeaderBoardScore,
    typeof Original.submitGameCenterLeaderBoardScore
  >
>;
type _GetGameCenterGameProfile = Expect<
  AssertCompat<typeof Mock.getGameCenterGameProfile, typeof Original.getGameCenterGameProfile>
>;
type _OpenGameCenterLeaderboard = Expect<
  AssertCompat<typeof Mock.openGameCenterLeaderboard, typeof Original.openGameCenterLeaderboard>
>;
type _ContactsViral = Expect<
  AssertCompat<typeof Mock.contactsViral, typeof Original.contactsViral>
>;

// --- 로깅 ---
type _EventLog = Expect<AssertCompat<typeof Mock.eventLog, typeof Original.eventLog>>;

// --- Analytics (web-analytics) ---
type _AnalyticsScreen = Expect<
  AssertCompat<typeof Mock.Analytics.screen, typeof Original.Analytics.screen>
>;
type _AnalyticsImpression = Expect<
  AssertCompat<typeof Mock.Analytics.impression, typeof Original.Analytics.impression>
>;
type _AnalyticsClick = Expect<
  AssertCompat<typeof Mock.Analytics.click, typeof Original.Analytics.click>
>;

// --- SafeAreaInsets ---
type _SafeAreaInsetsGet = Expect<
  AssertCompat<typeof Mock.SafeAreaInsets.get, typeof Original.SafeAreaInsets.get>
>;
type _SafeAreaInsetsSubscribe = Expect<
  AssertCompat<typeof Mock.SafeAreaInsets.subscribe, typeof Original.SafeAreaInsets.subscribe>
>;
type _GetSafeAreaInsets = Expect<
  AssertCompat<typeof Mock.getSafeAreaInsets, typeof Original.getSafeAreaInsets>
>;

// --- env ---
type _EnvGetDeploymentId = Expect<
  AssertCompat<typeof Mock.env.getDeploymentId, typeof Original.env.getDeploymentId>
>;

// --- Partner ---
type _PartnerAddBtn = Expect<
  AssertCompat<typeof Mock.partner.addAccessoryButton, typeof Original.partner.addAccessoryButton>
>;
type _PartnerRemoveBtn = Expect<
  AssertCompat<
    typeof Mock.partner.removeAccessoryButton,
    typeof Original.partner.removeAccessoryButton
  >
>;

// --- 권한 ---
type _GetPermission = Expect<
  AssertCompat<typeof Mock.getPermission, typeof Original.getPermission>
>;
type _OpenPermissionDialog = Expect<
  AssertCompat<typeof Mock.openPermissionDialog, typeof Original.openPermissionDialog>
>;
type _RequestPermission = Expect<
  AssertCompat<typeof Mock.requestPermission, typeof Original.requestPermission>
>;

// --- PermissionError 계층 (web-framework 3.0+ 신규, runtime class) ---
// base PermissionError는 2.x stable 라인 public surface에 부재(서브클래스 7개는 존재).
// AssertIfPresent로 capability-gate: 3.0에선 존재→엄격 검증, 2.x에선 skip(true).
type _PermissionError = Expect<AssertIfPresent<typeof Mock, typeof Original, 'PermissionError'>>;
type _FetchAlbumPhotosPermissionError = Expect<
  AssertCompat<
    typeof Mock.FetchAlbumPhotosPermissionError,
    typeof Original.FetchAlbumPhotosPermissionError
  >
>;
type _FetchContactsPermissionError = Expect<
  AssertCompat<
    typeof Mock.FetchContactsPermissionError,
    typeof Original.FetchContactsPermissionError
  >
>;
type _GetClipboardTextPermissionError = Expect<
  AssertCompat<
    typeof Mock.GetClipboardTextPermissionError,
    typeof Original.GetClipboardTextPermissionError
  >
>;
type _GetCurrentLocationPermissionError = Expect<
  AssertCompat<
    typeof Mock.GetCurrentLocationPermissionError,
    typeof Original.GetCurrentLocationPermissionError
  >
>;
type _OpenCameraPermissionError = Expect<
  AssertCompat<typeof Mock.OpenCameraPermissionError, typeof Original.OpenCameraPermissionError>
>;
type _SetClipboardTextPermissionError = Expect<
  AssertCompat<
    typeof Mock.SetClipboardTextPermissionError,
    typeof Original.SetClipboardTextPermissionError
  >
>;
type _StartUpdateLocationPermissionError = Expect<
  AssertCompat<
    typeof Mock.StartUpdateLocationPermissionError,
    typeof Original.StartUpdateLocationPermissionError
  >
>;

// --- 알림 ---
type _RequestNotificationAgreement = Expect<
  AssertCompat<
    typeof Mock.requestNotificationAgreement,
    typeof Original.requestNotificationAgreement
  >
>;

// --- 3.x 도메인 facade와 bridge factory ---
type _Clipboard = Expect<AssertCompat<typeof Mock.Clipboard, typeof Original.Clipboard>>;
type _Device = Expect<AssertCompat<typeof Mock.Device, typeof Original.Device>>;
type _Environment = Expect<AssertCompat<typeof Mock.Environment, typeof Original.Environment>>;
type _File = Expect<AssertCompat<typeof Mock.File, typeof Original.File>>;
type _Game = Expect<AssertCompat<typeof Mock.Game, typeof Original.Game>>;
type _Notification = Expect<AssertCompat<typeof Mock.Notification, typeof Original.Notification>>;
type _Promotion = Expect<AssertCompat<typeof Mock.Promotion, typeof Original.Promotion>>;
type _Review = Expect<AssertCompat<typeof Mock.Review, typeof Original.Review>>;
type _SafeArea = Expect<AssertCompat<typeof Mock.SafeArea, typeof Original.SafeArea>>;
type _Screen = Expect<AssertCompat<typeof Mock.Screen, typeof Original.Screen>>;
type _ShareDomain = Expect<AssertCompat<typeof Mock.Share, typeof Original.Share>>;
type _TossAuth = Expect<AssertCompat<typeof Mock.TossAuth, typeof Original.TossAuth>>;
type _TossPay = Expect<AssertCompat<typeof Mock.TossPay, typeof Original.TossPay>>;
type _User = Expect<AssertCompat<typeof Mock.User, typeof Original.User>>;
type _RequestTossPayPaysBilling = Expect<
  AssertCompat<typeof Mock.requestTossPayPaysBilling, typeof Original.requestTossPayPaysBilling>
>;
type _CreateAsyncBridge = Expect<
  AssertCompat<typeof Mock.createAsyncBridge, typeof Original.createAsyncBridge>
>;
type _CreateConstantBridge = Expect<
  AssertCompat<typeof Mock.createConstantBridge, typeof Original.createConstantBridge>
>;
type _CreateEventBridge = Expect<
  AssertCompat<typeof Mock.createEventBridge, typeof Original.createEventBridge>
>;
