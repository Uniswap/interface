interface SessionService {
  initSession(): Promise<void>
  removeSession(): Promise<void>
  getSessionState(): Promise<{
    sessionId: string
  } | null>
}

export type { SessionService }
