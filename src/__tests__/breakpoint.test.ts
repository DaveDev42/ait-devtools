import { describe, expect, it } from 'vitest';
import { PANEL_FULLSCREEN_BREAKPOINT, PANEL_STYLES } from '../panel/styles.js';

describe('Panel fullscreen breakpoint', () => {
  it('상수와 CSS 미디어쿼리가 같은 값을 사용한다', () => {
    expect(PANEL_FULLSCREEN_BREAKPOINT).toBe(720);
    expect(PANEL_STYLES).toContain(`@media (max-width: ${PANEL_FULLSCREEN_BREAKPOINT}px)`);
  });
});
