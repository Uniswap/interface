/* eslint-disable @typescript-eslint/ban-types */
declare global {
  interface Memoized<T extends object> extends T {
    __memoized: string
  }
  type Memo<T> = T extends object ? Memoized<T> : T

  namespace React {
    function useMemo<T>(factory: () => T, deps: DependencyList | undefined): Memo<T>
  }
}
