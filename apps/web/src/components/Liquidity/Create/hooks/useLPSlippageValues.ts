import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency } from '@uniswap/sdk-core'
import { DynamicConfigs, LPConfigKey } from 'uniswap/src/features/gating/configs'
import { useDynamicConfigValue } from 'uniswap/src/features/gating/hooks'

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
