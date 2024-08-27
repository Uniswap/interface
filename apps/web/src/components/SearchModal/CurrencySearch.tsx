import { Currency, Token } from '@uniswap/sdk-core'
import { hideSmallBalancesAtom } from 'components/AccountDrawer/SmallBalanceToggle'
import { hideSpamAtom } from 'components/AccountDrawer/SpamToggle'
import {
  recentlySearchedAssetsAtom,
  useAddRecentlySearchedCurrency,
} from 'components/NavBar/SearchBar/RecentlySearchedAssets'
import { useAccount } from 'hooks/useAccount'
import { useActiveLocalCurrency } from 'hooks/useActiveLocalCurrency'
import { useActiveLocale } from 'hooks/useActiveLocale'
import usePrevious from 'hooks/usePrevious'
import useSelectChain from 'hooks/useSelectChain'
import { useAtomValue } from 'jotai/utils'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAddPopup, useRemovePopup } from 'state/application/hooks'
import { PopupType } from 'state/application/reducer'
import { useSwapAndLimitContext } from 'state/swap/useSwapContext'
import { useAddUserToken } from 'state/user/hooks'
import { useAllUserAddedTokens } from 'state/user/userAddedTokens'
import { Flex } from 'ui/src'
import { TokenSelector, TokenSelectorVariation } from 'uniswap/src/components/TokenSelector/TokenSelector'
import {
  useCommonTokensOptions,
  useFilterCallbacks,
  usePopularTokensOptions,
  usePortfolioTokenOptions,
  useTokenSectionsForSearchResults,
} from 'uniswap/src/components/TokenSelector/hooks'
import { TokenSearchResult } from 'uniswap/src/features/search/SearchResult'
import { TokenSelectorFlow } from 'uniswap/src/features/transactions/transfer/types'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { CurrencyField } from 'uniswap/src/types/currency'
import { SwapTab } from 'uniswap/src/types/screens/interface'
import { formatNumberOrString } from 'utilities/src/format/localeBased'
import { NumberType as UtilitiesNumberType } from 'utilities/src/format/types'
import { NumberType, useFormatter } from 'utils/formatNumbers'

export interface CurrencySearchFilters {
  onlyDisplaySmartPools?: boolean
}

interface CurrencySearchProps {
  currencyField: CurrencyField
  onCurrencySelect: (currency: Currency) => void
  onDismiss: () => void
  filters?: CurrencySearchFilters
  operatedPools?: Token[]
}

export function CurrencySearch({ currencyField, onCurrencySelect, onDismiss, filters, operatedPools }: CurrencySearchProps) {
  // TODO: should also include select pool parts.
  const account = useAccount()
  const { chainId, setSelectedChainId, isUserSelectedToken, setIsUserSelectedToken, currentTab, multichainUXEnabled } =
    useSwapAndLimitContext()
  const [filteredChainId, setFilteredChainId] = useState<UniverseChainId | undefined | null>(
    isUserSelectedToken ? chainId : undefined,
  )
  const prevChainId = usePrevious(chainId)
  const { formatNumber } = useFormatter()

  const activeCurrencyCode = useActiveLocalCurrency()
  const activeLocale = useActiveLocale()
  const recentlySearchedAssets = useAtomValue(recentlySearchedAssetsAtom)
  const hideSmallBalances = useAtomValue(hideSmallBalancesAtom)
  const hideSpamBalances = useAtomValue(hideSpamAtom)

  const addPopup = useAddPopup()
  const removePopup = useRemovePopup()

  const selectChain = useSelectChain()

  const searchHistory = useMemo(
    () =>
      recentlySearchedAssets
        .slice(0, 4)
        .filter((value) => (filteredChainId ? value.chainId === filteredChainId : true)),
    [recentlySearchedAssets, filteredChainId],
  )
  const addToken = useAddUserToken()
  const userAddedTokens = useAllUserAddedTokens()
  const addRecentlySearchedCurrency = useAddRecentlySearchedCurrency()

  const handleCurrencySelectTokenSelectorCallback = useCallback(
    async (currency: Currency) => {
      if (!multichainUXEnabled) {
        const correctChain = await selectChain(currency.chainId)
        if (!correctChain) {
          return
        }
      }

      onCurrencySelect(currency)
      setSelectedChainId(currency.chainId)
      setFilteredChainId(currency.chainId)
      setIsUserSelectedToken(true)
      onDismiss()
    },
    [onCurrencySelect, onDismiss, setSelectedChainId, setIsUserSelectedToken, selectChain, multichainUXEnabled],
  )

  useEffect(() => {
    if ((currentTab !== SwapTab.Swap && currentTab !== SwapTab.Send) || !multichainUXEnabled) {
      return
    }
    if (chainId && prevChainId && chainId !== prevChainId) {
      removePopup(`switchNetwork-${prevChainId}`)
      addPopup(
        {
          type: PopupType.SwitchNetwork,
          chainId,
          action: currentTab,
        },
        `switchNetwork-${chainId}`,
        3000,
      )
    }
  }, [currentTab, chainId, prevChainId, multichainUXEnabled, addPopup, removePopup])

  return (
    <Flex width="100%">
      <TokenSelector
        activeAccountAddress={account.address!}
        searchHistory={searchHistory as TokenSearchResult[]}
        valueModifiers={[
          {
            ownerAddress: account.address!,
            includeSmallBalances: !hideSmallBalances,
            includeSpamTokens: !hideSpamBalances,
          },
        ]}
        chainId={!multichainUXEnabled || isUserSelectedToken ? chainId : undefined}
        addToSearchHistoryCallback={addRecentlySearchedCurrency}
        convertFiatAmountFormattedCallback={(fromAmount) =>
          formatNumber({
            input: fromAmount as number,
            type: NumberType.FiatTokenPrice,
          })
        }
        currencyField={currencyField}
        flow={TokenSelectorFlow.Swap}
        formatNumberOrStringCallback={(input) =>
          formatNumberOrString({
            price: input.value,
            currencyCode: activeCurrencyCode,
            locale: activeLocale,
            type: UtilitiesNumberType.TokenNonTx,
          })
        }
        isSurfaceReady={true}
        navigateToBuyOrReceiveWithEmptyWalletCallback={() => null}
        useCommonTokensOptionsHook={useCommonTokensOptions}
        useFavoriteTokensOptionsHook={() => {
          return {
            data: [],
            loading: false,
          }
        }}
        useFilterCallbacksHook={useFilterCallbacks}
        usePopularTokensOptionsHook={usePopularTokensOptions}
        usePortfolioTokenOptionsHook={usePortfolioTokenOptions}
        useTokenSectionsForEmptySearchHook={() => {
          return {
            data: [],
            loading: false,
          }
        }}
        useTokenSectionsForSearchResultsHook={useTokenSectionsForSearchResults}
        useTokenWarningDismissedHook={(currencyId) => {
          if (!currencyId) {
            return {
              tokenWarningDismissed: false,
              dismissWarningCallback: () => null,
            }
          }
          const [chainId, address] = currencyId.split('-')
          // Hardcode 18 decimals because we only check chainId and address
          const token = new Token(parseInt(chainId), address, 18)

          return {
            tokenWarningDismissed: !!userAddedTokens.find(
              (userToken) => userToken.chainId === token.chainId && userToken.address === token.address,
            ),
            dismissWarningCallback: () => addToken(token),
          }
        }}
        variation={
          currencyField === CurrencyField.INPUT
            ? TokenSelectorVariation.BalancesAndPopular
            : TokenSelectorVariation.SuggestedAndFavoritesAndPopular
        }
        onClose={() => {
          setFilteredChainId(null)
          onDismiss()
        }}
        onDismiss={() => null}
        onPressAnimation={() => null}
        onSelectChain={(chainId) => {
          setFilteredChainId(chainId)
        }}
        onSelectCurrency={handleCurrencySelectTokenSelectorCallback}
      />
    </Flex>
  )
}
