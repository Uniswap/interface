import { Currency } from '@uniswap/sdk-core'
import React from 'react'
import { AppStackScreenProp, useAppStackNavigation } from 'src/app/navigation/types'
import { CurrencySearch } from 'src/components/CurrencySelector/CurrencySearch'
import { Screen } from 'src/components/layout/Screen'
import { useAllBalances } from 'src/features/balances/hooks'
import { useActiveChainIds } from 'src/features/chains/utils'
import { useCurrency } from 'src/features/tokens/useCurrency'
import { useAllCurrencies, useAllTokens } from 'src/features/tokens/useTokens'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { Screens } from 'src/screens/Screens'
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
  const selectedCurrency = useCurrency(selectedCurrencyAddress, selectedCurrencyChainId)
  const otherCurrency = useCurrency(otherCurrencyAddress, otherCurrencyChainId)

  return (
    <Screen>
      {showNonZeroBalancesOnly ? (
        <CurrencySearchOwnedCurrencies
          selectedCurrency={selectedCurrency}
          otherCurrency={otherCurrency}
          onSelectCurrency={onSelectCurrency}
        />
      ) : (
        <CurrencySearchAllCurrencies
          selectedCurrency={selectedCurrency}
          otherCurrency={otherCurrency}
          onSelectCurrency={onSelectCurrency}
        />
      )}
    </Screen>
  )
}

// Helper component to avoid loading all currencies
function CurrencySearchOwnedCurrencies({
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
  const tokens = useAllTokens()
  const activeAccount = useActiveAccount()

  // TODO: pass down balances lookup table
  // const balances = useAllBalancesByChainId(chainIds, tokens, activeAccount?.address)

  const currenciesWithBalance = useAllBalances(
    chainIds,
    tokens,
    activeAccount?.address
  ).balances.map((currencyAmount) => currencyAmount.currency)

  return (
    <CurrencySearch
      currencies={currenciesWithBalance}
      selectedCurrency={selectedCurrency}
      otherCurrency={otherCurrency}
      onSelectCurrency={(currency: Currency) => {
        onSelectCurrency(currency)
        navigation.goBack()
      }}
      showNonZeroBalancesOnly={true}
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
  const chainIdToAddressToCurrency = useAllCurrencies()

  const currencies = flattenObjectOfObjects(chainIdToAddressToCurrency)

  return (
    <CurrencySearch
      currencies={currencies}
      selectedCurrency={selectedCurrency}
      otherCurrency={otherCurrency}
      onSelectCurrency={(currency: Currency) => {
        onSelectCurrency(currency)
        navigation.goBack()
      }}
      showNonZeroBalancesOnly={false}
    />
  )
}
