import { create } from 'zustand'

export type Implementation = 'native' | 'js' | 'both'

export interface BenchmarkResult {
  implementation: 'native' | 'js'
  difficulty: number
  counter: string | null
  attempts: number
  timeMs: number
  hashRate: number
}

interface BenchmarkProgress {
  isRunning: boolean
  currentImpl: 'native' | 'js' | null
  difficulty: number
  startTime: number | null
  elapsedMs: number
  estimatedAttempts: number
}

export interface LogEntry {
  timestamp: Date
  message: string
  type: 'info' | 'success' | 'error'
}

interface HashcashBenchmarkState {
  // State
  results: BenchmarkResult[]
  selectedDifficulty: number
  selectedImpl: Implementation
  logs: LogEntry[]
  progress: BenchmarkProgress
  measuredHashRate: number | null
  isCancelled: boolean

  // Actions
  setDifficulty: (difficulty: number) => void
  setImpl: (impl: Implementation) => void
  addResult: (result: BenchmarkResult) => void
  clearResults: () => void
  addLog: (message: string, type?: 'info' | 'success' | 'error') => void
  clearLogs: () => void
  startBenchmark: (impl: 'native' | 'js', difficulty: number) => void
  updateProgress: (elapsedMs: number, estimatedAttempts: number) => void
  endBenchmark: () => void
  cancel: () => void
  resetCancel: () => void
}

const initialProgress: BenchmarkProgress = {
  isRunning: false,
  currentImpl: null,
  difficulty: 0,
  startTime: null,
  elapsedMs: 0,
  estimatedAttempts: 0,
}

export const useHashcashBenchmarkStore = create<HashcashBenchmarkState>((set) => ({
  results: [],
  selectedDifficulty: 2,
  selectedImpl: 'both',
  logs: [],
  progress: initialProgress,
  measuredHashRate: null,
  isCancelled: false,

  setDifficulty: (difficulty): void => set({ selectedDifficulty: difficulty }),

  setImpl: (impl): void => set({ selectedImpl: impl }),

  addResult: (result): void =>
    set((state) => ({
      results: [...state.results, result],
      // Auto-update measured hash rate from native results
      measuredHashRate:
        result.implementation === 'native' && result.hashRate > 0 ? result.hashRate : state.measuredHashRate,
    })),

  clearResults: (): void => set({ results: [] }),

  addLog: (message, type = 'info'): void =>
    set((state) => ({
      logs: [...state.logs.slice(-19), { timestamp: new Date(), message, type }],
    })),

  clearLogs: (): void => set({ logs: [] }),

  startBenchmark: (impl, difficulty): void =>
    set({
      isCancelled: false,
      progress: {
        isRunning: true,
        currentImpl: impl,
        difficulty,
        // null for JS because it blocks the thread - no progress updates possible
        startTime: impl === 'native' ? performance.now() : null,
        elapsedMs: 0,
        estimatedAttempts: 0,
      },
    }),

  updateProgress: (elapsedMs, estimatedAttempts): void =>
    set((state) => ({
      progress: { ...state.progress, elapsedMs, estimatedAttempts },
    })),

  endBenchmark: (): void => set({ progress: initialProgress }),

  cancel: (): void => set({ isCancelled: true, progress: initialProgress }),

  resetCancel: (): void => set({ isCancelled: false }),
}))
