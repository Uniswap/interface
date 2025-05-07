import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency } from '@uniswap/sdk-core'
import { LPConfigKey } from 'uniswap/src/features/gating/configs'

import { DynamicConfigs } from 'uniswap/src/features/gating/configs'
import { useDynamicConfigValue } from 'uniswap/src/features/gating/hooks'

export function useLPSlippageValue(version?: ProtocolVersion, currencyA?: Currency, currencyB?: Currency) {
  const defaultSlippage = useDynamicConfigValue(DynamicConfigs.LPConfig, LPConfigKey.DefaultSlippage, 2.5)
  const v4SlippageOverride = useDynamicConfigValue(DynamicConfigs.LPConfig, LPConfigKey.V4SlippageOverride, 0.05)
  const isNativePool = currencyA?.isNative || currencyB?.isNative

  if (version === ProtocolVersion.V4 && isNativePool) {
    return v4SlippageOverride
  }

  return defaultSlippage
}
