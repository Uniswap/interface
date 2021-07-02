export function useIsIframe() {
  return window !== window.parent
}
