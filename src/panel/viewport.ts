/**
 * Viewport 시뮬레이션 유틸
 *
 * Panel에서 선택한 디바이스 프리셋을 `document.body`에 적용하고,
 * sessionStorage에 상태를 저장/복원한다.
 */

import { aitState } from '../mock/state.js';
import type {
  ViewportOrientation,
  ViewportPreset,
  ViewportPresetId,
  ViewportState,
} from '../mock/types.js';

export const VIEWPORT_STORAGE_KEY = '__ait_viewport';

export const VIEWPORT_PRESETS: ViewportPreset[] = [
  { id: 'none', label: 'None (full window)', width: 0, height: 0 },
  { id: 'iphone-se', label: 'iPhone SE', width: 375, height: 667 },
  { id: 'iphone-14', label: 'iPhone 14', width: 390, height: 844 },
  { id: 'iphone-14-pro', label: 'iPhone 14 Pro', width: 393, height: 852 },
  { id: 'iphone-14-pro-max', label: 'iPhone 14 Pro Max', width: 430, height: 932 },
  { id: 'galaxy-s23', label: 'Galaxy S23', width: 360, height: 780 },
  { id: 'galaxy-s24-ultra', label: 'Galaxy S24 Ultra', width: 412, height: 915 },
  { id: 'pixel-8', label: 'Pixel 8', width: 412, height: 915 },
  { id: 'ipad-mini', label: 'iPad mini', width: 768, height: 1024 },
  { id: 'custom', label: 'Custom', width: 0, height: 0 },
];

export function getPreset(id: ViewportPresetId): ViewportPreset {
  return VIEWPORT_PRESETS.find((p) => p.id === id) ?? VIEWPORT_PRESETS[0];
}

/**
 * 선택된 뷰포트의 실제 width/height를 계산한다.
 * preset === 'custom'이면 customWidth/customHeight, 그 외에는 preset의 값.
 * orientation === 'landscape'이면 width/height를 swap.
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

const STYLE_ELEMENT_ID = '__ait-viewport-style';

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
    return;
  }

  html.classList.add('ait-viewport-active');
  html.classList.toggle('ait-viewport-framed', state.frame);

  style.textContent = /* css */ `
    html.ait-viewport-active {
      background: #0a0a14;
      min-height: 100vh;
    }
    html.ait-viewport-active body {
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
  `;
}

function isViewportPresetId(v: unknown): v is ViewportPresetId {
  return typeof v === 'string' && VIEWPORT_PRESETS.some((p) => p.id === v);
}

function isViewportOrientation(v: unknown): v is ViewportOrientation {
  return v === 'portrait' || v === 'landscape';
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
 * aitState 변경을 구독해서 DOM과 storage를 자동 동기화한다.
 */
export function initViewport(): () => void {
  if (typeof window === 'undefined') return () => {};
  const restored = loadViewportFromStorage();
  if (restored) {
    aitState.patch('viewport', restored);
  }
  applyViewport(aitState.state.viewport);

  let lastJson = JSON.stringify(aitState.state.viewport);
  return aitState.subscribe(() => {
    const json = JSON.stringify(aitState.state.viewport);
    if (json === lastJson) return;
    lastJson = json;
    applyViewport(aitState.state.viewport);
    saveViewportToStorage(aitState.state.viewport);
  });
}
