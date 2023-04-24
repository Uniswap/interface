export function isTest(
  jestWorkerId: Maybe<string> = process.env.JEST_WORKER_ID
): boolean {
  return Boolean(jestWorkerId)
}
