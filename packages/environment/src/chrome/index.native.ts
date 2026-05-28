export function getChrome(): undefined {
  return undefined
}

export function getChromeWithThrow(): void {
  throw new Error('`chrome` is not available in this context')
}

export function getChromeRuntime(): undefined {
  return undefined
}

export function getChromeRuntimeWithThrow(): void {
  throw new Error('`chrome.runtime` is not available in this context')
}
