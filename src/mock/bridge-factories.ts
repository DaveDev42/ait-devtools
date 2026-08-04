/** Generic bridge escape hatches exposed by both SDK lines. */

import {
  appLogin,
  appsInTossSignTossCert,
  getAnonymousKey,
  getConsentedUserData,
  getDeclaredAgeRange,
} from './auth/index.js';
import { generateHapticFeedback, openPDFViewer, saveBase64Data } from './device/index.js';
import { checkoutPayment } from './iap/index.js';
import {
  closeView,
  getNetworkStatus,
  getServerTime,
  onVisibilityChangedByTransparentServiceWeb,
  openURL,
  requestReview,
  share,
} from './navigation/index.js';
import { aitState } from './state.js';

const asyncBridgeRegistry: Record<string, (...args: never[]) => unknown> = {
  appLogin,
  appsInTossSignTossCert,
  checkoutPayment,
  closeView,
  generateHapticFeedback,
  getAnonymousKey,
  getConsentedUserData,
  getDeclaredAgeRange,
  getNetworkStatus,
  getServerTime,
  openPDFViewer,
  openURL,
  requestReview,
  saveBase64Data,
  share,
};

export function createAsyncBridge<Args extends unknown[] = unknown[], Result = unknown>(
  method: string,
): (...args: Args) => Promise<Result> {
  return async (...args: Args): Promise<Result> => {
    const fn = asyncBridgeRegistry[method];
    if (!fn) throw new Error(`@ait-co/devtools: unknown async bridge method "${method}"`);
    return (await fn(...(args as unknown as never[]))) as Result;
  };
}

export function createConstantBridge<T>(name: string): () => T {
  return (): T => {
    const constants: Record<string, unknown> = {
      deploymentId: aitState.state.deploymentId,
      deviceId: aitState.state.deviceId,
      groupId: aitState.state.groupId,
      locale: aitState.state.locale,
      operationalEnvironment: aitState.state.environment,
      platformOS: aitState.state.platform,
      safeAreaInsets: { ...aitState.state.safeAreaInsets },
      schemeUri: aitState.state.schemeUri || window.location.pathname,
      tossAppVersion: aitState.state.appVersion,
    };
    if (!(name in constants)) {
      throw new Error(`@ait-co/devtools: unknown constant bridge "${name}"`);
    }
    return constants[name] as T;
  };
}

export function createEventBridge<Options = unknown, Event = unknown>(
  method: string,
): (args: {
  options?: Options;
  onEvent: (event: Event) => void;
  onError: (error: Error) => void;
}) => () => void {
  return (args) => {
    if (method === 'onVisibilityChangedByTransparentServiceWeb') {
      return onVisibilityChangedByTransparentServiceWeb({
        options: args.options as { callbackId: string },
        onEvent: args.onEvent as unknown as (isVisible: boolean) => void,
        onError: (error: unknown) =>
          args.onError(error instanceof Error ? error : new Error(String(error))),
      });
    }
    throw new Error(`@ait-co/devtools: unknown event bridge method "${method}"`);
  };
}
