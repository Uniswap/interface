import { approvedERC20 } from 'pages/Landing/assets/approvedTokens'
import { Flex, useSporeColors } from 'ui/src'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'

const TOKEN_SIZE = 40

const scrollKeyframes = `
  @keyframes scroll {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(calc(-50%));
    }
  }
`

function Tokens() {
  return approvedERC20.map((token) => (
    <Flex key={token.address} mr="$gap32">
      <TokenLogo url={token.logoUrl} symbol={token.symbol} size={TOKEN_SIZE} />
    </Flex>
  ))
}

export function TokenCarousel() {
  const colors = useSporeColors()

  return (
    <>
      <style>{scrollKeyframes}</style>
      <Flex height={TOKEN_SIZE} width="100%" overflow="hidden">
        <Flex
          position="absolute"
          height="100%"
          top={0}
          left={0}
          right={0}
          bottom={0}
          zIndex={1}
          style={{
            background: `linear-gradient(90deg, ${colors.surface1.variable} 0%, ${colors.transparent.variable} 40%, ${colors.transparent.variable} 60%, ${colors.surface1.variable} 100%)`,
          }}
        />
        <Flex row position="absolute" top="0" left="0" style={{ animation: 'scroll 90s linear infinite' }}>
          <Tokens />
          {/* Duplicate circles to make the scrolling look continuous */}
          <Tokens />
        </Flex>
      </Flex>
    </>
  )
}
