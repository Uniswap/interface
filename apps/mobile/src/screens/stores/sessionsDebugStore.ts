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

  setSession: (session): void => set({ session }),

  setChallenge: (challenge): void => set({ challenge }),

  startOperation: (operation): void => set({ isLoading: true, currentOperation: operation }),

  endOperation: (): void => set({ isLoading: false, currentOperation: null }),

  addLog: (message, type = 'info'): void =>
    set((state) => ({
      logs: [...state.logs.slice(-19), { timestamp: new Date(), message, type }],
    })),

  clearLogs: (): void => set({ logs: [] }),

  startHashcash: (difficulty): void =>
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

  updateHashcashProgress: (elapsedMs, estimatedAttempts): void =>
    set((state) => ({
      hashcashProgress: { ...state.hashcashProgress, elapsedMs, estimatedAttempts },
    })),

  completeHashcash: (result): void =>
    set((state) => ({
      hashcashProgress: { ...state.hashcashProgress, isRunning: false, actualResult: result },
    })),

  stopHashcash: (): void =>
    set((state) => ({
      hashcashProgress: { ...state.hashcashProgress, isRunning: false },
    })),

  reset: (): void => set(initialState),
}))
