import '~/features/Toucan/Auction/Bids/AuctionGraduated.css'
import { ReactNode } from 'react'
import { Flex, useSporeColors } from 'ui/src'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { useTokenLaunchedBannerColorData } from '~/features/Toucan/Auction/Banners/TokenLaunched/useTokenLaunchedBannerColorData'

// Card + content metrics from the Token Launcher Figma (node 12017-14410, 400x330 frame).
const CARD_MIN_HEIGHT = 330
const LOGO_TOP = 43
const CONTENT_BOTTOM = 20
const LOGO_SIZE = 64

/**
 * Shared visual shell for the graduated card: the gradient surface, floating blurred token
 * logos, bottom glow (token accent), and the centered token logo at the top. The content area
 * fills the card height so callers can lay out top-anchored content and, if needed, anchor a
 * group to the bottom via `justifyContent="space-between"`.
 */
export function GraduatedCardFrame({
  auctionLogoUrl,
  auctionSymbol,
  chainId,
  tokenColor,
  children,
}: {
  auctionLogoUrl: Maybe<string>
  auctionSymbol?: string
  chainId: number
  tokenColor?: string
  children: ReactNode
}) {
  const colors = useSporeColors()
  const { bannerGradient, accentColor } = useTokenLaunchedBannerColorData({
    tokenColor,
    colors,
    gradientLtr: false,
  })

  return (
    <Flex gap="$spacing8" width="100%">
      <Flex
        position="relative"
        overflow="hidden"
        borderRadius="$rounded24"
        borderWidth="$spacing1"
        borderColor="$surface3"
        backgroundColor="$surface1"
        minHeight={CARD_MIN_HEIGHT}
        width="100%"
        style={bannerGradient}
      >
        {/* Floating token logos with blur (Figma node 12017-14410) */}
        <Flex
          position="absolute"
          left={319}
          top={225.24}
          opacity={0.54}
          style={{ filter: 'blur(0.875px)', animation: 'float1 8s ease-in-out infinite' }}
        >
          <TokenLogo url={auctionLogoUrl} chainId={chainId} symbol={auctionSymbol} size={57.771} hideNetworkLogo />
        </Flex>
        <Flex
          position="absolute"
          left={65.5}
          top={-16.71}
          opacity={0.24}
          style={{ filter: 'blur(6.774px)', animation: 'float2 10s ease-in-out infinite 1s' }}
        >
          <TokenLogo url={auctionLogoUrl} chainId={chainId} symbol={auctionSymbol} size={45.161} hideNetworkLogo />
        </Flex>
        <Flex
          position="absolute"
          left={336.47}
          top={115.39}
          opacity={0.24}
          style={{ filter: 'blur(6.774px)', animation: 'float3 9s ease-in-out infinite 2s' }}
        >
          <TokenLogo url={auctionLogoUrl} chainId={chainId} symbol={auctionSymbol} size={45.161} hideNetworkLogo />
        </Flex>
        <Flex
          position="absolute"
          left={280.02}
          top={-28}
          opacity={0.54}
          style={{ filter: 'blur(2.258px)', animation: 'float4 11s ease-in-out infinite 0.5s' }}
        >
          <TokenLogo url={auctionLogoUrl} chainId={chainId} symbol={auctionSymbol} size={56.452} hideNetworkLogo />
        </Flex>
        <Flex
          position="absolute"
          left={-16.92}
          top={152.64}
          opacity={0.54}
          style={{ filter: 'blur(2.258px)', animation: 'float5 7s ease-in-out infinite 1.5s' }}
        >
          <TokenLogo url={auctionLogoUrl} chainId={chainId} symbol={auctionSymbol} size={56.452} hideNetworkLogo />
        </Flex>

        {/* Bottom glow — token-extracted accent */}
        <Flex
          position="absolute"
          bottom={-251}
          left="50%"
          width={299}
          height={299}
          borderRadius={999}
          backgroundColor={accentColor}
          opacity={0.3}
          style={{ transform: 'translateX(-50%)', filter: 'blur(100px)' }}
        />

        {/* Content: token logo at top, children fill the rest */}
        <Flex
          position="relative"
          zIndex={1}
          flex={1}
          width="100%"
          alignItems="center"
          pt={LOGO_TOP}
          pb={CONTENT_BOTTOM}
          px="$spacing20"
        >
          <TokenLogo url={auctionLogoUrl} chainId={chainId} symbol={auctionSymbol} size={LOGO_SIZE} />
          {children}
        </Flex>
      </Flex>
    </Flex>
  )
}
