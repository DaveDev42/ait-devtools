export type Primitive = string | number | boolean | null | undefined | symbol;

export type PlatformOS = 'ios' | 'android';
export type OperationalEnvironment = 'toss' | 'sandbox';
export type NetworkStatus = 'OFFLINE' | 'WIFI' | '2G' | '3G' | '4G' | '5G' | 'WWAN' | 'UNKNOWN';
export type PermissionStatus = 'notDetermined' | 'denied' | 'allowed';
export type PermissionName =
  | 'clipboard'
  | 'contacts'
  | 'photos'
  | 'geolocation'
  | 'camera'
  | 'microphone';
export type HapticFeedbackType =
  | 'tickWeak'
  | 'tap'
  | 'tickMedium'
  | 'softMedium'
  | 'basicWeak'
  | 'basicMedium'
  | 'success'
  | 'error'
  | 'wiggle'
  | 'confetti';

export type DeviceApiMode = 'mock' | 'web' | 'prompt';

export interface DeviceModes {
  camera: DeviceApiMode;
  photos: DeviceApiMode;
  location: DeviceApiMode;
  network: 'mock' | 'web';
  clipboard: 'mock' | 'web';
}

export interface MockData {
  images: string[];
  clipboardText: string;
}

export interface LocationCoords {
  latitude: number;
  longitude: number;
  altitude: number;
  accuracy: number;
  altitudeAccuracy: number;
  heading: number;
}

export interface MockLocation {
  coords: LocationCoords;
  timestamp: number;
  accessLocation?: 'FINE' | 'COARSE';
}

export interface MockContact {
  name: string;
  phoneNumber: string;
}

export interface MockIapProduct {
  sku: string;
  type: 'CONSUMABLE' | 'NON_CONSUMABLE' | 'SUBSCRIPTION';
  displayName: string;
  displayAmount: string;
  iconUrl: string;
  description: string;
  renewalCycle?: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
}

export type IapNextResult =
  | 'success'
  | 'USER_CANCELED'
  | 'INVALID_PRODUCT_ID'
  | 'PAYMENT_PENDING'
  | 'NETWORK_ERROR'
  | 'ITEM_ALREADY_OWNED'
  | 'INTERNAL_ERROR';

export interface AnalyticsLogEntry {
  timestamp: number;
  type: string;
  params: Record<string, unknown>;
}

export interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export type ViewportPresetId =
  | 'none'
  | 'iphone-se-3'
  | 'iphone-16e'
  | 'iphone-18'
  | 'iphone-air'
  | 'iphone-18-pro'
  | 'iphone-18-pro-max'
  | 'galaxy-s26'
  | 'galaxy-s26-plus'
  | 'galaxy-s26-ultra'
  | 'galaxy-z-flip7'
  | 'galaxy-z-fold7-folded'
  | 'galaxy-z-fold7-unfolded'
  | 'custom';

/**
 * Panel의 orientation 선택.
 * - `auto` — Panel이 강제하지 않음. 앱이 SDK `setDeviceOrientation`을 호출하면 값이 반영됨.
 * - `portrait` / `landscape` — Panel이 강제. SDK 호출은 무시됨 (로그만 남김).
 */
export type ViewportOrientation = 'auto' | 'portrait' | 'landscape';

export type NotchType = 'none' | 'notch' | 'dynamic-island' | 'punch-hole-center';

export interface ViewportPreset {
  id: ViewportPresetId;
  label: string;
  /** CSS viewport width in portrait (px) */
  width: number;
  /** CSS viewport height in portrait (px) */
  height: number;
  /** devicePixelRatio */
  dpr: number;
  /** Notch / camera cutout style (portrait) */
  notch: NotchType;
  /** OS-level safe area insets in portrait (px). Excludes Apps in Toss nav bar. */
  safeAreaTop: number;
  safeAreaBottom: number;
}

export interface ViewportState {
  preset: ViewportPresetId;
  orientation: ViewportOrientation;
  customWidth: number;
  customHeight: number;
  frame: boolean;
  /** Render the Apps in Toss host nav bar (back / app name / ··· / close) inside the frame. */
  aitNavBar: boolean;
}
