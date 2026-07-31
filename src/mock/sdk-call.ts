/**
 * SDK-call trace shape produced by the mock's `observe()` wrapper.
 *
 * These declarations used to live in `src/mcp/ait-source.ts` (that module is now
 * `@ait-co/debugger`'s `packages/debugger/src/mcp/ait-source.ts`) because the MCP
 * `AIT.getSdkCallHistory` tool was their only *consumer*. After the debug
 * surface moved to `@ait-co/debugger` (#818) the producer — `observe()`
 * writing into `aitState.sdkCallLog` — is the only side left in this package,
 * so the types live next to it.
 *
 * They stay part of the public `@ait-co/devtools/mock` surface (re-exported by
 * `state.ts`): a consumer reading `window.__ait.sdkCallLog` needs the shape,
 * and any out-of-process reader (the MCP daemon among them) types against the
 * same declarations.
 */

/**
 * Mock fidelity grade of the SDK call.
 * - `faithful` — mock faithfully reproduces the real SDK contract (🟢).
 * - `partial`  — mock partially matches; edge cases may differ from real (🟡).
 * - `inert`    — mock accepts the call but produces no observable effect (🔴).
 */
export type AitSdkCallFidelity = 'faithful' | 'partial' | 'inert';

/** One entry of the SDK-call trace. */
export interface AitSdkCall {
  /** SDK method name, e.g. `getOperationalEnvironment`, `saveBase64Data`. */
  method: string;
  /** Arguments passed to the call, serialized for transport. */
  args: unknown[];
  /** Milliseconds since epoch when the call was made. */
  timestamp: number;
  /** Outcome — resolved value, rejection error message, or still pending. */
  status: 'resolved' | 'rejected' | 'pending';
  /** Serialized resolved value when `status === 'resolved'`. */
  result?: unknown;
  /** Error message when `status === 'rejected'`. */
  error?: string;
  /** Mock fidelity grade — how closely this mock reproduces the real SDK behaviour. */
  fidelity: AitSdkCallFidelity;
}
