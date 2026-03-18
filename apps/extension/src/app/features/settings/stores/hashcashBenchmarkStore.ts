import { create } from 'zustand'

export type Implementation = 'worker' | 'multi-worker' | 'js' | 'all'

export interface BenchmarkResult {
  implementation: 'worker' | 'multi-worker' | 'js'
  difficulty: number
  counter: string | null
  attempts: number
  timeMs: number
  hashRate: number
}

interface BenchmarkProgress {
  isRunning: boolean
  currentImpl: 'worker' | 'multi-worker' | 'js' | null
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
  startBenchmark: (impl: 'worker' | 'multi-worker' | 'js', difficulty: number) => void
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
  selectedImpl: 'all',
  logs: [],
  progress: initialProgress,
  measuredHashRate: null,
  isCancelled: false,

  setDifficulty: (difficulty) => set({ selectedDifficulty: difficulty }),

  setImpl: (impl) => set({ selectedImpl: impl }),

  addResult: (result) =>
    set((state) => ({
      results: [...state.results, result],
      // Auto-update measured hash rate from worker/multi-worker results
      measuredHashRate:
        (result.implementation === 'worker' || result.implementation === 'multi-worker') && result.hashRate > 0
          ? result.hashRate
          : state.measuredHashRate,
    })),

  clearResults: () => set({ results: [] }),

  addLog: (message, type = 'info') =>
    set((state) => ({
      logs: [...state.logs.slice(-19), { timestamp: new Date(), message, type }],
    })),

  clearLogs: () => set({ logs: [] }),

  startBenchmark: (impl, difficulty) =>
    set({
      isCancelled: false,
      progress: {
        isRunning: true,
        currentImpl: impl,
        difficulty,
        // Worker/multi-worker runs async so we can track progress, JS blocks the thread
        startTime: impl === 'worker' || impl === 'multi-worker' ? performance.now() : null,
        elapsedMs: 0,
        estimatedAttempts: 0,
      },
    }),

  updateProgress: (elapsedMs, estimatedAttempts) =>
    set((state) => ({
      progress: { ...state.progress, elapsedMs, estimatedAttempts },
    })),

  endBenchmark: () => set({ progress: initialProgress }),

  cancel: () => set({ isCancelled: true, progress: initialProgress }),

  resetCancel: () => set({ isCancelled: false }),
}))
