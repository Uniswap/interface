import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { Currency } from '@uniswap/sdk-core'
import type { FeeAmount } from '@uniswap/v3-sdk'
import { tryParseV4Tick } from '~/features/Liquidity/utils/priceRangeInfo'
import { tryParseTick } from '~/state/mint/v3/utils'

/** A typed price as a tick, parsed as the pool's protocol stores it: on a v4 pool's spacing, or a v3 fee tier's. */
export function tryParseRangeTick({
  protocolVersion,
  baseToken,
  quoteToken,
  value,
  tickSpacing,
  feeAmount,
}: {
  protocolVersion?: ProtocolVersion
  baseToken?: Maybe<Currency>
  quoteToken?: Maybe<Currency>
  value?: string
  tickSpacing?: number
  feeAmount?: FeeAmount
}): number | undefined {
  return protocolVersion === ProtocolVersion.V4
    ? tryParseV4Tick({ baseToken, quoteToken, value, tickSpacing })
    : tryParseTick({
        baseToken: baseToken?.isToken ? baseToken : undefined,
        quoteToken: quoteToken?.isToken ? quoteToken : undefined,
        value,
        feeAmount,
      })
}
