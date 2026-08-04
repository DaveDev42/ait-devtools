/** Runtime metadata carried by web-framework 3.x capability-aware APIs. */
export interface SdkSupportMetadata {
  readonly MIN_TOSS_APP_VERSION?: Readonly<Record<string, string>>;
  readonly MIN_OS_VERSION?: Readonly<Record<string, string>>;
  readonly isSupported: () => boolean;
}

/**
 * Attach the metadata exposed by web-framework 3.x without wrapping the
 * function. Keeping identity intact matters for the deprecated flat aliases
 * that are also referenced by the new domain objects.
 */
export function withSdkSupport<T extends (...args: never[]) => unknown>(
  fn: T,
  metadata: Omit<SdkSupportMetadata, 'isSupported'>,
): T & SdkSupportMetadata {
  return Object.assign(fn, metadata, { isSupported: () => true });
}
