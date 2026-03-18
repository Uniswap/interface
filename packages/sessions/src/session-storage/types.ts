interface SessionState {
  sessionId: string
}

/**
 * Interface to interact with session storage.
 * For business logic and dependencies, see {@link createSessionStorage}
 */
interface SessionStorage {
  get(): Promise<SessionState | null>
  set(session: SessionState): Promise<void>
  clear(): Promise<void>
}

export type { SessionStorage, SessionState }
