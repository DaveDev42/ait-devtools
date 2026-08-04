/** web-framework 3.x domain facade built on the shared mock behavior. */

import type * as SDK from '@apps-in-toss/web-framework';
import * as legacy from './index.js';
import { withSdkSupport } from './sdk-support.js';
import { aitState } from './state.js';

type VersionMap = Readonly<Record<string, string>>;

function supported<T>(fn: unknown, minTossAppVersion?: VersionMap, minOsVersion?: VersionMap): T {
  return withSdkSupport(fn as (...args: never[]) => unknown, {
    ...(minTossAppVersion ? { MIN_TOSS_APP_VERSION: minTossAppVersion } : {}),
    ...(minOsVersion ? { MIN_OS_VERSION: minOsVersion } : {}),
  }) as unknown as T;
}

const V = {
  anonymousKey: { android: '5.232.0', ios: '5.232.0' },
  contactsViral: { android: '5.223.0', ios: '5.223.0' },
  consentedData: { android: '5.264.0', ios: '5.264.0' },
  fileSave: { android: '5.218.0', ios: '5.216.0' },
  game: { android: '5.221.0', ios: '5.221.0' },
  iapCompleteGrant: { android: '5.233.0', ios: '5.233.0' },
  iapOneTime: { android: '5.219.0', ios: '5.219.0' },
  iapPending: { android: '5.234.0', ios: '5.231.0' },
  iapSubscription: { android: '5.248.0', ios: '5.249.0' },
  iapSubscriptionInfo: { android: '5.253.0', ios: '5.250.0' },
  notification: { android: '5.255.0', ios: '5.255.0' },
  pdf: { android: '5.261.0', ios: '5.261.0' },
  promotion: { android: '5.232.0', ios: '5.232.0' },
  review: { android: '5.253.0', ios: '5.253.0' },
  serverTime: { android: '5.245.0', ios: '5.245.0' },
  sign: { android: '5.233.0', ios: '5.233.0' },
  tossLogin: { android: '5.237.0', ios: '5.237.0' },
  tossPayBilling: { android: '5.256.0', ios: '5.256.0' },
  orientation: { android: '5.215.0', ios: '5.215.0' },
} as const;

// Deprecated flat functions retained by 3.x. The SDK adds runtime metadata to
// these aliases, so expose the same function identity with the same fields.
export const getIsTossLoginIntegratedService = supported<
  typeof SDK.getIsTossLoginIntegratedService
>(legacy.getIsTossLoginIntegratedService, V.tossLogin);
export const getUserKeyForGame = supported<typeof SDK.getUserKeyForGame>(
  legacy.getUserKeyForGame,
  V.anonymousKey,
);
export const getAnonymousKey = supported<typeof SDK.getAnonymousKey>(
  legacy.getAnonymousKey,
  V.anonymousKey,
);
export const appsInTossSignTossCert = supported<typeof SDK.appsInTossSignTossCert>(
  legacy.appsInTossSignTossCert,
  V.sign,
);
export const getConsentedUserData = supported<typeof SDK.getConsentedUserData>(
  legacy.getConsentedUserData,
  V.consentedData,
);
export const getDeclaredAgeRange = supported<typeof SDK.getDeclaredAgeRange>(
  legacy.getDeclaredAgeRange,
  { ios: '5.266.0' },
  { ios: '26.0' },
);
export const setDeviceOrientation = supported<typeof SDK.setDeviceOrientation>(
  legacy.setDeviceOrientation,
  V.orientation,
);
export const getServerTime = supported<typeof SDK.getServerTime>(
  legacy.getServerTime,
  V.serverTime,
);
export const requestReview = supported<typeof SDK.requestReview>(legacy.requestReview, V.review);
export const openPDFViewer = supported<typeof SDK.openPDFViewer>(legacy.openPDFViewer, V.pdf);
export const saveBase64Data = supported<typeof SDK.saveBase64Data>(
  legacy.saveBase64Data,
  V.fileSave,
);
export const grantPromotionReward = supported<typeof SDK.grantPromotionReward>(
  legacy.grantPromotionReward,
  V.promotion,
);
export const grantPromotionRewardForGame = supported<typeof SDK.grantPromotionRewardForGame>(
  legacy.grantPromotionRewardForGame,
  V.promotion,
);
export const submitGameCenterLeaderBoardScore = supported<
  typeof SDK.submitGameCenterLeaderBoardScore
>(legacy.submitGameCenterLeaderBoardScore, V.game);
export const getGameCenterGameProfile = supported<typeof SDK.getGameCenterGameProfile>(
  legacy.getGameCenterGameProfile,
  V.game,
);
export const openGameCenterLeaderboard = supported<typeof SDK.openGameCenterLeaderboard>(
  legacy.openGameCenterLeaderboard,
  V.game,
);
export const contactsViral = supported<typeof SDK.contactsViral>(
  legacy.contactsViral,
  V.contactsViral,
);
export const requestNotificationAgreement = supported<typeof SDK.requestNotificationAgreement>(
  legacy.requestNotificationAgreement,
  V.notification,
);
export const requestTossPayPaysBilling = supported<typeof SDK.requestTossPayPaysBilling>(
  legacy.requestTossPayPaysBilling,
  V.tossPayBilling,
);

// 3.x reads host constants synchronously. The 2.x facade intentionally keeps
// the measured legacy Promise behavior in the shared flat implementations.
export const getPlatformOS: typeof SDK.getPlatformOS = () => aitState.state.platform;
export const getOperationalEnvironment: typeof SDK.getOperationalEnvironment = () =>
  aitState.state.environment;
export const getLocale: typeof SDK.getLocale = () => aitState.state.locale;
export const getDeviceId: typeof SDK.getDeviceId = () => aitState.state.deviceId;
export const getSchemeUri: typeof SDK.getSchemeUri = () =>
  aitState.state.schemeUri || window.location.pathname;
export const getSafeAreaInsets: typeof SDK.getSafeAreaInsets = () => ({
  ...aitState.state.safeAreaInsets,
});

export const isMinVersionSupported: typeof SDK.isMinVersionSupported = (minVersions) => {
  if (aitState.state.environment === 'sandbox') return true;
  const required = aitState.state.platform === 'ios' ? minVersions.ios : minVersions.android;
  if (required === undefined || required === 'never') return false;
  if (required === 'always') return true;
  const current = aitState.state.appVersion.split('.').map(Number);
  const minimum = required.split('.').map(Number);
  for (let i = 0; i < Math.max(current.length, minimum.length); i++) {
    if ((current[i] ?? 0) > (minimum[i] ?? 0)) return true;
    if ((current[i] ?? 0) < (minimum[i] ?? 0)) return false;
  }
  return true;
};

type LoadAdMobArgs = Parameters<typeof SDK.GoogleAdMob.loadAppsInTossAdMob>[0];
type ShowAdMobArgs = Parameters<typeof SDK.GoogleAdMob.showAppsInTossAdMob>[0];
type LoadFullScreenArgs = Parameters<typeof SDK.loadFullScreenAd>[0];
type ShowFullScreenArgs = Parameters<typeof SDK.showFullScreenAd>[0];

const loadAppsInTossAdMob = ((args: LoadAdMobArgs) =>
  legacy.GoogleAdMob.loadAppsInTossAdMob({
    ...args,
    options: args.options ?? { adGroupId: 'mock-ad-group' },
    onError: (error: unknown) =>
      args.onError(error instanceof Error ? error : new Error(String(error))),
  })) as typeof SDK.GoogleAdMob.loadAppsInTossAdMob;
loadAppsInTossAdMob.isSupported = () => true;

const showAppsInTossAdMob = ((args: ShowAdMobArgs) =>
  legacy.GoogleAdMob.showAppsInTossAdMob({
    ...args,
    options: args.options ?? { adGroupId: 'mock-ad-group' },
    onError: (error: unknown) =>
      args.onError(error instanceof Error ? error : new Error(String(error))),
  })) as typeof SDK.GoogleAdMob.showAppsInTossAdMob;
showAppsInTossAdMob.isSupported = () => true;

export const GoogleAdMob = {
  ...legacy.GoogleAdMob,
  loadAppsInTossAdMob,
  showAppsInTossAdMob,
} as typeof SDK.GoogleAdMob;

export const loadFullScreenAd = Object.assign(
  (args: LoadFullScreenArgs) =>
    legacy.loadFullScreenAd({
      ...args,
      options: args.options ?? { adGroupId: 'mock-ad-group' },
      onError: (error: unknown) =>
        args.onError(error instanceof Error ? error : new Error(String(error))),
    }),
  { isSupported: () => true },
) as typeof SDK.loadFullScreenAd;

export const showFullScreenAd = Object.assign(
  (args: ShowFullScreenArgs) =>
    legacy.showFullScreenAd({
      ...args,
      options: args.options ?? { adGroupId: 'mock-ad-group' },
      onError: (error: unknown) =>
        args.onError(error instanceof Error ? error : new Error(String(error))),
    }),
  { isSupported: () => true },
) as typeof SDK.showFullScreenAd;

export const IAP = {
  createOneTimePurchaseOrder: supported<typeof SDK.IAP.createOneTimePurchaseOrder>(
    legacy.IAP.createOneTimePurchaseOrder,
    V.iapOneTime,
  ),
  createSubscriptionPurchaseOrder: supported<typeof SDK.IAP.createSubscriptionPurchaseOrder>(
    legacy.IAP.createSubscriptionPurchaseOrder,
    V.iapSubscription,
  ),
  getProductItemList: supported<typeof SDK.IAP.getProductItemList>(
    legacy.IAP.getProductItemList,
    V.iapOneTime,
  ),
  getPendingOrders: supported<typeof SDK.IAP.getPendingOrders>(
    legacy.IAP.getPendingOrders,
    V.iapPending,
  ),
  getCompletedOrRefundedOrders: supported<typeof SDK.IAP.getCompletedOrRefundedOrders>(
    legacy.IAP.getCompletedOrRefundedOrders,
    V.iapPending,
  ),
  completeProductGrant: supported<typeof SDK.IAP.completeProductGrant>(
    legacy.IAP.completeProductGrant,
    V.iapCompleteGrant,
  ),
  getSubscriptionInfo: supported<typeof SDK.IAP.getSubscriptionInfo>(
    legacy.IAP.getSubscriptionInfo,
    V.iapSubscriptionInfo,
  ),
} as typeof SDK.IAP;

export const Clipboard = {
  getText: legacy.getClipboardText,
  setText: legacy.setClipboardText,
} as typeof SDK.Clipboard;

export const Device = {
  get locale() {
    return aitState.state.locale;
  },
  get os() {
    return aitState.state.platform;
  },
  getPhotos: legacy.fetchAlbumPhotos,
  getContacts: legacy.fetchContacts,
  getLocation: legacy.getCurrentLocation,
  openCamera: legacy.openCamera,
  getAlbumItems: legacy.fetchAlbumItems,
  triggerHaptic: legacy.generateHapticFeedback,
  subscribeLocation: legacy.startUpdateLocation,
  openURL: legacy.openURL,
} as typeof SDK.Device;

export const Environment = {
  get deviceId() {
    return aitState.state.deviceId;
  },
  get groupId() {
    return aitState.state.groupId;
  },
  get environment() {
    return aitState.state.environment;
  },
  get tossAppVersion() {
    return aitState.state.appVersion;
  },
  get deploymentId() {
    return aitState.state.deploymentId;
  },
  get initialURL() {
    return aitState.state.schemeUri || window.location.pathname;
  },
  getNetworkStatus: legacy.getNetworkStatus,
  getServerTime,
} as typeof SDK.Environment;

export const File = { saveBase64: saveBase64Data, openPDFViewer } as typeof SDK.File;
export const Game = {
  openLeaderboard: openGameCenterLeaderboard,
  setLeaderboardScore: submitGameCenterLeaderBoardScore,
  getUserProfile: getGameCenterGameProfile,
} as typeof SDK.Game;
export const Notification = {
  requestAgreement: requestNotificationAgreement,
} as typeof SDK.Notification;
export const Promotion = {
  grantReward: supported<typeof SDK.Promotion.grantReward>(
    (params: { promotionCode: string; amount: number }) => legacy.grantPromotionReward({ params }),
    V.promotion,
  ),
  openContactsInvite: contactsViral,
} as typeof SDK.Promotion;
export const Review = { request: requestReview } as typeof SDK.Review;
export const SafeArea = legacy.SafeAreaInsets as typeof SDK.SafeArea;
export const Screen = {
  close: legacy.closeView,
  setAwakeMode: legacy.setScreenAwakeMode,
  setSecure: legacy.setSecureScreen,
  setIosSwipeBack: legacy.setIosSwipeGestureEnabled,
  setOrientation: setDeviceOrientation,
} as typeof SDK.Screen;
export const Share = {
  createLink: ({ path, ogImageUrl }: { path: string; ogImageUrl?: string }) =>
    legacy.getTossShareLink(path, ogImageUrl),
  sendMessage: legacy.share,
} as typeof SDK.Share;
export const TossAuth = {
  login: legacy.appLogin,
  isIntegrated: getIsTossLoginIntegratedService,
  sign: appsInTossSignTossCert,
} as typeof SDK.TossAuth;

const authorizeSubscription = supported<typeof SDK.TossPay.authorizeSubscription>(
  (params: { wrappedToken: string }) => legacy.requestTossPayPaysBilling({ params }),
  V.tossPayBilling,
);
export const TossPay = {
  authorize: (params: { payToken: string }) => legacy.checkoutPayment({ params }),
  authorizeSubscription,
  checkoutPayment: legacy.checkoutPayment,
  requestTossPayPaysBilling,
} as typeof SDK.TossPay;

const userAnonymousKey = supported<typeof SDK.User.getAnonymousKey>(async () => {
  const result = await legacy.getAnonymousKey();
  if (!result || result === 'ERROR') throw new Error('Unable to create a mock anonymous key');
  return result;
}, V.anonymousKey);
export const User = {
  getAnonymousKey: userAnonymousKey,
  getConsentedData: getConsentedUserData,
  getDeclaredAgeRange,
} as typeof SDK.User;
