/**
 * Pinned feature flags and experiments for the dev flags box (web, dev/beta only).
 * Persisted in localStorage via a small Zustand store.
 */

import { useCallback } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const STORAGE_KEY = 'uniswap_dev_pinned_gating'

function validatePinned(parsed: unknown): string[] {
  if (!Array.isArray(parsed) || !parsed.every((x) => typeof x === 'string')) {
    return []
  }
  return parsed
}

interface PinnedGatingState {
  pinnedFlags: string[]
  pinnedExperiments: string[]
  pinFlag: (gateName: string) => void
  unpinFlag: (gateName: string) => void
  pinExperiment: (experimentName: string) => void
  unpinExperiment: (experimentName: string) => void
}

const usePinnedGatingStore = create<PinnedGatingState>()(
  persist(
    (set) => ({
      pinnedFlags: [],
      pinnedExperiments: [],
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
                      state: { pinnedFlags: unknown; pinnedExperiments: unknown }
                    }
                  ).state
                : null
            const pinnedFlags = state?.pinnedFlags != null ? validatePinned(state.pinnedFlags) : []
            const pinnedExperiments = state?.pinnedExperiments != null ? validatePinned(state.pinnedExperiments) : []
            return { state: { pinnedFlags, pinnedExperiments }, version: 0 }
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
  const pinnedFlags = usePinnedGatingStore((state) => state.pinnedFlags)
  const pinFlag = usePinnedGatingStore((state) => state.pinFlag)
  const unpinFlag = usePinnedGatingStore((state) => state.unpinFlag)

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
