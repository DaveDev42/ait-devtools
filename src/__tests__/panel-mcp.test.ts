import { afterEach, describe, expect, it, vi } from 'vitest';
import { aitState } from '../mock/state.js';
import { pushStateToMcpEndpoint } from '../panel/mcp-state.js';

interface McpRuntimeGlobal {
  __AIT_DEVTOOLS_MCP_ENABLED__?: boolean;
}

const runtimeGlobal = globalThis as typeof globalThis & McpRuntimeGlobal;

afterEach(() => {
  delete runtimeGlobal.__AIT_DEVTOOLS_MCP_ENABLED__;
  vi.restoreAllMocks();
});

describe('panel MCP state sync', () => {
  it('is completely disabled by default', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    pushStateToMcpEndpoint(aitState.state);

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('posts state only after the unplugin opt-in flag is set', () => {
    runtimeGlobal.__AIT_DEVTOOLS_MCP_ENABLED__ = true;
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null));

    pushStateToMcpEndpoint(aitState.state);

    expect(fetchSpy).toHaveBeenCalledWith('/api/ait-devtools/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(aitState.state),
    });
  });
});
