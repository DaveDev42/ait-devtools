import { aitState } from '../../mock/state.js';
import type { ViewportOrientation, ViewportPresetId } from '../../mock/types.js';
import { h, monitoringNotice } from '../helpers.js';
import { getPreset, resolveViewportSize, VIEWPORT_PRESETS } from '../viewport.js';

export function renderViewportTab(): HTMLElement {
  const s = aitState.state;
  const vp = s.viewport;
  const disabled = !s.panelEditable;
  const container = h('div');

  if (disabled) container.appendChild(monitoringNotice());

  // --- Preset selector ---
  const presetSelect = h('select', { className: 'ait-select' });
  if (disabled) presetSelect.disabled = true;
  for (const preset of VIEWPORT_PRESETS) {
    const label =
      preset.id === 'none' || preset.id === 'custom'
        ? preset.label
        : `${preset.label} (${preset.width}×${preset.height})`;
    const option = h('option', { value: preset.id }, label);
    if (preset.id === vp.preset) option.selected = true;
    presetSelect.appendChild(option);
  }
  presetSelect.addEventListener('change', () => {
    const id = presetSelect.value as ViewportPresetId;
    const patch: Partial<typeof vp> = { preset: id };
    // custom으로 전환할 때 현재 선택값을 custom 필드의 시드로 복사해둔다.
    if (id === 'custom') {
      const current = getPreset(vp.preset);
      if (current.width > 0) patch.customWidth = current.width;
      if (current.height > 0) patch.customHeight = current.height;
    }
    aitState.patch('viewport', patch);
  });

  // --- Orientation toggle ---
  const orientationSelect = h('select', { className: 'ait-select' });
  if (disabled) orientationSelect.disabled = true;
  for (const opt of ['portrait', 'landscape'] as ViewportOrientation[]) {
    const option = h('option', { value: opt }, opt);
    if (opt === vp.orientation) option.selected = true;
    orientationSelect.appendChild(option);
  }
  orientationSelect.addEventListener('change', () => {
    aitState.patch('viewport', {
      orientation: orientationSelect.value as ViewportOrientation,
    });
  });

  // --- Custom width/height inputs (custom 모드에서만 활성화) ---
  const customRow = h('div', { className: 'ait-section' });
  if (vp.preset === 'custom') {
    const widthInput = h('input', {
      className: 'ait-input',
      type: 'number',
      min: '1',
      value: String(vp.customWidth),
    }) as HTMLInputElement;
    const heightInput = h('input', {
      className: 'ait-input',
      type: 'number',
      min: '1',
      value: String(vp.customHeight),
    }) as HTMLInputElement;
    if (disabled) {
      widthInput.disabled = true;
      heightInput.disabled = true;
    }
    widthInput.addEventListener('change', () => {
      const n = Number(widthInput.value);
      if (Number.isFinite(n) && n > 0) aitState.patch('viewport', { customWidth: n });
    });
    heightInput.addEventListener('change', () => {
      const n = Number(heightInput.value);
      if (Number.isFinite(n) && n > 0) aitState.patch('viewport', { customHeight: n });
    });
    customRow.append(
      h('div', { className: 'ait-section-title' }, 'Custom size'),
      h('div', { className: 'ait-row' }, h('label', {}, 'Width (px)'), widthInput),
      h('div', { className: 'ait-row' }, h('label', {}, 'Height (px)'), heightInput),
    );
  }

  // --- Frame decoration toggle ---
  const frameCheckbox = h('input', { type: 'checkbox' }) as HTMLInputElement;
  frameCheckbox.checked = vp.frame;
  if (disabled) frameCheckbox.disabled = true;
  frameCheckbox.addEventListener('change', () => {
    aitState.patch('viewport', { frame: frameCheckbox.checked });
  });

  // --- Status line: applied size ---
  const size = resolveViewportSize(vp);
  const statusText =
    vp.preset === 'none' || size.width === 0
      ? 'No viewport constraint — body fills the window.'
      : `Applied: ${size.width}×${size.height}px (${vp.orientation})`;

  container.append(
    h(
      'div',
      { className: 'ait-section' },
      h('div', { className: 'ait-section-title' }, 'Device'),
      h('div', { className: 'ait-row' }, h('label', {}, 'Preset'), presetSelect),
      h('div', { className: 'ait-row' }, h('label', {}, 'Orientation'), orientationSelect),
    ),
    customRow,
    h(
      'div',
      { className: 'ait-section' },
      h('div', { className: 'ait-section-title' }, 'Appearance'),
      h('div', { className: 'ait-row' }, h('label', {}, 'Show frame'), frameCheckbox),
    ),
    h(
      'div',
      { className: 'ait-section' },
      h('div', { style: 'color:#888;font-size:11px' }, statusText),
    ),
  );

  return container;
}
