interface SessionState {
  sessionId: string
}

interface SessionStorage {
  get(): Promise<SessionState | null>
  set(session: SessionState): Promise<void>
  clear(): Promise<void>
}

export type { SessionStorage, SessionState }
