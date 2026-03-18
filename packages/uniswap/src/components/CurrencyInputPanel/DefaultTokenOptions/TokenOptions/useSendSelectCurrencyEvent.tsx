import { useCallback } from 'react'
import { DEFAULT_NATIVE_ADDRESS_LEGACY } from 'uniswap/src/features/chains/evm/rpc'
import { type CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { type CurrencyField } from 'uniswap/src/types/currency'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

type SelectCurrencyEventProperties = {
  position: number
  suggestion_count: number
  currencyInfo: CurrencyInfo
}

export function useSendSelectCurrencyEvent({
  currencyField,
}: {
  currencyField: CurrencyField
}): (_: SelectCurrencyEventProperties) => void {
  const { page } = useTrace()

  return useCallback(
    ({ position, suggestion_count, currencyInfo }: SelectCurrencyEventProperties): void => {
      sendAnalyticsEvent(UniswapEventName.TokenSelected, {
        name: currencyInfo.currency.name,
        address: currencyInfo.currency.isToken ? currencyInfo.currency.address : DEFAULT_NATIVE_ADDRESS_LEGACY,
        chain: currencyInfo.currency.chainId,
        page,
        field: currencyField,
        position,
        suggestion_count,
        preselect_asset: true,
      })
    },
    [page, currencyField],
  )
}
