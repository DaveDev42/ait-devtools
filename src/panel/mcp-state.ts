/** Opt-in browser-to-dev-server state sync for the external MCP debugger. */

import type { AitDevtoolsState } from '../mock/state.js';

const MCP_STATE_PATH = '/api/ait-devtools/state';

interface McpRuntimeGlobal {
  __AIT_DEVTOOLS_MCP_ENABLED__?: boolean;
}

/** The unplugin sets this runtime flag only when `mcp: true` is explicit. */
export function isMcpStateSyncEnabled(): boolean {
  return (globalThis as typeof globalThis & McpRuntimeGlobal).__AIT_DEVTOOLS_MCP_ENABLED__ === true;
}

/** Fire-and-forget state sync. The default path returns before serialization or fetch. */
export function pushStateToMcpEndpoint(state: AitDevtoolsState): void {
  if (!isMcpStateSyncEnabled() || typeof fetch === 'undefined') return;
  fetch(MCP_STATE_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state),
  }).catch(() => {
    // The external debugger is optional and may not be running yet.
  });
}
