import { Flex, LinearGradient } from '@universe/mycelium'
import { useMemo } from 'react'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { shuffleArray } from 'uniswap/src/components/IconCloud/utils'
import { approvedERC20, InteractiveToken } from '~/pages/Landing/assets/approvedTokens'

const TOKEN_SIZE = 40
// Enough tokens that the duplicated strip is always wider than the modal, keeping the loop seamless.
const CAROUSEL_TOKEN_COUNT = 12

// The strip is rendered twice, so animating 0 -> -50% scrolls tokens right-to-left in a seamless loop.
const scrollKeyframes = `
  @keyframes ew-onboarding-token-scroll {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-50%);
    }
  }
`

function TokenStrip({ tokens }: { tokens: InteractiveToken[] }): JSX.Element {
  return (
    <>
      {tokens.map((token) => (
        <Flex key={`${token.chain}-${token.address}`} mr="$gap32">
          <TokenLogo url={token.logoUrl} symbol={token.symbol} size={TOKEN_SIZE} />
        </Flex>
      ))}
    </>
  )
}

/**
 * A slow, looping strip of high-volume allowlisted token logos that scrolls left-to-right
 * behind the welcome screen's Uniswap logo, fading out at both edges.
 */
export function TokenCarousel(): JSX.Element {
  const tokens = useMemo(() => shuffleArray(approvedERC20).slice(0, CAROUSEL_TOKEN_COUNT), [])

  return (
    <>
      <style>{scrollKeyframes}</style>
      <Flex height={TOKEN_SIZE} width="100%" overflow="hidden">
        <LinearGradient
          colors={['$surface1', '$transparent', '$transparent', '$surface1']}
          locations={[0, 0.4, 0.6, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          position="absolute"
          height="100%"
          top={0}
          left={0}
          right={0}
          bottom={0}
          zIndex={1}
          pointerEvents="none"
        />
        <Flex
          row
          position="absolute"
          top={0}
          left={0}
          style={{ animation: 'ew-onboarding-token-scroll 90s linear infinite' }}
        >
          <TokenStrip tokens={tokens} />
          {/* Duplicate strip so the loop reads as continuous */}
          <TokenStrip tokens={tokens} />
        </Flex>
      </Flex>
    </>
  )
}
