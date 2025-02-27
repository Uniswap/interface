import { useMedia } from 'ui/src'

export function useIsMobile(): boolean {
  const media = useMedia()
  return media.md
}
