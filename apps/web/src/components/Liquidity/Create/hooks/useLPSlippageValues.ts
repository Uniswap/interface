import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency } from '@uniswap/sdk-core'
import { DynamicConfigs, LPConfigKey, useDynamicConfigValue } from '@universe/gating'

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
