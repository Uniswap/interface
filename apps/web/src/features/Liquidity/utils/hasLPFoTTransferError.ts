import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'

export function hasLPFoTTransferError(
  currencyInfo: Maybe<CurrencyInfo>,
  protocolVersion: ProtocolVersion | undefined,
): CurrencyInfo | undefined {
  const currency = currencyInfo?.currency

  // FoT is only an issue for v3 + v4
  if (!protocolVersion || protocolVersion === ProtocolVersion.V2 || !currency || currency.isNative) {
    return undefined
  }

  return currency.wrapped.buyFeeBps?.gt(0) ||
    (currencyInfo.safetyInfo?.blockaidFees?.buyFeePercent ?? 0) > 0 ||
    currency.wrapped.sellFeeBps?.gt(0) ||
    (currencyInfo.safetyInfo?.blockaidFees?.sellFeePercent ?? 0) > 0
    ? currencyInfo
    : undefined
}
