import { create } from 'zustand'

export const PRIVACY_SHARING_OPT_OUT_STORAGE_KEY = 'optOutPrivacySharing'

interface PrivacySharingState {
  optOut: boolean
  setOptOut: (optOut: boolean) => void
  toggleOptOut: () => void
}

// Reads/writes the raw JSON boolean that the former jotai `atomWithStorage` persisted under the same
// key, so existing opt-outs carry over (zustand's `persist` would wrap it in `{ state, version }`).
function readOptOut(): boolean {
  try {
    return JSON.parse(window.localStorage.getItem(PRIVACY_SHARING_OPT_OUT_STORAGE_KEY) ?? 'false') === true
  } catch {
    return false
  }
}

function writeOptOut(optOut: boolean): void {
  try {
    window.localStorage.setItem(PRIVACY_SHARING_OPT_OUT_STORAGE_KEY, JSON.stringify(optOut))
  } catch {
    // Storage unavailable (private mode / blocked): the choice still applies for this session.
  }
}

export const usePrivacySharingStore = create<PrivacySharingState>()((set, get) => ({
  optOut: readOptOut(),
  setOptOut: (optOut) => {
    writeOptOut(optOut)
    set({ optOut })
  },
  toggleOptOut: () => get().setOptOut(!get().optOut),
}))

// The jotai atom this replaced subscribed to `storage`, so an opt-out in one tab reached the others.
window.addEventListener('storage', (event) => {
  if (event.key === PRIVACY_SHARING_OPT_OUT_STORAGE_KEY) {
    usePrivacySharingStore.setState({ optOut: readOptOut() })
  }
})
