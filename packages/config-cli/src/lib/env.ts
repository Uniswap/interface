// Common CI providers set CI=true (GitHub Actions, GitLab, CircleCI, Buildkite, etc.).
// We treat any truthy CI value as "non-interactive"
export function isCIEnv(): boolean {
  const ci = process.env['CI']
  return ci !== undefined && ci !== '' && ci !== 'false' && ci !== '0'
}
