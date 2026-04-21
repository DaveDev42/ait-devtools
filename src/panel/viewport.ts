/**
 * Viewport 시뮬레이션 유틸
 *
 * Panel에서 선택한 디바이스 프리셋을 `document.body`에 적용하고,
 * sessionStorage에 상태를 저장/복원한다.
 */

import { aitState } from '../mock/state.js';
import type {
  SafeAreaInsets,
  ViewportOrientation,
  ViewportPreset,
  ViewportPresetId,
  ViewportState,
} from '../mock/types.js';

export const VIEWPORT_STORAGE_KEY = '__ait_viewport';

/**
 * Apps in Toss의 host nav bar 높이 (CSS px). 공식 docs에는 명시되어 있지 않지만
 * Toss 공식 예제(`with-contacts-viral`, `random-balls`)가 safeArea.top에 `+ 48`을
 * 추가하는 패턴을 쓴다. SafeAreaInsets에는 포함되지 않으므로 별도 상수로 관리.
 */
export const AIT_NAV_BAR_HEIGHT = 48;

const NONE_PRESET: ViewportPreset = {
  id: 'none',
  label: 'None (full window)',
  width: 0,
  height: 0,
  dpr: 1,
  notch: 'none',
  safeAreaTop: 0,
  safeAreaBottom: 0,
};

const CUSTOM_PRESET: ViewportPreset = {
  id: 'custom',
  label: 'Custom',
  width: 0,
  height: 0,
  dpr: 1,
  notch: 'none',
  safeAreaTop: 0,
  safeAreaBottom: 0,
};

/**
 * Device presets (2026). CSS viewport 크기는 실제 기기의 `window.innerWidth/innerHeight`.
 * Apple의 iPhone 18 시리즈는 2026-04 기준 미출시이므로 iPhone 17 시리즈(2025-09 출시)의
 * 실측 값을 사용한다. 실제 출시 후 값을 갱신한다.
 */
export const VIEWPORT_PRESETS: ViewportPreset[] = [
  NONE_PRESET,
  // Apple
  {
    id: 'iphone-se-3',
    label: 'iPhone SE (3rd gen)',
    width: 375,
    height: 667,
    dpr: 2,
    notch: 'none',
    safeAreaTop: 20,
    safeAreaBottom: 0,
  },
  {
    id: 'iphone-16e',
    label: 'iPhone 16e',
    width: 390,
    height: 844,
    dpr: 3,
    notch: 'notch',
    safeAreaTop: 47,
    safeAreaBottom: 34,
  },
  {
    id: 'iphone-18',
    label: 'iPhone 18',
    width: 402,
    height: 874,
    dpr: 3,
    notch: 'dynamic-island',
    safeAreaTop: 59,
    safeAreaBottom: 34,
  },
  {
    id: 'iphone-air',
    label: 'iPhone Air',
    width: 420,
    height: 912,
    dpr: 3,
    notch: 'dynamic-island',
    safeAreaTop: 59,
    safeAreaBottom: 34,
  },
  {
    id: 'iphone-18-pro',
    label: 'iPhone 18 Pro',
    width: 402,
    height: 874,
    dpr: 3,
    notch: 'dynamic-island',
    safeAreaTop: 59,
    safeAreaBottom: 34,
  },
  {
    id: 'iphone-18-pro-max',
    label: 'iPhone 18 Pro Max',
    width: 440,
    height: 956,
    dpr: 3,
    notch: 'dynamic-island',
    safeAreaTop: 62,
    safeAreaBottom: 34,
  },
  // Samsung
  {
    id: 'galaxy-s26',
    label: 'Galaxy S26',
    width: 384,
    height: 832,
    dpr: 3,
    notch: 'punch-hole-center',
    safeAreaTop: 32,
    safeAreaBottom: 0,
  },
  {
    id: 'galaxy-s26-plus',
    label: 'Galaxy S26+',
    width: 412,
    height: 915,
    dpr: 3,
    notch: 'punch-hole-center',
    safeAreaTop: 32,
    safeAreaBottom: 0,
  },
  {
    id: 'galaxy-s26-ultra',
    label: 'Galaxy S26 Ultra',
    width: 412,
    height: 915,
    dpr: 3.5,
    notch: 'punch-hole-center',
    safeAreaTop: 40,
    safeAreaBottom: 0,
  },
  {
    id: 'galaxy-z-flip7',
    label: 'Galaxy Z Flip7',
    width: 412,
    height: 990,
    dpr: 3,
    notch: 'punch-hole-center',
    safeAreaTop: 36,
    safeAreaBottom: 0,
  },
  {
    id: 'galaxy-z-fold7-folded',
    label: 'Galaxy Z Fold7 (folded)',
    width: 384,
    height: 870,
    dpr: 3,
    notch: 'punch-hole-center',
    safeAreaTop: 32,
    safeAreaBottom: 0,
  },
  {
    id: 'galaxy-z-fold7-unfolded',
    label: 'Galaxy Z Fold7 (unfolded)',
    width: 768,
    height: 884,
    dpr: 2.625,
    notch: 'punch-hole-center',
    safeAreaTop: 32,
    safeAreaBottom: 0,
  },
  CUSTOM_PRESET,
];

export function getPreset(id: ViewportPresetId): ViewportPreset {
  return VIEWPORT_PRESETS.find((p) => p.id === id) ?? NONE_PRESET;
}

/**
 * 선택된 뷰포트의 실제 width/height를 계산한다.
 * preset === 'custom'이면 customWidth/customHeight, 그 외에는 preset의 값.
 * orientation === 'landscape'이면 width/height를 swap한다. `auto`와 `portrait`는 동일.
 */
export function resolveViewportSize(state: ViewportState): { width: number; height: number } {
  if (state.preset === 'none') return { width: 0, height: 0 };
  const base =
    state.preset === 'custom'
      ? { width: state.customWidth, height: state.customHeight }
      : getPreset(state.preset);
  return state.orientation === 'landscape'
    ? { width: base.height, height: base.width }
    : { width: base.width, height: base.height };
}

/**
 * 현재 상태가 landscape로 표시되는지 여부.
 * `auto`는 portrait와 동일하게 취급. Panel이 강제하지 않으므로 기본 세로.
 * SDK `setDeviceOrientation({ type: 'landscape' })`이 호출되면 `auto`는 유지되지만
 * aitState.orientation (별도 필드)이 바뀌어 반영되도록 후속 커밋에서 연결할 수 있다.
 */
export function isLandscape(state: ViewportState): boolean {
  return state.orientation === 'landscape';
}

/**
 * 프리셋 + orientation으로부터 OS-level safe-area insets를 계산한다.
 *
 * - Portrait: preset의 `safeAreaTop`, `safeAreaBottom`을 그대로 사용.
 * - Landscape: notch/Dynamic Island가 가로로 서면서 양쪽 변으로 이동한다. 실제
 *   기기에서는 노치 쪽 한쪽만 inset이 생기지만, 앱이 어느 방향으로 회전하든
 *   레이아웃이 깨지지 않도록 **양쪽 다** top 값으로 채운다. top은 0.
 *   home-indicator(`safeAreaBottom`)는 landscape에서도 하단에 유지된다.
 * - Android punch-hole(status bar): landscape 시에도 top에 status bar가 유지된다.
 */
export function computeSafeAreaInsets(preset: ViewportPreset, landscape: boolean): SafeAreaInsets {
  if (preset.id === 'none' || preset.id === 'custom') {
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }
  if (!landscape) {
    return { top: preset.safeAreaTop, bottom: preset.safeAreaBottom, left: 0, right: 0 };
  }
  if (preset.notch === 'notch' || preset.notch === 'dynamic-island') {
    return {
      top: 0,
      bottom: preset.safeAreaBottom,
      left: preset.safeAreaTop,
      right: preset.safeAreaTop,
    };
  }
  // Android status bar stays on the top edge even in landscape.
  return {
    top: preset.safeAreaTop,
    bottom: preset.safeAreaBottom,
    left: 0,
    right: 0,
  };
}

/** viewport preset 또는 orientation이 바뀌면 safe-area insets도 자동 갱신한다. */
function syncSafeAreaFromViewport(state: ViewportState): void {
  if (state.preset === 'none' || state.preset === 'custom') return;
  const preset = getPreset(state.preset);
  const next = computeSafeAreaInsets(preset, state.orientation === 'landscape');
  const current = aitState.state.safeAreaInsets;
  if (
    current.top === next.top &&
    current.bottom === next.bottom &&
    current.left === next.left &&
    current.right === next.right
  ) {
    return;
  }
  aitState.update({ safeAreaInsets: next });
}

const STYLE_ELEMENT_ID = '__ait-viewport-style';
const NOTCH_ELEMENT_ID = '__ait-viewport-notch';

function ensureStyleElement(): HTMLStyleElement | null {
  if (typeof document === 'undefined') return null;
  let el = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = STYLE_ELEMENT_ID;
    document.head.appendChild(el);
  }
  return el;
}

function removeNotchElement(): void {
  const el = document.getElementById(NOTCH_ELEMENT_ID);
  if (el) el.remove();
}

/**
 * 현재 preset의 notch/Dynamic Island/punch-hole을 body 상단에 시각적으로 렌더한다.
 * portrait 기준 좌표만 계산한다 (landscape는 오버레이를 숨김 — 노치가 한쪽 변에 가는
 * 실제 레이아웃은 safeAreaInsets의 left/right 값으로 이미 반영됨).
 */
function renderNotchOverlay(preset: ViewportPreset, landscape: boolean): void {
  removeNotchElement();
  if (preset.notch === 'none' || landscape) return;

  const notch = document.createElement('div');
  notch.id = NOTCH_ELEMENT_ID;
  notch.setAttribute('aria-hidden', 'true');

  if (preset.notch === 'dynamic-island') {
    notch.className = 'ait-notch ait-notch-dynamic-island';
  } else if (preset.notch === 'notch') {
    notch.className = 'ait-notch ait-notch-pill';
  } else if (preset.notch === 'punch-hole-center') {
    notch.className = 'ait-notch ait-notch-punch-hole';
  }

  document.body.appendChild(notch);
}

/**
 * DOM에 뷰포트 제약을 적용한다.
 * - `html.ait-viewport-active` 클래스로 전역 배경(프레임 배경) 활성화
 * - body에 max-width/max-height, margin:auto, box-shadow로 frame 시뮬레이션
 *
 * Panel 자체는 `position: fixed`라서 viewport 프레임과 독립적으로 떠 있다.
 */
export function applyViewport(state: ViewportState): void {
  if (typeof document === 'undefined') return;
  const html = document.documentElement;
  const style = ensureStyleElement();
  if (!style) return;

  const size = resolveViewportSize(state);

  if (state.preset === 'none' || size.width === 0 || size.height === 0) {
    html.classList.remove('ait-viewport-active');
    html.classList.remove('ait-viewport-framed');
    style.textContent = '';
    removeNotchElement();
    return;
  }

  html.classList.add('ait-viewport-active');
  html.classList.toggle('ait-viewport-framed', state.frame);

  const preset = state.preset === 'custom' ? null : getPreset(state.preset);
  const landscape = state.orientation === 'landscape';

  style.textContent = /* css */ `
    html.ait-viewport-active {
      background: #0a0a14;
      min-height: 100vh;
    }
    html.ait-viewport-active body {
      position: relative;
      width: ${size.width}px;
      max-width: ${size.width}px;
      min-height: ${size.height}px;
      max-height: ${size.height}px;
      margin: 24px auto;
      overflow: auto;
      background: #fff;
      box-sizing: border-box;
    }
    html.ait-viewport-framed body {
      border-radius: 36px;
      box-shadow: 0 0 0 10px #1a1a2e, 0 0 0 12px #3a3a5a, 0 24px 48px rgba(0,0,0,0.5);
    }

    /* Notch overlays — only rendered when frame=true (CSS visibility control) */
    .ait-notch {
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      background: #000;
      z-index: 2147483646;
      pointer-events: none;
      display: ${state.frame && preset && !landscape ? 'block' : 'none'};
    }
    .ait-notch-dynamic-island {
      top: 11px;
      width: 126px;
      height: 37px;
      border-radius: 20px;
    }
    .ait-notch-pill {
      width: 160px;
      height: 30px;
      border-bottom-left-radius: 20px;
      border-bottom-right-radius: 20px;
    }
    .ait-notch-punch-hole {
      top: 10px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }
  `;

  if (preset) renderNotchOverlay(preset, landscape);
  else removeNotchElement();
}

function isViewportPresetId(v: unknown): v is ViewportPresetId {
  return typeof v === 'string' && VIEWPORT_PRESETS.some((p) => p.id === v);
}

function isViewportOrientation(v: unknown): v is ViewportOrientation {
  return v === 'auto' || v === 'portrait' || v === 'landscape';
}

function isPositiveInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v > 0;
}

/**
 * sessionStorage에 저장된 뷰포트 상태를 읽어서 현재 state에 merge한다.
 * 값이 없거나 파싱 실패 시 no-op.
 */
export function loadViewportFromStorage(): Partial<ViewportState> | null {
  if (typeof sessionStorage === 'undefined') return null;
  const raw = sessionStorage.getItem(VIEWPORT_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null) return null;
    const obj = parsed as Record<string, unknown>;
    const next: Partial<ViewportState> = {};
    if (isViewportPresetId(obj.preset)) next.preset = obj.preset;
    if (isViewportOrientation(obj.orientation)) next.orientation = obj.orientation;
    if (isPositiveInt(obj.customWidth)) next.customWidth = obj.customWidth;
    if (isPositiveInt(obj.customHeight)) next.customHeight = obj.customHeight;
    if (typeof obj.frame === 'boolean') next.frame = obj.frame;
    if (typeof obj.aitNavBar === 'boolean') next.aitNavBar = obj.aitNavBar;
    return next;
  } catch {
    return null;
  }
}

export function saveViewportToStorage(state: ViewportState): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(VIEWPORT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota errors */
  }
}

/**
 * Panel mount 시 호출. sessionStorage 복원 → aitState에 반영 → DOM 적용.
 * aitState 변경을 구독해서 DOM / storage / safe-area insets를 자동 동기화한다.
 */
export function initViewport(): () => void {
  if (typeof window === 'undefined') return () => {};
  const restored = loadViewportFromStorage();
  if (restored) {
    aitState.patch('viewport', restored);
  }
  applyViewport(aitState.state.viewport);
  syncSafeAreaFromViewport(aitState.state.viewport);

  let lastJson = JSON.stringify(aitState.state.viewport);
  return aitState.subscribe(() => {
    const vp = aitState.state.viewport;
    const json = JSON.stringify(vp);
    if (json === lastJson) return;
    lastJson = json;
    applyViewport(vp);
    saveViewportToStorage(vp);
    syncSafeAreaFromViewport(vp);
  });
}
