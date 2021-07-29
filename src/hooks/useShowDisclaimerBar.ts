export const useDisclaimerBar = (): boolean => {
  return !window.location.host.includes('swapr.eth') && !window.location.host.includes('localhost')
}
