import { useQueryClient } from '@tanstack/react-query'
import { HistoryDuration } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { GraphQLApi } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useCallback, useMemo } from 'react'
import { useAppStackNavigation } from 'src/app/navigation/types'
import {
  getGetTokenMarketsMultiChainQueryOptions,
  getGetTokenMultiChainQueryOptions,
  getGetTokenQueryOptions,
} from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import {
  currencyIdToContractInput,
  currencyIdToRestContractInput,
} from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { TokenBalancePressOptions } from 'uniswap/src/features/portfolio/TokenBalanceListContext'
import { CurrencyId } from 'uniswap/src/types/currency'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'

/** Utility hook to simplify navigating to token details screen */
export function useTokenDetailsNavigation(): {
  preload: (currencyId: CurrencyId, options?: TokenBalancePressOptions) => void
  navigate: (currencyId: CurrencyId, options?: TokenBalancePressOptions) => void
  navigateWithPop: (currencyId: CurrencyId, options?: TokenBalancePressOptions) => void
} {
  const navigation = useAppStackNavigation()
  const isV2TokensEnabled = useFeatureFlag(FeatureFlags.V2EndpointsTokens)
  const [load] = GraphQLApi.useTokenDetailsScreenLazyQuery()
  const queryClient = useQueryClient()

  // Warms the TDP query, uses multichain by default unless it's a known single-chain asset
  const preload = useCallback(
    async (currencyId: CurrencyId, options?: TokenBalancePressOptions): Promise<void> => {
      if (isV2TokensEnabled) {
        const restTokenIdentifier = currencyIdToRestContractInput(currencyId)
        const isKnownSingleChain = options?.isMultichainAsset === false
        const prefetches = [queryClient.prefetchQuery(getGetTokenQueryOptions({ params: restTokenIdentifier }))]
        if (!isKnownSingleChain) {
          prefetches.push(
            queryClient.prefetchQuery(
              getGetTokenMultiChainQueryOptions({
                params: { identifier: { case: 'token', value: restTokenIdentifier } },
              }),
            ),
            queryClient.prefetchQuery(
              getGetTokenMarketsMultiChainQueryOptions({
                params: {
                  identifier: { case: 'tokens', value: { tokens: [restTokenIdentifier] } },
                  duration: HistoryDuration.DAY,
                },
              }),
            ),
          )
        }
        await Promise.all(prefetches)
        return
      }
      await load({
        variables: currencyIdToContractInput(currencyId),
      })
    },
    [isV2TokensEnabled, load, queryClient],
  )

  // the desired behavior is to push the new token details screen onto the stack instead of replacing it
  // however, `push` could create an infinitely deep navigation stack that is hard to get out of
  // for that reason, we first `pop` token details from the stack, and then push it.
  //
  // Use whenever we want to avoid nested token details screens in the nav stack.
  const navigateWithPop = useCallback(
    (currencyId: CurrencyId, options?: TokenBalancePressOptions): void => {
      if (navigation.canGoBack()) {
        navigation.pop()
      }
      navigation.push(MobileScreens.TokenDetails, { currencyId, isMultichainAsset: options?.isMultichainAsset })
    },
    [navigation],
  )

  const navigate = useCallback(
    (currencyId: CurrencyId, options?: TokenBalancePressOptions): void => {
      navigation.navigate(MobileScreens.TokenDetails, { currencyId, isMultichainAsset: options?.isMultichainAsset })
    },
    [navigation],
  )

  return useMemo(() => ({ preload, navigate, navigateWithPop }), [navigate, navigateWithPop, preload])
}
