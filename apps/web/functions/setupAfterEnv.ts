// Fetches may error, but they go through a proxy so they cannot be mocked.
// To avoid flakes from a bad backend, we retry.
jest.retryTimes(3, { logErrorsBeforeRetry: true })
