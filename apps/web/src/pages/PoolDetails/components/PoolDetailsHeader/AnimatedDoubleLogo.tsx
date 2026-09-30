import type { Currency } from '@uniswap/sdk-core'
import { Flex } from '@universe/mycelium'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { TestID } from '@universe/test'
import { useMemo } from 'react'
import type { ParsedToken } from 'uniswap/src/features/dataApi/utils/parsedToken'
import { v2TokenToCurrency } from 'uniswap/src/features/dataApi/utils/parsedToken'
import { DoubleCurrencyLogo, type ServedLogo } from '~/components/Logo/DoubleLogo'
import { HEADER_LOGO_SIZE, HEADER_TRANSITION } from '~/components/StickyCollapsibleHeader/constants'
import {
  getDetailHeaderLogoSize,
  getPoolHeaderLogoWidth,
  POOL_HEADER_STACKED_LOGO_WIDTH,
} from '~/components/StickyCollapsibleHeader/getHeaderLogoSize'

export function AnimatedDoubleLogo({
  token0,
  token1,
  isCompact,
  stacked = false,
  includeNetwork = true,
}: {
  token0?: ParsedToken
  token1?: ParsedToken
  isCompact: boolean
  // When true, render two full logos overlapping horizontally (mirrors the position detail header).
  stacked?: boolean
  // When false, no network badge renders on the logo (the surrounding layout shows the network instead).
  includeNetwork?: boolean
}): JSX.Element {
  const media = useMedia()
  const logoSize = getDetailHeaderLogoSize({ isCompact, media })
  // GetPool serves each leg's logo. Without them only a common-base leg resolves synchronously, so the
  // header shows that leg alone until the other's per-token lookup returns.
  const { currencies, servedLogos } = useMemo((): {
    currencies: (Currency | undefined)[]
    servedLogos?: ServedLogo[]
  } => {
    if (!token0 || !token1) {
      return { currencies: [] }
    }
    const tokens = [token0, token1]
    const legs = tokens.map(v2TokenToCurrency)
    return {
      currencies: legs,
      servedLogos: tokens.map((token, i) => ({ currency: legs[i], logoUrl: token.logoUrl })),
    }
  }, [token0, token1])

  const expandedSize = HEADER_LOGO_SIZE.expanded
  const scale = logoSize / expandedSize
  // Stacked draws two full logos overlapping horizontally, so the intrinsic box is wider than tall.
  // The stacked footprint comes from getPoolHeaderLogoWidth, shared with PoolDetailsHeaderSkeleton so the
  // reserved and loaded widths cannot drift; see the note there on why it is never narrowed to one logo.
  const containerWidth = stacked ? POOL_HEADER_STACKED_LOGO_WIDTH : expandedSize
  const outerWidth = stacked ? getPoolHeaderLogoWidth({ isCompact, media }) : expandedSize * scale
  return (
    <Flex height={expandedSize * scale} width={outerWidth} transition={HEADER_TRANSITION}>
      <Flex
        height={expandedSize}
        width={containerWidth}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: '0 0',
          transition: HEADER_TRANSITION,
        }}
      >
        <DoubleCurrencyLogo
          currencies={currencies}
          servedLogos={servedLogos}
          data-testid={TestID.PoolDetailsDoubleLogo}
          size={expandedSize}
          orientation={stacked ? 'stacked' : 'split'}
          includeNetwork={includeNetwork}
        />
      </Flex>
    </Flex>
  )
}
