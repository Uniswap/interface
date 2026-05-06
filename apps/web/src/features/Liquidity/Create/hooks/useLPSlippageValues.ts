import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { CreatePositionResponse } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_pb'
import { Currency } from '@uniswap/sdk-core'
import { DynamicConfigs, LPConfigKey, useDynamicConfigValue } from '@universe/gating'
import { useEffect } from 'react'
import {
  useSetTransactionSettingsAutoSlippageTolerance,
  useTransactionSettingsActions,
} from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'

export function useLPSlippageValue({
  version,
  currencyA,
  currencyB,
}: {
  version?: ProtocolVersion
  currencyA?: Currency
  currencyB?: Currency
}) {
  const defaultSlippage = useDynamicConfigValue({
    config: DynamicConfigs.LPConfig,
    key: LPConfigKey.DefaultSlippage,
    defaultValue: 2.5,
  })
  const v4SlippageOverride = useDynamicConfigValue({
    config: DynamicConfigs.LPConfig,
    key: LPConfigKey.V4SlippageOverride,
    defaultValue: 0.05,
  })
  const isNativePool = currencyA?.isNative || currencyB?.isNative

  if (version === ProtocolVersion.V4 && isNativePool) {
    return v4SlippageOverride
  }

  return defaultSlippage
}

/**
 * When the backend returns a new slippage value for native token pools, apply it as both
 * the custom and auto tolerance. Since we omit slippageTolerance from the request when
 * nativeTokenBalance is provided, the backend always computes the optimal value.
 */
export function useDynamicNativeSlippage({
  nativeTokenBalance,
  createCalldata,
  isSlippageDirty,
}: {
  nativeTokenBalance?: string
  createCalldata?: CreatePositionResponse
  isSlippageDirty: boolean
}): void {
  const { setCustomSlippageTolerance } = useTransactionSettingsActions()
  const setAutoSlippageTolerance = useSetTransactionSettingsAutoSlippageTolerance()

  useEffect(() => {
    if (!createCalldata || !nativeTokenBalance) {
      return
    }
    const responseSlippage = createCalldata.slippage
    if (responseSlippage !== undefined && !isSlippageDirty) {
      const truncatedSlippage = Math.trunc(responseSlippage * 10000) / 10000
      setCustomSlippageTolerance(truncatedSlippage)
      setAutoSlippageTolerance(truncatedSlippage)
    }
  }, [nativeTokenBalance, createCalldata, isSlippageDirty, setCustomSlippageTolerance, setAutoSlippageTolerance])
}
