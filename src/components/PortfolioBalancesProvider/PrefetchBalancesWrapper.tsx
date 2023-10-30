import { useCachedPortfolioBalances } from 'components/PortfolioBalancesProvider'
import useHoverProps from 'hooks/useHoverProps'
import { PropsWithChildren } from 'react'

/* Prefetches & caches portfolio balances when the wrapped component is hovered */
export default function PrefetchBalancesWrapper({ children, className }: PropsWithChildren<{ className?: string }>) {
  const [hover, hoverProps] = useHoverProps()
  useCachedPortfolioBalances({ freshBalancesRequired: hover })

  return (
    <div {...hoverProps} className={className}>
      {children}
    </div>
  )
}
