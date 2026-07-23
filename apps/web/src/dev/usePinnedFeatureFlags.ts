/**
 * Pinned feature flags and experiments for the dev flags box (web, dev/beta only).
 * Persisted in localStorage via a small Zustand store.
 */

import { WEB_FEATURE_FLAG_NAMES } from '@universe/gating'
import { useCallback, useMemo } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const STORAGE_KEY = 'uniswap_dev_pinned_gating'

// Gate names no longer present here (e.g. the flag was removed from packages/gating/src/flags.ts)
// are dropped from the pinned list below, since they no longer appear in the feature flag modal either.
const KNOWN_FLAG_NAMES = new Set(WEB_FEATURE_FLAG_NAMES.values())

function validatePinned(parsed: unknown): string[] {
  if (!Array.isArray(parsed) || !parsed.every((x) => typeof x === 'string')) {
    return []
  }
  return parsed
}

interface PinnedGatingState {
  pinnedFlags: string[]
  pinnedExperiments: string[]
  pinnedGroups: string[]
  pinFlag: (gateName: string) => void
  unpinFlag: (gateName: string) => void
  pinExperiment: (experimentName: string) => void
  unpinExperiment: (experimentName: string) => void
  pinGroup: (groupName: string) => void
  unpinGroup: (groupName: string) => void
}

const usePinnedGatingStore = create<PinnedGatingState>()(
  persist(
    (set) => ({
      pinnedFlags: [],
      pinnedExperiments: [],
      pinnedGroups: [],
      pinFlag: (gateName: string) => {
        set((state) =>
          state.pinnedFlags.includes(gateName) ? state : { pinnedFlags: [...state.pinnedFlags, gateName] },
        )
      },
      unpinFlag: (gateName: string) => {
        set((state) => ({
          pinnedFlags: state.pinnedFlags.filter((n) => n !== gateName),
        }))
      },
      pinExperiment: (experimentName: string) => {
        set((state) =>
          state.pinnedExperiments.includes(experimentName)
            ? state
            : { pinnedExperiments: [...state.pinnedExperiments, experimentName] },
        )
      },
      unpinExperiment: (experimentName: string) => {
        set((state) => ({
          pinnedExperiments: state.pinnedExperiments.filter((n) => n !== experimentName),
        }))
      },
      pinGroup: (groupName: string) => {
        set((state) =>
          state.pinnedGroups.includes(groupName) ? state : { pinnedGroups: [...state.pinnedGroups, groupName] },
        )
      },
      unpinGroup: (groupName: string) => {
        set((state) => ({
          pinnedGroups: state.pinnedGroups.filter((n) => n !== groupName),
        }))
      },
    }),
    {
      name: STORAGE_KEY,
      storage: {
        getItem: (name) => {
          try {
            const raw = localStorage.getItem(name)
            if (!raw) {
              return null
            }
            const parsed = JSON.parse(raw) as unknown
            const state =
              parsed && typeof parsed === 'object' && 'state' in parsed
                ? (
                    parsed as {
                      state: { pinnedFlags: unknown; pinnedExperiments: unknown; pinnedGroups: unknown }
                    }
                  ).state
                : null
            const pinnedFlags = state?.pinnedFlags != null ? validatePinned(state.pinnedFlags) : []
            const pinnedExperiments = state?.pinnedExperiments != null ? validatePinned(state.pinnedExperiments) : []
            const pinnedGroups = state?.pinnedGroups != null ? validatePinned(state.pinnedGroups) : []
            return { state: { pinnedFlags, pinnedExperiments, pinnedGroups }, version: 0 }
          } catch {
            return null
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value))
          } catch {
            // localStorage may be disabled (e.g. private browsing)
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name)
          } catch {
            // ignore
          }
        },
      },
    },
  ),
)

export function usePinnedFeatureFlags(): {
  pinnedFlags: string[]
  pinFlag: (gateName: string) => void
  unpinFlag: (gateName: string) => void
  isPinned: (gateName: string) => boolean
} {
  const rawPinnedFlags = usePinnedGatingStore((state) => state.pinnedFlags)
  const pinFlag = usePinnedGatingStore((state) => state.pinFlag)
  const unpinFlag = usePinnedGatingStore((state) => state.unpinFlag)

  const pinnedFlags = useMemo(() => rawPinnedFlags.filter((name) => KNOWN_FLAG_NAMES.has(name)), [rawPinnedFlags])

  const isPinned = useCallback((gateName: string) => pinnedFlags.includes(gateName), [pinnedFlags])

  return { pinnedFlags, pinFlag, unpinFlag, isPinned }
}

export function usePinnedExperiments(): {
  pinnedExperiments: string[]
  pinExperiment: (experimentName: string) => void
  unpinExperiment: (experimentName: string) => void
  isPinned: (experimentName: string) => boolean
} {
  const pinnedExperiments = usePinnedGatingStore((state) => state.pinnedExperiments)
  const pinExperiment = usePinnedGatingStore((state) => state.pinExperiment)
  const unpinExperiment = usePinnedGatingStore((state) => state.unpinExperiment)

  const isPinned = useCallback(
    (experimentName: string) => pinnedExperiments.includes(experimentName),
    [pinnedExperiments],
  )

  return { pinnedExperiments, pinExperiment, unpinExperiment, isPinned }
}

export function usePinnedFlagGroups(): {
  pinnedGroups: string[]
  pinGroup: (groupName: string) => void
  unpinGroup: (groupName: string) => void
  isPinned: (groupName: string) => boolean
} {
  const pinnedGroups = usePinnedGatingStore((state) => state.pinnedGroups)
  const pinGroup = usePinnedGatingStore((state) => state.pinGroup)
  const unpinGroup = usePinnedGatingStore((state) => state.unpinGroup)

  const isPinned = useCallback((groupName: string) => pinnedGroups.includes(groupName), [pinnedGroups])

  return { pinnedGroups, pinGroup, unpinGroup, isPinned }
}
