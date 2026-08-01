import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { useTokenDetailsCrossChainBalances } from 'src/components/TokenDetails/useTokenDetailsCrossChainBalances'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useIsEarnEnabled } from 'uniswap/src/features/earn/hooks/useIsEarnEnabled'
import {
  useTokenDetailsVaultShareData,
  type TokenDetailsVaultShareData,
} from 'uniswap/src/features/earn/hooks/useTokenDetailsVaultShareData'
import { useActiveAccountAddress } from 'wallet/src/features/wallet/hooks'

export function useMobileTokenDetailsVaultShareData(): {
  enabled: boolean
  vaultShareData: TokenDetailsVaultShareData
} {
  const isEarnEnabled = useIsEarnEnabled()
  const { isTestnetModeEnabled } = useEnabledChains()
  const enabled = isEarnEnabled && !isTestnetModeEnabled

  const { currencyId } = useTokenDetailsContext()
  const activeAddress = useActiveAccountAddress() ?? undefined

  const { crossChainTokens } = useTokenDetailsCrossChainBalances({ evmAddress: activeAddress })

  const vaultShareData = useTokenDetailsVaultShareData({
    enabled,
    account: activeAddress,
    activeCurrencyId: currencyId,
    tokenProjectTokens: crossChainTokens,
  })

  return { enabled, vaultShareData }
}
