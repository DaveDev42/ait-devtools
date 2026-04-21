import { beforeEach, describe, expect, it } from 'vitest';
import { aitState } from '../mock/state.js';
import type { ViewportState } from '../mock/types.js';
import {
  applyViewport,
  computeSafeAreaInsets,
  getPreset,
  initViewport,
  loadViewportFromStorage,
  resolveViewportSize,
  saveViewportToStorage,
  VIEWPORT_PRESETS,
  VIEWPORT_STORAGE_KEY,
} from '../panel/viewport.js';

/** 테스트에서 부분 필드만 바꾼 ViewportState를 만들기 위한 기본값 */
function makeState(overrides: Partial<ViewportState> = {}): ViewportState {
  return {
    preset: 'none',
    orientation: 'auto',
    customWidth: 402,
    customHeight: 874,
    frame: false,
    aitNavBar: true,
    ...overrides,
  };
}

describe('viewport presets', () => {
  it('알려진 프리셋 id는 라벨, 크기, DPR, notch, safeArea를 함께 반환한다', () => {
    const iphone18Pro = getPreset('iphone-18-pro');
    expect(iphone18Pro.label).toBe('iPhone 18 Pro');
    expect(iphone18Pro.width).toBe(402);
    expect(iphone18Pro.height).toBe(874);
    expect(iphone18Pro.dpr).toBe(3);
    expect(iphone18Pro.notch).toBe('dynamic-island');
    expect(iphone18Pro.safeAreaTop).toBeGreaterThan(0);
    expect(iphone18Pro.safeAreaBottom).toBeGreaterThan(0);

    expect(getPreset('galaxy-s26').width).toBe(384);
    expect(getPreset('iphone-se-3').notch).toBe('none');
    expect(getPreset('iphone-se-3').safeAreaBottom).toBe(0);
  });

  it('VIEWPORT_PRESETS에는 none과 custom 엔트리가 항상 포함된다', () => {
    const ids = VIEWPORT_PRESETS.map((p) => p.id);
    expect(ids).toContain('none');
    expect(ids).toContain('custom');
  });

  it('Z Fold7은 접힘/펼침 두 프리셋이 모두 있다', () => {
    const ids = VIEWPORT_PRESETS.map((p) => p.id);
    expect(ids).toContain('galaxy-z-fold7-folded');
    expect(ids).toContain('galaxy-z-fold7-unfolded');
    expect(getPreset('galaxy-z-fold7-unfolded').width).toBeGreaterThan(
      getPreset('galaxy-z-fold7-folded').width,
    );
  });
});

describe('resolveViewportSize', () => {
  it('preset=none이면 0×0을 반환한다', () => {
    expect(resolveViewportSize(makeState({ preset: 'none' }))).toEqual({ width: 0, height: 0 });
  });

  it('portrait는 프리셋 값 그대로 반환한다', () => {
    expect(
      resolveViewportSize(makeState({ preset: 'iphone-18', orientation: 'portrait' })),
    ).toEqual({ width: 402, height: 874 });
  });

  it('auto는 portrait와 동일하게 취급된다', () => {
    expect(resolveViewportSize(makeState({ preset: 'iphone-18', orientation: 'auto' }))).toEqual({
      width: 402,
      height: 874,
    });
  });

  it('landscape는 width/height를 swap한다', () => {
    expect(
      resolveViewportSize(makeState({ preset: 'iphone-18', orientation: 'landscape' })),
    ).toEqual({ width: 874, height: 402 });
  });

  it('custom 프리셋은 customWidth/customHeight를 사용한다', () => {
    expect(
      resolveViewportSize(
        makeState({
          preset: 'custom',
          orientation: 'portrait',
          customWidth: 500,
          customHeight: 900,
        }),
      ),
    ).toEqual({ width: 500, height: 900 });
  });

  it('custom + landscape도 swap된다', () => {
    expect(
      resolveViewportSize(
        makeState({
          preset: 'custom',
          orientation: 'landscape',
          customWidth: 500,
          customHeight: 900,
        }),
      ),
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
    applyViewport(makeState({ preset: 'none' }));
    expect(document.documentElement.classList.contains('ait-viewport-active')).toBe(false);
  });

  it('프리셋 선택 시 html에 active 클래스가 붙고 style이 주입된다', () => {
    applyViewport(makeState({ preset: 'iphone-18', orientation: 'portrait' }));
    expect(document.documentElement.classList.contains('ait-viewport-active')).toBe(true);
    const style = document.getElementById('__ait-viewport-style');
    expect(style?.textContent).toContain('402px');
    expect(style?.textContent).toContain('874px');
  });

  it('frame=true이면 framed 클래스가 추가된다', () => {
    applyViewport(makeState({ preset: 'iphone-18', frame: true }));
    expect(document.documentElement.classList.contains('ait-viewport-framed')).toBe(true);
  });

  it('preset을 none으로 되돌리면 active/framed 클래스가 제거된다', () => {
    applyViewport(makeState({ preset: 'iphone-18', frame: true }));
    applyViewport(makeState({ preset: 'none' }));
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
    saveViewportToStorage(
      makeState({
        preset: 'iphone-18-pro',
        orientation: 'landscape',
        customWidth: 400,
        customHeight: 900,
        frame: true,
      }),
    );
    const raw = sessionStorage.getItem(VIEWPORT_STORAGE_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw ?? '{}');
    expect(parsed.preset).toBe('iphone-18-pro');
    expect(parsed.orientation).toBe('landscape');
    expect(parsed.frame).toBe(true);
  });

  it('loadViewportFromStorage는 저장된 값만 반환한다 (유효성 검증)', () => {
    sessionStorage.setItem(
      VIEWPORT_STORAGE_KEY,
      JSON.stringify({
        preset: 'galaxy-s26',
        orientation: 'landscape',
        customWidth: 500,
        customHeight: 900,
        frame: false,
        aitNavBar: false,
      }),
    );
    const restored = loadViewportFromStorage();
    expect(restored).toEqual({
      preset: 'galaxy-s26',
      orientation: 'landscape',
      customWidth: 500,
      customHeight: 900,
      frame: false,
      aitNavBar: false,
    });
  });

  it('잘못된 preset id는 무시한다', () => {
    sessionStorage.setItem(
      VIEWPORT_STORAGE_KEY,
      JSON.stringify({ preset: 'not-a-real-device', orientation: 'portrait' }),
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
        preset: 'iphone-18-pro',
        orientation: 'portrait',
        customWidth: 400,
        customHeight: 900,
        frame: true,
      }),
    );
    initViewport();
    expect(aitState.state.viewport.preset).toBe('iphone-18-pro');
    expect(aitState.state.viewport.frame).toBe(true);
  });

  it('initViewport 이후 aitState 변경은 자동으로 sessionStorage에 저장된다', () => {
    initViewport();
    aitState.patch('viewport', { preset: 'galaxy-s26-ultra', orientation: 'landscape' });
    const raw = sessionStorage.getItem(VIEWPORT_STORAGE_KEY);
    const parsed = JSON.parse(raw ?? '{}');
    expect(parsed.preset).toBe('galaxy-s26-ultra');
    expect(parsed.orientation).toBe('landscape');
  });
});

describe('computeSafeAreaInsets', () => {
  it('preset=none이면 모두 0을 반환한다', () => {
    const none = VIEWPORT_PRESETS.find((p) => p.id === 'none');
    if (!none) throw new Error('none preset missing');
    expect(computeSafeAreaInsets(none, false)).toEqual({ top: 0, bottom: 0, left: 0, right: 0 });
  });

  it('portrait iPhone Dynamic Island: top/bottom만 채움', () => {
    expect(computeSafeAreaInsets(getPreset('iphone-18-pro'), false)).toEqual({
      top: 59,
      bottom: 34,
      left: 0,
      right: 0,
    });
  });

  it('landscape iPhone은 notch가 좌우로 가서 left/right에 top 값을 넣고 top=0이 된다', () => {
    expect(computeSafeAreaInsets(getPreset('iphone-18-pro'), true)).toEqual({
      top: 0,
      bottom: 34,
      left: 59,
      right: 59,
    });
  });

  it('iPhone SE(홈버튼)는 notch가 없으므로 landscape에서도 top에 status bar만 남는다', () => {
    expect(computeSafeAreaInsets(getPreset('iphone-se-3'), true)).toEqual({
      top: 20,
      bottom: 0,
      left: 0,
      right: 0,
    });
  });

  it('Android punch-hole은 landscape에서도 status bar가 top에 남는다', () => {
    expect(computeSafeAreaInsets(getPreset('galaxy-s26'), true)).toEqual({
      top: 32,
      bottom: 0,
      left: 0,
      right: 0,
    });
  });
});

describe('viewport → safeAreaInsets auto-sync', () => {
  beforeEach(() => {
    aitState.reset();
    sessionStorage.clear();
  });

  it('initViewport 이후 프리셋을 선택하면 aitState.safeAreaInsets가 갱신된다', () => {
    initViewport();
    aitState.patch('viewport', { preset: 'iphone-18-pro' });
    expect(aitState.state.safeAreaInsets).toEqual({ top: 59, bottom: 34, left: 0, right: 0 });
  });

  it('landscape로 전환하면 iPhone 인셋이 좌우로 이동한다', () => {
    initViewport();
    aitState.patch('viewport', { preset: 'iphone-18-pro', orientation: 'landscape' });
    expect(aitState.state.safeAreaInsets).toEqual({ top: 0, bottom: 34, left: 59, right: 59 });
  });

  it('preset=custom이면 safeAreaInsets를 덮어쓰지 않는다', () => {
    initViewport();
    aitState.update({ safeAreaInsets: { top: 10, bottom: 20, left: 0, right: 0 } });
    aitState.patch('viewport', { preset: 'custom' });
    expect(aitState.state.safeAreaInsets).toEqual({ top: 10, bottom: 20, left: 0, right: 0 });
  });
});

describe('aitState.viewport integration', () => {
  beforeEach(() => {
    aitState.reset();
  });

  it('기본값은 preset=none, orientation=auto, aitNavBar=true', () => {
    expect(aitState.state.viewport.preset).toBe('none');
    expect(aitState.state.viewport.orientation).toBe('auto');
    expect(aitState.state.viewport.frame).toBe(false);
    expect(aitState.state.viewport.aitNavBar).toBe(true);
  });

  it('patch로 프리셋을 변경할 수 있다', () => {
    aitState.patch('viewport', { preset: 'iphone-18' });
    expect(aitState.state.viewport.preset).toBe('iphone-18');
  });

  it('reset 후 viewport도 기본값으로 돌아간다', () => {
    aitState.patch('viewport', {
      preset: 'galaxy-s26-ultra',
      orientation: 'landscape',
      frame: true,
    });
    aitState.reset();
    expect(aitState.state.viewport.preset).toBe('none');
    expect(aitState.state.viewport.orientation).toBe('auto');
    expect(aitState.state.viewport.frame).toBe(false);
  });
});
