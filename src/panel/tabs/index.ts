import { renderEnvTab } from './environment.js';
import { renderPermissionsTab } from './permissions.js';
import { renderLocationTab } from './location.js';
import { renderDeviceTab } from './device.js';
import { renderIapTab } from './iap.js';
import { renderEventsTab } from './events.js';
import { renderAnalyticsTab } from './analytics.js';
import { renderStorageTab } from './storage.js';

export type TabId = 'env' | 'permissions' | 'location' | 'iap' | 'events' | 'analytics' | 'storage' | 'device';

export const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'env', label: 'Environment' },
  { id: 'permissions', label: 'Permissions' },
  { id: 'location', label: 'Location' },
  { id: 'device', label: 'Device' },
  { id: 'iap', label: 'IAP' },
  { id: 'events', label: 'Events' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'storage', label: 'Storage' },
];

export function createTabRenderers(refreshPanel: () => void): Record<TabId, () => HTMLElement> {
  return {
    env: renderEnvTab,
    permissions: renderPermissionsTab,
    location: renderLocationTab,
    device: () => renderDeviceTab(refreshPanel),
    iap: renderIapTab,
    events: renderEventsTab,
    analytics: () => renderAnalyticsTab(refreshPanel),
    storage: () => renderStorageTab(refreshPanel),
  };
}
