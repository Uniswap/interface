import type { ChallengeResponse, HashcashSolveAnalytics } from '@universe/sessions'
import { create } from 'zustand'

interface SessionState {
  sessionId: string | null
  deviceId: string | null
  uniswapIdentifier: string | null
}

export interface LogEntry {
  timestamp: Date
  message: string
  type: 'info' | 'success' | 'error'
}

interface HashcashProgress {
  isRunning: boolean
  difficulty: number
  estimatedAttempts: number
  elapsedMs: number
  startTime: number | null
  actualResult: HashcashSolveAnalytics | null
}

interface SessionsDebugState {
  // State
  session: SessionState
  challenge: ChallengeResponse | null
  isLoading: boolean
  currentOperation: string | null
  logs: LogEntry[]
  hashcashProgress: HashcashProgress

  // Actions
  setSession: (session: SessionState) => void
  setChallenge: (challenge: ChallengeResponse | null) => void
  startOperation: (operation: string) => void
  endOperation: () => void
  addLog: (message: string, type?: 'info' | 'success' | 'error') => void
  clearLogs: () => void
  startHashcash: (difficulty: number) => void
  updateHashcashProgress: (elapsedMs: number, estimatedAttempts: number) => void
  completeHashcash: (result: HashcashSolveAnalytics) => void
  stopHashcash: () => void
  reset: () => void
}

const initialHashcashProgress: HashcashProgress = {
  isRunning: false,
  difficulty: 0,
  estimatedAttempts: 0,
  elapsedMs: 0,
  startTime: null,
  actualResult: null,
}

const initialState = {
  session: { sessionId: null, deviceId: null, uniswapIdentifier: null },
  challenge: null,
  isLoading: false,
  currentOperation: null,
  logs: [] as LogEntry[],
  hashcashProgress: initialHashcashProgress,
}

export const useSessionsDebugStore = create<SessionsDebugState>((set) => ({
  ...initialState,

  setSession: (session) => set({ session }),

  setChallenge: (challenge) => set({ challenge }),

  startOperation: (operation) => set({ isLoading: true, currentOperation: operation }),

  endOperation: () => set({ isLoading: false, currentOperation: null }),

  addLog: (message, type = 'info') =>
    set((state) => ({
      logs: [...state.logs.slice(-19), { timestamp: new Date(), message, type }],
    })),

  clearLogs: () => set({ logs: [] }),

  startHashcash: (difficulty) =>
    set({
      hashcashProgress: {
        isRunning: true,
        difficulty,
        estimatedAttempts: 0,
        elapsedMs: 0,
        startTime: performance.now(),
        actualResult: null,
      },
    }),

  updateHashcashProgress: (elapsedMs, estimatedAttempts) =>
    set((state) => ({
      hashcashProgress: { ...state.hashcashProgress, elapsedMs, estimatedAttempts },
    })),

  completeHashcash: (result) =>
    set((state) => ({
      hashcashProgress: { ...state.hashcashProgress, isRunning: false, actualResult: result },
    })),

  stopHashcash: () =>
    set((state) => ({
      hashcashProgress: { ...state.hashcashProgress, isRunning: false },
    })),

  reset: () => set(initialState),
}))
