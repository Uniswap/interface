import { GraphQLApi } from '@universe/api'
import { useCallback, useMemo } from 'react'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { currencyIdToContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { CurrencyId } from 'uniswap/src/types/currency'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'

/** Utility hook to simplify navigating to token details screen */
export function useTokenDetailsNavigation(): {
  preload: (currencyId: CurrencyId) => void
  navigate: (currencyId: CurrencyId) => void
  navigateWithPop: (currencyId: CurrencyId) => void
} {
  const navigation = useAppStackNavigation()
  const [load] = GraphQLApi.useTokenDetailsScreenLazyQuery()

  const preload = useCallback(
    async (currencyId: CurrencyId): Promise<void> => {
      await load({
        variables: currencyIdToContractInput(currencyId),
      })
    },
    [load],
  )

  // the desired behavior is to push the new token details screen onto the stack instead of replacing it
  // however, `push` could create an infinitely deep navigation stack that is hard to get out of
  // for that reason, we first `pop` token details from the stack, and then push it.
  //
  // Use whenever we want to avoid nested token details screens in the nav stack.
  const navigateWithPop = useCallback(
    (currencyId: CurrencyId): void => {
      if (navigation.canGoBack()) {
        navigation.pop()
      }
      navigation.push(MobileScreens.TokenDetails, { currencyId })
    },
    [navigation],
  )

  const navigate = useCallback(
    (currencyId: CurrencyId): void => {
      navigation.navigate(MobileScreens.TokenDetails, { currencyId })
    },
    [navigation],
  )

  return useMemo(() => ({ preload, navigate, navigateWithPop }), [navigate, navigateWithPop, preload])
}
