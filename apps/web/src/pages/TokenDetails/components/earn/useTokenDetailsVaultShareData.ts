import {
  type TokenDetailsVaultShareData,
  useTokenDetailsVaultShareData as useSharedTokenDetailsVaultShareData,
} from 'uniswap/src/features/earn/hooks/useTokenDetailsVaultShareData'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { currencyId } from 'uniswap/src/utils/currencyId'
import type { TokenQueryData } from '~/appGraphql/data/Token'
import { useActiveAddress } from '~/features/accounts/store/hooks'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'

export type { TokenDetailsVaultShareData }

export function useTokenDetailsVaultShareData({
  enabled,
  tokenQueryData,
}: {
  enabled: boolean
  tokenQueryData: TokenQueryData | undefined
}): TokenDetailsVaultShareData {
  const evmAccountAddress = useActiveAddress(Platform.EVM)
  const currency = useTDPStore((s) => s.currency)

  return useSharedTokenDetailsVaultShareData({
    enabled,
    account: evmAccountAddress,
    activeCurrencyId: currency ? currencyId(currency) : undefined,
    tokenProjectTokens: tokenQueryData?.project?.tokens,
  })
}
