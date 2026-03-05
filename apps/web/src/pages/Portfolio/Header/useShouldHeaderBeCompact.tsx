import { useScrollCompact } from '~/hooks/useScrollCompact'
import { useShowDemoView } from '~/pages/Portfolio/hooks/useShowDemoView'

export function useShouldHeaderBeCompact(scrollY?: number): boolean {
  const showDemoView = useShowDemoView()
  return useScrollCompact({
    scrollY,
    enabled: !showDemoView,
  })
}
