import { Platform } from '@universe/chains'
import {
  type TokenDetailsVaultShareData,
  useTokenDetailsVaultShareData as useSharedTokenDetailsVaultShareData,
} from 'uniswap/src/features/earn/hooks/useTokenDetailsVaultShareData'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { useActiveAddress } from '~/connection/accounts/hooks'
import { useTDPMultichainTokensForEarn } from '~/pages/TokenDetails/components/earn/useTDPMultichainTokensForEarn'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'

export type { TokenDetailsVaultShareData }

export function useTokenDetailsVaultShareData({ enabled }: { enabled: boolean }): TokenDetailsVaultShareData {
  const evmAccountAddress = useActiveAddress(Platform.EVM)
  const currency = useTDPStore((s) => s.currency)
  const multichainTokensForEarn = useTDPMultichainTokensForEarn()

  return useSharedTokenDetailsVaultShareData({
    enabled,
    account: evmAccountAddress,
    activeCurrencyId: currency ? currencyId(currency) : undefined,
    tokenProjectTokens: multichainTokensForEarn,
  })
}
