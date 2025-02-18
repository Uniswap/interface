import { useMemo } from 'react'
import { AnimateInOrder } from 'ui/src/animations/components/AnimateInOrder'
import { Flex } from 'ui/src/components/layout/Flex'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { NewTag } from 'uniswap/src/components/pill/NewTag'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

const ANIMATION_DELAY = 1500

export function AnimatedNetworkLogo({
  promoChainId,
  size,
  selectedChain,
  includeAllNetworks,
}: {
  promoChainId: UniverseChainId
  size: number
  selectedChain: UniverseChainId | null
  includeAllNetworks: boolean | undefined
}): JSX.Element {
  const { defaultChainId } = useEnabledChains()

  const selectedChainLogo = useMemo(() => {
    return <NetworkLogo chainId={selectedChain ?? (includeAllNetworks ? null : defaultChainId)} size={size} />
  }, [defaultChainId, includeAllNetworks, selectedChain, size])

  return (
    <Flex>
      <Flex animation="125ms" enterStyle={{ opacity: 0 }}>
        {selectedChainLogo}
      </Flex>
      <AnimateInOrder index={2} delayMs={ANIMATION_DELAY} position="absolute" zIndex={1}>
        <Flex animation="125ms" enterStyle={{ opacity: 0 }}>
          <NetworkLogo chainId={promoChainId} size={size} />
        </Flex>
      </AnimateInOrder>
      <AnimateInOrder index={3} delayMs={ANIMATION_DELAY} position="absolute" zIndex={1}>
        <Flex
          row
          animation="125ms"
          enterStyle={{ opacity: 0 }}
          position="relative"
          justifyContent="center"
          backgroundColor="$surface2"
        >
          <AnimateInOrder index={1} delayMs={ANIMATION_DELAY} animation="125ms" enterStyle={{ width: 0 }}>
            <Flex position="absolute" right={4} bottom={0}>
              <NewTag />
            </Flex>
          </AnimateInOrder>
          {selectedChainLogo}
        </Flex>
      </AnimateInOrder>
    </Flex>
  )
}
