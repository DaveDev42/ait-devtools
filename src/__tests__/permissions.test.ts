import { describe, it, expect, beforeEach } from 'vitest';
import { aitState } from '../mock/state.js';
import { getPermission, openPermissionDialog, checkPermission } from '../mock/permissions.js';

describe('Permissions mock', () => {
  beforeEach(() => {
    aitState.reset();
  });

  it('getPermission: 상태의 권한 값을 반환한다', async () => {
    expect(await getPermission('camera')).toBe('allowed');
    expect(await getPermission('microphone')).toBe('notDetermined');
  });

  it('openPermissionDialog: 이미 allowed면 그대로 반환', async () => {
    expect(await openPermissionDialog('camera')).toBe('allowed');
  });

  it('openPermissionDialog: notDetermined를 allowed로 전환한다', async () => {
    expect(await openPermissionDialog('microphone')).toBe('allowed');
    expect(aitState.state.permissions.microphone).toBe('allowed');
  });

  it('checkPermission: denied일 때 에러를 throw한다', () => {
    aitState.patch('permissions', { camera: 'denied' });
    expect(() => checkPermission('camera', 'openCamera')).toThrow('denied');
  });

  it('checkPermission: allowed일 때 에러 없이 통과한다', () => {
    expect(() => checkPermission('camera', 'openCamera')).not.toThrow();
  });
});
