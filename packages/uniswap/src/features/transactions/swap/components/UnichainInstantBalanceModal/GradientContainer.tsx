import { ReactNode } from 'react'
import { Flex } from 'ui/src'
import { opacify } from 'ui/src/theme'
import { useBackgroundColor } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/hooks/useBackgroundColor'
import { isInterfaceDesktop } from 'utilities/src/platform'

export function GradientContainer({
  tokenBackground,
  children,
}: {
  tokenBackground: string
  children: ReactNode
}): ReactNode {
  const backgroundColor = useBackgroundColor()

  if (isInterfaceDesktop) {
    // for interface, use CSS gradient via background prop
    return (
      <Flex
        background={`linear-gradient(180deg, ${opacify(20, tokenBackground)} 0%, ${backgroundColor} 75%)`}
        borderRadius="$rounded16"
        overflow="hidden"
      >
        {children}
      </Flex>
    )
  }

  // do not wrap in gradient for wallet
  return children
}
