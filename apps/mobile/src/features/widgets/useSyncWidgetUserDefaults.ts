import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import {
  processWidgetEvents,
  setAccountAddressesUserDefaults,
  setChainsUserDefaults,
  setFavoritesUserDefaults,
  setI18NUserDefaults,
} from 'src/features/widgets/widgets'
import { useAppStateTrigger } from 'src/utils/useAppStateTrigger'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { selectFavoriteTokens } from 'uniswap/src/features/favorites/selectors'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { useCurrentLanguageInfo } from 'uniswap/src/features/language/hooks'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { useAccounts, useActiveAccountAddress } from 'wallet/src/features/wallet/hooks'

export function useSyncWidgetUserDefaults(): void {
  const favoriteTokens = useSelector(selectFavoriteTokens)
  const accountsMap = useAccounts()
  const activeAccountAddress = useActiveAccountAddress()
  const { chains } = useEnabledChains({ platform: Platform.EVM })
  const { locale } = useCurrentLanguageInfo()
  const { code } = useAppFiatCurrencyInfo()

  // Refreshes widgets when bringing app to foreground
  useAppStateTrigger({ from: 'background', to: 'active', callback: processWidgetEvents })

  useEffect(() => {
    setFavoritesUserDefaults(favoriteTokens)
  }, [favoriteTokens])

  useEffect(() => {
    setAccountAddressesUserDefaults(Object.values(accountsMap), activeAccountAddress)
  }, [accountsMap, activeAccountAddress])

  useEffect(() => {
    setChainsUserDefaults(chains)
  }, [chains])

  useEffect(() => {
    setI18NUserDefaults({ locale, currency: code })
  }, [code, locale])
}
