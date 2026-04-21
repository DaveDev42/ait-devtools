import { beforeEach, describe, expect, it } from 'vitest';
import { aitState } from '../mock/state.js';
import {
  applyViewport,
  getPreset,
  initViewport,
  loadViewportFromStorage,
  resolveViewportSize,
  saveViewportToStorage,
  VIEWPORT_PRESETS,
  VIEWPORT_STORAGE_KEY,
} from '../panel/viewport.js';

describe('viewport presets', () => {
  it('알려진 프리셋 id는 해당 가로/세로 값을 반환한다', () => {
    expect(getPreset('iphone-14-pro')).toEqual({
      id: 'iphone-14-pro',
      label: 'iPhone 14 Pro',
      width: 393,
      height: 852,
    });
    expect(getPreset('galaxy-s23').width).toBe(360);
    expect(getPreset('ipad-mini').height).toBe(1024);
  });

  it('VIEWPORT_PRESETS에는 none과 custom 엔트리가 항상 포함된다', () => {
    const ids = VIEWPORT_PRESETS.map((p) => p.id);
    expect(ids).toContain('none');
    expect(ids).toContain('custom');
  });
});

describe('resolveViewportSize', () => {
  it('preset=none이면 0×0을 반환한다', () => {
    expect(
      resolveViewportSize({
        preset: 'none',
        orientation: 'portrait',
        customWidth: 300,
        customHeight: 500,
        frame: false,
      }),
    ).toEqual({ width: 0, height: 0 });
  });

  it('portrait는 프리셋 값 그대로 반환한다', () => {
    expect(
      resolveViewportSize({
        preset: 'iphone-14',
        orientation: 'portrait',
        customWidth: 0,
        customHeight: 0,
        frame: false,
      }),
    ).toEqual({ width: 390, height: 844 });
  });

  it('landscape는 width/height를 swap한다', () => {
    expect(
      resolveViewportSize({
        preset: 'iphone-14',
        orientation: 'landscape',
        customWidth: 0,
        customHeight: 0,
        frame: false,
      }),
    ).toEqual({ width: 844, height: 390 });
  });

  it('custom 프리셋은 customWidth/customHeight를 사용한다', () => {
    expect(
      resolveViewportSize({
        preset: 'custom',
        orientation: 'portrait',
        customWidth: 500,
        customHeight: 900,
        frame: false,
      }),
    ).toEqual({ width: 500, height: 900 });
  });

  it('custom + landscape도 swap된다', () => {
    expect(
      resolveViewportSize({
        preset: 'custom',
        orientation: 'landscape',
        customWidth: 500,
        customHeight: 900,
        frame: false,
      }),
    ).toEqual({ width: 900, height: 500 });
  });
});

describe('applyViewport (DOM)', () => {
  beforeEach(() => {
    aitState.reset();
    document.documentElement.classList.remove('ait-viewport-active', 'ait-viewport-framed');
    const existing = document.getElementById('__ait-viewport-style');
    if (existing) existing.remove();
  });

  it('preset=none이면 html에 active 클래스가 붙지 않는다', () => {
    applyViewport({
      preset: 'none',
      orientation: 'portrait',
      customWidth: 0,
      customHeight: 0,
      frame: false,
    });
    expect(document.documentElement.classList.contains('ait-viewport-active')).toBe(false);
  });

  it('프리셋 선택 시 html에 active 클래스가 붙고 style이 주입된다', () => {
    applyViewport({
      preset: 'iphone-14',
      orientation: 'portrait',
      customWidth: 0,
      customHeight: 0,
      frame: false,
    });
    expect(document.documentElement.classList.contains('ait-viewport-active')).toBe(true);
    const style = document.getElementById('__ait-viewport-style');
    expect(style?.textContent).toContain('390px');
    expect(style?.textContent).toContain('844px');
  });

  it('frame=true이면 framed 클래스가 추가된다', () => {
    applyViewport({
      preset: 'iphone-14',
      orientation: 'portrait',
      customWidth: 0,
      customHeight: 0,
      frame: true,
    });
    expect(document.documentElement.classList.contains('ait-viewport-framed')).toBe(true);
  });

  it('preset을 none으로 되돌리면 active/framed 클래스가 제거된다', () => {
    applyViewport({
      preset: 'iphone-14',
      orientation: 'portrait',
      customWidth: 0,
      customHeight: 0,
      frame: true,
    });
    applyViewport({
      preset: 'none',
      orientation: 'portrait',
      customWidth: 0,
      customHeight: 0,
      frame: false,
    });
    expect(document.documentElement.classList.contains('ait-viewport-active')).toBe(false);
    expect(document.documentElement.classList.contains('ait-viewport-framed')).toBe(false);
  });
});

describe('sessionStorage persistence', () => {
  beforeEach(() => {
    aitState.reset();
    sessionStorage.clear();
  });

  it('saveViewportToStorage는 직렬화해 저장한다', () => {
    saveViewportToStorage({
      preset: 'iphone-14-pro',
      orientation: 'landscape',
      customWidth: 400,
      customHeight: 900,
      frame: true,
    });
    const raw = sessionStorage.getItem(VIEWPORT_STORAGE_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw ?? '{}');
    expect(parsed.preset).toBe('iphone-14-pro');
    expect(parsed.orientation).toBe('landscape');
    expect(parsed.frame).toBe(true);
  });

  it('loadViewportFromStorage는 저장된 값만 반환한다 (유효성 검증)', () => {
    sessionStorage.setItem(
      VIEWPORT_STORAGE_KEY,
      JSON.stringify({
        preset: 'galaxy-s23',
        orientation: 'landscape',
        customWidth: 500,
        customHeight: 900,
        frame: false,
      }),
    );
    const restored = loadViewportFromStorage();
    expect(restored).toEqual({
      preset: 'galaxy-s23',
      orientation: 'landscape',
      customWidth: 500,
      customHeight: 900,
      frame: false,
    });
  });

  it('잘못된 preset id는 무시한다', () => {
    sessionStorage.setItem(
      VIEWPORT_STORAGE_KEY,
      JSON.stringify({
        preset: 'not-a-real-device',
        orientation: 'portrait',
      }),
    );
    const restored = loadViewportFromStorage();
    expect(restored?.preset).toBeUndefined();
    expect(restored?.orientation).toBe('portrait');
  });

  it('저장된 값이 없으면 null을 반환한다', () => {
    expect(loadViewportFromStorage()).toBeNull();
  });

  it('손상된 JSON은 null을 반환한다', () => {
    sessionStorage.setItem(VIEWPORT_STORAGE_KEY, '{not json');
    expect(loadViewportFromStorage()).toBeNull();
  });

  it('initViewport는 sessionStorage 값을 aitState에 반영한다', () => {
    sessionStorage.setItem(
      VIEWPORT_STORAGE_KEY,
      JSON.stringify({
        preset: 'iphone-14-pro',
        orientation: 'portrait',
        customWidth: 400,
        customHeight: 900,
        frame: true,
      }),
    );
    initViewport();
    expect(aitState.state.viewport.preset).toBe('iphone-14-pro');
    expect(aitState.state.viewport.frame).toBe(true);
  });

  it('initViewport 이후 aitState 변경은 자동으로 sessionStorage에 저장된다', () => {
    initViewport();
    aitState.patch('viewport', { preset: 'pixel-8', orientation: 'landscape' });
    const raw = sessionStorage.getItem(VIEWPORT_STORAGE_KEY);
    const parsed = JSON.parse(raw ?? '{}');
    expect(parsed.preset).toBe('pixel-8');
    expect(parsed.orientation).toBe('landscape');
  });
});

describe('aitState.viewport integration', () => {
  beforeEach(() => {
    aitState.reset();
  });

  it('기본값은 preset=none, orientation=portrait', () => {
    expect(aitState.state.viewport.preset).toBe('none');
    expect(aitState.state.viewport.orientation).toBe('portrait');
    expect(aitState.state.viewport.frame).toBe(false);
  });

  it('patch로 프리셋을 변경할 수 있다', () => {
    aitState.patch('viewport', { preset: 'iphone-14' });
    expect(aitState.state.viewport.preset).toBe('iphone-14');
  });

  it('reset 후 viewport도 기본값으로 돌아간다', () => {
    aitState.patch('viewport', { preset: 'ipad-mini', orientation: 'landscape', frame: true });
    aitState.reset();
    expect(aitState.state.viewport.preset).toBe('none');
    expect(aitState.state.viewport.orientation).toBe('portrait');
    expect(aitState.state.viewport.frame).toBe(false);
  });
});
