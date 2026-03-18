export enum SessionsEventName {
  // Session lifecycle
  SessionInitCompleted = 'Session Init Completed',
  SessionInitStarted = 'Session Init Started',
  // Challenge flow
  ChallengeReceived = 'Challenge Received',
  VerifyCompleted = 'Verify Completed',
  // Solver-specific events
  HashcashSolveCompleted = 'Hashcash Solve Completed',
  TurnstileSolveCompleted = 'Turnstile Solve Completed',
  // alphabetize additional values.
}
