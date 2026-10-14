import type { PlainMessage } from '@bufbuild/protobuf'
import type { Auction } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { approximateNumberFromRaw } from '~/features/Toucan/Auction/utils/fixedPointFdv'
import type { CurrencyRaisedState } from '~/features/Toucan/Auction/utils/resolveAuctionDisplayState'
import { safeBigInt } from '~/features/Toucan/Auction/utils/safeBigInt'

function hasValidRaisedUsdInputs(inputs: {
  raw: bigint | null
  decimals: number | undefined
  priceUsd: number | undefined
}): inputs is { raw: bigint; decimals: number; priceUsd: number } {
  const { raw, decimals, priceUsd } = inputs
  // ERC-20 decimals are uint8; invalid metadata must not change the scale of the raise.
  return (
    raw !== null &&
    raw > 0n &&
    decimals !== undefined &&
    Number.isInteger(decimals) &&
    decimals >= 0 &&
    decimals <= 255 &&
    priceUsd !== undefined &&
    Number.isFinite(priceUsd) &&
    priceUsd > 0
  )
}

// The checkpoint's currency_raised priced at the auction's currency price — never total bid volume,
// and never a zero placeholder when the amount is unknown.
export function getRaisedUsd({
  auction,
  currencyRaised,
}: {
  auction: PlainMessage<Auction>
  currencyRaised: CurrencyRaisedState
}): number | undefined {
  if (currencyRaised.status !== 'success') {
    return undefined
  }
  const inputs = {
    raw: safeBigInt(currencyRaised.currencyRaised),
    decimals: auction.currencyTokenDecimals,
    priceUsd: auction.currencyPriceUsd !== undefined ? Number(auction.currencyPriceUsd) : undefined,
  }
  if (!hasValidRaisedUsdInputs(inputs)) {
    return undefined
  }
  const { raw, decimals, priceUsd } = inputs
  const usd = approximateNumberFromRaw({ raw, decimals }) * priceUsd
  return Number.isFinite(usd) && usd > 0 ? usd : undefined
}
