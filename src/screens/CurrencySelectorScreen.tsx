import { Currency } from '@uniswap/sdk-core'
import React from 'react'
import { AppStackScreenProp, useAppStackNavigation } from 'src/app/navigation/types'
import { CurrencySelect } from 'src/components/CurrencySelector/CurrencySelect'
import { SheetScreen } from 'src/components/layout/SheetScreen'
import { useAllBalances } from 'src/features/balances/hooks'
import { useActiveChainIds } from 'src/features/chains/utils'
import { useCurrency } from 'src/features/tokens/useCurrency'
import { useAllCurrencies, useAllTokens } from 'src/features/tokens/useTokens'
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
    <CurrencySelect
      showNonZeroBalancesOnly
      currencies={currenciesWithBalance}
      otherCurrency={otherCurrency}
      selectedCurrency={selectedCurrency}
      onSelectCurrency={(currency: Currency) => {
        onSelectCurrency(currency)
        navigation.goBack()
      }}
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
  const currencies = useAllCurrencies()

  return (
    <CurrencySelect
      currencies={flattenObjectOfObjects(currencies)}
      otherCurrency={otherCurrency}
      selectedCurrency={selectedCurrency}
      showNonZeroBalancesOnly={false}
      onSelectCurrency={(currency: Currency) => {
        onSelectCurrency(currency)
        navigation.goBack()
      }}
    />
  )
}
