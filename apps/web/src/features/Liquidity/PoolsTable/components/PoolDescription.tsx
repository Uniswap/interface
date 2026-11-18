import type { HookEntry } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import type { UniverseChainId } from '@universe/chains'
import { Flex, iconSizes } from '@universe/mycelium'
import { getPoolName } from 'uniswap/src/features/pools/names'
import { orderPoolDataByQuoteToken } from 'uniswap/src/features/pools/quoteToken'
import type { FeeData } from 'uniswap/src/features/positions/types'
import type { PoolCategory } from 'uniswap/src/features/tokenCategories/types'
import { DoubleCurrencyLogo } from '~/components/Logo/DoubleLogo'
import { CollapsibleCellLayout } from '~/components/Table/PinnedColumns/collapse/CollapsibleCellLayout'
import { EllipsisText } from '~/components/Table/shared/TableText'
import { tokenStatToCurrency } from '~/data/util'
import { PoolDetailsLine } from '~/features/Liquidity/PoolsTable/components/PoolDetailsLine'
import { getCurrencyWithUnwrap } from '~/features/Liquidity/utils/currency'
import { getProtocolVersionFromLabel } from '~/features/Liquidity/utils/protocolVersion'
import type { PoolStat } from '~/types/explore'

export function PoolDescription({
  token0,
  token1,
  isToken0Quote,
  chainId,
  protocolVersion,
  feeTier,
  currentLpFeePips,
  hookAddress,
  protocolFeePips,
  hookRegistry,
  categoryTag,
}: {
  token0: PoolStat['token0']
  token1: PoolStat['token1']
  isToken0Quote?: boolean
  chainId: UniverseChainId
  protocolVersion?: string
  feeTier?: FeeData
  currentLpFeePips?: number
  hookAddress?: string
  protocolFeePips?: number
  hookRegistry?: Map<string, HookEntry>
  categoryTag?: PoolCategory
}) {
  // Unwrapping is the protocol's call: a v2/v3 wrapped-native leg reads as the native currency, a v4
  // one stays as served (v4 holds native and wrapped native as two distinct currencies).
  const restProtocolVersion = getProtocolVersionFromLabel(protocolVersion)
  const currency0 = getCurrencyWithUnwrap(token0 ? tokenStatToCurrency(token0) : undefined, restProtocolVersion)
  const currency1 = getCurrencyWithUnwrap(token1 ? tokenStatToCurrency(token1) : undefined, restProtocolVersion)
  // The served symbol is the fallback for a leg with no `Currency` to read one off (e.g. Tempo's
  // native placeholder, which `tokenStatToCurrency` can't build).
  const symbol0 = currency0?.symbol ?? token0?.symbol
  const symbol1 = currency1?.symbol ?? token1?.symbol
  const currencies = orderPoolDataByQuoteToken({ token0IsQuote: isToken0Quote, data0: currency0, data1: currency1 })
  const poolName = getPoolName({ symbol0, symbol1, token0IsQuote: isToken0Quote })

  return (
    <CollapsibleCellLayout
      flush
      gapPx={8}
      logo={
        <DoubleCurrencyLogo
          currencies={currencies}
          // The row already carries each leg's served logo, so the pair logo needn't fetch them per token.
          servedLogos={[
            { currency: currency0, logoUrl: token0?.logo },
            { currency: currency1, logoUrl: token1?.logo },
          ]}
          // 32px matches the Explore tokens table's logo, so the two tabs' rows line up.
          size={iconSizes.icon32}
        />
      }
    >
      <Flex gap="$spacing2">
        <EllipsisText>{poolName}</EllipsisText>
        <PoolDetailsLine
          chainId={chainId}
          protocolVersion={protocolVersion}
          feeTier={feeTier}
          currentLpFeePips={currentLpFeePips}
          hookAddress={hookAddress}
          protocolFeePips={protocolFeePips}
          hookRegistry={hookRegistry}
          categoryTag={categoryTag}
        />
      </Flex>
    </CollapsibleCellLayout>
  )
}
