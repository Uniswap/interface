import { useApolloClient } from '@apollo/client'
import { ReactNavigationPerformanceView } from '@shopify/react-native-performance-navigation'
import React, { memo, useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FadeInDown, FadeOutDown } from 'react-native-reanimated'
import { useSelector } from 'react-redux'
import { AppStackScreenProp } from 'src/app/navigation/types'
import { PriceExplorer } from 'src/components/PriceExplorer/PriceExplorer'
import { BuyNativeTokenModal } from 'src/components/TokenDetails/BuyNativeTokenModal'
import { TokenBalances } from 'src/components/TokenDetails/TokenBalances'
import { TokenDetailsActionButtons } from 'src/components/TokenDetails/TokenDetailsActionButtons'
import { TokenDetailsContextProvider, useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { TokenDetailsHeader } from 'src/components/TokenDetails/TokenDetailsHeader'
import { TokenDetailsLinks } from 'src/components/TokenDetails/TokenDetailsLinks'
import { TokenDetailsStats } from 'src/components/TokenDetails/TokenDetailsStats'
import { useTokenDetailsCurrentChainBalance } from 'src/components/TokenDetails/useTokenDetailsCurrentChainBalance'
import { HeaderScrollScreen } from 'src/components/layout/screens/HeaderScrollScreen'
import { selectModalState } from 'src/features/modals/selectModalState'
import { HeaderRightElement, HeaderTitleElement } from 'src/screens/TokenDetailsHeaders'
import { useIsScreenNavigationReady } from 'src/utils/useIsScreenNavigationReady'
import { Flex, Separator } from 'ui/src'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { useCrossChainBalances } from 'uniswap/src/data/balances/hooks/useCrossChainBalances'
import {
  Chain,
  SafetyLevel,
  useTokenDetailsScreenQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import {
  useTokenBasicInfoPartsFragment,
  useTokenBasicProjectPartsFragment,
} from 'uniswap/src/data/graphql/uniswap-data-api/fragments'
import { GQLQueries } from 'uniswap/src/data/graphql/uniswap-data-api/queries'
import { AssetType } from 'uniswap/src/entities/assets'
import { useBridgingTokenWithHighestBalance } from 'uniswap/src/features/bridging/hooks/tokens'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { TokenList } from 'uniswap/src/features/dataApi/types'
import { currencyIdToContractInput } from 'uniswap/src/features/dataApi/utils'
import { useIsSupportedFiatOnRampCurrency } from 'uniswap/src/features/fiatOnRamp/hooks'
import { useOnChainNativeCurrencyBalance } from 'uniswap/src/features/portfolio/api'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TestnetModeModal } from 'uniswap/src/features/testnets/TestnetModeModal'
import { TokenWarningCard } from 'uniswap/src/features/tokens/TokenWarningCard'
import TokenWarningModal from 'uniswap/src/features/tokens/TokenWarningModal'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { CurrencyField } from 'uniswap/src/types/currency'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { buildCurrencyId, currencyIdToAddress, isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

export function TokenDetailsScreen({ route, navigation }: AppStackScreenProp<MobileScreens.TokenDetails>): JSX.Element {
  const { currencyId } = route.params

  return (
    <TokenDetailsContextProvider currencyId={currencyId} navigation={navigation}>
      <TokenDetailsWrapper />
    </TokenDetailsContextProvider>
  )
}

function TokenDetailsWrapper(): JSX.Element {
  const { chainId, address, currencyId } = useTokenDetailsContext()
  const { data: token } = useTokenBasicInfoPartsFragment({ currencyId })

  const traceProperties = useMemo(
    () => ({
      chain: chainId,
      address,
      currencyName: token?.name,
    }),
    [address, chainId, token?.name],
  )

  return (
    <ReactNavigationPerformanceView interactive screenName={MobileScreens.TokenDetails}>
      <Trace directFromPage logImpression properties={traceProperties} screen={MobileScreens.TokenDetails}>
        <TokenDetailsQuery />
      </Trace>
    </ReactNavigationPerformanceView>
  )
}

const TokenDetailsQuery = memo(function _TokenDetailsQuery(): JSX.Element {
  const { currencyId, setError } = useTokenDetailsContext()

  const { error } = useTokenDetailsScreenQuery({
    variables: { ...currencyIdToContractInput(currencyId) },
    pollInterval: PollingInterval.Normal,
    notifyOnNetworkStatusChange: true,
    returnPartialData: true,
  })

  useEffect(() => setError(error), [error, setError])

  return <TokenDetails />
})

const TokenDetails = memo(function _TokenDetails(): JSX.Element {
  const inModal = useSelector(selectModalState(ModalName.Explore)).isOpen

  const centerElement = useMemo(() => <HeaderTitleElement />, [])
  const rightElement = useMemo(() => <HeaderRightElement />, [])

  return (
    <>
      <HeaderScrollScreen
        showHandleBar={inModal}
        renderedInModal={inModal}
        centerElement={centerElement}
        rightElement={rightElement}
      >
        <Flex gap="$spacing16" pb="$spacing16">
          <Flex gap="$spacing4">
            <TokenDetailsHeader />
            <PriceExplorer />
          </Flex>

          <TokenDetailsErrorCard />

          <Flex gap="$spacing16" mb="$spacing8" px="$spacing16">
            <TokenWarningCardWrapper />

            <TokenBalancesWrapper />

            <Separator />

            <Flex gap="$spacing24">
              <TokenDetailsStats />
              <TokenDetailsLinks />
            </Flex>
          </Flex>
        </Flex>
      </HeaderScrollScreen>

      <TokenDetailsActionButtonsWrapper />

      <TokenDetailsModals />
    </>
  )
})

const TokenDetailsErrorCard = memo(function _TokenDetailsErrorCard(): JSX.Element | null {
  const apolloClient = useApolloClient()
  const { error, setError } = useTokenDetailsContext()

  const onRetry = useCallback(() => {
    setError(undefined)
    apolloClient
      .refetchQueries({ include: [GQLQueries.TokenDetailsScreen, GQLQueries.TokenPriceHistory] })
      .catch((_error) => setError(_error))
  }, [apolloClient, setError])

  return error ? (
    <AnimatedFlex entering={FadeInDown} exiting={FadeOutDown} px="$spacing24">
      <BaseCard.InlineErrorState onRetry={onRetry} />
    </AnimatedFlex>
  ) : null
})

const TokenDetailsModals = memo(function _TokenDetailsModals(): JSX.Element {
  const { t } = useTranslation()
  const { navigateToSwapFlow } = useWalletNavigation()

  const {
    currencyId,
    chainId,
    address,
    activeTransactionType,
    currencyInfo,
    isBuyNativeTokenModalOpen,
    isTokenWarningModalOpen,
    isTestnetWarningModalOpen,
    setActiveTransactionType,
    closeTokenWarningModal,
    closeBuyNativeTokenModal,
    closeTestnetWarningModal,
  } = useTokenDetailsContext()

  const onCloseTokenWarning = useCallback(() => {
    setActiveTransactionType(undefined)
    closeTokenWarningModal()
  }, [closeTokenWarningModal, setActiveTransactionType])

  const onAcknowledgeTokenWarning = useCallback(() => {
    closeTokenWarningModal()
    if (activeTransactionType !== undefined) {
      navigateToSwapFlow({ currencyField: activeTransactionType, currencyAddress: address, currencyChainId: chainId })
    }
  }, [activeTransactionType, address, chainId, closeTokenWarningModal, navigateToSwapFlow])

  return (
    <>
      {isTokenWarningModalOpen && currencyInfo && (
        <TokenWarningModal
          isInfoOnlyWarning
          currencyInfo0={currencyInfo}
          isVisible={isTokenWarningModalOpen}
          closeModalOnly={onCloseTokenWarning}
          onAcknowledge={onAcknowledgeTokenWarning}
        />
      )}

      {isTestnetWarningModalOpen && (
        <TestnetModeModal
          unsupported
          isOpen={isTestnetWarningModalOpen}
          descriptionCopy={t('tdp.noTestnetSupportDescription')}
          onClose={closeTestnetWarningModal}
        />
      )}

      {isBuyNativeTokenModalOpen && (
        <BuyNativeTokenModal chainId={chainId} currencyId={currencyId} onClose={closeBuyNativeTokenModal} />
      )}
    </>
  )
})

const TokenDetailsActionButtonsWrapper = memo(function _TokenDetailsActionButtonsWrapper(): JSX.Element | null {
  const insets = useAppInsets()
  const activeAddress = useActiveAccountAddressWithThrow()
  const { isTestnetModeEnabled } = useEnabledChains()

  const {
    currencyId,
    chainId,
    address,
    currencyInfo,
    openTestnetWarningModal,
    openTokenWarningModal,
    openBuyNativeTokenModal,
    setActiveTransactionType,
    tokenColorLoading,
    navigation,
  } = useTokenDetailsContext()

  const { navigateToFiatOnRamp, navigateToSwapFlow } = useWalletNavigation()

  const project = useTokenBasicProjectPartsFragment({ currencyId }).data?.project

  const safetyLevel = project?.safetyLevel
  const isBlocked = safetyLevel === SafetyLevel.Blocked || currencyInfo?.safetyInfo?.tokenList === TokenList.Blocked

  const isNativeCurrency = isNativeCurrencyAddress(chainId, address)
  const nativeCurrencyAddress = getChainInfo(chainId).nativeCurrency.address

  const { balance: nativeCurrencyBalance } = useOnChainNativeCurrencyBalance(chainId, activeAddress)
  const hasZeroNativeBalance = nativeCurrencyBalance && nativeCurrencyBalance.equalTo('0')

  const nativeFiatOnRampCurrency = useIsSupportedFiatOnRampCurrency(
    buildCurrencyId(chainId, nativeCurrencyAddress),
    isNativeCurrency || !hasZeroNativeBalance,
  )

  const currentChainBalance = useTokenDetailsCurrentChainBalance()

  const hasTokenBalance = Boolean(currentChainBalance)

  const fiatOnRampCurrency = useIsSupportedFiatOnRampCurrency(currencyId, !isNativeCurrency)
  const shouldNavigateToFiatOnRampOnBuy = !hasTokenBalance && Boolean(fiatOnRampCurrency) && isNativeCurrency
  const shouldOpenBuyNativeTokenModalOnBuy =
    Boolean(nativeFiatOnRampCurrency) && !isNativeCurrency && hasZeroNativeBalance

  const bridgingTokenWithHighestBalance = useBridgingTokenWithHighestBalance({
    address: activeAddress,
    currencyAddress: address,
    currencyChainId: chainId,
  })

  const onPressSwap = useCallback(
    (currencyField: CurrencyField) => {
      if (isBlocked) {
        openTokenWarningModal()
        // show warning modal speed bump if token has a warning level and user has not dismissed
      } else if (bridgingTokenWithHighestBalance && currencyField === CurrencyField.OUTPUT) {
        // When clicking "Buy", if the user has a balance in another chain, we pre-populate the input token with that token.
        setActiveTransactionType(undefined)
        navigateToSwapFlow({
          initialState: {
            exactCurrencyField: CurrencyField.INPUT,
            input: {
              address: currencyIdToAddress(bridgingTokenWithHighestBalance.currencyInfo.currencyId),
              chainId: bridgingTokenWithHighestBalance.currencyInfo.currency.chainId,
              type: AssetType.Currency,
            },
            output: {
              address,
              chainId,
              type: AssetType.Currency,
            },
            exactAmountToken: '',
          },
        })
      } else {
        setActiveTransactionType(undefined)
        navigateToSwapFlow({ currencyField, currencyAddress: address, currencyChainId: chainId })
      }
    },
    [
      isBlocked,
      bridgingTokenWithHighestBalance,
      openTokenWarningModal,
      setActiveTransactionType,
      navigateToSwapFlow,
      address,
      chainId,
    ],
  )

  const onPressBuyFiatOnRamp = useCallback((): void => {
    navigateToFiatOnRamp({ prefilledCurrency: fiatOnRampCurrency })
  }, [navigateToFiatOnRamp, fiatOnRampCurrency])

  const onPressBuy = useCallback(() => {
    if (shouldOpenBuyNativeTokenModalOnBuy) {
      openBuyNativeTokenModal()
    } else if (shouldNavigateToFiatOnRampOnBuy) {
      onPressBuyFiatOnRamp()
    } else {
      onPressSwap(CurrencyField.OUTPUT)
    }
  }, [
    shouldOpenBuyNativeTokenModalOnBuy,
    shouldNavigateToFiatOnRampOnBuy,
    openBuyNativeTokenModal,
    onPressBuyFiatOnRamp,
    onPressSwap,
  ])

  const isScreenNavigationReady = useIsScreenNavigationReady({ navigation })

  return isScreenNavigationReady && tokenColorLoading ? null : (
    <AnimatedFlex backgroundColor="$surface1" entering={FadeInDown} style={{ marginBottom: insets.bottom }}>
      <TokenDetailsActionButtons
        userHasBalance={hasTokenBalance}
        onPressBuy={onPressBuy}
        onPressSell={(): void => onPressSwap(CurrencyField.INPUT)}
        onPressSwap={(): void => onPressSwap(CurrencyField.OUTPUT)}
        onPressDisabled={isTestnetModeEnabled ? openTestnetWarningModal : openTokenWarningModal}
      />
    </AnimatedFlex>
  )
})

const TokenBalancesWrapper = memo(function _TokenBalancesWrapper(): JSX.Element | null {
  const activeAddress = useActiveAccountAddressWithThrow()
  const { address, chainId, currencyId, isChainEnabled } = useTokenDetailsContext()
  const { navigateToSend } = useWalletNavigation()

  const projectTokens = useTokenBasicProjectPartsFragment({ currencyId }).data?.project?.tokens

  const crossChainTokens: Array<{
    address: string | null
    chain: Chain
  }> = []

  for (const token of projectTokens ?? []) {
    if (!token || !token.chain || token.address === undefined) {
      continue
    }

    crossChainTokens.push({
      address: token.address,
      chain: token.chain,
    })
  }

  const { currentChainBalance, otherChainBalances } = useCrossChainBalances({
    address: activeAddress,
    currencyId,
    crossChainTokens,
  })

  const onPressSend = useCallback(() => {
    navigateToSend({ currencyAddress: address, chainId })
  }, [address, chainId, navigateToSend])

  return isChainEnabled ? (
    <TokenBalances
      currentChainBalance={currentChainBalance}
      otherChainBalances={otherChainBalances}
      onPressSend={onPressSend}
    />
  ) : null
})

const TokenWarningCardWrapper = memo(function _TokenWarningCardWrapper(): JSX.Element | null {
  const { currencyInfo, openTokenWarningModal } = useTokenDetailsContext()

  return <TokenWarningCard currencyInfo={currencyInfo} onPress={openTokenWarningModal} />
})
