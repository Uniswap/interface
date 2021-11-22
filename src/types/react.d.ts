/* eslint-disable @typescript-eslint/ban-types */
interface IMemo<T extends object> extends T {
  __memo: string
}
export type Memo<T> = T extends object ? IMemo<T> : T

declare global {
  namespace React {
    function useMemo<T>(factory: () => T, deps: DependencyList | undefined): Memo<T>
  }
}
