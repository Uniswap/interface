import { act, renderHook } from '@testing-library/react'
import { PRIVACY_SHARING_OPT_OUT_STORAGE_KEY } from '~/components/PrivacyChoices/privacySharingStore'

async function loadStore() {
  vi.resetModules()
  return (await import('~/components/PrivacyChoices/privacySharingStore')).usePrivacySharingStore
}

describe('usePrivacySharingStore', () => {
  afterEach(() => {
    window.localStorage.clear()
  })

  it('defaults to sharing when nothing is stored', async () => {
    const usePrivacySharingStore = await loadStore()
    expect(usePrivacySharingStore.getState().optOut).toBe(false)
  })

  it('reads an opt-out persisted by the previous jotai atom', async () => {
    window.localStorage.setItem(PRIVACY_SHARING_OPT_OUT_STORAGE_KEY, 'true')
    const usePrivacySharingStore = await loadStore()
    expect(usePrivacySharingStore.getState().optOut).toBe(true)
  })

  it('falls back to sharing when the stored value is malformed', async () => {
    window.localStorage.setItem(PRIVACY_SHARING_OPT_OUT_STORAGE_KEY, '{not json')
    const usePrivacySharingStore = await loadStore()
    expect(usePrivacySharingStore.getState().optOut).toBe(false)
  })

  it('persists in the same raw JSON format', async () => {
    const usePrivacySharingStore = await loadStore()
    act(() => usePrivacySharingStore.getState().setOptOut(true))
    expect(window.localStorage.getItem(PRIVACY_SHARING_OPT_OUT_STORAGE_KEY)).toBe('true')
  })

  it('mirrors an opt-out written by another tab', async () => {
    const usePrivacySharingStore = await loadStore()
    window.localStorage.setItem(PRIVACY_SHARING_OPT_OUT_STORAGE_KEY, 'true')
    window.dispatchEvent(new StorageEvent('storage', { key: PRIVACY_SHARING_OPT_OUT_STORAGE_KEY, newValue: 'true' }))
    expect(usePrivacySharingStore.getState().optOut).toBe(true)
  })

  it('ignores storage events for other keys', async () => {
    const usePrivacySharingStore = await loadStore()
    window.localStorage.setItem(PRIVACY_SHARING_OPT_OUT_STORAGE_KEY, 'true')
    window.dispatchEvent(new StorageEvent('storage', { key: 'unrelated', newValue: 'true' }))
    expect(usePrivacySharingStore.getState().optOut).toBe(false)
  })

  it('toggleShareDeviceIdentifiers inverts the opt-out', async () => {
    const usePrivacySharingStore = await loadStore()
    const { useShareDeviceIdentifiersSetting } = await import('~/components/PrivacyChoices/PrivacySettings')
    const { result } = renderHook(() => useShareDeviceIdentifiersSetting())

    expect(result.current.shareDeviceIdentifiers).toBe(true)
    act(() => result.current.toggleShareDeviceIdentifiers())
    expect(result.current.shareDeviceIdentifiers).toBe(false)
    expect(usePrivacySharingStore.getState().optOut).toBe(true)
  })
})
