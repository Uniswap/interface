/**
 * Minimal uniwind stand-in for the button-compat vitest suites.
 *
 * The native leg resolves its children's concrete colour through uniwind's
 * public `useResolveClassNames`. Under mycelium's jsdom config the `uniwind`
 * specifier lands on the package's TypeScript SOURCE (its `react-native` export
 * condition), which Node cannot parse — `SyntaxError: Unexpected token
 * 'typeof'`. Merely IMPORTING the native leg trips it, so it is mocked here
 * alongside react-native / gesture-handler / reanimated for the same reason.
 *
 * This is a stand-in for a NATIVE-ONLY dependency in a jsdom suite, not a
 * substitute for proving the resolution: the real hook only runs under
 * uniwind's own bundler pipeline, i.e. on device.
 */
export const useResolveClassNames = (_className: string): Record<string, unknown> => ({})

export const useUniwind = (): { theme: string } => ({ theme: 'light' })

export const Uniwind = {
  setTheme: (): void => undefined,
}
