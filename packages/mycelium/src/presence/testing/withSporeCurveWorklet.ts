import { readFileSync } from 'node:fs'

/**
 * A completion callback passed through `withSporeCurve` is not auto-workletized.
 * Reanimated only transforms callbacks passed directly to `withTiming` / `withSpring`.
 * Without a `'worklet'` directive the callback is plain JS on the UI runtime and
 * invoking it hard-crashes iOS Fabric. Vitest cannot observe that babel transform.
 */
export function expectWithSporeCurveCallbacksAreWorklets(sourcePath: string): void {
  const source = readFileSync(sourcePath, 'utf-8')
  const marker = 'withSporeCurve('
  let cursor = source.indexOf(marker)
  let callSites = 0
  let callbackSites = 0
  while (cursor !== -1) {
    callSites += 1
    const args = argListOf(source, cursor + marker.length)
    if (args.includes('=>')) {
      callbackSites += 1
      // The directive must be the first statement of the callback body. Comments before it are fine.
      const body = args.slice(args.indexOf('=>'))
      const firstStatement = body
        .split('\n')
        .slice(1)
        .map((line) => line.trim())
        .filter((line) => line !== '' && !line.startsWith('//'))[0]
      if (firstStatement !== "'worklet'") {
        throw new Error(`${sourcePath} withSporeCurve callback is missing 'worklet'`)
      }
    }
    cursor = source.indexOf(marker, cursor + marker.length)
  }
  if (callSites === 0 || callbackSites === 0) {
    throw new Error(`${sourcePath} has no withSporeCurve completion callback`)
  }
}

// Walk each call's own argument list (balanced parens), so a later call's arrow
// can't bleed into a callback-less call's window.
function argListOf(source: string, from: number): string {
  let depth = 1
  for (let i = from; i < source.length; i += 1) {
    const char = source[i]
    if (char === '(') {
      depth += 1
    } else if (char === ')') {
      depth -= 1
      if (depth === 0) {
        return source.slice(from, i)
      }
    }
  }
  throw new Error('unbalanced withSporeCurve call')
}
