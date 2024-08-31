import { InterfaceEventName, InterfaceModalName } from '@uniswap/analytics-events'
import { Currency, Token } from '@uniswap/sdk-core'
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
import { useLocation } from 'react-router-dom'
import { useActiveSmartPool, useAddPopup, useRemovePopup } from 'state/application/hooks'
import { PopupType } from 'state/application/reducer'
import { useSwapAndLimitContext } from 'state/swap/useSwapContext'
import { useAddUserToken } from 'state/user/hooks'
import { useAllUserAddedTokens } from 'state/user/userAddedTokens'
import { Flex } from 'ui/src'
import { TokenSelectorContent, TokenSelectorVariation } from 'uniswap/src/components/TokenSelector/TokenSelector'
import {
  useCommonTokensOptions,
  useFilterCallbacks,
  usePopularTokensOptions,
  usePortfolioTokenOptions,
  useTokenSectionsForSearchResults,
} from 'uniswap/src/components/TokenSelector/hooks'
import { TokenSelectorFlow } from 'uniswap/src/components/TokenSelector/types'
import { TokenSearchResult } from 'uniswap/src/features/search/SearchResult'
import { useHideSmallBalancesSetting, useHideSpamTokensSetting } from 'uniswap/src/features/settings/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
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
  hideChainSwitch: boolean
  onCurrencySelect: (currency: Currency) => void
  onDismiss: () => void
}

// TODO: we moved filtering by operate pool to currency search modal, check if needed
export function CurrencySearch({ currencyField, hideChainSwitch, onCurrencySelect, onDismiss }: CurrencySearchProps) {
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
  const hideSmallBalances = useHideSmallBalancesSetting()
  const hideSpamBalances = useHideSpamTokensSetting()

  const addPopup = useAddPopup()
  const removePopup = useRemovePopup()

  const selectChain = useSelectChain()
  const { address: smartPoolAddress } = useActiveSmartPool()

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
  const location = useLocation()

  return (
    <Trace
      logImpression
      eventOnTrigger={InterfaceEventName.TOKEN_SELECTOR_OPENED}
      modal={InterfaceModalName.TOKEN_SELECTOR}
    >
      <Flex width="100%" flexGrow={1} flexShrink={1} flexBasis="auto">
        <TokenSelectorContent
          activeAccountAddress={
            currentTab === SwapTab.Swap && location.pathname !== '/mint'
              ? smartPoolAddress ?? undefined
              : account.address!
          }
          isLimits={currentTab === SwapTab.Limit}
          hideChainSwitch={hideChainSwitch}
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
    </Trace>
  )
}
