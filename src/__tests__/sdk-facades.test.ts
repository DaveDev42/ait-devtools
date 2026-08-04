import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as sdk2 from '../mock/index-2x.js';
import * as sdk3 from '../mock/index-3x.js';

describe('web-framework versioned facades', () => {
  beforeEach(() => {
    sdk3.aitState.reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps the measured 2.x async safe-area alias and exposes the 3.x sync alias', async () => {
    const legacyResult = sdk2.getSafeAreaInsets();
    expect(legacyResult).toBeInstanceOf(Promise);
    await expect(legacyResult).resolves.toEqual({ top: 54, bottom: 34, left: 0, right: 0 });

    expect(sdk3.getSafeAreaInsets()).toEqual({ top: 54, bottom: 34, left: 0, right: 0 });
    expect(sdk3.SafeArea).toBe(sdk3.SafeAreaInsets);
  });

  it('exposes synchronous 3.x domain constants without changing 2.x flat behavior', () => {
    sdk3.aitState.patch('environment', 'toss');
    sdk3.aitState.patch('locale', 'en-US');

    expect(sdk3.Environment.environment).toBe('toss');
    expect(sdk3.Device.locale).toBe('en-US');
    expect(sdk3.getOperationalEnvironment()).toBe('toss');
    expect(sdk3.getLocale()).toBe('en-US');
  });

  it('attaches 3.x capability metadata to flat aliases and namespace methods', () => {
    expect(sdk3.requestReview.isSupported()).toBe(true);
    expect(sdk3.requestReview.MIN_TOSS_APP_VERSION).toEqual({
      android: '5.253.0',
      ios: '5.253.0',
    });
    expect(sdk3.IAP.getPendingOrders.MIN_TOSS_APP_VERSION).toEqual({
      android: '5.234.0',
      ios: '5.231.0',
    });
    expect(sdk3.User.getDeclaredAgeRange.MIN_OS_VERSION).toEqual({ ios: '26.0' });
  });

  it('adapts new domain argument shapes to the shared mock behavior', async () => {
    await sdk3.Clipboard.setText('facade-text');
    await expect(sdk3.Clipboard.getText()).resolves.toBe('facade-text');

    const link = await sdk3.Share.createLink({ path: 'intoss://mock/path' });
    expect(link).toContain('intoss://mock/path');

    const payment = await sdk3.TossPay.authorize({ payToken: 'mock-token' });
    expect(payment).toEqual({ success: true });
  });

  it('accepts omitted 3.x ad options and emits the complete load result', async () => {
    vi.useFakeTimers();
    const onEvent = vi.fn();

    sdk3.GoogleAdMob.loadAppsInTossAdMob({ onEvent, onError: vi.fn() });
    await vi.advanceTimersByTimeAsync(200);

    expect(onEvent).toHaveBeenCalledWith({
      type: 'loaded',
      data: {
        adGroupId: 'mock-ad-group',
        adUnitId: 'mock-unit-mock-ad-group',
        responseInfo: {
          responseId: 'mock-response-mock-ad-group',
          adNetworkInfoArray: [],
          loadedAdNetworkInfo: null,
        },
      },
    });
  });

  it('provides deterministic bridge escape hatches and age-range state', async () => {
    sdk3.aitState.patch('auth', {
      declaredAgeRange: {
        status: 'SHARING',
        lowerBound: 18,
        activeParentalControls: [],
      },
    });

    await expect(sdk3.User.getDeclaredAgeRange({ ageGates: [13, 18] })).resolves.toMatchObject({
      status: 'SHARING',
      lowerBound: 18,
    });
    expect(sdk3.createConstantBridge<string>('locale')()).toBe('ko-KR');
    await expect(sdk3.createAsyncBridge('getServerTime')()).resolves.toEqual(expect.any(Number));
  });
});
