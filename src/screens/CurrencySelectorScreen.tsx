import { Currency } from '@uniswap/sdk-core'
import React, { useCallback, useMemo } from 'react'
import { AppStackScreenProp, useAppStackNavigation } from 'src/app/navigation/types'
import { CurrencySelect } from 'src/components/CurrencySelector/CurrencySelect'
import { SheetScreen } from 'src/components/layout/SheetScreen'
import { useActiveChainIds } from 'src/features/chains/utils'
import { useAllBalancesByChainId } from 'src/features/dataApi/balances'
import { useCurrency } from 'src/features/tokens/useCurrency'
import { useAllCurrencies } from 'src/features/tokens/useTokens'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { Screens } from 'src/screens/Screens'
import { buildCurrencyId } from 'src/utils/currencyId'
import { flattenObjectOfObjects } from 'src/utils/objects'

export function CurrencySelectorScreen({
  route: {
    params: {
      otherCurrencyAddress,
      otherCurrencyChainId,
      selectedCurrencyAddress,
      selectedCurrencyChainId,
      onSelectCurrency,
      showNonZeroBalancesOnly,
    },
  },
}: AppStackScreenProp<Screens.CurrencySelector>) {
  const selectedCurrency = useCurrency(
    selectedCurrencyAddress && selectedCurrencyChainId
      ? buildCurrencyId(selectedCurrencyChainId, selectedCurrencyAddress)
      : undefined
  )
  const otherCurrency = useCurrency(
    otherCurrencyAddress && otherCurrencyChainId
      ? buildCurrencyId(otherCurrencyChainId, otherCurrencyAddress)
      : undefined
  )

  return (
    <SheetScreen>
      {showNonZeroBalancesOnly ? (
        <CurrencySearchWithBalancesOnly
          otherCurrency={otherCurrency}
          selectedCurrency={selectedCurrency}
          onSelectCurrency={onSelectCurrency}
        />
      ) : (
        <CurrencySearchAllCurrencies
          otherCurrency={otherCurrency}
          selectedCurrency={selectedCurrency}
          onSelectCurrency={onSelectCurrency}
        />
      )}
    </SheetScreen>
  )
}

// Helper component to avoid loading all currencies
function CurrencySearchWithBalancesOnly({
  selectedCurrency,
  otherCurrency,
  onSelectCurrency,
}: {
  selectedCurrency?: Currency | null
  otherCurrency?: Currency | null
  onSelectCurrency: (currency: Currency) => void
}) {
  const navigation = useAppStackNavigation()
  const chainIds = useActiveChainIds()
  const activeAccount = useActiveAccount()
  const balances = useAllBalancesByChainId(activeAccount?.address, chainIds)
  const currencies = useMemo(
    () => flattenObjectOfObjects(balances.balances).map((b) => b.amount.currency),
    [balances.balances]
  )

  const onSelectCurrencyGoBack = useCallback(
    (currency: Currency) => {
      onSelectCurrency(currency)
      navigation.goBack()
    },
    [navigation, onSelectCurrency]
  )

  return (
    <CurrencySelect
      showNonZeroBalancesOnly
      currencies={currencies}
      otherCurrency={otherCurrency}
      selectedCurrency={selectedCurrency}
      onSelectCurrency={onSelectCurrencyGoBack}
    />
  )
}

// Helper component to avoid loading non-zero balance currencies
function CurrencySearchAllCurrencies({
  selectedCurrency,
  otherCurrency,
  onSelectCurrency,
}: {
  selectedCurrency?: Currency | null
  otherCurrency?: Currency | null
  onSelectCurrency: (currency: Currency) => void
}) {
  const navigation = useAppStackNavigation()
  const currenciesByChain = useAllCurrencies()
  const currencies = useMemo(() => flattenObjectOfObjects(currenciesByChain), [currenciesByChain])

  const onSelectCurrencyGoBack = useCallback(
    (currency: Currency) => {
      onSelectCurrency(currency)
      navigation.goBack()
    },
    [navigation, onSelectCurrency]
  )

  return (
    <CurrencySelect
      currencies={currencies}
      otherCurrency={otherCurrency}
      selectedCurrency={selectedCurrency}
      showNonZeroBalancesOnly={false}
      onSelectCurrency={onSelectCurrencyGoBack}
    />
  )
}
