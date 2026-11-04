import { UniverseChainId } from '@universe/chains'
import { useMemo, useState } from 'react'
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { useCrossChainBalances } from 'uniswap/src/data/apiClients/dataApiService/balances/hooks/useCrossChainBalances'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { CurrencyField } from 'uniswap/src/types/currency'
import { useEvent } from 'utilities/src/react/hooks'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

type NetworkSheetAction = 'sell' | 'send'

interface UseNetworkBalanceSheetParams {
  currencyId: string
  chainId: UniverseChainId
}

interface UseNetworkBalanceSheetResult {
  allChainBalances: PortfolioBalance[]
  hasMultiChainBalances: boolean
  isNetworkSheetOpen: boolean
  openSellSheet: () => void
  openSendSheet: () => void
  onCloseNetworkSheet: () => void
  onSelectNetwork: (balance: PortfolioBalance) => void
}

export function useNetworkBalanceSheet({
  currencyId,
  chainId: requestedChainId,
}: UseNetworkBalanceSheetParams): UseNetworkBalanceSheetResult {
  const activeAddress = useActiveAccountAddressWithThrow()
  const { navigateToSwapFlow, navigateToSend } = useWalletNavigation()
  const { multichainTokens } = useTokenDetailsContext()

  // Cross-chain balances
  const crossChainTokens = useMemo<{ chainId: UniverseChainId; address?: Maybe<string> }[]>(() => {
    return multichainTokens
      .filter(({ chainId }) => toSupportedChainId(chainId) !== requestedChainId)
      .filter((v): v is NonNullable<typeof v> => !!v)
  }, [multichainTokens, requestedChainId])

  const { currentChainBalance: crossChainCurrentBalance, otherChainBalances } = useCrossChainBalances({
    evmAddress: activeAddress,
    currencyId,
    crossChainTokens,
  })

  const allChainBalances = useMemo(() => {
    const others = otherChainBalances ?? []
    return crossChainCurrentBalance ? [crossChainCurrentBalance, ...others] : others
  }, [crossChainCurrentBalance, otherChainBalances])

  const hasMultiChainBalances = allChainBalances.length > 1

  // Sheet state
  const [networkSheetAction, setNetworkSheetAction] = useState<NetworkSheetAction | null>(null)
  const isNetworkSheetOpen = networkSheetAction !== null

  const openSellSheet = useEvent(() => setNetworkSheetAction('sell'))
  const openSendSheet = useEvent(() => setNetworkSheetAction('send'))
  const onCloseNetworkSheet = useEvent(() => setNetworkSheetAction(null))

  const onSelectNetwork = useEvent((balance: PortfolioBalance) => {
    const action = networkSheetAction
    setNetworkSheetAction(null)
    const { currency } = balance.currencyInfo
    const currencyAddress = currency.isToken ? currency.address : getNativeAddress(currency.chainId)

    if (action === 'send') {
      navigateToSend({ currencyAddress, chainId: currency.chainId })
    } else {
      navigateToSwapFlow({
        currencyField: CurrencyField.INPUT,
        currencyAddress,
        currencyChainId: currency.chainId,
      })
    }
  })

  return {
    allChainBalances,
    hasMultiChainBalances,
    isNetworkSheetOpen,
    openSellSheet,
    openSendSheet,
    onCloseNetworkSheet,
    onSelectNetwork,
  }
}
